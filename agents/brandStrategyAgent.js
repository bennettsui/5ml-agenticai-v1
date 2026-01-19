const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');
const { getClaudeModel, getModelDisplayName, shouldUsePerplexity, shouldUseDeepSeek } = require('../utils/modelHelper');
const deepseekService = require('../services/deepseekService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Brand Strategy Agent (品牌策略指揮官)
 * High-level strategic diagnosis and actionable recommendations
 */

async function analyzeBrandStrategy(client_name, brief, options = {}) {
  const { model: modelSelection = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  // Try Perplexity first if requested and available
  if (shouldUsePerplexity(modelSelection)) {
    try {
      console.log('🔍 Using Perplexity for brand strategy...');
      return await strategyWithPerplexity(client_name, brief, modelsUsed);
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
      console.log('🤖 Using DeepSeek for brand strategy...');
      return await strategyWithDeepSeek(client_name, brief, modelSelection, no_fallback, modelsUsed);
    } catch (error) {
      if (no_fallback) {
        throw new Error(`DeepSeek API error: ${error.message}`);
      }
      console.warn('⚠️ DeepSeek unavailable, falling back to Claude:', error.message);
    }
  }

  // Fallback to Claude-based analysis
  console.log('🤖 Using Claude for brand strategy...');
  return await strategyWithClaude(client_name, brief, modelSelection, modelsUsed);
}

async function strategyWithPerplexity(client_name, brief, modelsUsed = []) {
  const systemPrompt = `你是一位擁有 20 年經驗的品牌戰略長 (CSO)。

<背景>：整合品牌研究、用戶洞察與競爭情報，進行高階診斷，並產出可落地的行動策略。你擅長策略思維、品牌定位與資源配置決策。你必須使用最新資訊（2026 年）。`;

  const query = `請針對以下品牌進行「品牌戰略診斷書與行動藍圖」，必須使用最新網路資訊（2026 年）：

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>：

# 綜合現狀診斷

## 業務面診斷 (Business Goal)
- 當前業務優點與成功要素
- 當前業務弱點與限制因素
- 業務增長機會
- 資源配置是否合理

## 溝通面診斷 (Communication)
- 當前傳播優點（做得好的地方）
- 當前傳播弱點（需改進的地方）
- 訊息一致性評估
- 觸達效率分析

# SWOT 策略推導

基於 3Cs 資訊（Company, Customer, Competitor），產出升級版 SWOT 並提供行動建議：

## SO 策略 (Strengths-Opportunities)
利用優勢抓住機會的策略

## ST 策略 (Strengths-Threats)
利用優勢應對威脅的策略

## WO 策略 (Weaknesses-Opportunities)
克服弱點抓住機會的策略

## WT 策略 (Weaknesses-Threats)
減少弱點並避開威脅的策略

# 品牌靈魂定義

## 品牌原型 (Brand Archetype)
從 12 個原型中選擇最適合的：Hero, Magician, Explorer, Creator, Ruler, Caregiver, Innocent, Sage, Jester, Everyman, Lover, Rebel

## 語氣指南 (Tone of Voice)
- 品牌性格特質（3-5 個形容詞）
- 溝通風格（正式/親切/專業/幽默等）
- 禁忌用語與表達方式

# 核心決策輸出

## 重塑定位陳述 (Positioning Statement)
For [Target Audience], [Brand] is the [Frame of Reference] that [Point of Difference] because [Reason to Believe].

## 核心挑戰列表
按優先級排序的 3-5 個關鍵挑戰

## 戰略優先級（6-12 個月）
1. 短期（0-3 個月）
2. 中期（3-6 個月）
3. 長期（6-12 個月）

每個優先級包含：
- 行動項目
- 預期成果
- 資源需求
- 成功指標

# 行動藍圖

## 品牌層面
- 定位優化建議
- 視覺識別調整
- 品牌故事重塑

## 產品層面
- 產品組合優化
- 定價策略調整
- 服務體驗提升

## 傳播層面
- 核心訊息框架
- 渠道策略建議
- 內容主題規劃

## 執行層面
- 組織能力建設
- 預算配置建議
- KPI 設定

<輸出格式>：
- 每一項策略必須對應到前方的搜尋證據
- 使用清晰的結構與標題
- 提供可執行的行動項目
- 標註優先級與時間線
- 引用最新市場數據（2026 年）

<目標>：產出《品牌戰略診斷書與行動藍圖》`;

  const result = await perplexityService.research(query, {
    systemPrompt,
    maxTokens: 4000,
    searchRecency: 'week',
    temperature: 0.3,
  });

  modelsUsed.push({
    model: 'Perplexity Sonar Pro',
    model_id: 'sonar-pro',
    usage: result.usage || {}
  });

  return {
    strategy_report: result.content,
    sources: result.citations || [],
    _meta: {
      models_used: modelsUsed,
      note: 'Strategic brand diagnosis with real-time market intelligence'
    }
  };
}

async function strategyWithClaude(client_name, brief, modelSelection = 'haiku', modelsUsed = []) {
  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `# Role: 品牌策略指揮官 (Brand Strategy Agent)

<背景>：你是一位擁有 20 年經驗的品牌戰略長 (CSO)，整合品牌研究、用戶洞察與競爭情報，進行高階診斷，並產出可落地的行動策略。

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>，請執行以下高階策略分析：

**綜合現狀診斷**
- 業務面：目前的優點與弱點 (Business Goal)
- 溝通面：目前的優點與弱點 (Communication)

**SWOT 策略推導**
基於 3Cs 資訊，產出升級版 SWOT（包含 SO、ST、WO、WT 行動建議）

**品牌靈魂定義**
- 定義品牌原型 (Archetype)
- 語氣指南 (Tone of Voice)

**核心決策輸出**
- 重塑定位陳述 (Positioning Statement)
- 提煉核心挑戰
- 列出未來 6-12 個月的戰略優先級

<輸出格式>：以下 JSON 格式

{
  "comprehensive_diagnosis": {
    "business_diagnosis": {
      "strengths": ["業務優點1", "業務優點2"],
      "weaknesses": ["業務弱點1", "業務弱點2"],
      "growth_opportunities": ["增長機會1"],
      "resource_allocation": "資源配置評估"
    },
    "communication_diagnosis": {
      "strengths": ["傳播優點1", "傳播優點2"],
      "weaknesses": ["傳播弱點1", "傳播弱點2"],
      "message_consistency": "訊息一致性評估",
      "reach_efficiency": "觸達效率分析"
    }
  },
  "swot_strategy": {
    "swot_matrix": {
      "strengths": ["優勢1", "優勢2"],
      "weaknesses": ["劣勢1", "劣勢2"],
      "opportunities": ["機會1", "機會2"],
      "threats": ["威脅1", "威脅2"]
    },
    "strategic_actions": {
      "so_strategies": ["SO策略1：利用優勢抓住機會"],
      "st_strategies": ["ST策略1：利用優勢應對威脅"],
      "wo_strategies": ["WO策略1：克服弱點抓住機會"],
      "wt_strategies": ["WT策略1：減少弱點避開威脅"]
    }
  },
  "brand_soul": {
    "brand_archetype": {
      "primary": "主要原型名稱（Hero/Magician/Explorer等）",
      "secondary": "次要原型名稱",
      "rationale": "選擇理由"
    },
    "tone_of_voice": {
      "personality_traits": ["形容詞1", "形容詞2", "形容詞3"],
      "communication_style": "溝通風格描述",
      "do_say": ["適合說的1", "適合說的2"],
      "dont_say": ["禁忌用語1", "禁忌用語2"]
    }
  },
  "core_decisions": {
    "positioning_statement": {
      "target_audience": "目標受眾",
      "brand": "品牌名稱",
      "frame_of_reference": "競爭框架",
      "point_of_difference": "差異點",
      "reason_to_believe": "信任理由",
      "full_statement": "完整定位陳述句"
    },
    "core_challenges": [
      {
        "priority": 1,
        "challenge": "挑戰描述",
        "impact": "影響評估",
        "urgency": "緊急程度"
      }
    ],
    "strategic_priorities": {
      "short_term_0_3_months": [
        {
          "action": "行動項目",
          "expected_outcome": "預期成果",
          "resources_needed": "資源需求",
          "success_metrics": "成功指標"
        }
      ],
      "mid_term_3_6_months": [],
      "long_term_6_12_months": []
    }
  },
  "action_blueprint": {
    "brand_level": {
      "positioning_optimization": "定位優化建議",
      "visual_identity": "視覺識別調整",
      "brand_story": "品牌故事重塑"
    },
    "product_level": {
      "portfolio_optimization": "產品組合優化",
      "pricing_strategy": "定價策略調整",
      "service_experience": "服務體驗提升"
    },
    "communication_level": {
      "core_messaging": "核心訊息框架",
      "channel_strategy": "渠道策略建議",
      "content_themes": ["內容主題1", "內容主題2"]
    },
    "execution_level": {
      "capability_building": "組織能力建設",
      "budget_allocation": "預算配置建議",
      "kpi_framework": {
        "business_kpis": ["業務KPI1"],
        "brand_kpis": ["品牌KPI1"],
        "communication_kpis": ["傳播KPI1"]
      }
    }
  }
}

請確保：
1. 每一項策略必須有邏輯依據
2. 行動建議具體可執行
3. 優先級清晰明確
4. 資源需求實際可行`,
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

async function strategyWithDeepSeek(client_name, brief, modelSelection, no_fallback = false, modelsUsed = []) {
  const systemPrompt = `# Role: 品牌策略指揮官 (Brand Strategy Agent)

<背景>：你是一位擁有 20 年經驗的品牌戰略長 (CSO)，整合品牌研究、用戶洞察與競爭情報，進行高階診斷，並產出可落地的行動策略。你擅長策略思維、資源配置與優先級判斷。`;

  const userPrompt = `請針對以下品牌進行「品牌戰略診斷書與行動藍圖」。

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>，Let's think this step by step：

**綜合現狀診斷**
業務面與溝通面的優勢、弱點分析。

**SWOT 策略推導**
基於 3Cs，產出 SWOT 與 SO/ST/WO/WT 行動建議。

**品牌靈魂定義**
定義品牌原型與語氣指南。

**核心決策輸出**
重塑定位陳述、核心挑戰、6-12 個月戰略優先級。

**行動藍圖**
品牌層面、產品層面、傳播層面、執行層面的具體行動。

<輸出格式>：必須輸出 JSON 格式，包含 comprehensive_diagnosis, swot_strategy, brand_soul, core_decisions, action_blueprint 等欄位。

請確保策略具體、可執行，並有明確的優先級與時間線。`;

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
        note: 'Strategic brand diagnosis with deep reasoning'
      }
    };
  } catch (error) {
    if (no_fallback) {
      throw error;
    }
    console.warn('DeepSeek API unavailable, falling back to Claude');
    return await strategyWithClaude(client_name, brief, modelSelection, modelsUsed);
  }
}

module.exports = {
  analyzeBrandStrategy,
};
