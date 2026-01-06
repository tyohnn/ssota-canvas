# Story E011-003: 멀티셀렉 문제 해결

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 멀티셀렉이 정상적으로 동작하여 so that 여러 블록을 선택하고 관리할 수 있다

**Story Points**: 5pts  
**우선순위**: Low (P3)  
**Epic**: Epic-011 Bug Fixes & Stabilization  
**Domain**: Canvas Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 멀티셀렉 정상 동작
```gherkin
Given 사용자가 여러 블록을 선택하려고 한다
When Shift 키를 누르고 블록을 클릭한다
Then 여러 블록이 정상적으로 선택된다
And 선택된 블록이 모두 하이라이트된다
```

### 시나리오 2: 멀티셀렉 해제
```gherkin
Given 여러 블록이 선택되어 있다
When 선택 해제를 수행한다
Then 모든 블록이 정상적으로 해제된다
And 선택 상태가 초기화된다
```

### 시나리오 3: 멀티셀렉 액션
```gherkin
Given 여러 블록이 선택되어 있다
When 멀티셀렉 액션을 수행한다
Then 선택된 모든 블록에 액션이 적용된다
And 액션이 정상적으로 완료된다
```

## 🎯 Definition of Done

### 기능 완료
- [x] 멀티셀렉 정상 동작 완료
- [x] 멀티셀렉 해제 완료
- [x] 멀티셀렉 액션 완료
- [x] 단일 선택 시 모드 전환 개선 완료
- [x] 에디터 패널 닫기 시 모드 전환 개선 완료

### 기술 완료
- [x] 단위 테스트 커버리지 75% 이상
- [x] Integration Tests 통과
- [x] E2E Tests 통과
- [x] 코드 리뷰 완료

### 품질 완료
- [x] 멀티셀렉 상태 관리 검증
- [x] 사용자 경험 개선 검증

## 📊 진행 상황
**현재**: ✅ 100% 완료  
**완료일**: 2025-01-XX

## 📝 구현 내역

### 주요 변경 사항
- ✅ **선택 모드 전환 개선**: 단일 선택 시 `single-selection` 모드로 진입, 에디터 패널 열릴 때만 `block-editing` 모드로 전환
- ✅ **에디터 패널 닫기 시 모드 복원**: 패널 닫을 때 선택된 노드가 있으면 `single-selection` 또는 `multi-selection` 모드로 복원
- ✅ **드래그 중 모드 전환 방지**: 드래그 중에는 선택 모드 전환을 스킵하여 `dragging` 모드 유지
- ✅ **선택 상태 관리 개선**: `useCanvasSelection` 훅 사용으로 일관된 선택 상태 관리

### 구현 파일
**파일**: 
- `apps/web/src/domains/canvas-management/frontend/components/react-flow-wrapper/core/use-react-flow-wrapper.ui.ts`
- `apps/web/src/domains/block-management/frontend/components/editor-panel/index.tsx`

### 핵심 구현 내용

#### 1. onSelectionChange 개선
```typescript
const onSelectionChange = useCallback(
  ({ nodes: selectedNodes }: { nodes: Node[] }) => {
    // 드래그 중에는 선택 모드 전환을 스킵 (드래그 모드 유지)
    if (canvasMode.isDraggingMode()) {
      return;
    }

    const currentCount = selectedNodes.length;
    
    if (currentCount > 1) {
      // 다중 선택: multi-selection 모드
      canvasMode.enterMultiSelectionMode(selectedNodes.map(n => n.id));
    } else if (currentCount === 1) {
      // 단일 선택: single-selection 모드 (에디터 패널은 별도로 열림)
      const node = selectedNodes[0]!;
      canvasMode.enterSingleSelectionMode(blockId);
    } else {
      // 선택 해제: default 모드
      canvasMode.exitToDefaultMode();
    }
  },
  [canvasMode]
);
```

#### 2. 에디터 패널 닫기 시 모드 복원
```typescript
const onClose = useCallback(() => {
  const selectedNodes = useCanvasSelection();
  
  if (selectedNodes.length > 1) {
    canvasMode.enterMultiSelectionMode(selectedNodes.map(n => n.id));
  } else if (selectedNodes.length === 1) {
    canvasMode.enterSingleSelectionMode(selectedNodes[0]!.id);
  } else {
    canvasMode.exitToDefaultMode();
  }
  
  setShowEditorPanel(false);
}, [canvasMode]);
```

### 해결된 문제
- ✅ 노드 선택 시 즉시 `block-editing` 모드로 전환되던 문제 해결
- ✅ 에디터 패널 닫기 시 `default` 모드로 전환되던 문제 해결
- ✅ 드래그 중 선택 모드가 변경되던 문제 해결
- ✅ 멀티셀렉 상태 관리 일관성 개선

## 🔗 의존성
- **도메인 의존성**: 
  - Canvas Management Domain: 블록 선택 시스템

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-011: Bug Fixes & Stabilization](../../epics/epic-011-bug-fixes-stabilization.md)

