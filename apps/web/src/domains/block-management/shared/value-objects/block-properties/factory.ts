/**
 * Block Properties Factory
 *
 * 블록 타입에 따라 적절한 Properties Value Object를 생성하는 Factory
 * 100개+ 블록 타입을 지원하기 위한 확장 가능한 구조
 */

import { BlockType as BlockTypeVO } from '../block-type.vo';
import { BlockType } from '../../types/block-types';
import { BlockPropertiesVO } from './base.vo';
import { TextBlockPropertiesVO } from './text.vo';
import { ShapeBlockPropertiesVO } from './shape.vo';
import { ImageBlockPropertiesVO } from './image.vo';
import { MarkdownBlockPropertiesVO } from './markdown.vo';
import { YoutubeBlockPropertiesVO } from './youtube.vo';
import { PdfBlockPropertiesVO } from './pdf.vo';
import { AudioBlockPropertiesVO } from './audio.vo';
import { VideoBlockPropertiesVO } from './video.vo';
import { FileBlockPropertiesVO } from './file.vo';
import { PythonBlockPropertiesVO } from './python.vo';
import { LinkBlockPropertiesVO } from './link.vo';
import { PageMentionBlockPropertiesVO } from './page-mention.vo';
import { LatexBlockPropertiesVO } from './latex.vo';
import { GithubPrBlockPropertiesVO } from './github-pr.vo';
import { ReactComponentBlockPropertiesVO } from './react-component.vo';
import { GroupBlockPropertiesVO } from './group.vo';

/**
 * Block Properties Factory
 *
 * Registry Pattern을 사용하여 100개+ 블록 타입을 효율적으로 관리
 */
export class BlockPropertiesFactory {
  private static registry = new Map<BlockType, () => BlockPropertiesVO>();

  /**
   * Factory 초기화
   * 모든 블록 타입의 Properties 생성 함수를 등록
   */
  static initialize(): void {
    // Text Block
    this.registry.set(BlockType.TEXT, () =>
      TextBlockPropertiesVO.createDefault()
    );

    // Shape Block
    this.registry.set(BlockType.SHAPE, () =>
      ShapeBlockPropertiesVO.createDefault()
    );

    // Image Block
    this.registry.set(BlockType.IMAGE, () =>
      ImageBlockPropertiesVO.createDefault()
    );

    // Markdown Block
    this.registry.set(BlockType.MARKDOWN, () =>
      MarkdownBlockPropertiesVO.createDefault()
    );

    // YouTube Block
    this.registry.set(BlockType.YOUTUBE, () =>
      YoutubeBlockPropertiesVO.createDefault()
    );

    // PDF Block
    this.registry.set(BlockType.PDF, () =>
      PdfBlockPropertiesVO.createDefault()
    );

    // Audio Block
    this.registry.set(BlockType.AUDIO, () =>
      AudioBlockPropertiesVO.createDefault()
    );

    // Video Block
    this.registry.set(BlockType.VIDEO, () =>
      VideoBlockPropertiesVO.createDefault()
    );

    // File Block
    this.registry.set(BlockType.FILE, () =>
      FileBlockPropertiesVO.createDefault()
    );

    // Python Block
    this.registry.set(BlockType.PYTHON, () =>
      PythonBlockPropertiesVO.createDefault()
    );

    // Link Block
    this.registry.set(BlockType.LINK, () =>
      LinkBlockPropertiesVO.createDefault()
    );

    // Page Mention Block
    this.registry.set(BlockType.PAGE_MENTION, () =>
      PageMentionBlockPropertiesVO.createDefault()
    );

    // LaTeX Block
    this.registry.set(BlockType.LATEX, () =>
      LatexBlockPropertiesVO.createDefault()
    );

    // GitHub PR Block
    this.registry.set(BlockType.GITHUB_PR, () =>
      GithubPrBlockPropertiesVO.createDefault()
    );

    // React Component Block
    this.registry.set(BlockType.REACT_COMPONENT, () =>
      ReactComponentBlockPropertiesVO.createDefault()
    );

    // Group Block
    this.registry.set(BlockType.GROUP, () =>
      GroupBlockPropertiesVO.createDefault()
    );
  }

  /**
   * 블록 타입에 따른 Properties 생성
   *
   * @param blockType - 블록 타입
   * @returns 해당 블록 타입의 기본 Properties Value Object
   * @throws Error - 지원하지 않는 블록 타입인 경우
   */
  static createForBlockType(blockTypeVO: BlockTypeVO): BlockPropertiesVO {
    // Registry가 초기화되지 않은 경우 초기화
    if (this.registry.size === 0) {
      this.initialize();
    }

    const factory = this.registry.get(blockTypeVO.value);
    if (!factory) {
      throw new Error(`Unsupported block type: ${blockTypeVO.value}`);
    }

    return factory();
  }

  /**
   * JSON 데이터로부터 Properties Value Object 생성
   *
   * @param blockTypeVO - 블록 타입 Value Object
   * @param jsonData - JSON 데이터
   * @returns 해당 블록 타입의 Properties Value Object
   * @throws Error - 지원하지 않는 블록 타입인 경우
   */
  static createFromJSON(
    blockTypeVO: BlockTypeVO,
    jsonData: Record<string, any>
  ): BlockPropertiesVO {
    switch (blockTypeVO.value) {
      case BlockType.TEXT:
        return TextBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.SHAPE:
        return ShapeBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.IMAGE:
        return ImageBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.MARKDOWN:
        return MarkdownBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.YOUTUBE:
        return YoutubeBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.PDF:
        return PdfBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.AUDIO:
        return AudioBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.VIDEO:
        return VideoBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.FILE:
        return FileBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.PYTHON:
        return PythonBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.LINK:
        return LinkBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.PAGE_MENTION:
        return PageMentionBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.LATEX:
        return LatexBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.GITHUB_PR:
        return GithubPrBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.REACT_COMPONENT:
        return ReactComponentBlockPropertiesVO.fromJSON(jsonData as any);
      case BlockType.GROUP:
        return GroupBlockPropertiesVO.fromJSON(jsonData as any);
      default:
        throw new Error(
          `Unsupported block type for JSON conversion: ${blockTypeVO.value}`
        );
    }
  }

  /**
   * 지원하는 블록 타입 목록 조회
   *
   * @returns 지원하는 블록 타입 배열
   */
  static getSupportedBlockTypes(): string[] {
    if (this.registry.size === 0) {
      this.initialize();
    }

    return Array.from(this.registry.keys());
  }

  /**
   * 블록 타입 지원 여부 확인
   *
   * @param blockTypeVO - 확인할 블록 타입 Value Object
   * @returns 지원 여부
   */
  static isSupported(blockTypeVO: BlockTypeVO): boolean {
    if (this.registry.size === 0) {
      this.initialize();
    }

    return this.registry.has(blockTypeVO.value);
  }

  /**
   * 새로운 블록 타입 등록 (런타임 확장)
   *
   * @param blockTypeVO - 블록 타입 Value Object
   * @param factory - Properties 생성 함수
   */
  static register(
    blockTypeVO: BlockTypeVO,
    factory: () => BlockPropertiesVO
  ): void {
    this.registry.set(blockTypeVO.value, factory);
  }
}
