/**
 * Status Window Component
 *
 * 캔버스 우측 상단에 표시되는 진행 상태 창.
 * jobs[] 기반 아코디언 카드 스택 (Visual summary, Auto summary 등).
 * ssota-ui StatusWindowView 위임 (jobs는 이미 resourceId 포함).
 */

'use client';

import { useEffect } from 'react';

import { StatusWindowView } from '@workspace/ui/components/ssota-ui/status-window';
import { useAIActionContext } from '../contexts/ai-action-context';

export interface StatusWindowProps {
  /** 패널에서 닫기 애니메이션 후 context 반영을 위해 사용. 없으면 context dismiss 직접 호출 */
  onDismiss?: () => void;
}

export function StatusWindow({ onDismiss }: StatusWindowProps = {}) {
  const {
    jobs,
    expandedJobIds,
    dismissJob,
    toggleExpandedJobId,
    openBlockEditor,
    dismissStatusWindow,
    windowDismissed,
    reportInitialNoContent,
  } = useAIActionContext();

  const handleDismiss = onDismiss ?? dismissStatusWindow;
  const hasContent = jobs.length > 0;

  useEffect(() => {
    if (!hasContent) reportInitialNoContent();
  }, [hasContent, reportInitialNoContent]);

  if (windowDismissed) return null;

  return (
    <StatusWindowView
      jobs={jobs}
      expandedJobIds={expandedJobIds}
      onDismissJob={dismissJob}
      onToggleExpand={toggleExpandedJobId}
      onDismiss={handleDismiss}
      onOpenResource={openBlockEditor}
    />
  );
}
