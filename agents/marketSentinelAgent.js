const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');
const { getClaudeModel, getModelDisplayName, shouldUsePerplexity, shouldUseDeepSeek } = require('../utils/modelHelper');
const deepseekService = require('../services/deepseekService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Competitive Review Agent (市場掃描哨兵)
 * Tactical market monitoring and creative trend analysis
 *
 * Capabilities:
 * - Daily/weekly product & promotion monitoring
 * - Ad creative breakdown (hooks, visual logic, CTA)
 * - Influencer tracking (KOL endorsement quality)
 * - Media clipping & sentiment analysis
 * - Trend detection (keywords, emerging content formats)
 *
 * Time Focus: Latest 24 hours or this week only
 */

async function monitorMarketTrends(client_name, brief, options = {}) {
  const { model: modelSelection = 'deepseek', no_fallback = false } = options;
  const modelsUsed = [];

  // Prefer Perplexity for real-time monitoring
  if (shouldUsePerplexity(modelSelection) || modelSelection === 'perplexity') {
    try {
      return await monitorWithPerplexity(client_name, brief, modelsUsed);
    } catch (error) {
      if (no_fallback) {
        throw new Error(`Perplexity API error: ${error.message}`);
      }
      console.warn('⚠️ Perplexity unavailable, falling back to DeepSeek:', error.message);
    }
  }

  // Use DeepSeek if selected
  if (shouldUseDeepSeek(modelSelection)) {
    try {
      return await monitorWithDeepSeek(client_name, brief, modelSelection, no_fallback, modelsUsed);
    } catch (error) {
      if (no_fallback) {
        throw new Error(`DeepSeek API error: ${error.message}`);
      }
      console.warn('⚠️ DeepSeek unavailable, falling back to Claude:', error.message);
    }
  }

  // Fallback to Claude
  return await monitorWithClaude(client_name, brief, modelSelection, modelsUsed);
}

async function monitorWithPerplexity(client_name, brief, modelsUsed = []) {
  const systemPrompt = `你是一位專業的「市場掃描哨兵」（Competitive Review Agent），專注於戰術級的市場監控與創意趨勢分析。你是數位行銷監控員與創意審查員。你必須使用最新資訊（2026年），且僅關注「最新 24 小時」或「本週」的動態。`;

  const query = `請針對品牌「${client_name}」進行戰術級市場監測，必須使用最新網路資訊（最新24小時或本週）：

**項目簡報**: ${brief}

<任務要求>：

# 1. 日常/週常監測

## 產品與促銷
- 新產品上架（本週）
- 限時活動與優惠
- 快閃店動態
- 產品組合變化

## 廣告素材拆解
- Google Ads / Facebook Ads 最新素材
- 素材鉤子 (Hooks) 分析：開頭如何抓住注意力
- 視覺邏輯：色彩、排版、文案層次
- CTA (Call-to-Action) 設計與轉化邏輯
- **推理追蹤**：為何這個廣告有效/無效？

## 影響力追蹤
- KOL 代言質量評估
- 網紅參與度分析（Branding vs. ROI）
- 內容合作形式（業配/聯名/代言）
- 粉絲互動數據（讚/留言/分享）

# 2. 媒體與輿情

## 媒體剪報 (Media Clippings)
- 收集本週相關新聞報導
- 正面/負面情緒分析
- 媒體聲量趨勢
- 關鍵媒體來源

## 輿情監測
- 社群平台情緒分析（小紅書/Dcard/PTT）
- 危機預警（負面評論擴散）
- 品牌提及量變化

# 3. 趨勢預警

## 關鍵字搜尋趨勢
- 行業熱搜關鍵字（本週）
- 品牌相關搜尋量變化
- 新興需求信號

## 新興內容格式
- AI 生成素材應用（AIGC）
- 短影音趨勢（TikTok/YouTube Shorts/Reels）
- 互動式內容（AR/VR/Live）
- 新興平台或功能

<時效要求>：
- **僅關注「最新 24 小時」或「本週」的動態**
- 所有資訊必須標註時間戳記
- 過期資訊（超過一週）不納入分析

<推理要求>：
- 分析競品廣告素材為何有效/無效
- 拆解創意邏輯與轉化路徑
- 提供可學習的洞察

<輸出格式>：
- 必須標註所有資訊的來源與精確時間
- 使用結構化格式（JSON或清晰的段落）
- 對每個素材提供「為何有效/無效」的推理
- 提供可操作的戰術建議

<目標>：產出《市場情報速遞與創意趨勢報告》`;

  const result = await perplexityService.research(query, {
    systemPrompt,
    maxTokens: 4000,
    searchRecency: 'week', // Recent data only
    temperature: 0.3,
  });

  modelsUsed.push({
    model: 'Perplexity Sonar Pro',
    model_id: 'sonar-pro',
    usage: result.usage || {}
  });

  return {
    competitive_review: result.content,
    sources: result.citations || [],
    _meta: {
      models_used: modelsUsed,
      note: 'Tactical market monitoring with ad creative breakdown and trend analysis (Latest 24h/week)',
      agent: '市場掃描哨兵 (Competitive Review Agent)'
    }
  };
}

async function monitorWithDeepSeek(client_name, brief, modelSelection, no_fallback, modelsUsed = []) {
  const systemPrompt = `你是一位專業的「市場掃描哨兵」（Competitive Review Agent），是數位行銷監控員與創意審查員。

你的任務是對品牌「${client_name}」進行戰術級市場監測，包括：
1. 日常/週常監測（產品、促銷、廣告素材拆解、KOL追蹤）
2. 媒體剪報與輿情分析
3. 趨勢預警（關鍵字、新興內容格式如AI生成素材、短影音）

**時效要求**：僅關注「最新 24 小時」或「本週」的動態
**推理要求**：分析競品廣告素材為何有效/無效

請基於數據分析產出結構化報告。`;

  const userPrompt = `**項目簡報**: ${brief}

請產出《市場情報速遞與創意趨勢報告》，包含：
1. 日常/週常監測
   - 產品與促銷（新品上架、限時活動、快閃店）
   - 廣告素材拆解（hooks、視覺邏輯、CTA + 推理為何有效/無效）
   - 影響力追蹤（KOL質量、參與度）

2. 媒體與輿情
   - 媒體剪報（本週新聞、情緒分析）
   - 輿情監測（社群平台、危機預警）

3. 趨勢預警
   - 關鍵字搜尋趨勢（本週）
   - 新興內容格式（AI生成素材、短影音、AR/VR）

以JSON格式輸出，包含以下結構：
{
  "daily_weekly_monitoring": {
    "products_promotions": [...],
    "ad_creative_breakdown": [
      {
        "platform": "...",
        "creative_hooks": "...",
        "visual_logic": "...",
        "cta_design": "...",
        "effectiveness_reasoning": "為何有效/無效的分析"
      }
    ],
    "influencer_tracking": [...]
  },
  "media_sentiment": {
    "media_clippings": [...],
    "voc_monitoring": {...}
  },
  "trend_warnings": {
    "keyword_trends": [...],
    "emerging_formats": [...]
  }
}

**重要**: 所有資訊必須標註時間戳記，僅採用最新24小時或本週的數據`;

  try {
    const result = await deepseekService.analyze(systemPrompt, userPrompt, {
      maxTokens: 4000,
      temperature: 0.3,
    });

    modelsUsed.push({
      model: getModelDisplayName(modelSelection),
      model_id: 'deepseek-reasoner',
      usage: result.usage || {},
      reasoning_process: result.reasoning_process
    });

    let parsedContent;
    try {
      parsedContent = JSON.parse(result.content);
    } catch (e) {
      parsedContent = { raw_analysis: result.content };
    }

    return {
      competitive_review: parsedContent,
      reasoning_process: result.reasoning_process,
      _meta: {
        models_used: modelsUsed,
        reasoning_process: result.reasoning_process,
        note: 'Tactical market monitoring with ad creative breakdown (Latest 24h/week)',
        agent: '市場掃描哨兵 (Competitive Review Agent)'
      }
    };
  } catch (error) {
    if (no_fallback) {
      throw error;
    }
    console.warn('DeepSeek API unavailable, falling back to Claude');
    return await monitorWithClaude(client_name, brief, modelSelection, modelsUsed);
  }
}

async function monitorWithClaude(client_name, brief, modelSelection = 'haiku', modelsUsed = []) {
  const claudeModel = getClaudeModel(modelSelection);

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `# Role: 市場掃描哨兵 (Competitive Review Agent)

<背景>：提供長期的、戰術級的市場監控，捕捉細微的市場變化與創意趨勢。
<角色>：你是一位數位行銷監控員與創意審查員。

**品牌名稱**: ${client_name}
**項目簡報**: ${brief}

<任務要求>，請執行以下戰術級監測分析：

**1. 日常/週常監測**
- 產品與促銷：新產品上架、限時活動、快閃店動態
- 廣告素材拆解：分析 Google/FB Ads 的素材鉤子 (Hooks)、視覺邏輯與 CTA
- 影響力追蹤：監測 KOL 代言質量、網紅參與度（Branding vs. ROI）

**2. 媒體與輿情**
- 收集媒體剪報 (Media Clippings) 並進行正負面情緒分析
- 社群平台輿情（小紅書/Dcard/PTT）
- 危機預警（負面評論擴散）

**3. 趨勢預警**
- 識別行業內的關鍵字搜尋趨勢
- 新興內容格式（如：AI 生成素材、短影音趨勢）

<時效要求>：
- **僅關注「最新 24 小時」或「本週」的動態**
- 所有資訊必須標註時間戳記

<推理追蹤>：
- 分析競品廣告素材為何有效/無效

<輸出格式>：以JSON格式輸出，結構如下：
{
  "daily_weekly_monitoring": {
    "products_promotions": [],
    "ad_creative_breakdown": [
      { "platform": "", "hooks": "", "visual_logic": "", "cta": "", "effectiveness_reasoning": "" }
    ],
    "influencer_tracking": []
  },
  "media_sentiment": {
    "media_clippings": [],
    "voc_monitoring": {}
  },
  "trend_warnings": {
    "keyword_trends": [],
    "emerging_formats": []
  }
}

<目標>：產出《市場情報速遞與創意趨勢報告》`
      }
    ]
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';

  modelsUsed.push({
    model: getModelDisplayName(modelSelection),
    model_id: claudeModel,
    usage: response.usage
  });

  let parsedContent;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedContent = JSON.parse(jsonMatch[0]);
    } else {
      parsedContent = { raw_analysis: content };
    }
  } catch (e) {
    parsedContent = { raw_analysis: content };
  }

  return {
    competitive_review: parsedContent,
    _meta: {
      models_used: modelsUsed,
      note: 'Tactical market monitoring with ad creative breakdown (Latest 24h/week)',
      agent: '市場掃描哨兵 (Competitive Review Agent)'
    }
  };
}

module.exports = {
  monitorMarketTrends,
};
