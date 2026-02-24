# SSOTA Sophie Agent Architecture

> Sophie는 SSOTA 캔버스 위에서 동작하는 AI 에이전트 시스템이다.
> 이 문서는 Sophie 에이전트를 구성하는 핵심 개념들의 정의, 예시, 그리고 SSOTA에서의 적용 방식을 정리한다.

---

## 목차

1. [Block](#1-block)
2. [App](#2-app)
3. [Tool](#3-tool)
4. [Skill](#4-skill)
5. [Sub Agent](#5-sub-agent)
6. [Main Agent](#6-main-agent)
7. [Context Layer](#7-context-layer)
8. [Canvasdown](#8-canvasdown)

---

## 1. Block

### 정의

Block은 캔버스 위에 배치되는 **데이터의 최소 단위**이다. 저장하는 데이터의 타입에 따라 구분되며, 크게 **Read-Only** 상태와 **Editable** 상태로 나뉜다. Editable 여부는 블록 타입 자체의 속성으로, 마크다운이나 코드 블록처럼 내용을 직접 수정할 수 있는 블록이 Editable에 해당한다.

### 블록 타입 분류

| 카테고리 | 블록 타입 | 설명 |
|---------|----------|------|
| **링크** | 웹, 유튜브, X(트위터), 스레드 | 외부 URL을 참조하는 블록 |
| **문서** | 독스, DOCX, 노션, 마크다운, 슬라이드, 시트 | 텍스트 기반 문서 블록 |
| **PDF** | 이미지 PDF (PPT, IR 등), 텍스트 PDF | PDF 유형에 따른 분류 |
| **코드** | 리액트 프리뷰, 디자인 컴포넌트, 파이썬 샌드박스 | 실행 가능한 코드 블록 |
| **데이터** | 수치해석, 분석, 그래프 | 데이터 시각화 블록 |
| **미디어** | 이미지, 비디오, 오디오, 3D | 미디어 콘텐츠 블록 |

### 예시

- **유튜브 블록**은 Read-Only 블록이다. 스크립트 추출이나 요약 등은 Block Tool로 제공되며, 자동 인덱싱을 통해 앱 설치 없이도 처리된다.
- **마크다운 블록**, **코드 블록**은 내용을 직접 수정할 수 있는 Editable 블록이다.

### SSOTA 적용

- 블록은 캔버스의 React Flow 노드로 렌더링된다.
- 각 블록은 `blockMountId`로 식별되며, 에이전트가 블록을 검색/수정/생성할 때 이 ID를 사용한다.
- 블록은 엣지(Edge)로 서로 연결되어 관계를 표현한다.
- **소스 연동**: 블록은 `source_id`로 **소스(source-management)** 를 참조할 수 있다. 소스는 URL 기준 추출 캐시(sources.raw_content)와 다국어 요약(source_summaries)을 가지며, grep/read 도구로 블록 본문 외에 이 추출본·요약도 검색·읽기할 수 있다.

---

## 2. App

### 정의

App은 **DOM에 렌더링 가능한 코드**와 **AI가 사용할 수 있는 Tools**로 구성된 확장 단위이다.

- **코드(UI)**: 사용자가 직접 인터랙션할 수 있는 UX
- **Tools**: AI 에이전트가 앱을 조작할 수 있는 인터페이스

### 핵심 특징

| 특징 | 설명 |
|------|------|
| **커스텀 블록 정의** | 앱은 자신만의 블록 타입을 정의할 수 있다 |
| **Tool 제공** | 앱에 속한 Tool을 서브 에이전트에 제공할 수 있다 |
| **설치 가능** | 워크스페이스/페이지 단위로 앱을 설치하여 사용한다 |

### 예시

**SSOTA 기본 제공 앱**:

| 앱 | 기능 |
|----|------|
| **SSOTA Image** | 이미지 라이브러리/커뮤니티, 프롬프트 라이브러리/커뮤니티, 이미지 생성, 이미지 편집 |
| **SSOTA Shadcn** | Shadcn UI 컴포넌트 활용 |
| **SSOTA Remotion** | 영상 제작 편집기 |
| **SSOTA 3D Renderer** | 3D 렌더링 편집기 |
| **SSOTA WebGL** | WebGL 기반 시각화 |
| **SSOTA X** | X(트위터) 연동 |
| **SSOTA Thread** | 스레드 연동 |

**커뮤니티 앱 예시** (누구나 바이브 코딩으로 제작 가능):

| 앱 | 기능 |
|----|------|
| Viewtrap 클론 | 유튜브 영상 데이터 분석 제공 |
| 크날 CCV 클론 | 홈페이지 레퍼런스 제공 |
| 퀴즈 서비스 | 학습용 퀴즈 생성 |
| 단어장 | 어휘 학습 |
| 카메라 앵글 앱 | 다양한 각도의 이미지 생성 |
| 상세페이지 레퍼런스 | 상세페이지 디자인 레퍼런스 |

### SSOTA 적용

- 앱은 워크스페이스/페이지 단위로 설치된다.
- 앱이 정의하는 커스텀 블록은 해당 앱이 설치된 곳에서만 사용 가능하다.
  - 예: GitHub 앱을 설치하면 → GitHub 커밋 블록, 브랜치 블록 등이 사용 가능해진다.
- 설치된 앱의 **메타데이터(name, description)** 는 컨텍스트에 기본 포함된다. 에이전트가 특정 앱의 상세 정보(사용 가능한 Tool, 블록 타입 등)를 알아야 할 때는 `get app`으로 온디맨드 조회한다.
- 커뮤니티 앱 개발은 내부의 **커뮤니티 앱 개발 서브 에이전트**가 스킬과 Tool을 패키지로 제공하여 지원한다.

---

## 3. Tool

### 정의

Tool은 에이전트(메인 또는 서브)가 **세상과 상호작용할 수 있는 능력**이다. 코드로 정의되며, 에이전트는 Tool을 호출하여 데이터를 검색하거나 캔버스를 조작한다.

### Tool 분류

| 분류 | 범위 | 설명 | 예시 |
|------|------|------|------|
| **Global Tool** | 전역 | 어디서든 사용 가능한 기본 도구 | `grep`, `glob`, `webSearch`, `canvasdown`, `read`, `createTodos` |
| **Block Tool** | 블록 단위 | 이미 존재하는 블록의 데이터를 **조회/조작**하는 도구 | 유튜브 블록의 `타임이동하기`, 브라우저 블록의 `브라우저 탐색` |
| **App Tool** | 앱 단위 | 앱을 직접 조작할 수 있는 도구 | 이미지 앱의 `이미지 생성`, Shadcn 앱의 `컴포넌트 생성` |
| **Sub Agent** | 위임 단위 | 서브 에이전트도 Tool처럼 호출할 수 있음 | `Explore("마케팅 관련 블록 찾아줘")`, `Research("AI 트렌드 조사")` |

### 업계 비교

| 플랫폼 | Tool 구현 방식 |
|--------|--------------|
| **Cursor** | `write`, `bash`, `webSearch`, `replace`, `delete`, MCP, sub agent calling |
| **Claude Code** | Plan(≈Explore), Bash, 그 외 서브에이전트를 Tool처럼 활용 |
| **SSOTA** | Global + Block + App + Sub Agent의 4계층 Tool 시스템 |

### 정적 Tool vs 동적 Tool

Tool은 정의 방식에 따라 **정적**과 **동적**으로 나뉜다.

| 구분 | 정의 | 예시 |
|------|------|------|
| **정적 Tool** | tool 정의가 항상 동일 (system prompt에 고정) | `grep`, `canvasdown`, `webSearch`, `callSubAgent` 등 |
| **동적 Tool** | 설치된 앱, 블록 타입에 따라 달라지는 tool | 유튜브 블록의 `타임이동`, 이미지 앱의 `이미지 생성` |

동적 Tool을 개별 tool로 등록하면 **tool 정의가 사용자마다 달라져서 프롬프트 캐싱이 깨진다** (OpenAI·xAI 등은 prefix matching 기반 캐싱). 따라서 동적 Tool은 **정적 디스패처 Tool**을 통해 실행한다.

| 정적 디스패처 | 대상 | 대상 발견 경로 |
|-------------|------|--------------|
| `callSubAgent` | 서브 에이전트 | 컨텍스트 메타데이터 → `get sub agent` |
| `executeBlockTool` | 블록 툴 | 컨텍스트 블록 메타 → 블록별 tools 목록 |
| `executeAppTool` | 앱 툴 | 컨텍스트 앱 메타 → `get app` |

### 예시

```
사용자: "이 유튜브 영상의 3분 20초 부분을 보여줘"
→ executeBlockTool(blockMountId: "yt-abc", toolName: "타임이동", params: {time: "3:20"})

사용자: "배경 이미지를 만들어줘"
→ executeAppTool(appName: "SSOTA Image", toolName: "이미지 생성", params: {prompt: "배경 이미지"})

사용자: "이 내용을 캔버스에 정리해줘"
→ renderCanvasdown(dsl: "...", mode: "full")  ← Global Tool (정적)

사용자: "AI 트렌드 조사해줘"
→ callSubAgent(agentName: "Explore", task: "웹 검색: AI 트렌드, 결과 요약 반환")
```

### 검색·읽기 도구와 소스 연동 (구현 현황)

SSOTA에서는 **소스 도메인(source-management)** 과 연동하여, 블록 본문(content_raw)뿐 아니라 **연결된 소스의 추출 본문(source_content)** 과 **AI 요약(source_summary)** 도 검색·읽기 대상에 포함된다. `blocks.source_id` → `sources`, `source_summaries` 테이블을 통해 조회한다.

| 도구 | 소스 연동 |
|------|-----------|
| **grepBlockContent** | `sources` 옵션으로 content_raw / source_content / source_summary 중 검색 대상 선택. 요약은 `summaryLanguages`로 언어 필터. |
| **globBlocks** | 메타데이터(title, type) 검색. 제목 다중 패턴 시 `query`(배열) + `queryMatchMode`(any/all). |
| **readBlockLines** | `source` 옵션으로 content_raw / source_content / source_summary 중 읽기. 요약 시 `summaryLanguage` 지정. |

### 검색 도구의 명령어 스타일

검색 도구(`grep`, `glob` 등)는 **대상(scope)**을 명령어로 지정할 수 있다.

| 대상 | 설명 | 예시 |
|------|------|------|
| **워크스페이스** | 워크스페이스 전체에서 검색 | `grep("마케팅", scope: "workspace")` |
| **페이지** | 특정 페이지 내에서 검색 | `grep("마케팅", scope: "page")` |
| **이벤트** | 기록된 이벤트에서 검색 | `grepEvents("블록 생성", scope: "page")` |

검색 유형도 다양하게 지원된다.

| 유형 | 도구 | 설명 |
|------|------|------|
| **키워드 기반** | `grep`, `glob` | 텍스트 패턴/정규식으로 검색 |
| **연결 기반** | `hop`, `group` | 블록 간 엣지 관계를 따라가며 검색 |
| **의미 기반** | `semantic search` | 텍스트의 의미적 유사성으로 검색 |
| **이벤트 기반** | `grepEvents` | 블록 생성/수정/삭제 등 이벤트 이력 검색 |

`read` 도구(readBlockLines)는 라인별로 **소스(source)** 를 선택하여 읽을 수 있다. 블록에 연결된 소스(source-management)가 있으면 추출 본문·AI 요약도 읽기 대상이 된다.

| 소스 (source) | 설명 |
|---------------|------|
| **content_raw** (기본) | 블록의 원본 콘텐츠(blocks.content_raw)를 라인 단위로 읽기 |
| **source_content** | 연결된 소스의 추출 본문(sources.raw_content, e.g. 유튜브 스크립트) 읽기 |
| **source_summary** | 연결된 소스의 AI 요약(source_summaries.summary) 읽기. `summaryLanguage`로 언어 지정 가능. |

### SSOTA 적용

- Tool은 코드로 직접 정의 가능하며, Zod Schema로 입력을 검증한다.
- Tool은 실행 위치에 따라 **Server-side**(DB 접근, 외부 API) 또는 **Client-side**(DOM 조작, React Flow 업데이트)로 나뉜다.

---

## 4. Skill

### 정의

Skill은 서브 에이전트가 수행할 수 있는 **규격화된 작업 단위**이다. 일종의 **업무 가이드라인**으로, 회사에서 특정 직원이 수행하는 업무 매뉴얼에 비유할 수 있다.

### 구성 요소

| 요소 | 설명 |
|------|------|
| **Description** | 이 Skill이 어떤 작업을 수행하는지 설명 |
| **관련 문서** | 작업 수행에 참고할 문서, 가이드라인, 예시 |
| **Tools 선택** | 이 Skill을 수행하기 위해 사용할 Tool 목록 |

### 비유

> HR팀의 김대리가 수행하는 "신입사원 온보딩" 업무 절차서가 Skill이다.
> - Description: "신입사원의 온보딩 프로세스를 관리한다"
> - 관련 문서: 온보딩 체크리스트, 부서별 안내서
> - 사용 Tools: 사내 메일 시스템, 계정 생성 도구, 좌석 배정 시스템

### 예시

```
Skill: "웹 리서치 정리"
├── Description: 주어진 주제에 대해 웹 검색 후 결과를 캔버스에 구조적으로 정리한다
├── 관련 문서: 리서치 템플릿, 출처 표기 가이드
└── Tools: webSearch, renderCanvasdown, organizeLayout
```

### SSOTA 적용

- Skill은 서브 에이전트에 부여되어 해당 에이전트의 전문성을 결정한다.
- 하나의 서브 에이전트는 여러 Skill을 가질 수 있다.
- Skill을 통해 복잡한 작업을 표준화된 절차로 분해할 수 있다.

---

## 5. Sub Agent

### 정의

Sub Agent(서브 에이전트)는 **특정 전문 분야에 특화된 에이전트**이다. 메인 에이전트의 컨텍스트 소모를 줄이기 위해 독립적인 컨텍스트 윈도우에서 작업하고, 결과를 요약하여 메인에 전달한다.

### 구성 요소

| 요소 | 설명 |
|------|------|
| **Description** | 서브 에이전트의 역할과 전문 분야 |
| **Sub Agents** | 이 에이전트가 호출할 수 있는 **다른 서브 에이전트 목록** (정의 시 제한 가능, 위임 관계) |
| **Skills** | 수행 가능한 규격화된 작업 단위 |
| **Tools** | 이 에이전트가 사용할 수 있는 **Tools 목록** (정의 시 제한 가능) |

### 왜 필요한가

서브 에이전트는 **컨텍스트 분리**가 핵심 목적이다.

- 파일 탐색, 웹 검색, 스크린샷, 브라우저 DOM 등은 컨텍스트를 빠르게 소모한다.
- 이런 작업을 별도의 에이전트에서 수행하고, 요약된 결과만 메인에 전달하면 메인 에이전트의 컨텍스트를 보존할 수 있다.

> **핵심 원칙**: 서브 에이전트가 없더라도 메인 에이전트가 모든 작업을 수행할 수 있어야 한다.
> 서브 에이전트는 성능 최적화를 위한 **옵션**이다.

### 비유

> 서브 에이전트는 **직장 동료**와 같다.
> - 위임 관계는 동등하게 서로 넘길 수 있되, 정의할 때 "이 동료는 어떤 Tools·어떤 서브 에이전트만 쓸 수 있다"를 제한할 수 있다.
> - 각자의 전문 분야가 있고, "어디 소속인지"(앱 / 페이지 / 워크스페이스)라는 스코프 위계가 있다.

### 업계 비교

| 플랫폼 | 서브 에이전트 유형 |
|--------|-----------------|
| **Cursor** | Explore (코드베이스 탐색), Bash (쉘 실행), Browser (웹 조작) |
| **Claude Code** | Plan (탐색 ≈ Explore). 모드와 서브 에이전트의 구분 없이 조금이라도 특수 작업이면 서브 에이전트로 분리 |
| **SSOTA** | Explore, Browser, Research, Visualize, Canvas, Sub Agent Dev, 쏘타 앱 개발 |

### SSOTA 기본 제공 서브 에이전트

| 서브 에이전트 | 목적 | 주요 Tools |
|-------------|------|-----------|
| **Explore** | 캔버스 내외의 컨텍스트를 빠르게 탐색 | `grep`, `glob`(키워드 검색), `hop`, `group`(연결 검색), `semantic search`(의미 검색), `read`(라인별 읽기), `webSearch` |
| **Browser** | 캔버스 위의 브라우저 블록 조작 | `move`, `scroll`, `click`, `screenshot`, `record`, `extract image` |
| **Research** | 심층 리서치 수행 | (리서치 특화 도구) |
| **Visualize** | 컨텍스트를 구조화/시각화 | `canvasdown`, `search template`(방법론 검색), `layout` |
| **Canvas** | 캔버스 UI를 직접 조작 | `에디터 열기`, `블록 선택`, `멀티 선택`, `페이지 이동` |
| **Sub Agent Dev** | 사용자의 커스텀 서브 에이전트 정의를 도움 | (개발 특화 도구) |
| **쏘타 앱 개발** | 커뮤니티 앱 개발 지원 (바이브 코딩 등) | 스킬·Tool 패키지 제공, 앱 개발 특화 도구 |

### SSOTA 적용

- 사용자는 직접 서브 에이전트를 추가/정의할 수 있다.
- **정의 시 사용 가능 범위 제한**: 서브 에이전트를 정의할 때 사용 가능한 **Tools**를 명시적으로 지정한다. 마찬가지로, 그 서브 에이전트 **내부에서 호출할 수 있는 다른 서브 에이전트**도 정의에 따라 제한된다 (필요한 서브 에이전트만 등록).
- **스코프 위계**: 서브 에이전트는 다음처럼 스코프별 우선순위(위계)를 가질 수 있다. 메인 에이전트가 "사용 가능한 서브 에이전트"를 결정할 때 이 위계를 참고한다.
  - **앱에 포함된 서브 에이전트** — 특정 앱에 정의·배포된 서브 에이전트 (해당 앱 설치 시에만 사용 가능)
  - **페이지** — 해당 페이지에서만 사용 가능
  - **워크스페이스** — 워크스페이스 전역에서 사용 가능
- 메인 에이전트는 사용자가 추가한 서브 에이전트 목록의 **메타데이터만** 컨텍스트에 포함한다 (스코프 정보 포함).

---

## 6. Main Agent

### 정의

Main Agent(메인 에이전트)는 사용자의 요청을 받아 **전체 작업 흐름을 조율(Orchestration)하는 중앙 에이전트**이다. 필요에 따라 서브 에이전트를 호출하거나, 직접 Tool을 사용하여 작업을 수행한다.

### 핵심 원칙

1. **범용성**: 서브 에이전트 없이도 모든 작업을 수행할 수 있어야 한다.
2. **조율**: 적절한 서브 에이전트에 작업을 위임하여 효율을 높인다.
3. **컨텍스트 보존**: 무거운 작업(탐색, 브라우저 조작 등)은 서브 에이전트에 위임하여 메인의 컨텍스트를 보존한다.

### 메인 에이전트의 기본 Tools

| 카테고리 | Tools | 설명 |
|---------|-------|------|
| **검색** | `grep`, `glob`, `hop`, `group`, `read`, `grepEvents` | 캔버스 내 데이터 검색/조회 + 이벤트 검색 |
| **웹** | `webSearch` | 실시간 웹 검색 |
| **캔버스 조작** | `canvasdown` | 블록 생성/수정/연결/이동 |
| **작업 관리** | `createTodos` | 작업 목록 생성 |
| **앱 상세 조회** | `get app` | 특정 앱의 상세 정보 (내부 Tools, 커스텀 블록 타입 등) 온디맨드 조회 |
| **서브에이전트 상세 조회** | `get sub agent` | 특정 서브 에이전트의 상세 정보 (내부 Tools, Skills 등) 온디맨드 조회 |
| **서브에이전트 호출** | `callSubAgent` | 서브 에이전트에 작업 위임 (정적 디스패처) |
| **블록 툴 실행** | `executeBlockTool` | 특정 블록의 동적 Tool 실행 (정적 디스패처) |
| **앱 툴 실행** | `executeAppTool` | 특정 앱의 동적 Tool 실행 (정적 디스패처) |

### 동적 Tool 실행 전략 (정적 디스패처 패턴)

서브 에이전트, 블록 툴, 앱 툴은 모두 **사용자/상황에 따라 달라지는 동적 Tool**이다. 이것들을 개별 tool로 등록하지 않고, **정적으로 정의된 3개의 디스패처 Tool**을 통해 실행한다.

**이유**
- **프롬프트 캐싱**: OpenAI·xAI 등은 요청을 **prefix matching**으로 캐시한다. tool 정의가 요청에 포함되므로, tool 목록이 바뀌면 prefix가 달라져 캐시 미스가 난다. 디스패처 3개의 정의는 항상 동일하므로 정적 prefix를 유지할 수 있다.
- **확장성**: 서브 에이전트, 앱, 블록 종류가 아무리 늘어나도 tool 수는 고정이고, 호출 대상 목록은 동적 컨텍스트(user message 메타데이터)에만 반영하면 된다.

#### 1. `callSubAgent` — 서브 에이전트 호출

| 파라미터 | 설명 |
|---------|------|
| `agentName` | 호출할 서브 에이전트 이름 (컨텍스트 메타데이터 목록과 매칭) |
| `task` | 위임할 작업을 설명하는 **프롬프트 문자열** |

**서브에이전트별 task(prompt) 가이드가 중요하다.**
- 서브 에이전트마다 **"task에 무엇을 어떻게 써야 하는지"** 가이드를 정의한다.
- 예: Explore → "검색 대상(워크스페이스/페이지/이벤트), 검색 유형(키워드/연결/의미), 목적"
- 예: Browser → "조작 대상 블록, 수행할 동작(이동/클릭/스크린샷 등)"
- 이 가이드는 서브 에이전트 정의(description)나 `get sub agent` 상세에 포함한다.

#### 2. `executeBlockTool` — 블록 툴 실행

| 파라미터 | 설명 |
|---------|------|
| `blockMountId` | 대상 블록 ID |
| `toolName` | 실행할 블록 툴 이름 |
| `params` | 블록 툴에 전달할 파라미터 (JSON object) |

- 특정 **블록에 대해** 동작하는 도구 (유튜브 타임이동, 브라우저 탐색 등)
- `blockMountId`로 대상 블록을 지정하므로 App Tool과 명확히 구분된다.

#### 3. `executeAppTool` — 앱 툴 실행

| 파라미터 | 설명 |
|---------|------|
| `appName` | 대상 앱 이름 |
| `toolName` | 실행할 앱 툴 이름 |
| `params` | 앱 툴에 전달할 파라미터 (JSON object) |

- **블록과 무관하게** 앱의 기능을 실행하는 도구 (이미지 생성, 컴포넌트 생성 등)
- `appName`으로 대상 앱을 지정하므로 Block Tool과 명확히 구분된다.

#### params 전달 방식

`callSubAgent`의 `task`는 자연어 문자열이지만, `executeBlockTool`·`executeAppTool`의 `params`는 **구조화된 JSON object**로 전달한다. LLM이 `get app` / 블록 메타에서 해당 tool의 파라미터 스키마를 확인한 뒤, 올바른 키를 채워서 호출한다.

```
1. get app("SSOTA Image") → tools: [{name: "이미지 생성", params: {prompt: string, style?: string}}]
2. executeAppTool(appName: "SSOTA Image", toolName: "이미지 생성", params: {prompt: "배경 이미지"})
```

### 작업 흐름 예시

```
사용자: "AI 스타트업 트렌드를 조사해서 정리해줘"

메인 에이전트 Orchestration:
1. speak("네, AI 스타트업 트렌드를 조사하겠습니다")                    ← 즉시 음성 응답
2. callSubAgent(agentName: "Explore", task: "웹 검색: AI 스타트업 트렌드, 결과 요약 반환")  ← 컨텍스트 분리
3. renderCanvasdown(검색 결과 DSL)                                    ← 캔버스에 블록 배치
4. organizeLayout(grid, columns: 3)                                    ← 레이아웃 정리
5. speak("조사 결과를 3열 그리드로 정리했습니다")                        ← 완료 보고
```

---

## 7. Context Layer

### 정의

Context Layer는 에이전트가 매 요청마다 참조하는 **상황 정보의 계층 구조**이다. 에이전트가 사용자의 의도를 정확히 파악하고 적절한 작업을 수행하기 위한 핵심 입력이다.

### 업계 비교 (Cursor의 Context Layer)

| 레이어 | 설명 |
|--------|------|
| 현재 열린 탭 | IDE에서 열려있는 파일 목록 |
| 사용 가능한 Tools | 현재 사용 가능한 도구 목록 |
| Sub Agent, Skills | 활용 가능한 서브 에이전트와 스킬 |
| Todo, Plan | 현재 작업 계획과 할일 목록 |

### SSOTA의 Context Layer

SSOTA의 메인 에이전트에는 다음의 컨텍스트가 제공된다.

#### 정적 컨텍스트 (System Prompt — 캐싱 최적화)

변하지 않는 정보. 프롬프트 캐싱으로 비용 90% 절감, 지연 80% 감소.

| 레이어 | 설명 |
|--------|------|
| Sophie 캐릭터 | 에이전트의 성격, 말투, 규칙 |
| Tool 사용법 | 각 Tool의 스키마와 사용 규칙 |
| 작업 규칙 | 블록 조작, 검색, 음성 응답 등의 규칙 |

#### 동적 컨텍스트 (User Message — 매 요청 갱신)

매 요청마다 변하는 정보. user message의 metadata로 전달.

| 레이어 | 설명 | 예시 |
|--------|------|------|
| **Viewport 블록** | 현재 화면에 보이는 블록들의 **메타데이터만** (전체 데이터 X) | `[{id: "abc", type: "youtube", title: "..."}, ...]` |
| **선택된 블록** | 현재 선택된 블록의 상세 정보 | `selectedBlockIds: ["abc", "def"]` |
| **활성 작업 상태** | Status Window에서 수집한 현재 진행 중인 작업들 | `activeJobs: [{type: "summary", status: "running"}]` |
| **이벤트 컨텍스트** | 현재 페이지에서 발생한 주요 이벤트 이력 (블록 생성/수정/삭제 등). 구체화 예정 | `recentEvents: [{type: "block_created", ...}]` |
| **기본 Tools** | 현재 사용 가능한 기본 도구 목록 | Global + Block + App Tools |
| **기본 서브에이전트** | 자동 호출 가능한 기본 서브 에이전트 목록 | Explore, Browser, Research, Visualize |
| **사용자 서브에이전트** | 사용자가 추가한 서브 에이전트의 **메타데이터만** | `[{name: "마케팅 리서처", description: "..."}]` |
| **사용자 앱 목록** | 설치된 앱의 **메타데이터만** (상세 Tool은 `get app`으로 온디맨드 조회) | `[{name: "SSOTA Image", description: "..."}]` |
| **마우스 컨텍스트** | (향후 계획) 호버/클릭된 블록 정보 | `hoveredBlockMountId: "abc"` |
| **음성 시간축 블록** | (향후 계획) 음성 입력 중 시간 순서대로 언급(호버/선택)된 블록들 | 대명사("이거") 해석에 활용 |

### 대명사 해석 규칙

음성/텍스트에서 "이거", "이 블록", "저거" 등의 대명사가 등장할 때:

```
우선순위: selectedBlockIds > hoveredBlockMountId > clickedBlockMountId
```

### SSOTA 적용

- Viewport의 블록은 **메타데이터만** 포함하여 컨텍스트 소모를 최소화한다. 구체적인 내용이 필요하면 Explore 서브에이전트가 탐색한다.
- 정적/동적 컨텍스트 분리는 **프롬프트 캐싱 최적화** 전략의 핵심이다 (OpenAI의 prefix match 기반 캐싱 활용).
- (향후 계획) 마우스 컨텍스트와 음성 시간축은 **자연스러운 포인팅 인터랙션**을 가능하게 한다.

---

## 8. Canvasdown

### 정의

Canvasdown은 캔버스 조작을 위한 **자체 DSL(Domain-Specific Language)**이다. 기존의 개별 조작 도구(addBlocks, updateTitle, updateContent 등) 5개를 하나의 선언적 언어로 통일한다.

### 왜 필요한가

| 비교 항목 | 기존 방식 (개별 Tool) | Canvasdown |
|----------|---------------------|------------|
| 블록 3개 생성 + 연결 | Tool 호출 4~6회 | **1회** |
| 아웃풋 토큰 | 각 Tool 결과 반환 | DSL 1회 출력 |
| Agent Step 소모 | 많음 | 적음 |
| 비주얼 임팩트 | 하나씩 추가됨 | **한 번에 쫙 깔림** |

### 두 가지 모드

#### Full DSL — 신규 블록 생성

새로운 블록, 레이아웃, 엣지를 한 번에 선언적으로 기술한다.

```
canvas LR
@zone header "Research Results" { color: blue }
  @markdown r1 "Result 1" { content: "..." }
  @markdown r2 "Result 2" { content: "..." }
  @markdown r3 "Result 3" { content: "..." }
@end
r1 -> r2 : "related"
```

#### Patch DSL — 기존 블록 수정

이미 존재하는 블록을 수정, 삭제, 연결, 이동, 리사이즈한다.

```
@update <blockMountId> { title: "New Title", content: "New content" }
@delete <blockMountId>
@connect <sourceId> -> <targetId> : "label"
@disconnect <sourceId> -> <targetId>
@move <blockMountId> { x: 100, y: 200 }
@resize <blockMountId> { width: 300, height: 200 }
```

### 지원 블록 타입

`@markdown`, `@shape`, `@youtube`, `@link`, `@image`, `@python`, `@text`, `@zone`

### 레이아웃 방향

`LR` (좌→우), `TB` (상→하), `RL` (우→좌), `BT` (하→상)

### SSOTA 적용

- `renderCanvasdown`이 에이전트의 **핵심 캔버스 조작 Tool**이다.
- 기존 5개 개별 도구를 모두 대체하여 Tool 선택 부담을 줄인다.
- Full 모드에서는 `anchorBlockMountId` 기반으로 상대 위치를 계산한다.
- Patch 모드에서는 기존 `applyPatch` 시스템을 활용한다.

---

## 개념 관계도

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Main Agent                                  │
│  Orchestration · Context Layer(메타데이터+이벤트) 기반 의사결정        │
│                                                                      │
│  Context (동적)             Tools (정적 정의)                         │
│  ┌──────────────────┐      ┌──────────────┐  ┌──────────────────┐   │
│  │ viewport/선택     │      │ Global       │  │ 정적 디스패처 3종  │   │
│  │ activeJobs        │      │ (canvasdown, │  │                  │   │
│  │ event context     │      │  webSearch,  │  │ · callSubAgent   │   │
│  │ 앱 메타데이터      │      │  grep,       │  │ · executeBlockTool│  │
│  │ 서브에이전트 메타   │      │  grepEvents) │  │ · executeAppTool │   │
│  │ (description만)   │      ├──────────────┤  ├──────────────────┤   │
│  └──────────────────┘      │ get app      │  │ 온디맨드 상세 조회 │   │
│                             │ get sub agent│  │ → params 스키마   │   │
│                             └──────────────┘  └────────┬─────────┘   │
└────────────────────────────────────────────────────────┼─────────────┘
                                                         │
        ┌────────────────────────────────────────────────┼────────────┐
        │  스코프 위계: 앱 포함 < 페이지 < 워크스페이스   ▼            │
        │    ┌───────────────────────────────────────┐                │
        │    │            Sub Agent                  │                │
        │    │  정의 시 제한: Tools 목록              │                │
        │    │  정의 시 제한: 호출 가능 Sub Agents     │                │
        │    │  ┌─────────────┐ ┌─────────────────┐  │                │
        │    │  │ Description │ │ Skills          │  │                │
        │    │  │ task 가이드  │ │ Tools (제한)    │  │                │
        │    │  └─────────────┘ └─────────────────┘  │                │
        │    └───────────────────────────────────────┘                │
        └─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  Tool 4계층                                                          │
│  Global | Block (executeBlockTool) | App (executeAppTool)            │
│         | Sub Agent (callSubAgent)                                   │
│  동적 Tool은 정적 디스패처를 통해 실행 (프롬프트 캐싱 보존)           │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  App                                                                 │
│  UI (DOM) · App Tools · 커스텀 Block 정의 · (선택) 앱 내 서브 에이전트│
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  Canvas                                                              │
│  Block (Read-Only / Editable) — 엣지로 연결                          │
│  Canvasdown DSL로 생성/수정/연결/이동 · Block Tool(자동 인덱싱 등)    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 용어 요약 (Quick Reference)

| 용어 | 한줄 정의 |
|------|----------|
| **Block** | 캔버스 위의 데이터 최소 단위 (유튜브, 마크다운, 이미지 등) |
| **App** | UI + Tools로 구성된 확장 단위, 커스텀 블록 정의 가능 |
| **Tool** | 에이전트가 세상과 상호작용하는 능력 (Global / Block / App / Sub Agent 호출) |
| **Skill** | 서브 에이전트의 규격화된 작업 단위 (업무 가이드라인) |
| **Sub Agent** | 전문 분야에 특화된 에이전트 (컨텍스트 분리 목적) |
| **Main Agent** | 전체 작업 흐름을 조율하는 중앙 에이전트 |
| **Context Layer** | 에이전트에 제공되는 상황 정보의 계층 구조 |
| **Canvasdown** | 캔버스 조작을 위한 선언적 DSL (Full/Patch 모드) |
