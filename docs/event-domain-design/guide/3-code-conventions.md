# 쏘타 프로젝트 코드 컨벤션 가이드라인

이 문서는 쏘타 프로젝트의 코드 작성 표준과 컨벤션을 정의합니다.

---

## 🎯 네이밍 컨벤션

### 1. 파일 네이밍
```typescript
// ✅ 좋은 예시
domains/
├── workspace-structure/
│   ├── aggregates/
│   │   ├── workspace.aggregate.ts          // Aggregate 클래스
│   │   └── page.aggregate.ts
│   ├── entities/
│   │   ├── workspace.entity.ts            // Entity 클래스
│   │   └── page.entity.ts
│   ├── value-objects/
│   │   ├── workspace-name.vo.ts           // Value Object
│   │   └── page-title.vo.ts
│   ├── commands/
│   │   ├── create-workspace.command.ts    // Command 클래스
│   │   └── create-page.command.ts
│   ├── events/
│   │   ├── workspace-created.event.ts     // Event 클래스
│   │   └── page-created.event.ts
│   ├── repositories/
│   │   ├── interfaces/                    // Interface Repository
│   │   │   └── workspace.repository.interface.ts
│   │   └── implementations/               // Concrete Repository
│   │       └── workspace.repository.ts
│   ├── services/
│   │   ├── workspace.service.ts           // Domain Service
│   │   └── page-lifecycle.service.ts
│   ├── anti-corruption-layers/
│   │   └── clerk-acl.ts                   // 외부 시스템 변환
│   └── types/
│       └── index.ts                       // 타입 정의들
```

### 2. 클래스 네이밍
```typescript
// ✅ Aggregate (항상 Aggregate 접미사)
export class WorkspaceAggregate {
  // Aggregate Root 역할 수행
}

// ✅ Entity (항상 Entity 접미사)
export class Workspace {
  // 식별자 기반 객체
}

// ✅ Value Object (항상 VO 접미사)
export class WorkspaceName {
  // 불변 데이터
}

// ✅ Command (항상 Command 접미사)
export class CreateWorkspaceCommand {
  // 의도 표현
}

// ✅ Event (항상 Event 접미사)
export class WorkspaceCreatedEvent {
  // 과거형 사실
}

// ✅ Repository Interface (항상 RepositoryInterface 접미사)
export interface IWorkspaceRepository {
  // 데이터 접근 계약
}

// ✅ Repository Implementation (항상 Repository 접미사)
export class WorkspaceRepository implements IWorkspaceRepository {
  // 실제 구현
}

// ✅ Domain Service (항상 Service 접미사)
export class WorkspaceService {
  // 비즈니스 로직
}

// ✅ Anti-Corruption Layer (항상 ACL 접미사)
export class ClerkACL {
  // 외부 시스템 변환
}
```

### 3. 메소드 네이밍
```typescript
// ✅ Aggregate 메소드
export class WorkspaceAggregate {
  async createWorkspace(command: CreateWorkspaceCommand): Promise<DomainEvent[]> {
    // 비즈니스 로직 실행 후 Events 반환
  }
}

// ✅ Repository 메소드
export interface IWorkspaceRepository {
  save(entity: Workspace): Promise<void>;           // 저장
  findById(id: string): Promise<Workspace | null>;   // 단건 조회
  findByOrganizationId(orgId: string): Promise<Workspace[]>; // 조건 조회
  delete(id: string): Promise<void>;                 // 삭제
}
```

---

## 🎨 타입 정의 디테일 정도

### 1. Command 타입 (매우 구체적)
```typescript
export class CreateWorkspaceCommand {
  constructor(
    public readonly organizationId: string,    // UUID 형식
    public readonly name: string,              // 1-100자 제한
    public readonly description?: string,      // 선택사항
    public readonly createdBy: string,         // 사용자 ID
    public readonly templateId?: string        // 선택적 템플릿
  ) {}
}
```

### 2. Event 타입 (과거형 + 구체적 데이터)
```typescript
export class WorkspaceCreatedEvent {
  readonly type = 'WorkspaceCreated';

  constructor(
    public readonly aggregateId: string,  // 어떤 Aggregate에서 발생했는지
    public readonly data: {
      workspaceId: string;
      organizationId: string;
      name: string;
      createdBy: string;
      createdAt: Date;
    }
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

### Repository 작성법
```typescript
// 🎯 Repository Interface = 데이터 접근 계약
export interface IWorkspaceRepository {
  // 기본 CRUD
  save(entity: Workspace): Promise<void>;
  findById(id: string): Promise<Workspace | null>;
  findByOrganizationId(orgId: string): Promise<Workspace[]>;
  delete(id: string): Promise<void>;

  // 비즈니스 쿼리 메소드들
  countByOrganization(orgId: string): Promise<number>;
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  findWithHierarchy(workspaceId: string): Promise<WorkspaceStructure>;
  findActiveWorkspaces(orgId: string): Promise<Workspace[]>;

  // 복잡한 비즈니스 쿼리
  findWorkspacesByActivity(
    organizationId: string,
    since: Date,
    limit?: number
  ): Promise<Workspace[]>;
}

// 🎯 Repository Implementation = 실제 데이터베이스 작업
export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(entity: Workspace): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. 낙관적 잠금 확인 (필요시)
      const existing = await tx
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, entity.id))
        .limit(1);

      if (existing[0] && existing[0].updated_at > entity.updatedAt) {
        throw new ConcurrencyError("워크스페이스가 다른 사용자에 의해 수정되었습니다");
      }

      // 2. 저장 또는 업데이트
      await tx
        .insert(workspaces)
        .values({
          id: entity.id,
          organization_id: entity.organizationId,
          name: entity.name.value,
          description: entity.description,
          owner_id: entity.createdBy,
          created_at: entity.createdAt,
          updated_at: entity.updatedAt
        })
        .onConflictDoUpdate({
          target: workspaces.id,
          set: {
            name: entity.name.value,
            description: entity.description,
            updated_at: entity.updatedAt
          }
        });
    });
  }

  async findById(id: string): Promise<Workspace | null> {
    const result = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    return result[0] ? this.mapToDomain(result[0]) : null;
  }

  async countByOrganization(orgId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(workspaces)
      .where(eq(workspaces.organization_id, orgId));

    return result[0].count;
  }

  private mapToDomain(row: any): Workspace {
    return new Workspace(
      row.id,
      row.organization_id,
      new WorkspaceName(row.name),
      row.description,
      row.owner_id,
      row.created_at,
      row.updated_at
    );
  }
}

// 🎯 Repository 작성 원칙
// 1. Interface와 Implementation 분리
// 2. 도메인 객체 반환 (Row → Entity 변환)
// 3. 트랜잭션 관리 (복잡한 작업 시)
// 4. 비즈니스 의미있는 메소드명 사용
```

### Server Actions 코드 컨벤션
```typescript
// 🎯 Server Actions = HTTP 요청을 도메인 로직으로 변환
export async function createWorkspaceAction(
  input: CreateWorkspaceInput
): Promise<Result<WorkspaceResult, WorkspaceError>> {
  try {
    // 1. Input 검증 (Zod 스키마)
    const validated = createWorkspaceInputSchema.parse(input);

    // 2. 의존성 주입 (간단한 DI)
    const workspaceService = new WorkspaceService(
      new WorkspaceRepository(await createDbClient()),
      new AuthService(),
      new OrganizationService()
    );

    // 3. 도메인 로직 실행
    const events = await workspaceService.createWorkspace(
      CreateWorkspaceCommand.fromInput(validated)
    );

    // 4. 크로스-도메인 이벤트 처리
    await processCrossDomainEvents(events);

    // 5. 성공 응답 (도메인 객체 → API 응답 변환)
    const result = mapToApiResponse(events[0]);
    return Result.ok(result);

  } catch (error) {
    // 6. 에러 분류 및 처리
    if (error instanceof ZodError) {
      return Result.fail(WorkspaceError.INVALID_INPUT);
    }
    if (error instanceof BusinessRuleError) {
      return Result.fail(WorkspaceError.LIMIT_EXCEEDED);
    }
    if (error instanceof AuthenticationError) {
      return Result.fail(WorkspaceError.UNAUTHORIZED);
    }

    // 시스템 에러 로깅
    console.error('Unexpected error in createWorkspaceAction:', error);
    return Result.fail(WorkspaceError.INTERNAL_ERROR);
  }
}

// 🎯 Server Actions 작성 원칙
// 1. Input/Output 타입 명확히 정의
// 2. 도메인 서비스 의존성 주입
// 3. 에러 분류 (비즈니스 vs 시스템)
// 4. 이벤트 처리 (크로스-도메인)
// 5. 응답 매핑 (도메인 → API)
```

### Anti-Corruption Layer 위치
```typescript
// ✅ 도메인 내부에 포함 (infrastructure/ 하위가 아님)
// domains/workspace-structure/anti-corruption-layers/clerk-acl.ts

// 🎯 Anti-Corruption Layer = 외부 시스템과 도메인 모델 간 변환
export class ClerkACL {
  // 1. 외부 모델 → 도메인 모델 변환
  static toDomainUser(clerkUser: ClerkUser): DomainUser {
    return new DomainUser({
      id: clerkUser.id,
      email: clerkUser.email,
      name: clerkUser.name,
      organizationId: clerkUser.organizationId,
      role: this.mapClerkRole(clerkUser.role)
    });
  }

  // 2. 도메인 모델 → 외부 모델 변환
  static toClerkUser(domainUser: DomainUser): ClerkUser {
    return {
      id: domainUser.id,
      email: domainUser.email,
      name: domainUser.name,
      organizationId: domainUser.organizationId,
      role: this.mapDomainRole(domainUser.role)
    };
  }

  // 3. 역할 매핑 (외부 시스템 → 도메인)
  private static mapClerkRole(clerkRole: string): UserRole {
    const roleMap: Record<string, UserRole> = {
      'admin': UserRole.ADMIN,
      'basic_member': UserRole.MEMBER
    };
    return roleMap[clerkRole] || UserRole.MEMBER;
  }

  // 4. 이벤트 변환 (Webhook 처리)
  static toDomainEvent(clerkEvent: ClerkWebhookEvent): DomainEvent[] {
    switch (clerkEvent.type) {
      case 'organization.created':
        return [new OrganizationCreatedEvent({
          organizationId: clerkEvent.data.id,
          name: clerkEvent.data.name,
          ownerId: clerkEvent.data.created_by
        })];

      case 'organization.updated':
        return [new OrganizationUpdatedEvent({
          organizationId: clerkEvent.data.id,
          changes: this.extractChanges(clerkEvent.data)
        })];

      default:
        return [];
    }
  }
}

// 🎯 왜 도메인 내부에 포함?
// 1. 도메인 경계 보호: 외부 시스템의 영향을 격리
// 2. 변환 로직 집중: 한 곳에서 모든 변환 관리
// 3. 테스트 용이성: 도메인 테스트에서 외부 의존성 제거
// 4. 변경 대응: 외부 API 변경 시 한 곳만 수정
```

---

## 📚 관련 문서

- **[소프트웨어 디자인 가이드](../guide/software-design-guide.md)**: 상세 구현 가이드라인
- **[API 명세서 템플릿](../template/api-specification-template.md)**: API 문서 템플릿
- **[테크니컬 명세서 템플릿](../template/technical-specification-template.md)**: 구현 가이드 템플릿

---

이 코드 컨벤션을 따르면 **일관된 품질**의 코드를 작성할 수 있습니다! 🎯
