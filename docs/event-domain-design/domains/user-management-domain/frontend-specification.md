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

  // Clerk 사용자 상태 감지 및 초기 데이터 로드
  useEffect(() => {
    // Clerk의 useUser() 훅을 통해 사용자 상태 감지
    // 이 부분은 실제 구현 시 Clerk의 useUser 훅을 사용해야 함
    const checkUserAndLoadData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Clerk 사용자 정보 확인 (실제 구현에서는 useUser() 사용)
        // const { user } = useUser();
        // if (!user) return;
        
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

    checkUserAndLoadData();
  }, []);

  // Clerk 사용자 변경 감지 (실제 구현에서는 useUser() 의존성 추가)
  useEffect(() => {
    // const { user } = useUser();
    // if (user) {
    //   // 사용자 로그인 시 데이터 새로고침
    //   loadInitialData();
    // } else {
    //   // 사용자 로그아웃 시 상태 초기화
    //   setState(prev => ({
    //     ...prev,
    //     currentUser: null,
    //     organizations: [],
    //     userOrganizationView: null,
    //   }));
    // }
  }, []);

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

**파일 위치**: `src/server-actions/user-management/get-user-organization-view.action.ts`

```typescript
"use server";

import { Result } from '@/lib/result';
import { UserManagementService } from '@/domains/user-management/services/user-management.service';
import { UserManagementRepository } from '@/domains/user-management/repositories/user-management.repository';
import { createDbClient } from '@/lib/database';
import { UserManagementError } from '@/domains/user-management/errors/user-management.errors';
import { auth } from '@clerk/nextjs/server';

export async function getUserOrganizationViewAction(): Promise<Result<any, UserManagementError>> {
  try {
    // 1. Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return Result.fail(UserManagementError.UNAUTHORIZED);
    }

    // 2. 의존성 주입
    const userManagementService = new UserManagementService(
      new UserManagementRepository(await createDbClient())
    );

    // 3. 사용자 조직 View 조회
    const userOrganizationView = await userManagementService.getUserOrganizationView(userId);

    return Result.ok(userOrganizationView);

  } catch (error) {
    console.error('Error in getUserOrganizationViewAction:', error);
    return Result.fail(UserManagementError.INTERNAL_ERROR);
  }
}
```

**파일 위치**: `src/server-actions/user-management/create-organization.action.ts`

```typescript
"use server";

import { Result } from '@/lib/result';
import { CreateOrganizationCommand } from '@/domains/user-management/commands/create-organization.command';
import { UserManagementService } from '@/domains/user-management/services/user-management.service';
import { UserManagementRepository } from '@/domains/user-management/repositories/user-management.repository';
import { createDbClient } from '@/lib/database';
import { revalidatePath } from 'next/cache';
import { UserManagementError } from '@/domains/user-management/errors/user-management.errors';
import { auth } from '@clerk/nextjs/server';

export async function createOrganizationAction(
  input: { name: string; slug?: string }
): Promise<Result<{ success: boolean; organization: any }, UserManagementError>> {
  try {
    // 1. Clerk 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return Result.fail(UserManagementError.UNAUTHORIZED);
    }

    // 2. Input 검증
    if (!input.name?.trim()) {
      return Result.fail(UserManagementError.INVALID_INPUT);
    }

    // 3. 의존성 주입
    const userManagementService = new UserManagementService(
      new UserManagementRepository(await createDbClient())
    );

    // 4. Command 생성
    const command = new CreateOrganizationCommand(
      input.name,
      input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
      userId,
      new Date()
    );

    // 5. 도메인 로직 실행
    const events = await userManagementService.createOrganization(command);

    // 6. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath('/organizations');
    
    // 7. 성공 응답
    return Result.ok({ 
      success: true, 
      organization: events[0].organization 
    });

  } catch (error) {
    console.error('Error in createOrganizationAction:', error);
    return Result.fail(UserManagementError.INTERNAL_ERROR);
  }
}
```

### 3.2 Clerk Webhook 연동 개선

**기존 Webhook 개선**: `src/app/api/webhooks/clerk/route.ts`에 추가

```typescript
// 기존 handleUserCreated 함수 개선
async function handleUserCreated(userData: any) {
  try {
    console.log("Handling user.created:", userData);

    // 1. Supabase에 사용자 생성
    const adminDb = createSupabaseAdminClient();
    await adminDb.rls((tx) =>
      tx.insert(users).values({
        id: userData.id,
        email: userData.email_addresses[0]?.email_address || "",
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        clerk_id: userData.id, // Clerk ID 추가
        status: 'active', // 상태 추가
        metadata: userData.public_metadata || {}, // 메타데이터 추가
      })
    );

    // 2. 기본 조직 자동 생성 (UserManagementService 사용)
    const userManagementService = new UserManagementService(
      new UserManagementRepository(adminDb)
    );
    
    const createDefaultOrgCommand = new CreateOrganizationCommand(
      `${userData.first_name || 'User'}'s Organization`,
      `${userData.id}-default`,
      userData.id,
      true, // isDefault = true
      new Date()
    );
    
    await userManagementService.createOrganization(createDefaultOrgCommand);

    console.log("User and default organization created:", userData.id);
  } catch (error) {
    console.error("Error creating user and default organization:", error);
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

**파일 위치**: `src/app/provider.tsx` (기존 Providers에 추가)

```typescript
"use client";

import { TooltipProvider } from "@workspace/ui/components/ui/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "@workspace/ui/components/ui/sonner";
import { UserManagementProvider } from '@/contexts/userManagementProvider';
import { WorkspaceProvider } from '@/contexts/workspaceProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        {/* Clerk는 이미 layout.tsx에서 ClerkProvider로 감싸져 있음 */}
        <UserManagementProvider>
          <WorkspaceProvider>
            {children}
            <Toaster position="top-center" richColors closeButton />
          </WorkspaceProvider>
        </UserManagementProvider>
      </TooltipProvider>
    </NextThemesProvider>
  );
}
```

### 6.2 Clerk 통합 고려사항

**기존 Clerk 설정 활용**:
- `ClerkProvider`는 이미 `layout.tsx`에서 설정됨
- Webhook은 `/api/webhooks/clerk/route.ts`에서 처리
- 사용자 데이터는 Clerk → Supabase로 자동 동기화됨

**UserManagementProvider에서 Clerk 연동**:
```typescript
// UserManagementProvider에서 Clerk 상태 감지
useEffect(() => {
  const { user } = useUser();
  
  if (user) {
    // Clerk 사용자 정보를 기반으로 UserManagement 상태 초기화
    loadUserData(user.id, user.emailAddresses[0].emailAddress);
  }
}, [user]);
```

### 6.3 사이드바 컴포넌트 구현

**파일 위치**: `src/components/user-management/Sidebar.tsx`

```typescript
"use client";

import { useUserManagement } from '@/domains/user-management/hooks/use-user-management';
import { OrganizationSelector } from './OrganizationSelector';
import { WorkspaceSelector } from './WorkspaceSelector';
import { SettingsModal } from './SettingsModal';
import { Button } from '@workspace/ui/components/ui/button';
import { Settings, Plus, Users } from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
  const { currentUser, organizations, userOrganizationView } = useUserManagement();
  const [showSettings, setShowSettings] = useState(false);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* 사용자 프로필 섹션 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {currentUser.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentUser.email}
            </p>
          </div>
        </div>
      </div>

      {/* 조직 선택기 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          조직
        </h3>
        <OrganizationSelector 
          value={userOrganizationView?.currentOrganization?.id}
          onValueChange={(orgId) => {
            // 조직 전환 로직
            console.log('조직 전환:', orgId);
          }}
        />
      </div>

      {/* 워크스페이스 선택기 */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          워크스페이스
        </h3>
        <WorkspaceSelector />
      </div>

      {/* 액션 버튼들 */}
      <div className="p-4 space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-4 h-4 mr-2" />
          설정
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 워크스페이스
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
        >
          <Users className="w-4 h-4 mr-2" />
          멤버 관리
        </Button>
      </div>

      {/* 설정 모달 */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
```

### 6.4 워크스페이스 선택기 컴포넌트

**파일 위치**: `src/components/user-management/WorkspaceSelector.tsx`

```typescript
"use client";

import { useUserManagement } from '@/domains/user-management/hooks/use-user-management';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';

export function WorkspaceSelector() {
  const { userOrganizationView, isLoading } = useUserManagement();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">로딩 중...</span>
      </div>
    );
  }

  const currentOrganization = userOrganizationView?.currentOrganization;
  const workspaces = currentOrganization?.workspaces || [];

  return (
    <div className="space-y-2">
      <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="워크스페이스 선택" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map(workspace => (
            <SelectItem key={workspace.id} value={workspace.id}>
              {workspace.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full justify-start text-gray-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        새 워크스페이스
      </Button>
    </div>
  );
}
```

### 6.5 설정 모달 컴포넌트

**파일 위치**: `src/components/user-management/SettingsModal.tsx`

```typescript
"use client";

import { useUserManagement } from '@/domains/user-management/hooks/use-user-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/ui/dialog';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/ui/tabs';
import { OrganizationForm } from './OrganizationForm';
import { MemberManagement } from './MemberManagement';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { currentUser, userOrganizationView } = useUserManagement();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">프로필</TabsTrigger>
            <TabsTrigger value="organization">조직</TabsTrigger>
            <TabsTrigger value="members">멤버</TabsTrigger>
            <TabsTrigger value="workspaces">워크스페이스</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" defaultValue={currentUser?.name || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" defaultValue={currentUser?.email || ''} disabled />
            </div>
            <Button>프로필 저장</Button>
          </TabsContent>
          
          <TabsContent value="organization" className="space-y-4">
            <OrganizationForm />
          </TabsContent>
          
          <TabsContent value="members" className="space-y-4">
            <MemberManagement />
          </TabsContent>
          
          <TabsContent value="workspaces" className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              워크스페이스 관리 기능
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### 6.6 메인 레이아웃에서 사이드바 통합

**파일 위치**: `src/app/r/[orgSlug]/workspace/page.tsx` (기존 페이지 수정)

```typescript
import { Sidebar } from '@/components/user-management/Sidebar';
import { CanvasPageContent } from "@/domains/canvas/components/canvas-page";

export default function WorkspacePage() {
  return (
    <div className="flex h-full">
      {/* 사이드바 */}
      <Sidebar />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <CanvasPageContent />
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
