/**
 * LLM을 사용한 스크립트 언어 감지
 */
import { generateText } from 'ai';
import {
  createHeliconeXAI,
  buildHeliconeHeaders,
} from '@/domains/ai-management/backend/providers/helicone-provider';
import { Result } from '@/utils/result';

import { SourceManagementError } from '../../../../../shared/errors/source-management.error';
import { SUPPORTED_LANGUAGES } from '../../../../../shared/value-objects/language-code.vo';

import type { TimelineTranscriptSegment } from '@/domains/source-management/shared/types/timeline-script.types';

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
export async function detectLanguageFromScript(
  segments: TimelineTranscriptSegment[],
  videoId: string
): Promise<Result<string, SourceManagementError>> {
  try {
    const sampleSegments = segments.slice(0, 10);
    if (sampleSegments.length === 0) {
      return Result.error(
        new SourceManagementError(
          'SOURCE_UPDATE_FAILED',
          'No segments available for language detection',
          { videoId }
        )
      );
    }

    const sampleText = sampleSegments
      .map((seg) => seg.text.trim())
      .join(' ')
      .slice(0, 500);

    const headers = buildHeliconeHeaders({
      feature: 'transcript-language-detection',
      model: 'grok-4-1-fast-non-reasoning',
      properties: {
        videoId,
        sampleLength: sampleText.length.toString(),
      },
    });

    const xai = createHeliconeXAI(headers);

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

    const result = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      prompt,
    });

    const detectedCode = result.text.trim().toLowerCase();

    if (
      !SUPPORTED_LANGUAGES.includes(detectedCode as (typeof SUPPORTED_LANGUAGES)[number])
    ) {
      return Result.error(
        new SourceManagementError(
          'INVALID_LANGUAGE_CODE',
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
      new SourceManagementError(
        'SOURCE_UPDATE_FAILED',
        error instanceof Error ? error.message : 'Failed to detect language',
        {
          videoId,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}
