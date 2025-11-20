/**
 * Agent Conversation Types
 * Message Part 렌더링을 위한 공유 타입 정의
 */

import type { UIMessage } from 'ai';

/**
 * Message Part 렌더링 Props
 */
export interface MessagePartRenderProps {
  part: any; // UIMessagePart는 제네릭 타입이므로 any 사용
  partIndex: number;
  message: UIMessage;
  messages: UIMessage[];
  isAgentRunning: boolean;
}

/**
 * Tool Part Props
 */
export interface ToolPartProps
  extends Pick<
    MessagePartRenderProps,
    'part' | 'partIndex' | 'message' | 'messages'
  > {}

/**
 * Reasoning Part Props
 */
export interface ReasoningPartProps
  extends Pick<
    MessagePartRenderProps,
    'part' | 'partIndex' | 'message' | 'messages' | 'isAgentRunning'
  > {}

/**
 * Text Part Props
 */
export interface TextPartProps
  extends Pick<MessagePartRenderProps, 'part' | 'partIndex' | 'message'> {}

/**
 * Step Start Part Props
 */
export interface StepStartPartProps
  extends Pick<MessagePartRenderProps, 'part' | 'partIndex'> {}

/**
 * Dynamic Tool Part Props
 */
export interface DynamicToolPartProps
  extends Pick<MessagePartRenderProps, 'part' | 'partIndex'> {}
