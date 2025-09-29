# Story 007: 멤버 초대

## 🎯 Story 개요
**User Story**: As a 조직 소유자 I want to 이메일로 새 멤버를 초대할 수 있어야 so that 팀원들과 함께 작업할 수 있다
**Story Points**: 5
**우선순위**: Medium
**Epic**: Epic-001 User Management

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 멤버 초대 성공
```gherkin
Given 조직 소유자가 있다
When 멤버 초대 폼을 작성한다
And 이메일 주소를 입력한다
And 역할을 선택한다
And 초대 버튼을 클릭한다
Then 초대 링크가 생성된다
And 초대 이메일이 전송된다
And 초대 정보가 저장된다
And 초대 전송 완료 이벤트가 발생한다
```

### 시나리오 2: 중복 초대 방지
```gherkin
Given 조직에 이미 멤버가 있다
When 동일한 이메일로 멤버를 초대한다
Then 중복 초대 오류 메시지가 표시된다
And 초대가 취소된다
And 사용자에게 기존 멤버임을 안내한다
```

### 시나리오 3: 초대 링크 클릭 및 수락
```gherkin
Given 초대받은 사용자가 있다
When 초대 링크를 클릭한다
Then 초대 수락 페이지가 표시된다
And 조직 정보가 표시된다
And 수락/거절 버튼이 표시된다
When 수락 버튼을 클릭한다
Then 사용자가 조직에 추가된다
And 멤버십이 생성된다
And 초대 수락 완료 이벤트가 발생한다
```

### 시나리오 4: 초대 만료 처리
```gherkin
Given 30일이 지난 초대가 있다
When 만료된 초대 링크를 클릭한다
Then 초대 만료 메시지가 표시된다
And 새로운 초대를 요청할 수 있는 옵션이 제공된다
```

## 🔧 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// Command
interface InviteMemberCommand {
  organizationId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
}

// Event
interface MemberInvitedEvent {
  invitationId: string;
  organizationId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  invitationLink: string;
  expiresAt: Date;
  timestamp: Date;
}

// Aggregate
class InvitationAggregate {
  constructor(
    public readonly id: InvitationId,
    public readonly organizationId: OrganizationId,
    public readonly email: string,
    public readonly role: 'admin' | 'member',
    public readonly invitedBy: UserId,
    public readonly status: 'pending' | 'accepted' | 'rejected' | 'expired',
    public readonly expiresAt: Date,
    public readonly createdAt: Date
  ) {}

  static create(
    organizationId: OrganizationId,
    email: string,
    role: 'admin' | 'member',
    invitedBy: UserId
  ): InvitationAggregate {
    const invitationId = InvitationId.generate();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30일 후
    
    return new InvitationAggregate(
      invitationId,
      organizationId,
      email,
      role,
      invitedBy,
      'pending',
      expiresAt,
      new Date()
    );
  }
}
```

### Repository 메서드
```typescript
interface InvitationRepository {
  save(invitation: InvitationAggregate): Promise<void>;
  findById(id: InvitationId): Promise<InvitationAggregate | null>;
  findByEmail(email: string, organizationId: OrganizationId): Promise<InvitationAggregate | null>;
  findByOrganizationId(organizationId: OrganizationId): Promise<InvitationAggregate[]>;
}

class DrizzleInvitationRepository implements InvitationRepository {
  async save(invitation: InvitationAggregate): Promise<void> {
    const db = await createDrizzleSupabaseClient();
    
    await db.rls((tx) =>
      tx.insert(invitations).values({
        id: invitation.id.value,
        organizationId: invitation.organizationId.value,
        email: invitation.email,
        role: invitation.role,
        invitedBy: invitation.invitedBy.value,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })
    );
  }
}
```

### Server Actions
```typescript
export async function inviteMemberAction(
  input: { organizationId: string; email: string; role: 'admin' | 'member' }
): Promise<InvitationSummary> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Authentication required');
  }

  // 1. 권한 검증 (조직 소유자만 초대 가능)
  const organizationRepository = new DrizzleOrganizationRepository();
  const organization = await organizationRepository.findById(new OrganizationId(input.organizationId));
  
  if (!organization || organization.entity.ownerId.value !== user.id) {
    throw new Error('Access denied');
  }

  // 2. 중복 초대 검증
  const invitationRepository = new DrizzleInvitationRepository();
  const existingInvitation = await invitationRepository.findByEmail(
    input.email,
    new OrganizationId(input.organizationId)
  );
  
  if (existingInvitation && existingInvitation.status === 'pending') {
    throw new Error('Invitation already sent to this email');
  }

  // 3. 초대 생성
  const invitation = InvitationAggregate.create(
    new OrganizationId(input.organizationId),
    input.email,
    input.role,
    new UserId(user.id)
  );
  
  await invitationRepository.save(invitation);

  // 4. 초대 링크 생성
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitation.id.value}`;

  // 5. 이메일 전송 (실제 구현에서는 이메일 서비스 연동)
  await sendInvitationEmail({
    to: input.email,
    organizationName: organization.entity.name,
    invitationLink,
    role: input.role
  });

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    invitationLink
  };
}
```

### Database Schema
```sql
-- 초대 테이블
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 멤버십 테이블
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES profiles(id), -- NULL for pending invitations
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'removed')),
  invited_by UUID REFERENCES profiles(id),
  invitee_email TEXT,
  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invitations" ON invitations
  FOR SELECT USING (auth.uid() = invited_by);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own memberships" ON memberships
  FOR SELECT USING (auth.uid() = user_id);
```

## 📋 Sub-tasks

### Backend Domain
- [ ] InvitationAggregate 구현
- [ ] InviteMemberCommand 정의
- [ ] MemberInvitedEvent 정의
- [ ] 초대 만료 처리 로직

### Database & Repository
- [ ] invitations 테이블 생성
- [ ] memberships 테이블 생성
- [ ] InvitationRepository 구현
- [ ] MembershipRepository 구현

### API & Server Action
- [ ] inviteMemberAction 구현
- [ ] acceptInvitationAction 구현
- [ ] 에러 처리 및 검증 로직

### Frontend
- [ ] 멤버 초대 폼 컴포넌트
- [ ] 초대 수락 페이지
- [ ] 초대 상태 관리

### Integration Task
- [ ] 이메일 서비스 연동
- [ ] 초대 링크 생성
- [ ] 권한 검증

### E2E & Observability
- [ ] 멤버 초대 E2E 테스트
- [ ] 에러 모니터링 설정
- [ ] 성능 모니터링 설정

## 🎯 Definition of Done

### 기능적 완료
- [ ] 멤버 초대 정상 동작
- [ ] 중복 초대 방지 정상 동작
- [ ] 초대 수락 정상 동작
- [ ] 초대 만료 처리 정상 동작

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
**선행 Story**: Story-006 (조직 생성)
**후행 Story**: Story-008 (멤버 관리)
**외부 의존성**: 이메일 서비스, Database, User Authentication

## 📁 관련 문서
- [Epic 문서](../../epics/epic-001-user-management.md)
- [Process Model](../../../event-domain-design/domains/user-management-domain/process-model.md)
- [Technical Specification](../../../event-domain-design/domains/user-management-domain/technical-specification.md)
