# Software Design: Workspace Management Domain

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 시니어개발자 + 도메인전문가  
**작성일**: 2025-10-11  
**버전**: v1.0

**Process Model 참조**: `02-process-model.md`  
**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `04-testing-strategy.md`

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, Workspace Management의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **Organization-Management Domain**: 동기 호출 (서비스 주입), ACL 불필요 (같은 모델 사용)
- **Notification-Management Domain**: 동기 호출 (서비스 주입), ACL 불필요
- **Block System Domain** (미래): 비동기 호출, ACL 필요 여부 추후 결정

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates (Scenario 1 기준)

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| Workspace System | **Workspace Aggregate** | Workspace 생성/관리, 멤버십 관리, 접근 권한 제어 |
| Page System | **Page Aggregate** | Page 생명주기, 계층 구조 관리 |
| Read Model Service | **OrganizationWorkspacePageView** (Read Model) | Workspace-Page 통합 조회 |

---

## 📦 Aggregate 상세 정의 (Scenario 1 기준)

### 1. Workspace Aggregate

**핵심 개념**: "조직 내 작업 공간을 관리하고, Workspace별 멤버 접근을 제어하는 Aggregate"

#### Commands (받는 명령) - Scenario 1
- CreateDefaultWorkspace (Scenario 0에서 사용)
- CreateWorkspace (Scenario 2에서 사용)
- VerifyWorkspaceMembership (페이지 접근 시 권한 확인)
- FindByOrganizationId (조직의 모든 Workspace 조회)

#### Events (발생 이벤트) - Scenario 1
- WorkspaceCreated (Workspace 생성됨)
- WorkspaceListLoaded (Workspace 목록 로드됨)
- WorkspaceMembershipVerified (Workspace 멤버십 검증됨)
- WorkspaceAccessDenied (Workspace 접근 거부됨)

#### 핵심 불변식 (Invariants)
- Workspace는 반드시 하나의 Organization에 속해야 함
- Default Workspace는 삭제 불가 (is_default=true)
- 조직 소유자만 Workspace 생성 가능
- Default Workspace는 조직 멤버가 자동으로 접근 가능
- 일반 Workspace는 초대된 멤버만 접근 가능

#### 속성 (Properties)
```typescript
{
  workspaceId: WorkspaceId,        // Workspace 고유 식별자
  organizationId: OrganizationId,  // 소속 조직 ID
  name: string,                    // Workspace 이름 (1-100자)
  description?: string,            // Workspace 설명 (최대 500자)
  icon?: string,                   // Workspace 아이콘 (이모지 또는 URL)
  isDefault: boolean,              // Default Workspace 여부
  deletable: boolean,              // 삭제 가능 여부 (Default는 false)
  createdBy: UserId,               // 생성자 ID
  createdAt: Date,                 // 생성 시간
  updatedAt: Date,                 // 수정 시간
  deletedAt?: Date                 // 삭제 시간 (소프트 삭제)
}
```

#### 책임 범위
- ✅ Workspace CRUD 처리
- ✅ Workspace 멤버십 확인 (Workspace 멤버인지)
- ✅ Workspace 접근 권한 검증
- ❌ Page 목록 조회 (Page Aggregate 책임)
- ❌ 조직 멤버십 확인 (Organization Domain 책임)

---

### 2. Page Aggregate

**핵심 개념**: "Workspace 내 개별 캔버스 페이지를 관리하고, 무한 계층 구조를 유지하는 Aggregate"

#### Commands (받는 명령) - Scenario 1
- CreateInitialPage (Workspace 생성 시 자동)
- FindTreeByWorkspaceId (Workspace별 페이지 트리 조회)
- VerifyPageAccess (페이지 접근 권한 확인)

#### Events (발생 이벤트) - Scenario 1
- PageCreated (페이지 생성됨)
- PageTreeLoaded (페이지 트리 로드됨)
- PageAccessVerified (페이지 접근 권한 검증됨)
- PageAccessDenied (페이지 접근 거부됨)

#### 핵심 불변식 (Invariants)
- Page는 반드시 하나의 Workspace에 속해야 함
- Page 순환 참조 불가 (자기 자신의 하위가 될 수 없음)
- 삭제된 Page는 30일 후 자동 삭제됨
- Page 계층 무한 중첩 가능 (실제로는 보통 5단계 이내)
- 하위 Page 삭제 시 모든 자식도 함께 삭제됨 (Cascade)

#### 속성 (Properties)
```typescript
{
  pageId: PageId,                  // Page 고유 식별자
  workspaceId: WorkspaceId,        // 소속 Workspace ID
  parentId?: PageId,               // 부모 Page ID (null이면 최상위)
  title: string,                   // 페이지 제목 (최대 200자)
  icon?: string,                   // 페이지 아이콘 (이모지 또는 URL)
  order: number,                   // 같은 레벨 내 순서
  depth: number,                   // 계층 깊이 (캐시, 0=최상위)
  createdBy: UserId,               // 생성자 ID
  createdAt: Date,                 // 생성 시간
  updatedAt: Date,                 // 수정 시간
  deletedAt?: Date                 // 삭제 시간 (소프트 삭제)
}
```

#### 책임 범위
- ✅ Page CRUD 처리
- ✅ Page 계층 구조 관리 (Parent-Child, depth 계산)
- ✅ Page 트리 조회 (재귀 CTE)
- ✅ depth 계산 및 업데이트 (Page 생성/이동 시)
- ❌ Workspace 멤버십 확인 (Workspace Aggregate에 위임)
- ❌ 캔버스 내부 블록 관리 (Block System Domain 책임)

---

## 🔲 Bounded Context 정의

### Context 1: Workspace Management Context 🟦 (Core Domain)

**언어적 특징**:
- "Workspace" = 조직 내 작업 공간, 여러 페이지의 컨테이너
- "Default Workspace" = 조직 생성 시 자동 생성되는 기본 워크스페이스 (삭제 불가)
- "Workspace Member" = Workspace에 초대된 조직 멤버
- "Workspace Membership" = Workspace별 멤버 접근 권한
- "Invitation" = Workspace 멤버 초대 프로세스

**핵심 책임**:
- Workspace 생성/수정/삭제 (Default Workspace 제외)
- Workspace 멤버십 관리 (초대/수락/제거)
- Workspace 접근 권한 제어
- Default Workspace 자동 생성 (Organization Domain에서 트리거)

**포함된 Aggregates**:
- **Workspace Aggregate**: Workspace 생명주기 및 멤버십 관리
- (향후 추가) **Workspace Invitation Aggregate**: 초대 프로세스 관리

**External System Integration**:
- **Organization-Management Domain** (Upstream):
  - 조직 멤버십 확인 (Server Component에서 순차 호출)
  - 조직 소유자 권한 확인
  - 통합 방식: 동기 호출, 서비스 주입
  - ACL: 불필요 (같은 모델 사용)

---

### Context 2: Page Structure Context 🟨 (Core Domain)

**언어적 특징**:
- "Page" = Workspace 내 개별 캔버스 페이지
- "Page Hierarchy" = 페이지 계층 구조 (Parent-Child)
- "Depth" = 계층 깊이 (0=최상위, 캐시됨)
- "Favorite" = 즐겨찾기에 추가된 페이지
- "Trash" = 삭제된 페이지 임시 보관소 (30일)

**핵심 책임**:
- Page 생성/수정/삭제
- Page 계층 구조 관리 (무한 중첩)
- Page 트리 조회
- Breadcrumb 경로 계산
- 휴지통 관리 (30일 보관 후 자동 삭제)

**포함된 Aggregates**:
- **Page Aggregate**: Page 생명주기 및 계층 구조 관리
- (향후 추가) **Page Trash Aggregate**: 휴지통 및 복구 관리

**External System Integration**:
- **Block System Domain** (미래):
  - 빈 캔버스 초기화
  - 블록 복제 (Page 복제 시)
  - 통합 방식: 비동기 호출
  - ACL: 필요 여부 추후 결정

---

## 🔀 다른 Context와의 경계

### Workspace Management Context ↔ Page Structure Context

**언어적 차이**:
| Workspace Management Context | Page Structure Context |
|----------------------------|----------------------|
| "Workspace" (작업 공간) | "Page" (개별 캔버스) |
| "Membership" (멤버 초대) | "Hierarchy" (계층 구조) |
| "Access Control" (접근 권한) | "Tree Structure" (트리 구조) |

**통합 이벤트**:
- `WorkspaceCreated` → `CreateInitialPage` (초기 페이지 자동 생성)
- `WorkspaceDeleted` → `HideAllPages` (Workspace 삭제 시 모든 페이지 숨김)
- `WorkspaceSelected` → `LoadPageTree` (Workspace 선택 시 페이지 목록 로드)

**관계 패턴**: **Customer-Supplier**
- Workspace Management (Upstream) → Page Structure (Downstream)
- Page는 항상 Workspace에 속함 (소유 관계)
- Workspace ID로 Page 필터링

---

### Workspace Management Context ↔ Organization Management Context

**언어적 차이**:
| Workspace Management Context | Organization Management Context |
|----------------------------|-------------------------------|
| "Workspace Member" (워크스페이스 멤버) | "Organization Member" (조직 멤버) |
| "Workspace Owner" (조직 소유자) | "Organization Owner" (조직 소유자) |
| "Default Workspace" (기본 워크스페이스) | "Default Organization" (기본 조직) |

**통합 이벤트**:
- `OrganizationCreated` → `CreateDefaultWorkspace` (기본 워크스페이스 생성)
- `OrganizationMembershipVerified` ← `VerifyWorkspaceAccess` (권한 검증 시 조직 멤버십 확인)

**관계 패턴**: **Conformist**
- Organization Management (Upstream) → Workspace Management (Downstream)
- Workspace는 Organization의 멤버십 모델을 따름
- 조직 멤버십 확인을 위해 Organization API 호출 (순차 처리)

---

## 🏗️ Context Map (Scenario 1 기준)

```
┌─────────────────────────────────────────────────────────┐
│         Organization Management Context                 │
│         (Upstream - Conformist)                         │
│                                                         │
│  ┌──────────────────┐                                  │
│  │ Organization     │                                  │
│  │ Aggregate        │                                  │
│  └────────┬─────────┘                                  │
│           │                                             │
└───────────┼─────────────────────────────────────────────┘
            │ 
            │ API 호출 (조직 멤버십 확인)
            │ 동기 호출, 서비스 주입
            ▼
┌─────────────────────────────────────────────────────────┐
│       Workspace Management Context                      │
│       (Downstream - Core Domain)                        │
│                                                         │
│  ┌──────────────┐                                      │
│  │ Workspace    │                                      │
│  │ Aggregate    │                                      │
│  └──────┬───────┘                                      │
│         │                                               │
│         │ Customer-Supplier                            │
│         ▼                                               │
│  ┌──────────────┐                                      │
│  │ Page         │                                      │
│  │ Aggregate    │                                      │
│  └──────────────┘                                      │
│                                                         │
│  ┌──────────────────────────────────┐                 │
│  │ OrganizationWorkspacePageView    │                 │
│  │ (Read Model Service)             │                 │
│  │ - Workspace + Page 통합 조회     │                 │
│  └──────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📖 Read Models (Query Side) - Scenario 1

### OrganizationWorkspacePageView

**목적**: 조직 페이지(`/r/[orgId]/workspace`) 접근 시 사이드바에 표시할 Workspace-Page 통합 정보 제공

```typescript
interface OrganizationWorkspacePageView {
  organizationId: string;           // 조직 ID
  workspaces: WorkspaceWithPages[]; // Workspace 목록 + 페이지 트리
  selectedPageId?: string;          // 자동 선택할 페이지 ID (쿠키 또는 Fallback)
}

interface WorkspaceWithPages {
  workspaceId: string;              // Workspace ID
  name: string;                     // Workspace 이름
  icon?: string;                    // Workspace 아이콘
  description?: string;             // Workspace 설명
  isDefault: boolean;               // Default Workspace 여부
  pageTree: PageTreeNode[];         // 페이지 트리 구조
  pageCount: number;                // 전체 페이지 수
}

interface PageTreeNode {
  id: string;                       // Page ID
  title: string;                    // 페이지 제목
  icon?: string;                    // 페이지 아이콘
  children: PageTreeNode[];         // 하위 페이지 (재귀)
  depth: number;                    // 계층 깊이
  isFavorite: boolean;              // 즐겨찾기 여부
  lastModified: Date;               // 마지막 수정 시간
}
```

**Query Handler 책임** (Read Model Service):
- Workspace Aggregate에서 조직의 모든 Workspace 조회
- Page Aggregate에서 각 Workspace의 Page 트리 조회
- 쿠키에서 최근 방문 페이지 ID 읽기
- 최근 방문 페이지 유효성 검증
  - 존재하지 않거나 조직이 다르면 → Default Workspace 첫 페이지로 Fallback
- 두 결과를 조합하여 `OrganizationWorkspacePageView` 생성

**최적화 포인트**:
- Page 트리는 재귀 CTE로 한 번에 로드 (WITH RECURSIVE)
- depth 캐시 활용: 정렬 및 들여쓰기에 사용
- 캐싱: 세션 기간 동안 Read Model 캐시 (세션별)
- 페이지 수가 많은 경우 (100개 이상): Lazy Loading 고려 (미래)

---

## 🤝 Service 레이어의 역할 (Scenario 1)

Service 레이어는 여러 Aggregate와 외부 도메인을 조율하는 **업무 진행 책임자**입니다.

### WorkspaceManagementService (Service Layer)

**역할**: Workspace 및 Page Aggregate를 조율하고, Organization Domain과 통합

**주요 Server Actions** (Scenario 1):
- `getOrganizationWorkspacePageViewAction(orgId, userId, cookiePageId?)`: 조직 Workspace-Page 목록 조회
- `verifyPageAccessAction(orgId, workspaceId, pageId, userId)`: 페이지 접근 권한 검증

**업무 시나리오 연결** (Scenario 1):
- 사용자가 조직 페이지(`/r/[orgId]/workspace`)에 접근하면:
  1. **Server Component**가 **Server Action** 호출: `getOrganizationWorkspacePageViewAction(orgId, userId)`
  2. **Server Action**이 **Service** 호출:
     - Organization Domain Repository 호출: 조직 멤버십 확인
     - 멤버가 아니면 → 권한 없음 에러 반환
     - 멤버이면 → Workspace Repository에서 Workspace 목록 조회
     - Page Repository에서 각 Workspace의 Page 트리 조회
     - Read Model Service가 두 결과를 조합
     - 쿠키에서 최근 방문 페이지 ID 검증
     - 유효하지 않으면 → Default Workspace 첫 페이지로 Fallback
  3. **Server Action**이 `OrganizationWorkspacePageView` 반환
  4. **Server Component**가 결과를 렌더링

**규칙 준수 확인** (Scenario 1):
- ✅ 조직 멤버만 Workspace-Page 목록 조회 가능
- ✅ Default Workspace는 조직 멤버 자동 접근
- ✅ 일반 Workspace는 멤버십 확인 필요
- ✅ 쿠키 검증 및 Fallback 전략 준수

**외부 파트너 연동** (Scenario 1):
- **Organization Domain**: 동기 호출로 조직 멤버십 확인
  - Repository 호출: `organizationMemberRepository.isMember(orgId, userId)` (RLS 사용)
  - 또는: `organizationMemberRepository.findMemberRole(orgId, userId)` (역할까지 조회)
  - 성공: 멤버 여부 반환 (true/false) 또는 역할 정보 (owner/admin/member)
  - 실패: 네트워크 오류 → 접근 거부 (Fail-safe)

**실패 대응 전략** (Scenario 1):
- Organization API 장애 시:
  - 사용자에게 "일시적 오류입니다. 잠시 후 다시 시도해주세요" 안내
  - 접근 거부 처리 (보안 우선)
- 쿠키 검증 실패 시:
  - 자동으로 Default Workspace 첫 페이지로 이동
  - 사용자에게 에러 표시 없음 (자연스러운 Fallback)

**즐거운 사용자 경험** (Scenario 1):
- **빠른 응답**: 쿠키 기반 자동 페이지 선택으로 즉시 작업 시작
- **자연스러운 Fallback**: 쿠키 무효 시 에러 대신 Default Workspace로 자동 이동
- **계층 구조 시각화**: 사이드바에 Workspace별 Page 트리를 들여쓰기로 표시
- **즐겨찾기 빠른 접근**: 별도 섹션으로 자주 사용하는 페이지 노출

---

## 💡 핵심 설계 결정 (Scenario 1)

### 1. Read Model Service를 별도 레이어로 분리

**문제**: Scenario 1에서 Workspace와 Page를 한 번에 조회해야 함 (복잡한 조인)

**해결**: `OrganizationWorkspacePageView` Read Model Service 생성
- Workspace Aggregate와 Page Aggregate를 조합
- Server Component에서 호출
- CQRS 패턴 적용 (Command와 Query 분리)

**대안**:
- ❌ Workspace Aggregate가 Page 포함: Aggregate 너무 커짐, 트랜잭션 경계 모호
- ❌ Page Aggregate가 Workspace 포함: 역방향 의존성, 계층 구조 위반

**결정 이유**:
- Aggregate는 작고 명확하게 유지
- Read Model Service는 복잡한 조회 전담
- 향후 Page가 더 커질 것을 대비 (별도 Context)

---

### 2. 권한 검증을 Server Component에서 순차 처리

**문제**: 페이지 접근 시 조직 멤버십 + Workspace 멤버십 둘 다 확인 필요

**해결**: Server Component에서 순차 처리
1. 조직 멤버십 확인 (Organization Domain API)
2. Workspace 멤버십 확인 (Workspace Aggregate)
3. 둘 다 통과해야 페이지 로드

**대안**:
- ❌ Workspace Aggregate가 Organization API 내부 호출: Aggregate 책임 과다, 테스트 어려움
- ❌ 통합 Permission Service: 중앙 집중식, 도메인 순수성 저해

**결정 이유**:
- **테스트 용이성**: 각 단계를 독립적으로 테스트 가능
- **명확한 책임 분리**: 조직 권한 vs Workspace 권한
- **Fail-fast**: 조직 멤버 아니면 바로 거부, Workspace 체크 불필요
- **Organization Domain과 일관성**: Organization도 동일한 패턴 사용

---

### 3. Parent ID + depth 캐시 패턴 선택 (Page 계층 구조)

**문제**: Page 무한 중첩을 어떻게 효율적으로 저장하고 조회할 것인가?

**해결**: Parent ID (Adjacency List) + depth 캐시
- parent_id만 저장 (FK)
- depth 필드 캐시 (계산해서 저장)
- PostgreSQL 재귀 CTE로 트리 조회
- Page 이동 시 1개 레코드만 업데이트 (parent_id + depth)

**대안**:
- ❌ Materialized Path: 조회는 빠르지만 이동 시 하위 페이지 모두 업데이트 필요 (복잡)
- ❌ Closure Table: 조회/이동 모두 빠르지만 저장 공간 많이 사용, 초기 복잡도 증가

**결정 이유**:
- **MVP 단순성**: 가장 간단한 구조 (parent_id FK만)
- **Page 이동 간단**: 1개 레코드만 업데이트 (parent_id, depth만)
- **충분한 성능**: PostgreSQL 재귀 CTE는 5단계 정도 밀리초 단위
- **실제 사용 패턴**: 대부분 유저는 5단계 이내 사용
- **향후 최적화 가능**: 성능 문제 발생 시 Materialized Path나 Closure Table 추가 가능

---

### 4. 쿠키 기반 최근 방문 페이지 관리 (DB 저장 X)

**문제**: 사용자가 마지막으로 본 페이지로 자동 이동하고 싶음

**해결**: 브라우저 쿠키에만 저장, DB 저장 X
- 쿠키 키: `recent-page-${orgId}` (조직별로 마지막 방문 페이지 관리)
- 쿠키 값: `<pageId>`
- Server Component에서 쿠키 검증
- 유효하지 않으면 Default Workspace 첫 페이지로 Fallback

**대안**:
- ❌ DB에 저장: 모든 기기에서 동일하지만, DB 부하 증가, 복잡도 증가

**결정 이유**:
- **성능**: DB 조회 불필요, 빠른 응답
- **단순함**: 쿠키만 관리하면 됨
- **기기별 경험**: 각 기기에서 다른 페이지를 볼 수 있어도 괜찮음 (UX 저하 없음)
- **MVP 우선순위**: 간단한 방식으로 빠르게 구현

---

## ✅ 검증 체크리스트 (Scenario 1)

### Aggregate 설계
- [x] Workspace Aggregate가 명확한 경계와 책임을 가지는가?
- [x] Page Aggregate가 별도로 분리되어 독립적인가?
- [x] Process Model의 System이 Aggregate로 적절히 매핑되었는가?
- [x] Read Model Service가 복잡한 조회를 담당하는가?

### Context 경계
- [x] Workspace Management와 Page Structure가 명확히 분리되었는가?
- [x] Context 간 통합이 느슨하게 결합되어 있는가? (Workspace ID로만 연결)
- [x] 언어적 차이가 명확한가?

### External System 통합
- [x] Organization Domain과의 통합이 적절한가? (동기 호출, 순차 처리)
- [x] ACL 필요 여부가 결정되었는가? (불필요)
- [x] Failure Strategy가 정의되었는가? (Fail-safe)

### 핵심 불변식
- [x] Workspace Invariants가 올바르게 정의되었는가?
- [x] Page Invariants가 올바르게 정의되었는가?
- [x] 권한 관련 불변식이 명확한가?

---

## 📊 성과 측정 지표 (Scenario 1)

1. **페이지 로드 시간**: Server Component에서 Workspace-Page 목록 조회 및 렌더링 시간 < 500ms
2. **권한 검증 성공률**: 조직 멤버십 + Workspace 멤버십 검증 성공률 > 99.9%
3. **쿠키 Fallback 발생률**: 쿠키 유효하지 않아 Fallback 발생 비율 < 5%

---

## 📚 References

### 관련 문서
- [Event Storming 문서](./01-event-storm.md)
- [Process Model 문서](./02-process-model.md)
- Organization Management Domain:
  - [Software Design](../organization-management-domain/03-software-design.md)
  - [Technical Specification](../organization-management-domain/05-technical-specification.md)

---

*이 Software Design 문서는 Workspace Management Domain의 구현을 위한 완전한 설계 지침입니다. (Scenario 1까지 완료, 나머지 Scenario 진행 중)*

