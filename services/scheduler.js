/**
 * Scheduler Service
 * Handles scheduled daily scans and weekly digests for intelligence topics.
 *
 * Scans are queued and processed sequentially to avoid saturating the
 * event loop (which causes node-cron "missed execution" warnings).
 */

const cron = require('node-cron');
const registry = require('./schedule-registry');

const GROUP = 'Topic Intelligence';

// Store scheduled jobs
const scheduledJobs = new Map();

// Dependencies will be injected
let db = null;
let scanFunction = null;

// --- Scan queue: serialises heavy scan work so cron callbacks stay fast ---
const scanQueue = [];
let isProcessingQueue = false;
const runningScans = new Set(); // topic IDs currently being scanned

function enqueueScan(topicId, topicName, type = 'daily') {
  if (runningScans.has(topicId)) {
    console.log(`[Scheduler] Skipping ${type} scan for "${topicName}" - already running`);
    return;
  }
  // Avoid duplicate queue entries
  if (scanQueue.some(item => item.topicId === topicId)) {
    console.log(`[Scheduler] Skipping ${type} scan for "${topicName}" - already queued`);
    return;
  }

  scanQueue.push({ topicId, topicName, type });
  console.log(`[Scheduler] Queued ${type} scan for "${topicName}" (queue depth: ${scanQueue.length})`);
  processQueue();
}

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (scanQueue.length > 0) {
    const { topicId, topicName, type } = scanQueue.shift();

    if (runningScans.has(topicId)) {
      console.log(`[Scheduler] Skipping dequeued scan for "${topicName}" - already running`);
      continue;
    }

    const jobId = `intelligence:${type}-${topicId}`;
    runningScans.add(topicId);
    const startTime = Date.now();
    console.log(`[Scheduler] 🔄 Starting ${type} scan for: ${topicName}`);
    registry.markRunning(jobId);

    try {
      if (scanFunction) {
        await scanFunction(topicId, topicName);
        const elapsed = Date.now() - startTime;
        console.log(`[Scheduler] ✅ Completed ${type} scan for: ${topicName} (${(elapsed / 1000).toFixed(1)}s)`);
        registry.markCompleted(jobId, { result: 'success', durationMs: elapsed });
      } else {
        console.error('[Scheduler] ❌ Scan function not configured');
        registry.markFailed(jobId, 'Scan function not configured');
      }
    } catch (error) {
      console.error(`[Scheduler] ❌ ${type} scan failed for ${topicName}:`, error.message);
      registry.markFailed(jobId, error.message);
    } finally {
      runningScans.delete(topicId);
    }

    // Yield to the event loop between scans so cron ticks aren't delayed
    await new Promise(resolve => setImmediate(resolve));
  }

  isProcessingQueue = false;
}

/**
 * Initialize the scheduler with dependencies
 */
function initialize(database, scanFn) {
  db = database;
  scanFunction = scanFn;
  console.log('[Scheduler] Scheduler initialized');
}

/**
 * Convert time string (HH:MM) and timezone to cron expression.
 * Accepts an optional seconds offset so multiple jobs scheduled at the
 * same minute don't all fire on the exact same tick.
 */
function timeToCron(time, timezone = 'Asia/Hong_Kong', secondsOffset = 0) {
  const [hours, minutes] = time.split(':').map(Number);
  // 6-field cron: second minute hour dayOfMonth month dayOfWeek
  return `${secondsOffset} ${minutes} ${hours} * * *`;
}

/**
 * Convert day name to cron day number (0 = Sunday)
 */
function dayToCronDay(day) {
  const days = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  };
  return days[day.toLowerCase()] ?? 1;
}

/**
 * Schedule daily scan for a topic
 */
function scheduleDailyScan(topicId, topicName, config, staggerIndex = 0) {
  const jobId = `daily-${topicId}`;
  const registryId = `intelligence:daily-${topicId}`;

  // Cancel existing job if any
  if (scheduledJobs.has(jobId)) {
    const existing = scheduledJobs.get(jobId);
    if (existing.job) {
      existing.job.stop();
    } else if (existing.stop) {
      existing.stop(); // backwards compatibility
    }
    scheduledJobs.delete(jobId);
    console.log(`[Scheduler] Cancelled existing daily scan for: ${topicName}`);
  }

  if (!config.enabled) {
    console.log(`[Scheduler] Daily scan disabled for: ${topicName}`);
    registry.register({
      id: registryId,
      group: GROUP,
      name: `Daily Scan: ${topicName}`,
      description: `Scrape sources and analyse articles for "${topicName}"`,
      schedule: 'disabled',
      timezone: config.timezone || 'Asia/Hong_Kong',
      status: 'disabled',
    });
    return;
  }

  // Stagger by 10 seconds per topic so cron callbacks don't all fire on the same tick
  const secondsOffset = (staggerIndex * 10) % 60;
  const cronExpression = timeToCron(config.time, config.timezone, secondsOffset);
  const tz = config.timezone || 'Asia/Hong_Kong';
  console.log(`[Scheduler] Scheduling daily scan for "${topicName}" at ${config.time} (${tz}) - cron: ${cronExpression}`);

  const job = cron.schedule(cronExpression, () => {
    // Lightweight callback: just enqueue, don't await the scan itself
    enqueueScan(topicId, topicName, 'daily');
  }, {
    scheduled: true,
    timezone: tz,
  });

  // Store job with config info for debugging
  scheduledJobs.set(jobId, {
    job,
    config: {
      topicId,
      topicName,
      time: config.time,
      timezone: tz,
      cronExpression,
    },
    nextRun: `Daily at ${config.time} (${tz})`,
  });

  // Register with central registry
  registry.register({
    id: registryId,
    group: GROUP,
    name: `Daily Scan: ${topicName}`,
    description: `Scrape sources and analyse articles for "${topicName}"`,
    schedule: cronExpression,
    timezone: tz,
    status: 'scheduled',
    nextRunAt: `Daily at ${config.time}`,
    meta: { topicId, staggerIndex, cronExpression },
  });

  console.log(`[Scheduler] ✅ Daily scan scheduled for: ${topicName}`);
}

/**
 * Schedule weekly digest for a topic
 */
function scheduleWeeklyDigest(topicId, topicName, config, digestFunction) {
  const jobId = `weekly-${topicId}`;
  const registryId = `intelligence:weekly-${topicId}`;

  // Cancel existing job if any
  if (scheduledJobs.has(jobId)) {
    const existing = scheduledJobs.get(jobId);
    if (existing.job) {
      existing.job.stop();
    } else if (existing.stop) {
      existing.stop();
    }
    scheduledJobs.delete(jobId);
  }

  if (!config.enabled) {
    console.log(`[Scheduler] Weekly digest disabled for: ${topicName}`);
    registry.register({
      id: registryId,
      group: GROUP,
      name: `Weekly Digest: ${topicName}`,
      description: `Send weekly digest email for "${topicName}"`,
      schedule: 'disabled',
      timezone: config.timezone || 'Asia/Hong_Kong',
      status: 'disabled',
    });
    return;
  }

  const dayNum = dayToCronDay(config.day);
  const [hours, minutes] = (config.time || '08:00').split(':').map(Number);
  // 6-field cron with seconds
  const cronExpression = `0 ${minutes} ${hours} * * ${dayNum}`;
  const tz = config.timezone || 'Asia/Hong_Kong';

  console.log(`[Scheduler] Scheduling weekly digest for "${topicName}" on ${config.day} at ${config.time} - cron: ${cronExpression}`);

  const job = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] 📧 Starting weekly digest for: ${topicName}`);
    registry.markRunning(registryId);
    const startTime = Date.now();
    try {
      if (digestFunction) {
        await digestFunction(topicId, topicName, config.recipientList);
        console.log(`[Scheduler] ✅ Weekly digest sent for: ${topicName}`);
        registry.markCompleted(registryId, { result: 'success', durationMs: Date.now() - startTime });
      }
    } catch (error) {
      console.error(`[Scheduler] ❌ Weekly digest failed for ${topicName}:`, error.message);
      registry.markFailed(registryId, error.message);
    }
  }, {
    scheduled: true,
    timezone: tz,
  });

  // Store job with config info for debugging
  scheduledJobs.set(jobId, {
    job,
    config: {
      topicId,
      topicName,
      day: config.day,
      time: config.time || '08:00',
      timezone: tz,
      cronExpression,
    },
    nextRun: `Weekly on ${config.day} at ${config.time || '08:00'} (${tz})`,
  });

  // Register with central registry
  registry.register({
    id: registryId,
    group: GROUP,
    name: `Weekly Digest: ${topicName}`,
    description: `Send weekly digest email for "${topicName}"`,
    schedule: cronExpression,
    timezone: tz,
    status: 'scheduled',
    nextRunAt: `${config.day} at ${config.time || '08:00'}`,
    meta: { topicId, day: config.day, cronExpression },
  });

  console.log(`[Scheduler] ✅ Weekly digest scheduled for: ${topicName}`);
}

/**
 * Load and schedule all topics from database
 */
async function loadAllSchedules() {
  if (!db) {
    console.log('[Scheduler] ⚠️ Database not available, skipping schedule loading');
    return;
  }

  try {
    console.log('[Scheduler] Loading schedules from database...');
    const topics = await db.getIntelligenceTopics();

    let scheduledCount = 0;
    for (const topic of topics) {
      if (topic.status !== 'active') continue;

      // Parse JSON configs if needed
      const dailyConfig = typeof topic.daily_scan_config === 'string'
        ? JSON.parse(topic.daily_scan_config)
        : topic.daily_scan_config;

      const weeklyConfig = typeof topic.weekly_digest_config === 'string'
        ? JSON.parse(topic.weekly_digest_config)
        : topic.weekly_digest_config;

      if (dailyConfig?.enabled) {
        scheduleDailyScan(topic.topic_id, topic.name, dailyConfig, scheduledCount);
        scheduledCount++;
      }

      // Weekly digest scheduling would go here if we had a digest function
    }

    console.log(`[Scheduler] ✅ Loaded ${scheduledCount} scheduled scans`);
  } catch (error) {
    console.error('[Scheduler] ❌ Failed to load schedules:', error.message);
  }
}

/**
 * Update schedule for a specific topic
 */
function updateTopicSchedule(topicId, topicName, dailyConfig, weeklyConfig) {
  if (dailyConfig) {
    scheduleDailyScan(topicId, topicName, dailyConfig);
  }
  // Weekly digest would be updated here
}

/**
 * Remove all schedules for a topic
 */
function removeTopicSchedules(topicId) {
  const dailyId = `daily-${topicId}`;
  const weeklyId = `weekly-${topicId}`;

  if (scheduledJobs.has(dailyId)) {
    const existing = scheduledJobs.get(dailyId);
    if (existing.job) {
      existing.job.stop();
    } else if (existing.stop) {
      existing.stop();
    }
    scheduledJobs.delete(dailyId);
    registry.unregister(`intelligence:daily-${topicId}`);
    console.log(`[Scheduler] Removed daily scan for topic: ${topicId}`);
  }

  if (scheduledJobs.has(weeklyId)) {
    const existing = scheduledJobs.get(weeklyId);
    if (existing.job) {
      existing.job.stop();
    } else if (existing.stop) {
      existing.stop();
    }
    scheduledJobs.delete(weeklyId);
    registry.unregister(`intelligence:weekly-${topicId}`);
    console.log(`[Scheduler] Removed weekly digest for topic: ${topicId}`);
  }
}

/**
 * Get all scheduled jobs status
 */
function getScheduleStatus() {
  const status = [];
  for (const [jobId, jobInfo] of scheduledJobs) {
    status.push({
      id: jobId,
      running: runningScans.has(jobInfo.config?.topicId),
      queued: scanQueue.some(item => item.topicId === jobInfo.config?.topicId),
      config: jobInfo.config || null,
      nextRun: jobInfo.nextRun || 'unknown',
    });
  }
  return {
    jobs: status,
    queueDepth: scanQueue.length,
    activeScans: runningScans.size,
  };
}

/**
 * Stop all scheduled jobs
 */
function stopAll() {
  for (const [jobId, entry] of scheduledJobs) {
    if (entry.job) {
      entry.job.stop();
    } else if (entry.stop) {
      entry.stop();
    }
  }
  scheduledJobs.clear();
  scanQueue.length = 0;
  console.log('[Scheduler] All scheduled jobs stopped');
}

module.exports = {
  initialize,
  loadAllSchedules,
  scheduleDailyScan,
  scheduleWeeklyDigest,
  updateTopicSchedule,
  removeTopicSchedules,
  getScheduleStatus,
  stopAll,
};
