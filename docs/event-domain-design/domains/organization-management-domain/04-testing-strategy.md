# Organization Management Domain - Testing Strategy

Software Design을 기반으로 한 테스트 전략 문서입니다.

**작성 시점**: Software Design 완료 후, Technical Specification 작성 전  
**목적**: 구현하기 전에 "무엇을 어떻게 테스트할지" 명확히 정의

**주요 변경사항 (v6.0)**: User Management Domain에서 완전히 분리
- Organization 관련 모든 테스트를 organization-management domain에서 관리
- UserId는 user-management domain에서 re-export하여 참조
- Frontend 레이어 테스트 추가 (User Management에서 이동)

---

## 🎯 Testing Strategy Overview

### 테스트 레벨별 목표

```
┌─────────────────────────────────────────────────────────────┐
│ E2E Tests (10%)                                             │
│ - 사용자 시나리오: 조직 생성 → 멤버 초대 → 초대 수락        │
│ - 목표: 2-3개 핵심 시나리오                                 │
├─────────────────────────────────────────────────────────────┤
│ Integration Tests (20%)                                     │
│ - Service + Repository + Database                           │
│ - Server Actions 전체 플로우                                │
│ - 목표: 6-8개 통합 시나리오                                 │
├─────────────────────────────────────────────────────────────┤
│ Unit Tests (70%)                                            │
│ - Value Objects, Entities, Aggregates                       │
│ - 비즈니스 로직 격리 테스트                                 │
│ - 목표: 25-30개 단위 테스트                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Unit Tests 전략

### 1. Value Objects 테스트

#### UserId VO (User Management Domain에서 참조)
- **파일 위치**: `src/domains/user-management/shared/value-objects/__tests__/ids.test.ts`
- **Re-export 위치**: `src/domains/organization-management/shared/value-objects/ids.vo.ts`
- **테스트 책임**: User Management Domain에서 관리
- **Organization Domain 사용**: ownerId, inviterUserId, inviteeUserId 등에서 UserId 타입 사용

#### OrganizationId VO
```typescript
describe('OrganizationId Value Object', () => {
  describe('생성', () => {
    it('UUID 기반으로 생성되어야 한다')
    it('생성된 ID는 유효한 형식이어야 한다')
    it('빈 값은 허용하지 않아야 한다')
  })
  
  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다')
    it('다른 ID는 다르다고 판단되어야 한다')
  })
  
  describe('generate', () => {
    it('새로운 UUID를 생성해야 한다')
    it('생성된 ID는 매번 달라야 한다')
  })
})
```

**파일 위치**: `src/domains/organization-management/shared/value-objects/__tests__/ids.test.ts` (미구현)  
**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### InvitationId VO
```typescript
describe('InvitationId Value Object', () => {
  describe('생성', () => {
    it('UUID 기반으로 생성되어야 한다')
    it('생성된 ID는 유효한 형식이어야 한다')
  })
  
  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### NotificationId VO
- **참고**: Notification 관련 테스트는 Notification Management Domain으로 이동 예정
- **현재 상태**: Organization Management에서는 NotificationId를 참조용으로만 사용
- **테스트 책임**: Notification Management Domain에서 관리

#### MemberRole VO
```typescript
describe('MemberRole Value Object', () => {
  describe('생성', () => {
    it('유효한 역할로 생성되어야 한다')
    it('유효하지 않은 역할은 거부해야 한다')
  })
  
  describe('권한 체크', () => {
    it('canInviteMembers: owner와 admin은 true여야 한다')
    it('canInviteMembers: member는 false여야 한다')
    it('canManageOrganization: owner와 admin은 true여야 한다')
    it('canTransferOwnership: owner만 true여야 한다')
  })
})
```

**파일 위치**: `src/domains/organization-management/shared/value-objects/__tests__/member-role.test.ts` (미구현)  
**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

### 2. Entities 테스트

#### Organization Entity
```typescript
describe('Organization Entity', () => {
  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다')
    it('isDefault 플래그가 올바르게 설정되어야 한다')
    it('소유자가 올바르게 설정되어야 한다')
  })
  
  describe('updateName', () => {
    it('조직 이름을 업데이트해야 한다')
    it('빈 이름은 허용하지 않아야 한다')
    it('updatedAt이 갱신되어야 한다')
  })
  
  describe('addMember', () => {
    it('새 멤버를 추가해야 한다')
    it('중복 멤버는 추가할 수 없어야 한다')
    it('멤버 역할이 올바르게 설정되어야 한다')
  })
  
  describe('removeMember', () => {
    it('멤버를 제거해야 한다')
    it('소유자는 제거할 수 없어야 한다')
    it('마지막 소유자는 제거할 수 없어야 한다')
  })
  
  describe('transferOwnership', () => {
    it('소유권을 이전해야 한다')
    it('기존 소유자는 Admin으로 변경되어야 한다')
    it('새 소유자만 Owner가 될 수 있어야 한다')
  })
  
  describe('delete', () => {
    it('조직을 삭제해야 한다')
    it('기본 조직은 삭제할 수 없어야 한다')
    it('관련 멤버십도 정리되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### Invitation Entity
```typescript
describe('Invitation Entity', () => {
  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다')
    it('초기 상태는 pending이어야 한다')
    it('초대자와 초대받은 이메일이 설정되어야 한다')
  })
  
  describe('accept', () => {
    it('초대를 승낙해야 한다')
    it('상태가 accepted로 변경되어야 한다')
    it('응답 시간이 기록되어야 한다')
    it('이미 처리된 초대는 승낙할 수 없어야 한다')
  })
  
  describe('reject', () => {
    it('초대를 거절해야 한다')
    it('상태가 rejected로 변경되어야 한다')
    it('응답 시간이 기록되어야 한다')
    it('이미 처리된 초대는 거절할 수 없어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### Notification Entity (Notification Management Domain으로 이동 예정)
- **참고**: Notification Entity 및 관련 테스트는 Notification Management Domain으로 이동 예정
- **현재 상태**: Organization Management에서는 알림 생성 요청만 발행
- **테스트 책임**: Notification Management Domain에서 관리
- **통합 테스트**: Organization → Notification 도메인 간 통합 테스트 필요

---

### 3. Aggregates 테스트

#### OrganizationAggregate
```typescript
describe('OrganizationAggregate', () => {
  describe('createDefault', () => {
    it('사용자를 위한 기본 조직이 생성되어야 한다')
    it('isDefault가 true로 설정되어야 한다')
    it('소유자가 올바르게 설정되어야 한다')
    it('DefaultOrganizationCreatedEvent가 발행되어야 한다')
  })
  
  describe('createNew', () => {
    it('새로운 조직이 생성되어야 한다')
    it('조직 타입이 올바르게 설정되어야 한다')
    it('생성자가 소유자로 설정되어야 한다')
    it('isDefault가 false로 설정되어야 한다')
    it('NewOrganizationCreatedEvent가 발행되어야 한다')
  })
  
  describe('addMember', () => {
    it('새 멤버를 조직에 추가해야 한다')
    it('중복 멤버는 추가할 수 없어야 한다')
    it('멤버 역할이 올바르게 설정되어야 한다')
    it('NewMemberAddedToOrganizationEvent가 발행되어야 한다')
  })
  
  describe('changeMemberRole', () => {
    it('소유자가 멤버를 관리자로 승격해야 한다')
    it('소유자가 관리자를 멤버로 강등해야 한다')
    it('관리자가 멤버를 관리자로 승격해야 한다')
    it('관리자는 관리자를 강등할 수 없어야 한다')
    it('소유자 역할은 변경할 수 없어야 한다')
    it('소유자는 자신의 역할을 변경할 수 없어야 한다')
    it('현재 역할과 동일한 역할로 변경할 수 없어야 한다')
    it('MemberPromotedToAdminEvent가 발행되어야 한다')
    it('AdminDemotedToMemberEvent가 발행되어야 한다')
  })
  
  describe('removeMember', () => {
    it('멤버를 조직에서 제거해야 한다')
    it('소유자는 제거할 수 없어야 한다')
    it('MemberRemovedFromOrganizationEvent가 발행되어야 한다')
  })
  
  describe('transferOwnership', () => {
    it('소유권을 이전해야 한다')
    it('기존 소유자는 Admin으로 변경되어야 한다')
    it('OrganizationOwnershipTransferredEvent가 발행되어야 한다')
  })
  
  describe('delete', () => {
    it('조직을 삭제해야 한다')
    it('기본 조직은 삭제할 수 없어야 한다')
    it('OrganizationDeletedEvent가 발행되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 1-6

#### InvitationAggregate
```typescript
describe('InvitationAggregate', () => {
  describe('selectInvitationEmail', () => {
    it('유효한 이메일로 초대 이메일을 선택해야 한다')
    it('이미 조직 멤버인 이메일은 선택할 수 없어야 한다')
    it('중복 초대가 있는 이메일은 선택할 수 없어야 한다')
    it('InvitationEmailSelectedEvent가 발행되어야 한다')
  })
  
  describe('requestMemberInvitation', () => {
    it('유효한 초대 요청을 처리해야 한다')
    it('소유자/관리자만 초대 요청할 수 있어야 한다')
    it('MemberInvitationRequestedEvent가 발행되어야 한다')
  })
  
  describe('acceptInvitation', () => {
    it('초대받은 사용자가 초대를 승낙해야 한다')
    it('유효하지 않은 초대는 승낙할 수 없어야 한다')
    it('InvitationAcceptedEvent가 발행되어야 한다')
  })
  
  describe('rejectInvitation', () => {
    it('초대받은 사용자가 초대를 거절해야 한다')
    it('유효하지 않은 초대는 거절할 수 없어야 한다')
    it('InvitationRejectedEvent가 발행되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 2

#### NotificationAggregate (Notification Management Domain으로 이동 예정)
- **참고**: NotificationAggregate 및 관련 테스트는 Notification Management Domain으로 이동 예정
- **문서 위치**: `../notification-management-domain/04-testing-strategy.md`
- **Organization Domain의 역할**: 
  - 멤버 초대 시 Notification Management Domain의 `createNotificationAction` 호출
  - 초대 응답 시 알림 읽음/보관 처리 요청
- **통합 테스트 필요**: Organization ↔ Notification 도메인 간 통신 테스트

---

## 🔗 Integration Tests 전략

### 1. Repository 통합 테스트

#### OrganizationRepository
```typescript
describe('OrganizationRepository Integration Tests', () => {
  beforeEach(async () => {
    // 테스트 데이터베이스 초기화
    await cleanDatabase();
  })
  
  describe('save', () => {
    it('조직을 데이터베이스에 저장해야 한다')
    it('중복 ID는 거부해야 한다')
    it('RLS 정책이 적용되어야 한다')
  })
  
  describe('findByOwnerId', () => {
    it('소유자의 모든 조직을 조회해야 한다')
    it('생성일 순으로 정렬되어야 한다')
    it('다른 소유자의 조직은 조회되지 않아야 한다')
  })
  
  describe('findById', () => {
    it('ID로 조직을 찾아야 한다')
    it('존재하지 않는 ID는 null을 반환해야 한다')
    it('권한이 없는 조직은 조회되지 않아야 한다')
  })
  
  describe('delete', () => {
    it('조직을 삭제해야 한다')
    it('관련 멤버십도 정리되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

#### InvitationRepository
```typescript
describe('InvitationRepository Integration Tests', () => {
  describe('save', () => {
    it('초대를 데이터베이스에 저장해야 한다')
    it('중복 초대는 방지해야 한다')
  })
  
  describe('findByOrganizationId', () => {
    it('조직의 모든 초대를 조회해야 한다')
    it('상태별로 필터링할 수 있어야 한다')
  })
  
  describe('findByInviteeEmail', () => {
    it('초대받은 이메일로 초대를 찾아야 한다')
    it('진행 중인 초대만 조회해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

#### NotificationRepository (Notification Management Domain으로 이동 예정)
- **참고**: NotificationRepository 및 관련 테스트는 Notification Management Domain으로 이동 예정
- **문서 위치**: `../notification-management-domain/04-testing-strategy.md`
- **Organization Domain의 역할**: Notification Management Domain의 Server Actions 호출
- **테스트 우선순위**: ⭐️⭐️⭐️ (Organization Domain의 통합 테스트에서 간접적으로 검증)

---

### 2. Service 통합 테스트

#### OrganizationManagementService
```typescript
describe('OrganizationCrudService Integration Tests', () => {
  describe('createDefaultOrganization', () => {
    it('사용자를 위한 기본 조직을 생성해야 한다')
    it('Default Workspace를 자동으로 생성해야 한다')
    it('소유자 개인 워크스페이스를 자동으로 생성해야 한다')
    it('이미 기본 조직이 있으면 예외를 발생시켜야 한다')
    it('생성된 워크스페이스 정보를 반환해야 한다')
  })
  
  describe('createOrganization', () => {
    it('새로운 조직을 생성해야 한다')
    it('조직 타입이 올바르게 설정되어야 한다')
    it('생성자를 소유자로 설정해야 한다')
    it('Default Workspace를 자동으로 생성해야 한다')
    it('소유자 개인 워크스페이스를 자동으로 생성해야 한다')
    it('개인 워크스페이스는 초대 불가 속성이어야 한다')
    it('조직 생성 후 컨텍스트를 전환해야 한다')
  })
  
})

describe('OrganizationInvitationService Integration Tests', () => {
  describe('inviteMember', () => {
    it('멤버를 초대해야 한다')
    it('중복 초대는 방지해야 한다')
    it('Notification Management Domain으로 알림 생성 요청을 보내야 한다')
  })
  
  describe('acceptInvitation', () => {
    it('초대에 응답해야 한다')
    it('승낙 시 조직에 멤버를 추가해야 한다')
    it('승낙 시 새 멤버의 개인 워크스페이스를 자동 생성해야 한다')
    it('생성된 개인 워크스페이스는 해당 멤버만 접근 가능해야 한다')
    it('개인 워크스페이스는 초대 불가 속성이어야 한다')
    it('알림을 읽음 처리해야 한다')
  })
  
  describe('rejectInvitation', () => {
    it('거절 시 초대를 무효화해야 한다')
    it('개인 워크스페이스는 생성되지 않아야 한다')
    it('알림을 읽음 처리해야 한다')
  })
  
  describe('changeMemberRole', () => {
    it('소유자가 멤버 역할을 변경해야 한다')
    it('관리자가 멤버를 관리자로 승격해야 한다')
    it('관리자가 관리자를 강등 시도 시 거부해야 한다')
    it('일반 멤버의 역할 변경 시도는 거부해야 한다')
    it('소유자 역할 변경 시도는 거부해야 한다')
    it('역할 변경 후 권한 캐시를 무효화해야 한다')
  })
  
  describe('removeMember', () => {
    it('멤버를 조직에서 제거해야 한다')
    it('소유자는 제거할 수 없어야 한다')
  })
  
  describe('transferOwnership', () => {
    it('소유권을 이전해야 한다')
    it('기존 소유자는 Admin으로 변경되어야 한다')
  })
  
  describe('deleteOrganization', () => {
    it('조직을 삭제해야 한다')
    it('기본 조직은 삭제할 수 없어야 한다')
    it('관련 데이터를 정리해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 1-6 전체 플로우

---

### 3. Server Actions 통합 테스트

#### OrganizationManagement Actions
```typescript
describe('Server Actions Integration Tests', () => {
  describe('createNewOrganizationAction', () => {
    it('인증된 사용자의 새로운 조직을 생성해야 한다')
    it('미인증 사용자는 거부해야 한다')
    it('조직 이름과 타입이 올바르게 설정되어야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
    it('실패 시 Result.err를 반환해야 한다')
  })
  
  describe('inviteMemberAction', () => {
    it('인증된 소유자/관리자가 멤버를 초대해야 한다')
    it('미인증 사용자는 거부해야 한다')
    it('권한이 없는 사용자는 거부해야 한다')
    it('중복 초대는 방지해야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
    it('실패 시 Result.err를 반환해야 한다')
  })
  
  describe('getOrganizationMembersAction', () => {
    it('조직 멤버 목록을 조회해야 한다')
    it('진행 중인 초대 목록을 조회해야 한다')
    it('권한이 없는 사용자는 거부해야 한다')
  })
  
  describe('getUserNotificationsAction', () => {
    it('사용자 알림 목록을 조회해야 한다')
    it('읽지 않은 알림 개수를 포함해야 한다')
    it('미인증 사용자는 거부해야 한다')
  })
  
  describe('respondToInvitationAction', () => {
    it('초대받은 사용자가 초대에 응답해야 한다')
    it('승낙 시 조직에 멤버가 추가되어야 한다')
    it('거절 시 초대가 무효화되어야 한다')
    it('유효하지 않은 초대는 거부해야 한다')
  })
  
  describe('changeMemberRoleAction', () => {
    it('인증된 소유자가 멤버 역할을 변경해야 한다')
    it('인증된 관리자가 멤버를 관리자로 승격해야 한다')
    it('관리자의 다운그레이드 시도는 소유자만 가능해야 한다')
    it('미인증 사용자는 거부해야 한다')
    it('일반 멤버의 역할 변경 시도는 거부해야 한다')
    it('소유자 역할 변경 시도는 거부해야 한다')
    it('유효하지 않은 역할은 거부해야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
    it('실패 시 Result.err를 반환해야 한다')
  })
  
  describe('removeMemberAction', () => {
    it('멤버를 조직에서 제거해야 한다')
    it('소유자는 제거할 수 없어야 한다')
    it('권한이 없는 사용자는 거부해야 한다')
  })
  
  describe('transferOwnershipAction', () => {
    it('소유권을 이전해야 한다')
    it('소유자만 이전할 수 있어야 한다')
    it('기존 소유자는 Admin으로 변경되어야 한다')
  })
  
  describe('deleteOrganizationAction', () => {
    it('조직을 삭제해야 한다')
    it('기본 조직은 삭제할 수 없어야 한다')
    it('소유자만 삭제할 수 있어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: Server Actions는 클라이언트와의 주요 접점

---

## 🎭 E2E Tests 전략

### 1. 새로운 조직 생성 플로우 (Scenario 1)

```typescript
test('새로운 조직 생성 전체 플로우 (워크스페이스 자동 생성 포함)', async ({ page }) => {
  // Given: 이미 등록된 사용자로 로그인
  await loginAsTestUser(page);
  
  // When: 대시보드 접근
  await page.goto('/dashboard');
  
  // When: "새 조직 만들기" 버튼 클릭
  await page.click('[data-testid="create-organization-button"]');
  
  // Then: 조직 생성 폼이 표시됨
  await expect(page.locator('[data-testid="organization-form"]')).toBeVisible();
  
  // When: 조직 정보 입력
  await page.fill('[data-testid="organization-name-input"]', '새로운 프로젝트');
  await page.selectOption('[data-testid="organization-type-select"]', 'startup');
  
  // When: 생성 버튼 클릭
  await page.click('[data-testid="create-organization-submit"]');
  
  // Then: 조직 생성 완료 알림 표시
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  
  // Then: 새 조직으로 컨텍스트 전환됨
  await expect(page.locator('[data-testid="selected-organization"]')).toContainText('새로운 프로젝트');
  
  // Then: 조직 목록에 새 조직이 추가됨
  await expect(page.locator('[data-testid="organization-list"]')).toContainText('새로운 프로젝트');
  
  // Then: Default Workspace가 자동 생성되어 워크스페이스 목록에 표시됨
  await expect(page.locator('[data-testid="workspace-list"]')).toContainText('Default Workspace');
  
  // Then: 개인 워크스페이스가 자동 생성되어 워크스페이스 목록에 표시됨
  await expect(page.locator('[data-testid="workspace-list"]')).toContainText('개인 워크스페이스');
  
  // Then: 개인 워크스페이스에는 초대 버튼이 비활성화됨
  await page.click('[data-testid="personal-workspace"]');
  await expect(page.locator('[data-testid="invite-member-button"]')).toBeDisabled();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 1 전체

### 2. 멤버 초대 및 수락 플로우 (Scenario 2)

#### Sequence 1: 멤버 초대 플로우
```typescript
test('조직 소유자가 새 멤버를 초대하는 전체 플로우', async ({ page }) => {
  // Given: 조직 소유자로 로그인
  await loginAsOrganizationOwner(page);
  
  // When: 멤버 관리 버튼 클릭
  await page.click('[data-testid="member-management-button"]');
  
  // Then: 멤버 초대 폼이 표시됨
  await expect(page.locator('[data-testid="invitation-form"]')).toBeVisible();
  await expect(page.locator('[data-testid="current-members-list"]')).toBeVisible();
  
  // When: 초대할 이메일 입력
  await page.fill('[data-testid="invite-email-input"]', 'newmember@example.com');
  
  // Then: 이메일 검색 결과 표시
  await expect(page.locator('[data-testid="email-search-results"]')).toBeVisible();
  
  // When: 역할 선택 및 초대 요청
  await page.selectOption('[data-testid="member-role-select"]', 'member');
  await page.click('[data-testid="send-invitation-button"]');
  
  // Then: 초대 성공 메시지 표시
  await expect(page.locator('[data-testid="invitation-success"]')).toBeVisible();
  
  // Then: 진행 중인 초대가 목록에 표시됨
  await expect(page.locator('[data-testid="pending-invitations"]')).toContainText('newmember@example.com');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 2 - Sequence 1

#### Sequence 2: 초대 수락/거절 플로우
```typescript
test('초대받은 사용자가 초대를 수락하는 전체 플로우 (개인 워크스페이스 자동 생성)', async ({ page }) => {
  // Given: 초대가 생성된 상태
  await createInvitationForUser('invitee@example.com');
  
  // When: 초대받은 사용자로 로그인
  await loginAsUser(page, 'invitee@example.com');
  
  // When: 인박스 버튼 클릭
  await page.click('[data-testid="inbox-button"]');
  
  // Then: 초대 알림이 표시됨
  await expect(page.locator('[data-testid="invitation-notification"]')).toBeVisible();
  await expect(page.locator('[data-testid="invitation-notification"]')).toContainText('조직에 초대함');
  
  // When: 초대 승낙 버튼 클릭
  await page.click('[data-testid="accept-invitation-button"]');
  
  // Then: 성공 메시지 표시
  await expect(page.locator('[data-testid="acceptance-success"]')).toBeVisible();
  
  // Then: 조직 멤버로 추가됨
  await expect(page.locator('[data-testid="organization-context"]')).toBeVisible();
  
  // Then: 알림이 읽음 처리됨
  await expect(page.locator('[data-testid="unread-count"]')).toHaveText('0');
  
  // Then: 개인 워크스페이스가 자동 생성되어 워크스페이스 목록에 표시됨
  await page.goto('/workspace');
  await expect(page.locator('[data-testid="workspace-list"]')).toContainText('개인 워크스페이스');
  
  // Then: 개인 워크스페이스는 본인만 접근 가능
  await page.click('[data-testid="personal-workspace"]');
  await expect(page.locator('[data-testid="invite-member-button"]')).toBeDisabled();
  await expect(page.locator('[data-testid="workspace-privacy-badge"]')).toContainText('개인 전용');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 2 - Sequence 2

### 3. 조직 소유권 이전 플로우 (Scenario 5)

```typescript
test('조직 소유권 이전 전체 플로우', async ({ page }) => {
  // Given: 조직 소유자로 로그인
  await loginAsOrganizationOwner(page);
  
  // When: 조직 설정 페이지 접근
  await page.goto('/organization/settings');
  
  // When: 소유권 이전 버튼 클릭
  await page.click('[data-testid="transfer-ownership-button"]');
  
  // Then: 소유권 이전 폼이 표시됨
  await expect(page.locator('[data-testid="ownership-transfer-form"]')).toBeVisible();
  
  // When: 새 소유자 선택
  await page.selectOption('[data-testid="new-owner-select"]', 'admin@example.com');
  
  // When: 이전 확인
  await page.fill('[data-testid="transfer-confirmation-input"]', 'TRANSFER');
  await page.click('[data-testid="confirm-transfer-button"]');
  
  // Then: 소유권 이전 완료 메시지 표시
  await expect(page.locator('[data-testid="transfer-success"]')).toBeVisible();
  
  // Then: 기존 소유자는 Admin으로 변경됨
  await expect(page.locator('[data-testid="user-role"]')).toContainText('Admin');
  
  // Then: 새 소유자가 Owner로 표시됨
  await expect(page.locator('[data-testid="owner-info"]')).toContainText('admin@example.com');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 5 전체

### 4. 멤버 역할 변경 플로우 (Scenario 3)

#### Sequence 1: 역할 옵션 선택 및 확인 다이얼로그
```typescript
test('소유자가 멤버를 관리자로 승격하는 전체 플로우', async ({ page }) => {
  // Given: 조직 소유자로 로그인
  await loginAsOrganizationOwner(page);
  
  // When: 멤버 관리 화면 접근
  await page.goto('/organization/members');
  
  // Then: 멤버 목록이 표시됨
  await expect(page.locator('[data-testid="member-list"]')).toBeVisible();
  
  // When: 멤버의 역할 변경 버튼 클릭
  await page.click('[data-testid="change-role-button-member1"]');
  
  // Then: 역할 선택 옵션이 표시됨
  await expect(page.locator('[data-testid="role-options"]')).toBeVisible();
  await expect(page.locator('[data-testid="current-role-checked"]')).toBeVisible();
  
  // When: 관리자 역할 옵션 선택
  await page.click('[data-testid="role-option-admin"]');
  
  // Then: 업그레이드 확인 다이얼로그 표시
  await expect(page.locator('[data-testid="upgrade-confirmation-dialog"]')).toBeVisible();
  await expect(page.locator('[data-testid="role-change-info"]')).toContainText('멤버 → 관리자');
  await expect(page.locator('[data-testid="permission-change-info"]')).toBeVisible();
  
  // When: 확인 버튼 클릭
  await page.click('[data-testid="confirm-role-change"]');
  
  // Then: 역할 변경 완료 메시지 표시
  await expect(page.locator('[data-testid="role-change-success"]')).toBeVisible();
  
  // Then: 멤버 목록에서 역할이 업데이트됨
  await expect(page.locator('[data-testid="member-role-member1"]')).toContainText('Admin');
})

test('소유자가 관리자를 멤버로 강등하는 전체 플로우', async ({ page }) => {
  // Given: 조직 소유자로 로그인
  await loginAsOrganizationOwner(page);
  
  // When: 멤버 관리 화면 접근
  await page.goto('/organization/members');
  
  // When: 관리자의 역할 변경 버튼 클릭
  await page.click('[data-testid="change-role-button-admin1"]');
  
  // Then: 역할 선택 옵션이 표시됨
  await expect(page.locator('[data-testid="role-options"]')).toBeVisible();
  
  // When: 멤버 역할 옵션 선택
  await page.click('[data-testid="role-option-member"]');
  
  // Then: 다운그레이드 확인 다이얼로그 표시
  await expect(page.locator('[data-testid="downgrade-confirmation-dialog"]')).toBeVisible();
  await expect(page.locator('[data-testid="role-change-info"]')).toContainText('관리자 → 멤버');
  
  // When: 확인 버튼 클릭
  await page.click('[data-testid="confirm-role-change"]');
  
  // Then: 역할 변경 완료 메시지 표시
  await expect(page.locator('[data-testid="role-change-success"]')).toBeVisible();
  
  // Then: 멤버 목록에서 역할이 업데이트됨
  await expect(page.locator('[data-testid="member-role-admin1"]')).toContainText('Member');
})

test('관리자가 멤버를 관리자로 승격하는 플로우', async ({ page }) => {
  // Given: 조직 관리자로 로그인
  await loginAsOrganizationAdmin(page);
  
  // When: 멤버 관리 화면 접근
  await page.goto('/organization/members');
  
  // When: 멤버의 역할 변경 버튼 클릭
  await page.click('[data-testid="change-role-button-member1"]');
  
  // When: 관리자 역할 옵션 선택
  await page.click('[data-testid="role-option-admin"]');
  
  // Then: 업그레이드 확인 다이얼로그 표시
  await expect(page.locator('[data-testid="upgrade-confirmation-dialog"]')).toBeVisible();
  
  // When: 확인 버튼 클릭
  await page.click('[data-testid="confirm-role-change"]');
  
  // Then: 역할 변경 완료
  await expect(page.locator('[data-testid="role-change-success"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 3 전체 (두 단계 프로세스)

### 5. 멤버 제거 플로우 (Scenario 4)

```typescript
test('멤버 제거 전체 플로우', async ({ page }) => {
  // Given: 조직 관리자로 로그인
  await loginAsOrganizationAdmin(page);
  
  // When: 멤버 관리 페이지 접근
  await page.goto('/organization/members');
  
  // When: 멤버 제거 버튼 클릭
  await page.click('[data-testid="remove-member-button-member1"]');
  
  // Then: 제거 확인 다이얼로그 표시
  await expect(page.locator('[data-testid="remove-confirmation-dialog"]')).toBeVisible();
  
  // When: 제거 확인
  await page.fill('[data-testid="remove-confirmation-input"]', 'REMOVE');
  await page.click('[data-testid="confirm-remove-button"]');
  
  // Then: 멤버 제거 완료 메시지 표시
  await expect(page.locator('[data-testid="remove-success"]')).toBeVisible();
  
  // Then: 멤버 목록에서 제거됨
  await expect(page.locator('[data-testid="member-list"]')).not.toContainText('member1@example.com');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 4 전체

### 6. 조직 삭제 플로우 (Scenario 6)

```typescript
test('조직 삭제 전체 플로우', async ({ page }) => {
  // Given: 조직 소유자로 로그인
  await loginAsOrganizationOwner(page);
  
  // When: 조직 설정 페이지 접근
  await page.goto('/organization/settings');
  
  // When: 조직 삭제 버튼 클릭
  await page.click('[data-testid="delete-organization-button"]');
  
  // Then: 삭제 확인 다이얼로그 표시
  await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
  
  // When: 삭제 확인
  await page.fill('[data-testid="delete-confirmation-input"]', 'DELETE');
  await page.click('[data-testid="confirm-delete-button"]');
  
  // Then: 조직 삭제 완료 메시지 표시
  await expect(page.locator('[data-testid="delete-success"]')).toBeVisible();
  
  // Then: 기본 조직으로 컨텍스트 전환됨
  await expect(page.locator('[data-testid="selected-organization"]')).toContainText('기본 조직');
  
  // Then: 삭제된 조직이 목록에서 제거됨
  await expect(page.locator('[data-testid="organization-list"]')).not.toContainText('삭제된 조직');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 6 전체

### 7. 에러 시나리오

```typescript
test('권한이 없는 사용자가 멤버 초대 시도 시 에러 표시', async ({ page }) => {
  // Given: 일반 멤버로 로그인
  await loginAsRegularMember(page);
  
  // When: 멤버 관리 버튼 클릭 시도
  await page.goto('/organization/members');
  
  // Then: 권한 없음 메시지 표시
  await expect(page.locator('[data-testid="permission-denied"]')).toBeVisible();
})

test('중복 초대 시도 시 에러 메시지 표시', async ({ page }) => {
  // Given: 이미 초대된 이메일
  await createExistingInvitation('duplicate@example.com');
  
  // When: 동일한 이메일로 초대 시도
  await page.fill('[data-testid="invite-email-input"]', 'duplicate@example.com');
  await page.click('[data-testid="send-invitation-button"]');
  
  // Then: 중복 초대 에러 메시지 표시
  await expect(page.locator('[data-testid="duplicate-invitation-error"]')).toBeVisible();
})

test('기본 조직 삭제 시도 시 에러 메시지 표시', async ({ page }) => {
  // Given: 기본 조직 소유자로 로그인
  await loginAsDefaultOrganizationOwner(page);
  
  // When: 조직 삭제 시도
  await page.goto('/organization/settings');
  await page.click('[data-testid="delete-organization-button"]');
  
  // Then: 삭제 불가 메시지 표시
  await expect(page.locator('[data-testid="deletion-blocked"]')).toBeVisible();
  await expect(page.locator('[data-testid="deletion-blocked"]')).toContainText(
    '기본 조직은 삭제할 수 없습니다'
  );
})

test('관리자가 다른 관리자 강등 시도 시 에러 표시 (Scenario 3)', async ({ page }) => {
  // Given: 조직 관리자로 로그인
  await loginAsOrganizationAdmin(page);
  
  // When: 다른 관리자의 역할 변경 시도
  await page.goto('/organization/members');
  await page.click('[data-testid="change-role-button-admin2"]');
  await page.click('[data-testid="role-option-member"]');
  
  // Then: 권한 없음 에러 메시지 표시
  await expect(page.locator('[data-testid="permission-denied-error"]')).toBeVisible();
  await expect(page.locator('[data-testid="permission-denied-error"]')).toContainText(
    '관리자는 다른 관리자를 강등할 수 없습니다'
  );
})

test('소유자 역할 변경 시도 시 에러 표시 (Scenario 3)', async ({ page }) => {
  // Given: 조직 관리자로 로그인
  await loginAsOrganizationAdmin(page);
  
  // When: 소유자의 역할 변경 시도
  await page.goto('/organization/members');
  
  // Then: 소유자의 역할 변경 버튼이 비활성화됨
  await expect(page.locator('[data-testid="change-role-button-owner"]')).toBeDisabled();
})

test('일반 멤버의 역할 변경 시도 시 에러 표시 (Scenario 3)', async ({ page }) => {
  // Given: 일반 멤버로 로그인
  await loginAsRegularMember(page);
  
  // When: 멤버 관리 페이지 접근
  await page.goto('/organization/members');
  
  // Then: 역할 변경 버튼이 보이지 않음
  await expect(page.locator('[data-testid^="change-role-button-"]')).not.toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

---

## 📊 커버리지 목표

### 레이어별 커버리지

| 레이어 | 목표 커버리지 | 우선순위 |
|--------|--------------|---------|
| Value Objects | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Entities | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Aggregates | 90% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Services | 85% 이상 | ⭐️⭐️⭐️⭐️ |
| Repositories | 80% 이상 | ⭐️⭐️⭐️⭐️ |
| Server Actions | 85% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| UI Components | 70% 이상 | ⭐️⭐️⭐️ |

### 전체 목표

```
전체 코드 커버리지: 85% 이상
- Branches: 80% 이상
- Functions: 85% 이상
- Lines: 85% 이상
- Statements: 85% 이상
```

---

## 🎯 Process Model → Test 매핑

### Scenario 1: 새로운 조직 생성

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| Command: 새로운 조직 생성하기 | Unit | OrganizationAggregate.createNew() |
| System: Organization System | Unit | 조직 생성 비즈니스 로직 |
| System: Workspace 자동 생성 | Integration | WorkspaceCrudService.createDefaultWorkspace() |
| System: 개인 워크스페이스 자동 생성 | Integration | WorkspaceCrudService.createPersonalWorkspace() |
| Event: 새로운 조직이 생성됨 | Unit | NewOrganizationCreatedEvent 발행 검증 |
| Event: 기본 워크스페이스가 생성됨 | Integration | DefaultWorkspaceCreatedEvent 검증 |
| Event: 개인 워크스페이스가 생성됨 | Integration | PersonalWorkspaceCreatedEvent 검증 |
| 전체 플로우 | Integration | createOrganizationAction() - 조직 + 2개 워크스페이스 생성 |
| 사용자 경험 | E2E | 조직 생성 폼 → 생성 완료 → 워크스페이스 확인 → 컨텍스트 전환 |

### Scenario 2: 멤버 초대 및 수락

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| Command: 초대할 이메일 주소 입력하기 | Unit | InvitationAggregate.selectInvitationEmail() |
| System: Invitation System | Unit | 이메일 검색 및 중복 확인 로직 |
| Event: 초대할 이메일을 선택함 | Unit | InvitationEmailSelectedEvent 발행 검증 |
| Command: 멤버 초대 요청하기 | Unit | InvitationAggregate.requestMemberInvitation() |
| System: Invitation System & Notification System | Unit | 초대 생성 및 알림 생성 로직 |
| Event: 멤버 초대 요청함 | Unit | MemberInvitationRequestedEvent 발행 검증 |
| Event: 초대 알림 생성함 | Unit | InvitationNotificationCreatedEvent 발행 검증 |
| Command: 인박스 버튼 클릭하기 | E2E | 인박스 버튼 클릭 UI 테스트 |
| System: Invitation System | Unit | 초대 승낙/거절 처리 로직 |
| System: 개인 워크스페이스 자동 생성 (승낙 시) | Integration | WorkspaceCrudService.createPersonalWorkspace() |
| Event: 초대 거절함/승낙함 | Unit | InvitationRejectedEvent/AcceptedEvent 발행 검증 |
| Event: 개인 워크스페이스가 생성됨 (승낙 시) | Integration | PersonalWorkspaceCreatedEvent 검증 |
| Event: 알림 읽혀짐 | Unit | NotificationReadEvent 발행 검증 |
| 전체 플로우 | Integration | inviteMemberAction(), acceptInvitationAction() - 멤버 추가 + 개인 워크스페이스 |
| 사용자 경험 | E2E | 멤버 초대 → 알림 생성 → 초대 수락 → 개인 워크스페이스 확인 |

### Scenario 3: 멤버 역할 변경

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| **Sequence 1: 역할 옵션 선택** | | |
| Trigger Event: 역할 변경 버튼 클릭 | E2E | 역할 변경 버튼 클릭 UI 테스트 |
| Policy: 역할 선택 옵션 표시 | E2E | 역할 선택 옵션 표시 검증 |
| Command: 역할 옵션 선택하기 | Unit | OrganizationAggregate 권한 검증 로직 |
| System: Organization System (권한 검증) | Unit | 계층적 권한 시스템 로직 테스트 |
| Event: 역할 옵션이 선택됨 (프론트엔드) | E2E | RoleOptionSelectedEvent 발행 검증 |
| **Sequence 2: 확인 다이얼로그 및 역할 업데이트** | | |
| Policy: 확인 다이얼로그 표시 | E2E | 다이얼로그 표시 검증 |
| Command: 역할 변경 확인 | Unit | OrganizationAggregate.changeMemberRole() |
| System: Organization System (역할 업데이트) | Unit | 역할 변경 비즈니스 로직, 캐시 무효화 |
| Event: 멤버가 Admin으로 승격됨 | Unit | MemberPromotedToAdminEvent 발행 검증 |
| Event: Admin이 Member로 강등됨 | Unit | AdminDemotedToMemberEvent 발행 검증 |
| 전체 플로우 | Integration | changeMemberRoleAction() |
| 사용자 경험 | E2E | 역할 옵션 선택 → 확인 다이얼로그 → 역할 업데이트 |
| **에러 케이스** | | |
| 관리자의 다운그레이드 시도 (관리자) | Unit, E2E | 권한 거부 검증 |
| 소유자 역할 변경 시도 | Unit, E2E | 역할 변경 불가 검증 |
| 일반 멤버의 역할 변경 시도 | Unit, E2E | 권한 거부 검증 |

### Scenario 4: 멤버 제거

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| Command: 멤버 제거하기 | Unit | OrganizationAggregate.removeMember() |
| System: Member Removal System | Unit | 멤버 제거 비즈니스 로직 |
| Event: 멤버가 제거됨 | Unit | MemberRemovedFromOrganizationEvent 발행 검증 |
| 전체 플로우 | Integration | removeMemberAction() |
| 사용자 경험 | E2E | 멤버 제거 → 확인 → 조직에서 제외 |

### Scenario 5: 조직 소유권 이전

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| Command: 소유권 이전 요청하기 | Unit | OrganizationAggregate.transferOwnership() |
| System: Ownership Transfer Manager | Unit | 소유권 이전 비즈니스 로직 |
| Event: 소유권 이전 요청됨 | Unit | OwnershipTransferRequestedEvent 발행 검증 |
| Event: 소유권이 이전됨 | Unit | OrganizationOwnershipTransferredEvent 발행 검증 |
| 전체 플로우 | Integration | transferOwnershipAction() |
| 사용자 경험 | E2E | 소유권 이전 → 확인 → 권한 변경 |

### Scenario 6: 조직 삭제

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| Command: 조직 삭제하기 | Unit | OrganizationAggregate.delete() |
| System: Organization Deletion System | Unit | 조직 삭제 비즈니스 로직 |
| Event: 조직이 삭제됨 | Unit | OrganizationDeletedEvent 발행 검증 |
| 전체 플로우 | Integration | deleteOrganizationAction() |
| 사용자 경험 | E2E | 조직 삭제 → 확인 → 컨텍스트 전환 |

---

## 🔄 TDD 사이클 적용

### Aggregate 구현 예시

```typescript
// 1. RED: 테스트 먼저 작성
describe('OrganizationAggregate', () => {
  it('새로운 조직을 생성해야 한다', () => {
    const aggregate = new OrganizationAggregate();
    const result = aggregate.createNew('Test Org', 'startup', 'user123');
    
    expect(result.isSuccess).toBe(true);
    expect(result.value.name).toBe('Test Org');
  })
})

// 실행: FAIL (OrganizationAggregate 클래스 없음)

// 2. GREEN: 최소 구현
export class OrganizationAggregate {
  createNew(name: string, type: string, ownerId: string) {
    return Result.ok({
      name,
      type,
      ownerId
    });
  }
}

// 실행: PASS

// 3. REFACTOR: 비즈니스 로직 추가
export class OrganizationAggregate {
  createNew(name: string, type: string, ownerId: string) {
    if (!name || name.trim().length === 0) {
      return Result.err('Organization name is required');
    }
    
    if (!this.isValidOrganizationType(type)) {
      return Result.err('Invalid organization type');
    }
    
    const organization = new Organization({
      id: this.generateId(),
      name: name.trim(),
      type,
      ownerId,
      isDefault: false,
      createdAt: new Date()
    });
    
    this.addEvent(new NewOrganizationCreatedEvent(organization));
    
    return Result.ok(organization);
  }
}

// 실행: PASS (기존 테스트 통과 + 새 테스트 추가)
```

## 🛠️ 테스트 도구 및 설정

### Unit & Integration Tests
- **프레임워크**: Vitest
- **Assertion**: expect (Vitest 내장)
- **Mock**: vi (Vitest 내장)
- **커버리지**: v8

### E2E Tests
- **프레임워크**: Playwright
- **브라우저**: Chromium, Firefox, WebKit
- **스크린샷**: 실패 시 자동 캡처
- **비디오**: 실패 시 자동 녹화

### 테스트 데이터베이스
- **로컬**: PostgreSQL (Docker)
- **CI/CD**: Supabase 테스트 인스턴스
- **정리 전략**: 각 테스트 후 데이터 완전 삭제

---

## ✅ 검증 체크리스트

### 테스트 작성 전
- [ ] Process Model의 모든 시나리오가 테스트 케이스로 매핑되었는가?
- [ ] Software Design의 모든 Aggregate가 테스트 계획에 포함되었는가?
- [ ] 핵심 불변식이 테스트로 검증 가능한가?

### 테스트 작성 후
- [ ] 모든 Happy Path가 커버되는가?
- [ ] 주요 에러 시나리오가 테스트되는가?
- [ ] 경계값 테스트가 포함되어 있는가?
- [ ] 커버리지 목표를 달성했는가?

### 테스트 품질
- [ ] 테스트는 독립적으로 실행 가능한가?
- [ ] 테스트는 빠르게 실행되는가? (Unit < 100ms, Integration < 1s)
- [ ] 테스트는 반복 실행해도 동일한 결과를 내는가?
- [ ] 테스트 실패 시 원인을 명확히 알 수 있는가?

---

## 📚 다음 단계

이 Testing Strategy 문서를 기반으로 다음 문서를 작성하세요:

1. **Technical Specification** (4단계)
   - 각 클래스별 수도코드
   - **테스트 수도코드 포함** ✅
   - 구현 가이드라인

2. **실제 구현** (5단계)
   - TDD 사이클로 구현
   - 테스트 먼저 → 구현 → 리팩토링

3. **테스트 결과 문서** (6단계)
   - 커버리지 리포트
   - 실패한 테스트 분석
   - 개선 방향

---

이 Testing Strategy를 따라 높은 품질의 Organization Management Domain을 구현할 수 있습니다! 🎉
