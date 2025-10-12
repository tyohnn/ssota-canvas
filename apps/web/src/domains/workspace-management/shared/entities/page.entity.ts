import { PageId } from '../value-objects/page-id.vo';
import { WorkspaceId } from '../value-objects/workspace-id.vo';
import {
  WorkspaceManagementError,
  createWorkspaceManagementError,
} from '../errors/workspace-management.error';

/**
 * Page Entity
 * 
 * Page 도메인 엔티티로 Page의 핵심 정보와 계층 구조 로직을 캡슐화
 * 
 * 비즈니스 규칙:
 * - 제목은 최대 200자
 * - depth는 0 이상 (0=최상위)
 * - parentId가 null이면 depth=0
 * - parentId가 있으면 depth > 0
 * - order는 0 이상
 */
export class Page {
  constructor(
    public readonly pageId: PageId,
    public readonly workspaceId: WorkspaceId,
    private _parentId: PageId | null,
    private _title: string,
    private _icon: string | null,
    public order: number,
    private _depth: number,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null
  ) {
    // 생성자 검증
    this.validateTitle(_title);
    this.validateDepth(_depth);
    this.validateDepthConsistency(_parentId, _depth);
  }

  // Getters
  get parentId(): PageId | null {
    return this._parentId;
  }

  get title(): string {
    return this._title;
  }

  get icon(): string | null {
    return this._icon;
  }

  get depth(): number {
    return this._depth;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  /**
   * depth 계산
   * 
   * @param parent - 부모 페이지 (null이면 최상위)
   * @returns 계산된 depth (부모 depth + 1, 최상위는 0)
   */
  calculateDepth(parent: Page | null): number {
    // parentId가 null이면 최상위 (depth=0)
    if (this._parentId === null) {
      return 0;
    }

    // parentId가 있는데 parent가 null이면 에러
    if (!parent) {
      throw new WorkspaceManagementError(
        'PAGE_NOT_FOUND',
        'Parent page not found'
      );
    }

    // 부모 depth + 1
    return parent.depth + 1;
  }

  /**
   * 제목 업데이트
   * 
   * @param title - 새 제목 (최대 200자)
   */
  updateTitle(title: string): void {
    this.validateTitle(title);

    this._title = title;
    this._updatedAt = new Date();
  }

  /**
   * 아이콘 업데이트
   * 
   * @param icon - 새 아이콘 (이모지 또는 null)
   */
  updateIcon(icon: string | null): void {
    this._icon = icon;
    this._updatedAt = new Date();
  }

  /**
   * 부모 페이지 변경 및 depth 재계산
   * 
   * @param newParentId - 새 부모 페이지 ID (null이면 최상위로 이동)
   * @param newDepth - 새 depth (부모로부터 계산됨)
   */
  moveToParent(newParentId: PageId | null, newDepth: number): void {
    this.validateDepth(newDepth);
    this.validateDepthConsistency(newParentId, newDepth);

    this._parentId = newParentId;
    this._depth = newDepth;
    this._updatedAt = new Date();
  }

  /**
   * 소프트 삭제
   */
  softDelete(): void {
    this._deletedAt = new Date();
  }

  // Private validation methods
  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw createWorkspaceManagementError('INVALID_PAGE_TITLE');
    }

    if (title.trim().length > 200) {
      throw new WorkspaceManagementError(
        'INVALID_PAGE_TITLE',
        'Page title cannot exceed 200 characters'
      );
    }
  }

  private validateDepth(depth: number): void {
    if (depth < 0) {
      throw new WorkspaceManagementError(
        'INVALID_PAGE_DEPTH',
        'Page depth cannot be negative'
      );
    }
  }

  private validateDepthConsistency(
    parentId: PageId | null,
    depth: number
  ): void {
    // parentId가 null이면 depth=0이어야 함
    if (parentId === null && depth !== 0) {
      throw new WorkspaceManagementError(
        'INVALID_PAGE_DEPTH',
        'Root page must have depth=0'
      );
    }

    // parentId가 있으면 depth > 0이어야 함
    if (parentId !== null && depth === 0) {
      throw new WorkspaceManagementError(
        'INVALID_PAGE_DEPTH',
        'Child page must have depth > 0'
      );
    }
  }
}

