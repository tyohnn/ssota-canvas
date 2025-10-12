import { Page } from '../entities/page.entity';
import { PageId } from '../value-objects/page-id.vo';
import { WorkspaceId } from '../value-objects/workspace-id.vo';
import {
  PageCreatedEvent,
  PageAccessVerifiedEvent,
  PageAccessDeniedEvent,
  WorkspaceManagementDomainEvent,
} from '../events';
import { WorkspaceManagementError } from '../errors/workspace-management.error';
import type { CreatePageCommand } from '../commands';

/**
 * Page Aggregate
 *
 * Page 관련 도메인 로직과 계층 구조를 담당하는 Aggregate Root
 *
 * 주요 책임:
 * - Page 생성 (depth 자동 계산)
 * - Page 접근 권한 검증
 * - 도메인 이벤트 발행 및 관리
 */
export class PageAggregate {
  private _page: Page;
  private _events: WorkspaceManagementDomainEvent[] = [];

  constructor(page: Page) {
    this._page = page;
  }

  /**
   * Page 생성 (팩토리 메서드)
   *
   * @param command - Page 생성 Command
   * @param parentPage - 부모 페이지 (null이면 최상위)
   * @returns PageAggregate 인스턴스
   */
  static create(
    command: CreatePageCommand,
    parentPage: Page | null
  ): PageAggregate {
    // 1. PageId 생성
    const pageId = new PageId(crypto.randomUUID());
    const workspaceId = new WorkspaceId(command.workspaceId);
    const parentId = command.parentId ? new PageId(command.parentId) : null;

    // 2. parentId가 있는데 parentPage가 null이면 에러
    if (parentId && !parentPage) {
      throw new WorkspaceManagementError(
        'PAGE_NOT_FOUND',
        'Parent page not found'
      );
    }

    // 3. depth 계산
    const depth = parentId === null ? 0 : (parentPage?.depth ?? 0) + 1;

    // 4. order 계산 (현재는 0, Repository에서 실제 계산 필요)
    const order = 0;

    // 5. Page Entity 생성
    const page = new Page(
      pageId,
      workspaceId,
      parentId,
      command.title,
      command.icon || null,
      order,
      depth,
      command.createdBy,
      new Date(),
      new Date(),
      null
    );

    // 6. Aggregate 생성
    const aggregate = new PageAggregate(page);

    // 7. PageCreated 이벤트 발행
    aggregate.addEvent({
      type: 'PageCreated',
      pageId: pageId.value,
      workspaceId: workspaceId.value,
      parentId: parentId?.value,
      title: command.title,
      depth,
      order,
      occurredAt: new Date(),
    });

    return aggregate;
  }

  /**
   * Page 접근 권한 검증
   *
   * @param userId - 사용자 ID
   * @param isWorkspaceMember - Workspace 멤버 여부
   * @returns 접근 권한 여부
   */
  verifyAccess(userId: string, isWorkspaceMember: boolean): boolean {
    // Workspace 멤버면 접근 허용
    const hasAccess = isWorkspaceMember;

    // 이벤트 발행
    if (hasAccess) {
      this.addEvent({
        type: 'PageAccessVerified',
        pageId: this._page.pageId.value,
        userId,
        occurredAt: new Date(),
      });
    } else {
      this.addEvent({
        type: 'PageAccessDenied',
        pageId: this._page.pageId.value,
        userId,
        reason: 'NOT_WORKSPACE_MEMBER',
        occurredAt: new Date(),
      });
    }

    return hasAccess;
  }

  /**
   * 미커밋 이벤트 목록 반환 및 클리어
   *
   * @returns 도메인 이벤트 배열
   */
  getUncommittedEvents(): WorkspaceManagementDomainEvent[] {
    const events = [...this._events];
    this._events = []; // 이벤트 클리어
    return events;
  }

  /**
   * 이벤트 추가 (private)
   */
  private addEvent(event: WorkspaceManagementDomainEvent): void {
    this._events.push(event);
  }

  // Getters
  get page(): Page {
    return this._page;
  }
}
