/**
 * Video Summary 번역 서비스
 *
 * 영어 요약을 다른 언어로 번역하는 서비스
 * - xAI Grok 4.1 Fast Non-Reasoning을 통한 AI 번역
 * - Helicone을 통한 추적
 */

// AI SDK 경고 비활성화 (xAI 호환성 모드 경고)
if (typeof globalThis !== 'undefined') {
  (globalThis as any).AI_SDK_LOG_WARNINGS = false;
}

import { generateText } from 'ai';
import { Result } from '@/utils/result';

import {
  createHeliconeXAI,
  buildHeliconeHeaders,
} from '@/domains/ai-management/backend/providers/helicone-provider';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';

export interface TranslateVideoSummaryRequest {
  englishSummary: string;
  englishKeywords: string[];
  targetLanguage: string;
}

export interface TranslateVideoSummaryResult {
  translatedSummary: string;
  translatedKeywords: string[];
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
 * 번역을 위한 System Prompt 구성
 *
 * 번역 규칙과 가이드라인
 *
 * @param targetLanguage - 대상 언어 코드
 * @returns System prompt
 */
function buildTranslationSystemPrompt(targetLanguage: string): string {
  const targetLanguageName = getLanguageName(targetLanguage);

  return `You are a native ${targetLanguageName} content localizer, not just a translator. Your goal is to make the content feel like it was originally written in ${targetLanguageName}.

=== LOCALIZATION RULES ===

1. <mark>Natural expression over literal translation</mark>: 
  - Don't translate word-by-word. Rewrite sentences to sound natural in ${targetLanguageName}.
  - Use expressions and idioms that native speakers actually use.
  - Avoid awkward literal translations that sound unnatural.

2. <mark>Add original terms in parentheses for technical/foreign terms</mark>:
  - When translating technical terms, jargon, or foreign concepts, include the original English term in parentheses.
  - Korean: "이탈 (Churn)", "전환율 (Conversion Rate)", "연착륙 (Soft Landing)", "다극화 (Multipolarization)"
  - Japanese: "チャーン (Churn)", "コンバージョン率 (Conversion Rate)", "ソフトランディング (Soft Landing)"
  - Chinese: "流失 (Churn)", "转化率 (Conversion Rate)", "软着陆 (Soft Landing)", "多极化 (Multipolarization)"
  - Spanish: "Abandono (Churn)", "Tasa de conversión (Conversion Rate)", "Aterrizaje suave (Soft Landing)"
  - French: "Désabonnement (Churn)", "Taux de conversion (Conversion Rate)", "Atterrissage en douceur (Soft Landing)"
  - Arabic: "التخلي (Churn)", "معدل التحويل (Conversion Rate)", "هبوط ناعم (Soft Landing)"
  - This helps readers understand the original terminology while reading in their native language.

3. <mark>Keep universally recognized terms as-is</mark>:
  - Acronyms and widely adopted terms: AI, API, GDP, NATO, UN, WHO, etc.
  - Brand names and proper nouns stay unchanged.
  - Adapt to ${targetLanguageName}'s common usage patterns for what terms are typically kept in English vs. translated.

4. <mark>Preserve markdown structure</mark>: Keep all ##, ###, <mark></mark>, -, and other markdown formatting exactly as-is.

5. <mark>Localize proper nouns with original in parentheses</mark>: 
  - Convert names of people, companies, organizations, and places to natural phonetic spelling in ${targetLanguageName}, followed by the original in parentheses.
  - Korean: "일론 머스크 (Elon Musk)", "테슬라 (Tesla)", "에어비앤비 (Airbnb)"
  - Japanese: "イーロン・マスク (Elon Musk)", "テスラ (Tesla)", "エアビーアンドビー (Airbnb)"
  - Chinese: "埃隆·马斯克 (Elon Musk)", "特斯拉 (Tesla)", "爱彼迎 (Airbnb)"
  - Spanish: "Elon Musk", "Tesla", "Airbnb" (keep as-is if no established localization)
  - French: "Elon Musk", "Tesla", "Airbnb" (keep as-is if no established localization)
  - Arabic: "إيلون ماسك (Elon Musk)", "تسلا (Tesla)", "إير بي إن بي (Airbnb)"
  - For well-known entities that already have established translations in ${targetLanguageName}, use those.

6. <mark>Output format</mark>: Return ONLY the translated content. Do NOT include any labels like "TRANSLATED:", "[TRANSLATED]", or similar prefixes.`;
}

/**
 * 번역을 위한 User Prompt 구성
 *
 * 실제 영어 요약 텍스트와 번역 지시
 *
 * @param englishSummary - 영어 요약 텍스트
 * @param targetLanguage - 대상 언어 코드
 * @returns User prompt
 */
function buildTranslationUserPrompt(englishSummary: string, targetLanguage: string): string {
  const targetLanguageName = getLanguageName(targetLanguage);

  return `ENGLISH SUMMARY:
${englishSummary}

YOUR TASK:
Localize the summary to ${targetLanguageName}. Follow all the localization rules provided.`;
}

/**
 * 키워드 번역을 위한 System Prompt 구성
 *
 * 키워드 번역 규칙
 *
 * @param targetLanguage - 대상 언어 코드
 * @returns System prompt
 */
function buildKeywordsTranslationSystemPrompt(targetLanguage: string): string {
  const targetLanguageName = getLanguageName(targetLanguage);

  return `You are a native ${targetLanguageName} content localizer specializing in keyword localization.

RULES:
- Keep universally recognized acronyms as-is (AI, API, GDP, NATO, etc.)
- For technical terms, add original in parentheses if helpful: "이탈 (Churn)", "전환율 (Conversion Rate)"
- Use natural ${targetLanguageName} expressions where appropriate
- Keep as single words or short phrases (3-4 words max including parentheses)
- Return ONLY the comma-separated keywords, no labels or prefixes`;
}

/**
 * 키워드 번역을 위한 User Prompt 구성
 *
 * 실제 영어 키워드와 번역 지시
 *
 * @param englishKeywords - 영어 키워드 배열
 * @param targetLanguage - 대상 언어 코드
 * @returns User prompt
 */
function buildKeywordsTranslationUserPrompt(englishKeywords: string[], targetLanguage: string): string {
  const targetLanguageName = getLanguageName(targetLanguage);
  const keywordsText = englishKeywords.join(', ');

  return `ENGLISH KEYWORDS:
${keywordsText}

YOUR TASK:
Localize these keywords to ${targetLanguageName}. Follow all the rules provided.`;
}

/**
 * Video Summary 번역
 *
 * @param request - 번역 요청 (영어 요약, 키워드, 대상 언어)
 * @returns 번역된 요약 및 키워드
 */
export async function translateVideoSummary(
  request: TranslateVideoSummaryRequest
): Promise<Result<TranslateVideoSummaryResult, YoutubeError>> {
  try {
    const { englishSummary, englishKeywords, targetLanguage } = request;

    if (!englishSummary || englishSummary.trim().length === 0) {
      return Result.error(
        new YoutubeError(
          'SUMMARY_EMPTY',
          'English summary is empty, cannot translate',
          { targetLanguage }
        )
      );
    }

    // 영어로 번역하는 경우는 그대로 반환
    if (targetLanguage.toLowerCase() === 'en') {
      return Result.success({
        translatedSummary: englishSummary,
        translatedKeywords: englishKeywords,
      });
    }

    // 1. Helicone 헤더 생성 (요약 번역)
    const summaryHeaders = buildHeliconeHeaders({
      feature: 'video-summary-translation',
      model: 'grok-4-1-fast-non-reasoning',
      properties: {
        targetLanguage,
        summaryLength: englishSummary.length.toString(),
      },
    });

    // 2. xAI Provider 생성
    const xai = createHeliconeXAI(summaryHeaders);

    // 3. AI 요약 번역
    let summaryResult;
    try {
      summaryResult = await generateText({
        model: xai('grok-4-1-fast-non-reasoning'),
        system: buildTranslationSystemPrompt(targetLanguage),
        prompt: buildTranslationUserPrompt(englishSummary, targetLanguage),
        temperature: 0.2, // 일관성을 위해 낮은 온도
      });
    } catch (generateError) {
      throw generateError;
    }

    const translatedSummary = summaryResult.text.trim();

    // 4. 요약 번역이 비어있는 경우 에러 처리
    if (!translatedSummary || translatedSummary.length === 0) {
      return Result.error(
        new YoutubeError(
          'SUMMARY_TRANSLATION_FAILED',
          'Translated summary is empty',
          { targetLanguage }
        )
      );
    }

    // 5. 키워드 번역 (헤더 재생성)
    const keywordsHeaders = buildHeliconeHeaders({
      feature: 'video-keywords-translation',
      model: 'grok-4-1-fast-non-reasoning',
      properties: {
        targetLanguage,
        keywordsCount: englishKeywords.length.toString(),
      },
    });

    const xaiKeywords = createHeliconeXAI(keywordsHeaders);

    const keywordsResult = await generateText({
      model: xaiKeywords('grok-4-1-fast-non-reasoning'),
      system: buildKeywordsTranslationSystemPrompt(targetLanguage),
      prompt: buildKeywordsTranslationUserPrompt(englishKeywords, targetLanguage),
      temperature: 0.1, // 키워드는 더 일관성이 필요
    });

    const translatedKeywordsText = keywordsResult.text.trim();

    // 6. 키워드 파싱
    const translatedKeywords = translatedKeywordsText
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    return Result.success({
      translatedSummary,
      translatedKeywords,
    });
  } catch (error) {
    return Result.error(
      new YoutubeError(
        'SUMMARY_TRANSLATION_FAILED',
        error instanceof Error ? error.message : 'Failed to translate summary',
        {
          targetLanguage: request.targetLanguage,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}