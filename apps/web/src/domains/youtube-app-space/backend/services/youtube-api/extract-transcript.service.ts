/**
 * YouTube Transcript Extraction Service
 *
 * ZenRows 프록시를 사용하여 자막을 추출합니다.
 */
import { generateText } from 'ai';
import {
  createHeliconeXAI,
  buildHeliconeHeaders,
} from '@/domains/ai-management/backend/providers/helicone-provider';
import { Result } from '@/utils/result';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import type { YoutubeScript } from '../../../shared/types/transcript.types';
import type { TranscriptSegment } from '../../../shared/types/transcript.types';
import { SUPPORTED_LANGUAGES } from '../../../shared/value-objects/language-code.vo';
import { ZenRowsCaptionAdapter } from './script-adapter/zenrows-caption.adapter';

/**
 * YouTube 영상 스크립트 추출
 *
 * ZenRows 프록시를 사용하여 자막을 추출합니다.
 * premium_proxy를 사용하여 YouTube의 bot detection을 우회합니다.
 *
 * @param videoId - YouTube Video ID
 * @param language - 언어 코드 (선택적, 예: 'en', 'ko', 'auto')
 * @returns YouTube 스크립트 데이터
 * @throws YoutubeError - 자막 추출 실패 시
 */
export async function extractTranscript(
  videoId: string,
  language?: string
): Promise<YoutubeScript> {
  const adapter = new ZenRowsCaptionAdapter();

  try {
    const segments = await adapter.getTranscript(videoId, language);
    if (segments.length > 0) {
      // language가 'auto'인 경우 LLM으로 언어 감지
      let detectedLanguage = language || 'auto';
      if (detectedLanguage === 'auto') {
        const languageResult = await detectLanguageFromScript(segments, videoId);
        if (languageResult.isSuccess()) {
          detectedLanguage = languageResult.value;
        } else {
          // 언어 감지 실패 시에도 'auto'로 진행
          console.warn(
            `Failed to detect language for video ${videoId}: ${languageResult.error.message}`
          );
        }
      }

      return buildYoutubeScript(segments, videoId, detectedLanguage);
    }

    throw new YoutubeError(
      'TRANSCRIPT_NOT_AVAILABLE',
      'No transcript segments found',
      { videoId, language }
    );
  } catch (error) {
    throw new YoutubeError(
      'TRANSCRIPT_NOT_AVAILABLE',
      `Failed to extract transcript: ${error instanceof Error ? error.message : String(error)}`,
      {
        videoId,
        language,
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * YoutubeScript 객체 생성
 *
 * @param segments - 자막 세그먼트 배열
 * @param videoId - YouTube Video ID
 * @param language - 언어 코드
 * @returns YoutubeScript 객체
 */
function buildYoutubeScript(
  segments: TranscriptSegment[],
  videoId: string,
  language: string
): YoutubeScript {
  // 마침표를 기준으로 세그먼트 병합
  const mergedSegments = mergeSegmentsByPeriod(segments);

  const lastSegment = mergedSegments[mergedSegments.length - 1];
  const totalDuration =
    mergedSegments.length > 0 && lastSegment
      ? lastSegment.start + lastSegment.duration
      : 0;

  return {
    transcript: mergedSegments,
    metadata: {
      extractedAt: new Date().toISOString(),
      totalDuration,
      totalSegments: mergedSegments.length,
      language,
    },
  };
}

/**
 * 마침표를 기준으로 세그먼트 병합
 *
 * 세그먼트들을 순차적으로 합치면서, 누적된 텍스트에서 마침표를 기준으로
 * 완성된 문장들을 추출하여 각각을 하나의 세그먼트로 병합합니다.
 * 각 문장의 첫 번째 세그먼트의 시작 시간을 사용합니다.
 *
 * @param segments - 병합할 세그먼트 배열
 * @returns 병합된 세그먼트 배열
 */
function mergeSegmentsByPeriod(
  segments: TranscriptSegment[]
): TranscriptSegment[] {
  if (segments.length === 0) {
    return [];
  }

  const merged: TranscriptSegment[] = [];
  let sentenceStartIndex = 0; // 현재 문장이 시작된 세그먼트 인덱스
  let accumulatedText = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const segmentText = segment.text.trim();

    // 누적된 텍스트에 새 세그먼트 텍스트 추가
    if (accumulatedText) {
      accumulatedText += ' ' + segmentText;
    } else {
      accumulatedText = segmentText;
      sentenceStartIndex = i;
    }

    // 누적된 텍스트에서 마침표로 끝나는 문장들을 추출
    while (accumulatedText.includes('.')) {
      const periodIndex = accumulatedText.indexOf('.');
      const sentenceText = accumulatedText.substring(0, periodIndex + 1).trim();

      // 마침표만 있는 경우는 제외 (공백이나 마침표만 있는 경우 필터링)
      if (sentenceText && sentenceText !== '.') {
        const firstSegment = segments[sentenceStartIndex]!;
        const lastSegment = segment;

        const mergedDuration =
          lastSegment.start + lastSegment.duration - firstSegment.start;

        merged.push({
          text: sentenceText,
          start: firstSegment.start,
          duration: mergedDuration,
        });
      }

      // 처리된 문장 제거 (마침표 포함)
      accumulatedText = accumulatedText.substring(periodIndex + 1).trim();
      sentenceStartIndex = i; // 다음 문장은 현재 세그먼트부터 시작
    }
  }

  // 마지막에 남은 세그먼트들 처리 (마침표로 끝나지 않는 경우)
  if (accumulatedText.trim()) {
    const firstSegment = segments[sentenceStartIndex]!;
    const lastSegment = segments[segments.length - 1]!;

    const mergedDuration =
      lastSegment.start + lastSegment.duration - firstSegment.start;

    merged.push({
      text: accumulatedText.trim(),
      start: firstSegment.start,
      duration: mergedDuration,
    });
  }

  return merged;
}

/**
 * 스크립트에서 언어 감지
 *
 * LLM을 사용하여 스크립트의 처음 몇 줄을 분석하여 언어를 감지합니다.
 * 지원되는 언어 코드(ISO 639-1) 중 하나를 반환합니다.
 *
 * @param segments - 자막 세그먼트 배열
 * @param videoId - YouTube Video ID (로깅용)
 * @returns 감지된 언어 코드 또는 에러
 */
async function detectLanguageFromScript(
  segments: TranscriptSegment[],
  videoId: string
): Promise<Result<string, YoutubeError>> {
  try {
    // 스크립트의 처음 10개 세그먼트만 사용 (약 1-2분 분량)
    const sampleSegments = segments.slice(0, 10);
    if (sampleSegments.length === 0) {
      return Result.error(
        new YoutubeError(
          'LANGUAGE_DETECTION_FAILED',
          'No segments available for language detection',
          { videoId }
        )
      );
    }

    // 샘플 텍스트 생성
    const sampleText = sampleSegments
      .map((seg) => seg.text.trim())
      .join(' ')
      .slice(0, 500); // 최대 500자만 사용

    // 1. Helicone 헤더 생성
    const headers = buildHeliconeHeaders({
      feature: 'transcript-language-detection',
      model: 'grok-4-1-fast-non-reasoning',
      properties: {
        videoId,
        sampleLength: sampleText.length.toString(),
      },
    });

    // 2. xAI Provider 생성
    const xai = createHeliconeXAI(headers);

    // 3. 언어 감지 프롬프트 구성
    const prompt = `You are a language detection expert. Analyze the following text sample from a YouTube video transcript and identify the language.

TEXT SAMPLE:
${sampleText}

SUPPORTED LANGUAGE CODES (ISO 639-1):
${SUPPORTED_LANGUAGES.join(', ')}

INSTRUCTIONS:
1. Identify the primary language of the text
2. Return ONLY the 2-letter ISO 639-1 language code
3. Must be one of the supported languages listed above
4. Return only the code, no explanation, no additional text

Return the language code now:`;

    // 4. AI 언어 감지
    const result = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      prompt,
      temperature: 0.1, // 일관성을 위해 매우 낮은 온도
    });

    const detectedCode = result.text.trim().toLowerCase();

    // 5. 지원되는 언어인지 확인
    if (!SUPPORTED_LANGUAGES.includes(detectedCode as (typeof SUPPORTED_LANGUAGES)[number])) {
      return Result.error(
        new YoutubeError(
          'LANGUAGE_DETECTION_FAILED',
          `Detected language code '${detectedCode}' is not supported. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
          {
            videoId,
            detectedCode,
            supportedLanguages: SUPPORTED_LANGUAGES,
          }
        )
      );
    }

    return Result.success(detectedCode);
  } catch (error) {
    return Result.error(
      new YoutubeError(
        'LANGUAGE_DETECTION_FAILED',
        error instanceof Error ? error.message : 'Failed to detect language',
        {
          videoId,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
