/**
 * TEDxBoundaryStreet — Nanobanana Visual Generation Script
 *
 * Uses Gemini 2.0 Flash (nanobanana) to generate all website visuals
 * following the "The Line as Canvas" design concept.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node use-cases/tedx-boundary-street/scripts/generate-visuals.js
 *
 * Output: frontend/public/tedx/*.png
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-preview-image-generation';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const OUTPUT_DIR = path.join(__dirname, '../../../frontend/public/tedx');

if (!API_KEY) {
  console.error('\n  Missing GEMINI_API_KEY.\n');
  console.error('  Usage:');
  console.error('    GEMINI_API_KEY=your_key node use-cases/tedx-boundary-street/scripts/generate-visuals.js\n');
  process.exit(1);
}

// ==================== VISUAL PROMPTS ====================

const visuals = [
  {
    id: 'hero-bg',
    filename: 'hero-boundary-street.png',
    prompt: 'Street view of Boundary Street Hong Kong, low angle looking up at buildings, monochromatic desaturated tones, misty atmospheric depth, one bold red horizontal line crossing through the middle of frame, minimalist urban photography style, cinematic wide aspect ratio, no text, no watermarks',
  },
  {
    id: 'map-overlay',
    filename: 'map-1898-overlay.png',
    prompt: 'Vintage map of Boundary Street Hong Kong 1898 overlaid with modern city map, red boundary line highlighted, archival texture, faded sepia tones transitioning to modern grayscale, dual timeline visual, no text labels, clean graphic design',
  },
  {
    id: 'theme-city',
    filename: 'theme-city-space.png',
    prompt: 'Abstract architectural composition showing old Hong Kong tong lau buildings fading into modern glass towers, split composition, one side vintage one side futuristic, red accent line dividing them, minimal graphic style, no text, clean design',
  },
  {
    id: 'theme-language',
    filename: 'theme-language-identity.png',
    prompt: 'Typographic art showing Traditional Chinese characters, English letters, and linguistic elements overlapping and intersecting, bilingual identity visual, red connecting threads, clean modern layout, abstract, no readable words, artistic composition',
  },
  {
    id: 'theme-tech',
    filename: 'theme-tech-humanity.png',
    prompt: 'Human silhouette formed by circuit board patterns dissolving into organic flowing lines, technology meets humanity metaphor, red data streams, minimal tech aesthetic, dark background, no text',
  },
  {
    id: 'kai-tak-memory',
    filename: 'kai-tak-memory.png',
    prompt: 'Nostalgic Hong Kong memory scene: Kai Tak airport plane taking off over Kowloon rooftops, Checkerboard Hill in distant background, evening golden hour lighting, cinematic film grain, red flight path trajectory overlay, vintage 1990s Hong Kong atmosphere, no text',
  },
  {
    id: 'dot-pattern',
    filename: 'dot-pattern-community.png',
    prompt: 'Abstract dot pattern texture representing community and gathering, subtle gray dots on white background, minimal graphic design, TEDx aesthetic, data visualization inspired, seamless tileable pattern, no text',
  },
  {
    id: 'partner-icons',
    filename: 'partner-icons.png',
    prompt: 'Minimalist line icon set for event partnerships: venue building, production clapperboard, community people circle, media megaphone, four icons in a row, simple geometric line art, red accent color on transparent background, consistent stroke width, no text labels',
  },
];

// ==================== GENERATION ====================

async function generateImage(visual) {
  const url = `${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: visual.prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.8,
    },
  };

  console.log(`  [${visual.id}] Generating...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // Extract image from response
  const candidates = data.candidates || [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      const imageData = part.inlineData || part.inline_data;
      if (imageData && imageData.mimeType?.startsWith('image/')) {
        return Buffer.from(imageData.data, 'base64');
      }
    }
  }

  throw new Error('No image found in response');
}

async function main() {
  console.log('\nTEDxBoundaryStreet — Nanobanana Visual Generation');
  console.log(`Model: ${MODEL} (nanobanana)`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let success = 0;
  let failed = 0;

  for (const visual of visuals) {
    try {
      const imageBuffer = await generateImage(visual);
      const outputPath = path.join(OUTPUT_DIR, visual.filename);
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`  [${visual.id}] Saved → ${visual.filename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
      success++;
    } catch (err) {
      console.error(`  [${visual.id}] FAILED: ${err.message}`);
      failed++;
    }

    // Rate limit: brief pause between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\nDone. ${success} generated, ${failed} failed.\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
