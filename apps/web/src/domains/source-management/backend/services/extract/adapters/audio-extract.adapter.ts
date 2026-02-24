/**
 * Audio extract adapter: ElevenLabs Speech-to-Text (Scribe v2)
 *
 * Uses cloud_storage_url (HTTPS) for transcription.
 * raw_content: JSON.stringify(TimelineScript) for Timeline tab (useSourceContent + parseTimelineRawContent)
 */
import { config } from '@/config';
import type {
  TimelineScript,
  TimelineTranscriptMetadata,
  TimelineTranscriptSegment,
} from '@/domains/source-management/shared/types/timeline-script.types';

import type { ExtractResult, IExtractAdapter } from './types';

const ELEVENLABS_STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const SEGMENT_TARGET_DURATION_SEC = 8;

interface ElevenLabsWord {
  text: string;
  start: number;
  end: number;
  type: 'word' | 'spacing' | 'audio_event';
}

interface ElevenLabsChunkResponse {
  language_code: string;
  text: string;
  words: ElevenLabsWord[];
}

function wordsToTimelineScript(
  words: ElevenLabsWord[],
  languageCode: string
): TimelineScript {
  const filtered = words.filter(w => w.type === 'word');
  if (filtered.length === 0) {
    return {
      transcript: [],
      metadata: {
        extractedAt: new Date().toISOString(),
        totalDuration: 0,
        totalSegments: 0,
        language: languageCode,
      },
    };
  }

  const segments: TimelineTranscriptSegment[] = [];
  let currentText: string[] = [];
  let segmentStart = filtered[0]!.start;
  let lastEnd = filtered[0]!.end;

  for (const w of filtered) {
    const duration = w.end - w.start;
    const gap = w.start - lastEnd;

    const shouldStartNewSegment =
      currentText.length > 0 &&
      (w.start - segmentStart >= SEGMENT_TARGET_DURATION_SEC || gap > 1.5);

    if (shouldStartNewSegment && currentText.length > 0) {
      segments.push({
        text: currentText.join(' ').trim(),
        start: Math.round(segmentStart * 10) / 10,
        duration: Math.round((lastEnd - segmentStart) * 10) / 10 || 1,
      });
      currentText = [];
      segmentStart = w.start;
    }

    currentText.push(w.text.trim());
    lastEnd = w.end;
  }

  if (currentText.length > 0) {
    segments.push({
      text: currentText.join(' ').trim(),
      start: Math.round(segmentStart * 10) / 10,
      duration: Math.round((lastEnd - segmentStart) * 10) / 10 || 1,
    });
  }

  const last = segments[segments.length - 1];
  const totalDuration = last ? last.start + last.duration : 0;
  const metadata: TimelineTranscriptMetadata = {
    extractedAt: new Date().toISOString(),
    totalDuration,
    totalSegments: segments.length,
    language: languageCode,
  };

  return { transcript: segments, metadata };
}

export class AudioExtractAdapter implements IExtractAdapter {
  async extract(
    url: string,
    metadata?: Record<string, unknown>
  ): Promise<ExtractResult> {
    const apiKey = config.providers.elevenlabs;
    if (!apiKey?.trim()) {
      throw new Error(
        'ELEVENLABS_API_KEY is not configured. Set it in environment variables.'
      );
    }

    const languageCode =
      (metadata?.languageCode as string) ??
      (metadata?.language as string) ??
      '';

    const formData = new FormData();
    formData.append('model_id', 'scribe_v2');
    formData.append('cloud_storage_url', url);
    formData.append('timestamps_granularity', 'word');
    if (languageCode) {
      formData.append('language_code', languageCode);
    }

    const res = await fetch(ELEVENLABS_STT_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(
        `ElevenLabs STT failed (${res.status}): ${errText.slice(0, 300)}`
      );
    }

    const data = (await res.json()) as ElevenLabsChunkResponse;

    if (!data.words?.length) {
      const script: TimelineScript = {
        transcript: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          totalDuration: 0,
          totalSegments: 0,
          language: data.language_code || 'en',
        },
      };
      return {
        rawContent: JSON.stringify(script),
        structuredPayload: script,
        contentLanguage: data.language_code || null,
      };
    }

    const script = wordsToTimelineScript(data.words, data.language_code || 'en');
    const rawContent = JSON.stringify(script);

    return {
      rawContent,
      structuredPayload: script,
      contentLanguage: data.language_code || null,
    };
  }
}
