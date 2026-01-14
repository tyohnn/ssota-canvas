/**
 * Action Transaction Aggregate
 *
 * Action Transaction Entity의 생명주기와 비즈니스 규칙을 관리
 * - Command를 받아 비즈니스 로직 실행
 * - Domain Event 발생 (1 Command : 1 Event)
 * - 불변성 보장
 */
import { BlockId } from '../../../block-management/shared/value-objects/block-id.vo';
import type {
  CompleteActionTransactionCommand,
  CreateActionTransactionCommand,
} from '../commands/action-transaction.commands';
import { ActionTransactionEntity } from '../entities/action-transaction.entity';
import {
  ActionTransactionCompletedEvent,
  ActionTransactionCreatedEvent,
} from '../events/action-transaction.events';
import type { DomainEvent } from '../events/domain-event';
import { ActionTransactionId } from '../value-objects/action-transaction-id.vo';
import { VideoId } from '../value-objects/video-id.vo';

export class ActionTransactionAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _transaction: ActionTransactionEntity;

  constructor(transaction: ActionTransactionEntity) {
    this._transaction = transaction;
  }

  /**
   * Aggregate의 Entity 반환
   */
  getTransaction(): ActionTransactionEntity {
    return this._transaction;
  }

  /**
   * Action Transaction 생성 (Factory Method)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity 생성
   * - Domain Event 발생 (1 Command : 1 Event)
   *
   * @param command - Action Transaction 생성 Command
   * @returns ActionTransactionAggregate
   */
  static createTransaction(
    command: CreateActionTransactionCommand
  ): ActionTransactionAggregate {
    // 1. ActionTransactionId 생성 (UUID)
    const transactionId = ActionTransactionId.generate();

    // 2. Value Objects 생성
    const blockId = new BlockId(command.blockId);
    const videoId = new VideoId(command.videoId);

    // 3. ActionTransactionEntity 생성
    const transaction = ActionTransactionEntity.reconstitute({
      id: transactionId,
      blockId: blockId,
      videoId: videoId,
      actionType: command.actionType,
      createdAt: new Date(),
      completedAt: undefined,
    });

    // 4. ActionTransactionCreatedEvent 생성
    const event = new ActionTransactionCreatedEvent(
      transaction.id.value,
      {
        transactionId: transaction.id.value,
        blockId: transaction.blockId.value,
        videoId: transaction.videoId.value,
        actionType: transaction.actionType,
      },
      new Date()
    );

    // 5. Aggregate 생성 및 이벤트 추가
    const aggregate = new ActionTransactionAggregate(transaction);
    aggregate._uncommittedEvents.push(event);

    return aggregate;
  }

  /**
   * Transaction 완료 (Command Handler)
   *
   * ✅ Event Storming + DDD 패턴:
   * - Command를 입력으로 받음
   * - Entity 상태 변경
   * - Domain Event 발생 (1 Command : 1 Event)
   *
   * @param command - Transaction 완료 Command
   */
  complete(command: CompleteActionTransactionCommand): void {
    // 비즈니스 규칙: 이미 완료된 경우 스킵
    if (this._transaction.isCompleted()) {
      return;
    }

    // Entity 상태 변경
    this._transaction.complete();

    // ActionTransactionCompletedEvent 생성
    const event = new ActionTransactionCompletedEvent(
      this._transaction.id.value,
      {
        transactionId: this._transaction.id.value,
        blockId: this._transaction.blockId.value,
        videoId: this._transaction.videoId.value,
        actionType: this._transaction.actionType,
      },
      new Date()
    );

    this._uncommittedEvents.push(event);
  }

  /**
   * 커밋되지 않은 이벤트들 조회
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  /**
   * 이벤트들을 커밋된 것으로 표시
   */
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  /**
   * Aggregate 재구성 (Repository에서 사용)
   *
   * DB에서 조회한 Entity로부터 Aggregate 재구성
   */
  static reconstitute(
    transaction: ActionTransactionEntity
  ): ActionTransactionAggregate {
    return new ActionTransactionAggregate(transaction);
  }
}
