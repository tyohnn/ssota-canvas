# [Domain Name] - Technical Specification

Software Design을 기반으로 한 구체적인 구현 가이드입니다.

---

## 🎯 Implementation Overview

### 개발 우선순위
1. **Phase 1**: [핵심 기능 구현]
2. **Phase 2**: [고급 기능 구현]
3. **Phase 3**: [통합 및 최적화]

---

## 🏗️ Implementation Details

### 1. Value Objects 구현

#### 언제 사용하나?
- **불변 데이터**가 필요할 때 (이름, 이메일, 주소 등)
- **값 기반 동등성 비교**가 필요할 때
- **도메인 규칙**이 복잡할 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/value-objects/workspace-name.vo.ts
export class WorkspaceName {
  constructor(private readonly value: string) {
    // 생성 시 검증
    if (value.length < 1 || value.length > 100) {
      throw new Error('Workspace name must be between 1 and 100 characters');
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
      throw new Error('Workspace name can only contain letters, numbers, spaces, hyphens, and underscores');
    }
  }

  get value() { return this.value; }

  // 값 기반 동등성 비교 (Entity와의 차이점!)
  equals(other: WorkspaceName): boolean {
    return this.value === other.value;
  }

  getSlug(): string {
    return this.value.toLowerCase().replace(/\s+/g, '-');
  }
}
```

#### 사용 시나리오
- 사용자가 워크스페이스 이름을 입력할 때 즉시 검증
- 워크스페이스 이름 변경 시 기존 이름과 새 이름 비교
- URL 생성을 위한 슬러그 변환

---

### 2. Entities 구현

#### 언제 사용하나?
- **고유 식별자**가 있을 때 (ID)
- **수명주기**가 있을 때 (생성, 수정, 삭제)
- **변경 추적**이 필요할 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/entities/workspace.entity.ts
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

  // Getter (불변성 보장)
  get name(): WorkspaceName { return this._name; }
  get description(): string | undefined { return this._description; }
  get updatedAt(): Date { return this._updatedAt; }

  // 비즈니스 로직 (상태 변경)
  updateName(newName: WorkspaceName): void {
    this._name = newName;
    this._updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  // 도메인 규칙 검증
  canBeDeletedBy(userId: string): boolean {
    return this.createdBy === userId;
  }
}
```

#### 사용 시나리오
- 워크스페이스 생성 시 모든 필드 검증
- 이름 변경 시 변경 시간 자동 업데이트
- 삭제 권한 확인 시 생성자 ID 비교

---

### 3. Aggregates 구현

#### 언제 사용하나?
- **비즈니스 로직 캡슐화**가 필요할 때
- **일관성 경계**를 정의해야 할 때
- **상태 변경**과 **이벤트 발생**을 함께 관리할 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/aggregates/workspace.aggregate.ts
export class WorkspaceAggregate {
  private workspace: Workspace;
  private pages: Map<string, Page> = new Map();

  // Aggregate Root
  get id() { return this.workspace.id; }
  get name() { return this.workspace.name; }

  // 비즈니스 로직 실행
  async createWorkspace(command: CreateWorkspaceCommand): Promise<DomainEvent[]> {
    // 1. Policy 검증 (비즈니스 규칙)
    this.validateWorkspaceCreation(command);

    // 2. Workspace 생성
    this.workspace = new Workspace({
      id: generateId(),
      organizationId: command.organizationId,
      name: new WorkspaceName(command.name),
      description: command.description,
      createdBy: command.createdBy,
      createdAt: new Date()
    });

    const events: DomainEvent[] = [];

    // 3. Welcome Page 자동 생성
    const welcomePage = this.createWelcomePage();
    events.push(new WelcomePageCreatedEvent(welcomePage.id));

    // 4. 생성자 Owner 권한 설정
    events.push(new CreatorSetAsOwnerEvent(command.createdBy));

    // 5. Workspace 생성 완료 이벤트
    events.push(new WorkspaceCreatedEvent(this.workspace.id));

    return events;
  }

  private validateWorkspaceCreation(command: CreateWorkspaceCommand): void {
    if (command.name.length < 1) {
      throw new BusinessRuleError('Workspace name is required');
    }
  }

  private createWelcomePage(): Page {
    return new Page({
      id: generateId(),
      workspaceId: this.workspace.id,
      title: new PageTitle('Welcome'),
      order: 0,
      createdBy: this.workspace.createdBy,
      createdAt: new Date()
    });
  }
}
```

#### 사용 시나리오
- 워크스페이스 생성 시 모든 관련 객체 동시 생성
- 비즈니스 규칙 위반 시 즉시 예외 발생
- 생성된 모든 이벤트를 한 번에 반환

---

### 4. Commands 구현

#### 언제 사용하나?
- **사용자 의도**를 명확히 표현할 때
- **입력값 검증**이 필요할 때
- **비즈니스 로직 실행**의 시작점으로 사용할 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/commands/create-workspace.command.ts
export class CreateWorkspaceCommand {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly createdBy: string,
    public readonly templateId?: string
  ) {}

  // 정적 팩토리 메소드
  static fromInput(input: CreateWorkspaceInput): CreateWorkspaceCommand {
    return new CreateWorkspaceCommand(
      input.organizationId,
      input.name,
      input.description,
      input.createdBy,
      input.templateId
    );
  }

  // 도메인 규칙 검증
  validate(): void {
    if (this.name.length < 1 || this.name.length > 100) {
      throw new ValidationError('Workspace name must be between 1 and 100 characters');
    }
  }
}

// 입력 스키마 (사용자 입력 검증)
const createWorkspaceInputSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  templateId: z.string().uuid().optional()
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
```

#### 사용 시나리오
- Server Actions에서 사용자 입력을 Command로 변환
- Aggregate 실행 전 입력값 검증
- 이벤트 소싱에서 커맨드 저장

---

### 5. Events 구현

#### 언제 사용하나?
- **이미 일어난 일**을 알릴 때
- **크로스-도메인 통합**이 필요할 때
- **감사 로그**나 **히스토리**를 남길 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/events/workspace-created.event.ts
export class WorkspaceCreatedEvent {
  readonly type = 'WorkspaceCreated';

  constructor(
    public readonly aggregateId: string,  // 어떤 Aggregate에서 발생했는지
    public readonly data: {
      workspaceId: string;
      organizationId: string;
      name: string;
      description?: string;
      createdBy: string;
      createdAt: Date;
      templateId?: string;
    }
  ) {}

  // 이벤트 타입 안전성 보장
  static readonly TYPE = 'WorkspaceCreated' as const;
}

// Event Type Enum (런타임 타입 체크용)
export enum DomainEventType {
  WORKSPACE_CREATED = 'WorkspaceCreated',
  PAGE_CREATED = 'PageCreated',
  WORKSPACE_DELETED = 'WorkspaceDeleted'
}
```

#### 사용 시나리오
- 워크스페이스 생성 완료 시 Visual Canvas에 빈 캔버스 생성 요청
- 사용자에게 생성 완료 알림 전송
- 분석 시스템에 사용자 활동 로그 기록

---

### 6. Error Types 구현

#### 언제 사용하나?
- **비즈니스 규칙 위반** 시
- **시스템 장애** 시
- **사용자에게 적절한 메시지**를 전달할 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/errors/workspace.errors.ts
export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public readonly code: BusinessErrorCode,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

export enum BusinessErrorCode {
  WORKSPACE_LIMIT_EXCEEDED = 'WORKSPACE_LIMIT_EXCEEDED',
  INVALID_WORKSPACE_NAME = 'INVALID_WORKSPACE_NAME',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
}

export class SystemError extends Error {
  constructor(
    message: string,
    public readonly code: SystemErrorCode,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'SystemError';
  }
}

export enum SystemErrorCode {
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE'
}
```

#### 사용 시나리오
- 워크스페이스 생성 한도 초과 시 사용자에게 친화적 메시지
- 데이터베이스 연결 실패 시 시스템 로그 기록
- 권한 부족 시 적절한 에러 코드 반환

---

### 7. Services 구현

#### 언제 사용하나?
- **크로스 애그리거트 로직**이 필요할 때
- **외부 시스템 연동**이 필요할 때
- **복잡한 비즈니스 규칙**을 실행할 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/services/workspace.service.ts
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

  private async validateWorkspaceLimits(organizationId: string): Promise<void> {
    const currentCount = await this.workspaceRepository.countByOrganization(organizationId);
    const orgPlan = await this.organizationService.getPlan(organizationId);

    if (orgPlan === 'free' && currentCount >= 5) {
      throw new BusinessRuleError("워크스페이스 생성 한도 초과", BusinessErrorCode.WORKSPACE_LIMIT_EXCEEDED);
    }
  }
}
```

#### 사용 시나리오
- 워크스페이스 생성 시 권한과 한도 검증
- 여러 도메인의 서비스들과 협력
- 복잡한 비즈니스 로직 실행

---

### 8. Repository 구현

#### 언제 사용하나?
- **데이터 접근 추상화**가 필요할 때
- **테스트 용이성**을 위해 실제 DB와 분리할 때
- **쿼리 최적화**가 필요할 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/repositories/interfaces/workspace.repository.interface.ts
export interface IWorkspaceRepository {
  save(workspace: Workspace): Promise<void>;
  findById(id: string): Promise<Workspace | null>;
  findByOrganizationId(organizationId: string): Promise<Workspace[]>;
  findByOwnerId(ownerId: string): Promise<Workspace[]>;
  delete(id: string): Promise<void>;

  // 비즈니스 쿼리 메소드들
  countByOrganization(orgId: string): Promise<number>;
  findWithHierarchy(workspaceId: string): Promise<WorkspaceStructure>;
}

// apps/web/src/domains/[domain]/repositories/implementations/workspace.repository.ts
export class WorkspaceRepository implements IWorkspaceRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(entity: Workspace): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(workspaces).values({
        id: entity.id,
        organization_id: entity.organizationId,
        name: entity.name.value,
        description: entity.description,
        owner_id: entity.createdBy,
        created_at: entity.createdAt,
        updated_at: entity.updatedAt
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
```

#### 사용 시나리오
- Aggregate에서 상태 변경 후 저장
- 다양한 조건으로 워크스페이스 조회
- 통계 데이터 수집 (개수, 사용량 등)

---

### 9. Anti-Corruption Layer 구현

#### 언제 사용하나?
- **외부 시스템**과 도메인 모델 간 변환할 때
- **외부 API 변경**에 대응할 때
- **도메인 순수성**을 유지할 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/anti-corruption-layers/clerk-acl.ts
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
```

#### 사용 시나리오
- Clerk 사용자 정보를 도메인 User로 변환
- 도메인 이벤트를 Clerk Webhook으로 변환
- 외부 API 변경 시 한 곳에서만 수정

---

### 10. Server Actions 구현

#### 언제 사용하나?
- **HTTP 요청**을 처리할 때
- **도메인 로직**을 실행할 때
- **크로스-도메인 이벤트**를 처리할 때

#### 구현 예시
```typescript
// apps/web/src/server-actions/[domain]/[action-name].action.ts
'use server';

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
```

#### 사용 시나리오
- 사용자 입력을 받아 도메인 로직 실행
- 생성된 이벤트를 다른 도메인에 전달
- 적절한 에러 응답 반환

---

### 11. React Hooks 구현

#### 언제 사용하나?
- **UI 상태 관리**가 필요할 때
- **낙관적 업데이트**를 구현할 때
- **Server Actions**를 호출할 때

#### 구현 예시
```typescript
// apps/web/src/domains/[domain]/hooks/use-workspace-creation.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { createWorkspaceAction, CreateWorkspaceInput } from '../../server-actions/[domain]/create-workspace.action';
import { Workspace } from '../entities/workspace.entity';

export function useWorkspaceCreation() {
  const [isPending, startTransition] = useTransition();
  const [workspaces, setWorkspaces] = useOptimistic<Workspace[]>([]);

  const createWorkspace = async (input: CreateWorkspaceInput) => {
    // 1. 낙관적 업데이트할 새 워크스페이스
    const optimisticWorkspace: Workspace = {
      id: `temp-${Date.now()}`,
      organizationId: input.organizationId,
      name: new WorkspaceName(input.name),
      description: input.description,
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 2. 즉시 UI 업데이트
    setWorkspaces(prev => [...prev, optimisticWorkspace]);

    // 3. 실제 서버 액션 호출
    startTransition(async () => {
      try {
        const result = await createWorkspaceAction(input);

        if (result.success) {
          // 4. 성공 시 실제 데이터로 교체
          setWorkspaces(prev =>
            prev.map(ws =>
              ws.id === optimisticWorkspace.id ? result.data : ws
            )
          );
        } else {
          // 5. 실패 시 낙관적 항목 제거
          setWorkspaces(prev =>
            prev.filter(ws => ws.id !== optimisticWorkspace.id)
          );
          throw new Error(result.error);
        }
      } catch (error) {
        // 6. 에러 시 낙관적 항목 제거
        setWorkspaces(prev =>
          prev.filter(ws => ws.id !== optimisticWorkspace.id)
        );
        throw error;
      }
    });
  };

  return { workspaces, createWorkspace, isPending };
}
```

#### 사용 시나리오
- 워크스페이스 생성 버튼 클릭 시 즉시 UI 업데이트
- 서버 응답 대기 중 로딩 상태 표시
- 실패 시 이전 상태로 롤백

---

## 🧪 Testing Strategy

### Unit Tests

#### Aggregate 테스트
```typescript
describe('WorkspaceAggregate', () => {
  let aggregate: WorkspaceAggregate;

  beforeEach(() => {
    aggregate = new WorkspaceAggregate();
  });

  it('should create workspace and return events', async () => {
    const command = new CreateWorkspaceCommand(
      'org-123',
      'Test Workspace',
      'Test Description',
      'user-123'
    );

    const events = await aggregate.createWorkspace(command);

    expect(events).toHaveLength(3);
    expect(events[0]).toBeInstanceOf(WorkspaceCreatedEvent);
    expect(events[1]).toBeInstanceOf(WelcomePageCreatedEvent);
    expect(events[2]).toBeInstanceOf(CreatorSetAsOwnerEvent);
  });

  it('should throw error when workspace name is invalid', async () => {
    const command = new CreateWorkspaceCommand(
      'org-123',
      '',  // 빈 이름
      'Test Description',
      'user-123'
    );

    await expect(aggregate.createWorkspace(command))
      .rejects.toThrow(BusinessRuleError);
  });
});
```

### Integration Tests

#### Server Actions 테스트
```typescript
describe('createWorkspaceAction', () => {
  it('should handle end-to-end workspace creation', async () => {
    const input = {
      organizationId: 'org-123',
      name: 'Integration Test Workspace',
      description: 'Test Description'
    };

    const result = await createWorkspaceAction(input);

    expect(result.success).toBe(true);
    expect(result.data.workspaceId).toBeDefined();
    expect(result.data.name).toBe('Integration Test Workspace');
  });

  it('should handle validation errors', async () => {
    const input = {
      organizationId: 'org-123',
      name: '',  // 빈 이름
      description: 'Test Description'
    };

    const result = await createWorkspaceAction(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe(WorkspaceError.INVALID_INPUT);
  });
});
```

### Mocking 전략
```typescript
// Repository Mocking
const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  countByOrganization: jest.fn()
};

// Service Mocking
const mockAuthService = {
  getCurrentUserId: jest.fn()
};

// External Service Mocking
const mockOrganizationService = {
  userCanCreateWorkspace: jest.fn(),
  getPlan: jest.fn()
};
```

---

이 Technical Specification은 [Domain Name]의 구현을 위한 완전한 가이드입니다.
