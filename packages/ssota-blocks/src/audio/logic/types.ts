/**
 * Audio block types - domain-agnostic for ssota-blocks.
 */

import type { RefObject } from 'react';

export interface UseAudioBlockPreviewProps {
  audioUrl: string;
  filename: string;
}

export interface UseAudioBlockPreviewReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  hasError: boolean;
  waveformData: number[];
  audioRef: RefObject<HTMLAudioElement | null>;
  togglePlay: () => void;
  handleSeek: (time: number) => void;
  formatTime: (seconds: number) => string;
}

export interface AudioPreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
}

export interface AudioPlayerProps {
  audioUrl: string;
  filename: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  waveformData: number[];
  isLoading: boolean;
  hasError: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  formatTime: (seconds: number) => string;
  /** When true, hide title row (e.g. grid card already has header) */
  compact?: boolean;
}

export interface AudioViewProps {
  audioUrl: string;
  filename: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  waveformData: number[];
  isLoading: boolean;
  hasError: boolean;
  isUploading: boolean;
  uploadErrors: string[];
  isDragging: boolean;
  maxSizeMB: number;
  isRecordDialogOpen: boolean;
  isRecording: boolean;
  recordedBlob: Blob | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  selected: boolean;
  /** Optional; used by canvas block for layout */
  width?: number;
  height?: number;
  /** When true, hide title in player (e.g. grid card) */
  compact?: boolean;
  handleDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLElement>) => void;
  openFileDialog: () => void;
  getInputProps: () => object;
  togglePlay: () => void;
  handleSeek: (time: number) => void;
  formatTime: (seconds: number) => string;
  handleOpenRecordDialog: () => void;
  handleCloseRecordDialog: () => void;
  handleRecordAgain: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  handleSaveRecording: () => Promise<void>;
}
