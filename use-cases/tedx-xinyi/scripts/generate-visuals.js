/**
 * TEDxXinyi — Nanobanana Visual Generation Script
 *
 * Uses Gemini 2.5 Flash Image (nanobanana) to generate all website visuals
 * following the "Bold Festival Poster" design concept.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node use-cases/tedx-xinyi/scripts/generate-visuals.js
 *
 * Options:
 *   --force    Regenerate even if file already exists
 *   --id=<id>  Generate only a specific visual (e.g. --id=salon-hero)
 *
 * Output: frontend/public/tedx-xinyi/*.png
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-image';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const OUTPUT_DIR = path.join(__dirname, '../../../frontend/public/tedx-xinyi');

if (!API_KEY) {
  console.error('\n  Missing GEMINI_API_KEY.\n');
  console.error('  Usage:');
  console.error('    GEMINI_API_KEY=your_key node use-cases/tedx-xinyi/scripts/generate-visuals.js\n');
  process.exit(1);
}

// Parse CLI args
const args = process.argv.slice(2);
const forceRegen = args.includes('--force');
const idArg = args.find((a) => a.startsWith('--id='));
const onlyId = idArg ? idArg.split('=')[1] : null;

// ==================== VISUAL DEFINITIONS ====================
// Bold Festival Poster aesthetic: warm golden hour, Taipei Xinyi energy
// Distinct from Boundary Street's dark noir

const visuals = [
  {
    id: 'hero-home',
    filename: 'hero-home.png',
    prompt: 'Wide 16:9 cinematic banner, vast deep-space sky in dark navy and charcoal black, layered nebula clouds in rich indigo violet and magenta that look like long-exposure astrophotography mixed with painting not 3D cartoon, a clear smooth galaxy arc curves gracefully across the upper half with a softly glowing warm core surrounded by many tiny sharp stars, from the galaxy arc let a few very thin beams of light and sparse glowing data-like particles flow downward along curved paths suggesting AI as a vast quiet information system, foreground at very bottom centre a tiny solitary human figure standing on a narrow rock edge facing the galaxy occupying only 5-8% of total image height realistic adult proportions long dark coat trousers gender-neutral calm reflective pose arms relaxed head slightly tilted upward, soft realistic rim light from the galaxy outlining head shoulders and coat clearly against the darkness, around the upper body a few faint rising particles of light where data streams begin to touch this person, palette dominated by deep blues violets blacks and neutral whites with controlled warm highlights at galaxy core and figure rim light, no text no watermarks no UI HUD graphics, cinematic contrast soft bloom on brightest galaxy parts subtle film-grain overlay, mature restrained premium theatrical key art that a 40-year-old professional would comfortably share',
  },
  {
    id: 'hero-about',
    filename: 'hero-about.png',
    prompt: 'Warm intimate view of a modern creative event space in Taipei, rows of minimalist chairs facing a small stage with warm amber lighting, large floor-to-ceiling windows showing Xinyi skyline at dusk, soft golden light streaming in, a few potted plants and modern furniture, the feeling of anticipation before a talk begins, cinematic photography, warm color palette with cream and amber tones, no text, no watermarks, no people, slight bokeh effect',
  },
  {
    id: 'hero-speakers',
    filename: 'hero-speakers.png',
    prompt: 'Close up of a minimalist TEDx stage from the audience perspective, warm spotlight creating a circle of golden light on a clean stage, blurred audience seats in foreground, modern venue architecture visible, Taipei city lights visible through large windows in background, warm amber and cream color palette, dramatic but optimistic lighting like a festival concert poster, no text, no watermarks, no people, cinematic depth of field',
  },
  {
    id: 'hero-sustainability',
    filename: 'hero-sustainability.png',
    prompt: 'Artistic close-up of sustainable stage materials: 3D printed geometric lamp components, recycled wood panels, and modular metal structures arranged beautifully on a workbench, warm natural daylight from a large window, workshop atmosphere, cream and warm brown tones with subtle green accents, macro photography style showing material textures, optimistic and creative mood, no text, no watermarks, no people, shallow depth of field',
  },
  {
    id: 'hero-community',
    filename: 'hero-community.png',
    prompt: 'Overhead bird-eye view of chairs arranged in a circle in a modern Taipei rooftop terrace, warm evening golden hour light, potted trees and string lights creating cozy atmosphere, Xinyi district buildings visible in soft background, some chairs have warm red and amber cushions, the feeling of community gathering and conversation, warm bright photography style, no text, no watermarks, no people, festival poster mood',
  },
  {
    id: 'salon-teaser',
    filename: 'salon-teaser.png',
    prompt: 'Wide 16:9 cinematic still of a theatre space reminiscent of Taipei Performing Arts Center Blue Box, clean modern architecture, high ceiling, deep blue ambient light, subtle hints of tiered seating and a stage, in the foreground silhouettes of diverse people standing or sitting facing towards a glowing central focal point symbolising AI and ideas not a literal screen of code, thin streams of light or flowing lines connecting people to the central glow suggesting shared learning and becoming, colour palette deep blue dark charcoal with accents of TED red and warm skin tones, enough negative space on one side for overlay text, no text no watermarks no logos, optimistic contemplative atmosphere',
  },
  {
    id: 'salon-hero',
    filename: 'salon-hero.png',
    prompt: 'Wide 16:9 cinematic still, vast deep-space galaxy sweeps majestically across the upper three-quarters of frame, rich indigo violet and magenta nebula clouds in a dark navy charcoal sky mixing long-exposure astrophotography with painting, smooth galaxy arc with a softly glowing warm core and many tiny sharp stars, a few very thin beams of light and sparse data-like particles descend from the arc toward the ground, at the very bottom centre a single tiny solitary human figure stands on a minimal dark rock platform facing upward toward the galaxy occupying only 5-8% of image height realistic adult proportions long dark coat gender-neutral silhouette calm reflective pose head tilted up, soft realistic rim light from the galaxy on head and shoulders clearly readable against the darkness, the human is tiny against the vast cosmos yet connected by the descending light streams, palette of deep blues violets blacks and neutral whites with warm highlights at galaxy core and figure rim light, no text no watermarks no logos no UI, cinematic contrast soft bloom on galaxy subtle film-grain, mature restrained theatrical atmosphere',
  },
  {
    id: 'poster-dark',
    filename: 'poster-dark.png',
    prompt: '4:5 vertical cinematic sci-fi poster background, upper 80% is a vast deep-space sky in dark navy and charcoal black with layered slightly abstract nebula clouds in rich indigo violet and magenta mixing long-exposure astrophotography with painting not 3D cartoon, a clear smooth galaxy arc curves from left to right across the upper half with a softly glowing warm core surrounded by many tiny sharp stars, from the arc a few very thin beams of light and sparse glowing data-like particles flow downward along curved paths, in the very bottom centre a tiny human figure standing on a narrow rock edge facing the galaxy occupying only 5-8% of total image height realistic adult proportions long dark coat trousers gender-neutral calm reflective pose feet near edge arms relaxed head slightly tilted up, soft realistic rim light from galaxy above so the outline of head shoulders and coat is clearly readable against the darkness, around the upper body a few faint rising particles of light, the lower 15% of image fades to near-pure black providing a clean base for text overlay, palette dominated by deep blues violets blacks and neutral whites with controlled warm highlights at galaxy core and figure rim light, no text no watermarks no logos no HUD no UI, cinematic contrast soft bloom on brightest galaxy parts subtle film-grain overlay, mature restrained premium theatrical key art',
  },
  {
    id: 'salon-galaxy',
    filename: 'salon-galaxy.png',
    prompt: 'Square abstract galaxy made of floating islands or orbits each representing a different Intelligence domain, Design Intelligence with minimal objects like chairs posters typography, Food Intelligence with stylised table ingredients coffee, Ocean Intelligence with wave lines tiny whale dolphin icons, Music Art Intelligence with musical notes vinyl simple instrument shapes, no realistic logos but iconic shapes suggesting each domain, dark background with colourful but slightly muted orbit colours connected by thin lines with one orbit subtly highlighted in TED red, overall composition usable as a background behind text, no text no watermarks',
  },
  {
    id: 'salon-curiosity',
    filename: 'salon-curiosity.png',
    prompt: 'Vertical portrait 3:4 image composed of multiple stacked zones, bottom a small open-mic corner with a mic stand and a small seated audience, middle a creative market area with small booths plants and people talking, upper a quiet reading journaling corner with books notebooks lamps, style semi-illustrative slightly stylised not hyper-realistic, people appear diverse but not individually recognisable, lighting warm glows in each zone connected with a gentle path or staircase hinting at moving from one version of yourself to the next, palette mix of warm earth tones and deep blues with small red accents, no text no watermarks no logos',
  },
];

// ==================== GENERATION ====================

async function generateImage(visual) {
  const url = `${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [
      {
        parts: [{ text: visual.prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.8,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const candidates = data.candidates || [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      const imageData = part.inlineData || part.inline_data;
      if (imageData && (imageData.mimeType || imageData.mime_type || '').startsWith('image/')) {
        return Buffer.from(imageData.data, 'base64');
      }
    }
  }

  throw new Error('No image found in response');
}

async function main() {
  console.log('\nTEDxXinyi — Nanobanana Visual Generation (Bold Festival Poster)');
  console.log(`Model: ${MODEL}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  if (forceRegen) console.log('Mode: FORCE (regenerating all)');
  if (onlyId) console.log(`Filter: only generating "${onlyId}"`);
  console.log('');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const targets = onlyId ? visuals.filter((v) => v.id === onlyId) : visuals;

  if (onlyId && targets.length === 0) {
    console.error(`  Unknown visual ID: "${onlyId}"`);
    console.error(`  Available: ${visuals.map((v) => v.id).join(', ')}`);
    process.exit(1);
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const visual of targets) {
    const outputPath = path.join(OUTPUT_DIR, visual.filename);

    if (!forceRegen && fs.existsSync(outputPath)) {
      const size = fs.statSync(outputPath).size;
      console.log(`  [${visual.id}] Skipped — already exists (${(size / 1024).toFixed(0)} KB)`);
      skipped++;
      continue;
    }

    try {
      const start = Date.now();
      const imageBuffer = await generateImage(visual);
      fs.writeFileSync(outputPath, imageBuffer);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  [${visual.id}] ✓ Saved → ${visual.filename} (${(imageBuffer.length / 1024).toFixed(0)} KB, ${elapsed}s)`);
      success++;
    } catch (err) {
      console.error(`  [${visual.id}] ✗ FAILED: ${err.message}`);
      failed++;
    }

    // Brief pause between requests to respect rate limits
    if (targets.indexOf(visual) < targets.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\nDone: ${success} generated, ${skipped} skipped, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
