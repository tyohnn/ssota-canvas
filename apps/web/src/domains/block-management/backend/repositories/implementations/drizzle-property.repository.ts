import { eq, and, isNull } from 'drizzle-orm';
import { adminDb } from '@/db';
import { blocks } from '@/db/schema-dev';
import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockManagementError } from '../../../shared/errors/block-management.error';
import type { CustomPropertyDefinition } from '../../../shared/types';
import type { PropertyRepository } from '../interfaces/property.repository.interface';

/**
 * DrizzlePropertyRepository
 *
 * Drizzle ORM을 사용한 Custom Property 관리 구현
 */
export class DrizzlePropertyRepository implements PropertyRepository {
  /**
   * 커스텀 속성 정의 생성
   */
  async createCustomPropertyDefinition(
    blockId: string,
    data: {
      workspaceId: string;
      name: string;
      propertyType: string;
      options?: Array<{
        id: string;
        label: string;
        color?: string;
        order: number;
      }>;
    }
  ): Promise<CustomPropertyDefinition> {
    try {
      // Get the block to update its custom_properties
      const [block] = await adminDb
        .select()
        .from(blocks)
        .where(eq(blocks.id, blockId))
        .limit(1);

      if (!block) {
        throw new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found');
      }

      const newProperty: CustomPropertyDefinition = {
        id: crypto.randomUUID(),
        workspaceId: data.workspaceId,
        name: data.name,
        propertyType: data.propertyType as any,
        options: data.options || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update the block's custom_properties array
      const currentCustomProperties = (block.custom_properties as any[]) || [];
      const updatedCustomProperties = [...currentCustomProperties, newProperty];

      await adminDb
        .update(blocks)
        .set({
          custom_properties: updatedCustomProperties,
          updated_at: new Date(),
        })
        .where(eq(blocks.id, blockId));

      return newProperty;
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'PROPERTY_CREATE_FAILED',
        `Failed to create custom property: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 커스텀 속성 정의 업데이트
   */
  async updateCustomPropertyDefinition(
    propertyId: string,
    data: {
      name?: string;
      propertyType?: string;
      options?: Array<{
        id: string;
        label: string;
        color?: string;
        order: number;
      }>;
    }
  ): Promise<CustomPropertyDefinition> {
    try {
      // Find the block containing this property
      const blockResults = await adminDb
        .select()
        .from(blocks)
        .where(isNull(blocks.deleted_at));

      for (const block of blockResults) {
        const customProperties = (block.custom_properties as any[]) || [];
        const propertyIndex = customProperties.findIndex(
          (prop: any) => prop.id === propertyId
        );

        if (propertyIndex !== -1) {
          // Update the property
          const updatedProperty = {
            ...customProperties[propertyIndex],
            ...data,
            id: propertyId,
            updatedAt: new Date(),
          };

          const updatedCustomProperties = [...customProperties];
          updatedCustomProperties[propertyIndex] = updatedProperty;

          await adminDb
            .update(blocks)
            .set({
              custom_properties: updatedCustomProperties,
              updated_at: new Date(),
            })
            .where(eq(blocks.id, block.id));

          return updatedProperty;
        }
      }

      throw new BlockManagementError(
        'PROPERTY_NOT_FOUND',
        'Property not found'
      );
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'PROPERTY_UPDATE_FAILED',
        `Failed to update custom property: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 커스텀 속성 정의 삭제
   */
  async deleteCustomPropertyDefinition(propertyId: string): Promise<void> {
    try {
      // Find the block containing this property
      const blockResults = await adminDb
        .select()
        .from(blocks)
        .where(isNull(blocks.deleted_at));

      for (const block of blockResults) {
        const customProperties = (block.custom_properties as any[]) || [];
        const propertyIndex = customProperties.findIndex(
          (prop: any) => prop.id === propertyId
        );

        if (propertyIndex !== -1) {
          // Remove the property
          const updatedCustomProperties = customProperties.filter(
            (prop: any) => prop.id !== propertyId
          );

          await adminDb
            .update(blocks)
            .set({
              custom_properties: updatedCustomProperties,
              updated_at: new Date(),
            })
            .where(eq(blocks.id, block.id));

          return;
        }
      }

      throw new BlockManagementError(
        'PROPERTY_NOT_FOUND',
        'Property not found'
      );
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'PROPERTY_DELETE_FAILED',
        `Failed to delete custom property: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 워크스페이스의 모든 커스텀 속성 정의 조회
   */
  async getCustomPropertyDefinitions(
    workspaceId: string
  ): Promise<CustomPropertyDefinition[]> {
    try {
      const blockResults = await adminDb
        .select()
        .from(blocks)
        .where(
          and(eq(blocks.workspace_id, workspaceId), isNull(blocks.deleted_at))
        );

      const allProperties: CustomPropertyDefinition[] = [];

      for (const block of blockResults) {
        const customProperties = (block.custom_properties as any[]) || [];
        allProperties.push(...customProperties);
      }

      return allProperties;
    } catch (error) {
      throw new BlockManagementError(
        'PROPERTY_FETCH_FAILED',
        `Failed to fetch custom properties: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
