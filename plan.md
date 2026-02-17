# Plan: Apply Boris Cherny's Claude Code Tips to Our Project

## Analysis of All Tips

| Tip | Summary | Our Status | Impact |
|-----|---------|------------|--------|
| **4** | Shared `CLAUDE.md` checked into git | **NONE** | HIGH |
| **5** | Update CLAUDE.md from PR code review | N/A (need CLAUDE.md first) | MEDIUM |
| **7** | Slash commands for inner-loop workflows | **NONE** (use skills instead — modern replacement) | MEDIUM |
| **8** | Subagents for common PR workflows | **NONE** | MEDIUM |
| **11** | MCP servers for external tools (.mcp.json) | **NONE** | MEDIUM |
| **13** | Verification feedback loop (most important) | **PARTIAL** (build only, no tests/lint) | HIGH |

### Additional: Skills (modern unified approach)
**Status: NONE.** Skills replace slash commands with auto-invocation, supporting files, tool restrictions, and isolated execution. They live in `.claude/skills/<name>/SKILL.md` and can be checked into git.

---

## Implementation Plan

### Step 1: Create `CLAUDE.md` at project root
The single highest-impact item. Captures all conventions and learnings so every Claude session starts informed.

Contents will include:
- Project structure (backend=index.js, frontend=Next.js 14, DB=PostgreSQL+pgvector)
- Build & verification commands (`cd frontend && npm run build`)
- Dark theme conventions (subtle backgrounds, not harsh contrasts)
- API/component patterns (no auto-fetch, user-triggered actions)
- Model routing strategy (DeepSeek primary, Haiku fallback)
- Known mistakes to avoid (captured from our sessions)

### Step 2: Create project skills (`.claude/skills/`)

**a) `build-and-verify` skill** (manual, task)
```
.claude/skills/build-and-verify/SKILL.md
```
- `disable-model-invocation: true` (manual only via `/build-and-verify`)
- Runs frontend build, checks for errors, reports results
- This is our **verification feedback loop** (Tip 13)

**b) `project-conventions` skill** (auto-invoked, reference)
```
.claude/skills/project-conventions/SKILL.md
```
- `disable-model-invocation: false` (auto-invokes when Claude writes UI code)
- Contains dark theme rules, component patterns, API conventions
- Supporting file: `examples.md` with good/bad code examples

**c) `commit-push` skill** (manual, task)
```
.claude/skills/commit-push/SKILL.md
```
- `disable-model-invocation: true`
- Build first, then git add/commit/push
- Uses `!`git status`` and `!`git diff --stat`` for dynamic context injection

**d) `review-changes` skill** (manual, isolated)
```
.claude/skills/review-changes/SKILL.md
```
- `context: fork` (runs in isolated subagent, doesn't clutter main conversation)
- Reviews recent git changes for consistency with CLAUDE.md conventions
- Checks dark theme, hover states, auto-fetch patterns

### Step 3: Create subagents (`.claude/agents/`)

**a) `build-validator.md`** — Validates frontend builds after code changes
**b) `code-simplifier.md`** — Post-implementation cleanup (unused imports, duplicate logic, dark theme consistency)

### Step 4: Create `.mcp.json` for external tool access (Tip 11)
Configure MCP for PostgreSQL so Claude can query real data during development.

### Step 5: Update auto-memory (`MEMORY.md`)
Record key learnings for persistence across conversations.

---

## File Structure

```
CLAUDE.md                                    # Project conventions (Step 1)
.claude/
├── skills/
│   ├── build-and-verify/
│   │   └── SKILL.md                         # /build-and-verify (manual)
│   ├── project-conventions/
│   │   ├── SKILL.md                         # Auto-invoked reference
│   │   └── examples.md                      # Good/bad code patterns
│   ├── commit-push/
│   │   └── SKILL.md                         # /commit-push (manual)
│   └── review-changes/
│       └── SKILL.md                         # /review-changes (isolated)
├── agents/
│   ├── build-validator.md                   # Build validation subagent
│   └── code-simplifier.md                   # Code cleanup subagent
.mcp.json                                    # MCP server config (Step 4)
```

## Skills vs Commands vs Agents — Why Skills

| Feature | Skills (using) | Commands (legacy) | Agents |
|---------|----------------|-------------------|--------|
| Auto-invocation | Yes | No | No |
| Supporting files | Yes (directory) | No (single file) | No |
| Tool restrictions | Yes (`allowed-tools`) | No | Yes |
| Isolated execution | Yes (`context: fork`) | No | Yes (always) |
| Dynamic context | Yes (`!`shell cmd``) | No | No |

Skills are strictly better than commands for everything except backward compatibility.

## What We're NOT Doing
- GitHub Action for @claude on PRs (tip 5) — need CI/CD first
- Chrome extension UI testing (tip 13 advanced) — no browser in this environment
- Slack/BigQuery/Sentry MCP — not in our stack
