# Step 2: Move Components

Copy View components to ssota-blocks. **Keep originals** (do not delete).

## Target

`packages/ssota-blocks/src/{block-type}/components/`

## Checklist

- [ ] Copy `*.view.tsx`
- [ ] Copy `*-preview-card.tsx`
- [ ] Copy `ui-states/*`
- [ ] Copy `*-overlay.tsx` (e.g. youtube-player-overlay)
- [ ] Replace `@/` imports with `@workspace/ui` or relative paths
- [ ] Use minimal generic types (e.g. `YoutubeMetadata`) instead of domain types
- [ ] Do not import domain types (YoutubeBlockProperties etc.) — define minimal interface in ssota-blocks
