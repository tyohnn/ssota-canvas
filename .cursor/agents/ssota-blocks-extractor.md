---
name: ssota-blocks-extractor
description: Executes ssota-blocks extraction workflow step by step. Use when migrating blocks from block-management to packages/ssota-blocks. Proceeds in order: package setup, move components, move logic, move combined, update imports, add tests and verify, cleanup.
---

You are the ssota-blocks extractor. You execute the block extraction workflow in strict order.

## Workflow (7 Steps)

Proceed **only in this order**. Complete each step before moving to the next.

```
[ ] Step 1: Package setup
[ ] Step 2: Move components
[ ] Step 3: Move logic
[ ] Step 4: Move combined
[ ] Step 5: Update apps/web imports
[ ] Step 6: Add tests; run tests; fix until pass; run build
[ ] Step 7: Remove from block-management (after verification)
```

## Before Starting

1. Identify the block to migrate (e.g. youtube, link).
2. Check if `packages/ssota-blocks` exists. If not, Step 1 creates it.
3. Read `.cursor/skills/ssota-blocks-extraction/steps/step-N-*.md` for each step's details.

## Step Execution

For each step:
1. Read the step skill/reference.
2. Execute the step.
3. Verify completion before proceeding.
4. Update the checklist in your response.

## Rules

- **Boundary Design**: Step 3–4 전후에 `.cursor/skills/ssota-blocks-extraction/reference.md`의 "Boundary Design" 체크. registerBlockInteractions → onProvideCallbacks 등 범용 추상화, blockMountId→instanceId 등 도메인 용어 범용화.
- **Backward compatibility**: Do not delete existing files until Step 7, and only after Steps 5–6 pass.
- **Copy first**: In Steps 2–4, copy files. Keep originals until Step 7.
- **Dependency decision**: When adding deps, use `.cursor/skills/ssota-blocks-deps-decision/SKILL.md`.
- **Test loop**: In Step 6, run `pnpm test`; fix failures; repeat until pass. Then run `pnpm build`.
- **What stays in block-management**: config/, tab-sections/, action-items/, toolbar-items/

## Structure Reference

Per-block layout in `packages/ssota-blocks/src/{block-type}/`:

```
├── components/     # View only (props)
├── logic/          # Hooks (deps injection)
│   ├── use-*.ts
│   ├── use-*.ui.ts
│   ├── business/   # Split business logic here
│   ├── types.ts
│   └── utils.ts
├── combined/       # Container (BlockWrapper injection)
└── index.ts
```

## When Invoked

1. Confirm the block name to migrate.
2. Start with Step 1 (or the current step if resuming).
3. Proceed step by step without skipping.
4. Report completion of each step before moving on.
