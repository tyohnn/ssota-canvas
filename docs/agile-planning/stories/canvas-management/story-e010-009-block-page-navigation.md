# Story E010-009: 블록 페이지 옮기기

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 블록을 다른 페이지로 옮겨서 so that 블록을 원하는 페이지에서 관리할 수 있다

**Story Points**: 1pt  
**우선순위**: Medium (P2)  
**Epic**: Epic-010 UI/UX Improvements  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 페이지 옮기기 옵션 접근
```gherkin
Given 사용자가 블록을 선택했다
When mount toolbar의 더보기 메뉴를 클릭한다
Then "페이지 옮기기" 옵션이 표시된다
```

### 시나리오 2: 페이지 검색 팝오버
```gherkin
Given 사용자가 "페이지 옮기기"를 클릭했다
When 팝오버가 표시된다
Then 페이지 검색 입력창이 표시된다
And 현재 워크스페이스의 페이지 목록이 표시된다
```

### 시나리오 3: 블록 이동
```gherkin
Given 사용자가 대상 페이지를 선택했다
When 페이지를 클릭한다
Then 블록이 현재 페이지에서 제거된다
And 블록이 선택한 페이지로 이동된다
And 성공 메시지가 표시된다
```

## 🔧 구현 상세

### UI 구성
1. **더보기 메뉴에 옵션 추가** ✅
   - 위치: BlockMountToolbar > DropdownMenu
   - 이름: "페이지 옮기기"
   - PageMovePopover 컴포넌트 통합

2. **페이지 검색 팝오버** ✅
   - 3-layer architecture (UI/Business/Combined hooks)
   - 검색 입력창 (서버 사이드 검색, 300ms 디바운싱)
   - 초기 로드: 최근 페이지 20개 표시
   - 검색 시: 전체 워크스페이스 검색 (최대 50개)
   - 페이지 목록 (플랫 목록, ScrollArea)
   - 현재 페이지는 비활성화 표시
   - 동적 아이콘 렌더링 (lucide-react)
   - 로딩 상태 표시

### 백엔드 로직
1. **블록 이동** ✅
   - `moveBlockToPageAction` 서버 액션 (DDD 패턴)
   - `BlockMountAggregate.moveToPage()` 메서드
   - 대상 페이지의 우측 블록 옆에 배치 (또는 (0,0) if empty)
   - `BlockMovedToPageEvent` 도메인 이벤트 발생

2. **페이지 검색** ✅
   - `searchPagesAction` 서버 액션 (moveBlockToPageAction 패턴 준수)
   - `PageRepository.searchByWorkspaceId()` (ilike 쿼리)
   - 제목 기준 대소문자 구분 없이 검색
   - 최대 50개 결과 제한

### 구현된 파일
**Frontend:**
- `block-mount-toolbar/index.tsx` - 메뉴 옵션 추가 ✅
- `block-mount-toolbar/page-move-popover/` - 새 컴포넌트 구조 ✅
  - `components/` - UI 컴포넌트 (trigger, content, search-input, list, list-item)
  - `core/` - 비즈니스 로직 (context, provider, hooks: ui/business/combined)
- `canvas-management/frontend/hooks/use-canvas-block-lifecycle.ts` - TanStack Query optimistic updates ✅

**Backend:**
- `canvas-management/actions/block.actions.ts` - moveBlockToPageAction ✅
- `canvas-management/backend/services/canvas-block-mount.service.ts` - moveBlockToPage 서비스 ✅
- `canvas-management/shared/aggregates/block-mount.aggregate.ts` - moveToPage 메서드 ✅
- `canvas-management/shared/commands/index.ts` - MoveBlockToPageCommand ✅
- `canvas-management/shared/events/index.ts` - BlockMovedToPageEvent ✅
- `canvas-management/shared/dtos/requests/block.requests.ts` - MoveBlockToPageRequestSchema ✅
- `canvas-management/shared/dtos/responses/block.responses.ts` - BlockMovedToPageDTO ✅
- `workspace-management/actions/workspace-management.actions.ts` - searchPagesAction ✅
- `workspace-management/backend/repositories/interfaces/page.repository.interface.ts` - searchByWorkspaceId ✅
- `workspace-management/backend/repositories/implementations/drizzle-page.repository.ts` - searchByWorkspaceId 구현 ✅
- `workspace-management/shared/dtos/requests/page.requests.ts` - SearchPagesRequestSchema ✅
- `workspace-management/shared/dtos/index.ts` - SearchPagesResponse ✅

## 🎯 Definition of Done

### 기능 완료
- [x] 더보기 메뉴에 "페이지 옮기기" 옵션 추가 - 2025-12-10
- [x] 페이지 검색 팝오버 구현 (서버 사이드 검색 포함) - 2025-12-10
- [x] 블록 이동 기능 구현 (우측 블록 옆 배치) - 2025-12-10
- [x] 성공/실패 피드백 표시 (toast) - 2025-12-10

### 기술 완료
- [x] DDD 패턴 준수 (Server Action → Service → Repository) - 2025-12-10
- [x] 3-layer architecture (UI/Business/Combined hooks) - 2025-12-10
- [x] TanStack Query optimistic updates - 2025-12-10
- [x] 무한 루프 버그 수정 - 2025-12-10
- [ ] 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [x] 사용자 경험 개선 검증 (디바운싱, 로딩 상태) - 2025-12-10
- [x] 접근성 기준 충족 (Button 컴포넌트, disabled 상태) - 2025-12-10

## 📊 진행 상황
**현재**: 100% 완료 (2025-12-10)

**구현 완료 항목:**
- ✅ 페이지 이동 팝오버 컴포넌트 (3-layer architecture)
- ✅ 서버 사이드 페이지 검색 (300ms 디바운싱)
- ✅ 블록 이동 기능 (우측 블록 옆 배치)
- ✅ 동적 아이콘 렌더링
- ✅ Optimistic updates (TanStack Query)
- ✅ 무한 루프 버그 수정

## 🔗 의존성
- **도메인 의존성**: 
  - Canvas Management Domain: 블록 mount/unmount
  - Workspace Management Domain: 페이지 목록 조회

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

**Workspace Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-010: UI/UX Improvements](../../epics/epic-010-ui-ux-improvements.md)

