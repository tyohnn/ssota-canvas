/**
 * xaiSearch Tool Service
 *
 * xAI Responses API를 통한 웹/X 검색.
 * 기존 executeTools/xaiSearch.ts에서 서비스 레이어로 이동.
 */

import { xai } from '@ai-sdk/xai';
import { streamText } from 'ai';
/**
 * Model ID — xaiSearch 내부에서 사용하는 모델.
 * route.ts의 AGENT_MODEL과 동일하게 유지한다.
 * TODO: 공통 config로 통합 가능.
 */
const XAI_SEARCH_MODEL = 'grok-4-1-fast-reasoning';

// ─── Types ────────────────────────────────────────────────────────────────

export type XaiSearchIntermediate = {
  message?: string;
  step?: string;
  partialContent?: string;
  citations?: Array<{ url: string; title?: string }>;
  steps?: XaiSearchStep[];
};

export type XaiSearchStep = { message?: string; step?: string };

export type XaiSearchFinal = {
  content: string;
  citations: Array<{ url: string; title?: string }>;
  summary: string;
  steps?: XaiSearchStep[];
};

export type XaiSearchYield = XaiSearchIntermediate | XaiSearchFinal;

// ─── Service ──────────────────────────────────────────────────────────────

/**
 * xAI Responses API를 통한 웹/X 검색 실행.
 * preliminary yield(검색 중 상태) → final yield(결과).
 */
export async function* executeXaiSearch(
  args: { query?: string },
  options?: { abortSignal?: AbortSignal }
): AsyncGenerator<XaiSearchYield, XaiSearchFinal, void> {
  const query = typeof args?.query === 'string' && args.query.trim() ? args.query.trim() : '';
  if (!query) {
    const empty: XaiSearchFinal = { content: '', citations: [], summary: 'No search query provided.' };
    yield empty;
    return empty;
  }

  const steps: XaiSearchStep[] = [{ message: 'Searching…' }];
  yield { message: 'Searching…' };

  const result = streamText({
    model: xai.responses(XAI_SEARCH_MODEL),
    system: `You are a search tool executed by the main agent. The main agent delegated this search to you based on the user's query.

Your role: Use the search results to investigate the query, then write a summary for the main agent—not for the end user. The main agent will use your summary to respond to the user.

Requirements:
- Base your answer only on the search results (web and X).
- Write a concise summary: key facts, findings, and notable sources.
- Include which sources support which points so the main agent can cite them.
- Use clear, neutral language. Do not address the user directly (e.g. avoid "you asked..."); the main agent will handle the reply.`,
    messages: [{ role: 'user', content: query }],
    tools: {
      web_search: xai.tools.webSearch(),
      x_search: xai.tools.xSearch(),
    },
    maxOutputTokens: 2048,
    abortSignal: options?.abortSignal,
  });

  let content = '';
  const citations: Array<{ url: string; title?: string }> = [];
  let lastYieldedCitationCount = 0;

  for await (const part of result.fullStream) {
    if (part.type === 'text-delta') {
      content += part.text;
    }
    if (part.type === 'source' && 'url' in part && typeof part.url === 'string') {
      citations.push({
        url: part.url,
        title: (part as { title?: string }).title,
      });
    }

    if (part.type === 'tool-result') {
      const stepName = (part as { toolName?: string }).toolName ?? 'search';
      const stepEntry: XaiSearchStep = { message: `${stepName} completed`, step: stepName };
      steps.push(stepEntry);
      yield {
        message: stepEntry.message,
        step: stepName,
        partialContent: content.slice(0, 500) + (content.length > 500 ? '…' : ''),
        citations: [...citations],
        steps: [...steps],
      };
    } else if (
      part.type === 'source' &&
      citations.length > lastYieldedCitationCount
    ) {
      lastYieldedCitationCount = citations.length;
      const stepEntry: XaiSearchStep = {
        message: `Found ${citations.length} source${citations.length === 1 ? '' : 's'}`,
      };
      steps.push(stepEntry);
      yield {
        message: stepEntry.message,
        partialContent: content.slice(0, 300) + (content.length > 300 ? '…' : ''),
        citations: [...citations],
        steps: [...steps],
      };
    }
  }

  const final: XaiSearchFinal = {
    content,
    citations,
    summary: content.slice(0, 300) + (content.length > 300 ? '…' : ''),
    steps,
  };
  yield final;
  return final;
}
