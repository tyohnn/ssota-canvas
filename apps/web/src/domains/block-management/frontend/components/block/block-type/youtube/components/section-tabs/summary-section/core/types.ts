/**
 * Summary Section Types
 */
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { VideoSummaryView } from '@/domains/youtube-app-space/shared/dtos/views/video-summary.views';

/**
 * Summary Section Props
 */
export interface SummarySectionProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

/**
 * Summary Section Business Logic Return Type
 */
export interface SummarySectionBusinessLogic {
  youtubeId: string | undefined;
  youtubeTitle: string | undefined;
  summaries: VideoSummaryView[]; // 모든 언어의 요약 목록
  selectedLanguage: string; // 현재 선택된 언어
  setSelectedLanguage: (language: string) => void;
  currentSummary: VideoSummaryView | undefined; // 선택된 언어의 요약
  isLoading: boolean;
  error: string | null;
  handleExtractSummary: (language: string) => Promise<void>;
  hasExtractAction: boolean;
  isExtracting: boolean;
}
