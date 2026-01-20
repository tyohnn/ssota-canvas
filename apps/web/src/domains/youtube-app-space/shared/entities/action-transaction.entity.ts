/**
 * Action Transaction Entity
 *
 * YouTube 블록의 유료 액션 추적을 나타내는 도메인 엔티티
 * - org_id + video_id로 org 단위 권한 관리
 * - 같은 org 내 워크스페이스 간 자동 공유
 */
import { ActionTransactionId } from '../value-objects/action-transaction-id.vo';
import { VideoId } from '../value-objects/video-id.vo';

export type ActionType = 'extract_script' | 'extract_summary' | 'smart_summary';

export class ActionTransactionEntity {
  constructor(
    public readonly id: ActionTransactionId,
    public readonly orgId: string, // Organization ID (org 단위 권한 관리)
    public readonly videoId: VideoId,
    public readonly actionType: ActionType,
    public readonly language: string | undefined, // Language code for multi-language actions (e.g., 'ko' for extract_summary)
    public readonly createdAt: Date,
    public completedAt: Date | undefined
  ) { }

  /**
   * 기존 데이터로 Action Transaction 재구성 (Repository에서 사용)
   *
   * @param params - Action Transaction 재구성에 필요한 모든 파라미터
   * @returns ActionTransactionEntity 인스턴스
   */
  static reconstitute(params: {
    id: ActionTransactionId;
    orgId: string;
    videoId: VideoId;
    actionType: ActionType;
    language?: string;
    createdAt: Date;
    completedAt?: Date;
  }): ActionTransactionEntity {
    return new ActionTransactionEntity(
      params.id,
      params.orgId,
      params.videoId,
      params.actionType,
      params.language,
      params.createdAt,
      params.completedAt
    );
  }

  /**
   * 완료 여부 확인
   */
  isCompleted(): boolean {
    return this.completedAt !== undefined && this.completedAt !== null;
  }

  /**
   * Transaction 완료 처리
   */
  complete(): void {
    if (this.isCompleted()) {
      return; // 이미 완료된 경우 스킵
    }
    this.completedAt = new Date();
  }
}
