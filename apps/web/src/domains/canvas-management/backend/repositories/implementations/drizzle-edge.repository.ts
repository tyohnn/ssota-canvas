import { EdgeRepository } from '../interfaces/edge.repository.interface';
import { EdgeAggregate } from '../../../shared/aggregates/edge.aggregate';
import { Edge } from '../../../shared/entities/edge.entity';
import { EdgeId } from '../../../shared/value-objects/edge-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { adminDb } from '@/db';
import { edges } from '@/db/schema-dev';
import { eq, and, or, inArray } from 'drizzle-orm';

/**
 * DrizzleEdgeRepository
 * Drizzle ORM을 사용한 EdgeRepository 구현
 */
export class DrizzleEdgeRepository implements EdgeRepository {
  /**
   * Edge 저장 (생성 또는 업데이트)
   */
  async save(edgeAggregate: EdgeAggregate): Promise<void> {
    const edge = edgeAggregate.edge;

    await adminDb
      .insert(edges)
      .values({
        id: edge.id.value,
        page_id: edge.pageId.value,
        source_block_id: edge.sourceBlockId.value,
        target_block_id: edge.targetBlockId.value,
        edge_type: edge.edgeType as any,
        edge_label: edge.edgeLabel,
        edge_style_color: edge.edgeStyle.color,
        edge_style_thickness: edge.edgeStyle.thickness,
        created_at: edge.createdAt,
        updated_at: edge.updatedAt,
      })
      .onConflictDoUpdate({
        target: edges.id,
        set: {
          edge_type: edge.edgeType as any,
          edge_label: edge.edgeLabel,
          edge_style_color: edge.edgeStyle.color,
          edge_style_thickness: edge.edgeStyle.thickness,
          updated_at: edge.updatedAt,
        },
      });
  }

  /**
   * ID로 Edge 조회
   */
  async findById(edgeId: EdgeId): Promise<EdgeAggregate | null> {
    const result = await adminDb
      .select()
      .from(edges)
      .where(eq(edges.id, edgeId.value))
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
      .where(eq(edges.page_id, pageId.value));

    return result.map(row => this.toDomain(row));
  }

  /**
   * 연결된 블럭 ID로 Edge 조회
   */
  async findByConnectedBlockId(blockId: BlockId): Promise<EdgeAggregate[]> {
    const result = await adminDb
      .select()
      .from(edges)
      .where(
        or(
          eq(edges.source_block_id, blockId.value),
          eq(edges.target_block_id, blockId.value)
        )
      );

    return result.map(row => this.toDomain(row));
  }

  /**
   * Edge 삭제
   */
  async delete(edgeId: EdgeId): Promise<void> {
    await adminDb.delete(edges).where(eq(edges.id, edgeId.value));
  }

  /**
   * 여러 Edge 일괄 삭제
   */
  async deleteAll(edgeIds: EdgeId[]): Promise<void> {
    if (edgeIds.length === 0) return;

    const idValues = edgeIds.map(id => id.value);
    await adminDb.delete(edges).where(inArray(edges.id, idValues));
  }

  /**
   * DB Row → Domain Model 변환
   */
  private toDomain(row: typeof edges.$inferSelect): EdgeAggregate {
    const edge = new Edge(
      new EdgeId(row.id),
      new PageId(row.page_id),
      new BlockId(row.source_block_id),
      new BlockId(row.target_block_id),
      row.edge_type,
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
