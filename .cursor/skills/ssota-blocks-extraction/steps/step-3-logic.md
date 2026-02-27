# Step 3: Move Logic

Copy hooks to ssota-blocks. **Refactor** to receive deps via injection. **Keep originals**.

## Target

`packages/ssota-blocks/src/{block-type}/logic/`

## Checklist

- [ ] Copy `core/use-*.ts`, `core/types.ts`, `core/utils.ts`
- [ ] If business logic is large: create `logic/business/` folder, split (fetch-metadata.ts, update-properties.ts, etc.)
- [ ] Refactor hooks: `useYoutubeBlock(props, { deps })` — accept deps object
- [ ] Remove direct imports of domain hooks; accept them in deps
- [ ] Use `NodeLike { id?; data? }` for getNode/updateNode types — do not import @xyflow/react
- [ ] business/ modules receive external deps via injection; no domain import
