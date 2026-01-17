# Story E012-003: 타입 레지스트리 시스템 구현

## 🎯 Story 개요
**User Story**: As a 개발자, I want to 블록 및 엣지 타입을 동적으로 등록하고 관리할 수 있어야 so that 사용자가 자신의 커스텀 타입 시스템을 활용할 수 있다

**Story Points**: 5pts  
**우선순위**: High (P1)  
**Epic**: Epic-012 (Canvasdown 패키지 개발)  
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-003` (Epic-012의 세 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블록 타입 등록
```gherkin
Given CanvasdownCore 인스턴스가 있을 때
When registerBlockType('shape', { defaultProperties: {...}, defaultSize: {...} })를 호출하면
Then 'shape' 타입이 레지스트리에 등록된다
And 이후 '@shape' 블록 정의를 파싱할 수 있다
```

### 시나리오 2: 엣지 타입 등록
```gherkin
Given CanvasdownCore 인스턴스가 있을 때
When registerEdgeType('flow', { defaultShape: 'default', defaultStyle: {...} })를 호출하면
Then 'flow' 타입이 레지스트리에 등록된다
And 이후 'source -> target : flow' 엣지 정의를 사용할 수 있다
```

### 시나리오 3: 미등록 타입 처리
```gherkin
Given 'unknownType'가 등록되지 않았을 때
When '@unknownType ...' 블록 정의를 파싱하면
Then 명확한 에러 메시지가 반환된다
And 등록 가능한 타입 목록이 제안된다
```

### 시나리오 4: 타입 검증
```gherkin
Given 등록된 블록 타입에 validate 함수가 있을 때
When properties가 검증 조건을 만족하지 않으면
Then 검증 에러가 반환된다
And 에러 메시지에 검증 실패 이유가 포함된다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md)

#### 타입 레지스트리 구현
- [ ] `core/src/registry/block-type-registry.ts` - BlockTypeRegistry 클래스
  - [ ] registerBlockType 메서드
  - [ ] getBlockType 메서드
  - [ ] hasBlockType 메서드
  - [ ] listBlockTypes 메서드
- [ ] `core/src/registry/edge-type-registry.ts` - EdgeTypeRegistry 클래스
  - [ ] registerEdgeType 메서드
  - [ ] getEdgeType 메서드
  - [ ] hasEdgeType 메서드
  - [ ] listEdgeTypes 메서드
- [ ] `core/src/registry/index.ts` - 레지스트리 export

#### Core 클래스 통합
- [ ] `core/src/core.ts` - CanvasdownCore 클래스
  - [ ] BlockTypeRegistry, EdgeTypeRegistry 인스턴스 관리
  - [ ] registerBlockType, registerEdgeType 메서드 위임
  - [ ] 타입 검증 로직 통합

#### 타입 검증
- [ ] validate 함수 실행 로직
- [ ] 검증 에러 처리 및 메시지 생성

#### 테스트
- [ ] 블록 타입 등록/조회 테스트
- [ ] 엣지 타입 등록/조회 테스트
- [ ] 미등록 타입 에러 처리 테스트
- [ ] 타입 검증 테스트

## 🎯 Definition of Done

### 기능 완료
- [x] 블록/엣지 타입을 동적으로 등록 가능
- [x] 등록된 타입을 조회 및 사용 가능
- [x] 미등록 타입에 대한 명확한 에러 메시지 제공

### 기술 완료
- [x] 타입 레지스트리 구현 완료
- [x] 단위 테스트 커버리지 80% 이상
- [x] TypeScript 타입 안전성 보장
- [x] 타입 검증 로직이 올바르게 동작함

### 품질 완료
- [x] 레지스트리 코드에 주석 및 문서 추가
- [x] 에러 메시지가 사용자 친화적임

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

## 🔗 의존성
- **선행 Story**: E012-001 (패키지 구조 셋업)
- **후행 Story**: E012-004 (AST 빌더)

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)
