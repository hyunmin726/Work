const fs = require("node:fs");
const { performance } = require("node:perf_hooks");
const { spawnSync } = require("node:child_process");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const outputDirectory = "benchmark-results";
const outputPath = `${outputDirectory}/timing.json`;

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status}`);
  }
}

function removeDependencies() {
  fs.rmSync("node_modules", { recursive: true, force: true });
}

function measureInstall() {
  const startedAt = performance.now();
  run(npmCommand, ["ci"]);
  return (performance.now() - startedAt) / 1000;
}

run(npmCommand, ["cache", "clean", "--force"]);
removeDependencies();
const coldSeconds = measureInstall();
removeDependencies();
const warmSeconds = measureInstall();
const improvementPercent = coldSeconds
  ? ((coldSeconds - warmSeconds) / coldSeconds) * 100
  : 0;

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(
  outputPath,
  `${JSON.stringify({
    node_version: process.version,
    platform: process.platform,
    cold_seconds: Number(coldSeconds.toFixed(3)),
    warm_seconds: Number(warmSeconds.toFixed(3)),
    improvement_percent: Number(improvementPercent.toFixed(2))
  }, null, 2)}\n`
);
console.log(`Cold install: ${coldSeconds.toFixed(3)}s`);
console.log(`Warm install: ${warmSeconds.toFixed(3)}s`);
console.log(`Improvement: ${improvementPercent.toFixed(2)}%`);
