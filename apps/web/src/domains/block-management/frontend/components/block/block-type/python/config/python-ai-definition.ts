/**
 * Python (Code) Block AI Definition
 */

import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';

export const pythonAIDefinition: BlockTypeDefinition = {
  type: 'python',
  name: 'Python Code Block',
  description:
    'Code editor with syntax highlighting and execution capabilities. Supports 20+ languages.',
  useCases: [
    'Writing Python scripts',
    'Code snippets',
    'Algorithm demonstrations',
    'Data analysis code',
  ],
  basicProperties: {
    code: {
      type: PropertyType.TEXT,
      description: 'Code content (stored in properties, not block.content)',
      default: '',
    },
    language: {
      type: 'enum',
      description: 'Programming language',
      options: [
        'python',
        'javascript',
        'typescript',
        'java',
        'cpp',
        'c',
        'csharp',
        'go',
        'rust',
        'php',
        'ruby',
        'swift',
        'kotlin',
        'scala',
        'r',
        'sql',
        'html',
        'css',
        'json',
        'yaml',
        'xml',
        'markdown',
      ],
      default: 'python',
    },
  },
  actions: [
    {
      name: 'formatCode',
      description: 'Auto-format the code',
    },
    {
      name: 'refactor',
      description: 'Refactor the code using AI',
      params: {
        style: {
          type: 'enum',
          description: 'Refactoring style',
          options: ['functional', 'object-oriented', 'clean'],
        },
      },
    },
    {
      name: 'addComments',
      description: 'Add docstrings and comments using AI',
    },
    {
      name: 'execute',
      description: 'Execute the code (Python only)',
    },
  ],
  examples: [
    'def hello():\n    print("Hello, World!")\n\nhello()',
    'import pandas as pd\ndf = pd.read_csv("data.csv")',
  ],
};
