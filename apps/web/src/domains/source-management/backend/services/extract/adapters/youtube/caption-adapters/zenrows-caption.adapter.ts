/**
 * ZenRows Caption Adapter (2차 Fallback)
 *
 * ZenRows 프록시를 사용하여 YouTube 자막을 추출하는 adapter입니다.
 * 배포 환경에서 youtube-caption-extractor가 실패할 경우를 대비한 fallback입니다.
 *
 * ⚠️ 주의: ZenRows API Key가 필요하며, 유료 서비스입니다.
 *
 * 구현 방식:
 * - youtube-caption-extractor와 동일한 방식으로 InnerTube API를 통해 playerData 가져오기
 * - ZenRows Universal Scraper API를 통해 YouTube 페이지/API 호출
 * - Caption XML을 직접 fetch하여 파싱
 */
import { config } from '@/config';

import type { TranscriptSegment } from '../transcript.types';
import type { TranscriptAdapter } from './types';

export class ZenRowsCaptionAdapter implements TranscriptAdapter {
  name = 'zenrows-caption';

  async getTranscript(
    videoId: string,
    language?: string
  ): Promise<TranscriptSegment[]> {
    const zenrowsApiKey = config.providers.zenrows;
    if (!zenrowsApiKey) {
      throw new Error(
        'ZENROWS_API_KEY environment variable is required for ZenRowsCaptionAdapter'
      );
    }

    const playerData = await this.getPlayerData(videoId, zenrowsApiKey);

    const captionTracks =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (
      !captionTracks ||
      !Array.isArray(captionTracks) ||
      captionTracks.length === 0
    ) {
      throw new Error('No caption tracks found for this video');
    }

    const targetLang = language || 'en';
    const captionTrack =
      captionTracks.find((track) => track.vssId === `.${targetLang}`) ||
      captionTracks.find((track) => track.vssId === `a.${targetLang}`) ||
      captionTracks.find((track) => track.vssId?.includes(`.${targetLang}`)) ||
      captionTracks[0];

    if (!captionTrack?.baseUrl) {
      throw new Error(`No caption track found for language: ${targetLang}`);
    }

    const captionUrl = captionTrack.baseUrl.replace('&fmt=srv3', '');
    const xml = await this.fetchViaZenRows(captionUrl, zenrowsApiKey);

    return this.parseTimedTextXml(xml);
  }

  private async getPlayerData(videoId: string, apiKey: string): Promise<any> {
    const innerTubeUrl = `https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`;

    const payload = {
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '19.09.37',
          androidSdkVersion: 30,
          userAgent:
            'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
        },
      },
      videoId,
    };

    const response = await fetch(
      `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(
        innerTubeUrl
      )}&premium_proxy=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch player data via ZenRows: ${response.status}`
      );
    }

    const data = await response.json();

    if (data?.playabilityStatus?.status === 'UNPLAYABLE') {
      const reason = data.playabilityStatus.reason || 'Video unavailable';
      throw new Error(`YouTube API returned UNPLAYABLE status: ${reason}`);
    }

    return data;
  }

  private async fetchViaZenRows(url: string, apiKey: string): Promise<string> {
    const response = await fetch(
      `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(
        url
      )}&premium_proxy=true`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch via ZenRows: ${response.status}`);
    }

    return await response.text();
  }

  private parseTimedTextXml(xml: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    const cleanedXml = xml
      .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
      .replace('</transcript>', '');

    const lines = cleanedXml
      .split('</text>')
      .filter((line) => line && line.trim());

    const startRegex = /start="([\d.]+)"/;
    const durRegex = /dur="([\d.]+)"/;

    for (const line of lines) {
      const startMatch = startRegex.exec(line);
      const durMatch = durRegex.exec(line);

      if (!startMatch?.[1] || !durMatch?.[1]) {
        continue;
      }

      const textMatch = line.match(/<text[^>]*>([\s\S]*)$/);
      if (!textMatch?.[1]) {
        continue;
      }

      const rawText = textMatch[1];
      const text = this.decodeHtmlEntities(rawText.trim());

      if (text) {
        segments.push({
          text,
          start: parseFloat(startMatch[1]),
          duration: parseFloat(durMatch[1]),
        });
      }
    }

    return segments;
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) =>
        String.fromCharCode(parseInt(num, 10))
      );
  }
}
