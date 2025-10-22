import { CanvasManagementError } from '../errors/canvas-management.error';

/**
 * EdgeType Value Object
 * React Flow 기본 엣지 타입 (default, straight, step, smoothstep, simplebezier)
 */
export class EdgeType {
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
        'INVALID_EDGE_TYPE',
        'Invalid edge type. Must be one of: default, straight, step, smoothstep, simplebezier'
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

    return EdgeType.VALID_TYPES.includes(
      trimmedValue as (typeof EdgeType.VALID_TYPES)[number]
    );
  }

  equals(other: EdgeType): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  // 정적 팩토리 메서드
  static default(): EdgeType {
    return new EdgeType('default');
  }

  static straight(): EdgeType {
    return new EdgeType('straight');
  }

  static step(): EdgeType {
    return new EdgeType('step');
  }

  static smoothstep(): EdgeType {
    return new EdgeType('smoothstep');
  }

  static simplebezier(): EdgeType {
    return new EdgeType('simplebezier');
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
