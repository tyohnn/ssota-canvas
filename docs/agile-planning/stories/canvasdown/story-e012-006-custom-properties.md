# Story E012-006: 커스텀 프로퍼티 지원 추가

## 🎯 Story 개요
**User Story**: As a 사용자, I want to 블록 타입에 구애받지 않는 커스텀 속성을 정의하고 사용할 수 있어야 so that 다양한 목적의 메타데이터를 블록에 추가할 수 있다

**Story Points**: 5pts
**우선순위**: High (P1)
**Epic**: Epic-012 (Canvasdown 패키지 개발)
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-006` (Epic-012의 여섯 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 스키마 정의
```gherkin
Given DSL에 @schema 정의가 있을 때
When 스키마를 파싱하면
Then 커스텀 프로퍼티 타입 정보가 저장된다
And 옵션, 검증 규칙이 포함된다
```

### 시나리오 2: 스키마 참조 속성
```gherkin
Given @schema가 정의되고 블록에 $속성: 값이 있을 때
When DSL을 파싱하면
Then 스키마를 참조하는 customProperty가 생성된다
And 값 검증이 수행된다
```

### 시나리오 3: 인라인 타입 함수
```gherkin
Given 블록에 $속성: 타입(값, 옵션)이 있을 때
When DSL을 파싱하면
Then 인라인 스키마가 자동 생성된다
And 타입 검증이 수행된다
```

### 시나리오 4: 값 검증
```gherkin
Given 스키마에 검증 규칙이 있을 때
When 값이 규칙을 위반하면
Then 검증 에러가 발생한다
And 명확한 에러 메시지가 제공된다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md)

#### 타입 정의
- [x] `core/src/types/custom-property.types.ts` - CustomPropertyType, CustomPropertySchema, CustomPropertyValue
- [x] AST 타입 확장 (customProperties, schemas 필드)

#### 파서 확장
- [x] `@schema` 토큰 및 파서 규칙
- [x] `$property` 토큰 및 파서 규칙
- [x] 타입 함수 파싱 (`number(3, {min:1, max:5})`)
- [x] 배열 리터럴 파싱 (`["option1", "option2"]`)

#### 빌더 확장
- [x] 스키마 검증 및 저장
- [x] 인라인 스키마 자동 생성
- [x] 커스텀 속성 값 검증
- [x] GraphNode.data에 customProperties 포함

#### 테스트
- [x] 스키마 정의 파싱 테스트
- [x] 커스텀 속성 파싱 테스트
- [x] 값 검증 테스트
- [x] 인라인 타입 함수 테스트

## 🎯 Definition of Done

### 기능 완료
- [x] `@schema` 정의 파싱 및 저장
- [x] `$property` 참조 속성 지원
- [x] 인라인 타입 함수 지원
- [x] 값 검증 및 에러 처리
- [x] React Flow 노드 데이터에 포함

### 기술 완료
- [x] 커스텀 프로퍼티 타입 시스템 구현
- [x] 단위 테스트 커버리지 80% 이상
- [x] TypeScript 타입 안전성 보장

### 품질 완료
- [x] 코드에 주석 및 문서 추가
- [x] 사용 예시 문서화

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

## 🔗 의존성
- **선행 Story**: E012-002 (Chevrotain 파서)
- **후행 Story**: E012-007 (React Flow 통합)

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)