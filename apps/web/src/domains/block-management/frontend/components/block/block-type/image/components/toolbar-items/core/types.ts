/**
 * Image Toolbar Items Types
 */
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

/**
 * Image Toolbar Items Props
 */
export interface ImageToolbarItemsProps {
  blockId: string;
  blockMountId?: string;
  blockData: BlockNodeData;
  disabled: boolean;
  onPropertyUpdate: (path: string, value: any) => Promise<void>;
  onPropertiesUpdate: (properties: Record<string, any>) => Promise<void>;
  width?: number;
  height?: number;
}

/**
 * Image Toolbar Context Value
 */
export interface ImageToolbarContextValue {
  // Block 정보
  blockId: string;
  blockMountId?: string;
  blockData: BlockNodeData;
  disabled: boolean;

  // Block dimensions
  width?: number;
  height?: number;

  // Properties (SSOT: ImageBlockProperties 사용)
  imageProperties: ImageBlockProperties;

  // Actions
  updateProperty: (key: string, value: any) => Promise<void>;
  onPropertiesUpdate: (properties: Record<string, any>) => Promise<void>;
}
