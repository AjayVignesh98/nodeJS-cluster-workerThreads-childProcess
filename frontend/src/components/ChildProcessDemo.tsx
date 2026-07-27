import { useState, useCallback } from "react";
import { useApi, usePolling } from "../hooks/useApi";
import type { ChildProcessStatus, ConceptInfo } from "../types";

function formatMs(ms: number) {
  return `${ms.toFixed(1)}ms`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    running: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    completed: "bg-green-500/10 text-green-400 ring-green-500/20",
    error: "bg-red-500/10 text-red-400 ring-red-500/20",
  };
  return (
    <span className={`badge ring-1 ${styles[status] || styles.running}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    fork: "bg-blue-500/10 text-blue-400",
    spawn: "bg-orange-500/10 text-orange-400",
    exec: "bg-pink-500/10 text-pink-400",
  };
  return (
    <span className={`badge ${styles[type] || ""}`}>
      {type}
    </span>
  );
}

export function ChildProcessDemo() {
  const [fibN, setFibN] = useState(38);
  const [shellCmd, setShellCmd] = useState("dir");
  const { fetchData, loading } = useApi<any>();
  const { data: status } = usePolling<ChildProcessStatus>(
    "/child-process/status",
    1500
  );
  const { data: info } = usePolling<ConceptInfo>(
    "/child-process/info",
    30000
  );

  const handleFork = useCallback(async () => {
    await fetchData("/child-process/fork", {
      method: "POST",
      body: JSON.stringify({ n: fibN }),
    });
  }, [fibN, fetchData]);

  const handleSpawn = useCallback(async () => {
    await fetchData("/child-process/spawn", {
      method: "POST",
      body: JSON.stringify({ command: "node", args: ["--version"] }),
    });
  }, [fetchData]);

  const handleExec = useCallback(async () => {
    await fetchData("/child-process/exec", {
      method: "POST",
      body: JSON.stringify({ command: shellCmd }),
    });
  }, [shellCmd, fetchData]);

  const handleSystemInfo = useCallback(async () => {
    await fetchData("/child-process/system-info", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* How it works */}
      {info && (
        <div className="card border-emerald-500/20">
          <h2 className="mb-3 text-lg font-semibold text-emerald-400">
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
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
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
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Fork */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <TypeBadge type="fork" />
            <h3 className="text-sm font-semibold text-white">fork()</h3>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Spawns a new Node.js process with IPC channel
          </p>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-500">
              Fibonacci n
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={fibN}
              onChange={(e) => setFibN(parseInt(e.target.value) || 0)}
              className="input-field"
            />
          </div>
          <button
            onClick={handleFork}
            disabled={loading}
            className="btn-primary w-full text-sm"
          >
            {loading ? "Forking..." : "Fork Compute"}
          </button>
        </div>

        {/* Spawn */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <TypeBadge type="spawn" />
            <h3 className="text-sm font-semibold text-white">spawn()</h3>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Launches any executable with streaming output
          </p>
          <button
            onClick={handleSpawn}
            disabled={loading}
            className="btn-secondary w-full text-sm"
          >
            {loading ? "Spawning..." : "node --version"}
          </button>
        </div>

        {/* Exec */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <TypeBadge type="exec" />
            <h3 className="text-sm font-semibold text-white">exec()</h3>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Runs a shell command, buffers output
          </p>
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-500">
              Shell command
            </label>
            <input
              type="text"
              value={shellCmd}
              onChange={(e) => setShellCmd(e.target.value)}
              className="input-field"
              placeholder="dir, echo hello, etc."
            />
          </div>
          <button
            onClick={handleExec}
            disabled={loading}
            className="btn-secondary w-full text-sm"
          >
            {loading ? "Executing..." : "Run Command"}
          </button>
        </div>

        {/* System Info */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <span className="badge bg-cyan-500/10 text-cyan-400">info</span>
            <h3 className="text-sm font-semibold text-white">System Info</h3>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Fork a child to gather OS system information
          </p>
          <button
            onClick={handleSystemInfo}
            disabled={loading}
            className="btn-secondary w-full text-sm"
          >
            {loading ? "Gathering..." : "Get System Info"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {status && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {status.stats.totalActive}
            </p>
            <p className="text-xs text-gray-500">Active Processes</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-400">
              {status.stats.totalCompleted}
            </p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-400">
              {formatMs(status.stats.avgDuration)}
            </p>
            <p className="text-xs text-gray-500">Avg Duration</p>
          </div>
        </div>
      )}

      {/* Active Processes */}
      {status && status.activeProcesses.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Active Child Processes
          </h3>
          <div className="space-y-2">
            {status.activeProcesses.map((proc) => (
              <div
                key={proc.id}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={proc.status} />
                  <TypeBadge type={proc.type} />
                  <span className="text-sm text-gray-300">
                    PID: {proc.childPid}
                  </span>
                </div>
                <span className="font-mono text-xs text-gray-500">
                  {proc.id.slice(0, 8)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Processes */}
      {status && status.completedProcesses.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Completed Processes
          </h3>
          <div className="space-y-3">
            {[...status.completedProcesses]
              .reverse()
              .slice(0, 10)
              .map((proc) => (
                <div
                  key={proc.id}
                  className="rounded-lg bg-gray-800/30 p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <StatusBadge status={proc.status} />
                    <TypeBadge type={proc.type} />
                    <span className="text-sm text-gray-300">
                      PID: {proc.childPid}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatMs(
                        (proc.endTime || performance.now()) - proc.startTime
                      )}
                    </span>
                  </div>
                  {proc.result && (
                    <div className="mt-2 rounded bg-gray-950 p-3">
                      {proc.result.fibonacci !== undefined && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">fib result: </span>
                            <span className="font-mono text-gray-300">
                              {proc.result.fibonacci?.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">duration: </span>
                            <span className="font-mono text-gray-300">
                              {formatMs(proc.result.totalDuration)}
                            </span>
                          </div>
                        </div>
                      )}
                      {proc.result.stdout !== undefined && (
                        <pre className="max-h-32 overflow-auto text-xs text-gray-400 whitespace-pre-wrap">
                          {proc.result.stdout || "(no output)"}
                          {proc.result.stderr && (
                            <span className="text-red-400">
                              {"\n"}STDERR: {proc.result.stderr}
                            </span>
                          )}
                        </pre>
                      )}
                      {proc.result.systemInfo && (
                        <pre className="max-h-40 overflow-auto text-xs text-gray-400 whitespace-pre-wrap">
                          {JSON.stringify(proc.result.systemInfo, null, 2)}
                        </pre>
                      )}
                      {proc.logs && proc.logs.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Logs:</span>
                          <pre className="mt-1 max-h-20 overflow-auto text-xs text-gray-500">
                            {proc.logs.join("\n")}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
