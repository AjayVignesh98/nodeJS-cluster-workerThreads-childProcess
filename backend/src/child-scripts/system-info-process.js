/**
 * Child process script that simulates a long-running shell task.
 * Outputs progress updates and final result.
 */

const { execSync } = require("child_process");
const os = require("os");

function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    loadAvg: os.loadavg(),
    hostname: os.hostname(),
  };
}

process.on("message", (message) => {
  if (message.type === "system-info") {
    try {
      const info = getSystemInfo();

      let dirListing = [];
      try {
        const output = execSync("dir", { encoding: "utf-8", timeout: 5000 });
        dirListing = output.split("\n").filter((l) => l.trim()).slice(0, 10);
      } catch {
        dirListing = ["Directory listing not available"];
      }

      process.send({
        type: "system-info-result",
        taskId: message.taskId,
        systemInfo: info,
        dirListing,
        pid: process.pid,
        nodeVersion: process.version,
      });
    } catch (err) {
      process.send({
        type: "error",
        taskId: message.taskId,
        error: err.message,
      });
    }
  }
});

process.on("disconnect", () => {
  process.exit(0);
});
