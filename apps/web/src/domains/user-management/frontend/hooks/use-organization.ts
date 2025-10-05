// apps/web/src/domains/user-management/frontend/hooks/use-organization.ts

import { useOrganization as useOrganizationContext } from '../contexts/organization-context';
import {
  OrganizationSummary,
  CreateOrganizationRequest,
  CreateOrganizationResult,
} from '../../shared/dtos';

/**
 * 조직 관련 비즈니스 로직을 위한 커스텀 훅
 * Story 005: 조직 선택 및 컨텍스트 관리
 * Story 006: 조직 생성 기능 추가
 */

export function useOrganization() {
  const context = useOrganizationContext();

  // 현재 선택된 조직 정보
  const selectedOrganization = context.organizations.find(
    org => org.id === context.selectedOrganizationId
  );

  // 기본 조직 정보
  const defaultOrganization = context.organizations.find(org => org.isDefault);

  // 조직 선택 가능 여부
  const canSelectOrganization = (organizationId: string): boolean => {
    return context.organizations.some(org => org.id === organizationId);
  };

  // 조직이 기본 조직인지 확인
  const isDefaultOrganization = (organizationId: string): boolean => {
    const org = context.organizations.find(org => org.id === organizationId);
    return org?.isDefault ?? false;
  };

  // 조직 이름으로 검색
  const findOrganizationByName = (
    name: string
  ): OrganizationSummary | undefined => {
    return context.organizations.find(org =>
      org.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  // 소유한 조직만 필터링
  const ownedOrganizations = context.organizations.filter(
    org => org.role === 'owner'
  );

  return {
    ...context,
    selectedOrganization,
    defaultOrganization,
    ownedOrganizations,
    canSelectOrganization,
    isDefaultOrganization,
    findOrganizationByName,
  };
}
