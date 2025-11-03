import { EdgeRepository } from '../interfaces/edge.repository.interface';
import { EdgeAggregate } from '../../../shared/aggregates/edge.aggregate';
import { Edge } from '../../../shared/entities/edge.entity';
import { EdgeId } from '../../../shared/value-objects/edge-id.vo';
import { EdgeShape } from '../../../shared/value-objects/edge-shape.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import { adminDb } from '@/db';
import { edges, type CanvasEdgeShape } from '@/db/schema-dev';
import { eq, and, or, inArray, isNull } from 'drizzle-orm';

/**
 * DrizzleEdgeRepository
 * Drizzle ORM을 사용한 EdgeRepository 구현
 *
 * ⚠️ Schema Change: edges now reference block_mounts instead of blocks
 */
export class DrizzleEdgeRepository implements EdgeRepository {
  /**
   * Edge 생성
   */
  async create(edgeAggregate: EdgeAggregate): Promise<void> {
    const edge = edgeAggregate.edge;
    let currentId = edge.id.value;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        await adminDb.insert(edges).values({
          id: currentId,
          page_id: edge.pageId.value,
          source_block_mount_id: edge.sourceBlockMountId.value,
          target_block_mount_id: edge.targetBlockMountId.value,
          source_handle: edge.sourceHandle || null,
          target_handle: edge.targetHandle || null,
          edge_shape: edge.edgeShape.value as CanvasEdgeShape,
          edge_label: edge.edgeLabel,
          edge_style_color: edge.edgeStyle.color,
          edge_style_thickness: edge.edgeStyle.thickness,
          created_at: edge.createdAt,
          updated_at: edge.updatedAt,
          deleted_at: null,
        });

        // 성공 시 종료
        return;
      } catch (error) {
        // UUID 충돌인지 확인 (PostgreSQL unique constraint violation)
        if (
          (error as any).code === '23505' &&
          (error as any).constraint === 'edges_pkey'
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            // 새로운 ID 생성
            const newId = EdgeId.generate().value;
            console.warn(
              `[DrizzleEdgeRepository] ID collision detected (attempt ${attempts}), retrying with new ID: ${newId}`
            );
            currentId = newId;
          } else {
            console.error(
              '❌ [DrizzleEdgeRepository] Failed to generate unique ID after multiple attempts'
            );
            throw new Error(
              'Failed to generate unique ID after multiple attempts'
            );
          }
        } else {
          console.error(
            '❌ [DrizzleEdgeRepository.create] Failed to create edge:',
            error
          );
          throw error;
        }
      }
    }
  }

  /**
   * Edge 업데이트
   */
  async update(edgeAggregate: EdgeAggregate): Promise<void> {
    const edge = edgeAggregate.edge;

    try {
      await adminDb
        .update(edges)
        .set({
          page_id: edge.pageId.value,
          source_block_mount_id: edge.sourceBlockMountId.value,
          target_block_mount_id: edge.targetBlockMountId.value,
          source_handle: edge.sourceHandle || null,
          target_handle: edge.targetHandle || null,
          edge_shape: edge.edgeShape.value as CanvasEdgeShape,
          edge_label: edge.edgeLabel,
          edge_style_color: edge.edgeStyle.color,
          edge_style_thickness: edge.edgeStyle.thickness,
          updated_at: edge.updatedAt,
          deleted_at: null,
        })
        .where(eq(edges.id, edge.id.value));

      console.log('[DrizzleEdgeRepository] Edge updated successfully');
    } catch (error) {
      console.error(
        '❌ [DrizzleEdgeRepository.update] Failed to update edge:',
        error
      );
      throw new Error(
        `Failed to update edge: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * ID로 Edge 조회
   */
  async findById(edgeId: EdgeId): Promise<EdgeAggregate | null> {
    const result = await adminDb
      .select()
      .from(edges)
      .where(and(eq(edges.id, edgeId.value), isNull(edges.deleted_at)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]!);
  }

  /**
   * 페이지 ID로 모든 Edge 조회
   */
  async findByPageId(pageId: PageId): Promise<EdgeAggregate[]> {
    const result = await adminDb
      .select()
      .from(edges)
      .where(and(eq(edges.page_id, pageId.value), isNull(edges.deleted_at)));

    return result.map(row => this.toDomain(row));
  }

  /**
   * 연결된 블럭 마운트 ID로 Edge 조회
   */
  async findByConnectedBlockMountId(
    blockMountId: BlockMountId
  ): Promise<EdgeAggregate[]> {
    const result = await adminDb
      .select()
      .from(edges)
      .where(
        and(
          or(
            eq(edges.source_block_mount_id, blockMountId.value),
            eq(edges.target_block_mount_id, blockMountId.value)
          ),
          isNull(edges.deleted_at)
        )
      );

    return result.map(row => this.toDomain(row));
  }

  /**
   * Edge 삭제 (소프트 삭제)
   */
  async delete(edgeId: EdgeId): Promise<void> {
    await adminDb
      .update(edges)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(edges.id, edgeId.value));
  }

  /**
   * 여러 Edge 일괄 삭제 (소프트 삭제)
   */
  async deleteAll(edgeIds: EdgeId[]): Promise<void> {
    if (edgeIds.length === 0) return;

    const idValues = edgeIds.map(id => id.value);
    await adminDb
      .update(edges)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(inArray(edges.id, idValues));
  }

  /**
   * DB Row → Domain Model 변환
   */
  private toDomain(row: typeof edges.$inferSelect): EdgeAggregate {
    const edge = new Edge(
      new EdgeId(row.id),
      new PageId(row.page_id),
      new BlockMountId(row.source_block_mount_id),
      new BlockMountId(row.target_block_mount_id),
      row.source_handle || undefined,
      row.target_handle || undefined,
      new EdgeShape(row.edge_shape),
      row.edge_label || '',
      {
        color: row.edge_style_color || '#000000',
        thickness: row.edge_style_thickness || 2,
      },
      row.created_at,
      row.updated_at
    );

    return new EdgeAggregate(edge);
  }
}
