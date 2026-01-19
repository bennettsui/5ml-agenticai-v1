const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');
const { getClaudeModel, getModelDisplayName, shouldUsePerplexity, shouldUseDeepSeek } = require('../utils/modelHelper');
const deepseekService = require('../services/deepseekService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Customer Insight Agent (用戶洞察專家)
 * Deep understanding of audience segmentation and psychological motivations
 */

async function analyzeCustomerInsight(client_name, brief, options = {}) {
  const { model: modelSelection = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  // Try Perplexity first if requested and available
  if (shouldUsePerplexity(modelSelection)) {
    try {
      console.log('🔍 Using Perplexity for customer insight research...');
      return await insightWithPerplexity(client_name, brief, modelsUsed);
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
      console.log('🤖 Using DeepSeek for customer insight analysis...');
      return await insightWithDeepSeek(client_name, brief, modelSelection, no_fallback, modelsUsed);
    } catch (error) {
      if (no_fallback) {
        throw new Error(`DeepSeek API error: ${error.message}`);
      }
      console.warn('⚠️ DeepSeek unavailable, falling back to Claude:', error.message);
    }
  }

  // Fallback to Claude-based analysis
  console.log('🤖 Using Claude for customer insight analysis...');
  return await insightWithClaude(client_name, brief, modelSelection, modelsUsed);
}

async function insightWithPerplexity(client_name, brief, modelsUsed = []) {
  const systemPrompt = `你是一位消費心理學家與市場細分專家。

<背景>：深入理解市場中的受眾分層與其心理動機，從「人」的角度定義品牌機會。你擅長分析消費者行為、心理特徵與決策路徑。`;

  const query = `請針對以下品牌進行「受眾深度洞察與 TA 定位建議」，必須使用最新網路資訊（2026 年）：

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>：

# 市場細分分析 (Segmentation)
- 分析該行業的所有用戶群體
- 提供各細分群體的簡要畫像
- 說明他們對本品牌的看法（認可/無感/反對）
- 列出每個細分群體的規模與價值

# TA 判定與分析
- 建議核心目標受眾（Target Audience）
- 說明選擇此 TA 的理由
- 分析次要受眾與潛在受眾

# 深度畫像 (Persona)
- 人口特徵：年齡、性別、收入、地理位置、職業
- 心理特徵 (Psychographics)：價值觀、生活方式、興趣愛好、媒體習慣
- 行為特徵：購買頻率、決策因素、資訊來源

# 心理路徑探究
## 同理心地圖 (Empathy Map)
- 他們看到什麼？（媒體接觸、資訊環境）
- 他們聽到什麼？（朋友意見、專家建議）
- 他們想什麼/感受什麼？（內心對話、情緒狀態）
- 他們說什麼/做什麼？（外顯行為、社交表現）

## 決策障礙分析
- 為什麼 TA 不買？（痛點、顧慮、阻礙）
- 需要克服哪些心理門檻？
- 競品如何影響決策？

## 購買誘因 (Moment of Truth)
- 什麼情境/觸發點會促使購買？
- 關鍵決策時刻是什麼？
- 需要哪些說服要素？

<輸出格式>：
- 使用清晰的段落和標題
- TA 畫像需具體且可執行
- 引用最新市場數據（2026 年）
- 提供行為洞察的數據支持

<目標>：產出《受眾深度洞察與 TA 定位建議》`;

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
    insight_report: result.content,
    sources: result.citations || [],
    _meta: {
      models_used: modelsUsed,
      note: 'Customer insight analysis with real-time market data'
    }
  };
}

async function insightWithClaude(client_name, brief, modelSelection = 'haiku', modelsUsed = []) {
  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `# Role: 用戶洞察專家 (Customer Insight Agent)

<背景>：你是一位消費心理學家與市場細分專家，深入理解市場中的受眾分層與其心理動機，從「人」的角度定義品牌機會。

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>，請執行以下分析：

**市場細分分析 (Segmentation)**
分析該行業的所有用戶群體，提供各細分群體的簡要畫像及他們對本品牌的看法（認可/無感/反對）。

**TA 判定與分析**
建議核心目標受眾（Target Audience），並說明理由。

**深度畫像 (Persona)**
針對核心 TA 構建：
- 人口特徵：年齡、性別、收入、地理位置、職業
- 心理特徵 (Psychographics)：價值觀、生活方式、興趣愛好
- 行為特徵：購買頻率、決策因素、資訊來源

**心理路徑探究**
製作「同理心地圖」（看到的、聽到的、想的/感受的、說的/做的），並分析：
- 決策障礙：為什麼 TA 不買？
- 購買誘因 (Moment of Truth)：什麼情境會促使購買？

<輸出格式>：以下 JSON 格式

{
  "market_segmentation": [
    {
      "segment_name": "細分群體名稱",
      "description": "群體畫像描述",
      "brand_perception": "認可/無感/反對",
      "market_size": "規模估計",
      "value_potential": "價值潛力"
    }
  ],
  "target_audience": {
    "primary_ta": {
      "name": "核心 TA 名稱",
      "rationale": "選擇理由"
    },
    "secondary_ta": ["次要受眾1", "次要受眾2"]
  },
  "persona": {
    "demographics": {
      "age_range": "年齡範圍",
      "gender": "性別",
      "income_level": "收入水平",
      "location": "地理位置",
      "occupation": "職業"
    },
    "psychographics": {
      "values": ["價值觀1", "價值觀2"],
      "lifestyle": "生活方式描述",
      "interests": ["興趣1", "興趣2"],
      "media_habits": ["媒體習慣1", "媒體習慣2"]
    },
    "behaviors": {
      "purchase_frequency": "購買頻率",
      "decision_factors": ["決策因素1", "決策因素2"],
      "information_sources": ["資訊來源1", "資訊來源2"]
    }
  },
  "empathy_map": {
    "sees": ["看到的1", "看到的2"],
    "hears": ["聽到的1", "聽到的2"],
    "thinks_feels": ["想的/感受的1", "想的/感受的2"],
    "says_does": ["說的/做的1", "說的/做的2"]
  },
  "decision_barriers": {
    "why_not_buy": ["障礙1", "障礙2"],
    "psychological_thresholds": ["心理門檻1", "心理門檻2"],
    "competitor_influence": "競品影響描述"
  },
  "moment_of_truth": {
    "trigger_scenarios": ["觸發情境1", "觸發情境2"],
    "key_decision_moment": "關鍵決策時刻描述",
    "persuasion_elements": ["說服要素1", "說服要素2"]
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

async function insightWithDeepSeek(client_name, brief, modelSelection, no_fallback = false, modelsUsed = []) {
  const systemPrompt = `# Role: 用戶洞察專家 (Customer Insight Agent)

<背景>：你是一位消費心理學家與市場細分專家，深入理解市場中的受眾分層與其心理動機，從「人」的角度定義品牌機會。你擅長運用消費者行為學、心理學理論進行深度分析。`;

  const userPrompt = `請針對以下品牌進行「受眾深度洞察與 TA 定位建議」。

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>，Let's think this step by step：

**市場細分分析 (Segmentation)**
分析該行業的所有用戶群體，提供各細分群體的簡要畫像及他們對本品牌的看法。

**TA 判定與分析**
建議核心目標受眾，並說明選擇理由。

**深度畫像 (Persona)**
構建核心 TA 的人口特徵、心理特徵與行為特徵。

**心理路徑探究**
製作同理心地圖，分析決策障礙與購買誘因。

<輸出格式>：必須輸出 JSON 格式，包含 market_segmentation, target_audience, persona, empathy_map, decision_barriers, moment_of_truth 等欄位。

請確保分析具體、可執行，並基於消費者心理學原理。`;

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
        note: 'Customer insight analysis with deep reasoning'
      }
    };
  } catch (error) {
    if (no_fallback) {
      throw error;
    }
    console.warn('DeepSeek API unavailable, falling back to Claude');
    return await insightWithClaude(client_name, brief, modelSelection, modelsUsed);
  }
}

module.exports = {
  analyzeCustomerInsight,
};
