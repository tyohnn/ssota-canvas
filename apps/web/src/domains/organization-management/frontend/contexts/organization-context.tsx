'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  getUserOrganizationsAction,
  createOrganizationAction,
} from '../../actions/organization-management.actions';
import {
  OrganizationSummary,
  CreateOrganizationRequest,
  CreateOrganizationResult,
} from '../../shared/dtos';
import { getCookieValue, setCookieValue } from '@/utils/cookie-helpers';
import { ORGANIZATION_COOKIE_KEYS } from '../utils/cookie-helpers';

interface OrganizationContextType {
  // 상태
  organizations: OrganizationSummary[];
  selectedOrganizationId: string | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  selectOrganization: (organizationId: string) => void;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (
    data: CreateOrganizationRequest
  ) => Promise<CreateOrganizationResult>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

interface OrganizationProviderProps {
  children: ReactNode;
  initialOrganizations?: OrganizationSummary[];
  initialSelectedId?: string | null;
}

export function OrganizationProvider({
  children,
  initialOrganizations = [],
  initialSelectedId = null,
}: OrganizationProviderProps) {
  const [organizations, setOrganizations] =
    useState<OrganizationSummary[]>(initialOrganizations);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(initialSelectedId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 조직 선택 우선순위: URL 파라미터 > 쿠키 > 기본 조직
  useEffect(() => {
    if (!selectedOrganizationId && organizations.length > 0) {
      // 1. URL 파라미터로 전달된 조직이 있으면 우선 선택
      if (
        initialSelectedId &&
        organizations.some(org => org.id === initialSelectedId)
      ) {
        setSelectedOrganizationId(initialSelectedId);
        setCookieValue(
          ORGANIZATION_COOKIE_KEYS.SELECTED_ORGANIZATION_ID,
          initialSelectedId
        );
        return;
      }

      // 2. 쿠키에서 선택된 조직 ID 복원
      if (typeof window !== 'undefined') {
        const savedOrgId = getCookieValue(
          ORGANIZATION_COOKIE_KEYS.SELECTED_ORGANIZATION_ID
        );
        if (savedOrgId && organizations.some(org => org.id === savedOrgId)) {
          setSelectedOrganizationId(savedOrgId);
          return;
        }
      }

      // 3. 기본 조직 자동 선택
      const defaultOrg = organizations.find(org => org.isDefault);
      if (defaultOrg) {
        selectOrganization(defaultOrg.id);
      }
    }
  }, [organizations, selectedOrganizationId, initialSelectedId]);

  const selectOrganization = (organizationId: string) => {
    // 클라이언트 사이드 권한 검증 (이미 권한 있는 목록에서 선택)
    const organization = organizations.find(org => org.id === organizationId);
    if (!organization) {
      setError('조직을 찾을 수 없습니다.');
      return;
    }

    setSelectedOrganizationId(organizationId);
    setError(null);

    // 쿠키에 저장 (영속성)
    setCookieValue(
      ORGANIZATION_COOKIE_KEYS.SELECTED_ORGANIZATION_ID,
      organizationId
    );
  };

  const refreshOrganizations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedOrganizations = await getUserOrganizationsAction();
      setOrganizations(updatedOrganizations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '조직 목록을 불러오는데 실패했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganization = async (
    data: CreateOrganizationRequest
  ): Promise<CreateOrganizationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createOrganizationAction(data);

      if (result.success && result.organization) {
        // 새로 생성된 조직을 목록에 추가
        const newOrganization: OrganizationSummary = {
          id: result.organization.id,
          name: result.organization.name,
          organizationType: result.organization.organizationType,
          isDefault: result.organization.isDefault,
          role: 'owner',
          createdAt: result.organization.createdAt,
        };

        setOrganizations(prev => [...prev, newOrganization]);

        // 생성된 조직을 자동으로 선택
        selectOrganization(newOrganization.id);
      }

      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '조직 생성에 실패했습니다.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const value: OrganizationContextType = {
    organizations,
    selectedOrganizationId,
    isLoading,
    error,
    selectOrganization,
    refreshOrganizations,
    createOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    );
  }
  return context;
}
