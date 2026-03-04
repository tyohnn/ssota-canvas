export {
  loadTabsConfig,
  prefetchTabs,
  hasTabs,
  getTabsConfig,
  clearTabsCache,
  BLOCKS_WITH_TABS,
} from './block-editor-tabs-registry';
export type { BlockEditorTabsConfig, BlockEditorTab } from './block-editor-tabs-registry';
export { TabMapper } from './tabs-mapper';
export {
  prefetchTabComponent,
  prefetchTabComponents,
  getTabComponent,
  isTabComponentLoaded,
} from './tabs-prefetch';
export type { TabComponentProps } from './tabs-prefetch';
