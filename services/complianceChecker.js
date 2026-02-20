/**
 * Compliance Checker
 * Validates copy/visuals against brand profile (voice, colors, guidelines)
 * Scores compliance 0-10 with specific feedback
 */

const { getBrandVoiceProfile, analyzeTextCharacteristics } = require('./brandVoiceAnalyzer');

interface ComplianceScore {
  overall_score: number; // 0-10
  voice_alignment: {
    score: number;
    feedback: string;
    issues: string[];
    suggestions: string[];
  };
  color_compliance: {
    score: number;
    feedback: string;
    used_colors: string[];
    misaligned_colors: string[];
  };
  guidelines_compliance: {
    score: number;
    feedback: string;
    violations: string[];
  };
  brand_fit: {
    score: number;
    feedback: string;
  };
  summary: string;
  can_proceed: boolean; // true if score >= 7
  action: 'approve' | 'revise' | 'block';
}

/**
 * Check copy compliance against brand voice
 */
async function checkCopyCompliance(
  brandId: string,
  copy: string,
  statedVoiceTone?: string
): Promise<ComplianceScore> {
  try {
    // Get brand voice profile (learned from past content)
    const learnedVoice = await getBrandVoiceProfile(brandId);

    // Analyze the new copy
    const newContentCharacteristics = analyzeTextCharacteristics(copy);

    let voiceScore = 7; // Start with baseline
    const voiceIssues: string[] = [];
    const voiceSuggestions: string[] = [];

    if (learnedVoice) {
      // Compare formality
      if (learnedVoice.formality !== 'mixed' && newContentCharacteristics.formality !== learnedVoice.formality) {
        voiceScore -= 1.5;
        voiceIssues.push(`Formality mismatch: brand uses ${learnedVoice.formality}, but copy is ${newContentCharacteristics.formality}`);
        voiceSuggestions.push(`Adjust formality to match brand's ${learnedVoice.formality} style`);
      }

      // Compare sentiment
      if (learnedVoice.sentiment !== 'neutral' && newContentCharacteristics.sentiment !== learnedVoice.sentiment) {
        voiceScore -= 1;
        voiceIssues.push(`Sentiment mismatch: brand is ${learnedVoice.sentiment}, but copy is ${newContentCharacteristics.sentiment}`);
      }

      // Check tone alignment
      const matchingTones = newContentCharacteristics.tone.filter(t => learnedVoice.tone.includes(t));
      if (matchingTones.length === 0 && learnedVoice.tone.length > 0) {
        voiceScore -= 2;
        voiceIssues.push(`Tone mismatch: brand uses [${learnedVoice.tone.join(', ')}], but copy doesn't match`);
        voiceSuggestions.push(`Incorporate brand tones: ${learnedVoice.tone.join(', ')}`);
      }

      // Check common phrases
      const hasCommonPhrase = learnedVoice.common_phrases.some(phrase => copy.toLowerCase().includes(phrase.toLowerCase()));
      if (!hasCommonPhrase && learnedVoice.common_phrases.length > 0) {
        voiceScore -= 0.5;
      }

      // Check emoji usage consistency
      if (learnedVoice.emoji_usage && !newContentCharacteristics.emoji_usage) {
        voiceScore -= 0.5;
        voiceSuggestions.push('Brand typically uses emojis - consider adding some');
      } else if (!learnedVoice.emoji_usage && newContentCharacteristics.emoji_usage) {
        voiceScore -= 0.5;
        voiceIssues.push('Brand avoids emojis - remove them for consistency');
      }

      // Check CTA style consistency
      if (!copy.includes('cta') && !copy.toLowerCase().match(/click|tap|download|subscribe|join|sign up/i)) {
        // No CTA present
        voiceScore -= 1;
        voiceSuggestions.push(`Add call-to-action: "${learnedVoice.call_to_action_style}"`);
      }
    }

    // Check against stated voice (if provided)
    if (statedVoiceTone) {
      if (!newContentCharacteristics.tone.includes(statedVoiceTone.toLowerCase())) {
        voiceScore -= 1;
        voiceIssues.push(`Stated voice "${statedVoiceTone}" not reflected in copy`);
      }
    }

    voiceScore = Math.max(0, Math.min(10, voiceScore));

    return {
      overall_score: voiceScore,
      voice_alignment: {
        score: voiceScore,
        feedback: voiceScore >= 8 ? '✓ Copy aligns well with brand voice' : voiceScore >= 6 ? '⚠ Minor voice adjustments needed' : '❌ Major voice revision required',
        issues: voiceIssues,
        suggestions: voiceSuggestions,
      },
      color_compliance: {
        score: 10,
        feedback: 'Visual color analysis pending',
        used_colors: [],
        misaligned_colors: [],
      },
      guidelines_compliance: {
        score: 10,
        feedback: 'No guidelines uploaded yet',
        violations: [],
      },
      brand_fit: {
        score: voiceScore,
        feedback: `Copy fits brand profile: ${voiceScore >= 8 ? 'Excellent' : voiceScore >= 6 ? 'Good' : 'Needs work'}`,
      },
      summary: `Voice compliance: ${voiceScore}/10. ${voiceIssues.length > 0 ? voiceIssues[0] : 'Good alignment'}`,
      can_proceed: voiceScore >= 7,
      action: voiceScore >= 8 ? 'approve' : voiceScore >= 6 ? 'revise' : 'block',
    };
  } catch (err) {
    console.error('Error checking copy compliance:', err);
    return {
      overall_score: 5,
      voice_alignment: {
        score: 5,
        feedback: 'Error analyzing compliance',
        issues: [err.message],
        suggestions: [],
      },
      color_compliance: { score: 5, feedback: 'Error', used_colors: [], misaligned_colors: [] },
      guidelines_compliance: { score: 5, feedback: 'Error', violations: [] },
      brand_fit: { score: 5, feedback: 'Error' },
      summary: 'Compliance check failed',
      can_proceed: false,
      action: 'block',
    };
  }
}

/**
 * Check visual/color compliance against brand colors
 */
function checkColorCompliance(
  usedColors: string[],
  brandColorPalette?: { primary: string; secondary: string; accent: string }
): { score: number; feedback: string; misaligned: string[] } {
  if (!brandColorPalette || usedColors.length === 0) {
    return {
      score: 10,
      feedback: 'No brand color palette defined',
      misaligned: [],
    };
  }

  const brandColors = [
    brandColorPalette.primary?.toLowerCase(),
    brandColorPalette.secondary?.toLowerCase(),
    brandColorPalette.accent?.toLowerCase(),
  ].filter(Boolean);

  const misaligned = usedColors.filter(color => !brandColors.includes(color.toLowerCase()));

  let score = 10;
  if (misaligned.length > 0) {
    score -= misaligned.length * 1.5; // -1.5 points per off-brand color
  }

  score = Math.max(0, Math.min(10, score));

  return {
    score,
    feedback: misaligned.length === 0 ? '✓ All colors match brand palette' : `⚠ ${misaligned.length} color(s) outside brand palette`,
    misaligned,
  };
}

/**
 * Comprehensive brand compliance check
 */
async function checkBrandCompliance(
  brandId: string,
  content: {
    copy?: string;
    colors?: string[];
  },
  brandProfile?: any
): Promise<ComplianceScore> {
  let score = 0;
  let weight = 0;

  // Check copy compliance
  if (content.copy) {
    const copyScore = await checkCopyCompliance(brandId, content.copy, brandProfile?.voiceTone);
    score += copyScore.overall_score * 0.6; // 60% weight
    weight += 0.6;
  }

  // Check color compliance
  if (content.colors && brandProfile?.colorPalette) {
    const colorResult = checkColorCompliance(content.colors, brandProfile.colorPalette);
    score += colorResult.score * 0.4; // 40% weight
    weight += 0.4;
  }

  const finalScore = weight > 0 ? score / weight : 5;

  return {
    overall_score: finalScore,
    voice_alignment: { score: finalScore, feedback: '', issues: [], suggestions: [] },
    color_compliance: { score: finalScore, feedback: '', used_colors: content.colors || [], misaligned_colors: [] },
    guidelines_compliance: { score: 10, feedback: 'Guidelines not yet integrated', violations: [] },
    brand_fit: { score: finalScore, feedback: '' },
    summary: `Overall brand compliance: ${finalScore}/10`,
    can_proceed: finalScore >= 7,
    action: finalScore >= 8 ? 'approve' : finalScore >= 6 ? 'revise' : 'block',
  };
}

module.exports = {
  checkCopyCompliance,
  checkColorCompliance,
  checkBrandCompliance,
};
