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
1. **더보기 메뉴에 옵션 추가**
   - 위치: BlockMountToolbar > DropdownMenu
   - 이름: "페이지 옮기기"
   - 아이콘: `MoveRight` 또는 `FileOutput`

2. **페이지 검색 팝오버**
   - 검색 입력창 (실시간 필터링)
   - 페이지 목록 (트리 구조 또는 플랫 목록)
   - 현재 페이지는 비활성화 표시

### 백엔드 로직
1. 블록을 현재 페이지에서 unmount
2. 대상 페이지에 mount (기본 위치: 중앙)
3. 트랜잭션으로 처리 (원자성 보장)

### 수정 대상 파일
- `block-mount-toolbar/index.tsx` - 메뉴 옵션 추가
- `block-mount-toolbar/page-move-popover.tsx` - 새 컴포넌트
- `canvas.actions.ts` - moveBlockToPage 액션
- `canvas-block-lifecycle.service.ts` - 블록 이동 서비스

## 🎯 Definition of Done

### 기능 완료
- [ ] 더보기 메뉴에 "페이지 옮기기" 옵션 추가
- [ ] 페이지 검색 팝오버 구현
- [ ] 블록 이동 기능 구현
- [ ] 성공/실패 피드백 표시

### 기술 완료
- [ ] 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 사용자 경험 개선 검증
- [ ] 접근성 기준 충족

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

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

