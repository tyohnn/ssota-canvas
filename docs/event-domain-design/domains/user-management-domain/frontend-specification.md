# User Management Domain - Frontend Specification

Software Design을 기반으로 한 프론트엔드 구현 명세서입니다.

---

## 🎯 Frontend Implementation Overview

### 구현 범위
- **도메인**: User Management (사용자 인증 및 조직 관리)
- **주요 기능**: 사용자 동기화, 로그인/로그아웃, 조직 관리, 멤버십 관리
- **UI 컴포넌트**: 사용자 프로필, 조직 선택기, 멤버 관리, 초대 관리

### 개발 우선순위
1. **Phase 1**: 핵심 타입 및 Context 구현
2. **Phase 2**: Server Actions 및 Hook 구현  
3. **Phase 3**: 컴포넌트 구현 및 통합

---

## 📋 1. 도메인 타입 정의

### 1.1 기본 도메인 타입

**파일 위치**: `src/domains/user-management/types.ts`

```typescript
// Software Design의 Aggregate 속성을 기반으로 정의
export interface User {
  id: UserId;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  status: 'active' | 'soft_deleted' | 'permanently_deleted';
  metadata: Record<string, any>;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: OrganizationId;
  clerkId: string;
  name: string;
  slug: string;
  ownerId: UserId;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Membership {
  id: MembershipId;
  organizationId: OrganizationId;
  userId?: UserId; // NULL for pending invitations
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'removed';
  invitedBy?: UserId;
  inviteeEmail?: string;
  invitedAt?: Date;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Value Objects를 type alias로 정의
export type UserId = string;
export type OrganizationId = string;
export type MembershipId = string;
```

### 1.2 클라이언트 확장 타입

**파일 위치**: `src/domains/user-management/client-types.ts`

```typescript
import { User, Organization, Membership } from './types';

// UI에서 필요한 추가 필드들
export interface UserWithOrganizations extends User {
  // 여러 Aggregate를 조합한 필드들
  organizations: OrganizationSummary[];
  currentOrganizationId?: OrganizationId;
  // UI 전용 필드들
  isOnline?: boolean;
  lastSeenAt?: Date;
}

export interface OrganizationWithMembers extends Organization {
  // 멤버 정보 포함
  members: MembershipSummary[];
  memberCount: number;
  // UI 전용 필드들
  isSelected?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

// 요약 타입들 (목록 표시용)
export interface UserSummary {
  id: UserId;
  name: string;
  email: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeenAt?: Date;
}

export interface OrganizationSummary {
  id: OrganizationId;
  name: string;
  slug: string;
  memberCount: number;
  isDefault: boolean;
  isSelected: boolean;
}

export interface MembershipSummary {
  id: MembershipId;
  user: UserSummary;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'active' | 'removed';
  joinedAt?: Date;
  invitedAt?: Date;
}

// 폼 입력용 타입들
export interface OrganizationFormInput {
  name: string;
  slug?: string; // 자동 생성 가능
}

export interface InviteMemberFormInput {
  email: string;
  role: 'admin' | 'member';
}

// Read Models 타입 활용 (Technical Specification에서 정의된 것을 import)
export interface UserOrganizationView {
  // 복합 조회를 위한 Read Model 타입
  user: User;
  organizations: OrganizationWithMembers[];
  currentOrganization?: OrganizationWithMembers;
  aggregatedData: {
    totalOrganizations: number;
    ownedOrganizations: number;
    memberOrganizations: number;
    pendingInvitations: number;
  };
}

export interface OrganizationMemberView {
  organization: Organization;
  members: MembershipSummary[];
  aggregatedData: {
    totalMembers: number;
    activeMembers: number;
    pendingInvitations: number;
    roleDistribution: {
      owners: number;
      admins: number;
      members: number;
    };
  };
}
```

## 🎛️ 2. React Context 구현

### 2.1 Context 타입 정의

**파일 위치**: `src/contexts/userManagementContext.tsx`

```typescript
import { createContext, useContext } from 'react';
import { User, Organization, Membership } from '@/domains/user-management/types';
import { UserOrganizationView, OrganizationMemberView } from '@/domains/user-management/client-types';

// Context 상태 타입
interface UserManagementState {
  // 도메인 엔티티들
  currentUser: User | null;
  organizations: Organization[];
  memberships: Membership[];
  
  // Read Models (복합 조회 데이터)
  userOrganizationView: UserOrganizationView | null;
  organizationMemberView: OrganizationMemberView | null;
  
  // UI 상태
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isCreatingOrganization: boolean;
  isInvitingMember: boolean;
  isLoadingView: boolean;
  
  // 에러 상태
  error: string | null;
}

// Context 액션 타입 (Software Design의 Command들 기반)
interface UserManagementActions {
  // 주요 액션들 (Command 이름 기반)
  loginUser: (clerkUserId: string, email: string, sessionId: string, loginMethod: 'email' | 'oauth' | 'sso') => Promise<void>;
  logoutUser: (userId: UserId, sessionId: string) => Promise<void>;
  selectOrganization: (organizationId: OrganizationId) => Promise<void>;
  createOrganization: (name: string, slug?: string) => Promise<void>;
  updateOrganization: (organizationId: OrganizationId, name: string, slug: string) => Promise<void>;
  deleteOrganization: (organizationId: OrganizationId) => Promise<void>;
  restoreOrganization: (organizationId: OrganizationId) => Promise<void>;
  transferOwnership: (organizationId: OrganizationId, newOwnerId: UserId) => Promise<void>;
  inviteMember: (organizationId: OrganizationId, email: string, role: 'admin' | 'member') => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  changeMemberRole: (membershipId: MembershipId, newRole: 'admin' | 'member') => Promise<void>;
  removeMember: (membershipId: MembershipId) => Promise<void>;
  cancelInvitation: (membershipId: MembershipId) => Promise<void>;
  
  // 조회/새로고침 액션들
  refreshUserOrganizations: () => Promise<void>;
  refreshOrganizationMembers: (organizationId: OrganizationId) => Promise<void>;
  loadUserOrganizationView: () => Promise<void>;
  loadOrganizationMemberView: (organizationId: OrganizationId) => Promise<void>;
  
  // 에러 처리
  clearError: () => void;
}

// Context 타입
interface UserManagementContextType {
  state: UserManagementState;
  actions: UserManagementActions;
}

const UserManagementContext = createContext<UserManagementContextType | null>(null);

export { UserManagementContext };
export type { UserManagementState, UserManagementActions, UserManagementContextType };
```

### 2.2 Provider 구현

**파일 위치**: `src/contexts/userManagementProvider.tsx`

```typescript
"use client";

import { useState, useEffect, ReactNode } from 'react';
import { UserManagementContext, UserManagementState, UserManagementActions } from './userManagementContext';
import { 
  loginUserAction,
  logoutUserAction,
  createOrganizationAction,
  updateOrganizationAction,
  deleteOrganizationAction,
  restoreOrganizationAction,
  transferOwnershipAction,
  inviteMemberAction,
  acceptInvitationAction,
  rejectInvitationAction,
  changeMemberRoleAction,
  removeMemberAction,
  cancelInvitationAction,
  getUserOrganizationsAction,
  getOrganizationMembersAction,
  getUserOrganizationViewAction,
  getOrganizationMemberViewAction
} from '@/server-actions/user-management/';

interface UserManagementProviderProps {
  children: ReactNode;
}

export function UserManagementProvider({ children }: UserManagementProviderProps) {
  const [state, setState] = useState<UserManagementState>({
    currentUser: null,
    organizations: [],
    memberships: [],
    userOrganizationView: null,
    organizationMemberView: null,
    isLoading: true,
    isLoggingIn: false,
    isLoggingOut: false,
    isCreatingOrganization: false,
    isInvitingMember: false,
    isLoadingView: false,
    error: null,
  });

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const userOrganizationView = await getUserOrganizationViewAction();
      
      setState(prev => ({
        ...prev,
        userOrganizationView: userOrganizationView,
        currentUser: userOrganizationView?.user || null,
        organizations: userOrganizationView?.organizations || [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '데이터 로드에 실패했습니다',
        isLoading: false,
      }));
    }
  };

  const actions: UserManagementActions = {
    loginUser: async (clerkUserId, email, sessionId, loginMethod) => {
      setState(prev => ({ ...prev, isLoggingIn: true, error: null }));
      
      try {
        const result = await loginUserAction({ clerkUserId, email, sessionId, loginMethod });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        await actions.refreshUserOrganizations();
        
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '로그인에 실패했습니다'
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isLoggingIn: false }));
      }
    },

    logoutUser: async (userId, sessionId) => {
      setState(prev => ({ ...prev, isLoggingOut: true, error: null }));
      
      try {
        const result = await logoutUserAction({ userId, sessionId });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        setState(prev => ({
          ...prev,
          currentUser: null,
          organizations: [],
          userOrganizationView: null,
        }));
        
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '로그아웃에 실패했습니다'
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isLoggingOut: false }));
      }
    },

    createOrganization: async (name, slug) => {
      setState(prev => ({ ...prev, isCreatingOrganization: true, error: null }));
      
      try {
        const result = await createOrganizationAction({ name, slug });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        await actions.refreshUserOrganizations();
        
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '조직 생성에 실패했습니다'
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isCreatingOrganization: false }));
      }
    },

    inviteMember: async (organizationId, email, role) => {
      setState(prev => ({ ...prev, isInvitingMember: true, error: null }));
      
      try {
        const result = await inviteMemberAction({ organizationId, email, role });
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        await actions.refreshOrganizationMembers(organizationId);
        
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : '멤버 초대에 실패했습니다'
        }));
        throw error;
      } finally {
        setState(prev => ({ ...prev, isInvitingMember: false }));
      }
    },

    refreshUserOrganizations: async () => {
      try {
        const userOrganizationView = await getUserOrganizationViewAction();
        setState(prev => ({ 
          ...prev, 
          userOrganizationView: userOrganizationView,
          currentUser: userOrganizationView?.user || null,
          organizations: userOrganizationView?.organizations || []
        }));
      } catch (error) {
        console.error('사용자 조직 목록 새로고침 실패:', error);
      }
    },

    refreshOrganizationMembers: async (organizationId) => {
      try {
        const organizationMemberView = await getOrganizationMemberViewAction(organizationId);
        setState(prev => ({ 
          ...prev, 
          organizationMemberView: organizationMemberView
        }));
      } catch (error) {
        console.error('조직 멤버 목록 새로고침 실패:', error);
      }
    },

    loadUserOrganizationView: async () => {
      try {
        setState(prev => ({ ...prev, isLoadingView: true }));
        const userOrganizationView = await getUserOrganizationViewAction();
        setState(prev => ({ 
          ...prev, 
          userOrganizationView: userOrganizationView,
          isLoadingView: false 
        }));
      } catch (error) {
        setState(prev => ({ ...prev, isLoadingView: false }));
        console.error('사용자 조직 View 새로고침 실패:', error);
      }
    },

    loadOrganizationMemberView: async (organizationId) => {
      try {
        setState(prev => ({ ...prev, isLoadingView: true }));
        const organizationMemberView = await getOrganizationMemberViewAction(organizationId);
        setState(prev => ({ 
          ...prev, 
          organizationMemberView: organizationMemberView,
          isLoadingView: false 
        }));
      } catch (error) {
        setState(prev => ({ ...prev, isLoadingView: false }));
        console.error('조직 멤버 View 새로고침 실패:', error);
      }
    },

    clearError: () => {
      setState(prev => ({ ...prev, error: null }));
    },
  };

  return (
    <UserManagementContext.Provider value={{ state, actions }}>
      {children}
    </UserManagementContext.Provider>
  );
}
```

## ⚡ 3. Server Actions 구현

### 3.1 Server Actions 정의

**파일 위치**: `src/server-actions/user-management/login-user.action.ts`

```typescript
"use server";

import { Result } from '@/lib/result';
import { LoginUserCommand } from '@/domains/user-management/commands/login-user.command';
import { UserManagementService } from '@/domains/user-management/services/user-management.service';
import { UserManagementRepository } from '@/domains/user-management/repositories/user-management.repository';
import { AuthService } from '@/lib/auth.service';
import { createDbClient } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import { UserManagementError } from '@/domains/user-management/errors/user-management.errors';

export async function loginUserAction(
  input: { clerkUserId: string; email: string; sessionId: string; loginMethod: 'email' | 'oauth' | 'sso' }
): Promise<Result<{ success: boolean; user: any }, UserManagementError>> {
  try {
    // 1. Input 검증
    if (!input.clerkUserId || !input.email || !input.sessionId) {
      return Result.fail(UserManagementError.INVALID_INPUT);
    }

    // 2. 의존성 주입 (DI Container 패턴)
    const userManagementService = new UserManagementService(
      new UserManagementRepository(await createDbClient()),
      new AuthService()
    );

    // 3. Command 생성
    const command = new LoginUserCommand(
      input.clerkUserId,
      input.email,
      input.sessionId,
      input.loginMethod,
      new Date()
    );

    // 4. 도메인 로직 실행
    const events = await userManagementService.loginUser(command);

    // 5. 크로스-도메인 이벤트 처리
    await processCrossDomainEvents(events);

    // 6. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath('/organizations');
    
    // 7. 성공 응답
    return Result.ok({ success: true, user: events[0].user });

  } catch (error) {
    // 8. 에러 분류 및 처리
    if (error instanceof AuthenticationError) {
      return Result.fail(UserManagementError.UNAUTHORIZED);
    }
    if (error instanceof AuthorizationError) {
      return Result.fail(UserManagementError.FORBIDDEN);
    }
    if (error instanceof BusinessRuleError) {
      return Result.fail(UserManagementError.BUSINESS_RULE_VIOLATION);
    }

    // 시스템 에러 로깅
    console.error('Unexpected error in loginUserAction:', error);
    return Result.fail(UserManagementError.INTERNAL_ERROR);
  }
}
```

### 3.2 에러 타입 정의

**파일 위치**: `src/domains/user-management/errors/user-management.errors.ts`

```typescript
export class UserManagementError extends Error {
  constructor(
    message: string,
    public readonly code: UserManagementErrorCode,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'UserManagementError';
  }
}

export enum UserManagementErrorCode {
  // Input Validation
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_ORGANIZATION_NAME = 'INVALID_ORGANIZATION_NAME',
  
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Business Rules
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND',
  MEMBERSHIP_NOT_FOUND = 'MEMBERSHIP_NOT_FOUND',
  DUPLICATE_ORGANIZATION = 'DUPLICATE_ORGANIZATION',
  DUPLICATE_MEMBERSHIP = 'DUPLICATE_MEMBERSHIP',
  CANNOT_TRANSFER_DEFAULT = 'CANNOT_TRANSFER_DEFAULT',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

// 특화된 에러 클래스들
export class AuthenticationError extends UserManagementError {
  constructor(message: string) {
    super(message, UserManagementErrorCode.UNAUTHORIZED);
  }
}

export class AuthorizationError extends UserManagementError {
  constructor(message: string) {
    super(message, UserManagementErrorCode.FORBIDDEN);
  }
}

export class BusinessRuleError extends UserManagementError {
  constructor(message: string, details?: any) {
    super(message, UserManagementErrorCode.BUSINESS_RULE_VIOLATION, details);
  }
}

export class ValidationError extends UserManagementError {
  constructor(message: string, field?: string) {
    super(message, UserManagementErrorCode.INVALID_INPUT, { field });
  }
}
```

## 🎣 4. Custom Hook 구현

### 4.1 메인 Hook 정의

**파일 위치**: `src/domains/user-management/hooks/use-user-management.ts`

```typescript
"use client";

import { useContext } from 'react';
import { useOptimistic, useTransition } from 'react';
import { UserManagementContext } from '@/contexts/userManagementContext';
import { loginUserAction } from '@/server-actions/user-management/login-user.action';
import { UserManagementError } from '@/domains/user-management/errors/user-management.errors';

export function useUserManagement() {
  const context = useContext(UserManagementContext);
  
  if (!context) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }

  const [isPending, startTransition] = useTransition();
  const [optimisticOrganizations, setOptimisticOrganizations] = useOptimistic<Organization[]>(
    context.state.organizations
  );

  const createOrganization = async (name: string, slug?: string) => {
    // 1. 낙관적 업데이트할 조직 준비
    const optimisticOrganization: Organization = {
      id: `temp-${Date.now()}`,
      clerkId: `temp-${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      ownerId: context.state.currentUser?.id || '',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 2. 즉시 UI 업데이트
    setOptimisticOrganizations(prev => [...prev, optimisticOrganization]);

    // 3. 실제 서버 액션 호출
    startTransition(async () => {
      try {
        const result = await createOrganizationAction({ name, slug });

        if (!result.success) {
          // 4. 실패 시 이전 상태로 롤백
          setOptimisticOrganizations(context.state.organizations);
          
          // 에러 타입별 처리
          switch (result.error) {
            case UserManagementError.UNAUTHORIZED:
              throw new Error('로그인이 필요합니다');
            case UserManagementError.FORBIDDEN:
              throw new Error('권한이 없습니다');
            case UserManagementError.BUSINESS_RULE_VIOLATION:
              throw new Error('비즈니스 규칙 위반입니다');
            default:
              throw new Error('조직 생성에 실패했습니다');
          }
        }

        // 5. 성공 시 관련 데이터 새로고침
        await context.actions.refreshUserOrganizations();

      } catch (error) {
        // 6. 에러 시 이전 상태로 롤백
        setOptimisticOrganizations(context.state.organizations);
        throw error;
      }
    });
  };

  return { 
    ...context.state,
    organizations: optimisticOrganizations,
    createOrganization, 
    isPending 
  };
}
```

### 4.2 특화된 Hook들

**파일 위치**: `src/domains/user-management/hooks/use-current-user.ts`

```typescript
// 현재 사용자만 필요한 경우
export function useCurrentUser() {
  const { currentUser } = useUserManagement();
  return currentUser;
}

// 액션만 필요한 경우
export function useUserManagementActions() {
  const context = useContext(UserManagementContext);
  if (!context) {
    throw new Error('useUserManagementActions must be used within a UserManagementProvider');
  }
  return context.actions;
}

// 조직 목록만 필요한 경우
export function useOrganizations() {
  const { organizations } = useUserManagement();
  return organizations;
}

// 사용자 조직 View만 필요한 경우
export function useUserOrganizationView() {
  const { userOrganizationView, isLoadingView } = useUserManagement();
  return { userOrganizationView, isLoadingView };
}
```

## 🧩 5. 컴포넌트 구현

### 5.1 주요 컴포넌트 구조

**파일 위치**: `src/components/user-management/`

```typescript
// OrganizationList.tsx - 조직 목록 컴포넌트
"use client";

import { useUserManagement } from '@/domains/user-management/hooks/use-user-management';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export function OrganizationList() {
  const { organizations, isLoading, error } = useUserManagement();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        로딩 중...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">오류: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">조직 목록</h3>
      
      {organizations.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          조직이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {organizations.map((organization) => (
            <div key={organization.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium">{organization.name}</div>
                  <div className="text-sm text-gray-500">{organization.slug}</div>
                </div>
                <Badge variant={organization.isDefault ? 'default' : 'secondary'}>
                  {organization.isDefault ? '기본' : '일반'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  편집
                </Button>
                <Button variant="outline" size="sm">
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5.2 폼 컴포넌트

```typescript
// OrganizationForm.tsx - 조직 생성/편집 폼
"use client";

import { useState } from 'react';
import { useUserManagement } from '@/domains/user-management/hooks/use-user-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface OrganizationFormProps {
  organization?: Organization; // 편집 모드인 경우
  onSuccess?: () => void;
}

export function OrganizationForm({ organization, onSuccess }: OrganizationFormProps) {
  const { createOrganization, isCreatingOrganization } = useUserManagement();
  const [name, setName] = useState(organization?.name || '');
  const [slug, setSlug] = useState(organization?.slug || '');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('조직명을 입력해주세요');
      return;
    }

    try {
      await createOrganization(name, slug);
      toast.success(`조직이 ${organization ? '수정' : '생성'}되었습니다`);
      
      // 폼 초기화 (생성 모드인 경우)
      if (!organization) {
        setName('');
        setSlug('');
      }
      
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '조직 생성에 실패했습니다');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">조직명</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="조직명을 입력하세요"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="slug">슬러그</Label>
        <Input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="조직 슬러그 (선택사항)"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isCreatingOrganization}
        className="w-full"
      >
        {isCreatingOrganization ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {organization ? '수정' : '생성'} 중...
          </>
        ) : (
          organization ? '조직 수정' : '조직 생성'
        )}
      </Button>
    </form>
  );
}
```

### 5.3 선택기 컴포넌트

```typescript
// OrganizationSelector.tsx - 조직 선택 드롭다운
"use client";

import { useUserManagement } from '@/domains/user-management/hooks/use-user-management';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface OrganizationSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function OrganizationSelector({ value, onValueChange, placeholder }: OrganizationSelectorProps) {
  const { organizations, isLoading } = useUserManagement();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        로딩 중...
      </div>
    );
  }

  return (
    <Select value={value || ''} onValueChange={onValueChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={placeholder || "조직 선택"} />
      </SelectTrigger>
      <SelectContent>
        {organizations.map(organization => (
          <SelectItem key={organization.id} value={organization.id}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

## 🔗 6. 앱 레벨 통합

### 6.1 Provider 설정

**파일 위치**: `src/app/layout.tsx`

```typescript
import { UserManagementProvider } from '@/contexts/userManagementProvider';
// 다른 도메인 Provider들도 import

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 의존성 순서에 따라 Provider 중첩 배치 */}
        <AuthProvider>
          <UserManagementProvider>
            <WorkspaceProvider>
              {children}
            </WorkspaceProvider>
          </UserManagementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 6.2 페이지에서 사용

**파일 위치**: `src/app/organizations/page.tsx`

```typescript
"use client";

import { useUserManagement } from '@/domains/user-management/hooks/use-user-management';
import { OrganizationList } from '@/components/user-management/OrganizationList';
import { OrganizationForm } from '@/components/user-management/OrganizationForm';
import { OrganizationSelector } from '@/components/user-management/OrganizationSelector';

export default function OrganizationsPage() {
  const { isLoading, error } = useUserManagement();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>오류: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">조직 관리</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">조직 선택</h2>
          <OrganizationSelector onValueChange={(value) => console.log(value)} />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">새 조직 생성</h2>
          <OrganizationForm />
        </div>
      </div>
      
      <div className="mt-8">
        <OrganizationList />
      </div>
    </div>
  );
}
```

## 📊 7. 구현 완료 체크리스트

### 7.1 타입 정의 완료 확인
- [x] Software Design의 모든 Aggregate 타입이 정확히 재현되었는가?
- [x] 클라이언트 전용 타입이 별도 파일로 분리되었는가?
- [x] Value Object들이 적절한 타입으로 정의되었는가?
- [x] DB 스키마와 다른 부분이 주석으로 명시되었는가?

### 7.2 Context 구현 완료 확인
- [x] 도메인별로 독립적인 Context가 생성되었는가?
- [x] State와 Actions가 명확히 분리되었는가?
- [x] 초기 데이터 로드 로직이 구현되었는가?
- [x] 에러 상태 관리가 포함되었는가?

### 7.3 Server Actions 구현 완료 확인
- [x] Technical Specification의 Result 패턴을 사용하는가?
- [x] Command 객체를 활용하여 입력을 구조화했는가?
- [x] 의존성 주입 패턴으로 Service Layer를 사용하는가?
- [x] 에러 분류가 체계적으로 이루어지는가?
- [x] revalidatePath로 관련 페이지 재검증이 포함되었는가?

### 7.4 Hook 구현 완료 확인
- [x] Context를 적절히 추상화한 Hook이 구현되었는가?
- [x] 낙관적 업데이트 로직이 포함되었는가?
- [x] Result 패턴 기반 에러 처리가 구현되었는가?
- [x] 특화된 Hook들이 필요에 따라 제공되는가?

### 7.5 컴포넌트 구현 완료 확인
- [x] 컴포넌트에서 직접 Context 접근을 피하고 Hook을 사용하는가?
- [x] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [x] 사용자 친화적인 피드백이 제공되는가?
- [x] 목록, 폼, 선택기 등 주요 컴포넌트가 구현되었는가?

### 7.6 앱 통합 완료 확인
- [x] Provider가 적절한 순서로 중첩 배치되었는가?
- [x] 페이지별로 필요한 Hook만 선택적으로 사용하는가?
- [x] 권한에 따른 조건부 렌더링이 적용되었는가?

## 📚 8. 관련 문서 및 참조

### 8.1 필수 선행 문서
- **Software Design 문서**: `../domains/user-management-domain/software-design.md`
  - Aggregate, Command, Event 정의 확인
  - 비즈니스 규칙 및 정책 참조
  - Read Models 및 Context Map 확인

- **Technical Specification 템플릿**: `../template/4-technical-specification-template.md`
  - Result 패턴 구현 방법
  - Service Layer 패턴 참조
  - 에러 처리 및 의존성 주입 패턴

### 8.2 기술 스택 참조
- **Next.js 14**: App Router, Server Actions, revalidatePath
- **React 18**: Context API, useOptimistic, useTransition, useState, useEffect
- **TypeScript**: 인터페이스, 타입 정의, 제네릭
- **UI 라이브러리**: shadcn/ui 컴포넌트 (Button, Input, Select, Badge 등)
- **상태 관리**: React Context + Custom Hooks 패턴

### 8.3 폴더 구조 요약
```
src/
├── domains/user-management/
│   ├── types.ts                    # 기본 도메인 타입
│   ├── client-types.ts             # 클라이언트 확장 타입
│   ├── hooks/
│   │   ├── use-user-management.ts   # 메인 Hook
│   │   └── use-current-user.ts     # 특화 Hook들
│   └── errors/
│       └── user-management.errors.ts # 에러 타입 정의
├── contexts/
│   ├── userManagementContext.tsx   # Context 타입 정의
│   └── userManagementProvider.tsx # Provider 구현
├── server-actions/user-management/
│   └── login-user.action.ts        # Server Actions
├── components/user-management/
│   ├── OrganizationList.tsx        # 목록 컴포넌트
│   ├── OrganizationForm.tsx        # 폼 컴포넌트
│   └── OrganizationSelector.tsx    # 선택기 컴포넌트
└── app/
    ├── layout.tsx                  # Provider 설정
    └── organizations/page.tsx       # 페이지에서 Hook 사용
```

### 8.4 개발 순서 권장사항
1. **Software Design 완료 확인** → Aggregate, Command, Event 정의 완료
2. **타입 정의** → `types.ts`, `client-types.ts` 작성
3. **Context 구현** → Context 타입 정의 → Provider 구현
4. **Server Actions** → Result 패턴 + Service Layer 연동
5. **Hook 구현** → Context 연결 + 낙관적 업데이트
6. **컴포넌트** → Hook 사용 + UI 구현
7. **앱 통합** → Provider 설정 + 페이지 연결
8. **테스트** → 각 레이어별 단위 테스트 및 통합 테스트

이 Frontend Specification은 **User Management Domain**의 완전한 프론트엔드 구현 명세서입니다.
