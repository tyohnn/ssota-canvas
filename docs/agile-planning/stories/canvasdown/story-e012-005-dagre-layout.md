# Story E012-005: dagre 레이아웃 통합

## 🎯 Story 개요
**User Story**: As a 개발자, I want to 그래프 데이터에 자동 레이아웃을 적용할 수 있어야 so that 노드들이 DSL 방향 힌트에 맞게 배치된다

**Story Points**: 3pts  
**우선순위**: High (P1)  
**Epic**: Epic-012 (Canvasdown 패키지 개발)  
**Domain**: Canvasdown Domain

**Story ID 규칙**: `E012-005` (Epic-012의 다섯 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 기본 레이아웃 적용
```gherkin
Given 그래프 데이터와 방향 힌트('LR')가 있을 때
When 레이아웃 엔진을 실행하면
Then 모든 노드에 position { x, y }가 계산된다
And 노드들이 왼쪽에서 오른쪽으로 배치된다
```

### 시나리오 2: 방향별 레이아웃
```gherkin
Given 방향 힌트가 'LR', 'RL', 'TB', 'BT'일 때
When 각각 레이아웃을 적용하면
Then 해당 방향에 맞게 노드가 배치된다
```

### 시나리오 3: 노드 크기 반영
```gherkin
Given 각 노드에 size { width, height } 정보가 있을 때
When 레이아웃을 적용하면
Then 노드 크기를 고려하여 간격이 계산된다
And 노드들이 겹치지 않는다
```

### 시나리오 4: 엣지 기반 레이아웃
```gherkin
Given 노드 간 엣지 연결 관계가 있을 때
When 레이아웃을 적용하면
Then 엣지 관계를 고려하여 노드가 배치된다
And 연결된 노드들이 가까이 배치된다
```

## 📋 개발 Task

### Canvasdown Domain
**참조 문서**: [Canvasdown README](../../../../packages/canvasdown/README.md), [dagre 문서](https://github.com/dagrejs/dagre)

#### 레이아웃 엔진 구현
- [ ] `core/src/layout/dagre-layout.ts` - DagreLayout 클래스
  - [ ] applyLayout 메서드 (그래프 데이터 + 방향 → 위치 계산된 그래프)
  - [ ] directionToRankDir 메서드 (LR, RL, TB, BT → dagre rankdir)
  - [ ] 그래프를 dagre 형식으로 변환
  - [ ] dagre 결과를 GraphNode position으로 변환
- [ ] `core/src/layout/index.ts` - 레이아웃 export

#### Core 클래스 통합
- [ ] CanvasdownCore에 레이아웃 메서드 추가
- [ ] parseAndLayout 메서드 (DSL → 레이아웃 적용된 그래프)

#### 테스트
- [ ] 기본 레이아웃 테스트
- [ ] 방향별 레이아웃 테스트
- [ ] 노드 크기 반영 테스트
- [ ] 엣지 기반 레이아웃 테스트
- [ ] 성능 테스트 (50개 노드)

## 🎯 Definition of Done

### 기능 완료
- [x] 그래프 데이터에 레이아웃 적용 가능
- [x] 방향 힌트에 맞게 노드 배치됨
- [x] 노드 크기와 엣지 관계를 고려한 레이아웃

### 기술 완료
- [x] dagre 통합 완료
- [x] 단위 테스트 커버리지 80% 이상
- [x] 50개 노드 레이아웃 < 500ms 성능 달성

### 품질 완료
- [x] 레이아웃 코드에 주석 및 문서 추가

## 📊 진행 상황
**현재**: 100% 완료 (2026-01-16 완료)

## 🔗 의존성
- **선행 Story**: E012-004 (AST 빌더)
- **후행 Story**: E012-006 (React Flow 어댑터)

## 📁 관련 문서

### Domain Documentation
**Canvasdown Domain**:
- [Canvasdown README](../../../../packages/canvasdown/README.md) - 전체 설계 문서
- [dagre 레이아웃](https://github.com/dagrejs/dagre) - 레이아웃 라이브러리 문서

### Agile Planning
- [Epic-012 문서](../epics/epic-012-canvasdown-package.md)
