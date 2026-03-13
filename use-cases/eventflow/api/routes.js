'use strict';

const router = require('express').Router();
const db     = require('./db');
const engine = require('./notifications/engine');

// Sub-routers
router.use('/organizer',      require('./routes/organizer'));
router.use('/events',         require('./routes/events'));
router.use('/public',         require('./routes/public'));
router.use('/checkin',        require('./routes/checkin'));
router.use('/notifications',  require('./routes/notifications'));

// DB init + engine start (called once when the router is first required)
db.init().catch((err) => console.error('[eventflow] DB init failed:', err.message));
engine.start();

module.exports = router;
