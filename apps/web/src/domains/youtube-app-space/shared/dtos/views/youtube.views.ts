/**
 * YouTube 관련 View 타입들 (조회용)
 *
 * View는 plain object로 정의 (클래스 불가, 직렬화 가능해야 함)
 */
import type { YoutubeScript } from '../../types/transcript.types';

/**
 * YoutubeView - SSOT (Single Source of Truth) for YouTube Data
 *
 * YouTube 영상 정보를 나타내는 View 타입
 * - Plain object (직렬화 가능)
 * - Value Objects는 string으로 변환
 * - Date는 ISO string으로 변환
 */
export interface YoutubeView {
  id: string; // VideoId Value Object → string (UUID)
  slug: string; // VideoSlug Value Object → string (YouTube Video ID, 11자리)
  title: string;
  description: string | undefined;
  channelId: string;
  publishedAt: string | undefined; // Date → ISO string
  durationSeconds: number | undefined;
  thumbnailUrl: string | undefined;
  thumbnailHighUrl: string | undefined;
  script: YoutubeScript | undefined;
  scriptLanguage: string | undefined;
  scriptExtractedAt: string | undefined; // Date → ISO string
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string; // Date → ISO string
  updatedAt: string; // Date → ISO string
}
