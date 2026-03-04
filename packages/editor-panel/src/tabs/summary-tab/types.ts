/**
 * Summary Tab Types
 * Domain-neutral view types for summary tab display
 */

import type { ComponentType } from 'react';
import type { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';

export interface SummaryContentDeps {
  TipTapEditorComponent: ComponentType<{
    editor: Editor | null;
    editable?: boolean;
    className?: string;
  }>;
  convertMarkdownToTiptapJSON: (md: string) => JSONContent;
}

export interface SummaryContentDisplay {
  summary: string;
  keywords: string[];
}

export interface SummarySectionViewProps {
  summaries: SummaryContentDisplay[];
  availableLanguages: string[];
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  currentSummary: SummaryContentDisplay | null | undefined;
  isLoading: boolean;
  error: string | null;
  onExtractSummary: (language: string) => Promise<void>;
  isExtracting: boolean;
  hasAccessForSelectedLanguage: boolean;
  sourceSummaryAccessLanguages: string[] | undefined;
  readonly: boolean;
  userPreferredLanguage?: string;
  /** Ordered language codes for selector (preferred first). Defaults to availableLanguages. */
  orderedLanguages?: string[];
  /** Display name for language code. Defaults to code.toUpperCase() */
  getLanguageName?: (code: string) => string;
  /** Deps for SummaryContent (TipTap editor, markdown converter). Required when rendering summary body. */
  summaryContentDeps?: SummaryContentDeps;
}
