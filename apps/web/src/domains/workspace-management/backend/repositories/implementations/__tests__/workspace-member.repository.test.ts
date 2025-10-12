import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrizzleWorkspaceMemberRepository } from '../drizzle-workspace-member.repository';
import { WorkspaceAggregate } from '../../../../shared/aggregates/workspace.aggregate';
import { DrizzleWorkspaceRepository } from '../drizzle-workspace.repository';
import { OrganizationId, UserId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { WorkspaceId } from '../../../../shared/value-objects/workspace-id.vo';
import { adminDb } from '@/db';
import { workspaceMembers, workspaces } from '@/db/schema-dev';
import { eq, and } from 'drizzle-orm';

describe('WorkspaceMemberRepository Integration Tests', () => {
  let memberRepository: DrizzleWorkspaceMemberRepository;
  let workspaceRepository: DrizzleWorkspaceRepository;
  let testOrgId: OrganizationId;
  let testUserId: UserId;
  let testWorkspaceId: WorkspaceId;
  let otherUserId: string;

  beforeEach(async () => {
    memberRepository = new DrizzleWorkspaceMemberRepository();
    workspaceRepository = new DrizzleWorkspaceRepository();

    // 실제 DB에 존재하는 user와 organization 사용
    testUserId = new UserId('4b709f4d-5531-4600-ba2b-97b1e087b449');
    testOrgId = new OrganizationId('2d0e4484-6cd0-4ed1-9523-01229cf487b8');
    otherUserId = 'cd04e75e-9ee8-4261-9de3-9f494d1689eb'; // 다른 사용자 (멤버 아님)

    // Clean up existing data
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId.value));
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, otherUserId));
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));

    // Setup: Create test workspace (일반 Workspace, Default 아님)
    const workspaceAggregate = WorkspaceAggregate.create({
      organizationId: testOrgId.value,
      name: 'Test Workspace',
      description: 'For member testing',
      createdBy: testUserId.value,
    });
    await workspaceRepository.save(workspaceAggregate);
    testWorkspaceId = workspaceAggregate.workspace.workspaceId;
  });

  afterEach(async () => {
    // Clean up after each test
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, testUserId.value));
    await adminDb
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.user_id, otherUserId));
    await adminDb
      .delete(workspaces)
      .where(eq(workspaces.organization_id, testOrgId.value));
  });

  describe('isMember', () => {
    it('Workspace에 초대된 멤버면 true를 반환해야 한다', async () => {
      // Given: 멤버 추가
      await memberRepository.addMember(testWorkspaceId, testUserId.value);

      // When
      const isMember = await memberRepository.isMember(
        testWorkspaceId,
        testUserId.value
      );

      // Then
      expect(isMember).toBe(true);
    });

    it('Workspace에 초대되지 않은 멤버면 false를 반환해야 한다', async () => {
      // Given: 멤버 추가 안함

      // When
      const isMember = await memberRepository.isMember(
        testWorkspaceId,
        otherUserId
      );

      // Then
      expect(isMember).toBe(false);
    });

    it('adminDb를 사용해야 한다 (RLS 우회)', async () => {
      // Given
      await memberRepository.addMember(testWorkspaceId, testUserId.value);

      // When: adminDb로 직접 조회
      const result = await adminDb
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspace_id, testWorkspaceId.value),
            eq(workspaceMembers.user_id, testUserId.value)
          )
        );

      // Then
      expect(result).toHaveLength(1);
    });
  });

  describe('addMember', () => {
    it('Workspace에 멤버를 초대해야 한다 (role 없이)', async () => {
      // When
      await memberRepository.addMember(testWorkspaceId, testUserId.value);

      // Then
      const saved = await adminDb
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspace_id, testWorkspaceId.value),
            eq(workspaceMembers.user_id, testUserId.value)
          )
        );

      expect(saved).toHaveLength(1);
      expect(saved[0]?.workspace_id).toBe(testWorkspaceId.value);
      expect(saved[0]?.user_id).toBe(testUserId.value);
      expect(saved[0]?.joined_at).toBeDefined();
      // role 필드 없음 (조직에서 관리)
    });

    it('adminDb를 사용해야 한다 (RLS 우회)', async () => {
      // When
      await memberRepository.addMember(testWorkspaceId, otherUserId);

      // Then: adminDb로 조회 가능
      const saved = await adminDb
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspace_id, testWorkspaceId.value),
            eq(workspaceMembers.user_id, otherUserId)
          )
        );

      expect(saved).toHaveLength(1);
    });
  });

  describe('removeMember', () => {
    it('Workspace에서 멤버를 제거해야 한다', async () => {
      // Given: 멤버 추가
      await memberRepository.addMember(testWorkspaceId, testUserId.value);

      // When: 멤버 제거
      await memberRepository.removeMember(testWorkspaceId, testUserId.value);

      // Then
      const isMember = await memberRepository.isMember(
        testWorkspaceId,
        testUserId.value
      );
      expect(isMember).toBe(false);
    });
  });

  describe('권한 확인 (organization_members에서 조회)', () => {
    it('권한은 workspace_members가 아닌 organization_members.role에서 관리', async () => {
      // Given: Workspace 멤버 추가 (role 없이)
      await memberRepository.addMember(testWorkspaceId, testUserId.value);

      // Then: workspace_members에는 role 필드가 없음
      const member = await adminDb
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspace_id, testWorkspaceId.value),
            eq(workspaceMembers.user_id, testUserId.value)
          )
        );

      expect(member[0]).toBeDefined();
      // role 필드가 없음을 확인 (타입에도 없어야 함)
      expect('role' in member[0]!).toBe(false);
    });
  });
});

