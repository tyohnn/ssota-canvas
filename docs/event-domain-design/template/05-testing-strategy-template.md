# Testing Strategy: [Domain Name] Domain

## 🎯 개요

**도메인**: [Domain Name]  
**작성자**: 시니어개발자 + QA  
**작성일**: YYYY-MM-DD  
**버전**: v1.0

**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: `05-technical-specification.md`

---

> **가이드 참조**: `docs/event-domain-design/guide/04-testing-strategy-guide.md`  
> **작성 시점**: Software Design 완료 후, Technical Specification 작성 전  
> **목적**: 구현하기 전에 "무엇을 어떻게 테스트할지" 명확히 정의

---

## 📊 Testing Strategy Overview

### 도메인 테스트 전략 요약

[이 도메인의 테스트 전략을 간략히 설명]

### Process Model 연결점

- **입력**: `02-process-model.md` - [주요 시나리오 N개]
- **입력**: `03-software-design.md` - [주요 Aggregate M개]
- **출력**: Unit/Integration/E2E 테스트 케이스

### 커버리지 목표 요약

```
전체 코드 커버리지: [85]% 이상
- Unit Tests:       70%  ([20-30]개)
- Integration Tests: 20%  ([5-8]개)
- E2E Tests:        10%  ([1-2]개)
```

---

## 🗺️ Process Model → Test 매핑

> **가이드 참조**: Phase 2.2 - Process Model → Test 매핑

### Scenario 0: [시나리오 이름]

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: [명령명] | Unit | [Aggregate].[메서드명]() | ⭐️⭐️⭐️⭐️⭐️ |
| System: [시스템명] | Unit | [Aggregate] [로직 설명] | ⭐️⭐️⭐️⭐️ |
| Event: [이벤트명] | Unit | [Event] 발행 검증 | ⭐️⭐️⭐️ |
| 전체 플로우 | Integration | [Service/Action].[메서드명]() | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 | E2E | [시나리오 설명] | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 1: [시나리오 이름]

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: [명령명] | Unit | [Aggregate].[메서드명]() | ⭐️⭐️⭐️⭐️⭐️ |
| System: [시스템명] | Integration | [Repository].[메서드명]() | ⭐️⭐️⭐️⭐️ |
| Event: [이벤트명] | Integration | [검증 방법] | ⭐️⭐️⭐️ |

---

## 🧪 Unit Tests 전략

> **가이드 참조**: Phase 3.2 - Unit Tests 전략 작성

### 1. Value Objects 테스트

#### [ValueObject1] VO
```typescript
describe('[ValueObject1] Value Object', () => {
  describe('생성자', () => {
    it('유효한 [값]로 생성되어야 한다')
    it('잘못된 [값] 형식에 대해 예외를 발생시켜야 한다')
    it('빈 문자열은 허용하지 않아야 한다')
    it('[경계값 조건]')
  })
  
  describe('[메서드명]', () => {
    it('[기대 동작]')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: [우선순위를 높게 설정한 이유]

#### [ValueObject2] VO
```typescript
describe('[ValueObject2] Value Object', () => {
  describe('생성자', () => {
    it('[검증 케이스 1]')
    it('[검증 케이스 2]')
  })
  
  describe('[메서드명]', () => {
    it('[기대 동작]')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  

---

### 2. Entities 테스트

#### [Entity1] Entity
```typescript
describe('[Entity1] Entity', () => {
  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다')
    it('[특수 조건]에서 생성되어야 한다')
  })
  
  describe('[메서드명]', () => {
    it('[비즈니스 규칙]이 적용되어야 한다')
    it('[부작용]이 발생해야 한다')
    it('[불변 속성]은 변경되지 않아야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### [Entity2] Entity
```typescript
describe('[Entity2] Entity', () => {
  describe('생성', () => {
    it('[생성 케이스 1]')
  })
  
  describe('[메서드명]', () => {
    it('[동작 검증]')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

---

### 3. Aggregates 테스트

#### [Aggregate1]
```typescript
describe('[Aggregate1]', () => {
  describe('[팩토리메서드]', () => {
    it('[정상 케이스]로부터 생성되어야 한다')
    it('[예외 케이스]에 대해 예외를 발생시켜야 한다')
    it('[Event]가 발행되어야 한다')
  })
  
  describe('[Command처리메서드]', () => {
    it('[비즈니스 로직]이 수행되어야 한다')
    it('[Event]가 발행되어야 한다')
    it('[불변식]이 유지되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario [N] - Sequence [M]

#### [Aggregate2]
```typescript
describe('[Aggregate2]', () => {
  describe('[메서드명]', () => {
    it('[테스트 케이스 1]')
    it('[테스트 케이스 2]')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario [N] - Sequence [M]

---

## 🔗 Integration Tests 전략

> **가이드 참조**: Phase 3.3 - Integration Tests 전략 작성

### 1. Repository 통합 테스트

#### [Repository1]
```typescript
describe('[Repository1] Integration Tests', () => {
  beforeEach(async () => {
    // 테스트 데이터베이스 초기화
    await cleanDatabase();
  })
  
  describe('save', () => {
    it('[Entity]를 데이터베이스에 저장해야 한다')
    it('중복 [제약조건]은 거부해야 한다')
    it('RLS 정책이 적용되어야 한다')
  })
  
  describe('findById', () => {
    it('ID로 [Entity]를 찾아야 한다')
    it('존재하지 않는 ID는 null을 반환해야 한다')
    it('[권한 검증] (RLS)')
  })
  
  describe('[복잡한쿼리]', () => {
    it('[쿼리 결과 검증]')
    it('[정렬 조건 검증]')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**테스트 환경**: 테스트용 Supabase 인스턴스 또는 로컬 PostgreSQL

#### [Repository2]
```typescript
describe('[Repository2] Integration Tests', () => {
  describe('[메서드명]', () => {
    it('[테스트 케이스]')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

---

### 2. Service 통합 테스트

#### [Service1]
```typescript
describe('[Service1] Integration Tests', () => {
  describe('[메서드명]', () => {
    it('[정상 플로우]를 완료해야 한다')
    it('[예외 상황]에서 적절히 처리해야 한다')
    it('[트랜잭션]이 올바르게 동작해야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario [N] & Scenario [M] 전체 플로우

---

### 3. Server Actions 통합 테스트

#### [Domain] Actions
```typescript
describe('Server Actions Integration Tests', () => {
  describe('[actionName1]', () => {
    it('인증된 사용자의 [작업]을 수행해야 한다')
    it('미인증 사용자는 거부해야 한다')
    it('성공 시 Result.ok를 반환해야 한다')
    it('실패 시 Result.err를 반환해야 한다')
  })
  
  describe('[actionName2]', () => {
    it('[트랜잭션 플로우]를 수행해야 한다')
    it('[실패 시 롤백]되어야 한다')
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: Server Actions는 클라이언트와의 주요 접점

---

## 🎭 E2E Tests 전략

> **가이드 참조**: Phase 3.4 - E2E Tests 전략 작성

### 1. [주요 시나리오 1] (Scenario [N])

```typescript
test('[시나리오 설명]', async ({ page }) => {
  // Given: [초기 상태]
  await page.goto('[URL]');
  
  // When: [사용자 액션 1]
  await page.click('[data-testid="[id]"]');
  
  // Then: [검증 1]
  await expect(page).toHaveURL('[expected-url]');
  
  // When: [사용자 액션 2]
  await page.fill('[name="[field]"]', '[value]');
  await page.click('[data-testid="[button]"]');
  
  // Then: [검증 2]
  await expect(page.locator('[data-testid="[result]"]')).toBeVisible();
  
  // Then: [최종 검증]
  await expect(page.locator('[data-testid="[final-state]"]')).toContainText('[expected-text]');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario [N] 전체

---

### 2. [주요 시나리오 2] (Scenario [M])

```typescript
test('[시나리오 설명]', async ({ page }) => {
  // Given: [초기 상태]
  await [초기화];
  
  // When: [사용자 액션]
  await [액션];
  
  // Then: [검증]
  await expect([검증대상]).toBe([기대값]);
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario [M] 전체

---

### 3. 에러 시나리오

```typescript
test('[에러 시나리오 설명]', async ({ page }) => {
  // Given: [에러 유발 조건]
  await [조건 설정];
  
  // When: [사용자 액션]
  await [액션];
  
  // Then: [에러 메시지 표시]
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-message"]')).toContainText(
    '[에러 메시지]'
  );
})
```

**테스트 우선순위**: ⭐️⭐️⭐️

---

## 📈 커버리지 목표 및 TDD 사이클

> **가이드 참조**: Phase 3.5 - 커버리지 목표 및 TDD 사이클 작성

### 레이어별 커버리지 목표

| 레이어 | 목표 커버리지 | 우선순위 |
|--------|--------------|---------|
| Value Objects | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Entities | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Aggregates | 90% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Services | 85% 이상 | ⭐️⭐️⭐️⭐️ |
| Repositories | 80% 이상 | ⭐️⭐️⭐️⭐️ |
| Server Actions | 85% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| UI Components | 70% 이상 | ⭐️⭐️⭐️ |

### 전체 커버리지 목표

```
전체 코드 커버리지: 85% 이상
- Branches: 80% 이상
- Functions: 85% 이상
- Lines: 85% 이상
- Statements: 85% 이상
```

### TDD 구현 순서

```markdown
### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. [ValueObject1] VO → RED-GREEN-REFACTOR
2. [ValueObject2] VO
3. [ValueObject3] VO

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. [Entity1] Entity
2. [Entity2] Entity

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. [Aggregate1]
2. [Aggregate2]

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. [Repository1] (통합 테스트)
2. [Repository2] (통합 테스트)

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. [Service1] (통합 테스트)

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. [action1]Action (통합 테스트)
2. [action2]Action (통합 테스트)

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. [주요 시나리오 1]
2. [주요 시나리오 2]
```

### TDD 사이클 예시

**[대표 Value Object] 구현 예시**:

```typescript
// 1. RED: 테스트 먼저 작성
describe('[ValueObject]', () => {
  it('유효한 [값]로 생성되어야 한다', () => {
    const vo = new [ValueObject]('[valid-value]');
    expect(vo.value).toBe('[valid-value]');
  })
})

// 실행: FAIL ([ValueObject] 클래스 없음)

// 2. GREEN: 최소 구현
export class [ValueObject] {
  constructor(public readonly value: string) {}
}

// 실행: PASS

// 3. REFACTOR: 검증 로직 추가
export class [ValueObject] {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new [DomainError]('[error-message]');
    }
  }
  
  private isValid(value: string): boolean {
    // 검증 로직
    return [검증 조건];
  }
}

// 실행: PASS (기존 테스트 통과 + 새 테스트 추가)
```

---

## ⚙️ 테스트 도구 및 설정

> **가이드 참조**: Phase 3.6 - 테스트 도구 및 설정 정리

### Unit & Integration Tests
- **프레임워크**: Vitest
- **Assertion**: expect (Vitest 내장)
- **Mock**: vi (Vitest 내장)
- **커버리지**: v8
- **설정 파일**: `vitest.config.ts`

### E2E Tests
- **프레임워크**: Playwright
- **브라우저**: Chromium, Firefox, WebKit
- **스크린샷**: 실패 시 자동 캡처
- **비디오**: 실패 시 자동 녹화
- **설정 파일**: `playwright.config.ts`

### 테스트 데이터베이스
- **로컬**: PostgreSQL (Docker)
- **CI/CD**: Supabase 테스트 인스턴스
- **정리 전략**: 각 테스트 후 데이터 완전 삭제 (`cleanDatabase()`)

---

## ✅ 검증 체크리스트

> **가이드 참조**: Phase 3.7 - 품질 검증 체크리스트

### 일관성 검증
- [ ] Process Model의 모든 시나리오가 테스트 케이스로 매핑되었는가?
- [ ] Software Design의 모든 Aggregate가 테스트 계획에 포함되었는가?
- [ ] 핵심 불변식이 테스트로 검증 가능한가?

### 완전성 검증
- [ ] 모든 Happy Path가 커버되는가?
- [ ] 주요 에러 시나리오가 테스트되는가?
- [ ] 경계값 테스트가 포함되어 있는가?
- [ ] 커버리지 목표를 달성할 수 있는가?

### 실용성 검증
- [ ] 테스트는 독립적으로 실행 가능한가?
- [ ] 테스트는 빠르게 실행되는가? (Unit < 100ms, Integration < 1s)
- [ ] 테스트는 반복 실행해도 동일한 결과를 내는가?
- [ ] 테스트 실패 시 원인을 명확히 알 수 있는가?

---

## 🚀 다음 단계

이 Testing Strategy 문서를 기반으로 다음 문서를 작성하세요:

### Technical Specification (05단계)
- **가이드**: `guide/05-technical-specification-guide.md`
- **산출물**: `05-technical-specification.md`
- **내용**:
  - 각 컴포넌트별 구현 수도코드
  - **테스트 수도코드 (Given-When-Then)** ⭐️
  - TDD 구현 순서 정의

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 코드 + 테스트 코드
- **내용**:
  - RED-GREEN-REFACTOR 사이클 적용
  - 커버리지 목표 달성
  - 코드 리뷰

---

**문서 작성 완료 후**:
- [ ] 시니어개발자 리뷰 완료
- [ ] QA 리뷰 완료 (있는 경우)
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(Technical Specification) 준비

---

이 Testing Strategy를 따라 높은 품질의 [Domain Name]을 구현할 수 있습니다! 🎉