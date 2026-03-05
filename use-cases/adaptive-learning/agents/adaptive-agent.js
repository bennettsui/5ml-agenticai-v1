/**
 * Adaptive Learning Orchestrator
 *
 * Routes incoming requests to the appropriate specialist agent based on mode.
 *
 * ┌──────────────────────┬─────────────────────────────────────────────────┐
 * │  Agent               │  Modes                                          │
 * ├──────────────────────┼─────────────────────────────────────────────────┤
 * │  StudentAgent        │  EXPLAIN_ONE_QUESTION, SESSION_SUMMARY          │
 * │  TeacherAgent        │  CLASS_SUMMARY, STUDENT_PROFILE                 │
 * │  QuestionAgent       │  QUESTION_AUTHORING                             │
 * │  StudentUxAgent      │  WELCOME, SESSION_INTRO, QUESTION_FEEDBACK,     │
 * │                      │  SESSION_SUMMARY_STUDENT, GAMIFICATION_EVENT    │
 * │  TeacherGuideAgent   │  INTRO_PAGE, STEP_BY_STEP_FEATURE, FAQ          │
 * │  TechArchAgent       │  HIGH_LEVEL_ARCH, SEQUENCE_STUDENT_SESSION,     │
 * │                      │  SEQUENCE_TEACHER_UPLOAD, SEQUENCE_TEACHER_DASHBOARD │
 * │  GamificationAgent   │  BADGE_MESSAGE, SUGGEST_MISSIONS, PROGRESS_NUDGE│
 * │  AdminReportAgent    │  TERM_REPORT, GRADE_REPORT, CLASS_REPORT        │
 * └──────────────────────┴─────────────────────────────────────────────────┘
 *
 * Legacy mode aliases (backwards-compat):
 *   STUDENT_EXPLANATION     → EXPLAIN_ONE_QUESTION
 *   STUDENT_SESSION_SUMMARY → SESSION_SUMMARY
 *   TEACHER_CLASS_SUMMARY   → CLASS_SUMMARY
 *   GAMIFICATION_MESSAGE    → GAMIFICATION_EVENT  (StudentUxAgent)
 */

const { StudentAgent }       = require('./student-agent');
const { TeacherAgent }       = require('./teacher-agent');
const { QuestionAgent }      = require('./question-agent');
const { StudentUxAgent }     = require('./student-ux-agent');
const { TeacherGuideAgent }  = require('./teacher-guide-agent');
const { TechArchAgent }      = require('./tech-arch-agent');
const { GamificationAgent }  = require('./gamification-agent');
const { AdminReportAgent }   = require('./admin-report-agent');

const MODE_ALIASES = {
  STUDENT_EXPLANATION:     'EXPLAIN_ONE_QUESTION',
  STUDENT_SESSION_SUMMARY: 'SESSION_SUMMARY',
  TEACHER_CLASS_SUMMARY:   'CLASS_SUMMARY',
  GAMIFICATION_MESSAGE:    'GAMIFICATION_EVENT',
};

const MODE_TO_AGENT = {
  // StudentAgent
  EXPLAIN_ONE_QUESTION:       'student',
  SESSION_SUMMARY:            'student',
  // TeacherAgent
  CLASS_SUMMARY:              'teacher',
  STUDENT_PROFILE:            'teacher',
  // QuestionAgent
  QUESTION_AUTHORING:         'question',
  // StudentUxAgent (in-app copy)
  WELCOME:                    'studentUx',
  SESSION_INTRO:              'studentUx',
  QUESTION_FEEDBACK:          'studentUx',
  SESSION_SUMMARY_STUDENT:    'studentUx',
  GAMIFICATION_EVENT:         'studentUx',
  // TeacherGuideAgent
  INTRO_PAGE:                 'teacherGuide',
  STEP_BY_STEP_FEATURE:       'teacherGuide',
  FAQ:                        'teacherGuide',
  // TechArchAgent
  HIGH_LEVEL_ARCH:            'techArch',
  SEQUENCE_STUDENT_SESSION:   'techArch',
  SEQUENCE_TEACHER_UPLOAD:    'techArch',
  SEQUENCE_TEACHER_DASHBOARD: 'techArch',
  // GamificationAgent (missions + badges)
  BADGE_MESSAGE:              'gamification',
  SUGGEST_MISSIONS:           'gamification',
  PROGRESS_NUDGE:             'gamification',
  // AdminReportAgent
  TERM_REPORT:                'adminReport',
  GRADE_REPORT:               'adminReport',
  CLASS_REPORT:               'adminReport',
  // Legacy inline
  ADMIN_SUMMARY:              'inlineAdmin',
};

class AdaptiveAgent {
  constructor() {
    this._student       = null;
    this._teacher       = null;
    this._question      = null;
    this._studentUx     = null;
    this._teacherGuide  = null;
    this._techArch      = null;
    this._gamification  = null;
    this._adminReport   = null;
  }

  get student()      { return (this._student      ??= new StudentAgent()); }
  get teacher()      { return (this._teacher      ??= new TeacherAgent()); }
  get question()     { return (this._question     ??= new QuestionAgent()); }
  get studentUx()    { return (this._studentUx    ??= new StudentUxAgent()); }
  get teacherGuide() { return (this._teacherGuide ??= new TeacherGuideAgent()); }
  get techArch()     { return (this._techArch     ??= new TechArchAgent()); }
  get gamification() { return (this._gamification ??= new GamificationAgent()); }
  get adminReport()  { return (this._adminReport  ??= new AdminReportAgent()); }

  /**
   * Route any mode to the right specialist agent.
   * @param {string} mode
   * @param {'EN'|'ZH'} language
   * @param {object} payload
   */
  async run(mode, language, payload) {
    const resolved = MODE_ALIASES[mode] || mode;
    const agentKey = MODE_TO_AGENT[resolved];

    if (!agentKey) throw new Error(`Unknown mode: ${mode}`);

    switch (agentKey) {
      case 'student':
        return this.student.run(resolved, language, payload);
      case 'teacher':
        return this.teacher.run(resolved, language, payload);
      case 'question':
        return this.question.run(resolved, language, payload);
      case 'studentUx':
        return this.studentUx.run(resolved, language, payload);
      case 'teacherGuide':
        return this.teacherGuide.run(resolved, language, payload);
      case 'techArch':
        return this.techArch.run(resolved, payload);
      case 'gamification':
        return this.gamification.run(resolved, language, payload);
      case 'adminReport':
        return this.adminReport.run(resolved, language, payload);
      case 'inlineAdmin':
        return this._runAdminSummary(language, payload);
      default:
        throw new Error(`Unrouted agent key: ${agentKey}`);
    }
  }

  /** Lightweight inline admin summary (no dedicated agent class needed). */
  async _runAdminSummary(language, payload) {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You are an admin summary agent for an adaptive S1–S2 math platform.
Given platform-level data (usage stats, error rates, content gaps, engagement), produce a concise operational summary.
Be factual. Output ONLY valid JSON:
{ "summary": "string", "flags": ["string", "..."], "recommendations": ["string", "..."] }`,
      messages: [{ role: 'user', content: JSON.stringify({ language: language || 'EN', payload }) }],
    });
    const raw = response.content[0]?.text || '{}';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  }

  // ─── Convenience pass-throughs (backwards compat) ────────────────────────────

  explainQuestion({ question, studentAnswer, studentState, language }) {
    return this.student.explainQuestion({
      question, studentAnswer,
      studentStateForObjectives: studentState ? [studentState] : undefined,
      language,
    });
  }

  summariseSession({ sessionInfo, interactions, masteryDeltas, language }) {
    return this.student.summariseSession({ sessionInfo, interactions, masteryDeltas, language });
  }

  summariseClass({ classInfo, objectiveStats, examplesOfCommonErrors, language }) {
    return this.teacher.summariseClass({
      classInfo, objectiveStats,
      exampleItems: examplesOfCommonErrors,
      language,
    });
  }

  authorQuestion(opts) {
    return this.question.authorQuestion(opts);
  }

  // Old generateGamification → StudentUxAgent (in-app copy layer)
  generateGamification({ recentMasteryChanges, recentSessions, currentBadges, language }) {
    return this.studentUx.run('GAMIFICATION_EVENT', language, {
      event_type: 'MISSION_SUGGESTION',
      recent_mastery_changes: recentMasteryChanges,
      recent_sessions: recentSessions,
      current_badges: currentBadges,
    });
  }
}

module.exports = { AdaptiveAgent };
