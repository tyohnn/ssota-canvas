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
  createGrepBlockContentTool,
  createGlobBlocksTool,
  createReadBlockLinesTool,
  createHopSearchTool,
  createSearchGroupTool,
  createSearchBySemanticTool,
  createGetPageEventsTool,
  createGrepEventsTool,
  editTool,
  createTodosTool,
  canvasActionTool,
  organizeLayoutTool,
} from './tools';
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
import {
  CONTEXT_SELECTED_MAX_LINES,
  CONTEXT_SELECTED_MAX_CHARS,
  CONTEXT_VISIBLE_MAX_CHARS,
} from './context-builder';
import { DrizzlePageRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-page.repository';
import { DrizzleWorkspaceRepository } from '@/domains/workspace-management/backend/repositories/implementations/drizzle-workspace.repository';
import { DrizzleOrganizationRepository } from '@/domains/organization-management/backend/repositories/implementations/drizzle-organization.repository';
import { DrizzleUserRepository } from '@/domains/user-management/backend/repositories/implementations/drizzle-user.repository';
import { AGENT_MODEL } from './constants';
import { debugLog } from './debug-log';

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

    // Block content previews (selected + first 5 visible, note_content + source summary; no source_content)
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
        noteContentLimits: {
          selected: { maxLines: CONTEXT_SELECTED_MAX_LINES, maxChars: CONTEXT_SELECTED_MAX_CHARS },
          visible: { maxChars: CONTEXT_VISIBLE_MAX_CHARS },
        },
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
    const ROUTE_LOC = 'route.ts';
    debugLog(ROUTE_LOC, 'AgentV2 request', {
      messageCount: enrichedMessages.length,
      contextLength: dynamicContextString.length,
      pageId: pageId ?? null,
      userId,
    });
    // #endregion

    // Main agent uses Responses API for stateful conversation, caching, and full reasoning support.
    let stepIndex = 0;
    const result = streamText({
      model: xai(AGENT_MODEL),
      system: SOPHI_V2_SYSTEM_PROMPT,
      messages: enrichedMessages,
      stopWhen: stepCountIs(20),
      tools: {
        webSearch: xaiSearchTool,
        read: createReadBlockLinesTool(blockSearchRepo, { pageId }),
        // edit: editTool,
        // hop: createHopSearchTool(connectionSearchRepo, { pageId }),
        // group: createSearchGroupTool(connectionSearchRepo, { pageId }),
        // grep: createGrepBlockContentTool(blockSearchRepo, { pageId }),
        // glob: createGlobBlocksTool(blockSearchRepo, { pageId }),
        // createTodos: createTodosTool,
        // semantic: createSearchBySemanticTool({ pageId }),
        // getEvents: createGetPageEventsTool(eventSearchService, pageId ?? undefined),
        // grepEvents: createGrepEventsTool(eventSearchService, pageId ?? undefined),
        // canvasAction: canvasActionTool,
        // organizeLayout: organizeLayoutTool,
        // renderCanvasdown: renderCanvasdownTool,
        // patchCanvasdown: patchCanvasdownTool,
      },
      onStepFinish: ({ toolCalls, toolResults }) => {
        stepIndex += 1;
        const calls = (toolCalls ?? []) as Array<{ toolCallId?: string; toolName?: string; input?: unknown }>;
        const results = (toolResults ?? []) as Array<{ toolCallId?: string; toolName?: string; result?: unknown }>;
        // #region agent log
        debugLog(ROUTE_LOC, `AgentV2 step ${stepIndex} (toolCalls)`, {
          stepIndex,
          toolNames: calls.map((c) => c.toolName),
          toolCallIds: calls.map((c) => c.toolCallId),
          resultsCount: results.length,
          inputsPreview: calls.map((c) =>
            c.toolName === 'webSearch' ? { query: (c.input as { query?: string })?.query } : c.toolName === 'read' ? { blockMountId: (c.input as { blockMountId?: string })?.blockMountId } : {}
          ),
        });
        // #endregion
        if (!pageId || !userId) return;
        for (let i = 0; i < calls.length; i++) {
          const tc = calls[i];
          if (tc?.toolName !== 'webSearch') continue;
          const tr = results[i] ?? results.find((r) => r.toolCallId === tc.toolCallId);
          eventLogService
            .logToolCall({
              pageId,
              userId,
              toolName: 'webSearch',
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
        const usage = (finishArg as { usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number } }).usage;
        // #region agent log
        debugLog(ROUTE_LOC, 'AgentV2 finish', {
          textLength: text?.length ?? 0,
          textPreview: text ? text.slice(0, 200) : null,
          totalSteps: stepIndex,
        });
        if (usage) {
          debugLog(ROUTE_LOC, 'AgentV2 tokens', {
            promptTokens: usage.promptTokens ?? null,
            completionTokens: usage.completionTokens ?? null,
            totalTokens: usage.totalTokens ?? null,
          });
        }
        // #endregion
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
