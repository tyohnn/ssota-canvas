# Step 1: Package Setup

Create `packages/ssota-blocks/` if it does not exist.

## Checklist

- [ ] Create `packages/ssota-blocks/` directory
- [ ] Create package.json (name: @workspace/ssota-blocks)
- [ ] Create tsconfig.json
- [ ] Create vitest.config.ts (for tests)
- [ ] Add exports: `"."`, `"./{block-type}"` (e.g. `"./youtube"`)
- [ ] Add dependencies. See [ssota-blocks-deps-decision](../../ssota-blocks-deps-decision/SKILL.md). Typically: @workspace/ui, react, react-dom; add react-youtube etc. per block.
- [ ] Add to apps/web next.config.mjs: `transpilePackages: ['@workspace/ssota-blocks']`
- [ ] Ensure pnpm workspace includes packages/ssota-blocks
