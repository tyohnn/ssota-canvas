# Story E012-004: AST → Graph Data 빌더 구현

## 🎯 Story 개요
**User Story**: As a 개발자, I want to 파싱된 AST를 그래프 데이터로 변환할 수 있어야 so that 레이아웃 엔진에서 사용할 수 있는 형식의 데이터를 생성할 수 있다

**Story Points**: 5pts  
**우선순위**: High (P1)  
**Epic**: Epic-012 (Canvasdown 패키지 개발)  
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-004` (Epic-012의 네 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 노드 생성
```gherkin
Given ASTNode { type: 'shape', id: 'start', label: 'Start', properties: {...} }가 있을 때
When 빌더가 레지스트리에서 'shape' 타입 정보를 조회하고 노드를 생성하면
Then defaultProperties와 properties가 병합된 GraphNode가 생성된다
And defaultSize가 설정된다
```

### 시나리오 2: 엣지 생성
```gherkin
Given ASTEdge { source: 'start', target: 'end', edgeType: 'flow' }가 있을 때
When 빌더가 레지스트리에서 'flow' 타입 정보를 조회하고 엣지를 생성하면
Then defaultShape와 defaultStyle이 적용된 GraphEdge가 생성된다
```

### 시나리오 3: 전체 그래프 빌드
```gherkin
Given 완전한 CanvasdownAST (direction, nodes, edges)가 있을 때
When 빌더가 전체 AST를 처리하면
Then 모든 노드와 엣지가 올바르게 변환된 그래프 데이터가 생성된다
And 방향 정보가 유지된다
```

### 시나리오 4: 속성 병합
```gherkin
Given 블록 타입의 defaultProperties와 DSL의 properties가 모두 있을 때
When 빌더가 노드를 생성하면
Then DSL properties가 defaultProperties를 오버라이드한다
And 병합된 최종 properties가 GraphNode에 설정된다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md)

#### 빌더 구현
- [ ] `core/src/builder/graph-builder.ts` - GraphBuilder 클래스
  - [ ] buildFromAST 메서드 (AST → Graph Data)
  - [ ] buildNode 메서드 (ASTNode → GraphNode)
  - [ ] buildEdge 메서드 (ASTEdge → GraphEdge)
  - [ ] mergeProperties 메서드 (defaultProperties + properties)
- [ ] `core/src/builder/index.ts` - 빌더 export

#### 타입 레지스트리 통합
- [ ] 빌더에서 타입 레지스트리 사용
- [ ] 등록되지 않은 타입 처리
- [ ] 기본값 적용 로직

#### 테스트
- [ ] 노드 생성 테스트
- [ ] 엣지 생성 테스트
- [ ] 전체 그래프 빌드 테스트
- [ ] 속성 병합 테스트
- [ ] 미등록 타입 에러 처리 테스트

## 🎯 Definition of Done

### 기능 완료
- [x] AST를 그래프 데이터로 변환 가능
- [x] 타입 레지스트리와 연동하여 기본값 적용
- [x] 속성 병합이 올바르게 동작함
- [x] **커스텀 프로퍼티 값 검증**
- [x] **인라인 스키마 생성 및 관리**

### 기술 완료
- [x] 빌더 구현 완료
- [x] 단위 테스트 커버리지 80% 이상
- [x] TypeScript 타입 안전성 보장

### 품질 완료
- [x] 빌더 코드에 주석 및 문서 추가

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

**구현된 기능**:
- 커스텀 프로퍼티 값 검증
- 인라인 스키마 자동 생성
- 타입 함수 값 추출

## 🔗 의존성
- **선행 Story**: E012-002 (Chevrotain 파서), E012-003 (타입 레지스트리)
- **후행 Story**: E012-005 (레이아웃 통합)

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)
