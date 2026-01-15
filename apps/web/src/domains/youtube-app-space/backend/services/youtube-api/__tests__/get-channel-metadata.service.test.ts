/**
 * getChannelMetadata Service 통합 테스트
 *
 * 실제 YouTube API를 호출하여 채널 메타데이터를 조회하는 테스트
 *
 * ⚠️ 주의: 이 테스트를 실행하려면 YOUTUBE_API_KEY 환경 변수가 필요합니다.
 * .env.local 파일에 YOUTUBE_API_KEY를 설정하거나, 테스트 실행 시 환경 변수를 전달하세요.
 */
import { describe, it, expect } from 'vitest';
import { getChannelMetadata } from '../get-channel-metadata.service';
import { YoutubeError } from '../../../../shared/errors/youtube-app-space.error';
import { config } from '@/config';

// 환경 변수 확인 (디버깅용)
const apiKeyFromEnv = process.env.YOUTUBE_API_KEY;
const apiKeyFromConfig = config.providers.youtube;
const hasApiKey = !!apiKeyFromConfig;

// 디버깅 정보 출력
if (!hasApiKey) {
  console.log('🔍 환경 변수 디버깅:');
  console.log(
    `  process.env.YOUTUBE_API_KEY: ${
      apiKeyFromEnv ? `${apiKeyFromEnv.substring(0, 10)}...` : 'undefined'
    }`
  );
  console.log(
    `  config.providers.youtube: ${
      apiKeyFromConfig ? `${apiKeyFromConfig.substring(0, 10)}...` : 'undefined'
    }`
  );
}

describe.skipIf(!hasApiKey)('getChannelMetadata Service - 통합 테스트', () => {
  describe('성공 케이스', () => {
    it('YouTube 채널 메타데이터를 성공적으로 조회해야 한다', async () => {
      // Given
      const channelId = 'UCrUBl5diYEcS3PM7-FhzDLA'; // 프리랜서 개발자 채널

      // When
      const result = await getChannelMetadata(channelId);

      // Then
      console.log('📊 조회된 채널 메타데이터:');
      console.log(JSON.stringify(result, null, 2));

      // 필수 필드 검증
      expect(result).toBeDefined();
      expect(result.channelName).toBeDefined();
      expect(result.channelName.length).toBeGreaterThan(0);

      // 선택적 필드 검증 (존재할 수 있는 필드들)
      if (result.channelDescription) {
        expect(typeof result.channelDescription).toBe('string');
      }

      if (result.channelThumbnailUrl) {
        expect(typeof result.channelThumbnailUrl).toBe('string');
        expect(result.channelThumbnailUrl).toMatch(/^https?:\/\//);
      }

      if (result.subscriberCount !== undefined) {
        expect(typeof result.subscriberCount).toBe('number');
        expect(result.subscriberCount).toBeGreaterThanOrEqual(0);
      }

      if (result.videoCount !== undefined) {
        expect(typeof result.videoCount).toBe('number');
        expect(result.videoCount).toBeGreaterThanOrEqual(0);
      }

      // 상세 정보 출력
      console.log('\n📺 채널 정보:');
      console.log(`  채널명: ${result.channelName}`);
      console.log(
        `  설명: ${result.channelDescription ? result.channelDescription.substring(0, 100) + '...' : 'N/A'}`
      );
      console.log(`  썸네일: ${result.channelThumbnailUrl || 'N/A'}`);
      console.log(
        `  구독자: ${result.subscriberCount?.toLocaleString() || 'N/A'}`
      );
      console.log(`  비디오 수: ${result.videoCount?.toLocaleString() || 'N/A'}`);
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 채널 ID로 조회 시 에러를 반환해야 한다', async () => {
      // Given
      // YouTube API는 잘못된 형식의 채널 ID에 대해 400 Bad Request를 반환
      const invalidChannelId = 'INVALID_CHANNEL_ID_12345';

      // When & Then
      await expect(getChannelMetadata(invalidChannelId)).rejects.toThrow(
        YoutubeError
      );

      try {
        await getChannelMetadata(invalidChannelId);
      } catch (error) {
        if (error instanceof YoutubeError) {
          console.log('❌ 예상된 에러 발생:');
          console.log(`  코드: ${error.code}`);
          console.log(`  메시지: ${error.message}`);
          // YouTube API는 잘못된 형식에 대해 400 Bad Request를 반환
          expect(['YOUTUBE_API_NOT_FOUND', 'YOUTUBE_API_BAD_REQUEST']).toContain(
            error.code
          );
        }
      }
    });
  });
});

describe.skipIf(hasApiKey)('getChannelMetadata Service - API 키 없음', () => {
  it('API 키가 없을 때는 테스트가 건너뛰어집니다', () => {
    console.log(
      '⚠️  YOUTUBE_API_KEY 환경 변수가 설정되지 않아 테스트를 건너뜁니다.'
    );
    console.log(
      '💡 테스트를 실행하려면 .env.local 파일에 YOUTUBE_API_KEY를 설정하세요.'
    );
  });
});
