import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { z } from 'zod';
import { requireAuth } from '@/domains/auth/server/auth-guard';

export const maxDuration = 30;

const GenerateTitleRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1),
});

const GENERATE_TITLE_SYSTEM_PROMPT = `You are a helpful assistant that generates concise, descriptive titles for chat conversations.

Rules:
- Generate a title in 3-8 words
- Use the same language as the user's messages
- Focus on the main topic or question
- Be specific but concise
- Do not use quotes or special formatting
- Do not include "Chat about" or similar prefixes

Examples:
- User asks about React optimization → "React Performance Optimization"
- User asks about database design → "Database Schema Design"
- User asks in Korean → Generate Korean title
`;

/**
 * Generate a title for a chat session based on the first few messages
 * POST /api/agent/v2/generate-title
 */
export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = GenerateTitleRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { messages } = parsed.data;

    const conversationText = messages
      .slice(0, 4)
      .map((msg: any) => {
        const role = msg.role || 'unknown';
        const content =
          typeof msg.content === 'string'
            ? msg.content
            : msg.parts
              ?.filter((p: any) => p.type === 'text')
              .map((p: any) => p.text)
              .join(' ') || '';
        return `${role}: ${content}`;
      })
      .join('\n\n');

    const { text } = await generateText({
      model: xai('grok-3-mini'),
      system: GENERATE_TITLE_SYSTEM_PROMPT,
      prompt: `Generate a concise title for this conversation:\n\n${conversationText}`,
      maxOutputTokens: 50,
      temperature: 0.7,
    });

    const title = text.trim().replace(/^["']|["']$/g, '');

    return Response.json({ title });
  } catch (error) {
    console.error('[generate-title] Error:', error);
    return Response.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    );
  }
}
