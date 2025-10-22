import { CanvasManagementError } from '../errors/canvas-management.error';

export class Size {
  private readonly _width: number;
  private readonly _height: number;

  constructor(width: number, height: number) {
    // 기본 검증
    if (!this.isValid(width, height)) {
      throw new CanvasManagementError('INVALID_SIZE', 'Invalid size values');
    }
    this._width = width;
    this._height = height;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  private isValid(width: number, height: number): boolean {
    return (
      width >= 1 &&
      width <= 10000 &&
      height >= 1 &&
      height <= 10000 &&
      !isNaN(width) &&
      !isNaN(height) &&
      isFinite(width) &&
      isFinite(height)
    );
  }

  equals(other: Size): boolean {
    if (!other) return false;

    return this._width === other._width && this._height === other._height;
  }

  resize(newWidth: number, newHeight: number): Size {
    return new Size(newWidth, newHeight);
  }

  getArea(): number {
    return this._width * this._height;
  }
}
