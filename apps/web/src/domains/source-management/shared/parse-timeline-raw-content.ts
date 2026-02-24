/**
 * Parse timeline script from raw_content
 *
 * Supports two formats:
 * 1. JSON: JSON.stringify(timeline script) from YoutubeExtractAdapter
 * 2. Plain text: "[MM:SS] text\n" from migration or legacy (plan.md §1.3, §4.3)
 */
import type {
  TimelineScript,
  TimelineTranscriptMetadata,
  TimelineTranscriptSegment,
} from './types/timeline-script.types';

/** Match [M:SS], [MM:SS], or [H:MM:SS] timestamp lines */
const PLAIN_TEXT_LINE_REGEX = /^\[(\d+):(\d{2})(?::(\d{2}))?\]\s*(.*)$/gm;

function parsePlainTextFormat(rawContent: string): TimelineScript | null {
  const segments: TimelineTranscriptSegment[] = [];
  let match: RegExpExecArray | null;

  PLAIN_TEXT_LINE_REGEX.lastIndex = 0;
  while ((match = PLAIN_TEXT_LINE_REGEX.exec(rawContent)) !== null) {
    const part1 = parseInt(match[1] ?? '0', 10);
    const part2 = parseInt(match[2] ?? '0', 10);
    const part3 = match[3] != null ? parseInt(match[3], 10) : null;
    const text = (match[4] ?? '').trim();
    if (!text) continue;

    const start =
      part3 != null ? part1 * 3600 + part2 * 60 + part3 : part1 * 60 + part2;
    const prev = segments[segments.length - 1];
    const duration = prev != null ? Math.max(1, start - prev.start) : 1;

    segments.push({ text, start, duration });
  }

  if (segments.length === 0) return null;

  const last = segments[segments.length - 1]!;
  const totalDuration = last.start + last.duration;
  const metadata: TimelineTranscriptMetadata = {
    extractedAt: new Date().toISOString(),
    totalDuration,
    totalSegments: segments.length,
    language: 'en',
  };

  return { transcript: segments, metadata };
}

export function parseTimelineRawContent(rawContent: string | null): TimelineScript | null {
  if (!rawContent?.trim()) return null;

  try {
    const parsed = JSON.parse(rawContent) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as TimelineScript).transcript)
    ) {
      const script = parsed as TimelineScript;
      if (script.transcript.length > 0) return script;
    }
  } catch {
    // Fall through to plain text parser
  }

  return parsePlainTextFormat(rawContent);
}
