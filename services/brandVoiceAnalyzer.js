/**
 * Brand Voice Analyzer
 * Learns brand voice/tone from past content versions
 * Extracts characteristics like formality, sentiment, tone, vocabulary
 */

const { pool } = require('../../db');

interface VoiceCharacteristics {
  formality: 'formal' | 'casual' | 'mixed';
  sentiment: 'positive' | 'neutral' | 'mixed';
  tone: string[]; // e.g., ['witty', 'professional', 'warm']
  vocabulary: {
    technical_terms: boolean;
    slang: boolean;
    industry_specific: boolean;
  };
  sentence_structure: 'short' | 'long' | 'mixed';
  emoji_usage: boolean;
  call_to_action_style: string;
  hashtag_style: string;
  common_phrases: string[];
}

/**
 * Analyze past content to extract voice characteristics
 */
async function analyzeBrandVoiceFromHistory(
  brandId: string,
  limit: number = 20
): Promise<VoiceCharacteristics | null> {
  try {
    // Get past content: posts, campaigns, captions
    const [postsResult, campaignsResult, draftsResult] = await Promise.all([
      pool.query(
        `SELECT caption FROM social_content_posts WHERE brand_id = $1
         ORDER BY created_at DESC LIMIT $2`,
        [brandId, limit]
      ),
      pool.query(
        `SELECT name, brief FROM social_campaigns WHERE brand_id = $1
         ORDER BY created_at DESC LIMIT $2`,
        [brandId, limit]
      ),
      pool.query(
        `SELECT script, objective FROM social_content_drafts WHERE brand_id = $1
         ORDER BY updated_at DESC LIMIT $2`,
        [brandId, limit]
      ),
    ]);

    const allContent = [
      ...postsResult.rows.map((r: any) => r.caption || ''),
      ...campaignsResult.rows.map((r: any) => (r.name + ' ' + (r.brief || ''))),
      ...draftsResult.rows.map((r: any) => (r.script || '')),
    ].filter((c: string) => c.trim().length > 0);

    if (allContent.length === 0) {
      return null; // No past content to analyze
    }

    // Combine all content for analysis
    const combinedText = allContent.join(' ');

    // Analyze characteristics
    const characteristics = analyzeTextCharacteristics(combinedText);

    return characteristics;
  } catch (err) {
    console.error('Error analyzing brand voice:', err);
    return null;
  }
}

/**
 * Analyze text for voice characteristics
 */
function analyzeTextCharacteristics(text: string): VoiceCharacteristics {
  const lowercaseText = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = lowercaseText.split(/\s+/);
  const avgSentenceLength = words.length / Math.max(sentences.length, 1);

  // Formality analysis
  const formalIndicators = [
    'therefore', 'furthermore', 'consequently', 'hereby', 'aforementioned',
    'regarding', 'pertaining', 'nonetheless', 'moreover'
  ];
  const casualIndicators = [
    "don't", "can't", "won't", "yeah", "gonna", "wanna", 'awesome', 'cool',
    'love', 'amazing', 'thanks'
  ];

  const formalCount = formalIndicators.filter(w => lowercaseText.includes(w)).length;
  const casualCount = casualIndicators.filter(w => lowercaseText.includes(w)).length;

  let formality: 'formal' | 'casual' | 'mixed' = 'mixed';
  if (formalCount > casualCount) formality = 'formal';
  else if (casualCount > formalCount) formality = 'casual';

  // Sentiment analysis
  const positiveWords = [
    'great', 'amazing', 'wonderful', 'love', 'excellent', 'perfect', 'awesome',
    'fantastic', 'incredible', 'beautiful', 'brilliant', 'outstanding'
  ];
  const negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'poor', 'worst', 'horrible', 'disappointing'
  ];

  const positiveCount = positiveWords.filter(w => lowercaseText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowercaseText.includes(w)).length;

  let sentiment: 'positive' | 'neutral' | 'mixed' = 'neutral';
  if (positiveCount > negativeCount * 2) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'mixed';

  // Tone detection
  const tones: string[] = [];
  if (lowercaseText.includes('?') && lowercaseText.split('?').length > 3) tones.push('conversational');
  if (casualCount > formalCount) tones.push('friendly');
  if (formalCount > casualCount) tones.push('professional');
  if (lowercaseText.match(/😄|😂|😊|🎉|👍|💡/g)) tones.push('expressive');
  if (lowercaseText.includes('!') && text.split('!').length > sentences.length / 2) tones.push('enthusiastic');
  if (lowercaseText.includes('...')) tones.push('thoughtful');

  // Vocabulary analysis
  const technicalTerms = /\b(algorithm|data|analytics|optimization|framework|integration|deployment)\b/gi;
  const slang = /\b(gotta|sorta|kinda|gonna|wanna|ain't)\b/gi;

  // CTA style analysis
  const callToActions = text.match(/(?:click|tap|download|subscribe|join|sign up|buy|purchase|learn more|discover|explore)/gi) || [];
  const ctaStyle = callToActions.length > 0 ? callToActions[Math.floor(Math.random() * callToActions.length)] : 'standard';

  // Hashtag analysis
  const hashtags = text.match(/#\w+/g) || [];
  const hashtagStyle = hashtags.length > 5 ? 'many' : (hashtags.length > 0 ? 'moderate' : 'minimal');

  // Common phrases (most frequently repeated)
  const phraseMatches = text.match(/\b(\w+\s+\w+\s+\w+)\b/gi) || [];
  const phraseFreq: Record<string, number> = {};
  phraseMatches.forEach(phrase => {
    phraseFreq[phrase] = (phraseFreq[phrase] || 0) + 1;
  });
  const commonPhrases = Object.entries(phraseFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);

  return {
    formality,
    sentiment,
    tone: tones.length > 0 ? tones : ['neutral'],
    vocabulary: {
      technical_terms: technicalTerms.test(lowercaseText),
      slang: slang.test(lowercaseText),
      industry_specific: false, // Could be enhanced
    },
    sentence_structure: avgSentenceLength < 10 ? 'short' : (avgSentenceLength > 20 ? 'long' : 'mixed'),
    emoji_usage: /\p{Emoji}/gu.test(text),
    call_to_action_style: ctaStyle,
    hashtag_style: hashtagStyle,
    common_phrases: commonPhrases,
  };
}

/**
 * Get or learn brand voice
 * Returns stored voice if available, otherwise analyzes from past content
 */
async function getBrandVoiceProfile(brandId: string): Promise<VoiceCharacteristics | null> {
  try {
    // Check if we have stored voice profile
    const stored = await pool.query(
      `SELECT voice_profile FROM brands WHERE brand_id = $1`,
      [brandId]
    );

    if (stored.rows[0]?.voice_profile) {
      return stored.rows[0].voice_profile;
    }

    // Otherwise, analyze from past content
    const learned = await analyzeBrandVoiceFromHistory(brandId);

    if (learned) {
      // Store for future use
      await pool.query(
        `UPDATE brands SET voice_profile = $1 WHERE brand_id = $2`,
        [JSON.stringify(learned), brandId]
      );
    }

    return learned;
  } catch (err) {
    console.error('Error getting brand voice profile:', err);
    return null;
  }
}

module.exports = {
  analyzeBrandVoiceFromHistory,
  getBrandVoiceProfile,
  analyzeTextCharacteristics,
};
