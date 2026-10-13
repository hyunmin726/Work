const fs = require("fs");
const path = require("path");

const WINDOW_DAYS = Number(process.env.DORA_WINDOW_DAYS || 7);
const now = new Date();
const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

async function paginate(request, parameters) {
  const items = [];
  for (let page = 1; page <= 10; page += 1) {
    const response = await request({ ...parameters, per_page: 100, page });
    items.push(...response.data);
    if (response.data.length < 100) break;
  }
  return items;
}

function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * fraction));
  return sorted[index];
}

function hoursBetween(start, end) {
  return Math.max(0, (new Date(end) - new Date(start)) / (60 * 60 * 1000));
}

function round(value) {
  return value === null ? null : Math.round(value * 100) / 100;
}

function inWindow(date) {
  return date && new Date(date) >= windowStart && new Date(date) <= now;
}

async function collect({ github, context, core }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const deployments = await paginate(
    github.rest.repos.listDeployments,
    { owner, repo }
  );

  const deploymentResults = [];
  for (const deployment of deployments) {
    const statuses = await paginate(
      github.rest.repos.listDeploymentStatuses,
      { owner, repo, deployment_id: deployment.id }
    );
    const latest = statuses.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )[0];
    if (!latest || !inWindow(latest.created_at)) continue;

    const result = {
      id: deployment.id,
      sha: deployment.sha,
      environment: deployment.environment,
      state: latest.state,
      timestamp: latest.created_at,
      url: latest.target_url || deployment.url,
    };
    deploymentResults.push(result);
  }

  const successful = deploymentResults
    .filter((deployment) => deployment.state === "success")
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const failed = deploymentResults
    .filter((deployment) =>
      ["failure", "error", "cancelled"].includes(deployment.state)
    )
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const leadTimes = [];
  for (const deployment of successful) {
    try {
      const associated = await github.rest.repos.listPullRequestsAssociatedWithCommit({
        owner,
        repo,
        commit_sha: deployment.sha,
        per_page: 100,
      });
      const merged = associated.data
        .filter((pullRequest) => pullRequest.merged_at)
        .sort((a, b) => new Date(b.merged_at) - new Date(a.merged_at))[0];
      if (merged) {
        leadTimes.push({
          pull_request: merged.number,
          hours: round(hoursBetween(merged.merged_at, deployment.timestamp)),
        });
      }
    } catch (error) {
      core.warning(`Could not resolve PR for deployment ${deployment.id}: ${error.message}`);
    }
  }

  const recoveryTimes = failed
    .map((failure) => {
      const recovery = successful.find(
        (deployment) => new Date(deployment.timestamp) > new Date(failure.timestamp)
      );
      return recovery
        ? round(hoursBetween(failure.timestamp, recovery.timestamp))
        : null;
    })
    .filter((hours) => hours !== null);

  const totalChanges = successful.length + failed.length;
  const metrics = {
    lead_time_hours: round(percentile(leadTimes.map((item) => item.hours), 0.5)),
    deployment_frequency_per_week: round(successful.length * (7 / WINDOW_DAYS)),
    mttr_hours: round(percentile(recoveryTimes, 0.5)),
    change_failure_rate_percent: totalChanges
      ? round((failed.length / totalChanges) * 100)
      : 0,
  };

  const result = {
    generated_at: now.toISOString(),
    repository: `${owner}/${repo}`,
    window: {
      start: windowStart.toISOString(),
      end: now.toISOString(),
      days: WINDOW_DAYS,
    },
    definitions: {
      lead_time: "Median time from merged PR to the first successful deployment containing its commit.",
      deployment_frequency: "Successful deployments, normalized to deployments per week.",
      mttr: "Median time from a failed deployment to the next successful deployment.",
      change_failure_rate: "Failed, errored, or cancelled deployments divided by all terminal deployment outcomes.",
    },
    metrics,
    sample_counts: {
      successful_deployments: successful.length,
      failed_deployments: failed.length,
      lead_time_samples: leadTimes.length,
      mttr_samples: recoveryTimes.length,
    },
    deployments: deploymentResults,
    lead_time_samples: leadTimes,
  };

  const outputDirectory = process.env.DORA_OUTPUT_DIR || "dora-output";
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(outputDirectory, "dora-metrics.json"),
    `${JSON.stringify(result, null, 2)}\n`
  );

  const report = [
    `# DORA weekly report`,
    ``,
    `- Repository: \`${result.repository}\``,
    `- Window: ${result.window.start} to ${result.window.end}`,
    ``,
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Lead time | ${metrics.lead_time_hours ?? "N/A"} hours (median) |`,
    `| Deployment frequency | ${metrics.deployment_frequency_per_week} / week |`,
    `| MTTR | ${metrics.mttr_hours ?? "N/A"} hours (median) |`,
    `| Change failure rate | ${metrics.change_failure_rate_percent}% |`,
    ``,
    `Samples: ${successful.length} successful deployments, ${failed.length} failed deployments, ${leadTimes.length} lead-time samples, ${recoveryTimes.length} MTTR samples.`,
    ``,
    `Metric definitions are recorded in [dora-metrics.json](./dora-metrics.json).`,
    ``,
  ].join("\n");
  fs.writeFileSync(path.join(outputDirectory, "weekly-report.md"), report);
  core.info(`Wrote DORA metrics to ${outputDirectory}`);
}

module.exports = collect;
