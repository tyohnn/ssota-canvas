// apps/web/src/domains/organization-management/backend/services/interfaces/organization-crud.service.interface.ts

import type { Result } from '@/utils/result';
import type { OrganizationManagementError } from '../../../shared/errors/organization-management.error';
import type { OrganizationSummary } from '../../../shared/dtos';
import type {
  CreateDefaultOrganizationCommand,
  CreateOrganizationCommand,
  GetUserOrganizationsCommand,
} from '../../../shared/commands';
import type {
  CreateDefaultOrganizationResult,
  CreateOrganizationWithWorkspaceResult,
} from './common.types';

/**
 * Organization CRUD Service Interface
 *
 * 조직 생성, 조회를 담당
 */
export interface OrganizationCrudService {
  /**
   * 기본 조직 생성 (is_default=true)
   * - 사용자 가입 시 자동 호출
   * - Default Workspace + Welcome 페이지 자동 생성
   * - 생성 완료 후 리다이렉션 URL 반환
   */
  createDefaultOrganization(
    command: CreateDefaultOrganizationCommand
  ): Promise<
    Result<CreateDefaultOrganizationResult, OrganizationManagementError>
  >;

  /**
   * 일반 조직 생성 (is_default=false)
   * - 사용자가 수동으로 생성
   * - Default Workspace + Untitled 페이지 자동 생성
   */
  createOrganization(
    command: CreateOrganizationCommand
  ): Promise<
    Result<CreateOrganizationWithWorkspaceResult, OrganizationManagementError>
  >;

  /**
   * 사용자의 조직 목록 조회
   * - 소유자인 조직 + 멤버로 속한 조직
   */
  getUserOrganizations(
    command: GetUserOrganizationsCommand
  ): Promise<Result<OrganizationSummary[], OrganizationManagementError>>;
}
