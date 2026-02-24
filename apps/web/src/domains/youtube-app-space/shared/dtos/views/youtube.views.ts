/**
 * YouTube 관련 View 타입들 (조회용)
 *
 * View는 plain object로 정의 (클래스 불가, 직렬화 가능해야 함)
 * 스크립트는 sources.raw_content 사용 (useSourceContent + parseTimelineRawContent)
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
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string; // Date → ISO string
  updatedAt: string; // Date → ISO string
}
