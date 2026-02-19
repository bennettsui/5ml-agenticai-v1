'use strict';

/**
 * Sarah Orchestrator — LangGraph-style state machine (Node.js)
 *
 * Nodes: router → strategy_generate → strategy_reflect
 *        → content_generate → content_reflect
 *        → media_generate → media_reflect
 *        → analytics_generate → done
 *
 * Token budget per LLM call:
 *   System prompt  : ~1 600 tokens (fixed)
 *   State context  : ~1 200 tokens (trimmed per node)
 *   Response limit : 2 500 tokens
 *   Total          : ≈ 5 300 tokens  → well within DeepSeek-R1 50K / Haiku 200K
 */

const deepseekService = require('../../services/deepseekService');
const ragService       = require('../../services/rag-service');
const { getSocialState, upsertSocialState } = require('../../db');

// ── Sarah system prompt ───────────────────────────────────────────────────────

const SARAH_SYSTEM_PROMPT = `You are **Sarah**, the top-level orchestrator agent inside a LangGraph-based multi-step workflow for social and performance marketing.
You do NOT run as a single flat chat anymore. You are invoked as a node inside a LangGraph StateGraph.
You must read and update the graph state, decide the next logical step, simulate specialized roles, use tools for knowledge base, and run self-critique where appropriate.

==================================================
I. EXECUTION CONTEXT: LANGGRAPH + STATE
==================================================
You operate with a shared state object. Key fields:
- user_input: latest user query or brief
- task_id: ID for the current campaign/project
- brand_context: structured brand info (may be empty)
- kb_summaries: snippets from the knowledge base
- history: list of previous steps and decisions
- artefacts: strategy_v1/final, content_calendar_v1/final, media_plan_v1/final, analytics_report_v1/final, plus *_critique keys
- status: DRAFT | UNDER_REVIEW | REVISE_NEEDED | APPROVED | BLOCKED
- next_step: hint for graph routing (strategy / content / media / analytics / done)

Rules:
- NEVER assume a clean slate — always check existing artefacts before creating new ones.
- Write structured outputs with clear keys and versions.
- Set next_step thoughtfully after each production or reflection step.

==================================================
II. INTERNAL ROLES (SIMULATED WITHIN YOU)
==================================================
You internally simulate these roles — never expose them explicitly in output:
1. Strategy Role — audits, channel mix, content pillars, campaign strategies
2. Content Role — copy, hooks, CTAs, content calendars, card outlines
3. Distribution Role — cadences, cross-posting, repurposing logic
4. Media Buy Role — ad structure, campaign types, budgets, audiences
5. Community Role — reply templates, escalation rules, moderation guidelines
6. Analytics Role — metrics interpretation, HK benchmarks, insights, next actions
7. Knowledge Role — fetches and writes brand guidelines, specs, trends, past results

==================================================
III. MODES: PRODUCTION vs REFLECTION
==================================================
A) PRODUCTION MODE — called by *_generate nodes
   1. Read user_input, artefacts, kb_summaries, brand_context
   2. Decide which internal roles lead
   3. Generate the artefact (strategy, calendar, media plan, analytics summary)
   4. Set status = "DRAFT", suggest next_step

B) REFLECTION MODE — called by *_reflect nodes
   1. Read the v1 artefact
   2. Score 0–10 and critique against relevant criteria
   3. If score ≥ 8: minor polish → write *_final, status = "APPROVED" or "UNDER_REVIEW"
   4. If score < 8: generate v2 → treat as *_final, status = "REVISE_NEEDED" or "UNDER_REVIEW"
   5. If severe issues: status = "BLOCKED", next_step = "done"

==================================================
IV. SELF-CRITIQUE CRITERIA
==================================================
Strategy: clear objectives & audiences, coherent channel mix, brand alignment, feasibility, HK/APAC relevance.
Content: brand voice, hook strength, platform fit, cultural/legal risk.
Media: logical campaign structure, budget vs KPIs, audience segmentation.
Analytics: correct number reading, meaningful benchmarks, actionable recommendations.

==================================================
V. STATUS & STOP CONDITIONS
==================================================
- DRAFT: artefact produced, not yet reviewed
- UNDER_REVIEW: being evaluated
- REVISE_NEEDED: serious issues, another production pass needed
- APPROVED: quality ≥ 8, no safety issues
- BLOCKED: content violates brand/platform/legal/cultural rules or brief is too ambiguous

==================================================
VI. OUTPUT STYLE
==================================================
- Concise and execution-oriented
- Short sections and bullet points over long paragraphs
- Include: quick summary, rationale, structured artefact (table/bullets), key risks, next steps
- Do NOT describe internal LangGraph mechanics or reveal internal role names
- Do NOT say "I called knowledge_query" — phrase as "Based on brand guidelines…"
- Aim for copy-paste-ready artefacts (decks, sheets, briefs)

==================================================
VII. CONTEXT: HONG KONG / APAC
==================================================
- Most brands are HK or APAC-based; bilingual (Cantonese + English) content is standard
- Always prioritise: practicality, revenue impact, realistic execution, clear trade-offs
- Behave like a senior agency lead who structures work so it can go into a deck with minimal editing`;

// ── Router ────────────────────────────────────────────────────────────────────

function router(state) {
  if (state.status === 'BLOCKED') return 'done';

  const a = state.artefacts;

  if (!a.strategy_v1 && !a.strategy_final)           return 'strategy_generate';
  if (a.strategy_v1  && !a.strategy_final)            return 'strategy_reflect';
  if (!a.content_calendar_v1 && !a.content_calendar_final) return 'content_generate';
  if (a.content_calendar_v1  && !a.content_calendar_final) return 'content_reflect';
  if (!a.media_plan_v1 && !a.media_plan_final)        return 'media_generate';
  if (a.media_plan_v1  && !a.media_plan_final)        return 'media_reflect';
  if (!a.analytics_report_final)                      return 'analytics_generate';

  return 'done';
}

// ── Knowledge tools ───────────────────────────────────────────────────────────

function knowledgeQuery(domain, query, brandContext = '') {
  // Map to RAG service — returns trimmed context string (≤ 600 tokens)
  const ragContext = ragService.getContext(query, domain, 3);
  if (ragContext) return ragContext;

  // Fallback: extract from brand_context if it matches the domain
  if (domain === 'brand_guidelines' && brandContext) {
    const bc = typeof brandContext === 'string' ? brandContext : JSON.stringify(brandContext);
    return bc.slice(0, 1200);
  }
  return null;
}

// ── State context builder (token budget: ~1 200 tokens) ───────────────────────

function buildStateContext(state, nodeName) {
  const a = state.artefacts;
  let ctx = '';

  // Brand + project line
  if (state.brand_context) {
    const bc = typeof state.brand_context === 'object'
      ? JSON.stringify(state.brand_context).slice(0, 500)
      : String(state.brand_context).slice(0, 500);
    ctx += `**Brand context**: ${bc}\n\n`;
  }

  // KB summaries (last 3)
  if (state.kb_summaries?.length) {
    const recent = state.kb_summaries.slice(-3);
    ctx += `**Knowledge base**:\n${recent.map(k => `- [${k.domain}] ${k.summary}`).join('\n')}\n\n`;
  }

  // Current status
  ctx += `**Status**: ${state.status || 'DRAFT'}\n`;

  // Node-specific artefact slice — only what this node needs
  const nodeArtefactMap = {
    strategy_generate:  [],
    strategy_reflect:   ['strategy_v1'],
    content_generate:   ['strategy_final'],
    content_reflect:    ['content_calendar_v1'],
    media_generate:     ['strategy_final', 'content_calendar_final'],
    media_reflect:      ['media_plan_v1'],
    analytics_generate: ['strategy_final', 'media_plan_final'],
    done:               [],
  };
  const relevantKeys = nodeArtefactMap[nodeName] || [];
  for (const key of relevantKeys) {
    if (a[key]) {
      const val = typeof a[key] === 'string' ? a[key] : JSON.stringify(a[key]);
      ctx += `\n**${key}** (existing):\n${val.slice(0, 800)}\n`;
    }
  }

  // History (last 3 entries)
  if (state.history?.length) {
    const recent = state.history.slice(-3);
    ctx += `\n**Recent steps**:\n${recent.map(h => `[${h.step}] ${h.note}`).join('\n')}\n`;
  }

  return ctx;
}

// ── Model selection per node ──────────────────────────────────────────────────
// Generation nodes: deepseek-chat  ($0.14/$0.28 per 1M) — fast, creative
// Reflection nodes: deepseek-reasoner ($0.14/$0.28 per 1M) — rigorous critique
// Fallback:         claude-haiku-4-5-20251001 ($0.25/$1.25 per 1M)

const REFLECT_NODES = new Set(['strategy_reflect', 'content_reflect', 'media_reflect']);

function selectModel(nodeName) {
  return REFLECT_NODES.has(nodeName) ? 'deepseek-reasoner' : 'deepseek-chat';
}

// ── LLM call ─────────────────────────────────────────────────────────────────

async function callSarah(state, nodeName, userMessage) {
  const nodeHint = `Current logical step: **${nodeName}**.\n`;
  const stateCtx = buildStateContext(state, nodeName);

  const systemWithNode = `${SARAH_SYSTEM_PROMPT}\n\n==================================================\nACTIVE NODE\n==================================================\n${nodeHint}${stateCtx}`;

  const messages = [{ role: 'user', content: userMessage }];
  const model = selectModel(nodeName);

  if (deepseekService.isAvailable()) {
    const result = await deepseekService.chat(
      [{ role: 'system', content: systemWithNode }, ...messages],
      { model, maxTokens: 2500, temperature: REFLECT_NODES.has(nodeName) ? 0.3 : 0.7 }
    );
    return result.content;
  }

  // Claude Haiku fallback (all nodes — Haiku handles both generation and reflection well enough)
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const resp = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2500,
    system: systemWithNode,
    messages,
  });
  return resp.content[0].text;
}

// ── Nodes ─────────────────────────────────────────────────────────────────────

async function nodeStrategyGenerate(state) {
  // Pull KB knowledge before generating
  const kbResult = knowledgeQuery('brand_guidelines', state.user_input, state.brand_context);
  if (kbResult) {
    state.kb_summaries.push({ domain: 'brand_guidelines', summary: kbResult.slice(0, 400) });
  }

  const prompt = `User brief: "${state.user_input}"\n\nProduce **strategy_v1**: a concise social strategy covering platform mix, 3–5 content pillars, KPIs, posting cadence, and brand voice recommendation. Format as a structured plan with headers and bullets. End with: next_step suggestion and status.`;

  const output = await callSarah(state, 'strategy_generate', prompt);

  state.artefacts.strategy_v1 = output;
  state.status = 'DRAFT';
  state.next_step = 'strategy_reflect';
  state.history.push({ step: 'strategy_generate', note: 'strategy_v1 produced', timestamp: new Date().toISOString() });

  return state;
}

async function nodeStrategyReflect(state) {
  const prompt = `Review **strategy_v1** in the state context.\n\nEvaluate against: clarity of objectives & audiences, channel mix coherence, brand alignment, feasibility, HK/APAC relevance.\n\nScore 0–10. List concrete issues. If score ≥ 8: produce strategy_final with minor polish. If score < 8: produce strategy_v2 as strategy_final. If severe issues: set status BLOCKED.\n\nReturn: score, critique bullets, and strategy_final content.`;

  const output = await callSarah(state, 'strategy_reflect', prompt);

  state.artefacts.strategy_critique = output;
  state.artefacts.strategy_final = output; // Sarah includes the final in her output
  state.status = 'UNDER_REVIEW';
  state.next_step = 'content_generate';
  state.history.push({ step: 'strategy_reflect', note: 'strategy critiqued and finalised', timestamp: new Date().toISOString() });

  return state;
}

async function nodeContentGenerate(state) {
  const kbResult = knowledgeQuery('content_formats', state.user_input, state.brand_context);
  if (kbResult) {
    state.kb_summaries.push({ domain: 'content_formats', summary: kbResult.slice(0, 400) });
  }

  const prompt = `Based on strategy_final (in state context) and brand guidelines.\n\nProduce **content_calendar_v1**: a 4-week content calendar.\n- Weekly grid overview (weeks × days): platform, format, pillar, short title per cell\n- Master table rows: Date, Platform, Format, Pillar, Title, Objective, Key message, Copy hook, Hashtags\n\nInclude 2–3 fully expanded content cards (hook, scenes/copy, CTA, caption).\nUser brief: "${state.user_input}"`;

  const output = await callSarah(state, 'content_generate', prompt);

  state.artefacts.content_calendar_v1 = output;
  state.status = 'DRAFT';
  state.next_step = 'content_reflect';
  state.history.push({ step: 'content_generate', note: 'content_calendar_v1 produced', timestamp: new Date().toISOString() });

  return state;
}

async function nodeContentReflect(state) {
  const prompt = `Review **content_calendar_v1** in state context.\n\nEvaluate: brand voice, hook strength, platform fit (IG/TikTok/FB format rules), bilingual quality (Cantonese/EN), cultural/legal risk.\n\nScore 0–10. List issues. Produce content_calendar_final (polished or v2 if score < 8). Flag any BLOCKED risks.`;

  const output = await callSarah(state, 'content_reflect', prompt);

  state.artefacts.content_critique = output;
  state.artefacts.content_calendar_final = output;
  state.status = 'UNDER_REVIEW';
  state.next_step = 'media_generate';
  state.history.push({ step: 'content_reflect', note: 'content critiqued and finalised', timestamp: new Date().toISOString() });

  return state;
}

async function nodeMediaGenerate(state) {
  const prompt = `Based on strategy_final and content_calendar_final (in state context).\n\nProduce **media_plan_v1**:\n- Campaign structure (campaigns → ad sets → ads)\n- Budget split by platform and objective\n- Audience segmentation (demographics, interests, custom/lookalike)\n- Ad formats per placement\n- KPIs and daily/weekly pacing\n\nUser brief: "${state.user_input}"`;

  const output = await callSarah(state, 'media_generate', prompt);

  state.artefacts.media_plan_v1 = output;
  state.status = 'DRAFT';
  state.next_step = 'media_reflect';
  state.history.push({ step: 'media_generate', note: 'media_plan_v1 produced', timestamp: new Date().toISOString() });

  return state;
}

async function nodeMediaReflect(state) {
  const prompt = `Review **media_plan_v1** in state context.\n\nEvaluate: logical campaign structure, budget vs KPI alignment, audience quality, placement logic, feasibility.\n\nScore 0–10. List issues. Produce media_plan_final.`;

  const output = await callSarah(state, 'media_reflect', prompt);

  state.artefacts.media_critique = output;
  state.artefacts.media_plan_final = output;
  state.status = 'APPROVED';
  state.next_step = 'analytics_generate';
  state.history.push({ step: 'media_reflect', note: 'media plan critiqued and finalised', timestamp: new Date().toISOString() });

  return state;
}

async function nodeAnalyticsGenerate(state) {
  const prompt = `Based on strategy_final, content_calendar_final, media_plan_final (in state context).\n\nProduce **analytics_report_v1**:\n- KPI targets with HK/APAC benchmarks\n- Tracking setup checklist (pixel, UTMs, attribution)\n- Reporting cadence (daily checks, weekly review, monthly rollup)\n- Leading indicators to watch in first 2 weeks\n- Decision rules: when to pause, boost, or pivot\n\nUser brief: "${state.user_input}"`;

  const output = await callSarah(state, 'analytics_generate', prompt);

  state.artefacts.analytics_report_v1 = output;
  state.artefacts.analytics_report_final = output;
  state.status = 'APPROVED';
  state.next_step = 'done';
  state.history.push({ step: 'analytics_generate', note: 'analytics report produced', timestamp: new Date().toISOString() });

  return state;
}

function nodeDone(state) {
  const a = state.artefacts;
  const parts = [];

  if (state.status === 'BLOCKED') {
    parts.push('⚠️ **Task blocked** — human review required before proceeding.');
    const lastHistory = state.history[state.history.length - 1];
    if (lastHistory) parts.push(`Blocked at: ${lastHistory.step} — ${lastHistory.note}`);
  } else {
    parts.push('✅ **Campaign package ready.** Artefacts produced:');
    if (a.strategy_final)          parts.push('- Social Strategy (final)');
    if (a.content_calendar_final)  parts.push('- Content Calendar (final)');
    if (a.media_plan_final)        parts.push('- Media Plan (final)');
    if (a.analytics_report_final)  parts.push('- Analytics & Tracking Plan (final)');
    parts.push('\nReview each artefact above. You can ask Sarah to:\n- Expand any content card\n- Adjust budget allocation\n- Generate community reply templates\n- Refine strategy for a specific platform');
  }

  state.history.push({ step: 'done', note: 'orchestration complete', timestamp: new Date().toISOString() });
  return { state, summary: parts.join('\n') };
}

// ── Node dispatch map ─────────────────────────────────────────────────────────

const NODES = {
  strategy_generate:  nodeStrategyGenerate,
  strategy_reflect:   nodeStrategyReflect,
  content_generate:   nodeContentGenerate,
  content_reflect:    nodeContentReflect,
  media_generate:     nodeMediaGenerate,
  media_reflect:      nodeMediaReflect,
  analytics_generate: nodeAnalyticsGenerate,
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run Sarah for one turn.
 *
 * @param {object} opts
 * @param {string}  opts.taskId       - Unique task/session ID
 * @param {string}  opts.userInput    - Latest user message
 * @param {object}  [opts.brandContext] - Brand + project info
 * @param {string}  [opts.brandId]
 * @param {string}  [opts.projectId]
 * @param {boolean} [opts.runFullPipeline] - Run all nodes sequentially (batch mode)
 * @returns {{ state: object, nodeName: string, output: string }}
 */
async function runSarah({ taskId, userInput, brandContext, brandId, projectId, runFullPipeline = false }) {
  // Load or init state
  let state = await getSocialState(taskId);
  if (!state) {
    state = {
      task_id:      taskId,
      user_input:   userInput,
      brand_context: brandContext || null,
      kb_summaries:  [],
      artefacts:    {},
      history:      [],
      status:       'DRAFT',
      next_step:    null,
    };
  } else {
    // Update user input for this turn
    state.user_input = userInput;
    if (brandContext) state.brand_context = brandContext;
  }

  if (runFullPipeline) {
    // Batch mode: run all nodes until done (for async/background tasks)
    let iteration = 0;
    const MAX_ITERATIONS = 10; // circuit breaker
    let lastOutput = '';

    while (iteration < MAX_ITERATIONS) {
      const nodeName = router(state);
      if (nodeName === 'done') {
        const { state: finalState, summary } = nodeDone(state);
        state = finalState;
        lastOutput = summary;
        break;
      }
      state = await NODES[nodeName](state);
      iteration++;
    }

    await upsertSocialState(taskId, state, brandId, projectId);
    return { state, nodeName: 'done', output: lastOutput };
  }

  // Interactive mode: run ONE node per user turn
  const nodeName = router(state);

  if (nodeName === 'done') {
    const { state: finalState, summary } = nodeDone(state);
    state = finalState;
    await upsertSocialState(taskId, state, brandId, projectId);
    return { state, nodeName, output: summary };
  }

  state = await NODES[nodeName](state);
  await upsertSocialState(taskId, state, brandId, projectId);

  // Return the latest artefact produced by this node
  const artefactKey = {
    strategy_generate:  'strategy_v1',
    strategy_reflect:   'strategy_final',
    content_generate:   'content_calendar_v1',
    content_reflect:    'content_calendar_final',
    media_generate:     'media_plan_v1',
    media_reflect:      'media_plan_final',
    analytics_generate: 'analytics_report_final',
  }[nodeName];

  const output = artefactKey ? state.artefacts[artefactKey] : '';
  return { state, nodeName, output };
}

/**
 * Reset Sarah's state for a given task (start fresh).
 */
async function resetSarah(taskId) {
  const { deleteSocialState } = require('../../db');
  await deleteSocialState(taskId);
}

/**
 * Get current state without running a node (for status polling).
 */
async function getSarahState(taskId) {
  return getSocialState(taskId);
}

module.exports = { runSarah, resetSarah, getSarahState, router, NODES };
