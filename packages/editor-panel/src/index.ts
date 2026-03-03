/**
 * @workspace/editor-panel
 *
 * Editor panel for block editing (canvas and standalone/Drive).
 * Uses props/deps injection - no Provider pattern for property editors.
 */

export {
  EditorPanelView,
  type EditorPanelViewProps,
} from './editor-panel-view';

export {
  HeaderView,
  type EditorPanelHeaderActions,
  type HeaderViewProps,
} from './header';

export {
  useEditorPanelContract,
  type EditorPanelBusinessLogic,
  type UseEditorPanelContractArgs,
} from './logic';

export {
  PropertyGroup,
  type PropertyGroupProps,
  type PropertyGroupDefinition,
} from './property';
export * from './property';

export {
  ContentAreaView,
  TitleInputView,
  type ContentAreaViewProps,
  type TitleInputViewProps,
} from './content';

export {
  BlockContentTabsSection,
  type BlockContentTabsSectionProps,
  type BlockContentTabsSectionDeps,
  type BlockEditorTabLike,
  type BlockEditorTabsConfigLike,
} from './tabs';

