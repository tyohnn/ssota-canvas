# Story E010-004: 블록 액션 위치

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 블록 액션이 블록 아래쪽에 위치하여 so that 더 직관적으로 블록을 관리할 수 있다

**Story Points**: 1pt  
**우선순위**: Medium (P2)  
**Epic**: Epic-010 UI/UX Improvements  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블록 액션 위치 변경
```gherkin
Given 사용자가 블록을 선택했다
When 블록 액션을 확인한다
Then 블록 액션이 블록 아래쪽에 표시된다
And 액션 버튼이 명확하게 보인다
```

## 🔧 구현 상세

### 변경 내용
- 현재: `Position.Right` (블록 우측)
- 변경: `Position.Bottom` (블록 아래쪽)

### 수정 대상 파일
- `block-action-bar/index.tsx` - NodeToolbar position 변경

### 코드 변경
```tsx
// Before
<NodeToolbar
  isVisible={true}
  position={Position.Right}
  ...
>

// After
<NodeToolbar
  isVisible={true}
  position={Position.Bottom}
  ...
>
```

## 🎯 Definition of Done

### 기능 완료
- [x] 블록 액션 위치 변경 완료 (Right → Bottom) - 2025-12-08
- [x] 블록 아래쪽 배치 완료 - 2025-12-08

### 기술 완료
- [ ] 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과
- [x] 코드 리뷰 완료 - 2025-12-08

### 품질 완료
- [x] 사용자 경험 개선 검증 - 2025-12-08
- [x] 접근성 기준 충족 - 2025-12-08

## 📊 진행 상황
**현재**: 100% 완료 (2025-12-08 구현 완료)

## 🔗 의존성
- **도메인 의존성**: 
  - Canvas Management Domain: 블록 액션 UI

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-010: UI/UX Improvements](../../epics/epic-010-ui-ux-improvements.md)

