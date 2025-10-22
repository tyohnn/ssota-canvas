import { describe, it, expect, beforeEach } from 'vitest';
import { Edge } from '../edge.entity';
import { EdgeId } from '../../value-objects/edge-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

describe('Edge Entity', () => {
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

  describe('생성', () => {
    it('모든 필수 속성으로 Edge를 생성할 수 있어야 한다', () => {
      // Given
      const edgeType = 'default';
      const edgeLabel = 'test edge';
      const edgeStyle = {
        color: '#FF0000',
        thickness: 3,
      };

      // When
      const edge = new Edge(
        edgeId,
        pageId,
        sourceBlockId,
        targetBlockId,
        edgeType,
        edgeLabel,
        edgeStyle
      );

      // Then
      expect(edge.id).toBe(edgeId);
      expect(edge.pageId).toBe(pageId);
      expect(edge.sourceBlockId).toBe(sourceBlockId);
      expect(edge.targetBlockId).toBe(targetBlockId);
      expect(edge.edgeType).toBe(edgeType);
      expect(edge.edgeLabel).toBe(edgeLabel);
      expect(edge.edgeStyle).toEqual(edgeStyle);
    });

    it('기본값으로 Edge를 생성할 수 있어야 한다', () => {
      // When
      const edge = new Edge(edgeId, pageId, sourceBlockId, targetBlockId);

      // Then
      expect(edge.edgeType).toBe('default');
      expect(edge.edgeLabel).toBe('');
      expect(edge.edgeStyle.color).toBe('#000000');
      expect(edge.edgeStyle.thickness).toBe(2);
    });
  });

  describe('updateType', () => {
    it('엣지 타입을 업데이트할 수 있어야 한다', () => {
      // Given
      const edge = new Edge(edgeId, pageId, sourceBlockId, targetBlockId, 'default');
      const newType = 'connection';

      // When
      edge.updateType(newType);

      // Then
      expect(edge.edgeType).toBe(newType);
      expect(edge.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateLabel', () => {
    it('엣지 레이블을 업데이트할 수 있어야 한다', () => {
      // Given
      const edge = new Edge(edgeId, pageId, sourceBlockId, targetBlockId);
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
      const edge = new Edge(edgeId, pageId, sourceBlockId, targetBlockId);
      const newColor = '#00FF00';

      // When
      edge.updateStyle(newColor);

      // Then
      expect(edge.edgeStyle.color).toBe(newColor);
      expect(edge.edgeStyle.thickness).toBe(2); // 기존값 유지
      expect(edge.updatedAt).toBeInstanceOf(Date);
    });

    it('엣지 두께를 업데이트할 수 있어야 한다', () => {
      // Given
      const edge = new Edge(edgeId, pageId, sourceBlockId, targetBlockId);
      const newThickness = 5;

      // When
      edge.updateStyle(undefined, newThickness);

      // Then
      expect(edge.edgeStyle.thickness).toBe(newThickness);
      expect(edge.edgeStyle.color).toBe('#000000'); // 기존값 유지
      expect(edge.updatedAt).toBeInstanceOf(Date);
    });

    it('색상과 두께를 동시에 업데이트할 수 있어야 한다', () => {
      // Given
      const edge = new Edge(edgeId, pageId, sourceBlockId, targetBlockId);
      const newColor = '#0000FF';
      const newThickness = 4;

      // When
      edge.updateStyle(newColor, newThickness);

      // Then
      expect(edge.edgeStyle.color).toBe(newColor);
      expect(edge.edgeStyle.thickness).toBe(newThickness);
      expect(edge.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('isConnectedTo', () => {
    it('소스 블록과 연결되어 있는지 확인할 수 있어야 한다', () => {
      // Given
      const edge = new Edge(edgeId, pageId, sourceBlockId, targetBlockId);
      const otherBlockId = new BlockId('550e8400-e29b-41d4-a716-446655440004');

      // When & Then
      expect(edge.isConnectedTo(sourceBlockId)).toBe(true);
      expect(edge.isConnectedTo(targetBlockId)).toBe(true);
      expect(edge.isConnectedTo(otherBlockId)).toBe(false);
    });
  });
});
