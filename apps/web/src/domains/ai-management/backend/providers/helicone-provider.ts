/**
 * Helicone Provider
 *
 * OpenAI 및 Google AI SDK를 Helicone을 통해 추적하는 Provider
 * - reasoning-delta, text-start, text-end 등 모든 이벤트 자동 지원
 * - Helicone은 HTTP 헤더로 투명하게 로깅
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

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
  const getEnv = (key: string) => process.env[key] || '';
  const heliconeApiKey = getEnv('HELICONE_API_KEY');

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
