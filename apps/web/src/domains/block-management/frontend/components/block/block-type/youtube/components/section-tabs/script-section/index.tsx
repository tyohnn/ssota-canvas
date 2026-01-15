/**
 * Script Section
 *
 * Editor Panel의 Script 탭 컴포넌트
 * YouTube 블록의 스크립트를 표시하고 편집
 *
 * ✅ TanStack Query를 사용하여:
 * - 컴포넌트가 렌더링될 때만 스크립트 로드
 * - 자동 캐싱으로 중복 요청 방지
 * - 로딩/에러 상태 자동 관리
 *
 * 구조:
 * - Container (index.tsx): Hook → Props 변환
 * - Business Logic (core/): TanStack Query로 데이터 로드
 * - View (components/): Presentational 컴포넌트
 */

'use client';

import { ScriptSectionView } from './components/script-section-view';
import type { ScriptSectionProps } from './core/types';
import { useScriptSectionBusiness } from './core/use-script-section.business';

/**
 * Script Section Component
 *
 * Container 컴포넌트: Hook으로 데이터를 가져와서 Props로 View에 전달
 */
export default function ScriptSection({
  blockId,
  blockData,
}: ScriptSectionProps) {
  // Business Logic Hook
  const business = useScriptSectionBusiness(blockId, blockData);

  // Props로 View에 전달
  return (
    <ScriptSectionView
      youtubeId={business.youtubeId}
      youtubeTitle={business.youtubeTitle}
      script={business.script}
      isLoading={business.isLoading}
      error={business.error}
      onExtractScript={business.handleExtractScript}
      isExtracting={business.isExtracting}
    />
  );
}
