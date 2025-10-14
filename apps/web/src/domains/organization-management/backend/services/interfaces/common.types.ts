// apps/web/src/domains/organization-management/backend/services/interfaces/common.types.ts

import type { OrganizationSummary } from '../../../shared/dtos';

/**
 * Create Organization Result
 *
 * 조직 생성 성공 시 반환 데이터
 * SSOT: workspace와 page 정보는 WorkspaceCrudService에서 반환된 실제 값
 */
export interface CreateOrganizationWithWorkspaceResult {
  organization: OrganizationSummary;
  workspace: { id: string; name: string; isDefault: boolean };
  page: { id: string; title: string; icon: string | null };
}

/**
 * Create Default Organization Result
 *
 * 기본 조직 생성 성공 시 반환 데이터
 * SSOT: workspace와 page 정보는 WorkspaceCrudService에서 반환된 실제 값
 */
export interface CreateDefaultOrganizationResult
  extends CreateOrganizationWithWorkspaceResult {
  redirectUrl: string;
}

/**
 * Result type for Service responses
 *
 * 성공(ok) 또는 실패(err) 결과를 나타내는 Union Type
 */
export type ServiceResult<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };
