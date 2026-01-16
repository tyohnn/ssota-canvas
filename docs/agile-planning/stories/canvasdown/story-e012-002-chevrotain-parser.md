# Story E012-002: Chevrotain 파서 기본 구조 구현

## 🎯 Story 개요
**User Story**: As a 개발자, I want to Chevrotain을 사용하여 DSL 텍스트를 파싱할 수 있어야 so that 사용자가 작성한 DSL을 AST로 변환할 수 있다

**Story Points**: 8pts  
**우선순위**: High (P1)  
**Epic**: Epic-012 (Canvasdown 패키지 개발)  
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-002` (Epic-012의 두 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 기본 DSL 파싱
```gherkin
Given canvas LR 방향 힌트가 있을 때
When "canvas LR" 라인을 파싱하면
Then direction이 'LR'로 설정된 AST가 생성된다
```

### 시나리오 2: 블록 정의 파싱
```gherkin
Given @shape start "Start" { shapeType: ellipse } 형식의 블록 정의가 있을 때
When 해당 라인을 파싱하면
Then type='shape', id='start', label='Start', properties={shapeType: 'ellipse'}인 ASTNode가 생성된다
```

### 시나리오 3: 엣지 정의 파싱
```gherkin
Given start -> process : "begins" 형식의 엣지 정의가 있을 때
When 해당 라인을 파싱하면
Then source='start', target='process', label='begins'인 ASTEdge가 생성된다
```

### 시나리오 4: 전체 DSL 파싱
```gherkin
Given 여러 블록과 엣지를 포함한 완전한 DSL이 있을 때
When 전체 DSL을 파싱하면
Then 모든 노드와 엣지가 올바르게 파싱된 CanvasdownAST가 생성된다
And 파싱 에러가 발생하지 않는다
```

### 시나리오 5: 파싱 에러 처리
```gherkin
Given 잘못된 문법의 DSL이 있을 때
When 파싱을 시도하면
Then 명확한 에러 메시지가 반환된다
And 에러 위치(라인 번호, 컬럼) 정보가 포함된다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md), [Chevrotain 문서](https://chevrotain.io/)

#### Chevrotain 파서 구조
- [ ] `core/src/parser/lexer.ts` - 토큰 정의 (KEYWORD, ID, STRING, ARROW, etc.)
- [ ] `core/src/parser/parser.ts` - 파서 규칙 정의
  - [ ] canvas 방향 파싱 (LR, RL, TB, BT)
  - [ ] 블록 정의 파싱 (@blockType ID "label" { props })
  - [ ] 엣지 정의 파싱 (source -> target : label)
  - [ ] 속성 파싱 (key: value 쌍)
- [ ] `core/src/parser/index.ts` - 파서 export

#### AST 변환
- [ ] 파싱 결과를 CanvasdownAST 형식으로 변환
- [ ] ASTNode 생성 (type, id, label, properties)
- [ ] ASTEdge 생성 (source, target, label, edgeType)

#### 에러 처리
- [ ] Chevrotain 에러 메시지 커스터마이징
- [ ] 라인 번호/컬럼 정보 추출 및 반환
- [ ] 사용자 친화적 에러 메시지 생성

#### 테스트
- [ ] 기본 DSL 파싱 테스트
- [ ] 블록 정의 파싱 테스트
- [ ] 엣지 정의 파싱 테스트
- [ ] 전체 DSL 파싱 테스트
- [ ] 에러 케이스 테스트

## 🎯 Definition of Done

### 기능 완료
- [x] DSL 텍스트를 CanvasdownAST로 파싱 가능
- [x] 블록 정의, 엣지 정의가 올바르게 파싱됨
- [x] **커스텀 프로퍼티 파싱** (`@schema`, `$property`, 타입 함수)
- [x] **배열 리터럴 파싱** (`["item1", "item2"]`)
- [x] 파싱 에러 시 명확한 에러 메시지 제공

### 기술 완료
- [x] Chevrotain 파서 구현 완료
- [x] 단위 테스트 커버리지 80% 이상
- [x] TypeScript 타입 안전성 보장
- [x] 에러 처리가 올바르게 동작함

### 품질 완료
- [x] 파서 코드에 주석 및 문서 추가
- [x] 에러 메시지가 사용자 친화적임

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

**구현된 기능**:
- 커스텀 프로퍼티 지원 (`@schema`, `$property`, 인라인 타입 함수)
- 배열 리터럴 파싱 지원
- 완전한 DSL 파싱 (노드, 엣지, 속성, 커스텀 속성)

## 🔗 의존성
- **선행 Story**: E012-001 (패키지 구조 셋업)
- **후행 Story**: E012-003 (타입 레지스트리), E012-004 (AST 빌더)

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서
- [Chevrotain 문서](https://chevrotain.io/) - 파서 라이브러리 문서

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)
