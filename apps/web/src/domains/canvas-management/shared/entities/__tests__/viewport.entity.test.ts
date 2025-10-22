import { describe, it, expect, beforeEach } from 'vitest';
import { Viewport } from '../viewport.entity';
import { ViewportId } from '../../value-objects/viewport-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

describe('Viewport Entity', () => {
  let viewportId: ViewportId;
  let pageId: PageId;
  let userId: UserId;

  beforeEach(() => {
    viewportId = new ViewportId('550e8400-e29b-41d4-a716-446655440000');
    pageId = new PageId('550e8400-e29b-41d4-a716-446655440001');
    userId = new UserId('550e8400-e29b-41d4-a716-446655440002');
  });

  describe('생성', () => {
    it('모든 필수 속성으로 Viewport를 생성할 수 있어야 한다', () => {
      // Given
      const zoomLevel = 1.5;
      const centerX = 100;
      const centerY = 200;
      const lastSaved = new Date();

      // When
      const viewport = new Viewport(
        viewportId,
        pageId,
        userId,
        zoomLevel,
        centerX,
        centerY,
        lastSaved
      );

      // Then
      expect(viewport.id).toBe(viewportId);
      expect(viewport.pageId).toBe(pageId);
      expect(viewport.userId).toBe(userId);
      expect(viewport.zoomLevel).toBe(zoomLevel);
      expect(viewport.centerX).toBe(centerX);
      expect(viewport.centerY).toBe(centerY);
      expect(viewport.lastSaved).toBe(lastSaved);
    });
  });

  describe('updateViewport', () => {
    it('줌 레벨만 업데이트할 수 있어야 한다', () => {
      // Given
      const viewport = new Viewport(viewportId, pageId, userId, 1.0, 0, 0);
      const newZoomLevel = 2.0;

      // When
      viewport.updateViewport(newZoomLevel);

      // Then
      expect(viewport.zoomLevel).toBe(newZoomLevel);
      expect(viewport.centerX).toBe(0); // 기존값 유지
      expect(viewport.centerY).toBe(0); // 기존값 유지
      expect(viewport.updatedAt).toBeInstanceOf(Date);
    });

    it('중심 좌표만 업데이트할 수 있어야 한다', () => {
      // Given
      const viewport = new Viewport(viewportId, pageId, userId, 1.0, 0, 0);
      const newCenterX = 50;
      const newCenterY = 100;

      // When
      viewport.updateViewport(undefined, newCenterX, newCenterY);

      // Then
      expect(viewport.zoomLevel).toBe(1.0); // 기존값 유지
      expect(viewport.centerX).toBe(newCenterX);
      expect(viewport.centerY).toBe(newCenterY);
      expect(viewport.updatedAt).toBeInstanceOf(Date);
    });

    it('잘못된 줌 레벨로 에러를 발생시켜야 한다', () => {
      // Given
      const viewport = new Viewport(viewportId, pageId, userId, 1.0, 0, 0);

      // When & Then
      expect(() => viewport.updateViewport(0.05)).toThrow('Zoom level must be between 0.1 and 5.0');
      expect(() => viewport.updateViewport(6.0)).toThrow('Zoom level must be between 0.1 and 5.0');
    });

    it('잘못된 중심 좌표로 에러를 발생시켜야 한다', () => {
      // Given
      const viewport = new Viewport(viewportId, pageId, userId, 1.0, 0, 0);

      // When & Then
      expect(() => viewport.updateViewport(undefined, -1000000)).toThrow('Center X must be between -999999 and 999999');
      expect(() => viewport.updateViewport(undefined, undefined, 1000000)).toThrow('Center Y must be between -999999 and 999999');
    });
  });

  describe('saveState', () => {
    it('뷰포트 상태를 저장할 수 있어야 한다', () => {
      // Given
      const viewport = new Viewport(viewportId, pageId, userId, 1.0, 0, 0);
      const beforeLastSaved = viewport.lastSaved;

      // When
      viewport.saveState();

      // Then
      expect(viewport.lastSaved).not.toBe(beforeLastSaved);
      expect(viewport.lastSaved).toBeInstanceOf(Date);
      expect(viewport.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('restoreState', () => {
    it('뷰포트 상태를 복원할 수 있어야 한다', () => {
      // Given
      const viewport = new Viewport(viewportId, pageId, userId, 1.0, 0, 0);
      const newZoomLevel = 2.5;
      const newCenterX = 150;
      const newCenterY = 300;

      // When
      viewport.restoreState(newZoomLevel, newCenterX, newCenterY);

      // Then
      expect(viewport.zoomLevel).toBe(newZoomLevel);
      expect(viewport.centerX).toBe(newCenterX);
      expect(viewport.centerY).toBe(newCenterY);
      expect(viewport.updatedAt).toBeInstanceOf(Date);
    });
  });
});
