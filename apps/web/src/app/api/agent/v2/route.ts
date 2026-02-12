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
    const { messages, clientContext } = body;

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages);

    // Parse client context and enrich with server-side recent events
    const dynamicContext = parseDynamicContext(clientContext);
    const pageId = dynamicContext.pageId;

    if (pageId) {
      const eventContextService = new EventContextService(new DrizzleEventLogRepository());
      const recentEvents = await eventContextService.getRecentEvents(pageId, 15);
      (clientContext as Record<string, unknown>).recentEvents = recentEvents;
    }

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

    // Log system prompt and dynamic context to debug.log (all reasoning/tool parts logged from stream below)
    // #region agent log
    const DEBUG_INGEST = 'http://127.0.0.1:7242/ingest/5050391a-baab-4666-90cd-e84fd838086c';
    const debugLog = (message: string, data: Record<string, unknown>, location = 'api/agent/v2/route.ts') => {
      fetch(DEBUG_INGEST, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location, message, data, timestamp: Date.now() }) }).catch(() => { });
    };
    debugLog('AgentV2 system prompt (full)', { value: SOPHI_V2_SYSTEM_PROMPT, length: SOPHI_V2_SYSTEM_PROMPT.length });
    const toolsSectionStart = SOPHI_V2_SYSTEM_PROMPT.indexOf('## Available Tools');
    const toolsSection = toolsSectionStart >= 0 ? SOPHI_V2_SYSTEM_PROMPT.slice(toolsSectionStart) : '';
    debugLog('AgentV2 system prompt — tools section (from ## Available Tools to end)', { value: toolsSection, length: toolsSection.length, sectionStartIndex: toolsSectionStart });
    debugLog('AgentV2 dynamic context', { value: dynamicContextString });
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
      onFinish: async ({ text }) => {
        if (pageId && userId && (text?.length ?? 0) > 0) {
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

    // sendSources: true — stream-level sources if any. sendReasoning: true — Grok reasoning parts.
    const response = result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
    });

    // Tee stream to log reasoning and tool parts without modifying the response body
    const responseBody = response.body;
    if (responseBody) {
      const [streamForClient, streamForLog] = responseBody.tee();
      const decoder = new TextDecoder();
      let buffer = '';
      (async () => {
        try {
          const reader = streamForLog.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              const raw = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
              if (raw === '[DONE]' || raw === '') continue;
              try {
                const obj = JSON.parse(raw) as { type?: string;[key: string]: unknown };
                const t = obj?.type;
                if (t === 'reasoning' || (typeof t === 'string' && (t.includes('reasoning') || t.includes('tool')))) {
                  debugLog(`AgentV2 stream part [${t}]`, { payload: JSON.stringify(obj).slice(0, 800) }, 'api/agent/v2/route.ts:stream');
                }
              } catch {
                if (/reasoning|tool-call|tool-done|tool-result/i.test(raw)) {
                  debugLog('AgentV2 stream raw', { raw: raw.slice(0, 500) }, 'api/agent/v2/route.ts:stream');
                }
              }
            }
          }
          if (buffer.trim()) {
            try {
              const obj = JSON.parse(buffer.startsWith('data:') ? buffer.slice(5).trim() : buffer) as { type?: string };
              if (obj?.type) debugLog(`AgentV2 stream part [${obj.type}] (tail)`, { payload: buffer.slice(0, 300) }, 'api/agent/v2/route.ts:stream');
            } catch {
              // ignore
            }
          }
        } catch (err) {
          debugLog('AgentV2 stream log error', { error: String(err) }, 'api/agent/v2/route.ts:stream');
        }
      })();
      return new Response(streamForClient, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

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
