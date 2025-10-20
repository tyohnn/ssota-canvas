import { describe, it, expect, beforeEach } from 'vitest';
import { EdgeAggregate } from '../edge.aggregate';
import { EdgeId } from '../../value-objects/edge-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

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
      const edgeType = 'connection';

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
      expect(aggregate.edge.edgeType).toBe(edgeType);
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
      expect(aggregate.edge.edgeType).toBe('default');
    });

    it('같은 블록에 자기 참조하는 Edge 생성 시 에러를 발생시켜야 한다', () => {
      // When & Then
      expect(() => {
        EdgeAggregate.createEdge(
          edgeId,
          pageId,
          sourceBlockId,
          sourceBlockId, // 같은 블록으로 연결 시도
          'self-reference'
        );
      }).toThrow('Edge cannot connect a block to itself');
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
        'default'
      );
      const newType = 'updated-type';

      // When
      aggregate.updateEdgeType(newType);

      // Then
      expect(aggregate.edge.edgeType).toBe(newType);
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
      aggregate.updateEdgeLabel(newLabel);

      // Then
      expect(aggregate.edge.edgeLabel).toBe(newLabel);
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
      aggregate.updateEdgeStyle(newColor, newThickness);

      // Then
      expect(aggregate.edge.edgeStyle.color).toBe(newColor);
      expect(aggregate.edge.edgeStyle.thickness).toBe(newThickness);
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
