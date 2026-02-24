# SSOTA Sophie Agent · 와우 데모 계획

> 한 번의 요청으로 비개발자도 코딩 에이전트(Claude Code, Cursor)가 하는 일을 쉽게 대체할 수 있다는 것을 보여주기 위한 데모 전략.
> 목표: **추상적 사고 → 구체적 결과물**을 매우 쉬운 UX로, 추적 가능하게 전달하는 것.

---

## 목차

1. [배경과 목표](#1-배경과-목표)
2. [와우의 본질](#2-와우의-본질)
3. [데모 레벨 개요](#3-데모-레벨-개요)
4. [Level 1: 리서치 → 캔버스 물질화](#4-level-1-리서치--캔버스-물질화)
5. [Level 2: URL 분석 + JSON 추출 + 비교 분석 (상세)](#5-level-2-url-분석--json-추출--비교-분석-상세)
6. [Level 3: 기획안 → 결과물](#6-level-3-기획안--결과물)
7. [구현 우선순위 요약](#7-구현-우선순위-요약)
8. [참고 문서](#8-참고-문서)

---

## 1. 배경과 목표

### 1.1 코딩 에이전트로 사람들이 하는 일 (현재)

- 리서치 → 리서치 문서 작성
- 마이크로 SaaS 제작 (디자이너: shader preview 앱, 운영: 견적서 앱 등)
- 영상 기획안 마크다운 → Remotion 렌더링
- 서비스 기획안 마크다운 → 슬라이드/PDF 제작

이들이 **직접 다운받아 써야 하는 것**: Claude Code, Cursor 등.  
**익숙해져야 하는 것**: IDE, CLI UX/UI, MCP, 코딩 개념.

### 1.2 SSOTA 데모가 증명해야 할 것

- **한 번의 요청**으로 와우한 경험
- CLI/IDE/MCP/코딩 개념 없이, 코딩 에이전트가 해주는 기능을 **쉽게 대체**
- **나의 생각과 추상적 사고**를 **결과물 타입**으로 만들어내는 것
- 그 과정이 **매우 쉬운 형태로 추적 가능**하게 지원됨

---

## 2. 와우의 본질

### 2.1 구조적 차별점

| 비교 대상 | 결과물 존재 방식 | 관계 표현 | 다음에 이어하기 |
|----------|------------------|------------|-----------------|
| **Claude Code (파일/채팅)** | 채팅 로그에 묻힘 | 없음 | 컨텍스트 재구축 필요 |
| **Cursor (파일/채팅)** | 파일 시스템에 흩어짐 | 없음 | 경로/파일 기억 필요 |
| **SSOTA (캔버스/채팅)** | 캔버스에 **공간적으로 배치** | **엣지로 연결** | viewport만 보면 됨 |

### 2.2 와우 포인트 정리

1. **한 번에 쫙 깔림** — Canvasdown Full DSL로 다수 블록 + 엣지를 1회에 배치. 채팅은 한 줄씩, 파일은 하나씩.
2. **물질화** — 도구 호출 결과가 캔버스 블록으로 **영구 저장**. MCP/API 결과는 세션 끝나면 사라짐.
3. **관계가 시각화됨** — 블록 간 엣지로 "어디서 왔는지" 추적 가능. hop 검색으로 연결 탐색.
4. **Ambient context** — 에이전트가 viewport/선택/이벤트를 자동으로 알고 있음. 매번 "뭐가 있지?" 물어볼 필요 없음.
5. **코드 제로** — 스크래핑, 크롤링, 리서치, 정리까지 자연어 한 마디로.

---

## 3. 데모 레벨 개요

| 레벨 | 핵심 메시지 | 구현 범위 | 와우 강도 | 개발 규모(추정) |
|------|-------------|----------|-----------|-----------------|
| **Level 1** | 리서치 결과가 캔버스에 남는다 | Phase 1 Checkpoint A–B | 중상 | 1–2주 |
| **Level 2** | URL 하나로 MCP 없이 전문가급 분석 + **코드 없는 스크래핑** | Phase 1 완성 + Link App + extractJSON | 상 | 3–4주 |
| **Level 3** | 기획안 → 결과물. 코딩 제로 | Phase 1 + App System Phase A–C + 결과물 생산 앱 1개 | 매우 강함 | 6–8주 |

---

## 4. Level 1: 리서치 → 캔버스 물질화

### 4.1 목표

"웹 검색 → 결과를 캔버스에 한 번에 배치"가 안정적으로 동작하는 것을 보여준다.  
채팅 로그 vs 캔버스 물질화의 차이를 직관적으로 전달.

### 4.2 데모 시나리오

```
유저: "GenAI 스타트업 투자 트렌드 조사해서 캔버스에 정리해줘"
```

**Sophie 동작:**

1. `web_search` (xAI 네이티브) 여러 번 실행
2. `renderCanvasdown` Full DSL로 한 번에 배치:
   - 타이틀 존: "GenAI 스타트업 투자 트렌드"
   - 핵심 트렌드 3–5개 → 마크다운 블록
   - 관련 link 블록 생성 + 엣지 연결
3. `organizeLayout`(grid, columns: 3)으로 정리

### 4.3 와우 포인트

- "한 번에 쫙 깔리는" 시각적 임팩트
- 블록 간 엣지로 관계가 보임
- 결과가 캔버스에 남아 즉시 수정/탐색 가능

### 4.4 필요 구현

- `renderCanvasdown` 안정화 (다중 블록 + 엣지 + zone)
- `organizeLayout` 클라이언트 핸들러 연결
- (이미 있음) web_search, context-builder, grep/read 등

### 4.5 한계

- "검색 결과 정리" 수준. Perplexity/Claude와의 차별화는 보통.
- URL/페이지 단위 심층 분석, 스크래핑은 아직 없음.

---

## 5. Level 2: URL 분석 + JSON 추출 + 비교 분석 (상세)

Level 2는 **와우 데모의 핵심**이다.  
"데이터의 물질화", "코드 없는 스크래핑", "한 번의 요청으로 전문가급 분석"을 한 흐름에서 보여준다.

### 5.1 데모 목표

1. **자동 인덱싱** — URL 드롭만 하면 추출·요약이 자동으로 돌아감.
2. **코드 없는 JSON 스크래핑** — "가격 정보 뽑아줘" 같은 자연어만으로 구조화 데이터 추출.
3. **비교 분석 + 물질화** — 여러 URL의 데이터를 읽고, 분석하고, 캔버스에 구조화된 블록으로 배치.
4. **영속성·추적** — 다음 세션에서도 그대로 있고, 이벤트로 "언제 뭘 했는지" 확인 가능.

### 5.2 사전 준비 (데모 셋업)

데모 전에 유저(또는 데모 진행자)가 캔버스에 **비교 대상 URL 3개**를 드롭해 둔다.

| 순서 | URL 예시 | 비고 |
|------|----------|------|
| 1 | `competitor-a.com/pricing` | SaaS A 요금제 페이지 |
| 2 | `competitor-b.com/pricing` | SaaS B 요금제 페이지 |
| 3 | `competitor-c.com/pricing` | SaaS C 요금제 페이지 |

**시스템 동작:**

- 각 URL에 대해 **Link App**이 링크 블록 생성
- **Source 도메인** 자동 인덱싱 트리거:
  - Firecrawl로 마크다운 추출 → `properties.tabs.extract.markdown`
  - 요약 생성 → `properties.tabs.summary.ko` (기본)
- 캔버스에는 **OG 카드 3개**가 예쁘게 렌더링됨

**유저가 보는 것:** URL 3개 넣었더니, 잠시 후 카드 3개가 깔리고, 카드 안에 요약이 채워져 있음. (코드/CLI/MCP 전혀 없음)

### 5.3 와우 순간 1: 코드 없는 JSON 스크래핑

**유저 발화 (한 번의 요청):**

```
"이 세 사이트에서 요금제 정보 뽑아줘. 요금제 이름, 가격, 주요 기능 목록으로."
```

**Sophie 동작:**

1. **Viewport 인식**  
   동적 컨텍스트에서 현재 보이는 블록 3개(link) 확인. `visibleBlocks` 메타데이터로 타입·제목 파악.

2. **추출 스키마 생성**  
   유저의 자연어를 JSON Schema로 해석. 예:
   ```json
   {
     "plans": [
       {
         "name": "string",
         "price": "string",
         "features": ["string"]
       }
     ]
   }
   ```

3. **Block Tool 호출**  
   각 link 블록에 대해:
   - `executeBlockTool(blockMountId, "extractJSON", { schema: {...} })`
   - 서버: Firecrawl structured extraction API 호출 (해당 URL + schema)
   - 결과를 링크 블록의 `properties.tabs.json`에 저장

4. **UI 반영**  
   각 링크 블록 에디터에서 "JSON" 탭이 활성화되고, 구조화된 데이터가 표시됨.

**유저가 보는 것:**  
"요금제 이름, 가격, 기능 뽑아줘" 한 마디에, 세 페이지에서 **테이블처럼 정리된 데이터**가 각 카드의 JSON 탭에 채워짐.  
→ Cursor에서 firecrawl/puppeteer 스크립트 짜던 작업이 **완전히 대체**됨.

**와우 포인트:**

- **코딩 제로**: 스키마를 코드로 안 짬. 자연어만으로 Sophie가 schema 생성 후 extractJSON 호출.
- **실행 경로 단순**: CLI/IDE 실행 없음. 에이전트가 블록 단위로 실행.
- **결과 위치 명확**: 결과가 블록의 `properties.tabs.json`에 고정. 파일 경로/변수명 불필요.

### 5.4 와우 순간 2: 비교 분석 + 캔버스 물질화

**유저 발화:**

```
"이 데이터로 비교표 만들어줘"
```

**Sophie 동작:**

1. **데이터 수집**  
   - 3개 link 블록의 `properties.tabs.json` (방금 채워진 요금제 데이터) 접근.
   - `readBlockLines`로 해당 블록의 JSON 탭 내용 읽기 (또는 블록 properties 직접 조회하는 경로가 있으면 해당 경로 사용).

2. **분석**  
   - LLM으로 3사 요금제 비교 (가격대, 기능 수, 공통점/차이점).
   - 인사이트 2–3문장, 추천 1문장 수준으로 요약.

3. **캔버스에 한 번에 배치**  
   `renderCanvasdown` Full DSL 예시:
   ```
   canvas LR
   @zone header "SaaS 요금제 비교 분석" { }
     @markdown title "요금제 비교 분석"
   @zone body "비교 결과" { }
     @link link_a "Competitor A"  (기존 blockMountId 참조 또는 새로 생성하지 않고 기존 유지)
     @link link_b "Competitor B"
     @link link_c "Competitor C"
     @markdown table "요금제 비교표" { content: "| 구분 | A | B | C |\n| Free | $0 | $0 | ... |\n| Pro | $29 | $39 | ... |" }
     @markdown insight "핵심 인사이트" { content: "B가 가장 비싸지만..." }
     @markdown recommendation "추천" { content: "가성비는 C. 엔터프라이즈는 A 추천" }
   @end
   link_a -> table : "데이터 출처"
   link_b -> table : "데이터 출처"
   link_c -> table : "데이터 출처"
   table -> insight
   insight -> recommendation
   ```

   (실제 DSL 문법은 프로젝트의 Canvasdown 스펙에 맞게 조정. 기존 link 블록을 재사용할지, 비교용 마크다운만 새로 만들지도 선택.)

4. **레이아웃**  
   `organizeLayout(type: "grid", options: { columns: 3 })` 등으로 정리.

**유저가 보는 것:**  
요금제 데이터가 **비교표 + 인사이트 + 추천** 블록으로 캔버스에 한 번에 깔리고, 원본 링크 블록과 엣지로 연결됨.  
→ "어디서 나온 데이터인지" 추적 가능하고, 다음에 "Pro 요금제만 따로 정리해줘" 같은 후속 요청도 가능.

**와우 포인트:**

- **한 번에 쫙**: 표 + 인사이트 + 추천이 동시에 생성·연결.
- **관계 시각화**: link → table → insight → recommendation 엣지.
- **영속성**: 새로 고른 탭/세션에서도 캔버스만 열면 그대로 있음.

### 5.5 와우 순간 3: 후속 수정 (선택)

**유저 발화:**

```
"이 비교표에서 Pro 요금제만 따로 정리해줘"
```

**Sophie 동작:**

- 비교표가 들어 있는 마크다운 블록을 `readBlockLines`로 읽기.
- Pro 행만 추려서 새 마크다운 블록 생성 (`renderCanvasdown` 또는 `patchCanvasdown`).
- 기존 비교표 블록과 엣지 연결.

**유저가 보는 것:**  
말한 대로 Pro만 따로 블록으로 나오고, 원본과 연결되어 있어서 추적 가능.

### 5.6 Level 2 데모 플로우 요약

| 단계 | 유저 액션 | 시스템/Sophie | 와우 포인트 |
|------|-----------|----------------|-------------|
| 셋업 | URL 3개 캔버스에 드롭 | 자동 인덱싱 → OG 카드 + 요약 | 코드 없이 자동 인덱싱 |
| 1 | "요금제 정보 뽑아줘 (이름, 가격, 기능)" | extractJSON × 3 → tabs.json 채움 | **코드 없는 스크래핑** |
| 2 | "이 데이터로 비교표 만들어줘" | JSON 읽기 → 분석 → 캔버스 배치 + 엣지 | 물질화 + 관계 시각화 |
| 3 (선택) | "Pro 요금제만 따로 정리해줘" | 비교표 블록 읽기 → 필터링 → 새 블록 | 지속적 작업 공간 |

### 5.7 Level 2 필요 구현

| 항목 | 설명 | 참고 |
|------|------|------|
| Link App 자동 인덱싱 | URL 드롭 시 Source 도메인으로 추출·요약 → properties.tabs | SSOTA-Link-App.md §6 |
| extractJSON Block Tool | Firecrawl structured extraction, 결과 → properties.tabs.json | SSOTA-Link-App.md §5.5 |
| executeBlockTool 연동 | Sophie가 link 블록에 extractJSON 호출 가능 | AppRegistry + Block Tool 디스패처 |
| 자연어 → schema | 유저 요청을 Sophie가 JSON Schema로 변환 후 extractJSON에 전달 | 프롬프트 규칙 + 도구 사용법 |
| renderCanvasdown 안정화 | 다중 블록 + zone + 엣지 1회 배치 | Phase 1 Step 1-4 |
| organizeLayout | 그리드 등 레이아웃 정리 | Phase 1 Step 1-8 |
| readBlockLines 확장 | 블록의 properties.tabs.json 읽기 경로 (필요 시) | ai-management 도메인 |
| 이벤트 기본 연결 | recentEvents / getPageEvents로 "방금 뭘 했는지" 맥락 | event-tracking-design.md |

### 5.8 Level 2에서 증명하는 것

- **코딩 에이전트 대체**: firecrawl/스크래핑 스크립트 → URL 드롭 + 한 줄 지시.
- **물질화**: API/스크립트 결과가 채팅이 아니라 **캔버스 블록**으로 남음.
- **비개발자 UX**: MCP, API 키, 셸, 코드 없이 "요금제 뽑아줘" → "비교표 만들어줘"까지 한 흐름.

---

## 6. Level 3: 기획안 → 결과물

### 6.1 목표

"마크다운 기획안 → 슬라이드/PDF/영상 등 **구체적 결과물**"을 코딩 없이 만드는 킬러 시나리오.  
Remotion, 슬라이드 제작, 견적서 앱 등이 하는 일을 **한 번의 요청**으로 대체한다는 인상을 줌.

### 6.2 데모 시나리오 (슬라이드)

**사전:** 유저가 마크다운 블록에 기획안 작성.

```markdown
# 서비스 소개 영상 기획
- 장면 1: SSOTA 로고 + 타이틀
- 장면 2: 문제 제시 — AI 도구가 복잡함
- 장면 3: 해결 — 캔버스에서 한 번에
- 장면 4: 데모 화면
- 장면 5: CTA
```

**유저 발화:**

```
"이 기획안으로 슬라이드 만들어줘"
```

**Sophie 동작:**

1. 해당 마크다운 블록 `readBlockLines`로 읽기.
2. `executeAppTool("SSOTA Slide", "createSlide", { content: ... })` 호출.
3. 슬라이드 블록(또는 슬라이드 앱이 정의한 블록 타입)이 캔버스에 생성되고, 기획안 블록과 엣지로 연결.
4. 유저는 해당 블록에서 슬라이드 프리뷰·수정 가능.

**와우 포인트:**  
기획안이라는 **추상**이, 슬라이드라는 **결과물**로 한 번에 전환. 코딩/Remotion/PPT 수동 제작 없음.

### 6.3 대안 시나리오

| 유저 요청 | App Tool | 결과물 |
|-----------|----------|--------|
| "이 기획안으로 견적서 만들어줘" | 견적서 앱 createEstimate | PDF/견적서 블록 |
| "이 리서치로 보고서 만들어줘" | (리포트 앱 또는 canvasdown만) | 구조화 마크다운 + 차트 블록 |
| "이 마크다운으로 Remotion 영상 만들어줘" | SSOTA Remotion createVideo | 영상 프리뷰 블록 |

### 6.4 필요 구현

- App System Phase A–C: AppDefinition, AppRegistry, executeAppTool 연동.
- **결과물을 생산하는 앱 1개** (예: SSOTA Slide 또는 SSOTA Remotion 최소 버전).
- 해당 앱의 App Tool이 "콘텐츠(기획안/리서치) → 블록/파일 생성"을 수행하고, 생성된 블록을 캔버스에 배치 + 기존 블록과 엣지 연결.

### 6.5 Level 3에서 증명하는 것

- **기획안 → 결과물**: 생각(마크다운)이 슬라이드/영상/견적서로 곧바로 전환.
- **코딩 제로**: Remotion 코드, PPT 제작, 스크립트 없이 한 마디로 완결.
- **캔버스 중심**: 결과물도 블록으로 물질화되어, 이후 수정·공유·재사용이 같은 공간에서 가능.

---

## 7. 구현 우선순위 요약

Level 2 데모를 **첫 번째 목표**로 두었을 때의 권장 순서.

| 순서 | 작업 | 목적 |
|------|------|------|
| 1 | renderCanvasdown 안정화 (다중 블록 + 엣지 + zone) | "한 번에 쫙" 신뢰도 |
| 2 | organizeLayout 클라이언트 핸들러 연결 | 비교표·리서치 레이아웃 정리 |
| 3 | Link App 자동 인덱싱 완성 | URL 드롭만으로 OG 카드 + 요약 |
| 4 | extractJSON Block Tool 구현 + Firecrawl 연동 | **코드 없는 스크래핑** |
| 5 | executeBlockTool 연동 (Link App Block Tools) | Sophie가 extractJSON 호출 |
| 6 | Sophie 프롬프트: 자연어 → JSON Schema → extractJSON | 유저가 스키마 몰라도 됨 |
| 7 | editBlockLines 연결 | "이 부분만 수정해줘" 후속 작업 |
| 8 | 이벤트 기본 연결 (recentEvents, getPageEvents) | "방금 뭘 했는지" 맥락 |

Level 1만 빠르게 보여주고 싶다면 1–2 위주;  
Level 2 전체를 보여주려면 1–6까지;  
Level 3은 1–8 안정화 후 App Phase A–C + 결과물 앱 1개 추가.

---

## 8. 참고 문서

| 문서 | 내용 |
|------|------|
| [Sophie Agent Architecture](./Architecture.md) | Block, App, Tool, Context Layer, Canvasdown |
| [Sophie 구현 계획](./sophie-implementation-plan.md) | Phase 1–5, Step별 상세 |
| [App System Architecture](../app-system/Architecture.md) | 블록=앱 인스턴스, 물질화, Definer/Producer/Consumer |
| [SSOTA Link App](../app-system/SSOTA-Link-App.md) | link 블록, Block Tools(요약, 스크린샷, extractJSON 등), 자동 인덱싱 |
| [SSOTA Crawl App](../app-system/SSOTA-Crawl-App.md) | 크롤 앱, App Tools, Block Context Actions |
| [Event Tracking Design](./event-tracking-design.md) | 이벤트 계층, recentEvents, grepEvents |
