# Testing Strategy: Share Management Domain

## 🎯 개요

**도메인**: Share Management  
**작성자**: 시니어개발자 + QA  
**작성일**: 2026-01-02  
**버전**: v1.0

**Technical Specification 참조**: `04-technical-specification.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: `06-tdd-implementation.md`

---

> **가이드 참조**: `docs/event-domain-design/guide/05-testing-strategy-guide.md`  
> **작성 시점**: Technical Specification 완료 후, 실제 구현 시작 전  
> **목적**: 구현 전에 "무엇을 어떻게 테스트할지" 명확히 정의

---

## 📊 Testing Strategy Overview

### 도메인 테스트 전략 요약
- PublishedPage/CopyWorkflow Aggregate 중심으로 도메인 규칙을 Unit으로 검증
- 외부 도메인 통합(Workspace/Auth)은 Integration 테스트로 보장
- E2E는 게시/접속/복제 핵심 경로 위주로 최소 구성

### Technical Specification 연결점
- **입력**: `04-technical-specification.md` - VO/Entity/Aggregate/ACL/Service 수도코드
- **출력**: Unit/Integration/E2E 테스트 케이스

### 커버리지 목표 요약
```
전체 코드 커버리지: 80% 이상
- Unit Tests:        65% (20-25개)
- Integration Tests: 25% (6-8개)
- E2E Tests:         10% (2-3개)
```

---

## 🗺️ Process Model → Test 매핑

### Scenario 1: 페이지 소유자가 페이지 게시

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 페이지 게시 요청 | Unit | PublishedPageAggregate.publish() | ⭐️⭐️⭐️⭐️⭐️ |
| System: 게시 링크 생성 | Unit | PublishToken/PublishLinkPath 검증 | ⭐️⭐️⭐️⭐️ |
| Event: Page Published | Unit | 이벤트 발행 검증 | ⭐️⭐️⭐️ |
| 전체 플로우 | Integration | publishPageAction() | ⭐️⭐️⭐️⭐️⭐️ |
| 사용자 경험 | E2E | 게시 후 링크 발급 | ⭐️⭐️⭐️⭐️ |

### Scenario 2: 비회원이 게시 링크 접속 및 복제 시도

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Event: Publish Link Accessed | Unit | recordAccess 이벤트 기록 | ⭐️⭐️⭐️ |
| Command: 페이지 복제 시도 | Unit | CopyWorkflowAggregate.attemptCopy() | ⭐️⭐️⭐️⭐️ |
| System: Auth 연동 | Integration | 비회원 로그인 필요 응답 | ⭐️⭐️⭐️⭐️ |
| 사용자 경험 | E2E | 비회원 복제 → 로그인 유도 | ⭐️⭐️⭐️⭐️ |

### Scenario 3: 회원이 게시 링크 접속 및 페이지 복제

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: 워크스페이스 선택 | Unit | CopyWorkflow.selectWorkspace() | ⭐️⭐️⭐️⭐️ |
| System: Workspace 연동 | Integration | 워크스페이스 목록 조회 | ⭐️⭐️⭐️⭐️ |
| Event: Page Copied | Integration | 복제 완료 이벤트 검증 | ⭐️⭐️⭐️ |
| 사용자 경험 | E2E | 회원 복제 완료 후 이동 | ⭐️⭐️⭐️⭐️ |

---

## 🧪 Unit Tests 전략

### 1. Value Objects 테스트

#### PublishToken VO
```typescript
describe('PublishToken Value Object', () => {
  describe('생성자', () => {
    it('UUID Base64 인코딩 값만 허용해야 한다')
    it('빈 값 또는 길이 초과 토큰은 거부해야 한다')
  })
})
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### PublishLinkPath VO
```typescript
describe('PublishLinkPath Value Object', () => {
  describe('생성자', () => {
    it('`/p/[token]` 형식만 허용해야 한다')
  })
})
```

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 2. Entities 테스트

#### PublishedPage Entity
```typescript
describe('PublishedPage Entity', () => {
  describe('canPublishBy', () => {
    it('소유자만 게시 가능해야 한다')
  })
})
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️

#### CopyWorkflow Entity
```typescript
describe('CopyWorkflow Entity', () => {
  describe('selectWorkspace', () => {
    it('selecting_workspace 상태에서만 허용해야 한다')
  })
})
```

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 3. Aggregates 테스트

#### PublishedPageAggregate
```typescript
describe('PublishedPageAggregate', () => {
  describe('publish', () => {
    it('소유자 검증에 실패하면 예외를 발생시켜야 한다')
    it('정상 게시 시 PagePublished 이벤트를 발행해야 한다')
    it('PublishLinkGenerated 이벤트를 발행해야 한다')
  })

  describe('recordAccess', () => {
    it('PublishLinkAccessed 이벤트를 기록해야 한다')
  })
})
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 1

#### CopyWorkflowAggregate
```typescript
describe('CopyWorkflowAggregate', () => {
  describe('attemptCopy', () => {
    it('회원 여부 확인 이벤트를 발행해야 한다')
  })

  describe('markFailed', () => {
    it('failed 상태로 전이되어야 한다')
    it('PageCopyFailed 이벤트를 발행해야 한다')
  })
})
```

**우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 2~3

---

## 🔗 Integration Tests 전략

### 1. Repository 통합 테스트

#### PublishedPageRepository
```typescript
describe('PublishedPageRepository Integration Tests', () => {
  describe('save', () => {
    it('게시 정보와 토큰 매핑이 저장되어야 한다')
    it('토큰 중복은 거부되어야 한다')
  })

  describe('findByToken', () => {
    it('토큰으로 게시 페이지를 조회해야 한다')
  })
})
```

#### CopyWorkflowRepository
```typescript
describe('CopyWorkflowRepository Integration Tests', () => {
  describe('save', () => {
    it('워크플로우 상태가 저장되어야 한다')
  })
})
```

---

### 2. External System 연동 테스트

- **Auth Domain ACL**: 비회원 로그인 필요 응답 반환
- **Workspace Management ACL**: 워크스페이스 목록 조회/복제 요청 성공/실패 처리

**우선순위**: ⭐️⭐️⭐️⭐️

---

### 3. Server Actions 통합 테스트

```typescript
describe('share.actions Integration Tests', () => {
  describe('publishPageAction', () => {
    it('소유자만 게시할 수 있어야 한다')
    it('/p/[token]을 반환해야 한다')
  })

  describe('copyPublishedPageAction', () => {
    it('비회원은 로그인 필요 응답을 받아야 한다')
    it('회원은 복제 결과를 반환해야 한다')
  })
})
```

---

## ✅ E2E 테스트 전략

### 1. 게시 링크 발급
- 페이지 게시 → 링크 생성 확인

### 2. 비회원 복제 시도
- 게시 링크 접속 → 복제 클릭 → 로그인 유도 확인

### 3. 회원 복제 완료
- 게시 링크 접속 → 워크스페이스 선택 → 복제 완료 후 이동

---

## 🔍 테스트 데이터 및 환경

- 게시 링크 토큰: UUID Base64 인코딩 샘플
- 테스트 워크스페이스: 권한 있음/없음 각 1개
- 비회원/회원 세션 분리 테스트

---

## 📌 리스크 및 우선순위

1. 비회원 로그인 후 복제 플로우 재개
2. 게시 링크 토큰 유효성 검증
3. 대용량 페이지 복제 성능 (향후)
