import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { workerThreadsRouter } from "./routes/workerThreads";
import { childProcessRouter } from "./routes/childProcess";
import { clusterRouter } from "./routes/cluster";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"] }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
  });
});

app.use("/api/worker-threads", workerThreadsRouter);
app.use("/api/child-process", childProcessRouter);
app.use("/api/cluster", clusterRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} with PID ${process.pid}`);
});

export default app;
