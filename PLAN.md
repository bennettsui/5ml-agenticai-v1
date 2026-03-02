# Plan: Deliverable Enhancements + Use Case Links + Board View

## What We're Building

Three layered upgrades to CRM deliverables:

1. **Deliverable fields** — priority (critical/high/medium/low), inline notes, use-case tag
2. **Use-case linking** — each deliverable shows which workflow it belongs to (Social Content,
   Growth Architect, etc.) with a one-click jump to that use case
3. **AI awareness** — AI can read and manage deliverables via chat actions
4. **Delivery Board** — a new CRM tab showing all deliverables across all projects in one view,
   grouped by project, filterable by status and use case

---

## Files Changed

| File | Changes |
|---|---|
| `frontend/lib/crm-kb-api.ts` | Extend `Deliverable` type with `priority`, `notes`, `use_case` |
| `frontend/app/use-cases/crm/projects/detail/page.tsx` | Priority cycle, notes expand, use-case badge + link, sort, AI form callback, page context |
| `index.js` | System prompt: deliverable action types + use_case field docs |
| `frontend/app/use-cases/crm/page.tsx` | Add "Board" tab with cross-project delivery view |

---

## Step 1 — Extend `Deliverable` type (`crm-kb-api.ts`)

```typescript
export interface Deliverable {
  id: string;
  title: string;
  deadline: string | null;
  status: 'pending' | 'in_progress' | 'done';
  priority?: 'critical' | 'high' | 'medium' | 'low' | null;
  notes?: string | null;
  use_case?: string | null; // slug matching /use-cases/:slug
}
```

No backend schema change needed — all stored in the existing `deliverables JSONB` column.

---

## Step 2 — Project detail page (`page.tsx`)

### 2a. New state
```typescript
const [expandedDeliverableId, setExpandedDeliverableId] = useState<string | null>(null);
```

### 2b. New handlers
- `handlePatchDeliverable(id, patch)` — generic patch + save (reused by priority, notes, use_case)
- `handleCyclePriority(id)` — cycles null → low → medium → high → critical → null
- `handleSaveNotes(id, notes)` — called on textarea blur

### 2c. Sorted display
`sortedDeliverables` computed with `useMemo`:
- Done items sink to bottom
- Among non-done: overdue first, then by priority (critical→high→medium→low→null), then by deadline

### 2d. Per-row UI additions

```
[priority-dot] [status-icon]  Title                      [use-case-badge →]  deadline  [expand ˅] [delete]
               └── notes textarea (when expanded) ──────────────────────────────────────────────────────┘
```

**Priority dot** (left of status icon):
- Colored circle: red=critical, orange=high, yellow=medium, slate=low, invisible=null
- Click to cycle priority; tooltip shows current value
- On hover (group-hover) shows even if null (dimmed)

**Use-case badge** (right of title, before deadline):
- Small pill: `[icon] Social Content →`
- Clicking navigates to `/use-cases/social-content-ops`
- Only shown if `d.use_case` is set
- Color-coded per use case (emerald, violet, blue, amber, etc.)

**Expand/notes toggle**:
- ChevronDown button (group-hover visible)
- Clicking toggles `expandedDeliverableId`
- Expanded row shows a 2-row `<textarea>` below the main row
- `onBlur` → `handleSaveNotes(id, value)`
- If notes is non-null, a small dot indicator is always visible on the chevron

### 2e. Add-deliverable form additions
- Priority selector: 5-button row (None / Low / Medium / High / Critical) — default None
- Use-case picker: `<select>` dropdown with all existing use cases labeled

### 2f. AI integration

**In the `setPageState` useEffect** — include deliverables in formData:
```typescript
formData: {
  projectId, projectName,
  attachments: attachmentContext,
  deliverables: deliverables.map(d => ({
    id: d.id, title: d.title, status: d.status,
    priority: d.priority ?? null,
    deadline: d.deadline ?? null,
    use_case: d.use_case ?? null,
  })),
}
```

**Register form callback** (inside a `useEffect` that calls `registerFormCallback`):
Handles three special keys from AI `update_form` actions:
- `_deliverableAdd: { title, deadline?, priority?, notes?, use_case? }` → generates nanoid, appends, saves
- `_deliverableUpdate: { id, ...patch }` → patches matching deliverable, saves
- `_deliverableDelete: { id }` → removes, saves

These piggyback on the existing `formUpdateRef` / `update_form` infrastructure with no changes needed
to AiAssistant.tsx.

---

## Step 3 — AI system prompt (`index.js`)

Add to the `## Actions` section of the CRM chat system prompt:

```
Manage deliverables on the current project page:
```action
{"type": "update_form", "data": {"_deliverableAdd": {"title": "Design mockups", "deadline": "2026-03-20", "priority": "high", "use_case": "ai-media-generation"}}}
```
```action
{"type": "update_form", "data": {"_deliverableUpdate": {"id": "DELIVERABLE_ID", "status": "done", "priority": "critical"}}}
```
```action
{"type": "update_form", "data": {"_deliverableDelete": {"id": "DELIVERABLE_ID"}}}
```

Valid priorities: "critical", "high", "medium", "low", null.
Valid use_case values: "social-content-ops", "growth-architect", "growth-hacking-studio",
  "ai-media-generation", "sme-growth", "government-tenders", "hk-sg-tender-intel",
  "mans-accounting", null.

Current deliverables are in page_context.formData.deliverables.
Only use _deliverableAdd/_deliverableUpdate/_deliverableDelete when on a project-detail page.
```

---

## Step 4 — Delivery Board tab (`frontend/app/use-cases/crm/page.tsx`)

A new "Board" tab added to the existing CRM page navigation.

### Data
- Fetches all projects via existing `/api/crm/projects` endpoint
- Flattens all `deliverables` arrays into a single list tagged with `projectId` / `projectName`
- Client-side filtering by status, use_case, priority

### Layout
```
[ Board ]  — tab next to existing CRM nav items

Filters:   Status [All ▾]  Use Case [All ▾]  Priority [All ▾]

Grouped by project (collapsed by default, expand to see deliverables):

  ┌─ Acme Corp — Website Redesign  2/5 done ──────────────────────────────────┐
  │  🔴 [◐] Design mockups         [Social Content →]   Mar 15   overdue      │
  │  🟠 [○] Logo variations         [AI Media →]         Mar 20               │
  └────────────────────────────────────────────────────────────────────────────┘

  ┌─ TechStart — Brand Identity    0/3 done ──────────────────────────────────┐
  │  🔴 [○] Brand guidelines       [Social Content →]   Mar 10   overdue      │
  └────────────────────────────────────────────────────────────────────────────┘
```

### Use-case label map (defined as a constant)

```typescript
const USE_CASES: Record<string, { label: string; color: string; href: string }> = {
  'social-content-ops':   { label: 'Social Content',  color: 'emerald', href: '/use-cases/social-content-ops' },
  'growth-architect':     { label: 'Growth Strategy', color: 'violet',  href: '/use-cases/growth-architect' },
  'growth-hacking-studio':{ label: 'Growth Hacking',  color: 'blue',    href: '/use-cases/growth-hacking-studio' },
  'ai-media-generation':  { label: 'AI Media',        color: 'pink',    href: '/use-cases/ai-media-generation' },
  'sme-growth':           { label: 'SME Growth',      color: 'amber',   href: '/use-cases/sme-growth' },
  'government-tenders':   { label: 'Tenders',         color: 'sky',     href: '/use-cases/government-tenders' },
  'hk-sg-tender-intel':   { label: 'HK/SG Tenders',  color: 'cyan',    href: '/use-cases/hk-sg-tender-intel' },
  'mans-accounting':      { label: 'Accounting',      color: 'orange',  href: '/use-cases/mans-accounting' },
};
```

This same constant is shared (extracted to a lib file or inline in both files) so the detail page
and board view use identical labels and colors.

---

## Step 5 — Build + commit

```sh
cd frontend && npm run build
git add -A
git commit -m "..."
git push
```

---

## Scope Notes

- No new API endpoints needed — all deliverable mutations go through the existing
  `PUT /api/crm/projects/:id` (via `saveDeliverables`)
- No DB schema changes — `priority`, `notes`, `use_case` are new fields in the JSONB array
- Board view is read-only (no mutations); mutations happen from the project detail page
- The USE_CASES constant is the single source of truth for valid slugs — both the board and
  the detail page import it; the AI system prompt is updated to list the same slugs
