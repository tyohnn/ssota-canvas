import { getBlockToolsForType } from '@/domains/app-system/shared/registry/app-registry';
import { BlockManagementError } from '../errors/block-management.error';
import { BlockPropertiesFactory } from './block-properties';
import {
  BlockType as BlockTypeEnum,
  isValidBlockType,
} from '../types/block-types';

export type SupportedBlockType = BlockTypeEnum;

/**
 * BlockType Value Object (Domain Only)
 *
 * 도메인에서만 사용하는 블록 타입 Value Object
 *
 * 사용처:
 * - 비즈니스 규칙 검증
 * - 도메인 로직 캡슐화
 * - 서비스 레이어 전용
 * - 엔티티 생성 및 검증
 *
 * ⚠️ 프론트엔드에서는 사용하지 마세요!
 * 프론트엔드에서는 block-types.ts의 BlockType enum을 사용하세요.
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

    return isValidBlockType(value);
  }

  equals(other: BlockType): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * 블록 타입별 기본 속성 검증
   *
   * @param properties - 검증할 속성들
   * @returns 검증 결과
   */
  validateProperties(properties: Record<string, any>): boolean {
    // 기본적인 타입 검증만 수행
    // 상세한 검증은 각 BlockPropertiesVO에서 처리
    return typeof properties === 'object' && properties !== null;
  }

  /**
   * 타입별 사용 가능한 툴 목록 반환
   *
   * @returns 툴 목록
   */
  getAvailableTools(): string[] {
    const appTools = getBlockToolsForType(this._value);
    if (appTools.length > 0) {
      return appTools.map(t => t.name);
    }

    const tools: Record<string, string[]> = {
      basic: ['edit', 'duplicate', 'delete'],
      default: ['edit', 'duplicate', 'delete'],
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
   * 블록 타입별 기본 속성 반환
   *
   * @returns 기본 속성 객체
   */
  getDefaultProperties(): Record<string, any> {
    return BlockPropertiesFactory.createForBlockType(this).toJSON();
  }

  /**
   * 블록 타입 문자열 반환
   */
  toString(): string {
    return this._value;
  }
}
