/**
 * Audio Block Editor Schema
 *
 * Audio block editor panel UI rendering schema
 */

import type { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

export const audioEditorSchema: BlockEditorSchema = {
  blockType: BlockType.AUDIO,

  groups: [
    {
      id: 'basic-info',
      label: 'Basic Information',
      description: 'Audio file information',
      defaultCollapsed: false,
      order: 1,
      properties: ['audioUrl', 'title', 'artist'],
    },
    {
      id: 'playback-settings',
      label: 'Playback Settings',
      description: 'Playback speed and volume settings',
      defaultCollapsed: false,
      order: 2,
      properties: ['playbackRate', 'volume'],
    },
    {
      id: 'transcript',
      label: 'Transcription',
      description: 'AI speech recognition result (read-only)',
      defaultCollapsed: true,
      order: 3,
      properties: ['transcript'],
    },
    {
      id: 'audio-metadata',
      label: 'Audio Metadata',
      description: 'Audio file information (read-only)',
      defaultCollapsed: true,
      order: 4,
      properties: ['fileType', 'fileSize', 'audioDuration'],
    },
    {
      id: 'metadata',
      label: 'Metadata',
      description: 'Creation and modification information',
      defaultCollapsed: true,
      order: 5,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
    },
  ],

  properties: {
    // Basic Information
    audioUrl: {
      label: 'Audio URL',
      inputType: 'url',
      icon: 'Music',
      description: 'Audio file URL (automatically set via upload or recording)',
      placeholder: 'https://...',
      order: 1,
      readonly: true,
    },
    title: {
      label: 'Title',
      inputType: 'text',
      icon: 'Heading',
      description: 'Audio title',
      placeholder: 'Enter title...',
      order: 2,
    },
    artist: {
      label: 'Artist/Speaker',
      inputType: 'text',
      icon: 'User',
      description: 'Artist or speaker name',
      placeholder: 'Enter name...',
      order: 3,
    },

    // Playback Settings
    playbackRate: {
      label: 'Playback Rate',
      inputType: 'select',
      icon: 'Gauge',
      description: 'Audio playback speed',
      order: 4,
      options: [
        { id: '0.5', value: '0.5', label: '0.5x', order: 1 },
        { id: '0.75', value: '0.75', label: '0.75x', order: 2 },
        { id: '1.0', value: '1.0', label: '1.0x (Normal)', order: 3 },
        { id: '1.25', value: '1.25', label: '1.25x', order: 4 },
        { id: '1.5', value: '1.5', label: '1.5x', order: 5 },
        { id: '1.75', value: '1.75', label: '1.75x', order: 6 },
        { id: '2.0', value: '2.0', label: '2.0x', order: 7 },
      ],
    },
    volume: {
      label: 'Volume',
      inputType: 'number',
      icon: 'Volume2',
      description: 'Audio volume (0.0 ~ 1.0)',
      order: 5,
    },

    // Transcription
    transcript: {
      label: 'Transcript',
      inputType: 'readonly-text',
      icon: 'FileText',
      description: 'Speech-to-text transcription result',
      order: 6,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return 'No transcript available';
        return value;
      },
    },

    // Audio Metadata (read-only)
    fileType: {
      label: 'File Type',
      inputType: 'readonly-text',
      icon: 'FileType',
      description: 'File extension/MIME type',
      order: 7,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return value;
      },
    },
    fileSize: {
      label: 'File Size',
      inputType: 'readonly-text',
      icon: 'HardDrive',
      description: 'File size',
      order: 8,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return value;
      },
    },
    audioDuration: {
      label: 'Duration',
      inputType: 'readonly-text',
      icon: 'Clock',
      description: 'Audio duration',
      order: 9,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return value;
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
