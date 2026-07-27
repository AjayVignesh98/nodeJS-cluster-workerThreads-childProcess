export interface HealthStatus {
  status: string;
  pid: number;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}

export interface WorkerTask {
  id: string;
  status: "pending" | "running" | "completed" | "error";
  input: number;
  result?: {
    fibonacci: number;
    computation: number;
    computationDuration: number;
    totalDuration: number;
    pid: number;
    memoryUsage: any;
  };
  startTime: number;
  endTime?: number;
  workerPid?: number;
}

export interface WorkerThreadsStatus {
  activeTasks: WorkerTask[];
  completedTasks: WorkerTask[];
  stats: {
    totalCompleted: number;
    totalActive: number;
    avgDuration: number;
  };
}

export interface ChildProcessTask {
  id: string;
  type: "fork" | "spawn" | "exec";
  status: "running" | "completed" | "error";
  input?: any;
  result?: any;
  startTime: number;
  endTime?: number;
  childPid?: number;
  logs: string[];
}

export interface ChildProcessStatus {
  activeProcesses: ChildProcessTask[];
  completedProcesses: ChildProcessTask[];
  stats: {
    totalCompleted: number;
    totalActive: number;
    avgDuration: number;
  };
}

export interface ConceptInfo {
  concept: string;
  description: string;
  keyPoints: string[];
  useCases: string[];
  vsWorkerThreads?: string;
  vsChildProcess?: string;
  vsCluster?: string;
}

export interface ClusterStatus {
  isPrimary: boolean;
  isWorker: boolean;
  workerId?: number;
  pid: number;
  numCpus: number;
  cpus: Array<{
    model: string;
    speed: number;
    times: any;
  }>;
  platform: string;
  nodeVersion: string;
  uptime: number;
  memory: any;
}
