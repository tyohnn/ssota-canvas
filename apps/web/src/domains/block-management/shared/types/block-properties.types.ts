/**
 * Block Properties Types - 블록 타입별 특화 속성 정의
 *
 * 모든 블록 타입의 properties를 중앙에서 관리
 */

import { BlockType } from './block-types';
import { ColorToken } from './style-tokens.types';

/**
 * Text Align Enum
 */
export enum TextAlign {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

/**
 * Font Size Enum
 */
export enum FontSize {
  SMALL = '14px',
  MEDIUM = '16px',
  LARGE = '20px',
  XLARGE = '24px',
}

/**
 * Text Block Properties
 */
export interface TextBlockProperties {
  content: string;
  title: string;
  color?: ColorToken;
  richStyle?: boolean;
  textAlign?: TextAlign;
  fontSize?: FontSize;
}

/**
 * Shape Block Properties
 */
export interface ShapeBlockProperties {
  shapeType: 'rectangle' | 'circle' | 'triangle';
  color: string;
  size: { width: number; height: number };
}

/**
 * Markdown Block Properties
 */
export interface MarkdownBlockProperties {
  content: string;
  title: string;
  format: 'markdown' | 'html';
}

/**
 * YouTube Block Properties
 */
export interface YoutubeBlockProperties {
  url: string;
  title: string;
  description?: string;
}

/**
 * Image Block Properties
 */
export interface ImageBlockProperties {
  url: string;
  alt: string;
  caption?: string;
}

/**
 * PDF Block Properties
 */
export interface PdfBlockProperties {
  url: string;
  title: string;
  pageCount?: number;
}

/**
 * Audio Block Properties
 */
export interface AudioBlockProperties {
  url: string;
  title: string;
  duration?: number;
}

/**
 * Video Block Properties
 */
export interface VideoBlockProperties {
  url: string;
  title: string;
  duration?: number;
}

/**
 * File Block Properties
 */
export interface FileBlockProperties {
  url: string;
  filename: string;
  fileSize?: number;
}

/**
 * Python Block Properties
 */
export interface PythonBlockProperties {
  code: string;
  language: string;
  output?: string;
}

/**
 * Link Block Properties
 */
export interface LinkBlockProperties {
  url: string;
  title: string;
  description?: string;
}

/**
 * Page Mention Block Properties
 */
export interface PageMentionBlockProperties {
  pageId: string;
  pageTitle: string;
}

/**
 * LaTeX Block Properties
 */
export interface LatexBlockProperties {
  formula: string;
  title?: string;
}

/**
 * GitHub PR Block Properties
 */
export interface GithubPrBlockProperties {
  url: string;
  title: string;
  status: 'open' | 'closed' | 'merged';
}

/**
 * React Component Block Properties
 */
export interface ReactComponentBlockProperties {
  componentName: string;
  props: Record<string, any>;
}

/**
 * 블록 타입별 Properties 매핑
 */
export interface BlockPropertiesMap {
  [BlockType.TEXT]: TextBlockProperties;
  [BlockType.SHAPE]: ShapeBlockProperties;
  [BlockType.MARKDOWN]: MarkdownBlockProperties;
  [BlockType.YOUTUBE]: YoutubeBlockProperties;
  [BlockType.IMAGE]: ImageBlockProperties;
  [BlockType.PDF]: PdfBlockProperties;
  [BlockType.AUDIO]: AudioBlockProperties;
  [BlockType.VIDEO]: VideoBlockProperties;
  [BlockType.FILE]: FileBlockProperties;
  [BlockType.PYTHON]: PythonBlockProperties;
  [BlockType.LINK]: LinkBlockProperties;
  [BlockType.PAGE_MENTION]: PageMentionBlockProperties;
  [BlockType.LATEX]: LatexBlockProperties;
  [BlockType.GITHUB_PR]: GithubPrBlockProperties;
  [BlockType.REACT_COMPONENT]: ReactComponentBlockProperties;
}

/**
 * 타입 안전한 블록 Properties 추출
 */
export type BlockProperties<T extends BlockType> =
  T extends keyof BlockPropertiesMap
    ? BlockPropertiesMap[T]
    : Record<string, any>;

/**
 * 기본 Properties 값들
 */
export const TEXT_BLOCK_PROPERTIES: TextBlockProperties = {
  content: '',
  title: '',
  color: ColorToken.GRAY,
  richStyle: false,
  textAlign: TextAlign.LEFT,
  fontSize: FontSize.MEDIUM,
};

export const SHAPE_BLOCK_PROPERTIES: ShapeBlockProperties = {
  shapeType: 'rectangle',
  color: '#000000',
  size: { width: 100, height: 100 },
};

export const MARKDOWN_BLOCK_PROPERTIES: MarkdownBlockProperties = {
  content: '',
  title: '',
  format: 'markdown',
};

export const YOUTUBE_BLOCK_PROPERTIES: YoutubeBlockProperties = {
  url: '',
  title: '',
};

export const IMAGE_BLOCK_PROPERTIES: ImageBlockProperties = {
  url: '',
  alt: '',
};

export const PDF_BLOCK_PROPERTIES: PdfBlockProperties = {
  url: '',
  title: '',
};

export const AUDIO_BLOCK_PROPERTIES: AudioBlockProperties = {
  url: '',
  title: '',
};

export const VIDEO_BLOCK_PROPERTIES: VideoBlockProperties = {
  url: '',
  title: '',
};

export const FILE_BLOCK_PROPERTIES: FileBlockProperties = {
  url: '',
  filename: '',
};

export const PYTHON_BLOCK_PROPERTIES: PythonBlockProperties = {
  code: '',
  language: 'python',
};

export const LINK_BLOCK_PROPERTIES: LinkBlockProperties = {
  url: '',
  title: '',
};

export const PAGE_MENTION_BLOCK_PROPERTIES: PageMentionBlockProperties = {
  pageId: '',
  pageTitle: '',
};

export const LATEX_BLOCK_PROPERTIES: LatexBlockProperties = {
  formula: '',
};

export const GITHUB_PR_BLOCK_PROPERTIES: GithubPrBlockProperties = {
  url: '',
  title: '',
  status: 'open',
};

export const REACT_COMPONENT_BLOCK_PROPERTIES: ReactComponentBlockProperties = {
  componentName: '',
  props: {},
};

/**
 * 블록 타입별 기본 properties 가져오기
 */
export function getDefaultPropertiesForBlockType(
  blockType: BlockType
): Record<string, any> {
  switch (blockType) {
    case BlockType.TEXT:
      return TEXT_BLOCK_PROPERTIES;
    case BlockType.SHAPE:
      return SHAPE_BLOCK_PROPERTIES;
    case BlockType.MARKDOWN:
      return MARKDOWN_BLOCK_PROPERTIES;
    case BlockType.YOUTUBE:
      return YOUTUBE_BLOCK_PROPERTIES;
    case BlockType.IMAGE:
      return IMAGE_BLOCK_PROPERTIES;
    case BlockType.PDF:
      return PDF_BLOCK_PROPERTIES;
    case BlockType.AUDIO:
      return AUDIO_BLOCK_PROPERTIES;
    case BlockType.VIDEO:
      return VIDEO_BLOCK_PROPERTIES;
    case BlockType.FILE:
      return FILE_BLOCK_PROPERTIES;
    case BlockType.PYTHON:
      return PYTHON_BLOCK_PROPERTIES;
    case BlockType.LINK:
      return LINK_BLOCK_PROPERTIES;
    case BlockType.PAGE_MENTION:
      return PAGE_MENTION_BLOCK_PROPERTIES;
    case BlockType.LATEX:
      return LATEX_BLOCK_PROPERTIES;
    case BlockType.GITHUB_PR:
      return GITHUB_PR_BLOCK_PROPERTIES;
    case BlockType.REACT_COMPONENT:
      return REACT_COMPONENT_BLOCK_PROPERTIES;
    default:
      return {} as BlockProperties<BlockType>; // 기본값
  }
}

/**
 * 타입 안전한 블록 속성 검증
 */
export function validateBlockProperties<T extends BlockType>(
  blockType: T,
  properties: Record<string, any>
): properties is Record<string, any> {
  // 각 블록 타입별 속성 검증 로직
  switch (blockType) {
    case BlockType.TEXT:
      return (
        typeof properties.content === 'string' &&
        typeof properties.title === 'string'
      );
    case BlockType.SHAPE:
      return (
        typeof properties.shapeType === 'string' &&
        typeof properties.color === 'string' &&
        typeof properties.size === 'object'
      );
    case BlockType.MARKDOWN:
      return (
        typeof properties.content === 'string' &&
        typeof properties.title === 'string' &&
        (properties.format === 'markdown' || properties.format === 'html')
      );
    case BlockType.YOUTUBE:
      return (
        typeof properties.url === 'string' &&
        typeof properties.title === 'string'
      );
    case BlockType.IMAGE:
      return (
        typeof properties.url === 'string' && typeof properties.alt === 'string'
      );
    case BlockType.PDF:
      return (
        typeof properties.url === 'string' &&
        typeof properties.title === 'string'
      );
    case BlockType.AUDIO:
      return (
        typeof properties.url === 'string' &&
        typeof properties.title === 'string'
      );
    case BlockType.VIDEO:
      return (
        typeof properties.url === 'string' &&
        typeof properties.title === 'string'
      );
    case BlockType.FILE:
      return (
        typeof properties.url === 'string' &&
        typeof properties.filename === 'string'
      );
    case BlockType.PYTHON:
      return (
        typeof properties.code === 'string' &&
        typeof properties.language === 'string'
      );
    case BlockType.LINK:
      return (
        typeof properties.url === 'string' &&
        typeof properties.title === 'string'
      );
    case BlockType.PAGE_MENTION:
      return (
        typeof properties.pageId === 'string' &&
        typeof properties.pageTitle === 'string'
      );
    case BlockType.LATEX:
      return typeof properties.formula === 'string';
    case BlockType.GITHUB_PR:
      return (
        typeof properties.url === 'string' &&
        typeof properties.title === 'string' &&
        ['open', 'closed', 'merged'].includes(properties.status)
      );
    case BlockType.REACT_COMPONENT:
      return (
        typeof properties.componentName === 'string' &&
        typeof properties.props === 'object'
      );
    default:
      return true; // 기본적으로 모든 속성 허용
  }
}
