/**
 * Model Helper
 * Utilities for handling AI model selection
 */

const perplexityService = require('../services/perplexityService');
const deepseekService = require('../services/deepseekService');

// Map frontend model selection to actual model names
const MODEL_MAP = {
  'deepseek': 'deepseek-reasoner',
  'haiku':    'claude-haiku-4-5-20251001',
  'sonnet':   'claude-sonnet-4-5-20250929',
  'perplexity': 'sonar-pro'
};

function getClaudeModel(modelSelection = 'haiku') {
  // If deepseek is selected but we're using Claude as fallback, use Haiku
  if (modelSelection === 'deepseek') {
    return MODEL_MAP['haiku'];
  }
  return MODEL_MAP[modelSelection] || MODEL_MAP['haiku'];
}

function shouldUsePerplexity(modelSelection) {
  return modelSelection === 'perplexity' && perplexityService.isAvailable();
}

function shouldUseDeepSeek(modelSelection) {
  return modelSelection === 'deepseek' && deepseekService.isAvailable();
}

function getModelDisplayName(modelSelection) {
  const names = {
    'deepseek':   'DeepSeek R1',
    'haiku':      'Claude Haiku 4.5',
    'sonnet':     'Claude Sonnet 4.5',
    'perplexity': 'Perplexity Sonar Pro'
  };
  return names[modelSelection] || 'DeepSeek R1';
}

module.exports = {
  getClaudeModel,
  shouldUsePerplexity,
  shouldUseDeepSeek,
  getModelDisplayName,
  MODEL_MAP
};
