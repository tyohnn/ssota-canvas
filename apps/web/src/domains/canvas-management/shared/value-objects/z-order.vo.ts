import { CanvasManagementError } from '../errors/canvas-management.error';

export class ZOrder {
  private readonly _value: number;

  constructor(value: number) {
    if (!this.isValid(value)) {
      throw new CanvasManagementError(
        'INVALID_ZORDER',
        'Invalid z-order value'
      );
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  private isValid(value: number): boolean {
    return (
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 2147483647 &&
      !isNaN(value) &&
      isFinite(value)
    );
  }

  equals(other: ZOrder): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  isAbove(other: ZOrder): boolean {
    if (!other) return false;
    return this._value > other._value;
  }

  static getTopLayer(): ZOrder {
    return new ZOrder(2147483647);
  }
}
