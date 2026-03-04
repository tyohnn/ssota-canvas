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
  NoteTabView,
  SummarySectionView,
  SummarySectionContainer,
  SummaryContent,
  SummaryKeywords,
  SummaryTableOfContents,
  SummaryTOCSlotProvider,
  useSummaryTOCSlot,
  ExtractSummaryButton,
  LanguageSelector,
  SummaryErrorState,
  SummaryLoadingState,
  SummaryNoSummaryState,
  TimelineTabView,
  TimelineContent,
  TimelineTableOfContents,
  TimelineTranscript,
  TimelineTranscriptView,
  TimelineTranscriptItemView,
  TimelineTabContainer,
  TimelineErrorState,
  TimelineLoadingState,
  TimelineNoScriptState,
  MarkdownTabView,
  type BlockContentTabsSectionProps,
  type BlockContentTabsSectionDeps,
  type BlockEditorTabLike,
  type BlockEditorTabsConfigLike,
  type NoteTabViewProps,
  type SummarySectionViewProps,
  type SummaryContentDeps,
  type SummaryContentDisplay,
  type TimelineTabViewProps,
  type TimelineScriptLike,
  type TimelineTranscriptSegmentLike,
  type MarkdownTabViewProps,
  type MarkdownTabViewPropsWithDeps,
} from './tabs';

