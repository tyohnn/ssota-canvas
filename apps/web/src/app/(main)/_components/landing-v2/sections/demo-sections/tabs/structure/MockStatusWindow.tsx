/**
 * Mock Status Window Component
 *
 * Landing demo용 Status Window.
 * 실제 StatusWindowView 컴포넌트를 재사용합니다.
 * jobs 기반 API로 변환하여 전달합니다.
 */

'use client';

import { useMemo, useState } from 'react';
import { StatusWindowView } from '@/domains/ai-actions/frontend/components/status-window.view';
import type { QueueTodo } from '@workspace/ui/components/ai-elements/queue';
import type { StatusJob } from '@/domains/ai-actions/shared/types/status-job.types';

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
 * context 대신 props로 데이터를 받고, jobs[] 형태로 변환합니다.
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
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);

  const jobs: StatusJob[] = useMemo(() => {
    if (!isVisible || (!isGenerating && !error && todos.length === 0)) {
      return [];
    }
    const type = (operationType === 'visual-summary' || operationType === 'summary'
      ? operationType
      : 'visual-summary') as StatusJob['type'];
    const status = isGenerating ? 'running' : error ? 'failed' : 'completed';
    return [
      {
        id: 'mock-job',
        type,
        status,
        tasks: todos,
        error: error ?? null,
        sourceBlockId: 'mock-block',
        templateName: templateName ?? undefined,
        createdAt: Date.now(),
      },
    ];
  }, [
    isVisible,
    operationType,
    templateName,
    todos,
    isGenerating,
    error,
  ]);

  if (!isVisible) {
    return null;
  }

  return (
    <StatusWindowView
      jobs={jobs}
      expandedJobIds={expandedJobIds}
      onDismissJob={() => {}}
      onToggleExpand={(id) =>
        setExpandedJobIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
      }
      onDismiss={onDismiss}
    />
  );
}
