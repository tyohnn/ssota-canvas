import { adminDb } from '@/db';
import { blockMounts, blocks } from '@/db/schema-dev';
import { eq, isNull, and } from 'drizzle-orm';
import { BlockMountAggregate } from '../../../shared/aggregates/block-mount.aggregate';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import { BlockMount } from '../../../shared/entities/block-mount.entity';
import { Position } from '../../../shared/value-objects/position.vo';
import { Size } from '../../../shared/value-objects/size.vo';
import { ZOrder } from '../../../shared/value-objects/z-order.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { BlockMountRepository } from '../interfaces/block-mount.repository.interface';
import { Block } from '@/domains/block-management/shared/entities/block.entity';
import { BlockType } from '@/domains/block-management/shared/value-objects/block-type.vo';
import { Metadata } from '@/domains/block-management/shared/value-objects/metadata.vo';

export class DrizzleBlockMountRepository implements BlockMountRepository {
  async save(blockMountAggregate: BlockMountAggregate): Promise<void> {
    const blockMount = blockMountAggregate.blockMount;

    try {
      await adminDb
        .insert(blockMounts)
        .values({
          id: blockMount.id.value,
          page_id: blockMount.pageId.value,
          block_id: blockMount.blockId.value,
          position_x: String(blockMount.position.x),
          position_y: String(blockMount.position.y),
          size_width: String(blockMount.size.width),
          size_height: String(blockMount.size.height),
          z_order: blockMount.zOrder.value,
          created_at: blockMount.createdAt,
          updated_at: blockMount.updatedAt,
        })
        .onConflictDoUpdate({
          target: blockMounts.id,
          set: {
            position_x: String(blockMount.position.x),
            position_y: String(blockMount.position.y),
            size_width: String(blockMount.size.width),
            size_height: String(blockMount.size.height),
            z_order: blockMount.zOrder.value,
            updated_at: blockMount.updatedAt,
          },
        });
    } catch (error) {
      console.error(
        '❌ [DrizzleBlockMountRepository.save] Failed to save block mount:',
        error
      );
      throw error;
    }
  }

  async findById(
    blockMountId: BlockMountId
  ): Promise<BlockMountAggregate | null> {
    const result = await adminDb
      .select()
      .from(blockMounts)
      .where(
        and(
          eq(blockMounts.id, blockMountId.value),
          isNull(blockMounts.deleted_at)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return this.toDomain(row);
  }

  async findByPageId(pageId: PageId): Promise<BlockMountAggregate[]> {
    const results = await adminDb
      .select()
      .from(blockMounts)
      .where(
        and(
          eq(blockMounts.page_id, pageId.value),
          isNull(blockMounts.deleted_at)
        )
      );

    return results.map(row => this.toDomain(row));
  }

  async delete(blockMountId: BlockMountId): Promise<void> {
    await adminDb
      .update(blockMounts)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(blockMounts.id, blockMountId.value));
  }

  async findByPageIdWithBlocks(pageId: PageId): Promise<
    Array<{
      blockMount: BlockMountAggregate;
      block: Block;
    }>
  > {
    const results = await adminDb
      .select({
        // BlockMount fields
        blockMountId: blockMounts.id,
        pageId: blockMounts.page_id,
        blockId: blockMounts.block_id,
        positionX: blockMounts.position_x,
        positionY: blockMounts.position_y,
        sizeWidth: blockMounts.size_width,
        sizeHeight: blockMounts.size_height,
        zOrder: blockMounts.z_order,
        blockMountCreatedAt: blockMounts.created_at,
        blockMountUpdatedAt: blockMounts.updated_at,
        blockMountDeletedAt: blockMounts.deleted_at,
        // Block fields
        blockWorkspaceId: blocks.workspace_id,
        blockType: blocks.block_type,
        blockMetadata: blocks.metadata,
        blockCreatedAt: blocks.created_at,
        blockUpdatedAt: blocks.updated_at,
        blockDeletedAt: blocks.deleted_at,
      })
      .from(blockMounts)
      .innerJoin(blocks, eq(blockMounts.block_id, blocks.id))
      .where(
        and(
          eq(blockMounts.page_id, pageId.value),
          isNull(blockMounts.deleted_at),
          isNull(blocks.deleted_at)
        )
      )
      .orderBy(blockMounts.z_order);

    return results.map(row => ({
      blockMount: this.toDomainFromJoin({
        id: row.blockMountId,
        page_id: row.pageId,
        block_id: row.blockId,
        position_x: row.positionX,
        position_y: row.positionY,
        size_width: row.sizeWidth,
        size_height: row.sizeHeight,
        z_order: row.zOrder,
        created_at: row.blockMountCreatedAt,
        updated_at: row.blockMountUpdatedAt,
        deleted_at: row.blockMountDeletedAt,
      }),
      block: this.toBlockDomain({
        id: row.blockId,
        workspace_id: row.blockWorkspaceId,
        block_type: row.blockType,
        metadata: row.blockMetadata,
        created_at: row.blockCreatedAt,
        updated_at: row.blockUpdatedAt,
        deleted_at: row.blockDeletedAt,
      }),
    }));
  }

  private toDomain(row: typeof blockMounts.$inferSelect): BlockMountAggregate {
    const blockMountId = new BlockMountId(row.id);
    const pageId = new PageId(row.page_id);
    const blockId = new BlockId(row.block_id);

    const position = new Position(
      Number(row.position_x),
      Number(row.position_y)
    );
    const size = new Size(Number(row.size_width), Number(row.size_height));
    const zOrder = new ZOrder(row.z_order);

    const blockMount = new BlockMount(
      blockMountId,
      pageId,
      blockId,
      position,
      size,
      zOrder,
      row.created_at,
      row.updated_at
    );

    return new BlockMountAggregate(blockMount);
  }

  private toDomainFromJoin(row: {
    id: string;
    page_id: string;
    block_id: string;
    position_x: string;
    position_y: string;
    size_width: string;
    size_height: string;
    z_order: number;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  }): BlockMountAggregate {
    return this.toDomain({
      id: row.id,
      page_id: row.page_id,
      block_id: row.block_id,
      position_x: row.position_x,
      position_y: row.position_y,
      size_width: row.size_width,
      size_height: row.size_height,
      z_order: row.z_order,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
    });
  }

  private toBlockDomain(row: {
    id: string;
    workspace_id: string;
    block_type: string;
    metadata: any;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  }): Block {
    const blockId = new BlockId(row.id);
    const blockType = new BlockType(row.block_type);
    const metadata = new Metadata(row.metadata || {});

    return Block.reconstitute(
      blockId,
      row.workspace_id,
      blockType,
      metadata,
      row.created_at,
      row.updated_at,
      row.deleted_at
    );
  }
}
