import { Router, Request, Response } from "express";
import cluster from "cluster";
import os from "os";

export const clusterRouter = Router();

clusterRouter.get("/status", (_req: Request, res: Response) => {
  res.json({
    isPrimary: cluster.isPrimary,
    isWorker: cluster.isWorker,
    workerId: cluster.worker?.id,
    pid: process.pid,
    numCpus: os.cpus().length,
    cpus: os.cpus().map((cpu) => ({
      model: cpu.model,
      speed: cpu.speed,
      times: cpu.times,
    })),
    platform: process.platform,
    nodeVersion: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

clusterRouter.get("/load-simulation", (_req: Request, res: Response) => {
  const start = performance.now();
  let result = 0;

  for (let i = 0; i < 5_000_000; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }

  const duration = performance.now() - start;

  res.json({
    result,
    duration: Math.round(duration * 100) / 100,
    pid: process.pid,
    workerId: cluster.worker?.id || "primary",
    isPrimary: cluster.isPrimary,
    message:
      "This request was handled by a specific worker process. In cluster mode, multiple workers share the port and distribute incoming connections.",
  });
});

clusterRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    concept: "Cluster Module",
    description:
      "Cluster module allows creating a pool of worker processes that share a single server port, enabling horizontal scaling across CPU cores.",
    keyPoints: [
      "Primary process manages worker processes",
      "Workers share the same server port via round-robin (OS level)",
      "Each worker is a separate Node.js instance with its own event loop",
      "Automatic worker respawn on crash",
      "Uses fork() internally but optimized for server distribution",
      "No shared memory between workers (each has own V8 instance)",
    ],
    useCases: [
      "Scaling HTTP servers across CPU cores",
      "High availability with automatic failover",
      "Load distribution for CPU-bound server tasks",
      "Production deployment optimization",
    ],
    vsWorkerThreads:
      "Cluster is for scaling the entire server across cores. Worker Threads are for parallelizing specific tasks within a single process.",
    vsChildProcess:
      "Cluster uses child processes under the hood but is specifically designed for distributing server load. It manages port sharing automatically.",
    cpuCount: os.cpus().length,
    architecture: os.arch(),
    platform: process.platform,
  });
});
