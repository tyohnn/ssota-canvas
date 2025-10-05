# 쏘타 프로젝트 코드 컨벤션 가이드라인

이 문서는 쏘타 프로젝트의 코드 작성 표준과 컨벤션을 정의합니다.
**기술 스택**: Next.js 15, Supabase Auth, Drizzle ORM, RLS, TypeScript

---

## 🎯 네이밍 컨벤션

### 1. 파일 네이밍
```typescript
// ✅ 좋은 예시
domains/
├── user-management/
│   ├── aggregates/
│   │   ├── user.aggregate.ts              // Aggregate 클래스
│   │   └── organization.aggregate.ts
│   ├── entities/
│   │   ├── user.entity.ts                // Entity 클래스
│   │   └── organization.entity.ts
│   ├── value-objects/
│   │   ├── user-email.vo.ts              // Value Object
│   │   └── organization-name.vo.ts
│   ├── commands/
│   │   ├── create-user-profile.command.ts // Command 클래스
│   │   └── create-organization.command.ts
│   ├── events/
│   │   ├── user-profile-created.event.ts  // Event 클래스
│   │   └── organization-created.event.ts
│   ├── repositories/
│   │   ├── interfaces/                   // Interface Repository
│   │   │   ├── user.repository.interface.ts
│   │   │   └── organization.repository.interface.ts
│   │   └── implementations/              // Concrete Repository
│   │       ├── drizzle-user.repository.ts
│   │       └── drizzle-organization.repository.ts
│   ├── services/
│   │   ├── user-management.service.ts    // Domain Service
│   │   └── organization.service.ts
│   ├── anti-corruption-layers/
│   │   └── supabase-auth-acl.ts          // Supabase Auth 변환
│   └── types/
│       └── index.ts                      // 타입 정의들
```

### 2. 클래스 네이밍
```typescript
// ✅ Aggregate (항상 Aggregate 접미사)
export class UserAggregate {
  // Aggregate Root 역할 수행
}

// ✅ Entity (항상 Entity 접미사)
export class User {
  // 식별자 기반 객체
}

// ✅ Value Object (항상 VO 접미사)
export class UserEmail {
  // 불변 데이터
}

// ✅ Command (항상 Command 접미사)
export class CreateUserProfileCommand {
  // 의도 표현
}

// ✅ Event (항상 Event 접미사)
export class UserProfileCreatedEvent {
  // 과거형 사실
}

// ✅ Repository Interface (항상 Repository 접미사)
export interface UserRepository {
  // 데이터 접근 계약
}

// ✅ Repository Implementation (Drizzle 접두사)
export class DrizzleUserRepository implements UserRepository {
  // Drizzle ORM + RLS 구현
}

// ✅ Domain Service (항상 Service 접미사)
export class UserManagementService {
  // 비즈니스 로직
}

// ✅ Anti-Corruption Layer (항상 ACL 접미사)
export class SupabaseAuthACL {
  // Supabase Auth 변환
}
```

### 3. 메소드 네이밍
```typescript
// ✅ Aggregate 메소드
export class UserAggregate {
  static createFromSupabaseAuth(supabaseUser: SupabaseUser): UserAggregate {
    // Supabase Auth 데이터로 Aggregate 생성
  }
  
  updateFromSupabaseAuth(supabaseUser: SupabaseUser): UserUpdatedEvent {
    // Supabase Auth 데이터로 업데이트
  }
}

// ✅ Repository 메소드
export interface UserRepository {
  save(user: UserAggregate): Promise<void>;                    // 저장
  findById(id: UserId): Promise<UserAggregate | null>;         // 단건 조회
  findByEmail(email: UserEmail): Promise<UserAggregate | null>; // 조건 조회
  delete(id: UserId): Promise<void>;                           // 삭제
}
```

---

## 🎨 타입 정의 디테일 정도

### 1. Command 타입 (매우 구체적)
```typescript
export interface CreateUserProfileCommand {
  userId: string;                    // Supabase Auth User ID
  email: string;                     // 이메일 주소
  name: string;                      // 사용자 이름
  avatarUrl: string | null;          // 프로필 이미지 URL
}

export interface CreateDefaultOrganizationCommand {
  userId: string;                    // 사용자 ID
  organizationName: string;         // 조직명
}
```

### 2. Event 타입 (과거형 + 구체적 데이터)
```typescript
export class UserProfileCreatedEvent {
  readonly type = 'UserProfileCreated';

  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class DefaultOrganizationCreatedEvent {
  readonly type = 'DefaultOrganizationCreated';

  constructor(
    public readonly organizationId: OrganizationId,
    public readonly ownerId: UserId,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}
```

---

## 🧪 테스트 구조와 실행

### 1. 테스트 파일 위치
```typescript
domains/workspace-structure/
├── aggregates/
│   ├── workspace.aggregate.ts
│   └── workspace.aggregate.test.ts        // Aggregate 테스트
├── entities/
│   ├── workspace.entity.ts
│   └── workspace.entity.test.ts           // Entity 테스트
├── value-objects/
│   ├── workspace-name.vo.ts
│   └── workspace-name.vo.test.ts         // Value Object 테스트
├── commands/
│   ├── create-workspace.command.ts
│   └── create-workspace.command.test.ts   // Command 테스트
├── events/
│   ├── workspace-created.event.ts
│   └── workspace-created.event.test.ts    // Event 테스트
├── repositories/
│   ├── implementations/
│   │   └── workspace.repository.test.ts   // Repository 테스트
└── services/
    ├── workspace.service.ts
    └── workspace.service.ts.test.ts       // Service 테스트
```

### 2. 테스트 실행
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest domains/*/aggregates/*.test.ts domains/*/entities/*.test.ts",
    "test:integration": "vitest domains/*/__tests__/*.test.ts",
    "test:ci": "vitest run --coverage"
  }
}
```

---

## 📁 processCrossDomainEvents 위치

### 중앙 관리 방식
```typescript
// ✅ infrastructure/event-processors/ 에서 중앙 관리
apps/web/src/infrastructure/event-processors/
├── cross-domain-event-processor.ts     // 🎯 중앙 이벤트 처리기
├── workspace-events.ts                // Workspace 도메인 이벤트 핸들러
├── canvas-events.ts                   // Visual Canvas 이벤트 핸들러
└── index.ts                           // 통합 관리

// ✅ 개별 도메인에서는 이벤트 정의만
domains/workspace-structure/
├── events/
│   ├── workspace-created.event.ts     // 이벤트 정의
│   └── index.ts                       // exports
```

### 이벤트 처리기 구현
```typescript
export class CrossDomainEventProcessor {
  private processors: Map<string, EventHandler[]> = new Map();

  register(eventType: string, handler: EventHandler): void {
    if (!this.processors.has(eventType)) {
      this.processors.set(eventType, []);
    }
    this.processors.get(eventType)!.push(handler);
  }

  async processEvents(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const handlers = this.processors.get(event.type) || [];
      await Promise.allSettled(
        handlers.map(handler => handler.handle(event))
      );
    }
  }
}
```

---

## 💎 DDD 컴포넌트별 상세 가이드

### Value Object 상세 정의법
```typescript
// 🎯 Value Object = 불변 데이터 + 동등성 비교
export class WorkspaceName {
  constructor(private readonly value: string) {
    // 1. 생성 시 검증
    if (value.length < 1 || value.length > 100) {
      throw new Error('Workspace name must be between 1 and 100 characters');
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
      throw new Error('Workspace name can only contain letters, numbers, spaces, hyphens, and underscores');
    }
  }

  // 2. 불변성 보장
  get value() { return this.value; }

  // 3. 값 기반 동등성 비교 (Entity와의 차이점!)
  equals(other: WorkspaceName): boolean {
    return this.value === other.value;
  }

  // 4. 유용한 도메인 메소드들
  getSlug(): string {
    return this.value.toLowerCase().replace(/\s+/g, '-');
  }

  isEmpty(): boolean {
    return this.value.trim().length === 0;
  }
}

// 🎯 언제 Value Object를 사용해야 할까?
// 1. 값이 불변해야 할 때 (이름, 이메일, 주소 등)
// 2. 값 기반 동등성 비교가 필요할 때
// 3. 도메인 규칙이 복잡할 때 (유효성 검증, 변환 로직)
// 4. 여러 Entity에서 공유되는 개념일 때
```

### Entity 상세 정의법
```typescript
// 🎯 Entity = 식별자 + 변경 가능성 + 수명주기
export class Workspace {
  private _name: WorkspaceName;
  private _description?: string;
  private _updatedAt: Date;

  constructor(
    public readonly id: string,              // 식별자
    public readonly organizationId: string,  // 불변 필드
    name: WorkspaceName,                     // Value Object
    description?: string,
    public readonly createdBy: string,       // 불변 필드
    public readonly createdAt: Date          // 불변 필드
  ) {
    this._name = name;
    this._description = description;
    this._updatedAt = new Date();
  }

  // 1. Getter (불변성 보장)
  get name(): WorkspaceName { return this._name; }
  get description(): string | undefined { return this._description; }
  get updatedAt(): Date { return this._updatedAt; }

  // 2. 비즈니스 로직 (상태 변경)
  updateName(newName: WorkspaceName): void {
    this._name = newName;
    this._updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  // 3. 도메인 규칙 검증
  canBeDeletedBy(userId: string): boolean {
    return this.createdBy === userId;
  }

  isOlderThan(days: number): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.createdAt < cutoffDate;
  }
}

// 🎯 언제 Entity를 사용해야 할까?
// 1. 고유 식별자가 있을 때 (ID)
// 2. 수명주기가 있을 때 (생성, 수정, 삭제)
// 3. 변경 추적이 필요할 때 (updatedAt, createdAt)
// 4. 비즈니스 로직이 복잡할 때
```

### Service 코드 작성법
```typescript
// 🎯 Domain Service = 크로스 애그리거트 비즈니스 로직
export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: IWorkspaceRepository,
    private readonly authService: IAuthService,
    private readonly organizationService: IOrganizationService
  ) {}

  async createWorkspace(command: CreateWorkspaceCommand): Promise<DomainEvent[]> {
    // 1. 인증 확인 (크로스 애그리거트 로직)
    const userId = await this.authService.getCurrentUserId();
    if (!userId) {
      throw new AuthenticationError("로그인이 필요합니다");
    }

    // 2. 권한 확인 (크로스 애그리거트 로직)
    const hasPermission = await this.organizationService.userCanCreateWorkspace(
      userId,
      command.organizationId
    );
    if (!hasPermission) {
      throw new AuthorizationError("워크스페이스 생성 권한이 없습니다");
    }

    // 3. 비즈니스 규칙 검증 (Policy)
    await this.validateWorkspaceLimits(command.organizationId);

    // 4. Aggregate를 통한 상태 변경
    const aggregate = new WorkspaceAggregate();
    const events = await aggregate.createWorkspace({
      ...command,
      createdBy: userId
    });

    // 5. 저장 (Repository 사용)
    await this.workspaceRepository.save(aggregate.workspace);

    return events;
  }

  // 6. 비즈니스 규칙 검증 메소드들
  private async validateWorkspaceLimits(organizationId: string): Promise<void> {
    const currentCount = await this.workspaceRepository.countByOrganization(organizationId);
    const orgPlan = await this.organizationService.getPlan(organizationId);

    if (orgPlan === 'free' && currentCount >= 5) {
      throw new BusinessRuleError("워크스페이스 생성 한도 초과");
    }
  }

  async deleteWorkspace(command: DeleteWorkspaceCommand): Promise<DomainEvent[]> {
    // 1. 권한 확인
    const userId = await this.authService.getCurrentUserId();
    const workspace = await this.workspaceRepository.findById(command.workspaceId);

    if (!workspace || !workspace.canBeDeletedBy(userId)) {
      throw new AuthorizationError("삭제 권한이 없습니다");
    }

    // 2. Aggregate를 통한 삭제
    const aggregate = new WorkspaceAggregate();
    await aggregate.loadFromRepository(workspace); // 기존 상태 로드
    const events = await aggregate.deleteWorkspace(command);

    // 3. 저장소에서 삭제
    await this.workspaceRepository.delete(command.workspaceId);

    return events;
  }
}

// 🎯 Domain Service 작성 원칙
// 1. 단일 책임: 하나의 비즈니스 프로세스만 담당
// 2. 크로스 애그리거트: 여러 Aggregate에 걸친 로직
// 3. Policy 실행: 비즈니스 규칙 검증
// 4. Error Handling: 도메인 에러 vs 시스템 에러 구분
```

### Repository 작성법 (Drizzle + RLS)
```typescript
// 🎯 Repository Interface = 데이터 접근 계약
export interface UserRepository {
  // 기본 CRUD
  save(user: UserAggregate): Promise<void>;
  findById(id: UserId): Promise<UserAggregate | null>;
  findByEmail(email: UserEmail): Promise<UserAggregate | null>;
  delete(id: UserId): Promise<void>;
}

export interface OrganizationRepository {
  save(organization: OrganizationAggregate): Promise<void>;
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  delete(id: OrganizationId): Promise<void>;
}

// 🎯 Repository Implementation = Drizzle ORM + RLS
export class DrizzleUserRepository implements UserRepository {
  async findById(id: UserId): Promise<UserAggregate | null> {
    const db = await createDrizzleSupabaseClient();
    
    return db.rls((tx) =>
      tx.query.profiles.findFirst({
        where: eq(profiles.id, id.value),
      })
    ).then(data => {
      if (!data) return null;

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

export class DrizzleOrganizationRepository implements OrganizationRepository {
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
}

// 🎯 Repository 작성 원칙
// 1. Drizzle ORM + RLS 사용
// 2. createDrizzleSupabaseClient()로 클라이언트 생성
// 3. db.rls()로 RLS 정책 적용
// 4. 도메인 객체 반환 (Row → Entity 변환)
// 5. 트랜잭션은 Drizzle의 내장 트랜잭션 사용
```

### Server Actions 코드 컨벤션 (Supabase Auth + Drizzle)
```typescript
// 🎯 Server Actions = HTTP 요청을 도메인 로직으로 변환
export async function createUserProfileAction(): Promise<UserProfileView> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Authentication required');
    }

    // 2. 의존성 주입 (Drizzle Repository)
    const userRepository = new DrizzleUserRepository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    
    const service = new UserManagementService(
      userRepository,
      organizationRepository,
      supabaseAuthService
    );

    // 3. Command 생성
    const command: CreateUserProfileCommand = {
      userId: user.id,
      email: user.email!,
      name: user.user_metadata?.name || 'User',
      avatarUrl: user.user_metadata?.avatar_url || null
    };

    // 4. 도메인 로직 실행
    const result = await service.createUserProfile(command);
    
    if (result.isError()) {
      throw new Error(result.error.message);
    }

    // 5. Read Model 조회 (Drizzle)
    const viewRepository = new DrizzleUserProfileViewRepository();
    const view = await viewRepository.getByUserId(new UserId(user.id));
    
    if (!view) {
      throw new Error('User profile view not found');
    }

    return view;

  } catch (error) {
    console.error('Error in createUserProfileAction:', error);
    throw error;
  }
}

export async function createOrganizationAction(
  input: { name: string; slug?: string }
): Promise<OrganizationSummary> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Authentication required');
    }

    // 2. Input 검증
    if (!input.name?.trim()) {
      throw new Error('Organization name is required');
    }

    // 3. 의존성 주입 (Drizzle Repository)
    const userRepository = new DrizzleUserRepository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    
    const service = new UserManagementService(
      userRepository,
      organizationRepository,
      supabaseAuthService
    );

    // 4. Command 생성
    const command: CreateOrganizationCommand = {
      name: input.name,
      slug: input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
      ownerId: user.id
    };

    // 5. 도메인 로직 실행
    const result = await service.createOrganization(command);
    
    if (result.isError()) {
      throw new Error(result.error.message);
    }

    // 6. 관련 페이지 재검증
    revalidatePath('/dashboard');
    revalidatePath('/organizations');

    return {
      id: result.value.id,
      name: result.value.entity.name,
      slug: result.value.entity.slug,
      memberCount: 1,
      isDefault: result.value.entity.isDefault,
      isSelected: false,
      role: "owner" as const,
      createdAt: result.value.entity.createdAt
    };

  } catch (error) {
    console.error('Error in createOrganizationAction:', error);
    throw error;
  }
}

// 🎯 Server Actions 작성 원칙
// 1. Supabase Auth로 인증 확인
// 2. Drizzle Repository 의존성 주입
// 3. Command 객체로 입력 구조화
// 4. Service Layer를 통한 도메인 로직 실행
// 5. revalidatePath로 관련 페이지 재검증
// 6. 에러 분류 및 적절한 에러 메시지
```

### Anti-Corruption Layer 위치 (Supabase Auth)
```typescript
// ✅ 도메인 내부에 포함 (infrastructure/ 하위가 아님)
// domains/user-management/anti-corruption-layers/supabase-auth-acl.ts

// 🎯 Anti-Corruption Layer = Supabase Auth와 도메인 모델 간 변환
export class SupabaseAuthACL {
  // 1. Supabase User → 도메인 모델 변환
  static toDomainUser(supabaseUser: SupabaseUser): DomainUser {
    return new DomainUser({
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name || 'User',
      avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
      createdAt: new Date(supabaseUser.created_at)
    });
  }

  // 2. 도메인 모델 → Supabase User 변환
  static toSupabaseUser(domainUser: DomainUser): Partial<SupabaseUser> {
    return {
      id: domainUser.id,
      email: domainUser.email,
      user_metadata: {
        name: domainUser.name,
        avatar_url: domainUser.avatarUrl
      }
    };
  }

  // 3. OAuth 결과 처리
  static toAuthResult(supabaseResult: AuthResponse): AuthResult {
    return {
      success: !supabaseResult.error,
      user: supabaseResult.data.user ? this.toDomainUser(supabaseResult.data.user) : undefined,
      error: supabaseResult.error?.message
    };
  }

  // 4. 세션 관리
  static toSessionInfo(session: Session): SessionInfo {
    return {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: new Date(session.expires_at),
      accessToken: session.access_token
    };
  }
}

// 🎯 Supabase Auth Service
export class SupabaseAuthService {
  constructor(private supabase: SupabaseClient) {}

  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      
      return SupabaseAuthACL.toAuthResult({ data, error });
    } catch (err) {
      return { success: false, error: 'Login failed' };
    }
  }
  
  async getCurrentUser(): Promise<DomainUser | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user ? SupabaseAuthACL.toDomainUser(user) : null;
  }
  
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}

// 🎯 왜 도메인 내부에 포함?
// 1. 도메인 경계 보호: Supabase Auth의 영향을 격리
// 2. 변환 로직 집중: 한 곳에서 모든 변환 관리
// 3. 테스트 용이성: 도메인 테스트에서 외부 의존성 제거
// 4. 변경 대응: Supabase API 변경 시 한 곳만 수정
```

---

## 📚 관련 문서

### 도메인 설계 문서
- **[소프트웨어 디자인 가이드](../guide/software-design-guide.md)**: 상세 구현 가이드라인
- **[테크니컬 명세서 템플릿](../template/technical-specification-template.md)**: 구현 가이드 템플릿
- **[프론트엔드 명세서 템플릿](../template/frontend-specification-template.md)**: 프론트엔드 구현 가이드

### 사용자 관리 도메인
- **[User Management Process Model](../../domains/user-management-domain/process-model.md)**: 비즈니스 프로세스 정의
- **[User Management Technical Specification](../../domains/user-management-domain/technical-specification.md)**: 구현 명세서
- **[User Management Frontend Specification](../../domains/user-management-domain/frontend-specification.md)**: 프론트엔드 명세서

### Story 및 Sprint 관리
- **[Story 정의 가이드](../../agile-planning/guide/04-story-definition-guide.md)**: Story 작성 가이드
- **[Sprint 계획 가이드](../../agile-planning/guide/05-sprint-planning-guide.md)**: Sprint 계획 가이드
- **[User Management Stories](../../agile-planning/stories/user-management/README.md)**: Story 목록 및 우선순위

### 기술 스택 참조
- **Next.js 14**: App Router, Server Actions, revalidatePath
- **Supabase Auth**: OAuth, 세션 관리, RLS
- **Drizzle ORM**: 타입 안전한 쿼리, RLS 통합
- **TypeScript**: 도메인 모델링, 타입 안전성

---

이 코드 컨벤션을 따르면 **Supabase + Drizzle + RLS** 환경에서 **일관된 품질**의 코드를 작성할 수 있습니다! 🎯
