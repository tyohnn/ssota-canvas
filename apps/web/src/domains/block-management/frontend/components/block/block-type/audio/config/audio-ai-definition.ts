import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { BlockTypeDefinition } from '@/domains/ai-management/backend/services/prompt/block-type-definitions';

export const audioAIDefinition: BlockTypeDefinition = {
  type: 'audio',
  name: 'Audio Block',
  description: 'Audio player for music and voice recordings.',
  useCases: ['Playing audio files', 'Voice memos', 'Music references'],
  basicProperties: {
    audioUrl: {
      type: PropertyType.URL,
      description: 'URL of the audio file',
      required: true,
    },
    filename: {
      type: PropertyType.TEXT,
      description: 'Uploaded filename',
      default: '',
    },
    duration: {
      type: PropertyType.NUMBER,
      description: 'Playback duration in seconds',
      default: 0,
    },
    fileSize: {
      type: PropertyType.NUMBER,
      description: 'File size in bytes',
      default: 0,
    },
  },
  actions: [
    {
      name: 'transcribe',
      description: 'Transcribe audio to text using Whisper API',
    },
  ],
  examples: [],
};
