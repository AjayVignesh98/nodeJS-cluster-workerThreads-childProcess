import { useState, useCallback, useRef, useEffect } from "react";

const API_BASE = "/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async <R = T>(url: string, options?: RequestInit): Promise<R | null> => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        signal: abortRef.current.signal,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }

      const data: R = await res.json();
      setState({ data: data as unknown as T, loading: false, error: null });
      return data;
    } catch (err: any) {
      if (err.name === "AbortError") return null;
      setState((prev) => ({ ...prev, loading: false, error: err.message }));
      throw err;
    }
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { ...state, fetchData };
}

export function usePolling<T>(url: string, intervalMs: number = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    abortRef.current = controller;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}${url}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (active) {
          setData(json);
          setLoading(false);
          setError(null);
        }
      } catch (err: any) {
        if (err.name !== "AbortError" && active) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    poll();
    const id = setInterval(poll, intervalMs);

    return () => {
      active = false;
      clearInterval(id);
      controller.abort();
    };
  }, [url, intervalMs]);

  return { data, loading, error, stop };
}
