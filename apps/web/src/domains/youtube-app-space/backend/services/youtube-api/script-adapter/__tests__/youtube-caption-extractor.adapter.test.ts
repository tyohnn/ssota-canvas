/**
 * YouTube Caption Extractor Adapter 테스트
 *
 * youtube-caption-extractor 라이브러리를 사용한 자막 추출 테스트
 * 
 * ⚠️ 주의: 이 테스트는 실제 네트워크 요청을 수행합니다.
 * 
 * 📝 참고:
 * - youtube-caption-extractor는 프록시 옵션을 직접 지원하지 않습니다
 * - ZenRows 같은 프록시를 사용하려면 zenrows-caption.adapter.test.ts를 참고하세요
 */
import { describe, it, expect } from 'vitest';
import { YoutubeCaptionExtractorAdapter } from '../youtube-caption-extractor.adapter';

describe('YoutubeCaptionExtractorAdapter', () => {
  const adapter = new YoutubeCaptionExtractorAdapter();

  describe('성공 케이스', () => {
    it('YouTube 비디오 자막을 성공적으로 추출해야 한다', async () => {
      // Given
      const videoId = 'XTj8V-2TwTM'; // https://www.youtube.com/watch?v=XTj8V-2TwTM

      // When
      const segments = await adapter.getTranscript(videoId);

      // Then
      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);

      // 첫 번째 세그먼트 검증
      const firstSegment = segments[0];
      expect(firstSegment).toBeDefined();
      expect(firstSegment).toHaveProperty('text');
      expect(firstSegment).toHaveProperty('start');
      expect(firstSegment).toHaveProperty('duration');
      
      if (firstSegment) {
        expect(typeof firstSegment.text).toBe('string');
        expect(typeof firstSegment.start).toBe('number');
        expect(typeof firstSegment.duration).toBe('number');
        expect(firstSegment.start).toBeGreaterThanOrEqual(0);
        expect(firstSegment.duration).toBeGreaterThan(0);

        console.log(`\n✅ ${adapter.name}: ${segments.length}개 세그먼트 추출 성공\n`);
        
        // 처음 10개 세그먼트 출력
        console.log('📝 처음 10개 세그먼트:');
        segments.slice(0, 10).forEach((seg, idx) => {
          const startMin = Math.floor(seg.start / 60);
          const startSec = Math.floor(seg.start % 60);
          const endTime = seg.start + seg.duration;
          const endMin = Math.floor(endTime / 60);
          const endSec = Math.floor(endTime % 60);
          console.log(`  ${idx + 1}. [${startMin}:${startSec.toString().padStart(2, '0')} - ${endMin}:${endSec.toString().padStart(2, '0')}] ${seg.text}`);
        });
        
        // 마지막 5개 세그먼트 출력
        if (segments.length > 10) {
          console.log('\n📝 마지막 5개 세그먼트:');
          segments.slice(-5).forEach((seg, idx) => {
            const startMin = Math.floor(seg.start / 60);
            const startSec = Math.floor(seg.start % 60);
            const endTime = seg.start + seg.duration;
            const endMin = Math.floor(endTime / 60);
            const endSec = Math.floor(endTime % 60);
            console.log(`  ${segments.length - 5 + idx + 1}. [${startMin}:${startSec.toString().padStart(2, '0')} - ${endMin}:${endSec.toString().padStart(2, '0')}] ${seg.text}`);
          });
        }
        
        // 통계 정보
        const lastSegment = segments[segments.length - 1];
        const totalDuration = lastSegment
          ? lastSegment.start + lastSegment.duration
          : 0;
        const avgDuration = segments.reduce((sum, seg) => sum + seg.duration, 0) / segments.length;
        const avgTextLength = segments.reduce((sum, seg) => sum + seg.text.length, 0) / segments.length;
        
        console.log('\n📊 통계 정보:');
        console.log(`  - 총 세그먼트 수: ${segments.length}`);
        console.log(`  - 전체 길이: ${Math.floor(totalDuration / 60)}분 ${Math.floor(totalDuration % 60)}초`);
        console.log(`  - 평균 세그먼트 길이: ${avgDuration.toFixed(2)}초`);
        console.log(`  - 평균 텍스트 길이: ${avgTextLength.toFixed(1)}자`);
        if (firstSegment) {
          console.log(`  - 첫 세그먼트 시작 시간: ${firstSegment.start}초`);
        }
        console.log(`  - 마지막 세그먼트 종료 시간: ${totalDuration.toFixed(2)}초\n`);
      }
    }, 30000); // 타임아웃 30초

    it('언어를 지정하여 자막을 추출할 수 있어야 한다', async () => {
      // Given
      const videoId = 'XTj8V-2TwTM';
      const language = 'en';

      // When
      const segments = await adapter.getTranscript(videoId, language);

      // Then
      expect(segments).toBeDefined();
      expect(segments.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 비디오 ID로 조회 시 에러를 반환하거나 빈 배열을 반환해야 한다', async () => {
      // Given
      const invalidVideoId = 'INVALID_VIDEO_ID_12345';

      // When
      try {
        const segments = await adapter.getTranscript(invalidVideoId);
        // 빈 배열을 반환할 수 있음 (에러가 아닐 수도 있음)
        expect(Array.isArray(segments)).toBe(true);
      } catch (error) {
        // 에러를 던질 수도 있음
        expect(error).toBeDefined();
      }
    }, 30000);
  });
});
