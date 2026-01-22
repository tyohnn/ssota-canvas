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
  summaries: VideoSummaryView[]; // 현재 선택된 언어의 요약만 포함 (UI 호환성)
  availableLanguages: string[]; // 이미 추출된 언어 목록 (summaryAccessGrantedLanguages 또는 action_transactions 기록)
  selectedLanguage: string; // 현재 선택된 언어
  setSelectedLanguage: (language: string) => void;
  currentSummary: VideoSummaryView | null | undefined; // 선택된 언어의 요약 (null: 아직 추출 안 됨, undefined: 로딩 중)
  isLoading: boolean;
  error: string | null;
  handleExtractSummary: (language: string) => Promise<void>;
  isExtracting: boolean;
  hasAccessForSelectedLanguage: boolean; // 선택된 언어가 이미 추출되었는지 여부
  summaryAccessGrantedLanguages: string[] | undefined; // summaryAccessGrantedLanguages 원본 (체크 표시용)
  readonly: boolean; // Readonly 모드 플래그 (퍼블릭 페이지 등)
}
