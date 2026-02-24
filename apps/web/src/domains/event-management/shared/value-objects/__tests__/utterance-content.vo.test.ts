import { describe, it, expect } from 'vitest';
import { UtteranceContent } from '../utterance-content.vo';
import { EventManagementError } from '../../errors/event-management.error';

describe('UtteranceContent Value Object', () => {
  describe('생성자', () => {
    it('유효한 발화 내용으로 생성되어야 한다', () => {
      const content = '이 코드를 리팩터해줘';
      const utterance = new UtteranceContent(content);
      expect(utterance.value).toBe(content);
    });

    it('빈 문자열에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new UtteranceContent('')).toThrow(EventManagementError);
      expect(() => new UtteranceContent('')).toThrow('Utterance content cannot be empty');
    });

    it('공백만 있는 문자열에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new UtteranceContent('   ')).toThrow(EventManagementError);
    });
  });

  describe('equals', () => {
    it('동일한 내용은 같다고 판단되어야 한다', () => {
      const content = 'Hello, AI!';
      const utterance1 = new UtteranceContent(content);
      const utterance2 = new UtteranceContent(content);
      expect(utterance1.equals(utterance2)).toBe(true);
    });
  });

  describe('getLength', () => {
    it('발화 내용의 길이를 반환해야 한다', () => {
      const utterance = new UtteranceContent('Hello, AI!');
      expect(utterance.getLength()).toBe(10);
    });
  });

  describe('getTrimmed', () => {
    it('앞뒤 공백이 제거된 내용을 반환해야 한다', () => {
      const utterance = new UtteranceContent('  Hello, AI!  ');
      expect(utterance.getTrimmed()).toBe('Hello, AI!');
    });
  });
});
