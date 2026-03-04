import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';
import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export const xAIDefinition: BlockTypeDefinition = {
  type: 'x',
  name: 'X Block',
  description:
    'X (Twitter) post embed. Displays post metadata. Content is auto-extracted and can be summarized.',
  useCases: [
    'Embedding X posts',
    'Reference social content',
    'Content summarization',
  ],
  basicProperties: {
    url: {
      type: PropertyType.URL,
      description: 'X post URL (x.com or twitter.com)',
      required: true,
    },
  },
  actions: [
    {
      name: 'summarize',
      description:
        'Summarize the X post content in the specified language (ko, en, ja, zh)',
      params: {
        language: {
          type: 'enum' as const,
          description: 'Language code',
          default: 'ko',
          options: ['ko', 'en', 'ja', 'zh'],
        },
      },
    },
  ],
  examples: [
    'https://x.com/user/status/1234567890',
    'https://twitter.com/user/status/1234567890',
  ],
};
