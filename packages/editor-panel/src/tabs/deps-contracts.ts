/**
 * Deps Contracts for Editor Panel Tabs
 *
 * Domain-neutral interfaces for Summary, Timeline, Markdown tabs.
 * Adapters (Canvas/Drive) provide concrete implementations.
 */

import type { ComponentType } from 'react';
import type { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';

/** Summary tab: TipTap editor + markdown converter injection */
export interface SummaryContentDepsContract {
  TipTapEditorComponent: ComponentType<{
    editor: Editor | null;
    editable?: boolean;
    className?: string;
  }>;
  convertMarkdownToTiptapJSON: (md: string) => JSONContent;
}

/** Summary tab: runtime + language + content deps (from adapter) */
export interface SummaryTabRuntimeDeps {
  workspaceId: string;
  readonly: boolean;
  publishToken?: string;
  userPreferredLanguage?: string;
  orderedLanguages: string[];
  getLanguageName: (code: string) => string;
}

/** Timeline tab: transcript interaction handlers (from adapter) */
export interface TimelineTranscriptDeps {
  onTimeClick: (seconds: number) => void;
  onAddQuote: (text: string, timestamp: number, segmentIndex: number) => void | Promise<void>;
  loadingSegmentIndex: number | null;
  readonly: boolean;
}
