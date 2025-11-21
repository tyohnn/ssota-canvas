# 기본 AI - Vercel AI Agent 설계 (Simplified)

**작성일**: 2025-11-12  
**상태**: 설계 확정  
**관련 기능**: AI Agent (Vercel AI SDK 기반)

---

## 📋 목차

1. [설계 개요](#설계-개요)
2. [AI 기능 전체 구조](#ai-기능-전체-구조)
3. [기본 AI Agent의 목표와 철학](#기본-ai-agent의-목표와-철학)
4. [단순화된 아키텍처](#단순화된-아키텍처)
5. [컨텍스트 구성](#컨텍스트-구성)
6. [툴 시스템](#툴-시스템)
7. [Agent Loop 실행](#agent-loop-실행)
8. [실제 유스케이스 시나리오](#실제-유스케이스-시나리오)
9. [기술 스택 및 구현](#기술-스택-및-구현)
10. [검토 포인트](#검토-포인트)
11. [다음 단계](#다음-단계)

---

## 설계 개요

### 핵심 의사결정

이전 설계에서 **Two-Line Response + 액션칩** 패턴을 사용했으나, 이를 **단순화**하여:

✅ **Vercel AI SDK Agent** 사용  
✅ **액션칩 제거** → Agent가 직접 툴 호출  
✅ **자율 실행** → 사용자는 발화만 입력, Agent가 자율적으로 작업 수행  
✅ **툴 중심** → 캔버스 조작/검색 툴을 Agent가 직접 호출  
✅ **이벤트 로깅** → 모든 툴 호출을 이벤트 로그에 저장

### 설계 변경 이유

| 기존 설계 | 단순화된 설계 | 이유 |
|----------|--------------|------|
| Two-Line Response | ❌ 제거 | Agent가 직접 작업하므로 불필요 |
| 액션칩 (Action Chips) | ❌ 제거 | 사용자 중간 클릭 없이 자율 실행 |
| Command Chain | ✅ 툴 호출로 대체 | Vercel AI SDK가 툴 호출 자동 관리 |
| 복잡한 Context Area System | ✅ 단순화 | 선택/주변/의미적 블럭 3가지만 |

---

## AI 기능 전체 구조

쏘타 서비스는 AI 기능을 3가지로 구분:

### 1. 기본 AI (AI Agent)
**역할**: Vercel AI SDK 기반 Agent로 캔버스 작업 자율 수행  
**특징**: 컨텍스트 자동 추론, 툴 직접 호출, 자율 실행

### 2. 블럭 액션 AI (Block Action AI)
**역할**: 1회성 AI 함수 실행  
**예시**: 
- 스크립트 추출
- 요약
- 코드 작성
- 이미지 생성 등

**기본 AI와의 관계**:
- 기본 AI Agent가 블럭 액션 AI를 **툴로 호출**
- 예: "이 코드 리팩터해줘" → Agent가 `executeBlockAction` 툴 호출

### 3. AI 워크플로우 (AI Workflow) *(향후)*
**역할**: 복잡한 AI 자동화  
**특징**:
- 커스텀 프롬프트 설정
- 인풋/아웃풋 블럭 설정
- 자동 스케줄링 실행

> 📝 **현재 문서의 범위**: 이 문서는 **기본 AI Agent**의 설계를 다룸

---

## 기본 AI Agent의 목표와 철학

### 핵심 목표
**"Cursor IDE처럼 캔버스에서 컨텍스트를 자동으로 찾고, Agent가 자율적으로 작업 수행"**

- Cursor가 IDE에서 컨텍스트를 자동으로 찾고 작업하듯
- 쏘타 Agent는 캔버스에서 블럭, 엣지, 이력 등을 자동으로 파악
- Agent가 스스로 툴을 호출하여 작업 완료
- 사용자는 결과만 확인하고 필요시 피드백

### 철학적 배경

#### 1. **Agent-First, Not Chat-First**
- 챗 UI의 긴 응답 대신 → **직접 작업 수행**
- "말하는 AI"가 아니라 → **행동하는 AI**

#### 2. **Tool-Centric Architecture**
- Agent가 캔버스를 조작하는 방법 = **툴 호출**
- 모든 작업은 툴로 표준화
- 툴 호출 = 재사용 가능 + 로깅 가능 + 학습 가능

#### 3. **Context is King**
- 정확한 컨텍스트 = 정확한 작업
- 선택/주변/의미적 블럭을 지능적으로 수집
- 메모리 (숏텀/롱텀)를 활용한 맥락 이해

---

## 단순화된 아키텍처

### 전체 플로우

```
┌──────────────────────────────────────────────────────────────┐
│                        User Utterance                         │
│                     "이 코드 리팩터해줘"                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    Context Assembly                           │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐         │
│  │Short-Term   │  │Long-Term    │  │Canvas        │         │
│  │Memory       │  │Memory       │  │Context       │         │
│  │(최근 이력)   │  │(시맨틱 검색) │  │(선택/주변/의미)│        │
│  └─────────────┘  └─────────────┘  └──────────────┘         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              Vercel AI Agent (LLM Reasoning)                  │
│                                                               │
│  Context + Available Tools → LLM Decision                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
            ┌────────┴────────┐
            │                 │
            ▼                 ▼
    ┌──────────────┐  ┌──────────────┐
    │Canvas        │  │Canvas        │
    │Manipulation  │  │Search        │
    │Tools         │  │Tools         │
    │              │  │              │
    │- addBlock    │  │- searchByHop │
    │- deleteBlock │  │- searchBy    │
    │- updateProp  │  │  Keyword     │
    │- connect     │  │- searchBlock │
    │- execute     │  │  Actions     │
    │  BlockAction │  │- searchMulti │
    └──────┬───────┘  └──────┬───────┘
           │                 │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │ Tool Result     │
           │ → Agent         │
           └────────┬────────┘
                    │
            ┌───────┴───────┐
            │ Continue?     │
            └───┬───────┬───┘
                │       │
          Yes ◄─┘       └─► No
           │                 │
           └─► Loop          ▼
                    ┌─────────────────┐
                    │ Task Completed  │
                    │ → Log to Event  │
                    │   Store         │
                    └─────────────────┘
```

### 핵심 컴포넌트

1. **Context Manager**: 메모리 + 캔버스 컨텍스트 조립
2. **Vercel AI Agent**: LLM 추론 + 툴 호출 결정
3. **Tool Executor**: 툴 실행 및 결과 반환
4. **Event Logger**: 모든 툴 호출 기록
5. **Vector Store**: 시맨틱 검색 (롱텀 메모리)

---

## 컨텍스트 구성

### 1. Short-Term Memory (숏텀 메모리)

**정의**: 페이지 단위로 최근 N개 이벤트를 시간 순으로 조회

**포함 대상**:
- 사용자 발화
- Agent 툴 호출
- 블럭 생성/수정/삭제
- 블럭 액션 실행

**개수**: 최근 10-20개 이벤트

**목적**: 
- 최근 작업 맥락 유지
- "방금 만든 블럭", "아까 말한 내용" 이해

**구현**:
```typescript
// 페이지 단위 최근 이벤트 조회
const shortTermMemory = await getRecentEvents({
  pageId: currentPageId,
  limit: 20,
  orderBy: 'timestamp DESC'
});
```

---

### 2. Long-Term Memory (롱텀 메모리)

**정의**: 발화와 유사성 높은 과거 작업 이력을 시맨틱 검색으로 복원

**검색 방식**:
1. 현재 발화를 임베딩
2. 벡터 DB에서 유사도 높은 과거 이벤트 검색
3. 시간 가중치 적용 (최근일수록 높은 점수)
4. 상위 N개 선택


```

**개수**: 상위 5-10개 이벤트

**목적**:
- 과거 유사 작업 패턴 복원
- 사용자 선호도 학습
- 반복 작업 최적화

**예시**:
```
현재 발화: "이 코드 리팩터해줘"
→ 과거 검색: "코드 리팩터 관련 이전 작업"
→ 발견: 2주 전에 비슷한 코드 리팩터 요청
→ 컨텍스트에 추가: "이전에는 이렇게 리팩터했어요"
```

**구현**:
```typescript
const longTermMemory = await vectorSearch({
  query: userUtterance,
  pageId: currentPageId,
  limit: 10,
  timeWeight: true,
  tau: 30 // days
});
```

---

### 3. Canvas Context (캔버스 컨텍스트)

#### 3.1 선택 블럭 (Selected Blocks)

**정의**: 사용자가 현재 선택한 블럭

**우선순위**: **최우선**

**목적**: 명시적 의도 파악

**예시**:
```
사용자가 코드 블럭 선택 후 "리팩터해줘"
→ 해당 코드 블럭을 주 대상으로 인식
```

---

#### 3.2 주변 블럭 (Nearby Blocks)

**정의**: 선택 블럭 주변의 관련 블럭들

**수집 기준**:
1. **거리 기반** (Proximity): 좌표상 가까운 블럭 (반경 N px 내)
2. **그룹 기반** (Group): 같은 그룹에 소속된 블럭
3. **엣지 Hop 기반** (Edge): 1차 연결된 블럭 (엣지로 연결)

**개수**: 
- 거리: 5-10개
- 그룹: 전체 (그룹 크기 제한 있음)
- 엣지 1-hop: 5-10개

**우선순위**: 
1. 엣지 연결 블럭 (사용자가 명시적으로 연결한 관계)
2. 같은 그룹 블럭
3. 좌표 근접 블럭

**목적**: 
- 공간적 맥락 이해
- 사용자가 시각적으로 구성한 구조 활용

**철학**:
> 사용자가 블럭을 특정 위치에 배치하거나 엣지로 연결하는 행위는  
> **의미적 연관성에 대한 인간의 판단**이 시각적으로 표현된 것입니다.  
> 이를 ML 모델의 시맨틱 검색보다 우선 활용합니다. (인간 지능 존중)

---

#### 3.3 의미적 블럭 (Semantic Blocks)

**정의**: 발화와 블럭 내용 간 시맨틱 유사도가 높은 블럭

**검색 방식**:
1. 발화를 임베딩
2. 현재 페이지의 모든 블럭 임베딩과 비교
3. 유사도 상위 N개 선택

**개수**: 5개

**목적**: 
- 명시적으로 선택/연결되지 않았지만 의미적으로 관련 있는 블럭 발견
- "이 주제와 관련된 다른 블럭"

**예시**:
```
발화: "결제 프로세스 정리해줘"
→ 페이지 내 "결제 관련" 블럭들 검색
→ 선택되지 않았지만 관련된 마크다운 노트, 다이어그램 등 발견
```

---

### 4. Available Tools (사용 가능한 툴)

**정의**: Agent가 호출할 수 있는 툴 목록과 메타데이터

**제공 정보**:
- 툴 이름
- 툴 설명
- 파라미터 스키마
- 사용 예시

**목적**: Agent가 작업에 적합한 툴 선택

---

### 5. 컨텍스트 전달 전략

**핵심 원칙**: 프론트엔드와 서버가 각각 담당하는 컨텍스트를 분리하여 효율적으로 전달

#### 5.1 Client Context (프론트엔드 → 서버)

**정의**: 프론트엔드에서만 알 수 있는 UI 상태 및 사용자 의도

**전달 방식**: `sendMessage`의 `metadata` 필드 사용

```typescript
interface ClientContext {
  // 필수
  pageId: string;
  workspaceId: string;
  organizationId: string;
  
  // 선택 상태
  selectedBlockIds: string[];
  
  // 뷰포트 (보고 있는 영역)
  viewport: {
    x: number;
    y: number;
    zoom: number;
    width: number;
    height: number;
  };
  
  // UI 상태
  visibleBlockIds: string[]; // 현재 화면에 보이는 블럭들
  recentlyModifiedBlockIds: string[]; // 최근 수정한 블럭들
  hoveredBlockId?: string;
  
  // 필터/정렬
  filters?: Record<string, any>;
  sortBy?: string;
  
  // 사용자 의도 힌트
  lastAction?: {
    type: 'block_created' | 'block_moved' | 'edge_created' | ...;
    timestamp: number;
    blockIds: string[];
  };
}
```

**구현 예시**:
```typescript
const handleSubmit = async (userMessage: string) => {
  const currentContext: ClientContext = {
    pageId: canvasStore.currentPageId,
    workspaceId: canvasStore.workspaceId,
    selectedBlockIds: canvasStore.selectedBlocks.map(b => b.id),
    viewport: {
      x: canvasStore.viewport.x,
      y: canvasStore.viewport.y,
      zoom: canvasStore.viewport.zoom,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    visibleBlockIds: canvasStore.getVisibleBlockIds(),
    recentlyModifiedBlockIds: canvasStore.getRecentlyModifiedIds(10),
  };
  
  // ✅ metadata로 컨텍스트 전달
  sendMessage({
    text: userMessage,
    metadata: currentContext,
  });
};
```

#### 5.2 Server Context (서버에서 조립)

**정의**: DB/벡터 검색이 필요한 컨텍스트

**조립 방식**: 서버에서 `assembleServerContext()` 함수로 수집

```typescript
interface ServerContext {
  // 블럭 전체 데이터
  selectedBlocks: Block[]; // 선택된 블럭의 전체 정보
  nearbyBlocks: Block[]; // 주변 블럭 (거리/그룹/엣지 기반)
  semanticBlocks: Block[]; // 의미적 블럭 (벡터 검색)
  
  // 메모리
  shortTermMemory: Event[]; // 최근 20개 이벤트
  longTermMemory: Event[]; // 시맨틱 검색 결과
  
  // 권한
  userPermissions: Permission[];
  
  // 메타데이터
  availableBlockTypes: BlockType[];
  availableBlockActions: BlockAction[];
}
```

**구현 예시**:
```typescript
async function assembleServerContext(frontendContext: ClientContext): Promise<ServerContext> {
  const { pageId, selectedBlockIds } = frontendContext;
  
  // 1. 선택된 블럭의 전체 데이터
  const selectedBlocks = await db.blocks.findMany({
    where: { id: { in: selectedBlockIds } },
    include: { properties: true }
  });
  
  // 2. 주변 블럭 (거리/그룹/엣지 기반)
  const nearbyBlocks = await findNearbyBlocks(selectedBlockIds, pageId);
  
  // 3. 의미적 블럭 (벡터 검색)
  const semanticBlocks = await vectorSearch({
    query: messages[messages.length - 1].content,
    pageId,
    limit: 5
  });
  
  // 4. Short-term Memory
  const shortTermMemory = await getRecentEvents({
    pageId,
    limit: 20
  });
  
  // 5. Long-term Memory
  const longTermMemory = await vectorSearchEvents({
    query: messages[messages.length - 1].content,
    pageId,
    limit: 10
  });
  
  return {
    selectedBlocks,
    nearbyBlocks,
    semanticBlocks,
    shortTermMemory,
    longTermMemory,
    userPermissions: await getUserPermissions(userId),
    availableBlockTypes: await getAvailableBlockTypes(),
    availableBlockActions: await getAvailableBlockActions(),
  };
}
```

#### 5.3 통합 컨텍스트 → System Prompt

**목적**: Client Context + Server Context를 통합하여 LLM에 전달

```typescript
function buildSystemPrompt(fullContext: ClientContext & ServerContext): string {
  return `
You are an AI agent that helps users work on a canvas.

## Current Context

### Selected Blocks (${fullContext.selectedBlocks.length})
${fullContext.selectedBlocks.map(b => `
- ID: ${b.id}
  Type: ${b.type}
  Content: ${JSON.stringify(b.content).slice(0, 100)}...
`).join('\n')}

### Nearby Blocks (${fullContext.nearbyBlocks.length})
${fullContext.nearbyBlocks.map(b => `
- ${b.id}: ${b.type} (distance: ${b.distance}px)
`).join('\n')}

### Semantic Blocks (${fullContext.semanticBlocks.length})
${fullContext.semanticBlocks.map(b => `
- ${b.id}: ${b.type} (similarity: ${b.similarity})
`).join('\n')}

### Recent Activity (Short-term Memory)
${fullContext.shortTermMemory.map(e => `
- [${e.timestamp}] ${e.type}: ${e.summary}
`).join('\n')}

### Similar Past Work (Long-term Memory)
${fullContext.longTermMemory.map(e => `
- ${e.summary} (${e.timeAgo})
`).join('\n')}

### Viewport Context
- Position: (${fullContext.viewport.x}, ${fullContext.viewport.y})
- Zoom: ${fullContext.viewport.zoom}
- Visible Blocks: ${fullContext.visibleBlockIds.length}

## Your Task
Help the user with their request using the available tools.
Prioritize selected blocks, then nearby blocks, then semantic blocks.
  `.trim();
}
```

#### 5.4 컨텍스트 전달 최적화

**성능 고려사항**:

1. **점진적 로딩**: 필수 컨텍스트만 먼저 전송, 나머지는 필요시 search tool로
   ```typescript
   const minimalContext = {
     selectedBlocks, // 필수
     recentMemory: shortTermMemory.slice(0, 5), // 최근 5개만
   };
   ```

2. **컨텍스트 압축**: 블럭 내용이 너무 길면 요약
   ```typescript
   function compressContext(context: ServerContext) {
     return {
       ...context,
       selectedBlocks: context.selectedBlocks.map(b => ({
         id: b.id,
         type: b.type,
         contentSummary: b.content.slice(0, 200) + '...',
         metadata: b.metadata,
       })),
     };
   }
   ```

3. **캐싱**: 동일 페이지의 컨텍스트는 일정 시간 캐싱
   ```typescript
   const cachedContext = await redis.get(`context:${pageId}`);
   if (cachedContext && !isStale(cachedContext)) {
     return JSON.parse(cachedContext);
   }
   ```

---

## 툴 시스템

### 캔버스 조작 툴 (Canvas Manipulation Tools)

#### 1. `addBlock`
**설명**: 새 블럭 생성  
**파라미터**:
```typescript
{
  blockType: 'markdown' | 'code' | 'image' | 'shape' | ...,
  content: any,
  position: { x: number, y: number }
}
```

#### 2. `duplicateBlock`
**설명**: 기존 블럭 복제  
**파라미터**:
```typescript
{
  blockId: string,
  offset?: { x: number, y: number }
}
```

#### 3. `deleteBlock`
**설명**: 블럭 삭제  
**파라미터**:
```typescript
{
  blockId: string
}
```

#### 4. `connectBlocks`
**설명**: 두 블럭을 엣지로 연결  
**파라미터**:
```typescript
{
  sourceBlockId: string,
  targetBlockId: string,
  edgeType?: string,
  label?: string
}
```

#### 5. `updateProperty`
**설명**: 블럭 속성 변경  
**파라미터**:
```typescript
{
  blockId: string,
  propertyId: string,
  value: any
}
```

#### 6. `executeBlockAction`
**설명**: 블럭 액션 AI 실행  
**파라미터**:
```typescript
{
  blockId: string,
  action: string,
  params?: any
}
```

---

### 캔버스 검색 툴 (Canvas Search Tools)

#### 1. `searchByHop`
**설명**: 특정 블럭으로부터 N-hop 연결 블럭 검색  
**파라미터**:
```typescript
{
  startBlockId: string,
  hops: number,
  edgeType?: string
}
```

#### 2. `searchByKeyword`
**설명**: 키워드로 블럭 검색  
**파라미터**:
```typescript
{
  keyword: string,
  blockTypes?: string[]
}
```

#### 3. `searchBlockActions`
**설명**: 블럭 액션 검색  
**파라미터**:
```typescript
{
  query: string,
  blockType?: string
}
```

#### 4. `searchMultimodal`
**설명**: 멀티모달 검색 (텍스트 + 이미지)  
**파라미터**:
```typescript
{
  textQuery?: string,
  imageQuery?: string,
  threshold?: number
}
```

---

## Agent Loop 실행

### 아키텍처 결정: Server Reasoning + Client Execution

**핵심 결정**: Tool execution을 서버에서 할지 클라이언트에서 할지에 대한 고민을 거쳐, **하이브리드 방식**을 채택했습니다.

#### 고려했던 옵션들

**옵션 1: 서버에서 Tool Call 루프 (maxSteps)**
- ✅ Agent loop가 서버에서 자동 관리
- ❌ 캔버스 상태 동기화 복잡 (서버 DB 변경 → 프론트 업데이트 필요)
- ❌ 기존 캔버스 조작 로직과 분리됨

**옵션 2: 클라이언트에서 루프 관리**
- ✅ 캔버스 상태와 툴 실행이 같은 곳 (프론트)
- ✅ 기존 훅 재사용 가능
- ❌ Agent loop 로직이 프론트에 (복잡도 증가)
- ❌ 각 툴 API 호출마다 네트워크 요청

**옵션 3: 하이브리드 (채택 ⭐)**
- ✅ **서버**: LLM reasoning만 담당 (툴 스키마 제공, execute 없음)
- ✅ **클라이언트**: `onToolCall`로 툴 실행 후 `addToolOutput`으로 결과 추가 (기존 훅 재사용)
  - ⚠️ **최신 API**: `experimental_onToolCall`이 deprecated되어 `onToolCall`을 사용 (Vercel AI SDK 최신 버전)
- ✅ 툴 실행 결과가 다시 서버로 전달되어 다음 reasoning에 활용
- ✅ Agent loop는 Vercel AI SDK가 자동 관리 (`sendAutomaticallyWhen` 사용)

#### 최종 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   Client (React)                     │
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │ Chat UI      │────────▶│ useChat Hook  │         │
│  │ (Messages)   │         │ + onToolCall │         │
│  └──────────────┘         └──────┬───────┘         │
│                                   │                  │
│                          ┌────────▼────────┐        │
│                          │ Canvas Actions  │        │
│                          │ (useBlockStore) │        │
│                          └─────────────────┘        │
└──────────────┬──────────────────────────────────────┘
               │ Stream                ▲ Fetch
               │                       │
┌──────────────▼───────────────────────┴───────────────┐
│                   Server (API)                        │
│                                                       │
│  ┌──────────────┐         ┌──────────────┐          │
│  │ LLM Reasoner │────────▶│ Tool Schemas │          │
│  │ (streamText) │         │ (No execute) │          │
│  └──────────────┘         └──────────────┘          │
│         │                                             │
│         │ Returns: Tool Call Plan                    │
│         └─────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐                                    │
│  │ Context      │                                    │
│  │ Assembly     │                                    │
│  │ (DB/Vector)  │                                    │
│  └──────────────┘                                    │
└───────────────────────────────────────────────────────┘
```

### 실행 플로우

```typescript
// ============================================
// Server: app/api/agent/route.ts
// ============================================
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage, stepCountIs } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // 프론트에서 보낸 컨텍스트 추출 (메시지 metadata에서)
  const firstUserMessage = messages.find(m => m.role === 'user');
  const frontendContext = firstUserMessage?.metadata || {};
  
  // 서버에서 추가 컨텍스트 조립
  const serverContext = await assembleServerContext(frontendContext);
  const fullContext = { ...frontendContext, ...serverContext };
  
  const result = streamText({
    model: openai('gpt-4o'),
    system: buildSystemPrompt(fullContext),
    messages: convertToModelMessages(messages),
    maxSteps: 10,
  tools: {
      // ⚠️ 핵심: execute 없음 (클라이언트에서 처리)
      addBlock: {
        description: '새 블럭을 캔버스에 생성합니다',
        inputSchema: z.object({
          blockType: z.enum(['markdown', 'code', 'image', 'shape']),
          content: z.any(),
          position: z.object({ x: z.number(), y: z.number() })
        })
        // execute 없음!
      },
      deleteBlock: {
        description: '블럭을 삭제합니다',
        inputSchema: z.object({ blockId: z.string() })
      },
      connectBlocks: {
        description: '두 블럭을 엣지로 연결합니다',
        inputSchema: z.object({
          sourceBlockId: z.string(),
          targetBlockId: z.string(),
          edgeType: z.string().optional(),
          label: z.string().optional()
        })
      },
      // ... 다른 툴들
    },
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}

// ============================================
// Client: app/canvas/components/ai-agent-runner.tsx
// ============================================
'use client';

import { useChat } from '@ai-sdk/react';
import { 
  DefaultChatTransport, 
  lastAssistantMessageIsCompleteWithToolCalls 
} from 'ai';
import { useBlockActions } from '@/hooks/use-block-actions';
import { useCanvasStore } from '@/stores/canvas-store';

export function AIAgentRunner() {
  const blockActions = useBlockActions();
  const canvasStore = useCanvasStore();
  
  const { messages, sendMessage, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
    }),
    
    // ✅ 모든 툴 결과가 준비되면 자동으로 다음 iteration 시작
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    
    // ✅ 클라이언트에서 툴 실행
    // ⚠️ 최신 API: experimental_onToolCall → onToolCall로 변경됨 (Vercel AI SDK 최신 버전)
    async onToolCall({ toolCall }) {
      // 동적 툴 체크 (TypeScript 타입 가드)
      if (toolCall.dynamic) {
        return;
      }
      
      try {
        switch (toolCall.toolName) {
          case 'addBlock': {
            // ✅ 기존 캔버스 액션 훅 사용!
            const block = await blockActions.addBlock({
              pageId: canvasStore.currentPageId,
              type: toolCall.input.blockType,
              content: toolCall.input.content,
              position: toolCall.input.position,
            });
            
            // ✅ addToolOutput으로 결과 추가 (await 없이 - 데드락 방지)
            addToolOutput({
              tool: 'addBlock',
              toolCallId: toolCall.toolCallId,
              output: { success: true, blockId: block.id },
            });
            break;
          }
          
          case 'deleteBlock': {
            await blockActions.deleteBlock(toolCall.input.blockId);
            
            addToolOutput({
              tool: 'deleteBlock',
              toolCallId: toolCall.toolCallId,
              output: { success: true },
            });
            break;
          }
          
          case 'connectBlocks': {
            const edge = await blockActions.connectBlocks({
              sourceId: toolCall.input.sourceBlockId,
              targetId: toolCall.input.targetBlockId,
              label: toolCall.input.label,
            });
            
            addToolOutput({
              tool: 'connectBlocks',
              toolCallId: toolCall.toolCallId,
              output: { success: true, edgeId: edge.id },
            });
            break;
          }
          
          // ... 다른 툴들
        }
      } catch (error) {
        // ✅ 에러 처리
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });
  
  // ✅ 메시지 전송 시 최신 컨텍스트 포함
  const handleSubmit = async (userMessage: string) => {
    const currentContext = {
      pageId: canvasStore.currentPageId,
      workspaceId: canvasStore.workspaceId,
      selectedBlockIds: canvasStore.selectedBlocks.map(b => b.id),
      viewport: {
        x: canvasStore.viewport.x,
        y: canvasStore.viewport.y,
        zoom: canvasStore.viewport.zoom,
      },
      visibleBlockIds: canvasStore.getVisibleBlockIds(),
    };
    
    // ✅ metadata로 컨텍스트 전달
    sendMessage({
      text: userMessage,
      metadata: currentContext,
    });
  };
  
  return (
    <div>
      <MessageList messages={messages} />
      <ChatInput onSubmit={handleSubmit} />
    </div>
  );
}
```

### Agent 시스템 프롬프트 (예시)

```
You are an AI Agent that helps users work on a canvas with blocks.

Your goal:
- Understand user intent from their utterance
- Use the provided context (memory, selected blocks, nearby blocks, semantic blocks)
- Call the appropriate tools to complete the task
- Work autonomously without asking for confirmation unless critical

Available tools:
- Canvas manipulation: addBlock, deleteBlock, connectBlocks, updateProperty, executeBlockAction
- Canvas search: searchByHop, searchByKeyword, searchBlockActions, searchMultimodal

Guidelines:
1. If a block is selected, prioritize working with that block
2. Use nearby/semantic blocks for additional context
3. Call tools in a logical order
4. Check tool results before proceeding
5. Finish when the task is complete or if you encounter an error

Context provided:
- Short-term memory: Recent 20 events
- Long-term memory: Semantically similar past events
- Selected blocks: {selectedBlocks}
- Nearby blocks: {nearbyBlocks}
- Semantic blocks: {semanticBlocks}

Now, please help the user with: {userUtterance}
```

---

## 실제 유스케이스 시나리오

### 🎯 시나리오 1: 코드 리팩터링

#### 사용자 액션
1. 코드 블럭 선택
2. "이 코드 리팩터해줘" 발화

#### Agent 실행

```
Step 1: Context 분석
- Selected Block: 코드 블럭 (Python 함수)
- Nearby Blocks: 관련 테스트 코드 블럭, 설명 마크다운
- Short-Term Memory: 최근 이 코드를 수정한 이력

Step 2: Agent 결정
→ executeBlockAction 툴 호출 필요

Step 3: Tool Call
executeBlockAction({
  blockId: 'block-123',
  action: 'refactor',
  params: { style: 'clean-code' }
})

Step 4: Result
- 리팩터된 코드 블럭 생성됨
- 원본 블럭과 엣지 연결

Step 5: Agent 완료
→ "Refactored the code and created a new block"
```

---

### 💪 시나리오 2: 유튜브 요약

#### 사용자 액션
1. 유튜브 블럭 선택
2. "이 영상 요약해줘" 발화

#### Agent 실행

```
Step 1: Context 분석
- Selected Block: 유튜브 블럭
- Semantic Blocks: 없음 (새로운 블럭)

Step 2: Agent 결정
→ executeBlockAction 툴 호출 (유튜브 스크립트 추출 + 요약)

Step 3: Tool Call 1
executeBlockAction({
  blockId: 'youtube-1',
  action: 'extract-transcript',
  params: { language: 'en' }
})
→ 스크립트 추출 완료

Step 4: Tool Call 2
executeBlockAction({
  blockId: 'youtube-1',
  action: 'summarize',
  params: { style: 'bullet-points' }
})
→ 요약 생성 중...

Step 5: Tool Call 3
addBlock({
  blockType: 'markdown',
  content: '## 영상 요약\n- 핵심 포인트 1\n- 핵심 포인트 2\n...',
  position: { x: youtube1.x + 400, y: youtube1.y }
})
→ 요약 블럭 생성

Step 6: Tool Call 4
connectBlocks({
  sourceBlockId: 'youtube-1',
  targetBlockId: 'new-summary-block',
  edgeType: 'summary',
  label: 'summary_of'
})
→ 엣지 연결

Step 7: Agent 완료
→ "Summarized the video and created a summary block"
```

---

### 🎨 시나리오 3: 이벤트 스토밍 → Aggregate 디자인

#### 사용자 액션
1. 이벤트 스토밍 플로우 블럭들 (5-10개) 멀티선택
2. "이 플로우를 바탕으로 aggregate 디자인해줘" 발화

#### Agent 실행

```
Step 1: Context 분석
- Selected Blocks: 5개 이벤트/커맨드/시스템 블럭
- Nearby Blocks: 엣지로 연결된 추가 블럭들
- Long-Term Memory: 과거 Aggregate 디자인 작업 패턴

Step 2: Agent 결정
→ 여러 블럭 생성 + 엣지 연결 필요

Step 3: Tool Call 1
addBlock({
  blockType: 'shape',
  content: {
    label: 'Order Aggregate',
    category: 'aggregate',
    style: { backgroundColor: '#FFE5CC' }
  },
  position: { x: 800, y: 200 }
})

Step 4: Tool Call 2-4
addBlock({ ... }) // Entity 블럭들 3개 생성

Step 5: Tool Call 5-8
connectBlocks({ ... }) // Aggregate와 Entity 연결

Step 6: Tool Call 9
addBlock({
  blockType: 'markdown',
  content: '## Order Aggregate\n**경계**: 주문과 관련된...',
  position: { x: 1100, y: 200 }
})

Step 7: Agent 완료
→ "Created Order Aggregate with 3 entities and documentation"
```

---

## 기술 스택 및 구현

### 1. Vercel AI SDK

```bash
npm install ai
```

**주요 기능**:
- `streamText()`: 스트리밍 응답 및 Agent Loop 자동 관리
- `useChat()`: React 훅으로 채팅 UI 구현 (`@ai-sdk/react`)
- `onToolCall`: 클라이언트에서 툴 실행 인터셉트
  - ⚠️ **최신 API**: `experimental_onToolCall` → `onToolCall`로 변경됨 (Vercel AI SDK 최신 버전)
  - 표준 API로 승격되어 더 이상 experimental이 아님
- `addToolOutput`: 클라이언트에서 툴 결과 추가
- `DefaultChatTransport`: 채팅 전송을 위한 transport 설정
- `toUIMessageStreamResponse()`: UI 메시지 스트림 응답 생성

**핵심 패턴**: Server Reasoning + Client Execution

**툴 타입**:
1. **서버 사이드 툴**: `execute` 함수가 있는 툴 (서버에서 자동 실행)
2. **클라이언트 사이드 자동 실행 툴**: `execute` 없고 `onToolCall`에서 처리
   - ⚠️ **최신 API**: `onToolCall` 사용 (더 이상 `experimental_onToolCall` 아님)
3. **사용자 상호작용 툴**: `execute` 없고 UI에서 사용자 확인 후 `addToolOutput` 호출

#### 서버 구현 (app/api/agent/route.ts)

```typescript
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // 프론트에서 보낸 컨텍스트 추출 (메시지 body에서)
  // 참고: 컨텍스트는 첫 번째 사용자 메시지의 metadata나 별도 필드로 전달 가능
  const firstUserMessage = messages.find(m => m.role === 'user');
  const frontendContext = firstUserMessage?.metadata || {};
  
  // 서버에서 추가 컨텍스트 조립
  const serverContext = await assembleServerContext(frontendContext);
  const fullContext = { ...frontendContext, ...serverContext };
  
  const result = streamText({
    model: openai('gpt-4o'),
    system: buildSystemPrompt(fullContext),
    messages: convertToModelMessages(messages),
    maxSteps: 10, // Agent loop 최대 횟수
  tools: {
      // ⚠️ 핵심: execute 없음 (클라이언트에서 처리)
      addBlock: {
        description: '새 블럭을 캔버스에 생성합니다',
        inputSchema: z.object({
          blockType: z.enum(['markdown', 'code', 'image', 'shape']),
        content: z.any(),
        position: z.object({ x: z.number(), y: z.number() })
        })
        // execute 없음!
      },
      deleteBlock: {
        description: '블럭을 삭제합니다',
        inputSchema: z.object({
          blockId: z.string()
        })
      },
      connectBlocks: {
        description: '두 블럭을 엣지로 연결합니다',
        inputSchema: z.object({
          sourceBlockId: z.string(),
          targetBlockId: z.string(),
          edgeType: z.string().optional(),
          label: z.string().optional()
        })
      },
      // ... 다른 툴들
    },
    stopWhen: stepCountIs(10), // 최대 10단계
  });

  return result.toUIMessageStreamResponse();
}
```

#### 클라이언트 구현 (app/canvas/components/ai-agent-runner.tsx)

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import { 
  DefaultChatTransport, 
  lastAssistantMessageIsCompleteWithToolCalls 
} from 'ai';
import { useBlockActions } from '@/hooks/use-block-actions';
import { useCanvasStore } from '@/stores/canvas-store';

export function AIAgentRunner() {
  const blockActions = useBlockActions();
  const canvasStore = useCanvasStore();
  
  const { messages, sendMessage, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
    }),
    
    // ✅ 모든 툴 결과가 준비되면 자동으로 다음 iteration 시작
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    
    // ✅ 핵심: 클라이언트에서 툴 실행
    // ⚠️ 최신 API: experimental_onToolCall → onToolCall로 변경됨 (Vercel AI SDK 최신 버전)
    async onToolCall({ toolCall }) {
      // 동적 툴 체크 (TypeScript 타입 가드)
      if (toolCall.dynamic) {
        return;
      }
      
      try {
        switch (toolCall.toolName) {
          case 'addBlock': {
            // ✅ 기존 캔버스 액션 훅 사용!
            const block = await blockActions.addBlock({
              pageId: canvasStore.currentPageId,
              type: toolCall.input.blockType,
              content: toolCall.input.content,
              position: toolCall.input.position,
            });
            
            // ✅ addToolOutput으로 결과 추가 (await 없이 - 데드락 방지)
            addToolOutput({
              tool: 'addBlock',
              toolCallId: toolCall.toolCallId,
              output: { success: true, blockId: block.id },
            });
            break;
          }
          
          case 'deleteBlock': {
            await blockActions.deleteBlock(toolCall.input.blockId);
            
            addToolOutput({
              tool: 'deleteBlock',
              toolCallId: toolCall.toolCallId,
              output: { success: true },
            });
            break;
          }
          
          case 'connectBlocks': {
            const edge = await blockActions.connectBlocks({
              sourceId: toolCall.input.sourceBlockId,
              targetId: toolCall.input.targetBlockId,
              label: toolCall.input.label,
            });
            
            addToolOutput({
              tool: 'connectBlocks',
              toolCallId: toolCall.toolCallId,
              output: { success: true, edgeId: edge.id },
            });
            break;
          }
          
          default:
            throw new Error(`Unknown tool: ${toolCall.toolName}`);
        }
      } catch (error) {
        // ✅ 에러 처리
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: 'output-error',
          errorText: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  });
  
  // ✅ 메시지 전송 시 최신 컨텍스트 포함
  const handleSubmit = async (userMessage: string) => {
    const currentContext = {
      pageId: canvasStore.currentPageId,
      workspaceId: canvasStore.workspaceId,
      selectedBlockIds: canvasStore.selectedBlocks.map(b => b.id),
      viewport: {
        x: canvasStore.viewport.x,
        y: canvasStore.viewport.y,
        zoom: canvasStore.viewport.zoom,
      },
      visibleBlockIds: canvasStore.getVisibleBlockIds(),
    };
    
    // ✅ metadata로 컨텍스트 전달
    sendMessage({ 
      text: userMessage,
      metadata: currentContext,
    });
  };
  
  return (
    <div className="ai-chat-panel">
      <MessageList messages={messages} />
      <ChatInput onSubmit={handleSubmit} />
    </div>
  );
}
```

#### 메시지 렌더링 (message.parts 사용)

```typescript
// 메시지 렌더링 예시
{messages?.map(message => (
  <div key={message.id}>
    <strong>{`${message.role}: `}</strong>
    {message.parts.map(part => {
      switch (part.type) {
        case 'text':
          return <div>{part.text}</div>;
        
        // 툴 파트 렌더링
        case 'tool-addBlock': {
          const callId = part.toolCallId;
          
          switch (part.state) {
            case 'input-streaming':
              return <div key={callId}>블럭 생성 중...</div>;
            
            case 'input-available':
              return (
                <div key={callId}>
                  {part.input.blockType} 블럭 생성 중...
                </div>
              );
            
            case 'output-available':
              return (
                <div key={callId}>
                  ✅ 블럭 생성 완료: {part.output.blockId}
                </div>
              );
            
            case 'output-error':
              return (
                <div key={callId}>
                  ❌ 에러: {part.errorText}
                </div>
              );
          }
          break;
        }
        
        case 'tool-deleteBlock':
        case 'tool-connectBlocks':
          // 유사한 패턴으로 렌더링
          break;
        
        // 단계 구분선
        case 'step-start':
          return <hr className="my-2 border-gray-300" />;
      }
    })}
  </div>
))}
```

**이 방식의 장점**:
- ✅ **상태 동기화 간단**: 캔버스 상태와 툴 실행이 같은 곳 (프론트)
- ✅ **코드 재사용**: 기존 `useBlockActions` 등 훅 그대로 사용
- ✅ **보안**: 각 액션 API에서 권한 체크 가능
- ✅ **실시간성**: Optimistic update 가능
- ✅ **Agent Loop**: Vercel AI SDK가 자동 관리 (maxSteps)
- ✅ **LLM Context**: 툴 실행 결과가 다음 reasoning에 반영

---

### 2. Vector Database (pgvector)

```sql
-- 임베딩 저장 테이블
CREATE TABLE event_embeddings (
  id UUID PRIMARY KEY,
  page_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL
);

-- 벡터 인덱스
CREATE INDEX ON event_embeddings USING ivfflat (embedding vector_cosine_ops);

-- 시맨틱 검색 쿼리
SELECT 
  id, 
  content,
  1 - (embedding <=> query_embedding) AS similarity,
  exp(-EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 86400)) AS time_weight,
  (1 - (embedding <=> query_embedding)) * exp(-EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 86400)) AS final_score
FROM event_embeddings
WHERE page_id = $1
ORDER BY final_score DESC
LIMIT 10;
```

---

### 3. Event Store (통합 이벤트 로그)

```typescript
interface Event {
  id: string;
  page_id: string;
  user_id: string;
  event_type: 'utterance' | 'tool_call' | 'block_created' | 'block_updated' | ...;
  payload: any;
  timestamp: Date;
  embedding?: number[]; // 임베딩 (선택적)
}

// 이벤트 저장
async function logEvent(event: Event) {
  await db.insert('events', event);
  
  // 임베딩 생성 (비동기)
  if (shouldEmbed(event)) {
    const embedding = await generateEmbedding(event.payload);
    await db.update('events', { id: event.id }, { embedding });
  }
}

// 숏텀 메모리 조회
async function getShortTermMemory(pageId: string, limit: number) {
  return await db.query(
    'SELECT * FROM events WHERE page_id = $1 ORDER BY timestamp DESC LIMIT $2',
    [pageId, limit]
  );
}

// 롱텀 메모리 시맨틱 검색
async function getLongTermMemory(query: string, pageId: string, limit: number) {
  const queryEmbedding = await generateEmbedding(query);
  return await vectorSearch(queryEmbedding, pageId, limit);
}
```

---

## 검토 포인트

### 1. Agent Loop 제어

#### 문제
- Agent가 무한 루프에 빠질 위험
- 불필요한 툴 호출 반복
- LLM 비용 증가

#### 해결
- **최대 루프 횟수 제한**: 10회
- **타임아웃 설정**: 30초
- **명시적 종료 조건**: 시스템 프롬프트에 "작업 완료 시 명시적으로 종료" 지시
- **중간 체크포인트**: 5회마다 "계속 진행할까요?" 확인

---

### 2. Tool Execution 실패 처리

#### 문제
- 툴 실행 실패 시 Agent가 혼란
- 부분 완료 상태 방치

#### 해결
- **명확한 에러 메시지**: 툴 실패 시 구체적 이유 반환
- **재시도 로직**: 네트워크 에러 등은 자동 재시도
- **Undo 제안**: 실패 시 이전 상태로 복구 옵션 제공
- **사용자 안내**: 치명적 실패 시 사용자에게 알림

---

### 3. Context Assembly 성능

#### 문제
- 컨텍스트 수집이 1초 이상 걸릴 경우 체감 품질 저하

#### 해결
- **선택 블럭 우선 수집**: 즉시 Agent에게 전달
- **주변 블럭 비동기**: 백그라운드에서 수집
- **의미적 블럭 캐싱**: 페이지 임베딩 사전 계산
- **컨텍스트 압축**: 불필요한 정보 제거

---

### 4. LLM 비용 최적화

#### 문제
- Agent 루프마다 LLM 호출 = 비용 증가

#### 해결
- **컨텍스트 압축**: 중요한 정보만 전달
- **간단한 작업 규칙 기반 처리**: "블럭 삭제" 같은 단순 작업은 LLM 호출 없이 처리
- **캐싱**: 동일 발화는 캐시 응답 사용
- **모델 선택**: 간단한 작업은 경량 모델 사용

---

### 5. 사용자 피드백 수집

#### 문제
- Agent가 자율 실행하면 사용자가 중간 과정을 평가하기 어려움

#### 해결
- **실행 후 요약 제공**: "3개 블럭 생성, 2개 엣지 연결했어요"
- **피드백 UI**: 👍/👎 버튼 + "잘못된 부분 알려주기"
- **Undo 지원**: 잘못된 작업 즉시 되돌리기
- **주요 액션 하이라이트**: 생성/수정된 블럭 강조

---

### 6. Tool Execution 에러 처리 및 Undo

#### 문제
- `onToolCall`에서 툴 실행 실패 시 Agent loop가 중단될 수 있음
- 부분 완료 상태에서 롤백 필요

#### 해결
- **명확한 에러 메시지**: 툴 실패 시 `addToolOutput`에 `state: 'output-error'`와 `errorText` 사용
- **Snapshot 기반 Undo**: 툴 실행 전 상태 저장
  ```typescript
  async onToolCall({ toolCall }) {
    if (toolCall.dynamic) return;
    
    const snapshot = canvasStore.createSnapshot();
    
    try {
      const result = await executeToolOnCanvas(toolCall);
      
      addToolOutput({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        output: result,
      });
    } catch (error) {
      // ❌ 실패 시 롤백
      canvasStore.restoreSnapshot(snapshot);
      
      addToolOutput({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        state: 'output-error',
        errorText: error.message,
      });
    }
  }
  ```
- **재시도 로직**: 네트워크 에러 등은 자동 재시도
- **사용자 안내**: 치명적 실패 시 사용자에게 알림

---

### 7. Context Assembly 성능 최적화

#### 문제
- 컨텍스트 수집이 1초 이상 걸릴 경우 체감 품질 저하
- LLM 토큰 비용 증가

#### 해결
- **선택 블럭 우선 수집**: 즉시 Agent에게 전달
- **주변 블럭 비동기**: 백그라운드에서 수집
- **의미적 블럭 캐싱**: 페이지 임베딩 사전 계산
- **컨텍스트 압축**: 불필요한 정보 제거
- **점진적 로딩**: 필수 컨텍스트만 먼저, 나머지는 필요시 search tool로

---

## 다음 단계

### Phase 1: MVP (2-3주)

#### 목표
Vercel AI Agent 기본 기능 구현 및 테스트

#### 작업 항목
- [x] Event Storming 완료
- [x] 아키텍처 결정 (Server Reasoning + Client Execution)
- [x] 컨텍스트 전달 전략 설계
- [ ] Vercel AI SDK 설정 (`ai` 패키지 설치)
- [ ] 서버 API Route 구현 (`app/api/agent/route.ts`)
  - [ ] `streamText` 설정 (`convertToModelMessages` 사용)
  - [ ] 툴 스키마 정의 (`inputSchema` 사용, execute 없이)
  - [ ] `toUIMessageStreamResponse()` 사용
  - [ ] 컨텍스트 조립 로직 (`assembleServerContext`, `metadata`에서 추출)
  - [ ] System Prompt 빌더
  - [ ] `stopWhen` 설정 (`stepCountIs` 사용)
- [ ] 클라이언트 Agent Runner 구현 (`app/canvas/components/ai-agent-runner.tsx`)
  - [ ] `useChat` 훅 설정 (`@ai-sdk/react`)
  - [ ] `DefaultChatTransport` 설정
  - [ ] `onToolCall` 구현 및 `addToolOutput` 사용
    - ⚠️ **최신 API**: `experimental_onToolCall` → `onToolCall`로 변경됨 (표준 API)
  - [ ] `sendAutomaticallyWhen` 설정 (`lastAssistantMessageIsCompleteWithToolCalls`)
  - [ ] 컨텍스트 수집 및 전달 (`metadata` 사용)
  - [ ] 메시지 렌더링 (`message.parts` 사용)
- [ ] 기본 툴 5개 구현 (addBlock, deleteBlock, updateProperty, connectBlocks, executeBlockAction)
- [ ] 단순 컨텍스트 조립 (선택 블럭 + 주변 블럭)
- [ ] Event Store 구축
- [ ] Agent 시스템 프롬프트 작성
- [ ] 기본 UI (발화 입력, 실행 상태 표시)

#### 성공 기준
- [ ] 사용자가 발화 입력 → Agent가 블럭 생성/수정 성공
- [ ] 툴 호출 로깅 정상 작동
- [ ] 평균 응답 시간 < 5초

---

### Phase 2: Context & Memory (4-6주)

#### 목표
컨텍스트 고도화 및 메모리 시스템 구축

#### 작업 항목
- [ ] pgvector 설정 및 임베딩 저장
- [ ] Short-Term Memory 구현
- [ ] Long-Term Memory 시맨틱 검색 구현
- [ ] 의미적 블럭 수집 (시맨틱 유사도)
- [ ] 검색 툴 4개 구현 (searchByHop, searchByKeyword, searchBlockActions, searchMultimodal)
- [ ] Context 시각화 UI

#### 성공 기준
- [ ] 과거 작업 패턴을 활용한 작업 성공
- [ ] 시맨틱 검색 정확도 > 70%
- [ ] 컨텍스트 조립 시간 < 2초

---

### Phase 3: Advanced Features (8주+)

#### 목표
고급 기능 및 최적화

#### 작업 항목
- [ ] Agent Loop 최적화 (조기 종료, 재시도 로직)
- [ ] 사용자 피드백 루프 (학습 데이터 수집)
- [ ] 개인화된 컨텍스트 가중치
- [ ] Multi-Agent 협업 (복잡한 작업 분담)
- [ ] 음성 인터페이스
- [ ] 워크플로우 전환 (반복 작업 자동화)

#### 성공 기준
- [ ] Agent 성공률 > 85%
- [ ] 사용자 만족도 > 4.0/5.0
- [ ] 평균 LLM 비용 < $0.10/세션

---

## 관련 문서

- [Event Storming: AI Management Domain](../../domains/ai-management-domain/01-event-storm.md)
- [Block Management Domain](../../domains/block-management-domain/)
- [Canvas Management Domain](../../domains/canvas-management-domain/)

---

**최종 업데이트**: 2025-11-12  
**작성자**: AI 기능 설계 팀  
**주요 변경사항**:
- 아키텍처 결정: Server Reasoning + Client Execution (하이브리드 방식)
- Vercel AI SDK 최신 API 반영:
  - ⚠️ **API 변경**: `experimental_onToolCall` → `onToolCall`로 변경됨 (표준 API로 승격)
  - `onToolCall` 및 `addToolOutput`을 활용한 클라이언트 툴 실행 패턴 확정
  - `DefaultChatTransport` 및 `sendAutomaticallyWhen` 사용
  - `toUIMessageStreamResponse()` 및 `convertToModelMessages` 사용
  - `message.parts`를 사용한 메시지 렌더링 패턴
- 컨텍스트 전달 전략 설계 (Client Context + Server Context, `metadata` 사용)
- 툴 스키마 정의 방식 변경 (`inputSchema` 사용)

**다음 리뷰**: Phase 1 완료 후
