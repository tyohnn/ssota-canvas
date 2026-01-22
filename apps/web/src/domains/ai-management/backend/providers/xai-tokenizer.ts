/**
 * xAI Tokenizer
 *
 * xAI API를 사용하여 정확한 토큰 수 계산
 * - Grok 모델의 실제 토큰 수 계산
 * - API 실패 시 fallback 추정값 제공
 */

import { config } from '@/config';

/**
 * xAI API를 사용하여 정확한 토큰 수 계산
 *
 * xAI의 /v1/tokenize-text 엔드포인트를 사용하여
 * Grok 모델이 실제로 사용하는 토큰 수를 계산합니다.
 *
 * @param text - 토큰화할 텍스트
 * @returns 토큰 수 (실패 시 추정값 반환)
 *
 * @example
 * ```typescript
 * const tokenCount = await estimateXaiTokens('Hello, world!');
 * console.log(`Token count: ${tokenCount}`);
 * ```
 */
export async function estimateXaiTokens(text: string): Promise<number> {
  const xaiApiKey = config.ai.xai;

  // API key가 없으면 추정값 반환
  if (!xaiApiKey) {
    // 대략 1 token = 4 characters (fallback)
    return Math.ceil(text.length / 4);
  }

  try {
    const response = await fetch('https://api.x.ai/v1/tokenize-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        text,
      }),
    });

    if (!response.ok) {
      // API 호출 실패 시 추정값 반환
      console.warn(
        `[estimateXaiTokens] xAI tokenize API failed: ${response.statusText}. Using fallback estimation.`
      );
      return Math.ceil(text.length / 4);
    }

    const data = (await response.json()) as { tokens: string[] };
    return data.tokens?.length ?? Math.ceil(text.length / 4);
  } catch (error) {
    // 에러 발생 시 추정값 반환
    console.warn(
      `[estimateXaiTokens] Error calling xAI tokenize API: ${error instanceof Error ? error.message : String(error)}. Using fallback estimation.`
    );
    return Math.ceil(text.length / 4);
  }
}
