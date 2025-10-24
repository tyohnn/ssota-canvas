import { BlockManagementError } from '../errors/block-management.error';

/**
 * 지원되는 블록 타입 목록
 */
export const SUPPORTED_BLOCK_TYPES = [
  'basic', // 기본 블록 (기존 데이터 호환성)
  'youtube',
  'python',
  'markdown',
  'image',
  'file',
  'link',
  'shape',
  'page_mention',
  'latex',
  'github_pr',
  'react_component',
] as const;

export type SupportedBlockType = (typeof SUPPORTED_BLOCK_TYPES)[number];

/**
 * BlockType Value Object
 *
 * 블록 타입의 유효성을 검증하고 도메인 로직을 캡슐화
 */
export class BlockType {
  private readonly _value: SupportedBlockType;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new BlockManagementError(
        'INVALID_BLOCK_TYPE',
        'Invalid block type'
      );
    }
    this._value = value as SupportedBlockType;
  }

  get value(): SupportedBlockType {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    return SUPPORTED_BLOCK_TYPES.includes(value as SupportedBlockType);
  }

  equals(other: BlockType): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * 타입별 메타데이터 스키마 반환
   *
   * @returns 메타데이터 스키마
   */
  getMetadataSchema(): Record<string, any> {
    const schemas: Record<string, Record<string, any>> = {
      youtube: {
        required: ['youtubeUrl'],
        properties: {
          youtubeUrl: { type: 'string', format: 'url' },
          title: { type: 'string' },
          description: { type: 'string' },
        },
      },
      python: {
        required: ['code'],
        properties: {
          code: { type: 'string' },
          language: { type: 'string', default: 'python' },
          output: { type: 'string' },
        },
      },
      markdown: {
        required: ['content'],
        properties: {
          content: { type: 'string' },
          title: { type: 'string' },
        },
      },
      image: {
        required: ['imageUrl'],
        properties: {
          imageUrl: { type: 'string', format: 'url' },
          alt: { type: 'string' },
          caption: { type: 'string' },
        },
      },
      file: {
        required: ['fileUrl'],
        properties: {
          fileUrl: { type: 'string', format: 'url' },
          fileName: { type: 'string' },
          fileSize: { type: 'number' },
        },
      },
      link: {
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'url' },
          title: { type: 'string' },
          description: { type: 'string' },
        },
      },
      shape: {
        required: ['shapeType'],
        properties: {
          shapeType: { type: 'string' },
          color: { type: 'string' },
          size: { type: 'object' },
        },
      },
      page_mention: {
        required: ['pageId'],
        properties: {
          pageId: { type: 'string' },
          pageTitle: { type: 'string' },
        },
      },
      latex: {
        required: ['formula'],
        properties: {
          formula: { type: 'string' },
          rendered: { type: 'string' },
        },
      },
      github_pr: {
        required: ['repository', 'pullRequestNumber'],
        properties: {
          repository: { type: 'string' },
          pullRequestNumber: { type: 'number' },
          title: { type: 'string' },
        },
      },
      react_component: {
        required: ['componentName'],
        properties: {
          componentName: { type: 'string' },
          props: { type: 'object' },
        },
      },
    };

    return schemas[this._value] || {};
  }

  /**
   * 타입별 기본 속성 반환
   *
   * @returns 기본 속성 객체
   */
  getDefaultProperties(): Record<string, any> {
    const defaults: Record<string, Record<string, any>> = {
      youtube: { youtubeUrl: '', title: '', description: '' },
      python: { code: '', language: 'python', output: '' },
      markdown: { content: '', title: '' },
      image: { imageUrl: '', alt: '', caption: '' },
      file: { fileUrl: '', fileName: '', fileSize: 0 },
      link: { url: '', title: '', description: '' },
      shape: {
        shapeType: 'rectangle',
        color: '#3B82F6',
        size: { width: 100, height: 100 },
      },
      page_mention: { pageId: '', pageTitle: '' },
      latex: { formula: '', rendered: '' },
      github_pr: { repository: '', pullRequestNumber: 0, title: '' },
      react_component: { componentName: '', props: {} },
    };

    return defaults[this._value] || {};
  }

  /**
   * 타입별 사용 가능한 툴 목록 반환
   *
   * @returns 툴 목록
   */
  getAvailableTools(): string[] {
    const tools: Record<string, string[]> = {
      youtube: ['getComments', 'getVideoInfo', 'generateThumbnail'],
      python: ['executeCode', 'formatCode', 'lintCode'],
      markdown: ['preview', 'exportPdf', 'exportHtml'],
      image: ['resize', 'crop', 'addFilter'],
      file: ['download', 'preview', 'share'],
      link: ['preview', 'validate', 'archive'],
      shape: ['resize', 'rotate', 'changeColor'],
      page_mention: ['preview', 'navigate'],
      latex: ['render', 'exportPdf'],
      github_pr: ['getDetails', 'getComments', 'getCommits'],
      react_component: ['preview', 'editProps', 'test'],
    };

    return tools[this._value] || [];
  }

  /**
   * 블록 타입 문자열 반환
   */
  toString(): string {
    return this._value;
  }
}
