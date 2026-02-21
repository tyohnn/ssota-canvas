/**
 * Script Section Types
 */
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { YoutubeScript } from '@/domains/youtube-app-space/shared/types/transcript.types';

/**
 * Script Section Props
 */
export interface ScriptSectionProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

/**
 * Script Section Business Logic Return Type
 */
export interface ScriptSectionBusinessLogic {
  youtubeId: string | undefined;
  youtubeTitle: string | undefined;
  script: YoutubeScript | undefined;
  extractedAt: Date | null | undefined;
  isLoading: boolean;
  error: string | null;
  handleExtractScript: () => Promise<void>;
  isExtracting: boolean;
}
