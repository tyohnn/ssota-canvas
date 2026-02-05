/**
 * 기본 조직 생성 또는 기존 조직 조회 (서비스 레이어)
 *
 * 먼저 조직 생성을 시도하고, 이미 존재하면 기존 조직 정보를 반환.
 */
import { createDefaultOrganizationAction } from '@/domains/organization-management/actions/organization-management.actions';
import { Result } from '@/utils/result';

import { getExistingDefaultOrganization } from './get-existing-default-organization.service';
import type { GetExistingDefaultOrganizationDeps } from './get-existing-default-organization.service';
import { UserManagementError } from '../../shared/errors/user-management.error';
import type { DefaultOrganizationPayload } from '../../shared/types';

function isAlreadyExistsError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message;
  return (
    msg.includes('DEFAULT_ORGANIZATION_ALREADY_EXISTS') ||
    msg.includes('already exists')
  );
}

/**
 * 기본 조직 생성 시도. 이미 있으면 기존 조직 정보 반환.
 */
export async function createOrGetDefaultOrganization(
  userId: string,
  orgName: string,
  deps: GetExistingDefaultOrganizationDeps
): Promise<Result<DefaultOrganizationPayload, UserManagementError>> {
  try {
    const result = await createDefaultOrganizationAction({
      organizationName: orgName,
    });
    return Result.success({ ...result, createdNewOrganization: true });
  } catch (organizationError) {
    if (isAlreadyExistsError(organizationError)) {
      const existingResult = await getExistingDefaultOrganization(userId, deps);
      if (existingResult.isError()) {
        return Result.error(existingResult.error);
      }
      return Result.success({
        ...existingResult.value,
        createdNewOrganization: false,
      });
    }
    return Result.error(
      new UserManagementError(
        'ORGANIZATION_CREATION_FAILED',
        organizationError instanceof Error
          ? organizationError.message
          : 'Unknown error',
        { originalError: organizationError }
      )
    );
  }
}
