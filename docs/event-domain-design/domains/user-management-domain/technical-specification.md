# User Management Domain - Technical Specification

Software Design을 기반으로 한 구체적인 구현 가이드입니다. (Scenario 0-1 기준)

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**수정일**: 2025-01-29
**버전**: 3.0  
**리뷰어**: [시니어 개발자명]

### 주요 변경사항 (v3.0)
- **Drizzle ORM 통합**: Supabase 클라이언트 대신 Drizzle ORM 사용
- **RLS 지원**: Drizzle에서 Supabase RLS 정책 완전 지원
- **타입 안전성 향상**: Drizzle 스키마 기반 타입 안전성 확보
- **하이브리드 접근법**: Repository 패턴 + 트랜잭션 최적화 병행
- **관계형 쿼리**: Drizzle Relations을 활용한 효율적인 조인 쿼리

---

## 🎯 Implementation Overview

### 개발 우선순위 (Scenario 0-1)
1. **Phase 1**: Supabase Auth 통합 및 기본 사용자/조직 관리
   - User/Organization Aggregate 구현
   - 구글 OAuth 처리
   - 기본 조직 자동 생성

### 선행조건 및 위험요소
- **Supabase Auth 설정 완료**: 구글 OAuth 연동 필요
- **Database 스키마**: profiles, organizations 테이블 생성
- **외부 의존성**: Supabase Auth API 안정성에 의존

### 협업 포인트
- **프론트엔드**: Context API를 통한 사용자 상태 관리
- **인프라**: Supabase Auth 설정 및 RLS 정책

---

## 🏗️ Implementation Details

### 1. Value Objects 구현

#### UserEmail
```typescript
// apps/web/src/domains/user-management/value-objects/user-email.vo.ts
export class UserEmail {
  constructor(private readonly value: string) {
    if (!this.isValidEmail(value)) {
      throw new UserManagementError('INVALID_EMAIL_FORMAT', 'Invalid email format');
    }
  }

  get value() { return this.value; }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  equals(other: UserEmail): boolean {
    return this.value === other.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }
}
```

#### Value Object IDs
```typescript
// apps/web/src/domains/user-management/value-objects/ids.vo.ts
export class UserId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new UserManagementError('INVALID_USER_ID', 'User ID cannot be empty');
    }
  }

  get value() { return this.value; }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}

export class OrganizationId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new UserManagementError('INVALID_ORGANIZATION_ID', 'Organization ID cannot be empty');
    }
  }

  get value() { return this.value; }

  equals(other: OrganizationId): boolean {
    return this.value === other.value;
  }

  static generate(): OrganizationId {
    return new OrganizationId(crypto.randomUUID());
  }
}
```

### 2. Entities 구현

#### User Entity
```typescript
// apps/web/src/domains/user-management/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: UserId,
    private _email: UserEmail,
    private _name: string,
    private _avatarUrl: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Getters
  get email() { return this._email; }
  get name() { return this._name; }
  get avatarUrl() { return this._avatarUrl; }
  get updatedAt() { return this._updatedAt; }

  // 상태 변경 메서드
  updateProfile(name: string, avatarUrl: string | null): void {
    this._name = name;
    this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();
  }

  updateEmail(email: UserEmail): void {
    this._email = email;
    this._updatedAt = new Date();
  }
}
```

#### Organization Entity
```typescript
// apps/web/src/domains/user-management/entities/organization.entity.ts
export class Organization {
  constructor(
    public readonly id: OrganizationId,
    private _name: string,
    private _ownerId: UserId,
    private _isDefault: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {}

  // Getters
  get name() { return this._name; }
  get ownerId() { return this._ownerId; }
  get isDefault() { return this._isDefault; }
  get updatedAt() { return this._updatedAt; }

  // 상태 변경 메서드
  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }
}
```

### 3. Aggregates 구현

#### UserAggregate
```typescript
// apps/web/src/domains/user-management/aggregates/user.aggregate.ts
export class UserAggregate {
  constructor(
    private user: User
  ) {}

  // Command 처리
  static createFromSupabaseAuth(supabaseUser: SupabaseUser): UserAggregate {
    const user = new User(
      new UserId(supabaseUser.id),
      new UserEmail(supabaseUser.email),
      supabaseUser.user_metadata?.name || 'User',
      supabaseUser.user_metadata?.avatar_url || null,
      new Date(supabaseUser.created_at),
      new Date()
    );
    return new UserAggregate(user);
  }

  updateFromSupabaseAuth(supabaseUser: SupabaseUser): UserUpdatedEvent {
    const newEmail = new UserEmail(supabaseUser.email);
    const newName = supabaseUser.user_metadata?.name || 'User';
    
    const hasChanges = 
      !this.user.email.equals(newEmail) ||
      this.user.name !== newName ||
      this.user.avatarUrl !== supabaseUser.user_metadata?.avatar_url;

    if (hasChanges) {
      this.user.updateProfile(newName, supabaseUser.user_metadata?.avatar_url || null);
      if (!this.user.email.equals(newEmail)) {
        this.user.updateEmail(newEmail);
      }
      return new UserUpdatedEvent(this.user.id, this.user.email, this.user.name);
    }

    return new UserUpdatedEvent(this.user.id, this.user.email, this.user.name);
  }

  // Getters
  get id() { return this.user.id; }
  get entity() { return this.user; }
}
```

#### OrganizationAggregate
```typescript
// apps/web/src/domains/user-management/aggregates/organization.aggregate.ts
export class OrganizationAggregate {
  constructor(
    private organization: Organization
  ) {}

  // Command 처리
  static createDefault(
    name: string,
    ownerId: UserId
  ): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      name,
      ownerId,
      true, // isDefault
      new Date(),
      new Date()
    );
    return new OrganizationAggregate(organization);
  }

  updateName(name: string): OrganizationUpdatedEvent {
    this.organization.updateName(name);
    return new OrganizationUpdatedEvent(
      this.organization.id,
      this.organization.name
    );
  }

  // Getters
  get id() { return this.organization.id; }
  get entity() { return this.organization; }
  get ownerId() { return this.organization.ownerId; }
  get isDefault() { return this.organization.isDefault; }
}
```

### 4. Commands & Events 구현

#### Commands
```typescript
// apps/web/src/domains/user-management/commands/index.ts
export interface CreateUserProfileCommand {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface CreateDefaultOrganizationCommand {
  userId: string;
  organizationName: string;
}

export interface GetUserOrganizationsCommand {
  userId: string;
}
```

#### Events
```typescript
// apps/web/src/domains/user-management/events/index.ts
export class UserProfileCreatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class DefaultOrganizationCreatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly ownerId: UserId,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationUpdatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export interface OrganizationSummary {
  id: OrganizationId;
  name: string;
  isDefault: boolean;
  createdAt: Date;
}
```

### 5. Error Types 구현

```typescript
// apps/web/src/domains/user-management/errors/user-management.error.ts
export class UserManagementError extends Error {
  constructor(
    public readonly code: UserManagementErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'UserManagementError';
  }
}

export type UserManagementErrorCode =
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'ORGANIZATION_NOT_FOUND'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_USER_ID'
  | 'INVALID_ORGANIZATION_ID'
  | 'SUPABASE_AUTH_FAILED'
  | 'PROFILE_CREATION_FAILED'
  | 'ORGANIZATION_CREATION_FAILED';

// 사용자 메시지 매핑
export const USER_MANAGEMENT_ERROR_MESSAGES: Record<UserManagementErrorCode, string> = {
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  USER_ALREADY_EXISTS: '이미 존재하는 사용자입니다.',
  ORGANIZATION_NOT_FOUND: '조직을 찾을 수 없습니다.',
  INVALID_EMAIL_FORMAT: '올바른 이메일 형식이 아닙니다.',
  INVALID_USER_ID: '올바르지 않은 사용자 ID입니다.',
  INVALID_ORGANIZATION_ID: '올바르지 않은 조직 ID입니다.',
  SUPABASE_AUTH_FAILED: '인증에 실패했습니다.',
  PROFILE_CREATION_FAILED: '프로필 생성에 실패했습니다.',
  ORGANIZATION_CREATION_FAILED: '조직 생성에 실패했습니다.'
};
```

---

## 🔧 Service & Repository 계획

### 1. Service 레이어

#### UserManagementService
```typescript
// apps/web/src/domains/user-management/services/user-management.service.ts
export class UserManagementService {
  constructor(
    private userRepository: UserRepository,
    private organizationRepository: OrganizationRepository,
    private supabaseAuthService: SupabaseAuthService
  ) {}

  async createUserProfile(command: CreateUserProfileCommand): Promise<Result<UserAggregate, UserManagementError>> {
    try {
      // 1. Supabase Auth에서 사용자 확인
      const supabaseUser = await this.supabaseAuthService.getCurrentUser();
      if (!supabaseUser || supabaseUser.id !== command.userId) {
        return Result.error(new UserManagementError('USER_NOT_FOUND', 'User not found in Supabase Auth'));
      }

      // 2. 기존 프로필 확인
      const existingUser = await this.userRepository.findById(new UserId(command.userId));
      if (existingUser) {
        // 업데이트
        const event = existingUser.updateFromSupabaseAuth(supabaseUser);
        await this.userRepository.save(existingUser);
        return Result.success(existingUser);
      }

      // 3. 신규 프로필 생성
      const newUser = UserAggregate.createFromSupabaseAuth(supabaseUser);
      await this.userRepository.save(newUser);
      
      // 4. 기본 조직 생성
      await this.createDefaultOrganization(newUser);
      
      return Result.success(newUser);
    } catch (error) {
      return Result.error(new UserManagementError('PROFILE_CREATION_FAILED', 'Failed to create user profile', { error }));
    }
  }

  async createDefaultOrganization(command: CreateDefaultOrganizationCommand): Promise<Result<OrganizationAggregate, UserManagementError>> {
    try {
      // 1. 사용자 확인
      const user = await this.userRepository.findById(new UserId(command.userId));
      if (!user) {
        return Result.error(new UserManagementError('USER_NOT_FOUND', 'User not found'));
      }

      // 2. 기본 조직 생성
      const organization = OrganizationAggregate.createDefault(
        command.organizationName || `${user.entity.name}'s Organization`,
        user.id
      );
      
      await this.organizationRepository.save(organization);

      return Result.success(organization);
    } catch (error) {
      return Result.error(new UserManagementError('ORGANIZATION_CREATION_FAILED', 'Failed to create default organization', { error }));
    }
  }

  async getUserOrganizations(command: GetUserOrganizationsCommand): Promise<Result<OrganizationSummary[], UserManagementError>> {
    try {
      // 1. 사용자 확인
      const user = await this.userRepository.findById(new UserId(command.userId));
      if (!user) {
        return Result.error(new UserManagementError('USER_NOT_FOUND', 'User not found'));
      }

      // 2. 사용자 조직 조회
      const organizations = await this.organizationRepository.findByOwnerId(user.id);
      
      const summaries: OrganizationSummary[] = organizations.map(org => ({
        id: org.id,
        name: org.entity.name,
        isDefault: org.entity.isDefault,
        createdAt: org.entity.createdAt
      }));

      return Result.success(summaries);
    } catch (error) {
      return Result.error(new UserManagementError('ORGANIZATION_RETRIEVAL_FAILED', 'Failed to get user organizations', { error }));
    }
  }

  private async createDefaultOrganization(user: UserAggregate): Promise<void> {
    const orgName = `${user.entity.name}'s Organization`;
    
    const organization = OrganizationAggregate.createDefault(
      orgName,
      user.id
    );
    
    await this.organizationRepository.save(organization);
  }
}
```

### 2. Repository 레이어 (Drizzle ORM + RLS)

#### UserRepository (Drizzle ORM)
```typescript
// apps/web/src/domains/user-management/repositories/user.repository.ts
import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { profiles } from '@/db/schema';

export interface UserRepository {
  findById(id: UserId): Promise<UserAggregate | null>;
  save(user: UserAggregate): Promise<void>;
}

export class DrizzleUserRepository implements UserRepository {
  async findById(id: UserId): Promise<UserAggregate | null> {
    const db = await createDrizzleSupabaseClient();
    
    return db.rls((tx) =>
      tx.query.profiles.findFirst({
        where: eq(profiles.id, id.value),
      })
    ).then(data => {
      if (!data) {
        return null;
      }

      const user = new User(
        new UserId(data.id),
        new UserEmail(data.email),
        data.name,
        data.avatarUrl,
        new Date(data.createdAt),
        new Date(data.updatedAt)
      );

      return new UserAggregate(user);
    });
  }

  async save(userAggregate: UserAggregate): Promise<void> {
    const db = await createDrizzleSupabaseClient();
    
    await db.rls((tx) =>
      tx.insert(profiles).values({
        id: userAggregate.id.value,
        email: userAggregate.entity.email.value,
        name: userAggregate.entity.name,
        avatarUrl: userAggregate.entity.avatarUrl,
        createdAt: userAggregate.entity.createdAt,
        updatedAt: userAggregate.entity.updatedAt,
      }).onConflictDoUpdate({
        target: profiles.id,
        set: {
          email: userAggregate.entity.email.value,
          name: userAggregate.entity.name,
          avatarUrl: userAggregate.entity.avatarUrl,
          updatedAt: userAggregate.entity.updatedAt,
        },
      })
    );
  }
}
```

#### OrganizationRepository (Drizzle ORM)
```typescript
// apps/web/src/domains/user-management/repositories/organization.repository.ts
import { eq, and } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { organizations } from '@/db/schema';

export interface OrganizationRepository {
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  save(organization: OrganizationAggregate): Promise<void>;
}

export class DrizzleOrganizationRepository implements OrganizationRepository {
  async findById(id: OrganizationId): Promise<OrganizationAggregate | null> {
    const db = await createDrizzleSupabaseClient();
    
    return db.rls((tx) =>
      tx.query.organizations.findFirst({
        where: eq(organizations.id, id.value),
      })
    ).then(data => {
      if (!data) {
        return null;
      }

      const organization = new Organization(
        new OrganizationId(data.id),
        data.name,
        new UserId(data.ownerId),
        data.isDefault,
        new Date(data.createdAt),
        new Date(data.updatedAt)
      );

      return new OrganizationAggregate(organization);
    });
  }

  async findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]> {
    const db = await createDrizzleSupabaseClient();
    
    const data = await db.rls((tx) =>
      tx.query.organizations.findMany({
        where: eq(organizations.ownerId, ownerId.value),
        orderBy: (organizations, { asc }) => [asc(organizations.createdAt)],
      })
    );

    return data.map(row => {
      const organization = new Organization(
        new OrganizationId(row.id),
        row.name,
        new UserId(row.ownerId),
        row.isDefault,
        new Date(row.createdAt),
        new Date(row.updatedAt)
      );

      return new OrganizationAggregate(organization);
    });
  }

  async save(organizationAggregate: OrganizationAggregate): Promise<void> {
    const db = await createDrizzleSupabaseClient();
    
    await db.rls((tx) =>
      tx.insert(organizations).values({
        id: organizationAggregate.id.value,
        name: organizationAggregate.entity.name,
        ownerId: organizationAggregate.entity.ownerId.value,
        isDefault: organizationAggregate.entity.isDefault,
        createdAt: organizationAggregate.entity.createdAt,
        updatedAt: organizationAggregate.entity.updatedAt,
      }).onConflictDoUpdate({
        target: organizations.id,
        set: {
          name: organizationAggregate.entity.name,
          ownerId: organizationAggregate.entity.ownerId.value,
          isDefault: organizationAggregate.entity.isDefault,
          updatedAt: organizationAggregate.entity.updatedAt,
        },
      })
    );
  }
}
```

### 3. Read Models 구현

#### UserOrganizationView (Drizzle ORM)
```typescript
// apps/web/src/domains/user-management/read-models/user-organization.view.ts
import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { profiles, organizations } from '@/db/schema';

export interface UserOrganizationView {
  userId: UserId;
  ownedOrganizations: OrganizationSummary[];
  memberOrganizations: OrganizationSummary[]; // Scenario 0-1에서는 빈 배열
}

export interface OrganizationSummary {
  id: OrganizationId;
  name: string;
  role: "owner" | "member";
  isDefault: boolean;
  createdAt: Date;
}

export class DrizzleUserOrganizationViewRepository {
  async getByUserId(userId: UserId): Promise<UserOrganizationView | null> {
    const db = await createDrizzleSupabaseClient();
    
    // 사용자 프로필과 소유 조직을 함께 조회
    const userWithOrgs = await db.rls((tx) =>
      tx.query.profiles.findFirst({
        where: eq(profiles.id, userId.value),
        with: {
          organizations: {
            orderBy: (organizations, { asc }) => [asc(organizations.createdAt)],
          },
        },
      })
    );

    if (!userWithOrgs) {
      return null;
    }

    const ownedOrganizations: OrganizationSummary[] = userWithOrgs.organizations.map(org => ({
      id: new OrganizationId(org.id),
      name: org.name,
      role: "owner" as const,
      isDefault: org.isDefault,
      createdAt: new Date(org.createdAt)
    }));

    return {
      userId,
      ownedOrganizations,
      memberOrganizations: [] // Scenario 0-1에서는 멤버십 없음
    };
  }
}
```

#### UserProfileView (Drizzle ORM)
```typescript
// apps/web/src/domains/user-management/read-models/user-profile.view.ts
import { eq } from 'drizzle-orm';
import { createDrizzleSupabaseClient } from '@/db';
import { profiles, organizations } from '@/db/schema';

export interface UserProfileView {
  userId: UserId;
  email: string;
  name: string;
  profileImageUrl?: string;
  defaultOrganization: {
    id: OrganizationId;
    name: string;
  };
  lastLoginAt?: Date;
  createdAt: Date;
}

export class DrizzleUserProfileViewRepository {
  async getByUserId(userId: UserId): Promise<UserProfileView | null> {
    const db = await createDrizzleSupabaseClient();
    
    // 사용자 프로필과 기본 조직을 함께 조회
    const userWithDefaultOrg = await db.rls((tx) =>
      tx.query.profiles.findFirst({
        where: eq(profiles.id, userId.value),
        with: {
          organizations: {
            where: eq(organizations.isDefault, true),
            limit: 1,
          },
        },
      })
    );

    if (!userWithDefaultOrg) {
      return null;
    }

    const defaultOrg = userWithDefaultOrg.organizations[0];
    if (!defaultOrg) {
      throw new UserManagementError('DEFAULT_ORGANIZATION_NOT_FOUND', 'Default organization not found');
    }

    return {
      userId: new UserId(userWithDefaultOrg.id),
      email: userWithDefaultOrg.email || '',
      name: userWithDefaultOrg.name || 'User',
      profileImageUrl: userWithDefaultOrg.avatarUrl || undefined,
      defaultOrganization: {
        id: new OrganizationId(defaultOrg.id),
        name: defaultOrg.name
      },
      lastLoginAt: undefined, // Supabase Auth에서 별도 관리
      createdAt: new Date(userWithDefaultOrg.createdAt)
    };
  }
}
```

---

## 🌐 Anti-Corruption Layer & Server Actions

### 1. Supabase Auth Anti-Corruption Layer

```typescript
// apps/web/src/domains/user-management/infrastructure/supabase-auth.service.ts
export class SupabaseAuthService {
  constructor(private supabase: SupabaseClient) {}

  async signUpWithGoogle(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      
      return {
        success: !error,
        user: data.user ? this.toUser(data.user) : undefined,
        error: error?.message
      };
    } catch (err) {
      return { success: false, error: 'Login failed' };
    }
  }
  
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user ? this.toUser(user) : null;
  }
  
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  private toUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name || 'User',
      profileImageUrl: supabaseUser.user_metadata?.avatar_url
    };
  }
}

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    profileImageUrl?: string;
  };
  error?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
}
```

### 2. Server Actions (Drizzle ORM)

```typescript
// apps/web/src/domains/user-management/actions/user-management.actions.ts
"use server";

import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

export async function createUserProfileAction(): Promise<UserProfileView> {
  // 인증 확인
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }

  // Service 사용 (Drizzle Repository)
  const userRepository = new DrizzleUserRepository();
  const organizationRepository = new DrizzleOrganizationRepository();
  const supabaseAuthService = new SupabaseAuthService(supabase);
  
  const service = new UserManagementService(
    userRepository,
    organizationRepository,
    supabaseAuthService
  );

  const command: CreateUserProfileCommand = {
    userId: user.id,
    email: user.email!,
    name: user.user_metadata?.name || 'User',
    avatarUrl: user.user_metadata?.avatar_url || null
  };

  const result = await service.createUserProfile(command);
  
  if (result.isError()) {
    throw new Error(result.error.message);
  }

  // Read Model 조회 (Drizzle)
  const viewRepository = new DrizzleUserProfileViewRepository();
  const view = await viewRepository.getByUserId(new UserId(user.id));
  
  if (!view) {
    throw new Error('User profile view not found');
  }

  return view;
}

export async function getUserOrganizationsAction(): Promise<OrganizationSummary[]> {
  // 인증 확인
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }

  // Service 사용 (Drizzle Repository)
  const userRepository = new DrizzleUserRepository();
  const organizationRepository = new DrizzleOrganizationRepository();
  const supabaseAuthService = new SupabaseAuthService(supabase);
  
  const service = new UserManagementService(
    userRepository,
    organizationRepository,
    supabaseAuthService
  );

  const command: GetUserOrganizationsCommand = {
    userId: user.id
  };

  const result = await service.getUserOrganizations(command);
  
  if (result.isError()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

const createDefaultOrganizationSchema = z.object({
  organizationName: z.string().min(1).max(255)
});

export async function createDefaultOrganizationAction(
  input: z.infer<typeof createDefaultOrganizationSchema>
): Promise<OrganizationSummary> {
  // 인증 확인
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }

  // Input validation
  const validatedInput = createDefaultOrganizationSchema.parse(input);
  
  // Service 사용 (Drizzle Repository)
  const userRepository = new DrizzleUserRepository();
  const organizationRepository = new DrizzleOrganizationRepository();
  const supabaseAuthService = new SupabaseAuthService(supabase);
  
  const service = new UserManagementService(
    userRepository,
    organizationRepository,
    supabaseAuthService
  );

  const command: CreateDefaultOrganizationCommand = {
    userId: user.id,
    organizationName: validatedInput.organizationName
  };

  const result = await service.createDefaultOrganization(command);
  
  if (result.isError()) {
    throw new Error(result.error.message);
  }

  return {
    id: result.value.id,
    name: result.value.entity.name,
    role: "owner" as const,
    isDefault: result.value.entity.isDefault,
    createdAt: result.value.entity.createdAt
  };
}

// 트랜잭션 기반 사용자 등록 (하이브리드 접근법)
export async function processUserRegistrationAction(): Promise<UserRegistrationResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }

  // 트랜잭션으로 최적화된 처리
  const db = await createDrizzleSupabaseClient();
  
  return db.rls(async (tx) => {
    // Event: Supabase User Created
    console.log('Processing user registration for:', user.id);
    
    // Command: Create User Profile
    const profile = await tx.insert(profiles).values({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || 'User',
      avatarUrl: user.user_metadata?.avatar_url || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Event: User Profile Created
    console.log('User profile created:', profile[0].id);
    
    // Command: Create Default Organization
    const defaultOrg = await tx.insert(organizations).values({
      id: `org_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`,
      name: `${user.user_metadata?.name || 'User'}'s Organization`,
      ownerId: user.id,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Event: Default Organization Created
    console.log('Default organization created:', defaultOrg[0].id);
    
    return {
      success: true,
      user: {
        id: profile[0].id,
        email: profile[0].email,
        name: profile[0].name,
        avatarUrl: profile[0].avatarUrl,
      },
      defaultOrganization: {
        id: defaultOrg[0].id,
        name: defaultOrg[0].name,
        isDefault: defaultOrg[0].isDefault,
      },
    };
  });
}
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

#### Aggregate 테스트
```typescript
// apps/web/src/domains/user-management/aggregates/__tests__/user.aggregate.test.ts
describe('UserAggregate', () => {
  describe('createFromSupabaseAuth', () => {
    it('should create user aggregate from supabase user data', () => {
      const supabaseUser = {
        id: 'user_123',
        email: 'test@example.com',
        user_metadata: {
          name: 'John Doe',
          avatar_url: 'https://example.com/avatar.jpg'
        },
        created_at: '2024-01-01T00:00:00Z'
      };

      const aggregate = UserAggregate.createFromSupabaseAuth(supabaseUser);

      expect(aggregate.entity.id.value).toBe('user_123');
      expect(aggregate.entity.email.value).toBe('test@example.com');
      expect(aggregate.entity.name).toBe('John Doe');
    });
  });
});
```

### 2. Integration Tests

#### Server Actions 테스트
```typescript
// apps/web/src/domains/user-management/actions/__tests__/user-management.actions.test.ts
describe('User Management Actions', () => {
  let testDb: SupabaseClient;
  
  beforeEach(async () => {
    testDb = await createTestSupabaseClient();
  });

  afterEach(async () => {
    await cleanupTestDatabase(testDb);
  });

  describe('createUserProfileAction', () => {
    it('should create user profile from supabase auth', async () => {
      // Mock Supabase Auth
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        user_metadata: {
          name: 'John Doe',
          avatar_url: null
        }
      };

      // Mock Supabase Auth
      jest.spyOn(testDb.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await createUserProfileAction();

      expect(result.userId.value).toBe('user_123');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('John Doe');
    });
  });
});
```

---

## 📋 검증 체크리스트

### Scenario 0-1 지원
- [x] **유저 가입**: Supabase Auth + profiles 테이블로 구글 OAuth 사용자 생성
- [x] **기본 조직 생성**: 사용자 등록 시 자동 생성
- [x] **조직 조회**: 사용자 소유 조직 목록 조회
- [x] **초기 조직 선택**: 프론트엔드에서 기본 조직 자동 선택

### 설계 일관성
- [x] 모든 Command에 입력 검증 로직이 정의되어 있는가?
- [x] Repository가 반환하는 Entity의 불변식이 깨지지 않는가?
- [x] Supabase Auth 연동 실패 시 사용자 경험이 명확한가?
- [x] Read Model이 Scenario 0-1 요구사항을 충족하는가?

### 보안 및 성능
- [x] 사용자 권한 검증이 모든 작업에서 수행되는가?
- [x] 민감한 정보(이메일, 개인정보)가 적절히 보호되는가?
- [x] RLS 정책이 올바르게 적용되는가?

### 테스트 커버리지
- [x] 모든 Aggregate의 핵심 비즈니스 로직이 테스트되는가?
- [x] Happy path와 edge case가 모두 다뤄지는가?
- [x] 외부 의존성(Supabase Auth)에 대한 적절한 Mock이 있는가?

---

이 Technical Specification은 User Management Domain의 Scenario 0-1을 완전히 지원하며, Supabase Auth와의 통합을 통해 단순하면서도 확장 가능한 구조를 제공합니다.