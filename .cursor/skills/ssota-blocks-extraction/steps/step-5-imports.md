# Step 5: Update apps/web Imports

Update consumers to import from @workspace/ssota-blocks.

## Checklist

- [ ] node-types.config.ts: import YoutubeBlock from @workspace/ssota-blocks; pass BlockWrapper={DataBlock}, CardViewComponent={CardView}, deps={...}
- [ ] TutorialYoutubeBlockNode: import YoutubeView from @workspace/ssota-blocks
- [ ] SummarizeYoutubeBlock, MockYoutubeBlock: import YoutubeView from @workspace/ssota-blocks
- [ ] LinkYoutubePreviewSection: import YoutubePreviewCard, YoutubeLoadingState from @workspace/ssota-blocks
- [ ] Optional: block-management re-export `export { YoutubeView, ... } from '@workspace/ssota-blocks'` for backward compatibility during transition
