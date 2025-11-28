/**
 * YouTube Block Editor Schema
 *
 * YouTube video embed block editor panel UI rendering schema
 */

import type { BlockEditorSchema } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockType } from '@/domains/block-management/shared/types/block-types';

export const youtubeEditorPanelSchema: BlockEditorSchema = {
  blockType: BlockType.YOUTUBE,

  groups: [
    {
      id: 'basic-info',
      label: 'Basic Information',
      description: 'YouTube video information',
      defaultCollapsed: false,
      order: 1,
      properties: [
        'url',
        'youtubeTitle',
        'youtubeDescription',
        'youtubeThumbnail',
      ],
    },
    {
      id: 'youtube-metadata',
      label: 'YouTube Statistics',
      description: 'YouTube statistics information (read-only)',
      defaultCollapsed: true,
      order: 2,
      properties: [
        'viewCount',
        'likeCount',
        'channelName',
        'subscriberCount',
        'commentCount',
        'publishedAt',
      ],
    },
    {
      id: 'metadata',
      label: 'Metadata',
      description: 'Creation and modification information',
      defaultCollapsed: true,
      order: 3,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
    },
  ],

  properties: {
    // 기본 정보
    url: {
      label: 'YouTube URL',
      inputType: 'url',
      icon: 'Link',
      description: 'YouTube video URL',
      placeholder: 'https://www.youtube.com/watch?v=...',
      order: 1,
    },
    youtubeTitle: {
      label: 'Video Title',
      inputType: 'text',
      icon: 'Heading',
      description: 'YouTube video title (editable after fetch)',
      placeholder: 'Enter title...',
      order: 2,
    },
    youtubeDescription: {
      label: 'Video Description',
      inputType: 'textarea',
      icon: 'FileText',
      description: 'YouTube video description (editable after fetch)',
      placeholder: 'Enter description...',
      order: 3,
    },
    youtubeThumbnail: {
      label: 'Thumbnail',
      inputType: 'image-upload',
      icon: 'Image',
      description: 'YouTube thumbnail image (editable after fetch)',
      placeholder: 'Upload thumbnail image',
      order: 4,
    },

    // YouTube 통계 정보 (읽기 전용)
    viewCount: {
      label: 'View Count',
      inputType: 'readonly-text',
      icon: 'Eye',
      description: 'View count',
      order: 5,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return typeof value === 'number' ? value.toLocaleString() : value;
      },
    },
    likeCount: {
      label: 'Like Count',
      inputType: 'readonly-text',
      icon: 'ThumbsUp',
      description: 'Like count',
      order: 6,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return typeof value === 'number' ? value.toLocaleString() : value;
      },
    },
    channelName: {
      label: '채널 이름',
      inputType: 'readonly-text',
      icon: 'User',
      description: '채널 이름',
      order: 7,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return value;
      },
    },
    subscriberCount: {
      label: 'Subscriber Count',
      inputType: 'readonly-text',
      icon: 'Users',
      description: 'Subscriber count',
      order: 8,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return typeof value === 'number' ? value.toLocaleString() : value;
      },
    },
    commentCount: {
      label: 'Comment Count',
      inputType: 'readonly-text',
      icon: 'MessageCircle',
      description: 'Comment count',
      order: 9,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return typeof value === 'number' ? value.toLocaleString() : value;
      },
    },
    publishedAt: {
      label: '게시일',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '영상 게시일',
      order: 10,
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

    // 메타데이터 (읽기 전용)
    createdAt: {
      label: 'Created At',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: 'Date when the block was created',
      order: 11,
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
      order: 12,
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
      order: 13,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return 'Unknown';
        if (typeof value === 'string') return value;
        // UserProfile 타입: id, email, name, avatarUrl
        return value.name || value.email || 'Unknown';
      },
    },
  },
};
