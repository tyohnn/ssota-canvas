import { describe, it, expect } from 'vitest';
import { VideoSlug } from '../video-slug.vo';
import { YoutubeError } from '../../errors/youtube-app-space.error';

describe('VideoSlug Value Object', () => {
  describe('생성자', () => {
    it('유효한 YouTube Video ID로 생성되어야 한다', () => {
      // Given
      const validVideoId = 'dQw4w9WgXcQ';

      // When
      const videoSlug = new VideoSlug(validVideoId);

      // Then
      expect(videoSlug.value).toBe(validVideoId);
    });

    it('11자리 영문/숫자/하이픈/언더스코어를 허용해야 한다', () => {
      // Given
      const validIds = [
        'dQw4w9WgXcQ',
        'jNQXAC9IVRw',
        'abc123def45',
        'a-b_c-d-e-f',
        '12345678901',
      ];

      // When & Then
      validIds.forEach((id) => {
        const slug = new VideoSlug(id);
        expect(slug.value).toBe(id);
      });
    });

    it('잘못된 형식에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidIds = [
        'short', // 11자리 미만
        'toolongvideoid123', // 11자리 초과
        'invalid@id', // 특수문자
        'invalid id', // 공백
        '',
        '   ',
      ];

      // When & Then
      invalidIds.forEach((id) => {
        expect(() => new VideoSlug(id)).toThrow(YoutubeError);
      });
    });

    it('null/undefined는 허용하지 않아야 한다', () => {
      // When & Then
      expect(() => new VideoSlug(null as any)).toThrow(YoutubeError);
      expect(() => new VideoSlug(undefined as any)).toThrow(YoutubeError);
    });
  });

  describe('isValid', () => {
    it('유효한 Video ID는 true를 반환해야 한다', () => {
      // Given
      const validId = 'dQw4w9WgXcQ';

      // When & Then
      expect(VideoSlug.isValid(validId)).toBe(true);
    });

    it('잘못된 Video ID는 false를 반환해야 한다', () => {
      // Given
      const invalidIds = ['short', 'toolong', null, undefined, ''];

      // When & Then
      invalidIds.forEach((id) => {
        expect(VideoSlug.isValid(id as any)).toBe(false);
      });
    });
  });

  describe('toWatchUrl', () => {
    it('YouTube Watch URL을 생성해야 한다', () => {
      // Given
      const videoId = 'dQw4w9WgXcQ';
      const videoSlug = new VideoSlug(videoId);

      // When
      const url = videoSlug.toWatchUrl();

      // Then
      expect(url).toBe(`https://www.youtube.com/watch?v=${videoId}`);
    });
  });

  describe('toEmbedUrl', () => {
    it('YouTube Embed URL을 생성해야 한다', () => {
      // Given
      const videoId = 'dQw4w9WgXcQ';
      const videoSlug = new VideoSlug(videoId);

      // When
      const url = videoSlug.toEmbedUrl();

      // Then
      expect(url).toBe(`https://www.youtube.com/embed/${videoId}`);
    });
  });

  describe('toShortUrl', () => {
    it('YouTube Short URL을 생성해야 한다', () => {
      // Given
      const videoId = 'dQw4w9WgXcQ';
      const videoSlug = new VideoSlug(videoId);

      // When
      const url = videoSlug.toShortUrl();

      // Then
      expect(url).toBe(`https://youtu.be/${videoId}`);
    });
  });

  describe('equals', () => {
    it('동일한 Video ID는 같다고 판단되어야 한다', () => {
      // Given
      const videoId = 'dQw4w9WgXcQ';
      const slug1 = new VideoSlug(videoId);
      const slug2 = new VideoSlug(videoId);

      // When & Then
      expect(slug1.equals(slug2)).toBe(true);
    });

    it('다른 Video ID는 다르다고 판단되어야 한다', () => {
      // Given
      const slug1 = new VideoSlug('dQw4w9WgXcQ');
      const slug2 = new VideoSlug('jNQXAC9IVRw');

      // When & Then
      expect(slug1.equals(slug2)).toBe(false);
    });

    it('null과 비교하면 false를 반환해야 한다', () => {
      // Given
      const slug = new VideoSlug('dQw4w9WgXcQ');

      // When & Then
      expect(slug.equals(null as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('Video ID 문자열을 반환해야 한다', () => {
      // Given
      const videoId = 'dQw4w9WgXcQ';
      const videoSlug = new VideoSlug(videoId);

      // When
      const result = videoSlug.toString();

      // Then
      expect(result).toBe(videoId);
    });
  });
});
