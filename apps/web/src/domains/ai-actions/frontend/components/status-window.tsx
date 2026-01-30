/**
 * Status Window Component
 *
 * 캔버스 우측 상단에 표시되는 진행 상태 창.
 * 비주얼 요약, 일반 요약, 스크립트 추출, AI 호출 등 작업 유형별 상태를 표시합니다.
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { useAIActionContext } from '../contexts/ai-action-context';
import {
  Queue,
  QueueSection,
  QueueSectionTrigger,
  QueueSectionLabel,
  QueueSectionContent,
  QueueList,
  QueueItem,
  QueueItemIndicator,
  QueueItemContent,
  QueueItemDescription,
} from '@workspace/ui/components/ai-elements/queue';

const OPERATION_TYPE_LABELS: Record<string, string> = {
  'visual-summary': 'Visual Summary',
  summary: 'Summary',
  script: 'Script',
  ai: 'AI',
};

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

  const hasTodos = todos.length > 0;
  const isLoadingTodos = hasTodos && todos.some(todo => todo.status !== 'completed');

  const operationLabel = statusOperationType
    ? OPERATION_TYPE_LABELS[statusOperationType] ?? statusOperationType
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Box className="w-[320px] max-h-[400px] bg-background/95 backdrop-blur border border-border rounded-xl shadow-xl flex flex-col overflow-hidden">
          {/* Header */}
          <Box className="px-3 py-2.5 flex items-center justify-between border-b bg-muted/30">
            <Box className="flex items-center gap-2 min-w-0">
              {/* 진행 중일 때 초록 펄스 */}
              {isGenerating && (
                <motion.span
                  className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                  }}
                  aria-hidden
                />
              )}
              <Box className="min-w-0 flex flex-col gap-0.5">
                <Box className="text-sm font-semibold text-foreground">Status</Box>
                {(operationLabel || statusTemplateName) && (
                  <Box className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                    {operationLabel && <span>{operationLabel}</span>}
                    {statusOperationType === 'visual-summary' && statusTemplateName && (
                      <>
                        {operationLabel && <span>·</span>}
                        <span>Template: {statusTemplateName}</span>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
            <button
              type="button"
              onClick={dismissStatusWindow}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 shrink-0"
              aria-label="Close status window"
            >
              <X className="h-4 w-4" />
            </button>
          </Box>

          {/* Content */}
          <Box className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* 에러 표시 */}
            {error && (
              <Box className="px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error.message || 'An error occurred'}</span>
              </Box>
            )}

            {/* 초기 로딩 상태 (todos가 없고 생성 중일 때) */}
            {!hasTodos && isGenerating && !error && (
              <Box className="px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Starting...</span>
              </Box>
            )}

            {/* Todo Queue */}
            {hasTodos && (
              <Box className={error ? 'mt-2 border-t pt-2' : ''}>
                {isLoadingTodos && (
                  <Box className="px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <span>Processing tasks...</span>
                  </Box>
                )}
                <Queue>
                  <QueueSection>
                    <QueueSectionTrigger>
                      <QueueSectionLabel count={todos.length} label="Tasks" />
                    </QueueSectionTrigger>
                    <QueueSectionContent>
                      <QueueList>
                        {todos.map((todo) => {
                          const isCompleted = todo.status === 'completed';

                          return (
                            <QueueItem key={todo.id}>
                              <div className="flex items-center gap-2">
                                <QueueItemIndicator completed={isCompleted} />
                                <QueueItemContent completed={isCompleted}>
                                  {todo.title}
                                </QueueItemContent>
                              </div>
                              {todo.description && (
                                <QueueItemDescription completed={isCompleted}>
                                  {todo.description}
                                </QueueItemDescription>
                              )}
                            </QueueItem>
                          );
                        })}
                      </QueueList>
                    </QueueSectionContent>
                  </QueueSection>
                </Queue>
              </Box>
            )}
          </Box>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
}
