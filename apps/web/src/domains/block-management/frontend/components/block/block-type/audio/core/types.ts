import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { UpdateBlockTitleInput } from '@/domains/block-management/frontend/hooks/block-property/use-block-title-update';

export type UpdateBlockTitleFn = (input: UpdateBlockTitleInput) => Promise<boolean>;

export interface UseAudioBlockProps {
  nodeData: BlockNodeData;
  nodeId: string;
  selected: boolean;
  updateBlockTitle?: UpdateBlockTitleFn;
}

export interface UseAudioBlockReturn {
  // State
  audioUrl: string;
  title: string;
  artist: string;
  playbackRate: number;
  volume: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  hasError: boolean;
  isUploading: boolean;
  uploadErrors: string[];
  isDragging: boolean;
  waveformData: number[];
  maxSizeMB: number;

  // Recording
  isRecordDialogOpen: boolean;
  isRecording: boolean;
  recordedBlob: Blob | null;

  // Refs (exposed for audio element)
  audioRef: React.RefObject<HTMLAudioElement | null>;

  // File upload
  handleDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLElement>) => void;
  openFileDialog: () => void;
  getInputProps: () => Record<string, unknown>;

  // Playback
  togglePlay: () => void;
  handleSeek: (time: number) => void;
  formatTime: (seconds: number) => string;

  // Recording
  handleOpenRecordDialog: () => void;
  handleCloseRecordDialog: () => void;
  handleRecordAgain: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  handleSaveRecording: () => Promise<void>;
}

export type AudioViewProps = UseAudioBlockReturn & {
  selected: boolean;
  width: number;
  height: number;
};
