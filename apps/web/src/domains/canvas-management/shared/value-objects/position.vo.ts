// apps/web/src/domains/canvas-management/shared/value-objects/position.vo.ts

import { CanvasManagementError } from '../errors/canvas-management.error';

export class Position {
  private readonly _x: number;
  private readonly _y: number;

  constructor(x: number, y: number) {
    // 기본 검증
    if (!this.isValid(x, y)) {
      throw new CanvasManagementError(
        'INVALID_POSITION',
        'Invalid position values'
      );
    }
    this._x = x;
    this._y = y;
  }

  get x(): number {
    return this._x;
  }

  get y(): number {
    return this._y;
  }

  private isValid(x: number, y: number): boolean {
    return (
      x >= -999999 &&
      x <= 999999 &&
      y >= -999999 &&
      y <= 999999 &&
      !isNaN(x) &&
      !isNaN(y) &&
      isFinite(x) &&
      isFinite(y)
    );
  }

  equals(other: Position): boolean {
    if (!other) return false;

    // 부동소수점 오차 고려 (0.001 이내)
    const tolerance = 0.001;
    return (
      Math.abs(this._x - other._x) < tolerance &&
      Math.abs(this._y - other._y) < tolerance
    );
  }

  add(offset: Position): Position {
    const newX = this._x + offset._x;
    const newY = this._y + offset._y;
    return new Position(newX, newY);
  }

  distanceTo(other: Position): number {
    const dx = this._x - other._x;
    const dy = this._y - other._y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
