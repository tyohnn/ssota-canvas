/**
 * ZenRows Caption Adapter 테스트
 *
 * ⚠️ 주의:
 * - 이 테스트는 ZenRows API Key가 필요합니다 (유료 서비스)
 * - ZENROWS_API_KEY 환경 변수를 설정해야 합니다
 * - 실제 네트워크 요청을 수행하므로 비용이 발생할 수 있습니다
 * - CI 환경에서는 스킵됩니다
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as configModule from '@/config';
import { ZenRowsCaptionAdapter } from '../zenrows-caption.adapter';

// ZenRows API Key가 없으면 스킵. 기본 run에서 네트워크 방지: RUN_ZENROWS_CAPTION_TESTS=1 일 때만 실행
const hasZenRowsKey = !!process.env.ZENROWS_API_KEY;
const shouldSkip =
  !hasZenRowsKey ||
  process.env.CI === 'true' ||
  process.env.RUN_ZENROWS_CAPTION_TESTS !== '1';

describe.skipIf(shouldSkip)('ZenRowsCaptionAdapter', () => {
  const adapter = new ZenRowsCaptionAdapter();

  describe('성공 케이스', () => {
    it('YouTube 비디오 자막을 ZenRows를 통해 성공적으로 추출해야 한다', async () => {
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
      if (firstSegment) {
        expect(firstSegment).toHaveProperty('text');
        expect(firstSegment).toHaveProperty('start');
        expect(firstSegment).toHaveProperty('duration');
        expect(typeof firstSegment.text).toBe('string');
        expect(typeof firstSegment.start).toBe('number');
        expect(typeof firstSegment.duration).toBe('number');
        expect(firstSegment.start).toBeGreaterThanOrEqual(0);
        expect(firstSegment.duration).toBeGreaterThan(0);
      }
    }, 60000); // 타임아웃 60초 (ZenRows API는 느릴 수 있음)

    it('언어를 지정하여 자막을 추출할 수 있어야 한다', async () => {
      // Given
      const videoId = 'XTj8V-2TwTM';
      const language = 'en';

      // When
      const segments = await adapter.getTranscript(videoId, language);

      // Then
      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);

      // 첫 번째 세그먼트 검증
      const firstSegment = segments[0];
      expect(firstSegment).toBeDefined();
      if (firstSegment) {
        expect(firstSegment).toHaveProperty('text');
        expect(firstSegment).toHaveProperty('start');
        expect(firstSegment).toHaveProperty('duration');
        expect(typeof firstSegment.text).toBe('string');
        expect(typeof firstSegment.start).toBe('number');
        expect(typeof firstSegment.duration).toBe('number');
        expect(firstSegment.start).toBeGreaterThanOrEqual(0);
        expect(firstSegment.duration).toBeGreaterThan(0);
      }
    }, 60000);
  });

  describe('에러 케이스', () => {
    it('ZENROWS_API_KEY가 없으면 에러를 던져야 한다', async () => {
      // Given: config.providers.zenrows를 모킹하여 빈 문자열로 설정
      const originalZenrows = configModule.config.providers.zenrows;
      
      // Object.defineProperty를 사용하여 zenrows 값을 빈 문자열로 변경
      // @ts-expect-error - 테스트를 위해 readonly 속성을 수정
      configModule.config.providers.zenrows = '';

      // 새로운 adapter 인스턴스 생성 (모킹된 config 사용)
      const testAdapter = new ZenRowsCaptionAdapter();

      // When & Then
      await expect(
        testAdapter.getTranscript('XTj8V-2TwTM')
      ).rejects.toThrow('ZENROWS_API_KEY');

      // Cleanup: 원래 값 복원
      // @ts-expect-error - 테스트를 위해 readonly 속성을 수정
      configModule.config.providers.zenrows = originalZenrows;
    }, 60000);
  });
});

describe.skipIf(!shouldSkip)(
  'ZenRowsCaptionAdapter (스킵됨)',
  () => {
    it('ZENROWS_API_KEY가 설정되지 않았거나 CI 환경입니다', () => {
      console.log(
        '\n⚠️ ZenRows 테스트가 스킵되었습니다.\n' +
          '  - ZENROWS_API_KEY 환경 변수를 설정하면 테스트를 실행할 수 있습니다.\n' +
          '  - CI 환경에서는 자동으로 스킵됩니다.\n'
      );
      expect(true).toBe(true);
    });
  }
);
