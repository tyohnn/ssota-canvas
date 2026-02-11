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
  };
  return map[languageCode.toLowerCase()] ?? languageCode;
}

function buildSummarySystemPrompt(language: string): string {
  const languageName = getLanguageName(language);
  return `You are an expert content summarizer. Create a comprehensive yet concise summary in ${languageName}.

RULES:
- Use clear hierarchy: ## for main sections, ### for subsections
- Use bullet points (-) with sub-points (a., b., c.) where needed
- Use <strong> for key terms and <mark> for critical insights (HTML only, no markdown bold)
- Write naturally in ${languageName}
- Cover all significant points from the content
- Output in valid HTML/markdown mix (##, ###, -, <strong>, <mark>)`;
}

function buildSummaryUserPrompt(rawContent: string): string {
  return `CONTENT:\n${rawContent}\n\nCreate a comprehensive summary following the system prompt guidelines.`;
}

function buildKeywordsPrompt(summary: string, language: string): string {
  const languageName = getLanguageName(language);
  return `Extract 5-10 key keywords from the following summary in ${languageName}.

SUMMARY:
${summary}

Return ONLY a comma-separated list of keywords, no other text.`;
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
      temperature: 0.2,
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
