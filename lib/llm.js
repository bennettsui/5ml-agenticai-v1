/**
 * LLM Library — unified interface for calling different language models.
 *
 * Supported providers:
 *   • MiniMax    – MiniMax-Text-01 (MiniMax 2.5) — default for textual conversation
 *   • DeepSeek   – DeepSeek Reasoner (via existing deepseekService)
 *   • Anthropic  – Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.6
 *
 * Usage:
 *   const llm = require('./lib/llm');
 *   const res = await llm.chat('minimax', messages, { system, maxTokens });
 *   const models = llm.listModels();
 */

const Anthropic = require('@anthropic-ai/sdk');

// ---------------------------------------------------------------------------
// Singleton Anthropic client
// ---------------------------------------------------------------------------
let _anthropic = null;
function getClient() {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

// ---------------------------------------------------------------------------
// Model registry
// ---------------------------------------------------------------------------
const MODELS = {
  'minimax': {
    id: 'MiniMax-Text-01',
    name: 'MiniMax 2.5',
    provider: 'minimax',
    description: 'MiniMax Text model. Fast, cost-effective for textual conversations. Default for workflow chat.',
    maxTokens: 4096,
    costPer1M: { input: 0.20, output: 1.10 },
  },
  'sonnet': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    description: 'Best balance of speed, cost, and intelligence. Recommended for most tasks.',
    maxTokens: 8192,
    costPer1M: { input: 3.00, output: 15.00 },
  },
  'haiku': {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: 'Fastest and cheapest. Good for simple tasks, classification, extraction.',
    maxTokens: 8192,
    costPer1M: { input: 0.80, output: 4.00 },
  },
  'opus': {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    description: 'Most capable. Use for complex reasoning, planning, or high-stakes decisions.',
    maxTokens: 16384,
    costPer1M: { input: 15.00, output: 75.00 },
  },
};

const DEFAULT_MODEL = 'sonnet';

// ---------------------------------------------------------------------------
// Core chat function
// ---------------------------------------------------------------------------

/**
 * Send a chat completion request to the specified model.
 *
 * @param {string} modelKey - One of: 'minimax', 'sonnet', 'haiku', 'opus'
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [opts]
 * @param {string} [opts.system] - System prompt
 * @param {number} [opts.maxTokens] - Max output tokens
 * @param {number} [opts.temperature] - 0-1
 * @returns {Promise<{text: string, model: string, usage: object}>}
 */
async function chat(modelKey, messages, opts = {}) {
  const spec = MODELS[modelKey] || MODELS[DEFAULT_MODEL];

  if (spec.provider === 'minimax') {
    return chatMiniMax(spec, messages, opts);
  }

  if (spec.provider === 'anthropic') {
    return chatAnthropic(spec, messages, opts);
  }

  throw new Error(`Unsupported provider: ${spec.provider}`);
}

async function chatMiniMax(spec, messages, opts) {
  const minimax = require('../services/minimaxService');

  try {
    const result = await minimax.chat(messages, {
      model: spec.id,
      maxTokens: opts.maxTokens || spec.maxTokens,
      temperature: opts.temperature,
    });

    return {
      text: result.content,
      model: result.model || spec.id,
      modelName: spec.name,
      usage: result.usage,
      stopReason: 'end_turn',
    };
  } catch (error) {
    throw new Error(`MiniMax chat error: ${error.message}`);
  }
}

async function chatAnthropic(spec, messages, opts) {
  const client = getClient();

  const params = {
    model: spec.id,
    max_tokens: opts.maxTokens || spec.maxTokens,
    messages: messages.map((m) => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    })),
  };

  if (opts.system) {
    params.system = opts.system;
  }

  if (opts.temperature !== undefined) {
    params.temperature = opts.temperature;
  }

  const response = await client.messages.create(params);

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return {
    text,
    model: spec.id,
    modelName: spec.name,
    usage: response.usage,
    stopReason: response.stop_reason,
  };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function listModels() {
  return Object.entries(MODELS).map(([key, spec]) => ({
    key,
    id: spec.id,
    name: spec.name,
    description: spec.description,
    costPer1M: spec.costPer1M,
  }));
}

function getModel(key) {
  return MODELS[key] || null;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  chat,
  listModels,
  getModel,
  MODELS,
  DEFAULT_MODEL,
};
