/**
 * Scheduler Service
 * Handles scheduled daily scans and weekly digests for intelligence topics
 */

const cron = require('node-cron');

// Store scheduled jobs
const scheduledJobs = new Map();

// Dependencies will be injected
let db = null;
let scanFunction = null;
let digestFunction = null;

/**
 * Initialize the scheduler with dependencies
 */
  db = database;
  scanFunction = scanFn;
  digestFunction = digestFn || null;
}

/**
 * Convert time string (HH:MM) and timezone to cron expression
 * Note: node-cron uses server timezone, so we convert to UTC offset
 */
function timeToCron(time, timezone = 'Asia/Hong_Kong') {
  const [hours, minutes] = time.split(':').map(Number);
  // For now, we'll use the time directly (assumes server is in correct timezone)
  // In production, you'd want to use a timezone-aware cron library
  return `${minutes} ${hours} * * *`;
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
function scheduleDailyScan(topicId, topicName, config) {
  const jobId = `daily-${topicId}`;

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
    return;
  }

  const cronExpression = timeToCron(config.time, config.timezone);
  console.log(`[Scheduler] Scheduling daily scan for "${topicName}" at ${config.time} (${config.timezone}) - cron: ${cronExpression}`);

  const job = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] 🔄 Starting scheduled daily scan for: ${topicName}`);
    try {
      if (scanFunction) {
        await scanFunction(topicId, topicName);
        console.log(`[Scheduler] ✅ Completed daily scan for: ${topicName}`);
      } else {
        console.error('[Scheduler] ❌ Scan function not configured');
      }
    } catch (error) {
      console.error(`[Scheduler] ❌ Daily scan failed for ${topicName}:`, error.message);
    }
  }, {
    scheduled: true,
    timezone: config.timezone || 'Asia/Hong_Kong',
  });

  // Store job with config info for debugging
  scheduledJobs.set(jobId, {
    job,
    config: {
      topicId,
      topicName,
      time: config.time,
      timezone: config.timezone || 'Asia/Hong_Kong',
      cronExpression,
    },
    nextRun: `Daily at ${config.time} (${config.timezone || 'Asia/Hong_Kong'})`,
  });
  console.log(`[Scheduler] ✅ Daily scan scheduled for: ${topicName}`);
}

/**
 * Schedule weekly digest for a topic
 */
function scheduleWeeklyDigest(topicId, topicName, config, digestFunction) {
  const jobId = `weekly-${topicId}`;

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
    return;
  }

  if (!digestFunction) {
    console.error(`[Scheduler] Weekly digest function not configured for: ${topicName}`);
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
  const cronExpression = `${minutes} ${hours} * * ${dayNum}`;

  console.log(`[Scheduler] Scheduling weekly digest for "${topicName}" on ${config.day} at ${config.time} - cron: ${cronExpression}`);

  const job = cron.schedule(cronExpression, async () => {
    console.log(`[Scheduler] 📧 Starting weekly digest for: ${topicName}`);
    try {
      if (digestFunction) {
        await digestFunction(topicId, topicName, config.recipientList);
        console.log(`[Scheduler] ✅ Weekly digest sent for: ${topicName}`);
      }
    } catch (error) {
      console.error(`[Scheduler] ❌ Weekly digest failed for ${topicName}:`, error.message);
    }
  }, {
    scheduled: true,
    timezone: config.timezone || 'Asia/Hong_Kong',
  });

  // Store job with config info for debugging
  scheduledJobs.set(jobId, {
    job,
    config: {
      topicId,
      topicName,
      day: config.day,
      time: config.time || '08:00',
      timezone: config.timezone || 'Asia/Hong_Kong',
      cronExpression,
    },
    nextRun: `Weekly on ${config.day} at ${config.time || '08:00'} (${config.timezone || 'Asia/Hong_Kong'})`,
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
    console.log('[Scheduler] 📥 Loading schedules from database...');
    const topics = await db.getIntelligenceTopics();

    let scheduledCount = 0;
    let weeklyCount = 0;
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
        scheduleDailyScan(topic.topic_id, topic.name, dailyConfig);
        scheduledCount++;
      }

      if (weeklyConfig?.enabled) {
        scheduleWeeklyDigest(topic.topic_id, topic.name, weeklyConfig, digestFunction);
        weeklyCount++;
      }
    }

    console.log(`[Scheduler] ✅ Loaded ${scheduledCount} scheduled scans, ${weeklyCount} weekly digests`);
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
  if (weeklyConfig) {
    scheduleWeeklyDigest(topicId, topicName, weeklyConfig, digestFunction);
  }
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
      running: true,
      config: jobInfo.config || null,
      nextRun: jobInfo.nextRun || 'unknown',
    });
  }
  return status;
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
  console.log('[Scheduler] ⏹️ All scheduled jobs stopped');
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
