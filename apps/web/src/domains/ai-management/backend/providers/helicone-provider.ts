/**
 * Helicone Provider
 *
 * OpenAI 및 Google AI SDK를 Helicone을 통해 추적하는 Provider
 * - reasoning-delta, text-start, text-end 등 모든 이벤트 자동 지원
 * - Helicone은 HTTP 헤더로 투명하게 로깅
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { config } from '@/config';

/**
 * Helicone OpenAI Provider 생성
 *
 * @param headers - 추가 Helicone 헤더 (선택적)
 * @returns OpenAI Provider 인스턴스
 */
export function createHeliconeOpenAI(
  headers?: Record<string, string>
): ReturnType<typeof createOpenAI> {
  // Helper to get env var
  const heliconeApiKey = config.ai.helicone;

  if (!heliconeApiKey) {
    throw new Error('HELICONE_API_KEY is required');
  }

  const openai = createOpenAI({
    baseURL: 'https://oai.helicone.ai/v1',
    headers: {
      'Helicone-Auth': `Bearer ${heliconeApiKey}`,
      ...headers,
    },
  });

  return openai;
}

/**
 * Helicone Google Provider 생성
 *
 * @param headers - 추가 Helicone 헤더 (선택적)
 * @returns Google Provider 인스턴스
 */
export function createHeliconeGoogle(
  headers?: Record<string, string>
): ReturnType<typeof createGoogleGenerativeAI> {
  // Helper to get env var
  const getEnv = (key: string) => process.env[key] || '';
  const heliconeApiKey = getEnv('HELICONE_API_KEY');

  if (!heliconeApiKey) {
    throw new Error('HELICONE_API_KEY is required');
  }

  const google = createGoogleGenerativeAI({
    baseURL: 'https://oai.helicone.ai/v1',
    headers: {
      'Helicone-Auth': `Bearer ${heliconeApiKey}`,
      ...headers,
    },
  });

  return google;
}

/**
 * Helicone 헤더 빌더 유틸리티
 *
 * 요청별로 다른 Helicone 메타데이터를 추가할 때 사용
 *
 * @example
 * ```typescript
 * const headers = buildHeliconeHeaders({
 *   userId: 'user-123',
 *   feature: 'image-generate',
 *   model: 'openai/gpt-image-1',
 * });
 * ```
 */
export function buildHeliconeHeaders(options: {
  userId?: string;
  sessionId?: string;
  promptId?: string;
  feature?: string;
  model?: string;
  properties?: Record<string, string>;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options.userId) {
    headers['Helicone-User-Id'] = options.userId;
  }

  if (options.sessionId) {
    headers['Helicone-Session-Id'] = options.sessionId;
  }

  if (options.promptId) {
    headers['Helicone-Prompt-Id'] = options.promptId;
  }

  if (options.feature) {
    headers['Helicone-Property-Feature'] = options.feature;
  }

  if (options.model) {
    headers['Helicone-Property-Model'] = options.model;
  }

  if (options.properties) {
    Object.entries(options.properties).forEach(([key, value]) => {
      headers[`Helicone-Property-${key}`] = value;
    });
  }

  return headers;
}

/**
 * Helicone xAI Provider 생성
 *
 * OpenAI-compatible xAI API를 Helicone을 통해 추적하는 Provider
 * - OpenAI와 동일한 패턴 사용
 * - Helicone 프록시를 통해 자동 로깅
 * - reasoning-delta, text-start, text-end 등 모든 이벤트 자동 지원
 *
 * @param headers - 추가 Helicone 헤더 (선택적)
 * @returns OpenAI Provider 인스턴스 (xAI용)
 *
 * @example
 * ```typescript
 * import { createHeliconeXAI, buildHeliconeHeaders } from '@/domains/ai-management/backend/providers/helicone-provider';
 * import { generateText } from 'ai';
 *
 * const headers = buildHeliconeHeaders({
 *   feature: 'video-summary',
 *   model: 'grok-4.1-fast',
 * });
 *
 * const xai = createHeliconeXAI(headers);
 *
 * const result = await generateText({
 *   model: xai('grok-4.1-fast'),
 *   prompt: 'Summarize this video...',
 * });
 * ```
 */
export function createHeliconeXAI(
  headers?: Record<string, string>
): ReturnType<typeof createOpenAI> {
  const heliconeApiKey = config.ai.helicone;
  const xaiApiKey = config.ai.xai;

  if (!heliconeApiKey) {
    throw new Error('HELICONE_API_KEY is required');
  }

  if (!xaiApiKey) {
    throw new Error(
      'XAI_API_KEY is required. Set it in environment variables.'
    );
  }

  // xAI는 OpenAI-compatible API를 제공하므로 createOpenAI 사용
  // Helicone의 xAI 프록시 엔드포인트 사용: https://x.helicone.ai/v1
  const xai = createOpenAI({
    apiKey: xaiApiKey, // xAI API key를 Authorization 헤더에 사용
    baseURL: 'https://x.helicone.ai/v1', // Helicone xAI 프록시
    headers: {
      'Helicone-Auth': `Bearer ${heliconeApiKey}`, // Helicone 인증
      ...headers,
    },
  });

  return xai;
}

/**
 * Helicone Anthropic Provider 생성
 *
 * Anthropic Claude API를 Helicone을 통해 추적하는 Provider
 * - Helicone 프록시를 통해 자동 로깅
 * - 모든 이벤트 자동 지원
 *
 * @param headers - 추가 Helicone 헤더 (선택적)
 * @returns Anthropic Provider 인스턴스
 *
 * @example
 * ```typescript
 * import { createHeliconeAnthropic, buildHeliconeHeaders } from '@/domains/ai-management/backend/providers/helicone-provider';
 * import { generateText } from 'ai';
 *
 * const headers = buildHeliconeHeaders({
 *   feature: 'video-summary-translation',
 *   model: 'claude-haiku-4-5',
 * });
 *
 * const anthropic = createHeliconeAnthropic(headers);
 *
 * const result = await generateText({
 *   model: anthropic('claude-haiku-4-5'),
 *   prompt: 'Translate this summary...',
 * });
 * ```
 */
export function createHeliconeAnthropic(
  headers?: Record<string, string>
): ReturnType<typeof createAnthropic> {
  const heliconeApiKey = config.ai.helicone;
  const anthropicApiKey = config.ai.anthropic;

  if (!heliconeApiKey) {
    throw new Error('HELICONE_API_KEY is required');
  }

  if (!anthropicApiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is required. Set it in environment variables.'
    );
  }

  // Helicone의 Anthropic 프록시 엔드포인트 사용
  // Anthropic API는 /v1 엔드포인트가 아닌 루트 경로를 사용합니다
  const anthropic = createAnthropic({
    apiKey: anthropicApiKey, // Anthropic API key
    baseURL: 'https://anthropic.helicone.ai', // Helicone Anthropic 프록시 (루트 경로)
    headers: {
      'Helicone-Auth': `Bearer ${heliconeApiKey}`, // Helicone 인증
      ...headers,
    },
  });

  return anthropic;
}

// Re-export tokenizer utilities
export { estimateXaiTokens } from './xai-tokenizer';
