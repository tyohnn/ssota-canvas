import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrizzleWorkspaceInvitationRepository } from '../drizzle-workspace-invitation.repository';
import { WorkspaceInvitation } from '../../../../shared/entities/workspace-invitation.entity';
import { WorkspaceInvitationId } from '../../../../shared/value-objects/workspace-invitation-id.vo';
import { WorkspaceId } from '../../../../shared/value-objects/workspace-id.vo';
import { adminDb } from '@/db';
import { workspaceInvitations, workspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('DrizzleWorkspaceInvitationRepository Integration Tests', () => {
  let repository: DrizzleWorkspaceInvitationRepository;
  let testWorkspaceId: string;
  let testUserId: string;
  let testInviterId: string;
  let testOrgId: string;
  let otherUserId: string;

  beforeEach(async () => {
    repository = new DrizzleWorkspaceInvitationRepository();

    // 실제 DB에 존재하는 user와 organization 사용 (workspace.repository.test.ts 패턴)
    testUserId = '4b709f4d-5531-4600-ba2b-97b1e087b449';
    testInviterId = '4b709f4d-5531-4600-ba2b-97b1e087b449';
    otherUserId = '99b6e668-9e5f-4175-be74-2efc0aef967f';
    testOrgId = '2d0e4484-6cd0-4ed1-9523-01229cf487b8';

    // 테스트용 Workspace 생성
    const [workspace] = await adminDb
      .insert(workspaces)
      .values({
        name: 'Test Workspace for Invitations',
        organization_id: testOrgId,
        created_by: testInviterId,
      })
      .returning();
    testWorkspaceId = workspace!.id;

    // 기존 초대 정리
    await adminDb
      .delete(workspaceInvitations)
      .where(eq(workspaceInvitations.workspace_id, testWorkspaceId));
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    if (testWorkspaceId) {
      await adminDb
        .delete(workspaceInvitations)
        .where(eq(workspaceInvitations.workspace_id, testWorkspaceId));
      await adminDb
        .delete(workspaces)
        .where(eq(workspaces.id, testWorkspaceId));
    }
  });

  describe('save', () => {
    it('WorkspaceInvitation을 데이터베이스에 저장해야 한다', async () => {
      // Given
      const invitationId = new WorkspaceInvitationId(crypto.randomUUID());
      const workspaceId = new WorkspaceId(testWorkspaceId);
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );

      // When
      await repository.save(invitation);

      // Then
      const saved = await adminDb
        .select()
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.id, invitationId.value))
        .limit(1);

      expect(saved).toHaveLength(1);
      expect(saved[0]!.workspace_id).toBe(testWorkspaceId);
      expect(saved[0]!.invited_user_id).toBe(testUserId);
      expect(saved[0]!.invited_by).toBe(testInviterId);
      expect(saved[0]!.status).toBe('pending');
    });

    it('초대 상태 업데이트가 가능해야 한다', async () => {
      // Given
      const invitationId = new WorkspaceInvitationId(crypto.randomUUID());
      const workspaceId = new WorkspaceId(testWorkspaceId);
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(invitation);

      // When: 수락으로 상태 변경
      invitation.accept();
      await repository.save(invitation);

      // Then
      const updated = await adminDb
        .select()
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.id, invitationId.value))
        .limit(1);

      expect(updated[0]!.status).toBe('accepted');
      expect(updated[0]!.processed_at).not.toBeNull();
    });
  });

  describe('findById', () => {
    it('ID로 초대를 찾아야 한다', async () => {
      // Given
      const invitationId = new WorkspaceInvitationId(crypto.randomUUID());
      const workspaceId = new WorkspaceId(testWorkspaceId);
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(invitation);

      // When
      const found = await repository.findById(invitationId);

      // Then
      expect(found).not.toBeNull();
      expect(found!.id.equals(invitationId)).toBe(true);
      expect(found!.invitedUserId).toBe(testUserId);
    });

    it('존재하지 않는 ID는 null을 반환해야 한다', async () => {
      // Given
      const nonExistentId = new WorkspaceInvitationId(crypto.randomUUID());

      // When
      const found = await repository.findById(nonExistentId);

      // Then
      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('사용자의 모든 초대를 조회해야 한다', async () => {
      // Given
      const invitation1 = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        new WorkspaceId(testWorkspaceId),
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(invitation1);

      // When
      const invitations = await repository.findByUserId(testUserId);

      // Then
      expect(invitations.length).toBeGreaterThanOrEqual(1);
      expect(invitations[0]!.invitedUserId).toBe(testUserId);
    });
  });

  describe('findPendingByWorkspace', () => {
    it('Workspace의 pending 초대만 조회해야 한다', async () => {
      // Given
      const workspaceId = new WorkspaceId(testWorkspaceId);
      const pendingInvitation = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        workspaceId,
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(pendingInvitation);

      // When
      const pending = await repository.findPendingByWorkspace(workspaceId);

      // Then
      expect(pending.length).toBeGreaterThanOrEqual(1);
      expect(
        pending.every((inv: WorkspaceInvitation) => inv.status === 'pending')
      ).toBe(true);
    });
  });

  describe('findInvitation', () => {
    it('특정 Workspace와 사용자의 초대를 찾아야 한다', async () => {
      // Given
      const workspaceId = new WorkspaceId(testWorkspaceId);
      const invitation = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        workspaceId,
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(invitation);

      // When
      const found = await repository.findInvitation(
        workspaceId,
        testUserId,
        'pending'
      );

      // Then
      expect(found).not.toBeNull();
      expect(found!.invitedUserId).toBe(testUserId);
      expect(found!.status).toBe('pending');
    });
  });

  describe('updateStatus', () => {
    it('초대 상태를 업데이트해야 한다', async () => {
      // Given
      const invitationId = new WorkspaceInvitationId(crypto.randomUUID());
      const workspaceId = new WorkspaceId(testWorkspaceId);
      const invitation = new WorkspaceInvitation(
        invitationId,
        workspaceId,
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(invitation);

      // When
      await repository.updateStatus(invitationId, 'accepted');

      // Then
      const updated = await repository.findById(invitationId);
      expect(updated!.status).toBe('accepted');
      expect(updated!.processedAt).not.toBeNull();
    });
  });

  describe('findPendingByWorkspaceWithProfiles', () => {
    it('Workspace의 pending 초대를 프로필과 함께 조회해야 한다', async () => {
      // Given: 2개의 pending 초대 생성
      const invitation1 = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        new WorkspaceId(testWorkspaceId),
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      const invitation2 = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        new WorkspaceId(testWorkspaceId),
        otherUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(invitation1);
      await repository.save(invitation2);

      // When
      const invitations = await repository.findPendingByWorkspaceWithProfiles(
        new WorkspaceId(testWorkspaceId)
      );

      // Then
      expect(invitations).toHaveLength(2);
      expect(invitations.every(inv => inv.invitedUserEmail)).toBe(true);
      expect(invitations.every(inv => inv.invitedUserName)).toBe(true);
      expect(invitations.every(inv => inv.inviterName)).toBe(true);
      expect(invitations.every(inv => inv.status === 'pending')).toBe(true);
    });

    it('accepted/rejected 초대는 제외되어야 한다', async () => {
      // Given: pending 1개, accepted 1개
      const pendingInv = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        new WorkspaceId(testWorkspaceId),
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      const acceptedInv = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        new WorkspaceId(testWorkspaceId),
        otherUserId,
        testInviterId,
        'accepted',
        null,
        new Date(),
        new Date()
      );
      await repository.save(pendingInv);
      await repository.save(acceptedInv);

      // When
      const invitations = await repository.findPendingByWorkspaceWithProfiles(
        new WorkspaceId(testWorkspaceId)
      );

      // Then: pending만 조회
      expect(invitations).toHaveLength(1);
      expect(invitations[0]!.status).toBe('pending');
      expect(invitations[0]!.invitedUserId).toBe(testUserId);
    });

    it('created_at 기준으로 정렬되어야 한다', async () => {
      // Given: 2개의 초대를 시간차를 두고 생성
      const invitation1 = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        new WorkspaceId(testWorkspaceId),
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(invitation1);

      // 1초 대기
      await new Promise(resolve => setTimeout(resolve, 1000));

      const invitation2 = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        new WorkspaceId(testWorkspaceId),
        otherUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(invitation2);

      // When
      const invitations = await repository.findPendingByWorkspaceWithProfiles(
        new WorkspaceId(testWorkspaceId)
      );

      // Then: 먼저 생성된 것이 먼저
      expect(invitations).toHaveLength(2);
      expect(invitations[0]!.invitedUserId).toBe(testUserId);
      expect(invitations[1]!.invitedUserId).toBe(otherUserId);
    });

    it('초대한 사람과 초대받은 사람의 프로필 정보를 포함해야 한다', async () => {
      // Given
      const invitation = new WorkspaceInvitation(
        new WorkspaceInvitationId(crypto.randomUUID()),
        new WorkspaceId(testWorkspaceId),
        testUserId,
        testInviterId,
        'pending',
        null,
        new Date(),
        null
      );
      await repository.save(invitation);

      // When
      const invitations = await repository.findPendingByWorkspaceWithProfiles(
        new WorkspaceId(testWorkspaceId)
      );

      // Then
      expect(invitations[0]).toBeDefined();
      expect(invitations[0]!.invitedUserEmail).toBeTruthy();
      expect(invitations[0]!.invitedUserName).toBeTruthy();
      expect(invitations[0]!.inviterName).toBeTruthy();
    });
  });
});

