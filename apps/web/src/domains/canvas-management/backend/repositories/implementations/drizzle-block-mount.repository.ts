import { adminDb } from '@/db';
import { blockMounts, blocks, profiles } from '@/db/schema';
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
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { Block } from '@/domains/block-management/shared/entities/block.entity';
import { BlockType } from '@/domains/block-management/shared/value-objects/block-type.vo';
import { BlockPropertiesFactory } from '@/domains/block-management/shared/value-objects/block-properties';
import { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { CustomPropertyDefinitionVO } from '@/domains/block-management/shared/value-objects/custom-property-definition.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

export class DrizzleBlockMountRepository implements BlockMountRepository {
  /**
   * BlockMount 생성
   */
  async create(blockMount: BlockMount): Promise<void> {
    let currentId = blockMount.id.value;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        await adminDb.insert(blockMounts).values({
          id: currentId,
          page_id: blockMount.pageId.value,
          block_id: blockMount.blockId.value,
          position_x: String(blockMount.position.x),
          position_y: String(blockMount.position.y),
          size_width: String(blockMount.size.width),
          size_height: String(blockMount.size.height),
          z_order: blockMount.zOrder.value,
          created_at: blockMount.createdAt,
          updated_at: blockMount.updatedAt,
        });

        // 성공 시 종료
        return;
      } catch (error) {
        // UUID 충돌인지 확인 (PostgreSQL unique constraint violation)
        if (
          (error as any).code === '23505' &&
          (error as any).constraint === 'block_mounts_pkey'
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            // 새로운 ID 생성
            const newId = BlockId.generate().value;
            console.warn(
              `[DrizzleBlockMountRepository] ID collision detected (attempt ${attempts}), retrying with new ID: ${newId}`
            );
            currentId = newId;
          } else {
            console.error(
              '❌ [DrizzleBlockMountRepository] Failed to generate unique ID after multiple attempts'
            );
            throw new Error(
              'Failed to generate unique ID after multiple attempts'
            );
          }
        } else {
          console.error(
            '❌ [DrizzleBlockMountRepository.create] Failed to create block mount:',
            error
          );
          throw error;
        }
      }
    }
  }

  /**
   * BlockMount 업데이트
   */
  async update(blockMount: BlockMount): Promise<void> {
    try {
      await adminDb
        .update(blockMounts)
        .set({
          page_id: blockMount.pageId.value,
          block_id: blockMount.blockId.value,
          position_x: String(blockMount.position.x),
          position_y: String(blockMount.position.y),
          size_width: String(blockMount.size.width),
          size_height: String(blockMount.size.height),
          z_order: blockMount.zOrder.value,
          updated_at: blockMount.updatedAt,
        })
        .where(eq(blockMounts.id, blockMount.id.value));
    } catch (error) {
      throw new Error(
        `Failed to update block mount: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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

  async softDelete(blockMountId: BlockMountId): Promise<void> {
    await adminDb
      .update(blockMounts)
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where(eq(blockMounts.id, blockMountId.value));
  }

  async findByPageIdWithBlocks(pageId: PageId): Promise<
    Array<{
      blockMountAggregate: BlockMountAggregate;
      blockAggregate: BlockAggregate;
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
        blockTitle: blocks.title,
        blockProperties: blocks.properties,
        blockCustomProperties: blocks.custom_properties,
        blockContent: blocks.content, // JSONB content
        blockCreatedBy: blocks.created_by,
        blockCreatedAt: blocks.created_at,
        blockUpdatedAt: blocks.updated_at,
        blockDeletedAt: blocks.deleted_at,
        // Profile fields
        profileId: profiles.id,
        profileName: profiles.name,
        profileEmail: profiles.email,
        profileAvatarUrl: profiles.avatar_url,
      })
      .from(blockMounts)
      .innerJoin(blocks, eq(blockMounts.block_id, blocks.id))
      .leftJoin(profiles, eq(blocks.created_by, profiles.id))
      .where(
        and(
          eq(blockMounts.page_id, pageId.value),
          isNull(blockMounts.deleted_at),
          isNull(blocks.deleted_at)
        )
      )
      .orderBy(blockMounts.z_order);

    return results.map(row => ({
      blockMountAggregate: this.toDomainFromJoin({
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
      blockAggregate: this.toBlockDomain({
        id: row.blockId,
        workspace_id: row.blockWorkspaceId,
        block_type: row.blockType,
        title: row.blockTitle,
        properties: row.blockProperties as Record<string, any>,
        custom_properties:
          row.blockCustomProperties as CustomPropertyDefinition[],
        content: row.blockContent, // JSONB content
        created_by: row.blockCreatedBy || undefined,
        created_at: row.blockCreatedAt,
        updated_at: row.blockUpdatedAt,
        deleted_at: row.blockDeletedAt,
        // Profile information
        profileId: row.profileId || undefined,
        profileName: row.profileName || undefined,
        profileEmail: row.profileEmail || undefined,
        profileAvatarUrl: row.profileAvatarUrl || undefined,
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
    title?: string;
    properties: Record<string, any>;
    custom_properties: CustomPropertyDefinition[];
    content?: unknown; // JSONB content
    created_by?: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    // Profile information
    profileId?: string;
    profileName?: string;
    profileEmail?: string;
    profileAvatarUrl?: string;
  }): BlockAggregate {
    const blockId = new BlockId(row.id);
    const workspaceId = new WorkspaceId(row.workspace_id);
    const userId = new UserId(row.created_by || 'unknown');
    const blockType = new BlockType(row.block_type);

    // properties를 BlockPropertiesVO로 변환
    const properties = row.properties || {};
    const propertiesVO = BlockPropertiesFactory.createFromJSON(
      blockType,
      properties
    );

    // 커스텀 속성 값들을 _extraFields에 설정
    // known fields (toJSON()의 결과)를 제외한 나머지가 커스텀 속성 값
    const knownFields = propertiesVO.toJSON();
    const knownFieldKeys = new Set(Object.keys(knownFields));
    const extraFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (!knownFieldKeys.has(key)) {
        extraFields[key] = value;
      }
    }
    // _extraFields에 커스텀 속성 값 설정
    if (Object.keys(extraFields).length > 0) {
      (propertiesVO as any)._extraFields = extraFields;
    }

    // customProperties를 CustomPropertyDefinitionVO로 변환
    const customPropertiesVO = Array.isArray(row.custom_properties)
      ? row.custom_properties.map(cp => CustomPropertyDefinitionVO.fromJSON(cp))
      : [];

    // createdByProfile 구성
    const createdByProfile = row.profileId
      ? {
          userId: row.profileId,
          email: row.profileEmail || null,
          name: row.profileName || null,
          profileImageUrl: row.profileAvatarUrl || null,
        }
      : undefined;

    // Block 엔티티 재구성 (기존 데이터를 복원)
    const blockEntity = Block.reconstitute(
      blockId,
      workspaceId,
      userId,
      blockType,
      row.title || 'Block',
      propertiesVO,
      customPropertiesVO,
      row.created_at,
      row.updated_at,
      row.deleted_at,
      row.content, // JSONB content
      createdByProfile
    );

    // BlockAggregate 재구성
    return BlockAggregate.reconstitute(blockEntity);
  }
}
