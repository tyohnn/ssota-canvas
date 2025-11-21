# Canvas Management Stories

Canvas Management Domain의 개발 Story 목록입니다.

## 📊 Story 개요

| Story ID | 제목 | Story Points | 우선순위 | 상태 |
|----------|------|--------------|----------|------|
| CM-001 | 캔버스 데이터 로드 및 렌더링 | 8pts | High | 📋 재계획 완료 |
| CM-002 | 블럭 생성 및 마운팅 | 13pts | High | 📋 재계획 완료 |
| CM-003 | 블럭 변환 (드래그, 리사이즈, 정렬) | 21pts | High | 📋 재계획 완료 |
| CM-004 | 블럭 선택 및 다중 선택 | ~~8pts~~ 통합됨 | ~~Medium~~ | ⚠️ CM-002/003에 통합 |
| CM-005 | 블럭 정렬 및 분포 도구 | ~~8pts~~ 통합됨 | ~~Medium~~ | ⚠️ CM-003에 통합 |
| CM-006 | 스마트 가이드라인 및 스냅 | ~~13pts~~ 통합됨 | ~~Medium~~ | ⚠️ CM-003에 통합 |
| CM-007 | 엣지 생성 및 관리 | 13pts | Medium | 📋 계획 필요 |
| CM-008 | 블럭 삭제 및 엣지 정리 | 8pts | Medium | 📋 계획 필요 |
| CM-009 | 캔버스 뷰포트 관리 | ~~8pts~~ 통합됨 | ~~Medium~~ | ⚠️ CM-001/003에 통합 |
| CM-010 | 블럭 복제 | 8pts | Low | 📋 계획 필요 |
| CM-011 | 통합 테스트 및 성능 최적화 | 13pts | Medium | 📋 계획 필요 |

**총 Story Points**: 
- **기존**: 120pts
- **재계획**: 84pts (CM-001: 8pts, CM-002: 13pts, CM-003: 21pts, CM-007: 13pts, CM-008: 8pts, CM-010: 8pts, CM-011: 13pts)
- **통합됨**: 36pts (CM-004, CM-005, CM-006, CM-009가 주요 스토리에 통합됨)

**Epic**: Epic-002 (Canvas Management Foundation)

---

## 🔄 Story 재구성 배경

### 설계 변경 사항
2025-10-20 기준, Canvas Management Domain의 설계가 **React Flow 중심 아키텍처**로 대폭 변경되었습니다:

1. **Canvas Aggregate 제거**: Canvas는 DB 테이블이 아니므로 Aggregate 불필요 → Read Model Query로 대체
2. **Hook 분리**: 단일 Hook → 7개 전문 Hooks (Mode, BlockLifecycle, BlockTransform, Viewport, Selection, SnapGuides, EdgeManagement)
3. **모드 관리**: `useCanvasMode()` 도입으로 UI 렌더링 조건 명확화
4. **정렬 로직**: 서버 계산 → 프론트엔드 계산, 서버는 최종 위치값만 저장

### Story 통합 이유
기존에 별도 스토리로 분리되었던 기능들이 실제로는 하나의 기능으로 함께 작동해야 함:

- **CM-004 (블럭 선택)** → CM-002/003에 통합
  - 이유: 블럭 생성 시 자동 선택, 드래그 시 선택 관리가 필연적으로 함께 동작
  - `useCanvasSelection()` Hook은 CM-002에서 구현

- **CM-005 (정렬 도구)** → CM-003에 통합
  - 이유: 다중 선택 UI와 정렬 기능은 분리 불가능 (MultiSelectionToolbar)
  - 정렬 알고리즘도 프론트엔드에서 계산되므로 드래그와 동일 레이어

- **CM-006 (스냅 가이드라인)** → CM-003에 통합
  - 이유: 드래그 중에만 표시되므로 드래그 기능과 분리 불가능
  - `useCanvasSnapGuides()` Hook은 드래그 이벤트와 밀접

- **CM-009 (뷰포트 관리)** → CM-001/003에 통합
  - 이유: 뷰포트 복원은 초기 렌더링 (CM-001), 뷰포트 제어는 블럭 편집 과정 (CM-003)
  - `useCanvasViewport()` Hook은 CM-003에서 구현

---

## 📅 Sprint 계획 (재조정)

### Sprint 008: Canvas Foundation (42pts)
**기간**: 2025-10-21 ~ 2025-11-04 (2주)

- **CM-001**: 캔버스 데이터 로드 및 렌더링 (8pts)
- **CM-002**: 블럭 생성 및 마운팅 (13pts)
- **CM-003**: 블럭 변환 (드래그, 리사이즈, 정렬) (21pts)

**완료 시 테스트 가능**:
- ✅ 페이지 접근 → 캔버스 렌더링
- ✅ 블럭 생성 → 배치 → 선택
- ✅ 블럭 드래그 → 리사이즈 → 정렬
- ✅ 스냅 가이드라인
- ✅ 뷰포트 제어

### Sprint 009: Canvas Editing Tools (29pts)
**기간**: 2025-11-05 ~ 2025-11-18 (2주)

- **CM-007**: 엣지 생성 및 관리 (13pts)
- **CM-008**: 블럭 삭제 및 엣지 정리 (8pts)
- **CM-010**: 블럭 복제 (8pts)

**완료 시 테스트 가능**:
- ✅ Sprint 008의 모든 기능
- ✅ 엣지 연결 → 타입 변경
- ✅ 블럭 삭제 → 엣지 자동 정리
- ✅ 블럭 복제

### Sprint 010: Integration & Optimization (13pts)
**기간**: 2025-11-19 ~ 2025-12-02 (2주)

- **CM-011**: 통합 테스트 및 성능 최적화 (13pts)

**완료 시 테스트 가능**:
- ✅ 전체 캔버스 편집 플로우
- ✅ 성능 최적화 (100개 이상 블럭)
- ✅ E2E 시나리오 전체

---

## 🔗 의존성 관계 (재조정)

```
CM-001 (데이터 로드 & 렌더링)
    ↓
CM-002 (블럭 생성 + 선택 관리)
    ↓
CM-003 (블럭 변환 + 정렬 + 스냅 + 뷰포트)
    ↓
CM-007 (엣지 생성) ← CM-008 (블럭 삭제) ← CM-010 (블럭 복제)
    ↓
CM-011 (통합 테스트)
```

**순차적 의존성**:
- CM-001 → CM-002: 데이터 렌더링 없이 블럭 생성 불가
- CM-002 → CM-003: 블럭 생성 없이 변형/정렬 불가
- CM-003 → CM-007: 블럭 조작 완성 후 엣지 연결
- CM-007, CM-008, CM-010 → CM-011: 모든 기능 완성 후 통합 테스트

**병렬 가능**:
- CM-007, CM-008, CM-010은 서로 독립적 (Sprint 009에서 병렬 진행 가능)

---

## 📁 Story 파일 목록

### Sprint 008 (Foundation)
1. [story-cm-001-canvas-initialization.md](./story-cm-001-canvas-initialization.md) - ⭐ 재작성 완료
2. [story-cm-002-block-creation-mounting.md](./story-cm-002-block-creation-mounting.md) - ⭐ 재작성 완료
3. [story-cm-003-block-transformation.md](./story-cm-003-block-transformation.md) - ⭐ 재작성 완료

### Sprint 009 (Editing Tools)
4. ~~[story-cm-004-block-selection.md](./story-cm-004-block-selection.md)~~ - ⚠️ CM-002/003에 통합됨
5. ~~[story-cm-005-block-alignment-tools.md](./story-cm-005-block-alignment-tools.md)~~ - ⚠️ CM-003에 통합됨
6. ~~[story-cm-006-smart-guidelines-snapping.md](./story-cm-006-smart-guidelines-snapping.md)~~ - ⚠️ CM-003에 통합됨
7. [story-cm-007-edge-creation-management.md](./story-cm-007-edge-creation-management.md) - 📋 재계획 필요
8. [story-cm-008-block-deletion-cleanup.md](./story-cm-008-block-deletion-cleanup.md) - 📋 재계획 필요
9. ~~[story-cm-009-viewport-management.md](./story-cm-009-viewport-management.md)~~ - ⚠️ CM-001/003에 통합됨
10. [story-cm-010-block-duplication.md](./story-cm-010-block-duplication.md) - 📋 재계획 필요

### Sprint 010 (Integration)
11. [story-cm-011-integration-testing-optimization.md](./story-cm-011-integration-testing-optimization.md) - 📋 재계획 필요

---

## 🎯 각 스토리 완료 시 테스트 가능 범위

### CM-001 완료 후 ✅
**사용자가 할 수 있는 것**:
- ✅ 페이지 접근 → 빈 캔버스 확인
- ✅ 기존 페이지 접근 → 블럭/엣지 렌더링 확인
- ✅ 뷰포트 복원 확인 (zoom, center)
- ✅ 블럭 추가 버튼 표시 (비활성화)

**사용자가 할 수 없는 것**:
- ❌ 블럭 생성 (CM-002 필요)
- ❌ 블럭 편집 (CM-003 필요)

### CM-002 완료 후 ✅✅
**사용자가 할 수 있는 것**:
- ✅ CM-001의 모든 기능
- ✅ 플러스 버튼 클릭 → 블럭 타입 선택
- ✅ 블럭 생성 모드 진입 → 스켈레톤 블럭 표시
- ✅ 캔버스 클릭 → 블럭 생성 (Optimistic UI)
- ✅ 생성된 블럭 선택 상태 확인
- ✅ BlockMountToolbar 표시 확인
- ✅ 블럭 선택/다중 선택 상태 관리

**사용자가 할 수 없는 것**:
- ❌ 블럭 드래그 이동 (CM-003 필요)
- ❌ 블럭 리사이즈 (CM-003 필요)
- ❌ 블럭 정렬 (CM-003 필요)

### CM-003 완료 후 ✅✅✅ (완전한 캔버스 편집!)
**사용자가 할 수 있는 것**:
- ✅ CM-001, CM-002의 모든 기능
- ✅ 블럭 드래그 → 위치 이동 → 서버 저장
- ✅ 블럭 리사이즈 → 크기 변경 → 서버 저장
- ✅ 스냅 가이드라인 표시 (드래그 중)
- ✅ 다중 블럭 선택 → 정렬/분포
- ✅ 뷰포트 줌/패닝 제어
- ✅ **완전한 블럭 레이아웃 작업!** 🎉

**사용자가 할 수 없는 것**:
- ❌ 엣지 연결 (CM-007 필요)
- ❌ 블럭 삭제 (CM-008 필요)
- ❌ 블럭 복제 (CM-010 필요)

---

## 📋 Story Points 재조정 배경

### 통합된 스토리들

#### CM-004 (블럭 선택) → CM-002/003에 통합
- **이유**: 블럭 생성 시 자동 선택되므로 CM-002에서 구현 필수
- **구현 위치**: 
  - `useCanvasSelection()` Hook → CM-002
  - `onNodeClick`, `onSelectionChange` 핸들러 → CM-002
  - 선택 상태 읽기 메서드 → CM-002

#### CM-005 (정렬 도구) + CM-006 (스냅 가이드) → CM-003에 통합
- **이유**: 
  - 정렬은 다중 선택 UI와 분리 불가능 (MultiSelectionToolbar)
  - 스냅은 드래그 중에만 동작하므로 드래그 기능과 분리 불가능
- **구현 위치**: 
  - `useCanvasBlockTransform()` Hook (정렬 메서드 포함) → CM-003
  - `useCanvasSnapGuides()` Hook → CM-003
  - `MultiSelectionToolbar`, `SnapGuidelines` 컴포넌트 → CM-003

#### CM-009 (뷰포트 관리) → CM-001/003에 통합
- **이유**: 
  - 뷰포트 복원은 초기 렌더링의 일부 (CM-001)
  - 뷰포트 제어는 캔버스 편집 과정의 일부 (CM-003)
- **구현 위치**: 
  - 뷰포트 복원 로직 → CM-001
  - `useCanvasViewport()` Hook (제어 메서드) → CM-003
  - `ViewportControls` 컴포넌트 → CM-003

### Story Points 증가
- **CM-003**: 13pts → 21pts (+8pts)
  - 통합된 기능: 스냅 가이드라인 (+5pts), 정렬 도구 (+3pts)
  - 복잡도 증가: 7개 Hook 통합, 모드별 UI 렌더링

---

## 📅 Sprint 계획 (재조정)

### Sprint 008: Canvas Foundation (42pts)
**기간**: 2025-10-21 ~ 2025-11-04 (2주)  
**목표**: 기본 캔버스 렌더링 + 블럭 생성 + 블럭 변형 완성

- **CM-001**: 캔버스 데이터 로드 및 렌더링 (8pts)
- **CM-002**: 블럭 생성 및 마운팅 (13pts)
- **CM-003**: 블럭 변환 (드래그, 리사이즈, 정렬) (21pts)

**완료 기준**: 사용자가 블럭을 생성하고 자유롭게 배치/정렬할 수 있음

---

### Sprint 009: Canvas Editing Tools (29pts)
**기간**: 2025-11-05 ~ 2025-11-18 (2주)  
**목표**: 엣지 연결 + 블럭 삭제 + 블럭 복제 완성

- **CM-007**: 엣지 생성 및 관리 (13pts)
- **CM-008**: 블럭 삭제 및 엣지 정리 (8pts)
- **CM-010**: 블럭 복제 (8pts)

**완료 기준**: 사용자가 블럭을 연결하고, 삭제하고, 복제할 수 있음

---

### Sprint 010: Integration & Optimization (13pts)
**기간**: 2025-11-19 ~ 2025-12-02 (2주)  
**목표**: 통합 테스트 + 성능 최적화

- **CM-011**: 통합 테스트 및 성능 최적화 (13pts)

**완료 기준**: 100개 이상 블럭에서 60fps 유지, 모든 E2E 시나리오 통과

---

## 🎯 완료 시점별 사용자 경험

### Sprint 008 완료 (Week 4)
**사용자 경험**:
```
"페이지를 열면 이전에 작업하던 캔버스가 나타나고,
플러스 버튼으로 블럭을 추가할 수 있어요.
블럭을 드래그해서 원하는 위치로 옮기고,
크기도 조절할 수 있어요.
여러 블럭을 선택해서 한번에 정렬할 수도 있네요!"
```

### Sprint 009 완료 (Week 6)
**사용자 경험**:
```
"이제 블럭들을 선으로 연결할 수 있어요!
필요없는 블럭은 삭제 버튼으로 지울 수 있고,
비슷한 블럭은 복제 버튼으로 빠르게 만들 수 있어요."
```

### Sprint 010 완료 (Week 8)
**사용자 경험**:
```
"블럭이 100개가 넘어도 부드럽게 움직이고,
모든 기능이 안정적으로 동작해요.
이제 실제 프로젝트에 사용할 수 있겠어요!"
```

---

## 📁 문서 변경 이력

### v2.0 (2025-10-20)
- **대규모 재구성**: Canvas Aggregate 제거, Read Model 패턴 적용
- **Story 통합**: CM-004, 005, 006, 009를 주요 스토리에 통합
- **Story Points 재조정**: 120pts → 84pts
- **Sprint 재계획**: 3개 Sprint로 재조정
- **테스트 가능 범위 명확화**: 각 스토리 완료 시점에 테스트 가능한 기능 명시

### v1.0 (2025-01-17)
- 초안 작성
- 11개 독립 스토리 정의
- Sprint 4개로 계획

---

## 📚 관련 문서
- [Epic 문서](../../epics/epic-002-canvas-management.md)
- [Domain Documentation](../../../event-domain-design/domains/canvas-management-domain/)
- [Sprint 008](../../sprints/sprint-008-canvas-foundation.md)

---

*재조정된 스토리 구조는 실제 사용자가 각 스토리 완료 시점에 의미 있는 기능을 테스트할 수 있도록 설계되었습니다! 🎯*
