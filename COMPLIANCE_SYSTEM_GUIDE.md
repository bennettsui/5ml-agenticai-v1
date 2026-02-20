# Brand Compliance Checking System

## Overview

The brand compliance system validates all generated copy and visuals against your brand profile to ensure consistency, quality, and adherence to brand guidelines.

### Key Features

✅ **Voice Learning**: Automatically analyzes past content to understand your brand's actual voice/tone
✅ **Real-time Checking**: Validates copy before publishing
✅ **Smart Scoring**: Grades compliance 0-10 with actionable feedback
✅ **Guidelines Integration**: Stores and references uploaded brand guidelines
✅ **Color Compliance**: Checks visual color palette alignment
✅ **Actionable Feedback**: Suggests specific improvements

---

## Architecture

### 1. **Brand Voice Analyzer** (`services/brandVoiceAnalyzer.js`)

Learns your brand's voice characteristics from past content versions:

```
Input: Past 20 social posts, campaigns, draft scripts
↓
Analysis of:
- Formality level (formal, casual, mixed)
- Sentiment (positive, neutral, mixed)
- Tone characteristics (witty, professional, warm, etc.)
- Vocabulary style (technical, slang, industry-specific)
- Sentence structure (short, long, mixed)
- Emoji usage patterns
- Call-to-action style
- Common phrases and patterns
↓
Output: VoiceCharacteristics profile
```

**Usage:**

```javascript
const { getBrandVoiceProfile } = require('./services/brandVoiceAnalyzer');

// Get or learn voice profile
const voiceProfile = await getBrandVoiceProfile(brandId);
// Returns: { formality: 'casual', sentiment: 'positive', tone: ['witty', 'friendly'], ... }
```

### 2. **Compliance Checker** (`services/complianceChecker.js`)

Validates new content against brand profile:

```
Input: Brand ID + new copy/colors + brand profile
↓
Checks against:
✓ Learned voice profile (formality, sentiment, tone)
✓ Stated voice/tone (from setup wizard)
✓ Color palette (primary, secondary, accent)
✓ Common phrases and patterns
✓ Emoji usage consistency
✓ CTA style alignment
↓
Output: ComplianceScore (0-10) with:
- Overall score
- Voice alignment issues & suggestions
- Color compliance details
- Brand fit assessment
- Action (approve/revise/block)
```

**Usage:**

```javascript
const { checkBrandCompliance } = require('./services/complianceChecker');

const compliance = await checkBrandCompliance(
  brandId,
  { copy: "Your content here...", colors: ["#000000", "#FFFFFF"] },
  brandProfile
);

// Returns:
// {
//   overall_score: 8.5,
//   action: 'approve',
//   voice_alignment: { issues: [...], suggestions: [...] },
//   can_proceed: true
// }
```

### 3. **API Endpoints**

#### Check Compliance

```http
POST /api/social/compliance/check
Content-Type: application/json

{
  "brand_id": "550e8400-e29b-41d4-a716-446655440000",
  "copy": "Your generated content here...",
  "colors": ["#FF5733", "#33FF57"],
  "brand_profile": {
    "voiceTone": "witty",
    "brandPersonality": ["Innovative", "Friendly"],
    "colorPalette": {
      "primary": "#000000",
      "secondary": "#FFFFFF",
      "accent": "#FF5733"
    }
  }
}

Response:
{
  "compliance": {
    "overall_score": 8.5,
    "action": "approve",
    "voice_alignment": {
      "score": 8.5,
      "issues": [],
      "suggestions": ["Add more emojis to match brand style"]
    },
    "can_proceed": true
  }
}
```

#### Upload Guidelines

```http
POST /api/brands/guidelines/upload
Content-Type: multipart/form-data

file: [PDF/PNG/JPEG/WebP file]
brandId: "550e8400-e29b-41d4-a716-446655440000"

Response:
{
  "success": true,
  "url": "/uploads/guidelines/brandid-guidelines-1234567890.pdf",
  "fileName": "Brand_Guidelines.pdf"
}
```

#### Delete Guidelines

```http
POST /api/brands/guidelines/delete
Content-Type: application/json

{
  "brandId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "/uploads/guidelines/brandid-guidelines-1234567890.pdf"
}
```

---

## Compliance Scoring

### Score Breakdown

**8-10: Approve** ✅
- Excellent alignment with brand voice
- No actionable issues
- Ready to publish

**6-8: Revise** ⚠️
- Minor issues identified
- Specific suggestions provided
- Can proceed with revisions

**0-6: Block** ❌
- Major misalignment detected
- Requires substantial rework
- Suggests detailed corrections

### Scoring Factors

| Factor | Weight | Criteria |
|--------|--------|----------|
| Voice Alignment | 60% | Formality, sentiment, tone match |
| Color Compliance | 20% | Colors within brand palette |
| Guidelines | 15% | Adherence to uploaded guidelines |
| Brand Fit | 5% | Overall brand consistency |

---

## Integration Points

### Content Review Workflow

```
User generates content (copy/visuals)
↓
Compliance check triggered
↓
If score >= 8:
  → Auto-approve, ready to publish ✅
↓
If 6 <= score < 8:
  → Show suggestions, allow revisions ⚠️
↓
If score < 6:
  → Block publishing, require major changes ❌
```

### Sarah Orchestrator Integration

The compliance checker integrates with Sarah's content review node:

```javascript
// In content_reflect node
const { checkBrandCompliance } = require('./services/complianceChecker');

const compliance = await checkBrandCompliance(
  brandId,
  { copy: generated_content },
  brandProfile
);

if (compliance.overall_score < 6) {
  status = "BLOCKED";
  output = `Content blocked due to brand compliance. Issues: ${compliance.voice_alignment.issues.join(', ')}`;
}
```

---

## Frontend Components

### ComplianceChecker Component

Displays compliance score with visual feedback:

```tsx
<ComplianceChecker
  brandId={brandId}
  brandProfile={brandProfile}
  content={{ copy: generatedCopy, colors: usedColors }}
  autoCheck={true}
  onCheck={(score) => {
    if (score.can_proceed) {
      // Publish
    } else {
      // Show suggestions
    }
  }}
/>
```

Features:
- Real-time score gauge (0-10 visual)
- Action badges (Approve/Revise/Block)
- Issue list with specific problems
- Suggestion list with fixes
- Color palette visualization
- Voice alignment details

### BrandGuidelinesUpload Component

Allows uploading brand guidelines:

```tsx
<BrandGuidelinesUpload
  brandId={brandId}
  onUploadComplete={(url) => {
    // Store in brand profile
  }}
/>
```

Supported formats:
- PDF (brand books, style guides)
- PNG, JPEG, WebP (visual guides)
- Max 10MB per file

---

## How Voice Learning Works

### 1. Automatic Analysis

When compliance check is first run for a brand:

```javascript
const voiceProfile = await getBrandVoiceProfile(brandId);
// If no stored profile, analyzes:
// - Last 20 social posts
// - Last 20 campaigns
// - Last 20 content drafts
```

### 2. Characteristics Extracted

```javascript
{
  formality: 'casual',          // Detected from vocabulary
  sentiment: 'positive',        // Detected from word choice
  tone: ['witty', 'friendly'],  // Detected from patterns
  vocabulary: {
    technical_terms: true,      // If industry jargon found
    slang: true,                // If colloquialisms detected
    industry_specific: true     // If niche terms used
  },
  sentence_structure: 'short',  // Average sentence length
  emoji_usage: true,            // If emojis found in content
  call_to_action_style: 'click', // Most common CTA verb
  hashtag_style: 'moderate',    // Frequency of hashtags
  common_phrases: [             // Top repeated phrases
    'sign up today',
    'learn more',
    'discover the difference'
  ]
}
```

### 3. Stored for Reuse

Learned profile is cached in database to avoid re-analysis:

```javascript
// Next time, uses stored profile
const profile = await getBrandVoiceProfile(brandId);
// Returns cached profile instantly
```

### 4. Relearning

Can force re-analysis when brand voice changes:

```javascript
await analyzeBrandVoiceFromHistory(brandId, 50); // Analyze 50 posts
```

---

## Example Workflow

### Step 1: Brand Sets Up Identity

User completes brand setup with stated voice/tone:

```javascript
{
  voiceTone: 'witty',
  brandPersonality: ['Innovative', 'Friendly'],
  colorPalette: { primary: '#000000', secondary: '#FFFFFF', accent: '#FF5733' }
}
```

### Step 2: System Learns Actual Voice

First compliance check analyzes past 20 posts:

```
Detecting formality... casual ✓
Detecting sentiment... positive ✓
Detecting tone... witty, friendly ✓
Detecting colors... mostly primary + accent ✓
```

### Step 3: Generate New Content

Sarah generates content:

```
"Hey! 🎉 Ready to level up your business?
Check out our latest features - guaranteed to save you hours every week!
Learn more → [link]"
```

### Step 4: Check Compliance

```
✓ Formality: Casual (matches learned profile)
✓ Sentiment: Positive (matches learned profile)
✓ Tone: Witty + Friendly (matches)
⚠️ Missing CTA: "Learn more" is used, but not in brand's style
✓ Emoji usage: Yes (consistent with profile)
→ Overall: 8.5/10 - Approve ✅
```

### Step 5: Publish or Revise

If score >= 8, publish directly.
If 6-8, show suggestions and allow revision.
If < 6, block and require changes.

---

## Customization

### Adjust Scoring Weights

```javascript
const SCORING_WEIGHTS = {
  voice_alignment: 0.60,
  color_compliance: 0.20,
  guidelines: 0.15,
  brand_fit: 0.05
};
```

### Add Custom Checks

```javascript
// Custom voice rule: Brand never uses ALL CAPS
if (copy.includes(/[A-Z]{4,}/g) && !learnedVoice.uses_all_caps) {
  voiceScore -= 2;
  issues.push("Brand doesn't use ALL CAPS text");
}
```

### Customize Issue Thresholds

```javascript
if (voiceScore < 6) {
  action = 'block';        // Block publishing
} else if (voiceScore < 8) {
  action = 'revise';       // Suggest revisions
} else {
  action = 'approve';      // Auto-approve
}
```

---

## Future Enhancements

- 🔮 **AI-powered guideline analysis**: Extract rules from uploaded PDFs
- 🔮 **Competitor benchmarking**: Compare voice against competitors
- 🔮 **Content style transfer**: Auto-adjust content to match brand voice
- 🔮 **Team voice consensus**: Learn from multiple team members' content
- 🔮 **Seasonal variations**: Adapt voice checking for campaigns
- 🔮 **A/B testing integration**: Learn from high-performing content
- 🔮 **Real-time training**: Continuously improve voice profile

---

## Troubleshooting

### No Past Content to Learn From

If brand has less than 5 posts in history:

```
System: "Not enough past content to learn voice (found 2 posts).
Using stated voice from brand setup instead."
```

**Solution**: Manually enter voice characteristics in brand setup.

### Over-restrictive Scoring

If compliance scores are too low:

```javascript
// Reduce penalty for tone mismatches
voiceScore -= 1;  // Instead of 2
```

### False Positives

If system incorrectly flags valid content:

```javascript
// Add exception list for common false positives
const exceptions = ['hashtag', 'trending', 'viral'];
```

---

## API Reference Quick Start

```bash
# Check compliance
curl -X POST http://localhost:3000/api/social/compliance/check \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "550e8400-e29b-41d4-a716-446655440000",
    "copy": "Your content here",
    "brand_profile": {
      "voiceTone": "witty",
      "colorPalette": {
        "primary": "#000000",
        "secondary": "#FFFFFF",
        "accent": "#FF5733"
      }
    }
  }'

# Upload guidelines
curl -X POST http://localhost:3000/api/brands/guidelines/upload \
  -F "file=@brand_guidelines.pdf" \
  -F "brandId=550e8400-e29b-41d4-a716-446655440000"
```

---

## Support

For questions about the compliance system, refer to:
- `services/brandVoiceAnalyzer.js` - Voice learning logic
- `services/complianceChecker.js` - Compliance scoring
- `frontend/components/ComplianceChecker.tsx` - UI component
- `BRAND_CRM_SYNC_STRATEGY.md` - Brand profile integration
