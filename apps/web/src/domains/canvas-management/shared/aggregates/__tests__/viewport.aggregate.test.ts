import { describe, it, expect, beforeEach } from 'vitest';
import { ViewportAggregate } from '../viewport.aggregate';
import { ViewportId } from '../../value-objects/viewport-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

describe('ViewportAggregate', () => {
  let viewportId: ViewportId;
  let pageId: PageId;
  let userId: UserId;

  beforeEach(() => {
    viewportId = new ViewportId('550e8400-e29b-41d4-a716-446655440000');
    pageId = new PageId('550e8400-e29b-41d4-a716-446655440001');
    userId = new UserId('550e8400-e29b-41d4-a716-446655440002');
  });

  describe('createViewport', () => {
    it('기본값으로 Viewport를 생성할 수 있어야 한다', () => {
      // When
      const aggregate = ViewportAggregate.createViewport(
        viewportId,
        pageId,
        userId
      );

      // Then
      expect(aggregate.viewport.id).toBe(viewportId);
      expect(aggregate.viewport.pageId).toBe(pageId);
      expect(aggregate.viewport.userId).toBe(userId);
      expect(aggregate.viewport.zoomLevel).toBe(1.0);
      expect(aggregate.viewport.centerX).toBe(0);
      expect(aggregate.viewport.centerY).toBe(0);
    });

    it('커스텀 값으로 Viewport를 생성할 수 있어야 한다', () => {
      // Given
      const zoomLevel = 2.0;
      const centerX = 100;
      const centerY = 200;

      // When
      const aggregate = ViewportAggregate.createViewport(
        viewportId,
        pageId,
        userId,
        zoomLevel,
        centerX,
        centerY
      );

      // Then
      expect(aggregate.viewport.zoomLevel).toBe(zoomLevel);
      expect(aggregate.viewport.centerX).toBe(centerX);
      expect(aggregate.viewport.centerY).toBe(centerY);
    });
  });

  describe('updateViewportState', () => {
    it('뷰포트 상태를 업데이트할 수 있어야 한다', () => {
      // Given
      const aggregate = ViewportAggregate.createViewport(
        viewportId,
        pageId,
        userId
      );
      const newZoomLevel = 1.5;
      const newCenterX = 50;
      const newCenterY = 75;

      // When
      aggregate.updateViewportState(newZoomLevel, newCenterX, newCenterY);

      // Then
      expect(aggregate.viewport.zoomLevel).toBe(newZoomLevel);
      expect(aggregate.viewport.centerX).toBe(newCenterX);
      expect(aggregate.viewport.centerY).toBe(newCenterY);
    });
  });

  describe('saveViewportState', () => {
    it('뷰포트 상태를 저장할 수 있어야 한다', () => {
      // Given
      const aggregate = ViewportAggregate.createViewport(
        viewportId,
        pageId,
        userId
      );
      const beforeLastSaved = aggregate.viewport.lastSaved;

      // When
      aggregate.saveViewportState();

      // Then
      expect(aggregate.viewport.lastSaved).not.toBe(beforeLastSaved);
      expect(aggregate.viewport.lastSaved).toBeInstanceOf(Date);
    });
  });

  describe('getEvents', () => {
    it('도메인 이벤트를 조회할 수 있어야 한다', () => {
      // Given
      const aggregate = ViewportAggregate.createViewport(
        viewportId,
        pageId,
        userId
      );

      // When
      const events = aggregate.getEvents();

      // Then
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('clearEvents', () => {
    it('도메인 이벤트를 초기화할 수 있어야 한다', () => {
      // Given
      const aggregate = ViewportAggregate.createViewport(
        viewportId,
        pageId,
        userId
      );

      // When
      aggregate.clearEvents();
      const events = aggregate.getEvents();

      // Then
      expect(events).toHaveLength(0);
    });
  });
});
