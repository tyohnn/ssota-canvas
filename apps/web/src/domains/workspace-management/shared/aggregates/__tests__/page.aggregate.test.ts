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
        '0',
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
        '0',
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
      aggregate.markEventsAsCommitted(); // 이전 이벤트 클리어
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
      aggregate.markEventsAsCommitted(); // 이전 이벤트 클리어
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

  describe('move (Page 이동) - Scenario 4', () => {
    it('parent_id를 변경해야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page to Move',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      aggregate.markEventsAsCommitted(); // 이전 이벤트 클리어

      const newParentId = new PageId('770e8400-e29b-41d4-a716-446655440000');
      const newParentPage = new Page(
        newParentId,
        workspaceId,
        null,
        'New Parent',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );

      const moveCommand: MovePageCommand = {
        pageId: aggregate.page.pageId.value,
        newParentId: newParentId.value,
      };

      // When
      aggregate.move(moveCommand, newParentPage, []);

      // Then
      expect(aggregate.page.parentId?.equals(newParentId)).toBe(true);
    });

    it('depth를 재계산해야 한다 (새 부모 depth + 1)', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);

      // grandParent (depth=0) > parent (depth=1) > child (depth=2) 구조 생성
      const grandParentId = new PageId('880e8400-e29b-41d4-a716-446655440000');
      const parentId = new PageId('770e8400-e29b-41d4-a716-446655440000');

      const parentPage = new Page(
        parentId,
        workspaceId,
        grandParentId, // grandParent의 자식
        'Parent',
        null,
        '0',
        1, // depth=1
        createdBy,
        now,
        now,
        null
      );

      const moveCommand: MovePageCommand = {
        pageId: aggregate.page.pageId.value,
        newParentId: parentId.value,
      };

      // When
      aggregate.move(moveCommand, parentPage, []);

      // Then
      expect(aggregate.page.depth).toBe(2); // 1 + 1
    });

    it('최상위로 이동 시 parent_id=null, depth=0이어야 한다', () => {
      // Given
      const parentId = new PageId('770e8400-e29b-41d4-a716-446655440000');
      const parentPage = new Page(
        parentId,
        workspaceId,
        null,
        'Parent',
        null,
        '0',
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
      const aggregate = PageAggregate.create(command, parentPage);
      expect(aggregate.page.depth).toBe(1); // 초기 depth

      const moveCommand: MovePageCommand = {
        pageId: aggregate.page.pageId.value,
        newParentId: undefined, // 최상위로 이동
      };

      // When
      aggregate.move(moveCommand, null, []);

      // Then
      expect(aggregate.page.parentId).toBeNull();
      expect(aggregate.page.depth).toBe(0);
    });

    it('순환 참조를 감지하고 예외를 발생시켜야 한다', () => {
      // Given
      const parentId = new PageId('770e8400-e29b-41d4-a716-446655440000');
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page A',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);

      const moveCommand: MovePageCommand = {
        pageId: aggregate.page.pageId.value,
        newParentId: aggregate.page.pageId.value, // 자기 자신
      };

      // When & Then
      expect(() => aggregate.move(moveCommand, aggregate.page, [])).toThrow(
        WorkspaceManagementError
      );
      expect(() => aggregate.move(moveCommand, aggregate.page, [])).toThrow(
        'Circular reference detected'
      );
    });

    it('ancestors에 이동할 페이지가 있으면 순환 참조 예외를 발생시켜야 한다', () => {
      // Given - 계층: Page A > Page B > Page C
      const pageAId = new PageId('770e8400-e29b-41d4-a716-446655440000');
      const pageBId = new PageId('880e8400-e29b-41d4-a716-446655440000');

      const pageA = new Page(
        pageAId,
        workspaceId,
        null,
        'Page A',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );

      const pageB = new Page(
        pageBId,
        workspaceId,
        pageAId,
        'Page B',
        null,
        '0',
        1,
        createdBy,
        now,
        now,
        null
      );

      // Page A를 Page B의 하위로 이동 시도
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page A',
        createdBy,
      };
      const aggregateA = PageAggregate.create(command, null);

      const moveCommand: MovePageCommand = {
        pageId: pageAId.value,
        newParentId: pageBId.value,
      };

      // ancestors: [Page B, Page A] (Page B의 조상에 Page A가 포함됨)
      const ancestors = [pageB, pageA];

      // When & Then
      expect(() => aggregateA.move(moveCommand, pageB, ancestors)).toThrow(
        WorkspaceManagementError
      );
    });

    it('PageMoved 이벤트가 발행되어야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      aggregate.markEventsAsCommitted(); // 이전 이벤트 클리어

      const newParentId = new PageId('770e8400-e29b-41d4-a716-446655440000');
      const newParentPage = new Page(
        newParentId,
        workspaceId,
        null,
        'New Parent',
        null,
        '0',
        0,
        createdBy,
        now,
        now,
        null
      );

      const moveCommand: MovePageCommand = {
        pageId: aggregate.page.pageId.value,
        newParentId: newParentId.value,
      };

      // When
      aggregate.move(moveCommand, newParentPage, []);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('PageMoved');
      const event = events[0] as any;
      expect(event.pageId).toBe(aggregate.page.pageId.value);
      expect(event.newParentId).toBe(newParentId.value);
      expect(event.newDepth).toBe(1);
    });
  });

  describe('updateInfo (Page 정보 수정) - Scenario 4', () => {
    it('제목을 업데이트해야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Old Title',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      aggregate.markEventsAsCommitted(); // 이전 이벤트 클리어

      const updateCommand = {
        pageId: aggregate.page.pageId.value,
        title: 'New Title',
        updatedBy: createdBy,
      };

      // When
      aggregate.updateInfo(updateCommand);

      // Then
      expect(aggregate.page.title).toBe('New Title');
    });

    it('아이콘을 업데이트해야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Page',
        icon: '📄',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      aggregate.markEventsAsCommitted();

      const updateCommand = {
        pageId: aggregate.page.pageId.value,
        icon: '🚀',
        updatedBy: createdBy,
      };

      // When
      aggregate.updateInfo(updateCommand);

      // Then
      expect(aggregate.page.icon).toBe('🚀');
    });

    it('제목과 아이콘을 동시에 업데이트해야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Old Title',
        icon: '📄',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      aggregate.markEventsAsCommitted();

      const updateCommand = {
        pageId: aggregate.page.pageId.value,
        title: 'New Title',
        icon: '🚀',
        updatedBy: createdBy,
      };

      // When
      aggregate.updateInfo(updateCommand);

      // Then
      expect(aggregate.page.title).toBe('New Title');
      expect(aggregate.page.icon).toBe('🚀');
    });

    it('제목만 업데이트하면 아이콘은 유지되어야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Title',
        icon: '📄',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);

      const updateCommand = {
        pageId: aggregate.page.pageId.value,
        title: 'New Title',
        updatedBy: createdBy,
      };

      // When
      aggregate.updateInfo(updateCommand);

      // Then
      expect(aggregate.page.title).toBe('New Title');
      expect(aggregate.page.icon).toBe('📄'); // 유지
    });

    it('PageUpdated 이벤트가 발행되어야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Old Title',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);
      aggregate.markEventsAsCommitted(); // 이전 이벤트 클리어

      const updateCommand = {
        pageId: aggregate.page.pageId.value,
        title: 'New Title',
        icon: '🚀',
        updatedBy: createdBy,
      };

      // When
      aggregate.updateInfo(updateCommand);
      const events = aggregate.getUncommittedEvents();

      // Then
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe('PageUpdated');
      const event = events[0] as any;
      expect(event.pageId).toBe(aggregate.page.pageId.value);
      expect(event.changes.title).toBe('New Title');
      expect(event.changes.icon).toBe('🚀');
    });

    it('제목이 빈 문자열이면 예외를 발생시켜야 한다', () => {
      // Given
      const command: CreatePageCommand = {
        workspaceId: workspaceId.value,
        title: 'Title',
        createdBy,
      };
      const aggregate = PageAggregate.create(command, null);

      const updateCommand = {
        pageId: aggregate.page.pageId.value,
        title: '',
        updatedBy: createdBy,
      };

      // When & Then
      expect(() => aggregate.updateInfo(updateCommand)).toThrow(
        WorkspaceManagementError
      );
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
      aggregate.markEventsAsCommitted(); // 명시적 클리어
      const events2 = aggregate.getUncommittedEvents();

      // Then
      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(0); // 클리어됨
    });
  });
});

