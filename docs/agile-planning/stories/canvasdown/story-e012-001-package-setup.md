# Story E012-001: 패키지 구조 셋업 및 기본 타입 정의

## 🎯 Story 개요
**User Story**: As a 개발자, I want to canvasdown 패키지의 기본 구조와 타입 시스템을 설정해야 so that DSL 파서와 어댑터를 개발할 수 있는 기반을 마련한다

**Story Points**: 3pts  
**우선순위**: High (P1)  
**Epic**: Epic-012 (Canvasdown 패키지 개발)  
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-001` (Epic-012의 첫 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 패키지 구조 생성
```gherkin
Given canvasdown 패키지가 아직 생성되지 않았을 때
When packages/canvasdown/core와 packages/canvasdown/react-flow 폴더를 생성하면
Then package.json, tsconfig.json, README.md가 올바르게 설정된다
And 모노레포에서 패키지가 인식된다
```

### 시나리오 2: 기본 타입 정의
```gherkin
Given 패키지 구조가 생성되었을 때
When Core 패키지에 기본 타입들을 정의하면
Then BlockTypeDefinition, EdgeTypeDefinition 인터페이스가 정의된다
And GraphNode, GraphEdge 타입이 정의된다
And CanvasdownOutput 타입이 정의된다
And TypeScript 컴파일이 성공한다
```

### 시나리오 3: 의존성 설치
```gherkin
Given 패키지 구조와 타입이 정의되었을 때
When 필요한 의존성(Chevrotain, dagre 등)을 설치하면
Then package.json에 올바른 버전이 기록된다
And 모노레포에서 의존성이 해결된다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md)

#### 패키지 구조
- [ ] `packages/canvasdown/core/` 폴더 생성
- [ ] `packages/canvasdown/react-flow/` 폴더 생성
- [ ] 각 패키지의 `package.json` 생성 (name, version, dependencies)
- [ ] 각 패키지의 `tsconfig.json` 생성
- [ ] 각 패키지의 `README.md` 생성 (기본 템플릿)
- [ ] 루트 `pnpm-workspace.yaml`에 패키지 추가

#### 기본 타입 정의
- [ ] `core/src/types/block-type.types.ts` - BlockTypeDefinition 인터페이스
- [ ] `core/src/types/edge-type.types.ts` - EdgeTypeDefinition 인터페이스
- [ ] `core/src/types/ast.types.ts` - ASTNode, ASTEdge, CanvasdownAST 타입
- [ ] `core/src/types/graph.types.ts` - GraphNode, GraphEdge 타입
- [ ] `core/src/types/output.types.ts` - CanvasdownOutput 타입
- [ ] `core/src/index.ts` - 모든 타입 export

#### 의존성 관리
- [ ] `core/package.json`에 Chevrotain 추가
- [ ] `core/package.json`에 dagre 추가
- [ ] `react-flow/package.json`에 @xyflow/react 추가
- [ ] `react-flow/package.json`에 @canvasdown/core 추가 (workspace 프로토콜)
- [ ] `react-flow/package.json`에 React 18+ 추가

#### 테스트 환경 설정
- [ ] `core/package.json`에 Vitest 추가
- [ ] `core/vitest.config.ts` 생성
- [ ] 기본 테스트 파일 생성 (`core/src/__tests__/index.test.ts`)

## 🎯 Definition of Done

### 기능 완료
- [x] 패키지 구조가 올바르게 생성됨
- [x] 모든 기본 타입이 정의되고 export됨
- [x] TypeScript 컴파일 성공
- [x] 모노레포에서 패키지 인식 및 빌드 성공

### 기술 완료
- [x] package.json 설정 완료
- [x] tsconfig.json 설정 완료
- [x] 의존성 설치 및 해결 완료
- [x] 기본 테스트 환경 설정 완료

### 품질 완료
- [x] 타입 정의에 JSDoc 주석 추가
- [x] README에 기본 사용법 예시 추가

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

## 🔗 의존성
- **선행 Story**: 없음
- **후행 Story**: E012-002 (Chevrotain 파서 구현)

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)
