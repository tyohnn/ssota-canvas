/**
 * AI 요약 생성: rawContent + language → summary + keywords
 */
import { generateText } from 'ai';
import { Result } from '@/utils/result';

import {
  createHeliconeXAI,
  buildHeliconeHeaders,
} from '@/domains/ai-management/backend/providers/helicone-provider';

import { SourceManagementError } from '../../../shared/errors/source-management.error';

export interface GenerateSourceSummaryRequest {
  rawContent: string;
  language: string;
}

export interface GenerateSourceSummaryResult {
  summary: string;
  keywords: string[];
}

function getLanguageName(languageCode: string): string {
  const map: Record<string, string> = {
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
  return map[languageCode.toLowerCase()] ?? languageCode;
}

/**
 * System prompt: research-based educational summary (restored from youtube-app-space
 * generate-video-summary.service.ts). Keeps hierarchy, formatting, localization rules.
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

2. **When to Allow Phonetic Transliteration vs. Semantic Translation** (CRITICAL):
  - Do NOT ban phonetic transliteration entirely. Use it when the term is **culturally accepted** in the target language; use **semantic translation** when it would sound unfamiliar.
  - **Decision criteria** (apply both):
    - **"Would a native speaker understand it without context?"** If yes → treat as naturalized, transliteration is OK. If no (most readers would find it strange) → prefer semantic translation.
      - e.g. Korean: 아이컨택 (eye contact) → widely understood at a glance → allow transliteration.
      - e.g. Korean: 플라우저블 디나이어빌리티 (plausible deniability) → mostly unfamiliar → use semantic translation: "부당성 회피", "부인할 수 있는 애매한 접촉", etc.
    - **"Is it commonly used in media or daily life in that language?"** If frequently used → treat as naturalized loanword, allow transliteration. If rarely used → prefer semantic translation.
  - **Slang, colloquialisms, internet terms**: Prefer meaningful local equivalents, not unfamiliar phonetic transcription.
    - "doomers" → "비관론자" or "파멸론자" (NOT "둠어스")
    - "hype" → "과대광고" or "버블" (NOT "하이프")
    - "FOMO" → "놓칠까 봐 두려운 심리" or "포모(FOMO)" if widely recognized
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

function buildSummaryUserPrompt(rawContent: string): string {
  return `TRANSCRIPT:
${rawContent}

YOUR TASK:
Create a comprehensive summary following all the guidelines provided in the system prompt.`;
}

function buildKeywordsPrompt(summary: string, language: string): string {
  const languageName = getLanguageName(language);
  return `Extract 5-10 key keywords from the following video summary in ${languageName}.

VIDEO SUMMARY:
${summary}

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

export async function generateSourceSummary(
  request: GenerateSourceSummaryRequest
): Promise<Result<GenerateSourceSummaryResult, Error>> {
  try {
    const { rawContent, language } = request;
    if (!rawContent?.trim()) {
      return Result.error(
        new SourceManagementError(
          'SOURCE_SUMMARY_NOT_FOUND',
          'Raw content is empty; cannot generate summary'
        )
      );
    }

    const headers = buildHeliconeHeaders({
      feature: 'source-summary',
      model: 'grok-4-1-fast-reasoning',
      properties: { language, contentLength: String(rawContent.length) },
    });
    const xai = createHeliconeXAI(headers);

    const summaryResult = await generateText({
      model: xai('grok-4-1-fast-reasoning'),
      system: buildSummarySystemPrompt(language),
      prompt: buildSummaryUserPrompt(rawContent),
    });
    const summaryText = summaryResult.text.trim();
    if (!summaryText) {
      return Result.error(
        new SourceManagementError(
          'SOURCE_SUMMARY_CREATION_FAILED',
          'Generated summary is empty'
        )
      );
    }

    const keywordHeaders = buildHeliconeHeaders({
      feature: 'source-summary-keywords',
      model: 'grok-4-1-fast-non-reasoning',
      properties: { language },
    });
    const xaiKeywords = createHeliconeXAI(keywordHeaders);
    const keywordResult = await generateText({
      model: xaiKeywords('grok-4-1-fast-non-reasoning'),
      prompt: buildKeywordsPrompt(summaryText, language),
    });
    const keywords = keywordResult.text
      .trim()
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
      .slice(0, 10);

    return Result.success({ summary: summaryText, keywords });
  } catch (error) {
    return Result.error(
      error instanceof SourceManagementError
        ? error
        : new SourceManagementError(
            'SOURCE_SUMMARY_CREATION_FAILED',
            error instanceof Error ? error.message : 'Failed to generate summary'
          )
    );
  }
}
