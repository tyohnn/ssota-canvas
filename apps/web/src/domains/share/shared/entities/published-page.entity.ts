// apps/web/src/domains/share/shared/entities/published-page.entity.ts

import { PublishToken } from '../value-objects/publish-token.vo';
import { PageId, PublishedStatus, UserId } from '../types';
import { ShareManagementError } from '../errors/share-management.error';

/**
 * PublishedPage Entity
 *
 * 게시된 페이지의 핵심 정보와 비즈니스 로직을 캡슐화
 */
export class PublishedPage {
  private constructor(
    public readonly pageId: PageId,
    public readonly publisherId: UserId,
    public status: PublishedStatus,
    public publishToken: PublishToken,
    public publishedAt: Date
  ) { }

  /**
   * PublishedPage 생성 (초기 생성)
   *
   * @param pageId - 페이지 ID
   * @param publisherId - 게시자 ID
   * @returns PublishedPage 인스턴스 (unpublished 상태)
   */
  static create(
    pageId: PageId,
    publisherId: UserId
  ): PublishedPage {
    // 초기 생성 시에는 unpublished 상태로 생성
    // publish() 메서드를 통해 published 상태로 변경
    const token = PublishToken.generate();
    const publishedAt = new Date();

    return new PublishedPage(
      pageId,
      publisherId,
      'unpublished',
      token,
      publishedAt
    );
  }

  /**
   * 기존 데이터로 PublishedPage 재구성 (Repository에서 사용)
   *
   * @param pageId - 페이지 ID
   * @param publisherId - 게시자 ID
   * @param status - 게시 상태
   * @param publishToken - 게시 토큰
   * @param publishedAt - 게시 시각
   * @returns PublishedPage 인스턴스
   */
  static reconstitute(
    pageId: PageId,
    publisherId: UserId,
    status: PublishedStatus,
    publishToken: PublishToken,
    publishedAt: Date
  ): PublishedPage {
    return new PublishedPage(
      pageId,
      publisherId,
      status,
      publishToken,
      publishedAt
    );
  }

  /**
   * 페이지 게시
   *
   * @param publisherId - 게시자 ID (string)
   * 
   * 주의: 권한 검증은 Action 레이어에서 수행됨
   * (팀 멤버도 게시 가능)
   */
  publish(publisherId: UserId): void {
    if (this.status === 'published') {
      throw new ShareManagementError(
        'ALREADY_PUBLISHED',
        'Page is already published'
      );
    }

    this.status = 'published';
    this.publishToken = PublishToken.generate();
    this.publishedAt = new Date();
  }

  /**
   * 페이지 게시 취소
   *
   * @param publisherId - 게시자 ID (string)
   * 
   * 주의: 권한 검증은 Action 레이어에서 수행됨
   * (팀 멤버도 게시 취소 가능)
   */
  unpublish(publisherId: UserId): void {
    if (this.status !== 'published') {
      throw new ShareManagementError(
        'PAGE_NOT_PUBLISHED',
        'Page is not published'
      );
    }

    this.status = 'unpublished';
  }

  /**
   * 게시 상태 확인
   */
  isPublished(): boolean {
    return this.status === 'published';
  }

  /**
   * 게시 취소 상태 확인
   */
  isUnpublished(): boolean {
    return this.status === 'unpublished';
  }
}
