import { CanvasManagementError } from '../errors/canvas-management.error';

/**
 * EdgeShape Value Object
 * React Flow 엣지 모양 (default, straight, step, smoothstep, simplebezier)
 */
export class EdgeShape {
  private static readonly VALID_TYPES = [
    'default',
    'straight',
    'step',
    'smoothstep',
    'simplebezier',
  ] as const;

  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new CanvasManagementError(
        'INVALID_EDGE_SHAPE',
        'Invalid edge shape. Must be one of: default, straight, step, smoothstep, simplebezier'
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

    return EdgeShape.VALID_TYPES.includes(
      trimmedValue as (typeof EdgeShape.VALID_TYPES)[number]
    );
  }

  equals(other: EdgeShape): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  // 정적 팩토리 메서드
  static default(): EdgeShape {
    return new EdgeShape('default');
  }

  static straight(): EdgeShape {
    return new EdgeShape('straight');
  }

  static step(): EdgeShape {
    return new EdgeShape('step');
  }

  static smoothstep(): EdgeShape {
    return new EdgeShape('smoothstep');
  }

  static simplebezier(): EdgeShape {
    return new EdgeShape('simplebezier');
  }

  // 타입 체크 메서드
  isDefault(): boolean {
    return this._value === 'default';
  }

  isStraight(): boolean {
    return this._value === 'straight';
  }

  isStep(): boolean {
    return this._value === 'step';
  }

  isSmoothstep(): boolean {
    return this._value === 'smoothstep';
  }

  isSimplebezier(): boolean {
    return this._value === 'simplebezier';
  }
}
