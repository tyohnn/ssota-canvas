# Frontend Specification: Workspace Management Domain

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 프론트엔드개발자 + UX/UI 디자이너  
**작성일**: 2025-10-11  
**버전**: v2.0

**User Flow 참조**: `03-user-flow.md`  
**Software Design 참조**: `03-software-design.md`  
**Technical Specification 참조**: `05-technical-specification.md`  
**다음 단계**: 프론트엔드 구현 (TDD)

---

> **가이드 참조**: `docs/event-domain-design/guide/04-frontend-specification-guide.md`  
> **작성 시점**: User Flow 완료 후, 실제 구현 시작 전  
> **목적**: User Flow를 React 구조로 전환, DTO 설계, Context/Hooks/Components 정의  
> **범위**: Scenario 0~5 (Workspace/Page 생성, 수정, 초대, 이동, 즐겨찾기)

---

## 📊 Frontend Specification Overview

### 프론트엔드 구현 개요

Workspace Management Domain의 Scenario 0~5를 구현하기 위한 React 프론트엔드 명세입니다.  
사용자가 조직 페이지에 접근하여 Workspace-Page 트리를 조회하고, Workspace/Page를 생성/수정하고, 멤버를 초대하고, 페이지를 관리할 수 있는 기능을 제공합니다.

**핵심 기능**:
- **Scenario 1**: Workspace-Page 트리 조회 및 페이지 선택
- **Scenario 2**: Workspace 생성 및 정보 수정
- **Scenario 3**: Workspace 멤버 초대 및 수락/거절
- **Scenario 4**: Page 생성, 드래그앤드롭 이동, 인라인 편집
- **Scenario 5**: 즐겨찾기 토글 및 사이드바 표시

### User Flow 연결점

- **입력**: `03-user-flow.md` - 25개 Screen (Scenario 1~5)
- **입력**: `03-software-design.md` - Workspace/Page Aggregates, OrganizationWorkspacePageView Read Model
- **입력**: `05-technical-specification.md` - 9개 Server Actions
- **출력**: WorkspaceContext, 11개 컴포넌트, 6개 모달/폼 컴포넌트

### 핵심 설계 원칙

- **타입 재사용**: Software Design의 Read Model을 DTO로 직렬화
- **도메인 분리**: Workspace Domain은 독립적인 Context/Hook 구조
- **Organization Domain 패턴 재사용**: 기존 OrganizationContext 패턴을 따름
- **배열 상태 관리**: workspaces 배열로 관리 (Organization 패턴과 동일)
- **로컬스토리지 영속성**: 접기/펼치기 상태 유지
- **쿠키 영속성**: 최근 방문 페이지 유지 (`recent-page-${orgId}`)
- **도메인 전용 컴포넌트**: PageTree 컴포넌트를 Workspace Management 요구사항에 맞춰 전용 설계 (ExplorerTree 대신)

---

## 📦 DTO 및 타입 정의

> **가이드 참조**: Phase 2.2 - DTO 및 타입 설계

### 1. DTO 인터페이스

#### OrganizationWorkspacePageViewDTO

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: Software Design의 OrganizationWorkspacePageView Read Model을 직렬화
- **주요 속성**:
  - organizationId: string
  - workspaces: WorkspaceWithPagesDTO[]
  - selectedPageId?: string (쿠키 또는 Fallback으로 선택된 페이지)
- **직렬화 규칙**:
  - Plain Object만 사용
  - Date → ISO 8601 string 변환
  - Value Object → string 변환
- **특징**: Server Component에서 한 번에 로드하는 Read Model

**사용 위치**:
- Server Component: `/r/[orgId]/workspace` 초기 데이터 로드
- WorkspaceProvider: 초기 데이터로 전달

---

#### WorkspaceWithPagesDTO

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: Workspace + Page 트리를 통합한 DTO
- **주요 속성**:
  - workspaceId: string
  - name: string
  - icon?: string (이모지 또는 URL)
  - description?: string
  - isDefault: boolean (기본 Workspace 여부)
  - pageTree: PageTreeNodeDTO[] (재귀 트리 구조)
  - pageCount: number (전체 페이지 수)
- **특징**: Workspace Aggregate + Page Aggregate 통합 데이터

**사용 위치**:
- WorkspacePageTree: Workspace 목록 렌더링
- 사이드바: Workspace별로 그룹화된 페이지 트리

---

#### PageTreeNodeDTO

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: 재귀 페이지 트리 구조를 표현하는 DTO (ExplorerTree 컴포넌트 호환)
- **주요 속성**:
  - id: string (Page ID)
  - title: string (페이지 제목)
  - icon?: string (페이지 아이콘)
  - children: PageTreeNodeDTO[] (하위 페이지, 재귀)
  - depth: number (계층 깊이, 0부터 시작)
  - isFavorite: boolean (즐겨찾기 여부)
  - lastModified: string (마지막 수정 시간, ISO 8601)
  - **parentId?: string | null** (부모 페이지 ID, 최상위는 null) - ExplorerTree용
  - **order: number** (같은 레벨 내 순서, 0부터 시작) - ExplorerTree용
- **특징**: 
  - Materialized Path 패턴으로 계산된 트리 구조
  - ExplorerTree 컴포넌트에서 사용하기 위해 parentId, order 속성 추가
  - Software Design의 Page Aggregate 속성과 일치

**사용 위치**:
- PageExplorerTree: ExplorerTree 컴포넌트에 전달
- 즐겨찾기 섹션: isFavorite=true인 페이지만 필터링

---

#### PageDetailsDTO

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: 페이지 선택 시 상세 정보를 제공하는 DTO
- **주요 속성**:
  - pageId: string
  - workspaceId: string
  - title: string
  - icon?: string
  - content?: string (캔버스 콘텐츠, 미래 - Block System)
  - lastModified: string (ISO 8601)
  - createdBy: string (사용자 ID)
- **특징**: 페이지 클릭 시 Server Action으로 로드

**사용 위치**:
- PageViewer: 메인 영역에 페이지 상세 표시
- PageHeader: 페이지 제목 및 메타 정보 표시

---

#### AccessDeniedDTO

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: 권한 없음 응답을 표현하는 DTO
- **주요 속성**:
  - allowed: false (권한 없음 플래그)
  - reason: 'not_workspace_member' | 'not_organization_member'
  - workspaceId: string
  - pageName?: string (페이지 이름)
- **특징**: 권한 검증 실패 시 반환

**사용 위치**:
- AccessDeniedPage: 권한 없음 화면 (Screen 4)
- 에러 처리: reason에 따라 다른 메시지 표시

---

### 2. Request DTOs (Scenario 2~5)

#### CreateWorkspaceRequest (Scenario 2)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: Workspace 생성 요청 DTO
- **주요 속성**:
  - organizationId: string
  - name: string (1-100자)
  - description?: string (최대 500자)
  - icon?: string (이모지 또는 URL)
- **특징**: 클라이언트 폼 입력 → Server Action 전달

**사용 위치**:
- CreateWorkspaceDialog: 폼 제출 시

---

#### UpdateWorkspaceInfoRequest (Scenario 2)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: Workspace 정보 수정 요청 DTO
- **주요 속성**:
  - workspaceId: string
  - name?: string
  - description?: string | null
  - icon?: string | null
- **특징**: 부분 업데이트 지원 (undefined = 변경 없음)

**사용 위치**:
- WorkspaceSettingsDialog: 폼 제출 시

---

#### InviteWorkspaceMemberRequest (Scenario 3)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: Workspace 멤버 초대 요청 DTO
- **주요 속성**:
  - workspaceId: string
  - memberEmails: string[]
- **특징**: 이메일 배열로 다중 초대 지원

**사용 위치**:
- InviteMemberDialog: 폼 제출 시

---

#### ProcessInvitationRequest (Scenario 3)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: 초대 수락/거절 요청 DTO
- **주요 속성**:
  - invitationId: string
  - action: 'accept' | 'reject'
- **특징**: 수락/거절을 하나의 DTO로 처리

**사용 위치**:
- InvitationDetailDialog: 수락/거절 버튼 클릭 시

---

#### CreatePageRequest (Scenario 4)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: Page 생성 요청 DTO
- **주요 속성**:
  - workspaceId: string
  - parentId?: string (null = 최상위)
  - title?: string (기본값 "Untitled")
  - icon?: string (기본값 "📄")
- **특징**: 인라인 생성 시 기본값 사용

**사용 위치**:
- PageTree: + 버튼 클릭 시

---

#### MovePageRequest (Scenario 4)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: Page 이동 요청 DTO
- **주요 속성**:
  - pageId: string
  - newParentId?: string (null = 최상위)
- **특징**: 드래그앤드롭으로 전달

**사용 위치**:
- PageTree: onDrop 핸들러

---

#### UpdatePageInfoRequest (Scenario 4)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: Page 제목/아이콘 수정 요청 DTO
- **주요 속성**:
  - pageId: string
  - title?: string
  - icon?: string | null
- **특징**: 인라인 편집 결과 전달

**사용 위치**:
- PageHeader: 제목 편집 완료 시

---

### 3. Response DTOs (Scenario 2~5)

#### CreateWorkspaceResponse (Scenario 2)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: Workspace 생성 성공 응답 DTO
- **주요 속성**:
  - workspaceId: string
  - firstPageId: string (자동 생성된 첫 페이지)
- **특징**: 생성 후 첫 페이지로 자동 이동

**사용 위치**:
- CreateWorkspaceDialog: 생성 후 페이지 이동

---

#### InvitationSummaryDTO (Scenario 3)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: 초대 상세 정보 DTO (알림 센터에서 사용)
- **주요 속성**:
  - invitationId: string
  - workspaceId: string
  - workspaceName: string
  - workspaceIcon?: string
  - workspaceDescription?: string
  - invitedBy: string (이름)
  - organizationName: string
  - status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  - createdAt: string (ISO 8601)
- **특징**: Notification Domain과 통합 (알림 데이터)

**사용 위치**:
- InvitationDetailDialog: 초대 상세 표시

---

#### OrganizationMemberSearchResultDTO (Scenario 3)

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: 조직 멤버 검색 결과 DTO
- **주요 속성**:
  - userId: string
  - email: string
  - name: string
  - avatarUrl?: string
  - isAlreadyMember: boolean (이미 Workspace 멤버 여부)
- **특징**: 이메일 검색 시 실시간 조회

**사용 위치**:
- InviteMemberDialog: 검색 결과 목록

---

## 🎯 React Context 설계

> **가이드 참조**: Phase 2.3 - Context 및 Hooks 설계

### 1. Context 타입 정의

#### WorkspaceContext

- **파일 위치**: `src/domains/workspace-management/frontend/contexts/workspace-context.tsx`
- **역할**: Workspace Management Domain의 전역 상태를 관리하는 React Context
- **State 속성**:
  - **workspaces**: WorkspaceWithPagesDTO[] (Workspace-Page 트리 배열)
  - **selectedPageId**: string | null (선택된 페이지 ID)
  - **selectedWorkspaceId**: string | null (선택된 페이지가 속한 Workspace ID)
  - **expandedWorkspaces**: Set\<string\> (펼쳐진 Workspace IDs)
  - **expandedPages**: Set\<string\> (펼쳐진 Page IDs)
  - **isLoading**: boolean (로딩 상태)
  - **error**: string | null (에러 상태)
- **Actions 메서드**:
  - **Scenario 1**:
    - **selectPage**(pageId, workspaceId): 페이지 선택 및 쿠키 저장
    - **toggleWorkspace**(workspaceId): Workspace 접기/펼치기
    - **togglePage**(pageId): 페이지 접기/펼치기
    - **refreshWorkspacePages**(): 데이터 갱신
  - **Scenario 2**:
    - **createWorkspace**(request: CreateWorkspaceRequest): Workspace 생성
    - **updateWorkspaceInfo**(request: UpdateWorkspaceInfoRequest): Workspace 수정
  - **Scenario 3**:
    - **inviteMembers**(workspaceId, emails): 멤버 초대
    - **searchOrganizationMembers**(workspaceId, query): 조직 멤버 검색
    - **acceptInvitation**(invitationId): 초대 수락
    - **rejectInvitation**(invitationId): 초대 거절
  - **Scenario 4**:
    - **createPage**(workspaceId, parentId?): Page 생성
    - **movePage**(pageId, newParentId?): Page 이동
    - **updatePageInfo**(pageId, title?, icon?): Page 정보 수정
  - **Scenario 5**:
    - **togglePageFavorite**(pageId): 즐겨찾기 토글
- **Context 타입**: State + Actions 결합
- **특징**: 
  - Organization Context 패턴을 따름 (배열 상태 관리)
  - UI 상태(expandedWorkspaces/Pages)를 Context에서 관리
  - 로컬스토리지에서 초기화 후 Context에서 동기화

**데이터 흐름**:
1. Server Component에서 `getWorkspacePagesAction()` 호출
2. `OrganizationWorkspacePageViewDTO` 반환
3. WorkspaceProvider에 `initialWorkspaces` 전달
4. Context에서 상태 관리 (workspaces 배열)
5. Hook을 통해 컴포넌트에서 상태 접근
6. Actions를 통해 상태 업데이트 및 영속성 처리

---

### 2. Provider 구현 패턴

#### WorkspaceProvider

- **파일 위치**: `src/domains/workspace-management/frontend/contexts/workspace-context.tsx`
- **역할**: WorkspaceContext를 실제로 구현하는 Provider 컴포넌트
- **주요 기능**:
  - **useState를 통한 상태 관리**:
    - workspaces: WorkspaceWithPagesDTO[]
    - selectedPageId: string | null
    - selectedWorkspaceId: string | null
    - expandedWorkspaces: Set\<string\>
    - expandedPages: Set\<string\>
    - isLoading: boolean
    - error: string | null
  
  - **useEffect를 통한 초기화** (마운트 시):
    1. **로컬스토리지에서 펼치기/접기 상태 복원**:
       - workspaces 배열을 순회하며 `workspace-collapsed-${workspaceId}` 확인
       - `true`가 아니면 expandedWorkspaces Set에 추가 (기본: 펼쳐짐)
       - 각 페이지도 동일하게 `page-collapsed-${pageId}` 확인
    
    2. **선택된 페이지 복원 (우선순위)**:
       - URL 파라미터 (initialSelectedPageId) 확인 → 있으면 선택
       - 쿠키 (`recent-page-${orgId}`) 확인 → 유효하면 선택
       - Fallback: Default Workspace의 첫 번째 페이지 선택
    
    3. **선택된 페이지의 Workspace 자동 펼치기**:
       - 선택된 페이지가 속한 Workspace를 expandedWorkspaces에 추가
       - 부모 페이지들도 자동으로 펼치기 (ancestor path)
  
  - **selectPage 액션**:
    ```typescript
    const selectPage = (pageId: string, workspaceId: string) => {
      // 1. 페이지가 workspaces 배열에 존재하는지 확인
      // 2. 상태 업데이트: selectedPageId, selectedWorkspaceId
      // 3. 쿠키에 저장: setCookieValue(`recent-page-${orgId}`, pageId)
      // 4. 해당 Workspace 자동 펼치기
      // 5. 부모 페이지들 자동 펼치기 (재귀적으로 ancestor 찾기)
      // 6. URL 변경: router.push(`/r/${orgId}/workspace/${workspaceId}/page/${pageId}`)
    };
    ```
  
  - **toggleWorkspace 액션**:
    ```typescript
    const toggleWorkspace = (workspaceId: string) => {
      // 1. expandedWorkspaces Set에서 추가/제거 토글
      // 2. 로컬스토리지에 저장: localStorage.setItem(`workspace-collapsed-${workspaceId}`, isCollapsed)
    };
    ```
  
  - **togglePage 액션**:
    ```typescript
    const togglePage = (pageId: string) => {
      // 1. expandedPages Set에서 추가/제거 토글
      // 2. 로컬스토리지에 저장: localStorage.setItem(`page-collapsed-${pageId}`, isCollapsed)
    };
    ```
  
  - **refreshWorkspacePages 액션**:
    ```typescript
    const refreshWorkspacePages = async () => {
      // 1. isLoading = true
      // 2. getWorkspacePagesAction() 호출
      // 3. workspaces 상태 업데이트
      // 4. isLoading = false
      // 5. 에러 처리
    };
    ```
  
  - **createWorkspace 액션** (Scenario 2):
    ```typescript
    const createWorkspace = async (request: CreateWorkspaceRequest) => {
      // 1. isLoading = true
      // 2. createWorkspaceAction(request) 호출
      // 3. 성공 시:
      //    - workspaces 배열에 새 Workspace 추가 (optimistic update)
      //    - selectPage(firstPageId, workspaceId) 호출
      //    - toast.success("워크스페이스가 생성되었습니다")
      // 4. 실패 시:
      //    - toast.error(에러 메시지)
      // 5. isLoading = false
    };
    ```
  
  - **updateWorkspaceInfo 액션** (Scenario 2):
    ```typescript
    const updateWorkspaceInfo = async (request: UpdateWorkspaceInfoRequest) => {
      // 1. isLoading = true
      // 2. updateWorkspaceInfoAction(request) 호출
      // 3. 성공 시:
      //    - workspaces 배열에서 해당 Workspace 찾아 업데이트
      //    - toast.success("워크스페이스 정보가 업데이트되었습니다")
      // 4. 실패 시:
      //    - toast.error(에러 메시지)
      // 5. isLoading = false
    };
    ```
  
  - **inviteMembers 액션** (Scenario 3):
    ```typescript
    const inviteMembers = async (workspaceId: string, emails: string[]) => {
      // 1. isLoading = true
      // 2. inviteWorkspaceMemberAction({ workspaceId, memberEmails: emails }) 호출
      // 3. 성공 시:
      //    - toast.success(`${count}명에게 초대를 보냈습니다`)
      // 4. 실패 시:
      //    - toast.error(에러 메시지)
      // 5. isLoading = false
    };
    ```
  
  - **searchOrganizationMembers 액션** (Scenario 3):
    ```typescript
    const searchOrganizationMembers = async (workspaceId: string, query: string) => {
      // 1. debounce 300ms
      // 2. searchOrganizationMembersAction({ workspaceId, query }) 호출
      // 3. OrganizationMemberSearchResultDTO[] 반환
      // 4. 이미 Workspace 멤버인 경우 isAlreadyMember=true 표시
    };
    ```
  
  - **acceptInvitation 액션** (Scenario 3):
    ```typescript
    const acceptInvitation = async (invitationId: string) => {
      // 1. isLoading = true
      // 2. acceptWorkspaceInvitationAction(invitationId) 호출
      // 3. 성공 시:
      //    - refreshWorkspacePages() 호출 (사이드바 Workspace 목록 갱신)
      //    - toast.success("Workspace에 참여했습니다")
      // 4. 실패 시:
      //    - toast.error(에러 메시지)
      // 5. isLoading = false
    };
    ```
  
  - **rejectInvitation 액션** (Scenario 3):
    ```typescript
    const rejectInvitation = async (invitationId: string) => {
      // 1. isLoading = true
      // 2. rejectWorkspaceInvitationAction(invitationId) 호출
      // 3. 성공 시:
      //    - toast.success("초대를 거절했습니다")
      // 4. 실패 시:
      //    - toast.error(에러 메시지)
      // 5. isLoading = false
    };
    ```
  
  - **createPage 액션** (Scenario 4):
    ```typescript
    const createPage = async (workspaceId: string, parentId?: string) => {
      // 1. Optimistic update: workspaces 배열에 임시 페이지 추가
      // 2. createPageAction({ workspaceId, parentId }) 호출
      // 3. 성공 시:
      //    - 임시 페이지를 실제 페이지로 교체
      //    - 자동 선택 및 편집 모드 활성화
      // 4. 실패 시:
      //    - toast.error("페이지 생성에 실패했습니다")
      //    - 임시 페이지 제거 (rollback)
    };
    ```
  
  - **movePage 액션** (Scenario 4):
    ```typescript
    const movePage = async (pageId: string, newParentId?: string) => {
      // 1. Optimistic update: workspaces 배열에서 페이지 이동
      // 2. movePageAction({ pageId, newParentId }) 호출
      // 3. 성공 시:
      //    - 위치 유지 (no toast)
      // 4. 실패 시:
      //    - toast.error("페이지를 이동할 수 없습니다")
      //    - 원래 위치로 복원 (rollback)
    };
    ```
  
  - **updatePageInfo 액션** (Scenario 4):
    ```typescript
    const updatePageInfo = async (pageId: string, title?: string, icon?: string) => {
      // 1. Optimistic update: 제목/아이콘 즉시 변경
      // 2. updatePageInfoAction({ pageId, title, icon }) 호출
      // 3. 성공 시:
      //    - 변경 유지 (no toast)
      // 4. 실패 시:
      //    - toast.error("페이지 수정에 실패했습니다")
      //    - 원래 값으로 복원 (rollback)
    };
    ```
  
  - **togglePageFavorite 액션** (Scenario 5):
    ```typescript
    const togglePageFavorite = async (pageId: string) => {
      // 1. Optimistic update: isFavorite 토글 (workspaces 배열에서)
      // 2. togglePageFavoriteAction(pageId) 호출
      // 3. 성공 시:
      //    - 변경 유지 (no toast)
      //    - 즐겨찾기 섹션 자동 업데이트
      // 4. 실패 시:
      //    - toast.error("즐겨찾기 변경에 실패했습니다")
      //    - 원래 상태로 복원 (rollback)
    };
    ```

- **Props**:
  - children: React.ReactNode
  - initialWorkspaces: WorkspaceWithPagesDTO[] (Server Component에서 전달)
  - initialSelectedPageId?: string | null (URL 파라미터)
  - organizationId: string (쿠키 키 생성용)
  - userRole?: 'owner' | 'admin' | 'member' (권한별 UI 제어용)

- **특징**:
  - Organization Context 패턴을 따름
  - 로컬스토리지 기반 UI 상태 영속성 (접기/펼치기)
  - 쿠키 기반 선택 상태 영속성 (최근 방문 페이지)
  - 선택된 페이지의 ancestor 자동 펼치기 (UX 향상)
  - Optimistic update 지원 (Scenario 4, 5)
  - useTransition으로 로딩 상태 관리
  - 권한별 UI 제어 (userRole prop)

**구현 플로우**:
1. Server Component에서 `initialWorkspaces` + `userRole` 전달
2. useState로 상태 초기화
3. useEffect에서 로컬스토리지/쿠키 기반 상태 복원
4. Context Provider로 하위 컴포넌트에 상태 전달
5. Actions를 통해 상태 업데이트 및 영속성 처리
6. Optimistic update로 즉시 UI 반영 (Scenario 4, 5)

---

## 🪝 Custom Hooks 설계

> **가이드 참조**: Phase 2.4 Part 2 - Custom Hooks 설계

### 1. 메인 Hook

#### useWorkspace Hook

- **파일 위치**: `src/domains/workspace-management/frontend/hooks/use-workspace.ts`
- **역할**: WorkspaceContext를 사용하기 쉽게 추상화한 메인 Hook
- **주요 기능**:
  - Context 상태 및 Actions 접근
  - 선택된 페이지 정보 추출 (useMemo)
  - Default Workspace 추출 (useMemo)
  - 즐겨찾기 페이지 추출 (useMemo)
  - 비즈니스 로직 메서드 제공

- **제공 속성 및 메서드**:
  
  **기본 상태** (Context에서 직접 전달):
  - workspaces: WorkspaceWithPagesDTO[]
  - selectedPageId: string | null
  - selectedWorkspaceId: string | null
  - expandedWorkspaces: Set\<string\>
  - expandedPages: Set\<string\>
  - isLoading: boolean
  - error: string | null
  
  **Actions** (Context에서 직접 전달):
  - **Scenario 1**:
    - selectPage(pageId, workspaceId): void
    - toggleWorkspace(workspaceId): void
    - togglePage(pageId): void
    - refreshWorkspacePages(): Promise\<void\>
  - **Scenario 2**:
    - createWorkspace(request): Promise\<void\>
    - updateWorkspaceInfo(request): Promise\<void\>
  - **Scenario 3**:
    - inviteMembers(workspaceId, emails): Promise\<void\>
    - searchOrganizationMembers(workspaceId, query): Promise\<OrganizationMemberSearchResultDTO[]\>
    - acceptInvitation(invitationId): Promise\<void\>
    - rejectInvitation(invitationId): Promise\<void\>
  - **Scenario 4**:
    - createPage(workspaceId, parentId?): Promise\<void\>
    - movePage(pageId, newParentId?): Promise\<void\>
    - updatePageInfo(pageId, title?, icon?): Promise\<void\>
  - **Scenario 5**:
    - togglePageFavorite(pageId): Promise\<void\>
  
  **계산된 속성** (useMemo로 최적화):
  - **selectedPage**: PageTreeNodeDTO | null
    ```typescript
    useMemo(() => {
      if (!selectedPageId) return null;
      // workspaces 배열에서 selectedPageId로 페이지 찾기 (재귀 검색)
      return findPageById(workspaces, selectedPageId);
    }, [workspaces, selectedPageId]);
    ```
  
  - **selectedWorkspace**: WorkspaceWithPagesDTO | null
    ```typescript
    useMemo(() => {
      if (!selectedWorkspaceId) return null;
      return workspaces.find(ws => ws.workspaceId === selectedWorkspaceId) || null;
    }, [workspaces, selectedWorkspaceId]);
    ```
  
  - **defaultWorkspace**: WorkspaceWithPagesDTO | null
    ```typescript
    useMemo(() => {
      return workspaces.find(ws => ws.isDefault) || null;
    }, [workspaces]);
    ```
  
  - **favoritePages**: PageTreeNodeDTO[]
    ```typescript
    useMemo(() => {
      // 모든 workspaces에서 isFavorite=true인 페이지만 추출 (플랫 리스트)
      const favorites: PageTreeNodeDTO[] = [];
      workspaces.forEach(ws => {
        collectFavoritePages(ws.pageTree, favorites);
      });
      return favorites;
    }, [workspaces]);
    ```
  
  **유틸리티 메서드**:
  - **isWorkspaceExpanded**(workspaceId: string): boolean
    ```typescript
    return expandedWorkspaces.has(workspaceId);
    ```
  
  - **isPageExpanded**(pageId: string): boolean
    ```typescript
    return expandedPages.has(pageId);
    ```
  
  - **findPageById**(pageId: string): PageTreeNodeDTO | null
    ```typescript
    // workspaces 배열에서 재귀적으로 페이지 찾기
    ```
  
  - **getWorkspaceByPage**(pageId: string): WorkspaceWithPagesDTO | null
    ```typescript
    // 페이지 ID로 해당 Workspace 찾기
    ```
  
  - **canCreateWorkspace**(): boolean (Scenario 2)
    ```typescript
    // 조직 소유자만 true 반환
    return userRole === 'owner';
    ```
  
  - **canInviteMembers**(workspaceId: string): boolean (Scenario 3)
    ```typescript
    // 조직 Admin + Workspace 멤버만 true 반환
    const isAdmin = userRole === 'owner' || userRole === 'admin';
    const isMember = checkWorkspaceMembership(workspaceId);
    return isAdmin && isMember;
    ```
  
  - **canEditPage**(pageId: string): boolean (Scenario 4)
    ```typescript
    // Workspace 멤버만 true 반환
    const workspace = getWorkspaceByPage(pageId);
    return checkWorkspaceMembership(workspace?.workspaceId);
    ```

- **반환값**: 
  ```typescript
  {
    // 기본 상태
    workspaces,
    selectedPageId,
    selectedWorkspaceId,
    expandedWorkspaces,
    expandedPages,
    isLoading,
    error,
    
    // Actions (Scenario 1)
    selectPage,
    toggleWorkspace,
    togglePage,
    refreshWorkspacePages,
    
    // Actions (Scenario 2)
    createWorkspace,
    updateWorkspaceInfo,
    
    // Actions (Scenario 3)
    inviteMembers,
    searchOrganizationMembers,
    acceptInvitation,
    rejectInvitation,
    
    // Actions (Scenario 4)
    createPage,
    movePage,
    updatePageInfo,
    
    // Actions (Scenario 5)
    togglePageFavorite,
    
    // 계산된 속성
    selectedPage,
    selectedWorkspace,
    defaultWorkspace,
    favoritePages,
    
    // 유틸리티
    isWorkspaceExpanded,
    isPageExpanded,
    findPageById,
    getWorkspaceByPage,
    canCreateWorkspace,
    canInviteMembers,
    canEditPage,
  }
  ```

- **특징**:
  - Organization의 useOrganization Hook 패턴을 따름
  - Context를 직접 사용하지 않고 Hook을 통해 접근
  - useMemo로 불필요한 재계산 방지
  - 재귀 검색 로직을 Hook에 캡슐화

**사용 시나리오**:
- **Scenario 1**: WorkspacePageTree, PageViewer, FavoriteSection
- **Scenario 2**: CreateWorkspaceDialog, WorkspaceSettingsDialog
- **Scenario 3**: InviteMemberDialog, InvitationDetailDialog
- **Scenario 4**: PageTreeWithActions, InlinePageEditor
- **Scenario 5**: PageHeaderWithFavorite

---

### 2. Context Hook

#### useWorkspaceContext Hook

- **파일 위치**: `src/domains/workspace-management/frontend/contexts/workspace-context.tsx`
- **역할**: WorkspaceContext 접근을 위한 내부 Hook
- **주요 기능**:
  - useContext를 통해 Context 접근
  - Provider 외부 사용 시 에러 발생
  ```typescript
  export function useWorkspaceContext() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
      throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
    }
    return context;
  }
  ```
- **특징**:
  - 타입 안전성 보장
  - Provider 누락 시 명확한 에러 메시지
  - useWorkspace Hook에서 내부적으로 사용

---

## 🎨 UI 컴포넌트 설계

> **가이드 참조**: Phase 2.4 Part 3 - 컴포넌트 연동

### 1. 사이드바 섹션 구조

#### WorkspaceSidebarContent

- **파일 위치**: `src/domains/workspace-management/frontend/components/sidebar/workspace-sidebar-content.tsx`
- **역할**: DashboardSidebar의 SidebarContent 영역에 들어가는 메인 컴포넌트
- **주요 기능**:
  - shadcn/ui Sidebar의 SidebarGroup으로 섹션 분리
  - 즐겨찾기 섹션 (독립적인 SidebarGroup)
  - Workspace 섹션 (독립적인 SidebarGroup)
  - **+ 버튼** (Scenario 2: Workspace 생성)
  - 로딩 상태 처리 (Skeleton)
  - 에러 상태 처리

- **사용 Hook**: useWorkspace()

- **UI 라이브러리**: 
  - shadcn/ui Sidebar 컴포넌트
  - SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarGroupAction
  - SidebarMenu, SidebarMenuItem, SidebarMenuButton
  - Skeleton (로딩 상태)

- **구조**:
  ```tsx
  const { canCreateWorkspace, createWorkspace } = useWorkspace();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  return (
    <>
      {/* 섹션 1: 즐겨찾기 (Scenario 5) */}
      <SidebarGroup>
        <SidebarGroupLabel>⭐ 즐겨찾기</SidebarGroupLabel>
        <SidebarGroupContent>
          <FavoritePageList />
        </SidebarGroupContent>
      </SidebarGroup>
      
      <Separator />
      
      {/* 섹션 2: Workspaces (Scenario 1, 2) */}
      <SidebarGroup>
        <SidebarGroupLabel>📁 Workspaces</SidebarGroupLabel>
        
        {/* + 버튼 (조직 소유자만) - Scenario 2 */}
        {canCreateWorkspace() && (
          <SidebarGroupAction
            aria-label="Add Workspace"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="size-4 text-muted-foreground hover:text-foreground" />
          </SidebarGroupAction>
        )}
        
        <SidebarGroupContent>
          <WorkspacePageTree />
        </SidebarGroupContent>
      </SidebarGroup>
      
      {/* Workspace 생성 모달 (Scenario 2) */}
      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </>
  );
  ```

- **특징**:
  - shadcn/ui Sidebar의 SidebarGroup으로 섹션 명확히 분리
  - 각 섹션은 독립적인 컴포넌트로 관리
  - 일관된 Sidebar 디자인 패턴 유지
  - **+ 버튼 권한 기반 표시** (canCreateWorkspace)
  - **CreateWorkspaceDialog 통합** (Scenario 2)

**사용 위치**:
- DashboardSidebar의 SidebarContent

---

#### FavoritePageList

- **파일 위치**: `src/domains/workspace-management/frontend/components/favorite-page-list.tsx`
- **역할**: 즐겨찾기 페이지 목록을 표시하는 컴포넌트 (SidebarGroup 내부)
- **주요 기능**:
  - 즐겨찾기 페이지 플랫 리스트 표시
  - 페이지 클릭 시 해당 Workspace로 이동 및 자동 펼치기
  - 빈 상태 처리 ("즐겨찾기한 페이지가 없습니다")

- **사용 Hook**: useWorkspace()

- **UI 라이브러리**:
  - SidebarMenu, SidebarMenuItem, SidebarMenuButton

- **구조**:
  ```tsx
  <SidebarMenu>
    {favoritePages.length === 0 ? (
      <div className="px-2 py-1 text-xs text-muted-foreground">
        즐겨찾기한 페이지가 없습니다
      </div>
    ) : (
      favoritePages.map(page => (
        <SidebarMenuItem key={page.id}>
          <SidebarMenuButton
            onClick={() => selectPage(page.id, getWorkspaceIdByPage(page.id))}
            isActive={selectedPageId === page.id}
            tooltip={page.title}
          >
            <PageIcon icon={page.icon} size={16} />
            <span className="truncate">{page.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))
    )}
  </SidebarMenu>
  ```

- **특징**:
  - shadcn/ui SidebarMenu 패턴 사용
  - Workspace 구분 없이 플랫 리스트
  - 클릭 시 selectPage 호출 → 해당 Workspace가 자동으로 펼쳐짐
  - SidebarMenuButton의 isActive로 선택 상태 표시

---

### 2. Workspace-Page 트리 컴포넌트

#### WorkspacePageTree

- **파일 위치**: `src/domains/workspace-management/frontend/components/workspace-page-tree.tsx`
- **역할**: 모든 Workspace와 페이지 트리를 표시하는 컴포넌트
- **주요 기능**:
  - Workspace 목록 표시 (Default Workspace 우선)
  - 각 Workspace의 페이지 트리 표시
  - 빈 Workspace 처리 ("페이지를 생성하세요")

- **사용 Hook**: useWorkspace()

- **UI 라이브러리**:
  - SidebarMenu

- **구조**:
  ```tsx
  <SidebarMenu>
    {workspaces.map(workspace => (
      <WorkspaceItem key={workspace.workspaceId} workspace={workspace} />
    ))}
  </SidebarMenu>
  ```

- **특징**:
  - workspaces 배열을 순회하며 WorkspaceItem 렌더링
  - Default Workspace는 배열 첫 번째에 위치 (서버에서 정렬)

---

#### WorkspaceItem

- **파일 위치**: `src/domains/workspace-management/frontend/components/sidebar/workspace-item.tsx`
- **역할**: 개별 Workspace와 하위 페이지 트리를 표시하는 컴포넌트
- **주요 기능**:
  - Workspace 헤더 표시 (이름, 아이콘, Chevron)
  - 접기/펼치기 토글 (Collapsible)
  - **삼점 메뉴** (WorkspaceContextMenu) - Scenario 2, 3
  - PageTree 컴포넌트로 페이지 트리 렌더링
  - Default Workspace 표시 ("기본" 배지)
  - 빈 Workspace 처리

- **사용 Hook**: useWorkspace()

- **Props**:
  - workspace: WorkspaceWithPagesDTO

- **구조**:
  ```tsx
  <Collapsible open={isWorkspaceExpanded(workspace.workspaceId)}>
    <CollapsibleTrigger onClick={() => toggleWorkspace(workspace.workspaceId)}>
      <div className="flex items-center justify-between w-full group">
        <div className="flex items-center gap-2">
          <Chevron className={isExpanded ? 'rotate-90' : ''} />
          <WorkspaceIcon icon={workspace.icon} />
          <span>{workspace.name}</span>
          {workspace.isDefault && <Badge variant="secondary">기본</Badge>}
        </div>
        
        {/* 삼점 메뉴 (Scenario 2, 3) */}
        <WorkspaceContextMenu workspace={workspace} />
      </div>
    </CollapsibleTrigger>
    
    <CollapsibleContent>
      {workspace.pageTree.length === 0 ? (
        <div className="empty-state text-xs text-muted-foreground px-2 py-1">
          페이지를 생성하세요
        </div>
      ) : (
        <PageTreeWithActions
          workspaceId={workspace.workspaceId}
          pages={workspace.pageTree}
          selectedPageId={selectedPageId}
          expandedPageIds={expandedPages}
          onSelectPage={(pageId) => selectPage(pageId, workspace.workspaceId)}
          onTogglePage={togglePage}
          enableDragDrop={canEditPage(selectedPageId)}
        />
      )}
    </CollapsibleContent>
  </Collapsible>
  ```

- **특징**:
  - Collapsible로 접기/펼치기 애니메이션
  - Chevron 아이콘 회전 (› → ∨)
  - Default Workspace는 조직 아이콘 사용
  - **삼점 메뉴 통합** (Scenario 2, 3)
  - **PageTreeWithActions 사용** (Scenario 4 지원)

---

### 3. PageTree 컴포넌트 (Workspace Management 전용)

> **설계 배경**: 
> - 기존 react-flow-canvas의 ExplorerTree는 범용적이나, Workspace Management 요구사항과 불일치
> - 드래그앤드롭, 폴더/파일 구분, 다중 선택 등 불필요한 기능 포함
> - Workspace Management Domain에 최적화된 **전용 PageTree 컴포넌트**를 새로 설계

#### 🚨 기존 ExplorerTree의 문제점

| 문제점 | 설명 | 해결 방법 |
|--------|------|----------|
| **1. 드래그앤드롭 강제 활성화** | `dragAndDropFeature`가 항상 포함됨 (Scenario 1에서는 불필요) | Props로 조건부 활성화 (`enableDragDrop`) |
| **2. 폴더/파일 구분** | `isFolder` 로직 + 폴더 우선 정렬 (페이지는 모두 동일 타입) | 폴더 개념 제거, `order` 필드로만 정렬 |
| **3. 폴더 아이콘 하드코딩** | `FolderOpen/Folder` 아이콘 고정 | 모든 페이지가 커스텀 아이콘 사용 |
| **4. Root 노드 고정** | `root` ID로 하드코딩, 이름 변경 불가 | Root 제거, 최상위 페이지 직접 렌더링 |
| **5. 펼치기/접기 내부 관리** | `expandedItems`가 내부 상태로만 관리 | WorkspaceContext와 동기화 (로컬스토리지 연동) |
| **6. 다중 선택 로직** | Shift/Ctrl 클릭 지원 | 단일 선택만 지원 |
| **7. 불필요한 Props** | `disableFolderStructure`, `itemType`, `rootName` 등 | Workspace 전용 Props로 단순화 |

---

#### PageTree 컴포넌트 구조

**파일 위치**: `src/domains/workspace-management/frontend/components/page-tree/`

```
page-tree/
├── page-tree.tsx                    # 메인 컴포넌트 (@headless-tree/core 통합)
├── page-tree-context.tsx            # Context (단순화)
├── page-tree-item.tsx               # 개별 페이지 아이템 렌더러
├── page-tree-controls.tsx           # Chevron 컨트롤 (ExplorerTree에서 재사용)
├── use-page-tree-data.tsx           # 트리 데이터 변환 로직
├── types.ts                         # 타입 정의
└── utils.ts                         # flattenPageTree 유틸리티
```

---

#### PageTree (메인 컴포넌트)

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-tree/page-tree.tsx`
- **역할**: Workspace의 페이지 트리를 렌더링하는 전용 컴포넌트
- **주요 기능**:
  - @headless-tree/core 기반 트리 렌더링
  - WorkspaceContext와 완전 통합
  - 로컬스토리지 기반 펼치기/접기 상태 동기화
  - 단일 페이지 선택
  - 드래그앤드롭 조건부 활성화 (Scenario 4 대비)

- **Props**:
  ```typescript
  interface PageTreeProps {
    workspaceId: string;                          // 페이지가 속한 Workspace ID
    pages: PageTreeNodeDTO[];                     // 페이지 트리 (재귀 구조)
    selectedPageId?: string;                      // 선택된 페이지 ID (Context에서 전달)
    expandedPageIds: Set<string>;                 // 펼쳐진 페이지 IDs (Context에서 전달)
    onSelectPage: (pageId: string) => void;       // 페이지 선택 핸들러
    onTogglePage: (pageId: string) => void;       // 페이지 펼치기/접기 핸들러
    enableDragDrop?: boolean;                     // 드래그앤드롭 활성화 (기본: false)
    indent?: number;                              // 들여쓰기 (기본: 16px)
  }
  ```

- **@headless-tree/core 설정**:
  ```tsx
  const tree = useTree({
    initialState: {
      expandedItems: Array.from(expandedPageIds),  // Context에서 전달
      selectedItems: selectedPageId ? [selectedPageId] : [],
    },
    indent: indent ?? 16,
    rootItemId: workspaceId,                       // Workspace ID를 root로 사용
    getItemName: item => item.getItemData()?.title ?? 'Unknown',
    isItemFolder: item => {
      const data = item.getItemData();
      return (data?.children?.length ?? 0) > 0;    // 자식이 있으면 폴더
    },
    canReorder: enableDragDrop ?? false,           // 드래그앤드롭 조건부
    canDrop: enableDragDrop ? (dragItems, target) => {
      // Scenario 4에서 구현
      return true;
    } : undefined,
    onDrop: enableDragDrop ? createOnDropHandler((parentItem, newChildrenIds) => {
      // Scenario 4에서 구현: Server Action 호출하여 순서 변경
    }) : undefined,
    dataLoader: {
      getItem: (itemId) => treeData[itemId],
      getChildren: (itemId) => treeData[itemId]?.children ?? [],
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      ...(enableDragDrop ? [dragAndDropFeature, keyboardDragAndDropFeature] : []),
      customClickBehavior,
    ],
  });
  ```

- **Context 동기화**:
  ```tsx
  // 선택 상태 동기화
  useEffect(() => {
    if (selectedPageId) {
      tree.setSelectedItems([selectedPageId]);
    } else {
      tree.setSelectedItems([]);
    }
  }, [selectedPageId, tree]);
  
  // 펼치기/접기 상태 동기화
  useEffect(() => {
    tree.setExpandedItems(Array.from(expandedPageIds));
  }, [expandedPageIds, tree]);
  ```

- **특징**:
  - ✅ Workspace Management Domain 전용 설계
  - ✅ Context와 완전 통합 (상태 동기화)
  - ✅ 드래그앤드롭 조건부 활성화
  - ✅ 단일 선택만 지원 (다중 선택 제거)
  - ✅ Root 노드 제거 (Workspace ID를 root로 사용)
  - ✅ 키보드 내비게이션 자동 지원 (@headless-tree/core)

---

#### PageTreeItem

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-tree/page-tree-item.tsx`
- **역할**: 개별 페이지 아이템을 렌더링하는 컴포넌트
- **주요 기능**:
  - 페이지 아이콘 렌더링 (폴더 아이콘 제거)
  - Chevron 표시 (자식이 있는 경우만)
  - 선택 상태 표시
  - 클릭 이벤트 처리

- **구조**:
  ```tsx
  <TreeItem item={item}>
    <div className="flex items-center gap-1.5 w-full">
      {/* Chevron (자식이 있는 경우만) */}
      {hasChildren && <PageTreeControls item={item} />}
      
      {/* 페이지 아이콘 */}
      <PageIcon icon={page?.icon} className="size-3.5" />
      
      {/* 페이지 제목 */}
      <span className="truncate text-xs">{page?.title}</span>
    </div>
  </TreeItem>
  ```

- **차이점 (vs ExplorerTree)**:
  - ❌ 폴더 아이콘 제거 (`FolderOpen/Folder`)
  - ✅ 모든 페이지가 커스텀 아이콘 사용
  - ✅ Workspace의 페이지 데이터에 최적화

---

#### PageTreeControls

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-tree/page-tree-controls.tsx`
- **역할**: Chevron 아이콘 및 펼치기/접기 제어
- **특징**: ExplorerTree의 `TreeControls`와 동일 (재사용 가능)

- **구조**:
  ```tsx
  <Button
    variant="ghost"
    size="sm"
    className="size-4 p-0"
    onClick={(e) => {
      e.stopPropagation();
      if (item.isExpanded()) {
        item.collapse();
        onTogglePage(item.getId()); // Context 업데이트
      } else {
        item.expand();
        onTogglePage(item.getId()); // Context 업데이트
      }
    }}
  >
    <ChevronDown
      className={cn(
        "size-4 transition-transform",
        !item.isExpanded() && "rotate(-90deg)"
      )}
    />
  </Button>
  ```

---

#### usePageTreeData

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-tree/use-page-tree-data.tsx`
- **역할**: PageTreeNodeDTO를 @headless-tree/core가 요구하는 형태로 변환
- **주요 로직**:
  ```typescript
  export function usePageTreeData(pages: PageTreeNodeDTO[]) {
    const treeData = useMemo(() => {
      const nodeMap: Record<string, PageTreeItem> = {};
      const flatPages = flattenPageTree(pages); // 재귀 → 플랫
      
      flatPages.forEach(page => {
        nodeMap[page.id] = {
          id: page.id,
          title: page.title,
          icon: page.icon,
          children: [],  // 나중에 채움
          parentId: page.parentId,
          order: page.order,
          isFavorite: page.isFavorite,
        };
      });
      
      // children 배열 구성
      flatPages.forEach(page => {
        if (page.parentId) {
          const parent = nodeMap[page.parentId];
          if (parent) {
            parent.children.push(page.id);
          }
        }
      });
      
      // order 필드로 정렬 (폴더 우선 정렬 제거)
      Object.values(nodeMap).forEach(node => {
        node.children.sort((a, b) => {
          const orderA = nodeMap[a]?.order ?? 0;
          const orderB = nodeMap[b]?.order ?? 0;
          return orderA - orderB;
        });
      });
      
      return nodeMap;
    }, [pages]);
    
    return { treeData };
  }
  ```

- **차이점 (vs ExplorerTree)**:
  - ❌ `isFolder` 로직 제거
  - ❌ 폴더 우선 정렬 제거
  - ✅ `order` 필드로만 정렬 (Software Design과 일치)
  - ✅ Root 노드 제거

---

#### flattenPageTree 유틸리티

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-tree/utils.ts`
- **역할**: 재귀 트리를 플랫 배열로 변환
- **로직**:
  ```typescript
  export function flattenPageTree(tree: PageTreeNodeDTO[]): PageFlatItem[] {
    const result: PageFlatItem[] = [];
    
    function traverse(nodes: PageTreeNodeDTO[], parentId: string | null = null) {
      nodes.forEach((node, index) => {
        result.push({
          id: node.id,
          title: node.title,
          icon: node.icon,
          parentId: node.parentId ?? parentId,  // DTO에서 직접 가져옴
          order: node.order ?? index,            // DTO에서 직접 가져옴
          isFavorite: node.isFavorite,
          lastModified: node.lastModified,
        });
        
        if (node.children && node.children.length > 0) {
          traverse(node.children, node.id);
        }
      });
    }
    
    traverse(tree);
    return result;
  }
  
  interface PageFlatItem {
    id: string;
    title: string;
    icon?: string;
    parentId: string | null;
    order: number;
    isFavorite: boolean;
    lastModified: string;
  }
  ```

---

#### PageTree 사용 예시

**WorkspaceItem.tsx에서 사용**:
```tsx
<CollapsibleContent>
  {workspace.pageTree.length === 0 ? (
    <div className="empty-state">페이지를 생성하세요</div>
  ) : (
    <PageTree
      workspaceId={workspace.workspaceId}
      pages={workspace.pageTree}
      selectedPageId={selectedPageId}
      expandedPageIds={expandedPages}
      onSelectPage={(pageId) => selectPage(pageId, workspace.workspaceId)}
      onTogglePage={togglePage}
      enableDragDrop={false}  // Scenario 1에서는 false
    />
  )}
</CollapsibleContent>
```

---

#### PageTree 장점 요약

| 항목 | ExplorerTree (범용) | PageTree (전용) |
|------|---------------------|-----------------|
| **드래그앤드롭** | 항상 활성화 | 조건부 활성화 (Props) |
| **폴더/파일 구분** | 폴더 우선 정렬 | 구분 없음 (order로만 정렬) |
| **아이콘** | 폴더 아이콘 하드코딩 | 모든 페이지 커스텀 아이콘 |
| **Root 노드** | 'root' ID 고정 | Workspace ID 사용 |
| **펼치기/접기** | 내부 상태만 | Context + 로컬스토리지 동기화 |
| **선택** | 다중 선택 지원 | 단일 선택만 |
| **복잡도** | 높음 (범용 설계) | 낮음 (도메인 특화) |
| **유지보수성** | react-flow-canvas 의존 | 독립적 발전 가능 |

---

#### 구현 우선순위 (Scenario별)

1. **Scenario 1** (현재): 
   - `enableDragDrop={false}`
   - 페이지 조회, 선택, 펼치기/접기만 구현
   
2. **Scenario 4** (미래):
   - `enableDragDrop={true}`
   - `onDrop` 핸들러 구현: Server Action 호출하여 페이지 이동

---

### 4. 페이지 뷰어 컴포넌트

#### PageViewer

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-viewer/page-viewer.tsx`
- **역할**: 선택된 페이지의 상세 정보를 메인 영역에 표시하는 컴포넌트
- **주요 기능**:
  - WorkspaceHeader 표시 (Breadcrumb)
  - PageHeader 표시 (제목, 아이콘, 즐겨찾기)
  - PageCanvas 표시 (미래 - Block System)
  - 로딩 상태 처리 (Skeleton)
  - 권한 없음 처리 (AccessDeniedPage)

- **사용 Hook**: useWorkspace()

- **구조**:
  ```
  Container (page-viewer)
    WorkspaceHeader
      - workspaceId, pageId 전달
      - Breadcrumb: SSOTA / Workspace / Page
    
    PageHeader
      - page 정보 전달
      - 제목, 아이콘, 즐겨찾기, 메타 정보
    
    PageCanvas
      - page 정보 전달
      - 캔버스 콘텐츠 (미래)
  ```

- **로딩 상태**:
  ```
  isLoading: PageViewerSkeleton
    - WorkspaceHeader Skeleton
    - PageHeader Skeleton
    - PageCanvas Skeleton
  ```

- **권한 없음**:
  ```
  !hasPermission: AccessDeniedPage
    - 권한 없음 메시지
  ```

**사용 위치**:
- `/r/[orgId]/workspace/[workspaceId]/page/[pageId]`: 메인 영역

---

#### WorkspaceHeader (레거시 활용)

- **파일 위치**: `src/domains/dashboard/components/layout/workspace-header.tsx` (기존)
- **역할**: Breadcrumb 형태로 Workspace → Page 경로 표시
- **주요 기능**:
  - SSOTA 브랜딩
  - Workspace 이름 + 아이콘 (Breadcrumb)
  - Page 제목 (Breadcrumb) - 확장 필요
  - 조직 선택 드롭다운 제거 (Organization Context에서 관리)

- **사용 Context**: useOrganizationContext(), useWorkspace()

- **Props**:
  - workspaceId: string
  - pageId?: string (선택사항)

- **구조** (확장):
  ```
  header (flex, h-12, border-b)
    Container (flex, items-center, gap-2, px-3)
      "SSOTA" (브랜딩)
      Separator (vertical)
      
      Breadcrumb
        BreadcrumbItem (Workspace)
          - BreadcrumbLink: /r/[orgId]/workspace/[workspaceId]
          - WorkspaceIcon + Workspace 이름
        
        BreadcrumbSeparator: "/"
        
        BreadcrumbItem (Page) - pageId 있는 경우
          - BreadcrumbPage: Page 제목
          - truncate 처리
  ```

- **특징**:
  - 레거시 코드 재사용 (기존 Breadcrumb 구조)
  - pageId props 추가 (선택사항)
  - Page Breadcrumb 추가 (주석 부분 구현)
  - Organization Context와 Workspace Context 통합

**사용 위치**:
- PageViewer: 최상단 (페이지 경로 표시)

---

#### PageHeader

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-viewer/page-header.tsx`
- **역할**: 페이지 제목, 아이콘, 즐겨찾기 인라인 편집 컴포넌트
- **주요 기능**:
  - 페이지 아이콘 표시 (클릭 시 IconPicker - Scenario 4)
  - 페이지 제목 표시 (클릭 시 인라인 편집 - Scenario 4)
  - **즐겨찾기 Star 아이콘** (Scenario 5)
  - 마지막 수정 시간 표시

- **사용 Hook**: useWorkspace()

- **Props**:
  - page: PageTreeNodeDTO | PageDetailsDTO

- **구조** (Scenario 4, 5 통합):
  ```
  Container (flex, justify-between, px-24, py-4)
    좌측 영역 (flex, items-center, gap-3)
      아이콘 (클릭 시 IconPicker)
        - canEditPage: Popover + IconPicker
        - 읽기 전용: PageIcon
      
      제목 (클릭 시 인라인 편집)
        - isEditingTitle: Input (autoFocus, onKeyDown, onBlur)
        - 읽기 전용: h1 (canEditPage 시 hover 효과)
      
      메타 정보
        - 마지막 수정 시간 (상대 시간)
    
    우측 영역
      즐겨찾기 Star 아이콘
        - canEditPage: Button + Star 아이콘
        - isFavorite: 채워진 Star (노란색)
        - !isFavorite: 빈 Star (회색)
        - onClick: togglePageFavorite
        - sr-only: 접근성 레이블
  ```

- **로직 흐름**:
  ```
  아이콘 클릭:
    1. Popover 열기
    2. 이모지 선택
    3. updatePageInfo(pageId, undefined, icon)
    4. Optimistic update
  
  제목 클릭:
    1. setIsEditingTitle(true)
    2. Input 포커스
    3. Enter/blur: handleSaveTitle
       - updatePageInfo(pageId, title, undefined)
       - Optimistic update
    4. Escape: handleCancelEdit (복원)
  
  Star 클릭:
    1. togglePageFavorite(pageId)
    2. Optimistic update
    3. 사이드바 즐겨찾기 섹션 자동 업데이트
  ```

- **상태 관리**:
  - isEditingTitle: boolean
  - editingTitle: string

- **특징**:
  - **인라인 편집 통합** (Scenario 4)
  - **즐겨찾기 아이콘 통합** (Scenario 5)
  - 권한 기반 편집 가능 여부 제어
  - Optimistic update 지원
  - 호버 힌트 (배경 강조)

**사용 위치**:
- PageViewer: WorkspaceHeader 아래

---

#### AccessDeniedPage

- **파일 위치**: `src/domains/workspace-management/frontend/components/access-denied-page.tsx`
- **역할**: 권한 없음 화면을 표시하는 컴포넌트 (Screen 4)
- **주요 기능**:
  - 자물쇠 아이콘 표시
  - 권한 없음 메시지 표시
  - 안내 메시지 표시

- **Props**:
  - reason?: 'not_workspace_member' | 'not_organization_member'

- **구조**:
  ```tsx
  <div className="access-denied-page">
    <Lock className="icon" size={64} />
    <h2>이 페이지에 접근할 수 없습니다</h2>
    <p>Workspace에 초대되지 않았습니다</p>
    <p className="sub">조직 관리자에게 문의하세요</p>
  </div>
  ```

**사용 위치**:
- PageViewer: 권한 검증 실패 시

---

### 5. Workspace 관리 컴포넌트 (Scenario 2)

> **구현 패턴 참조**: Organization Domain의 CreateOrganizationDialog 패턴 적용

#### CreateWorkspaceDialog

- **파일 위치**: `src/domains/workspace-management/frontend/components/workspace/create-workspace-dialog.tsx`
- **역할**: 새 Workspace 생성 모달 (User Flow Screen 1)
- **주요 기능**:
  - react-hook-form + zod로 폼 유효성 검증
  - 이름, 설명, 아이콘 입력
  - Server Action 호출 (createWorkspace from useWorkspace Hook)
  - toast로 성공/실패 피드백
  - 로딩 상태 처리 (isSubmitting)

- **사용 Hook**: useWorkspace()
- **사용 라이브러리**: react-hook-form, zod, @hookform/resolvers/zod

- **Props**:
  - open: boolean
  - onOpenChange: (open: boolean) => void

- **UI 라이브러리**:
  - shadcn/ui Dialog, Form, FormField, FormItem, FormLabel, FormControl, FormMessage
  - shadcn/ui Input, Textarea, Button
  - 커스텀 IconPicker (이모지 선택)

- **폼 검증**:
  - react-hook-form + zod 사용 (Organization 패턴)
  - name: 1-100자 필수
  - description: 최대 500자 선택사항
  - icon: 선택사항

- **구조**:
  ```
  Dialog
    DialogHeader
      DialogTitle: "새 워크스페이스 만들기"
      DialogDescription: 설명 텍스트
    
    Form (react-hook-form)
      FormField (name)
        - Label: "워크스페이스 이름 *"
        - Input: placeholder, maxLength=100
        - FormMessage: 에러 표시
      
      FormField (description)
        - Label: "워크스페이스 설명"
        - Textarea: placeholder, rows=3, maxLength=500
        - 글자 수 표시: "0 / 500"
        - FormMessage: 에러 표시
      
      FormField (icon)
        - Label: "아이콘 선택"
        - IconPicker: defaultIcons=['📁', '🎨', '💼', '🏢', '📊', '🚀']
      
      DialogFooter
        - Button (취소): variant="outline", disabled={isSubmitting}
        - Button (생성): type="submit", disabled={isSubmitting}
          - 로딩 중: "생성 중..."
          - 기본: "생성하기"
  ```

- **로직 흐름**:
  ```
  1. 폼 제출 → handleSubmit
  2. isSubmitting = true
  3. createWorkspace(data) 호출 (useWorkspace Hook)
  4. 성공 시:
     - toast.success("워크스페이스가 생성되었습니다")
     - form.reset()
     - onOpenChange(false)
     - 자동으로 첫 페이지로 이동 (Hook 내부)
  5. 실패 시:
     - toast.error(에러 메시지)
     - 모달 유지
  6. isSubmitting = false
  ```

- **특징**:
  - ✅ react-hook-form + zod (Organization 패턴)
  - ✅ shadcn/ui Form 컴포넌트
  - ✅ toast 피드백 (sonner)
  - ✅ isSubmitting 상태 관리
  - ✅ 성공 시 폼 초기화 및 모달 닫기

**사용 위치**:
- WorkspaceSidebarContent: + 버튼 클릭 시

---

#### WorkspaceSettingsDialog

- **파일 위치**: `src/domains/workspace-management/frontend/components/workspace/workspace-settings-dialog.tsx`
- **역할**: Workspace 정보 수정 모달 (User Flow Screen 4)
- **주요 기능**:
  - 기존 정보 미리 채우기 (defaultValues)
  - 변경사항 감지 (form.formState.isDirty)
  - 부분 업데이트 지원
  - react-hook-form + zod 유효성 검증

- **사용 Hook**: useWorkspace()

- **Props**:
  - workspace: WorkspaceWithPagesDTO
  - open: boolean
  - onOpenChange: (open: boolean) => void

- **폼 검증**:
  - react-hook-form + zod 사용
  - createWorkspaceSchema.partial() (부분 업데이트)

- **구조**:
  ```
  Dialog
    DialogHeader: "워크스페이스 설정"
    
    Form (react-hook-form)
      - FormField (name, description, icon)
      - CreateWorkspaceDialog와 동일한 필드
      - 기존 값 미리 채움 (defaultValues)
      
      DialogFooter
        - Button (취소)
        - Button (저장): disabled={!isDirty || isSubmitting}
  ```

- **로직 흐름**:
  ```
  1. useEffect: open 변경 시 form.reset(workspace 정보)
  2. 폼 제출 → handleSubmit
  3. updateWorkspaceInfo({ workspaceId, ...data })
  4. 성공: toast, 모달 닫기
  5. 실패: toast.error, 모달 유지
  ```

- **특징**:
  - form.formState.isDirty로 변경사항 감지
  - useEffect로 workspace prop 변경 시 폼 재설정
  - 부분 업데이트 지원 (변경된 필드만 전송)

**사용 위치**:
- WorkspaceContextMenu: "워크스페이스 설정" 클릭 시

---

#### WorkspaceContextMenu

- **파일 위치**: `src/domains/workspace-management/frontend/components/workspace-context-menu.tsx`
- **역할**: Workspace 헤더 삼점 메뉴 (User Flow 공통 컨텍스트 메뉴)
- **주요 기능**:
  - 권한별 메뉴 항목 필터링
  - Default Workspace 특별 처리 (보관 비활성화)

- **사용 Hook**: useWorkspace()

- **Props**:
  - workspace: WorkspaceWithPagesDTO

- **UI 라이브러리**:
  - shadcn/ui DropdownMenu

- **구조**:
  ```tsx
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent>
      <DropdownMenuItem onClick={openSettings}>
        <Settings className="mr-2 size-4" />
        워크스페이스 설정
      </DropdownMenuItem>
      
      {canInviteMembers(workspace.workspaceId) && (
        <DropdownMenuItem onClick={openInvite}>
          <UserPlus className="mr-2 size-4" />
          멤버 추가
        </DropdownMenuItem>
      )}
      
      {userRole === 'owner' && (
        <DropdownMenuItem
          onClick={openArchive}
          disabled={workspace.isDefault}
          className="text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          워크스페이스 보관
          {workspace.isDefault && <Tooltip>기본 워크스페이스는 삭제할 수 없습니다</Tooltip>}
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
  ```

- **특징**:
  - 권한별 메뉴 항목 조건부 렌더링
  - Default Workspace는 보관 비활성화
  - 각 메뉴 항목이 해당 모달 열기

**사용 위치**:
- WorkspaceItem: Workspace 헤더 우측

---

### 6. 멤버 초대 컴포넌트 (Scenario 3)

> **구현 패턴 참조**: Organization Domain의 InviteMemberDialog 패턴 적용 (Dialog + Form 분리)

#### InviteMemberDialog

- **파일 위치**: `src/domains/workspace-management/frontend/components/invitation/invite-member-dialog.tsx`
- **역할**: Workspace 멤버 초대 모달 (User Flow Screen 1) - Dialog 래퍼만 담당
- **주요 기능**:
  - Dialog 열기/닫기 관리
  - 성공 시 콜백 처리
  - InviteMemberForm 컴포넌트 래핑

- **Props**:
  - workspaceId: string
  - open: boolean
  - onOpenChange: (open: boolean) => void
  - onSuccess?: () => void

- **UI 라이브러리**:
  - shadcn/ui Dialog

- **구조** (Organization 패턴: Dialog + Form 분리):
  ```
  Dialog
    DialogHeader
      DialogTitle: "Workspace에 멤버 초대"
      DialogDescription: 설명 텍스트
    
    InviteMemberForm
      - workspaceId 전달
      - onSuccess 콜백
  ```

- **특징**:
  - Dialog와 Form 분리 (Organization 패턴)
  - InviteMemberForm에 실제 로직 위임
  - 성공 시 onSuccess 콜백 + Dialog 닫기

---

#### InviteMemberForm

- **파일 위치**: `src/domains/workspace-management/frontend/components/invitation/invite-member-form.tsx`
- **역할**: 멤버 초대 폼 (실제 로직 담당)
- **주요 기능**:
  - 이메일 실시간 검색 (debounce 300ms)
  - 조직 멤버 필터링
  - 다중 선택 (Checkbox)
  - 이미 멤버 표시
  - Server Action 호출

- **사용 Hook**: useWorkspace(), useDebounce()

- **Props**:
  - workspaceId: string
  - onSuccess: () => void

- **UI 라이브러리**:
  - shadcn/ui Input, Command, Checkbox, ScrollArea, Avatar, Button

- **구조**:
  ```
  Container (space-y-4)
    검색 필드
      - Label: "멤버 검색 (이메일)"
      - Input: Search 아이콘, placeholder, className="pl-9"
    
    검색 결과 (ScrollArea, h-[200px])
      - isSearching: MemberSearchSkeleton
      - 결과 없음: 안내 메시지
      - 결과 있음: MemberItem 목록
        - Checkbox 선택
        - Avatar + 이름 + 이메일
        - isAlreadyMember: 비활성화 + 안내
    
    선택된 멤버 카운트
      - "선택된 멤버: N명"
    
    액션 버튼
      - Button (취소)
      - Button (초대): disabled={length === 0 || isSubmitting}
  ```

- **로직 흐름**:
  ```
  1. searchQuery 입력 → useDebounce(300ms)
  2. debouncedQuery 변경 → useEffect 트리거
  3. searchOrganizationMembers(workspaceId, query) 호출
  4. searchResults 업데이트
  5. Checkbox 클릭 → toggleMember(userId)
  6. 초대 버튼 → handleInvite
     - 선택된 이메일 추출
     - inviteMembers(workspaceId, emails)
     - 성공: toast, 상태 초기화, onSuccess()
     - 실패: toast.error
  ```

- **상태 관리**:
  - searchQuery: string
  - searchResults: OrganizationMemberSearchResultDTO[]
  - selectedMembers: string[] (userId 배열)
  - isSearching: boolean
  - isSubmitting: boolean

- **특징**:
  - useDebounce로 검색 최적화
  - 실시간 검색 (useEffect)
  - 다중 선택 (Checkbox 배열)
  - 이미 멤버 필터링 (isAlreadyMember)

**사용 위치**:
- WorkspaceContextMenu: "멤버 추가" 클릭 시

---

#### MemberItem

- **파일 위치**: `src/domains/workspace-management/frontend/components/member-item.tsx`
- **역할**: 검색 결과 멤버 아이템
- **주요 기능**:
  - Avatar + 이름 + 이메일 표시
  - Checkbox 선택
  - 이미 멤버 표시

- **Props**:
  - member: OrganizationMemberSearchResultDTO
  - selected: boolean
  - onToggle: () => void
  - disabled: boolean

- **구조**:
  ```
  Container (flex, gap-3, p-2, hover:bg-accent)
    Checkbox
      - checked={selected}
      - onCheckedChange={onToggle}
      - disabled={disabled}
    
    Avatar
      - AvatarImage: src={avatarUrl}
      - AvatarFallback: 이니셜 (getInitials)
    
    정보 영역 (flex-1)
      - 이름 (font-medium)
      - 이메일 (text-xs, muted)
      - isAlreadyMember: "이미 멤버입니다" (text-xs, muted)
    
    disabled 시
      - Tooltip + Info 아이콘
      - 내용: "이미 이 Workspace의 멤버입니다"
  ```

**사용 위치**:
- InviteMemberDialog: 검색 결과 목록

---

#### InvitationDetailDialog

- **파일 위치**: `src/domains/workspace-management/frontend/components/invitation/invitation-detail-dialog.tsx`
- **역할**: 초대 상세 및 수락/거절 모달 (User Flow Screen 5)
- **주요 기능**:
  - 초대 상세 정보 표시
  - 수락/거절 버튼
  - 거절 시 AlertDialog 확인
  - toast 피드백

- **사용 Hook**: useWorkspace()

- **Props**:
  - invitation: InvitationSummaryDTO
  - open: boolean
  - onOpenChange: (open: boolean) => void

- **UI 라이브러리**:
  - shadcn/ui Dialog, AlertDialog, Button

- **구조**:
  ```
  Dialog
    DialogHeader: "Workspace 초대"
    
    초대 정보 표시
      - WorkspaceIcon + 이름 + 설명
      - 초대한 사람, 조직명
      - 확인 메시지
    
    DialogFooter
      - Button (거절): onClick={handleReject}
      - Button (수락): onClick={handleAccept}
  
  AlertDialog (거절 확인)
    - open={showRejectConfirm}
    - AlertDialogTitle: "초대를 거절하시겠습니까?"
    - AlertDialogDescription: 경고 메시지
    - Button (취소, 거절)
  ```

- **로직 흐름**:
  ```
  handleAccept:
    1. acceptInvitation(invitationId)
    2. 성공: toast, onOpenChange(false)
    3. 실패: toast.error
  
  handleReject:
    1. setShowRejectConfirm(true) → AlertDialog 열기
  
  confirmReject:
    1. rejectInvitation(invitationId)
    2. 성공: toast, onOpenChange(false)
    3. 실패: toast.error
    4. setShowRejectConfirm(false)
  ```

- **상태 관리**:
  - isSubmitting: boolean
  - showRejectConfirm: boolean

- **특징**:
  - AlertDialog로 거절 재확인
  - toast 피드백 (수락/거절)
  - 성공 시 자동 닫기

**사용 위치**:
- Notification 센터: 초대 알림 클릭 시

---

### 7. Page 관리 컴포넌트 (Scenario 4)

#### PageTreeWithActions

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-tree/page-tree-with-actions.tsx`
- **역할**: PageTree + 생성/이동 기능 통합 (Scenario 4)
- **주요 기능**:
  - + 버튼 표시 (호버 시)
  - 드래그앤드롭 활성화
  - 인라인 페이지 생성

- **사용 Hook**: useWorkspace()

- **Props**: PageTree와 동일

- **구조**:
  ```
  PageTree
    - enableDragDrop={canEditPage(pageId)}
    - onDrop={(pageId, newParentId) => movePage(...)}
    - renderItemActions={(pageId) => (
        <Button (+ 버튼)>
          - opacity-0, group-hover:opacity-100
          - onClick={() => createPage(workspaceId, pageId)}
        </Button>
      )}
  ```

- **특징**:
  - PageTree 확장 (Scenario 1 → 4)
  - 권한 기반 드래그앤드롭 활성화
  - 호버 시 + 버튼 표시 (opacity 전환)

**사용 위치**:
- WorkspaceItem: Scenario 4 활성화 시

---


### 8. 즐겨찾기 컴포넌트 (Scenario 5)

#### FavoritePageList (확장)

- **파일 위치**: `src/domains/workspace-management/frontend/components/sidebar/favorite-page-list.tsx`
- **역할**: 즐겨찾기 페이지 목록 (이미 Scenario 1에서 정의됨)
- **Scenario 5 확장**:
  - isFavorite 속성 기반 자동 필터링
  - togglePageFavorite 액션과 연동
  - Optimistic update로 즉시 목록 업데이트

- **특징**:
  - Context의 favoritePages 사용 (useMemo로 계산)
  - 즐겨찾기 토글 시 자동 업데이트 (Optimistic)
  - 빈 상태: "즐겨찾기한 페이지가 없습니다"
  - SidebarMenuButton으로 통일된 스타일

---

### 9. 공통 컴포넌트

#### IconPicker

- **파일 위치**: `src/domains/workspace-management/frontend/components/shared/icon-picker.tsx`
- **역할**: 이모지 아이콘 선택기 (Scenario 2, 4 공통)
- **주요 기능**:
  - 기본 아이콘 표시 (6-8개)
  - "더보기..." 버튼 → 전체 이모지 피커
  - 선택된 아이콘 강조

- **Props**:
  - value?: string (현재 선택된 아이콘)
  - onChange: (icon: string) => void
  - defaultIcons: string[] (기본 표시할 아이콘 목록)

- **UI 라이브러리**:
  - shadcn/ui Popover, Button
  - emoji-picker-react 또는 커스텀 그리드

- **구조**:
  ```
  Container (flex, gap-2)
    기본 아이콘 버튼들 (defaultIcons 배열)
      - Button
      - variant={선택됨 ? 'default' : 'outline'}
      - onClick={() => onChange(icon)}
      - 이모지 표시
    
    더보기 버튼
      - Popover
        - PopoverTrigger: "더보기..."
        - PopoverContent: EmojiPicker
          - onEmojiSelect → onChange(emoji)
  ```

- **로직 흐름**:
  ```
  1. 기본 아이콘 클릭 → onChange(icon) 호출
  2. 더보기 클릭 → Popover 열기
  3. 이모지 선택 → onChange(emoji), Popover 닫기
  ```

- **특징**:
  - react-hook-form 통합 (field.value, field.onChange)
  - 선택된 아이콘 강조 (variant)
  - Popover로 전체 이모지 피커

**사용 위치**:
- CreateWorkspaceDialog, WorkspaceSettingsDialog
- InlinePageEditor (아이콘 변경)

---

#### WorkspaceIcon

- **파일 위치**: `src/domains/workspace-management/frontend/components/shared/workspace-icon.tsx`
- **역할**: Workspace 아이콘 표시 컴포넌트
- **주요 기능**:
  - 이모지 또는 이미지 URL 표시
  - 기본 아이콘 폴백 (📁)
  - 크기 조절 가능

- **Props**:
  - icon?: string
  - size?: number (기본: 16)
  - className?: string

- **로직**:
  ```
  1. icon 타입 감지
     - 이모지: /\p{Emoji}/u 정규식
     - 이미지 URL: http/https
     - 없음: 기본 📁
  
  2. 렌더링
     - 이모지: <span> + fontSize={size}
     - 이미지: <img> + width/height={size}
     - 기본: <span>📁</span>
  ```

- **특징**:
  - 이모지/이미지 자동 감지
  - 기본 아이콘 폴백 (📁)
  - size prop으로 크기 조절

**사용 위치**:
- WorkspaceItem, InvitationDetailDialog

---

### 10. 유틸리티 Hooks

#### useDebounce

- **파일 위치**: `src/hooks/use-debounce.ts` (앱 공통)
- **역할**: 입력 값을 debounce 처리하는 Hook
- **사용 위치**: InviteMemberForm (이메일 검색)

**로직**:
```
1. useState로 debouncedValue 초기화
2. useEffect:
   - setTimeout으로 delay 후 값 업데이트
   - cleanup: clearTimeout
3. debouncedValue 반환
```

**사용 예시**:
```typescript
const debouncedQuery = useDebounce(searchQuery, 300);
```

---

## 🔗 앱 레벨 통합

> **가이드 참조**: Phase 3.2 - 앱 레벨 통합 설계

### 1. Provider 중첩 순서

**Root Layout 통합**:
```typescript
// src/app/(dashboard)/r/[orgId]/layout.tsx
export default async function OrganizationLayout({ children, params }) {
  const { orgId } = params;
  
  // 1. Organization 초기 데이터 로드
  const organizations = await getUserOrganizationsAction();
  
  // 2. Workspace-Page 초기 데이터 로드
  const workspacePageView = await getWorkspacePagesAction(orgId);
  
  return (
    <OrganizationProvider 
      initialOrganizations={organizations}
      initialSelectedId={orgId}
    >
      <WorkspaceProvider
        initialWorkspaces={workspacePageView.workspaces}
        initialSelectedPageId={workspacePageView.selectedPageId}
        organizationId={orgId}
      >
        <DashboardSidebar />
        {children}
      </WorkspaceProvider>
    </OrganizationProvider>
  );
}
```

**Provider 순서 원칙**:
- OrganizationProvider (상위) → WorkspaceProvider (하위)
- Organization은 Workspace보다 상위 개념
- 각 도메인 Provider는 독립적으로 동작

---

### 2. 초기 데이터 전달

**Server Component에서 데이터 로드**:
```typescript
// src/app/(dashboard)/r/[orgId]/layout.tsx
export default async function OrganizationLayout({ params }) {
  const { orgId } = params;
  
  // Server Action 호출
  const workspacePageView = await getWorkspacePagesAction(orgId);
  
  // Provider에 전달
  return (
    <WorkspaceProvider
      initialWorkspaces={workspacePageView.workspaces}
      initialSelectedPageId={workspacePageView.selectedPageId}
      organizationId={orgId}
    >
      {children}
    </WorkspaceProvider>
  );
}
```

**getWorkspacePagesAction 내부**:
1. Supabase Auth 인증 확인
2. Organization Domain API: 조직 멤버십 확인
3. WorkspaceManagementService 호출
4. OrganizationWorkspacePageViewDTO 반환

---

### 3. DashboardSidebar 통합

**DashboardSidebar 수정**:
```tsx
// src/domains/organization-management/frontend/components/sidebar/dashboard-sidebar.tsx
import { WorkspacePageTree } from '@/domains/workspace-management/frontend/components/workspace-page-tree';

export function DashboardSidebar() {
  return (
    <Sidebar className="border-r-0 p-0">
      <SidebarHeader>
        <OrganizationSwitcher />
        <SidebarHeaderGroup />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupAction aria-label="Add Workspace">
            <Plus className="text-muted-foreground" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <Suspense fallback={<OrgWorkspacesSkeleton />}>
                {/* OrgWorkspacesMenu 대신 WorkspacePageTree 사용 */}
                <WorkspacePageTree />
              </Suspense>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* 기존 Footer 유지 */}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
```

---

### 4. 페이지에서 Hook 사용

**페이지 컴포넌트**:
```tsx
// src/app/(dashboard)/r/[orgId]/workspace/[workspaceId]/page/[pageId]/page.tsx
'use client';

import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';
import { PageViewer } from '@/domains/workspace-management/frontend/components/page-viewer';

export default function PageViewPage() {
  const { selectedPage, selectedWorkspace, isLoading, error } = useWorkspace();
  
  return (
    <div className="page-view">
      <PageViewer />
    </div>
  );
}
```

---

## 🚀 Server Actions 설계 (Scenario 2~5)

> **가이드 참조**: Phase 2.4 Part 1 - Server Actions 연동  
> **Technical Specification 참조**: `05-technical-specification.md` - Server Actions 수도코드

### 공통 패턴

모든 Server Actions는 다음 패턴을 따릅니다:

```typescript
'use server';

async function [actionName]Action(
  // 파라미터
): Promise<Result<[DTOType]>> {
  // 1. Supabase Auth 인증 확인
  const user = await getAuthUser();
  if (!user) return Result.err('UNAUTHORIZED');
  
  // 2. 의존성 주입 (Repository, Service)
  const service = new WorkspaceManagementService(...);
  
  // 3. Command 생성 및 Service 호출
  const result = await service.[methodName](...);
  
  // 4. DTO 직렬화
  if (result.isOk) {
    return Result.ok(toDTO(result.value));
  }
  return Result.err(result.error);
  
  // 5. 캐시 무효화 (필요시)
  revalidatePath(`/r/[orgId]`);
}
```

---

### Scenario 2 Server Actions

#### createWorkspaceAction

- **입력**: CreateWorkspaceRequest
- **출력**: Result<CreateWorkspaceResponse>
- **로직**:
  1. 인증 확인
  2. 조직 소유자 권한 확인
  3. Workspace 생성 (트랜잭션: Workspace + 초기 Page)
  4. workspaceId, firstPageId 반환
- **캐시**: `/r/[orgId]` 재검증

#### updateWorkspaceInfoAction

- **입력**: UpdateWorkspaceInfoRequest
- **출력**: Result<void>
- **로직**:
  1. 인증 확인
  2. Workspace 멤버십 확인
  3. Workspace 정보 업데이트 (부분 업데이트)
- **캐시**: `/r/[orgId]` 재검증

---

### Scenario 3 Server Actions

#### inviteWorkspaceMemberAction

- **입력**: InviteWorkspaceMemberRequest
- **출력**: Result<number> (초대한 멤버 수)
- **로직**:
  1. 인증 확인
  2. 조직 Admin + Workspace 멤버 권한 확인
  3. 각 이메일에 대해:
     - 조직 멤버 검색
     - 이미 Workspace 멤버인지 확인
     - 초대 생성
     - Notification Domain 통합 (알림 생성)
  4. 초대한 멤버 수 반환
- **캐시**: 없음 (알림만 생성)

#### searchOrganizationMembersAction

- **입력**: { workspaceId: string, query: string }
- **출력**: OrganizationMemberSearchResultDTO[]
- **로직**:
  1. 인증 확인
  2. Workspace 조회
  3. 조직 멤버 검색 (이메일 기반)
  4. 이미 Workspace 멤버인지 확인 (isAlreadyMember)
  5. 검색 결과 반환
- **캐시**: 없음 (조회만)

#### acceptWorkspaceInvitationAction

- **입력**: invitationId: string
- **출력**: Result<void>
- **로직**:
  1. 인증 확인
  2. 초대 조회 (본인 확인)
  3. 초대 수락 (트랜잭션: 멤버 추가 + 알림 업데이트)
- **캐시**: `/r` 재검증 (모든 조직 페이지)

#### rejectWorkspaceInvitationAction

- **입력**: invitationId: string
- **출력**: Result<void>
- **로직**:
  1. 인증 확인
  2. 초대 조회 (본인 확인)
  3. 초대 거절 (알림 업데이트만)
- **캐시**: 없음

---

### Scenario 4 Server Actions

#### createPageAction

- **입력**: CreatePageRequest
- **출력**: Result<string> (pageId)
- **로직**:
  1. 인증 확인
  2. Workspace 멤버십 확인
  3. 부모 페이지 조회 (있는 경우)
  4. Page 생성 (depth 자동 계산)
  5. pageId 반환
- **캐시**: `/r/[orgId]/workspace/[workspaceId]` 재검증

#### movePageAction

- **입력**: MovePageRequest
- **출력**: Result<void>
- **로직**:
  1. 인증 확인
  2. Page 조회
  3. Workspace 멤버십 확인
  4. 순환 참조 체크 (재귀 CTE)
  5. Page 이동 (parent_id, depth 업데이트)
  6. 하위 페이지 depth 재귀 업데이트
- **캐시**: `/r/[orgId]` 재검증

#### updatePageInfoAction

- **입력**: UpdatePageInfoRequest
- **출력**: Result<void>
- **로직**:
  1. 인증 확인
  2. Page 조회
  3. Workspace 멤버십 확인
  4. 제목/아이콘 업데이트
- **캐시**: `/r/[orgId]` 재검증

---

### Scenario 5 Server Actions

#### togglePageFavoriteAction

- **입력**: pageId: string
- **출력**: Result<boolean> (새 상태: true=추가, false=제거)
- **로직**:
  1. 인증 확인
  2. Page 조회
  3. Workspace 멤버십 확인
  4. 즐겨찾기 토글 (추가/제거)
  5. 새 상태 반환
- **캐시**: `/r/[orgId]` 재검증

---

## 🔐 쿠키 및 로컬스토리지 영속성

### 1. Cookie Helpers

**유틸리티 함수**:
```typescript
// src/domains/workspace-management/frontend/utils/cookie-helpers.ts

export const WORKSPACE_COOKIE_KEYS = {
  // 조직별로 최근 방문 페이지 관리
  getRecentPageKey: (orgId: string) => `recent-page-${orgId}`,
};

export function getRecentPageId(orgId: string): string | null {
  if (typeof window === 'undefined') return null;
  const key = WORKSPACE_COOKIE_KEYS.getRecentPageKey(orgId);
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${key}=`))
    ?.split('=')[1];
  return value || null;
}

export function setRecentPageId(orgId: string, pageId: string): void {
  if (typeof window === 'undefined') return;
  const key = WORKSPACE_COOKIE_KEYS.getRecentPageKey(orgId);
  document.cookie = `${key}=${pageId}; path=/; max-age=31536000`; // 1년
}
```

**사용 위치**:
- WorkspaceProvider: 초기화 시 쿠키 읽기
- selectPage 액션: 페이지 선택 시 쿠키 저장

---

### 2. LocalStorage Helpers

**유틸리티 함수**:
```typescript
// src/domains/workspace-management/frontend/utils/storage-helpers.ts

export const WORKSPACE_STORAGE_KEYS = {
  getWorkspaceCollapsedKey: (workspaceId: string) => `workspace-collapsed-${workspaceId}`,
  getPageCollapsedKey: (pageId: string) => `page-collapsed-${pageId}`,
};

export function isWorkspaceCollapsed(workspaceId: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = WORKSPACE_STORAGE_KEYS.getWorkspaceCollapsedKey(workspaceId);
  return localStorage.getItem(key) === 'true';
}

export function setWorkspaceCollapsed(workspaceId: string, collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  const key = WORKSPACE_STORAGE_KEYS.getWorkspaceCollapsedKey(workspaceId);
  localStorage.setItem(key, String(collapsed));
}

export function isPageCollapsed(pageId: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = WORKSPACE_STORAGE_KEYS.getPageCollapsedKey(pageId);
  return localStorage.getItem(key) === 'true';
}

export function setPageCollapsed(pageId: string, collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  const key = WORKSPACE_STORAGE_KEYS.getPageCollapsedKey(pageId);
  localStorage.setItem(key, String(collapsed));
}
```

**사용 위치**:
- WorkspaceProvider: 초기화 시 로컬스토리지 읽기
- toggleWorkspace/togglePage 액션: 상태 변경 시 로컬스토리지 저장

---

## ✅ 검증 체크리스트 (Scenario 0~5)

### DTO 타입 정의
- [x] DTO 인터페이스가 Plain Object로 정의되었는가?
- [x] Date 객체가 ISO 문자열로 직렬화되었는가?
- [x] Value Object가 string으로 직렬화되었는가?
- [x] Next.js Server Actions 직렬화 제약을 준수하는가?
- [x] Request/Response DTO가 Scenario 2~5로 확장되었는가?
  - CreateWorkspace, UpdateWorkspaceInfo
  - InviteWorkspaceMember, ProcessInvitation
  - CreatePage, MovePage, UpdatePageInfo
  - InvitationSummary, OrganizationMemberSearchResult

### Context 설계
- [x] 도메인별로 독립적인 Context가 생성되었는가?
- [x] workspaces 배열과 선택된 페이지 상태가 관리되는가?
- [x] 쿠키 기반 영속성이 구현되었는가? (`recent-page-${orgId}`)
- [x] 로컬스토리지 기반 UI 상태 영속성이 구현되었는가? (접기/펼치기)
- [x] 초기 데이터 로드 로직이 구현되었는가?
- [x] Scenario 2~5 Actions가 추가되었는가?
  - createWorkspace, updateWorkspaceInfo
  - inviteMembers, acceptInvitation, rejectInvitation, searchOrganizationMembers
  - createPage, movePage, updatePageInfo
  - togglePageFavorite
- [x] Optimistic update가 정의되었는가? (Scenario 4, 5)

### Server Actions 연동
- [x] Supabase Auth 인증 확인이 포함되었는가?
- [x] 의존성 주입 패턴으로 Service Layer를 사용하는가?
- [x] DTO 직렬화가 올바르게 구현되었는가?
- [x] 권한 검증이 포함되었는가? (조직 멤버십 + Workspace 멤버십)
- [x] 9개 Server Actions가 정의되었는가?
- [x] Notification Domain 통합이 포함되었는가? (Scenario 3)

### Hook 구현
- [x] Context를 적절히 추상화한 Hook이 구현되었는가?
- [x] 비즈니스 로직 메서드가 포함되었는가?
- [x] 선택된 엔티티, 기본 엔티티 등 유틸리티가 제공되는가?
- [x] useMemo로 최적화되었는가?
- [x] 권한 검증 유틸리티가 추가되었는가?
  - canCreateWorkspace, canInviteMembers, canEditPage

### 컴포넌트 연동
- [x] 컴포넌트에서 직접 Context 접근을 피하고 Hook을 사용하는가?
- [x] 재귀 트리 구조가 적절히 렌더링되는가? (PageTreeNode)
- [x] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [x] 빈 상태 처리가 포함되었는가?
- [x] Scenario 2~5 컴포넌트가 추가되었는가?
  - CreateWorkspaceDialog, WorkspaceSettingsDialog, WorkspaceContextMenu
  - InviteMemberDialog, MemberItem, InvitationDetailDialog
  - PageTreeWithActions, InlinePageEditor
  - PageHeaderWithFavorite (Star 아이콘)

### 앱 통합
- [x] Provider가 적절한 순서로 중첩 배치되었는가? (Organization → Workspace)
- [x] 초기 데이터가 Server Components에서 전달되는가?
- [x] 쿠키 기반 영속성이 올바르게 작동하는가?
- [x] DashboardSidebar와 통합되었는가?
- [x] 권한별 UI 차이가 정의되었는가? (userRole prop)

---

## 🚀 다음 단계

이 Frontend Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 프론트엔드 코드 (Context, Hooks, Components, Server Actions)
- **내용**:
  - **Phase 1**: WorkspaceContext 및 WorkspaceProvider 구현
  - **Phase 2**: useWorkspace Hook 구현 (15개 Actions + 8개 유틸리티)
  - **Phase 3**: Scenario 1 컴포넌트 구현
    - WorkspacePageTree, FavoritePageList, PageTree, PageViewer
  - **Phase 4**: Scenario 2~5 컴포넌트 구현
    - Workspace 관리: CreateWorkspaceDialog, WorkspaceSettingsDialog, WorkspaceContextMenu
    - 초대 관리: InviteMemberDialog, MemberItem, InvitationDetailDialog
    - Page 관리: PageTreeWithActions, InlinePageEditor, PageHeaderWithFavorite
  - **Phase 5**: Server Actions 구현 (12개)
  - **Phase 6**: React Testing Library로 컴포넌트 테스트

### 예상 구현 시간
- Context + Hook: 6-8시간
- Scenario 1 컴포넌트: 10-12시간
- Scenario 2-5 컴포넌트: 12-15시간
- Server Actions: 8-10시간
- 테스트 작성: 10-12시간
- **총**: 약 46-57시간

---

**문서 작성 완료 후**:
- [ ] 프론트엔드 개발자 리뷰 완료
- [ ] UX/UI 디자이너 리뷰 완료
- [ ] User Flow와 일관성 확인 (25개 Screen)
- [ ] Software Design과 일관성 확인
- [ ] Technical Specification과 일관성 확인 (9개 Server Actions)
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

## 📁 폴더 구조 요약 (Scenario 0~5)

```
src/domains/workspace-management/
├── shared/
│   ├── dtos/
│   │   └── index.ts                                   # DTO 인터페이스들
│   │       ├── OrganizationWorkspacePageViewDTO
│   │       ├── WorkspaceWithPagesDTO
│   │       ├── PageTreeNodeDTO
│   │       ├── PageDetailsDTO
│   │       ├── AccessDeniedDTO
│   │       ├── CreateWorkspaceRequest                 # Scenario 2
│   │       ├── UpdateWorkspaceInfoRequest             # Scenario 2
│   │       ├── CreateWorkspaceResponse                # Scenario 2
│   │       ├── InviteWorkspaceMemberRequest           # Scenario 3
│   │       ├── ProcessInvitationRequest               # Scenario 3
│   │       ├── InvitationSummaryDTO                   # Scenario 3
│   │       ├── OrganizationMemberSearchResultDTO      # Scenario 3
│   │       ├── CreatePageRequest                      # Scenario 4
│   │       ├── MovePageRequest                        # Scenario 4
│   │       └── UpdatePageInfoRequest                  # Scenario 4
│   ├── types/
│   │   └── index.ts                                   # Result 패턴 및 공통 타입
│   ├── commands/                                      # Command 객체들
│   └── errors/                                        # 에러 타입들
├── frontend/
│   ├── contexts/
│   │   └── workspace-context.tsx                      # WorkspaceContext + Provider
│   ├── hooks/
│   │   └── use-workspace.ts                           # 메인 Hook
│   ├── components/
│   │   ├── sidebar/
│   │   │   ├── workspace-sidebar-content.tsx          # 사이드바 메인 래퍼
│   │   │   ├── favorite-page-list.tsx                 # 즐겨찾기 섹션
│   │   │   ├── workspace-page-tree.tsx                # Workspace 섹션
│   │   │   └── workspace-item.tsx                     # Workspace 아이템
│   │   ├── page-tree/                                 # 📁 PageTree 전용 컴포넌트
│   │   │   ├── page-tree.tsx                          # 메인 트리 컴포넌트
│   │   │   ├── page-tree-context.tsx                  # Context
│   │   │   ├── page-tree-item.tsx                     # 개별 페이지 아이템
│   │   │   ├── page-tree-controls.tsx                 # Chevron 컨트롤
│   │   │   ├── page-tree-with-actions.tsx             # + 버튼 + 드래그앤드롭 (Scenario 4)
│   │   │   ├── use-page-tree-data.tsx                 # 트리 데이터 변환
│   │   │   ├── types.ts                               # 타입 정의
│   │   │   └── utils.ts                               # flattenPageTree
│   │   ├── page-viewer/
│   │   │   ├── page-viewer.tsx                        # 페이지 뷰어
│   │   │   ├── workspace-header.tsx                   # Breadcrumb 헤더 (레거시 재사용)
│   │   │   ├── page-header.tsx                        # 제목/아이콘/Star 편집
│   │   │   └── access-denied-page.tsx                 # 권한 없음 페이지
│   │   ├── workspace/
│   │   │   ├── create-workspace-dialog.tsx            # Workspace 생성 모달 (Scenario 2)
│   │   │   ├── workspace-settings-dialog.tsx          # Workspace 설정 모달 (Scenario 2)
│   │   │   └── workspace-context-menu.tsx             # 삼점 메뉴 (공통)
│   │   ├── invitation/
│   │   │   ├── invite-member-dialog.tsx               # 멤버 초대 Dialog 래퍼 (Scenario 3)
│   │   │   ├── invite-member-form.tsx                 # 멤버 초대 Form (실제 로직)
│   │   │   ├── member-item.tsx                        # 검색 결과 멤버 아이템
│   │   │   ├── member-search-skeleton.tsx             # 검색 로딩 Skeleton
│   │   │   └── invitation-detail-dialog.tsx           # 초대 상세 모달 (Scenario 3)
│   │   └── shared/
│   │       ├── icon-picker.tsx                        # 이모지 피커 (공통)
│   │       └── workspace-icon.tsx                     # Workspace 아이콘 컴포넌트
│   └── utils/
│       ├── cookie-helpers.ts                          # 쿠키 유틸리티
│       └── storage-helpers.ts                         # 로컬스토리지 유틸리티
└── actions/
    └── workspace-management.actions.ts                # Server Actions (9개)
        ├── getOrganizationWorkspacePageViewAction     # Scenario 1
        ├── verifyPageAccessAction                     # Scenario 1
        ├── createWorkspaceAction                      # Scenario 2
        ├── updateWorkspaceInfoAction                  # Scenario 2
        ├── inviteWorkspaceMemberAction                # Scenario 3
        ├── searchOrganizationMembersAction            # Scenario 3
        ├── acceptWorkspaceInvitationAction            # Scenario 3
        ├── rejectWorkspaceInvitationAction            # Scenario 3
        ├── createPageAction                           # Scenario 4
        ├── movePageAction                             # Scenario 4
        ├── updatePageInfoAction                       # Scenario 4
        └── togglePageFavoriteAction                   # Scenario 5
```

---

## 📋 문서 변경 이력

### v2.0 (2025-10-11) - **Scenario 2~5 확장 + Organization 패턴 적용**
- **DTO 확장** (5개 → 13개):
  - Request DTOs (7개): CreateWorkspace, UpdateWorkspaceInfo, InviteWorkspaceMember, ProcessInvitation, CreatePage, MovePage, UpdatePageInfo
  - Response DTOs (3개): CreateWorkspaceResponse, InvitationSummary, OrganizationMemberSearchResult
  
- **Context Actions 확장** (4개 → 15개):
  - Scenario 2: createWorkspace, updateWorkspaceInfo
  - Scenario 3: inviteMembers, searchOrganizationMembers, acceptInvitation, rejectInvitation
  - Scenario 4: createPage, movePage, updatePageInfo
  - Scenario 5: togglePageFavorite
  - Optimistic update 패턴 정의 (Scenario 4, 5)
  
- **Hook 확장**:
  - 권한 검증 유틸리티: canCreateWorkspace, canInviteMembers, canEditPage
  - Actions 반환값에 Scenario 2~5 메서드 추가
  
- **컴포넌트 추가** (7개 → 20개) - **수도코드 수준**:
  - **Scenario 1**: WorkspaceHeader (레거시 재사용, Breadcrumb)
  - **Scenario 2**: CreateWorkspaceDialog, WorkspaceSettingsDialog, WorkspaceContextMenu
  - **Scenario 3**: InviteMemberDialog, InviteMemberForm, MemberItem, InvitationDetailDialog
  - **Scenario 4**: PageTreeWithActions, PageHeader (인라인 편집)
  - **Scenario 5**: PageHeader (Star 아이콘 통합)
  - **공통**: IconPicker, WorkspaceIcon
  
- **Organization 패턴 적용**:
  - ✅ react-hook-form + zod 유효성 검증
  - ✅ shadcn/ui Form 컴포넌트 (FormField, FormItem, FormLabel, FormControl, FormMessage)
  - ✅ toast 피드백 (sonner)
  - ✅ Dialog + Form 분리 패턴 (InviteMemberDialog)
  - ✅ isSubmitting 상태 관리
  - ✅ DialogDescription 추가
  
- **폴더 구조 재정리**:
  - sidebar/, page-tree/, page-viewer/, workspace/, invitation/, shared/ 디렉토리로 분리
  - InviteMemberForm 분리 (Dialog + Form 패턴)
  - 총 12개 Server Actions 정의
  
- **Provider Props 확장**:
  - userRole prop 추가 (권한별 UI 제어)
  
- **구현 가이드 준수**:
  - 실제 코드 대신 수도코드 수준으로 작성
  - 구조와 로직 흐름만 명시
  - Organization 패턴 참고 (실제 코드는 TDD 단계에서)

### v1.2 (2025-10-11)
- **PageTree 컴포넌트 전용 설계**: ExplorerTree의 문제점 분석 후 Workspace Management Domain 전용 컴포넌트 재설계
- 드래그앤드롭 조건부 활성화 (`enableDragDrop` prop)
- Context 완전 통합 (expandedPages, selectedPageId 동기화)

### v1.1 (2025-10-11)
- 사이드바 구조 개선: shadcn/ui Sidebar의 SidebarGroup으로 섹션 분리
- PageTreeNodeDTO 확장: parentId, order 속성 추가

### v1.0 (2025-10-11)
- 초안 작성 (Scenario 1 기준)
- DTO 설계 완료 (5개 DTO)
- Context 설계 완료 (WorkspaceContext)
- Hook 설계 완료 (useWorkspace)
- 컴포넌트 설계 완료 (7개 컴포넌트)

---

## 📊 구현 범위 요약

### 완료된 설계:
- ✅ **13개 DTO**: 
  - Request (7개): CreateWorkspace, UpdateWorkspaceInfo, InviteWorkspaceMember, ProcessInvitation, CreatePage, MovePage, UpdatePageInfo
  - Response (3개): CreateWorkspaceResponse, InvitationSummary, OrganizationMemberSearchResult
  - View (3개): OrganizationWorkspacePageView, WorkspaceWithPages, PageTreeNode
- ✅ **1개 Context**: WorkspaceContext (15개 Actions)
- ✅ **1개 Hook**: useWorkspace (15개 Actions + 8개 유틸리티)
- ✅ **20개 컴포넌트** (수도코드 수준):
  - 사이드바: 4개 (WorkspaceSidebarContent, FavoritePageList, WorkspacePageTree, WorkspaceItem)
  - PageTree: 7개 (PageTree, PageTreeItem, PageTreeControls, PageTreeWithActions, usePageTreeData, types, utils)
  - PageViewer: 4개 (PageViewer, WorkspaceHeader, PageHeader, AccessDeniedPage)
  - Workspace 관리: 3개 (CreateWorkspaceDialog, WorkspaceSettingsDialog, WorkspaceContextMenu)
  - 초대 관리: 4개 (InviteMemberDialog, InviteMemberForm, MemberItem, InvitationDetailDialog)
  - 공통: 2개 (IconPicker, WorkspaceIcon)
- ✅ **12개 Server Actions**: Scenario별 2/2/4/3/1개
- ✅ **1개 공통 Hook**: useDebounce
- ✅ **Optimistic Update 패턴**: Scenario 4 (Page), Scenario 5 (즐겨찾기)

### 구현 특징:
- 🎯 User Flow의 25개 Screen 완전 커버
- 🔐 권한별 UI 차이 명확히 정의 (userRole prop + can* 유틸리티)
- ⚡ Optimistic update로 UX 향상 (Page 관리, 즐겨찾기)
- 🔄 Notification Domain 통합 (초대 알림)
- 📱 반응형 고려 (데스크톱, 태블릿, 모바일)
- 🎨 Organization 패턴 적용 (react-hook-form + zod + toast + Dialog/Form 분리)
- 📝 수도코드 수준 작성 (가이드 준수, TDD 구현 대비)

---

이 Frontend Specification을 따라 **User Flow 기반의 Workspace Management 프론트엔드 (Scenario 0~5)**를 구현할 수 있습니다! 🎨

