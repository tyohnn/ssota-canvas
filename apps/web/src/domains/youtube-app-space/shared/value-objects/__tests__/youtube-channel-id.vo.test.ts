import { describe, it, expect } from 'vitest';
import { YoutubeChannelId } from '../youtube-channel-id.vo';
import { YoutubeError } from '../../errors/youtube-app-space.error';

describe('YoutubeChannelId Value Object', () => {
  describe('생성자', () => {
    it('유효한 YouTube Channel ID로 생성되어야 한다', () => {
      // Given
      const validChannelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';

      // When
      const channelId = new YoutubeChannelId(validChannelId);

      // Then
      expect(channelId.value).toBe(validChannelId);
    });

    it('UC로 시작하는 24자리 채널 ID를 허용해야 한다', () => {
      // Given
      const validChannelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';

      // When
      const channelId = new YoutubeChannelId(validChannelId);

      // Then
      expect(channelId.value).toBe(validChannelId);
    });

    it('커스텀 채널 ID를 허용해야 한다', () => {
      // Given
      const customChannelId = 'channelname';

      // When
      const channelId = new YoutubeChannelId(customChannelId);

      // Then
      expect(channelId.value).toBe(customChannelId);
    });

    it('공백이 있는 경우 trim되어야 한다', () => {
      // Given
      const channelIdWithSpaces = '  UC_x5XG1OV2P6uZZ5FSM9Ttw  ';

      // When
      const channelId = new YoutubeChannelId(channelIdWithSpaces);

      // Then
      expect(channelId.value).toBe('UC_x5XG1OV2P6uZZ5FSM9Ttw');
    });

    it('잘못된 형식에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidIds = [
        '', // 빈 문자열
        '   ', // 공백만
        'a'.repeat(101), // 100자 초과
        'invalid@id', // 특수문자 (@)
        'invalid id', // 공백 포함
      ];

      // When & Then
      invalidIds.forEach((id) => {
        expect(() => new YoutubeChannelId(id)).toThrow(YoutubeError);
      });
    });

    it('null/undefined는 허용하지 않아야 한다', () => {
      // When & Then
      expect(() => new YoutubeChannelId(null as any)).toThrow(YoutubeError);
      expect(() => new YoutubeChannelId(undefined as any)).toThrow(
        YoutubeError
      );
    });
  });

  describe('isValid', () => {
    it('유효한 Channel ID는 true를 반환해야 한다', () => {
      // Given
      const validIds = [
        'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        'channelname',
        'a'.repeat(100), // 최대 길이
      ];

      // When & Then
      validIds.forEach((id) => {
        expect(YoutubeChannelId.isValid(id)).toBe(true);
      });
    });

    it('잘못된 Channel ID는 false를 반환해야 한다', () => {
      // Given
      const invalidIds = [
        '',
        '   ',
        'a'.repeat(101), // 최대 길이 초과
        null,
        undefined,
        'invalid@id',
      ];

      // When & Then
      invalidIds.forEach((id) => {
        expect(YoutubeChannelId.isValid(id as any)).toBe(false);
      });
    });
  });

  describe('toChannelUrl', () => {
    it('UC로 시작하는 채널 ID는 채널 URL을 생성해야 한다', () => {
      // Given
      const channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
      const youtubeChannelId = new YoutubeChannelId(channelId);

      // When
      const url = youtubeChannelId.toChannelUrl();

      // Then
      expect(url).toBe(`https://www.youtube.com/channel/${channelId}`);
    });

    it('UC로 시작하지 않는 채널 ID는 커스텀 채널 URL을 생성해야 한다', () => {
      // Given
      const customChannelId = 'channelname';
      const youtubeChannelId = new YoutubeChannelId(customChannelId);

      // When
      const url = youtubeChannelId.toChannelUrl();

      // Then
      expect(url).toBe(`https://www.youtube.com/@${customChannelId}`);
    });
  });

  describe('equals', () => {
    it('동일한 Channel ID는 같다고 판단되어야 한다', () => {
      // Given
      const channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
      const id1 = new YoutubeChannelId(channelId);
      const id2 = new YoutubeChannelId(channelId);

      // When & Then
      expect(id1.equals(id2)).toBe(true);
    });

    it('다른 Channel ID는 다르다고 판단되어야 한다', () => {
      // Given
      const id1 = new YoutubeChannelId('UC_x5XG1OV2P6uZZ5FSM9Ttw');
      const id2 = new YoutubeChannelId('UC_anotherChannelId123');

      // When & Then
      expect(id1.equals(id2)).toBe(false);
    });

    it('null과 비교하면 false를 반환해야 한다', () => {
      // Given
      const id = new YoutubeChannelId('UC_x5XG1OV2P6uZZ5FSM9Ttw');

      // When & Then
      expect(id.equals(null as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('Channel ID 문자열을 반환해야 한다', () => {
      // Given
      const channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
      const youtubeChannelId = new YoutubeChannelId(channelId);

      // When
      const result = youtubeChannelId.toString();

      // Then
      expect(result).toBe(channelId);
    });
  });
});
