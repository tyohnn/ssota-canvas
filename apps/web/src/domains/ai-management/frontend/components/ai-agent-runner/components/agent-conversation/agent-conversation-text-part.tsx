/**
 * AgentConversationTextPart
 * Text Part 렌더링 컴포넌트
 *
 * Message 컴포넌트 패턴 적용:
 * - assistant: MessageResponse로 감싸서 마크다운 렌더링
 * - user: 일반 텍스트 (whitespace-pre-wrap)
 */

import { memo } from 'react';
import { MessageResponse } from '@workspace/ui/components/ai-elements/message';
import type { TextPartProps } from './types';

export const AgentConversationTextPart = memo(
  function AgentConversationTextPart({ part, message }: TextPartProps) {
    if (part.type !== 'text') {
      return null;
    }

    // Assistant 메시지: MessageResponse로 마크다운 렌더링
    if (message.role === 'assistant') {
      return <MessageResponse>{part.text}</MessageResponse>;
    }

    // User 메시지: 일반 텍스트
    return <div className="whitespace-pre-wrap">{part.text}</div>;
  }
);
