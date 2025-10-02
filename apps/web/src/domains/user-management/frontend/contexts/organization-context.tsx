'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserOrganizationsAction } from '../../actions/user-management.actions';
import { OrganizationSummary } from '../../events';
import { getCookieValue, setCookieValue, ORGANIZATION_COOKIE_KEYS } from '../utils/cookie-helpers';

interface OrganizationContextType {
  // 상태
  organizations: OrganizationSummary[];
  selectedOrganizationId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  selectOrganization: (organizationId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
  initialOrganizations?: OrganizationSummary[];
  initialSelectedId?: string | null;
}

export function OrganizationProvider({ 
  children, 
  initialOrganizations = [],
  initialSelectedId = null 
}: OrganizationProviderProps) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>(initialOrganizations);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(initialSelectedId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 쿠키에서 선택된 조직 ID 복원
  useEffect(() => {
    if (!selectedOrganizationId && typeof window !== 'undefined') {
      const savedOrgId = getCookieValue(ORGANIZATION_COOKIE_KEYS.SELECTED_ORGANIZATION_ID);
      if (savedOrgId && organizations.some(org => org.id.value === savedOrgId)) {
        setSelectedOrganizationId(savedOrgId);
      } else if (organizations.length > 0) {
        // 기본 조직 자동 선택
        const defaultOrg = organizations.find(org => org.isDefault);
        if (defaultOrg) {
          selectOrganization(defaultOrg.id.value);
        }
      }
    }
  }, [organizations, selectedOrganizationId]);

  const selectOrganization = (organizationId: string) => {
    // 클라이언트 사이드 권한 검증 (이미 권한 있는 목록에서 선택)
    const organization = organizations.find(org => org.id.value === organizationId);
    if (!organization) {
      setError('조직을 찾을 수 없습니다.');
      return;
    }

    setSelectedOrganizationId(organizationId);
    setError(null);
    
    // 쿠키에 저장 (영속성)
    setCookieValue(ORGANIZATION_COOKIE_KEYS.SELECTED_ORGANIZATION_ID, organizationId);
  };

  const refreshOrganizations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedOrganizations = await getUserOrganizationsAction();
      setOrganizations(updatedOrganizations);
    } catch (err) {
      setError(err instanceof Error ? err.message : '조직 목록을 불러오는데 실패했습니다.');
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
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
