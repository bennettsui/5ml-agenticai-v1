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
const { getSocialState, upsertSocialState, saveSocialCampaign, saveArtefact, getSocialContentPosts, saveSocialContentPosts, saveSocialAdCampaigns, saveSocialKPIs } = require('../../db');
const { parseMarkdownTable, extractMarkdownSection, extractBulletList } = require('./markdownParser');

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
II.A. SELECTIVE ROLE ACTIVATION (CHAT EXPERIENCE)
==================================================
IMPORTANT: You run inside a chat-like experience where you receive incremental instructions.

- You do NOT have to activate or simulate all internal roles on every turn.
- You should only activate the minimal set of roles needed for:
  - The current user instruction, AND
  - The current graph node.
- You MUST respect the human user's explicit instructions about which part to work on:
  - If the user asks only about strategy, focus on Strategy (and Knowledge) and do NOT automatically generate content calendars or media plans.
  - If the user asks only for post copy, focus on Content (and Knowledge) and reuse any existing strategy from state instead of re-planning everything.
  - If the user asks for "just improve this calendar" or "only critique this media plan", stay in reflection mode for that artefact.

You are still responsible for:
- Ensuring coherence with existing artefacts in state
- Using the knowledge base when needed
- Updating state consistently
But you should avoid doing unnecessary steps or calling every internal role at once.
Act incrementally and follow the user's priorities.

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
// Routes the state machine through a linear sequence of nodes.
// Can be customized per use case (e.g., skip media/analytics, go straight to community).

function router(state) {
  if (state.status === 'BLOCKED') return 'done';

  const a = state.artefacts;

  // Strategy
  if (!a.strategy_v1 && !a.strategy_final)           return 'strategy_generate';
  if (a.strategy_v1  && !a.strategy_final)            return 'strategy_reflect';

  // Content
  if (!a.content_calendar_v1 && !a.content_calendar_final) return 'content_generate';
  if (a.content_calendar_v1  && !a.content_calendar_final) return 'content_reflect';

  // Media (optional — can be skipped if only_content = true)
  if (!a.media_plan_v1 && !a.media_plan_final)        return 'media_generate';
  if (a.media_plan_v1  && !a.media_plan_final)        return 'media_reflect';

  // Analytics
  if (!a.analytics_report_final)                      return 'analytics_generate';

  // Community (optional — can be skipped if only_media = true)
  // Uncomment if including community management in the workflow:
  // if (!a.community_guidelines)                       return 'community_generate';

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

// ── Node-specific objectives (from detailed UX specs) ──────────────────────

const NODE_OBJECTIVES = {
  strategy_generate: `
### Objectives
- Focus on producing an initial social & media strategy draft (\`strategy_v1\`).
- Use the Strategy Role and Knowledge Role internally.

### Concretely, you MUST:
1. **Read from state**: user_input, brand_context, existing kb_summaries.
2. **If missing knowledge**: Call knowledge_query for brand guidelines, past campaigns, benchmarks.
3. **Produce strategy_v1** that includes at minimum:
   - Objectives and target audiences (explicitly stated or inferred).
   - Recommended channel mix (platforms and role of each).
   - 3–6 clear content pillars.
   - Posting cadence per platform.
   - High-level media approach: organic vs paid, rough priorities.
   - Key KPIs to track.
4. **Write into**: artefacts.strategy_v1 (as structured, copy-paste-ready text).
5. **Also capture**:
   - artefacts.strategy_assumptions: List 3–7 critical assumptions (budget, resources, timeline, market conditions).
   - artefacts.strategy_risks: List 3–7 known risks + priority/severity.
6. **Set**: status = "DRAFT", next_step = "strategy_reflect".

### Output format:
- strategy_v1: Concise but complete strategy with clear headers.
- strategy_assumptions: Numbered bullet list of assumptions.
- strategy_risks: Numbered bullet list of risks with severity markers (High/Medium/Low).
`,

  strategy_reflect: `
### Objectives
- Critically evaluate strategy_v1, assumptions, and risks.
- Produce a concise critique and improved final version (strategy_final), or block.

### Concretely, you MUST:
1. **Read from state**: artefacts.strategy_v1, assumptions, risks, kb_summaries, brand_context.
2. **Evaluate against**:
   - Clarity of objectives & target audiences.
   - Coherence of channel mix & content pillars.
   - Brand alignment & differentiation.
   - Feasibility (resources, timeline, budget).
   - HK / target market relevance.
   - Reasonableness of assumptions given market data.
   - Mitigation plans for listed risks.
3. **Score 0–10 and critique**: 3–7 strengths, 3–7 weaknesses, improvement suggestions.
4. **Store**: artefacts.strategy_critique.
5. **Decide**:
   - Score ≥ 8: Polish and save as artefacts.strategy_final. Set status = "APPROVED" or "UNDER_REVIEW". next_step = "content_generate".
   - Score < 8: Use critique as instructions to rewrite. Save improved version as artefacts.strategy_final. Set status = "REVISE_NEEDED".
   - Severe issues: status = "BLOCKED", next_step = "done". Explain why human intervention required.

### Output format:
- Provide score & human-readable critique summary.
- Present final strategy in clean, copy-paste-ready format (same structure as strategy_v1).
- Refine strategy_assumptions and strategy_risks if needed.
`,

  content_generate: `
### Objectives
- Produce an initial content calendar (content_calendar_v1) aligned with strategy.

### Concretely, you MUST:
1. **Read from state**: artefacts.strategy_final, brand_context, kb_summaries (brand voice, platform specs, best-performing posts).
2. **If missing**: Query knowledge base for brand voice, platform guidelines, historical performance.
3. **Produce content_calendar_v1** that includes:
   - Time frame covered (e.g. 2 weeks, 1 month).
   - Per platform: posting frequency, key themes per week.
   - Table layout: Date, Platform, Pillar, Post idea/hook, CTA, Language (Cantonese/English/bilingual).
   - At least a few fully written example posts per key pillar.
4. **Write into**: artefacts.content_calendar_v1.
5. **Set**: status = "DRAFT", next_step = "content_reflect".

### Output format:
- Show calendar in clear, structured way (table or well-marked list).
- Make it easy to copy into a spreadsheet or content tool.
`,

  content_reflect: `
### Objectives
- Critically evaluate content_calendar_v1.
- Produce critique and improved final version (content_calendar_final), or block.

### Concretely, you MUST:
1. **Read from state**: artefacts.content_calendar_v1, artefacts.strategy_final, kb_summaries (brand voice, platform specs, risk rules).
2. **Evaluate against**:
   - Brand voice alignment & tonal consistency.
   - Hook & CTA clarity and strength.
   - Platform fit & technical constraints.
   - Pillar coverage & balance.
   - Cultural & legal safety (Hong Kong context).
3. **Score 0–10 and critique**: 3–7 strengths, 3–7 weaknesses, improvements.
4. **Store**: artefacts.content_critique.
5. **Decide**:
   - Score ≥ 8: Apply improvements, save as artefacts.content_calendar_final. status = "APPROVED". next_step = "media_generate" (or done).
   - Score < 8: Rewrite using critique. Save as artefacts.content_calendar_final. status = "REVISE_NEEDED".
   - Serious safety issues: status = "BLOCKED". Explain why.

### Output format:
- Score & key critique points.
- Final improved calendar in clear table or structured list.
`,

  media_generate: `
### Objectives
- Propose initial paid media plan (media_plan_v1) supporting strategy & content.

### Concretely, you MUST:
1. **Read from state**: artefacts.strategy_final, artefacts.content_calendar_final, brand_context, kb benchmarks.
2. **If missing**: Query KB for platform ad best practices, HK benchmarks (CTR, CPM, CPA), brand constraints.
3. **Produce media_plan_v1 with this structure** (Markdown):
   - **Summary** (3–5 bullets): overall approach, main objectives, key platforms.
   - **Campaign Structure** (table): campaign name, objective, funnel stage, platforms, notes.
   - **Ad Set / Audience Structure** (table): ad set name, campaign, audience definition, geo, placement notes.
   - **\`media_budget_breakdown\`** (table): level (platform/campaign/funnel), item, budget (HKD or %), rationale.
   - **\`media_kpi_targets\`** (table): level, platform/campaign, primary KPI, target value, secondary KPIs, notes.
   - **Creative / Messaging Notes** (bullets): linking content pillars to media angles.
4. **Write all into**: artefacts.media_plan_v1 as single coherent block.
5. **Set**: status = "DRAFT", next_step = "media_reflect".

### Output format:
- Use exact section headings and table columns as described.
- Tables must be clean Markdown (pipe-delimited).
- All artefacts (budget breakdown, KPI targets) in one cohesive document.
`,

  media_reflect: `
### Objectives
- Critically evaluate media_plan_v1, budget breakdown, KPI targets.
- Produce critique and improved final version (media_plan_final), or block.

### Concretely, you MUST:
1. **Read from state**: artefacts.media_plan_v1, artefacts.strategy_final, kb benchmarks.
2. **Evaluate against**:
   - Logical campaign / ad set structure.
   - Budget allocation vs objectives & KPIs.
   - Audience definitions (too broad/narrow/misaligned).
   - Synergy with organic content.
   - Risk & feasibility.
   - Reasonableness of KPI targets (vs HK benchmarks).
3. **Score 0–10 and critique**:
   - 3–7 strengths.
   - 3–7 weaknesses / risks.
   - Concrete improvements (budget shifts, audience tweaks, structure changes).
4. **Store**: artefacts.media_critique.
5. **Decide**:
   - Score ≥ 8: Minor refinements → artefacts.media_plan_final. status = "APPROVED". next_step = "analytics_generate".
   - Score < 8: Significant rewrite → artefacts.media_plan_final. status = "REVISE_NEEDED".
   - Severe issues: status = "BLOCKED".

### Output format:
- Critique: score, strengths/weaknesses, concrete improvements.
- Final plan: same structure as media_plan_v1 (Summary, Campaign Structure, Budget, KPIs, Creative Notes).
`,

  analytics_generate: `
### Objectives
- Propose how to measure success, track progress, and optimize on the fly.

### Concretely, you MUST:
1. **Read from state**: artefacts.strategy_final, content_calendar_final, media_plan_final.
2. **Produce analytics_report_final with this structure** (Markdown):
   - **Measurement Framework Summary** (3–5 bullets): how success will be measured.
   - **\`analytics_kpi_definition\`** (table): KPI name, definition/formula, data source (GA4/Meta Ads Manager/etc.), reporting frequency.
   - **KPI by Funnel / Platform** (table): funnel stage (Awareness/Consideration/Conversion/Retention), platform, primary KPI, target direction (e.g. "> 1.5% CTR"), notes.
   - **\`analytics_dashboard_outline\`** (bullet list):
     - Suggested dashboard pages/tabs (Overview, Channel performance, Creative, Audience).
     - Key dimensions (date, platform, campaign, audience, creative).
     - Key metrics per tab.
   - **\`analytics_insights_summary\`** (if real data available: 3–7 actual insights + actions; if not yet: 3–7 hypotheses + signals to watch).
3. **Save**: artefacts.analytics_report_final (all sections in one block).
4. **Also separately save** (or within same block):
   - artefacts.analytics_kpi_definition (the KPI table).
   - artefacts.analytics_insights_summary (the insights/hypotheses).
5. **Set**: status = "APPROVED", next_step = "done".

### Output format:
- Use exact section headings and table columns as described.
- Tables in clean Markdown.
- Make it obvious which KPIs drive which business goals.
`,

  community_generate: `
### Objectives
- Produce community management playbook that makes it easy for humans to handle comments, DMs, crises.

### Concretely, you MUST:
1. **Read from state**: artefacts.strategy_final, brand_context, kb_summaries (tone, brand values).
2. **Produce with this structure** (Markdown):
   - **\`community_guidelines\`** (bullet list, 5–10 items):
     - Tone of voice (formal/casual/playful).
     - Language mix (Cantonese/English/Mandarin) and when to use.
     - Response time expectations (e.g. within X hours).
     - What to never say or promise.
     - Do's and don'ts.
   - **\`community_reply_templates\`** (table with columns: scenario, platform, suggested reply, tone notes).
     - Include 3–5 complaint scenarios (e.g. delivery, quality, pricing).
     - 3–5 positive feedback scenarios.
     - 3–5 FAQ-style question scenarios.
   - **\`community_escalation_rules\`** (table with columns: scenario type, escalation path, immediate platform action, SLA).
     - Legal threats → Legal team, no reply, within 1 hour.
     - Discrimination / hate speech → Moderation + manager, hide, within 30 min.
     - Medical claims → Legal, no reply, within 1 hour.
     - Others as needed.
   - **\`community_moderation_policies\`** (bullet list):
     - What content to hide/remove (hate speech, spam links, off-topic).
     - When to block users.
     - How to log incidents (screenshot + link + timestamp).
3. **Write all into**: artefacts.community_guidelines, artefacts.community_reply_templates, artefacts.community_escalation_rules, artefacts.community_moderation_policies.
4. **Set**: status = "APPROVED", next_step = "done".

### Output format:
- Use exact headings and table columns described.
- Make templates immediately usable (copy-paste ready).
`,

  done: `
### Objectives
- Provide concise, human-friendly wrap-up of all artefacts and next steps.

### Concretely, you MUST:
1. **Read from state**: all artefacts with *_final versions, status, global_assumptions, global_risks.
2. **Summarize for human user**:
   - What has been produced (strategy, calendar, media plan, analytics, community [if any]).
   - Current status (APPROVED, REVISE_NEEDED, or BLOCKED).
   - Key global assumptions and risks.
   - What items need human decision / approval before execution.
3. **If BLOCKED**: Clearly explain blocking reasons and propose specific unblocking questions.
4. **Suggest next actions**:
   - Who should review?
   - What should be done next? (e.g. design, legal review, stakeholder approval).
   - Timeline to launch.

### Output format:
- Short & structured (3–6 bullets per section).
- Make it obvious what can be copy-pasted into decks.
- Make it obvious where human choice is needed.
`,
};

// ── State context builder (token budget: ~1 200 tokens) ───────────────────────

function buildStateContext(state, nodeName) {
  const a = state.artefacts;
  let ctx = '';

  // Node-specific objectives (brief version to stay within token budget)
  if (NODE_OBJECTIVES[nodeName]) {
    ctx += `**Current logical step objectives**:\n${NODE_OBJECTIVES[nodeName].slice(0, 600)}\n\n`;
  }

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
    strategy_reflect:   ['strategy_v1', 'strategy_assumptions', 'strategy_risks'],
    content_generate:   ['strategy_final'],
    content_reflect:    ['content_calendar_v1'],
    media_generate:     ['strategy_final', 'content_calendar_final'],
    media_reflect:      ['media_plan_v1'],
    analytics_generate: ['strategy_final', 'media_plan_final'],
    community_generate: ['strategy_final', 'brand_context'],
    done:               ['strategy_final', 'content_calendar_final', 'media_plan_final', 'analytics_report_final', 'community_guidelines'],
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

  const prompt = `
User brief: **"${state.user_input}"**

Based on the state context and objectives above, produce **strategy_v1** and supporting artefacts.

**strategy_v1** must be a concise but complete social media strategy that includes:
- Clear objectives and primary target audience segments
- Recommended platform mix (which platforms, why, and role of each)
- 3–6 distinct content pillars with brief explanation of each
- Posting cadence recommendations per platform
- High-level media approach: organic + paid split, key paid priorities
- Primary and secondary KPIs to track

Format it as a structured, copy-paste-ready document with clear headers and bullet points.

**strategy_assumptions** (separate): List 3–7 critical assumptions (budget, resources, timeline, market conditions, brand constraints) that underpin this strategy.

**strategy_risks** (separate): List 3–7 known risks + severity markers (High/Medium/Low) + brief mitigation notes.

Assume all three will be saved separately in \`artefacts\`:
- artefacts.strategy_v1
- artefacts.strategy_assumptions
- artefacts.strategy_risks

Make each clear and actionable.
`;

  const output = await callSarah(state, 'strategy_generate', prompt);

  // Sarah should return all three clearly separated. For now, store the whole output in v1.
  // In future, you could parse to extract assumptions/risks separately.
  state.artefacts.strategy_v1 = output;
  state.artefacts.strategy_assumptions = output; // Will be refined in reflect
  state.artefacts.strategy_risks = output;       // Will be refined in reflect

  state.status = 'DRAFT';
  state.next_step = 'strategy_reflect';
  state.history.push({ step: 'strategy_generate', note: 'strategy_v1 + assumptions + risks produced', timestamp: new Date().toISOString() });

  return state;
}

async function nodeStrategyReflect(state) {
  const prompt = `
You are now critiquing **strategy_v1** (shown in state context above).

Carefully evaluate it against these criteria:
- Clarity: Are objectives and target audiences clearly defined?
- Coherence: Does the channel mix logically support the content pillars?
- Brand alignment: Does it feel consistent with the brand voice and positioning?
- Feasibility: Is it realistic given typical resource constraints?
- Relevance: Does it address Hong Kong / APAC market context where appropriate?

**Output exactly this format:**
1. SCORE (0–10)
2. CRITIQUE (3–7 key strengths, 3–7 concrete weaknesses / improvements)
3. DECISION (if score ≥ 8: minor polish → FINAL; if < 8: rewrite as FINAL; if severe brand/legal issues: BLOCKED)
4. **strategy_final** (the polished or rewritten strategy text, ready to copy-paste)

Set status based on your decision and next_step appropriately.
`;

  const output = await callSarah(state, 'strategy_reflect', prompt);

  state.artefacts.strategy_critique = output.split('**strategy_final**')[0] || output;
  state.artefacts.strategy_final = output;
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

  const prompt = `
Based on **strategy_final** (in state context) and brand guidelines, produce **content_calendar_v1**.

This must include:

**1. Weekly Grid Overview** (next 2–4 weeks)
- Rows = weeks, Columns = days (Mon–Sun)
- Each cell: [Platform] – [Format] – [Pillar] – [Brief title]
- Example: "IG – Reel – Educate – Why AI saves 10x time"

**2. Master Calendar Table**
Columns: Date | Day | Platform | Format | Content Pillar | Objective | Key Message | Copy Hook | Language | Visual Type | Notes
- One row per post
- Include 10–15 posts across platforms and pillars

**3. Detailed Content Cards** (2–3 examples, fully written)
For each card, show:
- Reel format: Hook (1–2 options, max 15 words), 3 key scenes/talking points, on-screen text per scene, CTA, Caption (hook + 2–4 lines + CTA + 5–10 hashtags)
- Static/Carousel: Slide plan, Caption with hook + paragraph/bullets + CTA + hashtags

**Language**: Bilingual (Cantonese/Traditional Chinese + English support) where appropriate for HK audience.

Format as a clean, copy-paste-ready document.
`;

  const output = await callSarah(state, 'content_generate', prompt);

  state.artefacts.content_calendar_v1 = output;
  state.status = 'DRAFT';
  state.next_step = 'content_reflect';
  state.history.push({ step: 'content_generate', note: 'content_calendar_v1 produced', timestamp: new Date().toISOString() });

  return state;
}

async function nodeContentReflect(state) {
  const prompt = `
You are now critiquing **content_calendar_v1** (shown in state context above).

Carefully evaluate it against these criteria:
- Brand voice: Is the tone and language style consistent with brand guidelines?
- Hook strength: Are the opening lines compelling and platform-native (stopping scrollers)?
- Platform fit: Do formats and lengths match platform specs (IG Reel 9:16 / 15–30s, TikTok, etc.)?
- Bilingual quality: Is Cantonese/Traditional Chinese natural? Are English translations proper?
- Cultural safety: Any cultural sensitivities, legal risks, or Hong Kong market misalignment?
- Pillar balance: Are all content pillars represented fairly?

**Output exactly this format:**
1. SCORE (0–10)
2. CRITIQUE (3–7 strengths, 3–7 weaknesses / improvements, with concrete examples)
3. DECISION (if ≥ 8: polish → FINAL; if < 8: rewrite as FINAL; if BLOCKED: explain why)
4. **content_calendar_final** (the polished or improved calendar, fully written, copy-paste ready)

Set status and next_step accordingly.
`;

  const output = await callSarah(state, 'content_reflect', prompt);

  state.artefacts.content_critique = output.split('**content_calendar_final**')[0] || output;
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

async function nodeAnalyticsGenerate(state) {
  const prompt = `
Based on **strategy_final**, **content_calendar_final**, and **media_plan_final** (in state context), produce **analytics_report_final**.

This must include:

**1. Measurement Framework Summary** (3–5 bullets describing how success will be measured)

**2. \`analytics_kpi_definition\` (table)**
Columns: KPI name | Definition / formula | Data source (GA4, Meta Ads Manager, etc.) | Reporting frequency (daily/weekly/monthly)

**3. KPI by Funnel / Platform (table)**
Columns: Funnel stage (Awareness/Consideration/Conversion/Retention) | Platform | Primary KPI | Target direction / value (e.g. "> 1.5% CTR", "≤ 80 HKD CPA") | Notes

**4. \`analytics_dashboard_outline\` (bullet list)**
Describe the ideal dashboard with:
- Suggested pages/tabs (Overview, Channel performance, Creative, Audience, etc.)
- Key dimensions (date, platform, campaign, audience, creative)
- Key metrics per tab

**5. \`analytics_insights_summary\` (bullet list)**
- If real data is available: 3–7 key insights + recommended actions.
- If no real data yet: 3–7 hypotheses about what will drive success + what signals to watch.

Format as clean Markdown. Store everything in \`artefacts.analytics_report_final\`.
If you generate separate sub-artefacts (KPI definitions, insights), indicate them clearly.
`;

  const output = await callSarah(state, 'analytics_generate', prompt);

  state.artefacts.analytics_report_final = output;
  state.artefacts.analytics_kpi_definition = output; // Can be extracted/refined later
  state.artefacts.analytics_insights_summary = output;

  state.status = 'APPROVED';
  state.next_step = 'done';
  state.history.push({ step: 'analytics_generate', note: 'analytics report + KPI definitions + insights produced', timestamp: new Date().toISOString() });

  return state;
}

async function nodeCommunityGenerate(state) {
  const kbResult = knowledgeQuery('brand_tone', state.user_input, state.brand_context);
  if (kbResult) {
    state.kb_summaries.push({ domain: 'brand_tone', summary: kbResult.slice(0, 400) });
  }

  const prompt = `
Based on **strategy_final** and brand context, produce a community management playbook.

You must output:

**1. \`community_guidelines\` (bullet list, 5–10 items)**
- Tone of voice (formal/casual/playful).
- Language mix (Cantonese/English/Mandarin) and when to use each.
- Response time expectations (e.g. within X hours).
- What to never say or promise.
- General do's and don'ts.

**2. \`community_reply_templates\` (table)**
Columns: Scenario | Platform (if relevant) | Suggested reply | Tone notes

Include:
- 3–5 complaint scenarios (delivery, quality, pricing, technical, etc.)
- 3–5 positive feedback scenarios
- 3–5 FAQ-style question scenarios

**3. \`community_escalation_rules\` (table)**
Columns: Scenario type | Escalation path (team) | Immediate platform action (reply/hide/no reply) | SLA

Examples:
- Legal threat → Legal team, no reply, within 1 hour
- Discrimination / hate speech → Moderation + manager, hide, within 30 min
- Medical claims → Legal, no reply, within 1 hour

**4. \`community_moderation_policies\` (bullet list)**
- What content to hide/remove (hate speech, spam, off-topic, etc.).
- When to block users.
- How to log incidents (screenshot + link + timestamp + reason).

Format as clean Markdown. Make templates immediately copy-paste-ready.
Store all in artefacts.community_guidelines, community_reply_templates, community_escalation_rules, community_moderation_policies.
`;

  const output = await callSarah(state, 'community_generate', prompt);

  state.artefacts.community_guidelines = output;
  state.artefacts.community_reply_templates = output;
  state.artefacts.community_escalation_rules = output;
  state.artefacts.community_moderation_policies = output;

  state.status = 'APPROVED';
  state.next_step = 'done';
  state.history.push({ step: 'community_generate', note: 'community playbook produced', timestamp: new Date().toISOString() });

  return state;
}

// ── Node dispatch map ─────────────────────────────────────────────────────────

const NODES = {
  strategy_generate:   nodeStrategyGenerate,
  strategy_reflect:    nodeStrategyReflect,
  content_generate:    nodeContentGenerate,
  content_reflect:     nodeContentReflect,
  media_generate:      nodeMediaGenerate,
  media_reflect:       nodeMediaReflect,
  analytics_generate:  nodeAnalyticsGenerate,
  community_generate:  nodeCommunityGenerate,
};

// ── Artefact Persistence Helper ───────────────────────────────────────────────

async function persistArtefacts(taskId, artefacts) {
  // Save all artefacts to DB (both Markdown and parse to JSON)
  for (const [key, value] of Object.entries(artefacts)) {
    if (value && typeof value === 'string') {
      let jsonStructure = null;

      try {
        // Parse specific artefact types to extract structured JSON
        if (key === 'content_calendar_v1' || key === 'content_calendar_final') {
          const tables = parseMarkdownTable(value);
          if (tables.length > 0) {
            jsonStructure = { tables };
            // Also extract and save individual content posts
            if (tables[0]?.rows) {
              await saveSocialContentPosts(taskId, tables[0].rows.map(row => ({
                date: row.date,
                platform: row.platform,
                format: row.format,
                title: row.title || row.idea,
                pillar: row.pillar || row.content_pillar,
                objective: row.objective,
                keyMessage: row.key_message,
                copyHook: row.copy_hook || row.hook,
                cta: row.cta,
                language: row.language,
                visualType: row.visual_type || row.asset_type,
                status: 'Draft',
                adPlan: row.ad_plan || row.notes,
              })));
            }
          }
        } else if (key === 'media_plan_v1' || key === 'media_plan_final') {
          const tables = parseMarkdownTable(value);
          if (tables.length > 0) {
            jsonStructure = { tables };
            // Extract ad campaigns from the tables
            for (const table of tables) {
              if (table.headers.some(h => h.includes('Campaign') || h.includes('Ad Set'))) {
                await saveSocialAdCampaigns(taskId, table.rows.map(row => ({
                  name: row.campaign_name || row.campaign || row.ad_set,
                  objective: row.objective,
                  funnelStage: row.funnel_stage,
                  platform: row.platform,
                  budgetHKD: parseFloat(row.budget_hkd || row.budget || 0),
                  budgetPct: parseFloat(row.budget_pct || 0),
                  audienceDefinition: row.audience_definition || row.audience,
                  geo: row.geo,
                  placements: row.placement || row.placements,
                  status: 'Draft',
                })));
              }
            }
          }
        } else if (key === 'analytics_kpi_definition' || key === 'analytics_report_final') {
          const tables = parseMarkdownTable(value);
          if (tables.length > 0) {
            jsonStructure = { tables };
            // Extract KPI definitions from the first table with KPI names
            for (const table of tables) {
              if (table.headers.some(h => h.includes('KPI'))) {
                await saveSocialKPIs(taskId, table.rows.map(row => ({
                  name: row.kpi_name || row.kpi,
                  type: row.kpi_type,
                  definition: row.definition,
                  formula: row.formula,
                  dataSource: row.data_source,
                  frequency: row.reporting_frequency,
                  funnelStage: row.funnel_stage,
                  platform: row.platform,
                  targetValue: row.target_value,
                  targetDirection: row.target_direction,
                })));
              }
            }
          }
        }

        // Save the artefact (Markdown + JSON)
        if (saveArtefact) {
          await saveArtefact(taskId, {
            artefactKey: key,
            artefactType: key.split('_')[0],
            markdown: value,
            json: jsonStructure,
          });
        }
      } catch (err) {
        console.error(`Error persisting artefact ${key}:`, err.message);
        // Don't throw — continue with next artefact
      }
    }
  }
}

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
    // Write social_states FIRST (social_campaigns has FK reference to it)
    await upsertSocialState(taskId, state, brandId, projectId);
    // Then save campaign metadata
    try {
      await saveSocialCampaign(taskId, {
        briefTitle: userInput.slice(0, 200),
        brandId,
        projectId,
        status: 'DRAFT',
      });
    } catch (campaignErr) {
      // Non-fatal: campaign metadata is optional
      console.warn('saveSocialCampaign skipped:', campaignErr.message);
    }
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
      try {
        state = await NODES[nodeName](state);
        // Persist artefacts after each node
        await persistArtefacts(taskId, state.artefacts);
      } catch (nodeErr) {
        console.error(`Node ${nodeName} failed:`, nodeErr.message);
        state.status = 'BLOCKED';
        state.next_step = 'done';
        break;
      }
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

  try {
    state = await NODES[nodeName](state);
    // Persist artefacts to DB
    await persistArtefacts(taskId, state.artefacts);
  } catch (nodeErr) {
    console.error(`Node ${nodeName} error:`, nodeErr.message);
    state.status = 'BLOCKED';
    state.next_step = 'done';
  }
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
