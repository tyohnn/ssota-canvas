import { tool } from 'ai';
import { z } from 'zod';

/** Tool with no execute – when called, the agent loop stops. Final answer is in the tool call input. */
export const doneTool = tool({
  description:
    'Signal that you have finished your work. Call this only when you are done: after presenting search results, answering the user, or completing the task. Put your final answer or summary in the answer field. Do not call any other tool after calling done.',
  inputSchema: z.object({
    answer: z
      .string()
      .describe(
        'The final answer to show the user: summary, search results summary, or completion message. Use the user\'s language.'
      ),
  }),
  // No execute – stops the agent when called (Forced Tool Calling pattern)
});

export const xaiWebSearchTool = {
  description: `Search the web for real-time information using xAI Grok.

Use when users ask about current events, latest news, social media discussions,
documentation, or any information requiring up-to-date web data.

Powered by x.com Grok - strong at real-time and social media context.
Results include summary text and source citation URLs.

searchType controls the data source:
- 'web': General web search (default) - documentation, articles, tutorials
- 'news': News articles only - breaking news, industry updates
- 'x': X/Twitter posts and discussions - opinions, trends, social media
- 'all': Combined web + news + X search - comprehensive research

When to use each searchType:
- User asks about current events, general info -> 'web'
- User asks about breaking news, industry updates -> 'news'
- User asks about social media opinions, trending topics -> 'x'
- User wants comprehensive coverage -> 'all'

After receiving results, present them clearly with source URLs as citations.
If no relevant results, explain what was searched and suggest alternatives.

Examples:
- Latest news: {"query":"AI startup funding 2026","searchType":"news"}
- Social trends: {"query":"React vs Vue developer opinions","searchType":"x"}
- General info: {"query":"Next.js server actions tutorial","searchType":"web"}
- Comprehensive: {"query":"OpenAI GPT-5 release","searchType":"all"}`,
  inputSchema: z.object({
    query: z.string().describe('REQUIRED: Search query in natural language'),
    maxResults: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .optional()
      .describe('Maximum search results to consider (default: 5, max: 20)'),
    searchType: z
      .enum(['web', 'news', 'x', 'all'])
      .default('web')
      .optional()
      .describe("Search source type (default: web)"),
  }),
};
