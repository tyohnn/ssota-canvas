# Story E010-003: 블록 추가 숏컷

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 동일 타입/속성 블록을 빠르게 추가하여 so that 반복 작업을 효율적으로 수행할 수 있다

**Story Points**: 1pt  
**우선순위**: Medium (P2)  
**Epic**: Epic-010 UI/UX Improvements  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블록 주변 + 버튼 표시
```gherkin
Given 사용자가 블록을 선택했다
When 블록의 상/하/좌/우 경계 근처에 마우스를 올린다
Then 해당 방향에 + 버튼이 표시된다
```

### 시나리오 2: + 버튼으로 블록 추가
```gherkin
Given 블록 주변에 + 버튼이 표시되었다
When + 버튼을 클릭한다
Then 해당 방향에 동일한 타입의 블록이 생성된다
And 동일한 속성과 디자인을 가진다
And 기존 블록과 일정 간격으로 배치된다
```

### 시나리오 3: 블록 위치 계산
```gherkin
Given 사용자가 위쪽 + 버튼을 클릭했다
When 새 블록이 생성된다
Then 기존 블록 위쪽에 상수로 정의된 간격만큼 떨어진 위치에 생성된다
```

## 🔧 구현 상세

### + 버튼 표시 조건
1. 블록이 **선택된 상태**여야 함
2. 마우스가 블록의 **상/하/좌/우 경계 근처**에 있어야 함
3. 각 방향별로 **독립적인 + 버튼** 표시

### 블록 생성 위치 (상수)
```typescript
const BLOCK_ADD_GAP = {
  TOP: { x: 0, y: -100 },      // 위쪽: 100px 위
  BOTTOM: { x: 0, y: 100 },    // 아래쪽: 100px 아래
  LEFT: { x: -150, y: 0 },     // 왼쪽: 150px 왼쪽
  RIGHT: { x: 150, y: 0 },     // 오른쪽: 150px 오른쪽
};
```

### 복제되는 속성
- `blockType` - 블록 타입
- `properties` - 모든 사용자 정의 속성
- `style` - 스타일 설정 (색상, 테두리 등)
- `width`, `height` - 블록 크기

### 수정 대상 파일
- `base-block/components/` - 새로운 `add-buttons.tsx` 컴포넌트
- `base-block/core/use-base-block.ui.ts` - 방향별 호버 상태 관리
- `use-canvas-block-lifecycle.ts` - 블록 복제 + 위치 조정 로직

## 🎯 Definition of Done

### 기능 완료
- [ ] 블록 선택 시 상하좌우 + 버튼 영역 활성화
- [ ] 경계 근처 호버 시 + 버튼 표시
- [ ] + 버튼 클릭 시 동일 블록 생성
- [ ] 방향에 맞는 위치에 블록 배치

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
  - Canvas Management Domain: 블록 추가 기능

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-010: UI/UX Improvements](../../epics/epic-010-ui-ux-improvements.md)

