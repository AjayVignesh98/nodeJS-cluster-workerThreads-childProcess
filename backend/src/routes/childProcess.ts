import { Router, Request, Response } from "express";
import { fork, spawn, exec } from "child_process";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../middleware/logger";

export const childProcessRouter = Router();

interface ChildProcessTask {
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

const activeProcesses = new Map<string, ChildProcessTask>();
const completedProcesses: ChildProcessTask[] = [];
const MAX_HISTORY = 50;

childProcessRouter.get("/status", (_req: Request, res: Response) => {
  res.json({
    activeProcesses: Array.from(activeProcesses.values()),
    completedProcesses: completedProcesses.slice(-20),
    stats: {
      totalCompleted: completedProcesses.length,
      totalActive: activeProcesses.size,
      avgDuration:
        completedProcesses.length > 0
          ? Math.round(
              completedProcesses.reduce(
                (acc, t) => acc + ((t.endTime || 0) - t.startTime),
                0
              ) / completedProcesses.length * 100
            ) / 100
          : 0,
    },
  });
});

// Fork - creates a new Node.js process with IPC channel
childProcessRouter.post("/fork", (req: Request, res: Response) => {
  const { n = 38 } = req.body;

  const taskId = uuidv4();
  const scriptPath = path.join(
    __dirname,
    "..",
    "child-scripts",
    "compute-process.js"
  );

  const child = fork(scriptPath, [], {
    stdio: ["pipe", "pipe", "pipe", "ipc"],
    env: { ...process.env, NODE_OPTIONS: "" },
  });

  const task: ChildProcessTask = {
    id: taskId,
    type: "fork",
    status: "running",
    input: { n },
    startTime: performance.now(),
    childPid: child.pid || undefined,
    logs: [],
  };
  activeProcesses.set(taskId, task);

  child.stdout?.on("data", (data: Buffer) => {
    task.logs.push(`[stdout] ${data.toString().trim()}`);
  });

  child.stderr?.on("data", (data: Buffer) => {
    task.logs.push(`[stderr] ${data.toString().trim()}`);
  });

  child.on("message", (message: any) => {
    if (message.type === "result") {
      task.status = "completed";
      task.result = message;
      task.endTime = performance.now();
      activeProcesses.delete(taskId);
      completedProcesses.push(task);
      if (completedProcesses.length > MAX_HISTORY) completedProcesses.shift();
      logger.info(
        `Fork process completed task ${taskId}: fib(${n}) = ${message.fibonacci}`
      );
    }
  });

  child.on("error", (err) => {
    task.status = "error";
    task.result = { error: err.message };
    task.endTime = performance.now();
    activeProcesses.delete(taskId);
    logger.error(`Fork process error for task ${taskId}: ${err.message}`);
  });

  child.on("exit", (code) => {
    if (task.status === "running") {
      task.status = code === 0 ? "completed" : "error";
      task.endTime = performance.now();
      activeProcesses.delete(taskId);
    }
  });

  child.send({ type: "compute", taskId, n });

  res.json({
    taskId,
    childPid: child.pid,
    message: `Forked child process (PID: ${child.pid}) to compute fib(${n})`,
  });
});

// Spawn - creates a new process (non-Node.js or Node.js)
childProcessRouter.post("/spawn", (req: Request, res: Response) => {
  const { command = "node", args: inputArgs = [] } = req.body;

  const taskId = uuidv4();
  const args = ["--version", ...inputArgs];

  const spawned = spawn(command, args, {
    shell: true,
    env: { ...process.env },
  });

  const task: ChildProcessTask = {
    id: taskId,
    type: "spawn",
    status: "running",
    input: { command, args },
    startTime: performance.now(),
    childPid: spawned.pid || undefined,
    logs: [],
  };
  activeProcesses.set(taskId, task);

  let stdout = "";
  let stderr = "";

  spawned.stdout.on("data", (data: Buffer) => {
    const chunk = data.toString();
    stdout += chunk;
    task.logs.push(`[stdout] ${chunk.trim()}`);
  });

  spawned.stderr.on("data", (data: Buffer) => {
    const chunk = data.toString();
    stderr += chunk;
    task.logs.push(`[stderr] ${chunk.trim()}`);
  });

  spawned.on("close", (code) => {
    task.status = code === 0 ? "completed" : "error";
    task.endTime = performance.now();
    task.result = {
      command,
      args,
      exitCode: code,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      pid: spawned.pid,
    };
    activeProcesses.delete(taskId);
    completedProcesses.push(task);
    if (completedProcesses.length > MAX_HISTORY) completedProcesses.shift();
    logger.info(`Spawn process completed task ${taskId} with exit code ${code}`);
  });

  spawned.on("error", (err) => {
    task.status = "error";
    task.result = { error: err.message };
    task.endTime = performance.now();
    activeProcesses.delete(taskId);
    logger.error(`Spawn process error for task ${taskId}: ${err.message}`);
  });

  res.json({
    taskId,
    childPid: spawned.pid,
    message: `Spawned child process (PID: ${spawned.pid}): ${command} ${args.join(" ")}`,
  });
});

// Exec - executes a shell command
childProcessRouter.post("/exec", (req: Request, res: Response) => {
  const { command = "dir" } = req.body;

  const taskId = uuidv4();

  const task: ChildProcessTask = {
    id: taskId,
    type: "exec",
    status: "running",
    input: { command },
    startTime: performance.now(),
    logs: [],
  };
  activeProcesses.set(taskId, task);

  exec(command, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    task.endTime = performance.now();

    if (error) {
      task.status = "error";
      task.result = {
        command,
        error: error.message,
        stdout: stdout?.toString().trim(),
        stderr: stderr?.toString().trim(),
        exitCode: error.code,
      };
    } else {
      task.status = "completed";
      task.result = {
        command,
        stdout: stdout.toString().trim(),
        stderr: stderr.toString().trim(),
        exitCode: 0,
      };
    }

    activeProcesses.delete(taskId);
    completedProcesses.push(task);
    if (completedProcesses.length > MAX_HISTORY) completedProcesses.shift();
    logger.info(`Exec completed task ${taskId}: ${command}`);
  });

  res.json({
    taskId,
    message: `Executing shell command: ${command}`,
  });
});

// System info via fork
childProcessRouter.post("/system-info", (req: Request, res: Response) => {
  const taskId = uuidv4();
  const scriptPath = path.join(
    __dirname,
    "..",
    "child-scripts",
    "system-info-process.js"
  );

  const child = fork(scriptPath, [], {
    stdio: ["pipe", "pipe", "pipe", "ipc"],
  });

  const task: ChildProcessTask = {
    id: taskId,
    type: "fork",
    status: "running",
    input: { type: "system-info" },
    startTime: performance.now(),
    childPid: child.pid || undefined,
    logs: [],
  };
  activeProcesses.set(taskId, task);

  child.on("message", (message: any) => {
    if (message.type === "system-info-result") {
      task.status = "completed";
      task.result = message;
      task.endTime = performance.now();
      activeProcesses.delete(taskId);
      completedProcesses.push(task);
      if (completedProcesses.length > MAX_HISTORY) completedProcesses.shift();
    }
  });

  child.on("error", (err) => {
    task.status = "error";
    task.result = { error: err.message };
    task.endTime = performance.now();
    activeProcesses.delete(taskId);
  });

  child.on("exit", () => {
    if (task.status === "running") {
      task.endTime = performance.now();
      activeProcesses.delete(taskId);
    }
  });

  child.send({ type: "system-info", taskId });

  res.json({
    taskId,
    childPid: child.pid,
    message: `Fetched system info via child process (PID: ${child.pid})`,
  });
});

childProcessRouter.get("/info", (_req: Request, res: Response) => {
  res.json({
    concept: "Child Processes",
    description:
      "Child Processes allow spawning new OS processes that run independently with their own memory space and communicate via IPC.",
    keyPoints: [
      "Three methods: fork(), spawn(), exec()",
      "fork() - specifically for Node.js, creates IPC channel",
      "spawn() - launches any executable, streams output",
      "exec() - runs shell commands, buffers output",
      "Separate memory space - no SharedArrayBuffer",
      "Processes can crash independently without affecting parent",
    ],
    useCases: [
      "Running shell commands from Node.js",
      "Delegating tasks that might crash",
      "Executing external programs/scripts",
      "Background jobs and cron-like tasks",
      "System monitoring and info gathering",
    ],
    vsWorkerThreads:
      "Child processes are heavier (separate memory) but more isolated. Workers share memory but run in the same process.",
    vsCluster:
      "Child processes are general-purpose; Cluster is specifically designed to distribute HTTP server load across cores.",
    availableMethods: ["fork", "spawn", "exec"],
  });
});
