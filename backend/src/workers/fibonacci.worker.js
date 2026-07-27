const { parentPort } = require("worker_threads");

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

if (parentPort) {
  const task = require("worker_threads").workerData;
  const startTime = Date.now();

  const fibResult = fibonacci(task.n);
  const computation = heavyComputation(10_000_000);
  const totalTime = Date.now() - startTime;

  parentPort.postMessage({
    taskId: task.n,
    fibonacci: fibResult,
    computation: computation.result,
    computationDuration: computation.duration,
    totalDuration: totalTime,
    pid: process.pid,
    memoryUsage: process.memoryUsage(),
  });
}
