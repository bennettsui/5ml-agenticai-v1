/**
 * Centralized Schedule Registry
 *
 * Every scheduler in the platform (topic-intelligence, ads-performance, etc.)
 * registers its jobs here so there is a single source of truth for what is
 * scheduled, when it runs, and its current state.
 *
 * The registry does NOT own the cron jobs — it is a read-only catalogue that
 * each subsystem pushes updates into.
 */

/** @type {Map<string, RegisteredJob>} */
const jobs = new Map();

/**
 * @typedef {Object} RegisteredJob
 * @property {string}  id          - Unique job ID (e.g. "intelligence:daily-topic-abc123")
 * @property {string}  group       - Subsystem group (e.g. "Topic Intelligence", "Ads Performance")
 * @property {string}  name        - Human-readable name
 * @property {string}  description - What the job does
 * @property {string}  schedule    - Cron expression or human-readable schedule
 * @property {string}  timezone    - IANA timezone
 * @property {'scheduled'|'running'|'completed'|'failed'|'disabled'} status
 * @property {string|null}  lastRunAt   - ISO timestamp of last execution start
 * @property {string|null}  lastResult  - Short description of last run outcome
 * @property {number|null}  lastDurationMs - Duration of last run in ms
 * @property {string|null}  nextRunAt   - Estimated next run (human-readable or ISO)
 * @property {Object}  [meta]      - Arbitrary metadata from the subsystem
 */

/**
 * Register or update a scheduled job.
 * Call this from each subsystem whenever a job is created/updated/completed.
 */
function register(job) {
  if (!job.id) throw new Error('schedule-registry: job.id is required');
  jobs.set(job.id, {
    id: job.id,
    group: job.group || 'Other',
    name: job.name || job.id,
    description: job.description || '',
    schedule: job.schedule || '',
    timezone: job.timezone || 'UTC',
    status: job.status || 'scheduled',
    lastRunAt: job.lastRunAt || null,
    lastResult: job.lastResult || null,
    lastDurationMs: job.lastDurationMs || null,
    nextRunAt: job.nextRunAt || null,
    meta: job.meta || {},
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Remove a job from the registry (e.g. when a topic is deleted).
 */
function unregister(jobId) {
  jobs.delete(jobId);
}

/**
 * Mark a job as currently running.
 */
function markRunning(jobId) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = 'running';
    job.lastRunAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
  }
}

/**
 * Mark a job as completed with optional result info.
 */
function markCompleted(jobId, { result, durationMs } = {}) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = 'scheduled'; // goes back to scheduled for next run
    job.lastResult = result || 'success';
    job.lastDurationMs = durationMs || null;
    job.updatedAt = new Date().toISOString();
  }
}

/**
 * Mark a job as failed.
 */
function markFailed(jobId, errorMessage) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = 'failed';
    job.lastResult = `Error: ${errorMessage}`;
    job.updatedAt = new Date().toISOString();
  }
}

/**
 * Return all registered jobs, optionally filtered by group.
 */
function list(group) {
  const all = Array.from(jobs.values());
  if (group) return all.filter(j => j.group === group);
  return all;
}

/**
 * Return a summary with counts per group and per status.
 */
function summary() {
  const all = Array.from(jobs.values());
  const groups = {};
  const statuses = { scheduled: 0, running: 0, completed: 0, failed: 0, disabled: 0 };

  for (const job of all) {
    groups[job.group] = (groups[job.group] || 0) + 1;
    if (statuses[job.status] !== undefined) statuses[job.status]++;
  }

  return { total: all.length, groups, statuses };
}

module.exports = {
  register,
  unregister,
  markRunning,
  markCompleted,
  markFailed,
  list,
  summary,
};
