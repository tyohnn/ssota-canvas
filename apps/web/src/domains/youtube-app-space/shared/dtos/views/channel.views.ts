/**
 * Channel 관련 View 타입들 (조회용)
 *
 * View는 plain object로 정의 (클래스 불가, 직렬화 가능해야 함)
 */

/**
 * ChannelView - SSOT (Single Source of Truth) for Channel Data
 *
 * YouTube 채널 정보를 나타내는 View 타입
 * - Plain object (직렬화 가능)
 * - Value Objects는 string으로 변환
 * - Date는 ISO string으로 변환
 */
export interface ChannelView {
  id: string;
  channelId: string; // YoutubeChannelId Value Object → string
  channelName: string;
  channelDescription: string | undefined;
  channelThumbnailUrl: string | undefined;
  subscriberCount: number | undefined;
  videoCount: number | undefined;
  createdAt: string; // Date → ISO string
  updatedAt: string; // Date → ISO string
}
