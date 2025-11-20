import { describe, it, expect } from 'vitest';
import { ToolCallResult } from '../tool-call-result.vo';
import { AIManagementError } from '../../errors/ai-management.error';

describe('ToolCallResult Value Object', () => {
  describe('생성자', () => {
    it('유효한 툴 호출 결과로 생성되어야 한다', () => {
      // Given
      const result = { success: true, blockId: 'block-123' };
      const stringified = JSON.stringify(result);

      // When
      const toolCallResult = new ToolCallResult(stringified);

      // Then
      expect(toolCallResult.value).toBe(stringified);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new ToolCallResult(emptyString)).toThrow(AIManagementError);
      expect(() => new ToolCallResult(emptyString)).toThrow('Tool call result cannot be empty');
    });

    it('공백만 있는 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const whitespaceString = '   ';

      // When & Then
      expect(() => new ToolCallResult(whitespaceString)).toThrow(AIManagementError);
    });
  });

  describe('equals', () => {
    it('동일한 결과는 같다고 판단되어야 한다', () => {
      // Given
      const result = JSON.stringify({ success: true });
      const toolCallResult1 = new ToolCallResult(result);
      const toolCallResult2 = new ToolCallResult(result);

      // When & Then
      expect(toolCallResult1.equals(toolCallResult2)).toBe(true);
    });

    it('다른 결과는 다르다고 판단되어야 한다', () => {
      // Given
      const toolCallResult1 = new ToolCallResult(JSON.stringify({ success: true }));
      const toolCallResult2 = new ToolCallResult(JSON.stringify({ success: false }));

      // When & Then
      expect(toolCallResult1.equals(toolCallResult2)).toBe(false);
    });
  });

  describe('parseJSON', () => {
    it('유효한 JSON을 파싱해야 한다', () => {
      // Given
      const result = { success: true, data: { blockId: 'block-123' } };
      const toolCallResult = new ToolCallResult(JSON.stringify(result));

      // When
      const parsed = toolCallResult.parseJSON();

      // Then
      expect(parsed).toEqual(result);
    });

    it('잘못된 JSON에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidJson = '{ invalid json }';
      const toolCallResult = new ToolCallResult(invalidJson);

      // When & Then
      expect(() => toolCallResult.parseJSON()).toThrow(AIManagementError);
    });
  });

  describe('getLength', () => {
    it('결과 내용의 길이를 반환해야 한다', () => {
      // Given
      const result = JSON.stringify({ success: true });
      const toolCallResult = new ToolCallResult(result);

      // When
      const length = toolCallResult.getLength();

      // Then
      expect(length).toBe(result.length);
    });
  });
});

