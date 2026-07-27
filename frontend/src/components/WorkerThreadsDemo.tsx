import { useState, useCallback } from "react";
import { useApi, usePolling } from "../hooks/useApi";
import type { WorkerThreadsStatus, ConceptInfo } from "../types";

function formatMs(ms: number) {
  return `${ms.toFixed(1)}ms`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    running: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
    completed: "bg-green-500/10 text-green-400 ring-green-500/20",
    error: "bg-red-500/10 text-red-400 ring-red-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
  };
  return (
    <span
      className={`badge ring-1 ${styles[status] || styles.pending}`}
    >
      {status}
    </span>
  );
}

export function WorkerThreadsDemo() {
  const [fibN, setFibN] = useState(40);
  const [batchInputs, setBatchInputs] = useState("35,36,37,38,39,40");
  const { fetchData, loading: postLoading } = useApi<any>();
  const { data: status } =
    usePolling<WorkerThreadsStatus>("/worker-threads/status", 1500);
  const { data: info } = usePolling<ConceptInfo>("/worker-threads/info", 30000);

  const handleSingleCompute = useCallback(async () => {
    await fetchData("/worker-threads/compute", {
      method: "POST",
      body: JSON.stringify({ n: fibN }),
    });
  }, [fibN, fetchData]);

  const handleBatch = useCallback(async () => {
    const tasks = batchInputs
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    await fetchData("/worker-threads/batch", {
      method: "POST",
      body: JSON.stringify({ tasks }),
    });
  }, [batchInputs, fetchData]);

  return (
    <div className="space-y-6">
      {/* How it works */}
      {info && (
        <div className="card border-violet-500/20">
          <h2 className="mb-3 text-lg font-semibold text-violet-400">
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
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-violet-400 shrink-0" />
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
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-violet-400 shrink-0" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Single Compute */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Single Worker Task
          </h3>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">
              Fibonacci(n) - n value (0-50)
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
            onClick={handleSingleCompute}
            disabled={postLoading}
            className="btn-primary w-full"
          >
            {postLoading ? "Starting..." : `Compute fib(${fibN}) in Worker Thread`}
          </button>
        </div>

        {/* Batch */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Batch Workers (Parallel)
          </h3>
          <div className="mb-4">
            <label className="mb-1 block text-xs text-gray-500">
              Comma-separated n values
            </label>
            <input
              type="text"
              value={batchInputs}
              onChange={(e) => setBatchInputs(e.target.value)}
              className="input-field"
              placeholder="35,36,37,38,39,40"
            />
          </div>
          <button
            onClick={handleBatch}
            disabled={postLoading}
            className="btn-primary w-full"
          >
            {postLoading
              ? "Starting..."
              : `Start ${batchInputs.split(",").length} Workers in Parallel`}
          </button>
        </div>
      </div>

      {/* Stats */}
      {status && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-violet-400">
              {status.stats.totalActive}
            </p>
            <p className="text-xs text-gray-500">Active Tasks</p>
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

      {/* Active Tasks */}
      {status && status.activeTasks.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Active Worker Tasks
          </h3>
          <div className="space-y-2">
            {status.activeTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={task.status} />
                  <span className="text-sm text-gray-300">
                    fib({task.input})
                  </span>
                </div>
                <span className="font-mono text-xs text-gray-500">
                  ID: {task.id.slice(0, 8)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {status && status.completedTasks.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Completed Tasks
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                    Input
                  </th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                    Result
                  </th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                    Duration
                  </th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">
                    Worker PID
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...status.completedTasks].reverse().map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-gray-800/50"
                  >
                    <td className="px-3 py-2">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-300">
                      fib({task.input})
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-400">
                      {task.result?.fibonacci?.toLocaleString() ?? "N/A"}
                    </td>
                    <td className="px-3 py-2 text-gray-400">
                      {task.endTime
                        ? formatMs(task.endTime - task.startTime)
                        : "N/A"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">
                      {task.workerPid ?? "N/A"}
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
