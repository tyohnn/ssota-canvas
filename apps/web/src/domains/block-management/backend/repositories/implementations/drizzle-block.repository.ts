import { eq, and, isNull } from 'drizzle-orm';
import { adminDb } from '@/db';
import { blocks } from '@/db/schema-dev';
import type { Block as DBBlock } from '@/db/schema-dev';
import { BlockRepository } from '../interfaces/block.repository.interface';
import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockType } from '../../../shared/value-objects/block-type.vo';
import { Metadata } from '../../../shared/value-objects/metadata.vo';
import { Block } from '../../../shared/entities/block.entity';

/**
 * Drizzle ORM 기반 Block Repository 구현체
 *
 * PostgreSQL + Drizzle ORM을 사용한 Block 영속성 관리
 * RLS(Row Level Security) 정책이 자동으로 적용됨
 */
export class DrizzleBlockRepository implements BlockRepository {
  /**
   * Block 저장 (생성 또는 업데이트)
   *
   * ⚠️ 주의: Service Layer에서 권한 체크 완료 후에만 호출!
   * 사용 시나리오:
   * - Block 생성: 워크스페이스 멤버십 확인 후
   * - Block 수정: 워크스페이스 멤버십 확인 후
   */
  async save(block: Block): Promise<void> {
    // Check if block exists
    const existing = await adminDb
      .select()
      .from(blocks)
      .where(eq(blocks.id, block.id.value))
      .limit(1);

    if (existing.length > 0) {
      // Update: Admin DB 사용 (Service에서 권한 확인 후)
      await adminDb
        .update(blocks)
        .set({
          block_type: block.blockType.value,
          metadata: block.metadata.value,
          updated_at: block.updatedAt,
          deleted_at: block.deletedAt,
        })
        .where(eq(blocks.id, block.id.value));
    } else {
      // Insert: Admin DB 사용 (Service에서 권한 확인 후)
      await adminDb.insert(blocks).values({
        id: block.id.value,
        workspace_id: block.workspaceId,
        block_type: block.blockType.value,
        metadata: block.metadata.value || {},
        created_at: block.createdAt,
        updated_at: block.updatedAt,
        deleted_at: block.deletedAt || null,
      });
    }
  }

  /**
   * ID로 Block 조회
   *
   * ⚠️ 주의: 소프트 삭제된 블록은 조회되지 않음
   *
   * @param id - Block ID
   * @returns Block 또는 null
   */
  async findById(id: BlockId): Promise<Block | null> {
    const result = await adminDb
      .select()
      .from(blocks)
      .where(and(eq(blocks.id, id.value), isNull(blocks.deleted_at)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return this.toDomain(row);
  }

  /**
   * 워크스페이스의 모든 Block 조회
   *
   * ⚠️ 주의: Service Layer에서 워크스페이스 멤버십 확인 후에만 호출!
   * ⚠️ 주의: 소프트 삭제된 블록은 조회되지 않음
   *
   * @param workspaceId - 워크스페이스 ID
   * @returns Block 배열
   */
  async findByWorkspaceId(workspaceId: string): Promise<Block[]> {
    const result = await adminDb
      .select()
      .from(blocks)
      .where(
        and(eq(blocks.workspace_id, workspaceId), isNull(blocks.deleted_at))
      );

    return result.map(row => this.toDomain(row));
  }

  /**
   * Block 소프트 삭제
   *
   * ⚠️ 주의: 물리적 삭제가 아닌 deleted_at 타임스탬프 설정
   *
   * @param id - Block ID
   */
  async delete(id: BlockId): Promise<void> {
    await adminDb
      .update(blocks)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(blocks.id, id.value));
  }

  /**
   * 워크스페이스별 활성 블록 목록 조회 (페이징 지원)
   *
   * @param workspaceId - 워크스페이스 ID
   * @param page - 페이지 번호 (기본값: 1)
   * @param limit - 페이지당 항목 수 (기본값: 50)
   * @returns Block 배열
   */
  async listBlocksByWorkspace(
    workspaceId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<Block[]> {
    const offset = (page - 1) * limit;

    const result = await adminDb
      .select()
      .from(blocks)
      .where(
        and(eq(blocks.workspace_id, workspaceId), isNull(blocks.deleted_at))
      )
      .limit(limit)
      .offset(offset);

    return result.map(row => this.toDomain(row));
  }

  /**
   * DB 모델을 도메인 모델로 변환
   *
   * @param row - DB Row
   * @returns 도메인 모델
   */
  private toDomain(row: typeof blocks.$inferSelect): Block {
    return Block.reconstitute(
      new BlockId(row.id),
      row.workspace_id,
      new BlockType(row.block_type),
      new Metadata(row.metadata as Record<string, any> | null),
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }
}
