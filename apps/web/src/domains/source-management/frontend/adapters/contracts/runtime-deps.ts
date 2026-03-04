/**
 * Runtime deps for source tabs (summary, timeline, markdown).
 * Injected by Canvas or Drive; no context reads inside hooks that use these.
 */

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

/** BlockInteractions: e.g. { seekTo: (seconds: number) => void } */
export type BlockInteractions = Record<
  string,
  (...args: unknown[]) => void | Promise<void>
>;

export interface SourceSummaryRuntimeDeps {
  workspaceId: string;
  pageId?: string;
  readonly: boolean;
  publishToken?: string;
  /** Called when summary job completes (e.g. clear tab isExtracting). No-op on Drive. */
  onJobCompleted: () => void;
  /** Initial language when opening summary tab from block action. Undefined on Drive. */
  getInitialTabLanguage: (blockSlug: string) => string | undefined;
  /** Whether tabOptions.isExtracting is true for this block. False on Drive. */
  getIsExtractingFromTabOptions: (blockSlug: string) => boolean;
  /** AI status panel: register block for Realtime. No-op acceptable on Drive. */
  setAutoSummaryBlockId: (blockId: string | null) => void;
}

export interface SummaryExtractMutationDeps {
  workspaceId: string;
  setAutoSummaryBlockId: (blockId: string | null) => void;
}

export interface SourceTimelineTabRuntimeDeps {
  workspaceId: string;
  readonly: boolean;
  publishToken?: string;
}

export interface UpdateBlockContentInput {
  nodeId: string;
  content: unknown;
  blockData: BlockNodeData;
}

export interface TimelineTranscriptRuntimeDeps {
  readonly: boolean;
  getBlockInteractions: (blockMountId: string) => BlockInteractions | undefined;
  updateBlockContent: (input: UpdateBlockContentInput) => Promise<boolean>;
}

export interface MarkdownTabRuntimeDeps {
  workspaceId: string;
  readonly: boolean;
  publishToken?: string;
}
