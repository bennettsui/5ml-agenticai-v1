'use strict';

/**
 * EventFlow — AI Assistant Routes
 * Organizer-only endpoints for AI-powered content generation.
 * Uses DeepSeek Reasoner (primary) → Anthropic Claude (fallback).
 */

const router = require('express').Router();
const { requireAuth } = require('../auth');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

const EVENT_CATEGORIES = [
  'Conference', 'Workshop', 'Networking', 'Concert', 'Exhibition',
  'Seminar', 'Hackathon', 'Charity', 'Sports', 'Community', 'Other',
];

// ─── Helper: call AI ──────────────────────────────────────────────────────────

async function callAI(systemPrompt, userPrompt, maxTokens = 600) {
  // Try DeepSeek first
  if (DEEPSEEK_KEY) {
    const axios = require('axios');
    const res = await axios.post(DEEPSEEK_URL,
      { model: 'deepseek-chat', messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ], max_tokens: maxTokens, temperature: 0.8 },
      { headers: { Authorization: `Bearer ${DEEPSEEK_KEY}`, 'Content-Type': 'application/json' } }
    );
    return res.data.choices[0]?.message?.content?.trim() || '';
  }
  // Fallback: Anthropic Claude Haiku
  if (ANTHROPIC_KEY) {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: ANTHROPIC_KEY });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return msg.content[0]?.text?.trim() || '';
  }
  throw new Error('No AI provider configured (DEEPSEEK_API_KEY or ANTHROPIC_API_KEY required)');
}

// ─── POST /api/eventflow/ai/describe ─────────────────────────────────────────
// Generate event description from title + basic info

router.post('/describe', requireAuth, async (req, res) => {
  try {
    const { title, location, category, start_at } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const dateStr = start_at ? new Date(start_at).toLocaleDateString('en-HK', { dateStyle: 'long' }) : '';
    const text = await callAI(
      'You are a professional event copywriter. Write clear, engaging, concise event descriptions (2–3 short paragraphs, under 180 words). Use a welcoming, professional tone. No hashtags.',
      `Write an event description for:\nTitle: ${title}\n${category ? `Category: ${category}` : ''}\n${location ? `Location: ${location}` : ''}\n${dateStr ? `Date: ${dateStr}` : ''}`
    );
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/eventflow/ai/social ───────────────────────────────────────────
// Generate social media promotional copy (3 variants)

router.post('/social', requireAuth, async (req, res) => {
  try {
    const { title, description, location, category, start_at } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const dateStr = start_at ? new Date(start_at).toLocaleDateString('en-HK', { dateStyle: 'long' }) : '';

    const text = await callAI(
      'You are a social media strategist. Generate 3 short, engaging promotional posts for an event. Label them "Instagram:", "LinkedIn:", "Twitter/X:". Each post should be tailored to the platform tone. Include 2–3 relevant hashtags per post. Be concise and compelling.',
      `Event: ${title}\n${description ? `Description: ${description.substring(0, 200)}` : ''}\n${category ? `Type: ${category}` : ''}\n${location ? `Location: ${location}` : ''}\n${dateStr ? `Date: ${dateStr}` : ''}`,
      800
    );
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/eventflow/ai/banner-prompt ────────────────────────────────────
// Generate an image prompt for AI banner/poster generation

router.post('/banner-prompt', requireAuth, async (req, res) => {
  try {
    const { title, description, category, style } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const text = await callAI(
      'You are a creative director specializing in event visuals. Generate detailed, specific image generation prompts (Midjourney/DALL-E style) for event banners. Prompts should be vivid, specific about style, lighting, and composition. Output just the prompt, no explanation.',
      `Create an image generation prompt for an event banner:\nEvent: ${title}\n${description ? `Theme: ${description.substring(0, 150)}` : ''}\n${category ? `Type: ${category}` : ''}\n${style ? `Preferred style: ${style}` : 'Modern, professional'}`,
      250
    );
    res.json({ prompt: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/eventflow/ai/agenda ───────────────────────────────────────────
// Generate a suggested event agenda/schedule

router.post('/agenda', requireAuth, async (req, res) => {
  try {
    const { title, description, category, duration_hours } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const text = await callAI(
      'You are an event planning expert. Create realistic, detailed event agendas in a clean list format with time slots. Keep it practical and tailored to the event type.',
      `Create a detailed agenda for:\nEvent: ${title}\n${description ? `Theme: ${description.substring(0, 200)}` : ''}\n${category ? `Type: ${category}` : ''}\n${duration_hours ? `Duration: ~${duration_hours} hours` : ''}`,
      600
    );
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/eventflow/ai/email ────────────────────────────────────────────
// Generate a promotional email blast copy

router.post('/email', requireAuth, async (req, res) => {
  try {
    const { title, description, category, location, start_at } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const dateStr = start_at ? new Date(start_at).toLocaleDateString('en-HK', { dateStyle: 'long' }) : '';

    const text = await callAI(
      'You are a professional email marketer. Write a compelling event promotion email. Include: subject line, email body with clear CTA. Keep it concise, warm, and action-oriented. Format: Subject: [line]\n\n[Body]',
      `Write a promotional email for:\nEvent: ${title}\n${description ? `Description: ${description.substring(0, 200)}` : ''}\n${category ? `Type: ${category}` : ''}\n${location ? `Location: ${location}` : ''}\n${dateStr ? `Date: ${dateStr}` : ''}`,
      700
    );
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/eventflow/ai/categories ────────────────────────────────────────
// Return the canonical category list

router.get('/categories', (req, res) => {
  res.json({ categories: EVENT_CATEGORIES });
});

module.exports = router;
