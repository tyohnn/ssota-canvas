/**
 * Tool Services — barrel
 *
 * Re-exports from consolidated tool folders.
 * Internal search: createXxxTool factories
 * External search: xaiSearchTool
 */

export {
  createGrepBlockContentTool,
  createGlobBlocksTool,
  createReadBlockLinesTool,
  createHopSearchTool,
  createSearchGroupTool,
  createSearchBySemanticTool,
} from './internal-search';
export type {
  GrepBlockContentYield,
  GrepBlockContentFinal,
  GrepBlockContentIntermediate,
  GrepBlockContentArgs,
  GrepBlockResult,
  GrepMatch,
  GlobBlocksYield,
  GlobBlocksFinal,
  GlobBlocksIntermediate,
  GlobBlocksArgs,
  GlobBlockEntry,
  ReadBlockLinesYield,
  ReadBlockLinesFinal,
  ReadBlockLinesIntermediate,
  ReadBlockLinesArgs,
  ReadBlockLinesSource,
  HopSearchFinal,
  HopSearchArgs,
  HopSearchEntry,
  HopSearchEdgeInfo,
  SearchGroupFinal,
  SearchGroupArgs,
  SearchGroupEntry,
  SearchBySemanticFinal,
  SearchBySemanticArgs,
  SearchBySemanticEntry,
} from './internal-search';

export { xaiSearchTool } from './external-search/xaiSearch';
export type {
  XaiSearchYield,
  XaiSearchFinal,
  XaiSearchIntermediate,
  XaiSearchSource,
} from './external-search/xaiSearch';

export { createGetPageEventsTool } from './events/getPageEvents';
export { createGrepEventsTool } from './events/grepEvents';
