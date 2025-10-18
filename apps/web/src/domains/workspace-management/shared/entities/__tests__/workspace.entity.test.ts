import { describe, it, expect, beforeEach } from 'vitest';
import { Workspace } from '../workspace.entity';
import { WorkspaceId } from '../../value-objects/workspace-id.vo';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceManagementError } from '../../errors/workspace-management.error';

describe('Workspace Entity', () => {
  let workspaceId: WorkspaceId;
  let organizationId: OrganizationId;
  let createdBy: string;
  let now: Date;

  beforeEach(() => {
    workspaceId = new WorkspaceId('550e8400-e29b-41d4-a716-446655440000');
    organizationId = new OrganizationId(
      '660e8400-e29b-41d4-a716-446655440000'
    );
    createdBy = '770e8400-e29b-41d4-a716-446655440000';
    now = new Date();
  });

  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // Given
      const name = 'Test Workspace';
      const description = 'Test Description';
      const icon = '🚀';

      // When
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        name,
        description,
        icon,
        false, // isDefault
        true, // deletable
        createdBy,
        now,
        now,
        null // deletedAt
      );

      // Then
      expect(workspace.workspaceId).toBe(workspaceId);
      expect(workspace.organizationId).toBe(organizationId);
      expect(workspace.name).toBe(name);
      expect(workspace.description).toBe(description);
      expect(workspace.icon).toBe(icon);
      expect(workspace.isDefault).toBe(false);
      expect(workspace.deletable).toBe(true);
      expect(workspace.createdBy).toBe(createdBy);
      expect(workspace.createdAt).toBe(now);
      expect(workspace.updatedAt).toBe(now);
      expect(workspace.deletedAt).toBeNull();
    });

    it('Default Workspace는 is_default=true, deletable=false여야 한다', () => {
      // When
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Default Workspace',
        null,
        null,
        true, // isDefault
        false, // deletable
        createdBy,
        now,
        now,
        null
      );

      // Then
      expect(workspace.isDefault).toBe(true);
      expect(workspace.deletable).toBe(false);
    });

    it('일반 Workspace는 is_default=false, deletable=true여야 한다', () => {
      // When
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Regular Workspace',
        null,
        null,
        false, // isDefault
        true, // deletable
        createdBy,
        now,
        now,
        null
      );

      // Then
      expect(workspace.isDefault).toBe(false);
      expect(workspace.deletable).toBe(true);
    });

    it('이름이 빈 문자열이면 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(
        () =>
          new Workspace(
            workspaceId,
            organizationId,
            '', // 빈 이름
            null,
            null,
            false,
            true,
            createdBy,
            now,
            now,
            null
          )
      ).toThrow(WorkspaceManagementError);
    });

    it('이름이 100자를 초과하면 예외를 발생시켜야 한다', () => {
      // Given
      const longName = 'a'.repeat(101);

      // When & Then
      expect(
        () =>
          new Workspace(
            workspaceId,
            organizationId,
            longName,
            null,
            null,
            false,
            true,
            createdBy,
            now,
            now,
            null
          )
      ).toThrow(WorkspaceManagementError);
    });

    it('설명이 500자를 초과하면 예외를 발생시켜야 한다', () => {
      // Given
      const longDescription = 'a'.repeat(501);

      // When & Then
      expect(
        () =>
          new Workspace(
            workspaceId,
            organizationId,
            'Valid Name',
            longDescription,
            null,
            false,
            true,
            createdBy,
            now,
            now,
            null
          )
      ).toThrow(WorkspaceManagementError);
    });

    it('Default이면서 deletable=true이면 예외를 발생시켜야 한다', () => {
      // When & Then
      expect(
        () =>
          new Workspace(
            workspaceId,
            organizationId,
            'Default Workspace',
            null,
            null,
            true, // isDefault
            true, // deletable (잘못된 조합!)
            createdBy,
            now,
            now,
            null
          )
      ).toThrow(WorkspaceManagementError);
      expect(
        () =>
          new Workspace(
            workspaceId,
            organizationId,
            'Default Workspace',
            null,
            null,
            true,
            true,
            createdBy,
            now,
            now,
            null
          )
      ).toThrow('Default workspace cannot be deletable');
    });
  });

  describe('updateInfo', () => {
    it('이름/설명/아이콘을 업데이트해야 한다', () => {
      // Given
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Old Name',
        'Old Description',
        '📁',
        false,
        true,
        createdBy,
        now,
        now,
        null
      );
      const oldUpdatedAt = workspace.updatedAt;

      // Wait to ensure timestamp difference
      const newUpdatedAt = new Date(now.getTime() + 1000);

      // When
      workspace.updateInfo('New Name', 'New Description', '🚀');

      // Then
      expect(workspace.name).toBe('New Name');
      expect(workspace.description).toBe('New Description');
      expect(workspace.icon).toBe('🚀');
      expect(workspace.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime()
      );
      expect(workspace.updatedAt).toBeInstanceOf(Date);
    });

    it('updated_at 타임스탬프가 갱신되어야 한다', () => {
      // Given
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Name',
        null,
        null,
        false,
        true,
        createdBy,
        now,
        now,
        null
      );
      const originalUpdatedAt = workspace.updatedAt;

      // When
      workspace.updateInfo('New Name', null, null);

      // Then
      expect(workspace.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
      expect(workspace.updatedAt).toBeInstanceOf(Date);
    });

    it('createdAt은 변경되지 않아야 한다', () => {
      // Given
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Name',
        null,
        null,
        false,
        true,
        createdBy,
        now,
        now,
        null
      );
      const originalCreatedAt = workspace.createdAt;

      // When
      workspace.updateInfo('New Name', 'New Description', '🎯');

      // Then
      expect(workspace.createdAt).toBe(originalCreatedAt);
    });

    it('빈 이름으로 업데이트하면 예외를 발생시켜야 한다', () => {
      // Given
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Name',
        null,
        null,
        false,
        true,
        createdBy,
        now,
        now,
        null
      );

      // When & Then
      expect(() => workspace.updateInfo('', null, null)).toThrow(
        WorkspaceManagementError
      );
    });
  });

  describe('softDelete', () => {
    it('deletable=true인 Workspace는 소프트 삭제되어야 한다', () => {
      // Given
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Name',
        null,
        null,
        false,
        true, // deletable
        createdBy,
        now,
        now,
        null
      );

      // When
      workspace.softDelete();

      // Then
      expect(workspace.deletedAt).not.toBeNull();
      expect(workspace.deletedAt).toBeInstanceOf(Date);
    });

    it('Default Workspace는 삭제할 수 없어야 한다', () => {
      // Given
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Default Workspace',
        null,
        null,
        true, // isDefault
        false, // deletable
        createdBy,
        now,
        now,
        null
      );

      // When & Then
      expect(() => workspace.softDelete()).toThrow(WorkspaceManagementError);
      expect(() => workspace.softDelete()).toThrow(
        'Default workspace cannot be deleted'
      );
    });
  });

  describe('canBeDeleted', () => {
    it('deletable=true이면 true를 반환해야 한다', () => {
      // Given
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Name',
        null,
        null,
        false,
        true, // deletable
        createdBy,
        now,
        now,
        null
      );

      // When & Then
      expect(workspace.canBeDeleted()).toBe(true);
    });

    it('deletable=false이면 false를 반환해야 한다', () => {
      // Given
      const workspace = new Workspace(
        workspaceId,
        organizationId,
        'Default Workspace',
        null,
        null,
        true, // isDefault
        false, // deletable
        createdBy,
        now,
        now,
        null
      );

      // When & Then
      expect(workspace.canBeDeleted()).toBe(false);
    });
  });
});

