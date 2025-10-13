# Story 003: 기본 조직, 워크스페이스, 페이지 자동 생성

## 🎯 Story 개요
**User Story**: As a 새로 가입한 사용자 I want to 기본 조직, 워크스페이스, 첫 페이지가 자동으로 생성되고 해당 페이지로 이동해야 so that 즉시 서비스를 사용할 수 있다
**Story Points**: 5
**우선순위**: High
**Epic**: Epic-001 User Management

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 신규 사용자 기본 조직, 워크스페이스, 페이지 생성
```gherkin
Given 사용자 프로필이 생성되었다
When 기본 조직 생성 명령이 실행된다
Then 사용자의 기본 조직이 생성된다
And 조직 이름은 "{사용자명}'s Organization"으로 설정된다
And 사용자가 조직의 소유자로 설정된다
And 조직이 기본 조직으로 표시된다
And 기본 워크스페이스 "Default Workspace"가 자동 생성된다
And 워크스페이스가 삭제 불가로 설정된다
And Welcome 페이지 "Welcome 👋"가 자동 생성된다
And 사용자가 생성된 Welcome 페이지로 자동 리다이렉트된다
And 최근 방문 페이지가 쿠키에 저장된다
And 기본 조직 생성 완료 이벤트가 발생한다
```

### 시나리오 2: 기본 조직 중복 생성 방지
```gherkin
Given 사용자에게 이미 기본 조직이 있다
When 기본 조직 생성 명령이 실행된다
Then 새로운 조직을 생성하지 않는다
And 기존 기본 조직을 반환한다
And 중복 생성 방지 로그를 기록한다
```

### 시나리오 3: 조직/워크스페이스/페이지 생성 실패 처리
```gherkin
Given 사용자 프로필이 생성되었다
When 조직/워크스페이스/페이지 생성 중 오류가 발생한다
Then 각 단계마다 3회 재시도를 수행한다
And 조직 생성 실패 시 전체 가입 프로세스가 중단된다
And 워크스페이스 생성 실패 시 조직 생성이 롤백된다
And 페이지 생성 실패 시 워크스페이스 생성이 롤백된다
And Supabase Auth 계정도 함께 롤백된다
And 재시도 실패 시 오류 메시지를 표시한다
And 사용자에게 수동 재시도 옵션을 제공한다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command
interface CreateDefaultOrganizationCommand {
  userId: string;
  organizationName: string;
}

interface CreateDefaultWorkspaceCommand {
  organizationId: string;
  createdBy: string;
}

interface CreatePageCommand {
  workspaceId: string;
  title: string;
  icon?: string;
  createdBy: string;
}

// Events
interface DefaultOrganizationCreatedEvent {
  organizationId: string;
  ownerId: string;
  name: string;
  isDefault: boolean;
  timestamp: Date;
}

interface DefaultWorkspaceCreatedEvent {
  workspaceId: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  timestamp: Date;
}

interface WelcomePageCreatedEvent {
  pageId: string;
  workspaceId: string;
  title: string;
  icon: string;
  timestamp: Date;
}

// Aggregates
class OrganizationAggregate {
  static createDefault(
    name: string,
    ownerId: UserId,
    workspaceService: WorkspaceService
  ): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      name,
      ownerId,
      true, // isDefault
      new Date(),
      new Date()
    );
    
    // 워크스페이스 생성 (동기 처리)
    const workspace = workspaceService.createDefaultWorkspace({
      organizationId: organization.id.value,
      createdBy: ownerId.value
    });
    
    return new OrganizationAggregate(organization, workspace);
  }
}

class WorkspaceAggregate {
  static createDefault(
    command: CreateDefaultWorkspaceCommand,
    pageService: PageService
  ): WorkspaceAggregate {
    const workspace = new Workspace(
      WorkspaceId.generate(),
      new OrganizationId(command.organizationId),
      'Default Workspace',
      null, // description
      null, // icon
      true, // isDefault
      false, // deletable
      command.createdBy,
      new Date(),
      new Date(),
      null
    );
    
    // Welcome 페이지 생성 (동기 처리)
    const page = pageService.createPage({
      workspaceId: workspace.id.value,
      title: 'Welcome',
      icon: '👋',
      createdBy: command.createdBy
    });
    
    return new WorkspaceAggregate(workspace, page);
  }
}
```

### Repository 메서드
```typescript
interface OrganizationRepository {
  save(organization: OrganizationAggregate): Promise<void>;
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
}

class DrizzleOrganizationRepository implements OrganizationRepository {
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

### Server Actions
```typescript
export async function createDefaultOrganizationWithWorkspaceAndPageAction(
  input: { organizationName: string }
): Promise<{
  organization: OrganizationSummary;
  workspace: WorkspaceSummary;
  page: PageSummary;
  redirectUrl: string;
}> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }

  const userRepository = new DrizzleUserRepository();
  const organizationRepository = new DrizzleOrganizationRepository();
  const workspaceRepository = new DrizzleWorkspaceRepository();
  const pageRepository = new DrizzlePageRepository();
  const supabaseAuthService = new SupabaseAuthService(supabase);
  
  // 서비스 주입
  const workspaceService = new WorkspaceManagementService(
    workspaceRepository,
    pageRepository
  );
  
  const organizationService = new OrganizationManagementService(
    organizationRepository,
    workspaceService // Workspace Service 주입
  );
  
  const userManagementService = new UserManagementService(
    userRepository,
    organizationService, // Organization Service 주입
    supabaseAuthService
  );

  const command: CreateDefaultOrganizationCommand = {
    userId: user.id,
    organizationName: input.organizationName || `${user.user_metadata?.name || 'User'}'s Organization`
  };

  // 트랜잭션으로 조직 → 워크스페이스 → 페이지 생성
  const result = await userManagementService.createDefaultOrganizationWithWorkspaceAndPage(command);
  
  if (result.isError()) {
    // 실패 시 Supabase Auth 계정도 롤백
    await supabase.auth.admin.deleteUser(user.id);
    throw new Error(result.error.message);
  }

  const { organization, workspace, page } = result.value;
  
  // 리다이렉션 URL 생성
  const redirectUrl = `/r/${organization.id}/workspace/${workspace.id}/page/${page.id}`;

  return {
    organization: {
      id: organization.id,
      name: organization.entity.name,
      role: "owner" as const,
      isDefault: organization.entity.isDefault,
      createdAt: organization.entity.createdAt
    },
    workspace: {
      id: workspace.id,
      name: workspace.entity.name,
      isDefault: workspace.entity.isDefault,
      createdAt: workspace.entity.createdAt
    },
    page: {
      id: page.id,
      title: page.entity.title,
      icon: page.entity.icon,
      createdAt: page.entity.createdAt
    },
    redirectUrl
  };
}
```

### Database Schema
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own organizations" ON organizations
  FOR SELECT USING (auth.uid() = owner_id);
```

## 📋 Sub-tasks

### Backend Domain
- [x] Organization Entity 구현 (완료)
- [x] OrganizationAggregate 구현 (완료)
- [x] Workspace Entity 구현 (완료)
- [x] WorkspaceAggregate 구현 (완료)
- [x] Page Entity 구현 (완료)
- [x] PageAggregate 구현 (완료)
- [ ] CreateDefaultOrganizationWithWorkspaceAndPageCommand 정의 (미구현)
- [ ] 도메인 간 서비스 주입 구현 (미구현)

### Database & Repository
- [x] organizations 테이블 생성 (완료)
- [x] workspaces 테이블 생성 (완료)
- [x] pages 테이블 생성 (완료)
- [x] OrganizationRepository 구현 (완료)
- [x] WorkspaceRepository 구현 (완료)
- [x] PageRepository 구현 (완료)
- [x] 데이터베이스 인덱스 설정 (완료)

### API & Server Action
- [ ] createDefaultOrganizationWithWorkspaceAndPageAction 구현 (미구현)
- [ ] 트랜잭션 처리 로직 구현 (미구현)
- [ ] 롤백 로직 구현 (미구현)
- [ ] 에러 처리 및 검증 로직 (미구현)
- [ ] 재시도 로직 구현 (미구현)
- [ ] 리다이렉션 URL 생성 로직 (미구현)

### Frontend
- [ ] Welcome 페이지 자동 리다이렉션 구현 (미구현)
- [ ] 로딩 상태 표시 (미구현)
- [ ] 에러 처리 및 사용자 피드백 (미구현)
- [ ] 최근 방문 페이지 쿠키 저장 (미구현)

### Integration Task
- [x] 사용자 프로필과 조직 연동 (완료)
- [ ] Organization → Workspace 서비스 주입 (미구현)
- [ ] Workspace → Page 서비스 주입 (미구현)
- [ ] 이벤트 발행 및 구독 (미구현)
- [x] 중복 생성 방지 로직 (완료)

### E2E & Observability
- [ ] 전체 플로우 E2E 테스트 (프로필 → 조직 → 워크스페이스 → 페이지 → 리다이렉션) (미구현)
- [ ] 트랜잭션 롤백 테스트 (미구현)
- [ ] 에러 모니터링 설정 (미구현)
- [ ] 성능 모니터링 설정 (미구현)

## 🎯 Definition of Done

### 기능적 완료
- [ ] 신규 사용자 기본 조직 생성 정상 동작 (미구현 - 서비스 주입 필요)
- [ ] 기본 워크스페이스 생성 정상 동작 (미구현)
- [ ] Welcome 페이지 생성 정상 동작 (미구현)
- [ ] 생성된 페이지로 자동 리다이렉션 (미구현)
- [ ] 최근 방문 페이지 쿠키 저장 (미구현)
- [x] 기본 조직 중복 생성 방지 정상 동작 (완료)
- [ ] 조직/워크스페이스/페이지 생성 실패 시 전체 롤백 (미구현)
- [ ] 각 단계 실패 시 재시도 로직 동작 (미구현)
- [x] 사용자가 조직 소유자로 설정됨 (완료)

### 기술적 완료
- [ ] 도메인 간 서비스 주입 구현
- [ ] 트랜잭션 처리 로직 구현
- [ ] 롤백 로직 구현
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] 통합 테스트 통과 (조직 → 워크스페이스 → 페이지 생성)
- [ ] E2E 테스트 통과 (전체 플로우 + 리다이렉션)
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족

### 품질 완료
- [x] 보안 취약점 0개 (RLS 정책 적용됨)
- [ ] 접근성 기준 충족 (프론트엔드 미구현)
- [ ] 사용자 테스트 통과 (프론트엔드 미구현)

## 📊 현재 진행 상황: 40% 완료
- ✅ 백엔드 도메인 Entity/Aggregate 완료
- ✅ 데이터베이스 스키마 및 Repository 완료
- ❌ 도메인 간 서비스 주입 미구현
- ❌ Server Actions 미구현 (트랜잭션 처리 필요)
- ❌ 프론트엔드 리다이렉션 로직 미구현
- ❌ 테스트 코드 미구현 (통합 테스트 및 E2E 테스트)

## 🔗 의존성
**선행 Story**: Story-002 (사용자 프로필 생성)
**후행 Story**: Story-004 (조직 목록 조회)
**외부 의존성**: 
- Database (organizations, workspaces, pages 테이블)
- User Profile
- Organization Management Domain (조직 생성)
- Workspace Management Domain (워크스페이스 및 페이지 생성)

## 📁 관련 문서
- [Epic 문서](../../epics/epic-001-user-management.md)
- [Process Model](../../../event-domain-design/domains/user-management-domain/process-model.md)
- [Technical Specification](../../../event-domain-design/domains/user-management-domain/technical-specification.md)
