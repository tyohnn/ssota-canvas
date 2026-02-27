# Step 4: Move Combined

Copy Container to ssota-blocks. Add BlockWrapper and deps props.

## Target

`packages/ssota-blocks/src/{block-type}/combined/{block}-block.tsx`

## Checklist

- [ ] Copy Container (`index.tsx`) to `combined/{block}-block.tsx`
- [ ] Add props: `BlockWrapper`, `CardViewComponent`, `deps`
- [ ] Render: `<BlockWrapper ... renderOriginalView={...} renderCardView={...} />`
- [ ] Do not import DataBlock/CardView — receive as props from caller
