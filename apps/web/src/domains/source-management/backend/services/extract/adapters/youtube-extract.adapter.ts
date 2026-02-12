/**
 * YouTube extract adapter: URL → transcript as rawContent + YoutubeScript as structuredPayload
 */
import { extractYoutubeTranscript } from './youtube/extract-transcript';
import type { YoutubeScript } from './youtube/transcript.types';

import type { ExtractResult, IExtractAdapter } from './types';

function getVideoIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      return u.searchParams.get('v');
    }
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('/')[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Format transcript with timestamps for context (matches previous youtube-app-space format). */
function scriptToRawContent(script: YoutubeScript): string {
  return script.transcript
    .map(seg => {
      const minutes = Math.floor(seg.start / 60);
      const seconds = Math.floor(seg.start % 60);
      return `[${minutes}:${seconds.toString().padStart(2, '0')}] ${seg.text}`;
    })
    .join('\n');
}

export class YoutubeExtractAdapter implements IExtractAdapter {
  async extract(
    url: string,
    _metadata?: Record<string, unknown>
  ): Promise<ExtractResult> {
    const videoId = getVideoIdFromUrl(url);
    if (!videoId) {
      throw new Error(`Invalid YouTube URL: ${url}`);
    }

    const script = await extractYoutubeTranscript(videoId);
    const rawContent = scriptToRawContent(script);
    const contentLanguage = script.metadata?.language ?? null;

    return {
      rawContent,
      structuredPayload: script,
      contentLanguage,
    };
  }
}
