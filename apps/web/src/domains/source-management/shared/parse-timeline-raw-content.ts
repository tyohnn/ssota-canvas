/**
 * Parse timeline script from raw_content
 * raw_content = JSON.stringify(timeline script)
 * Video, audio 등 타임라인 기반 스크립트용
 */
import type { YoutubeScript } from '@/domains/youtube-app-space/shared/types/transcript.types';

export function parseTimelineRawContent(rawContent: string | null): YoutubeScript | null {
  if (!rawContent?.trim()) return null;
  try {
    const parsed = JSON.parse(rawContent) as unknown;
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as YoutubeScript).transcript)) {
      const script = parsed as YoutubeScript;
      if (script.transcript.length > 0) return script;
    }
  } catch {
    // ignore
  }
  return null;
}
