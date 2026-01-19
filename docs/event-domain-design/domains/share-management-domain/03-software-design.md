# Share Management Domain - Software Design

Event Storming과 Process Model을 기반으로 한 DDD 설계 문서입니다.

---

## 🎯 개요

**도메인**: Share Management  
**작성자**: 시니어개발자 + PO  
**작성일**: 2026-01-02  
**버전**: v1.0

**Process Model 참조**: `02-process-model.md`  
**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `04-testing-strategy.md`

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Share Management Domain의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **Workspace Management Domain (Page Structure Context)**: 게시/접속 시 페이지 정보 조회 (ACL 필요)
- **Workspace Management Domain**: 워크스페이스 목록 조회, 페이지 복제 실행
- **Auth Domain System (User Management Domain)**: 회원 여부 확인 및 로그인 처리
- **Anti-Corruption Layer**: 외부 도메인 응답을 PublishedPage/CopyWorkflow 모델로 변환하고 검증/에러를 표준화하는 어댑터 계층

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 | 구현 상태 |
|----------------------|---------------------------|------|----------|
| Share System (Publish) | **PublishedPage Aggregate** | 게시 상태 관리, 게시 링크 생성, 스냅샷 기준 결정 | 🚧 신규 |
| Share System (Copy) | **CopyWorkflow Aggregate** | 회원 확인 기반 복제 플로우 관리, 복제 요청 실행 | 🚧 신규 |

---

## 📦 Aggregate 상세 정의

### 1. PublishedPage Aggregate

**핵심 개념**: "원본 페이지의 공개 상태와 게시 링크를 관리하는 집합체"

#### Commands (받는 명령)
- Publish Page
- Generate Publish Link

#### Events (발생 이벤트)
- Page Published
- Publish Link Generated
- Publish Link Accessed

#### 핵심 불변식 (Invariants)
- 페이지 소유자만 게시 가능
- 게시된 페이지는 읽기 전용 (원본 수정과 분리)
- 게시 링크 토큰은 유일해야 함
- 게시 링크 형식은 `/p/[token]`을 사용
- 토큰은 UUID를 Base64로 인코딩하여 생성

#### 속성 (Properties)
```typescript
{
  id: PublishedPageId,          // 게시된 페이지 ID
  pageId: PageId,               // 원본 페이지 ID
  ownerId: UserId,              // 페이지 소유자 ID
  status: 'published',          // 게시 상태 (MVP는 published만, 향후 unpublished 확장)
  publishToken: string,         // Base64(UUID) 토큰
  publishedAt: Date,            // 게시 시점
  snapshotVersion?: string      // 스냅샷 버전 (향후 구현)
}
```

---

### 2. CopyWorkflow Aggregate

**핵심 개념**: "게시된 페이지 복제의 사용자 플로우와 실행 상태를 관리하는 집합체"

#### Commands
- Attempt Copy Page
- Verify Membership
- Load Workspace List
- Execute Copy Page

#### Events
- Page Copy Attempted
- Membership Status Checked
- Login Required
- Workspace List Loaded
- Workspace Selected
- Page Copied
- Page Copy Failed

#### 핵심 불변식
- 복제 시도 시 회원 여부는 반드시 검증됨
- 비회원은 로그인 완료 후 복제 플로우를 재개해야 함
- 복제 대상 워크스페이스는 요청자의 접근 권한이 있어야 함
- 복제는 게시된 페이지 스냅샷 기준으로 수행됨
- 복제 실패 시 워크플로우는 종료되며 재시도는 새 워크플로우로 시작

#### 속성
```typescript
{
  id: CopyWorkflowId,            // 복제 워크플로우 ID
  publishToken: string,          // 게시 링크 토큰
  requesterId?: UserId,          // 회원이면 존재 (비회원은 null)
  status: 'pending' | 'waiting_login' | 'selecting_workspace' | 'copying' | 'completed' | 'failed', // 로그인 완료 후 selecting_workspace로 이동
  targetWorkspaceId?: WorkspaceId,
  requestedAt: Date,
  completedAt?: Date,
  failureReason?: string
}
```

---

## 🔲 Bounded Context 정의

### Page Publishing Context

**언어적 특징**:
- "Publish" = 페이지를 공개 상태로 전환
- "Publish Link" = 게시된 페이지 접근 링크
- "Published Page" = 공개 상태 페이지

**핵심 책임**:
- 페이지 게시 상태 관리
- 게시 링크 생성 및 관리
- 게시 링크 접근 로깅

**포함된 Aggregates**:
- PublishedPage Aggregate (게시 상태/링크 관리)

**External System Integration**:
- **Workspace Management Domain (Page Structure Context)**: 페이지 정보 조회

---

### Page Copy Context

**언어적 특징**:
- "Copy Workflow" = 복제 플로우 전 과정
- "Workspace Selection" = 복제 대상 선택
- "Copy Target" = 복제 대상 워크스페이스

**핵심 책임**:
- 회원 여부 확인 및 로그인 대기
- 워크스페이스 목록 조회
- 페이지 복제 실행 요청

**포함된 Aggregates**:
- CopyWorkflow Aggregate (복제 플로우 관리)

**External System Integration**:
- **Auth Domain System (User Management Domain)**: 회원 여부 확인, 로그인 처리
- **Workspace Management Domain**: 워크스페이스 목록 조회, 페이지 복제 실행

---

## 🔀 다른 Context와의 경계

### Workspace Management Domain과의 경계

**언어적 차이**:
| Share Management Context | Workspace Management Domain |
|-------------------------|-----------------------------|
| "Published Page" | "Page" |
| "Copy Target" | "Workspace" |

**통합 이벤트**:
- `Page Copy Attempted` → `Load Workspace List`
- `Workspace Selected` → `Execute Page Copy`

### Auth Domain System (User Management Domain)과의 경계

**언어적 차이**:
| Share Management Context | Auth Domain System |
|-------------------------|--------------------|
| "Membership Check" | "Authentication" |
| "Login Required" | "Login Flow" |

**통합 이벤트**:
- `Page Copy Attempted` → `Verify Membership`
- `Login Required` → `Start Login Flow`

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│                 Share Management Domain                 │
│                                                         │
│  ┌────────────────────┐   ┌──────────────────────────┐  │
│  │ Page Publishing    │   │ Page Copy Context        │  │
│  │ Context            │   │                          │  │
│  │  - PublishedPage   │   │  - CopyWorkflow          │  │
│  └─────────┬──────────┘   └──────────┬───────────────┘  │
└────────────┼─────────────────────────┼──────────────────┘
             │                         │
             ▼                         ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ Workspace Management Domain  │  │ Auth Domain System           │
│ (Page Structure Context)     │  │ (User Management Domain)     │
└──────────────────────────────┘  └──────────────────────────────┘
             │                         │
             ▼                         ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ Workspace Management Domain  │  │ Login / Membership Service   │
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. 게시 링크 토큰 규격 고정
- **문제**: 게시 링크 URL/토큰 규격이 결정되지 않음
- **해결**: `/p/[token]` 경로 + UUID Base64 인코딩 토큰
- **대안**: `/share/[token]`, `/published/[token]`
- **결정 이유**: 짧고 명확한 URL, 고유성 보장

### 2. 게시 스냅샷 모델 적용
- **문제**: 원본 페이지 수정 시 게시본 변경 여부
- **해결**: 게시 시점 스냅샷 기준으로 읽기 제공
- **대안**: 실시간 동기화
- **결정 이유**: 읽기 일관성 보장, 사용자 혼란 방지

### 3. 복제 플로우를 Aggregate로 분리
- **문제**: 비회원 로그인 대기 + 워크스페이스 선택 흐름을 단일 모델로 관리하기 어려움
- **해결**: CopyWorkflow Aggregate로 상태 전이 관리
- **대안**: PublishAggregate 내부에 복제 상태 포함
- **결정 이유**: 복제 플로우의 상태 전이가 명확해지고 테스트 용이

---

## 📖 Read Models (Query Side)

### PublishedPageView
**목적**: 게시 링크 접속 시 읽기 전용 페이지 뷰 제공

```typescript
interface PublishedPageView {
  pageId: string;             // 원본 페이지 ID
  title: string;              // 페이지 제목
  icon?: string;              // 페이지 아이콘
  blocks: BlockData[];        // 페이지 블록 데이터
  publishToken: string;       // 게시 링크 토큰
  status: 'published';        // 게시 상태
  isReadOnly: true;           // 편집 불가
}
```

**Query Handler 책임**:
- 게시 링크 토큰 유효성 검증
- 페이지/스냅샷 데이터 조회
- 읽기 전용 상태 전달
- 접속 로그 이벤트 기록 (Publish Link Accessed)

### WorkspaceSelectionView
**목적**: 복제 시 사용 가능한 워크스페이스 목록 제공

```typescript
interface WorkspaceSelectionView {
  workspaces: {
    id: string;
    name: string;
    icon?: string;
    organizationName?: string;
  }[];
}
```

**최적화 포인트**:
- 사용자 워크스페이스 목록 캐싱
- 조직별 그룹화 응답
