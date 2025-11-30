/**
 * Block Data Types - 통합된 블록 데이터 타입 시스템
 *
 * DB → DTO → React Flow Node까지의 타입 안전성 보장
 */

import { BlockType } from './block-types';
import {
  TextBlockProperties,
  ShapeBlockProperties,
  ImageBlockProperties,
  MarkdownBlockProperties,
  YoutubeBlockProperties,
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
  GithubBranchBlockProperties,
  GithubCommitBlockProperties,
  ReactComponentBlockProperties,
  VercelDeploymentBlockProperties,
} from '../value-objects/block-properties';
import { CustomPropertyDefinition } from '../value-objects/block-properties/common-types';
import { BlockPropertiesFactory } from '../value-objects/block-properties';
import { BlockType as BlockTypeVO } from '../value-objects/block-type.vo';
import { UserProfile } from '@/domains/user-management/shared/types';

// CustomPropertyDefinition은 block-properties.types.ts에서 import

/**
 * 블록 속성 타입 (Value Objects에서 정의된 타입들)
 */
/**
 * Block Properties Type Map
 *
 * 확장 가능한 구조: 새 블록 타입 추가 시 여기만 수정
 */
type BlockPropertiesMap = {
  text: TextBlockProperties;
  shape: ShapeBlockProperties;
  image: ImageBlockProperties;
  markdown: MarkdownBlockProperties;
  youtube: YoutubeBlockProperties;
  pdf: PdfBlockProperties;
  audio: AudioBlockProperties;
  video: VideoBlockProperties;
  file: FileBlockProperties;
  python: PythonBlockProperties;
  link: LinkBlockProperties;
  page_mention: PageMentionBlockProperties;
  latex: LatexBlockProperties;
  github_pr: GithubPrBlockProperties;
  react_component: ReactComponentBlockProperties;
  github_branch: GithubBranchBlockProperties;
  github_commit: GithubCommitBlockProperties;
  react_component: ReactComponentBlockProperties;
  vercel_deployment: VercelDeploymentBlockProperties;
};

export type BlockProperties<T extends BlockType> =
  T extends keyof BlockPropertiesMap
    ? BlockPropertiesMap[T]
    : Record<string, any>;

export interface BaseNodeData extends Record<string, unknown> {
  blockMountId: string;
  blockId: string;
  blockType: BlockType;
  title: string;
  properties: BlockProperties<BlockType>;
  customProperties: CustomPropertyDefinition[];
  content?: unknown; // JSONB content (TipTap JSON, 기타 구조화된 콘텐츠)
  // Canvas Management 특화 속성들
  pageId: string;
  orgId: string;
  workspaceId: string;
  // 메타데이터
  createdAt?: string;
  updatedAt?: string;
  createdByProfile: UserProfile;
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

export interface ImageBlockNodeData extends BaseNodeData {
  blockType: 'image';
  properties: ImageBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface MarkdownBlockNodeData extends BaseNodeData {
  blockType: 'markdown';
  properties: MarkdownBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface LinkBlockNodeData extends BaseNodeData {
  blockType: 'link';
  properties: LinkBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface YoutubeBlockNodeData extends BaseNodeData {
  blockType: 'youtube';
  properties: YoutubeBlockProperties;
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

export interface GithubBranchBlockNodeData extends BaseNodeData {
  blockType: 'github_branch';
  properties: GithubBranchBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface GithubCommitBlockNodeData extends BaseNodeData {
  blockType: 'github_commit';
  properties: GithubCommitBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface ReactComponentBlockNodeData extends BaseNodeData {
  blockType: 'react_component';
  properties: ReactComponentBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

export interface VercelDeploymentBlockNodeData extends BaseNodeData {
  blockType: 'vercel_deployment';
  properties: VercelDeploymentBlockProperties;
  [key: string]: any; // React Flow Node data constraint
}

/**
 * 모든 블록 노드 데이터 타입 유니온
 */
export type BlockNodeData =
  | TextBlockNodeData
  | ShapeBlockNodeData
  | ImageBlockNodeData
  | MarkdownBlockNodeData
  | LinkBlockNodeData
  | YoutubeBlockNodeData
  | PdfBlockNodeData
  | AudioBlockNodeData
  | VideoBlockNodeData
  | FileBlockNodeData
  | PythonBlockNodeData
  | PageMentionBlockNodeData
  | LatexBlockNodeData
  | GithubPrBlockNodeData
  | ReactComponentBlockNodeData
  | GithubBranchBlockNodeData
  | GithubCommitBlockNodeData
  | ReactComponentBlockNodeData
  | VercelDeploymentBlockNodeData;

/**
 * 타입 안전한 블록 노드 데이터 빌드 함수
 *
 * Generic을 활용하여 타입 안전성을 보장하면서도 불필요한 타입 어설션을 제거
 * 새로운 블록 타입 추가 시 이 함수는 수정할 필요가 없음
 */
export function buildBlockNodeData<T extends BlockType>(
  blockType: T,
  baseData: {
    blockMountId: string;
    blockId: string;
    pageId: string;
    orgId: string;
    workspaceId: string;
    title?: string;
    properties?: BlockProperties<T>;
    customProperties?: CustomPropertyDefinition[];
    content?: unknown; // JSONB content
    createdByProfile?: UserProfile;
    createdAt?: string;
    updatedAt?: string;
  }
): BlockNodeData {
  // BlockPropertiesFactory에서 이미 올바른 타입의 properties를 반환하므로
  // 추가적인 타입 어설션이나 switch문이 불필요
  const properties =
    baseData.properties ||
    BlockPropertiesFactory.createForBlockType(
      new BlockTypeVO(blockType)
    ).toJSON();

  return {
    blockMountId: baseData.blockMountId,
    blockId: baseData.blockId,
    blockType,
    title: baseData.title || '',
    properties: properties,
    customProperties: baseData.customProperties || [],
    content: baseData.content, // JSONB content
    pageId: baseData.pageId,
    orgId: baseData.orgId,
    workspaceId: baseData.workspaceId,
    createdByProfile: baseData.createdByProfile || {
      id: 'unknown',
      email: 'unknown',
      name: 'unknown',
      avatarUrl: 'unknown',
    },
    createdAt: baseData.createdAt,
    updatedAt: baseData.updatedAt,
  } as BlockNodeData;
}
