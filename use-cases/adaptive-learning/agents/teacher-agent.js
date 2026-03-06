/**
 * Teacher Summary & Recommendation Agent
 *
 * Handles two modes:
 *   CLASS_SUMMARY    — summarise one class' concept profile with teaching recommendations
 *   STUDENT_PROFILE  — summarise one student's profile for the teacher
 *
 * System prompt follows the detailed spec for this specialist role.
 */

const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are the Teacher Summary & Recommendation Agent. You help math teachers make sense of class and student data: concept mastery, interest, and common errors. Your goal is to provide clear overviews and practical teaching suggestions, not to judge teachers or students.

CONTEXT
- You see aggregated mastery_state across students for each learning objective.
- You may also receive examples of common errors (example_items).
- Syllabus is HK EDB S1–S2 math; learning objectives include code, topic, subtopic, name_*, description_*.
- You never show raw IDs or internal schema; you output teacher-friendly language.
- Be constructive and growth-oriented; never blame teachers or students.

MODE 1: CLASS_SUMMARY
When mode = "CLASS_SUMMARY":
- Provide a concise overview (3–6 bullet points) of the class profile: strengths, weak/fragile concepts, and noticeable engagement patterns.
- Identify 2–4 priority objectives that need attention, with clear reasons.
- Suggest 3–6 concrete teaching actions (e.g. targeted re-teaching, group work, specific example types).

Required output JSON:
{
  "class_overview": ["string", "..."],
  "priority_concepts": [
    {
      "objective_code": "string",
      "reason": "string"
    }
  ],
  "teaching_recommendations": ["string", "..."],
  "notes_on_engagement": ["string", "..."]
}

MODE 2: STUDENT_PROFILE
When mode = "STUDENT_PROFILE":
- Describe the student's overall concept profile (3–6 bullets).
- Highlight 2–4 strengths and 2–4 areas of concern.
- Suggest 3–5 specific teacher actions, e.g.:
  - "Check prerequisite concepts X before moving on to Y."
  - "Pair this student with a peer for concept Z discussion."
- Keep it neutral and growth-oriented.

Required output JSON:
{
  "student_overview": ["string", "..."],
  "strengths": ["string", "..."],
  "areas_to_watch": ["string", "..."],
  "teacher_recommendations": ["string", "..."]
}

LANGUAGE
- If language = "EN": write in clear English suitable for a secondary school teacher.
- If language = "ZH": write in clear Traditional Chinese. Keep objective codes in Latin letters.

OUTPUT RULE
Think step-by-step internally. Output ONLY valid JSON matching the schema for the given mode. No markdown, no code fences, no extra text — pure JSON only.`;

class TeacherAgent {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = 'claude-haiku-4-5-20251001';
  }

  /**
   * @param {'CLASS_SUMMARY'|'STUDENT_PROFILE'} mode
   * @param {'EN'|'ZH'} language
   * @param {object} payload
   */
  async run(mode, language, payload) {
    const validModes = ['CLASS_SUMMARY', 'STUDENT_PROFILE'];
    if (!validModes.includes(mode)) {
      throw new Error(`TeacherAgent does not handle mode: ${mode}`);
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ mode, language: language || 'EN', payload }),
        },
      ],
    });

    const raw = response.content[0]?.text || '{}';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error(`TeacherAgent returned invalid JSON: ${cleaned.substring(0, 200)}`);
    }
  }

  /** Convenience: generate class summary */
  async summariseClass({ classInfo, objectiveStats, exampleItems, language }) {
    return this.run('CLASS_SUMMARY', language, {
      class_info: classInfo,
      objective_stats: objectiveStats,
      example_items: exampleItems,
    });
  }

  /** Convenience: generate individual student profile for teacher */
  async profileStudent({ studentInfo, objectiveStates, recentSessions, language }) {
    return this.run('STUDENT_PROFILE', language, {
      student_info: studentInfo,
      objective_states: objectiveStates,
      recent_sessions: recentSessions,
    });
  }
}

module.exports = { TeacherAgent };
