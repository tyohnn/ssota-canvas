/**
 * X Block - ssota-blocks
 *
 * Export View components and useXBlock for Canvas.
 * block-management assembles DataBlock + useXBlock + XView (Link pattern).
 */

export { XView } from './components/x.view';
export { XPreviewCard } from './components/x-preview-card';
export { XEmptyState } from './components/ui-states/x-empty-state';
export { XLoadingState } from './components/ui-states/x-loading-state';

export { useXBlock } from './logic/use-x-block';
export { contentTitleFromText } from './logic/utils';
export { hasXMetadata } from './logic/types';

export type {
  XMetadata,
  XPostEntities,
  XPostEntityHashtag,
  XPostEntityMention,
  XPostEntityUrl,
  XPropertiesLike,
  XBlockHookProps,
  UseXBlockDeps,
  UseXBlockReturn,
  XViewProps,
} from './logic/types';
