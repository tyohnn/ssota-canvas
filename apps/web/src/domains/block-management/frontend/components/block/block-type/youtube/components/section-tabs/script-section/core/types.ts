/**
 * Script Section Types
 */
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { GetScriptDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';

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
  script: GetScriptDTO['youtube']['script'] | undefined;
  isLoading: boolean;
  error: string | null;
  handleExtractScript: () => Promise<void>;
  hasExtractAction: boolean;
  isExtracting: boolean;
}
