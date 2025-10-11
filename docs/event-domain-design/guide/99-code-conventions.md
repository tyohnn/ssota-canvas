# 쏘타 프로젝트 코드 컨벤션 가이드라인

이 문서는 쏘타 프로젝트의 코드 작성 표준과 컨벤션을 정의합니다.
**기술 스택**: Next.js 15, Supabase Auth, Drizzle ORM, RLS, TypeScript

## 📋 목차

### 🎯 기본 컨벤션
- **[네이밍 컨벤션](#-네이밍-컨벤션)**
  - 파일 네이밍
  - 클래스 네이밍
  - 메소드 네이밍
- **[타입 정의 디테일](#-타입-정의-디테일)**
  - Command 타입
  - Event 타입

### 🧪 테스트 및 전략
- **[테스트 구조와 실행](#-테스트-구조와-실행)**
  - Testing Strategy 작성법
  - 테스트 파일 구조
  - 테스트 실행 스크립트
  - 테스트 데이터 전략
  - Mock 전략

### 🎨 Frontend 코드 작성법
- **[React Context 작성법](#react-context-작성법)**
  - Context State 정의
  - Provider 구현
  - Context Hook
- **[Custom Hooks 작성법](#custom-hooks-작성법)**
  - Context 확장
  - 비즈니스 로직
  - 액션 래퍼
- **[React Components 작성법](#react-components-작성법)**
  - List Component
  - Card Component
  - Form Component

### 💎 DDD 컴포넌트별 상세 가이드
- **[Value Object 상세 정의법](#value-object-상세-정의법)**
- **[Entity 상세 정의법](#entity-상세-정의법)**
- **[Aggregate 상세 정의법](#aggregate-상세-정의법)**
- **[Command 상세 정의법](#command-상세-정의법)**
- **[Event 상세 정의법](#event-상세-정의법)**
- **[Error Types 상세 정의법](#error-types-상세-정의법)**
- **[Service 코드 작성법](#service-코드-작성법)**
- **[Repository 작성법](#repository-작성법-drizzle--rls)**
- **[Server Actions 작성법](#server-actions-작성법)**
- **[Anti-Corruption Layer 작성법](#anti-corruption-layer-작성법)**

### 📨 DTO 직렬화 컨벤션
- **[Next.js Server Actions 직렬화 제약](#nextjs-server-actions-직렬화-제약)**
- **[CQRS Read/Write 분리](#cqrs-readwrite-분리)**
- **[DTO 타입 정의](#dto-타입-정의)**
- **[Service에서 직렬화](#service에서-직렬화)**
- **[Server Actions에서 DTO 반환](#server-actions에서-dto-반환)**
- **[레이어별 책임](#레이어별-책임)**
- **[일반적인 실수](#일반적인-실수)**
- **[DTO 검증 체크리스트](#dto-검증-체크리스트)**

### 📚 관련 문서
- **[도메인 설계 문서](#도메인-설계-문서)**
- **[Story 및 Sprint 관리](#story-및-sprint-관리)**
- **[기술 스택 참조](#기술-스택-참조)**

---

## 🎯 네이밍 컨벤션

### 1. 파일 네이밍
```typescript
// ✅ 좋은 예시 (실제 구현 기준)
domains/
├── user-management/
│   ├── shared/                           // 공유 도메인 객체들
│   │   ├── aggregates/
│   │   │   ├── user.aggregate.ts         // Aggregate 클래스
│   │   │   └── organization.aggregate.ts
│   │   ├── entities/
│   │   │   ├── user.entity.ts           // Entity 클래스
│   │   │   └── organization.entity.ts
│   │   ├── value-objects/
│   │   │   ├── user-email.vo.ts         // Value Object
│   │   │   └── ids.vo.ts
│   │   ├── commands/
│   │   │   └── index.ts                 // Command 인터페이스들
│   │   ├── events/
│   │   │   └── index.ts                 // Event 클래스들
│   │   ├── dtos/
│   │   │   └── index.ts                 // DTO 인터페이스들
│   │   ├── errors/
│   │   │   └── user-management.error.ts // 도메인 에러
│   │   └── types/
│   │       └── index.ts                 // 공통 타입들
│   ├── backend/                          // 백엔드 구현
│   │   ├── repositories/
│   │   │   ├── interfaces/              // Repository 인터페이스
│   │   │   │   ├── user.repository.interface.ts
│   │   │   │   └── organization.repository.interface.ts
│   │   │   └── implementations/         // Repository 구현체
│   │   │       ├── drizzle-user.repository.ts
│   │   │       └── drizzle-organization.repository.ts
│   │   ├── services/
│   │   │   └── user-management.service.ts // Domain Service
│   │   ├── anti-corruption-layers/
│   │   │   └── supabase-auth-acl.ts     // Supabase Auth 변환
│   │   └── read-models/
│   │       ├── user-profile.view.ts     // Read Model
│   │       └── user-organization.view.ts
│   ├── frontend/                         // 프론트엔드 구현
│   │   ├── contexts/
│   │   │   └── organization-context.tsx // React Context
│   │   ├── hooks/
│   │   │   └── use-organization.ts      // Custom Hook
│   │   ├── components/
│   │   │   └── organization-switcher.tsx // UI 컴포넌트
│   │   └── utils/
│   │       └── cookie-helpers.ts        // 유틸리티
│   └── actions/
│       └── user-management.actions.ts   // Server Actions
```

### 2. 클래스 네이밍
```typescript
// ✅ Aggregate (항상 Aggregate 접미사)
export class UserAggregate {
  // Aggregate Root 역할 수행
}

// ✅ Entity (Entity 접미사 생략 가능)
export class User {
  // 식별자 기반 객체
}

// ✅ Value Object (VO 접미사 생략 가능)
export class UserEmail {
  // 불변 데이터
}

// ✅ Command (인터페이스로 정의)
export interface CreateUserProfileCommand {
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

// ✅ Anti-Corruption Layer (ACL 접미사)
export class SupabaseAuthACL {
  // Supabase Auth 변환
}

// ✅ Anti-Corruption Layer Service
export class SupabaseAuthService {
  // Supabase Auth 서비스
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
// ✅ Command는 인터페이스로 정의 (실제 구현 기준)
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

export interface GetUserOrganizationsCommand {
  userId: string;                    // 사용자 ID
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

### Testing Strategy 작성법
```typescript
// 🎯 테스트 전략 = TDD 기반 개발을 위한 테스트 계획
export interface TestingStrategy {
  // 테스트 범위
  unitTests: UnitTestScope[];
  integrationTests: IntegrationTestScope[];
  e2eTests: E2ETestScope[];
  
  // 테스트 도구
  testingFramework: 'vitest';
  e2eFramework: 'playwright';
  coverageTool: 'vitest-coverage';
  
  // 테스트 데이터
  testDataStrategy: 'fixtures' | 'factories' | 'builders';
  mockStrategy: 'jest-mock' | 'vitest-mock';
}

// 🎯 Unit Test Scope = 도메인 객체 단위 테스트
export interface UnitTestScope {
  target: 'ValueObject' | 'Entity' | 'Aggregate' | 'Command' | 'Event';
  testCases: TestCase[];
  coverage: number; // 최소 커버리지 목표
}

// 🎯 Integration Test Scope = 레이어 간 통합 테스트
export interface IntegrationTestScope {
  target: 'Repository' | 'Service' | 'ServerAction' | 'Hook';
  dependencies: string[]; // 의존성 목록
  testCases: TestCase[];
  coverage: number;
}

// 🎯 E2E Test Scope = 사용자 시나리오 테스트
export interface E2ETestScope {
  scenario: string; // 사용자 시나리오
  userJourney: UserJourneyStep[];
  testCases: TestCase[];
  browsers: ('chrome' | 'firefox' | 'safari')[];
}

// 🎯 Test Case = Given-When-Then 패턴
export interface TestCase {
  name: string;
  description: string;
  given: string; // 전제 조건
  when: string;  // 실행할 액션
  then: string;  // 기대 결과
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

// 🎯 테스트 파일 구조
export const TEST_FILE_STRUCTURE = {
  // Unit Tests
  unit: {
    valueObjects: 'src/domains/[domain]/shared/value-objects/__tests__/[vo-name].test.ts',
    entities: 'src/domains/[domain]/shared/entities/__tests__/[entity-name].test.ts',
    aggregates: 'src/domains/[domain]/shared/aggregates/__tests__/[aggregate-name].test.ts',
    commands: 'src/domains/[domain]/shared/commands/__tests__/[command-name].test.ts',
    events: 'src/domains/[domain]/shared/events/__tests__/[event-name].test.ts',
  },
  
  // Integration Tests
  integration: {
    repositories: 'src/domains/[domain]/backend/repositories/__tests__/[repo-name].integration.test.ts',
    services: 'src/domains/[domain]/backend/services/__tests__/[service-name].integration.test.ts',
    serverActions: 'src/domains/[domain]/actions/__tests__/[action-name].integration.test.ts',
    hooks: 'src/domains/[domain]/frontend/hooks/__tests__/[hook-name].integration.test.ts',
  },
  
  // E2E Tests
  e2e: {
    userJourneys: 'tests/e2e/[domain]/[journey-name].e2e.test.ts',
    components: 'tests/e2e/[domain]/components/[component-name].e2e.test.ts',
  }
};

// 🎯 테스트 실행 스크립트
export const TEST_SCRIPTS = {
  // 개발 중 테스트
  dev: {
    unit: 'vitest domains/*/shared/**/__tests__/*.test.ts',
    integration: 'vitest domains/*/backend/**/__tests__/*.integration.test.ts',
    watch: 'vitest --watch',
    debug: 'vitest --inspect-brk',
  },
  
  // CI/CD 테스트
  ci: {
    unit: 'vitest run domains/*/shared/**/__tests__/*.test.ts --coverage',
    integration: 'vitest run domains/*/backend/**/__tests__/*.integration.test.ts --coverage',
    e2e: 'playwright test --config=playwright.config.ts',
    coverage: 'vitest run --coverage --reporter=json',
  },
  
  // 특정 도메인 테스트
  domain: {
    unit: 'vitest domains/[domain]/shared/**/__tests__/*.test.ts',
    integration: 'vitest domains/[domain]/backend/**/__tests__/*.integration.test.ts',
    e2e: 'playwright test tests/e2e/[domain]/',
  }
};

// 🎯 테스트 데이터 전략
export const TEST_DATA_STRATEGY = {
  // Fixtures - 정적 테스트 데이터
  fixtures: {
    location: 'tests/fixtures/[domain]/',
    format: 'json' | 'ts',
    examples: ['user-fixtures.json', 'organization-fixtures.json'],
  },
  
  // Factories - 동적 테스트 데이터 생성
  factories: {
    location: 'tests/factories/[domain]/',
    format: 'ts',
    examples: ['user.factory.ts', 'organization.factory.ts'],
  },
  
  // Builders - 복잡한 객체 생성
  builders: {
    location: 'tests/builders/[domain]/',
    format: 'ts',
    examples: ['user.builder.ts', 'organization.builder.ts'],
  }
};

// 🎯 Mock 전략
export const MOCK_STRATEGY = {
  // Repository Mock
  repositories: {
    method: 'vitest.mock()',
    location: 'tests/mocks/[domain]/repositories/',
    examples: ['user.repository.mock.ts', 'organization.repository.mock.ts'],
  },
  
  // Service Mock
  services: {
    method: 'vitest.mock()',
    location: 'tests/mocks/[domain]/services/',
    examples: ['user.service.mock.ts', 'organization.service.mock.ts'],
  },
  
  // External API Mock
  external: {
    method: 'msw (Mock Service Worker)',
    location: 'tests/mocks/external/',
    examples: ['supabase.mock.ts', 'stripe.mock.ts'],
  }
};

// 🎯 테스트 전략 파일 위치 및 네이밍
// 파일: src/domains/[domain]/testing-strategy.md
// 역할: [Domain] 도메인의 테스트 전략을 정의하는 문서

// 🎯 테스트 전략 작성 원칙
// 1. TDD 기반: 테스트 우선 개발
// 2. 피라미드 구조: Unit > Integration > E2E
// 3. Given-When-Then: 명확한 테스트 시나리오
// 4. 커버리지 목표: 최소 80% 이상
// 5. 자동화: CI/CD 파이프라인 통합
// 6. 유지보수성: 테스트 코드의 품질 관리
```

## Frontend 코드 작성법

### React Context 작성법
```typescript
// 🎯 React Context = 전역 상태 관리 + 비즈니스 로직
export interface [EntityName]ContextState {
  // 상태
  [entityName]s: [EntityName]View[];
  selected[EntityName]Id: string | null;
  loading: boolean;
  error: string | null;
  
  // 액션
  select[EntityName]: ([entityName]Id: string) => void;
  refresh[EntityName]s: () => Promise<void>;
  create[EntityName]: (input: Create[EntityName]Input) => Promise<[EntityName]View>;
  update[EntityName]: (input: Update[EntityName]Input) => Promise<[EntityName]View>;
  delete[EntityName]: ([entityName]Id: string) => Promise<void>;
  
  // 유틸리티
  selected[EntityName]: [EntityName]View | null;
  has[EntityName]s: boolean;
  canCreate[EntityName]: boolean;
}

// 🎯 Context Provider = 상태 관리 + 비즈니스 로직
export function [EntityName]Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<[EntityName]ContextState>({
    [entityName]s: [],
    selected[EntityName]Id: null,
    loading: false,
    error: null,
  });

  // 🎯 쿠키 기반 상태 복원
  useEffect(() => {
    const saved[EntityName]Id = getCookie('[entityName]Id');
    if (saved[EntityName]Id) {
      setState(prev => ({ ...prev, selected[EntityName]Id: saved[EntityName]Id }));
    }
  }, []);

  // 🎯 [EntityName] 선택
  const select[EntityName] = useCallback(([entityName]Id: string) => {
    setState(prev => ({ ...prev, selected[EntityName]Id: [entityName]Id }));
    setCookie('[entityName]Id', [entityName]Id, { maxAge: 60 * 60 * 24 * 30 }); // 30일
  }, []);

  // 🎯 [EntityName] 목록 새로고침
  const refresh[EntityName]s = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [entityName]s = await get[EntityName]sAction();
      setState(prev => ({ ...prev, [entityName]s, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }));
    }
  }, []);

  // 🎯 [EntityName] 생성
  const create[EntityName] = useCallback(async (input: Create[EntityName]Input) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const new[EntityName] = await create[EntityName]Action(input);
      setState(prev => ({ 
        ...prev, 
        [entityName]s: [...prev.[entityName]s, new[EntityName]], 
        loading: false 
      }));
      return new[EntityName];
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }));
      throw error;
    }
  }, []);

  // 🎯 [EntityName] 업데이트
  const update[EntityName] = useCallback(async (input: Update[EntityName]Input) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const updated[EntityName] = await update[EntityName]Action(input);
      setState(prev => ({ 
        ...prev, 
        [entityName]s: prev.[entityName]s.map([entityName] => 
          [entityName].id === input.[entityName]Id ? updated[EntityName] : [entityName]
        ), 
        loading: false 
      }));
      return updated[EntityName];
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }));
      throw error;
    }
  }, []);

  // 🎯 [EntityName] 삭제
  const delete[EntityName] = useCallback(async ([entityName]Id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await delete[EntityName]Action([entityName]Id);
      setState(prev => ({ 
        ...prev, 
        [entityName]s: prev.[entityName]s.filter([entityName] => [entityName].id !== [entityName]Id),
        selected[EntityName]Id: prev.selected[EntityName]Id === [entityName]Id ? null : prev.selected[EntityName]Id,
        loading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }));
      throw error;
    }
  }, []);

  // 🎯 파생 상태 계산
  const selected[EntityName] = useMemo(() => {
    return state.[entityName]s.find([entityName] => [entityName].id === state.selected[EntityName]Id) || null;
  }, [state.[entityName]s, state.selected[EntityName]Id]);

  const has[EntityName]s = state.[entityName]s.length > 0;
  const canCreate[EntityName] = !state.loading && !state.error;

  // 🎯 Context 값
  const contextValue: [EntityName]ContextState = {
    // 상태
    [entityName]s: state.[entityName]s,
    selected[EntityName]Id: state.selected[EntityName]Id,
    loading: state.loading,
    error: state.error,
    
    // 액션
    select[EntityName],
    refresh[EntityName]s,
    create[EntityName],
    update[EntityName],
    delete[EntityName],
    
    // 유틸리티
    selected[EntityName],
    has[EntityName]s,
    canCreate[EntityName],
  };

  return (
    <[EntityName]Context.Provider value={contextValue}>
      {children}
    </[EntityName]Context.Provider>
  );
}

// 🎯 Context Hook = Context 사용을 위한 커스텀 훅
export function use[EntityName]Context(): [EntityName]ContextState {
  const context = useContext([EntityName]Context);
  
  if (!context) {
    throw new Error('use[EntityName]Context must be used within [EntityName]Provider');
  }
  
  return context;
}

// 🎯 Context 파일 위치 및 네이밍
// 파일: src/domains/[domain]/frontend/contexts/[entity-name]-context.tsx
// 컴포넌트: [EntityName]Provider, [EntityName]Context
// 훅: use[EntityName]Context
// 역할: [EntityName] 관련 전역 상태 관리 및 비즈니스 로직 제공

// 🎯 Context 작성 원칙
// 1. 단일 책임: 하나의 도메인에 대한 상태 관리
// 2. 상태 분리: 로컬 상태와 전역 상태 구분
// 3. 액션 제공: CRUD 작업을 위한 메소드
// 4. 에러 처리: 사용자 친화적 에러 메시지
// 5. 성능 최적화: useCallback, useMemo 활용
// 6. 쿠키 연동: 상태 지속성을 위한 쿠키 저장
```

### Custom Hooks 작성법
```typescript
// 🎯 Custom Hook = Context 확장 + 비즈니스 로직
export function use[EntityName]([entityName]Id?: string) {
  const context = use[EntityName]Context();
  
  // 🎯 특정 [EntityName] 로딩
  const [localState, setLocalState] = useState<{
    [entityName]: [EntityName]View | null;
    loading: boolean;
    error: string | null;
  }>({
    [entityName]: null,
    loading: false,
    error: null,
  });

  // 🎯 특정 [EntityName] 로드
  const load[EntityName] = useCallback(async () => {
    if (![entityName]Id) return;

    setLocalState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [entityName] = await get[EntityName]Action([entityName]Id);
      setLocalState(prev => ({ 
        ...prev, 
        [entityName], 
        loading: false 
      }));
    } catch (error) {
      setLocalState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }));
    }
  }, [[entityName]Id]);

  // 🎯 초기 로딩
  useEffect(() => {
    if ([entityName]Id) {
      load[EntityName]();
    }
  }, [load[EntityName], [entityName]Id]);

  // 🎯 파생 상태 계산
  const selected[EntityName] = useMemo(() => {
    if ([entityName]Id) {
      return localState.[entityName];
    }
    return context.selected[EntityName];
  }, [[entityName]Id, localState.[entityName], context.selected[EntityName]]);

  const isLoading = [entityName]Id ? localState.loading : context.loading;
  const error = [entityName]Id ? localState.error : context.error;

  // 🎯 비즈니스 로직 메소드들
  const canEdit = useMemo(() => {
    if (!selected[EntityName]) return false;
    return selected[EntityName].canBeEditedBy?.(currentUserId) ?? false;
  }, [selected[EntityName]]);

  const canDelete = useMemo(() => {
    if (!selected[EntityName]) return false;
    return selected[EntityName].canBeDeletedBy?.(currentUserId) ?? false;
  }, [selected[EntityName]]);

  const isOwner = useMemo(() => {
    if (!selected[EntityName]) return false;
    return selected[EntityName].createdBy === currentUserId;
  }, [selected[EntityName]]);

  // 🎯 액션 래퍼들 (Context 액션 + 로컬 상태 업데이트)
  const create[EntityName]WithUpdate = useCallback(async (input: Create[EntityName]Input) => {
    try {
      const new[EntityName] = await context.create[EntityName](input);
      
      // 로컬 상태가 있으면 업데이트
      if ([entityName]Id) {
        setLocalState(prev => ({ ...prev, [entityName]: new[EntityName] }));
      }
      
      return new[EntityName];
    } catch (error) {
      throw error;
    }
  }, [context.create[EntityName], [entityName]Id]);

  const update[EntityName]WithUpdate = useCallback(async (input: Update[EntityName]Input) => {
    try {
      const updated[EntityName] = await context.update[EntityName](input);
      
      // 로컬 상태가 있으면 업데이트
      if ([entityName]Id && input.[entityName]Id === [entityName]Id) {
        setLocalState(prev => ({ ...prev, [entityName]: updated[EntityName] }));
      }
      
      return updated[EntityName];
    } catch (error) {
      throw error;
    }
  }, [context.update[EntityName], [entityName]Id]);

  const delete[EntityName]WithUpdate = useCallback(async ([entityName]IdToDelete: string) => {
    try {
      await context.delete[EntityName]([entityName]IdToDelete);
      
      // 로컬 상태가 있으면 초기화
      if ([entityName]Id && [entityName]IdToDelete === [entityName]Id) {
        setLocalState(prev => ({ ...prev, [entityName]: null }));
      }
    } catch (error) {
      throw error;
    }
  }, [context.delete[EntityName], [entityName]Id]);

  // 🎯 유틸리티 메소드들
  const refresh = useCallback(async () => {
    if ([entityName]Id) {
      await load[EntityName]();
    } else {
      await context.refresh[EntityName]s();
    }
  }, [[entityName]Id, load[EntityName], context.refresh[EntityName]s]);

  const clearError = useCallback(() => {
    if ([entityName]Id) {
      setLocalState(prev => ({ ...prev, error: null }));
    } else {
      // Context 에러 클리어는 Context에서 처리
    }
  }, [[entityName]Id]);

  return {
    // 상태
    [entityName]s: context.[entityName]s,
    selected[EntityName],
    loading: isLoading,
    error,
    
    // 액션
    select[EntityName]: context.select[EntityName],
    refresh,
    create[EntityName]: create[EntityName]WithUpdate,
    update[EntityName]: update[EntityName]WithUpdate,
    delete[EntityName]: delete[EntityName]WithUpdate,
    
    // 유틸리티
    has[EntityName]s: context.has[EntityName]s,
    canCreate[EntityName]: context.canCreate[EntityName],
    canEdit,
    canDelete,
    isOwner,
    clearError,
    
    // 로컬 상태 (특정 [EntityName] 로딩 시)
    localLoading: localState.loading,
    localError: localState.error,
  };
}

// 🎯 Hook 파일 위치 및 네이밍
// 파일: src/domains/[domain]/frontend/hooks/use-[entity-name].ts
// 함수: use[EntityName]
// 역할: [EntityName] Context를 확장하여 특정 [EntityName] 로딩 및 비즈니스 로직 제공

// 🎯 Custom Hook 작성 원칙
// 1. Context 확장: 기존 Context 기능을 활용
// 2. 로컬 상태: 특정 [EntityName] 로딩을 위한 로컬 상태
// 3. 비즈니스 로직: 권한 체크, 상태 계산 등
// 4. 액션 래퍼: Context 액션 + 로컬 상태 업데이트
// 5. 에러 처리: 로컬 에러와 전역 에러 구분
// 6. 성능 최적화: useMemo, useCallback 활용
```

### React Components 작성법
```typescript
// 🎯 React Component = UI 렌더링 + 사용자 상호작용
export interface [EntityName]ComponentProps {
  [entityName]Id?: string;
  on[EntityName]Select?: ([entityName]Id: string) => void;
  on[EntityName]Create?: ([entityName]: [EntityName]View) => void;
  on[EntityName]Update?: ([entityName]: [EntityName]View) => void;
  on[EntityName]Delete?: ([entityName]Id: string) => void;
  className?: string;
  children?: React.ReactNode;
}

// 🎯 [EntityName] List Component
export function [EntityName]List({ 
  on[EntityName]Select,
  className 
}: [EntityName]ComponentProps) {
  const { 
    [entityName]s, 
    loading, 
    error, 
    select[EntityName],
    refresh 
  } = use[EntityName]();

  // 🎯 에러 상태 처리
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          다시 시도
        </Button>
      </div>
    );
  }

  // 🎯 로딩 상태 처리
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">로딩 중...</span>
      </div>
    );
  }

  // 🎯 빈 상태 처리
  if ([entityName]s.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">아직 [EntityName]이 없습니다</p>
        <Button onClick={() => on[EntityName]Select?.('new')}>
          [EntityName] 생성
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {[entityName]s.map(([entityName]) => (
        <[EntityName]Card
          key={[entityName].id}
          [entityName]={[entityName]}
          onClick={() => {
            select[EntityName]([entityName].id);
            on[EntityName]Select?.([entityName].id);
          }}
        />
      ))}
    </div>
  );
}

// 🎯 [EntityName] Card Component
export function [EntityName]Card({ 
  [entityName], 
  onClick,
  className 
}: { 
  [entityName]: [EntityName]View;
  onClick?: () => void;
  className?: string;
}) {
  const { canEdit, canDelete, isOwner } = use[EntityName]([entityName].id);

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-colors hover:bg-gray-50",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{[entityName].name}</h3>
            {[entityName].description && (
              <p className="text-gray-600 text-sm mt-1">
                {[entityName].description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>생성일: {formatDate([entityName].createdAt)}</span>
              {isOwner && <Badge variant="secondary">소유자</Badge>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // 편집 모달 열기
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // 삭제 확인 모달 열기
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 🎯 [EntityName] Form Component
export function [EntityName]Form({ 
  [entityName]Id,
  onSuccess,
  className 
}: [EntityName]ComponentProps) {
  const { 
    selected[EntityName], 
    loading, 
    error,
    create[EntityName], 
    update[EntityName] 
  } = use[EntityName]([entityName]Id);

  const [formData, setFormData] = useState({
    name: selected[EntityName]?.name || '',
    description: selected[EntityName]?.description || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if ([entityName]Id) {
        // 업데이트
        const updated[EntityName] = await update[EntityName]({
          [entityName]Id,
          ...formData,
        });
        onSuccess?.(updated[EntityName]);
      } else {
        // 생성
        const new[EntityName] = await create[EntityName](formData);
        onSuccess?.(new[EntityName]);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🎯 폼 필드 변경 처리
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div>
        <Label htmlFor="name">이름</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder="[EntityName] 이름을 입력하세요"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="[EntityName] 설명을 입력하세요"
          rows={3}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {[entityName]Id ? '업데이트 중...' : '생성 중...'}
            </>
          ) : (
            [entityName]Id ? '업데이트' : '생성'
          )}
        </Button>
      </div>
    </form>
  );
}

// 🎯 Component 파일 위치 및 네이밍
// 파일: src/domains/[domain]/frontend/components/[entity-name]-[component-type].tsx
// 컴포넌트: [EntityName]List, [EntityName]Card, [EntityName]Form
// 역할: [EntityName] 관련 UI 컴포넌트 및 사용자 상호작용 처리

// 🎯 Component 작성 원칙
// 1. 단일 책임: 하나의 UI 기능만 담당
// 2. Props 인터페이스: 명확한 타입 정의
// 3. 상태 관리: Custom Hook 활용
// 4. 에러 처리: 사용자 친화적 에러 표시
// 5. 로딩 상태: 적절한 로딩 인디케이터
// 6. 접근성: ARIA 속성 및 키보드 네비게이션
// 7. 반응형: 모바일 및 데스크톱 대응
```

---


## 💎 DDD 컴포넌트별 상세 가이드

### Value Object 상세 정의법
```typescript
// 🎯 Value Object = 불변 데이터 + 동등성 비교
export class [EntityName]Name {
  constructor(private readonly value: string) {
    // 1. 생성 시 검증
    if (value.length < 1 || value.length > 100) {
      throw new Error('[EntityName] name must be between 1 and 100 characters');
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
      throw new Error('[EntityName] name can only contain letters, numbers, spaces, hyphens, and underscores');
    }
  }

  // 2. 불변성 보장
  get value() { return this.value; }

  // 3. 값 기반 동등성 비교 (Entity와의 차이점!)
  equals(other: [EntityName]Name): boolean {
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

// 🎯 Value Object 파일 위치 및 네이밍
// 파일: src/domains/[domain]/shared/value-objects/[entity-name]-name.vo.ts
// 클래스: [EntityName]Name (VO 접미사 생략 가능)
// 역할: [EntityName] 이름의 유효성을 검증하고 도메인 로직을 캡슐화

// 🎯 언제 Value Object를 사용해야 할까?
// 1. 값이 불변해야 할 때 (이름, 이메일, 주소 등)
// 2. 값 기반 동등성 비교가 필요할 때
// 3. 도메인 규칙이 복잡할 때 (유효성 검증, 변환 로직)
// 4. 여러 Entity에서 공유되는 개념일 때
```

### Entity 상세 정의법
```typescript
// 🎯 Entity = 식별자 + 변경 가능성 + 수명주기
export class [EntityName] {
  private _name: [EntityName]Name;
  private _description?: string;
  private _updatedAt: Date;

  constructor(
    public readonly id: [EntityName]Id,      // Value Object로 식별자
    public readonly organizationId: string,  // 불변 필드
    name: [EntityName]Name,                  // Value Object
    description?: string,
    public readonly createdBy: string,       // 불변 필드
    public readonly createdAt: Date          // 불변 필드
  ) {
    this._name = name;
    this._description = description;
    this._updatedAt = new Date();
  }

  // 1. Getter (불변성 보장)
  get name(): [EntityName]Name { return this._name; }
  get description(): string | undefined { return this._description; }
  get updatedAt(): Date { return this._updatedAt; }

  // 2. 비즈니스 로직 (상태 변경)
  updateName(newName: [EntityName]Name): void {
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

// 🎯 Entity 파일 위치 및 네이밍
// 파일: src/domains/[domain]/shared/entities/[entity-name].entity.ts
// 클래스: [EntityName] (Entity 접미사 생략 가능)
// 역할: [EntityName]의 핵심 정보와 비즈니스 로직을 캡슐화

// 🎯 언제 Entity를 사용해야 할까?
// 1. 고유 식별자가 있을 때 (ID)
// 2. 수명주기가 있을 때 (생성, 수정, 삭제)
// 3. 변경 추적이 필요할 때 (updatedAt, createdAt)
// 4. 비즈니스 로직이 복잡할 때
```

### Aggregate 상세 정의법
```typescript
// 🎯 Aggregate = 일관성 경계 + 비즈니스 로직 + 도메인 이벤트
export class [EntityName]Aggregate {
  private [entityName]: [EntityName];
  private [relatedEntities]: Map<string, [RelatedEntity]> = new Map();

  constructor([entityName]?: [EntityName]) {
    this.[entityName] = [entityName];
  }

  // 1. Aggregate Root getters
  get id(): [EntityName]Id { return this.[entityName].id; }
  get name(): [EntityName]Name { return this.[entityName].name; }
  get entity(): [EntityName] { return this.[entityName]; }

  // 2. 비즈니스 로직 실행
  create[EntityName](command: Create[EntityName]Command): DomainEvent[] {
    // 1. Policy validation (business rules)
    this.validate[EntityName]Creation(command);

    // 2. [EntityName] creation
    this.[entityName] = new [EntityName](
      new [EntityName]Id(generateId()),
      command.organizationId,
      new [EntityName]Name(command.name),
      command.description,
      command.createdBy,
      new Date()
    );

    const events: DomainEvent[] = [];

    // 3. Auto-create related entities
    const [relatedEntity] = this.create[RelatedEntity]();
    events.push(new [RelatedEntity]CreatedEvent([relatedEntity].id));

    // 4. Set creator permissions
    events.push(new CreatorSetAsOwnerEvent(command.createdBy));

    // 5. [EntityName] creation completion event
    events.push(new [EntityName]CreatedEvent(this.[entityName].id));

    return events;
  }

  // 3. 비즈니스 규칙 검증
  private validate[EntityName]Creation(command: Create[EntityName]Command): void {
    if (command.name.length < 1) {
      throw new BusinessRuleError('[EntityName] name is required');
    }
    // 추가 비즈니스 규칙들...
  }

  // 4. 관련 엔티티 생성
  private create[RelatedEntity](): [RelatedEntity] {
    return new [RelatedEntity](
      new [RelatedEntity]Id(generateId()),
      this.[entityName].id,
      new [RelatedEntity]Title('Welcome'),
      0,
      this.[entityName].createdBy,
      new Date()
    );
  }
}

// 🎯 Aggregate 파일 위치 및 네이밍
// 파일: src/domains/[domain]/shared/aggregates/[entity-name].aggregate.ts
// 클래스: [EntityName]Aggregate (항상 Aggregate 접미사)
// 역할: [EntityName] 관련 도메인 로직과 일관성 경계를 담당하는 Aggregate Root

// 🎯 언제 Aggregate를 사용해야 할까?
// 1. 여러 Entity가 함께 일관성을 유지해야 할 때
// 2. 복잡한 비즈니스 규칙이 있을 때
// 3. 도메인 이벤트를 발생시켜야 할 때
// 4. 트랜잭션 경계가 필요할 때
```

### Command 상세 정의법
```typescript
// 🎯 Command = 의도 표현 + 입력 검증
export interface Create[EntityName]Command {
  organizationId: string;                    // 조직 식별자 (필수)
  name: string;                             // [EntityName] 이름 (필수, 1-100자)
  description?: string;                     // 설명 (선택적, 최대 1000자)
  createdBy: string;                        // 생성자 식별자 (필수)
  templateId?: string;                      // 템플릿 식별자 (선택적)
}

export interface Update[EntityName]Command {
  [entityName]Id: string;                   // [EntityName] ID (필수)
  name?: string;                            // 새 이름 (선택적)
  description?: string;                     // 새 설명 (선택적)
  updatedBy: string;                        // 수정자 식별자 (필수)
}

export interface Delete[EntityName]Command {
  [entityName]Id: string;                   // [EntityName] ID (필수)
  deletedBy: string;                        // 삭제자 식별자 (필수)
}

// 🎯 Command 검증 함수
export function validateCreate[EntityName]Command(command: Create[EntityName]Command): void {
  if (!command.organizationId || !isValidUUID(command.organizationId)) {
    throw new ValidationError('Invalid organization ID format');
  }
  if (!command.name || command.name.length < 1 || command.name.length > 100) {
    throw new ValidationError('[EntityName] name must be between 1 and 100 characters');
  }
  if (command.description && command.description.length > 1000) {
    throw new ValidationError('Description must be less than 1000 characters');
  }
  if (!command.createdBy || !isValidUUID(command.createdBy)) {
    throw new ValidationError('Invalid createdBy user ID format');
  }
}

// 🎯 Command Factory 함수
export function createCommandFromInput(input: Create[EntityName]Input): Create[EntityName]Command {
  validateCreate[EntityName]Command(input);
  return {
    organizationId: input.organizationId,
    name: input.name,
    description: input.description,
    createdBy: input.createdBy,
    templateId: input.templateId
  };
}

// 🎯 Command 파일 위치 및 네이밍
// 파일: src/domains/[domain]/shared/commands/index.ts
// 인터페이스: Create[EntityName]Command, Update[EntityName]Command, Delete[EntityName]Command
// 역할: [EntityName] 생성/수정/삭제 의도를 표현하는 Command 객체

// 🎯 언제 Command를 사용해야 할까?
// 1. 사용자 의도를 명확히 표현해야 할 때
// 2. 입력 검증이 필요할 때
// 3. Aggregate에 전달할 데이터를 구조화할 때
// 4. 이벤트 소싱에서 커맨드 저장이 필요할 때
```

### Event 상세 정의법
```typescript
// 🎯 Event = 과거형 사실 + 불변 데이터
export class [EntityName]CreatedEvent {
  readonly type = '[EntityName]Created';
  readonly aggregateId: string;
  readonly data: [EntityName]CreatedEventData;
  readonly timestamp: Date;

  constructor(
    aggregateId: string,
    data: [EntityName]CreatedEventData,
    timestamp: Date = new Date()
  ) {
    this.aggregateId = aggregateId;
    this.data = data;
    this.timestamp = timestamp;
  }
}

// 🎯 Event 데이터 구조
export interface [EntityName]CreatedEventData {
  [entityName]Id: string;                   // 생성된 [EntityName] ID
  organizationId: string;                   // 소속 조직 ID
  name: string;                             // [EntityName] 이름
  description?: string;                     // 설명 (선택적)
  createdBy: string;                        // 생성자 ID
  createdAt: Date;                          // 생성 시각
  templateId?: string;                      // 사용된 템플릿 ID (선택적)
}

export class [EntityName]UpdatedEvent {
  readonly type = '[EntityName]Updated';
  readonly aggregateId: string;
  readonly data: [EntityName]UpdatedEventData;
  readonly timestamp: Date;

  constructor(
    aggregateId: string,
    data: [EntityName]UpdatedEventData,
    timestamp: Date = new Date()
  ) {
    this.aggregateId = aggregateId;
    this.data = data;
    this.timestamp = timestamp;
  }
}

export interface [EntityName]UpdatedEventData {
  [entityName]Id: string;                   // 업데이트된 [EntityName] ID
  changes: {
    name?: string;                          // 변경된 이름
    description?: string;                   // 변경된 설명
  };
  updatedBy: string;                        // 수정자 ID
  updatedAt: Date;                          // 수정 시각
}

// 🎯 Event 타입 열거형
export enum DomainEventType {
  [ENTITY_NAME]_CREATED = '[EntityName]Created',
  [ENTITY_NAME]_UPDATED = '[EntityName]Updated',
  [ENTITY_NAME]_DELETED = '[EntityName]Deleted',
  [RELATED_ENTITY]_CREATED = '[RelatedEntity]Created',
}

// 🎯 Event 발행 로직
export function publishEvent(event: DomainEvent): void {
  // 1. 이벤트 스토어에 저장
  eventStore.append(event);
  
  // 2. 이벤트 핸들러에 알림
  eventHandlers[event.type]?.forEach(handler => {
    handler.handle(event);
  });
  
  // 3. 크로스 도메인 이벤트 처리
  if (isCrossDomainEvent(event)) {
    processCrossDomainEvent(event);
  }
}

// 🎯 Event 파일 위치 및 네이밍
// 파일: src/domains/[domain]/shared/events/index.ts
// 클래스: [EntityName]CreatedEvent, [EntityName]UpdatedEvent (항상 Event 접미사)
// 역할: [EntityName] 관련 도메인 이벤트들을 정의하여 시스템 간 통신 지원

// 🎯 언제 Event를 사용해야 할까?
// 1. 도메인에서 중요한 사건이 발생했을 때
// 2. 다른 도메인에 알림이 필요할 때
// 3. 이벤트 소싱이 필요할 때
// 4. 시스템 간 느슨한 결합이 필요할 때
```

### Error Types 상세 정의법
```typescript
// 🎯 도메인 에러 = 비즈니스 규칙 위반 + 사용자 친화적 메시지
export class [DomainName]Error extends Error {
  readonly code: [DomainName]ErrorCode;
  readonly details?: any;

  constructor(
    code: [DomainName]ErrorCode,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = '[DomainName]Error';
    this.code = code;
    this.details = details;
  }
}

// 🎯 에러 코드 열거형
export enum [DomainName]ErrorCode {
  // [EntityName] 관련 에러
  [ENTITY_NAME]_NOT_FOUND = '[ENTITY_NAME]_NOT_FOUND',
  [ENTITY_NAME]_ALREADY_EXISTS = '[ENTITY_NAME]_ALREADY_EXISTS',
  INVALID_[ENTITY_NAME]_NAME = 'INVALID_[ENTITY_NAME]_NAME',
  [ENTITY_NAME]_LIMIT_EXCEEDED = '[ENTITY_NAME]_LIMIT_EXCEEDED',
  
  // 권한 관련 에러
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 시스템 관련 에러
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // 입력 검증 에러
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
}

// 🎯 에러 메시지 매핑
export const ERROR_MESSAGES: Record<[DomainName]ErrorCode, string> = {
  [DomainName]ErrorCode.[ENTITY_NAME]_NOT_FOUND: '[EntityName]을 찾을 수 없습니다.',
  [DomainName]ErrorCode.[ENTITY_NAME]_ALREADY_EXISTS: '이미 존재하는 [EntityName]입니다.',
  [DomainName]ErrorCode.INVALID_[ENTITY_NAME]_NAME: '유효하지 않은 [EntityName] 이름입니다.',
  [DomainName]ErrorCode.[ENTITY_NAME]_LIMIT_EXCEEDED: '[EntityName] 생성 한도를 초과했습니다.',
  [DomainName]ErrorCode.UNAUTHORIZED_ACCESS: '접근 권한이 없습니다.',
  [DomainName]ErrorCode.INSUFFICIENT_PERMISSIONS: '권한이 부족합니다.',
  [DomainName]ErrorCode.DATABASE_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다.',
  [DomainName]ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE: '외부 서비스를 사용할 수 없습니다.',
  [DomainName]ErrorCode.NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  [DomainName]ErrorCode.INVALID_INPUT: '입력값이 유효하지 않습니다.',
  [DomainName]ErrorCode.MISSING_REQUIRED_FIELD: '필수 필드가 누락되었습니다.',
};

// 🎯 에러 처리 유틸리티
export function create[DomainName]Error(
  code: [DomainName]ErrorCode,
  details?: any
): [DomainName]Error {
  const message = ERROR_MESSAGES[code];
  return new [DomainName]Error(code, message, details);
}

export function is[DomainName]Error(error: unknown): error is [DomainName]Error {
  return error instanceof [DomainName]Error;
}

// 🎯 에러 분류
export function classifyError(error: unknown): {
  type: 'business' | 'system' | 'validation' | 'unknown';
  code: string;
  message: string;
  userMessage: string;
} {
  if (is[DomainName]Error(error)) {
    const type = getErrorType(error.code);
    return {
      type,
      code: error.code,
      message: error.message,
      userMessage: ERROR_MESSAGES[error.code],
    };
  }
  
  return {
    type: 'unknown',
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    userMessage: '예상치 못한 오류가 발생했습니다.',
  };
}

function getErrorType(code: [DomainName]ErrorCode): 'business' | 'system' | 'validation' {
  if (code.includes('NOT_FOUND') || code.includes('ALREADY_EXISTS') || code.includes('LIMIT_EXCEEDED')) {
    return 'business';
  }
  if (code.includes('DATABASE') || code.includes('NETWORK') || code.includes('SERVICE')) {
    return 'system';
  }
  return 'validation';
}

// 🎯 Error Types 파일 위치 및 네이밍
// 파일: src/domains/[domain]/shared/errors/[domain-name].error.ts
// 클래스: [DomainName]Error (Error 접미사)
// 열거형: [DomainName]ErrorCode
// 역할: [DomainName] 도메인의 모든 에러를 통합 관리하는 기본 에러 클래스

// 🎯 언제 Error Types를 사용해야 할까?
// 1. 도메인별 에러를 체계적으로 관리해야 할 때
// 2. 사용자 친화적 에러 메시지가 필요할 때
// 3. 에러 분류 및 처리 로직이 필요할 때
// 4. 다국어 지원이 필요할 때
```

### Service 코드 작성법
```typescript
// 🎯 Domain Service = 크로스 애그리거트 비즈니스 로직
export class [EntityName]Service {
  constructor(
    private readonly [entityName]Repository: I[EntityName]Repository,
    private readonly authService: IAuthService,
    private readonly organizationService: IOrganizationService
  ) {}

  async create[EntityName](command: Create[EntityName]Command): Promise<DomainEvent[]> {
    // 1. 인증 확인 (크로스 애그리거트 로직)
    const userId = await this.authService.getCurrentUserId();
    if (!userId) {
      throw new AuthenticationError("로그인이 필요합니다");
    }

    // 2. 권한 확인 (크로스 애그리거트 로직)
    const hasPermission = await this.organizationService.userCanCreate[EntityName](
      userId,
      command.organizationId
    );
    if (!hasPermission) {
      throw new AuthorizationError("[EntityName] 생성 권한이 없습니다");
    }

    // 3. 비즈니스 규칙 검증 (Policy)
    await this.validate[EntityName]Limits(command.organizationId);

    // 4. Aggregate를 통한 상태 변경
    const aggregate = new [EntityName]Aggregate();
    const events = await aggregate.create[EntityName]({
      ...command,
      createdBy: userId
    });

    // 5. 저장 (Repository 사용)
    await this.[entityName]Repository.save(aggregate.[entityName]);

    return events;
  }

  // 6. 비즈니스 규칙 검증 메소드들
  private async validate[EntityName]Limits(organizationId: string): Promise<void> {
    const currentCount = await this.[entityName]Repository.countByOrganization(organizationId);
    const orgPlan = await this.organizationService.getPlan(organizationId);

    if (orgPlan === 'free' && currentCount >= 5) {
      throw new BusinessRuleError("[EntityName] 생성 한도 초과");
    }
  }

  async update[EntityName](command: Update[EntityName]Command): Promise<DomainEvent[]> {
    // 1. 권한 확인
    const userId = await this.authService.getCurrentUserId();
    const [entityName] = await this.[entityName]Repository.findById(command.[entityName]Id);

    if (![entityName] || ![entityName].canBeUpdatedBy(userId)) {
      throw new AuthorizationError("수정 권한이 없습니다");
    }

    // 2. Aggregate를 통한 업데이트
    const aggregate = new [EntityName]Aggregate();
    await aggregate.loadFromRepository([entityName]); // 기존 상태 로드
    const events = await aggregate.update[EntityName](command);

    // 3. 저장소에 저장
    await this.[entityName]Repository.save(aggregate.[entityName]);

    return events;
  }

  async delete[EntityName](command: Delete[EntityName]Command): Promise<DomainEvent[]> {
    // 1. 권한 확인
    const userId = await this.authService.getCurrentUserId();
    const [entityName] = await this.[entityName]Repository.findById(command.[entityName]Id);

    if (![entityName] || ![entityName].canBeDeletedBy(userId)) {
      throw new AuthorizationError("삭제 권한이 없습니다");
    }

    // 2. Aggregate를 통한 삭제
    const aggregate = new [EntityName]Aggregate();
    await aggregate.loadFromRepository([entityName]); // 기존 상태 로드
    const events = await aggregate.delete[EntityName](command);

    // 3. 저장소에서 삭제
    await this.[entityName]Repository.delete(command.[entityName]Id);

    return events;
  }
}

// 🎯 Service 파일 위치 및 네이밍
// 파일: src/domains/[domain]/backend/services/[entity-name].service.ts
// 클래스: [EntityName]Service (항상 Service 접미사)
// 역할: [EntityName] 도메인의 핵심 비즈니스 로직을 담당하는 서비스 클래스

// 🎯 Domain Service 작성 원칙
// 1. 단일 책임: 하나의 비즈니스 프로세스만 담당
// 2. 크로스 애그리거트: 여러 Aggregate에 걸친 로직
// 3. Policy 실행: 비즈니스 규칙 검증
// 4. Error Handling: 도메인 에러 vs 시스템 에러 구분
// 5. DTO 직렬화: Service Layer에서 Domain Object를 DTO로 변환
```

### Repository 작성법 (Drizzle + RLS)
```typescript
// 🎯 Repository Interface = 데이터 접근 계약
export interface I[EntityName]Repository {
  // 기본 CRUD
  save([entityName]: [EntityName]): Promise<void>;
  findById(id: [EntityName]Id): Promise<[EntityName] | null>;
  findByOrganizationId(organizationId: string): Promise<[EntityName][]>;
  findByOwnerId(ownerId: string): Promise<[EntityName][]>;
  delete(id: [EntityName]Id): Promise<void>;
  
  // 비즈니스 쿼리 메소드
  countByOrganization(organizationId: string): Promise<number>;
  findWithHierarchy([entityName]Id: [EntityName]Id): Promise<[EntityName]Structure>;
}

// 🎯 Repository Implementation = Drizzle ORM + RLS
export class Drizzle[EntityName]Repository implements I[EntityName]Repository {
  async findById(id: [EntityName]Id): Promise<[EntityName] | null> {
    const db = await createDrizzleSupabaseClient();
    
    const data = await db.rls((tx) =>
      tx.query.[entityName]s.findFirst({
        where: eq([entityName]s.id, id.value),
      })
    );

    if (!data) return null;

    return this.mapToDomain(data);
  }

  async findByOrganizationId(organizationId: string): Promise<[EntityName][]> {
    const db = await createDrizzleSupabaseClient();
    
    const data = await db.rls((tx) =>
      tx.query.[entityName]s.findMany({
        where: eq([entityName]s.organizationId, organizationId),
        orderBy: ([entityName]s, { asc }) => [asc([entityName]s.createdAt)],
      })
    );

    return data.map(row => this.mapToDomain(row));
  }

  async save([entityName]: [EntityName]): Promise<void> {
    const db = await createDrizzleSupabaseClient();
    
    await db.rls((tx) =>
      tx.insert([entityName]s).values({
        id: [entityName].id.value,
        organizationId: [entityName].organizationId,
        name: [entityName].name.value,
        description: [entityName].description,
        createdBy: [entityName].createdBy,
        createdAt: [entityName].createdAt,
        updatedAt: [entityName].updatedAt,
      }).onConflictDoUpdate({
        target: [entityName]s.id,
        set: {
          name: [entityName].name.value,
          description: [entityName].description,
          updatedAt: [entityName].updatedAt,
        },
      })
    );
  }

  async countByOrganization(organizationId: string): Promise<number> {
    const db = await createDrizzleSupabaseClient();
    
    const result = await db.rls((tx) =>
      tx.select({ count: sql<number>`count(*)` })
        .from([entityName]s)
        .where(eq([entityName]s.organizationId, organizationId))
    );

    return result[0].count;
  }

  // 🎯 Row → Domain Object 변환
  private mapToDomain(row: any): [EntityName] {
    return new [EntityName](
      new [EntityName]Id(row.id),
      row.organizationId,
      new [EntityName]Name(row.name),
      row.description,
      row.createdBy,
      new Date(row.createdAt),
      new Date(row.updatedAt)
    );
  }
}

// 🎯 Repository 파일 위치 및 네이밍
// 인터페이스: src/domains/[domain]/backend/repositories/interfaces/[entity-name].repository.interface.ts
// 구현체: src/domains/[domain]/backend/repositories/implementations/drizzle-[entity-name].repository.ts
// 클래스: I[EntityName]Repository, Drizzle[EntityName]Repository
// 역할: [EntityName] 데이터의 영속성을 담당하는 Repository 패턴 구현

// 🎯 Repository 작성 원칙
// 1. Drizzle ORM + RLS 사용
// 2. createDrizzleSupabaseClient()로 클라이언트 생성
// 3. db.rls()로 RLS 정책 적용
// 4. 도메인 객체 반환 (Row → Entity 변환)
// 5. 트랜잭션은 Drizzle의 내장 트랜잭션 사용
// 6. 비즈니스 쿼리 메소드 제공
```

### Server Actions 작성법
```typescript
// 🎯 Server Actions = HTTP 요청을 도메인 로직으로 변환
export async function create[EntityName]Action(
  input: Create[EntityName]Input
): Promise<[EntityName]View> {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new AuthenticationError('Authentication required');
    }

    // 2. 입력 검증
    if (!input.name?.trim()) {
      throw new ValidationError('[EntityName] name is required');
    }

    // 3. 의존성 주입
    const [entityName]Repository = new Drizzle[EntityName]Repository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    
    const service = new [EntityName]Service(
      [entityName]Repository,
      organizationRepository,
      supabaseAuthService
    );

    // 4. Command 생성
    const command: Create[EntityName]Command = {
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      createdBy: user.id,
      templateId: input.templateId
    };

    // 5. 도메인 로직 실행
    const result = await service.create[EntityName](command);
    
    if (result.isError()) {
      throw new BusinessRuleError(result.error.message);
    }

    // 6. Read Model 조회 (DTO 반환)
    const viewRepository = new Drizzle[EntityName]ViewRepository();
    const view = await viewRepository.getById(new [EntityName]Id(result.data.id));
    
    if (!view) {
      throw new NotFoundError('[EntityName] view not found');
    }

    // 7. 페이지 재검증
    revalidatePath('/[entityName]s');
    revalidatePath('/organizations/[organizationId]');

    return view;

  } catch (error) {
    // 8. 에러 분류 및 로깅
    console.error(`Error in create[EntityName]Action:`, error);
    
    if (error instanceof [DomainName]Error) {
      throw error; // 도메인 에러는 그대로 전달
    }
    
    // 시스템 에러는 일반 에러로 변환
    throw new Error('An unexpected error occurred');
  }
}

export async function update[EntityName]Action(
  input: Update[EntityName]Input
): Promise<[EntityName]View> {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new AuthenticationError('Authentication required');
    }

    // 2. 입력 검증
    if (!input.[entityName]Id) {
      throw new ValidationError('[EntityName] ID is required');
    }

    // 3. 의존성 주입
    const [entityName]Repository = new Drizzle[EntityName]Repository();
    const service = new [EntityName]Service([entityName]Repository);

    // 4. Command 생성
    const command: Update[EntityName]Command = {
      [entityName]Id: input.[entityName]Id,
      name: input.name,
      description: input.description,
      updatedBy: user.id
    };

    // 5. 도메인 로직 실행
    const result = await service.update[EntityName](command);
    
    if (result.isError()) {
      throw new BusinessRuleError(result.error.message);
    }

    // 6. Read Model 조회
    const viewRepository = new Drizzle[EntityName]ViewRepository();
    const view = await viewRepository.getById(new [EntityName]Id(input.[entityName]Id));
    
    if (!view) {
      throw new NotFoundError('[EntityName] view not found');
    }

    // 7. 페이지 재검증
    revalidatePath(`/[entityName]s/${input.[entityName]Id}`);

    return view;

  } catch (error) {
    console.error(`Error in update[EntityName]Action:`, error);
    throw error;
  }
}

// 🎯 Server Actions 파일 위치 및 네이밍
// 파일: src/domains/[domain]/actions/[domain-name].actions.ts
// 함수: create[EntityName]Action, update[EntityName]Action, delete[EntityName]Action
// 역할: Next.js Server Actions를 통한 도메인 로직 실행 및 DTO 반환

// 🎯 Server Actions 작성 원칙
// 1. 인증 확인 (Supabase Auth)
// 2. 입력 검증 (Validation)
// 3. 의존성 주입 (Repository, Service)
// 4. Command 생성 및 실행
// 5. Read Model 조회 (DTO 반환)
// 6. 페이지 재검증 (revalidatePath)
// 7. 에러 분류 및 처리
```

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

### Anti-Corruption Layer 작성법
```typescript
// 🎯 ACL = 외부 시스템과 도메인 간의 번역기
export interface I[ExternalSystem]ACL {
  // 외부 시스템 API 래핑
  get[Resource](): Promise<Domain[Resource] | null>;
  create[Resource](data: Create[Resource]Data): Promise<Domain[Resource]>;
  update[Resource](id: string, data: Update[Resource]Data): Promise<Domain[Resource]>;
  delete[Resource](id: string): Promise<void>;
  
  // 도메인 객체 변환
  mapToDomain(externalData: any): Domain[Resource];
  mapFromDomain(domainData: Domain[Resource]): any;
}

// 🎯 ACL Implementation = 외부 시스템 통신 + 도메인 변환
export class [ExternalSystem]ACL implements I[ExternalSystem]ACL {
  constructor(
    private readonly client: [ExternalSystem]Client,
    private readonly config: [ExternalSystem]Config
  ) {}

  async get[Resource](): Promise<Domain[Resource] | null> {
    try {
      // 1. 외부 시스템 API 호출
      const response = await this.client.get[Resource]();
      
      if (!response.success) {
        throw new ExternalServiceError(`[ExternalSystem] API failed: ${response.error}`);
      }

      // 2. 외부 데이터를 도메인 객체로 변환
      return this.mapToDomain(response.data);
    } catch (error) {
      // 3. 외부 시스템 에러를 도메인 에러로 변환
      if (error instanceof [ExternalSystem]Error) {
        throw new ExternalServiceError(`[ExternalSystem] service unavailable: ${error.message}`);
      }
      throw error;
    }
  }

  async create[Resource](data: Create[Resource]Data): Promise<Domain[Resource]> {
    try {
      // 1. 도메인 데이터를 외부 시스템 형식으로 변환
      const externalData = this.mapFromDomain(data);
      
      // 2. 외부 시스템 API 호출
      const response = await this.client.create[Resource](externalData);
      
      if (!response.success) {
        throw new ExternalServiceError(`[ExternalSystem] creation failed: ${response.error}`);
      }

      // 3. 응답을 도메인 객체로 변환
      return this.mapToDomain(response.data);
    } catch (error) {
      // 4. 에러 변환 및 로깅
      this.logError('create[Resource]', error);
      throw new ExternalServiceError(`Failed to create [Resource] in [ExternalSystem]`);
    }
  }

  // 🎯 데이터 변환 메소드들
  mapToDomain(externalData: any): Domain[Resource] {
    return new Domain[Resource](
      new [Resource]Id(externalData.id),
      externalData.name,
      externalData.description,
      new Date(externalData.createdAt),
      new Date(externalData.updatedAt)
    );
  }

  mapFromDomain(domainData: Domain[Resource]): any {
    return {
      id: domainData.id.value,
      name: domainData.name.value,
      description: domainData.description,
      createdAt: domainData.createdAt.toISOString(),
      updatedAt: domainData.updatedAt.toISOString(),
    };
  }

  // 🎯 에러 처리 및 로깅
  private logError(operation: string, error: unknown): void {
    console.error(`[ExternalSystem]ACL.${operation} failed:`, {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      operation,
    });
  }
}

// 🎯 ACL 파일 위치 및 네이밍
// 인터페이스: src/domains/[domain]/backend/anti-corruption-layers/interfaces/[external-system]-acl.interface.ts
// 구현체: src/domains/[domain]/backend/anti-corruption-layers/[external-system]-acl.ts
// 클래스: I[ExternalSystem]ACL, [ExternalSystem]ACL
// 역할: 외부 시스템과 도메인 간의 데이터 변환 및 통신을 담당하는 ACL

// 🎯 ACL 작성 원칙
// 1. 외부 시스템의 복잡성을 도메인에서 숨김
// 2. 외부 데이터를 도메인 객체로 변환
// 3. 외부 시스템 에러를 도메인 에러로 변환
// 4. 재시도 로직 및 폴백 처리
// 5. 로깅 및 모니터링

// 🎯 Supabase Auth Service
export class SupabaseAuthService {
  constructor(private supabase: SupabaseClient) {}

  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      // OAuth는 리다이렉트를 발생시키므로 여기서는 성공으로 처리
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Login failed' };
    }
  }

  async getCurrentUser(): Promise<DomainUser | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user ? SupabaseAuthACL.toDomainUser(user) : null;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async getSession(): Promise<SessionInfo | null> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    return session ? SupabaseAuthACL.toSessionInfo(session) : null;
  }
}

// 🎯 왜 도메인 내부에 포함?
// 1. 도메인 경계 보호: Supabase Auth의 영향을 격리
// 2. 변환 로직 집중: 한 곳에서 모든 변환 관리
// 3. 테스트 용이성: 도메인 테스트에서 외부 의존성 제거
// 4. 변경 대응: Supabase API 변경 시 한 곳만 수정
```

---

## 📨 DTO 직렬화 컨벤션

### Next.js Server Actions 직렬화 제약

Next.js의 Server Actions와 Client Components 간 데이터 전달 시, **클래스 인스턴스나 복잡한 객체는 직렬화할 수 없습니다**.

```typescript
// ❌ 이렇게 하면 에러 발생
export async function getOrganization() {
  return new OrganizationId("org_123");  // Error: Classes cannot be serialized
}

// ✅ 이렇게 해야 함
export async function getOrganization() {
  return { id: "org_123" };  // OK: Plain object
}
```

### 직렬화할 수 없는 것들

| 타입 | 문제 | 해결책 |
|------|------|--------|
| **클래스 인스턴스** | Value Objects, Entities | → `.value` 속성 추출 |
| **Date 객체** | 직렬화 불가 | → `.toISOString()` 변환 |
| **Map/Set** | Plain object 아님 | → Array로 변환 |
| **함수/메서드** | 전달 불가 | → 데이터만 전달 |
| **Circular Reference** | 순환 참조 | → 구조 단순화 |

### CQRS Read/Write 분리

```
┌─────────────────────────────────────────────────────────┐
│              WRITE SIDE (Command)                       │
│  • Value Objects (클래스)                                │
│  • Entities (클래스)                                     │
│  • Aggregates (클래스)                                   │
│  • 비즈니스 로직 & 불변식 검증                            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              READ SIDE (Query)                          │
│  • Read Models (interface, plain object)                │
│  • DTOs (interface, plain object)                       │
│  • 데이터 투영 & 최적화된 조회                            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│         Next.js Server Actions (Boundary)               │
│  • DTO 직렬화 (클래스 → plain object)                    │
│  • Date → ISO string 변환                               │
│  • 클라이언트 전달용 타입 보장                            │
└─────────────────────────────────────────────────────────┘
```

### DTO 타입 정의

```typescript
// shared/dtos/index.ts
export interface UserProfileView {
  userId: string;                          // Serialized from UserId
  email: string;
  name: string;
  profileImageUrl?: string;
  defaultOrganization: {
    id: string;                            // Serialized from OrganizationId
    name: string;
  };
  createdAt: string;                      // ISO 8601 string
}

export interface OrganizationSummary {
  id: string;                              // Serialized from OrganizationId
  name: string;
  isDefault: boolean;
  role?: 'owner' | 'admin' | 'member';
  createdAt: string;                      // ISO 8601 string
}
```

### Service에서 직렬화

```typescript
// backend/services/user-management.service.ts
async getUserOrganizations(
  command: GetUserOrganizationsCommand
): Promise<Result<OrganizationSummary[], UserManagementError>> {
  try {
    // 1. 사용자 확인
    const user = await this.userRepository.findById(
      new UserId(command.userId)
    );
    if (!user) {
      return Result.error(
        new UserManagementError('USER_NOT_FOUND', 'User not found')
      );
    }

    // 2. 사용자 조직 조회
    const organizations = await this.organizationRepository.findByOwnerId(
      user.id
    );

    // ✅ 직렬화 수행 (Service Layer에서)
    const summaries: OrganizationSummary[] = organizations.map(org => ({
      id: org.id.value,                                // OrganizationId → string
      name: org.entity.name,
      isDefault: org.entity.isDefault,
      createdAt: org.entity.createdAt.toISOString(),   // Date → ISO string
    }));

    return Result.success(summaries);
  } catch (error) {
    return Result.error(
      new UserManagementError(
        'ORGANIZATION_RETRIEVAL_FAILED',
        'Failed to get user organizations',
        { error }
      )
    );
  }
}
```

### Server Actions에서 DTO 반환

```typescript
// actions/user-management.actions.ts
export async function getUserOrganizationsAction(): Promise<OrganizationSummary[]> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Authentication required');
    }

    // 2. Service 사용 (Drizzle Repository)
    const userRepository = new DrizzleUserRepository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);

    const service = new UserManagementService(
      userRepository,
      organizationRepository,
      supabaseAuthService
    );

    // 3. Command 생성
    const command: GetUserOrganizationsCommand = {
      userId: user.id,
    };

    // 4. 도메인 로직 실행
    const result = await service.getUserOrganizations(command);

    if (result.isError()) {
      throw new Error(result.error.message);
    }

    // ✅ 이미 직렬화된 DTO를 그대로 반환
    return result.value;
  } catch (error) {
    throw error;
  }
}
```

### 레이어별 책임

| 레이어 | 사용 타입 | 직렬화 책임 | 예시 |
|--------|-----------|-------------|------|
| **Domain** | Value Objects, Entities | ❌ 없음 | `UserId`, `OrganizationAggregate` |
| **Repository** | Domain Objects | ❌ 없음 | `UserAggregate` 반환 |
| **Service** | DTO (plain object) | ✅ **여기서 수행** | `OrganizationSummary[]` 반환 |
| **Server Actions** | DTO (plain object) | ❌ 이미 직렬화됨 | 그대로 반환 |
| **Client** | DTO (plain object) | ❌ 없음 | `UserProfileView` 사용 |

### 일반적인 실수

#### 실수 1: Service에서 Domain Object 반환
```typescript
// ❌ 나쁜 예
async getUserOrganizations(): Promise<OrganizationAggregate[]> {
  const organizations = await this.organizationRepository.findByOwnerId(userId);
  return organizations;  // ❌ Domain Object 반환 (직렬화 불가)
}

// ✅ 좋은 예
async getUserOrganizations(): Promise<OrganizationSummary[]> {
  const organizations = await this.organizationRepository.findByOwnerId(userId);
  
  // ✅ DTO로 직렬화
  return organizations.map(org => ({
    id: org.id.value,                                // OrganizationId → string
    name: org.entity.name,
    isDefault: org.entity.isDefault,
    createdAt: org.entity.createdAt.toISOString(),   // Date → ISO string
  }));
}
```

#### 실수 2: Actions에서 Domain Object 직접 반환
```typescript
// ❌ 나쁜 예
export async function createOrganization() {
  const result = await service.createOrganization(command);
  return result.value;  // OrganizationAggregate (클래스!)
}

// ✅ 좋은 예
export async function createOrganization() {
  const result = await service.createOrganization(command);
  
  if (result.isError()) {
    throw new Error(result.error.message);
  }
  
  // ✅ Service에서 이미 DTO로 직렬화되어 반환됨
  return result.value;  // OrganizationSummary (DTO)
}
```


### DTO 검증 체크리스트

#### 폴더 구조 검증
- [ ] Domain Events와 DTOs가 별도 폴더에 있는가?
- [ ] 각 폴더의 목적이 명확한가?
- [ ] Import 경로가 의도를 드러내는가?

#### DTO 설계 검증
- [ ] 모든 DTO가 plain objects인가? (직렬화 가능)
- [ ] Date 타입이 ISO string으로 변환되었는가?
- [ ] Value Objects가 string으로 직렬화되었는가?

#### Server Action 작성 시
- [ ] 반환 타입이 plain object인가?
- [ ] Value Objects를 `.value`로 직렬화했는가?
- [ ] Date를 `.toISOString()`로 변환했는가?
- [ ] 중첩 객체도 모두 plain object인가?

---

## 📚 관련 문서

### 도메인 설계 문서
- **[소프트웨어 디자인 가이드](../guide/software-design-guide.md)**: 상세 구현 가이드라인
- **[테크니컬 명세서 템플릿](../template/technical-specification-template.md)**: 구현 가이드 템플릿
- **[프론트엔드 명세서 템플릿](../template/frontend-specification-template.md)**: 프론트엔드 구현 가이드

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
