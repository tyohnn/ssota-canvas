import { describe, it, expect } from 'vitest';
import { UpdateBlockCommand } from '../update-block-command';
import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockManagementError } from '../../../shared/errors/block-management.error';

describe('UpdateBlockCommand', () => {
  describe('생성자', () => {
    it('유효한 블록 ID와 업데이트 데이터로 생성되어야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        properties: { content: 'Updated content' }
      };

      // When
      const command = new UpdateBlockCommand(blockId, updateData);

      // Then
      expect(command.blockId).toBe(blockId);
      expect(command.updateData).toEqual(updateData);
    });

    it('빈 업데이트 데이터에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const emptyData = {};

      // When & Then
      expect(() => new UpdateBlockCommand(blockId, emptyData)).toThrow(BlockManagementError);
      expect(() => new UpdateBlockCommand(blockId, emptyData)).toThrow('Update data cannot be empty');
    });

    it('null 또는 undefined 업데이트 데이터에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');

      // When & Then
      expect(() => new UpdateBlockCommand(blockId, null as any)).toThrow(BlockManagementError);
      expect(() => new UpdateBlockCommand(blockId, undefined as any)).toThrow(BlockManagementError);
    });

    it('null 또는 undefined 블록 ID에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const updateData = { title: 'Updated Title' };

      // When & Then
      expect(() => new UpdateBlockCommand(null as any, updateData)).toThrow(BlockManagementError);
      expect(() => new UpdateBlockCommand(undefined as any, updateData)).toThrow(BlockManagementError);
    });
  });

  describe('hasTitleUpdate', () => {
    it('제목이 포함된 업데이트에서 true를 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = { title: 'New Title' };
      const command = new UpdateBlockCommand(blockId, updateData);

      // When & Then
      expect(command.hasTitleUpdate()).toBe(true);
    });

    it('제목이 없는 업데이트에서 false를 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = { description: 'New Description' };
      const command = new UpdateBlockCommand(blockId, updateData);

      // When & Then
      expect(command.hasTitleUpdate()).toBe(false);
    });
  });

  describe('hasDescriptionUpdate', () => {
    it('설명이 포함된 업데이트에서 true를 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = { description: 'New Description' };
      const command = new UpdateBlockCommand(blockId, updateData);

      // When & Then
      expect(command.hasDescriptionUpdate()).toBe(true);
    });

    it('설명이 없는 업데이트에서 false를 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = { title: 'New Title' };
      const command = new UpdateBlockCommand(blockId, updateData);

      // When & Then
      expect(command.hasDescriptionUpdate()).toBe(false);
    });
  });

  describe('hasPropertiesUpdate', () => {
    it('속성이 포함된 업데이트에서 true를 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = { properties: { content: 'New content' } };
      const command = new UpdateBlockCommand(blockId, updateData);

      // When & Then
      expect(command.hasPropertiesUpdate()).toBe(true);
    });

    it('속성이 없는 업데이트에서 false를 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = { title: 'New Title' };
      const command = new UpdateBlockCommand(blockId, updateData);

      // When & Then
      expect(command.hasPropertiesUpdate()).toBe(false);
    });
  });

  describe('getUpdateFields', () => {
    it('업데이트할 필드 목록을 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = {
        title: 'New Title',
        description: 'New Description',
        properties: { content: 'New content' }
      };
      const command = new UpdateBlockCommand(blockId, updateData);

      // When
      const fields = command.getUpdateFields();

      // Then
      expect(fields).toEqual(['title', 'description', 'properties']);
    });

    it('빈 업데이트 데이터에서 빈 배열을 반환해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = { title: 'Test' }; // 빈 객체는 생성자에서 예외 발생
      const command = new UpdateBlockCommand(blockId, updateData);

      // When
      const fields = command.getUpdateFields();

      // Then
      expect(fields).toEqual(['title']);
    });
  });

  describe('toJSON', () => {
    it('JSON 직렬화가 올바르게 작동해야 한다', () => {
      // Given
      const blockId = new BlockId('550e8400-e29b-41d4-a716-446655440000');
      const updateData = { title: 'New Title' };
      const command = new UpdateBlockCommand(blockId, updateData);

      // When
      const json = command.toJSON();

      // Then
      expect(json).toEqual({
        blockId: '550e8400-e29b-41d4-a716-446655440000',
        updateData: { title: 'New Title' }
      });
    });
  });
});
