/**
 * Block Data Types - 통합된 블록 데이터 타입 시스템
 *
 * DB → DTO → React Flow Node까지의 타입 안전성 보장
 */

import { BlockType } from './block-types';
import {
  TextBlockProperties,
  ShapeBlockProperties,
  MarkdownBlockProperties,
  YoutubeBlockProperties,
  ImageBlockProperties,
  PdfBlockProperties,
  AudioBlockProperties,
  VideoBlockProperties,
  FileBlockProperties,
  PythonBlockProperties,
  LinkBlockProperties,
  PageMentionBlockProperties,
  LatexBlockProperties,
  GithubPrBlockProperties,
  ReactComponentBlockProperties,
  getDefaultPropertiesForBlockType,
  BlockProperties,
} from './block-properties.types';

/**
 * 커스텀 속성 정의 (DB 구조와 일치)
 */
export interface CustomPropertyDefinition {
  id: string;
  name: string;
  type: 'text' | 'select' | 'multiselect' | 'profile' | 'date' | 'number';
  options?: Array<{
    id: string;
    label: string;
    color?: string;
    order: number;
  }>;
  order: number;
  visible: boolean;
}

/**
 * React Flow Node용 기본 블록 데이터
 */
export interface CreatedByProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface BaseNodeData extends Record<string, unknown> {
  blockMountId: string;
  blockId: string;
  blockType: BlockType;
  properties: Record<string, any>; // 실제 DB properties는 Record<string, any>로 처리
  customProperties: CustomPropertyDefinition[];
  metadata?: Record<string, any>;
  // Canvas Management 특화 속성들
  pageId?: string;
  orgId?: string;
  workspaceId?: string;
  // 메타데이터
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | CreatedByProfile;
}

export interface TextBlockNodeData extends BaseNodeData {
  blockType: 'text';
  properties: TextBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface ShapeBlockNodeData extends BaseNodeData {
  blockType: 'shape';
  properties: ShapeBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface MarkdownBlockNodeData extends BaseNodeData {
  blockType: 'markdown';
  properties: MarkdownBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface YoutubeBlockNodeData extends BaseNodeData {
  blockType: 'youtube';
  properties: YoutubeBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface ImageBlockNodeData extends BaseNodeData {
  blockType: 'image';
  properties: ImageBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface PdfBlockNodeData extends BaseNodeData {
  blockType: 'pdf';
  properties: PdfBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface AudioBlockNodeData extends BaseNodeData {
  blockType: 'audio';
  properties: AudioBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface VideoBlockNodeData extends BaseNodeData {
  blockType: 'video';
  properties: VideoBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface FileBlockNodeData extends BaseNodeData {
  blockType: 'file';
  properties: FileBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface PythonBlockNodeData extends BaseNodeData {
  blockType: 'python';
  properties: PythonBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface LinkBlockNodeData extends BaseNodeData {
  blockType: 'link';
  properties: LinkBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface PageMentionBlockNodeData extends BaseNodeData {
  blockType: 'page_mention';
  properties: PageMentionBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface LatexBlockNodeData extends BaseNodeData {
  blockType: 'latex';
  properties: LatexBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface GithubPrBlockNodeData extends BaseNodeData {
  blockType: 'github_pr';
  properties: GithubPrBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface ReactComponentBlockNodeData extends BaseNodeData {
  blockType: 'react_component';
  properties: ReactComponentBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

/**
 * 모든 블록 노드 데이터 타입 유니온
 */
export type BlockNodeData =
  | TextBlockNodeData
  | ShapeBlockNodeData
  | MarkdownBlockNodeData
  | YoutubeBlockNodeData
  | ImageBlockNodeData
  | PdfBlockNodeData
  | AudioBlockNodeData
  | VideoBlockNodeData
  | FileBlockNodeData
  | PythonBlockNodeData
  | LinkBlockNodeData
  | PageMentionBlockNodeData
  | LatexBlockNodeData
  | GithubPrBlockNodeData
  | ReactComponentBlockNodeData;

/**
 * 타입 안전한 블록 노드 데이터 생성 함수
 */
export function createBlockNodeData<T extends BlockType>(
  blockType: T,
  baseData: {
    blockMountId: string;
    blockId: string;
    pageId?: string;
    orgId?: string;
    workspaceId?: string;
    properties?: Record<string, any>; // 실제 DB properties 추가
    createdBy?: string | CreatedByProfile;
    createdAt?: string;
    updatedAt?: string;
  }
): BlockNodeData {
  const commonData = {
    blockMountId: baseData.blockMountId,
    blockId: baseData.blockId,
    blockType,
    properties:
      baseData.properties ||
      (getDefaultPropertiesForBlockType(blockType) as BlockProperties<T>), // 실제 properties 우선, 없으면 기본값
    customProperties: [],
    metadata: {},
    pageId: baseData.pageId,
    orgId: baseData.orgId,
    workspaceId: baseData.workspaceId,
    createdBy: baseData.createdBy,
    createdAt: baseData.createdAt,
    updatedAt: baseData.updatedAt,
  };

  // 타입 안전성을 위한 타입 어설션
  switch (blockType) {
    case 'text':
      return commonData as TextBlockNodeData;
    case 'shape':
      return commonData as ShapeBlockNodeData;
    case 'markdown':
      return commonData as MarkdownBlockNodeData;
    case 'youtube':
      return commonData as YoutubeBlockNodeData;
    case 'image':
      return commonData as ImageBlockNodeData;
    case 'pdf':
      return commonData as PdfBlockNodeData;
    case 'audio':
      return commonData as AudioBlockNodeData;
    case 'video':
      return commonData as VideoBlockNodeData;
    case 'file':
      return commonData as FileBlockNodeData;
    case 'python':
      return commonData as PythonBlockNodeData;
    case 'link':
      return commonData as LinkBlockNodeData;
    case 'page_mention':
      return commonData as PageMentionBlockNodeData;
    case 'latex':
      return commonData as LatexBlockNodeData;
    case 'github_pr':
      return commonData as GithubPrBlockNodeData;
    case 'react_component':
      return commonData as ReactComponentBlockNodeData;
    default:
      return commonData as BlockNodeData;
  }
}
