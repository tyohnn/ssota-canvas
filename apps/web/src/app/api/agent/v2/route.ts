import { createXai } from '@ai-sdk/xai';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { requireAuth } from '@/domains/auth/server/auth-guard';
import { SOPHI_V2_SYSTEM_PROMPT } from './prompt';
import { xaiWebSearchTool, doneTool } from './tools';
import { executeWebSearch } from './executeTools';

export const maxDuration = 300;

const xai = createXai();
const AGENT_MODEL = 'grok-4-1-fast-reasoning';

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

    const { messages } = await req.json();

    const result = streamText({
      model: xai(AGENT_MODEL),
      system: SOPHI_V2_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(10),
      toolChoice: 'required', // Forced Tool Calling: 매 턴 도구 호출, 종료 시 done 호출
      tools: {
        xaiWebSearch: {
          ...xaiWebSearchTool,
          execute: executeWebSearch,
        },
        done: doneTool, // execute 없음 → 호출 시 루프 종료, 최종 답변은 tool call input에서 추출
      },
    });

    return result.toUIMessageStreamResponse();
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
