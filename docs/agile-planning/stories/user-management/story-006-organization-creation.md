# Story 006: 조직 생성

## 🎯 Story 개요
**User Story**: As a 로그인된 사용자 I want to 새로운 조직을 생성할 수 있어야 so that 팀과 함께 작업할 수 있다
**Story Points**: 3
**우선순위**: Medium
**Epic**: Epic-001 User Management

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 새 조직 생성
```gherkin
Given 로그인된 사용자가 있다
When 새 조직 생성 폼을 작성한다
And 조직명을 입력한다
And 조직 생성 버튼을 클릭한다
Then 새 조직이 생성된다
And 사용자가 조직의 소유자로 설정된다
And 조직 생성 완료 이벤트가 발생한다
And 조직 목록에 새 조직이 추가된다
```

### 시나리오 2: 조직명 중복 검증
```gherkin
Given 로그인된 사용자가 있다
When 이미 존재하는 조직명으로 새 조직을 생성한다
Then 중복 조직명 오류 메시지가 표시된다
And 조직 생성이 취소된다
And 사용자에게 다른 이름을 입력하도록 안내한다
```

### 시나리오 3: 조직 생성 실패
```gherkin
Given 로그인된 사용자가 있다
When 조직 생성 중 오류가 발생한다
Then 오류 메시지가 표시된다
And 사용자에게 재시도 옵션을 제공한다
And 폼 데이터가 보존된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command
interface CreateOrganizationCommand {
  name: string;
  slug?: string;
  ownerId: string;
}

// Event
interface OrganizationCreatedEvent {
  organizationId: string;
  name: string;
  slug: string;
  ownerId: string;
  timestamp: Date;
}

// Aggregate
class OrganizationAggregate {
  static create(
    name: string,
    slug: string,
    ownerId: UserId
  ): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      name,
      slug,
      ownerId,
      false, // isDefault = false
      new Date(),
      new Date()
    );
    return new OrganizationAggregate(organization);
  }
}
```

### Repository 메서드
```typescript
interface OrganizationRepository {
  save(organization: OrganizationAggregate): Promise<void>;
  findByName(name: string, ownerId: UserId): Promise<OrganizationAggregate | null>;
  findBySlug(slug: string): Promise<OrganizationAggregate | null>;
}

class DrizzleOrganizationRepository implements OrganizationRepository {
  async findByName(name: string, ownerId: UserId): Promise<OrganizationAggregate | null> {
    const db = await createDrizzleSupabaseClient();
    
    const data = await db.rls((tx) =>
      tx.query.organizations.findFirst({
        where: and(
          eq(organizations.name, name),
          eq(organizations.ownerId, ownerId.value)
        ),
      })
    );

    if (!data) return null;

    const organization = new Organization(
      new OrganizationId(data.id),
      data.name,
      data.slug,
      new UserId(data.ownerId),
      data.isDefault,
      new Date(data.createdAt),
      new Date(data.updatedAt)
    );

    return new OrganizationAggregate(organization);
  }
}
```

### Server Actions
```typescript
export async function createOrganizationAction(
  input: { name: string; slug?: string }
): Promise<OrganizationSummary> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }

  // 1. Input 검증
  if (!input.name?.trim()) {
    throw new Error('Organization name is required');
  }

  // 2. 중복 검증
  const organizationRepository = new DrizzleOrganizationRepository();
  const existingOrg = await organizationRepository.findByName(
    input.name,
    new UserId(user.id)
  );
  
  if (existingOrg) {
    throw new Error('Organization with this name already exists');
  }

  // 3. 슬러그 생성
  const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, '-');

  // 4. 조직 생성
  const organization = OrganizationAggregate.create(
    input.name,
    slug,
    new UserId(user.id)
  );
  
  await organizationRepository.save(organization);

  // 5. 관련 페이지 재검증
  revalidatePath('/dashboard');
  revalidatePath('/organizations');

  return {
    id: organization.id,
    name: organization.entity.name,
    slug: organization.entity.slug,
    memberCount: 1,
    isDefault: organization.entity.isDefault,
    isSelected: false,
    role: "owner" as const,
    createdAt: organization.entity.createdAt
  };
}
```

### Frontend Form
```typescript
// OrganizationForm.tsx
export function OrganizationForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createOrganizationAction({ name, slug });
      
      if (result.success) {
        toast.success('Organization created successfully');
        setName('');
        setSlug('');
        onSuccess?.();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter organization name"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="slug">Slug (optional)</Label>
        <Input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="organization-slug"
        />
      </div>
      
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Organization'}
      </Button>
    </form>
  );
}
```

## 📋 Sub-tasks

### Backend Domain
- [ ] Organization Entity 확장
- [ ] OrganizationAggregate 확장
- [ ] CreateOrganizationCommand 정의
- [ ] OrganizationCreatedEvent 정의

### Database & Repository
- [ ] organizations 테이블 확장
- [ ] OrganizationRepository 확장
- [ ] 중복 검증 로직 구현

### API & Server Action
- [ ] createOrganizationAction 구현
- [ ] 에러 처리 및 검증 로직
- [ ] 중복 검증 로직

### Frontend
- [ ] 조직 생성 폼 컴포넌트
- [ ] 폼 검증 및 에러 처리
- [ ] 성공 시 조직 목록 업데이트

### Integration Task
- [ ] 조직 목록 새로고침
- [ ] 이벤트 발행 및 구독
- [ ] 권한 검증

### E2E & Observability
- [ ] 조직 생성 E2E 테스트
- [ ] 에러 모니터링 설정
- [ ] 성능 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 새 조직 생성 정상 동작
- [ ] 조직명 중복 검증 정상 동작
- [ ] 조직 생성 실패 시 에러 처리
- [ ] 조직 목록에 새 조직 추가

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
**선행 Story**: Story-005 (조직 선택 및 컨텍스트 설정)
**후행 Story**: Story-007 (멤버 초대)
**외부 의존성**: Database, User Authentication

## 📁 관련 문서
- [Epic 문서](../../epics/epic-001-user-management.md)
- [Process Model](../../../event-domain-design/domains/user-management-domain/process-model.md)
- [Technical Specification](../../../event-domain-design/domains/user-management-domain/technical-specification.md)
