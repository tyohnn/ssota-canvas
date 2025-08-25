# Xbowl CLI Phased Plan

## Phase 1: Core Structure and Templates (Week 1)

- [x] Init scaffolding completes without errors
  - [x] Creates `.xbowl/{config.json, block-registry.json, state.json}`
  - [x] Creates directories: `.xbowl/{templates, data, artifacts, sessions, cache, locks}` and `.claude/{agents,commands}`
- [x] Default Claude templates available and editable
  - [x] `.xbowl/templates/claude/{agent.md, command.md, workflow.md}`
  - [x] `.xbowl/templates/data/load-data.md`
- [x] Minimal template rendering wired into `sync`
  - [x] Agent/Task/Data/Workflow content generated from templates (simple placeholders)
- [x] Block registry basic shape defined
  - [x] `block-registry.json` includes `version`, `workspace`, `blocks[]`, `edges[]`
- [x] Status command reports counts and directory presence

Acceptance criteria:

- [x] Running `xbowl init` creates all paths and default templates if missing
- [x] Running `xbowl sync --dry-run` lists intended files; without `--dry-run`, writes files using templates
- [x] Editing a template file changes output upon re-sync

## Phase 2: Conversion Engine (Weeks 2–3)

- [x] Agent → Sub-Agent MD conversion (role, identity, focus, principles)
- [x] Task → Slash Command MD conversion (instructions, model)
- [x] Data → file + load command generation
- [x] Workflow → orchestration sub-agent stub
- [x] Template engine enhancements
  - [x] Placeholder validation and missing-field handling
  - [x] Config-driven required phrases and security warnings injection

Acceptance criteria:

- [x] Generated files pass basic lint/validation (non-empty and strict placeholders)
- [x] Template variables resolve correctly; missing required fields produce actionable errors (via validate command for metadata)

## Phase 3: Sync System (Weeks 3–4)

- [~] `pull`: DB → `block-registry.json` (workspace export API, auth) — skeleton with ETag
- [~] `collect`: `.xbowl/artifacts/**` → DB upsert (zod validation) — local scan summary
- [x] `diff`: local vs expected (missing files; exits non-zero when missing)
- [x] `validate`: slug rules, required metadata, referential integrity (edges)
- [x] `status`: enhanced with mismatch summaries (missing files)

Acceptance criteria:

- [ ] ETag/If-None-Match support for pull — implemented in skeleton; pending real API
- [x] Clear diff output; non-zero exit on validation failures (CI-ready baseline)

## Phase 4: Advanced Features (Week 5)

- [ ] Workflow orchestration generation from edges
- [ ] Artifact Class-aware commands and schemas
- [ ] Template customization helpers and presets
- [ ] CI/CD integration (dry-run checks on PR)

Acceptance criteria:

- [ ] Complex workflows generate consistent orchestrator agents
- [ ] CI blocks PRs when sync/validate fails
