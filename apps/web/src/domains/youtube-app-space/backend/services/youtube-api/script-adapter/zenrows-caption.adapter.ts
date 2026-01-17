/**
 * ZenRows Caption Adapter
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

import type { TranscriptSegment } from '../../../../shared/types/transcript.types';
import type { TranscriptAdapter } from './types';

/**
 * ZenRows를 사용한 YouTube Caption Adapter
 *
 * youtube-caption-extractor와 유사한 방식으로 작동하지만,
 * ZenRows 프록시를 통해 모든 요청을 라우팅합니다.
 */
export class ZenRowsCaptionAdapter implements TranscriptAdapter {
  name = 'zenrows-caption';

  /**
   * ZenRows를 사용하여 YouTube 자막 추출
   *
   * @param videoId - YouTube Video ID
   * @param language - 언어 코드 (선택적, 예: 'en', 'ko')
   * @returns 자막 세그먼트 배열
   */
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

    // YouTube의 InnerTube API를 통해 playerData 가져오기
    // youtube-caption-extractor와 동일한 방식
    const playerData = await this.getPlayerData(videoId, zenrowsApiKey);

    // Caption tracks 찾기
    const captionTracks =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (
      !captionTracks ||
      !Array.isArray(captionTracks) ||
      captionTracks.length === 0
    ) {
      throw new Error('No caption tracks found for this video');
    }

    // 원하는 언어의 caption track 선택
    const targetLang = language || 'en';
    const captionTrack =
      captionTracks.find(track => track.vssId === `.${targetLang}`) ||
      captionTracks.find(track => track.vssId === `a.${targetLang}`) ||
      captionTracks.find(track => track.vssId?.includes(`.${targetLang}`)) ||
      captionTracks[0]; // fallback to first available

    if (!captionTrack?.baseUrl) {
      throw new Error(`No caption track found for language: ${targetLang}`);
    }

    // Caption XML 직접 fetch (ZenRows proxy 사용)
    // youtube-caption-extractor처럼 fmt=srv3 제거하여 XML 형식 강제
    const captionUrl = captionTrack.baseUrl.replace('&fmt=srv3', '');
    const xml = await this.fetchViaZenRows(captionUrl, zenrowsApiKey);

    // XML 파싱
    return this.parseTimedTextXml(xml);
  }

  /**
   * ZenRows를 통해 YouTube InnerTube API 호출하여 playerData 가져오기
   *
   * premium_proxy를 사용하여 안정적으로 데이터를 가져옵니다.
   * 일반 프록시는 YouTube의 bot detection으로 인해 작동하지 않습니다.
   */
  private async getPlayerData(videoId: string, apiKey: string): Promise<any> {
    // InnerTube API endpoint
    // ⚠️ 주의: 이 API 키는 YouTube 웹 클라이언트가 사용하는 공개 키입니다.
    // youtube-caption-extractor와 youtubei.js에서도 동일한 키를 사용합니다.
    // 공식적으로 지원되지 않으며, YouTube가 변경하거나 제한할 수 있습니다.
    // prettyPrint 파라미터는 ZenRows와 호환되지 않으므로 제거
    const innerTubeUrl = `https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`;

    const payload = {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20250222.10.00',
        },
      },
      videoId,
    };

    // premium_proxy 사용 (일반 프록시는 YouTube bot detection에 걸림)
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
    return data;
  }

  /**
   * ZenRows를 통해 URL fetch
   *
   * premium_proxy를 사용하여 안정적으로 데이터를 가져옵니다.
   */
  private async fetchViaZenRows(url: string, apiKey: string): Promise<string> {
    // premium_proxy 사용 (일반 프록시는 작동하지 않음)
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

  /**
   * Timedtext XML을 파싱하여 TranscriptSegment 배열로 변환
   *
   * youtube-caption-extractor의 extractSubtitlesFromXML 방식 사용
   */
  private parseTimedTextXml(xml: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    // youtube-caption-extractor와 동일한 방식
    // XML 전처리: transcript 태그 제거
    const cleanedXml = xml
      .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
      .replace('</transcript>', '');

    // </text>로 split하여 각 세그먼트 처리
    const lines = cleanedXml
      .split('</text>')
      .filter(line => line && line.trim());

    const startRegex = /start="([\d.]+)"/;
    const durRegex = /dur="([\d.]+)"/;

    for (const line of lines) {
      const startMatch = startRegex.exec(line);
      const durMatch = durRegex.exec(line);

      if (!startMatch?.[1] || !durMatch?.[1]) {
        continue;
      }

      // 텍스트 추출 (HTML 태그 제거)
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

  /**
   * HTML 엔티티 디코딩
   */
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  }
}
