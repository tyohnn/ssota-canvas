import {
  WorkspaceManagementError,
  createWorkspaceManagementError,
} from '../errors/workspace-management.error';

/**
 * PageId Value Object
 *
 * Page 고유 식별자를 나타내는 Value Object
 * - UUID v4 형식 검증
 * - 불변성 보장
 * - 값 기반 동등성 비교
 */
export class PageId {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private readonly _value: string;

  constructor(id: string) {
    // 1. null/undefined 체크
    if (id === null || id === undefined) {
      throw createWorkspaceManagementError('INVALID_PAGE_ID');
    }

    // 2. 빈 문자열 체크
    if (!id || id.trim().length === 0) {
      throw new WorkspaceManagementError(
        'INVALID_PAGE_ID',
        'Invalid page ID format'
      );
    }

    // 3. UUID v4 형식 검증
    if (!PageId.UUID_REGEX.test(id)) {
      throw new WorkspaceManagementError(
        'INVALID_PAGE_ID',
        'Invalid page ID format'
      );
    }

    // 4. 값 할당
    this._value = id;
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }

  equals(other: PageId): boolean {
    return this._value === other._value;
  }
}
