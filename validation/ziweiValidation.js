/**
 * Validation middleware for Ziwei API endpoints
 * Uses express-validator for input sanitization and validation
 */

const { body, query, param, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Chart calculation validation
const validateChartCalculation = [
  body('lunarYear')
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Lunar year must be between 1900 and 2100'),
  body('lunarMonth')
    .isInt({ min: 1, max: 12 })
    .withMessage('Lunar month must be between 1 and 12'),
  body('lunarDay')
    .isInt({ min: 1, max: 30 })
    .withMessage('Lunar day must be between 1 and 30'),
  body('hourBranch')
    .isIn(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])
    .withMessage('Invalid hour branch. Must be one of: 子, 丑, 寅, 卯, 辰, 巳, 午, 未, 申, 酉, 戌, 亥'),
  body('yearStem')
    .isIn(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'])
    .withMessage('Invalid year stem. Must be one of the 10 heavenly stems'),
  body('yearBranch')
    .isIn(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])
    .withMessage('Invalid year branch. Must be one of the 12 earthly branches'),
  body('gender')
    .isIn(['男', '女', 'Male', 'Female', 'M', 'F'])
    .withMessage('Gender must be 男/女 or Male/Female'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('placeOfBirth')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Place of birth must be less than 100 characters'),
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Timezone must be less than 50 characters'),
  body('calendarType')
    .optional()
    .isIn(['lunar', 'gregorian'])
    .withMessage('Calendar type must be either lunar or gregorian'),
  handleValidationErrors
];

// Chart interpretation validation
const validateChartInterpretation = [
  body('chart')
    .notEmpty()
    .withMessage('Chart data is required'),
  body('consensusLevel')
    .optional()
    .isIn(['all', 'consensus', 'high'])
    .withMessage('Consensus level must be all, consensus, or high'),
  body('chartId')
    .optional()
    .isUUID()
    .withMessage('Invalid chart ID format'),
  handleValidationErrors
];

// Rules evaluation validation
const validateRulesEvaluation = [
  body('chart')
    .notEmpty()
    .withMessage('Chart data is required'),
  body('minConsensus')
    .optional()
    .isIn(['all', 'consensus', 'high'])
    .withMessage('Minimum consensus level must be all, consensus, or high'),
  handleValidationErrors
];

// Knowledge statistics validation
const validateKnowledgeRequest = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a positive number'),
  handleValidationErrors
];

// Knowledge search validation
const validateKnowledgeSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),
  query('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  handleValidationErrors
];

// Curriculum level validation
const validateCurriculumLevel = [
  param('level')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Curriculum level must be beginner, intermediate, advanced, or expert'),
  handleValidationErrors
];

// Combinations category validation
const validateCombinationsCategory = [
  param('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  handleValidationErrors
];

// Star name validation
const validateStarName = [
  param('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Star name must be between 1 and 50 characters'),
  handleValidationErrors
];

// Conversation creation validation
const validateConversationCreation = [
  body('chartId')
    .isUUID()
    .withMessage('Invalid chart ID format'),
  body('topic')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Topic must be between 1 and 200 characters'),
  handleValidationErrors
];

// Conversation message validation
const validateConversationMessage = [
  param('id')
    .isUUID()
    .withMessage('Invalid conversation ID format'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  handleValidationErrors
];

// Compatibility analysis validation
const validateCompatibility = [
  body('chart1')
    .notEmpty()
    .withMessage('First chart data is required'),
  body('chart2')
    .notEmpty()
    .withMessage('Second chart data is required'),
  body('name1')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First person name must be between 1 and 100 characters'),
  body('name2')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Second person name must be between 1 and 100 characters'),
  handleValidationErrors
];

// Generic analysis validation
const validateAnalysisRequest = [
  body('chart')
    .notEmpty()
    .withMessage('Chart data is required'),
  body('analysisType')
    .optional()
    .isIn(['career', 'relationships', 'health', 'finance', 'personality'])
    .withMessage('Analysis type must be one of: career, relationships, health, finance, personality'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateChartCalculation,
  validateChartInterpretation,
  validateRulesEvaluation,
  validateKnowledgeRequest,
  validateKnowledgeSearch,
  validateCurriculumLevel,
  validateCombinationsCategory,
  validateStarName,
  validateConversationCreation,
  validateConversationMessage,
  validateCompatibility,
  validateAnalysisRequest
};
