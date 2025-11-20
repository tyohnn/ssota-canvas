/**
 * AIAgentRunner Props
 * NoCode 호환: 함수 Props 없음, 단순 값만
 */
export interface AIAgentRunnerProps {
  pageId: string; // 필수
  workspaceId: string; // 필수
  organizationId: string; // 필수
}

/**
 * Client Context
 * 프론트엔드에서 서버로 전달하는 컨텍스트
 */
export interface ClientContext {
  pageId: string;
  workspaceId: string;
  organizationId: string;
  selectedBlockIds: string[];
  visibleBlockIds: string[];
  recentlyModifiedBlockIds?: string[];
}

/**
 * Tool Call State
 * 툴 실행 상태
 */
export type ToolCallState = 'idle' | 'executing' | 'completed' | 'error';

/**
 * Agent State
 * Agent 실행 상태
 */
export interface AgentState {
  isRunning: boolean;
  currentStep: number;
  maxSteps: number;
  error: string | null;
}
