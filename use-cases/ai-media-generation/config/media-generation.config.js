// AI Media Generation — Configuration
// Centralised settings for ComfyUI, SVD, AnimateDiff, and model routing

const config = {
  // ─── ComfyUI / Image generation ──────────────────────────────────────────
  comfyui: {
    baseUrl: process.env.COMFYUI_URL || 'http://localhost:8188',
    timeout: 120_000, // 2 min — SDXL + refiner pass
    defaultCheckpoint: process.env.COMFYUI_CHECKPOINT || 'sd_xl_base_1.0.safetensors',
    defaultRefiner: process.env.COMFYUI_REFINER || 'sd_xl_refiner_1.0.safetensors',
    outputDir: process.env.COMFYUI_OUTPUT_DIR || '/tmp/comfyui-outputs',
  },

  // ─── AnimateDiff / Video generation ──────────────────────────────────────
  animateDiff: {
    baseUrl: process.env.ANIMATEDIFF_URL || 'http://localhost:8188',
    motionModule: process.env.ANIMATEDIFF_MOTION || 'mm_sd_v15_v2.ckpt',
    defaultFps: 8,
    defaultFrames: 16, // ~2s @ 8fps — fits VRAM comfortably on 16 GB
    maxFrames: 32,     // ~4s; beyond this risks OOM on 16 GB cards
    timeout: 300_000,  // 5 min for longer video jobs
  },

  // ─── Stable Video Diffusion ───────────────────────────────────────────────
  svd: {
    baseUrl: process.env.SVD_URL || 'http://localhost:8188',
    checkpoint: process.env.SVD_CHECKPOINT || 'svd_xt.safetensors',
    frames: 25,      // SVD-XT default
    fps: 6,
    motionBucketId: 127, // higher = more motion
    timeout: 300_000,
  },

  // ─── VRAM / resolution constraints ───────────────────────────────────────
  resolutionProfiles: {
    preview:  { width: 512,  height: 512  }, // Quick draft pass
    sd15:     { width: 512,  height: 768  }, // SD 1.5 portrait
    sdxl:     { width: 1024, height: 1024 }, // SDXL base native
    sdxlWide: { width: 1344, height: 768  }, // SDXL 16:9 landscape
    portrait916: { width: 768, height: 1344 }, // 9:16 Shorts / Story
    landscape43: { width: 1152, height: 896 }, // 4:3 presentation
  },

  // ─── Sampling defaults ────────────────────────────────────────────────────
  sampling: {
    steps: { preview: 20, draft: 30, final: 50 },
    cfgScale: { image: 7, video: 3.5 },
    samplers: ['dpm++_2m_karras', 'euler_a', 'dpm++_sde_karras'],
    defaultSampler: 'dpm++_2m_karras',
  },

  // ─── Model routing (LLM side, not diffusion) ─────────────────────────────
  // Primary: DeepSeek for prompt expansion and brief translation
  // Fallback: Claude Haiku for fast classification / tagging
  // Vision: Claude Sonnet for quality-check image analysis
  modelRouting: {
    briefTranslation: 'deepseek',
    promptEngineering: 'deepseek',
    styleExtraction: 'haiku',
    qualityCheck: 'sonnet',
  },

  // ─── Workflow naming conventions ──────────────────────────────────────────
  naming: {
    projectPrefix: 'MEDIA',
    assetPattern: '{projectCode}_{type}_{style}_{date}_{variant}',
    promptVersionPattern: 'v{major}.{minor}',
  },

  // ─── Quality gates ────────────────────────────────────────────────────────
  quality: {
    minResolutionPx: 512,
    maxArtifactScore: 0.3, // 0–1; reject above this threshold
    requireBrandCheck: true,
    requireNegativePrompt: true,
  },

  // ─── Agency workflow stages ───────────────────────────────────────────────
  workflowStages: [
    'brief',
    'prompt_design',
    'preview_generation',
    'review',
    'refined_generation',
    'quality_check',
    'client_approval',
    'delivery',
  ],
};

module.exports = config;
