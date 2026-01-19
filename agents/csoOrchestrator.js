const Anthropic = require('@anthropic-ai/sdk');
const deepseekService = require('../services/deepseekService');
const { shouldUseDeepSeek } = require('../utils/modelHelper');

/**
 * CSO Orchestrator (高階品牌策略戰略長)
 * Layer 6: Orchestration & Workflow
 *
 * Coordinates 5 specialist agents:
 * 1. 品牌研究專家 (Brand Research)
 * 2. 用戶洞察專家 (Customer Insight)
 * 3. 競爭情報專家 (Competitor Intelligence)
 * 4. 品牌策略指揮官 (Brand Strategy)
 * 5. 市場哨兵 (Market Sentinel)
 */

/**
 * Main CSO Orchestration Function
 * Autonomous planning, multi-agent coordination, reflection, and self-correction
 */
async function orchestrateBrandDiagnosis(client_name, brief, options = {}) {
  const {
    model: modelSelection = 'deepseek',
    conversationHistory = [],
    existingData = {}
  } = options;

  // Only use DeepSeek R1 for orchestration (50,000 token limit)
  if (!shouldUseDeepSeek('deepseek')) {
    throw new Error('CSO Orchestrator requires DeepSeek R1 (deepseek-reasoner) for orchestration tasks');
  }

  const orchestrationLog = [];
  const modelsUsed = [];

  orchestrationLog.push({
    step: 'initialization',
    timestamp: new Date().toISOString(),
    message: '🤖 CSO: Starting brand holistic diagnosis...',
    role: '高階品牌策略戰略長 (CSO)'
  });

  // Step 1: Data Sufficiency Check (Layer 5)
  orchestrationLog.push({
    step: 'data_sufficiency_check',
    timestamp: new Date().toISOString(),
    message: '📋 Checking data sufficiency...'
  });

  const dataEvaluation = await evaluateDataSufficiency(client_name, brief, existingData, conversationHistory);
  orchestrationLog.push({
    step: 'data_evaluation_result',
    result: dataEvaluation,
    message: dataEvaluation.sufficient
      ? '✅ All required data available'
      : `⚠️  Data gaps detected: ${dataEvaluation.gaps.join(', ')}`
  });

  // Step 2: Orchestrate Specialist Agents (Layer 3)
  if (!dataEvaluation.sufficient) {
    orchestrationLog.push({
      step: 'agent_orchestration',
      message: '🔄 Coordinating specialist agents...'
    });

    const gatheredData = {};

    // 1. 品牌研究專家 (Brand Research)
    if (dataEvaluation.gaps.includes('brand_research')) {
      orchestrationLog.push({
        step: 'calling_brand_research',
        message: '🔍 Calling 品牌研究專家 (Brand Research Agent)...',
        agent: 'research'
      });

      try {
        const { analyzeBrandResearch } = require('./researchAgent');
        gatheredData.brand_research = await analyzeBrandResearch(client_name, brief, { model: modelSelection });
        orchestrationLog.push({
          step: 'brand_research_complete',
          message: '✅ Brand Research completed',
          success: true
        });
      } catch (error) {
        orchestrationLog.push({
          step: 'brand_research_error',
          message: `❌ Brand Research failed: ${error.message}`,
          error: error.message
        });
      }
    }

    // 2. 用戶洞察專家 (Customer Insight)
    if (dataEvaluation.gaps.includes('customer_insight')) {
      orchestrationLog.push({
        step: 'calling_customer_insight',
        message: '👥 Calling 用戶洞察專家 (Customer Insight Agent)...',
        agent: 'customer'
      });

      try {
        const { analyzeCustomerInsight } = require('./customerInsightAgent');
        gatheredData.customer_insight = await analyzeCustomerInsight(client_name, brief, { model: modelSelection });
        orchestrationLog.push({
          step: 'customer_insight_complete',
          message: '✅ Customer Insight completed',
          success: true
        });
      } catch (error) {
        orchestrationLog.push({
          step: 'customer_insight_error',
          message: `❌ Customer Insight failed: ${error.message}`,
          error: error.message
        });
      }
    }

    // 3. 競爭情報專家 (Competitor Intelligence)
    if (dataEvaluation.gaps.includes('competitor_analysis')) {
      orchestrationLog.push({
        step: 'calling_competitor_intelligence',
        message: '🎯 Calling 競爭情報專家 (Competitor Intelligence Agent)...',
        agent: 'competitor'
      });

      try {
        const { analyzeCompetitorIntelligence } = require('./competitorAgent');
        gatheredData.competitor_analysis = await analyzeCompetitorIntelligence(client_name, brief, { model: modelSelection });
        orchestrationLog.push({
          step: 'competitor_intelligence_complete',
          message: '✅ Competitor Intelligence completed',
          success: true
        });
      } catch (error) {
        orchestrationLog.push({
          step: 'competitor_intelligence_error',
          message: `❌ Competitor Intelligence failed: ${error.message}`,
          error: error.message
        });
      }
    }

    // 4. 品牌策略指揮官 (Brand Strategy)
    if (dataEvaluation.gaps.includes('brand_strategy')) {
      orchestrationLog.push({
        step: 'calling_brand_strategy',
        message: '⚡ Calling 品牌策略指揮官 (Brand Strategy Agent)...',
        agent: 'strategy'
      });

      try {
        const { analyzeBrandStrategy } = require('./brandStrategyAgent');
        gatheredData.brand_strategy = await analyzeBrandStrategy(client_name, brief, { model: modelSelection });
        orchestrationLog.push({
          step: 'brand_strategy_complete',
          message: '✅ Brand Strategy completed',
          success: true
        });
      } catch (error) {
        orchestrationLog.push({
          step: 'brand_strategy_error',
          message: `❌ Brand Strategy failed: ${error.message}`,
          error: error.message
        });
      }
    }

    // 5. 市場掃描哨兵 (Competitive Review)
    if (dataEvaluation.gaps.includes('competitive_review')) {
      orchestrationLog.push({
        step: 'calling_competitive_review',
        message: '📡 Calling 市場掃描哨兵 (Competitive Review Agent)...',
        agent: 'sentinel'
      });

      try {
        const { monitorMarketTrends } = require('./marketSentinelAgent');
        gatheredData.competitive_review = await monitorMarketTrends(client_name, brief, { model: modelSelection });
        orchestrationLog.push({
          step: 'competitive_review_complete',
          message: '✅ Competitive Review completed',
          success: true
        });
      } catch (error) {
        orchestrationLog.push({
          step: 'competitive_review_error',
          message: `❌ Competitive Review failed: ${error.message}`,
          error: error.message
        });
      }
    }

    // Merge gathered data
    existingData = { ...existingData, ...gatheredData };
  }

  // Step 3: Synthesize Holistic Diagnosis
  orchestrationLog.push({
    step: 'holistic_synthesis',
    message: '🧠 Synthesizing holistic brand diagnosis...'
  });

  const diagnosis = await synthesizeDiagnosis(
    client_name,
    brief,
    existingData,
    orchestrationLog,
    modelsUsed
  );

  // Step 4: Reflection - Validate Output Quality
  orchestrationLog.push({
    step: 'quality_reflection',
    message: '🔍 Validating diagnosis quality...'
  });

  const qualityCheck = await reflectOnDiagnosis(diagnosis);
  orchestrationLog.push({
    step: 'quality_result',
    result: qualityCheck,
    message: qualityCheck.acceptable
      ? '✅ Diagnosis meets quality standards'
      : `⚠️  Quality check failed: ${qualityCheck.reason}`
  });

  // Step 5: Retry if needed (max 2 attempts)
  if (!qualityCheck.acceptable && qualityCheck.retry_count < 2) {
    orchestrationLog.push({
      step: 'retry_synthesis',
      message: `🔄 Retrying with enhanced guidance: ${qualityCheck.guidance}`
    });

    const refinedDiagnosis = await synthesizeDiagnosis(
      client_name,
      brief,
      existingData,
      orchestrationLog,
      modelsUsed,
      qualityCheck.guidance
    );

    orchestrationLog.push({
      step: 'final_result',
      message: '✅ Refined diagnosis complete'
    });

    return {
      ...refinedDiagnosis,
      _orchestration: {
        mode: 'cso_orchestration',
        role: '高階品牌策略戰略長 (CSO)',
        orchestration_log: orchestrationLog,
        models_used: modelsUsed,
        retry_count: 1,
        data_sources: Object.keys(existingData),
        agents_called: orchestrationLog.filter(log => log.agent).map(log => log.agent)
      }
    };
  }

  // Return final diagnosis
  orchestrationLog.push({
    step: 'completion',
    message: '✅ Brand holistic diagnosis complete'
  });

  return {
    ...diagnosis,
    _orchestration: {
      mode: 'cso_orchestration',
      role: '高階品牌策略戰略長 (CSO)',
      orchestration_log: orchestrationLog,
      models_used: modelsUsed,
      data_sources: Object.keys(existingData),
      agents_called: orchestrationLog.filter(log => log.agent).map(log => log.agent)
    }
  };
}

/**
 * Evaluate data sufficiency - check which agents need to be called
 */
async function evaluateDataSufficiency(client_name, brief, existingData, conversationHistory) {
  const gaps = [];

  // Check for each specialist's data
  if (!existingData.brand_research && !conversationHistory.some(m => m.agent === 'research')) {
    gaps.push('brand_research');
  }

  if (!existingData.customer_insight && !conversationHistory.some(m => m.agent === 'customer')) {
    gaps.push('customer_insight');
  }

  if (!existingData.competitor_analysis && !conversationHistory.some(m => m.agent === 'competitor')) {
    gaps.push('competitor_analysis');
  }

  if (!existingData.brand_strategy && !conversationHistory.some(m => m.agent === 'strategy')) {
    gaps.push('brand_strategy');
  }

  if (!existingData.competitive_review && !conversationHistory.some(m => m.agent === 'sentinel')) {
    gaps.push('competitive_review');
  }

  return {
    sufficient: gaps.length === 0,
    gaps: gaps,
    recommendation: gaps.length > 0
      ? `需要調用以下專家: ${gaps.join(', ')}`
      : '所有必要數據已齊全，可進行綜合診斷。'
  };
}

/**
 * Synthesize holistic diagnosis from all agent data
 */
async function synthesizeDiagnosis(client_name, brief, existingData, orchestrationLog, modelsUsed, additionalGuidance = '') {
  // Build comprehensive context
  let contextData = `# 品牌全息診斷報告\n\n**品牌名稱**: ${client_name}\n**項目簡報**: ${brief}\n\n`;

  contextData += `## 專家團隊數據匯總\n\n`;

  if (existingData.brand_research) {
    contextData += `### 1. 品牌研究專家報告\n${JSON.stringify(existingData.brand_research, null, 2)}\n\n`;
  }

  if (existingData.customer_insight) {
    contextData += `### 2. 用戶洞察專家報告\n${JSON.stringify(existingData.customer_insight, null, 2)}\n\n`;
  }

  if (existingData.competitor_analysis) {
    contextData += `### 3. 競爭情報專家報告\n${JSON.stringify(existingData.competitor_analysis, null, 2)}\n\n`;
  }

  if (existingData.brand_strategy) {
    contextData += `### 4. 品牌策略指揮官報告\n${JSON.stringify(existingData.brand_strategy, null, 2)}\n\n`;
  }

  if (existingData.competitive_review) {
    contextData += `### 5. 市場掃描哨兵報告\n${JSON.stringify(existingData.competitive_review, null, 2)}\n\n`;
  }

  if (additionalGuidance) {
    contextData += `\n## 優化指引\n${additionalGuidance}\n\n`;
  }

  // Use DeepSeek R1 for synthesis (50k token limit)
  const systemPrompt = `你是 高階品牌策略戰略長 (CSO)，負責整合五位專家的分析報告，產出綜合性的品牌診斷書。

## 你的任務

基於以上五位專家（品牌研究、用戶洞察、競爭情報、策略指揮、市場哨兵）的報告，進行綜合診斷：

### 1. 品牌現狀總結 (Executive Summary)
- 核心優勢與劣勢
- 關鍵機會與威脅
- 當前定位評估

### 2. 戰略建議 (Strategic Recommendations)
- **5個核心定位關鍵字** (必須基於數據證據)
- 短期優先事項（0-3個月）
- 中期策略方向（3-6個月）
- 長期願景規劃（6-12個月）

### 3. 行動藍圖 (Action Blueprint)
- 品牌層面：定位優化、視覺調整
- 產品層面：組合優化、定價策略
- 溝通層面：核心訊息、渠道策略
- 執行層面：組織能力、預算配置

### 4. 風險評估 (Risk Assessment)
- 執行障礙識別
- 緩解措施建議

**重要**: 所有建議必須基於專家報告中的實際數據，避免臆測。`;

  const userPrompt = `${contextData}

請根據以上專家報告，產出《品牌全息診斷書》。確保包含：
1. Executive Summary
2. 5個核心定位關鍵字（每個關鍵字標註數據來源）
3. 戰略建議（短/中/長期）
4. 行動藍圖
5. 風險評估`;

  try {
    const result = await deepseekService.research(userPrompt, {
      systemPrompt,
      maxTokens: 8000,
      temperature: 0.3,
    });

    modelsUsed.push({
      model: 'DeepSeek R1',
      model_id: 'deepseek-reasoner',
      usage: result.usage || {},
      role: 'CSO Synthesis'
    });

    return {
      holistic_diagnosis: result.content,
      reasoning_process: result.reasoning_process,
      sources: Object.keys(existingData),
      _meta: {
        models_used: modelsUsed,
        note: 'CSO orchestrated holistic diagnosis'
      }
    };
  } catch (error) {
    throw new Error(`CSO synthesis failed: ${error.message}`);
  }
}

/**
 * Reflection - validate diagnosis quality
 */
async function reflectOnDiagnosis(diagnosis) {
  const content = diagnosis.holistic_diagnosis || '';

  // Check for required components
  const hasExecutiveSummary = content.includes('Executive Summary') || content.includes('品牌現狀總結');
  const hasKeywords = /定位關鍵字.*?[1-5]\./gs.test(content) || content.includes('positioning keywords');
  const hasStrategicRec = content.includes('Strategic Recommendations') || content.includes('戰略建議');
  const hasActionBlueprint = content.includes('Action Blueprint') || content.includes('行動藍圖');
  const hasRiskAssessment = content.includes('Risk Assessment') || content.includes('風險評估');

  const allComponentsPresent = hasExecutiveSummary && hasKeywords && hasStrategicRec && hasActionBlueprint && hasRiskAssessment;

  if (!allComponentsPresent) {
    const missing = [];
    if (!hasExecutiveSummary) missing.push('Executive Summary');
    if (!hasKeywords) missing.push('5個定位關鍵字');
    if (!hasStrategicRec) missing.push('Strategic Recommendations');
    if (!hasActionBlueprint) missing.push('Action Blueprint');
    if (!hasRiskAssessment) missing.push('Risk Assessment');

    return {
      acceptable: false,
      reason: `Missing components: ${missing.join(', ')}`,
      guidance: `請補充以下內容：${missing.join('、')}。特別注意必須包含5個基於數據的定位關鍵字。`,
      retry_count: 0
    };
  }

  return {
    acceptable: true,
    reason: 'Holistic diagnosis meets all quality standards',
    retry_count: 0
  };
}

module.exports = {
  orchestrateBrandDiagnosis,
};
