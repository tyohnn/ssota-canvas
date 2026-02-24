/**
 * Audio extract adapter: ElevenLabs Speech-to-Text (Scribe v2)
 *
 * Uses the official @elevenlabs/elevenlabs-js SDK (Batch Speech to Text API).
 * Fetches audio from URL, converts to Blob, then calls speechToText.convert().
 * raw_content: JSON.stringify(TimelineScript) for Timeline tab (useSourceContent + parseTimelineRawContent)
 */
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { config } from '@/config';
import type {
  TimelineScript,
  TimelineTranscriptMetadata,
  TimelineTranscriptSegment,
} from '@/domains/source-management/shared/types/timeline-script.types';

import type { ExtractResult, IExtractAdapter } from './types';

const SEGMENT_TARGET_DURATION_SEC = 8;

interface ElevenLabsWord {
  text: string;
  start?: number;
  end?: number;
  type: 'word' | 'spacing' | 'audio_event';
  speakerId?: string;
}

function wordsToTimelineScript(
  words: ElevenLabsWord[],
  languageCode: string
): TimelineScript {
  const filtered = words.filter(w => w.type === 'word' && w.start != null && w.end != null);
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
  let segmentStart = filtered[0]!.start!;
  let lastEnd = filtered[0]!.end!;
  let segmentSpeakerId = filtered[0]!.speakerId;

  for (const w of filtered) {
    const start = w.start!;
    const end = w.end!;
    const gap = start - lastEnd;
    const speakerChanged =
      segmentSpeakerId != null &&
      w.speakerId != null &&
      segmentSpeakerId !== w.speakerId;

    const shouldStartNewSegment =
      currentText.length > 0 &&
      (speakerChanged ||
        start - segmentStart >= SEGMENT_TARGET_DURATION_SEC ||
        gap > 1.5);

    if (shouldStartNewSegment && currentText.length > 0) {
      segments.push({
        text: currentText.join(' ').trim(),
        start: Math.round(segmentStart * 10) / 10,
        duration: Math.round((lastEnd - segmentStart) * 10) / 10 || 1,
        ...(segmentSpeakerId != null && { speakerId: segmentSpeakerId }),
      });
      currentText = [];
      segmentStart = start;
      segmentSpeakerId = w.speakerId;
    }

    currentText.push(w.text.trim());
    lastEnd = end;
    if (segmentSpeakerId == null && w.speakerId != null) {
      segmentSpeakerId = w.speakerId;
    }
  }

  if (currentText.length > 0) {
    segments.push({
      text: currentText.join(' ').trim(),
      start: Math.round(segmentStart * 10) / 10,
      duration: Math.round((lastEnd - segmentStart) * 10) / 10 || 1,
      ...(segmentSpeakerId != null && { speakerId: segmentSpeakerId }),
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
      null;

    const audioResponse = await fetch(url);
    if (!audioResponse.ok) {
      throw new Error(
        `Failed to fetch audio (${audioResponse.status}): ${url}`
      );
    }

    const contentType =
      audioResponse.headers.get('content-type') || 'application/octet-stream';
    const audioBlob = new Blob([await audioResponse.arrayBuffer()], {
      type: contentType,
    });

    const elevenlabs = new ElevenLabsClient({ apiKey });

    const transcription = await elevenlabs.speechToText.convert({
      file: audioBlob,
      modelId: 'scribe_v2',
      tagAudioEvents: true,
      languageCode: languageCode || undefined,
      diarize: true,
    });

    const data = transcription as {
      languageCode?: string;
      language?: string;
      text: string;
      words: ElevenLabsWord[];
    };
    const detectedLanguage =
      data.languageCode ?? data.language ?? 'en';

    if (!data.words?.length) {
      const script: TimelineScript = {
        transcript: [],
        metadata: {
          extractedAt: new Date().toISOString(),
          totalDuration: 0,
          totalSegments: 0,
          language: detectedLanguage,
        },
      };
      return {
        rawContent: JSON.stringify(script),
        structuredPayload: script,
        contentLanguage: detectedLanguage,
      };
    }

    const script = wordsToTimelineScript(data.words, detectedLanguage);
    const rawContent = JSON.stringify(script);

    return {
      rawContent,
      structuredPayload: script,
      contentLanguage: detectedLanguage,
    };
  }
}
