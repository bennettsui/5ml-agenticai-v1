/**
 * Model Helper
 * Utilities for handling AI model selection
 */

const perplexityService = require('../services/perplexityService');
const deepseekService = require('../services/deepseekService');

// Map frontend model selection to actual model names
const MODEL_MAP = {
  'deepseek': 'deepseek-reasoner',
  'haiku': 'claude-3-haiku-20240307',
  'sonnet': 'claude-3-5-sonnet-20240620',
  'perplexity': 'sonar-pro'
};

function getClaudeModel(modelSelection = 'deepseek') {
  return MODEL_MAP[modelSelection] || MODEL_MAP['deepseek'];
}

function shouldUsePerplexity(modelSelection) {
  return modelSelection === 'perplexity' && perplexityService.isAvailable();
}

function shouldUseDeepSeek(modelSelection) {
  return modelSelection === 'deepseek' && deepseekService.isAvailable();
}

function getModelDisplayName(modelSelection) {
  const names = {
    'deepseek': 'DeepSeek Reasoner',
    'haiku': 'Claude 3 Haiku',
    'sonnet': 'Claude 3.5 Sonnet',
    'perplexity': 'Perplexity Sonar Pro'
  };
  return names[modelSelection] || 'DeepSeek Reasoner';
}

module.exports = {
  getClaudeModel,
  shouldUsePerplexity,
  shouldUseDeepSeek,
  getModelDisplayName,
  MODEL_MAP
};
