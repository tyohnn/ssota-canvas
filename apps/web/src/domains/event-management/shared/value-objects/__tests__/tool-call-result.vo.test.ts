import { describe, it, expect } from 'vitest';
import { ToolCallResult } from '../tool-call-result.vo';
import { EventManagementError } from '../../errors/event-management.error';

describe('ToolCallResult Value Object', () => {
  describe('생성자', () => {
    it('유효한 툴 호출 결과로 생성되어야 한다', () => {
      const result = { success: true, blockId: 'block-123' };
      const stringified = JSON.stringify(result);
      const toolCallResult = new ToolCallResult(stringified);
      expect(toolCallResult.value).toBe(stringified);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new ToolCallResult('')).toThrow(EventManagementError);
      expect(() => new ToolCallResult('')).toThrow('Tool call result cannot be empty');
    });

    it('공백만 있는 문자열에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new ToolCallResult('   ')).toThrow(EventManagementError);
    });
  });

  describe('parseJSON', () => {
    it('유효한 JSON을 파싱해야 한다', () => {
      const result = { success: true, data: { blockId: 'block-123' } };
      const toolCallResult = new ToolCallResult(JSON.stringify(result));
      expect(toolCallResult.parseJSON()).toEqual(result);
    });

    it('잘못된 JSON에 대해 예외를 발생시켜야 한다', () => {
      const invalidJson = '{ invalid json }';
      const toolCallResult = new ToolCallResult(invalidJson);
      expect(() => toolCallResult.parseJSON()).toThrow(EventManagementError);
    });
  });
});
