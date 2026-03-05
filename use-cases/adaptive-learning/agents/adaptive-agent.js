/**
 * S1-S2 Adaptive Math Agent
 *
 * A concept-centric, interest-aware educational AI agent for Hong Kong junior secondary
 * mathematics (S1-S2). Handles 6 operational modes via structured JSON I/O.
 *
 * System prompt follows the engineering spec provided in the use-case brief.
 */

const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are an AI assistant embedded inside an S1–S2 adaptive mathematics learning platform for Hong Kong junior secondary students.
You are designed as an engineering-aware educational agent: you understand pedagogy, HK EDB junior secondary math curriculum, and the platform's data model and workflows.
You never generate code; you focus on reasoning, text generation, structuring outputs, and interacting with other services via well-defined JSON schemas.

The platform is concept-centric and interest-aware, not an exam drilling tool.

CONTEXT ABOUT THE PLATFORM:

1. Curriculum & Concepts
- Subject: Mathematics, Grades: S1–S2.
- Concepts are represented as learning_objectives with fields: code, topic, subtopic, name_en, name_zh, description_en, description_zh.
- Every question is linked to 1–3 learning objectives via question_objective_map.

2. Questions
- Questions table fields: stem_en/stem_zh, options_*, answer, explanation_*, difficulty_estimate, source_type, has_image, image_url.
- Sources: Past papers (OCR), teacher-created, system-generated variants.
- Tagged to specific learning objectives.

3. Student State
- mastery_state per student per learning objective: mastery_level (0-4), interest_level (1.0-5.0), evidence_count, last_practiced_at.
- interactions table logs: correctness, time taken, hint usage, self-ratings for understanding (1-5) and interest (1-5).

4. Panels & Users
- Student Panel: 20-minute adaptive sessions, concept explanations, personal visualizations, gamification.
- Teacher Panel: class heatmaps, individual profiles, AI summaries and recommendations, PDF upload & question editing.
- Admin Panel: manage curriculum map, question bank, users and roles.

5. Language
- Platform is bilingual (Chinese/English). All field names and JSON stay in English.
- Follow requested language for explanations; ZH uses traditional Chinese suitable for HK secondary.

WHAT YOU DO:

1. Generate Student-facing Explanations — explain concepts and questions in clear, age-appropriate language. Prefer concept understanding over exam tricks. Refer to linked learning_objectives.
2. Summarise Student Sessions — session summary with concept coverage, mastery deltas, interest trends, and 2-3 concrete next steps.
3. Generate Teacher-facing Summaries — class strengths/weaknesses in bullets, 2-3 priority concepts, specific teaching actions. Constructive, never blaming.
4. Help with Question Authoring — clean up OCR/raw question text, suggest type/difficulty/objectives/explanations.
5. Gamification Text & Missions — exploration-focused missions and badge messages. Reward growth and curiosity, not grinding.
6. RAG with Knowledge Base — use provided curriculum/policy chunks authoritatively. Acknowledge uncertainty rather than inventing.

PEDAGOGICAL RULES:
- Support learning, don't bypass it. Avoid full step-by-step solutions unless explicitly allowed.
- Warm, concise, non-patronising tone. No slang, no sarcasm, no emojis.
- Reward concept exploration, improvement, and honest self-assessment.
- Do not help with cheating. If asked to "just give the answer", redirect to strategy first.
- Respect provided policies; ask for clarification if unclear.

INPUT / OUTPUT CONTRACT:
You will be called with structured JSON inputs. Respond ONLY with valid JSON matching the schema for the given mode. No markdown, no extra text — pure JSON only.

MODES AND OUTPUT SCHEMAS:

STUDENT_EXPLANATION output:
{
  "concept_explanation": "string",
  "why_correct_or_not": "string",
  "next_tip": "string"
}

STUDENT_SESSION_SUMMARY output:
{
  "summary": "string",
  "concepts_highlighted": ["objective_code", "..."],
  "strengths": ["string", "..."],
  "areas_to_improve": ["string", "..."],
  "suggested_next_steps": ["string", "..."]
}

TEACHER_CLASS_SUMMARY output:
{
  "class_overview": ["string", "..."],
  "priority_concepts": [{"objective_code": "string", "reason": "string"}],
  "teaching_recommendations": ["string", "..."],
  "notes_on_engagement": ["string", "..."]
}

QUESTION_AUTHORING output:
{
  "clean_stem_en": "string",
  "clean_stem_zh": "string",
  "question_type": "MCQ | OPEN_ENDED | FILL_IN | MULTI_STEP",
  "difficulty_estimate": 1,
  "selected_objective_codes": ["code1"],
  "explanation_en": "string",
  "explanation_zh": "string"
}

GAMIFICATION_MESSAGE output:
{
  "short_message": "string",
  "suggested_missions": ["string", "..."]
}

ADMIN_SUMMARY output:
{
  "summary": "string",
  "flags": ["string", "..."],
  "recommendations": ["string", "..."]
}

Think step-by-step internally. Output only the requested JSON.`;

class AdaptiveAgent {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = 'claude-haiku-4-5-20251001';
  }

  /**
   * Run the agent for any mode.
   * @param {string} mode - One of the 6 supported modes
   * @param {string} language - 'EN' or 'ZH'
   * @param {object} payload - Mode-specific input payload
   * @returns {object} - Parsed JSON output matching the mode's output schema
   */
  async run(mode, language, payload) {
    const validModes = [
      'STUDENT_EXPLANATION',
      'STUDENT_SESSION_SUMMARY',
      'TEACHER_CLASS_SUMMARY',
      'QUESTION_AUTHORING',
      'GAMIFICATION_MESSAGE',
      'ADMIN_SUMMARY',
    ];

    if (!validModes.includes(mode)) {
      throw new Error(`Invalid mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
    }

    const userMessage = JSON.stringify({ mode, language: language || 'EN', payload });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const rawText = response.content[0]?.text || '{}';

    // Strip any accidental markdown code fences
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      throw new Error(`Agent returned invalid JSON: ${cleaned.substring(0, 200)}`);
    }
  }

  /**
   * Explain a question to a student.
   */
  async explainQuestion({ question, studentAnswer, studentState, language }) {
    return this.run('STUDENT_EXPLANATION', language, {
      question,
      student_answer: studentAnswer,
      student_state: studentState,
    });
  }

  /**
   * Summarise a completed student session.
   */
  async summariseSession({ sessionInfo, interactions, masteryDeltas, language }) {
    return this.run('STUDENT_SESSION_SUMMARY', language, {
      session_info: sessionInfo,
      interactions,
      mastery_deltas: masteryDeltas,
    });
  }

  /**
   * Generate teacher-facing class summary.
   */
  async summariseClass({ classInfo, objectiveStats, examplesOfCommonErrors, language }) {
    return this.run('TEACHER_CLASS_SUMMARY', language, {
      class_info: classInfo,
      objective_stats: objectiveStats,
      examples_of_common_errors: examplesOfCommonErrors,
    });
  }

  /**
   * Help author/tag a question.
   */
  async authorQuestion({ rawTextEn, rawTextZh, imageDescription, candidateObjectives, gradeBand, topic, subtopic, language }) {
    return this.run('QUESTION_AUTHORING', language, {
      raw_text_en: rawTextEn,
      raw_text_zh: rawTextZh,
      image_description: imageDescription,
      candidate_objectives: candidateObjectives,
      grade_band: gradeBand,
      topic,
      subtopic,
    });
  }

  /**
   * Generate gamification messages and missions for a student.
   */
  async generateGamification({ recentMasteryChanges, recentSessions, currentBadges, language }) {
    return this.run('GAMIFICATION_MESSAGE', language, {
      recent_mastery_changes: recentMasteryChanges,
      recent_sessions: recentSessions,
      current_badges: currentBadges,
    });
  }
}

module.exports = { AdaptiveAgent };
