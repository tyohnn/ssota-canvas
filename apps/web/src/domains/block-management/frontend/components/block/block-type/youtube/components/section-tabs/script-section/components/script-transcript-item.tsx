/**
 * Script Transcript Item
 *
 * Container Component: Hook → Props 변환
 * 개별 스크립트 트랜스크립트 세그먼트를 표시하는 컴포넌트
 * hover 시 quote 버튼이 우측에 나타나며, 클릭 시 quote 블록으로 추가
 */

'use client';

import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import {
  ScriptTranscriptItemView,
  type ScriptTranscriptSegment,
} from './script-transcript-item.view';

export interface ScriptTranscriptItemProps {
  segment: ScriptTranscriptSegment;
  onTimeClick: (seconds: number) => void;
  onAddQuote: (text: string) => void;
  isLoading?: boolean;
}

export function ScriptTranscriptItem({
  segment,
  onTimeClick,
  onAddQuote,
  isLoading = false,
}: ScriptTranscriptItemProps) {
  const { readonly } = useCanvasReadOnly();

  return (
    <ScriptTranscriptItemView
      segment={segment}
      onTimeClick={onTimeClick}
      onAddQuote={onAddQuote}
      isLoading={isLoading}
      readonly={readonly}
    />
  );
}
