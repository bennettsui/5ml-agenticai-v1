/**
 * Adaptive Learning Orchestrator
 *
 * Routes incoming requests to the appropriate specialist agent based on mode.
 *
 * Agent routing:
 *   EXPLAIN_ONE_QUESTION  → StudentAgent
 *   SESSION_SUMMARY       → StudentAgent
 *   CLASS_SUMMARY         → TeacherAgent
 *   STUDENT_PROFILE       → TeacherAgent
 *   QUESTION_AUTHORING    → QuestionAgent
 *   GAMIFICATION_MESSAGE  → (inline — uses Haiku with concise prompt)
 *   ADMIN_SUMMARY         → (inline — uses Haiku with concise prompt)
 *
 * All legacy mode aliases are mapped for backwards compatibility:
 *   STUDENT_EXPLANATION        → EXPLAIN_ONE_QUESTION
 *   STUDENT_SESSION_SUMMARY    → SESSION_SUMMARY
 *   TEACHER_CLASS_SUMMARY      → CLASS_SUMMARY
 */

const { StudentAgent } = require('./student-agent');
const { TeacherAgent } = require('./teacher-agent');
const { QuestionAgent } = require('./question-agent');
const Anthropic = require('@anthropic-ai/sdk');

// Mode aliases for backwards-compatibility with the original generic agent
const MODE_ALIASES = {
  STUDENT_EXPLANATION: 'EXPLAIN_ONE_QUESTION',
  STUDENT_SESSION_SUMMARY: 'SESSION_SUMMARY',
  TEACHER_CLASS_SUMMARY: 'CLASS_SUMMARY',
};

// Inline system prompts for lighter utility modes
const GAMIFICATION_SYSTEM = `You are a gamification message writer for an S1–S2 math learning platform.
Given a student's recent mastery changes, sessions, and badges, write a short encouraging message and suggest 2–3 exploration-focused missions.
Reward curiosity, growth, and honest self-assessment — not raw question counts or competition.
Tone: warm, concise, age-appropriate. No sarcasm, no emojis unless language is ZH.
Use the requested language (EN = English, ZH = Traditional Chinese).
Output ONLY valid JSON:
{
  "short_message": "string",
  "suggested_missions": ["string", "..."]
}`;

const ADMIN_SYSTEM = `You are an admin summary agent for an S1–S2 math learning platform.
Given platform-level data (usage stats, error rates, content gaps, engagement signals), produce an operational summary.
Be concise and factual. Output ONLY valid JSON:
{
  "summary": "string",
  "flags": ["string", "..."],
  "recommendations": ["string", "..."]
}`;

class AdaptiveAgent {
  constructor() {
    this._student = null;
    this._teacher = null;
    this._question = null;
    this._anthropic = null;
    this.model = 'claude-haiku-4-5-20251001';
  }

  get student() {
    if (!this._student) this._student = new StudentAgent();
    return this._student;
  }

  get teacher() {
    if (!this._teacher) this._teacher = new TeacherAgent();
    return this._teacher;
  }

  get question() {
    if (!this._question) this._question = new QuestionAgent();
    return this._question;
  }

  get anthropic() {
    if (!this._anthropic) this._anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return this._anthropic;
  }

  /**
   * Route any mode to the right specialist agent.
   * @param {string} mode
   * @param {'EN'|'ZH'} language
   * @param {object} payload
   */
  async run(mode, language, payload) {
    // Resolve legacy aliases
    const resolvedMode = MODE_ALIASES[mode] || mode;

    switch (resolvedMode) {
      case 'EXPLAIN_ONE_QUESTION':
      case 'SESSION_SUMMARY':
        return this.student.run(resolvedMode, language, payload);

      case 'CLASS_SUMMARY':
      case 'STUDENT_PROFILE':
        return this.teacher.run(resolvedMode, language, payload);

      case 'QUESTION_AUTHORING':
        return this.question.run(resolvedMode, language, payload);

      case 'GAMIFICATION_MESSAGE':
        return this._runInline(GAMIFICATION_SYSTEM, language, payload);

      case 'ADMIN_SUMMARY':
        return this._runInline(ADMIN_SYSTEM, language, payload);

      default:
        throw new Error(`Unknown mode: ${mode}`);
    }
  }

  /** Run a lightweight inline agent (no dedicated class). */
  async _runInline(systemPrompt, language, payload) {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ language: language || 'EN', payload }),
        },
      ],
    });

    const raw = response.content[0]?.text || '{}';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error(`Inline agent returned invalid JSON: ${cleaned.substring(0, 200)}`);
    }
  }

  // ─── Convenience methods (kept for backwards compat with routes.js) ──────────

  explainQuestion({ question, studentAnswer, studentState, language }) {
    return this.student.explainQuestion({
      question,
      studentAnswer,
      studentStateForObjectives: studentState ? [studentState] : undefined,
      language,
    });
  }

  summariseSession({ sessionInfo, interactions, masteryDeltas, language }) {
    return this.student.summariseSession({ sessionInfo, interactions, masteryDeltas, language });
  }

  summariseClass({ classInfo, objectiveStats, examplesOfCommonErrors, language }) {
    return this.teacher.summariseClass({
      classInfo,
      objectiveStats,
      exampleItems: examplesOfCommonErrors,
      language,
    });
  }

  authorQuestion({ rawTextEn, rawTextZh, imageDescription, candidateObjectives, gradeBand, topic, subtopic, language }) {
    return this.question.authorQuestion({ rawTextEn, rawTextZh, imageDescription, candidateObjectives, gradeBand, topic, subtopic, language });
  }

  generateGamification({ recentMasteryChanges, recentSessions, currentBadges, language }) {
    return this._runInline(GAMIFICATION_SYSTEM, language, {
      recent_mastery_changes: recentMasteryChanges,
      recent_sessions: recentSessions,
      current_badges: currentBadges,
    });
  }
}

module.exports = { AdaptiveAgent };
