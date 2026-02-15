import { xai } from '@ai-sdk/xai';
import { streamText, convertToModelMessages } from 'ai';
import { randomUUID } from 'crypto';
import type {
  SystemModelMessage,
  UserModelMessage,
  AssistantModelMessage,
  ToolModelMessage,
} from 'ai';
import { requireAuth } from '@/domains/auth/server/auth-guard';
import { SOPHI_V2_SYSTEM_PROMPT } from './prompt';
import { buildDynamicContext, parseDynamicContext } from './context-builder';
import {
  renderCanvasdownTool,
  patchCanvasdownTool,
  xaiSearchTool,
  grepBlockContentTool,
  globBlocksTool,
  readBlockLinesTool,
  hopSearchTool,
  searchGroupTool,
  searchBySemanticTool,
  getPageEventsTool,
  grepEventsTool,
  editBlockLinesTool,
  createTodosTool,
  canvasActionTool,
  organizeLayoutTool,
} from './tools';
import {
  executeXaiSearch,
  executeGrepBlockContent,
  executeGlobBlocks,
  executeReadBlockLines,
  executeHopSearch,
  executeSearchGroup,
  executeSearchBySemantic,
} from '@/domains/ai-management/backend/services/tools';
import { DrizzleBlockSearchRepository } from '@/domains/ai-management/backend/repositories/implementations/drizzle-block-search.repository';
import { DrizzleConnectionSearchRepository } from '@/domains/ai-management/backend/repositories/implementations/drizzle-connection-search.repository';
import { DrizzleBlockMountRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-block-mount.repository';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import {
  DrizzleEventLogRepository,
  EventLogService,
  EventContextService,
  EventSearchService,
} from '@/domains/event-management';
import { createGetPageEventsTool, createGrepEventsTool } from './event-tools';
import { AGENT_MODEL } from './constants';

/** Serialize tool inputSchema for debug log (Zod or similar). */
function getSchemaSummary(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return null;
  const s = schema as Record<string, unknown>;
  if (typeof s.jsonSchema === 'function') return s.jsonSchema();
  if (s.shape && typeof s.shape === 'object') return { type: 'object', keys: Object.keys(s.shape as object) };
  return { _: String(schema).slice(0, 200) };
}

export const maxDuration = 300;

type ModelMessage =
  | SystemModelMessage
  | UserModelMessage
  | AssistantModelMessage
  | ToolModelMessage;

/**
 * Inject dynamic context into the last user message
 * 
 * @param messages - Model messages
 * @param dynamicContext - Dynamic context string
 * @returns Messages with context injected
 */
function injectDynamicContext(
  messages: ModelMessage[],
  dynamicContext: string
): ModelMessage[] {
  if (!dynamicContext || dynamicContext.trim() === '') {
    return messages;
  }

  // Find the last user message (manual implementation for ES2022 compatibility)
  let lastUserIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') {
      lastUserIndex = i;
      break;
    }
  }

  if (lastUserIndex === -1) {
    return messages;
  }

  const updatedMessages = [...messages];
  const lastUserMsg = updatedMessages[lastUserIndex]!; // Safe: we checked lastUserIndex !== -1

  // Only process user messages
  if (lastUserMsg.role !== 'user') {
    return messages;
  }

  // Prepend dynamic context to the user message content
  const contextBlock = `[Context]\n${dynamicContext}\n\n---\n\n`;

  if (typeof lastUserMsg.content === 'string') {
    updatedMessages[lastUserIndex] = {
      ...lastUserMsg,
      content: contextBlock + lastUserMsg.content,
    } as ModelMessage;
  } else if (Array.isArray(lastUserMsg.content)) {
    // For multi-part content, prepend context as a text part
    updatedMessages[lastUserIndex] = {
      ...lastUserMsg,
      content: [
        { type: 'text', text: contextBlock },
        ...lastUserMsg.content,
      ],
    } as ModelMessage;
  }

  return updatedMessages;
}

export async function POST(req: Request) {
  try {
    let user: { id: string };
    try {
      user = await requireAuth();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = user.id;

    // Parse request body - extract messages and clientContext
    const body = await req.json();
    const DEBUG_INGEST_PIPELINE = 'http://127.0.0.1:7242/ingest/5050391a-baab-4666-90cd-e84fd838086c';
    const logStep = (step: number, label: string, data: Record<string, unknown>) => {
      fetch(DEBUG_INGEST_PIPELINE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/agent/v2/route.ts:pipeline', message: `AgentV2 pipeline step ${step}: ${label}`, step, label, data, timestamp: Date.now() }) }).catch(() => { });
    };

    let { messages, clientContext } = body;
    let clientContextSource: 'body' | 'lastMessageMetadata' | 'none' = clientContext !== undefined ? 'body' : 'none';
    // Fallback: client may send clientContext in last user message metadata (e.g. useChat sendMessage)
    if (clientContext === undefined && Array.isArray(messages)) {
      const lastUser = [...messages].reverse().find((m: { role?: string }) => m?.role === 'user');
      const fromMeta = (lastUser as { metadata?: { clientContext?: unknown } } | undefined)?.metadata?.clientContext;
      if (fromMeta !== undefined) {
        clientContext = fromMeta;
        clientContextSource = 'lastMessageMetadata';
      }
    }
    const clientContextRaw =
      clientContext != null && typeof clientContext === 'object'
        ? (() => {
          const c = clientContext as Record<string, unknown>;
          const vb = c.visibleBlocks;
          const sb = c.selectedBlocks;
          const re = c.recentEvents;
          const visibleDebug = c.visibleDebug;
          return {
            pageId: c.pageId,
            workspaceId: c.workspaceId,
            orgId: c.orgId,
            selectedBlocksCount: Array.isArray(sb) ? sb.length : 0,
            selectedBlocksSample: Array.isArray(sb) && sb.length > 0 ? sb[0] : null,
            visibleBlocksCount: Array.isArray(vb) ? vb.length : 0,
            visibleBlocksSample: Array.isArray(vb) && vb.length > 0 ? vb[0] : null,
            recentEventsInPayload: Array.isArray(re) ? re.length : 0,
            visibleDebug:
              visibleDebug != null && typeof visibleDebug === 'object'
                ? {
                  viewportZoom: (visibleDebug as Record<string, unknown>).viewportZoom,
                  viewportX: (visibleDebug as Record<string, unknown>).viewportX,
                  viewportY: (visibleDebug as Record<string, unknown>).viewportY,
                  nodesCount: (visibleDebug as Record<string, unknown>).nodesCount,
                  visibleBlocksCount: (visibleDebug as Record<string, unknown>).visibleBlocksCount,
                  zoomUnderThreshold: (visibleDebug as Record<string, unknown>).zoomUnderThreshold,
                }
                : undefined,
          };
        })()
        : null;
    logStep(1, 'body parsed, clientContext resolved', {
      bodyKeys: typeof body === 'object' && body !== null ? Object.keys(body as object) : [],
      messagesCount: Array.isArray(messages) ? messages.length : 0,
      clientContextSource,
      hasClientContext: clientContext !== undefined,
      clientContext: clientContextRaw,
      lastMessageHasMetadata: Array.isArray(messages)
        ? (() => {
          const last = (messages as { metadata?: unknown }[])[messages.length - 1];
          return last != null && typeof last === 'object' && 'metadata' in last && last.metadata != null;
        })()
        : false,
    });

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages);
    const firstModelContent = modelMessages[0] && 'content' in modelMessages[0] ? modelMessages[0].content : undefined;
    const firstContentSummary =
      typeof firstModelContent === 'string'
        ? { type: 'string', length: firstModelContent.length, preview: firstModelContent.slice(0, 200) }
        : Array.isArray(firstModelContent)
          ? { type: 'array', length: firstModelContent.length, preview: JSON.stringify(firstModelContent).slice(0, 300) }
          : { type: typeof firstModelContent, preview: String(firstModelContent).slice(0, 200) };
    logStep(2, 'convertToModelMessages', {
      modelMessagesCount: modelMessages.length,
      roles: modelMessages.map((m: { role?: string }) => m.role),
      firstMessageContent: firstContentSummary,
    });

    // Parse client context and enrich with server-side recent events
    const dynamicContext = parseDynamicContext(clientContext);
    const pageId = dynamicContext.pageId;
    logStep(3, 'parseDynamicContext', {
      pageId: pageId ?? null,
      dynamicContext: {
        pageId: dynamicContext.pageId,
        workspaceId: dynamicContext.workspaceId,
        orgId: dynamicContext.orgId,
        selectedBlocksCount: dynamicContext.selectedBlocks?.length ?? 0,
        selectedBlocks: dynamicContext.selectedBlocks,
        visibleBlocksCount: dynamicContext.visibleBlocks?.length ?? 0,
        visibleBlocks: dynamicContext.visibleBlocks,
        recentEventsCountBeforeFetch: dynamicContext.recentEvents?.length ?? 0,
      },
    });

    if (pageId) {
      const eventContextService = new EventContextService(new DrizzleEventLogRepository());
      const recentEvents = await eventContextService.getRecentEvents(pageId, 15);
      (clientContext as Record<string, unknown>).recentEvents = recentEvents;
      logStep(4, 'recentEvents fetched and attached to clientContext', {
        pageId,
        recentEventsCount: recentEvents.length,
        recentEvents: recentEvents,
      });
    } else {
      logStep(4, 'recentEvents skipped (no pageId)', { pageId: null });
    }

    const dynamicContextString = buildDynamicContext(clientContext);
    logStep(5, 'buildDynamicContext', {
      dynamicContextStringLength: dynamicContextString.length,
      dynamicContextStringFull: dynamicContextString,
    });

    // Event logging and event search (fire-and-forget for logging)
    const eventLogRepo = new DrizzleEventLogRepository();
    const eventLogService = new EventLogService(eventLogRepo);
    const eventSearchService = new EventSearchService(eventLogRepo);
    const executionId = randomUUID();

    const lastMsg = modelMessages[modelMessages.length - 1];
    const lastContent = lastMsg && 'content' in lastMsg ? lastMsg.content : undefined;
    const lastUserMessage: string =
      typeof lastContent === 'string'
        ? lastContent
        : Array.isArray(lastContent)
          ? (lastContent as { type: string; text?: string }[]).find(
            (p: { type: string }) => p.type === 'text'
          )?.text ?? ''
          : '';
    if (pageId && userId && lastUserMessage) {
      eventLogService
        .logUserUtterance({
          pageId,
          userId,
          utterance: lastUserMessage,
          agentExecutionId: executionId,
        })
        .catch(console.error);
    }

    // Inject dynamic context into the last user message
    const enrichedMessages = injectDynamicContext(
      modelMessages,
      dynamicContextString
    );
    const lastEnriched = enrichedMessages[enrichedMessages.length - 1];
    const lastEnrichedContent = lastEnriched && 'content' in lastEnriched ? lastEnriched.content : undefined;
    const lastEnrichedContentFull =
      typeof lastEnrichedContent === 'string'
        ? lastEnrichedContent
        : Array.isArray(lastEnrichedContent)
          ? JSON.stringify(lastEnrichedContent)
          : String(lastEnrichedContent ?? '');
    logStep(6, 'injectDynamicContext → enrichedMessages', {
      enrichedMessagesCount: enrichedMessages.length,
      lastMessageRole: lastEnriched && 'role' in lastEnriched ? (lastEnriched as { role: string }).role : undefined,
      lastMessageContentFull: lastEnrichedContentFull,
      contextWasInjected: dynamicContextString.length > 0,
    });

    // Log system prompt and dynamic context to debug.log (all reasoning/tool parts logged from stream below)
    // #region agent log
    const DEBUG_INGEST = 'http://127.0.0.1:7242/ingest/5050391a-baab-4666-90cd-e84fd838086c';
    const debugLog = (message: string, data: Record<string, unknown>, location = 'api/agent/v2/route.ts') => {
      fetch(DEBUG_INGEST, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, message, data, timestamp: Date.now() }) }).catch(() => { });
    };
    debugLog('AgentV2 system prompt (full)', { value: SOPHI_V2_SYSTEM_PROMPT, length: SOPHI_V2_SYSTEM_PROMPT.length });
    const dynamicContextScenario = dynamicContextString === '' ? '1-empty' : 'n';
    debugLog('AgentV2 dynamic context', { value: dynamicContextString, scenario: dynamicContextScenario });
    const toolsDefs: Array<{ name: string; description: string; schema: unknown }> = [
      { name: 'xaiSearch', ...xaiSearchTool, schema: getSchemaSummary(xaiSearchTool.inputSchema) },
      { name: 'renderCanvasdown', ...renderCanvasdownTool, schema: getSchemaSummary(renderCanvasdownTool.inputSchema) },
      { name: 'patchCanvasdown', ...patchCanvasdownTool, schema: getSchemaSummary(patchCanvasdownTool.inputSchema) },
      { name: 'grepBlockContent', ...grepBlockContentTool, schema: getSchemaSummary(grepBlockContentTool.inputSchema) },
      { name: 'globBlocks', ...globBlocksTool, schema: getSchemaSummary(globBlocksTool.inputSchema) },
      { name: 'readBlockLines', ...readBlockLinesTool, schema: getSchemaSummary(readBlockLinesTool.inputSchema) },
      { name: 'hopSearch', ...hopSearchTool, schema: getSchemaSummary(hopSearchTool.inputSchema) },
      { name: 'searchGroup', ...searchGroupTool, schema: getSchemaSummary(searchGroupTool.inputSchema) },
      { name: 'searchBySemantic', ...searchBySemanticTool, schema: getSchemaSummary(searchBySemanticTool.inputSchema) },
      { name: 'getPageEvents', ...getPageEventsTool, schema: getSchemaSummary(getPageEventsTool.inputSchema) },
      { name: 'grepEvents', ...grepEventsTool, schema: getSchemaSummary(grepEventsTool.inputSchema) },
      { name: 'editBlockLines', ...editBlockLinesTool, schema: getSchemaSummary(editBlockLinesTool.inputSchema) },
      { name: 'createTodos', ...createTodosTool, schema: getSchemaSummary(createTodosTool.inputSchema) },
      { name: 'canvasAction', ...canvasActionTool, schema: getSchemaSummary(canvasActionTool.inputSchema) },
      { name: 'organizeLayout', ...organizeLayoutTool, schema: getSchemaSummary(organizeLayoutTool.inputSchema) },
    ].map((t) => ({ name: t.name, description: t.description, schema: t.schema }));
    debugLog('AgentV2 tools (request — definitions sent to model)', { tools: toolsDefs });
    // #endregion

    // Instantiate repositories (per-request; stateless)
    const blockSearchRepo = new DrizzleBlockSearchRepository();
    const connectionSearchRepo = new DrizzleConnectionSearchRepository(
      new DrizzleEdgeRepository(),
      new DrizzleBlockMountRepository()
    );

    // Main agent uses Responses API for stateful conversation, caching, and full reasoning support.
    const result = streamText({
      model: xai.responses(AGENT_MODEL),
      system: SOPHI_V2_SYSTEM_PROMPT,
      messages: enrichedMessages,
      tools: {
        xaiSearch: {
          ...xaiSearchTool,
          execute: async (args, opts) => {
            const res = await executeXaiSearch(args, { abortSignal: opts?.abortSignal });
            if (pageId) {
              eventLogService
                .logToolCall({
                  pageId,
                  userId,
                  toolName: 'xaiSearch',
                  args: args as Record<string, unknown>,
                  result: res as unknown as Record<string, unknown>,
                  success: true,
                  agentExecutionId: executionId,
                })
                .catch(console.error);
            }
            return res;
          },
        },
        renderCanvasdown: renderCanvasdownTool,
        patchCanvasdown: patchCanvasdownTool,
        grepBlockContent: {
          ...grepBlockContentTool,
          execute: async (args) => {
            const res = await executeGrepBlockContent(blockSearchRepo, args, { pageId });
            if (pageId) {
              eventLogService
                .logToolCall({
                  pageId,
                  userId,
                  toolName: 'grepBlockContent',
                  args: args as Record<string, unknown>,
                  result: res as unknown as Record<string, unknown>,
                  success: true,
                  agentExecutionId: executionId,
                })
                .catch(console.error);
            }
            return res;
          },
        },
        globBlocks: {
          ...globBlocksTool,
          execute: async (args) => {
            const res = await executeGlobBlocks(blockSearchRepo, args, { pageId });
            if (pageId) {
              eventLogService
                .logToolCall({
                  pageId,
                  userId,
                  toolName: 'globBlocks',
                  args: args as Record<string, unknown>,
                  result: res as unknown as Record<string, unknown>,
                  success: true,
                  agentExecutionId: executionId,
                })
                .catch(console.error);
            }
            return res;
          },
        },
        readBlockLines: {
          ...readBlockLinesTool,
          execute: async (args) => {
            const res = await executeReadBlockLines(blockSearchRepo, args, { pageId });
            if (pageId) {
              eventLogService
                .logToolCall({
                  pageId,
                  userId,
                  toolName: 'readBlockLines',
                  args: args as Record<string, unknown>,
                  result: res as unknown as Record<string, unknown>,
                  success: true,
                  agentExecutionId: executionId,
                })
                .catch(console.error);
            }
            return res;
          },
        },
        hopSearch: {
          ...hopSearchTool,
          execute: async (args) => {
            const res = await executeHopSearch(connectionSearchRepo, args, { pageId });
            if (pageId) {
              eventLogService
                .logToolCall({
                  pageId,
                  userId,
                  toolName: 'hopSearch',
                  args: args as Record<string, unknown>,
                  result: res as unknown as Record<string, unknown>,
                  success: true,
                  agentExecutionId: executionId,
                })
                .catch(console.error);
            }
            return res;
          },
        },
        searchGroup: {
          ...searchGroupTool,
          execute: async (args) => {
            const res = await executeSearchGroup(connectionSearchRepo, args, { pageId });
            if (pageId) {
              eventLogService
                .logToolCall({
                  pageId,
                  userId,
                  toolName: 'searchGroup',
                  args: args as Record<string, unknown>,
                  result: res as unknown as Record<string, unknown>,
                  success: true,
                  agentExecutionId: executionId,
                })
                .catch(console.error);
            }
            return res;
          },
        },
        searchBySemantic: {
          ...searchBySemanticTool,
          execute: async (args) => {
            const res = await executeSearchBySemantic(args, { pageId });
            if (pageId) {
              eventLogService
                .logToolCall({
                  pageId,
                  userId,
                  toolName: 'searchBySemantic',
                  args: args as Record<string, unknown>,
                  result: res as unknown as Record<string, unknown>,
                  success: true,
                  agentExecutionId: executionId,
                })
                .catch(console.error);
            }
            return res;
          },
        },
        getPageEvents: createGetPageEventsTool(eventSearchService, pageId),
        grepEvents: createGrepEventsTool(eventSearchService, pageId),
        editBlockLines: editBlockLinesTool,
        createTodos: createTodosTool,
        canvasAction: canvasActionTool,
        organizeLayout: organizeLayoutTool,
      },
      onFinish: async (finishArg) => {
        debugLog('AgentV2 onFinish (response summary)', {
          textLength: (finishArg as { text?: string }).text?.length,
          usage: (finishArg as { usage?: unknown }).usage,
          totalUsage: (finishArg as { totalUsage?: unknown }).totalUsage,
          finishReason: (finishArg as { finishReason?: unknown }).finishReason,
          response: (finishArg as { response?: unknown }).response,
          steps: Array.isArray((finishArg as { steps?: unknown[] }).steps) ? (finishArg as { steps: unknown[] }).steps?.length : undefined,
          full: JSON.stringify(finishArg).slice(0, 4000),
        }, 'api/agent/v2/route.ts:onFinish');
        const text = (finishArg as { text?: string }).text;
        if (pageId && userId && text && text.length > 0) {
          eventLogService
            .logAIResponse({
              pageId,
              userId,
              response: text.substring(0, 500),
              agentExecutionId: executionId,
            })
            .catch(console.error);
        }
      },
    });

    const response = result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
    });

    return response;
  } catch (error) {
    console.error('Error in /api/agent/v2:', error);
    return new Response(
      JSON.stringify({
        error: 'Agent execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
