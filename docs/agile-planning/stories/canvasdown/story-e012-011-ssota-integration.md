# Story E012-011: SSOTA 블록 타입 등록 및 통합

## 🎯 Story 개요
**User Story**: As a SSOTA 사용자, I want to SSOTA의 기존 블록 타입들을 Canvasdown에 등록하여 사용할 수 있어야 so that AI가 생성한 DSL을 SSOTA 캔버스에서 바로 렌더링할 수 있다

**Story Points**: 2pts  
**우선순위**: High (P1)  
**Epic**: Epic-012 (Canvasdown 패키지 개발)  
**Domain**: Canvasdown Domain + Block Management Domain

**Story ID 규칙**: `E012-011` (Epic-012의 열한 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블록 타입 등록
```gherkin
Given SSOTA의 블록 타입들(text, shape, markdown, image 등)이 있을 때
When 각 블록 타입을 Canvasdown에 등록하면
Then 모든 블록 타입이 레지스트리에 등록된다
And DSL에서 '@text', '@shape' 등을 사용할 수 있다
```

### 시나리오 2: DSL → SSOTA 캔버스 렌더링
```gherkin
Given AI가 생성한 DSL 텍스트가 있을 때
When useCanvasdown로 파싱하고 React Flow에 전달하면
Then SSOTA 캔버스에서 블록들이 올바르게 렌더링된다
And 각 블록 타입의 컴포넌트가 정상 동작한다
```

### 시나리오 3: 블록 속성 매핑
```gherkin
Given DSL의 블록 속성이 있을 때
When SSOTA 블록으로 변환하면
Then SSOTA BlockProperties 형식으로 올바르게 매핑된다
And 각 블록 타입의 속성이 정상 적용된다
```

### 시나리오 4: 엣지 렌더링
```gherkin
Given DSL의 엣지 정의가 있을 때
When SSOTA 캔버스에서 렌더링하면
Then CustomEdge 컴포넌트로 올바르게 렌더링된다
And 엣지 스타일과 라벨이 정상 표시된다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md)

#### SSOTA 블록 타입 등록
- [ ] `apps/web/src/integrations/canvasdown/ssota-block-registry.ts` - SSOTA 블록 타입 등록 함수
  - [ ] text 블록 타입 등록
  - [ ] shape 블록 타입 등록
  - [ ] markdown 블록 타입 등록
  - [ ] image 블록 타입 등록
  - [ ] 기타 주요 블록 타입들 등록
- [ ] 각 블록 타입의 defaultProperties 및 defaultSize 매핑

### Block Management Domain
**참조 문서**: [Block Data Types](../../../../apps/web/src/domains/block-management/shared/types/block-data.types.ts)

#### 속성 매핑
- [ ] DSL properties → SSOTA BlockProperties 변환 로직
- [ ] 각 블록 타입별 속성 매핑 함수

### Canvas Management Domain
**참조 문서**: [React Flow ACL](../../../../apps/web/src/domains/canvas-management/frontend/acl/react-flow.acl.ts)

#### 통합
- [ ] useCanvasdown 훅을 캔버스에 통합
- [ ] AI 에이전트가 DSL 생성 → 캔버스 렌더링 플로우
- [ ] POC 완성

#### 테스트
- [ ] 블록 타입 등록 테스트
- [ ] DSL → SSOTA 캔버스 렌더링 테스트
- [ ] 각 블록 타입별 렌더링 테스트
- [ ] 엣지 렌더링 테스트

## 🎯 Definition of Done

### 기능 완료
- [ ] SSOTA 블록 타입들이 Canvasdown에 등록됨
- [ ] DSL을 SSOTA 캔버스에서 렌더링 가능
- [ ] 모든 주요 블록 타입이 정상 동작함

### 기술 완료
- [ ] 통합 코드 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] POC가 정상 동작함

### 품질 완료
- [ ] 통합 코드에 주석 및 문서 추가

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: E012-010 (useCanvasdown 훅)
- **도메인 의존성**: Block Management Domain, Canvas Management Domain

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서

**Block Management Domain**:
- [Block Data Types](../../../../apps/web/src/domains/block-management/shared/types/block-data.types.ts)

**Canvas Management Domain**:
- [React Flow ACL](../../../../apps/web/src/domains/canvas-management/frontend/acl/react-flow.acl.ts)

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)
