/**
 * Topic Handlers for Topic Intelligence
 * Handles CRUD operations for intelligence topics
 */

// Lazy-load dependencies to avoid circular imports
let db = null;
let scheduler = null;

function getDb() {
  if (!db) {
    try {
      db = require('../../../../db');
    } catch (e) {
      console.warn('[TopicHandlers] Database module not available');
    }
  }
  return db;
}

function getScheduler() {
  if (!scheduler) {
    try {
      scheduler = require('../../../../services/scheduler');
    } catch (e) {
      console.warn('[TopicHandlers] Scheduler service not available');
    }
  }
  return scheduler;
}

// In-memory fallback storage (shared)
const inMemoryTopics = new Map();
const inMemorySources = new Map();

/**
 * POST /topics - Create a new topic
 */
async function createTopic(req, res) {
  try {
    const { topicName, objectives = '', keywords = [], sources: topicSources = [] } = req.body;

    if (!topicName) {
      return res.status(400).json({ success: false, error: 'Topic name is required' });
    }

    let topicId;
    let savedSources = [];
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        const savedTopic = await database.saveIntelligenceTopic(topicName, keywords, { objectives });
        topicId = savedTopic.topic_id;

        if (topicSources.length > 0) {
          savedSources = await database.saveIntelligenceSources(topicId, topicSources);
        }

        console.log(`✅ Created topic in DB: ${topicName} (${topicId}) with ${savedSources.length} sources`);
      } catch (dbError) {
        console.error('Database save failed, using in-memory:', dbError.message);
        topicId = `topic-${Date.now()}`;
        inMemoryTopics.set(topicId, {
          id: topicId,
          name: topicName,
          objectives,
          keywords,
          sources: topicSources,
          status: 'active',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      topicId = `topic-${Date.now()}`;
      const topic = {
        id: topicId,
        name: topicName,
        objectives,
        keywords,
        sources: topicSources,
        status: 'active',
        createdAt: new Date().toISOString(),
        dailyScanConfig: {
          enabled: true,
          time: '06:00',
          timezone: 'Asia/Hong_Kong',
        },
        weeklyDigestConfig: {
          enabled: true,
          day: 'monday',
          time: '08:00',
          timezone: 'Asia/Hong_Kong',
          recipientList: [],
        },
      };

      inMemoryTopics.set(topicId, topic);

      topicSources.forEach(source => {
        inMemorySources.set(source.source_id, { ...source, topicId });
      });

      console.log(`✅ Created topic in-memory: ${topicName} (${topicId}) with ${topicSources.length} sources`);
    }

    res.json({
      success: true,
      topicId,
      message: `Topic "${topicName}" created successfully`,
    });
  } catch (error) {
    console.error('Topic creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /topics - List all topics
 */
async function listTopics(req, res) {
  try {
    let topicList;
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        topicList = await database.getIntelligenceTopics();
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
        topicList = Array.from(inMemoryTopics.values());
      }
    } else {
      topicList = Array.from(inMemoryTopics.values());
    }

    res.json({ success: true, topics: topicList });
  } catch (error) {
    console.error('Error listing topics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * GET /topics/:id - Get a specific topic
 */
async function getTopic(req, res) {
  try {
    let topic;
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        topic = await database.getIntelligenceTopic(req.params.id);
      } catch (dbError) {
        console.error('Database fetch failed:', dbError.message);
        topic = inMemoryTopics.get(req.params.id);
      }
    } else {
      topic = inMemoryTopics.get(req.params.id);
    }

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    res.json({ success: true, topic });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /topics/:id - Update topic settings
 */
async function updateTopic(req, res) {
  try {
    const { id } = req.params;
    const { name, objectives, keywords, dailyScanConfig, weeklyDigestConfig } = req.body;

    let parsedKeywords = keywords;
    if (typeof keywords === 'string') {
      parsedKeywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
    }

    let recipientList = weeklyDigestConfig?.recipientList;
    if (typeof recipientList === 'string') {
      recipientList = recipientList.split(/[,\n]/).map(e => e.trim()).filter(e => e && e.includes('@'));
    }

    const updates = {
      name,
      objectives,
      keywords: parsedKeywords,
      daily_scan_config: dailyScanConfig ? {
        enabled: dailyScanConfig.enabled ?? true,
        time: dailyScanConfig.time || '06:00',
        timezone: dailyScanConfig.timezone || 'Asia/Hong_Kong',
      } : null,
      weekly_digest_config: weeklyDigestConfig ? {
        enabled: weeklyDigestConfig.enabled ?? true,
        day: weeklyDigestConfig.day || 'monday',
        time: weeklyDigestConfig.time || '08:00',
        timezone: weeklyDigestConfig.timezone || 'Asia/Hong_Kong',
        recipientList: recipientList || [],
      } : null,
    };

    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        const topic = await database.updateIntelligenceTopic(id, updates);
        if (topic) {
          const sched = getScheduler();
          if (sched && updates.daily_scan_config) {
            sched.updateTopicSchedule(id, topic.name, updates.daily_scan_config, updates.weekly_digest_config);
            console.log(`[TopicHandlers] Updated scheduler for topic: ${topic.name}`);
          }
          return res.json({ success: true, topic, message: 'Topic updated successfully' });
        }
        return res.status(404).json({ success: false, error: 'Topic not found' });
      } catch (dbError) {
        console.error('Database update failed:', dbError.message);
        return res.status(500).json({ success: false, error: dbError.message });
      }
    }

    const topic = inMemoryTopics.get(id);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }
    Object.assign(topic, updates);
    inMemoryTopics.set(id, topic);
    res.json({ success: true, topic, message: 'Topic updated successfully' });
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * DELETE /topics/:id - Delete a topic
 */
async function deleteTopic(req, res) {
  try {
    const { id } = req.params;

    const sched = getScheduler();
    if (sched) {
      sched.removeTopicSchedules(id);
      console.log(`[TopicHandlers] Removed scheduler for topic: ${id}`);
    }

    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        const topic = await database.deleteIntelligenceTopic(id);
        if (topic) {
          return res.json({ success: true, message: 'Topic deleted successfully' });
        }
        return res.status(404).json({ success: false, error: 'Topic not found' });
      } catch (dbError) {
        console.error('Database delete failed:', dbError.message);
        return res.status(500).json({ success: false, error: dbError.message });
      }
    }

    if (inMemoryTopics.has(id)) {
      inMemoryTopics.delete(id);
      return res.json({ success: true, message: 'Topic deleted successfully' });
    }
    res.status(404).json({ success: false, error: 'Topic not found' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /topics/:id/pause - Pause a topic
 */
async function pauseTopic(req, res) {
  try {
    const sched = getScheduler();
    if (sched) {
      sched.removeTopicSchedules(req.params.id);
      console.log(`[TopicHandlers] Paused scheduler for topic: ${req.params.id}`);
    }

    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        await database.updateIntelligenceTopicStatus(req.params.id, 'paused');
        return res.json({ success: true, message: 'Topic paused' });
      } catch (dbError) {
        console.error('Database update failed:', dbError.message);
      }
    }

    const topic = inMemoryTopics.get(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }
    topic.status = 'paused';
    inMemoryTopics.set(req.params.id, topic);

    res.json({ success: true, message: 'Topic paused' });
  } catch (error) {
    console.error('Error pausing topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /topics/:id/resume - Resume a topic
 */
async function resumeTopic(req, res) {
  try {
    const database = getDb();

    if (database && process.env.DATABASE_URL) {
      try {
        await database.updateIntelligenceTopicStatus(req.params.id, 'active');

        const topic = await database.getIntelligenceTopic(req.params.id);
        if (topic) {
          const sched = getScheduler();
          if (sched) {
            const dailyConfig = typeof topic.daily_scan_config === 'string'
              ? JSON.parse(topic.daily_scan_config)
              : topic.daily_scan_config;
            const weeklyConfig = typeof topic.weekly_digest_config === 'string'
              ? JSON.parse(topic.weekly_digest_config)
              : topic.weekly_digest_config;

            if (dailyConfig?.enabled) {
              sched.updateTopicSchedule(req.params.id, topic.name, dailyConfig, weeklyConfig);
              console.log(`[TopicHandlers] Resumed scheduler for topic: ${topic.name}`);
            }
          }
        }
        return res.json({ success: true, message: 'Topic resumed' });
      } catch (dbError) {
        console.error('Database update failed:', dbError.message);
      }
    }

    const topic = inMemoryTopics.get(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }
    topic.status = 'active';
    inMemoryTopics.set(req.params.id, topic);

    res.json({ success: true, message: 'Topic resumed' });
  } catch (error) {
    console.error('Error resuming topic:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Register routes with router
 */
function registerRoutes(router) {
  router.post('/topics', createTopic);
  router.get('/topics', listTopics);
  router.get('/topics/:id', getTopic);
  router.put('/topics/:id', updateTopic);
  router.delete('/topics/:id', deleteTopic);
  router.put('/topics/:id/pause', pauseTopic);
  router.put('/topics/:id/resume', resumeTopic);
}

module.exports = {
  createTopic,
  listTopics,
  getTopic,
  updateTopic,
  deleteTopic,
  pauseTopic,
  resumeTopic,
  registerRoutes,
  // Export shared storage for other handlers
  inMemoryTopics,
  inMemorySources,
};
