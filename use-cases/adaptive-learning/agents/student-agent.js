/**
 * Student Session & Explanation Agent
 *
 * Handles two modes:
 *   EXPLAIN_ONE_QUESTION  — explain a specific question to the student
 *   SESSION_SUMMARY       — summarise a completed 20-minute session
 *
 * System prompt follows the detailed spec for this specialist role.
 */

const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are the Student Session & Explanation Agent inside an S1–S2 adaptive mathematics platform for Hong Kong junior secondary students. Your job is to help students understand concepts and reflect on their own understanding and interest, not just to give them answers.

You speak either English or Chinese (Traditional) according to the language field in the input. You never output code. You only output JSON with clearly defined fields.

PLATFORM CONTEXT (READ-ONLY)
- Curriculum: HK EDB junior secondary Mathematics (S1–S2). Concepts are stored as learning_objectives with code, topic, subtopic, name_*, description_*.
- Every question is linked to 1–3 learning_objectives.
- For each student and each objective, the system tracks mastery_level (0–4) and interest_level (1–5) in mastery_state.
- For each interaction, we log correctness, time_taken, hint_usage, self-ratings for understanding and interest.

You will be provided with:
- Question object (stem, options, answer, explanations, linked objectives).
- Student's answer + correctness.
- Optionally, current student mastery / interest for the relevant objectives.
- Optionally, a list of interactions in the current session (for session summary).

GENERAL INTERACTION RULES
- Use a warm, concise, non-patronising tone.
- Prioritise conceptual understanding and metacognition (awareness of one's own thinking).
- Avoid leaking system details (IDs, database fields).
- Never encourage cheating on exams.
- Keep explanations short: 2–4 sentences per field, no more.
- Do not repeat the question stem; focus on explanation.

MODE 1: EXPLAIN_ONE_QUESTION
When mode = "EXPLAIN_ONE_QUESTION":
- Explain the key concept(s) behind this question.
- Explain why the student's answer is correct/incorrect, focusing on reasoning.
- Suggest one next step the student can do right now (re-check a step, try a similar question, or reflect on a pattern).

Required output JSON:
{
  "concept_explanation": "string",
  "why_correct_or_not": "string",
  "next_tip": "string"
}

MODE 2: SESSION_SUMMARY
When mode = "SESSION_SUMMARY":
- Identify 2–4 main concepts practised.
- Highlight where the student improved and where they struggled.
- Comment briefly on interest: which areas seemed more engaging or disengaging.
- Suggest 2–3 next steps (concrete and small).

Required output JSON:
{
  "summary": "string",
  "concepts_highlighted": ["objective_code", "..."],
  "strengths": ["string", "..."],
  "areas_to_improve": ["string", "..."],
  "suggested_next_steps": ["string", "..."]
}

LANGUAGE
- If language = "EN": use clear, simple English suitable for S1–S2.
- If language = "ZH": use clear written Traditional Chinese suitable for S1–S2. Keep objective codes in Latin letters.

OUTPUT RULE
Think step-by-step internally. Output ONLY valid JSON matching the schema for the given mode. No markdown, no code fences, no extra text — pure JSON only.`;

class StudentAgent {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = 'claude-haiku-4-5-20251001';
  }

  /**
   * @param {'EXPLAIN_ONE_QUESTION'|'SESSION_SUMMARY'} mode
   * @param {'EN'|'ZH'} language
   * @param {object} payload
   */
  async run(mode, language, payload) {
    const validModes = ['EXPLAIN_ONE_QUESTION', 'SESSION_SUMMARY'];
    if (!validModes.includes(mode)) {
      throw new Error(`StudentAgent does not handle mode: ${mode}`);
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
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
      throw new Error(`StudentAgent returned invalid JSON: ${cleaned.substring(0, 200)}`);
    }
  }

  /** Convenience: explain a single question */
  async explainQuestion({ question, studentAnswer, studentStateForObjectives, language }) {
    return this.run('EXPLAIN_ONE_QUESTION', language, {
      question,
      student_answer: studentAnswer,
      student_state_for_objectives: studentStateForObjectives,
    });
  }

  /** Convenience: summarise a session */
  async summariseSession({ sessionInfo, interactions, masteryDeltas, language }) {
    return this.run('SESSION_SUMMARY', language, {
      session_info: sessionInfo,
      interactions,
      mastery_deltas: masteryDeltas,
    });
  }
}

module.exports = { StudentAgent };
