/**
 * Audio Block - ssota-blocks
 *
 * Export View and preview hook for add-dialog and (later) Canvas.
 */

export { AudioView } from './components/audio.view';
export { AudioPreviewCard } from './components/audio-preview-card';
export { AudioEmptyState } from './components/audio-empty-state';
export { AudioLoadingState } from './components/audio-loading-state';
export { AudioPlayer } from './components/audio-player';
export { AudioRecordDialog } from './components/audio-record-dialog';

export { useAudioBlockPreview } from './logic/use-audio-block-preview';

export type {
  AudioViewProps,
  AudioPlayerProps,
  AudioPreviewCardProps,
  UseAudioBlockPreviewProps,
  UseAudioBlockPreviewReturn,
} from './logic/types';
