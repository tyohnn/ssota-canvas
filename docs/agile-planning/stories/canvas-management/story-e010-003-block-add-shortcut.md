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
1. 블록이 **선택된 상태**이고 **단일 선택**이어야 함
2. 마우스가 블록의 **상/하/좌/우 경계 바깥 50px 영역**에 있어야 함
3. 각 방향별로 **독립적인 + 버튼** 표시
4. 버튼은 항상 투명하게 표시되고, hover 시 진하게 표시

### 블록 생성 위치
- 경계 기준 **+50px** 위치에 생성
- 상하: x축 위치 동일, y축만 변경
- 좌우: y축 위치 동일, x축만 변경

### 복제되는 속성
- `blockType` - 블록 타입만 복제
- `properties`, `content`, `title` - 복제하지 않음 (기본값 사용)
- `width`, `height` - 블록 크기 복제

### 구현 구조
- `add-button-zones/` - AddButtonZone 컴포넌트 폴더
  - `index.tsx` - AddButtonZonesContainer, AddButtonZone
  - `add-button.tsx` - AddButton 컴포넌트
  - `core/` - 비즈니스/UI 로직 분리
    - `use-add-buttons.business.ts` - 블록 생성 로직
    - `use-add-buttons.ui.ts` - UI 상태 관리
    - `add-button-zones.context.tsx` - 컨텍스트 Provider

### 수정된 파일
- ✅ `base-block/components/add-button-zones/` - AddButtonZone 컴포넌트
- ✅ `base-block/core/use-base-block.ui.ts` - `detectEdgeHoverDirection`, `clearHoverDirection` 로직 이동
- ✅ `use-canvas-block-lifecycle.ts` - 블록 생성 로직

## 🎯 Definition of Done

### 기능 완료
- [x] 블록 선택 시 상하좌우 + 버튼 영역 활성화 - 2025-12-10
- [x] 경계 바깥 50px 영역 호버 시 + 버튼 표시 - 2025-12-10
- [x] + 버튼 항상 투명하게 표시, hover 시 진하게 - 2025-12-10
- [x] + 버튼 클릭 시 동일 타입 블록 생성 - 2025-12-10
- [x] 방향에 맞는 위치에 블록 배치 (경계 +100px) - 2025-12-10
- [x] 핸들과 AddButtonZone hover 영역 분리 - 2025-12-10

### 기술 완료
- [ ] 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과
- [x] 코드 리뷰 완료 - 2025-12-10

### 품질 완료
- [x] 사용자 경험 개선 검증 - 2025-12-10
- [x] 접근성 기준 충족 - 2025-12-10

## 📊 진행 상황
**현재**: 100% 완료 (2025-12-10 최종 완료)

### 구현 내역
- ✅ `add-button-zones/index.tsx`: AddButtonZonesContainer, AddButtonZone 컴포넌트
- ✅ `add-button-zones/add-button.tsx`: AddButton 컴포넌트 (투명도 조절)
- ✅ `add-button-zones/core/use-add-buttons.business.ts`: 블록 생성 비즈니스 로직
- ✅ `add-button-zones/core/use-add-buttons.ui.ts`: UI 상태 관리 (hover 방향)
- ✅ `add-button-zones/core/add-button-zones.context.tsx`: 컨텍스트 Provider
- ✅ `base-block/core/use-base-block.ui.ts`: `detectEdgeHoverDirection`, `clearHoverDirection` 로직
- ✅ 핸들과 AddButtonZone hover 영역 분리 (stopPropagation)

## 🔗 의존성
- **도메인 의존성**: 
  - Canvas Management Domain: 블록 추가 기능

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-010: UI/UX Improvements](../../epics/epic-010-ui-ux-improvements.md)

