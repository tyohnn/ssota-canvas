import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';

const SEARCH_MODEL = 'grok-4-1-fast-non-reasoning';

function buildSearchSources(
  searchType: string
): Array<{ type: 'web' | 'news' | 'x' }> {
  switch (searchType) {
    case 'news':
      return [{ type: 'news' }];
    case 'x':
      return [{ type: 'x' }];
    case 'all':
      return [{ type: 'web' }, { type: 'news' }, { type: 'x' }];
    default:
      return [{ type: 'web' }];
  }
}

export interface WebSearchParams {
  query: string;
  maxResults?: number;
  searchType?: 'web' | 'news' | 'x' | 'all';
}

export interface WebSearchResult {
  summary: string;
  citations: Array<{ url: string }>;
  query: string;
  searchType: string;
}

export async function executeWebSearch(
  params: WebSearchParams
): Promise<WebSearchResult> {
  const xai = createXai();

  const { text, sources } = await generateText({
    model: xai(SEARCH_MODEL),
    prompt: `Search and provide comprehensive results for: ${params.query}`,
    providerOptions: {
      xai: {
        searchParameters: {
          mode: 'on',
          returnCitations: true,
          maxSearchResults: params.maxResults ?? 5,
          sources: buildSearchSources(params.searchType ?? 'web'),
        },
      },
    },
  });

  const rawSources = (sources ?? []) as Array<{
    sourceType?: string;
    url?: string;
  }>;
  const citations = rawSources
    .filter((s) => s?.sourceType === 'url' && typeof s?.url === 'string')
    .map((s) => ({ url: s.url! }));

  return {
    summary: text,
    citations,
    query: params.query,
    searchType: params.searchType ?? 'web',
  };
}
