import { and, eq, inArray, isNull, or } from 'drizzle-orm';

import { adminDb } from '@/db';
import { type CanvasEdgeShape, edges } from '@/db/schema';
import { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import { Edge } from '@/domains/canvas-management/shared/entities/edge.entity';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { EdgeHandle } from '@/domains/canvas-management/shared/value-objects/edge-handle.vo';
import { EdgeId } from '@/domains/canvas-management/shared/value-objects/edge-id.vo';
import { EdgeShape } from '@/domains/canvas-management/shared/value-objects/edge-shape.vo';
import { EdgeStyle } from '@/domains/canvas-management/shared/value-objects/edge-style.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

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
          source_handle: edge.sourceHandle.value,
          target_handle: edge.targetHandle.value,
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
          source_handle: edge.sourceHandle.value,
          target_handle: edge.targetHandle.value,
          edge_shape: edge.edgeShape.value as CanvasEdgeShape,
          edge_label: edge.edgeLabel,
          edge_style_color: edge.edgeStyle.color,
          edge_style_thickness: edge.edgeStyle.thickness,
          updated_at: edge.updatedAt,
          deleted_at: null,
        })
        .where(eq(edges.id, edge.id.value));
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
    const edge = Edge.reconstitute({
      id: new EdgeId(row.id),
      pageId: new PageId(row.page_id),
      sourceBlockMountId: new BlockMountId(row.source_block_mount_id),
      targetBlockMountId: new BlockMountId(row.target_block_mount_id),
      sourceHandle: EdgeHandle.fromString(row.source_handle),
      targetHandle: EdgeHandle.fromString(row.target_handle),
      edgeShape: new EdgeShape(row.edge_shape),
      edgeLabel: row.edge_label || '',
      edgeStyle: EdgeStyle.fromObject({
        color: row.edge_style_color || '#9ca3af',
        thickness: row.edge_style_thickness || 2,
      }),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });

    return new EdgeAggregate(edge);
  }
}
