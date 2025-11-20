import { describe, it, expect } from 'vitest';
import { AIResponse } from '../ai-response.vo';
import { AIManagementError } from '../../errors/ai-management.error';

describe('AIResponse Value Object', () => {
  describe('생성자', () => {
    it('유효한 AI 응답으로 생성되어야 한다', () => {
      // Given
      const content = '코드를 리팩터링했습니다.';

      // When
      const response = new AIResponse(content);

      // Then
      expect(response.value).toBe(content);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new AIResponse(emptyString)).toThrow(AIManagementError);
      expect(() => new AIResponse(emptyString)).toThrow('AI response cannot be empty');
    });

    it('공백만 있는 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const whitespaceString = '   ';

      // When & Then
      expect(() => new AIResponse(whitespaceString)).toThrow(AIManagementError);
    });

    it('매우 긴 응답도 허용해야 한다', () => {
      // Given
      const longResponse = 'A'.repeat(50000); // 50,000자

      // When
      const response = new AIResponse(longResponse);

      // Then
      expect(response.value).toBe(longResponse);
      expect(response.value.length).toBe(50000);
    });
  });

  describe('equals', () => {
    it('동일한 응답은 같다고 판단되어야 한다', () => {
      // Given
      const content = 'Response content';
      const response1 = new AIResponse(content);
      const response2 = new AIResponse(content);

      // When & Then
      expect(response1.equals(response2)).toBe(true);
    });

    it('다른 응답은 다르다고 판단되어야 한다', () => {
      // Given
      const response1 = new AIResponse('Response 1');
      const response2 = new AIResponse('Response 2');

      // When & Then
      expect(response1.equals(response2)).toBe(false);
    });
  });

  describe('getLength', () => {
    it('응답 내용의 길이를 반환해야 한다', () => {
      // Given
      const response = new AIResponse('Hello, Human!');

      // When
      const length = response.getLength();

      // Then
      expect(length).toBe(13);
    });
  });

  describe('getTrimmed', () => {
    it('앞뒤 공백이 제거된 내용을 반환해야 한다', () => {
      // Given
      const response = new AIResponse('  Hello  ');

      // When
      const trimmed = response.getTrimmed();

      // Then
      expect(trimmed).toBe('Hello');
    });
  });
});

