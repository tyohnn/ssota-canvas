/**
 * Status Window Job 타입 정의
 *
 * Job 단위로 상태창에 표시. Visual summary(다중 task) / Auto summary(단일 task) 공통.
 */
import type { QueueTodo } from '@workspace/ui/components/ai-elements/queue';

export type StatusJobType = 'visual-summary' | 'summary';

export type StatusJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface StatusJob {
  id: string;
  type: StatusJobType;
  status: StatusJobStatus;
  tasks: QueueTodo[];
  error: Error | null;
  sourceBlockId: string;
  templateName?: string;
  createdAt: number;
}
