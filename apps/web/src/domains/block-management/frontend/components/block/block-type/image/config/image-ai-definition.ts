import {
  PropertyType,
  ObjectFit,
} from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';

export const imageAIDefinition: BlockTypeDefinition = {
  type: 'image',
  name: 'Image Block',
  description: 'Display images with support for various formats.',
  useCases: [
    'Displaying photos',
    'Adding screenshots',
    'Visual references',
    'Image galleries',
    'AI image generation',
    'AI image style transfer',
    'AI image search',
  ],
  basicProperties: {
    imageUrl: {
      type: PropertyType.URL,
      description: 'URL of the image',
      required: true,
    },
    objectFit: {
      type: 'enum',
      description: 'How the image should fit in the container',
      options: ['contain', 'cover', 'fill'] as ObjectFit[],
      default: 'contain' as ObjectFit,
    },
    caption: {
      type: PropertyType.TEXT,
      description: 'Caption text below the image',
    },
    isCaptionVisible: {
      type: PropertyType.BOOLEAN,
      description: 'Show/hide caption',
      default: false,
    },
    alt: {
      type: PropertyType.TEXT,
      description: 'Alternative text for accessibility',
    },
  },
  actions: [
    {
      name: 'imageSearch',
      description:
        'Search images from SSOTA Image Platform or workspace images and Unsplash (public images). ' +
        'Returns search results with image URLs and properties. ' +
        'Use addBlock or updateProperties tools to apply images to blocks based on the search results.',
      params: {
        query: {
          type: PropertyType.TEXT,
          description:
            'Search query for images (e.g., "SpaceX logo", "nature landscape", "Elon Musk")',
          required: true,
        },
      },
    },
    {
      name: 'generate',
      description:
        'Generate 4 images using AI models and apply the first one to the current block. ' +
        'Default model: Google Gemini 2.5 Flash Image. ' +
        'OpenAI GPT Image 1 is also available when user specifies openai: "openai/gpt-image-1".',
      params: {
        prompt: {
          type: PropertyType.TEXT,
          description:
            'Description of the image to generate (e.g., "A serene landscape with mountains and a lake at sunset", "A cute cat wearing sunglasses") Detailed style description is recommended based on the user\'s prompt.',
          required: true,
        },
        modelId: {
          type: PropertyType.TEXT,
          description:
            'Model ID: "openai/gpt-image-1" or "google/gemini-2.5-flash-image" (default)',
          required: false,
        },
        negativePrompt: {
          type: PropertyType.TEXT,
          description:
            'Things to avoid in the image (only for Google models, e.g., "blurry, low quality, text")',
          required: false,
        },
        aspectRatio: {
          type: PropertyType.TEXT,
          description:
            'Aspect ratio: 1:1 (square), 3:4 (portrait), 4:3 (landscape), 9:16 (vertical), 16:9 (horizontal). Defaults to 1:1',
          required: false,
        },
      },
    },
    {
      name: 'searchStyle',
      description: 'Search for images with similar style',
    },
  ],
  examples: [],
};
