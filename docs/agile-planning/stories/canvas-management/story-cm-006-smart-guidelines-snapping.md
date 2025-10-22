# Story CM-006: 스마트 가이드라인 및 스냅

## 🎯 Story 개요
**User Story**: As a 디자이너, I want to 블럭을 드래그할 때 다른 블럭들과의 정렬 가이드라인이 표시되고 자동으로 스냅되어야 so that 정확하고 일관된 레이아웃을 직관적으로 만들 수 있다

**Story Points**: 13pts  
**우선순위**: Medium  
**Epic**: Epic-002 (Canvas Management Foundation)  
**Domain**: Canvas Management Domain  
**Sprint**: Sprint 008 (Canvas Management Foundation)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 실시간 스냅 가이드라인 표시
```gherkin
Given 캔버스에 여러 블럭이 배치되어 있다
When 사용자가 블럭을 드래그한다
Then 다른 블럭들과의 정렬 가능한 지점에 가이드라인이 표시된다
And 가이드라인은 수직선, 수평선, 중심선 등이 포함된다
And 5px 임계값 이내일 때만 가이드라인이 표시된다
```

### 시나리오 2: 자동 스냅 적용
```gherkin
Given 사용자가 블럭을 드래그하고 있다
When 블럭이 다른 블럭의 정렬선으로부터 5px 이내로 이동한다
Then 블럭이 자동으로 해당 정렬선에 스냅된다
And 드래그 종료 시 최종 스냅된 위치가 저장된다
```

### 시나리오 3: 중심선 스냅 우선순위
```gherkin
Given 사용자가 블럭을 드래그하고 있다
When 여러 가이드라인이 동시에 활성화된다
Then 중심선 가이드라인이 가장 높은 우선순위를 가진다
And 가장 가까운 중심선으로 우선 스냅된다
```

---

## 📋 개발 Task (도메인별)

### Canvas Management Domain
**참조 문서**: 
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md)

#### Frontend Implementation
- [x] useCanvasSnapGuides Hook 구현 (가이드라인 계산 로직)
- [x] 스냅 계산 알고리즘 (수직/수평/중심선 감지)
- [x] 5px 임계값 및 우선순위 로직 구현
- [x] DOM 측정 기반 정확한 블럭 크기 계산
- [x] 거리 기반 필터링 (500px) 성능 최적화

#### Frontend Components
- [x] SnapGuidelines 컴포넌트 (SVG 가이드라인 렌더링)
- [x] React Flow 오버레이로 가이드라인 표시
- [x] 드래그 중 실시간 가이드라인 업데이트 (onNodeDrag)
- [x] 스냅 적용 시각적 피드백 (중심선: 점선, 엣지: 실선)
- [x] viewport 좌표 변환으로 줌/패닝 대응

#### 스냅 로직
- [x] 블럭 간 정렬선 계산 (left, right, top, bottom, center-x, center-y)
- [x] 18개 스냅 포인트 계산 (edge-edge, edge-center, center-edge, center-center)
- [x] 중심선 스냅 우선순위 적용 (high > medium > low)
- [x] 임계값 5px 내 스냅 감지 및 적용
- [x] 드래그 종료 시 최종 스냅 위치 저장
- [x] 축별 최대 3개 가이드라인 표시
- [x] 드래그 시작 시 가이드라인 초기화

---

### Testing & Quality
- [x] Unit Tests (가이드라인 계산 알고리즘: useCanvasSnapGuides)
- [x] Integration Tests (React Flow 드래그 이벤트)
- [ ] E2E Tests (스냅 동작 플로우)
- [x] 성능 테스트 (거리 기반 필터링으로 최적화)

## 🎯 Definition of Done

### 기능 완료
- [x] 드래그 중 실시간 스냅 가이드라인 표시
- [x] 5px 임계값 기반 자동 스냅 적용
- [x] 중심선 스냅 우선순위 적용 (high > medium > low)
- [x] 스냅된 위치 데이터베이스 저장
- [x] 축별 최대 3개 가이드라인 표시
- [x] 모든 방향에서 스냅 가능 (양방향)

### 기술 완료
- [x] 단위 테스트 작성 완료
- [x] Integration Tests 통과
- [ ] E2E Tests 작성 필요
- [x] 코드 리뷰 완료

### 품질 완료
- [x] 가이드라인 계산 성능 최적화 (거리 기반 필터링 500px)
- [x] 스냅 정확도 검증 (DOM 측정 기반 픽셀 단위 정확성)
- [x] 시각적 피드백 명확성 (중심선: 점선, 엣지: 실선)
- [x] viewport 좌표 변환으로 줌/패닝에도 정확한 가이드라인 표시
- [x] 가이드라인 숨김 지연 제거 (서버 저장과 분리)

## 📊 진행 상황
**현재**: 95% 완료 (E2E 테스트 제외 모든 기능 완료)

**완료일**: 2025-10-22 (Sprint 008)

**아키텍처 결정**:
- ✅ DOM 측정 기반 정확한 블럭 크기 계산 (offsetWidth/offsetHeight)
- ✅ React Flow Handle 제외하고 실제 콘텐츠 크기 측정
- ✅ 18개 스냅 포인트 계산 (edge-edge, edge-center, center-edge, center-center)
- ✅ 거리 기반 필터링 (500px) 성능 최적화
- ✅ 축별 최대 3개 가이드라인 표시
- ✅ 가이드라인 숨김과 서버 저장 분리 (응답성 개선)
- ✅ guidelines.length 조건으로 렌더링 (상태 업데이트 타이밍 이슈 해결)

## 🔗 의존성
- **선행 Story**: CM-003 (블럭 변환)
- **후행 Story**: CM-007 (엣지 생성 및 관리)
- **Sprint**: [Sprint 008](../../sprints/sprint-008-canvas-foundation.md)
- **도메인 의존성**: React Flow 드래그 이벤트 및 오버레이 렌더링

## 📁 관련 문서

### Domain Documentation
**Canvas Management Domain**:
- [Process Model](../../../event-domain-design/domains/canvas-management-domain/02-process-model.md) - Scenario 6 (스마트 가이드 & 스냅)
- [Software Design](../../../event-domain-design/domains/canvas-management-domain/03-software-design.md) - BlockMount Aggregate
- [Frontend Specification](../../../event-domain-design/domains/canvas-management-domain/04-frontend-specification.md) - useSnapGuidelines Hook, SnapGuidelines 컴포넌트

### Agile Planning
- [Epic 문서](../../epics/epic-002-canvas-management.md)
