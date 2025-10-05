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
│ - 사용자 시나리오: 구글 로그인 → 프로필 생성 → 조직 선택    │
│ - 목표: 1-2개 핵심 시나리오                                 │
├─────────────────────────────────────────────────────────────┤
│ Integration Tests (20%)                                     │
│ - Service + Repository + Database                           │
│ - Server Actions 전체 플로우                                │
│ - 목표: 5-8개 통합 시나리오                                 │
├─────────────────────────────────────────────────────────────┤
│ Unit Tests (70%)                                            │
│ - Value Objects, Entities, Aggregates                       │
│ - 비즈니스 로직 격리 테스트                                 │
│ - 목표: 20-30개 단위 테스트                                 │
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

#### UserId, OrganizationId VO
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

describe('OrganizationId Value Object', () => {
  describe('생성', () => {
    it('UUID 기반으로 생성되어야 한다')
    it('생성된 ID는 유효한 형식이어야 한다')
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
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### Organization Entity
```typescript
describe('Organization Entity', () => {
  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다')
    it('isDefault 플래그가 올바르게 설정되어야 한다')
  })
  
  describe('updateName', () => {
    it('조직 이름을 업데이트해야 한다')
    it('빈 이름은 허용하지 않아야 한다')
    it('updatedAt이 갱신되어야 한다')
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
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 - Sequence 2

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
  
  describe('updateName', () => {
    it('조직 이름이 변경되어야 한다')
    it('OrganizationUpdatedEvent가 발행되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 - Sequence 2, Scenario 2 - Sequence 1

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
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**테스트 환경**: 테스트용 Supabase 인스턴스 또는 로컬 PostgreSQL

#### OrganizationRepository
```typescript
describe('OrganizationRepository Integration Tests', () => {
  describe('save', () => {
    it('조직을 데이터베이스에 저장해야 한다')
    it('중복 ID는 거부해야 한다')
  })
  
  describe('findByOwnerId', () => {
    it('소유자의 모든 조직을 조회해야 한다')
    it('생성일 순으로 정렬되어야 한다')
    it('다른 소유자의 조직은 조회되지 않아야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

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
  
  describe('createDefaultOrganization', () => {
    it('사용자를 위한 기본 조직을 생성해야 한다')
    it('이미 기본 조직이 있으면 예외를 발생시켜야 한다')
  })
  
  describe('createNewOrganization', () => {
    it('새로운 조직을 생성해야 한다')
    it('조직 타입이 올바르게 설정되어야 한다')
    it('생성자를 소유자로 설정해야 한다')
    it('조직 생성 후 컨텍스트를 전환해야 한다')
  })
  
  describe('getUserOrganizations', () => {
    it('사용자 소유 조직 목록을 조회해야 한다')
    it('빈 목록도 올바르게 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0, Scenario 1, Scenario 2 전체 플로우

---

### 3. Server Actions 통합 테스트

#### UserManagement Actions
```typescript
describe('Server Actions Integration Tests', () => {
  describe('createUserProfileAction', () => {
    it('인증된 사용자의 프로필을 생성해야 한다')
    it('미인증 사용자는 거부해야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
    it('실패 시 Result.err를 반환해야 한다')
  })
  
  describe('processUserRegistrationAction', () => {
    it('트랜잭션으로 프로필과 조직을 생성해야 한다')
    it('프로필 생성 실패 시 롤백되어야 한다')
    it('조직 생성 실패 시 롤백되어야 한다')
  })
  
  describe('getUserOrganizationsAction', () => {
    it('사용자 소유 조직 목록을 조회해야 한다')
    it('미인증 사용자는 거부해야 한다')
  })
  
  describe('createNewOrganizationAction', () => {
    it('인증된 사용자의 새로운 조직을 생성해야 한다')
    it('미인증 사용자는 거부해야 한다')
    it('조직 이름과 타입이 올바르게 설정되어야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
    it('실패 시 Result.err를 반환해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: Server Actions는 클라이언트와의 주요 접점

---

## 🎭 E2E Tests 전략

### 1. 사용자 등록 플로우 (Scenario 0)

```typescript
test('구글 OAuth를 통한 신규 사용자 등록 전체 플로우', async ({ page }) => {
  // Given: 로그인 페이지 접근
  await page.goto('/login');
  
  // When: 구글 로그인 버튼 클릭
  await page.click('[data-testid="google-login-button"]');
  
  // Then: 구글 OAuth 페이지로 리다이렉트
  await expect(page).toHaveURL(/accounts\.google\.com/);
  
  // When: 구글 로그인 완료 (테스트 계정 사용)
  // ... OAuth 플로우 ...
  
  // Then: 온보딩 페이지로 리다이렉트
  await expect(page).toHaveURL('/onboarding');
  
  // Then: 사용자 정보가 표시됨
  await expect(page.locator('[data-testid="user-email"]')).toBeVisible();
  await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
  
  // When: 온보딩 완료
  await page.click('[data-testid="complete-onboarding-button"]');
  
  // Then: 대시보드로 이동
  await expect(page).toHaveURL('/dashboard');
  
  // Then: 기본 조직이 선택되어 있음
  await expect(page.locator('[data-testid="selected-organization"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 전체

---

### 2. 조직 선택 플로우 (Scenario 1)

```typescript
test('로그인 후 조직 선택 플로우', async ({ page }) => {
  // Given: 이미 등록된 사용자로 로그인
  await loginAsTestUser(page);
  
  // When: 대시보드 접근
  await page.goto('/dashboard');
  
  // Then: 조직 목록이 로드됨
  await expect(page.locator('[data-testid="organization-list"]')).toBeVisible();
  
  // Then: 기본 조직이 자동 선택됨
  const selectedOrg = page.locator('[data-testid="selected-organization"]');
  await expect(selectedOrg).toContainText('기본 조직');
  
  // When: 다른 조직 선택
  await page.click('[data-testid="organization-item-2"]');
  
  // Then: 선택된 조직이 변경됨
  await expect(selectedOrg).not.toContainText('기본 조직');
  
  // Then: 페이지가 새로운 조직 컨텍스트로 업데이트됨
  await expect(page).toHaveURL(/orgId=[^&]+/);
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 1 전체

### 3. 새로운 조직 생성 플로우 (Scenario 2)

```typescript
test('새로운 조직 생성 전체 플로우', async ({ page }) => {
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
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 2 전체

---

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
| System: Organization System | Unit | OrganizationAggregate.createDefault() |
| Event: 기본 조직이 생성됨 | Unit | DefaultOrganizationCreatedEvent 발행 검증 |
| 전체 플로우 | Integration | processUserRegistrationAction() |
| 사용자 경험 | E2E | 구글 로그인 → 프로필 생성 → 조직 선택 |

### Scenario 1: 조직 조회 및 선택

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| Command: 유저 관련 조직을 조회하기 | Integration | getUserOrganizationsAction() |
| System: Organization System | Unit | OrganizationRepository.findByOwnerId() |
| Event: 유저 관련 조직이 조회됨 | Integration | 조직 목록 조회 검증 |
| Command: 초기 조직을 선택하기 | E2E | 프론트엔드 Context 초기화 |
| Event: 초기 조직이 선택됨 | E2E | 선택된 조직 UI 표시 검증 |

### Scenario 2: 새로운 조직 생성

| Process Model 요소 | 테스트 종류 | 테스트 케이스 |
|-------------------|------------|-------------|
| Command: 새로운 조직 생성하기 | Unit | OrganizationAggregate.createNew() |
| System: Organization System | Unit | 조직 생성 비즈니스 로직 |
| Event: 새로운 조직이 생성됨 | Unit | NewOrganizationCreatedEvent 발행 검증 |
| 전체 플로우 | Integration | createNewOrganizationAction() |
| 사용자 경험 | E2E | 조직 생성 폼 → 생성 완료 → 컨텍스트 전환 |

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

---

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

