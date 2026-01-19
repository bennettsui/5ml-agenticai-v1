const Anthropic = require('@anthropic-ai/sdk');
const perplexityService = require('../services/perplexityService');
const { getClaudeModel, getModelDisplayName, shouldUsePerplexity, shouldUseDeepSeek } = require('../utils/modelHelper');
const deepseekService = require('../services/deepseekService');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Market Sentinel Agent (市場哨兵)
 * Real-time market monitoring and trend analysis
 *
 * Capabilities:
 * - Latest news monitoring (past 3 months)
 * - Social media VOC (小紅書/Dcard/Google Reviews)
 * - Competitor advertising campaigns
 * - Market trend detection
 * - Early warning signals
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
  const systemPrompt = `你是一位專業的「市場哨兵」（Market Sentinel），專注於實時市場監測與趨勢分析。你必須使用最新資訊（2026年）。`;

  const query = `請針對品牌「${client_name}」進行市場監測，必須使用最新網路資訊（過去3個月）：

**項目簡報**: ${brief}

<任務要求>：

# 新聞動態監測 (Recent 3 Months)

## 品牌相關新聞
- 最新產品發布
- 重大商業動作（融資、併購、擴張）
- 危機事件或爭議
- 獎項與認可

## 行業趨勢新聞
- 市場規模變化
- 技術創新
- 法規政策變動
- 消費者行為轉變

# 社群輿情分析 (VOC - Voice of Customer)

## 小紅書 (Xiaohongshu)
- 熱門討論話題
- 用戶評價趨勢（正面/負面）
- KOL 提及情況
- 爆款內容分析

## Dcard / PTT
- 討論聲量趨勢
- 主要爭議點
- 品牌形象評價

## Google Reviews
- 平均評分趨勢
- 高頻關鍵詞（好評/差評）
- 服務問題識別

# 競品廣告監測

## 最新 Campaign
- 2-3個主要競品的最新廣告活動
- 創意主題與視覺風格
- 投放渠道與預算估算
- 效果表現（如有數據）

## 廣告策略分析
- 主打賣點變化
- 目標受眾調整
- 季節性/節慶性活動

# 市場早期預警

## 機會信號
- 新興需求點
- 競品弱勢領域
- 政策利好

## 威脅信號
- 負面輿情擴散
- 競品強勢動作
- 市場飽和跡象

<輸出格式>：
- 必須標註所有資訊的來源與時間
- 使用結構化格式（JSON或清晰的段落）
- 對趨勢做出明確判斷（上升/下降/穩定）
- 提供可操作的早期預警建議

<目標>：產出《市場監測與趨勢預警報告》`;

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
    market_monitoring: result.content,
    sources: result.citations || [],
    _meta: {
      models_used: modelsUsed,
      note: 'Real-time market monitoring with latest news and VOC analysis',
      agent: '市場哨兵 (Market Sentinel)'
    }
  };
}

async function monitorWithDeepSeek(client_name, brief, modelSelection, no_fallback, modelsUsed = []) {
  const systemPrompt = `你是一位專業的「市場哨兵」（Market Sentinel），專注於實時市場監測與趨勢分析。

你的任務是監測品牌「${client_name}」的市場動態，包括：
1. 最新新聞（過去3個月）
2. 社群輿情（小紅書/Dcard/Google Reviews）
3. 競品廣告活動
4. 市場早期預警信號

請基於數據分析產出結構化報告。`;

  const userPrompt = `**項目簡報**: ${brief}

請產出《市場監測與趨勢預警報告》，包含：
1. 新聞動態監測（品牌相關新聞 + 行業趨勢）
2. 社群輿情分析（小紅書 + Dcard/PTT + Google Reviews）
3. 競品廣告監測（最新Campaign + 廣告策略）
4. 市場早期預警（機會信號 + 威脅信號）

以JSON格式輸出，包含以下結構：
{
  "news_monitoring": {
    "brand_news": [...],
    "industry_trends": [...]
  },
  "voc_analysis": {
    "xiaohongshu": {...},
    "dcard_ptt": {...},
    "google_reviews": {...}
  },
  "competitor_ads": {
    "latest_campaigns": [...],
    "strategy_analysis": {...}
  },
  "early_warning": {
    "opportunities": [...],
    "threats": [...]
  }
}`;

  try {
    const result = await deepseekService.research(userPrompt, {
      systemPrompt,
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
      market_monitoring: parsedContent,
      reasoning_process: result.reasoning_process,
      _meta: {
        models_used: modelsUsed,
        reasoning_process: result.reasoning_process,
        note: 'Market monitoring with reasoning analysis',
        agent: '市場哨兵 (Market Sentinel)'
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
        content: `# Role: 市場哨兵 (Market Sentinel)

<背景>：你是一位市場監測專家，負責追蹤品牌的實時市場動態、社群輿情、競品活動，並提供早期預警。

**品牌名稱**: ${client_name}
**項目簡報**: ${brief}

<任務要求>，請執行以下監測分析：

**新聞動態監測**
- 品牌相關新聞（最新產品、商業動作、危機事件）
- 行業趨勢新聞（市場變化、技術創新、政策法規）

**社群輿情分析**
- 小紅書：熱門話題、用戶評價、KOL提及
- Dcard/PTT：討論聲量、主要爭議、品牌形象
- Google Reviews：評分趨勢、高頻關鍵詞、服務問題

**競品廣告監測**
- 最新Campaign（2-3個主要競品）
- 廣告策略分析（賣點、受眾、渠道）

**市場早期預警**
- 機會信號（新興需求、競品弱勢、政策利好）
- 威脅信號（負面輿情、競品強勢、市場飽和）

<輸出格式>：以JSON格式輸出，結構如下：
{
  "news_monitoring": { "brand_news": [], "industry_trends": [] },
  "voc_analysis": { "xiaohongshu": {}, "dcard_ptt": {}, "google_reviews": {} },
  "competitor_ads": { "latest_campaigns": [], "strategy_analysis": {} },
  "early_warning": { "opportunities": [], "threats": [] }
}

<目標>：產出《市場監測與趨勢預警報告》`
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
    market_monitoring: parsedContent,
    _meta: {
      models_used: modelsUsed,
      note: 'Market monitoring analysis',
      agent: '市場哨兵 (Market Sentinel)'
    }
  };
}

module.exports = {
  monitorMarketTrends,
};
