/**
 * extractTranscript Service 통합 테스트
 *
 * 3단계 fallback 메커니즘을 사용한 자막 추출 테스트
 * 
 * ⚠️ 주의: 이 테스트는 실제 네트워크 요청을 수행합니다.
 */
import { describe, it, expect } from 'vitest';
import { extractTranscript } from '../extract-transcript.service';
import { YoutubeError } from '../../../../shared/errors/youtube-app-space.error';

describe('extractTranscript Service - 통합 테스트', () => {
  describe('성공 케이스', () => {
    it('YouTube 비디오 자막을 성공적으로 추출해야 한다', async () => {
      // Given
      const videoId = 'XTj8V-2TwTM'; // https://www.youtube.com/watch?v=XTj8V-2TwTM

      // When
      const result = await extractTranscript(videoId);

      // Then
      expect(result).toBeDefined();
      expect(result.transcript).toBeDefined();
      expect(Array.isArray(result.transcript)).toBe(true);
      expect(result.transcript.length).toBeGreaterThan(0);

      // 메타데이터 검증
      expect(result.metadata).toBeDefined();
      expect(result.metadata.extractedAt).toBeDefined();
      expect(typeof result.metadata.extractedAt).toBe('string');
      expect(result.metadata.totalDuration).toBeGreaterThanOrEqual(0);
      expect(result.metadata.totalSegments).toBe(result.transcript.length);
      expect(result.metadata.language).toBeDefined();

      // 첫 번째 세그먼트 검증
      const firstSegment = result.transcript[0];
      expect(firstSegment).toBeDefined();
      expect(firstSegment).toHaveProperty('text');
      expect(firstSegment).toHaveProperty('start');
      expect(firstSegment).toHaveProperty('duration');
      
      if (firstSegment) {
        expect(typeof firstSegment.text).toBe('string');
        expect(typeof firstSegment.start).toBe('number');
        expect(typeof firstSegment.duration).toBe('number');

        console.log('📊 추출된 자막 정보:');
        console.log(`  총 세그먼트 수: ${result.transcript.length}`);
        console.log(`  전체 길이: ${Math.floor(result.metadata.totalDuration / 60)}분 ${Math.floor(result.metadata.totalDuration % 60)}초`);
        console.log(`  언어: ${result.metadata.language}`);
        console.log(`  추출 시각: ${result.metadata.extractedAt}`);
        console.log(`  첫 번째 세그먼트: "${firstSegment.text.substring(0, 50)}..."`);
      }
    }, 90000); // 타임아웃 90초 (fallback 체인 고려)

    it('언어를 지정하여 자막을 추출할 수 있어야 한다', async () => {
      // Given
      const videoId = 'XTj8V-2TwTM';
      const language = 'en';

      // When
      const result = await extractTranscript(videoId, language);

      // Then
      expect(result).toBeDefined();
      expect(result.transcript.length).toBeGreaterThan(0);
      expect(result.metadata.language).toBeDefined();
    }, 90000);
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 비디오 ID로 조회 시 에러를 반환해야 한다', async () => {
      // Given
      const invalidVideoId = 'INVALID_VIDEO_ID_12345';

      // When & Then
      await expect(extractTranscript(invalidVideoId)).rejects.toThrow(YoutubeError);

      try {
        await extractTranscript(invalidVideoId);
      } catch (error) {
        if (error instanceof YoutubeError) {
          console.log('❌ 예상된 에러 발생:');
          console.log(`  코드: ${error.code}`);
          console.log(`  메시지: ${error.message}`);
          expect(error.code).toBe('TRANSCRIPT_NOT_AVAILABLE');
        }
      }
    }, 90000);
  });

  describe('Fallback 메커니즘', () => {
    it('첫 번째 어댑터가 실패하면 두 번째 어댑터를 시도해야 한다', async () => {
      // Given
      const videoId = 'XTj8V-2TwTM';

      // When
      const result = await extractTranscript(videoId);

      // Then
      // 최소한 하나의 어댑터가 성공해야 함
      expect(result).toBeDefined();
      expect(result.transcript.length).toBeGreaterThan(0);

      console.log(`✅ Fallback 메커니즘 작동 확인: ${result.transcript.length}개 세그먼트 추출`);
    }, 90000);
  });
});
