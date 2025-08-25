## Canvas Mock: Hotel Booking App (DB-aligned Plan)

목표: 호텔 예약 앱 기획을 캔버스 도메인으로 관리하기 위한 가짜(목업) 데이터 설계안을 실제 DB 스키마(drizzle schema.ts: blocks, edges, block_positions, workspaces, users)에 맞춰 정리한다. 이 문서는 JSON 시드 작성 전 설계용 문서다.

### 전제

- 현재 스키마 준수: `blocks`, `edges`, `block_positions` 만 사용
- block_type: 기존 enum만 사용. 간단 텍스트는 `basic_text` 사용. 페이지는 `object=page`로 판별
- edge_type: `arrow` 사용
- 계층: `parent_block_id`로 폴더/페이지 위계 표현. `block_positions`는 렌더링 좌표용(페이지 컨텍스트)
- 페이지 판별: 메타데이터에 `object: "page"`, `views`, `allowed_component_ids`, `allowed_edge_types`가 존재하면 페이지로 간주
- 최상위 루트 폴더는 만들지 않는다. `parent_block_id`가 null이면 워크스페이스 최상위이다.

### UUID 사전

- Workspace: ws-0001 = 11111111-1111-4111-8111-111111111111
- User(Owner): usr-0001 = user_00000001

### 1) Workspace / User

- users
  - id: user_00000001, email: demo@example.com, first_name: Demo, last_name: Owner
- workspaces
  - id: 11111111-1111-4111-8111-111111111111, name: "Hotel Booking", owner_id: user_00000001

---

### 2) Blocks: 폴더/페이지/컴포넌트 정의/인스턴스

Note: block_type = data 인 경우 metadata.content 필드를 채워 제약 준수

#### 2.1 최상위 (parent_block_id = null)

- 워크스페이스 최상위에는 폴더/페이지/컴포넌트가 직접 위치할 수 있다.

#### 2.2 1차 폴더들 (IA, User Flow, User Story, Wireframe, Wireflow, Domain, Roadmap, Epics, Stories)

- 공통: block_type=data, parent_block_id=null, metadata.content="folder"
- IA: 20000000-0000-4000-8000-000000000001 (slug: ia)
- User Flow: 20000000-0000-4000-8000-000000000002 (slug: user-flow)
- User Story: 20000000-0000-4000-8000-000000000003 (slug: user-story)
- Wireframe: 20000000-0000-4000-8000-000000000004 (slug: wireframe)
- Wireflow: 20000000-0000-4000-8000-000000000005 (slug: wireflow)
- Domain: 20000000-0000-4000-8000-000000000006 (slug: domain)
- Roadmap: 20000000-0000-4000-8000-000000000007 (slug: roadmap)
- Epics: 20000000-0000-4000-8000-000000000008 (slug: epics)
- Stories: 20000000-0000-4000-8000-000000000009 (slug: stories)

#### 2.3 컴포넌트 정의

- Screen 정의: cdef-screen = 30000000-0000-4000-8000-000000000001

  - object: component, block_type: basic_text, slug: cdef-screen, name: ComponentDef: Screen
  - metadata:
    - name, slug, content: "definition"
    - component_key: "screen"
    - node_ui: shape=rounded-rect, icon=monitor, color=blue, ports(left/right), size(220x100)
    - schema: fields [status(select: todo/doing/done), description(textarea)]
    - behavior: doubleClick=openEditor

- Page 정의: cdef-page = 30000000-0000-4000-8000-000000000002

  - object: component, block_type: basic_text, slug: cdef-page, name: ComponentDef: Page
  - metadata:
    - content: "definition"
    - component_key: "page"
    - node_ui: shape=rect, icon=file-text, color=emerald, ports(left/right), size(240x100)
    - schema: fields [priority(select: P0/P1/P2)]

- Action 정의: cdef-action = 30000000-0000-4000-8000-000000000003
  - object: component, block_type: basic_text, slug: cdef-action, name: ComponentDef: Action
  - metadata.content: "definition"
  - metadata.component_key="action"; node_ui: icon=bolt, color=amber; schema: [name(text), note(textarea)]

#### 2.4 페이지 블록 (object=page)

Note: block_type=workflow, parent_block_id = 해당 폴더

- IA 페이지: ia-nav = 40000000-0000-4000-8000-000000000001 (parent: IA)

  - object: page, block_type: basic_text, slug: ia-navigation, name: IA: Navigation Map
  - metadata:
    - object: "page"
    - name, slug, description: "호텔 예약 앱 내 내비게이션 구조"
    - views: { default: canvas, table: { columns: ["name","status"] }, kanban: { groupBy: "status" }, markdown: { template: "# {{name}}\n{{description}}" } }
    - allowed_component_ids: [cdef-page]
    - allowed_edge_types: ["contains", "next"]

- User Flow 페이지: uf-search-book = 40000000-0000-4000-8000-000000000002 (parent: User Flow)

  - metadata.object: "page"; allowed_component_ids: [cdef-action, cdef-screen]

- User Story 페이지: us-guest-book = 40000000-0000-4000-8000-000000000003 (parent: User Story)

  - metadata.object: "page"; allowed_component_ids: [cdef-page, cdef-screen]

- Wireframe 페이지: wf-booking-screen = 40000000-0000-4000-8000-000000000004 (parent: Wireframe)

  - metadata.object: "page"; allowed_component_ids: [cdef-screen]

- Wireflow 페이지: wfl-booking-flow = 40000000-0000-4000-8000-000000000005 (parent: Wireflow)
  - metadata.object: "page"; allowed_component_ids: [cdef-action, cdef-screen]

#### 2.5 컴포넌트 인스턴스 (페이지 내에서 사용할 블록 인스턴스)

Note: block_type=data (제약상 content 필요), parent_block_id는 의미 계층상 소속 폴더/루트에 두되, 렌더링 컨텍스트는 `block_positions.context_block_id`로 결정

- IA 페이지 컴포넌트들 (컨텍스트: ia-nav)

  - page: inst-ia-home = 50000000-0000-4000-8000-000000000001 (component_id=cdef-page, name: Home)
  - page: inst-ia-search = 50000000-0000-4000-8000-000000000002 (component_id=cdef-page, name: Search)
  - page: inst-ia-room = 50000000-0000-4000-8000-000000000003 (component_id=cdef-page, name: Room Detail)
  - page: inst-ia-book = 50000000-0000-4000-8000-000000000004 (component_id=cdef-page, name: Booking)

- User Flow 컴포넌트들 (컨텍스트: uf-search-book)

  - screen: inst-uf-search = 50000000-0000-4000-8000-000000000101 (component_id=cdef-screen, name: Search Screen)
  - action: inst-uf-select = 50000000-0000-4000-8000-000000000102 (component_id=cdef-action, name: Select Room)
  - screen: inst-uf-book = 50000000-0000-4000-8000-000000000103 (component_id=cdef-screen, name: Booking Screen)

- User Story 컴포넌트들 (컨텍스트: us-guest-book)
  - page: inst-us-entry = 50000000-0000-4000-8000-000000000201 (component_id=cdef-page, name: Guest Entry Form)
  - screen: inst-us-confirm = 50000000-0000-4000-8000-000000000202 (component_id=cdef-screen, name: Confirmation)

---

### 3) Edges (관계)

#### 3.1 IA

- contains: ia-nav → inst-ia-home / inst-ia-search / inst-ia-room / inst-ia-book
- next: inst-ia-home → inst-ia-search → inst-ia-room → inst-ia-book

#### 3.2 User Flow (Search & Book)

- contains: uf-search-book → inst-uf-search / inst-uf-select / inst-uf-book
- next: inst-uf-search → inst-uf-select → inst-uf-book

#### 3.3 User Story (Guest Booking)

- contains: us-guest-book → inst-us-entry / inst-us-confirm
- next: inst-us-entry → inst-us-confirm

---

### 4) Block Positions (렌더링 좌표)

좌표는 페이지 컨텍스트별로 저장. 예시는 (x,y) 픽셀

#### 4.1 IA (context = ia-nav)

- inst-ia-home: (x: 100, y: 100)
- inst-ia-search: (x: 300, y: 100)
- inst-ia-room: (x: 500, y: 100)
- inst-ia-book: (x: 700, y: 100)

#### 4.2 User Flow (context = uf-search-book)

- inst-uf-search: (x: 100, y: 200)
- inst-uf-select: (x: 350, y: 200)
- inst-uf-book: (x: 600, y: 200)

#### 4.3 User Story (context = us-guest-book)

- inst-us-entry: (x: 100, y: 200)
- inst-us-confirm: (x: 350, y: 200)

---

### 5) 메타데이터 필드 예시 스냅샷 (제약 준수를 위한 최소 필드)

#### 5.1 페이지 공통

- metadata
  - object: "page"
  - name, slug, description
  - views { default, table.columns, kanban.groupBy, markdown.template }
  - allowed_component_ids: [cdef-...]
  - allowed_edge_types: ["contains", "next"]

#### 5.2 컴포넌트 정의/인스턴스 공통

- metadata
  - name, slug
  - content: "definition" | "instance"
  - (정의) component_key, node_ui, schema, behavior
  - (인스턴스) component_id, overrides?, data?

---

### 6) 폴더 트리 (parent_block_id 기준)

- Hotel Booking Project (prj-root)
  - IA (page)
    - IA: Navigation Map (page)
  - User Flow (page)
    - User Flow: Search & Book (page)
  - User Story (page)
    - User Story: Guest Booking (page)
  - Wireframe (page)
    - Wireframe: Booking Screen (page)
  - Wireflow (page)
    - Wireflow: Booking Flow (page)
  - Domain (page)
  - Roadmap (page)
  - Epics (page)
  - Stories (page)
