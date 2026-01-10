/**
 * View Mode Sizes Value Object
 *
 * 뷰 모드별 블록 크기를 관리하는 Value Object
 * - original: 오리지널 뷰 크기
 * - card: 카드 뷰 크기
 * - note: 노트 뷰 크기
 *
 * Value Object로 정의한 이유:
 * 1. 타입 안전성: 각 뷰 모드별 크기를 명시적으로 관리
 * 2. 불변성 보장: 새로운 인스턴스를 반환하여 원본 변경 방지
 * 3. 도메인 의미 명확화: "뷰 모드별 크기"라는 비즈니스 개념 표현
 * 4. 검증 로직 캡슐화: 유효한 뷰 모드와 크기만 허용
 * 5. DDD 원칙 준수: 값 객체는 도메인 모델의 핵심 요소
 */
import { CanvasManagementError } from '../errors/canvas-management.error';
import type { BlockViewModeValue } from './block-view-mode.vo';
import { Size } from './size.vo';

export interface ViewModeSizeMap {
  original?: { width: number; height: number };
  card?: { width: number; height: number };
  note?: { width: number; height: number };
}

export class ViewModeSizes {
  private readonly _sizes: Map<BlockViewModeValue, Size>;

  private constructor(sizes: Map<BlockViewModeValue, Size> = new Map()) {
    this._sizes = sizes;
  }

  /**
   * 특정 뷰 모드의 크기 조회
   *
   * @param viewMode - 조회할 뷰 모드
   * @returns 해당 뷰 모드의 크기 (없으면 null)
   */
  getSizeForViewMode(viewMode: BlockViewModeValue): Size | null {
    return this._sizes.get(viewMode) ?? null;
  }

  /**
   * 특정 뷰 모드의 크기 업데이트
   *
   * @param viewMode - 업데이트할 뷰 모드
   * @param size - 새로운 크기
   * @returns 업데이트된 ViewModeSizes 인스턴스 (불변성 보장)
   */
  updateSizeForViewMode(
    viewMode: BlockViewModeValue,
    size: Size
  ): ViewModeSizes {
    const newSizes = new Map(this._sizes);
    newSizes.set(viewMode, size);
    return new ViewModeSizes(newSizes);
  }

  /**
   * 모든 뷰 모드 크기 조회
   *
   * @returns 뷰 모드별 크기 맵
   */
  getAllSizes(): Map<BlockViewModeValue, Size> {
    return new Map(this._sizes);
  }

  /**
   * 특정 뷰 모드에 크기가 있는지 확인
   *
   * @param viewMode - 확인할 뷰 모드
   * @returns 크기가 있으면 true
   */
  hasSizeForViewMode(viewMode: BlockViewModeValue): boolean {
    return this._sizes.has(viewMode);
  }

  /**
   * JSON으로 변환
   *
   * @returns JSON 형태의 뷰 모드별 크기 객체
   */
  toJSON(): ViewModeSizeMap {
    const result: ViewModeSizeMap = {};
    this._sizes.forEach((size, viewMode) => {
      result[viewMode] = {
        width: size.width,
        height: size.height,
      };
    });
    return result;
  }

  /**
   * JSON에서 ViewModeSizes 생성
   *
   * @param json - JSON 형태의 뷰 모드별 크기 객체
   * @returns ViewModeSizes 인스턴스
   */
  static fromJSON(json: any): ViewModeSizes {
    if (!json || typeof json !== 'object') {
      return new ViewModeSizes();
    }

    const sizes = new Map<BlockViewModeValue, Size>();

    const validViewModes: BlockViewModeValue[] = ['original', 'card', 'note'];
    for (const viewMode of validViewModes) {
      const sizeData = json[viewMode];
      if (sizeData && typeof sizeData === 'object') {
        const { width, height } = sizeData;
        if (
          typeof width === 'number' &&
          typeof height === 'number' &&
          !isNaN(width) &&
          !isNaN(height) &&
          isFinite(width) &&
          isFinite(height)
        ) {
          try {
            const size = new Size(width, height);
            sizes.set(viewMode, size);
          } catch (error) {
            // 유효하지 않은 크기는 무시
            console.warn(
              `[ViewModeSizes] Invalid size for view mode ${viewMode}:`,
              error
            );
          }
        }
      }
    }

    return new ViewModeSizes(sizes);
  }

  /**
   * 기존 size_width, size_height로부터 ViewModeSizes 생성 (하위 호환성)
   *
   * @param width - 기존 너비
   * @param height - 기존 높이
   * @returns ViewModeSizes 인스턴스 (original 뷰 모드에만 크기 설정)
   */
  static fromLegacySize(width: number, height: number): ViewModeSizes {
    try {
      const size = new Size(width, height);
      const sizes = new Map<BlockViewModeValue, Size>();
      sizes.set('original', size);
      return new ViewModeSizes(sizes);
    } catch (error) {
      throw new CanvasManagementError(
        'INVALID_SIZE',
        `Invalid legacy size: ${width}x${height}`
      );
    }
  }

  /**
   * 빈 ViewModeSizes 생성
   *
   * @returns 빈 ViewModeSizes 인스턴스
   */
  static empty(): ViewModeSizes {
    return new ViewModeSizes();
  }

  /**
   * 두 ViewModeSizes 비교
   *
   * @param other - 비교할 ViewModeSizes
   * @returns 동일하면 true
   */
  equals(other: ViewModeSizes): boolean {
    if (!other) return false;

    if (this._sizes.size !== other._sizes.size) {
      return false;
    }

    for (const [viewMode, size] of this._sizes.entries()) {
      const otherSize = other._sizes.get(viewMode);
      if (!otherSize || !size.equals(otherSize)) {
        return false;
      }
    }

    return true;
  }
}
