import { createGateway } from '@ai-sdk/gateway';

/**
 * Helicone + Vercel AI Gateway Provider
 *
 * Vercel AI Gateway의 모든 프로바이더(OpenAI, Anthropic, Bedrock 등)를
 * Helicone을 통해 추적할 수 있는 통합 Provider
 *
 * 기능:
 * - 🌐 모든 AI Gateway 프로바이더 지원 (OpenAI, Anthropic, Google, xAI, etc.)
 * - 📊 Helicone을 통한 통합 모니터링 및 로깅
 * - 🔄 Provider 라우팅 및 폴백 지원
 * - 🎯 Reasoning-delta, text-start, text-end 등 모든 이벤트 자동 지원
 *
 * 사용 방법:
 * ```typescript
 * import { createHeliconeGateway } from '@/lib/ai/helicone/gateway-provider';
 * import { generateText } from 'ai';
 *
 * const gateway = createHeliconeGateway({
 *   heliconeApiKey: process.env.HELICONE_API_KEY,
 *   vercelAIGatewayApiKey: process.env.AI_GATEWAY_API_KEY,
 * });
 *
 * // 모든 프로바이더 사용 가능
 * const result = await generateText({
 *   model: gateway('openai/gpt-5-mini'),  // or 'anthropic/claude-3.5-sonnet', 'xai/grok-3', etc.
 *   prompt: 'Hello!',
 * });
 * ```
 *
 * Helicone 대시보드:
 * - https://helicone.ai 에서 모든 AI Gateway 요청을 추적할 수 있습니다
 * - 프로바이더별, 모델별 사용량 및 비용 분석 가능
 * - 요청/응답 로그, 레이턴시, 에러 트래킹 등
 */

interface HeliconeGatewayConfig {
  /**
   * Helicone API Key
   * @default process.env.HELICONE_API_KEY
   */
  heliconeApiKey?: string;

  /**
   * Vercel AI Gateway API Key
   * @default process.env.VERCEL_AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY
   */
  vercelAIGatewayApiKey?: string;

  /**
   * 추가 Helicone 헤더 (선택사항)
   *
   * 사용 가능한 헤더들:
   * - Helicone-User-Id: 사용자 ID 트래킹
   * - Helicone-Property-*: 커스텀 속성 추가
   * - Helicone-Session-Id: 세션 트래킹
   * - Helicone-Prompt-Id: 프롬프트 버전 관리
   *
   * @see https://docs.helicone.ai/features/advanced-usage/custom-properties
   */
  additionalHeaders?: Record<string, string>;

  /**
   * Helicone 프록시 URL (커스텀 배포시 사용)
   * @default 'https://vercel.helicone.ai/v1/ai'
   */
  baseURL?: string;
}

/**
 * Helicone + Vercel AI Gateway Provider 생성
 *
 * 이 Provider를 사용하면:
 * 1. Vercel AI Gateway의 모든 프로바이더를 사용할 수 있습니다
 * 2. 모든 요청이 Helicone을 통해 자동으로 로깅됩니다
 * 3. AI Gateway의 라우팅, 폴백, 캐싱 기능을 그대로 사용할 수 있습니다
 *
 * @example
 * ```typescript
 * // API Route에서 사용
 * import { createHeliconeGateway } from '@/lib/ai/helicone/gateway-provider';
 * import { generateText } from 'ai';
 *
 * const gateway = createHeliconeGateway({
 *   heliconeApiKey: process.env.HELICONE_API_KEY,
 *   vercelAIGatewayApiKey: process.env.AI_GATEWAY_API_KEY,
 * });
 *
 * const result = await generateText({
 *   model: gateway('openai/gpt-5-mini'),
 *   prompt: 'Explain quantum computing',
 * });
 * ```
 *
 * @example
 * ```typescript
 * // 사용자별 추적
 * const gateway = createHeliconeGateway({
 *   additionalHeaders: {
 *     'Helicone-User-Id': userId,
 *     'Helicone-Session-Id': sessionId,
 *     'Helicone-Property-Feature': 'ai-agent',
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // 프로바이더 폴백 사용
 * const result = await generateText({
 *   model: gateway('openai/gpt-5-mini'),
 *   prompt: 'Hello',
 *   providerOptions: {
 *     gateway: {
 *       order: ['openai', 'anthropic', 'bedrock'],  // OpenAI 실패시 Anthropic, Bedrock 순으로 폴백
 *     }
 *   }
 * });
 * ```
 */
export function createHeliconeGateway(config?: HeliconeGatewayConfig) {
  const heliconeApiKey = config?.heliconeApiKey || '';
  const vercelAIGatewayApiKey = config?.vercelAIGatewayApiKey || '';

  if (!heliconeApiKey) {
    throw new Error(
      'HELICONE_API_KEY is required. Set it in environment variables or pass it in config.'
    );
  }

  if (!vercelAIGatewayApiKey) {
    throw new Error(
      'VERCEL_AI_GATEWAY_API_KEY (or AI_GATEWAY_API_KEY) is required. ' +
        'Set it in environment variables or pass it in config.'
    );
  }

  const baseURL = config?.baseURL || 'https://vercel.helicone.ai/v1/ai';

  const headers = {
    'Helicone-Auth': `Bearer ${heliconeApiKey}`,
    ...config?.additionalHeaders,
  };

  // @ai-sdk/gateway를 사용하여 Gateway Provider 생성
  // Helicone 프록시 URL과 헤더를 포함합니다
  const gateway = createGateway({
    apiKey: vercelAIGatewayApiKey,
    baseURL: baseURL,
    headers: headers,
  });

  return gateway;
}

/**
 * Helicone 헤더 빌더 유틸리티
 *
 * 요청별로 다른 Helicone 메타데이터를 추가할 때 사용
 *
 * @example
 * ```typescript
 * import { createHeliconeGateway, buildHeliconeHeaders } from '@/lib/ai/helicone/gateway-provider';
 *
 * const gateway = createHeliconeGateway({
 *   additionalHeaders: buildHeliconeHeaders({
 *     userId: 'user-123',
 *     sessionId: 'session-456',
 *     properties: {
 *       environment: 'production',
 *       feature: 'chat',
 *     }
 *   })
 * });
 * ```
 */
export function buildHeliconeHeaders(options: {
  userId?: string;
  sessionId?: string;
  promptId?: string;
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

  if (options.properties) {
    Object.entries(options.properties).forEach(([key, value]) => {
      headers[`Helicone-Property-${key}`] = value;
    });
  }

  return headers;
}
