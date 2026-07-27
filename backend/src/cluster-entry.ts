import cluster from "cluster";
import os from "os";
import express from "express";
import cors from "cors";
import helmet from "helmet";

const numCPUs = os.cpus().length;
const PORT = parseInt(process.env.PORT || "3001", 10);

if (cluster.isPrimary) {
  console.log(`[Cluster Primary] PID: ${process.pid}`);
  console.log(`[Cluster Primary] Forking ${numCPUs} workers...`);

  const workerStats: Map<
    number,
    { pid: number; requests: number; startTime: number }
  > = new Map();

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workerStats.set(worker.id, {
      pid: worker.process.pid || 0,
      requests: 0,
      startTime: Date.now(),
    });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `[Cluster Primary] Worker ${worker.id} (PID: ${worker.process.pid}) died (code: ${code}, signal: ${signal}). Restarting...`
    );
    workerStats.delete(worker.id);
    const newWorker = cluster.fork();
    workerStats.set(newWorker.id, {
      pid: newWorker.process.pid || 0,
      requests: 0,
      startTime: Date.now(),
    });
  });

  cluster.on("message", (worker, message) => {
    if (message.type === "request-complete") {
      const stats = workerStats.get(worker.id);
      if (stats) stats.requests++;
    }
  });

  // Primary also serves a status endpoint
  const primaryApp = express();
  primaryApp.use(cors());
  primaryApp.use(express.json());

  primaryApp.get("/api/cluster/primary-status", (_req, res) => {
    const workers = Object.values(cluster.workers || {})
      .filter((w): w is NonNullable<typeof w> => w !== undefined)
      .map((w) => ({
        id: w.id,
        pid: w.process.pid,
        alive: w.isConnected(),
        stats: workerStats.get(w.id || 0),
      }));

    res.json({
      primaryPid: process.pid,
      numWorkers: numCPUs,
      workers,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });

  primaryApp.listen(PORT + 1, () => {
    console.log(
      `[Cluster Primary] Status server running on port ${PORT + 1}`
    );
  });
} else {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"] }));
  app.use(express.json());

  app.get("/api/cluster/worker-status", (req, res) => {
    if (process.send) {
      process.send({ type: "request-complete" });
    }

    res.json({
      workerPid: process.pid,
      workerId: cluster.worker?.id,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    });
  });

  // Simulate CPU-intensive work
  app.get("/api/cluster/work", (req, res) => {
    const start = performance.now();
    let result = 0;
    const iterations = 5_000_000;

    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }

    const duration = performance.now() - start;

    if (process.send) {
      process.send({ type: "request-complete" });
    }

    res.json({
      workerPid: process.pid,
      workerId: cluster.worker?.id,
      result,
      duration: Math.round(duration * 100) / 100,
      iterations,
    });
  });

  app.listen(PORT, () => {
    console.log(
      `[Cluster Worker ${cluster.worker?.id}] Running on port ${PORT} (PID: ${process.pid})`
    );
  });
}
