/**
 * Audio Block UI Schema
 *
 * 오디오 블록의 Editor Panel UI를 정의하는 스키마
 */

import type { BlockUISchema } from './block-ui-schema.interface';
import { BlockType } from '../../types/block-types';

export const audioBlockUISchema: BlockUISchema = {
  blockType: BlockType.AUDIO,

  groups: [
    {
      id: 'basic-info',
      label: '기본 정보',
      description: '오디오 파일 정보',
      defaultCollapsed: false,
      order: 1,
      properties: ['audioUrl', 'title', 'artist'],
    },
    {
      id: 'playback-settings',
      label: '재생 설정',
      description: '재생 속도 및 볼륨 설정',
      defaultCollapsed: false,
      order: 2,
      properties: ['playbackRate', 'volume'],
    },
    {
      id: 'transcript',
      label: '텍스트 변환',
      description: 'AI 음성 인식 결과 (읽기 전용)',
      defaultCollapsed: true,
      order: 3,
      properties: ['transcript'],
    },
    {
      id: 'audio-metadata',
      label: '오디오 메타데이터',
      description: '오디오 파일 정보 (읽기 전용)',
      defaultCollapsed: true,
      order: 4,
      properties: ['fileType', 'fileSize', 'audioDuration'],
    },
    {
      id: 'metadata',
      label: '메타데이터',
      description: '생성 및 수정 정보',
      defaultCollapsed: true,
      order: 5,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
    },
  ],
  properties: {
    // 기본 정보
    audioUrl: {
      label: '오디오 URL',
      inputType: 'url',
      icon: 'Music',
      description: '오디오 파일 URL (업로드 또는 녹음으로 자동 설정)',
      placeholder: 'https://...',
      order: 1,
      readonly: true,
    },
    title: {
      label: '제목',
      inputType: 'text',
      icon: 'Heading',
      description: '오디오 제목',
      placeholder: '제목을 입력하세요...',
      order: 2,
    },
    artist: {
      label: '아티스트/화자',
      inputType: 'text',
      icon: 'User',
      description: '아티스트 또는 화자 이름',
      placeholder: '이름을 입력하세요...',
      order: 3,
    },

    // 재생 설정
    playbackRate: {
      label: '재생 속도',
      inputType: 'select',
      icon: 'Gauge',
      description: '오디오 재생 속도',
      order: 4,
      options: [
        { value: '0.5', label: '0.5x' },
        { value: '0.75', label: '0.75x' },
        { value: '1.0', label: '1.0x (기본)' },
        { value: '1.25', label: '1.25x' },
        { value: '1.5', label: '1.5x' },
        { value: '1.75', label: '1.75x' },
        { value: '2.0', label: '2.0x' },
      ],
    },
    volume: {
      label: '볼륨',
      inputType: 'number',
      icon: 'Volume2',
      description: '오디오 볼륨 (0.0 ~ 1.0)',
      order: 5,
    },

    // 텍스트 변환
    transcript: {
      label: '텍스트 변환',
      inputType: 'readonly-text',
      icon: 'FileText',
      description: '음성을 텍스트로 변환한 결과',
      order: 6,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '변환된 텍스트 없음';
        return value;
      },
    },

    // 오디오 메타데이터 (읽기 전용)
    fileType: {
      label: '파일 타입',
      inputType: 'readonly-text',
      icon: 'FileType',
      description: '파일 확장자/MIME 타입',
      order: 7,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return value;
      },
    },
    fileSize: {
      label: '파일 크기',
      inputType: 'readonly-text',
      icon: 'HardDrive',
      description: '파일 크기',
      order: 8,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return value;
      },
    },
    audioDuration: {
      label: '재생 시간',
      inputType: 'readonly-text',
      icon: 'Clock',
      description: '오디오 재생 시간',
      order: 9,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return value;
      },
    },

    // 메타데이터 (읽기 전용)
    createdAt: {
      label: '생성일',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '블록이 생성된 날짜',
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
    updatedAt: {
      label: '수정일',
      inputType: 'readonly-datetime',
      icon: 'Clock',
      description: '블록이 마지막으로 수정된 날짜',
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
    createdBy: {
      label: '작성자',
      inputType: 'readonly-profile',
      icon: 'User',
      description: '블록을 생성한 사용자',
      order: 12,
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
