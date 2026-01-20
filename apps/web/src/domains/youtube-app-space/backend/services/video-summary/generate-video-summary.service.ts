/**
 * Video Summary 생성 서비스
 *
 * 실제 요약 생성 로직을 담당하는 서비스
 * - 스크립트를 기반으로 요약 생성
 * - 언어별 요약 생성
 * - Grok-4.1-Fast를 통한 AI 요약 생성
 * - Helicone을 통한 추적
 */

import { generateText } from 'ai';
import { Result } from '@/utils/result';

import {
  createHeliconeXAI,
  buildHeliconeHeaders,
  estimateXaiTokens,
} from '@/domains/ai-management/backend/providers/helicone-provider';
import { VideoAggregate } from '../../../shared/aggregates/video.aggregate';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import { LanguageCode } from '../../../shared/value-objects/language-code.vo';
import type { TranscriptSegment } from '../../../shared/types/transcript.types';

export interface GenerateVideoSummaryRequest {
  videoAggregate: VideoAggregate;
  language: string;
}

/**
 * TranscriptSegment[]를 텍스트로 변환
 *
 * 타임스탬프와 함께 포맷팅하여 맥락 유지
 *
 * @param segments - 자막 세그먼트 배열
 * @returns 포맷팅된 텍스트
 */
function formatTranscriptToText(segments: TranscriptSegment[]): string {
  return segments
    .map((seg) => {
      const minutes = Math.floor(seg.start / 60);
      const seconds = Math.floor(seg.start % 60);
      return `[${minutes}:${seconds.toString().padStart(2, '0')}] ${seg.text}`;
    })
    .join('\n');
}


/**
 * 언어 코드를 언어 이름으로 변환
 *
 * @param languageCode - ISO 639-1 언어 코드
 * @returns 언어 이름 (영문)
 */
function getLanguageName(languageCode: string): string {
  const languageMap: Record<string, string> = {
    en: 'English',
    ko: 'Korean',
    ja: 'Japanese',
    zh: 'Chinese',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
  };

  return languageMap[languageCode.toLowerCase()] || languageCode;
}

/**
 * 요약 생성을 위한 프롬프트 구성
 *
 * TODO: 향후 더 정교한 instruction 추가
 * - 키포인트 추출
 * - 구조화된 요약 (Introduction, Key Points, Conclusion)
 * - SEO 최적화
 *
 * @param scriptText - 포맷팅된 스크립트 텍스트
 * @param language - 언어 코드
 * @returns AI 프롬프트
 */
function buildSummaryPrompt(scriptText: string, language: string): string {
  const languageName = getLanguageName(language);

  return `You are a professional content summarizer. Generate a concise summary of the following video transcript in ${languageName}.

VIDEO TRANSCRIPT:
${scriptText}

INSTRUCTIONS:
- Summarize the main points and key takeaways
- Keep it concise but comprehensive
- Use ${languageName} language
- Focus on the most important information
- Maintain the original tone and context

SUMMARY:`;
}

/**
 * Video Summary 생성
 *
 * @param request - 요약 생성 요청 (Video Aggregate, 언어)
 * @returns 생성된 요약 텍스트
 */
export async function generateVideoSummary(
  request: GenerateVideoSummaryRequest
): Promise<Result<string, YoutubeError>> {
  try {
    const { videoAggregate, language } = request;
    const video = videoAggregate.getVideo();

    // 1. 스크립트 확인
    if (!video.hasScript()) {
      return Result.error(
        new YoutubeError(
          'SCRIPT_NOT_FOUND',
          'Script not found. Please extract script first.',
          {
            videoId: video.id.value,
            language,
          }
        )
      );
    }

    // 2. 스크립트 데이터 추출
    const script = video.script;
    if (!script || !script.transcript || script.transcript.length === 0) {
      return Result.error(
        new YoutubeError(
          'SCRIPT_TRANSCRIPT_EMPTY',
          'Script transcript is empty',
          {
            videoId: video.id.value,
            language,
          }
        )
      );
    }

    // 3. 스크립트 전처리
    const scriptText = formatTranscriptToText(script.transcript);
    const totalTokens = await estimateXaiTokens(scriptText);

    // 4. Helicone 헤더 생성
    const headers = buildHeliconeHeaders({
      feature: 'video-summary',
      model: 'grok-4-1-fast-non-reasoning',
      properties: {
        videoId: video.id.value,
        language,
        scriptLength: scriptText.length.toString(),
        estimatedTokens: totalTokens.toString(),
      },
    });

    // 5. xAI Provider 생성
    const xai = createHeliconeXAI(headers);

    // 6. AI 요약 생성
    // xAI 모델명: Helicone을 통해 사용할 때는 실제 xAI API 모델명 사용
    // grok-4-1-fast-reasoning (reasoning) 또는 grok-4-1-fast-non-reasoning (non-reasoning) 사용 가능
    // 요약 생성은 non-reasoning으로도 충분하지만, 더 나은 품질을 위해 reasoning 사용
    const result = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'), // xAI 모델명: non-reasoning for faster response
      prompt: buildSummaryPrompt(scriptText, language),
      temperature: 0.3, // 일관성을 위해 낮은 온도
    });

    const summaryText = result.text.trim();

    // 7. 요약이 비어있는 경우 에러 처리
    if (!summaryText || summaryText.length === 0) {
      return Result.error(
        new YoutubeError(
          'SUMMARY_GENERATION_FAILED',
          'Generated summary is empty',
          {
            videoId: video.id.value,
            language,
          }
        )
      );
    }

    return Result.success(summaryText);
  } catch (error) {
    return Result.error(
      new YoutubeError(
        'SUMMARY_GENERATION_FAILED',
        error instanceof Error ? error.message : 'Failed to generate summary',
        {
          language: request.language,
          videoId: request.videoAggregate.getVideo().id.value,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
