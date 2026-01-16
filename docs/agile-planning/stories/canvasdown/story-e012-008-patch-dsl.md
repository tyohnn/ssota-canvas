# Story E012-008: Patch DSL 기능 구현

## 🎯 Story 개요
**User Story**: As a 개발자, I want to 초기 렌더링 후에도 DSL을 통해 캔버스를 지속적으로 수정할 수 있어야 so that AI가 생성한 DSL로 캔버스를 동적으로 조작할 수 있다

**Story Points**: 8pts
**우선순위**: High (P1)
**Epic**: Epic-012 (Canvasdown 패키지 개발)
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-008` (Epic-012의 여덟 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: Patch DSL 파싱
```gherkin
Given Patch DSL 텍스트가 있을 때
When @update, @delete, @add 등의 명령어를 파싱하면
Then PatchOperation 배열로 변환된다
And 파싱 에러가 있으면 명확한 에러 메시지가 반환된다
```

### 시나리오 2: Patch 검증
```gherkin
Given Patch operations 배열이 있을 때
When validatePatch를 호출하면
Then 존재하지 않는 노드 참조를 감지한다
And @add로 추가될 노드 ID를 미리 고려하여 검증한다
And 검증 결과가 명확하게 반환된다
```

### 시나리오 3: Patch 적용
```gherkin
Given React Flow 캔버스와 Patch operations가 있을 때
When applyPatch를 호출하면
Then 노드가 추가/수정/삭제된다
And 엣지가 연결/해제된다
And 노드 위치와 크기가 변경된다
And 사용자가 드래그한 위치는 @move로만 덮어쓴다
```

### 시나리오 4: 배치 Patch 처리
```gherkin
Given 여러 Patch 명령어가 한 번에 있을 때
When 한 번에 적용하면
Then 모든 명령어가 순서대로 처리된다
And @add로 추가된 노드를 같은 배치에서 참조할 수 있다
```

### 시나리오 5: Patch Editor UI
```gherkin
Given Patch Editor 컴포넌트가 있을 때
When Patch DSL을 입력하고 "Apply Patch"를 클릭하면
Then 캔버스가 업데이트된다
And 에러가 있으면 사용자 친화적으로 표시된다
```

## 📋 개발 Task

### Canvasdown Core Domain

#### Patch 타입 정의
- [x] `PatchOperation` 기본 인터페이스 정의
- [x] `AddOperation`, `UpdateOperation`, `DeleteOperation` 정의
- [x] `ConnectOperation`, `DisconnectOperation` 정의
- [x] `MoveOperation`, `ResizeOperation` 정의
- [x] `PatchOperationUnion` 유니온 타입 정의
- [x] `PatchValidationResult` 타입 정의

#### Patch 파서 구현
- [x] Lexer에 Patch 명령어 토큰 추가 (`@update`, `@delete`, `@add`, `@connect`, `@disconnect`, `@move`, `@resize`)
- [x] `PatchParser` 클래스 구현 (Chevrotain 기반)
- [x] 각 Patch 명령어 파싱 규칙 구현
- [x] Properties 및 Custom Properties 파싱 지원
- [x] `parsePatchDSL` 함수 구현

#### Patch Visitor 구현
- [x] `PatchVisitor` 클래스 구현 (CST → PatchOperation 변환)
- [x] 각 Patch 명령어를 해당 Operation으로 변환
- [x] Custom Properties를 `{ key, value }` 형식으로 변환
- [x] `cstToPatchOperations` 함수 구현

#### Core 메서드 추가
- [x] `CanvasdownCore.parsePatch()` 메서드 구현
- [x] `CanvasdownCore.validatePatch()` 메서드 구현
  - [x] @add로 추가될 노드 ID를 미리 수집하여 검증에 반영
  - [x] 존재하지 않는 노드 참조 검증
  - [x] 블록 타입 등록 여부 검증
- [x] `CanvasdownCore.buildNodeFromAST()` 헬퍼 메서드 추가 (PatchApplier에서 사용)

### Canvasdown Examples Domain

#### React Flow 통합
- [x] `CanvasStateManager` 클래스 구현 (캔버스 상태 조회)
- [x] `applyPatch` 함수 구현 (PatchOperation → React Flow 상태 변경)
  - [x] Add, Update, Delete 처리
  - [x] Connect, Disconnect 처리
  - [x] Move, Resize 처리
  - [x] Custom Properties 변환 (`{ key, value }` → `{ schemaId, value }`)
- [x] `useCanvasdownPatch` React Hook 구현
  - [x] `useReactFlow` 통합
  - [x] parsePatch → validatePatch → applyPatch 파이프라인
  - [x] 에러 처리 및 반환

#### Patch Editor UI
- [x] `PatchEditor` 컴포넌트 구현
- [x] Patch DSL 입력 텍스트 영역
- [x] "Apply Patch" 버튼
- [x] "Load Example" 버튼
- [x] 에러 메시지 표시
- [x] `CanvasdownDemo`에 탭 인터페이스로 통합

#### 테스트
- [x] Patch 파서 단위 테스트 (`patch-parser.test.ts`)
- [x] Patch Visitor 단위 테스트 (`patch-visitor.test.ts`)
- [x] Patch Operations 통합 테스트 (`patch-operations.test.ts`)
- [x] Core Patch 메서드 테스트 (`core/patch.test.ts`)
- [x] Edge Handles 테스트 (`edge-handles.test.ts`)
- [x] Edge Labels 테스트 (`edge-labels.test.ts`)
- [x] Custom Properties 테스트 (`custom-properties.test.ts`)

## 🎯 Definition of Done

### 기능 완료
- [x] Patch DSL 파싱 및 검증
- [x] Patch Operations를 React Flow 상태에 적용
- [x] 배치 Patch 처리 (같은 배치에서 @add 후 참조 가능)
- [x] Patch Editor UI 구현
- [x] 에러 처리 및 사용자 피드백

### 기술 완료
- [x] TypeScript 타입 안전성 보장
- [x] 단위 테스트 커버리지 85% 이상
- [x] 모든 Patch 명령어 타입 지원
- [x] React Flow와의 완전한 통합

### 품질 완료
- [x] 코드 주석 및 문서화
- [x] 에러 메시지 명확성
- [x] 사용 예시 제공 (PatchEditor 예제)

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

## 🔗 의존성
- **선행 Story**: E012-009 (React Flow 통합)
- **후행 Story**: 없음

## 📝 구현 세부사항

### Patch DSL 문법
```
@update <nodeId> { <properties> }
@delete <nodeId>
@add [<blockType>:<nodeId>] "<label>" { <properties> }
@connect <sourceId> -> <targetId> : "<label>"
@disconnect <sourceId> -> <targetId>
@move <nodeId> { x: <number>, y: <number> }
@resize <nodeId> { width: <number>, height: <number> }
```

### 주요 설계 결정
1. **Patch Mode 분리**: 초기 렌더링 DSL과 Patch DSL을 분리하여 명확성 확보
2. **Position Policy**: 사용자가 드래그한 노드 위치는 `@move`로만 덮어쓰기
3. **배치 처리**: 같은 배치에서 `@add`로 추가된 노드를 즉시 참조 가능
4. **검증 로직**: `@add`로 추가될 노드 ID를 미리 수집하여 검증에 반영

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown Core README](../../../../packages/canvasdown-core/README.md)

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)
- [Sprint-026 문서](../sprints/sprint-026-canvasdown-core.md)
