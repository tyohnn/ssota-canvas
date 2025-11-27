import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';

export const pdfAIDefinition: BlockTypeDefinition = {
  type: 'pdf',
  name: 'PDF Block',
  description:
    'Display and interact with PDF documents with page navigation and zoom.',
  useCases: [
    'Viewing documents',
    'Reading papers and reports',
    'Referencing PDFs',
  ],
  basicProperties: {
    url: {
      type: PropertyType.URL,
      description: 'URL of the PDF file',
      required: true,
    },
    filename: {
      type: PropertyType.TEXT,
      description: 'Display name of the file',
    },
  },
  actions: [
    {
      name: 'extractContent',
      description: 'Extract text content from the PDF',
    },
    {
      name: 'summarize',
      description: 'Summarize the PDF content using AI',
    },
  ],
  examples: [],
};
