import { parentPort, workerData } from "worker_threads";

interface FibonacciTask {
  n: number;
}

function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function heavyComputation(iterations: number): {
  result: number;
  duration: number;
} {
  const start = performance.now();
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.sin(i);
  }
  const duration = performance.now() - start;
  return { result, duration };
}

if (parentPort) {
  const task: FibonacciTask = workerData;
  const startTime = performance.now();

  const fibResult = fibonacci(task.n);
  const computation = heavyComputation(10_000_000);
  const totalTime = performance.now() - startTime;

  parentPort.postMessage({
    taskId: task.n,
    fibonacci: fibResult,
    computation: computation.result,
    computationDuration: Math.round(computation.duration * 100) / 100,
    totalDuration: Math.round(totalTime * 100) / 100,
    pid: process.pid,
    memoryUsage: process.memoryUsage(),
  });
}
