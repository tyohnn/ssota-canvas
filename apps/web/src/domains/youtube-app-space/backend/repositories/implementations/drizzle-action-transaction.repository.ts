/**
 * Drizzle Action Transaction Repository Implementation
 *
 * Infrastructure Layer: Drizzle ORM을 사용한 Action Transaction 데이터 액세스 구현
 */
import { and, desc, eq } from 'drizzle-orm';

import { adminDb } from '@/db';
import { actionTransactions } from '@/db/schemas/youtube-app-space-schema';

import { BlockId } from '../../../../block-management/shared/value-objects/block-id.vo';
import { ActionTransactionAggregate } from '../../../shared/aggregates/action-transaction.aggregate';
import { ActionTransactionEntity } from '../../../shared/entities/action-transaction.entity';
import { ActionTransactionId } from '../../../shared/value-objects/action-transaction-id.vo';
import { VideoId } from '../../../shared/value-objects/video-id.vo';
import type { IActionTransactionRepository } from '../interfaces/action-transaction.repository.interface';

/**
 * Drizzle Action Transaction Repository
 *
 * Drizzle ORM을 사용하여 Action Transaction 데이터를 관리
 * edge 패턴: Aggregate로 주고받음
 */
export class DrizzleActionTransactionRepository implements IActionTransactionRepository {
  /**
   * Action Transaction 생성
   *
   * UUID 충돌 시 자동 재시도 (최대 3번)
   */
  async create(aggregate: ActionTransactionAggregate): Promise<void> {
    let currentAggregate = aggregate;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const transaction = currentAggregate.getTransaction();

        await adminDb.insert(actionTransactions).values({
          id: transaction.id.value,
          block_id: transaction.blockId.value,
          video_id: transaction.videoId.value,
          action_type: transaction.actionType,
          created_at: transaction.createdAt,
          completed_at: transaction.completedAt ?? null,
        });

        // 성공 시 종료
        return;
      } catch (error) {
        // UUID 충돌인지 확인 (PostgreSQL unique constraint violation)
        if (
          (error as any).code === '23505' &&
          (error as any).constraint === 'action_transactions_pkey'
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            // 새로운 ID로 Entity 재구성 및 Aggregate 재생성
            const transaction = currentAggregate.getTransaction();
            const newId = ActionTransactionId.generate();
            console.warn(
              `[DrizzleActionTransactionRepository] ID collision detected (attempt ${attempts}), retrying with new ID: ${newId.value}`
            );

            // Entity 재구성 (새 ID로)
            const newEntity = ActionTransactionEntity.reconstitute({
              id: newId,
              blockId: transaction.blockId,
              videoId: transaction.videoId,
              actionType: transaction.actionType,
              createdAt: transaction.createdAt,
              completedAt: transaction.completedAt,
            });

            // Aggregate 재구성
            // Note: 이벤트는 Service Layer에서 처리되므로 Repository에서는 재구성만 수행
            const newAggregate =
              ActionTransactionAggregate.reconstitute(newEntity);
            currentAggregate = newAggregate;
          } else {
            console.error(
              '❌ [DrizzleActionTransactionRepository] Failed to generate unique ID after multiple attempts'
            );
            throw new Error(
              'Failed to generate unique ID after multiple attempts'
            );
          }
        } else {
          console.error(
            '❌ [DrizzleActionTransactionRepository.create] Failed to create action transaction:',
            error
          );
          throw error;
        }
      }
    }
  }

  /**
   * ID로 Aggregate 조회
   */
  async findById(id: string): Promise<ActionTransactionAggregate | null> {
    const [found] = await adminDb
      .select()
      .from(actionTransactions)
      .where(eq(actionTransactions.id, id))
      .limit(1);

    if (!found) {
      return null;
    }

    // Drizzle Row → Entity → Aggregate 변환
    const entity = this.toEntity(found);
    return ActionTransactionAggregate.reconstitute(entity);
  }

  /**
   * Block ID와 Action Type으로 Aggregate 조회
   *
   * 가장 최근에 생성된 transaction을 반환 (created_at DESC)
   */
  async findByBlockIdAndActionType(
    blockId: string,
    actionType: 'extract_script' | 'smart_summary'
  ): Promise<ActionTransactionAggregate | null> {
    const [found] = await adminDb
      .select()
      .from(actionTransactions)
      .where(
        and(
          eq(actionTransactions.block_id, blockId),
          eq(actionTransactions.action_type, actionType)
        )
      )
      .orderBy(desc(actionTransactions.created_at))
      .limit(1);

    if (!found) {
      return null;
    }

    // Drizzle Row → Entity → Aggregate 변환
    const entity = this.toEntity(found);
    return ActionTransactionAggregate.reconstitute(entity);
  }

  /**
   * Aggregate 업데이트
   */
  async update(aggregate: ActionTransactionAggregate): Promise<void> {
    const transaction = aggregate.getTransaction();

    await adminDb
      .update(actionTransactions)
      .set({
        completed_at: transaction.completedAt ?? null,
      })
      .where(eq(actionTransactions.id, transaction.id.value));
  }

  /**
   * Drizzle Row → Entity 변환
   */
  private toEntity(
    row: typeof actionTransactions.$inferSelect
  ): ActionTransactionEntity {
    return ActionTransactionEntity.reconstitute({
      id: new ActionTransactionId(row.id),
      blockId: new BlockId(row.block_id),
      videoId: new VideoId(row.video_id),
      actionType: row.action_type as 'extract_script' | 'smart_summary',
      createdAt: row.created_at,
      completedAt: row.completed_at ?? undefined,
    });
  }
}
