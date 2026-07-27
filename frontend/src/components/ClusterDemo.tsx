import { useState, useCallback } from "react";
import { useApi, usePolling } from "../hooks/useApi";
import type { ClusterStatus, ConceptInfo } from "../types";

function formatMs(ms: number) {
  return `${ms.toFixed(1)}ms`;
}

interface WorkerResult {
  workerPid: number;
  workerId: number;
  result: number;
  duration: number;
  iterations: number;
}

export function ClusterDemo() {
  const [workResults, setWorkResults] = useState<WorkerResult[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const { fetchData, loading } = useApi<any>();
  const { data: clusterStatus } = usePolling<ClusterStatus>(
    "/cluster/status",
    3000
  );
  const { data: info } = usePolling<ConceptInfo>("/cluster/info", 30000);

  const handleLoadSimulation = useCallback(async () => {
    try {
      const result = await fetchData<WorkerResult>("/cluster/load-simulation");
      if (result) {
        setWorkResults((prev) => [result, ...prev].slice(0, 30));
        setRequestCount((c) => c + 1);
      }
    } catch {}
  }, [fetchData]);

  const handleBurstLoad = useCallback(async () => {
    const promises = Array.from({ length: 20 }, () =>
      fetchData<WorkerResult>("/cluster/load-simulation")
    );
    await Promise.allSettled(promises);
    setRequestCount((c) => c + 20);
  }, [fetchData]);

  // Calculate worker distribution
  const workerDistribution = workResults.reduce(
    (acc, r) => {
      const key = `Worker ${r.workerId} (PID: ${r.workerPid})`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const maxCount = Math.max(...Object.values(workerDistribution), 1);

  return (
    <div className="space-y-6">
      {/* How it works */}
      {info && (
        <div className="card border-amber-500/20">
          <h2 className="mb-3 text-lg font-semibold text-amber-400">
            {info.concept}
          </h2>
          <p className="mb-4 text-sm text-gray-400 leading-relaxed">
            {info.description}
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-300">
                Key Points
              </h4>
              <ul className="space-y-1.5">
                {info.keyPoints.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm text-gray-400"
                  >
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-300">
                Use Cases
              </h4>
              <ul className="space-y-1.5">
                {info.useCases.map((u) => (
                  <li
                    key={u}
                    className="flex items-start gap-2 text-sm text-gray-400"
                  >
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* System Info */}
      {clusterStatus && (
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Cluster System Info
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div>
              <span className="text-xs text-gray-500 uppercase">
                CPUs Available
              </span>
              <p className="text-lg font-mono text-amber-400">
                {clusterStatus.numCpus}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">Platform</span>
              <p className="text-lg font-mono text-white">
                {clusterStatus.platform}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">
                Node Version
              </span>
              <p className="text-lg font-mono text-white">
                {clusterStatus.nodeVersion}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">PID</span>
              <p className="text-lg font-mono text-white">
                {clusterStatus.pid}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">
                Process Type
              </span>
              <p className="text-lg font-mono text-white">
                {clusterStatus.isPrimary ? "Primary" : `Worker #${clusterStatus.workerId}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Worker Visual */}
      {clusterStatus && (
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Worker Pool Visualization
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: clusterStatus.numCpus }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center transition-all hover:border-amber-500/40"
              >
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">
                  W{i + 1}
                </div>
                <p className="text-xs text-gray-500">Worker {i + 1}</p>
                <span className="inline-block mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Single Request
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            Sends one CPU-intensive request. Watch which worker handles it.
          </p>
          <button
            onClick={handleLoadSimulation}
            disabled={loading}
            className="btn-primary w-full text-sm"
          >
            {loading ? "Processing..." : "Send Work Request"}
          </button>
        </div>
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Burst Load (20 reqs)
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            Sends 20 concurrent requests to see load distribution across workers.
          </p>
          <button
            onClick={handleBurstLoad}
            disabled={loading}
            className="btn-primary w-full text-sm"
          >
            {loading ? "Processing..." : "Send Burst Load"}
          </button>
        </div>
        <div className="card text-center">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Request Counter
          </h3>
          <p className="text-4xl font-bold text-amber-400">{requestCount}</p>
          <p className="text-xs text-gray-500">total requests sent</p>
        </div>
      </div>

      {/* Load Distribution */}
      {Object.keys(workerDistribution).length > 0 && (
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Load Distribution Across Workers
          </h3>
          <div className="space-y-3">
            {Object.entries(workerDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([worker, count]) => (
                <div key={worker} className="flex items-center gap-4">
                  <span className="w-48 shrink-0 text-sm text-gray-400 font-mono truncate">
                    {worker}
                  </span>
                  <div className="flex-1">
                    <div className="h-4 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500/60 transition-all duration-500"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right text-sm font-mono text-amber-400">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {workResults.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Recent Requests
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                    Worker ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                    Worker PID
                  </th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                    Duration
                  </th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                    Iterations
                  </th>
                </tr>
              </thead>
              <tbody>
                {workResults.slice(0, 15).map((r, idx) => (
                  <tr key={idx} className="border-b border-gray-800/50">
                    <td className="px-3 py-2 font-mono text-gray-300">
                      Worker {r.workerId}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">
                      {r.workerPid}
                    </td>
                    <td className="px-3 py-2 text-gray-400">
                      {formatMs(r.duration)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">
                      {r.iterations.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
