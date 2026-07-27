import { useEffect, useState } from "react";
import type { HealthStatus } from "../types";

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatUptime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
}

const concepts = [
  {
    name: "Worker Threads",
    color: "violet",
    icon: "W",
    description:
      "Run JavaScript in parallel threads within the same process. Workers share memory via SharedArrayBuffer.",
    keyDifferences: [
      "Shares memory with main thread",
      "Lighter than child processes",
      "Same V8 isolate",
      "Best for CPU-intensive tasks",
    ],
  },
  {
    name: "Child Processes",
    color: "emerald",
    icon: "C",
    description:
      "Spawn completely separate OS processes with their own memory space. Communicate via IPC channels.",
    keyDifferences: [
      "Separate memory space",
      "Can run any executable",
      "More isolated / resilient",
      "Heavier than workers",
    ],
  },
  {
    name: "Cluster",
    color: "amber",
    icon: "Cl",
    description:
      "Distribute your HTTP server across multiple CPU cores using a pool of worker processes sharing one port.",
    keyDifferences: [
      "Shares server port automatically",
      "One process per CPU core",
      "Auto-respawns crashed workers",
      "Horizontal scaling for servers",
    ],
  },
];

const comparison = [
  {
    feature: "Memory",
    workerThreads: "Shared (SharedArrayBuffer)",
    childProcess: "Separate (IPC only)",
    cluster: "Separate (IPC only)",
  },
  {
    feature: "Isolation",
    workerThreads: "Same process",
    childProcess: "Full OS isolation",
    cluster: "Full OS isolation",
  },
  {
    feature: "Overhead",
    workerThreads: "Low",
    childProcess: "Medium-High",
    cluster: "Medium",
  },
  {
    feature: "Startup Time",
    workerThreads: "Fast",
    childProcess: "Slower",
    cluster: "Medium",
  },
  {
    feature: "Communication",
    workerThreads: "postMessage + SharedArrayBuffer",
    childProcess: "IPC (send/on message)",
    cluster: "IPC (send/on message)",
  },
  {
    feature: "Crash Impact",
    workerThreads: "Can crash parent",
    childProcess: "Isolated crash",
    cluster: "Worker respawned",
  },
  {
    feature: "Best For",
    workerThreads: "CPU-heavy computation",
    childProcess: "External commands, isolation",
    cluster: "HTTP server scaling",
  },
];

export function OverviewPanel() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
    const id = setInterval(() => {
      fetch("/api/health")
        .then((r) => r.json())
        .then(setHealth)
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-8">
      {/* Server Health */}
      {health && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Server Health
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                PID
              </span>
              <p className="text-lg font-mono text-white">{health.pid}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Uptime
              </span>
              <p className="text-lg font-mono text-white">
                {formatUptime(health.uptime)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Heap Used
              </span>
              <p className="text-lg font-mono text-white">
                {formatBytes(health.memory.heapUsed)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                RSS
              </span>
              <p className="text-lg font-mono text-white">
                {formatBytes(health.memory.rss)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                CPU
              </span>
              <p className="text-lg font-mono text-white">
                {(health.cpuUsage.user / 1000).toFixed(1)}ms
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Concept Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {concepts.map((c) => (
          <div key={c.name} className="card group hover:border-gray-700 transition-colors">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${c.color}-500/10 text-${c.color}-400 font-bold text-sm`}
              >
                {c.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{c.name}</h3>
            </div>
            <p className="mb-4 text-sm text-gray-400 leading-relaxed">
              {c.description}
            </p>
            <ul className="space-y-2">
              {c.keyDifferences.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full bg-${c.color}-400 shrink-0`} />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="card overflow-hidden">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Side-by-Side Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-500 font-medium">
                  Feature
                </th>
                <th className="px-4 py-3 text-left text-violet-400 font-medium">
                  Worker Threads
                </th>
                <th className="px-4 py-3 text-left text-emerald-400 font-medium">
                  Child Process
                </th>
                <th className="px-4 py-3 text-left text-amber-400 font-medium">
                  Cluster
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature} className="border-b border-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-300">
                    {row.feature}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {row.workerThreads}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {row.childProcess}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{row.cluster}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Architecture Overview
        </h2>
        <div className="rounded-xl bg-gray-950 p-6 font-mono text-sm leading-relaxed overflow-x-auto">
          <pre className="text-gray-300">
{`┌─────────────────────────────────────────────────────────────────────────┐
│                          Node.js Process                                │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      Main Thread (Event Loop)                    │   │
│   │   ┌──────────┐   ┌──────────────┐   ┌─────────────────────┐    │   │
│   │   │ Express  │   │   Routes /   │   │  Worker Threads     │    │   │
│   │   │  Server  │──▶│  Middleware   │──▶│  (Same Process,     │    │   │
│   │   │          │   │              │   │   Shared Memory)     │    │   │
│   │   └──────────┘   └──────────────┘   └─────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   ┌──────────────────────┐    ┌──────────────────────┐                  │
│   │   Child Process A    │    │   Child Process B    │                  │
│   │   (Separate Memory)  │    │   (Separate Memory)  │                  │
│   │   fork() / spawn()   │    │   fork() / spawn()   │                  │
│   └──────────────────────┘    └──────────────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        Cluster Mode (Multiple Processes)                 │
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │                    Primary Process (Manager)                   │     │
│   │         Forks workers, monitors health, respawns              │     │
│   └──────────┬──────────┬──────────┬──────────┬──────────────────┘     │
│              │          │          │          │                         │
│   ┌──────────▼┐  ┌──────▼───┐  ┌──▼────────┐ ┌▼───────────────┐     │
│   │  Worker 1 │  │ Worker 2 │  │ Worker 3  │ │  Worker N      │     │
│   │  (Port    │  │ (Port    │  │ (Port     │ │  (Port         │     │
│   │   3001)   │  │  3001)   │  │  3001)    │ │   3001)        │     │
│   └───────────┘  └──────────┘  └───────────┘ └────────────────┘     │
│       ▲             ▲              ▲              ▲                    │
│       └─────────────┴──────────────┴──────────────┘                   │
│                    All share the same port                             │
└─────────────────────────────────────────────────────────────────────────┘`}
          </pre>
        </div>
      </div>
    </div>
  );
}
