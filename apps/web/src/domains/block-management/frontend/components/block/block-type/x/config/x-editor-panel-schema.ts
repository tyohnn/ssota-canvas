/**
 * X Block Editor Panel Schema
 */
import { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

export const xEditorPanelSchema: BlockEditorSchema = {
  blockType: BlockType.X,

  groups: [
    {
      id: 'basic-info',
      label: 'Basic Information',
      description: 'X post block basic information',
      defaultCollapsed: false,
      order: 1,
      properties: ['url'],
    },
  ],

  properties: {
    url: {
      label: 'X Post URL',
      inputType: 'url',
      icon: 'Link',
      description: 'X (Twitter) post URL',
      placeholder: 'https://x.com/.../status/...',
      order: 1,
    },
    // createdAt: {
    //   label: 'Created At',
    //   inputType: 'readonly-datetime',
    //   icon: 'Calendar',
    //   description: 'Date when the block was created',
    //   order: 2,
    //   readonly: true,
    //   defaultDisplay: (value: unknown) => {
    //     if (!value) return '-';
    //     const date = new Date(value as string);
    //     return date.toLocaleString('en-US', {
    //       year: 'numeric',
    //       month: 'long',
    //       day: 'numeric',
    //       hour: '2-digit',
    //       minute: '2-digit',
    //     });
    //   },
    // },
    // updatedAt: {
    //   label: 'Updated At',
    //   inputType: 'readonly-datetime',
    //   icon: 'Clock',
    //   description: 'Date when the block was last updated',
    //   order: 3,
    //   readonly: true,
    //   defaultDisplay: (value: unknown) => {
    //     if (!value) return '-';
    //     const date = new Date(value as string);
    //     return date.toLocaleString('en-US', {
    //       year: 'numeric',
    //       month: 'long',
    //       day: 'numeric',
    //       hour: '2-digit',
    //       minute: '2-digit',
    //     });
    //   },
    // },
    // createdBy: {
    //   label: 'Created By',
    //   inputType: 'readonly-profile',
    //   icon: 'User',
    //   description: 'User who created the block',
    //   order: 4,
    //   readonly: true,
    //   defaultDisplay: (value: unknown) => {
    //     if (!value) return 'Unknown';
    //     if (typeof value === 'string') return value;
    //     const v = value as { name?: string; email?: string };
    //     return v.name || v.email || 'Unknown';
    //   },
    // },
  },
};
