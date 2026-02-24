/**
 * Source Job Commands
 *
 * 비즈니스 의도를 명확히 표현하는 Command 패턴 (1 Command : 1 Event)
 */

import type { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

import type { OrgId } from '../value-objects/org-id.vo';
import type { SourceId } from '../value-objects/source-id.vo';
import type { SourceJobId } from '../value-objects/source-job-id.vo';

/**
 * Source Job 생성 Command (pending 등록)
 *
 * 큐에 넣을 pending job 생성 시 사용.
 * sourceId 필수.
 */
export interface CreateSourceJobCommand {
  blockId: BlockId;
  orgId: OrgId;
  sourceId: SourceId;
  language: string;
}

/**
 * Source Job을 completed 상태로 등록하는 Command
 *
 * 이미 요약이 존재할 때 Realtime UI용으로 completed row 등록
 */
export interface RegisterSourceJobCompletedCommand {
  blockId: BlockId;
  orgId: OrgId;
  sourceId: SourceId;
  language: string;
}

/**
 * Source Job 완료 Command
 *
 * 워커가 처리 완료 시
 */
export interface CompleteSourceJobCommand {
  jobId: SourceJobId;
}

/**
 * Source Job 실패 Command
 *
 * 워커가 처리 실패 시
 */
export interface FailSourceJobCommand {
  jobId: SourceJobId;
  errorMessage: string;
}
