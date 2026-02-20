# Event Tracking Design — 논의 정리

> Sophie Agent Phase 1 Step 1-13(이벤트 저장/조회 + recentEvents) 및 이후 이벤트 시스템 설계를 위한 논의 요약.
> 페이지는 컨텍스트 기반 업무 공간이고, 이벤트는 그 공간에서 **시간순으로 무슨 일이 있었는지** 이해하기 위한 수단이다.

---

## 1. 배경과 목적

- **페이지**: 특정 업무에 대한 컨텍스트 공간. 그동안 일어난 워크플로우의 **기록이자 결과**.
- **캔버스의 블록/앱**: 결과의 **단면** — 진행 상황과 결정 과정을 이해하기에는 부족함.
- **이벤트**: 페이지 상에서 **무슨 일이 언제 일어났는지** 시간순으로 이해하는 것. 업무 맥락과 의사결정 과정 이해에 중요.

이 문서는 "어디까지 이벤트를 트래킹할지", "어떻게 설계하면 좋을지"에 대한 논의를 정리한 것이다.

---

## 2. 현재 인프라 요약

이미 다음이 존재한다:

| 구분 | 내용 |
|------|------|
| **DB** | `event_logs` 테이블 (page_id, event_type, action, payload, search_content, agent_execution_id, timestamp) |
| **Enum** | `event_type`, `event_action` (user_utterance, ai_response, tool_call, block, edge, component, instance, property 등) |
| **도메인** | EventLog 엔티티, EventType VO, EventLogAggregate |
| **저장소** | EventLogRepository — BM25, 메타데이터, 하이브리드 검색 지원 |
| **서비스** | ContextAssemblyService(short-term/long-term memory), MemorySearchService |

**미연결 부분**:
- V2 에이전트에서 tool 실행 후 이벤트 저장이 연결되어 있지 않음 (TODO 상태).
- `recentEvents` 동적 컨텍스트는 context-builder에 미구현.
- `grepEvents` / `getPageEvents` 도구 미구현.

---

## 3. 이벤트의 소비자(Consumer)

어디까지 트래킹할지는 **누가 이벤트를 왜 읽는지**에 따라 결정한다.

| 소비자 | 목적 | 필요한 것 |
|--------|------|----------|
| **Sophie (에이전트)** | "방금 뭘 했지?" 맥락으로 연속 작업 | `recentEvents` — 최근 N개, 요약 형태 |
| **Sophie (명시적 질의)** | "어제 뭐 했어?" 등 히스토리 질의 | `grepEvents` / `getPageEvents` 도구 |
| **사용자 (향후 UI)** | 작업 히스토리 타임라인, 의사결정 회고 | 타임라인 UI — 시간순 이벤트 스트림 |

---

## 4. 이벤트 계층 제안

모든 것을 트래킹하면 노이즈가 되고, 너무 적으면 맥락이 부족하다. **"의사결정 과정을 재구성할 수 있는 최소한"**을 기준으로 3단계를 둔다.

### Level 1: Intent Events (의도 이벤트) — 반드시 트래킹

"왜 이 일이 일어났는지"의 시작점.

| 이벤트 | 설명 |
|--------|------|
| `user_utterance` | 사용자가 무엇을 요청했는지 |
| `ai_response` | 에이전트가 어떻게 응답했는지 (요약) |
| `ai_plan` | 에이전트가 세운 계획 (복잡한 작업 시 createTodos 등) |

### Level 2: Action Events (행위 이벤트) — 반드시 트래킹

"무슨 일이 일어났는지"의 핵심.

| 이벤트 | 설명 |
|--------|------|
| `tool_call` | 어떤 도구를 호출했는지 (이름, 파라미터 요약, 성공/실패) |
| `block_created` | 어떤 블록이 생성됐는지 (blockMountId, type, title) |
| `block_updated` | 어떤 블록이 수정됐는지 (blockMountId, 변경 요약) |
| `block_deleted` | 어떤 블록이 삭제됐는지 |
| `edge_created` | 어떤 연결이 만들어졌는지 |
| `edge_deleted` | 어떤 연결이 끊어졌는지 |

### Level 3: Context Events (맥락 이벤트) — 선택적 트래킹

저장 비용·노이즈와의 트레이드오프. 필요 시 점진적 추가.

| 이벤트 | 설명 |
|--------|------|
| `search_performed` | 검색 수행 (query, 결과 수) — "어떤 정보를 참조했는지" |
| `page_navigated` | 페이지 이동 |
| `layout_changed` | 레이아웃 변경 |
| `block_read` | 블록 내용 읽기 (에이전트가 어떤 블록을 참조했는지) |

### 트래킹하지 않을 것 (명시적 제외)

- viewport 변경 (zoom, pan) — 너무 빈번, 노이즈
- 블록 순수 이동/리사이즈만 — 의사결정과 무관한 경우
- 마우스 hover / selection 변경 — 이벤트가 아닌 컨텍스트(selectedBlockIds 등)로 처리
- 에디터 키 입력 수준 — 최종 저장 시점의 `block_updated`만 기록

---

## 5. Actor(행위자) 구분

각 이벤트에 **누가 트리거했는지**를 기록한다.

| Actor | 설명 |
|-------|------|
| `user` | 사용자가 직접 수행 (userId) |
| `agent` | 에이전트가 수행 (agentId, executionId) |
| `system` | 시스템 자동 (예: 소스 추출 완료) |

- "이 블록은 내가 만든 거야, 소피가 만든 거야?"에 답할 수 있어야 함.
- `agent_execution_id`로 "한 번의 대화에서 일어난 모든 일"을 그룹핑 가능.

---

## 6. 유저별 기록 · 블록별 역사

이벤트를 **누구 기준으로**, **무엇 기준으로** 볼 수 있는지가 중요하다. 유저별로 따로 기록되고, 특정 블록의 역사를 따로 볼 수 있으면 협업·회고 모두에 유리하다.

### 6.1 유저별로 따로 기록·조회

- **저장**: `event_logs`에 `user_id`가 이미 있음. 모든 이벤트는 **어떤 유저의 페이지/세션에서 일어난 일인지** 소유자 정보와 함께 기록된다.
- **조회 시 유저 필터**:
  - **현재 사용자만**: "내가 이 페이지에서 한 일만 보기" — `userId`(또는 `actor: 'user'`)로 필터.
  - **협업 시**: "이 페이지에서 A가 한 일 / B가 한 일" — 특정 `userId`로 필터해 타임라인을 나눌 수 있음.
- **도구 파라미터**: `getPageEvents`, `grepEvents`에 `userId`(선택) 추가. 미지정 시 페이지 전체, 지정 시 해당 유저와 연관된 이벤트만 반환 (예: 해당 유저가 발화한 utterance + 그 유저 세션에서의 agent/tool 이벤트).  
  - 구현 시 "연관된"의 범위는 정책으로 결정 (예: `user_id` 일치만, 또는 `agent_execution_id`로 묶인 대화 단위까지).

**정리**: 유저마다 나눠서 볼 수 있게 하는 것은 **조회 단계**에서 `userId`(및 필요 시 actor) 필터로 지원하면 된다. 기록은 이미 유저별로 남는다.

### 6.2 특정 블록의 역사 (Events by Block)

- **요구**: "이 블록에 무슨 일이 있었어?", "이 블록 언제 만들어졌고, 누가 몇 번 수정했어?"처럼 **특정 블록(blockMountId / blockId)에 관한 이벤트만** 보고 싶은 경우.
- **방법**:
  - block 관련 이벤트는 payload에 `block_mount_id`(또는 `block_id`)를 넣어 저장한다 (tool_call이면 `created_block_mount_ids`, block_created/updated/deleted면 해당 블록 ID).
  - **조회**: `getPageEvents` 또는 전용 **getEventsByBlock**에서 `blockMountId`(또는 `blockId`) 파라미터를 받아, payload에 해당 ID가 포함된 이벤트만 필터해서 시간순 반환.
- **grepEvents by block**: `grepEvents`에 `blockMountId`(선택) 파라미터를 두면, 키워드 검색 결과를 **해당 블록과 관련된 이벤트로 한정**할 수 있다. "이 블록 관련해서 '요약'이라고 언급된 이벤트 찾기" 같은 질의에 대응.

**정리**: 블록별 역사는 **payload에 block 식별자 포함** + **조회/검색 시 blockMountId(또는 blockId) 필터**로 지원한다. 필요하면 `getEventsByBlock(pageId, blockMountId, options)` 같은 전용 API/도구를 두어 "이 블록의 일지"를 한 번에 가져오는 것도 좋다.

---

## 7. recentEvents 동적 컨텍스트

매 요청마다 에이전트에게 주입되는 `recentEvents`는 **토큰 효율과 맥락 가치의 균형**이 중요하다.

**형식 예시**:
- `type`, `actor`, `summary`(한 줄 요약), `timestamp`, `timeAgo`, `relatedBlockMountIds`(선택)

**주입 전략**:
- 최근 N개(10–15개 수준)를 시간순.
- 같은 `executionId`의 tool_call은 묶어서 요약 가능 (예: "블록 3개 검색 후 2개 생성").
- 연속 반복 이벤트 압축 (예: "블록 5개 생성" 한 줄).
- Level 1 + Level 2 위주, Level 3은 제외해 토큰 절약.

**제외 대상** (repo `recentContextForAgent`에서 SQL 필터):
- `user_utterance`, `ai_response`, `tool_call` — 채팅 관련 이벤트가 few-shot처럼 주입되면 대화 품질이 떨어짐.

---

## 8. tool_call과 block/edge 이벤트의 중복 방지

- **에이전트가 블록 생성한 경우**: `tool_call` 1건만 저장하고, payload에 `created_block_mount_ids` 등 결과를 포함. 별도 `block_created` 이벤트는 생략.
- **사용자가 직접 블록 생성/삭제한 경우**: `block_created` / `block_deleted` 등으로 별도 기록 (actor: user).

즉, "에이전트 경유 변경"은 tool_call payload로 표현하고, "사용자 직접 조작"만 block/edge 이벤트로 남긴다.

---

## 9. grepEvents / getPageEvents 도구 방향

- **getPageEvents**: 페이지 단위, 시간순 이벤트 조회. `since`/`until`, `eventTypes`, `limit`, `groupByExecution` 외에 **`userId`**(유저별 필터), **`blockMountId`**(특정 블록 관련 이벤트만) 선택 지원.
- **grepEvents**: 이벤트 내용/요약에서 키워드 검색. `query`, `pageId`, `eventTypes`, `actor`, `since`, `limit` 외에 **`userId`**, **`blockMountId`** 선택 지원. `blockMountId`가 있으면 "이 블록에 관한 이벤트 중에서만 검색" (grepEvents by block).
- **getEventsByBlock** (선택): "이 블록의 역사" 전용. `pageId`, `blockMountId`, `since`, `limit` 등으로 해당 블록이 payload에 등장하는 이벤트만 시간순 반환. getPageEvents + blockMountId 필터로 대체 가능하지만, 시맨틱이 명확한 전용 도구/API가 있으면 에이전트·UI 모두 사용하기 편하다.

기존 EventLogRepository의 `findRecentByPageId`, BM25/하이브리드 검색을 활용하고, 유저/블록 필터는 payload·metadata 조건으로 추가하면 된다.

---

## 10. 이벤트 저장 시점 (구현 시 참고)

| 이벤트 | 저장 시점 | 위치 |
|--------|----------|------|
| `user_utterance` | 요청 수신 시 | route.ts |
| `ai_response` | 스트리밍 완료 후 | route.ts onFinish |
| `tool_call` | 각 tool 실행 완료 후 | route.ts tool result handler |
| block/edge 변경 (에이전트 경유) | tool_call payload에 결과 포함 | 별도 block_created 미기록 |
| block/edge 변경 (사용자 직접) | 클라이언트에서 발행 | Phase 2 이후 검토 가능 |

---

## 11. 결론: 어디까지 트래킹할지

- **목표**: "이 페이지에서 일어난 의사결정 과정을 제3자가 이해할 수 있을 정도".
- **반드시**: Level 1 (Intent) + Level 2 (Action).
- **선택**: Level 3은 `search_performed` 등부터 필요 시 추가.
- **제외**: viewport/zoom, 순수 레이아웃 이동, hover/selection 등.

블록/캔버스는 "지금 상태(what is)"를 보여주고, 이벤트는 "어떻게 여기까지 왔는지(how we got here)"를 보여준다. 삭제된 블록, 수정 전 내용, 왜 이 구조가 되었는지를 이해하려면 이벤트 레이어가 필요하다.

---

## 12. 구현 우선순위 (Step 1-13 기준)

1. **이벤트 저장 파이프라인 연결** — route.ts에서 user_utterance, ai_response, tool_call 저장.
2. **recentEvents 동적 컨텍스트** — context-builder에 주입 (EventLogRepository.findRecentByPageId 활용).
3. **getPageEvents 도구** — 시간순 이벤트 조회.
4. **grepEvents 도구** — 이벤트 검색 (BM25/하이브리드 활용).
5. **사용자 직접 조작 이벤트** — 클라이언트 발행은 Phase 2 이후 검토.
6. **유저/블록 스코프** — getPageEvents·grepEvents에 `userId`, `blockMountId` 파라미터 추가; 필요 시 getEventsByBlock 전용 도구/API.

---

## 13. 관련 문서

- [Architecture.md](./Architecture.md) — Context Layer, recentEvents, grepEvents
- [sophie-implementation-plan.md](./sophie-implementation-plan.md) — Step 1-13 이벤트 저장/조회 + recentEvents
- [phase_1_implementation plan](.cursor/plans/phase_1_implementation_e0eee83b.plan.md) — Step 1-13 체크리스트
