/**
 * Status Window Component
 *
 * 캔버스 우측 상단에 표시되는 진행 상태 창.
 * 비주얼 요약, 일반 요약, 스크립트 추출, AI 호출 등 작업 유형별 상태를 표시합니다.
 */

'use client';

import { useAIActionContext } from '../contexts/ai-action-context';
import { StatusWindowView } from './status-window.view';

export function StatusWindow() {
  const {
    isGenerating,
    error,
    todos,
    dismissStatusWindow,
    windowDismissed,
    statusOperationType,
    statusTemplateName,
  } = useAIActionContext();

  // 실행 중이 아니거나, 사용자가 닫았으면 표시하지 않음
  if (windowDismissed || (!isGenerating && !error && todos.length === 0)) {
    return null;
  }

  return (
    <StatusWindowView
      isGenerating={isGenerating}
      error={error}
      todos={todos}
      operationType={statusOperationType}
      templateName={statusTemplateName}
      onDismiss={dismissStatusWindow}
    />
  );
}
