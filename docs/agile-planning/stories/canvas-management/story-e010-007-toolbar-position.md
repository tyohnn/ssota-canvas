# Story E010-007: 캔버스 툴바 좌측 중앙 (수직 배치)

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 캔버스 툴바가 좌측 중앙에 수직으로 위치하여 so that 더 일관된 UI 레이아웃을 사용할 수 있다

**Story Points**: 1pt  
**우선순위**: Medium (P2)  
**Epic**: Epic-010 UI/UX Improvements  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 툴바 위치 변경
```gherkin
Given 사용자가 캔버스를 사용하고 있다
When 캔버스 툴바를 확인한다
Then 툴바가 좌측 중앙에 수직으로 위치한다
And 툴바 아이템이 세로로 배치된다
And 툴바가 명확하게 보인다
```

## 🔧 구현 상세

### 변경 내용
- 현재: `position="top-center"` (상단 중앙, 수평)
- 변경: `position="left"` (좌측 중앙, 수직)

### 수정 대상 파일
- `canvas-react-flow-wrapper.tsx` - Panel position 변경
- `canvas-toolbar.tsx` - flex-col로 변경, Separator 방향 변경, Tooltip side 변경

### 코드 변경
```tsx
// canvas-react-flow-wrapper.tsx
// Before
<Panel position="top-center" className="m-0! pointer-events-auto! z-10">

// After
<Panel position="left" className="m-0! ml-4! pointer-events-auto! z-10">

// canvas-toolbar.tsx
// Before
className="flex items-center gap-1 px-2 py-1.5 ..."

// After
className="flex flex-col items-center gap-1 px-1.5 py-2 ..."
```

## 🎯 Definition of Done

### 기능 완료
- [ ] 툴바 위치 변경 완료 (top-center → top-left)
- [ ] 캔버스 상단 좌측 배치 완료

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
  - Canvas Management Domain: 툴바 UI

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-010: UI/UX Improvements](../../epics/epic-010-ui-ux-improvements.md)

