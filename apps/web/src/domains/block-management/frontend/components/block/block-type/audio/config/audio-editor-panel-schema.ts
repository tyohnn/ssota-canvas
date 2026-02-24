/**
 * Audio Block Editor Schema
 *
 * Audio block editor panel UI rendering schema
 */

import type { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

/**
 * Audio Block Editor Schema
 *
 * Basic info only. Metadata is shown in Metadata tab.
 */
export const audioEditorPanelSchema: BlockEditorSchema = {
  blockType: BlockType.AUDIO,

  groups: [
    {
      id: 'basic-info',
      label: 'Basic Information',
      description: 'Audio file information',
      defaultCollapsed: false,
      order: 1,
      properties: ['audioUrl'],
    },
  ],

  properties: {
    audioUrl: {
      label: 'Audio URL',
      inputType: 'url',
      icon: 'Music',
      description: 'Audio file URL (automatically set via upload or recording)',
      placeholder: 'https://...',
      order: 1,
      readonly: true,
    },
  },
};
