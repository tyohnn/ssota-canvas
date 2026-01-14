/**
 * getVideoMetadata Service 통합 테스트
 *
 * 실제 YouTube API를 호출하여 메타데이터를 조회하는 테스트
 *
 * ⚠️ 주의: 이 테스트를 실행하려면 YOUTUBE_API_KEY 환경 변수가 필요합니다.
 * .env.local 파일에 YOUTUBE_API_KEY를 설정하거나, 테스트 실행 시 환경 변수를 전달하세요.
 */
import { describe, it, expect } from 'vitest';
import { getVideoMetadata } from '../get-video-metadata.service';
import { YoutubeError } from '../../../../shared/errors/youtube-app-space.error';
import { config } from '@/config';

// 환경 변수 확인 (디버깅용)
const apiKeyFromEnv = process.env.YOUTUBE_API_KEY;
const apiKeyFromConfig = config.providers.youtube;
const hasApiKey = !!apiKeyFromConfig;

// 디버깅 정보 출력
if (!hasApiKey) {
  console.log('🔍 환경 변수 디버깅:');
  console.log(`  process.env.YOUTUBE_API_KEY: ${apiKeyFromEnv ? `${apiKeyFromEnv.substring(0, 10)}...` : 'undefined'}`);
  console.log(`  config.providers.youtube: ${apiKeyFromConfig ? `${apiKeyFromConfig.substring(0, 10)}...` : 'undefined'}`);
}

describe.skipIf(!hasApiKey)('getVideoMetadata Service - 통합 테스트', () => {
  describe('성공 케이스', () => {
    it('YouTube 비디오 메타데이터를 성공적으로 조회해야 한다', async () => {
      // Given
      const videoId = 'XTj8V-2TwTM'; // https://www.youtube.com/watch?v=XTj8V-2TwTM

      // When
      const result = await getVideoMetadata(videoId);

      // Then
      console.log('📊 조회된 메타데이터:');
      console.log(JSON.stringify(result, null, 2));

      // 필수 필드 검증
      expect(result).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.title.length).toBeGreaterThan(0);

      // 선택적 필드 검증 (존재할 수 있는 필드들)
      if (result.description) {
        expect(typeof result.description).toBe('string');
      }

      if (result.channelId) {
        expect(typeof result.channelId).toBe('string');
        expect(result.channelId.length).toBeGreaterThan(0);
      }

      if (result.channelTitle) {
        expect(typeof result.channelTitle).toBe('string');
        expect(result.channelTitle.length).toBeGreaterThan(0);
      }

      if (result.publishedAt) {
        expect(result.publishedAt).toBeInstanceOf(Date);
      }

      if (result.durationSeconds) {
        expect(typeof result.durationSeconds).toBe('number');
        expect(result.durationSeconds).toBeGreaterThan(0);
      }

      if (result.thumbnailUrl) {
        expect(typeof result.thumbnailUrl).toBe('string');
        expect(result.thumbnailUrl).toMatch(/^https?:\/\//);
      }

      if (result.thumbnailHighUrl) {
        expect(typeof result.thumbnailHighUrl).toBe('string');
        expect(result.thumbnailHighUrl).toMatch(/^https?:\/\//);
      }

      // 통계 데이터 검증
      if (result.viewCount !== undefined) {
        expect(typeof result.viewCount).toBe('number');
        expect(result.viewCount).toBeGreaterThanOrEqual(0);
      }

      if (result.likeCount !== undefined) {
        expect(typeof result.likeCount).toBe('number');
        expect(result.likeCount).toBeGreaterThanOrEqual(0);
      }

      if (result.commentCount !== undefined) {
        expect(typeof result.commentCount).toBe('number');
        expect(result.commentCount).toBeGreaterThanOrEqual(0);
      }

      // 상세 정보 출력
      console.log('\n📹 비디오 정보:');
      console.log(`  제목: ${result.title}`);
      console.log(`  채널: ${result.channelTitle || 'N/A'}`);
      console.log(`  채널 ID: ${result.channelId || 'N/A'}`);
      console.log(`  게시일: ${result.publishedAt?.toISOString() || 'N/A'}`);
      console.log(`  길이: ${result.durationSeconds ? `${Math.floor(result.durationSeconds / 60)}분 ${result.durationSeconds % 60}초` : 'N/A'}`);
      console.log(`  썸네일: ${result.thumbnailUrl || 'N/A'}`);
      console.log(`  조회수: ${result.viewCount?.toLocaleString() || 'N/A'}`);
      console.log(`  좋아요: ${result.likeCount?.toLocaleString() || 'N/A'}`);
      console.log(`  댓글: ${result.commentCount?.toLocaleString() || 'N/A'}`);
      if (result.description) {
        console.log(`  설명: ${result.description.substring(0, 100)}...`);
      }
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 비디오 ID로 조회 시 에러를 반환해야 한다', async () => {
      // Given
      const invalidVideoId = 'INVALID_VIDEO_ID_12345';

      // When & Then
      await expect(getVideoMetadata(invalidVideoId)).rejects.toThrow(
        YoutubeError
      );

      try {
        await getVideoMetadata(invalidVideoId);
      } catch (error) {
        if (error instanceof YoutubeError) {
          console.log('❌ 예상된 에러 발생:');
          console.log(`  코드: ${error.code}`);
          console.log(`  메시지: ${error.message}`);
          expect(error.code).toBe('YOUTUBE_API_NOT_FOUND');
        }
      }
    });
  });
});

describe.skipIf(hasApiKey)('getVideoMetadata Service - API 키 없음', () => {
  it('API 키가 없을 때는 테스트가 건너뛰어집니다', () => {
    console.log('⚠️  YOUTUBE_API_KEY 환경 변수가 설정되지 않아 테스트를 건너뜁니다.');
    console.log('💡 테스트를 실행하려면 .env.local 파일에 YOUTUBE_API_KEY를 설정하세요.');
  });
});
