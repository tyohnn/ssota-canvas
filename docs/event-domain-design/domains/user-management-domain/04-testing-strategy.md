# User Management Domain - Testing Strategy

Software Design을 기반으로 한 테스트 전략 문서입니다.

**작성 시점**: Software Design 완료 후, Technical Specification 작성 전  
**목적**: 구현하기 전에 "무엇을 어떻게 테스트할지" 명확히 정의

---

## 🎯 Testing Strategy Overview

### 테스트 레벨별 목표

```
┌─────────────────────────────────────────────────────────────┐
│ E2E Tests (10%)                                             │
│ - 사용자 시나리오: 구글 로그인 → 프로필 생성 → 온보딩 완료    │
│ - 목표: 1-2개 핵심 시나리오                                 │
├─────────────────────────────────────────────────────────────┤
│ Integration Tests (20%)                                     │
│ - Service + Repository + Database                           │
│ - Server Actions 전체 플로우                                │
│ - 목표: 3-5개 통합 시나리오                                 │
├─────────────────────────────────────────────────────────────┤
│ Unit Tests (70%)                                            │
│ - Value Objects, Entities, Aggregates                       │
│ - 비즈니스 로직 격리 테스트                                 │
│ - 목표: 15-20개 단위 테스트                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Unit Tests 전략

### 1. Value Objects 테스트

#### UserEmail VO
```typescript
describe('UserEmail Value Object', () => {
  describe('생성자', () => {
    it('유효한 이메일로 생성되어야 한다')
    it('잘못된 이메일 형식에 대해 예외를 발생시켜야 한다')
    it('빈 문자열은 허용하지 않아야 한다')
    it('255자를 초과하는 이메일은 허용하지 않아야 한다')
  })
  
  describe('equals', () => {
    it('동일한 이메일은 같다고 판단되어야 한다')
    it('다른 이메일은 다르다고 판단되어야 한다')
  })
  
  describe('getDomain', () => {
    it('이메일에서 도메인을 추출해야 한다')
    it('서브도메인도 올바르게 추출해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️ (최고)  
**이유**: Value Object는 도메인의 기초이며 변경 가능성 낮음

#### UserId VO
```typescript
describe('UserId Value Object', () => {
  describe('생성자', () => {
    it('유효한 ID로 생성되어야 한다')
    it('빈 문자열은 허용하지 않아야 한다')
    it('공백만 있는 문자열은 허용하지 않아야 한다')
  })
  
  describe('equals', () => {
    it('동일한 ID는 같다고 판단되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

### 2. Entities 테스트

#### User Entity
```typescript
describe('User Entity', () => {
  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다')
    it('createdAt과 updatedAt이 같아야 한다')
  })
  
  describe('updateProfile', () => {
    it('이름과 아바타를 업데이트해야 한다')
    it('updatedAt이 갱신되어야 한다')
    it('createdAt은 변경되지 않아야 한다')
  })
  
  describe('updateEmail', () => {
    it('이메일을 업데이트해야 한다')
    it('유효하지 않은 이메일은 거부해야 한다')
    it('updatedAt이 갱신되어야 한다')
  })
  
  describe('deleteAccount', () => {
    it('계정 삭제 시 상태가 변경되어야 한다')
    it('삭제된 계정은 수정할 수 없어야 한다')
    it('UserAccountDeletedEvent가 발행되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

### 3. Aggregates 테스트

#### UserAggregate
```typescript
describe('UserAggregate', () => {
  describe('createFromSupabaseAuth', () => {
    it('유효한 Supabase User로부터 생성되어야 한다')
    it('이메일이 없으면 예외를 발생시켜야 한다')
    it('메타데이터가 없어도 기본값으로 생성되어야 한다')
    it('UserProfileCreatedEvent가 발행되어야 한다')
  })
  
  describe('updateFromSupabaseAuth', () => {
    it('변경된 정보로 업데이트되어야 한다')
    it('UserUpdatedEvent가 발행되어야 한다')
    it('변경사항이 없으면 null을 반환해야 한다')
  })
  
  describe('processOnboarding', () => {
    it('온보딩을 완료해야 한다')
    it('OnboardingCompletedEvent가 발행되어야 한다')
    it('이미 완료된 온보딩은 중복 처리되지 않아야 한다')
  })
  
  describe('deleteUserAccount', () => {
    it('사용자 계정을 삭제해야 한다')
    it('UserAccountDeletedEvent가 발행되어야 한다')
    it('삭제된 계정은 복구할 수 없어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0, Scenario 8

---

## 🔗 Integration Tests 전략

### 1. Repository 통합 테스트

#### UserRepository
```typescript
describe('UserRepository Integration Tests', () => {
  beforeEach(async () => {
    // 테스트 데이터베이스 초기화
    await cleanDatabase();
  })
  
  describe('save', () => {
    it('사용자를 데이터베이스에 저장해야 한다')
    it('중복 이메일은 거부해야 한다')
    it('RLS 정책이 적용되어야 한다')
  })
  
  describe('findById', () => {
    it('ID로 사용자를 찾아야 한다')
    it('존재하지 않는 ID는 null을 반환해야 한다')
    it('다른 사용자의 데이터는 접근할 수 없어야 한다 (RLS)')
  })
  
  describe('findByEmail', () => {
    it('이메일로 사용자를 찾아야 한다')
    it('대소문자 구분 없이 찾아야 한다')
  })
  
  describe('delete', () => {
    it('사용자 계정을 삭제해야 한다')
    it('삭제된 사용자는 조회되지 않아야 한다')
    it('관련 데이터도 함께 정리되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**테스트 환경**: 테스트용 Supabase 인스턴스 또는 로컬 PostgreSQL

---

### 2. Service 통합 테스트

#### UserManagementService
```typescript
describe('UserManagementService Integration Tests', () => {
  describe('createUserProfile', () => {
    it('Supabase User로부터 프로필을 생성해야 한다')
    it('이미 존재하는 사용자는 업데이트만 해야 한다')
    it('프로필 생성 실패 시 적절한 에러를 반환해야 한다')
  })
  
  describe('processOnboarding', () => {
    it('온보딩을 완료해야 한다')
    it('온보딩 상태를 업데이트해야 한다')
    it('이미 완료된 온보딩은 중복 처리되지 않아야 한다')
  })
  
  describe('deleteUserAccount', () => {
    it('사용자 계정을 삭제해야 한다')
    it('관련 프로필 데이터를 정리해야 한다')
    it('Organization Management Domain으로 삭제 이벤트를 발행해야 한다')
  })
  
  describe('getUserProfile', () => {
    it('사용자 프로필을 조회해야 한다')
    it('존재하지 않는 사용자는 null을 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0, Scenario 8 전체 플로우

---

### 3. Server Actions 통합 테스트

#### UserManagement Actions
```typescript
describe('Server Actions Integration Tests', () => {
  describe('createDefaultOrganizationWithWorkspaceAndPageAction', () => {
    it('트랜잭션으로 프로필 → 조직 → 워크스페이스 → 페이지를 생성해야 한다')
    it('생성된 Welcome 페이지 URL을 반환해야 한다')
    it('Organization Service를 주입하여 조직 생성을 요청해야 한다')
    it('Workspace Service를 주입하여 워크스페이스 생성을 요청해야 한다')
    it('Page Service를 주입하여 Welcome 페이지 생성을 요청해야 한다')
    it('프로필 생성 실패 시 전체 롤백되어야 한다')
    it('조직 생성 실패 시 전체 롤백되어야 한다')
    it('워크스페이스 생성 실패 시 조직 생성이 롤백되어야 한다')
    it('페이지 생성 실패 시 워크스페이스 생성이 롤백되어야 한다')
    it('최종 실패 시 Supabase Auth 계정도 롤백되어야 한다')
    it('리다이렉션 URL 형식이 올바른지 검증해야 한다: /r/[orgId]/workspace/[workspaceId]/page/[pageId]')
  })
  
  describe('createUserProfileAction', () => {
    it('인증된 사용자의 프로필을 생성해야 한다')
    it('미인증 사용자는 거부해야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
    it('실패 시 Result.err를 반환해야 한다')
  })
  
  describe('processOnboardingAction', () => {
    it('온보딩을 완료해야 한다')
    it('미인증 사용자는 거부해야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
  })
  
  describe('deleteUserAccountAction', () => {
    it('사용자 계정을 삭제해야 한다')
    it('미인증 사용자는 거부해야 한다')
    it('Organization Management Domain으로 삭제 이벤트를 발행해야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: Server Actions는 클라이언트와의 주요 접점, 특히 트랜잭션 처리가 핵심

---

## 🎭 E2E Tests 전략

### 1. 사용자 등록 및 Welcome 페이지 리다이렉션 플로우 (Scenario 1)

```typescript
test('구글 OAuth를 통한 신규 사용자 등록 및 Welcome 페이지 리다이렉션 전체 플로우', async ({ page }) => {
  // Given: 로그인 페이지 접근
  await page.goto('/login');
  
  // When: 구글 로그인 버튼 클릭
  await page.click('[data-testid="google-login-button"]');
  
  // Then: 구글 OAuth 페이지로 리다이렉트
  await expect(page).toHaveURL(/accounts\.google\.com/);
  
  // When: 구글 로그인 완료 (테스트 계정 사용)
  // ... OAuth 플로우 ...
  
  // Then: 로딩 상태 표시
  await expect(page.locator('[data-testid="loading-message"]')).toContainText(
    '환영합니다! 워크스페이스를 준비하고 있습니다'
  );
  
  // Then: Welcome 페이지로 자동 리다이렉트
  await expect(page).toHaveURL(/\/r\/[a-f0-9-]+\/workspace\/[a-f0-9-]+\/page\/[a-f0-9-]+/);
  
  // Then: Welcome 페이지 내용이 표시됨
  await expect(page.locator('[data-testid="page-title"]')).toContainText('Welcome');
  await expect(page.locator('[data-testid="page-icon"]')).toContainText('👋');
  
  // Then: 기본 조직이 사이드바에 표시됨
  await expect(page.locator('[data-testid="selected-organization"]')).toBeVisible();
  
  // Then: 기본 워크스페이스가 사이드바에 표시됨
  await expect(page.locator('[data-testid="default-workspace"]')).toContainText('Default Workspace');
  
  // Then: Welcome 페이지가 페이지 트리에 표시됨
  await expect(page.locator('[data-testid="page-tree-item"]')).toContainText('Welcome');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 1 전체 (프로필 → 조직 → 워크스페이스 → 페이지 → 리다이렉션)

---

### 2. Organization 관련 플로우 (Organization Management Domain으로 이동)

**참고**: 조직 조회, 선택, 생성, 멤버 초대 등 모든 Organization 관련 E2E 테스트는 Organization Management Domain의 Testing Strategy를 참조하세요.
- **문서 위치**: `../organization-management-domain/04-testing-strategy.md`
- **테스트 파일**: `apps/web/src/__tests__/e2e/organization-*.spec.ts`
- **User Management의 역할**: User 등록 시 기본 조직 생성 요청만 발행

### 3. 사용자 계정 삭제 플로우 (Scenario 8)

```typescript
test('사용자 계정 삭제 전체 플로우', async ({ page }) => {
  // Given: 이미 등록된 사용자로 로그인
  await loginAsTestUser(page);
  
  // When: 계정 설정 페이지 접근
  await page.goto('/settings/account');
  
  // When: 계정 삭제 버튼 클릭
  await page.click('[data-testid="delete-account-button"]');
  
  // Then: 삭제 확인 다이얼로그 표시
  await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
  
  // When: 삭제 확인
  await page.fill('[data-testid="delete-confirmation-input"]', 'DELETE');
  await page.click('[data-testid="confirm-delete-button"]');
  
  // Then: 삭제 완료 메시지 표시
  await expect(page.locator('[data-testid="deletion-success"]')).toBeVisible();
  
  // Then: 로그인 페이지로 리다이렉트
  await expect(page).toHaveURL('/login');
  
  // Then: 삭제된 계정으로 로그인 시도 시 실패
  await page.goto('/login');
  await page.click('[data-testid="google-login-button"]');
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 8 전체

### 4. 에러 시나리오

```typescript
test('프로필 생성 실패 시 에러 메시지 표시', async ({ page }) => {
  // Given: 이메일 없는 OAuth 응답 (Mock)
  await mockInvalidOAuthResponse(page);
  
  // When: 로그인 시도
  await page.goto('/login');
  await page.click('[data-testid="google-login-button"]');
  
  // Then: 에러 메시지 표시
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-message"]')).toContainText(
    '로그인에 실패했습니다'
  );
})

test('계정 삭제 실패 시 에러 메시지 표시', async ({ page }) => {
  // Given: 이미 등록된 사용자로 로그인
  await loginAsTestUser(page);
  
  // When: 계정 삭제 시도 (소유 조직이 있는 경우)
  await page.goto('/settings/account');
  await page.click('[data-testid="delete-account-button"]');
  
  // Then: 삭제 불가 메시지 표시
  await expect(page.locator('[data-testid="deletion-blocked"]')).toBeVisible();
  await expect(page.locator('[data-testid="deletion-blocked"]')).toContainText(
    '소유한 조직이 있어서 계정을 삭제할 수 없습니다'
  );
})
```

**테스트 우선순위**: ⭐️⭐️⭐️

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

### Scenario 0: 유저 가입 및 온보딩

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| Command: 유저 가입 처리하기 | Unit | UserAggregate.createFromSupabaseAuth() |
| System: Profile System | Unit | UserAggregate 프로필 생성 로직 |
| Event: 유저 프로필이 생성됨 | Unit | UserProfileCreatedEvent 발행 검증 |
| Command: 온보딩 진행하기 | Unit | UserAggregate.processOnboarding() |
| Event: 온보딩이 완료됨 | Unit | OnboardingCompletedEvent 발행 검증 |
| 전체 플로우 | Integration | processUserRegistrationAction() |
| 사용자 경험 | E2E | 구글 로그인 → 프로필 생성 → 온보딩 완료 |

### Organization 관련 테스트 (Organization Management Domain으로 이동)

**참고**: 조직 조회, 선택, 생성, 멤버 관리 등 모든 Organization 관련 테스트는 Organization Management Domain의 Testing Strategy를 참조하세요.
- **문서 위치**: `../organization-management-domain/04-testing-strategy.md`
- **책임**: Organization Management Domain에서 완전히 관리
- **User Management Domain의 역할**: `processUserRegistrationAction`에서 기본 조직 생성 요청만 발행

### Scenario 8: 사용자 계정 삭제

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| Command: 사용자 계정 삭제 요청 | Unit | UserAggregate.deleteUserAccount() |
| System: User Deletion Cleanup Manager | Unit | 계정 삭제 비즈니스 로직 |
| Event: 사용자 계정이 삭제됨 | Unit | UserAccountDeletedEvent 발행 검증 |
| 전체 플로우 | Integration | deleteUserAccountAction() |
| 사용자 경험 | E2E | 계정 삭제 → 확인 → 로그아웃 |

---

## 🔄 TDD 사이클 적용

### Value Object 구현 예시

```typescript
// 1. RED: 테스트 먼저 작성
describe('UserEmail', () => {
  it('유효한 이메일로 생성되어야 한다', () => {
    const email = new UserEmail('test@example.com');
    expect(email.value).toBe('test@example.com');
  })
})

// 실행: FAIL (UserEmail 클래스 없음)

// 2. GREEN: 최소 구현
export class UserEmail {
  constructor(public readonly value: string) {}
}

// 실행: PASS

// 3. REFACTOR: 검증 로직 추가
export class UserEmail {
  constructor(public readonly value: string) {
    if (!this.isValidEmail(value)) {
      throw new UserManagementError('Invalid email format');
    }
  }
  
  private isValidEmail(email: string): boolean {
    // 정규식 검증
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

이 Testing Strategy를 따라 높은 품질의 User Management Domain을 구현할 수 있습니다! 🎉