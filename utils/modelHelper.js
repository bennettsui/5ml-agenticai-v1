/**
 * Model Helper
 * Utilities for handling AI model selection
 */

const perplexityService = require('../services/perplexityService');

// Map frontend model selection to actual model names
const MODEL_MAP = {
  'haiku': 'claude-3-haiku-20240307',
  'sonnet': 'claude-3-5-sonnet-20241022',
  'perplexity': 'sonar-pro'
};

function getClaudeModel(modelSelection = 'haiku') {
  return MODEL_MAP[modelSelection] || MODEL_MAP['haiku'];
}

function shouldUsePerplexity(modelSelection) {
  return modelSelection === 'perplexity' && perplexityService.isAvailable();
}

function getModelDisplayName(modelSelection) {
  const names = {
    'haiku': 'Claude 3 Haiku',
    'sonnet': 'Claude 3.5 Sonnet',
    'perplexity': 'Perplexity Sonar Pro'
  };
  return names[modelSelection] || 'Claude 3 Haiku';
}

module.exports = {
  getClaudeModel,
  shouldUsePerplexity,
  getModelDisplayName,
  MODEL_MAP
};
