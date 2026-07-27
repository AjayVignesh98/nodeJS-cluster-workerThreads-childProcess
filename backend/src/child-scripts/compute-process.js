/**
 * Child process script for heavy computations.
 * Receives tasks via IPC (process.send) and sends results back.
 */

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function heavyComputation(iterations) {
  const start = Date.now();
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  return { result, duration: Date.now() - start };
}

process.on("message", (message) => {
  if (message.type === "compute") {
    const { taskId, n } = message;
    const startTime = Date.now();

    try {
      const fibResult = fibonacci(n);
      const computation = heavyComputation(10_000_000);
      const totalTime = Date.now() - startTime;

      process.send({
        type: "result",
        taskId,
        fibonacci: fibResult,
        computation: computation.result,
        computationDuration: computation.duration,
        totalDuration: totalTime,
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
      });
    } catch (err) {
      process.send({
        type: "error",
        taskId,
        error: err.message,
      });
    }
  }

  if (message.type === "ping") {
    process.send({ type: "pong", pid: process.pid });
  }
});

process.on("disconnect", () => {
  process.exit(0);
});
