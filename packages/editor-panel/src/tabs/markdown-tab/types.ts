/**
 * Markdown Tab Types
 */

export interface MarkdownTabViewProps {
  content: string | null | undefined;
  extractedAt?: Date | null;
  isLoading: boolean;
  error: string | null;
  hasSourceId: boolean;
  emptyMessage?: string;
}
