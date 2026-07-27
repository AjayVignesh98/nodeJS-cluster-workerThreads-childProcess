import { Router, Request, Response } from "express";
import { Worker } from "worker_threads";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../middleware/logger";

export const workerThreadsRouter = Router();

interface WorkerTask {
  id: string;
  status: "pending" | "running" | "completed" | "error";
  input: number;
  result?: any;
  startTime: number;
  endTime?: number;
  workerPid?: number;
}

const activeTasks = new Map<string, WorkerTask>();
const completedTasks: WorkerTask[] = [];
const MAX_HISTORY = 50;

workerThreadsRouter.get("/status", (_req: Request, res: Response) => {
  res.json({
    activeTasks: Array.from(activeTasks.values()),
    completedTasks: completedTasks.slice(-20),
    stats: {
      totalCompleted: completedTasks.length,
      totalActive: activeTasks.size,
      avgDuration:
        completedTasks.length > 0
          ? Math.round(
              completedTasks.reduce(
                (acc, t) => acc + ((t.endTime || 0) - t.startTime),
                0
              ) / completedTasks.length * 100
            ) / 100
          : 0,
    },
  });
});

workerThreadsRouter.post("/compute", (req: Request, res: Response) => {
  const { n = 40 } = req.body;

  if (typeof n !== "number" || n < 0 || n > 50) {
    res.status(400).json({ error: "n must be a number between 0 and 50" });
    return;
  }

  const taskId = uuidv4();
  const task: WorkerTask = {
    id: taskId,
    status: "running",
    input: n,
    startTime: performance.now(),
  };
  activeTasks.set(taskId, task);

  const workerPath = path.join(__dirname, "..", "workers", "fibonacci.worker.js");

  const worker = new Worker(workerPath, {
    workerData: { n },
  });

  task.workerPid = worker.threadId;

  worker.on("message", (result) => {
    task.status = "completed";
    task.result = result;
    task.endTime = performance.now();
    activeTasks.delete(taskId);
    completedTasks.push(task);
    if (completedTasks.length > MAX_HISTORY) completedTasks.shift();
    logger.info(
      `Worker thread completed task ${taskId}: fib(${n}) = ${result.fibonacci}`
    );
  });

  worker.on("error", (err) => {
    task.status = "error";
    task.result = { error: err.message };
    task.endTime = performance.now();
    activeTasks.delete(taskId);
    logger.error(`Worker thread error for task ${taskId}: ${err.message}`);
  });

  worker.on("exit", (code) => {
    if (code !== 0 && task.status !== "error") {
      task.status = "error";
      task.result = { error: `Worker exited with code ${code}` };
      task.endTime = performance.now();
      activeTasks.delete(taskId);
    }
  });

  res.json({ taskId, message: `Worker thread started computing fib(${n})` });
});

workerThreadsRouter.post("/batch", (req: Request, res: Response) => {
  const { tasks = [35, 36, 37, 38, 39, 40] } = req.body;

  if (!Array.isArray(tasks) || tasks.length > 10) {
    res
      .status(400)
      .json({ error: "Provide an array of up to 10 numbers" });
    return;
  }

  const taskIds: string[] = [];

  for (const n of tasks) {
    const taskId = uuidv4();
    taskIds.push(taskId);

    const task: WorkerTask = {
      id: taskId,
      status: "running",
      input: n,
      startTime: performance.now(),
    };
    activeTasks.set(taskId, task);

    const workerPath = path.join(
      __dirname,
      "..",
      "workers",
      "fibonacci.worker.js"
    );
    const worker = new Worker(workerPath, { workerData: { n } });

    worker.on("message", (result) => {
      task.status = "completed";
      task.result = result;
      task.endTime = performance.now();
      activeTasks.delete(taskId);
      completedTasks.push(task);
      if (completedTasks.length > MAX_HISTORY) completedTasks.shift();
    });

    worker.on("error", (err) => {
      task.status = "error";
      task.result = { error: err.message };
      task.endTime = performance.now();
      activeTasks.delete(taskId);
    });
  }

  res.json({
    message: `Started ${tasks.length} worker threads`,
    taskIds,
  });
});

workerThreadsRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    concept: "Worker Threads",
    description:
      "Worker Threads allow running JavaScript in parallel threads using SharedArrayBuffer. Unlike child processes, workers share memory.",
    keyPoints: [
      "Shared memory via SharedArrayBuffer and Atomics",
      "Same V8 isolate - lighter than child processes",
      "Ideal for CPU-intensive tasks that need shared data",
      "Uses postMessage / on('message') for communication",
      "Each worker has its own event loop",
    ],
    useCases: [
      "CPU-intensive computations (crypto, encoding, math)",
      "Image/video processing",
      "Large data transformation",
      "Parallel algorithm execution",
    ],
   vsChildProcess:
      "Workers share memory (SharedArrayBuffer), child processes don't. Workers are lighter but run in the same process context.",
    vsCluster:
      "Workers parallelize work within a process, Cluster parallelizes the entire server across CPU cores.",
    workerCount: require("os").cpus().length,
    nodeVersion: process.version,
  });
});
