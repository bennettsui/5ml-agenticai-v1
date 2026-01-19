const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');
const { getClaudeModel, getModelDisplayName, shouldUsePerplexity, shouldUseDeepSeek } = require('../utils/modelHelper');
const deepseekService = require('../services/deepseekService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Research Agent
 * Uses Perplexity AI for web-based research, DeepSeek, or Claude for knowledge-based analysis
 */

async function analyzeResearch(client_name, brief, options = {}) {
  const { model: modelSelection = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  // Try Perplexity first if requested and available
  if (shouldUsePerplexity(modelSelection)) {
    try {
      console.log('🔍 Using Perplexity for web-based research...');
      return await researchWithPerplexity(client_name, brief, modelsUsed);
    } catch (error) {
      if (no_fallback) {
        throw new Error(`Perplexity API error: ${error.message}`);
      }
      console.warn('⚠️ Perplexity unavailable, falling back to DeepSeek:', error.message);
    }
  }

  // Use DeepSeek if selected and available
  if (shouldUseDeepSeek(modelSelection)) {
    try {
      console.log('🤖 Using DeepSeek for knowledge-based research...');
      return await researchWithDeepSeek(client_name, brief, modelSelection, no_fallback, modelsUsed);
    } catch (error) {
      if (no_fallback) {
        throw new Error(`DeepSeek API error: ${error.message}`);
      }
      console.warn('⚠️ DeepSeek unavailable, falling back to Claude:', error.message);
    }
  }

  // Fallback to Claude-based research
  console.log('🤖 Using Claude for knowledge-based research...');
  return await researchWithClaude(client_name, brief, modelSelection, modelsUsed);
}

async function researchWithPerplexity(client_name, brief, modelsUsed = []) {
  const query = `# Role: 高階品牌策略與市場調研專家

你是一位擁有 15 年經驗的高階市場調研專家，擅長競爭情報分析與品牌審計。請針對以下品牌進行深度的「品牌背景研究」。

**品牌/客戶**: ${client_name}
**研究簡報**: ${brief}

請依照以下工作流程執行任務，Let's think this step by step：

**第一階段：實時情報收集（必須使用最新資訊 2025-2026）**
- 品牌現況：檢索過去 3 個月內的新聞（分類為好消息/壞消息）、近期活動（Campaign/Press Release）、官網及社群更新
- 市場定位驗證：尋找官方 Positioning Statement，並對比社群平台上的用戶真實評價與媒體描述
- 產品組合：整理主力產品線、價格帶及 SKU 概況
- 用戶聲音（VOC）：蒐集正面讚賞點與負面投訴點

**第二階段：結構化分析**
- 3Cs 分析：Company（業務模式、核心競爭力、資源限制）、Customer（目標受眾畫像、購買動機、未滿足需求）、Competitor（列出 2-3 個直接競品與 1 個替代方案，對比其社群表現與差異點）
- SWOT 推導：基於 3Cs 資訊整理出優勢、劣勢、機會與威脅

**第三階段：現狀診斷**
- 策略解讀：分析近期行銷手法（KOL/廣告/內容風格）及其背後邏輯
- 定位對位：診斷「官方想說的」與「用戶感受到的」是否存在落差
- 核心挑戰：提煉品牌面臨的業務、品牌、競爭及執行四大挑戰
- 機會清單：列出未開發的受眾、平台或未被講述的品牌故事

Return response in JSON format with keys: brand_status, positioning, product_portfolio, voc_positive, voc_negative, company_analysis, customer_analysis, competitor_analysis, swot_strengths, swot_weaknesses, swot_opportunities, swot_threats, marketing_strategy, positioning_gap, core_challenges, opportunity_list, reasoning, sources`;

  const result = await perplexityService.researchStructured(
    query,
    `{
  "brand_status": {
    "recent_news_good": ["好消息1", "好消息2"],
    "recent_news_bad": ["壞消息1", "壞消息2"],
    "recent_campaigns": ["活動1", "活動2"],
    "social_updates": ["更新1", "更新2"]
  },
  "positioning": {
    "official_statement": "官方定位描述",
    "user_perception": "用戶感知描述",
    "media_description": "媒體描述"
  },
  "product_portfolio": {
    "main_products": ["產品1", "產品2"],
    "price_range": "價格帶描述",
    "sku_overview": "SKU 概況"
  },
  "voc_positive": ["讚賞點1", "讚賞點2", "讚賞點3"],
  "voc_negative": ["投訴點1", "投訴點2", "投訴點3"],
  "company_analysis": {
    "business_model": "業務模式描述",
    "core_competencies": ["核心競爭力1", "核心競爭力2"],
    "resource_constraints": ["限制1", "限制2"]
  },
  "customer_analysis": {
    "target_audience": "目標受眾畫像",
    "purchase_motivation": ["動機1", "動機2"],
    "unmet_needs": ["未滿足需求1", "未滿足需求2"]
  },
  "competitor_analysis": [
    {"name": "競品1", "positioning": "定位", "social_performance": "社群表現", "differentiation": "差異點"},
    {"name": "競品2", "positioning": "定位", "social_performance": "社群表現", "differentiation": "差異點"}
  ],
  "swot_strengths": ["優勢1", "優勢2", "優勢3"],
  "swot_weaknesses": ["劣勢1", "劣勢2", "劣勢3"],
  "swot_opportunities": ["機會1", "機會2", "機會3"],
  "swot_threats": ["威脅1", "威脅2", "威脅3"],
  "marketing_strategy": {
    "kol_partnerships": ["KOL合作1", "KOL合作2"],
    "advertising_approach": "廣告手法描述",
    "content_style": "內容風格描述",
    "strategic_logic": "背後邏輯分析"
  },
  "positioning_gap": "官方定位與用戶感受的落差分析",
  "core_challenges": {
    "business": "業務挑戰",
    "brand": "品牌挑戰",
    "competition": "競爭挑戰",
    "execution": "執行挑戰"
  },
  "opportunity_list": ["未開發受眾機會", "平台機會", "品牌故事機會"],
  "reasoning": "思考過程與判斷依據",
  "sources": ["來源1", "來源2", "來源3"]
}`,
    {
      searchRecency: 'week',
      maxTokens: 3000,
    }
  );

  // Track Perplexity usage
  modelsUsed.push({
    model: 'Perplexity Sonar Pro',
    model_id: 'sonar-pro',
    usage: result.usage || {}
  });

  return {
    ...result.data,
    _meta: {
      models_used: modelsUsed,
      sources: result.sources,
    }
  };
}

async function researchWithClaude(client_name, brief, modelSelection = 'haiku', modelsUsed = []) {
  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: modelSelection === 'sonnet' ? 3000 : 2000,
    messages: [
      {
        role: 'user',
        content: `# Role: 高階品牌策略與市場調研專家

你是一位擁有 15 年經驗的高階市場調研專家，擅長競爭情報分析與品牌審計。請針對以下品牌進行深度的「品牌背景研究」。

**品牌/客戶**: ${client_name}
**研究簡報**: ${brief}

請依照以下工作流程執行任務，Let's think this step by step：

**第一階段：資料充足性檢查**
檢查用戶提供的資訊是否足夠，若不足請在 data_sufficiency_check 中說明需要補充的資訊。

**第二階段：實時情報收集**
- 品牌現況：近期新聞（好消息/壞消息）、近期活動、官網及社群更新
- 市場定位驗證：官方 Positioning Statement、社群平台用戶評價、媒體描述
- 產品組合：主力產品線、價格帶、SKU 概況
- 用戶聲音（VOC）：正面讚賞點與負面投訴點

**第三階段：結構化分析**
- 3Cs 分析：Company、Customer、Competitor
- SWOT 推導：優勢、劣勢、機會、威脅

**第四階段：現狀診斷**
- 策略解讀、定位對位、核心挑戰、機會清單

**第五階段：推理追蹤**
記錄思考過程與判斷依據

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "data_sufficiency_check": "資訊是否充足的評估，若不足請列出需補充的關鍵問題",
  "brand_status": {
    "recent_news_good": ["好消息1", "好消息2"],
    "recent_news_bad": ["壞消息1"],
    "recent_campaigns": ["活動1", "活動2"],
    "social_updates": ["更新1", "更新2"]
  },
  "positioning": {
    "official_statement": "官方定位描述",
    "user_perception": "用戶感知描述",
    "media_description": "媒體描述"
  },
  "product_portfolio": {
    "main_products": ["產品1", "產品2"],
    "price_range": "價格帶描述",
    "sku_overview": "SKU 概況"
  },
  "voc_positive": ["讚賞點1", "讚賞點2"],
  "voc_negative": ["投訴點1", "投訴點2"],
  "company_analysis": {
    "business_model": "業務模式描述",
    "core_competencies": ["核心競爭力1", "核心競爭力2"],
    "resource_constraints": ["限制1", "限制2"]
  },
  "customer_analysis": {
    "target_audience": "目標受眾畫像",
    "purchase_motivation": ["動機1", "動機2"],
    "unmet_needs": ["未滿足需求1", "未滿足需求2"]
  },
  "competitor_analysis": [
    {"name": "競品1", "positioning": "定位", "social_performance": "社群表現", "differentiation": "差異點"}
  ],
  "swot_strengths": ["優勢1", "優勢2"],
  "swot_weaknesses": ["劣勢1", "劣勢2"],
  "swot_opportunities": ["機會1", "機會2"],
  "swot_threats": ["威脅1", "威脅2"],
  "marketing_strategy": {
    "kol_partnerships": ["KOL合作1"],
    "advertising_approach": "廣告手法描述",
    "content_style": "內容風格描述",
    "strategic_logic": "背後邏輯分析"
  },
  "positioning_gap": "官方定位與用戶感受的落差分析",
  "core_challenges": {
    "business": "業務挑戰",
    "brand": "品牌挑戰",
    "competition": "競爭挑戰",
    "execution": "執行挑戰"
  },
  "opportunity_list": ["未開發受眾機會", "平台機會"],
  "reasoning": "思考過程與判斷依據"
}`,
      },
    ],
  });

  // Track Claude usage
  modelsUsed.push({
    model: getModelDisplayName(modelSelection),
    model_id: claudeModel,
    usage: {
      input_tokens: response.usage?.input_tokens || 0,
      output_tokens: response.usage?.output_tokens || 0,
      total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
    }
  });

  const text = response.content[0].text;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

    return {
      ...analysis,
      _meta: {
        models_used: modelsUsed,
      }
    };
  } catch {
    return {
      raw: text,
      _meta: {
        models_used: modelsUsed,
      }
    };
  }
}

async function researchWithDeepSeek(client_name, brief, modelSelection, no_fallback = false, modelsUsed = []) {
  const systemPrompt = `# Role: 高階品牌策略與市場調研專家

你是一位擁有 15 年經驗的高階市場調研專家，擅長競爭情報分析與品牌審計。你具備極強的數據檢索能力，能從海量資訊中提煉出關鍵洞察，並運用 3Cs、SWOT 等框架進行邏輯嚴密的診斷。`;

  const userPrompt = `請針對以下品牌進行深度的「品牌背景研究」。

**品牌/客戶**: ${client_name}
**研究簡報**: ${brief}

請依照以下工作流程執行任務，Let's think this step by step：

**第一階段：資料充足性檢查**
檢查用戶提供的資訊是否足夠，若不足請在 data_sufficiency_check 中說明需要補充的資訊。

**第二階段：實時情報收集**
- 品牌現況：近期新聞（好消息/壞消息）、近期活動、官網及社群更新
- 市場定位驗證：官方 Positioning Statement、社群平台用戶評價、媒體描述
- 產品組合：主力產品線、價格帶、SKU 概況
- 用戶聲音（VOC）：正面讚賞點與負面投訴點

**第三階段：結構化分析**
- 3Cs 分析：Company（業務模式、核心競爭力、資源限制）、Customer（目標受眾畫像、購買動機、未滿足需求）、Competitor（直接競品與替代方案）
- SWOT 推導：優勢、劣勢、機會、威脅

**第四階段：現狀診斷**
- 策略解讀：分析近期行銷手法及其背後邏輯
- 定位對位：診斷「官方想說的」與「用戶感受到的」是否存在落差
- 核心挑戰：提煉品牌面臨的業務、品牌、競爭及執行四大挑戰
- 機會清單：列出未開發的受眾、平台或未被講述的品牌故事

**第五階段：推理追蹤**
記錄思考過程與判斷依據

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "data_sufficiency_check": "資訊是否充足的評估",
  "brand_status": {
    "recent_news_good": ["好消息1", "好消息2"],
    "recent_news_bad": ["壞消息1"],
    "recent_campaigns": ["活動1"],
    "social_updates": ["更新1"]
  },
  "positioning": {
    "official_statement": "官方定位描述",
    "user_perception": "用戶感知描述",
    "media_description": "媒體描述"
  },
  "product_portfolio": {
    "main_products": ["產品1", "產品2"],
    "price_range": "價格帶描述",
    "sku_overview": "SKU 概況"
  },
  "voc_positive": ["讚賞點1", "讚賞點2"],
  "voc_negative": ["投訴點1", "投訴點2"],
  "company_analysis": {
    "business_model": "業務模式描述",
    "core_competencies": ["核心競爭力1"],
    "resource_constraints": ["限制1"]
  },
  "customer_analysis": {
    "target_audience": "目標受眾畫像",
    "purchase_motivation": ["動機1"],
    "unmet_needs": ["未滿足需求1"]
  },
  "competitor_analysis": [
    {"name": "競品1", "positioning": "定位", "social_performance": "社群表現", "differentiation": "差異點"}
  ],
  "swot_strengths": ["優勢1", "優勢2"],
  "swot_weaknesses": ["劣勢1", "劣勢2"],
  "swot_opportunities": ["機會1", "機會2"],
  "swot_threats": ["威脅1", "威脅2"],
  "marketing_strategy": {
    "kol_partnerships": ["KOL合作1"],
    "advertising_approach": "廣告手法描述",
    "content_style": "內容風格描述",
    "strategic_logic": "背後邏輯分析"
  },
  "positioning_gap": "官方定位與用戶感受的落差分析",
  "core_challenges": {
    "business": "業務挑戰",
    "brand": "品牌挑戰",
    "competition": "競爭挑戰",
    "execution": "執行挑戰"
  },
  "opportunity_list": ["未開發受眾機會", "平台機會"],
  "reasoning": "思考過程與判斷依據"
}`;

  try {
    const result = await deepseekService.analyze(systemPrompt, userPrompt, {
      maxTokens: 3000,
    });

    // Track DeepSeek usage
    modelsUsed.push({
      model: getModelDisplayName(modelSelection),
      model_id: 'deepseek-chat',
      usage: result.usage || {}
    });

    const text = result.content;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };

      return {
        ...analysis,
        _meta: {
          models_used: modelsUsed
        }
      };
    } catch {
      return {
        raw: text,
        _meta: {
          models_used: modelsUsed
        }
      };
    }
  } catch (error) {
    if (no_fallback) {
      throw new Error(`DeepSeek API error: ${error.message}`);
    }
    console.error('DeepSeek error, falling back to Claude Haiku:', error.message);
    return await researchWithClaude(client_name, brief, 'haiku', modelsUsed);
  }
}

module.exports = { analyzeResearch };

