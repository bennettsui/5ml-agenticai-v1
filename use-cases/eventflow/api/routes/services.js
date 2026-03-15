'use strict';

/**
 * EventFlow — Agency Services Routes (P4)
 * Public: service catalog + inquiry submission.
 * Admin: inquiry management in admin.js.
 */

const router = require('express').Router();
const db = require('../db');

// Static service catalog (no DB — edit here to update)
const SERVICES = [
  {
    slug: 'event-management',
    name: 'Full-Service Event Management',
    category: 'management',
    tagline: 'End-to-end planning, coordination & execution',
    description: 'From concept to close, our team handles venue sourcing, vendor coordination, run-of-show, staffing, and post-event wrap-up. Ideal for conferences, product launches, and corporate galas.',
    base_price_hkd: 2000000,
    price_unit: 'event',
    features: [
      'Venue scouting & negotiation',
      'Vendor & supplier management',
      'Run-of-show production',
      'On-site staffing & coordination',
      'Post-event analytics report',
    ],
  },
  {
    slug: 'event-production',
    name: 'Event Production',
    category: 'production',
    tagline: 'AV, staging, lighting & technical excellence',
    description: 'Professional audio-visual production with stage design, lighting rigs, PA systems, LED screens, and broadcast-ready setups for hybrid and in-person events.',
    base_price_hkd: 800000,
    price_unit: 'day',
    features: [
      'Stage & set design',
      'PA & audio engineering',
      'Lighting design & rigging',
      'LED screen walls & displays',
      'Live streaming & recording',
    ],
  },
  {
    slug: 'pr-media',
    name: 'PR & Media Services',
    category: 'pr',
    tagline: 'Media coverage, press releases & influencer outreach',
    description: 'We manage your event\'s media presence — from crafting press releases and pitching to journalists, to coordinating press days and post-event coverage.',
    base_price_hkd: 500000,
    price_unit: 'event',
    features: [
      'Press release writing & distribution',
      'Media list management',
      'Press conference coordination',
      'Influencer/KOL outreach',
      'Post-event coverage report',
    ],
  },
  {
    slug: 'led-sphere',
    name: 'LED Sphere Rental',
    category: 'tech',
    tagline: '360° immersive LED dome for unforgettable experiences',
    description: 'Our 6m diameter 360° LED sphere creates a fully immersive visual experience. Perfect for product launches, brand activations, art installations, and VIP experiences. Includes content playback system and on-site technician.',
    base_price_hkd: 1500000,
    price_unit: 'day',
    features: [
      '6m diameter 360° LED sphere',
      'Resolution: 4K per panel',
      'Custom content loading',
      'On-site AV technician included',
      'Setup & teardown included',
      'Max 30 pax inside simultaneously',
    ],
  },
  {
    slug: 'ai-photo-booth',
    name: 'AI Photo Booth',
    category: 'tech',
    tagline: 'Instant AI-transformed portraits with brand overlays',
    description: 'Our AI photo booth uses real-time generative AI to transform guest portraits into stunning artistic styles — anime, oil painting, cyberpunk, and more. Instant print or digital share. Custom brand frames and backgrounds included.',
    base_price_hkd: 300000,
    price_unit: 'day',
    features: [
      'Real-time AI portrait transformation',
      '10+ art styles (anime, oil, cyberpunk…)',
      'Custom brand frames & overlays',
      'Instant digital share via QR',
      'Optional thermal print station',
      'Unlimited sessions during event',
    ],
  },
];

// GET /api/eventflow/services
router.get('/', (req, res) => {
  res.json({ services: SERVICES });
});

// GET /api/eventflow/services/:slug
router.get('/:slug', (req, res) => {
  const service = SERVICES.find(s => s.slug === req.params.slug);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json({ service });
});

// POST /api/eventflow/services/inquire
router.post('/inquire', async (req, res) => {
  try {
    const { service_slug, contact_name, email, phone, company, event_date, budget_range, notes } = req.body;
    if (!service_slug || !contact_name || !email)
      return res.status(400).json({ error: 'service_slug, contact_name, and email are required' });
    const inquiry = await db.createAgencyInquiry({
      service_slug, contact_name, email, phone, company, event_date, budget_range, notes,
    });
    res.status(201).json({ inquiry, message: 'Enquiry received. Our team will contact you within 1 business day.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
