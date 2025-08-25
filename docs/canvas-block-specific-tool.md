## Canvas Block-Specific Tool 기획안 (AI Native Canvas)

### 목적

- LLM이 캔버스를 조작할 때, 현재 컨텍스트(페이지/블럭/뷰)에 맞는 함수 호출(function call, tool)을 동적으로 제공한다.
- 툴은 공통/페이지/블럭/뷰 단위로 메타데이터에 선언하고, 런타임에 병합/해석/실행한다.
- 확장성: 개발자 SDK로 외부에서 페이지/블럭/뷰/툴을 개발·배포·런타임 로드(프레이머/피그마의 익스텐션 유사).

---

### 핵심 컨셉

- 툴 스코프: Global(전역), Page(페이지 컨텍스트), Block(블럭 인스턴스/타입), View(Canvas/Table/Kanban/Markdown 전용)
- 메타데이터 선언: `page.metadata.tools`, `block.metadata.tools`, `page.metadata.views.{view}.tools`
- 리졸버: 현재 컨텍스트(워크스페이스/페이지/뷰/선택 블럭들)를 입력으로 사용 가능한 툴을 수집/필터/병합
- 실행 라우팅: `runtime.target = server | client | webhook`에 따라 서버 API/클라이언트/웹훅 실행
- 권한/감사: 워크스페이스 롤 + 레이트 리밋 + 감사 로그

---

### 메타데이터 스키마(요약)

```ts
type ToolScope = "global" | "page" | "block" | "view";
type ToolRuntime = { target: "server" | "client" | "webhook"; path?: string };
type ToolParamSource = { source: "selection" | "block" | "page"; path: string };

type ToolDefinition = {
  key: string; // 전역 유니크 권장
  name: string;
  description?: string;
  scope: ToolScope; // global | page | block | view
  applies_to?: {
    // 필수 아님. scope가 page/view인 경우 블럭 조건 필터에 사용
    block_types?: string[]; // 예: ["video", "audio"]
  };
  parameters: object; // JSON Schema (provider-neutral)
  param_sources?: Record<string, ToolParamSource>; // 파라미터 자동 매핑 규칙
  runtime: ToolRuntime; // 실행 타겟 및 서버 경로 등
  permissions?: { roles?: string[]; requiresApproval?: boolean };
  llm_exposure?: { allowModelInitiated: boolean; visibleInUI: boolean };
  rate_limit?: { callsPerMinute?: number; burst?: number };
  ui?: {
    placements: Array<"ai" | "toolbar" | "node-context" | "edge-context">;
  };
};

type ToolContext = {
  workspaceId: string;
  pageId?: string;
  view?: "canvas" | "table" | "kanban" | "markdown";
  selection: string[]; // block ids
  user: { id: string; roles: string[] };
};

type ToolExecutionResult = {
  ok: boolean;
  result?: unknown;
  error?: string;
  sources?: Array<{ title: string; href: string }>;
};
```

페이지 블럭 예시(강의 노트, 비디오/오디오 선택 시 Transcript 생성):

```json
{
  "object": "page",
  "name": "Lecture Notes",
  "metadata": {
    "views": { "default": "canvas" },
    "allowed_component_ids": ["video-def", "audio-def"],
    "tools": [
      {
        "key": "lecture.get_transcript",
        "name": "Get Transcript",
        "description": "Generate transcript for the selected video/audio block.",
        "scope": "page",
        "applies_to": { "block_types": ["video", "audio"] },
        "parameters": {
          "type": "object",
          "properties": {
            "mediaBlockId": { "type": "string" },
            "language": {
              "type": "string",
              "enum": ["auto", "en", "ko"],
              "default": "auto"
            }
          },
          "required": ["mediaBlockId"]
        },
        "param_sources": {
          "mediaBlockId": { "source": "selection", "path": "id" }
        },
        "runtime": {
          "target": "server",
          "path": "/api/ai-tools/lecture/get_transcript"
        },
        "permissions": {
          "roles": ["owner", "editor"],
          "requiresApproval": false
        },
        "llm_exposure": { "allowModelInitiated": true, "visibleInUI": true },
        "ui": { "placements": ["ai", "node-context"] }
      }
    ]
  }
}
```

블럭 인스턴스 예시(비디오 스냅샷):

```json
{
  "object": "component",
  "block_type": "video",
  "name": "Lecture 01",
  "metadata": {
    "role": "instance",
    "data": { "url": "https://..." },
    "tools": [
      {
        "key": "video.capture_snapshot",
        "name": "Capture Snapshot",
        "scope": "block",
        "parameters": {
          "type": "object",
          "properties": { "timestamp": { "type": "number" } },
          "required": ["timestamp"]
        },
        "runtime": { "target": "client" },
        "llm_exposure": { "allowModelInitiated": false, "visibleInUI": true },
        "ui": { "placements": ["node-context"] }
      }
    ]
  }
}
```

---

### 리졸버 파이프라인

1. 입력 컨텍스트 수집: `workspaceId, pageBlock, view, selection(blockIds), displayBlocks, user`
2. 툴 수집/병합 순서(우선순위: Block > Page > View > Global)

- Global 툴(전역 레지스트리)
- `page.metadata.tools`
- `displayBlocks[].metadata.tools` (선택된 블럭/조건 일치 시)
- `page.metadata.views.{view}.tools`

3. `applies_to` 규칙 및 `param_sources` 자동 매핑 적용
4. JSON Schema 유효성 검사 후 LLM에 노출 가능한 툴셋으로 직렬화(OpenAI/Anthropic 포맷 변환 어댑터)

---

### 실행(Runtime) 라우팅

- LLM 툴 호출 → 클라이언트가 실행 라우팅
  - `target=server`: `POST /api/ai-tools/execute`(공통) 또는 툴별 path 프록시
  - `target=client`: 프런트(브라우저) 즉시 실행
  - `target=webhook`: 서드파티 엔드포인트 호출(서버 경유 권장)
- 공통 컨텍스트(감사/보안): `workspaceId, pageId, selection, userId, role`
- 응답 포맷: `ToolExecutionResult`

API 초안:

```http
POST /api/ai-tools/execute
{ key, parameters, context }
→ 200 { ok, result, error, sources }
```

---

### AI 패널/뷰 통합(UI)

- `AIChatPanel` 진입 시 `resolveAvailableTools(ctx)`로 툴셋 계산 → LLM Tool Spec에 삽입
- 모델이 툴 호출 시 결과를 `AITool` 컴포넌트로 스트리밍/표시
- 뷰별 툴 노출: Canvas/Table/Kanban/Markdown 별 `views.{view}.tools` 병합
- 파라미터 부족 시 LLM이 사용자에게 재질의(시맨틱 폼 생성 가능)

---

### 보안/권한/감사

- 퍼미션: `permissions.roles`와 워크스페이스 롤 매칭
- 승인 흐름: `requiresApproval`인 툴은 UI 승인 후 실행
- 레이트 리밋: `rate_limit` + 서버 사이드 토큰 버킷
- 감사: 모든 실행 이벤트 로깅(사용자, 툴 키, 파라미터 요약, 비용/시간, 결과 요약)

---

### 개발자 SDK & 익스텐션 아키텍처

목표: 외부 개발자가 페이지/블럭/뷰/툴을 **우리 코드베이스에 정적 포함 없이** 제작/배포/실행 가능. 프레이머/피그마의 플러그인/위젯 모델 유사.

#### 1) 익스텐션 구성요소

- Manifest(JSON): 메타데이터, 버전, 권한, 로딩 엔드포인트, 노출 컴포넌트/툴 선언
- Runtime 번들(ESM/WASM/iframe App): 렌더러(뷰/노드), 툴 구현, 스타일 토큰 사용
- 서버 훅(API): server-target 툴 실행용 엔드포인트

#### 2) Manifest 스키마(초안)

```json
{
  "id": "acme.lecture-tools",
  "name": "Acme Lecture Tools",
  "version": "0.1.0",
  "author": "Acme Inc.",
  "permissions": {
    "scopes": ["tools:execute", "blocks:read", "blocks:write"],
    "roles": ["owner", "editor"]
  },
  "entry": {
    "module": "https://cdn.acme.com/xbowl/acme-lecture-tools/index.js",
    "integrity": "sha256-...",
    "sandbox": "iframe"
  },
  "tools": [
    {
      "key": "acme.lecture.get_transcript",
      "scope": "page",
      "applies_to": { "block_types": ["video", "audio"] },
      "parameters": {
        "type": "object",
        "properties": { "mediaBlockId": { "type": "string" } },
        "required": ["mediaBlockId"]
      },
      "runtime": {
        "target": "server",
        "path": "https://api.acme.com/xbowl/lecture/get_transcript"
      },
      "llm_exposure": { "allowModelInitiated": true }
    }
  ],
  "views": [
    {
      "id": "acme.table.enhanced",
      "type": "table",
      "renderer": "AcmeEnhancedTable",
      "mount": "export AcmeEnhancedTable from entry.module"
    }
  ],
  "nodes": [
    {
      "type": "acme.video",
      "renderer": "AcmeVideoNode",
      "mount": "export AcmeVideoNode from entry.module"
    }
  ]
}
```

포인트:

- `entry.module`는 ESM 또는 iframe 앱. 무결성(SRI), CSP, 서명 검증 권장
- `tools`/`views`/`nodes`는 런타임 등록 포인트를 명시(이름 기반 export)

#### 3) 로딩/렌더링 전략

- 레지스트리 서비스: 익스텐션 Manifest를 저장/검색(워크스페이스별 설치/활성화)
- 호스트 로더:
  - 안전한 출처만 허용(허용 목록 + SRI + 서명 검증)
  - `sandbox=iframe` 기본, 필요 시 `module federation`/`dynamic import(ESM)` 허용
  - iframe 통신: `postMessage` + RPC 브릿지(API 한정 제공)
  - ESM 모듈: 동적 import 후, `registerNodeRenderer`, `registerViewAdapter`, `registerTools`에 주입
- React Flow 통합:
  - `nodeTypes`를 런타임 확장: `registerNodeRenderer('acme.video', Comp)`
  - 뷰 어댑터: `registerViewAdapter('acme.table.enhanced', Comp)` → `views.default` 대체 가능

#### 4) SDK 표면(API 초안)

```ts
// @xbowl/sdk
export type Register = {
  registerTools(defs: ToolDefinition[]): void;
  registerNodeRenderer(type: string, comp: React.ComponentType<any>): void;
  registerViewAdapter(
    type: "canvas" | "table" | "kanban" | "markdown" | string,
    comp: React.ComponentType<any>
  ): void;
  registerPanel(name: string, comp: React.ComponentType<any>): void; // 선택
};

export function activate(
  register: Register,
  ctx: { workspaceId: string }
): void;
```

개발자는 익스텐션 번들에서 `activate(register, ctx)`를 export. 호스트는 로딩 후 호출하여 렌더러/툴을 등록한다.

#### 5) 권한/보안

- CSP/코드 무결성(SRI)/서명 검증/허용 도메인 화이트리스트
- iframe 기본 + 제한된 API 브릿지, 스토리지 분리
- 서버 경유 툴 실행(비밀키/토큰은 호스트 서버에서 보관)
- 권한 게이트: 설치/활성화/실행 시 롤/스코프 검사

#### 6) 버전/호환성

- `manifest.version` + 호스트 `apiVersion` 교차 검증
- SDK semver 정책, 브레이킹 체인지 시 어댑터 제공

---

### 저장/스키마 정책 정리

- 별도 정의 테이블 없이 `blocks.object`/`metadata` 활용(캔버스 도메인 원칙 유지)
- 페이지 판별: `views`/`allowed_component_ids`/`allowed_edge_types` 메타데이터 존재로
- 툴 정의 저장 위치: 해당 페이지/블럭/뷰의 `metadata.tools` 또는 글로벌 레지스트리(서버)

---

### 단계적 도입 계획

1. Core 추가: 툴 타입/리졸버/실행 라우팅/공통 실행 API
2. 글로벌 툴 2~3개 + 강의 노트 전용 `get_transcript` 스텁 구현
3. `AIChatPanel` → `resolveAvailableTools(ctx)` 연동 + 툴 호출
4. 익스텐션 레지스트리/로더 첫 버전(iframe + postMessage) + SDK alpha
5. 서드파티 STT/요약/하이라이트 툴 샘플 익스텐션 출시

---

### FAQ

- Q. 외부에서 만든 페이지/블럭/뷰/툴을 우리 코드에 정적으로 포함하지 않고도 렌더링 가능?  
  A. 가능. 익스텐션 Manifest + 런타임 로더(iframe/ESM) + 등록 API로 로드/렌더. 권한/무결성/격리 정책을 적용.

- Q. React Flow 노드 타입은 어떻게 동적 등록?  
  A. `registerNodeRenderer(type, Comp)`로 `nodeTypes[type] = Comp`에 주입. 익스텐션 언로드 시 해제.

- Q. 뷰는 어떻게 대체/추가?  
  A. `registerViewAdapter(kind, Comp)`로 Canvas/Table/Kanban/Markdown 또는 커스텀 뷰를 추가하고, 페이지 `views.default`나 UI에서 사용자 선택으로 활성화.

- Q. 서버 연동이 필요한 툴 비밀키는?  
  A. 클라이언트가 공통 실행 API(`/api/ai-tools/execute`)만 호출, 서버가 공급자 API와 통신(키는 서버 보관).

---

### 관련 파일/후속 작업

- 신규(제안): `src/domains/canvas/ai/tools/`
  - `tool-types.ts`: 위 타입 정의
  - `tool-registry.ts`: Global/Page/Block/View 툴 수집/병합/검증
  - `tool-executor.ts`: 실행 라우팅(client/server/webhook)
  - `providers/lecture.get_transcript.ts`: 예시 구현 스텁
- API: `/api/ai-tools/execute` 공통 엔드포인트
- `AIChatPanel`: 컨텍스트 기반 툴 노출/호출 연결
