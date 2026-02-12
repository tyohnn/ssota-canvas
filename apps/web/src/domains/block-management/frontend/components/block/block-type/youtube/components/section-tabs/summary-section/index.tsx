/**
 * Summary Section
 *
 * Editor Panel의 Summary 탭 컴포넌트
 * YouTube 블록의 요약을 표시하고 편집
 *
 * ✅ TanStack Query를 사용하여:
 * - 컴포넌트가 렌더링될 때만 요약 로드
 * - 자동 캐싱으로 중복 요청 방지
 * - 로딩/에러 상태 자동 관리
 *
 * 구조:
 * - Container (index.tsx): Hook → Props 변환
 * - Business Logic (core/): TanStack Query로 데이터 로드
 * - View (components/): Presentational 컴포넌트
 */

'use client';

import { SummarySectionView } from './components/summary-section-view';
import type { SummarySectionProps } from './core/types';
import { useSummarySectionBusiness } from './core/use-summary-section.business';

/**
 * Summary Section Component
 *
 * Container 컴포넌트: Hook으로 데이터를 가져와서 Props로 View에 전달
 */
export default function SummarySection({
  blockId,
  blockData,
}: SummarySectionProps) {
  // Business Logic Hook
  const business = useSummarySectionBusiness(blockId, blockData);

  // Props로 View에 전달
  return (
    <SummarySectionView
      youtubeId={business.youtubeId}
      youtubeTitle={business.youtubeTitle}
      summaries={business.summaries}
      availableLanguages={business.availableLanguages}
      selectedLanguage={business.selectedLanguage}
      setSelectedLanguage={business.setSelectedLanguage}
      currentSummary={business.currentSummary}
      isLoading={business.isLoading}
      error={business.error}
      onExtractSummary={business.handleExtractSummary}
      isExtracting={business.isExtracting}
      hasAccessForSelectedLanguage={business.hasAccessForSelectedLanguage}
      sourceSummaryAccessLanguages={business.sourceSummaryAccessLanguages}
      readonly={business.readonly}
    />
  );
}
