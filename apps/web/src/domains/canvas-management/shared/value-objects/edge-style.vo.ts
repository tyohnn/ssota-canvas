import {
  CanvasManagementError,
  type CanvasManagementErrorCode,
} from '../errors/canvas-management.error';

/**
 * EdgeStyle Value Object
 * React Flow 엣지 스타일 (색상, 두께)
 *
 * Invariants:
 * - color: 유효한 hex 색상 형식 (#RRGGBB 또는 #RGB)
 * - thickness: 1 이상 10 이하의 정수
 */
export class EdgeStyle {
  private readonly _color: string;
  private readonly _thickness: number;

  private static readonly MIN_THICKNESS = 1;
  private static readonly MAX_THICKNESS = 3;
  private static readonly HEX_COLOR_REGEX =
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  constructor(color: string, thickness: number) {
    if (!this.isValidColor(color)) {
      throw new CanvasManagementError(
        'INVALID_EDGE_COLOR' as CanvasManagementErrorCode,
        'Invalid edge color. Must be a valid hex color (#RRGGBB or #RGB)'
      );
    }

    if (!this.isValidThickness(thickness)) {
      throw new CanvasManagementError(
        'INVALID_EDGE_THICKNESS' as CanvasManagementErrorCode,
        `Invalid edge thickness. Must be between ${EdgeStyle.MIN_THICKNESS} and ${EdgeStyle.MAX_THICKNESS}`
      );
    }

    this._color = color;
    this._thickness = Math.floor(thickness); // 정수로 변환
  }

  get color(): string {
    return this._color;
  }

  get thickness(): number {
    return this._thickness;
  }

  private isValidColor(color: string): boolean {
    if (!color || typeof color !== 'string') {
      return false;
    }

    const trimmedColor = color.trim();
    if (!trimmedColor) {
      return false;
    }

    return EdgeStyle.HEX_COLOR_REGEX.test(trimmedColor);
  }

  private isValidThickness(thickness: number): boolean {
    if (typeof thickness !== 'number' || isNaN(thickness)) {
      return false;
    }

    const intThickness = Math.floor(thickness);
    return (
      intThickness >= EdgeStyle.MIN_THICKNESS &&
      intThickness <= EdgeStyle.MAX_THICKNESS
    );
  }

  equals(other: EdgeStyle): boolean {
    if (!other) return false;
    return this._color === other._color && this._thickness === other._thickness;
  }

  // 정적 팩토리 메서드
  static default(): EdgeStyle {
    return new EdgeStyle('#9ca3af', 2); // gray-400
  }

  // 부분 업데이트를 위한 메서드들
  withColor(color: string): EdgeStyle {
    return new EdgeStyle(color, this._thickness);
  }

  withThickness(thickness: number): EdgeStyle {
    return new EdgeStyle(this._color, thickness);
  }

  // React Flow 스타일로 변환
  toReactFlowStyle(): { stroke: string; strokeWidth: number } {
    return {
      stroke: this._color,
      strokeWidth: this._thickness,
    };
  }

  // 객체에서 생성 (DTO 변환용)
  static fromObject(data: { color: string; thickness: number }): EdgeStyle {
    return new EdgeStyle(data.color, data.thickness);
  }
}
