/**
 * Action Transaction Entity
 *
 * YouTube 블록의 유료 액션 추적을 나타내는 도메인 엔티티
 * - 어떤 블록과 비디오가 어떤 액션이 있었는지만 기록
 */
import { ActionTransactionId } from '../value-objects/action-transaction-id.vo';
import { VideoId } from '../value-objects/video-id.vo';
import { BlockId } from '../../../block-management/shared/value-objects/block-id.vo';

export type ActionType = 'get_script' | 'smart_summary';

export class ActionTransactionEntity {
  constructor(
    public readonly id: ActionTransactionId,
    public readonly blockId: BlockId,
    public readonly videoId: VideoId,
    public readonly actionType: ActionType,
    public readonly createdAt: Date,
    public completedAt: Date | undefined
  ) {}

  /**
   * 기존 데이터로 Action Transaction 재구성 (Repository에서 사용)
   *
   * @param params - Action Transaction 재구성에 필요한 모든 파라미터
   * @returns ActionTransactionEntity 인스턴스
   */
  static reconstitute(params: {
    id: ActionTransactionId;
    blockId: BlockId;
    videoId: VideoId;
    actionType: ActionType;
    createdAt: Date;
    completedAt?: Date;
  }): ActionTransactionEntity {
    return new ActionTransactionEntity(
      params.id,
      params.blockId,
      params.videoId,
      params.actionType,
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
