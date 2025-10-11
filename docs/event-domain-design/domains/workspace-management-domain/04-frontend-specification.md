# Frontend Specification: Workspace Management Domain

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 프론트엔드개발자 + UX/UI 디자이너  
**작성일**: 2025-10-11  
**버전**: v1.2

**User Flow 참조**: `03-user-flow.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: 프론트엔드 구현 (TDD)

---

> **가이드 참조**: `docs/event-domain-design/guide/04-frontend-specification-guide.md`  
> **작성 시점**: User Flow 완료 후, 실제 구현 시작 전  
> **목적**: User Flow를 React 구조로 전환, DTO 설계, Context/Hooks/Components 정의  
> **범위**: Scenario 1 (조직 접근 및 Workspace-Page 목록 조회 및 페이지 선택)

---

## 📊 Frontend Specification Overview

### 프론트엔드 구현 개요

Workspace Management Domain의 Scenario 1을 구현하기 위한 React 프론트엔드 명세입니다.  
사용자가 조직 페이지에 접근하여 Workspace-Page 트리를 조회하고, 페이지를 선택하여 작업할 수 있는 기능을 제공합니다.

**핵심 기능**:
- Workspace-Page 트리 조회 및 표시 (사이드바)
- 즐겨찾기 섹션 (최상단)
- 페이지 선택 및 권한 검증
- Workspace/페이지 접기/펼치기 (로컬스토리지 영속성)
- 최근 방문 페이지 자동 선택 (쿠키 영속성)

### User Flow 연결점

- **입력**: `03-user-flow.md` - 4개 화면 (로딩, 메인, 페이지 로딩, 권한 없음)
- **입력**: `03-software-design.md` - Workspace Aggregate, Page Aggregate, OrganizationWorkspacePageView Read Model
- **출력**: WorkspaceContext, useWorkspace Hook, WorkspacePageTree 컴포넌트

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

### 2. Request DTOs

#### SelectPageRequest

- **파일 위치**: `src/domains/workspace-management/shared/dtos/index.ts`
- **역할**: 페이지 선택 시 Server Action에 전달하는 DTO
- **주요 속성**:
  - pageId: string (필수)
  - workspaceId: string (필수)
  - organizationId: string (필수)
- **특징**: 권한 검증을 위해 3개 ID 모두 필요

**사용 위치**:
- selectPage Hook: 페이지 클릭 시 Server Action 호출

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
  - **selectPage**(pageId, workspaceId): 페이지 선택 및 쿠키 저장
  - **toggleWorkspace**(workspaceId): Workspace 접기/펼치기 및 로컬스토리지 저장
  - **togglePage**(pageId): 페이지 접기/펼치기 및 로컬스토리지 저장
  - **refreshWorkspacePages**(): Server Action 호출하여 데이터 갱신
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

- **Props**:
  - children: React.ReactNode
  - initialWorkspaces: WorkspaceWithPagesDTO[] (Server Component에서 전달)
  - initialSelectedPageId?: string | null (URL 파라미터)
  - organizationId: string (쿠키 키 생성용)

- **특징**:
  - Organization Context 패턴을 따름
  - 로컬스토리지 기반 UI 상태 영속성 (접기/펼치기)
  - 쿠키 기반 선택 상태 영속성 (최근 방문 페이지)
  - 선택된 페이지의 ancestor 자동 펼치기 (UX 향상)

**구현 플로우**:
1. Server Component에서 `initialWorkspaces` 전달
2. useState로 상태 초기화
3. useEffect에서 로컬스토리지/쿠키 기반 상태 복원
4. Context Provider로 하위 컴포넌트에 상태 전달
5. Actions를 통해 상태 업데이트 및 영속성 처리

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
  - selectPage(pageId, workspaceId): void
  - toggleWorkspace(workspaceId): void
  - togglePage(pageId): void
  - refreshWorkspacePages(): Promise\<void\>
  
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
    
    // Actions
    selectPage,
    toggleWorkspace,
    togglePage,
    refreshWorkspacePages,
    
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
  }
  ```

- **특징**:
  - Organization의 useOrganization Hook 패턴을 따름
  - Context를 직접 사용하지 않고 Hook을 통해 접근
  - useMemo로 불필요한 재계산 방지
  - 재귀 검색 로직을 Hook에 캡슐화

**사용 시나리오**:
- WorkspacePageTree: Workspace-Page 트리 렌더링
- PageViewer: 선택된 페이지 정보 표시
- FavoriteSection: 즐겨찾기 페이지 목록 표시
- PageHeader: 페이지 제목 및 메타 정보 표시

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

- **파일 위치**: `src/domains/workspace-management/frontend/components/workspace-sidebar-content.tsx`
- **역할**: DashboardSidebar의 SidebarContent 영역에 들어가는 메인 컴포넌트 (OrgWorkspacesMenu 대체)
- **주요 기능**:
  - shadcn/ui Sidebar의 SidebarGroup으로 섹션 분리
  - 즐겨찾기 섹션 (독립적인 SidebarGroup)
  - Workspace 섹션 (독립적인 SidebarGroup)
  - 로딩 상태 처리 (Skeleton)
  - 에러 상태 처리

- **사용 Hook**: useWorkspace()

- **UI 라이브러리**: 
  - shadcn/ui Sidebar 컴포넌트
  - SidebarGroup, SidebarGroupLabel, SidebarGroupContent
  - SidebarMenu, SidebarMenuItem, SidebarMenuButton
  - Skeleton (로딩 상태)

- **구조**:
  ```tsx
  <>
    {/* 섹션 1: 즐겨찾기 */}
    <SidebarGroup>
      <SidebarGroupLabel>⭐ 즐겨찾기</SidebarGroupLabel>
      <SidebarGroupContent>
        <FavoritePageList />
      </SidebarGroupContent>
    </SidebarGroup>
    
    {/* 섹션 2: Workspaces */}
    <SidebarGroup>
      <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
      <SidebarGroupAction aria-label="Add Workspace">
        <Plus className="text-muted-foreground" />
      </SidebarGroupAction>
      <SidebarGroupContent>
        <WorkspacePageTree />
      </SidebarGroupContent>
    </SidebarGroup>
  </>
  ```

- **특징**:
  - shadcn/ui Sidebar의 SidebarGroup으로 섹션 명확히 분리
  - 각 섹션은 독립적인 컴포넌트로 관리
  - 일관된 Sidebar 디자인 패턴 유지

**사용 위치**:
- DashboardSidebar의 SidebarContent: `<OrgWorkspacesMenu />` 대신 `<WorkspaceSidebarContent />` 사용

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

- **파일 위치**: `src/domains/workspace-management/frontend/components/workspace-item.tsx`
- **역할**: 개별 Workspace와 하위 페이지 트리를 표시하는 컴포넌트
- **주요 기능**:
  - Workspace 헤더 표시 (이름, 아이콘, Chevron)
  - 접기/펼치기 토글 (Collapsible)
  - **ExplorerTree 컴포넌트를 활용한 페이지 트리 렌더링**
  - Default Workspace 표시 ("기본" 배지)
  - 빈 Workspace 처리

- **사용 Hook**: useWorkspace()

- **Props**:
  - workspace: WorkspaceWithPagesDTO

- **구조**:
  ```tsx
  <Collapsible open={isWorkspaceExpanded(workspace.workspaceId)}>
    <CollapsibleTrigger onClick={() => toggleWorkspace(workspace.workspaceId)}>
      <Chevron className={isExpanded ? 'rotate-90' : ''} />
      <WorkspaceIcon icon={workspace.icon} />
      <span>{workspace.name}</span>
      {workspace.isDefault && <Badge>기본</Badge>}
    </CollapsibleTrigger>
    
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
          enableDragDrop={false}
        />
      )}
    </CollapsibleContent>
  </Collapsible>
  ```

- **특징**:
  - Collapsible로 접기/펼치기 애니메이션
  - Chevron 아이콘 회전 (› → ∨)
  - Default Workspace는 조직 아이콘 사용
  - **PageTree 컴포넌트로 페이지 트리 위임** (Workspace Management 전용)

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

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-viewer.tsx`
- **역할**: 선택된 페이지의 상세 정보를 메인 영역에 표시하는 컴포넌트
- **주요 기능**:
  - PageHeader 표시
  - PageCanvas 표시 (미래 - Block System)
  - 로딩 상태 처리 (Skeleton)
  - 권한 없음 처리 (AccessDeniedPage)

- **사용 Hook**: useWorkspace()

- **구조**:
  ```tsx
  <div className="page-viewer">
    {isLoading ? (
      <PageViewerSkeleton />
    ) : selectedPage ? (
      <>
        <PageHeader page={selectedPage} />
        <PageCanvas page={selectedPage} />
      </>
    ) : (
      <EmptyState />
    )}
  </div>
  ```

**사용 위치**:
- `/r/[orgId]/workspace/[workspaceId]/page/[pageId]`: 메인 영역

---

#### PageHeader

- **파일 위치**: `src/domains/workspace-management/frontend/components/page-header.tsx`
- **역할**: 페이지 제목 및 메타 정보를 표시하는 컴포넌트
- **주요 기능**:
  - 페이지 아이콘 표시 (32x32px)
  - 페이지 제목 표시
  - 마지막 수정 시간 표시

- **Props**:
  - page: PageTreeNodeDTO | PageDetailsDTO

- **구조**:
  ```tsx
  <div className="page-header">
    <PageIcon icon={page.icon} size={32} />
    <h1>{page.title}</h1>
    <span className="meta">
      {formatRelativeTime(page.lastModified)} 수정됨
    </span>
  </div>
  ```

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

## ✅ 검증 체크리스트

### DTO 타입 정의
- [x] DTO 인터페이스가 Plain Object로 정의되었는가?
- [x] Date 객체가 ISO 문자열로 직렬화되었는가?
- [x] Value Object가 string으로 직렬화되었는가?
- [x] Next.js Server Actions 직렬화 제약을 준수하는가?

### Context 설계
- [x] 도메인별로 독립적인 Context가 생성되었는가?
- [x] workspaces 배열과 선택된 페이지 상태가 관리되는가?
- [x] 쿠키 기반 영속성이 구현되었는가? (`recent-page-${orgId}`)
- [x] 로컬스토리지 기반 UI 상태 영속성이 구현되었는가? (접기/펼치기)
- [x] 초기 데이터 로드 로직이 구현되었는가?

### Server Actions 연동
- [x] Supabase Auth 인증 확인이 포함되었는가?
- [x] 의존성 주입 패턴으로 Service Layer를 사용하는가?
- [x] DTO 직렬화가 올바르게 구현되었는가?
- [x] 권한 검증이 포함되었는가? (조직 멤버십 + Workspace 멤버십)

### Hook 구현
- [x] Context를 적절히 추상화한 Hook이 구현되었는가?
- [x] 비즈니스 로직 메서드가 포함되었는가? (findPageById, getWorkspaceByPage 등)
- [x] 선택된 엔티티, 기본 엔티티 등 유틸리티가 제공되는가?
- [x] useMemo로 최적화되었는가?

### 컴포넌트 연동
- [x] 컴포넌트에서 직접 Context 접근을 피하고 Hook을 사용하는가?
- [x] 재귀 트리 구조가 적절히 렌더링되는가? (PageTreeNode)
- [x] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [x] 빈 상태 처리가 포함되었는가? ("페이지를 생성하세요")

### 앱 통합
- [x] Provider가 적절한 순서로 중첩 배치되었는가? (Organization → Workspace)
- [x] 초기 데이터가 Server Components에서 전달되는가?
- [x] 쿠키 기반 영속성이 올바르게 작동하는가?
- [x] DashboardSidebar와 통합되었는가? (WorkspacePageTree)

---

## 🚀 다음 단계

이 Frontend Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 프론트엔드 코드 (Context, Hooks, Components)
- **내용**:
  - WorkspaceContext 및 WorkspaceProvider 구현
  - useWorkspace Hook 구현
  - WorkspacePageTree 및 하위 컴포넌트 구현
  - Server Actions 구현 (getWorkspacePagesAction, getPageDetailsAction)
  - React Testing Library로 컴포넌트 테스트

---

**문서 작성 완료 후**:
- [ ] 프론트엔드 개발자 리뷰 완료
- [ ] UX/UI 디자이너 리뷰 완료
- [ ] User Flow와 일관성 확인
- [ ] Software Design과 일관성 확인
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

## 📁 폴더 구조 요약

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
│   │       └── SelectPageRequest
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
│   │   ├── workspace-sidebar-content.tsx              # 사이드바 메인 래퍼 (SidebarGroup)
│   │   ├── favorite-page-list.tsx                     # 즐겨찾기 섹션 (독립)
│   │   ├── workspace-page-tree.tsx                    # Workspace 섹션 (독립)
│   │   ├── workspace-item.tsx                         # Workspace 아이템
│   │   ├── page-tree/                                 # 📁 PageTree 전용 컴포넌트
│   │   │   ├── page-tree.tsx                          # 메인 트리 컴포넌트
│   │   │   ├── page-tree-context.tsx                  # Context (단순화)
│   │   │   ├── page-tree-item.tsx                     # 개별 페이지 아이템
│   │   │   ├── page-tree-controls.tsx                 # Chevron 컨트롤
│   │   │   ├── use-page-tree-data.tsx                 # 트리 데이터 변환
│   │   │   ├── types.ts                               # 타입 정의
│   │   │   └── utils.ts                               # flattenPageTree
│   │   ├── page-viewer.tsx                            # 페이지 뷰어
│   │   ├── page-header.tsx                            # 페이지 헤더
│   │   └── access-denied-page.tsx                     # 권한 없음 페이지
│   └── utils/
│       ├── cookie-helpers.ts                          # 쿠키 유틸리티
│       └── storage-helpers.ts                         # 로컬스토리지 유틸리티
└── actions/
    └── workspace-management.actions.ts                # Server Actions
        ├── getWorkspacePagesAction
        └── getPageDetailsAction
```

---

## 📋 문서 변경 이력

### v1.2 (2025-10-11)
- **PageTree 컴포넌트 전용 설계**: ExplorerTree의 문제점 분석 후 Workspace Management Domain 전용 컴포넌트 재설계
  - 7가지 문제점 도출 및 해결 방안 수립
  - 드래그앤드롭 조건부 활성화 (`enableDragDrop` prop)
  - 폴더/파일 구분 제거, order 필드로만 정렬
  - 페이지 아이콘만 사용 (폴더 아이콘 제거)
  - Root 노드 제거 (Workspace ID를 root로 사용)
  - Context 완전 통합 (expandedPages, selectedPageId 동기화)
  - 단일 선택만 지원 (다중 선택 로직 제거)
  - 불필요한 Props 제거 및 단순화
- **컴포넌트 구조 정의**: page-tree/ 디렉토리 하위 7개 파일
  - page-tree.tsx, page-tree-context.tsx, page-tree-item.tsx
  - page-tree-controls.tsx, use-page-tree-data.tsx, types.ts, utils.ts
- **장점 비교표 추가**: ExplorerTree vs PageTree 8개 항목 비교
- **구현 우선순위 명시**: Scenario 1 (드래그앤드롭 비활성화) → Scenario 4 (활성화)

### v1.1 (2025-10-11)
- **사이드바 구조 개선**: shadcn/ui Sidebar의 SidebarGroup으로 섹션 분리
  - WorkspaceSidebarContent: 메인 래퍼 컴포넌트
  - FavoritePageList: 즐겨찾기 섹션을 독립 컴포넌트로 분리
  - WorkspacePageTree: Workspace 섹션을 독립 컴포넌트로 분리
- **PageTreeNodeDTO 확장**: parentId, order 속성 추가 (Software Design과 일치)

### v1.0 (2025-10-11)
- 초안 작성 (Scenario 1 기준)
- DTO 설계 완료 (5개 DTO)
- Context 설계 완료 (WorkspaceContext)
- Hook 설계 완료 (useWorkspace)
- 컴포넌트 설계 완료 (7개 컴포넌트)
- 앱 통합 설계 완료 (DashboardSidebar 통합)
- Organization Context 패턴 재사용
- 배열 상태 관리 + 로컬스토리지 영속성

---

이 Frontend Specification을 따라 **User Flow 기반의 Workspace Management 프론트엔드**를 구현할 수 있습니다! 🎨

