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
router.use('/admin',          require('./routes/admin'));
router.use('/ai',             require('./routes/ai'));
router.use('/wishlist',       require('./routes/wishlist'));
router.use('/participant',    require('./routes/participant'));
router.use('/referral',       require('./routes/referral'));
router.use('/sponsors',       require('./routes/sponsors'));
router.use('/kol',            require('./routes/kol'));
router.use('/services',       require('./routes/services'));
// Discount codes are event-scoped: /events/:eventId/discounts
router.use('/events/:eventId/discounts', require('./routes/discounts'));
router.use('/push',           require('./routes/push'));

// DB init + engine start (called once when the router is first required)
db.init().catch((err) => console.error('[eventflow] DB init failed:', err.message));
engine.start();

module.exports = router;
