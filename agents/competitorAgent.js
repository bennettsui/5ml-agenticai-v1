const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');
const { getClaudeModel, getModelDisplayName, shouldUsePerplexity, shouldUseDeepSeek } = require('../utils/modelHelper');
const deepseekService = require('../services/deepseekService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Competitor Analysis Agent (競爭情報專家)
 * Intelligence gathering and competitive positioning analysis
 */

async function analyzeCompetitor(client_name, brief, options = {}) {
  const { model: modelSelection = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  // Try Perplexity first if requested and available
  if (shouldUsePerplexity(modelSelection)) {
    try {
      console.log('🔍 Using Perplexity for competitor intelligence...');
      return await competitorWithPerplexity(client_name, brief, modelsUsed);
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
      console.log('🤖 Using DeepSeek for competitor analysis...');
      return await competitorWithDeepSeek(client_name, brief, modelSelection, no_fallback, modelsUsed);
    } catch (error) {
      if (no_fallback) {
        throw new Error(`DeepSeek API error: ${error.message}`);
      }
      console.warn('⚠️ DeepSeek unavailable, falling back to Claude:', error.message);
    }
  }

  // Fallback to Claude-based analysis
  console.log('🤖 Using Claude for competitor analysis...');
  return await competitorWithClaude(client_name, brief, modelSelection, modelsUsed);
}

async function competitorWithPerplexity(client_name, brief, modelsUsed = []) {
  const systemPrompt = `你是一位商業間諜與競爭情報專家（CI Expert）。

<背景>：在動態競爭中尋找差異化空間，監控競品的產品、定價與聲量。你擅長競爭情報收集、標竿管理與差異化策略分析。你必須使用最新資訊（2026 年）。`;

  const query = `請針對以下品牌進行「競爭格局分析與差異化機會矩陣」，必須使用最新網路資訊（2026 年）：

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>：

# 競爭雷達建構
- 列出 2-3 個直接競爭者（同產品類別）
- 列出 1-2 個間接（注意力）競爭者
- 說明為何選擇這些競品

# 標竿管理 (Benchmarking)
對每個主要競品分析：
- 服務/產品組合
- 品牌定位（Positioning Statement）
- 視覺調性與風格
- 核心標語（Slogan）
- 價格策略

# 最新動態掃描（強制搜尋 2026 年資訊）
- 最新產品發布
- 促銷活動與優惠
- 社群表現（粉絲數、互動率）
- 廣告投放邏輯（Google/FB/IG Ads）
- 媒體曝光與公關策略

# 差異化診斷
## 對比分析
- 本品牌 vs 競品的產品/服務比較
- 價格定位比較
- 目標受眾比較
- 傳播策略比較

## 競爭優勢與劣勢
- 我們的優勢（Advantage）
- 我們的劣勢（Disadvantage）
- 競品的價格防線
- 競品的渠道佈局

## 差異化機會
- 未被滿足的市場空白
- 可突破的競爭弱點
- 獨特價值主張建議

# 聲量估算
- 估算各競品的市場聲量佔有率 (SOV)
- 分析社群討論熱度
- 評估廣告投放強度

<輸出格式>：
- 使用表格呈現競品對比
- 引用最新廣告素材與數據（2026 年）
- 提供具體的差異化建議
- 標註資料來源

<目標>：產出《競爭格局分析與差異化機會矩陣》`;

  const result = await perplexityService.research(query, {
    systemPrompt,
    maxTokens: 3000,
    searchRecency: 'week',
    temperature: 0.3,
  });

  modelsUsed.push({
    model: 'Perplexity Sonar Pro',
    model_id: 'sonar-pro',
    usage: result.usage || {}
  });

  return {
    competitor_report: result.content,
    sources: result.citations || [],
    _meta: {
      models_used: modelsUsed,
      note: 'Competitive intelligence with real-time market data'
    }
  };
}

async function competitorWithClaude(client_name, brief, modelSelection = 'haiku', modelsUsed = []) {
  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `# Role: 競爭情報專家 (Competitor Analysis Agent)

<背景>：你是一位商業間諜與競爭情報專家（CI Expert），在動態競爭中尋找差異化空間，監控競品的產品、定價與聲量。

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>，請執行以下分析：

**競爭雷達建構**
列出 2-3 個直接競爭者與 1-2 個間接（注意力）競爭者。

**標竿管理 (Benchmarking)**
分析其服務/產品組合、定位、視覺調性、核心標語（Slogan）。

**最新動態掃描**
檢索其最新產品、促銷活動、社群表現與廣告投放邏輯。

**差異化診斷**
對比本品牌，分析我們的競爭優勢（Advantage）與劣勢（Disadvantage），並評估競品的價格防線與渠道佈局。

<輸出格式>：以下 JSON 格式

{
  "competitive_radar": {
    "direct_competitors": [
      {
        "name": "競品名稱",
        "category": "產品類別",
        "market_position": "市場定位",
        "selection_rationale": "選擇理由"
      }
    ],
    "indirect_competitors": [
      {
        "name": "間接競品名稱",
        "type": "注意力競爭類型",
        "threat_level": "威脅程度"
      }
    ]
  },
  "benchmarking": [
    {
      "competitor": "競品名稱",
      "product_portfolio": ["產品1", "產品2"],
      "positioning_statement": "定位陳述",
      "visual_style": "視覺風格描述",
      "core_slogan": "核心標語",
      "pricing_strategy": "價格策略描述"
    }
  ],
  "latest_activities": [
    {
      "competitor": "競品名稱",
      "new_products": ["新產品1"],
      "promotions": ["促銷活動1"],
      "social_performance": {
        "followers": "粉絲數",
        "engagement_rate": "互動率",
        "content_strategy": "內容策略"
      },
      "ad_strategy": {
        "platforms": ["投放平台1", "投放平台2"],
        "creative_approach": "創意手法",
        "estimated_budget": "預估預算"
      }
    }
  ],
  "differentiation_analysis": {
    "comparison_matrix": [
      {
        "dimension": "比較維度",
        "our_brand": "我們的表現",
        "competitor_1": "競品1表現",
        "competitor_2": "競品2表現"
      }
    ],
    "our_advantages": ["優勢1", "優勢2"],
    "our_disadvantages": ["劣勢1", "劣勢2"],
    "competitor_strengths": {
      "price_defense": "價格防線分析",
      "channel_coverage": "渠道佈局分析",
      "brand_equity": "品牌資產分析"
    },
    "differentiation_opportunities": {
      "market_gaps": ["市場空白1", "市場空白2"],
      "competitive_weaknesses": ["可突破弱點1", "可突破弱點2"],
      "unique_value_proposition": "獨特價值主張建議"
    }
  },
  "voice_share_analysis": {
    "estimated_sov": [
      {"competitor": "競品名稱", "sov_percentage": "佔比"}
    ],
    "social_buzz": {
      "discussion_volume": "討論量",
      "sentiment": "情緒傾向",
      "trending_topics": ["熱門話題1"]
    },
    "ad_intensity": {
      "display_frequency": "廣告頻次估計",
      "reach_estimate": "觸及估計"
    }
  }
}`,
      },
    ],
  });

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

async function competitorWithDeepSeek(client_name, brief, modelSelection, no_fallback = false, modelsUsed = []) {
  const systemPrompt = `# Role: 競爭情報專家 (Competitor Analysis Agent)

<背景>：你是一位商業間諜與競爭情報專家（CI Expert），在動態競爭中尋找差異化空間，監控競品的產品、定價與聲量。你擅長運用標竿管理、SWOT 分析等工具進行競爭診斷。`;

  const userPrompt = `請針對以下品牌進行「競爭格局分析與差異化機會矩陣」。

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>，Let's think this step by step：

**競爭雷達建構**
列出直接與間接競爭者。

**標竿管理**
分析競品的產品組合、定位、視覺調性與價格策略。

**最新動態掃描**
檢索競品最新動態（產品、促銷、廣告）。

**差異化診斷**
對比分析，找出優勢、劣勢與差異化機會。

<輸出格式>：必須輸出 JSON 格式，包含 competitive_radar, benchmarking, latest_activities, differentiation_analysis, voice_share_analysis 等欄位。

請確保分析基於市場事實，並提供可執行的差異化建議。`;

  let result;
  try {
    result = await deepseekService.reason(userPrompt, { systemPrompt });

    modelsUsed.push({
      model: 'DeepSeek R1',
      model_id: 'deepseek-reasoner',
      usage: result.usage || {}
    });

    return {
      ...result.analysis,
      _meta: {
        models_used: modelsUsed,
        reasoning_process: result.reasoning_process,
        note: 'Competitive analysis with deep reasoning'
      }
    };
  } catch (error) {
    if (no_fallback) {
      throw error;
    }
    console.warn('DeepSeek API unavailable, falling back to Claude');
    return await competitorWithClaude(client_name, brief, modelSelection, modelsUsed);
  }
}

module.exports = {
  analyzeCompetitor,
};
