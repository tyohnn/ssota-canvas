'use client';

/**
 * AgentConversationToolPart
 * Tool Part를 Task 컴포넌트로 렌더링
 *
 * 각 Tool Call = 1개의 Task (실시간으로 순차적으로 들어옴)
 */

import { memo } from 'react';
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
} from '@workspace/ui/components/ai-elements/task';
import type { ToolPartProps } from './types';

export const AgentConversationToolPart = memo(
  function AgentConversationToolPart({ part }: ToolPartProps) {
    // Tool Part 타입 체크
    const isToolPart =
      part.type === 'tool-addBlock' ||
      part.type === 'tool-deleteBlock' ||
      part.type === 'tool-updateProperty' ||
      part.type === 'tool-connectBlocks' ||
      part.type === 'tool-executeBlockAction' ||
      part.type === 'tool-searchByKeyword' ||
      part.type === 'tool-searchByHop' ||
      part.type === 'tool-searchBySemantic' ||
      part.type === 'tool-searchBlockTypes';

    if (!isToolPart) {
      return null;
    }

    const toolName = part.type.replace('tool-', '');

    // Task 제목: 상태에 따라 변경
    const getTaskTitle = () => {
      if (part.state === 'input-streaming') {
        return `${toolName} 준비 중...`;
      }
      if (part.state === 'input-available') {
        return `${toolName} 실행 중...`;
      }
      if (part.state === 'output-available') {
        return `${toolName} 완료`;
      }
      if (part.state === 'output-error') {
        return `${toolName} 실패`;
      }
      return toolName;
    };

    // Task 요약: output에서 추출
    const getTaskSummary = () => {
      if (part.state === 'output-available') {
        if (
          typeof part.output === 'object' &&
          part.output !== null &&
          'message' in part.output
        ) {
          return String(part.output.message);
        }
        return '작업이 완료되었습니다.';
      }
      if (part.state === 'output-error') {
        return part.errorText || '알 수 없는 오류가 발생했습니다.';
      }
      return null;
    };

    const summary = getTaskSummary();

    return (
      <Task defaultOpen={part.state !== 'output-available'}>
        <TaskTrigger title={getTaskTitle()} />
        <TaskContent>
          {part.state === 'input-streaming' && (
            <TaskItem>
              <div className="flex items-center gap-2 text-sm">
                <span className="animate-pulse">⏳</span>
                <span className="text-muted-foreground">
                  도구 입력을 준비하고 있습니다...
                </span>
              </div>
            </TaskItem>
          )}

          {part.state === 'input-available' && (
            <TaskItem>
              <div className="flex items-center gap-2 text-sm">
                <svg
                  className="animate-spin h-4 w-4 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-muted-foreground">
                  도구를 실행하고 있습니다...
                </span>
              </div>
            </TaskItem>
          )}

          {part.state === 'output-available' && summary && (
            <TaskItem>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-500">✓</span>
                <span>{summary}</span>
              </div>
            </TaskItem>
          )}

          {part.state === 'output-error' && summary && (
            <TaskItem>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-500">✗</span>
                <span className="text-red-500">{summary}</span>
              </div>
            </TaskItem>
          )}
        </TaskContent>
      </Task>
    );
  }
);
