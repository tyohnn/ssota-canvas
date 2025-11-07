/**
 * YouTube Block UI Schema
 *
 * YouTube 영상 임베드 블록의 Editor Panel UI를 정의하는 스키마
 */

import type { BlockUISchema } from './block-ui-schema.interface';
import { BlockType } from '../../types/block-types';

export const youtubeBlockUISchema: BlockUISchema = {
  blockType: BlockType.YOUTUBE,

  groups: [
    {
      id: 'basic-info',
      label: '기본 정보',
      description: '유튜브 영상 정보',
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
      label: 'YouTube 통계',
      description: 'YouTube 통계 정보 (읽기 전용)',
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
      label: '메타데이터',
      description: '생성 및 수정 정보',
      defaultCollapsed: true,
      order: 3,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
    },
  ],

  properties: {
    // 기본 정보
    url: {
      label: '유튜브 URL',
      inputType: 'url',
      icon: 'Link',
      description: '유튜브 영상 URL',
      placeholder: 'https://www.youtube.com/watch?v=...',
      order: 1,
    },
    youtubeTitle: {
      label: '영상 제목',
      inputType: 'text',
      icon: 'Heading',
      description: '유튜브 영상 제목 (fetch 후 수정 가능)',
      placeholder: '제목을 입력하세요...',
      order: 2,
    },
    youtubeDescription: {
      label: '영상 설명',
      inputType: 'textarea',
      icon: 'FileText',
      description: '유튜브 영상 설명 (fetch 후 수정 가능)',
      placeholder: '설명을 입력하세요...',
      order: 3,
    },
    youtubeThumbnail: {
      label: '썸네일',
      inputType: 'image-upload',
      icon: 'Image',
      description: '유튜브 썸네일 이미지 (fetch 후 수정 가능)',
      placeholder: '썸네일 이미지를 업로드하세요',
      order: 4,
    },

    // YouTube 통계 정보 (읽기 전용)
    viewCount: {
      label: '조회수',
      inputType: 'readonly-text',
      icon: 'Eye',
      description: '조회수',
      order: 5,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return typeof value === 'number' ? value.toLocaleString() : value;
      },
    },
    likeCount: {
      label: '좋아요 수',
      inputType: 'readonly-text',
      icon: 'ThumbsUp',
      description: '좋아요 수',
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
      label: '구독자 수',
      inputType: 'readonly-text',
      icon: 'Users',
      description: '구독자 수',
      order: 8,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return typeof value === 'number' ? value.toLocaleString() : value;
      },
    },
    commentCount: {
      label: '댓글 수',
      inputType: 'readonly-text',
      icon: 'MessageCircle',
      description: '댓글 수',
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
        return date.toLocaleString('ko-KR', {
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
      label: '생성일',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '블록이 생성된 날짜',
      order: 11,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    updatedAt: {
      label: '수정일',
      inputType: 'readonly-datetime',
      icon: 'Clock',
      description: '블록이 마지막으로 수정된 날짜',
      order: 12,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    createdBy: {
      label: '작성자',
      inputType: 'readonly-profile',
      icon: 'User',
      description: '블록을 생성한 사용자',
      order: 13,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '알 수 없음';
        if (typeof value === 'string') return value;
        // UserProfile 타입: id, email, name, avatarUrl
        return value.name || value.email || '알 수 없음';
      },
    },
  },
};
