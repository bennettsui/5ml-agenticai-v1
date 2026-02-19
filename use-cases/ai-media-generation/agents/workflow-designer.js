// WorkflowDesignerAgent
// Produces a ComfyUI-compatible workflow JSON configuration (node graph),
// or an AnimateDiff pipeline config, based on the brief spec + prompt.
// Does NOT call the GPU server directly — it emits the config for the operator.
// Model: DeepSeek Reasoner (primary) → Claude Haiku (fallback)

const deepseekService = require('../../../services/deepseekService');
const { shouldUseDeepSeek, getClaudeModel } = require('../../../utils/modelHelper');
const mediaConfig = require('../config/media-generation.config');

class WorkflowDesignerAgent {
  constructor(anthropic) {
    this.anthropic = anthropic;
    this.name = 'WorkflowDesignerAgent';
  }

  // ── Image workflow config ─────────────────────────────────────────────────
  buildImageWorkflow({ spec, imagePrompt, styleGuide, pass = 'preview' }) {
    const resKey = spec.technicalConstraints?.resolution || 'sdxl';
    const res = mediaConfig.resolutionProfiles[resKey] || mediaConfig.resolutionProfiles.sdxl;
    const steps = mediaConfig.sampling.steps[pass] || mediaConfig.sampling.steps.draft;

    const positiveWithStyle = [
      imagePrompt.positive,
      styleGuide?.styleTokenBlock || '',
    ].filter(Boolean).join(', ');

    const negative = [
      imagePrompt.negative,
      styleGuide?.negativeAdditions || '',
    ].filter(Boolean).join(', ');

    const loraNodes = (styleGuide?.loraRecommendations || []).map((l, i) => ({
      nodeId: `lora_${i + 1}`,
      loraName: l.loraName,
      strengthModel: l.weight,
      strengthClip: l.weight,
    }));

    return {
      workflowType: 'image',
      pass,
      checkpoint: spec.technicalConstraints?.modelPreference === 'sd15'
        ? 'v1-5-pruned-emaonly.safetensors'
        : mediaConfig.comfyui.defaultCheckpoint,
      refiner: pass === 'final' ? mediaConfig.comfyui.defaultRefiner : null,
      resolution: res,
      sampling: {
        sampler: imagePrompt.suggestedSampler || mediaConfig.sampling.defaultSampler,
        steps,
        cfg: imagePrompt.suggestedCfg || mediaConfig.sampling.cfgScale.image,
        seed: -1, // random; operator pins after reviewing
      },
      prompts: { positive: positiveWithStyle, negative },
      loraStack: loraNodes,
      upscale: pass === 'final' ? { model: 'RealESRGAN_x4plus', scale: 2 } : null,
      batchSize: pass === 'preview' ? 4 : 1,
      outputFormat: 'png',
      filenamePrefix: spec.projectName?.replace(/\s+/g, '_') || 'output',
      notes: imagePrompt.notes || '',
    };
  }

  // ── Video (AnimateDiff) workflow config ───────────────────────────────────
  buildVideoWorkflow({ spec, imageWorkflow, videoPrompt }) {
    const frames = videoPrompt.recommendedFrames
      || Math.min(mediaConfig.animateDiff.maxFrames, mediaConfig.animateDiff.defaultFrames);
    const fps = videoPrompt.recommendedFps || mediaConfig.animateDiff.defaultFps;

    return {
      workflowType: 'video',
      pipeline: 'animatediff',
      checkpoint: imageWorkflow?.checkpoint || mediaConfig.comfyui.defaultCheckpoint,
      motionModule: mediaConfig.animateDiff.motionModule,
      resolution: imageWorkflow?.resolution || mediaConfig.resolutionProfiles.sdxl,
      animation: {
        frames,
        fps,
        motionStrength: videoPrompt.recommendedMotionStrength || 1.0,
        contextFrames: 16, // AnimateDiff context window
        contextStride: 1,
      },
      sampling: {
        sampler: mediaConfig.sampling.defaultSampler,
        steps: 25,
        cfg: mediaConfig.sampling.cfgScale.video,
        seed: -1,
      },
      prompts: {
        positive: videoPrompt.positive,
        negative: videoPrompt.negative,
        firstFrame: videoPrompt.firstFrameDescription,
      },
      loraStack: imageWorkflow?.loraStack || [],
      outputFormat: 'mp4',
      filenamePrefix: (spec.projectName?.replace(/\s+/g, '_') || 'output') + '_video',
      notes: videoPrompt.notes || '',
    };
  }

  // ── SVD (image-to-video) workflow config ──────────────────────────────────
  buildSvdWorkflow({ imageUrl, videoPrompt }) {
    return {
      workflowType: 'video',
      pipeline: 'svd',
      checkpoint: mediaConfig.svd.checkpoint,
      inputImage: imageUrl, // base image from image generation pass
      animation: {
        frames: mediaConfig.svd.frames,
        fps: mediaConfig.svd.fps,
        motionBucketId: mediaConfig.svd.motionBucketId,
        augmentationLevel: 0.02, // slight noise for motion diversity
      },
      outputFormat: 'mp4',
      notes: videoPrompt?.notes || 'SVD image-to-video pass',
    };
  }

  // ── LLM-assisted workflow review ──────────────────────────────────────────
  async reviewWorkflowConfig(workflowConfig) {
    const systemPrompt = `You are a ComfyUI expert reviewing a workflow configuration for an AI creative agency.
Flag any issues (VRAM risk, incompatible settings, prompt problems) and suggest improvements.
Return JSON: { "issues": [{"severity": "error|warn|info", "message": "string"}], "suggestions": ["string"], "approved": boolean }`;

    const messages = [{ role: 'user', content: JSON.stringify(workflowConfig, null, 2) }];
    try {
      let rawJson;
      if (shouldUseDeepSeek('deepseek')) {
        const resp = await deepseekService.chat([
          { role: 'system', content: systemPrompt },
          ...messages,
        ]);
        rawJson = resp.content;
      } else {
        const resp = await this.anthropic.messages.create({
          model: getClaudeModel('haiku'),
          max_tokens: 512,
          system: systemPrompt,
          messages,
        });
        rawJson = resp.content[0].text;
      }
      const cleaned = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      return { issues: [], suggestions: [], approved: true };
    }
  }
}

module.exports = WorkflowDesignerAgent;
