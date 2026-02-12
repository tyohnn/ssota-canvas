import { xai } from '@ai-sdk/xai';
import { streamText, convertToModelMessages } from 'ai';
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
    try {
      await requireAuth();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body - extract messages and clientContext
    const body = await req.json();
    const { messages, clientContext } = body;

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages);

    // Build dynamic context from client state
    const dynamicContextString = buildDynamicContext(clientContext);
    const dynamicContext = parseDynamicContext(clientContext);
    const pageId = dynamicContext.pageId;

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

    // Main agent uses Chat API only; search is a server-side tool (xaiSearch) so we can mix with client-side canvas tools.
    const result = streamText({
      model: xai(AGENT_MODEL),
      system: SOPHI_V2_SYSTEM_PROMPT,
      messages: enrichedMessages,
      tools: {
        xaiSearch: {
          ...xaiSearchTool,
          execute: (args, opts) => executeXaiSearch(args, { abortSignal: opts?.abortSignal }),
        },
        renderCanvasdown: renderCanvasdownTool,
        patchCanvasdown: patchCanvasdownTool,
        grepBlockContent: {
          ...grepBlockContentTool,
          execute: (args) => executeGrepBlockContent(blockSearchRepo, args, { pageId }),
        },
        globBlocks: {
          ...globBlocksTool,
          execute: (args) => executeGlobBlocks(blockSearchRepo, args, { pageId }),
        },
        readBlockLines: {
          ...readBlockLinesTool,
          execute: (args) => executeReadBlockLines(blockSearchRepo, args, { pageId }),
        },
        hopSearch: {
          ...hopSearchTool,
          execute: (args) =>
            executeHopSearch(connectionSearchRepo, args, { pageId }),
        },
        searchGroup: {
          ...searchGroupTool,
          execute: (args) =>
            executeSearchGroup(connectionSearchRepo, args, { pageId }),
        },
        searchBySemantic: {
          ...searchBySemanticTool,
          execute: (args) => executeSearchBySemantic(args, { pageId }),
        },
        editBlockLines: editBlockLinesTool,
        createTodos: createTodosTool,
        canvasAction: canvasActionTool,
      },
    });

    // sendSources: true — stream-level sources if any. sendReasoning: true — Grok reasoning parts.
    // sendReasoning: true — Grok reasoning model reasoning_content → reasoning parts (streaming).
    return result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
    });
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
