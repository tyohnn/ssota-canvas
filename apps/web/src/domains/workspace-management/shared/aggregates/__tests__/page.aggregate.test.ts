import { describe, it, expect, beforeEach } from 'vitest';
import { PageAggregate } from '../page.aggregate';
import { PageId } from '../../value-objects/page-id.vo';
import { WorkspaceId } from '../../value-objects/workspace-id.vo';
import { Page } from '../../entities/page.entity';
import { WorkspaceManagementError } from '../../errors/workspace-management.error';
import type { CreatePageCommand, MovePageCommand } from '../../commands';

describe('Page Aggregate', () => {
  let workspaceId: WorkspaceId;
  let createdBy: string;
  let now: Date;

  beforeEach(() => {
    workspaceId = new WorkspaceId('550e8400-e29b-41d4-a716-446655440000');
    createdBy = '660e8400-e29b-41d4-a716-446655440000';
    now = new Date();
  });

  describe('create (팩토리 메서드)', () => {
    it('유효한 데이터로 Page를 생성해야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Welcome Page',
        icon: '📄',
        createdBy,
      };

      // When
      const aggregate = PageAggregate.create(command, null);

      // Then
      expect(aggregate).toBeInstanceOf(PageAggregate);
      expect(aggregate.page.title).toBe('Welcome Page');
      expect(aggregate.page.icon).toBe('📄');
      expect(aggregate.page.workspaceId.equals(workspaceId)).toBe(true);
    });

    it('parentId가 null이면 최상위 페이지로 생성되어야 한다 (depth=0)', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Root Page',
        createdBy,
      };

      // When
      const aggregate = PageAggregate.create(command, null); // parent=null

      // Then
      expect(aggregate.page.parentId).toBeNull();
      expect(aggregate.page.depth).toBe(0);
    });

    it('parentId가 있으면 하위 페이지로 생성되어야 한다', () => {
      // Given
      const parentId = new PageId('770e8400-e29b-41d4-a716-446655440000');
      const parentPage = new Page(
        parentId,
        workspaceId,
        null,
        'Parent Page',
        null,
        0,
        0,
        createdBy,
        now,
        now,
        null
      );

      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        parentId: parentId.value,
        title: 'Child Page',
        createdBy,
      };

      // When
      const aggregate = PageAggregate.create(command, parentPage);

      // Then
      expect(aggregate.page.parentId?.equals(parentId)).toBe(true);
      expect(aggregate.page.depth).toBe(1); // parent depth (0) + 1
    });

    it('depth가 자동 계산되어야 한다 (부모 depth + 1)', () => {
      // Given
      const grandParentId = new PageId('880e8400-e29b-41d4-a716-446655440000');
      const parentId = new PageId('770e8400-e29b-41d4-a716-446655440000');
      const parentPage = new Page(
        parentId,
        workspaceId,
        grandParentId, // parent는 grandParent의 자식
        'Parent',
        null,
        0,
        2, // depth=2
        createdBy,
        now,
        now,
        null
      );

      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        parentId: parentId.value,
        title: 'Child',
        createdBy,
      };

      // When
      const aggregate = PageAggregate.create(command, parentPage);

      // Then
      expect(aggregate.page.depth).toBe(3); // 2 + 1
    });

    it('부모 페이지가 존재하지 않으면 예외를 발생시켜야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        parentId: '770e8400-e29b-41d4-a716-446655440000', // parentId 있음
        title: 'Orphan Page',
        createdBy,
      };

      // When & Then
      expect(() => PageAggregate.create(command, null)).toThrow(
        WorkspaceManagementError
      );
      expect(() => PageAggregate.create(command, null)).toThrow(
        'Parent page not found'
      );
    });

    it('PageCreated 이벤트가 발행되어야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'New Page',
        createdBy,
      };

      // When
      const aggregate = PageAggregate.create(command, null);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('PageCreated');
      const event = events[0] as any;
      expect(event.title).toBe('New Page');
      expect(event.depth).toBe(0);
    });
  });

  describe('verifyAccess', () => {
    it('Workspace 멤버면 접근 허용해야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      const userId = createdBy;

      // When
      const hasAccess = aggregate.verifyAccess(userId, true); // isWorkspaceMember=true

      // Then
      expect(hasAccess).toBe(true);
    });

    it('Workspace 멤버 아니면 접근 거부해야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      const userId = '880e8400-e29b-41d4-a716-446655440000';

      // When
      const hasAccess = aggregate.verifyAccess(userId, false); // isWorkspaceMember=false

      // Then
      expect(hasAccess).toBe(false);
    });

    it('PageAccessVerified 이벤트가 발행되어야 한다 (접근 허용)', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      aggregate.getUncommittedEvents(); // 이전 이벤트 클리어
      const userId = createdBy;

      // When
      aggregate.verifyAccess(userId, true);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('PageAccessVerified');
      const event = events[0] as any;
      expect(event.userId).toBe(userId);
    });

    it('PageAccessDenied 이벤트가 발행되어야 한다 (접근 거부)', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      aggregate.getUncommittedEvents(); // 이전 이벤트 클리어
      const userId = '880e8400-e29b-41d4-a716-446655440000';

      // When
      aggregate.verifyAccess(userId, false);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('PageAccessDenied');
      const event = events[0] as any;
      expect(event.userId).toBe(userId);
      expect(event.reason).toBe('NOT_WORKSPACE_MEMBER');
    });
  });

  describe('getUncommittedEvents', () => {
    it('발행된 이벤트 목록을 반환해야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);

      // When
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('PageCreated');
    });

    it('이벤트를 반환 후 이벤트 목록이 클리어되어야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);

      // When
      const events1 = aggregate.getUncommittedEvents();
      const events2 = aggregate.getUncommittedEvents();

      // Then
      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(0); // 클리어됨
    });
  });
});

