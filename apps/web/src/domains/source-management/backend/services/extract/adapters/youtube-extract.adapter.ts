/**
 * YouTube extract adapter: URL → transcript as rawContent (JSON)
 * raw_content: JSON.stringify(script) for Timeline 탭 (useSourceContent + parseTimelineRawContent)
 */
import { extractYoutubeTranscript } from './youtube/extract-transcript';

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
    const rawContent = JSON.stringify(script);
    const contentLanguage = script.metadata?.language ?? null;

    return {
      rawContent,
      contentLanguage,
    };
  }
}
