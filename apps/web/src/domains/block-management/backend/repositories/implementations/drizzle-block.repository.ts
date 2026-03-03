import { and, desc, eq, inArray, isNull, lt, or } from 'drizzle-orm';

import { adminDb } from '@/db';
import {
  type Block as DatabaseBlock,
  type Profile as DatabaseProfile,
  blockTypeEnum,
  blocks,
  profiles,
} from '@/db/schema';
import {
  CustomPropertyDefinition,
  PropertyType,
} from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

import { Block } from '../../../shared/entities/block.entity';
import { BlockManagementError } from '../../../shared/errors/block-management.error';
import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockPropertiesFactory } from '../../../shared/value-objects/block-properties';
import { BlockType } from '../../../shared/value-objects/block-type.vo';
import { CustomPropertyDefinitionVO } from '../../../shared/value-objects/custom-property-definition.vo';
import { IBlockRepository } from '../interfaces/block.repository.interface';

// 데이터베이스 스키마에서 추출한 블록 타입 (SSOT)
type DatabaseBlockType = (typeof blockTypeEnum.enumValues)[number];

/** UUID에서 8자 hex slug 생성 (workspace 내 유일 키) */
function slugFromUuid(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase().slice(0, 8);
}

/**
 * DrizzleBlockRepository
 *
 * Drizzle ORM을 사용한 BlockRepository 구현
 */
export class DrizzleBlockRepository implements IBlockRepository {
  /**
   * 블록 생성
   */
  async create(block: Block): Promise<void> {
    let currentId = block.id.value;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // properties.toJSON()과 _extraFields(커스텀 속성 값) 병합
        const propertiesJSON = block.properties.toJSON();
        const extraFields = (block.properties as any)._extraFields || {};
        const fullProperties = {
          ...propertiesJSON,
          ...extraFields,
        };

        // content_raw는 클라이언트에서 이미 생성되어 전달됨 (Command에서 가져옴)
        // 서버에서는 더 이상 변환하지 않음
        const contentRaw: string | null = (block as any).contentRaw || null;

        const blockData = {
          id: currentId,
          slug: slugFromUuid(currentId),
          workspace_id: block.workspaceId.value,
          created_by: block.userId.value,
          block_type: block.blockType.value,
          title: block.title,
          properties: fullProperties,
          custom_properties: block.customProperties.map(vo => vo.toJSON()),
          content: block.content as any, // JSONB content (e.g., TipTap JSON)
          content_raw: contentRaw, // Markdown content for context
          content_version: block.contentVersion,
          created_at: block.createdAt,
          updated_at: block.updatedAt,
          deleted_at: block.deletedAt,
          source_id: block.sourceId,
        };

        await adminDb.insert(blocks).values(blockData);

        return;
      } catch (error) {
        const code = (error as any).code;
        const constraint = (error as any).constraint;
        const isRetryable =
          code === '23505' &&
          (constraint === 'blocks_pkey' ||
            constraint === 'blocks_workspace_id_slug_key');
        if (isRetryable) {
          attempts++;
          if (attempts < maxAttempts) {
            const newId = BlockId.generate().value;
            console.warn(
              `[DrizzleBlockRepository] ID/slug collision (attempt ${attempts}), retrying with new ID: ${newId}`
            );
            currentId = newId;
          } else {
            console.error(
              '❌ [DrizzleBlockRepository] Failed to generate unique ID after multiple attempts'
            );
            throw new BlockManagementError(
              'BLOCK_SAVE_FAILED',
              'Failed to generate unique ID after multiple attempts'
            );
          }
        } else {
          throw new BlockManagementError(
            'BLOCK_SAVE_FAILED',
            `Failed to save block: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }
  }

  /**
   * 여러 블록 일괄 생성 (bulk INSERT)
   * 23505 시 전체 ID 재생성 후 재시도, 실제 반영된 ID 목록 반환 (입력 순서)
   */
  async createMany(blocksList: Block[]): Promise<string[]> {
    if (blocksList.length === 0) return [];

    let values = blocksList.map(block => {
      const propertiesJSON = block.properties.toJSON();
      const extraFields = (block.properties as any)._extraFields || {};
      const fullProperties = { ...propertiesJSON, ...extraFields };
      const contentRaw: string | null = (block as any).contentRaw || null;
      return {
        id: block.id.value,
        slug: slugFromUuid(block.id.value),
        workspace_id: block.workspaceId.value,
        created_by: block.userId.value,
        block_type: block.blockType.value,
        title: block.title,
        properties: fullProperties,
        custom_properties: block.customProperties.map(vo => vo.toJSON()),
        content: block.content as any,
        content_raw: contentRaw,
        content_version: block.contentVersion,
        created_at: block.createdAt,
        updated_at: block.updatedAt,
        deleted_at: block.deletedAt,
      };
    });

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        await adminDb.insert(blocks).values(values);
        return values.map(v => v.id);
      } catch (error) {
        const code = (error as any).code;
        const constraint = (error as any).constraint;
        const isRetryable =
          code === '23505' &&
          (constraint === 'blocks_pkey' ||
            constraint === 'blocks_workspace_id_slug_key');
        if (isRetryable) {
          attempts++;
          if (attempts < maxAttempts) {
            values = values.map(v => {
              const newId = BlockId.generate().value;
              return { ...v, id: newId, slug: slugFromUuid(newId) };
            });
            console.warn(
              `[DrizzleBlockRepository] createMany ID/slug collision (attempt ${attempts}), retrying with new IDs`
            );
          } else {
            throw new BlockManagementError(
              'BLOCK_SAVE_FAILED',
              'Failed to generate unique IDs for blocks after multiple attempts'
            );
          }
        } else {
          throw error;
        }
      }
    }

    return values.map(v => v.id);
  }

  /**
   * 블록 업데이트
   */
  async update(block: Block): Promise<void> {
    try {
      // properties.toJSON()과 _extraFields(커스텀 속성 값) 병합
      const propertiesJSON = block.properties.toJSON();
      const extraFields = (block.properties as any)._extraFields || {};
      const fullProperties = {
        ...propertiesJSON,
        ...extraFields,
      };

      // content_raw는 클라이언트에서 이미 생성되어 전달됨 (Command에서 가져옴)
      // 서버에서는 더 이상 변환하지 않음
      const contentRaw: string | null = (block as any).contentRaw || null;

      const blockData = {
        workspace_id: block.workspaceId.value,
        block_type: block.blockType.value as DatabaseBlockType,
        title: block.title,
        properties: fullProperties,
        custom_properties: block.customProperties.map(vo => vo.toJSON()),
        content: block.content as any, // JSONB content (e.g., TipTap JSON)
        content_raw: contentRaw, // Markdown content for context
        content_version: block.contentVersion,
        created_at: block.createdAt,
        updated_at: block.updatedAt,
        deleted_at: block.deletedAt,
        source_id: block.sourceId,
      };

      await adminDb
        .update(blocks)
        .set(blockData)
        .where(eq(blocks.id, block.id.value));
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_UPDATE_FAILED',
        `Failed to update block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 ID(UUID)로 조회 (내부/레거시 전용, 예: source_job 처리)
   */
  async findById(id: BlockId): Promise<Block | null> {
    try {
      const conditions = [eq(blocks.id, id.value)];
      const result = await adminDb
        .select({
          block: blocks,
          profile: profiles,
        })
        .from(blocks)
        .leftJoin(profiles, eq(blocks.created_by, profiles.id))
        .where(and(...conditions))
        .limit(1);

      if (result.length === 0) return null;
      const row = result[0];
      if (!row) return null;
      return this.mapToBlock(row.block, row.profile);
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_FETCH_FAILED',
        `Failed to fetch block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 워크스페이스 ID + slug로 블록 조회
   */
  async findByWorkspaceIdAndSlug(
    workspaceId: WorkspaceId,
    slug: string,
    includeDeleted: boolean = false
  ): Promise<Block | null> {
    try {
      const conditions = [
        eq(blocks.workspace_id, workspaceId.value),
        eq(blocks.slug, slug),
      ];
      if (!includeDeleted) {
        conditions.push(isNull(blocks.deleted_at));
      }
      const result = await adminDb
        .select({
          block: blocks,
          profile: profiles,
        })
        .from(blocks)
        .leftJoin(profiles, eq(blocks.created_by, profiles.id))
        .where(and(...conditions))
        .limit(1);

      if (result.length === 0) return null;
      const row = result[0];
      if (!row) return null;
      return this.mapToBlock(row.block, row.profile);
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_FETCH_FAILED',
        `Failed to fetch block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 워크스페이스 ID + slug 배열로 블록 조회 (입력 slug 순서대로 반환)
   */
  async findByWorkspaceIdAndSlugs(
    workspaceId: WorkspaceId,
    slugs: string[]
  ): Promise<(Block | null)[]> {
    if (slugs.length === 0) return [];

    const results = await adminDb
      .select({
        block: blocks,
        profile: profiles,
      })
      .from(blocks)
      .leftJoin(profiles, eq(blocks.created_by, profiles.id))
      .where(
        and(
          eq(blocks.workspace_id, workspaceId.value),
          inArray(blocks.slug, slugs),
          isNull(blocks.deleted_at)
        )
      );

    const bySlug = new Map(
      results.map(row => [
        row.block.slug,
        this.mapToBlock(row.block, row.profile),
      ])
    );
    return slugs.map(s => bySlug.get(s) ?? null);
  }

  /**
   * 워크스페이스 ID로 블록 목록 조회
   */
  async findByWorkspaceId(
    workspaceId: string,
    includeDeleted: boolean = false
  ): Promise<Block[]> {
    try {
      const whereConditions = [eq(blocks.workspace_id, workspaceId)];

      if (!includeDeleted) {
        whereConditions.push(isNull(blocks.deleted_at));
      }

      const results = await adminDb
        .select({
          block: blocks,
          profile: profiles,
        })
        .from(blocks)
        .leftJoin(profiles, eq(blocks.created_by, profiles.id))
        .where(and(...whereConditions))
        .orderBy(desc(blocks.created_at));

      return results.map(({ block: blockData, profile }) =>
        this.mapToBlock(blockData, profile)
      );
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_FETCH_FAILED',
        `Failed to fetch blocks by workspace: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 타입으로 블록 목록 조회
   */
  async findByBlockType(
    workspaceId: string,
    blockType: DatabaseBlockType,
    includeDeleted: boolean = false
  ): Promise<Block[]> {
    try {
      const whereConditions = [
        eq(blocks.workspace_id, workspaceId),
        eq(blocks.block_type, blockType), // 타입 단언 (호출자가 검증 책임)
      ];

      if (!includeDeleted) {
        whereConditions.push(isNull(blocks.deleted_at));
      }

      const results = await adminDb
        .select()
        .from(blocks)
        .where(and(...whereConditions))
        .orderBy(desc(blocks.created_at));

      return results.map(blockData => this.mapToBlock(blockData, null));
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_FETCH_FAILED',
        `Failed to fetch blocks by type: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /** Drive 허용 블록 타입 (shape 제외) */
  private static readonly DRIVE_BLOCK_TYPES: DatabaseBlockType[] = [
    'link',
    'audio',
    'markdown',
    'pdf',
    'youtube',
    'image',
    'x',
  ];

  /**
   * 여러 워크스페이스에 속한 블록 목록 조회 (Drive: cursor 기반 무한 스크롤).
   */
  async listByWorkspaceIds(
    workspaceIds: string[],
    options?: {
      limit: number;
      cursor?: string | null;
      typeFilter?: string | null;
    }
  ): Promise<{ items: Block[]; nextCursor: string | null }> {
    const limit = options?.limit ?? 24;
    const cursorId = options?.cursor ?? null;
    const typeFilter = options?.typeFilter ?? null;

    if (workspaceIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    const allowedTypes: readonly DatabaseBlockType[] = typeFilter
      ? DrizzleBlockRepository.DRIVE_BLOCK_TYPES.includes(
          typeFilter as DatabaseBlockType
        )
        ? ([typeFilter] as DatabaseBlockType[])
        : DrizzleBlockRepository.DRIVE_BLOCK_TYPES
      : DrizzleBlockRepository.DRIVE_BLOCK_TYPES;

    try {
      const conditions = [
        inArray(blocks.workspace_id, workspaceIds),
        inArray(blocks.block_type, allowedTypes as DatabaseBlockType[]),
        isNull(blocks.deleted_at),
      ];

      if (cursorId) {
        const cursorRows = await adminDb
          .select({ created_at: blocks.created_at })
          .from(blocks)
          .where(eq(blocks.id, cursorId))
          .limit(1);
        if (cursorRows.length > 0) {
          const cursorCreatedAt = cursorRows[0]!.created_at;
          conditions.push(
            or(
              lt(blocks.created_at, cursorCreatedAt),
              and(
                eq(blocks.created_at, cursorCreatedAt),
                lt(blocks.id, cursorId)
              )
            )!
          );
        }
      }

      const fetchLimit = limit + 1;
      const results = await adminDb
        .select({
          block: blocks,
          profile: profiles,
        })
        .from(blocks)
        .leftJoin(profiles, eq(blocks.created_by, profiles.id))
        .where(and(...conditions))
        .orderBy(desc(blocks.created_at), desc(blocks.id))
        .limit(fetchLimit);

      const items = results.slice(0, limit).map(({ block: blockData, profile }) =>
        this.mapToBlock(blockData, profile)
      );
      const nextCursor =
        results.length > limit ? results[limit - 1]!.block.id : null;

      return { items, nextCursor };
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_FETCH_FAILED',
        `Failed to list blocks by workspace ids: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 삭제 (소프트 삭제)
   */
  async delete(id: BlockId): Promise<void> {
    try {
      await adminDb
        .update(blocks)
        .set({
          deleted_at: new Date(), // 데이터베이스 컬럼명에 맞게 수정
          updated_at: new Date(), // 데이터베이스 컬럼명에 맞게 수정
        })
        .where(eq(blocks.id, id.value));
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_DELETE_FAILED',
        `Failed to delete block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록 영구 삭제
   */
  async hardDelete(id: BlockId): Promise<void> {
    try {
      await adminDb.delete(blocks).where(eq(blocks.id, id.value));
    } catch (error) {
      throw new BlockManagementError(
        'BLOCK_HARD_DELETE_FAILED',
        `Failed to hard delete block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 삭제된 블록 복원 (호출 전 서비스에서 findByWorkspaceIdAndSlug로 존재 여부 확인)
   */
  async restore(blockId: BlockId): Promise<void> {
    if (!blockId) {
      throw new BlockManagementError(
        'INVALID_BLOCK_ID',
        'Block ID cannot be null or undefined'
      );
    }

    try {
      await adminDb
        .update(blocks)
        .set({
          deleted_at: null,
          updated_at: new Date(),
        })
        .where(eq(blocks.id, blockId.value));
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'BLOCK_RESTORE_FAILED',
        `Failed to restore block: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 데이터베이스 결과를 Block Entity로 변환
   */
  private mapToBlock(
    blockData: DatabaseBlock,
    profile: DatabaseProfile | null = null
  ): Block {
    const blockId = new BlockId(blockData.id);
    const workspaceId = new WorkspaceId(blockData.workspace_id);
    const userId = new UserId(
      blockData.created_by || '00000000-0000-0000-0000-000000000000'
    );
    const blockType = new BlockType(blockData.block_type); // 데이터베이스 컬럼명에 맞게 수정
    const customPropertiesVO = Array.isArray(blockData.custom_properties)
      ? blockData.custom_properties
        .map((data: unknown) => {
          // 타입가드: CustomPropertyDefinition의 주요 필드 존재 여부 확인
          const isCustomPropertyDefinition = (
            obj: any
          ): obj is CustomPropertyDefinition => {
            return (
              obj &&
              typeof obj === 'object' &&
              'id' in obj &&
              'name' in obj &&
              'type' in obj &&
              typeof obj.id === 'string' &&
              typeof obj.name === 'string'
            );
          };
          if (isCustomPropertyDefinition(data)) {
            try {
              return CustomPropertyDefinitionVO.fromJSON(data);
            } catch (error) {
              console.warn(
                '[DrizzleBlockRepository] Failed to parse custom property definition:',
                {
                  data,
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                }
              );
              return null; // 파싱 실패 시 null 반환
            }
          } else {
            // 타입 미스매치에 대한 핸들링
            console.warn(
              '[DrizzleBlockRepository] Invalid custom property definition structure:',
              data
            );
            return null; // 잘못된 구조는 null 반환
          }
        })
        .filter((vo): vo is CustomPropertyDefinitionVO => vo !== null) // null 제거
      : [];

    // createdBy를 프로필 정보 객체로 변환
    const createdByProfile = profile
      ? {
        userId: profile.id,
        email: profile.email,
        name: profile.name,
        profileImageUrl: profile.avatar_url,
      }
      : {
        userId:
          blockData.created_by || '00000000-0000-0000-0000-000000000000',
        email: null,
        name: null,
        profileImageUrl: null,
      };

    // JSON 데이터를 BlockPropertiesVO로 변환
    const properties = blockData.properties || {};
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

    return Block.reconstitute(
      blockId,
      workspaceId,
      userId,
      blockType,
      blockData.title,
      propertiesVO,
      customPropertiesVO,
      blockData.created_at,
      blockData.updated_at,
      blockData.deleted_at,
      blockData.content, // JSONB content
      createdByProfile,
      blockData.source_id ?? null,
      blockData.content_version ?? 0,
      blockData.slug
    );
  }
}
