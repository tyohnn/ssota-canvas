import {
  PropertyType,
} from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';

export const linkAIDefinition: BlockTypeDefinition = {
  type: 'link',
  name: 'Link Block',
  description: 'Web link with Open Graph preview. Metadata is auto-fetched.',
  useCases: ['Bookmarking websites', 'Reference links', 'Resource collections'],
  basicProperties: {
    url: {
      type: PropertyType.URL,
      description: 'URL of the link',
      required: true,
    },
  },
  actions: [
    {
      name: 'summarize',
      description:
        'Summarize the linked webpage content in the specified language (ko, en, ja, zh)',
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
  examples: ['https://github.com', 'https://example.com/article'],
};
