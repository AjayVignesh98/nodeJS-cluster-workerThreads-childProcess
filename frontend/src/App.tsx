import { useState } from "react";
import { WorkerThreadsDemo } from "./components/WorkerThreadsDemo";
import { ChildProcessDemo } from "./components/ChildProcessDemo";
import { ClusterDemo } from "./components/ClusterDemo";
import { OverviewPanel } from "./components/OverviewPanel";

type Tab = "overview" | "worker-threads" | "child-process" | "cluster";

const tabs: { id: Tab; label: string; color: string }[] = [
  { id: "overview", label: "Overview", color: "text-gray-400" },
  { id: "worker-threads", label: "Worker Threads", color: "text-violet-400" },
  { id: "child-process", label: "Child Process", color: "text-emerald-400" },
  { id: "cluster", label: "Cluster", color: "text-amber-400" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                Node.js Concurrency
              </h1>
              <p className="text-sm text-gray-400">
                Worker Threads &bull; Child Processes &bull; Cluster
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-gray-400">Server Online</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-800 bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? `${tab.color} border-current`
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {activeTab === "overview" && <OverviewPanel />}
        {activeTab === "worker-threads" && <WorkerThreadsDemo />}
        {activeTab === "child-process" && <ChildProcessDemo />}
        {activeTab === "cluster" && <ClusterDemo />}
      </main>
    </div>
  );
}
