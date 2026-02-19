// VideoAnalyzerAgent
// Analyzes video URLs (especially YouTube) to reverse-engineer video prompts.
//
// Open-source pipeline:
//  1. yt-dlp (if installed) — extract metadata, title, description, auto-captions
//  2. Claude Sonnet Vision — analyze keyframe screenshots if provided
//  3. LLM synthesis — produce AnimateDiff / SVD motion prompt from combined signals
//
// Since yt-dlp is a system dependency, this agent gracefully falls back to
// metadata-only analysis if yt-dlp is not available.
//
// Model: Claude Sonnet Vision (keyframes) + DeepSeek (synthesis)

const { execSync } = require('child_process');
const deepseekService = require('../../../services/deepseekService');
const { shouldUseDeepSeek, getClaudeModel } = require('../../../utils/modelHelper');

class VideoAnalyzerAgent {
  constructor(anthropic) {
    this.anthropic = anthropic;
    this.name = 'VideoAnalyzerAgent';
  }

  // ── Main analysis entry point ─────────────────────────────────────────────
  async analyzeVideoUrl(url, options = {}) {
    const { keyframeBase64List = [], targetChannel = null } = options;

    // Step 1: Extract metadata via yt-dlp if available
    let metadata = null;
    try {
      metadata = this._extractYtDlpMetadata(url);
    } catch {
      metadata = { url, title: url, description: '', captions: '', error: 'yt-dlp not available' };
    }

    // Step 2: Analyze keyframes if provided
    let frameAnalyses = [];
    if (keyframeBase64List.length > 0) {
      frameAnalyses = await this._analyzeKeyframes(keyframeBase64List.slice(0, 6)); // max 6 frames
    }

    // Step 3: Synthesize into a video prompt
    return await this._synthesizeVideoPrompt(metadata, frameAnalyses, targetChannel);
  }

  // ── yt-dlp metadata extraction ────────────────────────────────────────────
  _extractYtDlpMetadata(url) {
    // yt-dlp must be installed: pip install yt-dlp
    const output = execSync(
      `yt-dlp --dump-json --skip-download --no-warnings "${url}"`,
      { timeout: 30000, encoding: 'utf8' }
    );
    const data = JSON.parse(output.trim());
    return {
      url,
      title: data.title || '',
      description: (data.description || '').substring(0, 2000),
      duration: data.duration,
      fps: data.fps,
      width: data.width,
      height: data.height,
      categories: data.categories || [],
      tags: (data.tags || []).slice(0, 20),
      captions: this._extractCaptions(data),
      uploader: data.uploader || '',
      viewCount: data.view_count,
      thumbnailUrl: data.thumbnail,
    };
  }

  _extractCaptions(data) {
    try {
      // Auto-generated captions (English preferred)
      const subs = data.subtitles?.en || data.automatic_captions?.en;
      if (!subs?.length) return '';
      // Just use the description as a proxy — actual subtitle download requires more setup
      return data.description?.substring(0, 1000) || '';
    } catch {
      return '';
    }
  }

  // ── Claude Vision keyframe analysis ──────────────────────────────────────
  async _analyzeKeyframes(frames) {
    const analyses = [];
    for (const frame of frames) {
      try {
        const resp = await this.anthropic.messages.create({
          model: getClaudeModel('sonnet'),
          max_tokens: 512,
          system: `Briefly describe this video frame for prompt engineering. Focus on: composition, subject, camera angle, motion cues, style, lighting. Return JSON: { "description": "string", "motionCues": ["string"], "style": "string", "cameraAngle": "string" }`,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data: frame } },
              { type: 'text', text: 'Analyze this video frame.' },
            ],
          }],
        });
        const cleaned = resp.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analyses.push(JSON.parse(cleaned));
      } catch {
        // skip failed frames
      }
    }
    return analyses;
  }

  // ── Synthesize final video prompt ─────────────────────────────────────────
  async _synthesizeVideoPrompt(metadata, frameAnalyses, targetChannel) {
    const systemPrompt = `You are an AnimateDiff / Stable Video Diffusion prompt engineer.
Given video metadata (title, description, tags, captions) and optional keyframe analyses,
reverse-engineer the visual style, motion, and camera work into:
1. A text-to-video prompt for AnimateDiff
2. An image-to-video (SVD) motion description
3. A reusable prompt template for producing similar-style content

Return ONLY JSON:
{
  "videoStyle": {
    "aesthetic": "string",
    "cinematicStyle": "string — e.g. 'handheld vlog', 'cinematic dolly', 'drone aerial'",
    "editingStyle": "string — cut pace, transitions",
    "colorGrading": "string"
  },
  "motionAnalysis": {
    "primaryMotion": "string — main camera movement",
    "subjectMotion": "string — how subjects move",
    "paceDescription": "string — slow/medium/fast"
  },
  "animateDiffPrompt": {
    "positive": "string — full AnimateDiff positive prompt with motion keywords",
    "negative": "string",
    "motionKeywords": ["string"],
    "recommendedMotionStrength": number,
    "recommendedFrames": number,
    "recommendedFps": number
  },
  "svdPrompt": {
    "firstFrameDescription": "string — describe the ideal base image for SVD",
    "motionBucketId": number,
    "notes": "string"
  },
  "promptTemplate": {
    "name": "string — template name",
    "description": "string",
    "basePositive": "string — core style tokens without subject",
    "motionTokens": ["string"],
    "tags": ["string"],
    "applicableChannels": ["string"]
  },
  "productionNotes": "string — how to reproduce this style",
  "toolRecommendation": "animatediff|svd|both",
  "openSourceNotes": "string — which open-source models/tools best match this style"
}`;

    const userContent = `Video metadata:\n${JSON.stringify(metadata, null, 2)}\n\nKeyframe analyses (${frameAnalyses.length} frames):\n${JSON.stringify(frameAnalyses, null, 2)}\n\nTarget channel: ${targetChannel || 'general'}`;

    try {
      let rawJson;
      const messages = [{ role: 'user', content: userContent }];
      if (shouldUseDeepSeek('deepseek')) {
        const resp = await deepseekService.chat([
          { role: 'system', content: systemPrompt },
          ...messages,
        ]);
        rawJson = resp.content;
      } else {
        const resp = await this.anthropic.messages.create({
          model: getClaudeModel('haiku'),
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        });
        rawJson = resp.content[0].text;
      }
      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return { metadata, frameAnalyses, ...JSON.parse(cleaned) };
    } catch (err) {
      console.error(`[${this.name}] Video synthesis failed:`, err.message);
      return {
        metadata,
        frameAnalyses,
        animateDiffPrompt: { positive: '', negative: '', motionKeywords: [] },
        promptTemplate: { name: 'Untitled', basePositive: '', motionTokens: [], tags: [] },
        productionNotes: `Error: ${err.message}`,
        toolRecommendation: 'animatediff',
      };
    }
  }

  // ── Check if yt-dlp is available ─────────────────────────────────────────
  static isYtDlpAvailable() {
    try {
      execSync('yt-dlp --version', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = VideoAnalyzerAgent;
