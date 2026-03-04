/**
 * Summary Tab Types
 *
 * source_summaries 조회 결과를 탭 UI에서 표시하기 위한 View 타입
 * VideoSummaryView, SourceSummaryTabView 등 호환
 */

export interface SourceSummaryTabView {
  id: string;
  sourceId: string;
  language: string;
  summary: string;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

/** SummarySectionView가 실제로 사용하는 최소 필드 (VideoSummaryView/SourceSummaryTabView 호환) */
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
  /** User profile preferred language (select 상단에 표시) */
  userPreferredLanguage?: string;
}
