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
    title: {
      type: PropertyType.TEXT,
      description: 'Audio title',
      default: '',
    },
    artist: {
      type: PropertyType.TEXT,
      description: 'Artist or speaker name',
      default: '',
    },
    playbackRate: {
      type: PropertyType.NUMBER,
      description: 'Playback speed (0.5 to 2.0)',
      default: 1.0,
      validation: { min: 0.5, max: 2.0 },
    },
    volume: {
      type: PropertyType.NUMBER,
      description: 'Volume (0.0 to 1.0)',
      default: 0.8,
      validation: { min: 0.0, max: 1.0 },
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
