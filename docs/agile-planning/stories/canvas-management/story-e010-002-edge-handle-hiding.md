# Story E010-002: 엣지 핸들 숨기기

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 불필요한 엣지 핸들을 숨겨서 so that 더 깔끔한 UI를 사용할 수 있다

**Story Points**: 1pt  
**우선순위**: Medium (P2)  
**Epic**: Epic-010 UI/UX Improvements  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 엣지 핸들 기본 숨김
```gherkin
Given 사용자가 캔버스를 사용하고 있다
When 블록을 확인한다
Then 엣지 핸들이 기본적으로 숨겨진다
```

### 시나리오 2: 블록 경계 호버 시 핸들 표시
```gherkin
Given 블록이 캔버스에 있다
When 사용자가 블록의 경계 부분에 마우스를 올린다
Then 해당 방향의 엣지 핸들이 표시된다
```

### 시나리오 3: 연결 모드에서 핸들 표시
```gherkin
Given 사용자가 엣지 연결을 시작했다 (connect start)
When 다른 블록에 마우스를 올린다
Then 해당 블록의 모든 엣지 핸들이 표시된다
And 연결 가능한 상태로 표시된다
```

## 🔧 구현 상세

### 핸들 표시 조건
1. **기본 상태**: 모든 핸들 숨김
2. **블록 경계 호버**: 호버된 방향의 핸들만 표시
3. **연결 모드 (connect start)**: 
   - Canvas Mode를 `connecting` 모드로 변경
   - 다른 블록 호버 시 해당 블록의 모든 핸들 표시

### 수정 대상 파일
- `base-block/components/handles.tsx` - 핸들 표시 조건 로직
- `base-block/core/use-base-block.ui.ts` - 호버 영역 감지 상태
- `canvas-mode-context.tsx` - connecting 모드 추가
- `canvas-react-flow-wrapper.tsx` - onConnectStart/onConnectEnd 핸들러

## 🎯 Definition of Done

### 기능 완료
- [ ] 엣지 핸들 기본 숨김 처리 완료
- [ ] 블록 경계 호버 시 핸들 표시
- [ ] 연결 모드에서 핸들 표시
- [ ] UI 간소화 완료

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
  - Canvas Management Domain: 엣지 UI

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-010: UI/UX Improvements](../../epics/epic-010-ui-ux-improvements.md)

