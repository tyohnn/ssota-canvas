import { ViewportId } from '../value-objects/viewport-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

/**
 * Viewport Entity
 * 사용자별 캔버스 뷰포트 상태를 표현
 */
export class Viewport {
  constructor(
    public readonly id: ViewportId,
    public readonly pageId: PageId,
    public readonly userId: UserId,
    public zoomLevel: number,
    public centerX: number,
    public centerY: number,
    public lastSaved: Date | null = null,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  /**
   * 뷰포트 상태 업데이트
   */
  updateViewport(zoomLevel?: number, centerX?: number, centerY?: number): void {
    if (zoomLevel !== undefined) {
      // Zoom level 범위 검증 (0.1 ~ 5.0)
      if (zoomLevel < 0.1 || zoomLevel > 5.0) {
        throw new Error('Zoom level must be between 0.1 and 5.0');
      }
      this.zoomLevel = zoomLevel;
    }

    if (centerX !== undefined) {
      // centerX 범위 검증 (-999999 ~ 999999)
      if (centerX < -999999 || centerX > 999999) {
        throw new Error('Center X must be between -999999 and 999999');
      }
      this.centerX = centerX;
    }

    if (centerY !== undefined) {
      // centerY 범위 검증 (-999999 ~ 999999)
      if (centerY < -999999 || centerY > 999999) {
        throw new Error('Center Y must be between -999999 and 999999');
      }
      this.centerY = centerY;
    }

    this.updatedAt = new Date();
  }

  /**
   * 뷰포트 상태 저장
   */
  saveState(): void {
    this.lastSaved = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 뷰포트 상태 복원
   */
  restoreState(zoomLevel: number, centerX: number, centerY: number): void {
    this.updateViewport(zoomLevel, centerX, centerY);
  }
}
