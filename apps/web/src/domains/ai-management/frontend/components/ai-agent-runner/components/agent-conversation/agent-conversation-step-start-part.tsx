/**
 * AgentConversationStepStartPart
 * Step Start Part 렌더링 컴포넌트
 *
 * 멀티 스텝 AI Agent 실행 시 각 스텝 사이에 구분선 표시
 */

import { memo } from 'react';
import type { StepStartPartProps } from './types';

export const AgentConversationStepStartPart = memo(
  function AgentConversationStepStartPart({
    part,
    partIndex,
  }: StepStartPartProps) {
  if (part.type !== 'step-start') {
    return null;
  }

  // 첫 번째 스텝은 구분선 표시하지 않음
  if (partIndex === 0) {
    return null;
  }

  // StepStartUIPart는 stepNumber를 가질 수 있음
  const stepNumber = (part as any).stepNumber ?? partIndex;

  return (
    <div className="my-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <hr className="flex-1 border-border" />
        <span>Step {stepNumber}</span>
        <hr className="flex-1 border-border" />
      </div>
    </div>
  );
  }
);
