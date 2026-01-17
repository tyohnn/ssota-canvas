# Story E012-009: React Flow 통합 및 예시 앱

## 🎯 Story 개요
**User Story**: As a 개발자, I want to Canvasdown DSL을 React Flow 캔버스에서 쉽게 볼 수 있어야 so that DSL 편집과 시각적 결과를 동시에 확인할 수 있다

**Story Points**: 3pts
**우선순위**: High (P1)
**Epic**: Epic-012 (Canvasdown 패키지 개발)
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-009` (Epic-012의 아홉 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: DSL 편집 및 렌더링
```gherkin
Given DSL 편집기와 캔버스가 있을 때
When DSL을 수정하면
Then 실시간으로 캔버스가 업데이트된다
And 파싱 에러가 표시된다
```

### 시나리오 2: 노드 데이터 표시
```gherkin
Given 노드를 선택했을 때
When 우측 패널에 노드 데이터가 표시된다
Then JSON 형태로 모든 속성이 보인다
And 커스텀 프로퍼티도 포함된다
```

### 시나리오 3: 에러 처리
```gherkin
Given 잘못된 DSL이 입력되었을 때
When 파싱이 실패하면
Then 에러 메시지가 사용자 친화적으로 표시된다
And 캔버스는 이전 유효한 상태를 유지한다
```

### 시나리오 4: 반응형 레이아웃
```gherkin
Given 다양한 화면 크기에서
When 캔버스를 사용할 때
Then 편집기와 캔버스가 적절히 배치된다
And 모바일에서도 사용 가능하다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md), [React Flow 문서](https://reactflow.dev/)

#### React Flow 어댑터 패키지 구현
- [x] `@workspace/canvasdown-react-flow` 패키지 생성
- [x] `adapter/to-react-flow.ts` - GraphNode/GraphEdge → React Flow 변환
- [x] `adapter/state-manager.ts` - CanvasStateManager 클래스
- [x] `components/CustomEdge.tsx` - 엣지 라벨 지원 커스텀 엣지
- [x] `patch/patch-applier.ts` - 패치 작업 적용 로직
- [x] `hooks/useCanvasdown.ts` - DSL 파싱 및 변환 훅
- [x] `hooks/useCanvasdownPatch.ts` - 패치 적용 훅
- [x] 메인 `index.ts` export 구성

#### 예시 앱 구현
- [x] `CanvasdownDemo` 컴포넌트 (메인 컨테이너)
- [x] `DSLEditor` 컴포넌트 (DSL 편집기)
- [x] `CanvasPreview` 컴포넌트 (React Flow 캔버스)
- [x] 커스텀 블록 컴포넌트들 (ShapeBlock, MarkdownBlock, ImageBlock, YouTubeBlock)
- [x] examples 패키지에서 react-flow 패키지 import로 변경

#### 노드 데이터 표시
- [x] 노드 선택 상태 관리
- [x] 우측 패널에 JSON 데이터 표시
- [x] 스크롤 및 스타일링

#### 에러 처리
- [x] 파싱 에러 표시
- [x] 사용자 친화적 에러 메시지
- [x] 에러 상태에서의 UI 처리

#### 테스트
- [x] 어댑터 테스트 (28개)
- [x] 패치 테스트 (17개)
- [x] 훅 테스트 (12개)
- [x] 총 57개 테스트 모두 통과

## 🎯 Definition of Done

### 기능 완료
- [x] DSL 편집과 실시간 렌더링
- [x] 노드 선택 및 데이터 표시
- [x] 파싱 에러 처리
- [x] 반응형 레이아웃

### 기술 완료
- [x] React 컴포넌트 구현 완료
- [x] 단위 테스트 커버리지 80% 이상
- [x] TypeScript 타입 안전성 보장

### 품질 완료
- [x] 컴포넌트 코드에 주석 추가
- [x] 사용 예시 문서화

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

**구현 내용**:
- `@workspace/canvasdown-react-flow` 패키지 생성 및 구현
- 어댑터, 컴포넌트, 훅, 패치 모듈 모두 구현 완료
- examples 패키지에서 react-flow 패키지 사용하도록 리팩터링
- 57개 단위 테스트 작성 및 모두 통과
- TypeScript 타입 안전성 보장

## 🔗 의존성
- **선행 Story**: E012-007 (React Flow 어댑터)
- **후행 Story**: E012-008 (Patch DSL)

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)