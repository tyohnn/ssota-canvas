/**
 * Mock Status Window Component
 *
 * Landing demo용 Status Window.
 * 실제 StatusWindowView 컴포넌트를 재사용합니다.
 */

'use client';

import { StatusWindowView } from '@/domains/ai-actions/frontend/components/status-window.view';
import type { QueueTodo } from '@workspace/ui/components/ai-elements/queue';

interface MockStatusWindowProps {
  isVisible: boolean;
  operationType?: 'visual-summary' | 'summary' | 'script' | 'ai' | null;
  templateName?: string | null;
  todos?: QueueTodo[];
  isGenerating?: boolean;
  error?: Error | null;
  onDismiss?: () => void;
}

/**
 * MockStatusWindow
 *
 * 실제 StatusWindowView 컴포넌트를 재사용합니다.
 * context 대신 props로 데이터를 받습니다.
 */
export function MockStatusWindow({
  isVisible,
  operationType,
  templateName,
  todos = [],
  isGenerating = false,
  error = null,
  onDismiss,
}: MockStatusWindowProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <StatusWindowView
      isGenerating={isGenerating}
      error={error}
      todos={todos}
      operationType={operationType ?? null}
      templateName={templateName ?? null}
      onDismiss={onDismiss}
    />
  );
}
