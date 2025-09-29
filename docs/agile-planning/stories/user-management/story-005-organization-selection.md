# Story 005: 조직 선택 및 컨텍스트 설정

## 🎯 Story 개요
**User Story**: As a 로그인된 사용자 I want to 작업할 조직을 선택할 수 있어야 so that 해당 조직의 워크스페이스에 접근할 수 있다
**Story Points**: 2
**우선순위**: High
**Epic**: Epic-001 User Management

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 조직 선택
```gherkin
Given 사용자가 조직 목록을 조회했다
When 특정 조직을 선택한다
Then 선택된 조직이 현재 컨텍스트로 설정된다
And 조직 선택 완료 이벤트가 발생한다
And 대시보드로 리다이렉트된다
```

### 시나리오 2: 기본 조직 자동 선택
```gherkin
Given 사용자가 처음 로그인했다
When 조직 목록을 조회한다
Then 기본 조직이 자동으로 선택된다
And 기본 조직이 현재 컨텍스트로 설정된다
And 조직 선택 완료 이벤트가 발생한다
```

### 시나리오 3: 조직 선택 실패
```gherkin
Given 사용자가 조직 목록을 조회했다
When 존재하지 않는 조직을 선택한다
Then 오류 메시지가 표시된다
And 조직 선택이 취소된다
And 사용자에게 유효한 조직 목록을 다시 표시한다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command
interface SelectOrganizationCommand {
  userId: string;
  organizationId: string;
}

// Event
interface OrganizationSelectedEvent {
  userId: string;
  organizationId: string;
  organizationName: string;
  timestamp: Date;
}

// Aggregate
class OrganizationContext {
  constructor(
    public readonly userId: UserId,
    public readonly selectedOrganizationId: OrganizationId,
    public readonly selectedAt: Date
  ) {}
}
```

### Repository 메서드
```typescript
interface OrganizationContextRepository {
  save(context: OrganizationContext): Promise<void>;
  findByUserId(userId: UserId): Promise<OrganizationContext | null>;
}

class DrizzleOrganizationContextRepository implements OrganizationContextRepository {
  async save(context: OrganizationContext): Promise<void> {
    const db = await createDrizzleSupabaseClient();
    
    await db.rls((tx) =>
      tx.insert(organizationContexts).values({
        userId: context.userId.value,
        selectedOrganizationId: context.selectedOrganizationId.value,
        selectedAt: context.selectedAt,
      }).onConflictDoUpdate({
        target: organizationContexts.userId,
        set: {
          selectedOrganizationId: context.selectedOrganizationId.value,
          selectedAt: context.selectedAt,
        },
      })
    );
  }
}
```

### Server Actions
```typescript
export async function selectOrganizationAction(
  input: { organizationId: string }
): Promise<OrganizationContext> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }

  // 1. 사용자가 해당 조직에 접근 권한이 있는지 확인
  const organizationRepository = new DrizzleOrganizationRepository();
  const organization = await organizationRepository.findById(new OrganizationId(input.organizationId));
  
  if (!organization) {
    throw new Error('Organization not found');
  }

  // 2. 사용자가 조직 소유자인지 확인 (Scenario 0-1에서는 소유자만 접근 가능)
  if (organization.entity.ownerId.value !== user.id) {
    throw new Error('Access denied');
  }

  // 3. 조직 컨텍스트 저장
  const contextRepository = new DrizzleOrganizationContextRepository();
  const context = new OrganizationContext(
    new UserId(user.id),
    new OrganizationId(input.organizationId),
    new Date()
  );
  
  await contextRepository.save(context);

  return context;
}
```

### Frontend Context
```typescript
// Organization Context Provider
export function OrganizationContextProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectOrganization = async (organizationId: string) => {
    setIsLoading(true);
    try {
      const context = await selectOrganizationAction({ organizationId });
      setSelectedOrganization(context);
      
      // 쿠키에 선택된 조직 저장
      document.cookie = `selectedOrganizationId=${organizationId}; path=/; max-age=86400`;
      
    } catch (error) {
      console.error('Failed to select organization:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OrganizationContext.Provider value={{
      selectedOrganization,
      selectOrganization,
      isLoading
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}
```

### Database Schema
```sql
-- 조직 컨텍스트 테이블
CREATE TABLE organization_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  selected_organization_id UUID NOT NULL REFERENCES organizations(id),
  selected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS 정책
ALTER TABLE organization_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own context" ON organization_contexts
  FOR ALL USING (auth.uid() = user_id);
```

## 📋 Sub-tasks

### Backend Domain
- [ ] OrganizationContext 구현
- [ ] SelectOrganizationCommand 정의
- [ ] OrganizationSelectedEvent 정의
- [ ] 권한 검증 로직

### Database & Repository
- [ ] organization_contexts 테이블 생성
- [ ] OrganizationContextRepository 구현
- [ ] 데이터베이스 인덱스 설정

### API & Server Action
- [ ] selectOrganizationAction 구현
- [ ] 에러 처리 및 검증 로직
- [ ] 권한 검증 로직

### Frontend
- [ ] 조직 선택기 컴포넌트
- [ ] 조직 컨텍스트 Provider
- [ ] 쿠키 기반 상태 관리

### Integration Task
- [ ] 조직 권한 검증
- [ ] 컨텍스트 상태 관리
- [ ] 이벤트 발행 및 구독

### E2E & Observability
- [ ] 조직 선택 E2E 테스트
- [ ] 에러 모니터링 설정
- [ ] 성능 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 조직 선택 정상 동작
- [ ] 기본 조직 자동 선택 정상 동작
- [ ] 조직 선택 실패 시 에러 처리
- [ ] 조직 컨텍스트 상태 관리

### 기술적 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족

### 품질 완료
- [ ] 보안 취약점 0개
- [ ] 접근성 기준 충족
- [ ] 사용자 테스트 통과

## 🔗 의존성
**선행 Story**: Story-004 (조직 목록 조회)
**후행 Story**: Story-006 (조직 생성), Story-007 (멤버 초대)
**외부 의존성**: Database, User Authentication, Organization Management

## 📁 관련 문서
- [Epic 문서](../../epics/epic-001-user-management.md)
- [Process Model](../../../event-domain-design/domains/user-management-domain/process-model.md)
- [Technical Specification](../../../event-domain-design/domains/user-management-domain/technical-specification.md)
