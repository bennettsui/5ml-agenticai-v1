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
  const systemPrompt = `你是一位資深品牌審計官（Brand Auditor）與企業情報員。

<背景>：作為診斷的起點，你結合了實時新聞檢索與品牌資產審計，確保分析基於最新事實而非 AI 的過往記憶。你的分析必須基於 2026 年最新資訊。`;

  const query = `請針對以下品牌進行「品牌現狀實時掃描與資產審計」，必須使用最新網路資訊（2026 年）：

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>：

# 第一階段：資料充足性檢查
檢查輸入是否包含品牌名、行業。若不足，請列出需補充的關鍵問題（如：特定的業務範疇）。

# 第二階段：實時情報收集（必須上網搜尋 2026 年最新資訊）

## 動態掃描
- 檢索過去 3 個月的新聞（好消息/壞消息）
- 近期財報動向
- Campaign 活動與 Press Release
- 官網與社群更新

## 產品與定價解構
- 分析主力產品線、SKU 概況
- 價格帶分析
- 識別「價格錨點」（入門款 vs. 利潤款）
**要求：使用表格格式呈現產品與定價**

## 定位驗證
- 尋找官方 Positioning Statement
- 與社群平台（Google Reviews, 小紅書, Dcard 等）的用戶 VOC 對比
- 找出「官方說法」與「市場感知」的落差
**要求：VOC 需分類為正面與負面**

## 品牌資產審計
- 評估品牌遺產 (Heritage) 與 Owned Media（官網/社群）的一致性
- 識別聲譽風險

# 第三階段：3Cs 與 SWOT 分析
- Company：業務模式、核心競爭力、資源限制
- Customer：目標受眾、購買動機、未滿足需求
- Competitor：主要競爭對手（2-3 個）及其策略
- SWOT：優勢、劣勢、機會、威脅

# 第四階段：現狀診斷
- 當前行銷策略解讀
- 定位錯位分析（若有）
- 核心挑戰（業務、品牌、競爭、執行）
- 機會清單

# 第五階段：推理追蹤
說明為何判斷該品牌存在定位錯位（若有），並解釋你的分析邏輯。

<輸出格式>：
- 產品與定價：必須使用表格
- VOC 分析：必須分類正負面
- 使用清晰的段落和標題
- 引用最新資料來源（2026 年）

<目標>：產出《品牌現狀實時掃描與資產審計報告》`;

  const result = await perplexityService.research(query, {
    systemPrompt,
    maxTokens: 3000,
    searchRecency: 'week',
    temperature: 0.3,
  });

  // Track Perplexity usage
  modelsUsed.push({
    model: 'Perplexity Sonar Pro',
    model_id: 'sonar-pro',
    usage: result.usage || {}
  });

  return {
    research_report: result.content,
    sources: result.citations || [],
    _meta: {
      models_used: modelsUsed,
      note: 'Web-based research with real-time information'
    }
  };
}

async function researchWithClaude(client_name, brief, modelSelection = 'haiku', modelsUsed = []) {
  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `# Role: 品牌現狀研究專家 (Brand Research Agent)

<背景>：作為診斷的起點，你是一位資深品牌審計官（Brand Auditor）與企業情報員，結合了實時新聞檢索與品牌資產審計，確保分析基於最新事實而非 AI 的過往記憶。

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>，請依照以下工作流程執行，Let's think this step by step：

**第一階段：資料充足性檢查**
檢查輸入是否包含品牌名、行業。若不足，請在 data_sufficiency_check 中列出需補充的關鍵問題（如：特定的業務範疇）。

**第二階段：實時情報收集（強制執行：必須搜尋 2026 年最新資訊）**
- 動態掃描：過去 3 個月的新聞（好消息/壞消息）、近期財報動向、Campaign、Press Release、官網與社群更新
- 產品與定價解構：主力產品線、SKU 概況、價格帶、識別「價格錨點」（入門款 vs. 利潤款）
- 定位驗證：官方 Positioning Statement、社群平台（Google Reviews, 小紅書, Dcard）的用戶 VOC、找出「官方說法」與「市場感知」的落差
- 品牌資產審計：評估品牌遺產 (Heritage) 與 Owned Media（官網/社群）的一致性、識別聲譽風險

**第三階段：3Cs 與 SWOT 分析**
- Company：業務模式、核心競爭力、資源限制
- Customer：目標受眾畫像、購買動機、未滿足需求
- Competitor：直接競品（2-3 個）與其策略、社群表現、差異點
- SWOT 推導：優勢、劣勢、機會、威脅

**第四階段：現狀診斷**
- 策略解讀：分析近期行銷手法（KOL 合作、廣告手法、內容風格）及其背後邏輯
- 定位對位：診斷「官方想說的」與「用戶感受到的」是否存在落差
- 核心挑戰：提煉品牌面臨的業務、品牌、競爭及執行四大挑戰
- 機會清單：列出未開發的受眾、平台或未被講述的品牌故事

**第五階段：推理追蹤**
記錄思考過程與判斷依據，說明為何判斷該品牌存在定位錯位（若有）

<目標>：產出《品牌現狀實時掃描與資產審計報告》

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "data_sufficiency_check": "資訊是否充足的評估，若不足請列出需補充的關鍵問題",
  "realtime_intelligence": {
    "recent_news_good": ["好消息1（含時間：2026/X）", "好消息2"],
    "recent_news_bad": ["壞消息1（含時間）"],
    "financial_reports": ["財報動向1"],
    "campaigns": ["Campaign 1", "Press Release 1"],
    "social_updates": ["官網更新1", "社群更新1"]
  },
  "product_pricing": {
    "main_products": [
      {"product": "產品名", "sku": "SKU 數量", "price_range": "價格範圍", "anchor_type": "入門款/利潤款"}
    ],
    "price_analysis": "價格錨點分析與策略"
  },
  "positioning_verification": {
    "official_statement": "官方定位聲明",
    "user_perception_voc_positive": ["正面 VOC 1", "正面 VOC 2"],
    "user_perception_voc_negative": ["負面 VOC 1", "負面 VOC 2"],
    "media_description": "媒體描述",
    "positioning_gap": "官方說法與市場感知的落差分析"
  },
  "brand_asset_audit": {
    "heritage": "品牌遺產描述",
    "owned_media_consistency": "官網與社群的一致性評估",
    "reputation_risks": ["聲譽風險1", "聲譽風險2"]
  },
  "three_cs_analysis": {
    "company": {
      "business_model": "業務模式描述",
      "core_competencies": ["核心競爭力1", "核心競爭力2"],
      "resource_constraints": ["限制1", "限制2"]
    },
    "customer": {
      "target_audience": "目標受眾畫像",
      "purchase_motivation": ["動機1", "動機2"],
      "unmet_needs": ["未滿足需求1", "未滿足需求2"]
    },
    "competitor": [
      {"name": "競品1", "positioning": "定位", "social_performance": "社群表現", "differentiation": "差異點"}
    ]
  },
  "swot_analysis": {
    "strengths": ["優勢1", "優勢2"],
    "weaknesses": ["劣勢1", "劣勢2"],
    "opportunities": ["機會1", "機會2"],
    "threats": ["威脅1", "威脅2"]
  },
  "status_diagnosis": {
    "marketing_strategy": {
      "kol_partnerships": ["KOL合作1"],
      "advertising_approach": "廣告手法描述",
      "content_style": "內容風格描述",
      "strategic_logic": "背後邏輯分析"
    },
    "core_challenges": {
      "business": "業務挑戰",
      "brand": "品牌挑戰",
      "competition": "競爭挑戰",
      "execution": "執行挑戰"
    },
    "opportunity_list": ["未開發受眾機會", "平台機會", "未被講述的品牌故事"]
  },
  "reasoning_tracking": "思考過程、判斷依據、為何存在定位錯位（若有）"
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
  const systemPrompt = `# Role: 品牌現狀研究專家 (Brand Research Agent)

<背景>：作為診斷的起點，你是一位資深品牌審計官（Brand Auditor）與企業情報員，結合了實時新聞檢索與品牌資產審計，確保分析基於最新事實而非 AI 的過往記憶。你具備極強的數據檢索能力，能從海量資訊中提煉出關鍵洞察，並運用 3Cs、SWOT 等框架進行邏輯嚴密的診斷。`;

  const userPrompt = `請針對以下品牌進行「品牌現狀實時掃描與資產審計」。

**品牌名稱**: ${client_name}
**研究簡報**: ${brief}

<任務要求>，請依照以下工作流程執行，Let's think this step by step：

**第一階段：資料充足性檢查**
檢查輸入是否包含品牌名、行業。若不足，請在 data_sufficiency_check 中列出需補充的關鍵問題（如：特定的業務範疇）。

**第二階段：實時情報收集（強制執行：必須搜尋 2026 年最新資訊）**
- 動態掃描：過去 3 個月的新聞（好消息/壞消息）、近期財報動向、Campaign、Press Release、官網與社群更新
- 產品與定價解構：主力產品線、SKU 概況、價格帶、識別「價格錨點」（入門款 vs. 利潤款）
- 定位驗證：官方 Positioning Statement、社群平台（Google Reviews, 小紅書, Dcard）的用戶 VOC、找出「官方說法」與「市場感知」的落差
- 品牌資產審計：評估品牌遺產 (Heritage) 與 Owned Media（官網/社群）的一致性、識別聲譽風險

**第三階段：3Cs 與 SWOT 分析**
- Company：業務模式、核心競爭力、資源限制
- Customer：目標受眾畫像、購買動機、未滿足需求
- Competitor：直接競品（2-3 個）與其策略、社群表現、差異點
- SWOT 推導：優勢、劣勢、機會、威脅

**第四階段：現狀診斷**
- 策略解讀：分析近期行銷手法（KOL 合作、廣告手法、內容風格）及其背後邏輯
- 定位對位：診斷「官方想說的」與「用戶感受到的」是否存在落差
- 核心挑戰：提煉品牌面臨的業務、品牌、競爭及執行四大挑戰
- 機會清單：列出未開發的受眾、平台或未被講述的品牌故事

**第五階段：推理追蹤**
記錄思考過程與判斷依據，說明為何判斷該品牌存在定位錯位（若有）

<目標>：產出《品牌現狀實時掃描與資產審計報告》

請返回 JSON 格式（只返回 JSON，不需要其他文本）:
{
  "data_sufficiency_check": "資訊是否充足的評估，若不足請列出需補充的關鍵問題",
  "realtime_intelligence": {
    "recent_news_good": ["好消息1（含時間：2026/X）", "好消息2"],
    "recent_news_bad": ["壞消息1（含時間）"],
    "financial_reports": ["財報動向1"],
    "campaigns": ["Campaign 1", "Press Release 1"],
    "social_updates": ["官網更新1", "社群更新1"]
  },
  "product_pricing": {
    "main_products": [
      {"product": "產品名", "sku": "SKU 數量", "price_range": "價格範圍", "anchor_type": "入門款/利潤款"}
    ],
    "price_analysis": "價格錨點分析與策略"
  },
  "positioning_verification": {
    "official_statement": "官方定位聲明",
    "user_perception_voc_positive": ["正面 VOC 1", "正面 VOC 2"],
    "user_perception_voc_negative": ["負面 VOC 1", "負面 VOC 2"],
    "media_description": "媒體描述",
    "positioning_gap": "官方說法與市場感知的落差分析"
  },
  "brand_asset_audit": {
    "heritage": "品牌遺產描述",
    "owned_media_consistency": "官網與社群的一致性評估",
    "reputation_risks": ["聲譽風險1", "聲譽風險2"]
  },
  "three_cs_analysis": {
    "company": {
      "business_model": "業務模式描述",
      "core_competencies": ["核心競爭力1", "核心競爭力2"],
      "resource_constraints": ["限制1", "限制2"]
    },
    "customer": {
      "target_audience": "目標受眾畫像",
      "purchase_motivation": ["動機1", "動機2"],
      "unmet_needs": ["未滿足需求1", "未滿足需求2"]
    },
    "competitor": [
      {"name": "競品1", "positioning": "定位", "social_performance": "社群表現", "differentiation": "差異點"}
    ]
  },
  "swot_analysis": {
    "strengths": ["優勢1", "優勢2"],
    "weaknesses": ["劣勢1", "劣勢2"],
    "opportunities": ["機會1", "機會2"],
    "threats": ["威脅1", "威脅2"]
  },
  "status_diagnosis": {
    "marketing_strategy": {
      "kol_partnerships": ["KOL合作1"],
      "advertising_approach": "廣告手法描述",
      "content_style": "內容風格描述",
      "strategic_logic": "背後邏輯分析"
    },
    "core_challenges": {
      "business": "業務挑戰",
      "brand": "品牌挑戰",
      "competition": "競爭挑戰",
      "execution": "執行挑戰"
    },
    "opportunity_list": ["未開發受眾機會", "平台機會", "未被講述的品牌故事"]
  },
  "reasoning_tracking": "思考過程、判斷依據、為何存在定位錯位（若有）"
}`;

  try {
    const result = await deepseekService.analyze(systemPrompt, userPrompt, {
      maxTokens: 4000,
      temperature: 0.3,
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

