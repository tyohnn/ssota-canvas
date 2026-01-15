import { describe, it, expect } from 'vitest';
import { VideoId } from '../video-id.vo';
import { YoutubeError } from '../../errors/youtube-app-space.error';

describe('VideoId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      // Given
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';

      // When
      const videoId = new VideoId(validUuid);

      // Then
      expect(videoId.value).toBe(validUuid);
    });

    it('잘못된 UUID 형식에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidUuid = 'invalid-uuid-format';

      // When & Then
      expect(() => new VideoId(invalidUuid)).toThrow(YoutubeError);
      expect(() => new VideoId(invalidUuid)).toThrow('Invalid VideoId format');
    });

    it('빈 문자열은 허용하지 않아야 한다', () => {
      // Given
      const emptyString = '';

      // When & Then
      expect(() => new VideoId(emptyString)).toThrow(YoutubeError);
    });

    it('공백만 있는 문자열은 허용하지 않아야 한다', () => {
      // Given
      const whitespaceString = '   ';

      // When & Then
      expect(() => new VideoId(whitespaceString)).toThrow(YoutubeError);
    });

    it('null/undefined는 허용하지 않아야 한다', () => {
      // When & Then
      expect(() => new VideoId(null as any)).toThrow(YoutubeError);
      expect(() => new VideoId(undefined as any)).toThrow(YoutubeError);
    });

    it('UUID v4 형식이 아닌 경우 예외를 발생시켜야 한다', () => {
      // Given
      const invalidFormats = [
        '550e8400-e29b-41d4-a716', // 너무 짧음
        '550e8400-e29b-41d4-a716-446655440000-extra', // 너무 김
        '550e8400e29b41d4a716446655440000', // 하이픈 없음
        'G50e8400-e29b-41d4-a716-446655440000', // 잘못된 문자
      ];

      // When & Then
      invalidFormats.forEach((invalid) => {
        expect(() => new VideoId(invalid)).toThrow(YoutubeError);
      });
    });
  });

  describe('generate', () => {
    it('새로운 UUID를 생성해야 한다', () => {
      // When
      const videoId1 = VideoId.generate();
      const videoId2 = VideoId.generate();

      // Then
      expect(videoId1).toBeInstanceOf(VideoId);
      expect(videoId2).toBeInstanceOf(VideoId);
      expect(videoId1.value).not.toBe(videoId2.value);
      expect(videoId1.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('생성된 UUID는 유효한 형식이어야 한다', () => {
      // When
      const videoId = VideoId.generate();

      // Then
      expect(videoId.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });
  });

  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다', () => {
      // Given
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id1 = new VideoId(uuid);
      const id2 = new VideoId(uuid);

      // When & Then
      expect(id1.equals(id2)).toBe(true);
    });

    it('다른 ID는 다르다고 판단되어야 한다', () => {
      // Given
      const id1 = new VideoId('550e8400-e29b-41d4-a716-446655440000');
      const id2 = new VideoId('660e8400-e29b-41d4-a716-446655440000');

      // When & Then
      expect(id1.equals(id2)).toBe(false);
    });

    it('null과 비교하면 false를 반환해야 한다', () => {
      // Given
      const id = new VideoId('550e8400-e29b-41d4-a716-446655440000');

      // When & Then
      expect(id.equals(null as any)).toBe(false);
    });

    it('undefined와 비교하면 false를 반환해야 한다', () => {
      // Given
      const id = new VideoId('550e8400-e29b-41d4-a716-446655440000');

      // When & Then
      expect(id.equals(undefined as any)).toBe(false);
    });
  });
});
