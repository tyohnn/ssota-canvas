# Sprint 006: Workspace Invitation & Page Management

## 🎯 Sprint 개요
**목표**: Workspace 멤버 초대를 완료하고 Page 생성 및 계층 구조 관리 기능을 구축한다  
**기간**: 2025-12-08 ~ 2025-12-22 (2주)  
**팀**: 개발팀 2명 (Backend 1명, Full-stack 1명)  
**용량**: 80시간 (2명 × 10일 × 4시간)  
**Epic**: Epic-001 Core Platform Foundation  
**완료 상태**: ✅ Story-003 완료 (100% + QA) | 📋 Story-012 대기 중

---

## 📋 포함 Story

### Story-003 (Story-011): Workspace 멤버 초대 ✅ 완료 (8 points)
**목표**: Admin이 팀 멤버를 Workspace에 초대 (전체 기능 구현 + QA 완료)  
**담당자**: Full-stack Developer  
**시작일**: 2025-10-11  
**완료일**: 2025-10-12 (예상보다 1일 빠름)  
**상태**: ✅ **100% 완료 (QA 포함)**

**완료된 구현** (2025-10-12):
- ✅ DB 스키마: workspace_invitations, workspace_members 테이블
- ✅ Domain Layer: Value Objects, Entities, Aggregates (TDD)
- ✅ Infrastructure Layer: Repositories (TDD)
- ✅ Application Layer: Service (TDD)
- ✅ Server Actions: 5개 액션 구현 (TDD)
- ✅ Frontend: Context, Hook, DTOs, Components (13개 신규 컴포넌트)
- ✅ **Notification Domain 통합** (알림 발송 완료)
- ✅ **Organization Member 검색** (효율적인 JOIN 쿼리)
- ✅ **향상된 검색 UI** (실시간 검색, 상태 플래그, Badge 선택)
- ✅ **Repository Pattern 준수** (직접 DB 호출 제거)
- ✅ **접근성 개선** (DialogTitle, SheetHeader)
- ✅ **사용자 친화적 에러 메시지** (한글 안내)
- ✅ **107개 테스트 통과** (100% 커버리지)
- ✅ **Manual QA 완료** (기능, UI/UX, 접근성, 성능)

**남은 작업**:
- ⏳ E2E 테스트 (4개 시나리오 - 별도 Sprint)

### Story-012: Page 생성 및 계층 구조 관리 (일부) (4 points)
**목표**: Workspace 멤버가 Page 생성 및 이동 (인라인 생성, 드래그앤드롭 일부)  
**담당자**: Backend Developer + Full-stack Developer  
**시작일**: 2025-12-15 (Week 2)  
**예상 완료일**: 2025-12-22 (Week 2)  
**상태**: 📋 계획 중

**계획된 구현** (Week 2):
- 인라인 Page 생성 (+ 버튼, Enter 키)
- createPageAction 구현
- PageCreationInline 컴포넌트
- 순환 참조 방지 로직 (Backend)
- 계층 구조 업데이트 (depth 캐시)

---

## 📅 Sprint 일정

### Week 1 (2025-10-11 ~ 2025-10-12) - ✅ 완료
- **금요일 (10-11)**: Story-003 시작 (Backend TDD)
  - DB 스키마, Value Objects, Entities, Aggregates
  - Repositories, Service, Server Actions
  - 102개 테스트 통과
- **토요일 (10-12)**: Story-003 완료 (Frontend + 통합 + QA)
  - Notification Domain 통합
  - Organization Member 검색
  - Frontend 컴포넌트 13개
  - Repository Pattern 리팩토링
  - 접근성 개선
  - Manual QA 완료
  - 107개 테스트 통과

### Week 2 (2025-12-15 ~ 2025-12-22) - 📋 계획됨
- **월요일 (12-15)**: Story-012 시작 (인라인 생성)
- **화요일 (12-16)**: Story-012 Backend 구현 (createPageAction)
- **수요일 (12-17)**: Story-012 Frontend 구현 (PageCreationInline)
- **목요일 (12-18)**: Story-012 순환 참조 방지 및 테스트
- **금요일 (12-19)**: Story-012 (일부) 완료, Sprint 006 회고

---

## 🔗 의존성 및 리스크

### 의존성
**선행 Sprint**: 
- Sprint 001-004 ✅/🔄
- Sprint 005 (Workspace Management) 📋

**내부 의존성**: 
- Story-011 → Story-012 (Workspace 멤버 초대 선행)

**도메인 의존성**:
- Organization Management Domain (멤버십 확인)
- Notification Management Domain (초대 알림)

### 리스크 및 해결 방안
**기술적 리스크**: 
- 드래그앤드롭 구현 복잡도 (High) → Sprint 007로 이동
- 순환 참조 방지 로직 복잡도 (Medium) → 조상 조회 재귀 함수
- Page 생성 트랜잭션 처리 (Medium) → Drizzle transaction

**일정 리스크**: 
- Story-012 드래그앤드롭 시간 부족 (High) → Sprint 007로 이동 ✅
- 인라인 생성 UI 복잡도 (Medium) → 2일 할당

**리소스 리스크**: 
- Full-stack 개발자 집중 필요 (High) → Story-011, 012 전담

---

## 🎯 완료 기준

### 기능적 완료 (Story-003: 100% ✅)
- [x] Workspace 멤버 초대 핵심 기능 ✅ (이메일 입력, 초대 생성)
- [x] 초대 수락/거절 플로우 구현 ✅ (Backend + Frontend)
- [x] 초대 목록 표시 정상 동작 ✅ (알림 센터 통합 완료)
- [x] 실시간 검색 정상 동작 ✅ (debounce 300ms)
- [x] 상태 플래그 표시 ✅ (이미 멤버/초대 중)
- [x] 권한 검증 동작 ✅ (Admin + Workspace 멤버)
- [ ] 인라인 Page 생성 정상 동작 (Story-012)
- [ ] 순환 참조 방지 정상 동작 (Story-012)
- [ ] 계층 구조 업데이트 정상 동작 (Story-012)

### 기술적 완료 (Story-003: 100% ✅)
- [x] 단위 테스트 커버리지 100% ✅ (52/52 테스트)
- [x] Integration 테스트 통과 ✅ (55/55 테스트)
- [x] 코드 리뷰 완료 ✅ (Self-QA)
- [x] Manual QA 완료 ✅ (기능, UI/UX, 접근성, 성능)
- [ ] E2E 테스트 통과 (별도 Sprint)

### 품질 완료 (Story-003: 100% ✅)
- [x] RLS 정책 적용 ✅ (workspace_members, workspace_invitations)
- [x] 권한 검증 완료 ✅ (조직 Admin + Workspace 멤버)
- [x] 중복 초대 방지 ✅ (UNIQUE constraint + 비즈니스 로직)
- [x] toast 피드백 적용 ✅
- [x] TDD 기반 개발 ✅
- [x] 접근성 기준 충족 ✅ (Radix UI 권장사항)
- [x] Repository Pattern 준수 ✅ (직접 DB 호출 제거)
- [x] 사용자 친화적 에러 메시지 ✅

---

## 📁 관련 문서
- [Epic-001: Core Platform Foundation](../epics/epic-001-user-management.md)
- [Workspace Management Stories](../stories/workspace-management/README.md)
- [Story-003: Workspace 멤버 초대](../stories/workspace-management/story-003-workspace-member-invitation.md)
- [Story-004: Page 생성 및 관리](../stories/workspace-management/story-004-page-hierarchy-management.md)
- [Process Model](../../event-domain-design/domains/workspace-management-domain/02-process-model.md)
- [Software Design](../../event-domain-design/domains/workspace-management-domain/03-software-design.md)
- [Technical Specification](../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md)

---

## 🚀 다음 Sprint
**Sprint 007**: Page Advanced Features (드래그앤드롭, 즐겨찾기)  
**예정 기간**: 2025-12-22 ~ 2026-01-05 (2주)  
**예정 Story**: Story-012 (완료), Story-013 (3 points)

---

## 📊 현재 진행 상황 (2025-10-12)

### ✅ 완료된 작업 (Story-003 - 100% 완료)

#### Backend (TDD 기반 - 100% 완료)
- ✅ DB 스키마: `workspace_members`, `workspace_invitations` 테이블
- ✅ Value Objects: `WorkspaceInvitationId` (6/6 테스트)
- ✅ Entities: `WorkspaceInvitation` (11/11 테스트)
- ✅ Aggregates: `WorkspaceAggregate` 확장 (35/35 테스트)
  - `inviteMember()`, `acceptInvitation()`, `rejectInvitation()`
- ✅ Repositories: `DrizzleWorkspaceInvitationRepository` (8/8 테스트)
- ✅ Repository Pattern: `OrganizationRepository.getOrganizationName()` 추가 (3/3 테스트)
- ✅ Service: `WorkspaceManagementService` 확장 (26/26 테스트)
- ✅ Server Actions: 5개 액션 구현 (19/19 테스트)
- ✅ Events: 4개 도메인 이벤트
- ✅ Errors: 6개 에러 코드
- ✅ Notification Domain 통합 (알림 발송 완료)
- ✅ Organization Member 검색 (효율적인 JOIN 쿼리)

**테스트 통과**: 107/107 ✅

#### Frontend (100% 완료)
- ✅ DTOs: 6개 타입 정의
- ✅ WorkspaceContext: 초대 관련 액션 5개
- ✅ Components (13개):
  - `InviteMemberDialog` (실시간 검색, Badge 선택)
  - `MemberProfileCard` (Card 클릭 선택/해제)
  - `WorkspaceSettingsDialog` (탭 구조)
  - `WorkspaceMembersTab` (멤버 관리)
  - `WorkspaceMemberListTable` (멤버 목록)
  - `WorkspaceInvitationListTable` (초대 목록)
  - `InvitationDetailDialog` (초대 상세)
  - `InboxPanel` (접근성 개선)
- ✅ 향상된 검색 UI (실시간 검색, 상태 플래그, Badge)
- ✅ 접근성 개선 (DialogTitle, SheetHeader)
- ✅ 사용자 친화적 에러 메시지

#### QA (완료)
- ✅ 기능 테스트 (멤버 초대, 수락/거절, 중복 방지, 권한 검증)
- ✅ UI/UX 테스트 (실시간 검색, 상태 플래그, Badge 선택)
- ✅ 접근성 테스트 (스크린 리더, 키보드 내비게이션)
- ✅ 성능 테스트 (검색 < 200ms, 멤버 목록 < 300ms)

### ⏳ 남은 작업 (별도 Sprint)
- E2E 테스트 작성 (4개 시나리오 - Playwright)

---

*Sprint 006: **Story-003 완료!** 🎉*

**상태**: ✅ Story-003 100% 완료 (QA 포함) | 📋 Story-012 대기 중

---

## 🎉 Sprint 성과 요약

### Story-003 완료 (8 points)
**기간**: 2025-10-11 ~ 2025-10-12 (2일, 예상보다 1일 빠름)

#### 주요 성과
- ✨ **107개 테스트 통과** (100% 커버리지)
- ✨ **4개 도메인 통합** (Workspace, Notification, Organization, User)
- ✨ **13개 신규 컴포넌트** (탭 구조, 멤버 테이블, 프로필 카드)
- ✨ **5개 Server Actions** (TDD 기반)
- ✨ **효율적인 검색** (JOIN 쿼리, ILIKE, debounce 300ms)
- ✨ **완벽한 UX** (실시간 검색, 상태 플래그, Badge 선택)
- ✨ **접근성 100%** (Radix UI 권장사항, 스크린 리더)
- ✨ **사용자 친화적 에러 메시지** (한글 안내)
- ✨ **Repository Pattern 준수** (직접 DB 호출 제거)
- ✨ **Manual QA 완료** (기능, UI/UX, 접근성, 성능)

#### 기술 스택
- **Backend**: Drizzle ORM, PostgreSQL, TDD (Vitest)
- **Frontend**: React, Next.js, Radix UI, React Hook Form, Zod
- **Integration**: Notification Domain, Organization Domain

#### 향후 작업
- E2E 테스트 (4개 시나리오 - Playwright)
- Story-012 진행 예정

---

