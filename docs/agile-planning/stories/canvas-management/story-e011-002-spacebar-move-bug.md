# Story E011-002: 스페이스바 이동 버그 수정

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 스페이스바로 이동한 후 선택도구 툴바가 정상적으로 동작하여 so that 작업 흐름이 방해받지 않는다

**Story Points**: 3pts  
**우선순위**: Low (P3)  
**Epic**: Epic-011 Bug Fixes & Stabilization  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 스페이스바 이동 후 툴바 동작
```gherkin
Given 사용자가 스페이스바를 눌러 캔버스를 이동했다
When 스페이스바를 놓는다
Then 선택도구 툴바가 정상적으로 표시된다
And 툴바 기능이 정상적으로 동작한다
```

### 시나리오 2: 툴 상태 복원
```gherkin
Given 사용자가 스페이스바로 이동했다
When 이동을 완료한다
Then 이전 툴 상태가 정상적으로 복원된다
And 사용자가 계속 작업할 수 있다
```

## 🎯 Definition of Done

### 기능 완료
- [x] 스페이스바 이동 버그 수정 완료
- [x] 선택도구 툴바 정상 동작 완료
- [x] 툴 상태 복원 완료
- [x] 패닝 모드 전환 시 viewport 저장 버그 수정 완료

### 기술 완료
- [x] 단위 테스트 커버리지 75% 이상
- [x] Integration Tests 통과
- [x] E2E Tests 통과
- [x] 코드 리뷰 완료

### 품질 완료
- [x] 키보드 이벤트 처리 검증
- [x] 사용자 경험 개선 검증

## 📊 진행 상황
**현재**: ✅ 100% 완료  
**완료일**: 2025-01-XX

## 📝 구현 내역

### 주요 변경 사항
- ✅ **Viewport 즉시 저장 기능**: `flushViewportSave` 함수 구현
- ✅ **패닝 모드 전환 시 viewport 저장**: 스페이스바 해제 및 모드 변경 시 즉시 저장
- ✅ **React Flow 내부 상태 초기화**: `key` prop을 사용하여 `panOnDrag` 변경 시 강제 리렌더링
- ✅ **뷰포트 저장 debounce 로직 개선**: 빠른 패닝 후에도 viewport가 정상적으로 저장되도록 개선

### 구현 파일
**파일**: 
- `apps/web/src/domains/canvas-management/frontend/hooks/use-canvas-viewport.ts`
- `apps/web/src/domains/canvas-management/frontend/components/react-flow-wrapper/core/use-react-flow-wrapper.ts`
- `apps/web/src/domains/canvas-management/frontend/components/react-flow-wrapper/components/index.tsx`

### 핵심 구현 내용

#### 1. flushViewportSave 함수
```typescript
const flushViewportSave = useCallback(() => {
  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }
  if (lastViewportRef.current) {
    viewportStorage.setViewportState(pageId, lastViewportRef.current);
  }
}, [viewportStorage, pageId]);
```

#### 2. 패닝 모드 종료 시 viewport 저장
- 스페이스바 해제 시 (`keyup` 이벤트)
- 캔버스 툴바로 모드 변경 시 (`useEffect`로 모드 변경 감지)

#### 3. React Flow key prop 추가
```typescript
<ReactFlow
  key={isPanningMode ? 'panning-mode' : 'default-mode'}
  // ... other props
/>
```

### 해결된 문제
- ✅ 빠른 패닝 후 viewport가 이전 상태로 되돌아가는 문제 해결
- ✅ 스페이스바 해제 후에도 패닝이 계속되는 문제 해결 (`key` prop으로 React Flow 내부 상태 초기화)
- ✅ 패닝 모드 전환 시 viewport가 저장되지 않는 문제 해결

## 🔗 의존성
- **도메인 의존성**: 
  - Canvas Management Domain: 키보드 이벤트 처리, 툴바 상태 관리

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-011: Bug Fixes & Stabilization](../../epics/epic-011-bug-fixes-stabilization.md)

