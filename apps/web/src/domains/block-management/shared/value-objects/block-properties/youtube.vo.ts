/**
 * YouTube Block Properties Value Object
 *
 * YouTube 영상 임베드 블록의 속성을 관리하는 Value Object
 * - 사용자가 입력한 URL과 자동으로 fetch된 YouTube 메타데이터 포함
 * - Link Block과 유사한 구조로 메타데이터 관리
 */
import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * YouTube Block Properties Interface
 *
 * 사용자가 입력한 URL과 자동으로 fetch된 YouTube 메타데이터
 */
export interface YoutubeBlockProperties {
  // 기본 정보 (사용자 입력)
  url: string; // 사용자가 입력하는 URL

  // YouTube App Space 참조
  youtubeId?: string; // YouTube App Space의 YouTube ID (UUID)

  // 소스 콘텐츠 접근 권한 (source-management, org 기반)
  sourceContentAccessGranted?: boolean; // 이 블록에서 스크립트/원문 접근 가능 여부

  // 소스 요약 접근 권한 (source-management, 언어별)
  sourceSummaryAccessLanguages?: string[]; // 이 블록에서 요약 접근 가능한 언어 목록 (ISO 639-1 코드 배열, 예: ['ko', 'en'])

  // YouTube 메타데이터 (자동 fetch, 수정 가능)
  youtubeTitle?: string; // 영상 제목 (fetch 후 수정 가능)
  youtubeDescription?: string; // 영상 설명 (fetch 후 수정 가능)
  youtubeThumbnail?: string; // 썸네일 URL (fetch 후 수정 가능)
  channelThumbnail?: string; // 채널 프로필 이미지 URL

  // YouTube 통계 정보 (readonly, 표시용)
  channelName?: string; // 채널 이름
  youtubeChannelId?: string; // YouTube Channel ID (예: UCehBVAPy-bxmnbNARF-_tvA)
  viewCount?: number; // 조회수 (숫자)
  commentCount?: number; // 댓글 수 (숫자)
  likeCount?: number; // 좋아요 수 (숫자)
  subscriberCount?: number; // 구독자 수 (숫자)
  publishedAt?: string; // 게시일 ISO string
}

/**
 * YouTube Block Properties Value Object
 *
 * YouTube 블록의 속성을 캡슐화하고 유효성을 검증
 */
export class YoutubeBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
    public readonly youtubeId?: string,
    public readonly sourceContentAccessGranted?: boolean,
    public readonly sourceSummaryAccessLanguages?: string[],
    public readonly youtubeTitle?: string,
    public readonly youtubeDescription?: string,
    public readonly youtubeThumbnail?: string,
    public readonly channelThumbnail?: string,
    public readonly channelName?: string,
    public readonly youtubeChannelId?: string,
    public readonly viewCount?: number,
    public readonly commentCount?: number,
    public readonly likeCount?: number,
    public readonly subscriberCount?: number,
    public readonly publishedAt?: string
  ) {
    super();
    this.validate();
  }

  /**
   * 기본값 생성
   * @returns 기본 속성을 가진 YoutubeBlockPropertiesVO 인스턴스
   */
  static createDefault(): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO('');
  }

  /**
   * JSON 데이터에서 VO 생성 (타입 안전성 보장)
   * @param data - JSON 데이터
   * @returns YoutubeBlockPropertiesVO 인스턴스
   */
  static fromJSON(data: YoutubeBlockProperties): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO(
      data.url || '',
      data.youtubeId,
      data.sourceContentAccessGranted,
      data.sourceSummaryAccessLanguages,
      data.youtubeTitle,
      data.youtubeDescription,
      data.youtubeThumbnail,
      data.channelThumbnail,
      data.channelName,
      data.youtubeChannelId,
      data.viewCount,
      data.commentCount,
      data.likeCount,
      data.subscriberCount,
      data.publishedAt
    );
  }

  /**
   * 속성 유효성 검증
   * @throws Error - 유효하지 않은 속성이 있을 경우
   */
  protected validate(): boolean {
    // URL은 빈 문자열 허용 (생성 직후 상태)
    if (this.url && !this.isValidYouTubeUrl(this.url)) {
      throw new BlockManagementError(
        'INVALID_MEDIA_URL',
        'Invalid YouTube URL format'
      );
    }
    return true;
  }

  /**
   * YouTube URL 형식 검증
   * @param url - 검증할 URL
   * @returns URL이 유효한 YouTube URL인지 여부
   */
  private isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  }

  /**
   * YouTube 비디오 ID 추출
   * @returns 비디오 ID (11자리) 또는 undefined
   */
  getVideoId(): string | undefined {
    const match = this.url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : undefined;
  }

  /**
   * 임베드 URL 생성
   * @returns YouTube iframe embed URL
   */
  getEmbedUrl(): string {
    const videoId = this.getVideoId();
    return videoId ? `https://www.youtube.com/embed/${videoId}` : this.url;
  }

  /**
   * 썸네일 URL 생성 (또는 fetch된 썸네일 반환)
   * @returns 썸네일 URL
   */
  getThumbnailUrl(): string | null {
    // fetch된 썸네일이 있으면 우선 사용
    if (this.youtubeThumbnail) {
      return this.youtubeThumbnail;
    }
    // 없으면 비디오 ID로부터 생성
    const videoId = this.getVideoId();
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : null;
  }

  /**
   * JSON으로 직렬화
   * @returns YoutubeBlockProperties 객체
   */
  toJSON(): YoutubeBlockProperties {
    return {
      url: this.url,
      youtubeId: this.youtubeId,
      sourceContentAccessGranted: this.sourceContentAccessGranted,
      sourceSummaryAccessLanguages: this.sourceSummaryAccessLanguages,
      youtubeTitle: this.youtubeTitle,
      youtubeDescription: this.youtubeDescription,
      youtubeThumbnail: this.youtubeThumbnail,
      channelThumbnail: this.channelThumbnail,
      channelName: this.channelName,
      youtubeChannelId: this.youtubeChannelId,
      viewCount: this.viewCount,
      commentCount: this.commentCount,
      likeCount: this.likeCount,
      subscriberCount: this.subscriberCount,
      publishedAt: this.publishedAt,
    };
  }

  /**
   * 다른 VO와 비교
   * @param other - 비교할 VO
   * @returns 동일한지 여부
   */
  equals(other: YoutubeBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.youtubeId === other.youtubeId &&
      this.sourceContentAccessGranted === other.sourceContentAccessGranted &&
      this.arraysEqual(
        this.sourceSummaryAccessLanguages,
        other.sourceSummaryAccessLanguages
      ) &&
      this.youtubeTitle === other.youtubeTitle &&
      this.youtubeDescription === other.youtubeDescription &&
      this.youtubeThumbnail === other.youtubeThumbnail &&
      this.channelThumbnail === other.channelThumbnail &&
      this.channelName === other.channelName &&
      this.youtubeChannelId === other.youtubeChannelId &&
      this.viewCount === other.viewCount &&
      this.commentCount === other.commentCount &&
      this.likeCount === other.likeCount &&
      this.subscriberCount === other.subscriberCount &&
      this.publishedAt === other.publishedAt
    );
  }

  /**
   * URL 업데이트 (불변성 유지)
   * @param url - 새로운 URL
   * @returns 새로운 YoutubeBlockPropertiesVO 인스턴스
   */
  updateUrl(url: string): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO(
      url,
      this.youtubeId,
      this.sourceContentAccessGranted,
      this.sourceSummaryAccessLanguages,
      this.youtubeTitle,
      this.youtubeDescription,
      this.youtubeThumbnail,
      this.channelThumbnail,
      this.channelName,
      this.youtubeChannelId,
      this.viewCount,
      this.commentCount,
      this.likeCount,
      this.subscriberCount,
      this.publishedAt
    );
  }

  /**
   * 메타데이터 업데이트 (불변성 유지)
   * @param metadata - 메타데이터 객체
   * @returns 새로운 YoutubeBlockPropertiesVO 인스턴스
   */
  updateMetadata(metadata: {
    youtubeTitle?: string;
    youtubeDescription?: string;
    youtubeThumbnail?: string;
    channelThumbnail?: string;
    viewCount?: string;
    channelName?: string;
    youtubeChannelId?: string;
    subscriberCount?: string;
    commentCount?: string;
    likeCount?: string;
    publishedAt?: string;
  }): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO(
      this.url,
      this.youtubeId,
      this.sourceContentAccessGranted,
      this.sourceSummaryAccessLanguages,
      metadata.youtubeTitle ?? this.youtubeTitle,
      metadata.youtubeDescription ?? this.youtubeDescription,
      metadata.youtubeThumbnail ?? this.youtubeThumbnail,
      metadata.channelThumbnail ?? this.channelThumbnail,
      metadata.channelName ?? this.channelName,
      metadata.youtubeChannelId ?? this.youtubeChannelId,
      metadata.viewCount ? Number(metadata.viewCount) : this.viewCount,
      metadata.commentCount ? Number(metadata.commentCount) : this.commentCount,
      metadata.likeCount ? Number(metadata.likeCount) : this.likeCount,
      metadata.subscriberCount
        ? Number(metadata.subscriberCount)
        : this.subscriberCount,
      metadata.publishedAt ?? this.publishedAt
    );
  }

  /**
   * YouTube ID 업데이트 (불변성 유지)
   * @param youtubeId - YouTube App Space의 YouTube ID
   * @returns 새로운 YoutubeBlockPropertiesVO 인스턴스
   */
  updateYoutubeId(youtubeId: string): YoutubeBlockPropertiesVO {
    return new YoutubeBlockPropertiesVO(
      this.url,
      youtubeId,
      this.sourceContentAccessGranted,
      this.sourceSummaryAccessLanguages,
      this.youtubeTitle,
      this.youtubeDescription,
      this.youtubeThumbnail,
      this.channelThumbnail,
      this.channelName,
      this.youtubeChannelId,
      this.viewCount,
      this.commentCount,
      this.likeCount,
      this.subscriberCount,
      this.publishedAt
    );
  }

  /**
   * 배열 비교 헬퍼 메서드
   */
  private arraysEqual(a?: string[], b?: string[]): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }

  /**
   * 특정 언어의 요약 접근 권한 확인
   * @param language - 언어 코드 (ISO 639-1)
   * @returns 해당 언어에 대한 접근 권한이 있는지 여부
   */
  hasSummaryAccessForLanguage(language: string): boolean {
    return (
      this.sourceSummaryAccessLanguages?.includes(language) ?? false
    );
  }

  /**
   * URL이 비어있는지 확인
   * @returns URL이 비어있는지 여부
   */
  isEmpty(): boolean {
    return this.url.trim().length === 0;
  }

  /**
   * 제목이 있는지 확인
   * @returns 제목이 있는지 여부
   */
  hasTitle(): boolean {
    return !!this.youtubeTitle && this.youtubeTitle.trim().length > 0;
  }

  /**
   * 설명이 있는지 확인
   * @returns 설명이 있는지 여부
   */
  hasDescription(): boolean {
    return (
      !!this.youtubeDescription && this.youtubeDescription.trim().length > 0
    );
  }

  /**
   * 문자열 표현
   * @returns YouTube 블록의 문자열 표현
   */
  toString(): string {
    return this.youtubeTitle || 'Untitled YouTube Video';
  }
}
