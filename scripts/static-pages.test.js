const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootDirectory = path.resolve(__dirname, "..");
const htmlFiles = [
  "docs/dora-dashboard.html",
  "docs/study-record.html",
  "docs/grade-prediction.html",
  "docs/learning-analysis.html",
];

function assertValidJavaScript(source, filename) {
  new vm.Script(source, { filename });
}

test("DORA metrics collector has valid JavaScript", () => {
  const filename = path.join(rootDirectory, "scripts", "dora-metrics.js");
  assertValidJavaScript(fs.readFileSync(filename, "utf8"), filename);
});

for (const relativePath of htmlFiles) {
  test(`${relativePath} has valid embedded JavaScript`, () => {
    const filename = path.join(rootDirectory, relativePath);
    const html = fs.readFileSync(filename, "utf8");
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];

    assert.ok(scripts.length > 0, `${relativePath} should contain a script block`);
    scripts.forEach(([, source], index) => {
      assertValidJavaScript(source, `${filename}#script-${index + 1}`);
    });
  });
}
