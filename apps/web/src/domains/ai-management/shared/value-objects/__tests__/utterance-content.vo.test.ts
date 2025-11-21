import { describe, it, expect } from 'vitest';
import { UtteranceContent } from '../utterance-content.vo';
import { AIManagementError } from '../../errors/ai-management.error';

describe('UtteranceContent Value Object', () => {
  describe('생성자', () => {
    it('유효한 발화 내용으로 생성되어야 한다', () => {
      // Given
      const content = '이 코드를 리팩터해줘';

      // When
      const utterance = new UtteranceContent(content);

      // Then
      expect(utterance.value).toBe(content);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new UtteranceContent(emptyString)).toThrow(AIManagementError);
      expect(() => new UtteranceContent(emptyString)).toThrow('Utterance content cannot be empty');
    });

    it('공백만 있는 문자열에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const whitespaceString = '   ';

      // When & Then
      expect(() => new UtteranceContent(whitespaceString)).toThrow(AIManagementError);
    });

    it('매우 긴 발화 내용도 허용해야 한다', () => {
      // Given
      const longContent = 'A'.repeat(10000); // 10,000자

      // When
      const utterance = new UtteranceContent(longContent);

      // Then
      expect(utterance.value).toBe(longContent);
      expect(utterance.value.length).toBe(10000);
    });
  });

  describe('equals', () => {
    it('동일한 내용은 같다고 판단되어야 한다', () => {
      // Given
      const content = 'Hello, AI!';
      const utterance1 = new UtteranceContent(content);
      const utterance2 = new UtteranceContent(content);

      // When & Then
      expect(utterance1.equals(utterance2)).toBe(true);
    });

    it('다른 내용은 다르다고 판단되어야 한다', () => {
      // Given
      const utterance1 = new UtteranceContent('Hello');
      const utterance2 = new UtteranceContent('World');

      // When & Then
      expect(utterance1.equals(utterance2)).toBe(false);
    });
  });

  describe('getLength', () => {
    it('발화 내용의 길이를 반환해야 한다', () => {
      // Given
      const content = 'Hello, AI!';
      const utterance = new UtteranceContent(content);

      // When
      const length = utterance.getLength();

      // Then
      expect(length).toBe(10);
    });
  });

  describe('isEmpty', () => {
    it('내용이 있으면 false를 반환해야 한다', () => {
      // Given
      const utterance = new UtteranceContent('Hello');

      // When & Then
      expect(utterance.isEmpty()).toBe(false);
    });
  });

  describe('getTrimmed', () => {
    it('앞뒤 공백이 제거된 내용을 반환해야 한다', () => {
      // Given
      const utterance = new UtteranceContent('  Hello, AI!  ');

      // When
      const trimmed = utterance.getTrimmed();

      // Then
      expect(trimmed).toBe('Hello, AI!');
    });
  });

  describe('toString', () => {
    it('발화 내용 문자열을 반환해야 한다', () => {
      // Given
      const content = 'Test utterance';
      const utterance = new UtteranceContent(content);

      // When
      const result = utterance.toString();

      // Then
      expect(result).toBe(content);
    });
  });
});

