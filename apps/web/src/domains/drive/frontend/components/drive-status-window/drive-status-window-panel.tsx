/**
 * Drive Status Window Panel
 *
 * Drive 우측 상단: Status Window + 닫힌 경우 다시 열기 트리거 버튼
 * ssota-ui StatusWindowPanelView 위임.
 */

'use client';

import { useState } from 'react';

import { StatusWindowPanelView } from '@workspace/ui/components/ssota-ui/status-window-panel';
import { useDriveSourceJobStatusContext } from '../../contexts/drive-source-job-status-context';
import { DriveStatusWindow } from './drive-status-window';

export function DriveStatusWindowPanel() {
  const { showStatusWindow, dismissStatusWindow } =
    useDriveSourceJobStatusContext();
  const [isExiting, setIsExiting] = useState(false);

  // Drive: 트리거 숨김. 새 소스 추가 시 pushSummaryJob에서 자동으로 창을 다시 띄움.
  const showTrigger = false;

  const handleCloseAnimationComplete = () => {
    if (isExiting) {
      dismissStatusWindow();
      setIsExiting(false);
    }
  };

  return (
    <StatusWindowPanelView
      showTrigger={showTrigger}
      onOpenClick={showStatusWindow}
      isExiting={isExiting}
      onCloseAnimationComplete={handleCloseAnimationComplete}
    >
      <DriveStatusWindow onDismiss={() => setIsExiting(true)} />
    </StatusWindowPanelView>
  );
}
