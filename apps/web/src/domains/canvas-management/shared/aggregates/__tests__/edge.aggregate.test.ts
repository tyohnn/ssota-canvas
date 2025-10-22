import { describe, it, expect, beforeEach } from 'vitest';
import { EdgeAggregate } from '../edge.aggregate';
import { EdgeId } from '../../value-objects/edge-id.vo';
import { EdgeType } from '../../value-objects/edge-type.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import {
  EdgeCreatedEvent,
  EdgeTypeChangedEvent,
  EdgeLabelChangedEvent,
  EdgeStyleChangedEvent,
  EdgeDeletedEvent,
} from '../../events';

describe('EdgeAggregate', () => {
  let edgeId: EdgeId;
  let pageId: PageId;
  let sourceBlockId: BlockId;
  let targetBlockId: BlockId;

  beforeEach(() => {
    edgeId = new EdgeId('550e8400-e29b-41d4-a716-446655440000');
    pageId = new PageId('550e8400-e29b-41d4-a716-446655440001');
    sourceBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440002');
    targetBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440003');
  });

  describe('createEdge', () => {
    it('유효한 파라미터로 새로운 Edge를 생성할 수 있어야 한다', () => {
      // Given
      const edgeType = EdgeType.straight();

      // When
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId,
        edgeType
      );

      // Then
      expect(aggregate.edge.id).toBe(edgeId);
      expect(aggregate.edge.pageId).toBe(pageId);
      expect(aggregate.edge.sourceBlockId).toBe(sourceBlockId);
      expect(aggregate.edge.targetBlockId).toBe(targetBlockId);
      expect(aggregate.edge.edgeType.equals(edgeType)).toBe(true);
    });

    it('기본 edgeType으로 Edge를 생성할 수 있어야 한다', () => {
      // When
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
      );

      // Then
      expect(aggregate.edge.edgeType.isDefault()).toBe(true);
    });

    it('EdgeCreated 이벤트를 발행해야 한다', () => {
      // When
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
      );

      // Then
      const events = aggregate.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(EdgeCreatedEvent);
      expect((events[0] as EdgeCreatedEvent).data.edgeId).toBe(edgeId);
    });

    it('self-loop를 허용해야 한다 (같은 블럭 간 연결)', () => {
      // Given
      const sameBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440002');

      // When
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sameBlockId,
        sameBlockId
      );

      // Then
      expect(aggregate.edge.sourceBlockId.equals(sameBlockId)).toBe(true);
      expect(aggregate.edge.targetBlockId.equals(sameBlockId)).toBe(true);
      expect(aggregate.edge.isSelfLoop()).toBe(true);
    });
  });

  describe('updateEdgeType', () => {
    it('엣지 타입을 업데이트할 수 있어야 한다', () => {
      // Given
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId,
        EdgeType.default()
      );
      const newType = EdgeType.step();

      // When
      aggregate.clearEvents(); // 생성 이벤트 클리어
      aggregate.updateEdgeType(newType);

      // Then
      expect(aggregate.edge.edgeType.equals(newType)).toBe(true);
    });

    it('EdgeTypeChanged 이벤트를 발행해야 한다', () => {
      // Given
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
      );
      aggregate.clearEvents(); // 생성 이벤트 클리어
      const newType = EdgeType.straight();

      // When
      aggregate.updateEdgeType(newType);

      // Then
      const events = aggregate.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(EdgeTypeChangedEvent);
      expect((events[0] as EdgeTypeChangedEvent).data.newType.equals(newType)).toBe(true);
    });
  });

  describe('updateEdgeLabel', () => {
    it('엣지 레이블을 업데이트할 수 있어야 한다', () => {
      // Given
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
      );
      const newLabel = 'updated label';

      // When
      aggregate.clearEvents(); // 생성 이벤트 클리어
      aggregate.updateEdgeLabel(newLabel);

      // Then
      expect(aggregate.edge.edgeLabel).toBe(newLabel);
    });

    it('EdgeLabelChanged 이벤트를 발행해야 한다', () => {
      // Given
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
      );
      aggregate.clearEvents();
      const newLabel = 'new label';

      // When
      aggregate.updateEdgeLabel(newLabel);

      // Then
      const events = aggregate.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(EdgeLabelChangedEvent);
      expect((events[0] as EdgeLabelChangedEvent).data.newLabel).toBe(newLabel);
    });
  });

  describe('updateEdgeStyle', () => {
    it('엣지 스타일을 업데이트할 수 있어야 한다', () => {
      // Given
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
      );
      const newColor = '#FF0000';
      const newThickness = 5;

      // When
      aggregate.clearEvents(); // 생성 이벤트 클리어
      aggregate.updateEdgeStyle(newColor, newThickness);

      // Then
      expect(aggregate.edge.edgeStyle.color).toBe(newColor);
      expect(aggregate.edge.edgeStyle.thickness).toBe(newThickness);
    });

    it('EdgeStyleChanged 이벤트를 발행해야 한다', () => {
      // Given
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
      );
      aggregate.clearEvents();
      const newColor = '#00FF00';
      const newThickness = 3;

      // When
      aggregate.updateEdgeStyle(newColor, newThickness);

      // Then
      const events = aggregate.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(EdgeStyleChangedEvent);
      expect((events[0] as EdgeStyleChangedEvent).data.color).toBe(newColor);
      expect((events[0] as EdgeStyleChangedEvent).data.thickness).toBe(newThickness);
    });
  });

  describe('deleteEdge', () => {
    it('EdgeDeleted 이벤트를 발행해야 한다', () => {
      // Given
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
      );
      aggregate.clearEvents();

      // When
      aggregate.deleteEdge();

      // Then
      const events = aggregate.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(EdgeDeletedEvent);
      expect((events[0] as EdgeDeletedEvent).data.edgeId).toBe(edgeId);
    });
  });

  describe('getEvents', () => {
    it('도메인 이벤트를 조회할 수 있어야 한다', () => {
      // Given
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
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
      const aggregate = EdgeAggregate.createEdge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId
      );

      // When
      aggregate.clearEvents();
      const events = aggregate.getEvents();

      // Then
      expect(events).toHaveLength(0);
    });
  });
});
