import { describe, it, expect, beforeEach } from 'vitest';
import { Page } from '../page.entity';
import { PageId } from '../../value-objects/page-id.vo';
import { WorkspaceId } from '../../value-objects/workspace-id.vo';
import { WorkspaceManagementError } from '../../errors/workspace-management.error';

describe('Page Entity', () => {
  let pageId: PageId;
  let workspaceId: WorkspaceId;
  let createdBy: string;
  let now: Date;

  beforeEach(() => {
    pageId = new PageId('550e8400-e29b-41d4-a716-446655440000');
    workspaceId = new WorkspaceId('660e8400-e29b-41d4-a716-446655440000');
    createdBy = '770e8400-e29b-41d4-a716-446655440000';
    now = new Date();
  });

  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // Given
      const title = 'Welcome Page';
      const icon = '📄';
      const order = '0';
      const depth = 0;

      // When
      const page = new Page(
        pageId,
        workspaceId,
        null, // parentId (최상위)
        title,
        icon,
        order,
        depth,
        createdBy,
        now,
        now,
        null
      );

      // Then
      expect(page.pageId).toBe(pageId);
      expect(page.workspaceId).toBe(workspaceId);
      expect(page.parentId).toBeNull();
      expect(page.title).toBe(title);
      expect(page.icon).toBe(icon);
      expect(page.order).toBe(order);
      expect(page.depth).toBe(depth);
      expect(page.createdBy).toBe(createdBy);
      expect(page.createdAt).toBe(now);
      expect(page.updatedAt).toBe(now);
      expect(page.deletedAt).toBeNull();
    });

    it('parentId가 null이면 최상위 페이지여야 한다 (depth=0)', () => {
      // When
      const page = new Page(
        pageId,
        workspaceId,
        null, // parentId
        'Root Page',
        null,
        '0',
        0, // depth
        createdBy,
        now,
        now,
        null
      );

      // Then
      expect(page.parentId).toBeNull();
      expect(page.depth).toBe(0);
    });

    it('parentId가 있으면 하위 페이지여야 한다', () => {
      // Given
      const parentId = new PageId('880e8400-e29b-41d4-a716-446655440000');

      // When
      const page = new Page(
        pageId,
        workspaceId,
        parentId,
        'Child Page',
        null,
        '0',
        1, // depth > 0
        createdBy,
        now,
        now,
        null
      );

      // Then
      expect(page.parentId).toBe(parentId);
      expect(page.depth).toBe(1);
    });

    it('제목이 빈 문자열이면 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(
        () =>
          new Page(
            pageId,
            workspaceId,
            null,
            '', // 빈 제목
            null,
            '0',
            0,
            createdBy,
            now,
            now,
            null
          )
      ).toThrow(WorkspaceManagementError);
    });

    it('제목이 200자를 초과하면 예외를 발생시켜야 한다', () => {
      // Given
      const longTitle = 'a'.repeat(201);

      // When & Then
      expect(
        () =>
          new Page(
            pageId,
            workspaceId,
            null,
            longTitle,
            null,
            '0',
            0,
            createdBy,
            now,
            now,
            null
          )
      ).toThrow(WorkspaceManagementError);
    });

    it('depth가 음수이면 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(
        () =>
          new Page(
            pageId,
            workspaceId,
            null,
            'Title',
            null,
            '0',
            -1, // 음수 depth
            createdBy,
            now,
            now,
            null
          )
      ).toThrow(WorkspaceManagementError);
    });

    it('parentId가 null인데 depth > 0이면 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(
        () =>
          new Page(
            pageId,
            workspaceId,
            null, // parentId 없음
            'Title',
            null,
            '0',
            1, // depth > 0 (불일치!)
            createdBy,
            now,
            now,
            null
          )
      ).toThrow(WorkspaceManagementError);
    });
  });

  describe('calculateDepth', () => {
    it('parentId가 null이면 depth=0을 반환해야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Root Page',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );

      // When
      const depth = page.calculateDepth(null);

      // Then
      expect(depth).toBe(0);
    });

    it('부모 페이지의 depth를 기반으로 계산해야 한다 (parent.depth + 1)', () => {
      // Given
      const parentPageId = new PageId('880e8400-e29b-41d4-a716-446655440000');
      const parentPage = new Page(
        parentPageId,
        workspaceId,
        null,
        'Parent Page',
        null,
        '0',
        0, // parent depth
        createdBy,
        now,
        now,
        null
      );

      const childPage = new Page(
        pageId,
        workspaceId,
        parentPageId,
        'Child Page',
        null,
        '0',
        1,
        createdBy,
        now,
        now,
        null
      );

      // When
      const depth = childPage.calculateDepth(parentPage);

      // Then
      expect(depth).toBe(1); // parent depth (0) + 1
    });

    it('3단계 깊이를 올바르게 계산해야 한다', () => {
      // Given - 부모 페이지 (depth=2)
      const parentPage = new Page(
        new PageId('880e8400-e29b-41d4-a716-446655440000'),
        workspaceId,
        new PageId('990e8400-e29b-41d4-a716-446655440000'),
        'Level 2 Page',
        null,
        '0',
        2, // depth
        createdBy,
        now,
        now,
        null
      );

      const childPage = new Page(
        pageId,
        workspaceId,
        parentPage.pageId,
        'Level 3 Page',
        null,
        '0',
        3,
        createdBy,
        now,
        now,
        null
      );

      // When
      const depth = childPage.calculateDepth(parentPage);

      // Then
      expect(depth).toBe(3); // parent depth (2) + 1
    });

    it('parentId가 있는데 parent가 null이면 예외를 발생시켜야 한다', () => {
      // Given
      const parentId = new PageId('880e8400-e29b-41d4-a716-446655440000');
      const childPage = new Page(
        pageId,
        workspaceId,
        parentId,
        'Orphan Page',
        null,
        '0',
        1,
        createdBy,
        now,
        now,
        null
      );

      // When & Then
      expect(() => childPage.calculateDepth(null)).toThrow(
        WorkspaceManagementError
      );
      expect(() => childPage.calculateDepth(null)).toThrow('Parent page not found');
    });
  });

  describe('updateTitle', () => {
    it('제목을 업데이트해야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Old Title',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );

      // When
      page.updateTitle('New Title');

      // Then
      expect(page.title).toBe('New Title');
    });

    it('updated_at 타임스탬프가 갱신되어야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Title',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );
      const originalUpdatedAt = page.updatedAt;

      // When
      page.updateTitle('New Title');

      // Then
      expect(page.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
      expect(page.updatedAt).toBeInstanceOf(Date);
    });

    it('빈 제목으로 업데이트하면 예외를 발생시켜야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Title',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );

      // When & Then
      expect(() => page.updateTitle('')).toThrow(WorkspaceManagementError);
    });

    it('200자를 초과하는 제목은 거부해야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Title',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );
      const longTitle = 'a'.repeat(201);

      // When & Then
      expect(() => page.updateTitle(longTitle)).toThrow(
        WorkspaceManagementError
      );
    });
  });

  describe('updateIcon', () => {
    it('아이콘을 업데이트해야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Title',
        '📁',
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );

      // When
      page.updateIcon('🚀');

      // Then
      expect(page.icon).toBe('🚀');
    });

    it('updated_at 타임스탬프가 갱신되어야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Title',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );
      const originalUpdatedAt = page.updatedAt;

      // When
      page.updateIcon('✨');

      // Then
      expect(page.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
      expect(page.updatedAt).toBeInstanceOf(Date);
    });

    it('null 아이콘을 허용해야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Title',
        '📄',
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );

      // When
      page.updateIcon(null);

      // Then
      expect(page.icon).toBeNull();
    });
  });

  describe('moveToParent', () => {
    it('부모 페이지를 변경해야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Page',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );
      const newParentId = new PageId('880e8400-e29b-41d4-a716-446655440000');

      // When
      page.moveToParent(newParentId, 1);

      // Then
      expect(page.parentId).toBe(newParentId);
      expect(page.depth).toBe(1);
    });

    it('depth가 재계산되어야 한다', () => {
      // Given
      const parentId = new PageId('880e8400-e29b-41d4-a716-446655440000');
      const page = new Page(
        pageId,
        workspaceId,
        parentId,
        'Page',
        null,
        '0',
        1, // 현재 depth
        createdBy,
        now,
        now,
        null
      );

      // When - 최상위로 이동
      page.moveToParent(null, 0);

      // Then
      expect(page.parentId).toBeNull();
      expect(page.depth).toBe(0);
    });

    it('updated_at 타임스탬프가 갱신되어야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Page',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );
      const originalUpdatedAt = page.updatedAt;
      const newParentId = new PageId('880e8400-e29b-41d4-a716-446655440000');

      // When
      page.moveToParent(newParentId, 1);

      // Then
      expect(page.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
      expect(page.updatedAt).toBeInstanceOf(Date);
    });

    it('depth가 음수이면 예외를 발생시켜야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Page',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );
      const newParentId = new PageId('880e8400-e29b-41d4-a716-446655440000');

      // When & Then
      expect(() => page.moveToParent(newParentId, -1)).toThrow(
        WorkspaceManagementError
      );
    });
  });

  describe('softDelete', () => {
    it('페이지를 소프트 삭제해야 한다', () => {
      // Given
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Page',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );

      // When
      page.softDelete();

      // Then
      expect(page.deletedAt).not.toBeNull();
      expect(page.deletedAt).toBeInstanceOf(Date);
    });

    it('이미 삭제된 페이지도 다시 소프트 삭제할 수 있어야 한다', () => {
      // Given
      const deletedAt = new Date();
      const page = new Page(
        pageId,
        workspaceId,
        null,
        'Page',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        deletedAt // 이미 삭제됨
      );
      const originalDeletedAt = page.deletedAt;

      // When
      page.softDelete();

      // Then
      expect(page.deletedAt).not.toBe(originalDeletedAt);
      expect(page.deletedAt!.getTime()).toBeGreaterThanOrEqual(
        originalDeletedAt!.getTime()
      );
      expect(page.deletedAt).toBeInstanceOf(Date);
    });
  });
});

