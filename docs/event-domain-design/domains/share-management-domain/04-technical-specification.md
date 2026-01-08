# Technical Specification: Share Management Domain

## 🎯 개요

**도메인**: Share Management  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: 2026-01-02  
**버전**: v1.0

**Software Design 참조**: `03-software-design.md`  
**User Flow 참조**: `03-user-flow.md`  
**다음 단계**: `05-testing-strategy.md`

---

> **가이드 참조**: `docs/event-domain-design/guide/04-technical-specification-guide.md`  
> **작성 시점**: Software Design 완료 후, 구현 시작 전  
> **목적**: 구현 수도코드 작성, TDD 구현 순서 명시

---

## 📊 Implementation Overview

### 도메인 구현 개요
- PublishedPage/CopyWorkflow Aggregate 중심 구현
- 게시 링크는 `/p/[token]` 형식, 토큰은 UUID Base64 인코딩
- 비회원 복제 시 로그인 후 복제 다이얼로그 재오픈 흐름 유지

### Software Design 연결점
- **입력**: `03-software-design.md` - PublishedPage Aggregate, CopyWorkflow Aggregate
- **출력**: 구현 수도코드 + 기본 테스트 수도코드

### TDD 구현 순서 요약
상위 Phase는 하위 Phase에만 의존하도록 설계된다.
⭐️ 개수는 해당 Phase의 도메인 중요도를 의미한다.

```
Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️) - 2개
Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️) - 2개
Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️) - 2개
Phase 4: Repository (⭐️⭐️⭐️⭐️) - 2개
Phase 5: Service (⭐️⭐️⭐️⭐️) - 2개
Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️) - 4개
Phase 7: E2E Tests (⭐️⭐️⭐️⭐️) - 3개
```

---

## 🧩 DDD Components

### 1. Value Objects 수도코드

#### PublishToken VO
- **파일 위치**: `src/domains/share/shared/value-objects/publish-token.vo.ts`
- **역할**: 게시 링크 토큰 유효성 검증 및 규격 보장
- **비즈니스 규칙**:
  - UUID를 Base64로 인코딩한 값만 허용
  - 빈 값/허용 길이 초과 거부

**구현 수도코드**:
```typescript
class PublishToken {
  private value: string;

  constructor(token: string) {
    // 1. 빈 값 검증
    // 2. Base64 패턴 검증
    // 3. 길이 제한 검증
    // 4. this.value 할당
  }

  toString(): string {
    // value 반환
  }
}
```

**기본 테스트 수도코드**:
```typescript
// Given 유효한 Base64 UUID
// When PublishToken 생성
// Then 생성 성공

// Given 빈 문자열
// When PublishToken 생성
// Then 예외 발생
```

---

#### PublishLinkPath VO
- **파일 위치**: `src/domains/share/shared/value-objects/publish-link-path.vo.ts`
- **역할**: 게시 링크 경로 규격 보장
- **비즈니스 규칙**: `/p/[token]` 형식만 허용

**구현 수도코드**:
```typescript
class PublishLinkPath {
  private value: string;

  constructor(path: string) {
    // 1. `/p/` 접두사 검증
    // 2. token 존재 여부 검증
    // 3. this.value 할당
  }
}
```

---

### 2. Entities 수도코드

#### PublishedPage Entity
- **파일 위치**: `src/domains/share/shared/entities/published-page.entity.ts`
- **역할**: 게시된 페이지의 상태 및 링크 정보 관리
- **주요 메서드**:
  - publish(ownerId): 게시 상태 설정 및 토큰 생성 (내부 상태 전이 헬퍼)
  - canPublishBy(userId): 게시 권한 검증 (단일 객체 기준 규칙)

**구현 수도코드**:
```typescript
class PublishedPage {
  constructor(
    public readonly pageId: PageId,
    public readonly ownerId: UserId,
    public status: 'published',
    public publishToken: PublishToken,
    public publishedAt: Date
  ) {}

  canPublishBy(userId: UserId): boolean {
    // 소유자 여부 확인
  }
}
```

**책임 분리**:
- Entity의 publish는 내부 상태 전이를 위한 헬퍼이며,
- 권한/중복 검증은 Aggregate에서만 수행한다

---

#### CopyWorkflow Entity
- **파일 위치**: `src/domains/share/shared/entities/copy-workflow.entity.ts`
- **역할**: 복제 플로우 상태 전이 관리
- **주요 메서드**:
  - markWaitingLogin()
  - selectWorkspace(workspaceId)
  - markCopying()
  - markCompleted()
  - markFailed(reason)

**구현 수도코드**:
```typescript
class CopyWorkflow {
  constructor(
    public readonly id: CopyWorkflowId,
    public publishToken: PublishToken,
    public status: WorkflowStatus,
    public targetWorkspaceId?: WorkspaceId
  ) {}

  selectWorkspace(workspaceId: WorkspaceId) {
    // selecting_workspace 상태에서만 허용
  }
}
```

**저장 규칙**:
- CopyWorkflow는 생성 즉시 저장되며, 상태 전이마다 갱신 저장된다
- 상태 전이와 이벤트 발행은 동일 트랜잭션 내에서 처리한다

---

### 3. Aggregates 수도코드

#### PublishedPageAggregate
- **파일 위치**: `src/domains/share/shared/aggregates/published-page.aggregate.ts`
- **주요 기능**:
  - 페이지 게시 처리
  - 게시 링크 생성
  - 접근 로그 이벤트 기록

**구현 수도코드**:
```typescript
class PublishedPageAggregate {
  private events: DomainEvent[] = [];

  publish(command: PublishPageCommand): PublishResult {
    // 1. 소유자 검증 (Aggregate 레벨 비즈니스 규칙)
    // 2. 중복 게시 검증
    // 3. PublishedPage 생성
    // 4. PagePublished 이벤트 발행
    // 5. PublishLinkGenerated 이벤트 발행
    // 6. 결과 반환
  }

  recordAccess(token: PublishToken): void {
    // 접근 로그는 분석/보안 관점에서 도메인 의미를 가지므로 Aggregate에서 관리
    // PublishLinkAccessed 이벤트 발행
  }
}
```

**Process Model 매핑**: Scenario 1 - Sequence 1

---

#### CopyWorkflowAggregate
- **파일 위치**: `src/domains/share/shared/aggregates/copy-workflow.aggregate.ts`
- **주요 기능**:
  - 복제 시도 흐름 관리
  - 회원 여부 검증 결과 반영
  - 복제 실패 시 상태 종료

**구현 수도코드**:
```typescript
class CopyWorkflowAggregate {
  private events: DomainEvent[] = [];

  attemptCopy(command: AttemptCopyPageCommand): void {
    // 1. 워크플로우 생성
    // 2. 회원 여부 확인 필요 이벤트 발행
  }

  markFailed(reason: string): void {
    // failed 상태 전이
    // PageCopyFailed 이벤트 발행
  }

  markCompleted(): void {
    // completed 상태 전이
    // PageCopied 이벤트 발행
  }
}
```

**Process Model 매핑**: Scenario 2 - Sequence 3, Scenario 3 - Sequence 3

---

### 4. Commands & Events 수도코드

#### Commands
- **파일 위치**: `src/domains/share/shared/commands/index.ts`
- **주요 Commands**:
  - PublishPageCommand { pageId, requesterId }
  - AccessPublishLinkCommand { publishToken } // 상태 변경 없는 Command (Side-effect only, 접근 로그 이벤트를 남기기 위한 모델링)
  - AttemptCopyPageCommand { publishToken, requesterId? }
  - ExecuteCopyPageCommand { publishToken, targetWorkspaceId, requesterId }

#### Events
- **파일 위치**: `src/domains/share/shared/events/index.ts`
- **주요 Events**:
  - PagePublished
  - PublishLinkGenerated
  - PublishLinkAccessed
  - PageCopyAttempted
  - MembershipStatusChecked
  - LoginRequired
  - WorkspaceListLoaded
  - WorkspaceSelected
  - PageCopied
  - PageCopyFailed

---

### 5. Error Types 수도코드

#### ShareManagementError
- **파일 위치**: `src/domains/share/shared/errors/share-management.error.ts`
- **에러 코드 예시**:
  - NOT_PAGE_OWNER
  - ALREADY_PUBLISHED
  - INVALID_PUBLISH_TOKEN
  - PUBLISH_LINK_NOT_FOUND
  - LOGIN_REQUIRED
  - WORKSPACE_FORBIDDEN
  - COPY_FAILED

**에러 변환 규칙**:
- Domain Error는 CopyResult.errorMessage로 변환되며, 프론트에는 코드 노출하지 않는다

---

## 🔧 Infrastructure Layer

### 1. Repository 수도코드

#### PublishedPageRepository
- **파일 위치**: `src/domains/share/infrastructure/repositories/published-page.repository.ts`
- **주요 메서드**:
  - save(publishedPage)
  - findByPageId(pageId)
  - findByToken(publishToken)

#### CopyWorkflowRepository
- **파일 위치**: `src/domains/share/infrastructure/repositories/copy-workflow.repository.ts`
- **주요 메서드**:
  - save(workflow)
  - findById(id)
  - findByToken(publishToken)

---

### 2. ACL 수도코드

#### WorkspaceManagementACL
- **파일 위치**: `src/domains/share/infrastructure/acl/workspace-management.acl.ts`
- **주요 기능**:
  - 게시 페이지 정보 조회 (Page Structure Context)
  - 워크스페이스 목록 조회
  - 페이지 복제 요청

#### AuthDomainACL
- **파일 위치**: `src/domains/share/infrastructure/acl/auth-domain.acl.ts`
- **주요 기능**:
  - 회원 여부 확인
  - 인증 결과를 도메인 에러(LoginRequired)로 변환하여 반환

---

## ⚙️ Service Layer

### SharePublishingService
- **파일 위치**: `src/domains/share/backend/services/share-publishing.service.ts`
- **주요 책임**:
  - 게시 권한 검증
  - 게시 링크 생성 및 저장

### ShareCopyService
- **파일 위치**: `src/domains/share/backend/services/share-copy.service.ts`
- **주요 책임**:
  - 회원 여부 확인
  - 워크스페이스 목록 조회
  - 페이지 복제 실행

**책임 가정**:
- Service는 인증된 사용자 요청만 전달된다고 가정한다

---

## ⚡ Server Actions 수도코드

**파일 위치**: `src/domains/share/actions/share.actions.ts`

### publishPageAction
```typescript
// 1. 인증 확인 (Server Action 책임)
// 2. PublishPageCommand 생성
// 3. SharePublishingService 호출 (권한 검증은 Service/Aggregate 책임)
// 4. PublishResult 반환
```

### getPublishedPageAction
```typescript
// 1. 토큰 검증
// 2. PublishedPage 조회
// 3. PublishedPageView DTO 직렬화
// 4. PublishLinkAccessed 이벤트 기록 (Side-effect)
```

### getWorkspaceSelectionAction
```typescript
// 1. 회원 여부 확인
// 2. 워크스페이스 목록 조회
// 3. WorkspaceSelectionView 반환
```

### copyPublishedPageAction
```typescript
// 1. 회원 여부 확인 (Server Action 책임)
// 2. 워크스페이스 권한 검증
// 3. 복제 실행
// 4. CopyResult 반환 (Domain Error는 Server Action에서 CopyResult로 변환)
```

---

## 📖 Read Models

### PublishedPageView
- 게시된 페이지 렌더링용 DTO

### WorkspaceSelectionView
- 복제 대상 워크스페이스 목록 DTO

### PublishResult / CopyResult
- 게시/복제 결과 DTO
- 실패 후 재시도는 새로운 AttemptCopyPageCommand로 처리한다

---

## ✅ 기본 테스트 수도코드 메모

- PublishToken VO 생성/검증
- PublishedPageAggregate publish 흐름 이벤트 검증
- CopyWorkflowAggregate 실패 상태 전이 검증
- Repository save/find 통합 테스트

---

*이 문서는 Share Management Domain의 구현을 위한 기술 명세서입니다.*
