/**
 * Video Summary 생성 서비스
 *
 * 실제 요약 생성 로직을 담당하는 서비스
 * - 스크립트를 기반으로 요약 생성
 * - 언어별 요약 생성
 * - Grok-4.1-Fast를 통한 AI 요약 생성
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
  estimateXaiTokens,
} from '@/domains/ai-management/backend/providers/helicone-provider';
import { VideoAggregate } from '../../../shared/aggregates/video.aggregate';
import { YoutubeError } from '../../../shared/errors/youtube-app-space.error';
import type { TranscriptSegment } from '../../../shared/types/transcript.types';

export interface GenerateVideoSummaryRequest {
  videoAggregate: VideoAggregate;
  language: string;
}

export interface GenerateVideoSummaryResult {
  summary: string;
  keywords: string[];
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
 * System Prompt 구성
 *
 * 연구 기반 교육적 요약 전략 적용:
 * - 명확한 계층 구조와 숫자 섹션 분리
 * - 영상 내용에 특화된 제목
 * - 자연스러운 문체 (딱딱한 표현 지양)
 * - 예시와 설명 포함
 * - 능동적 학습 요소 (검색 큐)
 * - 함축적 표현과 가독성 향상
 *
 * 역할 정의, 스타일 규칙, 출력 형식 등 지속적인 지침을 포함
 *
 * @param language - 언어 코드
 * @returns System prompt
 */
function buildSummarySystemPrompt(language: string): string {
  const languageName = getLanguageName(language);

  return `You are an expert content summarizer creating comprehensive yet concise summaries in ${languageName}.

=== OUTPUT FORMAT ===

## 🧭 [Core question or main theme of the content in question or statement form]
[1-2 sentences with <strong>key terms</strong> and possibly <mark>one critical insight</mark>]

## 🚀 [Specific methodology/strategy/lesson of this content]
- [Point with <strong>important term</strong> and <strong>key concept</strong>]
- [Point with <strong>important term</strong> and <strong>key concept</strong>]
[2-3 sentences explaining value with <strong>terms</strong>]

# 🎞️ [Content topic sentence]

## 1. [Major Theme - Content-Specific Title]

### 1.1 [Sub-topic Title]
- [Point with <strong>term</strong> and <strong>concept</strong>]
  a. [Detail with <strong>specific term</strong>]
  b. [Detail with <strong>specific term</strong>]

### 1.2 [Sub-topic Title]
- [Point with <strong>term</strong> and <strong>concept</strong>]

[Continue pattern for all major themes...]

## Conclusion: [Title]
- [Takeaway with <strong>key lesson</strong>]
- [Action with <strong>important point</strong>]

=== STRUCTURE RULES ===

1. **DOCUMENT HIERARCHY**:
  - ## 🧭 and ## 🚀: Overview sections (big picture)
  - # 🎞️: H1 title that encompasses the entire content
  - ## 1., ## 2., ## 3.: Main theme sections (scale based on content length and complexity)
  - ### 1.1, ### 1.2, ### 1.3: Subsections within main themes (3-6 per main section)
  - ## Conclusion: Final summary

2. **SECTION ORGANIZATION**:
  - **MAIN SECTIONS**: Identify major themes naturally from content — typically 3-5 for shorter content, but scale appropriately for longer/complex content
  - **SUBSECTIONS**: Aim for 3-6 per main section when content supports it — break down themes into granular subtopics
  - **BALANCE RULE**: If a main section has fewer subsections, compensate with more detailed bullet points and sub-points (a., b., c., d., e., etc.) to maintain comprehensive coverage
  - **DEPTH OVER BREADTH**: Prioritize meaningful depth within sections rather than many shallow sections
  - **2X SPEED MENTALITY**: Capture everything as if watching at 2x speed — every significant point, example, number, name, and detail

3. **HIERARCHICAL ORGANIZATION**:
  - Scan entire transcript → identify major themes → group related topics → create subsections for distinct subtopics
  - Let content naturally determine structure: shorter content may have 3-5 main sections, longer/complex content may need more
  - Within longer content, balance between adding more main sections vs. deepening existing sections with more subsections

=== FORMATTING RULES ===

1. **MANDATORY HTML TAGS**:
  - **<strong> tags (SELECTIVE)**: Use HTML <strong></strong> tags (NOT **bold** markdown) for the most important terms, numbers, or names in each bullet point — be selective, typically 1-3 per bullet
  - **<mark> tags (MODERATE)**: Use HTML <mark></mark> tags for critical insights or key takeaways — aim for at least one per subsection to highlight important concepts
  - **CRITICAL**: Always use HTML tags (<strong></strong>, <mark></mark>), NEVER use markdown (**bold**) as it fails frequently, especially with parentheses
  - Example: "Find users <strong>desperate for solutions</strong>, not just interested in new products. The key is <mark>search over persuasion</mark>."

2. **WRITING STYLE**:
  - 1 sentence per bullet point (max 2 if absolutely necessary)
  - Content-specific section titles (not generic terms like "Overview", "Key Takeaways")
  - No robotic phrases ("this video", "the speaker")
  - Use bullet points (-) with lettered sub-points (a., b., c.) for details

3. **READABILITY**:
  - Add strategic line breaks between sections to reduce cognitive load
  - Use concise, impactful expressions
  - Each section should breathe — use spacing to guide the reader's eye

=== CONTENT RULES ===

1. **COMPREHENSIVE COVERAGE**:
  - **BULLET POINTS**: Provide sufficient bullets per subsection to cover the topic adequately (typically 5-10, adjust based on content depth)
  - **SUB-POINTS**: Use a., b., c., d., e., f., etc. when details warrant expansion — aim for clarity and completeness
  - **NO CONTENT LEFT BEHIND**: If the transcript mentions it, include it — either as a bullet point or sub-point
  - Include specific numbers, names, examples, case studies, analogies — wrap the most important ones in <strong></strong> tags selectively

2. **EXAMPLE HANDLING**:
  - Include ALL examples, case studies, analogies, and metaphors mentioned
  - Integrate them as bullet points or sub-points (a., b., c.)
  - Use analogies and metaphors to clarify abstract concepts
  - Connect theory to practice with concrete, relatable examples
  - If multiple examples illustrate the same point, list them all as sub-points

3. **PURPOSE**:
  - Enable quick scanning, deep understanding, and long-term retention
  - Serve learners who want to grasp content without watching the full video
  - Support understanding key concepts and using them for learning or reference

=== LOCALIZATION RULES ===

1. **Natural Expression**:
  - Write naturally in ${languageName}, as if content was originally created in ${languageName}
  - Use expressions and idioms that native ${languageName} speakers actually use
  - Avoid awkward literal translations or unnatural phrasing

2. **MEANINGFUL TRANSLATION over Phonetic Transcription** (CRITICAL):
  - **PREFER semantic translation** when a natural ${languageName} equivalent exists that conveys the meaning better
  - **Slang, colloquialisms, internet terms**: Translate to meaningful local equivalents, NOT phonetic transcription
    - "doomers" → "비관론자" or "파멸론자" (NOT "둠어스") — because "둠어스" is not used locally
    - "hype" → "과대광고" or "버블" (NOT "하이프" or "hype") — meaningful translation preferred
    - "FOMO" → "놓칠까 봐 두려운 심리" or keep "포모(FOMO)" if widely recognized
  - **Test**: If a phonetic transcription would sound foreign/unfamiliar to a native ${languageName} speaker, use semantic translation instead
  - **Rule of thumb**: If the term is NOT commonly used as a loanword in ${languageName}, translate its meaning

3. **Established Technical Terms** (use phonetic + original):
  - For technical/domain terms that ARE commonly used as loanwords in ${languageName}, use phonetic spelling + original in parentheses
  - Examples: "얼리어답터 (Early Adopter)", "스타트업 (Startup)", "피드백 (Feedback)", "플랫폼 (Platform)"
  - These are terms where the English loanword IS already commonly used by native speakers

4. **Universal Terms**:
  - Keep ONLY widely recognized acronyms as-is: AI, API, GDP, NATO, UN, WHO, AGI, etc.
  - Even universal terms should be localized when a natural ${languageName} equivalent exists and is preferred

5. **Proper Nouns**:
  - Convert names (people, companies, places) to natural phonetic spelling in ${languageName}, followed by original in parentheses
  - Examples: "일론 머스크 (Elon Musk)", "구스타프 (Gustaf)", "イーロン・マスク (Elon Musk)", "グスタフ (Gustaf)"

6. **Language**: Write entirely in ${languageName}.`;
}

/**
 * User Prompt 구성
 *
 * 실제 transcript와 작업 지시
 *
 * @param scriptText - 포맷팅된 스크립트 텍스트
 * @returns User prompt
 */
function buildSummaryUserPrompt(scriptText: string): string {
  return `TRANSCRIPT:
${scriptText}

YOUR TASK:
Create a comprehensive summary following all the guidelines provided in the system prompt.`;
}

/**
 * 키워드 추출을 위한 프롬프트 구성
 *
 * 교육적으로 유용한 키워드 추출:
 * - 주요 개념과 용어
 * - 검색 가능한 키워드
 * - 기억 큐로 활용 가능한 용어
 *
 * @param summaryText - 생성된 요약 텍스트
 * @param language - 언어 코드
 * @returns AI 프롬프트
 */
function buildKeywordsPrompt(summaryText: string, language: string): string {
  const languageName = getLanguageName(language);

  return `Extract 5-10 key keywords from the following video summary in ${languageName}.

VIDEO SUMMARY:
${summaryText}

CRITERIA:
1. Core concepts, theories, or principles discussed
2. Technical terms or domain-specific vocabulary central to understanding
3. Memorable terms that serve as memory cues for content recall
4. Searchable terms someone would use to find this content
5. Mix of broad topic keywords and specific concept keywords
6. Learning-relevant terms (concepts to study) over incidental mentions

FORMAT:
- Single words or short phrases (2-3 words max)
- Written in ${languageName}
- Comma-separated list only
- No explanations or additional text
- Order: Most important/general first, then specific

Return ONLY the comma-separated keyword list:`;
}

/**
 * Keywords 추출
 *
 * @param request - 키워드 추출 요청 (Summary 텍스트, 언어)
 * @returns 추출된 키워드 배열
 */
export async function generateKeywords(
  request: { summary: string; language: string }
): Promise<Result<string[], YoutubeError>> {
  try {
    const { summary, language } = request;

    if (!summary || summary.trim().length === 0) {
      return Result.error(
        new YoutubeError(
          'SUMMARY_EMPTY',
          'Summary is empty, cannot extract keywords',
          { language }
        )
      );
    }

    // 1. Helicone 헤더 생성
    const headers = buildHeliconeHeaders({
      feature: 'video-summary-keywords',
      model: 'grok-4-1-fast-non-reasoning',
      properties: {
        language,
        summaryLength: summary.length.toString(),
      },
    });

    // 2. xAI Provider 생성
    const xai = createHeliconeXAI(headers);

    // 3. AI 키워드 추출
    const result = await generateText({
      model: xai('grok-4-1-fast-non-reasoning'),
      prompt: buildKeywordsPrompt(summary, language),
      temperature: 0.2, // 일관성을 위해 낮은 온도
    });

    const keywordsText = result.text.trim();

    // 4. 키워드 파싱 (쉼표로 구분된 리스트)
    const keywords = keywordsText
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .slice(0, 10); // 최대 10개

    if (keywords.length === 0) {
      return Result.error(
        new YoutubeError(
          'KEYWORDS_EXTRACTION_FAILED',
          'Failed to extract keywords from summary',
          { language, summaryLength: summary.length }
        )
      );
    }

    return Result.success(keywords);
  } catch (error) {
    return Result.error(
      new YoutubeError(
        'KEYWORDS_EXTRACTION_FAILED',
        error instanceof Error ? error.message : 'Failed to extract keywords',
        {
          language: request.language,
          originalError: error instanceof Error ? error.message : String(error),
        }
      )
    );
  }
}

/**
 * Video Summary 생성
 *
 * @param request - 요약 생성 요청 (Video Aggregate, 언어)
 * @returns 생성된 요약 텍스트 및 키워드
 */
export async function generateVideoSummary(
  request: GenerateVideoSummaryRequest
): Promise<Result<GenerateVideoSummaryResult, YoutubeError>> {
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
      model: 'grok-4-1-fast-reasoning',
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
    // Note: reasoning 모델은 temperature를 지원하지 않으므로 제거
    const result = await generateText({
      model: xai('grok-4-1-fast-reasoning'),
      system: buildSummarySystemPrompt(language),
      prompt: buildSummaryUserPrompt(scriptText),
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

    // 8. Keywords 추출
    const keywordsResult = await generateKeywords({
      summary: summaryText,
      language,
    });

    // Keywords 추출 실패해도 요약은 반환 (키워드는 빈 배열)
    const keywords = keywordsResult.isSuccess()
      ? keywordsResult.value
      : [];

    return Result.success({
      summary: summaryText,
      keywords,
    });
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
