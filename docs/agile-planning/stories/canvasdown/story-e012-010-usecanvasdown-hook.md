# Story E012-010: useCanvasdown 훅 구현

## 🎯 Story 개요
**User Story**: As a React 개발자, I want to useCanvasdown 훅을 사용하여 DSL을 쉽게 React Flow로 렌더링할 수 있어야 so that 간단한 API로 다이어그램을 표시할 수 있다

**Story Points**: 3pts  
**우선순위**: High (P1)  
**Epic**: Epic-012 (Canvasdown 패키지 개발)  
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-010` (Epic-012의 열 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 기본 훅 사용
```gherkin
Given DSL 텍스트와 Core 인스턴스가 있을 때
When useCanvasdown(dsl, options)를 호출하면
Then React Flow nodes와 edges가 반환된다
And 에러가 발생하지 않는다
```

### 시나리오 2: 에러 처리
```gherkin
Given 잘못된 DSL 텍스트가 있을 때
When useCanvasdown를 호출하면
Then 에러 상태가 반환된다
And 에러 메시지가 포함된다
```

### 시나리오 3: 로딩 상태
```gherkin
Given 큰 DSL 텍스트가 있을 때
When useCanvasdown를 호출하면
Then 로딩 상태가 제공된다
And 파싱/레이아웃 완료 시 결과가 반환된다
```

### 시나리오 4: DSL 변경 감지
```gherkin
Given DSL 텍스트가 변경되었을 때
When useCanvasdown가 다시 실행되면
Then 새로운 그래프 데이터가 반환된다
And 이전 결과가 무효화된다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md), [React Flow 문서](https://reactflow.dev/)

#### 훅 구현
- [x] `react-flow/src/hooks/useCanvasdown.ts` - useCanvasdown 훅
  - [x] DSL 파싱 및 레이아웃 적용
  - [x] React Flow 형식으로 변환
  - [x] 에러 처리
  - [x] 로딩 상태 관리 (동기 파싱이므로 항상 false)
- [x] `react-flow/src/hooks/useCanvasdownPatch.ts` - useCanvasdownPatch 훅
  - [x] 패치 DSL 파싱
  - [x] 패치 작업 적용
  - [x] React Flow 상태 업데이트
- [x] `react-flow/src/hooks/index.ts` - 훅 export

#### 타입 정의
- [x] useCanvasdown 옵션 타입 정의 (`UseCanvasdownOptions`)
- [x] useCanvasdown 반환 타입 정의 (`UseCanvasdownReturn`)
- [x] useCanvasdownPatch 옵션 및 반환 타입 정의

#### 테스트
- [x] 기본 훅 사용 테스트
- [x] 에러 처리 테스트
- [x] 로딩 상태 테스트
- [x] DSL 변경 감지 테스트
- [x] 방향 설정 테스트
- [x] 패치 훅 테스트

## 🎯 Definition of Done

### 기능 완료
- [x] useCanvasdown 훅 구현 완료
- [x] useCanvasdownPatch 훅 구현 완료
- [x] DSL 파싱 및 React Flow 렌더링
- [x] 에러 및 로딩 상태가 올바르게 처리됨
- [x] DSL 변경 시 자동 업데이트됨
- [x] 패치 작업 적용 기능

### 기술 완료
- [x] 훅 구현 완료 (`@workspace/canvasdown-react-flow` 패키지)
- [x] 단위 테스트 12개 모두 통과
- [x] TypeScript 타입 안전성 보장
- [x] React Flow Provider 통합

### 품질 완료
- [x] 훅 코드에 주석 및 문서 추가
- [x] 타입 정의 완료
- [x] 테스트 커버리지 확보

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

**실제 구현 내용**:
- `useCanvasdown` 훅 구현 (`packages/canvasdown-react-flow/src/hooks/useCanvasdown.ts`)
  - DSL 파싱 및 레이아웃 적용
  - React Flow 형식으로 자동 변환
  - 에러 처리 및 상태 관리
  - 방향 설정 지원
- `useCanvasdownPatch` 훅 구현 (`packages/canvasdown-react-flow/src/hooks/useCanvasdownPatch.ts`)
  - 패치 DSL 파싱
  - 패치 작업 적용
  - React Flow 상태 업데이트
  - 노드/엣지 ID 조회 기능
- 테스트 12개 모두 통과

## 🔗 의존성
- **선행 Story**: E012-009 (React Flow 통합)
- **후행 Story**: E012-011 (SSOTA 통합)

## 📦 패키지 구조

```
packages/canvasdown-react-flow/src/hooks/
├── useCanvasdown.ts        # DSL → React Flow 변환 훅
├── useCanvasdownPatch.ts   # 패치 적용 훅
└── index.ts                # Export
```

## 💡 사용 예시

```typescript
import { useCanvasdown } from '@workspace/canvasdown-react-flow';

function MyComponent() {
  const core = useMemo(() => new CanvasdownCore(), []);
  const { nodes, edges, error } = useCanvasdown(dsl, { core, direction: 'LR' });
  
  return <ReactFlow nodes={nodes} edges={edges} />;
}
```

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)
