import {
  CanvasManagementError,
  type CanvasManagementErrorCode,
} from '../errors/canvas-management.error';

/**
 * EdgeHandle Value Object
 * React Flow 엣지 연결점 위치 ('left', 'right', 'top', 'bottom')
 *
 * ⚠️ 중요: 엣지는 항상 명시적인 handle 위치를 가져야 합니다.
 * DB 저장 시점에 handle이 결정되어야 하며, 새로고침 후에도 동일한 위치에서 렌더링됩니다.
 */
export class EdgeHandle {
  private static readonly VALID_HANDLES = [
    'left',
    'right',
    'top',
    'bottom',
  ] as const;

  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new CanvasManagementError(
        'INVALID_EDGE_HANDLE' as CanvasManagementErrorCode,
        'Invalid edge handle. Must be one of: left, right, top, bottom'
      );
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return false;
    }

    return EdgeHandle.VALID_HANDLES.includes(
      trimmedValue as (typeof EdgeHandle.VALID_HANDLES)[number]
    );
  }

  equals(other: EdgeHandle): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  // 정적 팩토리 메서드
  static left(): EdgeHandle {
    return new EdgeHandle('left');
  }

  static right(): EdgeHandle {
    return new EdgeHandle('right');
  }

  static top(): EdgeHandle {
    return new EdgeHandle('top');
  }

  static bottom(): EdgeHandle {
    return new EdgeHandle('bottom');
  }

  // 타입 체크 메서드
  isLeft(): boolean {
    return this._value === 'left';
  }

  isRight(): boolean {
    return this._value === 'right';
  }

  isTop(): boolean {
    return this._value === 'top';
  }

  isBottom(): boolean {
    return this._value === 'bottom';
  }

  // 문자열에서 생성 (DTO 변환용)
  static fromString(value: string): EdgeHandle {
    return new EdgeHandle(value);
  }
}
