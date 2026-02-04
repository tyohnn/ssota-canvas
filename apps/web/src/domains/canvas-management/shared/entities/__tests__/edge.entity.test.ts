import { describe, it, expect, beforeEach } from 'vitest';
import { Edge } from '../edge.entity';
import { EdgeId } from '../../value-objects/edge-id.vo';
import { EdgeShape } from '../../value-objects/edge-shape.vo';
import { EdgeStyle } from '../../value-objects/edge-style.vo';
import { EdgeHandle } from '../../value-objects/edge-handle.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockMountId } from '../../value-objects/block-mount-id.vo';

describe('Edge Entity', () => {
  let edgeId: EdgeId;
  let pageId: PageId;
  let sourceBlockMountId: BlockMountId;
  let targetBlockMountId: BlockMountId;

  beforeEach(() => {
    edgeId = new EdgeId('550e8400-e29b-41d4-a716-446655440000');
    pageId = new PageId('550e8400-e29b-41d4-a716-446655440001');
    sourceBlockMountId = new BlockMountId('550e8400-e29b-41d4-a716-446655440002');
    targetBlockMountId = new BlockMountId('550e8400-e29b-41d4-a716-446655440003');
  });

  describe('생성', () => {
    it('모든 필수 속성으로 Edge를 생성할 수 있어야 한다', () => {
      // Given
      const sourceHandle = EdgeHandle.right();
      const targetHandle = EdgeHandle.left();
      const edgeShape = EdgeShape.default();
      const edgeLabel = 'test edge';
      const edgeStyle = new EdgeStyle('#FF0000', 3);

      // When
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        sourceHandle,
        targetHandle,
        edgeShape,
        edgeLabel,
        edgeStyle
      );

      // Then
      expect(edge.id).toBe(edgeId);
      expect(edge.pageId).toBe(pageId);
      expect(edge.sourceBlockMountId).toBe(sourceBlockMountId);
      expect(edge.targetBlockMountId).toBe(targetBlockMountId);
      expect(edge.edgeShape.equals(edgeShape)).toBe(true);
      expect(edge.edgeLabel).toBe(edgeLabel);
      expect(edge.edgeStyle.equals(edgeStyle)).toBe(true);
    });

    it('기본값으로 Edge를 생성할 수 있어야 한다', () => {
      // When
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        EdgeHandle.right(),
        EdgeHandle.left()
      );

      // Then
      expect(edge.edgeShape.isDefault()).toBe(true);
      expect(edge.edgeLabel).toBe('');
      expect(edge.edgeStyle.equals(EdgeStyle.default())).toBe(true);
      expect(edge.edgeStyle.color).toBe('#9ca3af');
      expect(edge.edgeStyle.thickness).toBe(2);
    });

    it('self-loop를 허용해야 한다 (같은 블럭 마운트 간 연결)', () => {
      // Given
      const sameBlockMountId = new BlockMountId('550e8400-e29b-41d4-a716-446655440002');

      // When
      const edge = new Edge(
        edgeId,
        pageId,
        sameBlockMountId,
        sameBlockMountId,
        EdgeHandle.right(),
        EdgeHandle.left()
      );

      // Then
      expect(edge.sourceBlockMountId.equals(sameBlockMountId)).toBe(true);
      expect(edge.targetBlockMountId.equals(sameBlockMountId)).toBe(true);
      expect(edge.isSelfLoop()).toBe(true);
    });

    it('다른 블럭 마운트 간 연결은 self-loop가 아니어야 한다', () => {
      // When
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        EdgeHandle.right(),
        EdgeHandle.left()
      );

      // Then
      expect(edge.isSelfLoop()).toBe(false);
    });
  });

  describe('updateShape', () => {
    it('엣지 모양을 업데이트할 수 있어야 한다', () => {
      // Given
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        EdgeHandle.right(),
        EdgeHandle.left(),
        EdgeShape.default()
      );
      const newShape = EdgeShape.straight();

      // When
      edge.updateShape(newShape);

      // Then
      expect(edge.edgeShape.equals(newShape)).toBe(true);
      expect(edge.edgeShape.isStraight()).toBe(true);
      expect(edge.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateLabel', () => {
    it('엣지 레이블을 업데이트할 수 있어야 한다', () => {
      // Given
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        EdgeHandle.right(),
        EdgeHandle.left()
      );
      const newLabel = 'updated label';

      // When
      edge.updateLabel(newLabel);

      // Then
      expect(edge.edgeLabel).toBe(newLabel);
      expect(edge.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateStyle', () => {
    it('엣지 색상을 업데이트할 수 있어야 한다', () => {
      // Given
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        EdgeHandle.right(),
        EdgeHandle.left()
      );
      const newStyle = { stroke: '#00FF00' };

      // When
      edge.updateStyle(newStyle);

      // Then
      expect(edge.style.stroke).toBe(newStyle.stroke);
      expect(edge.style.strokeWidth).toBe(2); // 기존값 유지
      expect(edge.updatedAt).toBeInstanceOf(Date);
    });

    it('엣지 두께를 업데이트할 수 있어야 한다', () => {
      // Given (EdgeStyle thickness 허용 범위: 1–3)
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        EdgeHandle.right(),
        EdgeHandle.left()
      );
      const newStyle = { strokeWidth: 3 };

      // When
      edge.updateStyle(newStyle);

      // Then
      expect(edge.style.strokeWidth).toBe(newStyle.strokeWidth);
      expect(edge.style.stroke).toBe('#9ca3af'); // 기존값 유지
      expect(edge.updatedAt).toBeInstanceOf(Date);
    });

    it('색상과 두께를 동시에 업데이트할 수 있어야 한다', () => {
      // Given (EdgeStyle thickness 허용 범위: 1–3)
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        EdgeHandle.right(),
        EdgeHandle.left()
      );
      const newStyle = { stroke: '#0000FF', strokeWidth: 3 };

      // When
      edge.updateStyle(newStyle);

      // Then
      expect(edge.style.stroke).toBe(newStyle.stroke);
      expect(edge.style.strokeWidth).toBe(newStyle.strokeWidth);
      expect(edge.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('isConnectedTo', () => {
    it('소스 블록 마운트와 연결되어 있는지 확인할 수 있어야 한다', () => {
      // Given
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockMountId,
        targetBlockMountId,
        EdgeHandle.right(),
        EdgeHandle.left()
      );
      const otherBlockMountId = new BlockMountId('550e8400-e29b-41d4-a716-446655440004');

      // When & Then
      expect(edge.isConnectedTo(sourceBlockMountId)).toBe(true);
      expect(edge.isConnectedTo(targetBlockMountId)).toBe(true);
      expect(edge.isConnectedTo(otherBlockMountId)).toBe(false);
    });
  });
});
