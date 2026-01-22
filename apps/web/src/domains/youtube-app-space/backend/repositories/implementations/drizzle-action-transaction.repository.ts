/**
 * Drizzle Action Transaction Repository Implementation
 *
 * Infrastructure Layer: Drizzle ORM을 사용한 Action Transaction 데이터 액세스 구현
 */
import { and, desc, eq } from 'drizzle-orm';

import { adminDb } from '@/db';
import { actionTransactions } from '@/db/schemas/youtube-app-space-schema';

import { ActionTransactionAggregate } from '../../../shared/aggregates/action-transaction.aggregate';
import { ActionTransactionEntity, type ActionType } from '../../../shared/entities/action-transaction.entity';
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

        // completed_at은 명시적으로 null을 전달 (undefined일 때)
        // Drizzle이 필드를 생략하면 default를 사용하려고 하는데, 스키마에 default가 없어서 에러 발생
        await adminDb.insert(actionTransactions).values({
          id: transaction.id.value,
          org_id: transaction.orgId,
          video_id: transaction.videoId.value,
          action_type: transaction.actionType,
          language: transaction.language ?? null,
          created_at: transaction.createdAt,
          completed_at: transaction.completedAt ?? null, // undefined일 때 명시적으로 null 전달
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
              orgId: transaction.orgId,
              videoId: transaction.videoId,
              actionType: transaction.actionType,
              language: transaction.language,
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
    const entity = this.toDomain(found);
    return ActionTransactionAggregate.reconstitute(entity);
  }

  /**
   * Org ID와 Video ID, Action Type으로 Aggregate 조회
   *
   * 가장 최근에 생성된 transaction을 반환 (created_at DESC)
   * language가 null인 경우 (extract_script 등) 사용
   */
  async findByOrgAndVideo(
    orgId: string,
    videoId: string,
    actionType: Exclude<ActionType, 'extract_summary'>
  ): Promise<ActionTransactionAggregate | null> {
    const [found] = await adminDb
      .select()
      .from(actionTransactions)
      .where(
        and(
          eq(actionTransactions.org_id, orgId),
          eq(actionTransactions.video_id, videoId),
          eq(actionTransactions.action_type, actionType)
        )
      )
      .orderBy(desc(actionTransactions.created_at))
      .limit(1);

    if (!found) {
      return null;
    }

    // Drizzle Row → Entity → Aggregate 변환
    const entity = this.toDomain(found);
    return ActionTransactionAggregate.reconstitute(entity);
  }

  /**
   * Org ID, Video ID, Action Type, Language로 Aggregate 조회
   *
   * 언어별 트랜잭션 조회 (extract_summary, smart_summary 등 language가 필요한 액션 타입)
   * 
   * Note: 현재는 extract_summary만 사용하지만, 향후 다른 액션 타입도 language가 필요할 수 있음
   */
  async findByOrgVideoAndLanguage(
    orgId: string,
    videoId: string,
    actionType: ActionType,
    language: string
  ): Promise<ActionTransactionAggregate | null> {
    const [found] = await adminDb
      .select()
      .from(actionTransactions)
      .where(
        and(
          eq(actionTransactions.org_id, orgId),
          eq(actionTransactions.video_id, videoId),
          eq(actionTransactions.action_type, actionType),
          eq(actionTransactions.language, language)
        )
      )
      .orderBy(desc(actionTransactions.created_at))
      .limit(1);

    if (!found) {
      return null;
    }

    // Drizzle Row → Entity → Aggregate 변환
    const entity = this.toDomain(found);
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
   * Org ID, Video ID로 Summary 타입의 모든 언어 목록 조회
   *
   * extract_summary 액션의 경우 여러 언어로 추출할 수 있으므로,
   * 해당 org + video의 모든 summary 언어 목록을 반환합니다.
   */
  async findAllLanguagesByOrgAndVideoOfSummaryType(
    orgId: string,
    videoId: string
  ): Promise<string[]> {
    const results = await adminDb
      .select({
        language: actionTransactions.language,
      })
      .from(actionTransactions)
      .where(
        and(
          eq(actionTransactions.org_id, orgId),
          eq(actionTransactions.video_id, videoId),
          eq(actionTransactions.action_type, 'extract_summary')
        )
      );

    // 언어 목록 추출 (중복 제거, null 제거, 정렬)
    const languages = Array.from(
      new Set(
        results
          .map(row => row.language)
          .filter((lang): lang is string => lang !== null)
      )
    ).sort();

    return languages;
  }

  /**
   * Drizzle Row → Domain 변환
   */
  private toDomain(
    row: typeof actionTransactions.$inferSelect
  ): ActionTransactionEntity {
    return ActionTransactionEntity.reconstitute({
      id: new ActionTransactionId(row.id),
      orgId: row.org_id,
      videoId: new VideoId(row.video_id),
      actionType: row.action_type as 'extract_script' | 'extract_summary' | 'smart_summary',
      language: row.language ?? undefined,
      createdAt: row.created_at,
      completedAt: row.completed_at ?? undefined,
    });
  }
}
