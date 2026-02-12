import { describe, it, expect } from 'vitest';
import { AIResponse } from '../ai-response.vo';
import { EventManagementError } from '../../errors/event-management.error';

describe('AIResponse Value Object', () => {
  describe('생성자', () => {
    it('유효한 AI 응답으로 생성되어야 한다', () => {
      const content = '코드를 리팩터링했습니다.';
      const response = new AIResponse(content);
      expect(response.value).toBe(content);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new AIResponse('')).toThrow(EventManagementError);
      expect(() => new AIResponse('')).toThrow('AI response cannot be empty');
    });

    it('공백만 있는 문자열에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new AIResponse('   ')).toThrow(EventManagementError);
    });
  });

  describe('equals', () => {
    it('동일한 응답은 같다고 판단되어야 한다', () => {
      const content = 'Response content';
      const response1 = new AIResponse(content);
      const response2 = new AIResponse(content);
      expect(response1.equals(response2)).toBe(true);
    });
  });

  describe('getLength', () => {
    it('응답 내용의 길이를 반환해야 한다', () => {
      const response = new AIResponse('Hello, Human!');
      expect(response.getLength()).toBe(13);
    });
  });
});
