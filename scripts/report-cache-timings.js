const fs = require("node:fs");
const path = require("node:path");

function findTimingFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findTimingFiles(entryPath);
    return entry.name === "timing.json" ? [entryPath] : [];
  });
}

const benchmarkDirectories = fs.readdirSync(".", { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("benchmark-"))
  .map((entry) => entry.name);
const files = benchmarkDirectories.flatMap(findTimingFiles);
if (!files.length) throw new Error("No cache benchmark results were found.");

const results = files.map((file) => ({
  source: path.dirname(file),
  ...JSON.parse(fs.readFileSync(file, "utf8"))
}));
const average = (field) => results.reduce((sum, result) => sum + result[field], 0) / results.length;
const averageCold = average("cold_seconds");
const averageWarm = average("warm_seconds");
const averageImprovement = average("improvement_percent");
const averageDirection = averageImprovement >= 0 ? "faster" : "slower";

const rows = results
  .sort((a, b) => a.source.localeCompare(b.source))
  .map((result) =>
    `| ${result.source} | ${result.cold_seconds.toFixed(3)}s | ${result.warm_seconds.toFixed(3)}s | ${result.improvement_percent.toFixed(2)}% |`
  );
const report = [
  "## Cache performance",
  "",
  `Measured ${results.length} matrix combinations by comparing a cold npm install with a warm install after the npm cache was populated.`,
  "",
  "| Matrix artifact | Cold install | Warm install | Improvement |",
  "| --- | ---: | ---: | ---: |",
  ...rows,
  "",
  `**Average:** ${averageCold.toFixed(3)}s → ${averageWarm.toFixed(3)}s (**${Math.abs(averageImprovement).toFixed(2)}% ${averageDirection}**)`
].join("\n");

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
}
