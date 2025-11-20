import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';

export const youtubeAIDefinition: BlockTypeDefinition = {
  type: 'youtube',
  name: 'YouTube Block',
  description: 'Embed YouTube videos. Metadata is auto-fetched from YouTube.',
  useCases: [
    'Embedding video tutorials',
    'Adding reference videos',
    'Creating video collections',
  ],
  basicProperties: {
    url: {
      type: PropertyType.URL,
      description: 'YouTube video URL',
      required: true,
    },
  },
  actions: [
    {
      name: 'extractScript',
      description: 'Extract transcript/captions from YouTube video',
    },
    {
      name: 'summarize',
      description: 'Summarize the video content using transcript',
    },
  ],
  examples: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
};
