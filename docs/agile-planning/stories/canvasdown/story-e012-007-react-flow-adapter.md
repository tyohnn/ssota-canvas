# Story E012-007: React Flow 어댑터 구현

## 🎯 Story 개요
**User Story**: As a 개발자, I want to Core 패키지의 그래프 데이터를 React Flow 노드/엣지로 변환할 수 있어야 so that React Flow 캔버스에서 렌더링할 수 있다

**Story Points**: 5pts  
**우선순위**: High (P1)  
**Epic**: Epic-012 (Canvasdown 패키지 개발)  
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-007` (Epic-012의 일곱 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 노드 변환
```gherkin
Given GraphNode 데이터가 있을 때
When 어댑터가 React Flow Node로 변환하면
Then React Flow가 인식하는 Node 형식이 생성된다
And id, type, position, data가 올바르게 매핑된다
```

### 시나리오 2: 엣지 변환
```gherkin
Given GraphEdge 데이터가 있을 때
When 어댑터가 React Flow Edge로 변환하면
Then React Flow가 인식하는 Edge 형식이 생성된다
And source, target, type, label, style이 올바르게 매핑된다
```

### 시나리오 3: 전체 변환
```gherkin
Given CanvasdownOutput (nodes, edges)가 있을 때
When 어댑터가 전체 그래프를 변환하면
Then 모든 노드와 엣지가 React Flow 형식으로 변환된다
And React Flow에서 렌더링 가능한 형태가 된다
```

### 시나리오 4: 커스텀 타입 지원
```gherkin
Given GraphNode의 type이 사용자 정의 블록 타입일 때
When 어댑터가 변환하면
Then React Flow의 nodeTypes에 등록된 타입으로 매핑된다
And 커스텀 컴포넌트가 렌더링된다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md), [React Flow 문서](https://reactflow.dev/)

#### 어댑터 구현
- [ ] `react-flow/src/adapter/to-react-flow.ts` - 변환 함수들
  - [ ] toReactFlowNode 함수 (GraphNode → React Flow Node)
  - [ ] toReactFlowEdge 함수 (GraphEdge → React Flow Edge)
  - [ ] toReactFlowGraph 함수 (CanvasdownOutput → React Flow nodes/edges)
- [ ] `react-flow/src/adapter/index.ts` - 어댑터 export

#### 타입 정의
- [ ] React Flow Node/Edge 타입 정의
- [ ] 변환 옵션 타입 정의

#### 테스트
- [ ] 노드 변환 테스트
- [ ] 엣지 변환 테스트
- [ ] 전체 변환 테스트
- [ ] 커스텀 타입 변환 테스트

## 🎯 Definition of Done

### 기능 완료
- [x] Core 그래프 데이터를 React Flow 형식으로 변환 가능
- [x] React Flow에서 렌더링 가능
- [x] 커스텀 블록 타입 지원
- [x] **커스텀 프로퍼티 데이터 포함**
- [x] **노드 선택 및 데이터 표시**

### 기술 완료
- [x] 어댑터 구현 완료
- [x] 단위 테스트 커버리지 80% 이상
- [x] TypeScript 타입 안전성 보장

### 품질 완료
- [x] 어댑터 코드에 주석 및 문서 추가

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

**실제 구현 내용**:
- 커스텀 프로퍼티 데이터 React Flow 노드에 포함
- 노드 선택 및 데이터 표시 기능

## 🔗 의존성
- **선행 Story**: E012-005 (레이아웃 통합)
- **후행 Story**: E012-009 (React Flow 통합)

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서
- [React Flow 문서](https://reactflow.dev/) - React Flow 라이브러리 문서

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)
