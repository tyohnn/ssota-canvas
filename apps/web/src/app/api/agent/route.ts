import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { config } from '@/config';
import { DrizzleEventLogRepository } from '@/domains/ai-management/backend/repositories/implementations/drizzle-event-log.repository';
import { MemorySearchService } from '@/domains/ai-management/backend/services/memory-search.service';
import { ContextAssemblyService } from '@/domains/ai-management/backend/services/context-assembly.service';
import { ToolExecutionService } from '@/domains/ai-management/backend/services/tool-execution.service';
import { AssembledContext } from '@/domains/ai-management/backend/services/interfaces/context-assembly.service.interface';
import { createHeliconeOpenAI } from '@/domains/ai-management/backend/providers/helicone-provider';
// import { createHeliconeGateway } from '@/lib';
import {
  addBlocksTool,
  updateTitleTool,
  updateContentTool,
  updatePropertiesTool,
  connectBlocksTool,
  executeBlockActionTool,
  searchByKeywordInPageTool,
  getBlockTypeDetailTool,
  searchByKeywordTool,
  searchByHopTool,
  searchBySemanticTool,
  searchBlockTypesTool,
} from '@/domains/ai-management/backend/services/prompt/tools';

/**
 * Agent API Route
 * Vercel AI SDK를 사용한 AI Agent 실행
 *
 * 아키텍처:
 * - Server: LLM reasoning + 서버 사이드 툴 실행 (execute 제공)
 *   - searchByKeyword, searchByHop, searchBySemantic, searchBlockTypes
 * - Client: 클라이언트 사이드 툴 실행 (execute 없음, onToolCall 처리)
 *   - addBlocks, updateTitle, updateContent, updateProperties, connectBlocks, executeBlockAction, searchByKeywordInPage
 *
 * Streaming 구조:
 * - createUIMessageStream: UIMessage 스트림 생성 (originalMessages 포함)
 * - writer.merge(result.toUIMessageStream()): streamText 결과를 병합
 * - createUIMessageStreamResponse: useChat 호환 응답 생성
 */
export const maxDuration = 300; // 5분 타임아웃

// Helicone OpenAI Provider (tool 데이터 추적을 위해 사용)
const helicone = createHeliconeOpenAI({
  apiKey: config.ai.helicone,
});

// TODO: Gateway는 tool 데이터 문제 해결 후 사용
// Helicone + Vercel AI Gateway Provider
// 모든 AI 프로바이더(OpenAI, Anthropic, xAI 등)를 Helicone으로 추적
// const gateway = createHeliconeGateway({
//   heliconeApiKey: process.env.HELICONE_API_KEY,
//   vercelAIGatewayApiKey: process.env.AI_GATEWAY_API_KEY,
// });

/**
 * Client Context (프론트엔드에서 전달)
 */
interface ClientContext {
  pageId: string;
  workspaceId: string;
  organizationId: string;
  selectedBlockIds: string[];
  visibleBlockIds: string[];
  recentlyModifiedBlockIds?: string[];
}

// ============================================================================
// Server-Side Tool Execution
// ============================================================================
// Note: 서버 사이드 툴 실행은 ToolExecutionService에서 처리됩니다.

// ============================================================================
// API Route Handler
// ============================================================================

/**
 * POST /api/agent
 * 사용자 발화를 받아 AI Agent 실행
 */
export async function POST(req: Request) {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. 메시지 파싱
    const body = await req.json();
    const { messages } = body;

    // 3. Client Context 추출 (마지막 사용자 메시지의 metadata에서)
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: UIMessage) => m.role === 'user');
    let frontendContext: Partial<ClientContext> = {};

    // metadata에서 clientContext 추출
    if (lastUserMessage?.metadata?.clientContext) {
      try {
        frontendContext = lastUserMessage.metadata.clientContext;
      } catch (e) {
        console.warn('Failed to parse client context:', e);
      }
    }

    // 4. Server Context 조립
    const context = await assembleServerContext(frontendContext, user.id);

    // 5. System Prompt 빌드 및 서비스 초기화
    const eventLogRepository = new DrizzleEventLogRepository();
    const memorySearchService = new MemorySearchService(eventLogRepository);
    const contextAssemblyService = new ContextAssemblyService(
      eventLogRepository,
      memorySearchService
    );
    const toolExecutionService = new ToolExecutionService(eventLogRepository);
    const systemPrompt = contextAssemblyService.buildSystemPrompt(context);

    // 6. Vercel AI SDK streamText 실행 (client-tool.md 패턴)
    const result = streamText({
      model: helicone('gpt-5-mini'), // OpenAI 직접 사용 (tool 데이터 추적을 위해)
      // model: gateway('openai/gpt-5-mini'), // TODO: tool 데이터 문제 해결 후 Gateway 사용
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      providerOptions: {
        openai: {
          reasoningEffort: 'medium',
          reasoningSummary: 'detailed',
        },
      },
      // 🔄 Multi-Step Calls: 도구 실행 후 계속 반복
      // 최대 10단계까지 실행하며, 각 단계마다 도구를 호출하고 결과를 받아 다음 작업 수행
      stopWhen: stepCountIs(20),
      tools: {
        // ========================================
        // Client-Side Tools (no execute function)
        // ========================================
        addBlocks: addBlocksTool,
        updateTitle: updateTitleTool,
        updateContent: updateContentTool,
        updateProperties: updatePropertiesTool,
        connectBlocks: connectBlocksTool,
        executeBlockAction: executeBlockActionTool,
        searchByKeywordInPage: searchByKeywordInPageTool,
        // ========================================
        // Server-Side Tools (with execute)
        // ========================================
        getBlockTypeDetail: {
          ...getBlockTypeDetailTool,
          execute: async params => {
            const result =
              await toolExecutionService.getBlockTypeDetail(params);
            return result.result;
          },
        },
        searchByKeyword: {
          ...searchByKeywordTool,
          execute: async params => {
            const result = await toolExecutionService.searchByKeyword(
              params,
              frontendContext.pageId || '',
              user.id
            );
            return result.result;
          },
        },
        searchByHop: {
          ...searchByHopTool,
          execute: async params => {
            const result = await toolExecutionService.searchByHop(
              params,
              frontendContext.pageId || '',
              user.id
            );
            return result.result;
          },
        },
        searchBySemantic: {
          ...searchBySemanticTool,
          execute: async params => {
            const result = await toolExecutionService.searchBySemantic(
              params,
              frontendContext.pageId || '',
              user.id
            );
            return result.result;
          },
        },
        searchBlockTypes: {
          ...searchBlockTypesTool,
          execute: async params => {
            const result = await toolExecutionService.searchBlockTypes(params);
            return result.result;
          },
        },
      },
    });

    // 7. Stream 응답 반환 (client-tool.md 패턴)
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in /api/agent:', error);
    return new Response(
      JSON.stringify({
        error: 'Agent execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Server Context 조립
 * DB/벡터 검색이 필요한 컨텍스트를 서버에서 수집
 */
async function assembleServerContext(
  frontendContext: Partial<ClientContext>,
  userId: string
): Promise<AssembledContext> {
  // 의존성 주입
  const eventLogRepository = new DrizzleEventLogRepository();
  const memorySearchService = new MemorySearchService(eventLogRepository);
  const contextAssemblyService = new ContextAssemblyService(
    eventLogRepository,
    memorySearchService
  );

  const pageId = frontendContext.pageId || '';
  const utterance = 'context'; // 컨텍스트 조립용 임시 발화

  try {
    // Context 조립 (에러 시 빈 컨텍스트 반환)
    const context = await contextAssemblyService.assembleContext(
      pageId,
      userId,
      utterance,
      frontendContext.selectedBlockIds,
      frontendContext.visibleBlockIds
    );

    return context;
  } catch (error) {
    console.error('Failed to assemble server context:', error);
    // 빈 컨텍스트 반환
    return {
      shortTermMemory: [],
      longTermMemory: [],
      canvasContext: {
        selectedBlocks: [],
        nearbyBlocks: [],
        connectedBlocks: [],
        semanticBlocks: [],
      },
    };
  }
}
