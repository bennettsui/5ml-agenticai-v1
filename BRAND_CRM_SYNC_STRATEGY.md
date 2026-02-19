# Brand Setup ↔ CRM Synchronization Strategy

## Current State: Two Disconnected Flows

### `/brand-setup` (Brand Onboarding Wizard)
**Purpose**: Social media strategy generation for new brands
**Collects** (5 steps):
1. Brand basics: name, industry, markets, languages
2. Strategy: goals, pillars, KPIs
3. Scope: channels, budget, approval cycle
4. Team: liaisons, approvers
5. Review: summary + download strategy

**Output**: Saved to `brands.brand_info.profile` (JSONB)

---

### `/use-cases/crm` (Brand Management Hub)
**Purpose**: Comprehensive brand relationship management
**Sections**:
- Brand Management (status, health score, value tier)
- Brand Profile (tone, guidelines, visual rules) ← **MISSING IN SETUP**
- Projects (associated projects)
- Feedback (client feedback + learning)
- Knowledge Base (brand rules + patterns)
- Health Scores (engagement tracking)
- Integrations

**Data Model**: Rich `Brand` interface with status, tiers, timestamps

---

## The Sync Problem

| Data | Brand Setup | CRM | Issue |
|------|------------|-----|-------|
| Industry | ✓ (enum) | ✓ (array) | Different formats |
| Markets | ✓ | ✓ (as region) | Naming mismatch |
| Budget | ✓ | ✗ | Lost data |
| Brand voice/tone | ✗ | ✓ (in profile) | **Not captured in setup** |
| Colors/visuals | ✗ | ✓ (in profile) | **Not captured in setup** |
| Projects | ✗ | ✓ | Setup doesn't link |
| Status/health | ✗ | ✓ | No visibility in setup |

---

## Proposed Solution: 3-Phase Sync Architecture

### Phase 1: Unified Brand Data Model

**Problem**: Duplicate data, different formats
**Solution**: Define single `BrandProfile` that both systems use

```typescript
// Unified schema (store in brands.brand_info)
interface BrandProfile {
  // Identity (from CRM)
  id: UUID;
  name: string;
  legal_name?: string;
  status: 'prospect' | 'active' | 'dormant' | 'lost';
  value_tier: 'A' | 'B' | 'C' | 'D';
  health_score: number; // 0-100

  // Strategy (from Brand Setup)
  industry: string[];
  markets: string[];
  languages: string[];
  primary_goal: string;
  secondary_goals: string[];
  content_pillars: ContentPillar[];
  kpi_framework: KPIFramework;

  // Channels & Operations
  primary_channels: string[];
  posts_per_week: number;
  approval_cycle_days: number;
  monthly_budget_hkd: number;

  // Brand Identity (from CRM - Enhanced with Setup Data)
  voice_tone: string;           // e.g., "Professional, approachable, witty"
  brand_personality: string[];  // e.g., ["Innovative", "Trustworthy"]
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  visual_style: string;         // e.g., "Minimalist, photography-heavy"
  visual_guidelines?: string;   // Upload/link to brand guidelines PDF

  // Team
  team: {
    liaison: string;
    liaison_email?: string;
    asset_provider?: string;
    approval_authority?: string;
  };

  // Metadata
  created_at: ISO8601;
  updated_at: ISO8601;
  setup_completed_at?: ISO8601;
  profile_completed_at?: ISO8601;
}
```

---

### Phase 2: Enhanced Brand Setup Flow

**Add one new step after current Step 4**:

**Step 5: Brand Identity** (2 min, optional but recommended)
```
┌─────────────────────────────────────────┐
│ Brand Identity & Visual Guidelines       │
└─────────────────────────────────────────┘

Voice & Tone (optional)
- "How would you describe your brand voice?"
- Dropdown: Professional / Casual / Witty / Authoritative / Friendly
- Example: "Professional and approachable"

Visual Style (optional)
- "What's your visual aesthetic?"
- Dropdown: Minimalist / Photography-heavy / Data-driven / Vibrant / Corporate
- Example: "Modern, clean photography with data visualizations"

Brand Colors (optional)
- Primary color picker
- Secondary color picker
- Accent color picker
- Help text: "Use your brand guidelines if available"

[← Back] [Next: Review] [Save to CRM]
```

**Why this works**:
- Minimal additional effort (2 min vs 15 min for full setup)
- Optional - doesn't block flow
- Goes straight to CRM on completion

---

### Phase 3: One-Click CRM Integration

**After brand-setup Step 5 completes**:

```
┌─────────────────────────────────────────┐
│ ✓ Brand Strategy Generated              │
├─────────────────────────────────────────┤
│ Your strategy is ready to download       │
│                                         │
│ [Download Strategy PDF]                 │
│ [Save to CRM] ← ONE CLICK INTEGRATION   │
│                                         │
│ What happens next:                      │
│ 1. Brand created in CRM (active status) │
│ 2. Strategy auto-linked                 │
│ 3. Open CRM brand detail page            │
│ 4. Skip team collaboration setup        │
└─────────────────────────────────────────┘
```

**Backend Logic**:
```javascript
// POST /api/brands/setup-complete
async function setupComplete(req, res) {
  const { formData, strategyData } = req.body;

  // 1. Create/update brand in CRM schema
  const brand = await saveBrand({
    brand_id: generateUUID(),
    name: formData.brandName,
    industry: [formData.industry],
    region: formData.markets,
    status: 'active', // Auto-set from setup
    health_score: 75, // Initial score

    brand_info: {
      profile: {
        ...formData,
        voice_tone: formData.voiceTone,
        color_palette: formData.colors,
        visual_style: formData.visualStyle,
      },
      strategy: strategyData,
    }
  });

  // 2. Create initial projects array (empty)
  await saveProject({
    brand_id: brand.brand_id,
    name: `${brand.name} Social Campaign`,
    type: 'social_campaign',
    status: 'planning'
  });

  // 3. Return redirect to CRM detail
  res.json({
    success: true,
    brand_id: brand.brand_id,
    redirect: `/use-cases/crm/brands/detail?id=${brand.brand_id}`
  });
}
```

---

## Implementation: Step-by-Step

### 1. Update Brand Setup (20 min)

**File**: `frontend/app/brand-setup/page.tsx`

```typescript
// Add Step 5
type WizardStep = 'brand-basics' | 'strategy' | 'scope' | 'team' | 'identity' | 'review';

// Add to FormState
interface FormState extends Partial<BrandFormData> {
  voiceTone?: string;
  brandPersonality?: string[];
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  visualStyle?: string;
}

// Add "Brand Identity" step between Team and Review
<BrandIdentityStep
  formData={formState}
  onNext={(updates) => {
    updateForm(updates);
    setCurrentStep('review');
  }}
/>
```

### 2. Create Brand Identity Component (30 min)

**File**: `frontend/components/BrandIdentityStep.tsx`

```typescript
export default function BrandIdentityStep({ formData, onNext }) {
  const [voice, setVoice] = useState(formData.voiceTone);
  const [colors, setColors] = useState(formData.colorPalette);
  const [style, setStyle] = useState(formData.visualStyle);

  return (
    <div className="space-y-6">
      <h2>Brand Identity & Visual Guidelines (Optional)</h2>

      {/* Voice & Tone */}
      <fieldset>
        <label>Brand Voice & Tone</label>
        <select value={voice} onChange={e => setVoice(e.target.value)}>
          <option value="">Select tone...</option>
          <option value="professional">Professional & Trustworthy</option>
          <option value="friendly">Friendly & Approachable</option>
          <option value="witty">Witty & Conversational</option>
          <option value="data-driven">Data-driven & Authoritative</option>
          <option value="playful">Playful & Vibrant</option>
        </select>
      </fieldset>

      {/* Visual Style */}
      <fieldset>
        <label>Visual Aesthetic</label>
        <select value={style} onChange={e => setStyle(e.target.value)}>
          <option value="">Select style...</option>
          <option value="minimalist">Minimalist & Clean</option>
          <option value="photography">Photography-heavy</option>
          <option value="data">Data Visualization Focused</option>
          <option value="vibrant">Vibrant & Colorful</option>
          <option value="corporate">Corporate & Professional</option>
        </select>
      </fieldset>

      {/* Color Palette */}
      <fieldset>
        <label>Brand Colors (Optional)</label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label>Primary</label>
            <input
              type="color"
              value={colors.primary}
              onChange={e => setColors({...colors, primary: e.target.value})}
            />
          </div>
          {/* Secondary and Accent similar */}
        </div>
      </fieldset>

      <button onClick={() => onNext({ voiceTone: voice, colorPalette: colors, visualStyle: style })}>
        Continue to Review
      </button>
    </div>
  );
}
```

### 3. Update Review Step (15 min)

**File**: `frontend/app/brand-setup/page.tsx` - Review step

```typescript
// Add to Review section
{strategy && (
  <>
    {/* Existing strategy preview */}

    {/* NEW: Add save to CRM button */}
    <button
      onClick={handleSaveToCRM}
      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700"
    >
      Save to CRM
    </button>
  </>
)}
```

### 4. Create CRM Integration Endpoint (20 min)

**File**: `index.js`

```javascript
// POST /api/brands/setup-complete
app.post('/api/brands/setup-complete', async (req, res) => {
  try {
    const { brandName, industry, markets, formData, strategy } = req.body;

    // Validate brand doesn't exist
    const existing = await getBrandByName(brandName);
    if (existing) {
      return res.status(400).json({ error: 'Brand already exists' });
    }

    // Create brand with full profile
    const result = await saveBrand(brandName, {
      industry,
      brand_info: {
        profile: formData,
        strategy,
      }
    });

    res.json({
      success: true,
      brand_id: result.brand_id,
      redirect: `/use-cases/crm/brands/detail?id=${result.brand_id}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 5. Update CRM Brand Detail (10 min)

**File**: `frontend/app/use-cases/crm/brands/detail/page.tsx`

```typescript
// Add tab for viewing strategy
<Tab name="strategy">
  {brand.brand_info?.strategy && (
    <StrategyPreview data={brand.brand_info.strategy} />
  )}
</Tab>

// Add Brand Identity section
<Section title="Brand Identity">
  {brand.brand_info?.profile?.voiceTone && (
    <div>
      <strong>Voice & Tone:</strong> {brand.brand_info.profile.voiceTone}
    </div>
  )}
  {brand.brand_info?.profile?.colorPalette && (
    <ColorPaletteDisplay colors={brand.brand_info.profile.colorPalette} />
  )}
</Section>
```

---

## UX Flow Comparison

### Current Flow (Disconnected)
```
User visits /brand-setup
  → 5-step wizard
  → Downloads strategy
  → ❌ No CRM link

Later: User visits /use-cases/crm
  → Creates brand manually
  → Re-enters data
  → Setup data lost
```

### New Flow (Synchronized)
```
User visits /brand-setup
  → 5-step wizard (+ new Step 5: Brand Identity - 2 min)
  → Hits "Save to CRM" button
  → ✅ Auto-creates in CRM
  → ✅ Redirects to CRM brand detail
  → Can view strategy + brand identity
  → Can add projects, feedback, etc.

From CRM:
  → Brand data flows to Social Content Ops modules
  → Content reviewer validates against brand profile
  → AI assistant uses brand voice/tone/colors for compliance
```

---

## Benefits

| Aspect | Benefit |
|--------|---------|
| **Setup Time** | 50% faster (no re-entry) |
| **Data Integrity** | Single source of truth |
| **UX** | Seamless brand-setup → CRM flow |
| **AI Compliance** | Brand identity used for validation |
| **Flexibility** | Step 5 (identity) is optional |
| **One-Click** | "Save to CRM" button does everything |

---

## Success Metrics

- ✅ Zero data loss between systems
- ✅ Brand identity captured during onboarding
- ✅ <2 min additional setup time
- ✅ 100% of brands auto-created in CRM
- ✅ Content reviewer has brand profile to validate against

---

## Timeline

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| 1 | Add Step 5 (Brand Identity) to setup | 30 min | HIGH |
| 2 | Create setup-complete API endpoint | 20 min | HIGH |
| 3 | Add "Save to CRM" button + redirect | 15 min | HIGH |
| 4 | Update CRM detail page to show strategy | 10 min | MEDIUM |
| 5 | Add brand identity display in CRM | 15 min | MEDIUM |
| 6 | Testing + polish | 30 min | MEDIUM |
| **Total** | | **2 hours** | |

---

## Questions for You

1. **Brand Identity fields**: Is voice/tone/colors/visual-style enough, or need more (fonts, imagery types, tone examples)?
2. **Timeline**: Want to implement all at once, or Phase by Phase?
3. **Optional vs Required**: Should Step 5 block setup, or be completely optional?
4. **AI Validator**: After sync, should I implement the compliance checker that validates copy/visuals against brand profile?

