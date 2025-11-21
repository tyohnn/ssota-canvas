import { Page } from '../entities/page.entity';
import { PageId } from '../value-objects/page-id.vo';
import { WorkspaceId } from '../value-objects/workspace-id.vo';
import {
  PageCreatedEvent,
  PageAccessVerifiedEvent,
  PageAccessDeniedEvent,
  PageMovedEvent,
  PageUpdatedEvent,
  WorkspaceManagementDomainEvent,
} from '../events';
import { WorkspaceManagementError } from '../errors/workspace-management.error';
import type {
  CreatePageCommand,
  MovePageCommand,
  UpdatePageCommand,
} from '../commands';

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
   * Page 이동
   *
   * @param command - Page 이동 Command
   * @param newParentPage - 새 부모 페이지 (null이면 최상위)
   * @param ancestors - 새 부모의 조상 페이지들 (순환 참조 체크용)
   */
  move(
    command: MovePageCommand,
    newParentPage: Page | null,
    ancestors: Page[]
  ): void {
    const oldParentId = this._page.parentId?.value;
    const oldDepth = this._page.depth;

    // 1. 순환 참조 체크: 자기 자신으로 이동
    if (command.newParentId === command.pageId) {
      throw new WorkspaceManagementError(
        'CIRCULAR_REFERENCE_DETECTED',
        'Circular reference detected'
      );
    }

    // 2. 순환 참조 체크: ancestors에 이동할 페이지가 있는지 확인
    const isCircular = ancestors.some(
      ancestor => ancestor.pageId.value === command.pageId
    );
    if (isCircular) {
      throw new WorkspaceManagementError(
        'CIRCULAR_REFERENCE_DETECTED',
        'Circular reference detected'
      );
    }

    // 3. 새 부모 ID 및 depth 계산
    const newParentId = command.newParentId
      ? new PageId(command.newParentId)
      : null;
    const newDepth = newParentId === null ? 0 : (newParentPage?.depth ?? 0) + 1;

    // 4. Page Entity의 moveToParent 호출
    this._page.moveToParent(newParentId, newDepth);

    // 5. PageMoved 이벤트 발행
    this.addEvent({
      type: 'PageMoved',
      pageId: this._page.pageId.value,
      oldParentId,
      newParentId: newParentId?.value,
      oldDepth,
      newDepth,
      occurredAt: new Date(),
    });
  }

  /**
   * Page 정보 수정
   *
   * @param command - Page 정보 수정 Command
   */
  updateInfo(command: UpdatePageCommand): void {
    const changes: { title?: string; icon?: string } = {};

    // 1. 제목 업데이트
    if (command.title !== undefined) {
      this._page.updateTitle(command.title);
      changes.title = command.title;
    }

    // 2. 아이콘 업데이트
    if (command.icon !== undefined) {
      this._page.updateIcon(command.icon);
      changes.icon = command.icon;
    }

    // 3. PageUpdated 이벤트 발행
    if (Object.keys(changes).length > 0) {
      this.addEvent({
        type: 'PageUpdated',
        pageId: this._page.pageId.value,
        changes,
        occurredAt: new Date(),
      });
    }
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
