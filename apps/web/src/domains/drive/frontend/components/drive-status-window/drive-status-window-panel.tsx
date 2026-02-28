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
  const { windowDismissed, showStatusWindow, dismissStatusWindow } =
    useDriveSourceJobStatusContext();
  const [isExiting, setIsExiting] = useState(false);

  const showTrigger = windowDismissed && !isExiting;

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
