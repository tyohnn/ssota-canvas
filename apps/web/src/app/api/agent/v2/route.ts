import { xai } from '@ai-sdk/xai';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { randomUUID } from 'crypto';
import type {
  SystemModelMessage,
  UserModelMessage,
  AssistantModelMessage,
  ToolModelMessage,
} from 'ai';
import { requireAuth } from '@/domains/auth/server/auth-guard';
import { authorizeByPageId, verifyBlockOwnership } from '@/domains/common/auth/helpers';
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
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { DrizzleEdgeRepository } from '@/domains/canvas-management/backend/repositories/implementations/drizzle-edge.repository';
import {
  DrizzleEventLogRepository,
  EventLogService,
  EventContextService,
  EventSearchService,
} from '@/domains/event-management';
import {
  getCurrentPageNames,
  getBlockContentPreviews,
} from '@/domains/ai-management/backend/services/context';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DrizzleUserRepository } from '@/domains/user-management/backend/repositories/implementations/drizzle-user.repository';
import { createGetPageEventsTool, createGrepEventsTool } from './event-tools';
import { AGENT_MODEL } from './constants';

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

    // Parse request body — messages and clientContext (from last user message metadata; useChat sendMessage)
    const body = await req.json();
    const messages = body.messages;
    const lastUser = Array.isArray(messages)
      ? [...messages].reverse().find((m: { role?: string }) => m?.role === 'user')
      : undefined;
    const clientContext: unknown =
      (lastUser as { metadata?: { clientContext?: unknown } } | undefined)?.metadata?.clientContext ?? {};

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages);

    // Parse client context and enrich with server-side recent events
    const dynamicContext = parseDynamicContext(clientContext);
    const pageId = dynamicContext.pageId;

    // Page-scoped context enrichment: verify access first (same as secure actions)
    let pageAuth: Awaited<ReturnType<typeof authorizeByPageId>> | undefined;
    if (pageId) {
      pageAuth = await authorizeByPageId(pageId, userId);
      if (!pageAuth.success) {
        return new Response(
          JSON.stringify({
            error: 'Access denied',
            message: pageAuth.error === 'PAGE_NOT_FOUND' ? 'Page not found' : 'You do not have access to this page',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Block-level: verify each selected/visible block belongs to the page and workspace (same as block-mount secure action)
    if (pageId && pageAuth?.success && pageAuth.context) {
      const workspaceId = pageAuth.context.workspace.workspaceId.value;
      const pageIdVo = new PageId(pageId);
      const blockMountRepo = new DrizzleBlockMountRepository();
      const allBlockMountIds = [
        ...(dynamicContext.selectedBlocks ?? []).map(b => b.blockMountId),
        ...(dynamicContext.visibleBlocks ?? []).map(b => b.blockMountId),
      ];
      const uniqueIds = [...new Set(allBlockMountIds)];
      const isSlug = (s: string) => s.length === 8 && /^[0-9a-f]+$/i.test(s);
      const isUuid = (s: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());

      for (const id of uniqueIds) {
        const mount = isSlug(id)
          ? await blockMountRepo.findByPageIdAndSlug(pageIdVo, id.toLowerCase())
          : isUuid(id)
            ? await blockMountRepo.findById(new BlockMountId(id))
            : null;
        if (!mount) {
          return new Response(
            JSON.stringify({ error: 'Access denied', message: 'Block not found or not on this page' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const blockMount = mount.getBlockMount();
        if (blockMount.pageId.value !== pageId) {
          return new Response(
            JSON.stringify({ error: 'Access denied', message: 'Block does not belong to this page' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const ownership = await verifyBlockOwnership(blockMount.blockId.value, workspaceId);
        if (!ownership.isValid) {
          return new Response(
            JSON.stringify({
              error: 'Access denied',
              message: ownership.error === 'BLOCK_NOT_FOUND' ? 'Block not found' : 'Block does not belong to this workspace',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    if (pageId) {
      const eventContextService = new EventContextService(new DrizzleEventLogRepository());
      const recentEvents = await eventContextService.getRecentEvents(pageId, 15);
      (clientContext as Record<string, unknown>).recentEvents = recentEvents;
    }

    // Current Page display names (server-fetched for context enrichment)
    const names = await getCurrentPageNames(
      {
        pageRepository: new DrizzlePageRepository(),
        workspaceRepository: new DrizzleWorkspaceRepository(),
        organizationRepository: new DrizzleOrganizationRepository(),
        userRepository: new DrizzleUserRepository(),
      },
      {
        pageId: dynamicContext.pageId,
        workspaceId: dynamicContext.workspaceId,
        orgId: dynamicContext.orgId,
        userId,
      }
    );
    (clientContext as Record<string, unknown>).pageTitle = names.pageTitle;
    (clientContext as Record<string, unknown>).workspaceTitle = names.workspaceTitle;
    (clientContext as Record<string, unknown>).organizationName = names.organizationName;
    (clientContext as Record<string, unknown>).userProfileName = names.userProfileName;

    // Block content previews (selected + first 5 visible, content_raw + source summary; no source_content)
    const selectedRefs = (dynamicContext.selectedBlocks ?? []).map(b => ({ blockMountId: b.blockMountId }));
    const visibleRefs = (dynamicContext.visibleBlocks ?? []).map(b => ({ blockMountId: b.blockMountId }));
    const blockContentPreviews = await getBlockContentPreviews(
      {
        blockSearchRepository: new DrizzleBlockSearchRepository(),
        blockMountRepository: new DrizzleBlockMountRepository(),
      },
      {
        pageId: dynamicContext.pageId,
        selectedBlocks: selectedRefs,
        visibleBlocks: visibleRefs,
      }
    );
    (clientContext as Record<string, unknown>).blockContentPreviews = blockContentPreviews;

    const dynamicContextString = buildDynamicContext(clientContext);

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

    // Instantiate repositories (per-request; stateless)
    const blockSearchRepo = new DrizzleBlockSearchRepository();
    const connectionSearchRepo = new DrizzleConnectionSearchRepository(
      new DrizzleEdgeRepository(),
      new DrizzleBlockMountRepository()
    );

    // #region agent log
    const DEBUG_INGEST = 'http://127.0.0.1:7242/ingest/5050391a-baab-4666-90cd-e84fd838086c';
    const ctxLog = (message: string, data: Record<string, unknown>) => {
      fetch(DEBUG_INGEST, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/agent/v2/route.ts', message, data, timestamp: Date.now() }) }).catch(() => { });
    };
    // #endregion

    // #region agent log — step: request
    const messageCount = enrichedMessages.length;
    const lastEnrichedMsg = enrichedMessages[enrichedMessages.length - 1];
    const lastEnrichedContent = lastEnrichedMsg && 'content' in lastEnrichedMsg ? lastEnrichedMsg.content : undefined;
    const lastUserContentLength =
      typeof lastEnrichedContent === 'string'
        ? lastEnrichedContent.length
        : Array.isArray(lastEnrichedContent)
          ? (lastEnrichedContent as { text?: string }[]).reduce((sum, p) => sum + (typeof p?.text === 'string' ? p.text.length : 0), 0)
          : 0;
    ctxLog('AgentV2 step: request', {
      messageCount,
      lastUserContentLength,
      contextLength: dynamicContextString.length,
    });
    // #endregion

    // Main agent uses Responses API for stateful conversation, caching, and full reasoning support.
    const result = streamText({
      model: xai(AGENT_MODEL),
      system: SOPHI_V2_SYSTEM_PROMPT,
      messages: enrichedMessages,
      stopWhen: stepCountIs(20),
      tools: {
        xaiSearch: {
          ...xaiSearchTool,
          onInputStart: (opts) => {
            ctxLog('AgentV2 tool input: start', { toolName: 'xaiSearch', toolCallId: (opts as { toolCallId?: string }).toolCallId });
          },
          onInputDelta: ({ inputTextDelta, ...opts }) => {
            ctxLog('AgentV2 tool input: delta', { toolName: 'xaiSearch', inputTextDelta, toolCallId: (opts as { toolCallId?: string }).toolCallId });
          },
          onInputAvailable: (opts: { input: unknown }) => {
            ctxLog('AgentV2 tool input: available', { toolName: 'xaiSearch', input: opts.input as Record<string, unknown> });
          },
          execute: (args, opts) =>
            executeXaiSearch(args, { abortSignal: opts?.abortSignal }),
        },
        // renderCanvasdown: renderCanvasdownTool,
        // patchCanvasdown: patchCanvasdownTool,
        // grepBlockContent: {
        //   ...grepBlockContentTool,
        //   execute: async (args) => {
        //     const res = await executeGrepBlockContent(blockSearchRepo, args, { pageId });
        //     if (pageId) {
        //       eventLogService
        //         .logToolCall({
        //           pageId,
        //           userId,
        //           toolName: 'grepBlockContent',
        //           args: args as Record<string, unknown>,
        //           result: res as unknown as Record<string, unknown>,
        //           success: true,
        //           agentExecutionId: executionId,
        //         })
        //         .catch(console.error);
        //     }
        //     return res;
        //   },
        // },
        // globBlocks: {
        //   ...globBlocksTool,
        //   execute: async (args) => {
        //     const res = await executeGlobBlocks(blockSearchRepo, args, { pageId });
        //     if (pageId) {
        //       eventLogService
        //         .logToolCall({
        //           pageId,
        //           userId,
        //           toolName: 'globBlocks',
        //           args: args as Record<string, unknown>,
        //           result: res as unknown as Record<string, unknown>,
        //           success: true,
        //           agentExecutionId: executionId,
        //         })
        //         .catch(console.error);
        //     }
        //     return res;
        //   },
        // },
        // readBlockLines: {
        //   ...readBlockLinesTool,
        //   execute: async (args) => {
        //     const res = await executeReadBlockLines(blockSearchRepo, args, { pageId });
        //     if (pageId) {
        //       eventLogService
        //         .logToolCall({
        //           pageId,
        //           userId,
        //           toolName: 'readBlockLines',
        //           args: args as Record<string, unknown>,
        //           result: res as unknown as Record<string, unknown>,
        //           success: true,
        //           agentExecutionId: executionId,
        //         })
        //         .catch(console.error);
        //     }
        //     return res;
        //   },
        // },
        // hopSearch: {
        //   ...hopSearchTool,
        //   execute: async (args) => {
        //     const res = await executeHopSearch(connectionSearchRepo, args, { pageId });
        //     if (pageId) {
        //       eventLogService
        //         .logToolCall({
        //           pageId,
        //           userId,
        //           toolName: 'hopSearch',
        //           args: args as Record<string, unknown>,
        //           result: res as unknown as Record<string, unknown>,
        //           success: true,
        //           agentExecutionId: executionId,
        //         })
        //         .catch(console.error);
        //     }
        //     return res;
        //   },
        // },
        // searchGroup: {
        //   ...searchGroupTool,
        //   execute: async (args) => {
        //     const res = await executeSearchGroup(connectionSearchRepo, args, { pageId });
        //     if (pageId) {
        //       eventLogService
        //         .logToolCall({
        //           pageId,
        //           userId,
        //           toolName: 'searchGroup',
        //           args: args as Record<string, unknown>,
        //           result: res as unknown as Record<string, unknown>,
        //           success: true,
        //           agentExecutionId: executionId,
        //         })
        //         .catch(console.error);
        //     }
        //     return res;
        //   },
        // },
        // searchBySemantic: {
        //   ...searchBySemanticTool,
        //   execute: async (args) => {
        //     const res = await executeSearchBySemantic(args, { pageId });
        //     if (pageId) {
        //       eventLogService
        //         .logToolCall({
        //           pageId,
        //           userId,
        //           toolName: 'searchBySemantic',
        //           args: args as Record<string, unknown>,
        //           result: res as unknown as Record<string, unknown>,
        //           success: true,
        //           agentExecutionId: executionId,
        //         })
        //         .catch(console.error);
        //     }
        //     return res;
        //   },
        // },
        // getPageEvents: createGetPageEventsTool(eventSearchService, pageId),
        // grepEvents: createGrepEventsTool(eventSearchService, pageId),
        // editBlockLines: editBlockLinesTool,
        // createTodos: createTodosTool,
        // canvasAction: canvasActionTool,
        // organizeLayout: organizeLayoutTool,
      },
      onStepFinish: ({ toolCalls, toolResults }) => {
        if (!pageId || !userId) return;
        const calls = (toolCalls ?? []) as Array<{ toolCallId?: string; toolName?: string; input?: unknown }>;
        const results = (toolResults ?? []) as Array<{ toolCallId?: string; toolName?: string; result?: unknown }>;
        for (let i = 0; i < calls.length; i++) {
          const tc = calls[i];
          if (tc?.toolName !== 'xaiSearch') continue;
          const tr = results[i] ?? results.find((r) => r.toolCallId === tc.toolCallId);
          eventLogService
            .logToolCall({
              pageId,
              userId,
              toolName: 'xaiSearch',
              args: (tc.input ?? tc) as Record<string, unknown>,
              result: (tr?.result ?? tr) as Record<string, unknown>,
              success: true,
              agentExecutionId: executionId,
            })
            .catch(console.error);
        }
      },
      onFinish: async (finishArg) => {
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
        // #region agent log — step: finish + tokens
        ctxLog('AgentV2 step: finish', {
          textLength: text?.length ?? 0,
          textPreview: text ? text.slice(0, 300) : null,
        });
        const usage = (finishArg as { usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }).usage;
        if (usage) {
          ctxLog('AgentV2 tokens', {
            promptTokens: usage.promptTokens ?? null,
            completionTokens: usage.completionTokens ?? null,
            totalTokens: usage.totalTokens ?? null,
          });
        }
        // #endregion
      },
    });

    const response = result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
    });

    // #region agent log — step: stream parts (each chunk sent to client)
    let streamPartIndex = 0;
    const decoder = new TextDecoder();
    const loggedBody =
      response.body &&
      response.body.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
          transform(chunk, controller) {
            streamPartIndex += 1;
            const preview = (() => {
              try {
                const s = decoder.decode(chunk, { stream: true });
                return s.length > 200 ? s.slice(0, 200) + '...' : s;
              } catch {
                return '(binary)';
              }
            })();
            ctxLog('AgentV2 step: stream_part', {
              partIndex: streamPartIndex,
              byteLength: chunk.byteLength,
              preview: preview.replace(/\n/g, '\\n').slice(0, 250),
            });
            controller.enqueue(chunk);
          },
        })
      );
    const responseToReturn =
      loggedBody !== undefined
        ? new Response(loggedBody, { status: response.status, statusText: response.statusText, headers: response.headers })
        : response;
    // #endregion

    return responseToReturn;
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
