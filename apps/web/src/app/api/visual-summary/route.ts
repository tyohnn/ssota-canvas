/**
 * Visual Summary API Route
 * 
 * xAI (Grok)를 Vercel AI Gateway를 통해 사용하여 Visual Summary Canvasdown을 생성하는 API
 * (/api/agent와 동일한 패턴)
 * 
 * Client-side tool 패턴:
 * - renderCanvasdown tool은 execute 없이 정의 (client-side execution)
 * - LLM이 tool call을 생성하면 클라이언트에서 onToolCall로 처리
 * - Multi-step: stepCountIs로 여러 번의 tool call 지원
 * - useChat의 sendAutomaticallyWhen으로 자동 multi-step 처리
 * 
 * Observability:
 * - Vercel AI Gateway의 내장 observability 사용
 * - Vercel Dashboard → Observability → AI Gateway에서 자동 모니터링
 * - Requests by Model, TTFT, Token Count, Cost 등 자동 추적
 */

import { streamText, stepCountIs, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import { config } from '@/config';

import {
  buildVisualSummarySystemPrompt,
  buildVisualSummaryUserPrompt,
} from '@/domains/ai-visual-summary/backend/services/prompt-builder.service';
import {
  renderCanvasdownTool,
  renderCanvasdownRightTool,
  renderCanvasdownBelowTool,
  planTodoTool,
  updateTodoTool,
} from '@/domains/ai-visual-summary/backend/services/prompt/tools';
import { requireAuth } from '@/domains/auth/server/auth-guard';
import type { GenerateVisualSummaryRequest } from '@/domains/ai-visual-summary/shared/types/visual-summary.types';

export const maxDuration = 300; // 5분 타임아웃

/**
 * POST /api/visual-summary
 * Source 블록의 요약 텍스트를 받아 Visual Summary Canvasdown을 스트리밍으로 생성
 */
export async function POST(req: Request) {
  try {
    // 1. 인증 확인
    let user;
    try {
      user = await requireAuth();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. 요청 본문 파싱 (useChat 형식)
    const body = await req.json();
    const { messages } = body;

    // 3. 마지막 사용자 메시지에서 요청 정보 추출
    const lastUserMessage = [...(messages as UIMessage[])]
      .reverse()
      .find((m: UIMessage) => m.role === 'user');

    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // metadata에서 request 추출
    let request: GenerateVisualSummaryRequest | undefined;
    if (lastUserMessage.metadata && typeof lastUserMessage.metadata === 'object' && 'request' in lastUserMessage.metadata) {
      try {
        request = lastUserMessage.metadata.request as GenerateVisualSummaryRequest;
      } catch (e) {
        console.warn('[POST /api/visual-summary] Failed to parse request from metadata:', e);
      }
    }

    // request가 없으면 메시지 텍스트를 summary로 사용 (fallback)
    const textPart = lastUserMessage.parts?.find((p: any) => p.type === 'text' && 'text' in p) as { text?: string } | undefined;
    const summary = request?.summary || textPart?.text || '';
    const templateId = request?.templateId || '';
    const templateSpec = request?.templateSpec || '';
    const sourceTitle = request?.sourceTitle;
    const sourceChannelName = request?.sourceChannelName;

    // 4. 입력 검증
    if (!summary || !templateId || !templateSpec) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: summary, templateId, templateSpec',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Vercel AI Gateway Provider 생성
    const gateway = createGateway({
      apiKey: config.ai.gateway,
    });

    // 6. 템플릿 이름 가져오기 (templateId에서)
    const templateName = templateId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // 7. 프롬프트 빌드
    const systemPrompt = buildVisualSummarySystemPrompt(templateSpec, templateName);
    const userPrompt = buildVisualSummaryUserPrompt(
      summary,
      templateName,
      sourceTitle,
      sourceChannelName
    );

    // 8. 마지막 user 메시지의 텍스트를 빌드된 userPrompt로 교체 (multi-turn/tool 호출 유지)
    type TextPart = { type: 'text'; text: string };
    const modifiedMessages = (messages as UIMessage[]).map((msg: UIMessage) => {
      if (msg.role !== 'user' || msg !== lastUserMessage) {
        return msg;
      }
      const parts = Array.isArray(msg.parts) ? [...msg.parts] : [];
      const textIndex = parts.findIndex((p: unknown) => (p as TextPart).type === 'text' && 'text' in (p as TextPart));
      const newTextPart: TextPart = { type: 'text', text: userPrompt };
      if (textIndex >= 0) {
        parts[textIndex] = newTextPart as (typeof parts)[number];
      } else {
        parts.push(newTextPart as (typeof parts)[number]);
      }
      return { ...msg, parts };
    });

    // 9. Vercel AI SDK streamText 실행 (/api/agent와 동일한 패턴)
    // - messages: convertToModelMessages로 변환 (tool result 포함)
    // - stopWhen: stepCountIs로 multi-step 지원
    // - Client-side tool (no execute) → onToolCall에서 처리
    const result = streamText({
      // Step 2: Non-reasoning 모델로 전환 (reasoning 이벤트 시퀀스 문제 완전 회피)
      // 가격 동일 ($0.20/M input, $0.50/M output), Context window 동일 (2M tokens), Tool calling 지원
      model: gateway('xai/grok-4.1-fast-non-reasoning'), // xAI via Vercel AI Gateway
      system: systemPrompt,
      messages: await convertToModelMessages(modifiedMessages),
      tools: {
        // Client-side tool (no execute function)
        // Tool call이 생성되면 클라이언트 onToolCall에서 처리
        renderCanvasdown: renderCanvasdownTool,
        renderCanvasdownRight: renderCanvasdownRightTool,
        renderCanvasdownBelow: renderCanvasdownBelowTool,
        planTodo: planTodoTool,
        updateTodo: updateTodoTool,
      },
      // Multi-step: 최대 10단계까지 실행
      // 각 단계마다 tool call → client 처리 → tool result → 다음 단계
      stopWhen: stepCountIs(10),
    });

    // 10. UI Message Stream 응답 반환
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('[POST /api/visual-summary] Error:', error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
