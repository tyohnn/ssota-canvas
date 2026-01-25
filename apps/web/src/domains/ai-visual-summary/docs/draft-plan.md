# SSOTA YouTube Block – Smart Summary (Canvasdown + Agent Loop) PRD / Dev Handoff

## 0. 한 줄 요약

유튜브(강연/팟캐스트/정보성) 스크립트를 LLM이 **템플릿 규칙(자연어)**에 따라 **Canvasdown DSL**로 “뼈대→채우기” 순서로 생성하고, 이후 수정/확장은 **Patch DSL**로 에이전틱하게 반복한다.

---

## 1. 목적

### 1.1 문제

텍스트 요약만으로는

* 구조(논리/프레임워크/개념 관계)가 드러나지 않고
* 다른 영상/노트와 연결이 어렵고
* 인사이트/행동으로 이어지기 어렵다.

### 1.2 목표

Smart Summary는 요약을 **2D 캔버스에서 “구조화 + 시각화 + 연결 가능”**하게 만든다.

핵심 산출물:

* **Overview**: 한 화면에서 핵심 논지/뼈대
* **Structure**: 주장-근거 / 프로세스 / 프레임워크 / 개념망
* **Connections**: 개념 노드 + 의미 엣지
* **Action**: 체크리스트 + 질문

---

## 2. 핵심 아키텍처

### 2.1 Canvasdown을 어떻게 쓰는가

* Canvasdown은 “LLM이 캔버스를 생성/수정하는 표준 출력 포맷”이다.
* LLM은 템플릿 규칙을 읽고 **Canvasdown DSL**을 출력한다.
* 생성은 **한 번에 끝내지 않고** 에이전틱 루프로 진행한다:

  * Phase A: Skeleton(Full DSL)
  * Phase B: Content fill(여러 번 Patch DSL)

> 중요한 결정: **템플릿 엔진/JSON 스키마 레이어는 두지 않는다.**
> 템플릿은 자연어 규칙 문서이며, LLM이 이를 해석해 DSL을 생성한다.

### 2.2 필수 안전장치(서버/클라이언트)

레이어를 제거해도 아래는 필수:

* **Parse 검증**: 매 출력마다 Canvasdown 파서로 문법 검증
* **Lint 검증**: 템플릿 룰 위반(예: concept=hex)을 간단히 검사
* **Repair 루프**: 오류/위반 발생 시 “문법/룰만 고쳐서 다시 DSL 출력” 요청

---

## 3. 실행 플로우 (Agent Loop)

### 입력

* `template_spec` (자연어 템플릿 규칙 문서)
* `video_metadata` (title, url, duration 등)
* `transcript` 또는 chunked transcript (필요 시)
* (옵션) `existing_canvas_dsl` (재생성/확장)

### Phase A — Skeleton 생성 (Full DSL)

A1) **Groups(Zones)** 생성
A2) **Slots 노드** 생성 (thesis/chapters/concepts/actions/questions 등)
A3) **구조 Edge** 생성 (최소 연결: relates_to/step 중심)

출력: **Canvasdown Full DSL** (설명 금지, DSL만)

### Phase B — Content 채우기 (Patch DSL 반복)

B1) Thesis/Chapters 채우기
B2) Concepts/Claims 라벨 채우기
B3) Evidence/Examples/Notes 채우기
B4) Actions/Questions 채우기
B5) Edge 타입/라벨 정교화 (relates_to → supports/explains/tradeoff 등)

출력: **Canvasdown Patch DSL만**

---

## 4. React Flow Custom Nodes 사용 방식

### 4.1 노드 타입(최소 3종)

* `shape` : 개념/주장/프레임워크 요소 (짧은 텍스트, 시각적 구분 핵심)
* `markdown` : 긴 텍스트(요약 단락/챕터/근거/체크리스트/질문)
* `group` : 영역 컨테이너(Overview/Timeline/Concepts/Synthesis 등)

### 4.2 Shape node (의미 단위 표현의 중심)

**주요 role**

* `thesis`, `concept`, `claim`, `evidence`, `framework`, `tradeoff`, `insight`

**필수 style**

* `shapeType`: `hex | rect | pill | diamond | circle`
* `color`: semantic token (예: `primary | concept | claim | evidence | framework | warning | neutral`)

> 예: “framework는 shape node의 color, shape으로 정의”

* framework 요소: `role="framework"` + `shapeType=circle/rect` + `color=framework`
* tradeoff: `shapeType=diamond` + `color=warning`

### 4.3 Markdown node

* variant: `summary | chapters | actions | questions | notes`
* md: markdown string

### 4.4 Group node

* title, layoutHint(`stack|grid|free`), colorTone
* 템플릿의 “zone”을 강제하기 위한 컨테이너

### 4.5 Edge 타입(의미 라벨)

허용 관계(enum):

* `supports`, `explains`, `example_of`, `leads_to`, `part_of`
* `contrasts`, `tradeoff`, `step`, `analogy`, `relates_to`

---

## 5. ID 컨벤션(중요)

### 원칙

* Skeleton 단계에서 ID를 **완전히 확정**한다.
* 이후 Patch는 정해진 ID만 업데이트한다.

### 추천 규칙(예시)

* Groups: `g_overview`, `g_timeline`, `g_concepts`, `g_synthesis`
* Thesis: `t_thesis`
* Chapters: `m_chapters`
* Actions/Questions: `m_actions`, `m_questions`
* Concepts: `c_01` ~ `c_15`
* Claims: `cl_01` ~
* Evidence: `ev_01_01` (claim별 묶음 가능)

---

## 6. 템플릿 5종 정의 (선택/기본 제공)

각 템플릿은 **자연어 규칙 문서(template_spec)**로 제공한다.
(Goal / When to use / Zones / Slots / Block Mapping Rules / Limits / Edge types / ID rules)

---

### Template 1) Lecture Map (Default)

**목표**: 강연/팟캐스트의 흐름+개념을 동시에 정리
**Zones**: Overview / Timeline / Concept Graph / Synthesis
**Slots**: Thesis(1), Chapters(1), Concepts(8–15), Actions(1), Questions(1)
**Mapping**

* Thesis: shape `pill`, color `primary`
* Concepts: shape `hex`, color `concept`
* Chapters/Actions/Questions: markdown variants

---

### Template 2) Argument Map

**목표**: Thesis → Claims → Evidence(논증 구조)
**Zones**: Thesis / Claims / Evidence / Actions
**Slots**: Thesis(1), Claims(3–7), Evidence(각 claim당 1–3), Actions(1)
**Mapping**

* Claim: shape `rect`, color `claim`
* Evidence: markdown or dashed rect shape(color `evidence`)
* Counterpoint(옵션): diamond, warning

---

### Template 3) Framework Canvas

**목표**: 모델/프레임워크를 중앙에 두고 주변에 정의·사례·리스크·행동을 배치
**Zones**: Framework Core / Definitions / Examples / Risks / Actions
**Slots**: Framework group + 내부 framework shapes(4–12), Definitions(2–5), Examples(1–3), Actions/Questions
**Mapping**

* Framework part: shape role=framework, color=framework, shapeType=circle/rect
* Tradeoff/Risk: diamond, warning

---

### Template 4) Concept Graph

**목표**: 용어/개념 관계망(정의/관계 중심)
**Zones**: Glossary / Relations / Notes
**Slots**: Concepts(10–20), Edges(15–40), Notes(2–6)
**Mapping**

* Concepts: hex, concept color
* Definition notes: markdown, `explains`로 연결

---

### Template 5) Synthesis Board (Affinity → Insights)

**목표**: 정보 조각을 클러스터링해 인사이트/행동으로 승화
**Zones**: Nuggets / Clusters / Insights / Actions
**Slots**: Nuggets(8–20), Cluster groups(3–7), Insights(3–7), Actions/Questions
**Mapping**

* Nugget: small markdown
* Cluster: group
* Insight: pill/rect, primary/insight color
* Nugget→Insight: supports/leads_to

---

## 7. 생성 규칙(프로덕션 가드레일)

### 제한값(권장)

* concept max: 15(lecture/argument/framework), 20(concept graph)
* edges max: 노드당 out-degree 3~5, 총 40 내 권장
* markdown max chars: 1200~2000 (variant별로 다르게 가능)

### 엣지 생성 원칙

* Skeleton 단계에서는 `relates_to/step` 위주로 “거친 구조”만 만든다.
* Content 채운 후 B5에서 의미 관계를 업그레이드한다.

---

## 8. 오류 처리(검증/리페어)

### Parse 실패

* Canvasdown parse error 메시지 → LLM에 전달
* “문법만 고쳐서 DSL만 출력” 리페어 프롬프트 실행
* 1~2회 실패 시 fallback(단일 markdown 요약 보드)

### Lint 실패(룰 위반)

예: concept인데 hex가 아님, forbidden node type 사용 등

* 위반 리스트를 전달하고 “룰만 맞추게 수정” Patch 또는 DSL 재출력

---

## 9. UX (YouTube Block Action)

### Smart Summary 버튼

* Template Picker:

  * Auto recommend(기본)
  * 5개 템플릿 수동 선택
* 생성 중 표시:

  * Skeleton 먼저 렌더(즉시 보드 형태 등장)
  * 이후 Patch로 내용이 순차적으로 채워짐

### 후속 액션(에이전틱)

* Expand section (특정 그룹만 디테일 추가)
* Refine relationships (엣지 정교화)
* Compress (더 짧게)
* Add more concepts (개념 추가하되 max 제한)

---

## 10. Acceptance Criteria (개발 완료 기준)

1. 템플릿 선택 → Skeleton 보드가 먼저 뜬다(그룹/슬롯이 보임)
2. Patch 루프로 내용이 단계적으로 채워진다
3. 템플릿별 의미 단위(Concept=hex 등)가 항상 일관되게 적용된다
4. 엣지 타입 라벨(enum)이 유지된다
5. 파싱/룰 위반 시 자동 리페어로 복구된다
6. 실패해도 최소 fallback(요약 markdown)은 남는다
7. 생성 후 “부분 확장/수정”이 Patch DSL로 가능하다

---

## 11. 개발자 작업 분해(Task Breakdown)

1. 템플릿 spec 포맷(자연어 문서) 확정 + 5종 작성
2. Agent Loop 구현: Phase A(Full DSL) → Phase B(Patch)
3. Canvasdown 파싱 + 리페어 루프
4. 템플릿 룰 lint + 리페어 루프
5. React Flow nodeTypes(shape/markdown/group) 및 스타일 토큰 적용
6. YouTube 블록 UI: 템플릿 선택 + 진행 상태 + 후속 액션

---

원하면 다음 단계로, **각 템플릿별 template_spec 자연어 문서(프롬프트에 그대로 넣을 수 있는 형태)**와
**Phase A/B용 “정확한 프롬프트 원문”**까지 한 번에 만들어서 개발자에게 넘길 수 있게 완성해줄게.
