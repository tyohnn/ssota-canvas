import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrizzleWorkspaceRepository } from '../drizzle-workspace.repository';
import { WorkspaceAggregate } from '../../../../shared/aggregates/workspace.aggregate';
import { OrganizationId, UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '../../../../shared/value-objects/workspace-id.vo';
import { adminDb } from '@/db';
import { workspaces } from '@/db/schema-dev';
import { eq } from 'drizzle-orm';

describe('WorkspaceRepository Integration Tests', () => {
  let repository: DrizzleWorkspaceRepository;
  let testOrgId: OrganizationId;
  let testUserId: UserId;

  beforeEach(async () => {
    repository = new DrizzleWorkspaceRepository();
    
    // 실제 DB에 존재하는 user와 organization 사용
    testUserId = new UserId('4b709f4d-5531-4600-ba2b-97b1e087b449');
    testOrgId = new OrganizationId('2d0e4484-6cd0-4ed1-9523-01229cf487b8');

    // Clean up test data (이 조직의 모든 workspace 삭제)
    await adminDb.delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
  });

  afterEach(async () => {
    // Clean up after each test (테스트 격리)
    await adminDb.delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
  });

  describe('save', () => {
    it('Workspace를 데이터베이스에 저장해야 한다', async () => {
      // Given
      const aggregate = WorkspaceAggregate.createDefault({
        organizationId: testOrgId.value,
        createdBy: testUserId.value,
      });

      // When
      await repository.save(aggregate);

      // Then
      const saved = await adminDb.select()
        .from(workspaces)
        .where(eq(workspaces.id, aggregate.workspace.workspaceId.value));

      expect(saved).toHaveLength(1);
      expect(saved[0]?.name).toBe('Default Workspace');
      expect(saved[0]?.is_default).toBe(true);
      expect(saved[0]?.deletable).toBe(false);
    });

    it('is_default=true인 Workspace가 저장되어야 한다', async () => {
      // Given
      const aggregate = WorkspaceAggregate.createDefault({
        organizationId: testOrgId.value,
        createdBy: testUserId.value,
      });

      // When
      await repository.save(aggregate);

      // Then
      const saved = await adminDb.select()
        .from(workspaces)
        .where(eq(workspaces.organization_id, testOrgId.value));

      const defaultWs = saved.find(ws => ws.is_default);
      expect(defaultWs).toBeDefined();
      expect(defaultWs?.deletable).toBe(false);
    });

    it('adminDb를 사용하여 RLS를 우회해야 한다', async () => {
      // Given
      const aggregate = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Test Workspace',
        description: 'Test Description',
        icon: '🚀',
        createdBy: testUserId.value,
      });

      // When
      await repository.save(aggregate);

      // Then
      // adminDb로 조회 가능
      const saved = await adminDb.select()
        .from(workspaces)
        .where(eq(workspaces.id, aggregate.workspace.workspaceId.value));

      expect(saved).toHaveLength(1);
      expect(saved[0]?.name).toBe('Test Workspace');
    });
  });

  describe('findById', () => {
    it('ID로 Workspace를 찾아야 한다', async () => {
      // Given
      const aggregate = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Find Test',
        createdBy: testUserId.value,
      });
      await repository.save(aggregate);

      // When
      const found = await repository.findById(aggregate.workspace.workspaceId);

      // Then
      expect(found).not.toBeNull();
      expect(found?.name).toBe('Find Test');
      expect(found?.workspaceId.equals(aggregate.workspace.workspaceId)).toBe(true);
    });

    it('존재하지 않는 ID는 null을 반환해야 한다', async () => {
      // Given
      const nonExistentId = new WorkspaceId('999e8400-e29b-41d4-a716-446655440000');

      // When
      const found = await repository.findById(nonExistentId);

      // Then
      expect(found).toBeNull();
    });

    it('삭제된 Workspace는 null을 반환해야 한다', async () => {
      // Given
      const aggregate = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'To Delete',
        createdBy: testUserId.value,
      });
      await repository.save(aggregate);

      // Soft delete
      await adminDb.update(workspaces)
        .set({ deleted_at: new Date() })
        .where(eq(workspaces.id, aggregate.workspace.workspaceId.value));

      // When
      const found = await repository.findById(aggregate.workspace.workspaceId);

      // Then
      expect(found).toBeNull();
    });
  });

  describe('findByOrganizationId', () => {
    it('조직의 모든 Workspace를 조회해야 한다', async () => {
      // Given
      const defaultWs = WorkspaceAggregate.createDefault({
        organizationId: testOrgId.value,
        createdBy: testUserId.value,
      });
      const regularWs = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Regular Workspace',
        createdBy: testUserId.value,
      });

      await repository.save(defaultWs);
      await repository.save(regularWs);

      // When
      const workspaces = await repository.findByOrganizationId(testOrgId);

      // Then
      expect(workspaces).toHaveLength(2);
    });

    it('삭제된 Workspace는 제외해야 한다 (deleted_at != null)', async () => {
      // Given
      const ws1 = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Active',
        createdBy: testUserId.value,
      });
      const ws2 = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'Deleted',
        createdBy: testUserId.value,
      });

      await repository.save(ws1);
      await repository.save(ws2);

      // Soft delete ws2
      await adminDb.update(workspaces)
        .set({ deleted_at: new Date() })
        .where(eq(workspaces.name, 'Deleted'));

      // When
      const activeWorkspaces = await repository.findByOrganizationId(testOrgId);

      // Then
      expect(activeWorkspaces).toHaveLength(1);
      expect(activeWorkspaces[0]?.name).toBe('Active');
    });

    it('Default Workspace가 첫 번째로 정렬되어야 한다', async () => {
      // Given
      const defaultWs = WorkspaceAggregate.createDefault({
        organizationId: testOrgId.value,
        createdBy: testUserId.value,
      });
      const regularWs1 = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'A Regular',
        createdBy: testUserId.value,
      });
      const regularWs2 = WorkspaceAggregate.create({
        organizationId: testOrgId.value,
        name: 'B Regular',
        createdBy: testUserId.value,
      });

      // Save in reverse order
      await repository.save(regularWs2);
      await repository.save(regularWs1);
      await repository.save(defaultWs);

      // When
      const workspaces = await repository.findByOrganizationId(testOrgId);

      // Then
      expect(workspaces).toHaveLength(3);
      expect(workspaces[0]?.isDefault).toBe(true);
      expect(workspaces[0]?.name).toBe('Default Workspace');
    });

    it('빈 조직은 빈 배열을 반환해야 한다', async () => {
      // Given
      const emptyOrgId = new OrganizationId('999e8400-e29b-41d4-a716-446655440000');

      // When
      const workspaces = await repository.findByOrganizationId(emptyOrgId);

      // Then
      expect(workspaces).toHaveLength(0);
    });
  });
});

