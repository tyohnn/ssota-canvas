## 캔버스 도메인 아키텍처 (Canvas Domain Architecture)

### 목적

- 워크플로우 전용 `workflow-canvas`를 일반화하여, 2차원 의미 관계를 갖는 다양한 기획 산출물(IA, User Flow, User Story, Wireframe, Wireflow, Domain, Roadmap, Epic, Story 등)을 동일한 레이아웃과 정책 체계로 관리/수정하는 캔버스 도메인을 정의한다.
- 동일한 데이터 스키마(`blocks`, `edges`, `block_positions`)를 유지하며, 페이지별 정책과 뷰 어댑터만 교체 가능한 구조를 확립한다.

### 범위와 차별점

- 공통 레이아웃은 `workflow-canvas`와 동일: 좌측 탐색기(폴더/페이지), 상단 툴박스, 중앙 캔버스, 우측 AI/에디터 패널.
- 비즈니스 차이: 워크플로우(7 블록) 고정 설계가 아니라, “페이지(=블록)” 단위로 의미적 노드/엣지 셋을 선택/구성한다.
- 멀티 뷰: Canvas View(2D), Table View, Kanban View, Markdown View. 전용 스키마 없이 `block.metadata` + `column_definition`을 이용해 유연하게 프로젝션한다.

### 핵심 개념

- Page Folder: 유저가 만든 구분 폴더. 예: IA, User Flow, User Story, …
- Page(=Block): 폴더 내의 실제 페이지. 클릭 시 해당 페이지가 ‘컨텍스트’가 되어 포함 블록과 엣지가 캔버스에 출력된다.
- View: 동일 데이터에 대한 2D(캔버스), 테이블, 칸반, MD 프로젝션. 컬럼/그룹/템플릿은 `metadata` + `column_definition`로 선언.
- Policy: 페이지 종류별로 허용 블록/엣지/레이아웃/에디터 UI를 결정하는 전략군. 기존 `workflow-canvas`의 정책 시스템을 재사용/확장.

### 데이터 모델 맵핑 (schema.ts)

- blocks: 모든 것은 블록. 페이지 자체도 블록. `block_type`은 공통 enum. 추가로 `object` 열(enum)로 블록의 성격을 구분한다.
  - object enum: `page` | `component` | `block`
  - page: 페이지 블록(보기를 갖는 상위 컨텍스트)
  - component: 컴포넌트 정의/인스턴스(메타데이터로 role 구분)
  - block: 일반 블록(기타)
- edges: 의미관계. 기본 타입(`contains`, `next`, `input`, `output`, `accesses`, `used_by`)을 재사용한다.
  - 소프트 마이그레이션: 개념적 분류 → 렌더링 분류로 점진 전환한다.
  - 기본형 `basic` 타입을 추가로 사용해, 새로운 렌더링 중심 타입으로 이전 준비를 한다.
- block_positions: 컨텍스트(=page block) 별 좌표. 동일 블록이 페이지마다 다른 위치를 가질 수 있다.

아래 스키마는 그대로 활용한다:

```startLine:endLine:xbowl/apps/web/src/db/schema.ts
// 블럭/엣지/포지션 테이블 및 제약/인덱스/정책 정의
```

### 블록 타입 운용 원칙 (enum 최소화)

- 목적: `block_type`은 React Flow 렌더링·레이아웃을 좌우하는 최소 코어 타입만 유지한다.
- 소프트 마이그레이션: 기존 워크플로우 도메인의 개념적 분류와 캔버스 도메인의 렌더링 분류를 동시에 사용한다.
- 단기: 기존 enum을 유지하되, `text_block` 타입을 정의하여 간단한 텍스트 블록 렌더링을 표준화한다.
- 메타데이터: 실제 노드의 디자인/행동은 모두 `metadata`로 정의하고, 렌더러가 이를 읽어 표현한다.

### 계층 모델: parent_block_id vs block_positions

- 페이지/폴더 위계는 `parent_block_id`로만 표현한다. 이는 의미적 계층(콘텐츠 트리)이다.
- 최상위 루트 폴더는 별도로 만들지 않는다. `parent_block_id`가 `null`이면 해당 블록은 워크스페이스 최상위에 속한다.
- `block_positions`는 특정 페이지(컨텍스트)에서의 렌더링 좌표로, 위계와 무관한 시각 배치 데이터다.
- 별도의 `page_type` 필드는 사용하지 않는다. 페이지 판별은 필수 메타데이터(views, allowed_component_ids, allowed_edge_types)의 존재로 수행한다.

### 정책 아키텍처 참고 범위 (코드 재작성 예정)

- 페이지 렌더링 정책: 페이지에서 어떤 블록/엣지를 표시할지 결정(메타데이터 기반 동적 정책으로 재작성 예정, 아래 링크는 참고용).

```startLine:endLine:xbowl/apps/web/src/domains/workflow-canvas/policy/page-rendering-policy.ts
// PageRenderingPolicy 인터페이스와 팩토리
```

- 블록 추가 정책: 페이지 컨텍스트에서 허용되는 블록 그룹과 아이템(동적 정책으로 재작성 예정, 아래 링크는 참고용).

```startLine:endLine:xbowl/apps/web/src/domains/workflow-canvas/policy/block-addition-policy.ts
// BlockAdditionPolicy 인터페이스와 팩토리
```

- 엣지 추가 정책: 클릭 기반 관계 생성 규칙(동적 정책으로 재작성 예정, 아래 링크는 참고용).

```startLine:endLine:xbowl/apps/web/src/domains/workflow-canvas/policy/edge-addition-policy.ts
// EdgeAdditionPolicy 인터페이스와 팩토리
```

- 레이아웃 정책: 새 블록의 기본 위치와 재배치 알고리즘(TBD 세부 룰 논의 예정, 아래 링크는 참고용).

```startLine:endLine:xbowl/apps/web/src/domains/workflow-canvas/policy/block-layout-policy.ts
// BlockPositionPolicy 인터페이스와 팩토리
```

- 에디터 정책: 블록 타입별 폼/검증/탭 구성(메타데이터 기반 폼 수정/보기 설정 중심으로 재구성 예정, 아래 링크는 참고용).

```startLine:endLine:xbowl/apps/web/src/domains/workflow-canvas/policy/editor-rendering-policy.ts
// EditorRenderingStrategy 인터페이스와 팩토리
```

### 페이지 블록 판별과 메타데이터 요구사항

- 별도 `page_type` 필드는 사용하지 않는다.
- 다음 메타데이터 키가 존재하면 “페이지 블록”으로 간주한다(필수):
  - `views` (default/table/kanban/markdown)
  - `allowed_component_ids` (정의 id 화이트리스트)
  - `allowed_edge_types`

예시: 페이지 블록 메타데이터

```json
{
  "object": "page",
  "views": {
    "default": "canvas",
    "table": { "columns": ["name", "status", "priority"] },
    "kanban": { "groupBy": "status" },
    "markdown": { "template": "# {{name}}\n{{description}}" }
  },
  "allowed_component_ids": ["djfld2", "dfh25"],
  "allowed_edge_types": ["contains", "next"]
}
```

### 컴포넌트 정의/인스턴스 모델 (object enum 기반)

- 별도 정의 테이블을 두지 않고, 동일 `blocks` 테이블에서 `object` 열로 구분한다.
- 컴포넌트 정의/인스턴스 모두 `object = "component"`를 사용하고, `metadata.role`로 `definition` | `instance`를 구분한다.
- 인스턴스는 `metadata.component_id`로 정의 블록(id)을 참조한다. 페이지는 `allowed_component_ids`에 정의 id를 화이트리스트로 보관한다.

컴포넌트 정의(예시, blocks 테이블 레코드)

```json
{
  "id": "30000000-0000-4000-8000-000000000002",
  "object": "component",
  "block_type": "basic_text",
  "slug": "cdef-page",
  "name": "ComponentDef: Page",
  "metadata": {
    "role": "definition",
    "component_key": "page",
    "node_ui": {
      "shape": "rect",
      "icon": "file-text",
      "color": "emerald",
      "ports": { "left": true, "right": true },
      "size": { "w": 240, "h": 100 }
    },
    "schema": {
      "fields": [
        { "id": "priority", "type": "select", "options": ["P0", "P1", "P2"] }
      ]
    }
  }
}
```

컴포넌트 인스턴스 블록(예시, blocks 테이블 레코드)

```json
{
  "object": "component",
  "block_type": "basic_text",
  "name": "Welcome Screen",
  "slug": "welcome-screen",
  "metadata": {
    "role": "instance",
    "component_id": "30000000-0000-4000-8000-000000000002",
    "overrides": { "node_ui": { "color": "emerald" } },
    "data": { "status": "todo", "description": "" }
  }
}
```

User Story 페이지(화이트리스트 예시)

```json
{
  "block_type": "workflow",
  "name": "User Onboarding Story",
  "slug": "us-onboarding",
  "metadata": {
    "page_kind": "user_story",
    "allowed_component_ids": ["djfld2", "dfh25"],
    "views": {
      "default": "canvas",
      "table": { "columns": ["name", "status"] },
      "kanban": { "groupBy": "status" }
    }
  }
}
```

렌더링 로직(개요)

- 선택된 페이지의 컨텍스트에서 `block_positions`를 기준으로 표시 대상 인스턴스를 수집한다.
- 인스턴스의 `metadata.component_id`가 페이지의 `allowed_component_ids`에 포함되어야 한다.
- 표시 시 정의의 `node_ui`와 인스턴스 `overrides.node_ui`를 머지하여 React Flow 노드로 변환한다.

### 도메인 전용 정의 테이블 사용 여부

- 컴포넌트 정의를 위해 별도 테이블을 사용하지 않는다. `blocks.object = component` + `metadata.role`로 일원화한다.
- `block_definition`/`edge_definition`/`column_definition`은 사용하지 않는다.
- 컬럼 기반 보기(Table/Kanban)는 페이지 메타데이터(`views`)로만 구성한다.

### 멀티 뷰(프로젝션) 아키텍처

- Canvas View: 현재와 동일한 React Flow 기반. `PageRenderingPolicy`에서 display blocks/edges를 파생 생성.
- Table View: 페이지 메타데이터의 `views.table.columns` 기반으로 `dbBlocks`를 테이블화.
- Kanban View: 페이지 메타데이터의 `views.kanban.groupBy` 기준으로 분류. 이동 시 `metadata[groupBy]` 업데이트.
- Markdown View: 페이지 메타데이터의 `views.markdown.template`로 렌더.

구현 포인트:

- 뷰 어댑터를 `components/views/{canvas|table|kanban|markdown}`로 분리.
- 동일한 DB 단일 소스 원칙 유지. 뷰는 파생 상태만 관리.
- `useDbCanvasState`(리팩토링 계획서) → DB CRUD 단일 진입점.

### 상태 관리(요약)

- `CanvasProvider`/`useCanvasEventHandler`: UI/파생 상태/이벤트 중앙 관리.

```startLine:endLine:xbowl/apps/web/src/domains/workflow-canvas/contexts/CanvasContext.tsx
// Provider와 Context 값 구성
```

```startLine:endLine:xbowl/apps/web/src/domains/workflow-canvas/hooks/component/useCanvasHandler.tsx
// DB 상태, 파생 상태, UI 상태, 이벤트 흐름
```

- DB 단일 소스: `dbBlocks`, `dbEdges`, `dbBlockPositions`
- 파생 상태: `displayBlocks`, `displayEdges` (활성 페이지/뷰에 따라 재계산)

### 페이지별 정책 예시 매핑

- IA(page_kind=ia): Page 노드 + contain 엣지 중심. 허용 노드: Page, Note … 허용 엣지: contains
- User Story(page_kind=user_story): `allowed_component_ids`로 허용된 컴포넌트 정의만 인스턴스 표시 + contains/next
- Wireflow(page_kind=wireflow): Screen + Action + next 중심, 일부 input/output 허용

정책 확장 방법:

1. `PageRenderingPolicyFactory`에서 page_kind 분기(또는 메타데이터 기반 전략 선택) 추가
2. `BlockAdditionPolicyFactory`/`EdgeAdditionPolicyFactory`에서 허용(화이트리스트) 및 생성 규칙 주입
3. `BlockPositionPolicyFactory`에서 배치 규칙 튜닝(예: 좌/우/중앙 정렬)

### 네비게이션(좌측 탐색기)

- 기존 트리는 `block_type` 기반 분류. 캔버스 도메인에서는 `page_kind` 폴더(유저 생성)로 그룹핑한다.
- 구현 아이디어: `usePageBlockExplorerHandler`에서 `dbBlocks`를 `metadata.page_kind` 기준으로 동적 폴더 구성.

```startLine:endLine:xbowl/apps/web/src/domains/workflow-canvas/hooks/component/usePageBlockExplorerHandler.tsx
// 현재는 타입 폴더 → page_kind 폴더로 확장 예정
```

### 보안/권한(RLS)

- `schema.ts`의 RLS/인덱스/제약을 유지. 페이지/블록/엣지/포지션은 워크스페이스 소유자 기준으로 보호된다.

### 성능

- 파생 상태(표시용)만 React Flow에 전달. DB가 단일 소스 → 메모리/렌더 효율 유지.
- 페이지 전환 시 필요한 데이터만 파생 생성. 레이아웃 계산은 정책에서 최소화.

### 추후 확장

- 실시간 협업(포지션/선택 동기화), Undo/Redo(서버 스냅샷), 뷰 플러그인(커스텀 렌더러) 추가.

### 관련 문서

- docs/domains/domain-canvas-policy.md
- docs/canvas-data-flow-refactoring-plan.md
- docs/xbowl-architecture-specification.md
