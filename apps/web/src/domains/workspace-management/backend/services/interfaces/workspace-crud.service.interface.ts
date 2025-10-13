// apps/web/src/domains/workspace-management/backend/services/interfaces/workspace-crud.service.interface.ts

import type { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import type { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import type { CreateWorkspaceResult, Result } from './common.types';

/**
 * Workspace CRUD Service Interface (Scenario 0, 2)
 *
 * Workspace 생성 및 정보 수정을 담당
 */
export interface WorkspaceCrudService {
  /**
   * Default Workspace 생성 (Scenario 0)
   *
   * 트랜잭션:
   * 1. Default Workspace 생성 (삭제 불가)
   * 2. 생성자를 Workspace 멤버로 추가
   * 3. 초기 "Welcome 👋" 페이지 생성
   *
   * @param orgId - 조직 ID
   * @param userId - 사용자 ID (조직 소유자)
   * @returns CreateWorkspaceResult (성공) | Error code (실패)
   */
  createDefaultWorkspace(
    orgId: OrganizationId,
    userId: string
  ): Promise<Result<CreateWorkspaceResult>>;

  /**
   * Workspace 생성 (Scenario 2)
   *
   * 트랜잭션:
   * 1. Workspace 생성
   * 2. 생성자를 Workspace 멤버로 추가
   * 3. 초기 "Untitled" 페이지 생성
   *
   * @param orgId - 조직 ID
   * @param name - Workspace 이름 (1-100자)
   * @param description - Workspace 설명 (최대 500자)
   * @param icon - Workspace 아이콘
   * @param userId - 사용자 ID
   * @returns CreateWorkspaceResult (성공) | Error code (실패)
   */
  createWorkspace(
    orgId: OrganizationId,
    name: string,
    description: string | null,
    icon: string | null,
    userId: string
  ): Promise<Result<CreateWorkspaceResult>>;

  /**
   * Workspace 정보 수정 (Scenario 2)
   *
   * @param workspaceId - Workspace ID
   * @param name - 새 이름 (선택)
   * @param description - 새 설명 (선택)
   * @param icon - 새 아이콘 (선택)
   * @param userId - 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  updateWorkspaceInfo(
    workspaceId: WorkspaceId,
    name: string | undefined,
    description: string | null | undefined,
    icon: string | null | undefined,
    userId: string
  ): Promise<Result<void>>;
}
