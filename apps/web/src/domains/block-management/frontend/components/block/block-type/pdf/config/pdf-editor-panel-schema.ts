/**
 * PDF Block Editor Schema
 *
 * PDF document viewer block editor panel UI rendering schema
 */

import type { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

export const pdfEditorPanelSchema: BlockEditorSchema = {
  blockType: BlockType.PDF,

  groups: [
    {
      id: 'basic-info',
      label: 'Basic Information',
      description: 'PDF file information',
      defaultCollapsed: false,
      order: 1,
      properties: ['accessUrl'],
    },
    {
      id: 'metadata',
      label: 'Metadata',
      description: 'Creation and modification information',
      defaultCollapsed: true,
      order: 2,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
    },
  ],

  properties: {
    // Basic Information (accessUrl = stored URL; schema key must match block properties)
    accessUrl: {
      label: 'PDF URL',
      inputType: 'url',
      icon: 'Link',
      description: 'PDF file URL',
      placeholder: 'https://example.com/document.pdf',
      order: 1,
      readonly: true,
    },

    // Display Options
    showPageNav: {
      label: 'Page Navigation',
      inputType: 'checkbox',
      icon: 'Navigation',
      description: 'Show page navigation',
      order: 4,
      defaultDisplay: (value: any) => {
        return value ? 'Visible' : 'Hidden';
      },
    },
    showToolbar: {
      label: 'Toolbar',
      inputType: 'checkbox',
      icon: 'Menu',
      description: 'Show toolbar',
      order: 5,
      defaultDisplay: (value: any) => {
        return value ? 'Visible' : 'Hidden';
      },
    },
    enableAnnotations: {
      label: 'Annotations',
      inputType: 'checkbox',
      icon: 'Edit',
      description: 'Enable annotations feature',
      order: 6,
      defaultDisplay: (value: any) => {
        return value ? 'Enabled' : 'Disabled';
      },
    },

    // Metadata (common)
    createdAt: {
      label: 'Created At',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: 'Date when the block was created',
      order: 101,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    updatedAt: {
      label: 'Updated At',
      inputType: 'readonly-datetime',
      icon: 'Clock',
      description: 'Date when the block was last updated',
      order: 102,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    createdBy: {
      label: 'Created By',
      inputType: 'readonly-profile',
      icon: 'User',
      description: 'User who created the block',
      order: 103,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return 'Unknown';
        if (typeof value === 'string') return value;
        // UserProfile type: userId, email, name, profileImageUrl
        return value.name || value.email || 'Unknown';
      },
    },
  },
};
