import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * GitHub PR Block Properties Interface
 */
export interface GithubPrBlockProperties {
  url: string;
  title: string;
  status: 'open' | 'closed' | 'merged';
}

/**
 * GitHub PR Block Properties Value Object
 *
 * GitHub PR 블록의 속성을 관리하는 Value Object
 */
export class GithubPrBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
    public readonly title: string,
    public readonly status: 'open' | 'closed' | 'merged'
  ) {
    super();
    this.validate();
  }

  protected validate(): boolean {
    if (typeof this.url !== 'string' || this.url.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'URL must be a non-empty string'
      );
    }

    if (typeof this.title !== 'string' || this.title.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Title must be a non-empty string'
      );
    }

    if (!['open', 'closed', 'merged'].includes(this.status)) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Status must be one of: open, closed, merged'
      );
    }

    // GitHub PR URL 형식 검증
    if (!this.isValidGithubPrUrl(this.url)) {
      throw new BlockManagementError(
        'INVALID_MEDIA_URL',
        'Invalid GitHub PR URL format'
      );
    }
    return true;
  }

  /**
   * GitHub PR URL 형식 검증
   */
  private isValidGithubPrUrl(url: string): boolean {
    const githubPrRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+$/;
    return githubPrRegex.test(url);
  }

  /**
   * GitHub PR 번호 추출
   */
  getPrNumber(): number | null {
    const match = this.url.match(/\/pull\/(\d+)$/);
    return match ? parseInt(match[1] ?? '', 10) : null;
  }

  /**
   * 저장소 정보 추출
   */
  getRepository(): { owner: string; name: string } | null {
    const match = this.url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull/);
    return match ? { owner: match[1] ?? '', name: match[2] ?? '' } : null;
  }

  /**
   * PR이 열려있는지 확인
   */
  isOpen(): boolean {
    return this.status === 'open';
  }

  /**
   * PR이 닫혀있는지 확인
   */
  isClosed(): boolean {
    return this.status === 'closed';
  }

  /**
   * PR이 병합되었는지 확인
   */
  isMerged(): boolean {
    return this.status === 'merged';
  }

  /**
   * PR이 완료되었는지 확인 (닫힘 또는 병합)
   */
  isCompleted(): boolean {
    return this.status === 'closed' || this.status === 'merged';
  }

  /**
   * 상태별 색상 반환
   */
  getStatusColor(): string {
    switch (this.status) {
      case 'open':
        return '#28a745'; // 녹색
      case 'closed':
        return '#d73a49'; // 빨간색
      case 'merged':
        return '#6f42c1'; // 보라색
      default:
        return '#6c757d'; // 회색
    }
  }

  /**
   * URL 업데이트
   */
  updateUrl(url: string): GithubPrBlockPropertiesVO {
    return new GithubPrBlockPropertiesVO(url, this.title, this.status);
  }

  /**
   * 제목 업데이트
   */
  updateTitle(title: string): GithubPrBlockPropertiesVO {
    return new GithubPrBlockPropertiesVO(this.url, title, this.status);
  }

  /**
   * 상태 업데이트
   */
  updateStatus(
    status: 'open' | 'closed' | 'merged'
  ): GithubPrBlockPropertiesVO {
    return new GithubPrBlockPropertiesVO(this.url, this.title, status);
  }

  /**
   * 제목이 비어있는지 확인
   */
  hasTitle(): boolean {
    return this.title.trim().length > 0;
  }

  /**
   * PR이 유효한지 확인
   */
  isValid(): boolean {
    return this.url.trim().length > 0 && this.title.trim().length > 0;
  }

  equals(other: GithubPrBlockPropertiesVO): boolean {
    return (
      this.url === other.url &&
      this.title === other.title &&
      this.status === other.status
    );
  }

  toString(): string {
    return this.title || 'Untitled GitHub PR';
  }

  toJSON(): GithubPrBlockProperties {
    return {
      url: this.url,
      title: this.title,
      status: this.status,
    };
  }

  /**
   * JSON 데이터로부터 GithubPrBlockPropertiesVO 생성
   */
  static fromJSON(data: GithubPrBlockProperties): GithubPrBlockPropertiesVO {
    return new GithubPrBlockPropertiesVO(data.url, data.title, data.status);
  }

  /**
   * 기본 GitHub PR 속성 생성
   */
  static createDefault(): GithubPrBlockPropertiesVO {
    return new GithubPrBlockPropertiesVO('', '', 'open');
  }
}
