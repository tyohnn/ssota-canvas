# AI Visual Summary - 기획서

## 0. 한 줄 요약

유튜브 블록의 요약 텍스트를 LLM(Grok)이 **템플릿 규칙(자연어)**에 따라 **Canvasdown DSL**로 생성하고, 이를 기존 캔버스에 노드/엣지로 렌더링하여 **구조화된 시각적 요약**을 제공한다.

---

## 1. 목적

### 1.1 문제

텍스트 요약만으로는:
- 구조(논리/프레임워크/개념 관계)가 드러나지 않음
- 다른 영상/노트와의 연결이 어려움
- 인사이트/행동으로 이어지기 어려움

### 1.2 목표

Visual Summary는 요약을 **2D 캔버스에서 "구조화 + 시각화 + 연결 가능"**하게 만든다.

**핵심 산출물:**
- **Overview**: 한 화면에서 핵심 논지/뼈대
- **Structure**: 주장-근거 / 프로세스 / 프레임워크 / 개념망
- **Connections**: 개념 노드 + 의미 엣지
- **Action**: 체크리스트 + 질문

### 1.3 범위

- **1차 범위**: YouTube 블록
- **향후 확장**: Link 블록, PDF 블록 등 (별도 도메인으로 분리된 이유)

---

## 2. 핵심 아키텍처

### 2.1 Canvasdown 통합

[Canvasdown](https://github.com/ssota-labs/canvasdown)은 "LLM이 캔버스를 생성/수정하는 표준 출력 포맷"이다.

**설치:**
```bash
npm install @ssota-labs/canvasdown @ssota-labs/canvasdown-reactflow
```

**통합 방식:**
1. SSOTA 블록 타입을 Canvasdown에 등록 (shape, markdown, group)
2. LLM이 템플릿 규칙을 읽고 Canvasdown DSL 출력
3. DSL을 파싱하여 React Flow 노드/엣지로 변환
4. 기존 캔버스에 노드 추가 (위치 자동 계산)

### 2.2 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Visual Summary Flow                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   YouTube    │    │   Template   │    │     LLM      │    │  Canvasdown  │
│    Block     │───▶│   Selection  │───▶│    (Grok)    │───▶│    Parser    │
│  (Summary)   │    │   Popover    │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Canvas     │◀───│   Position   │◀───│  React Flow  │◀───│   DSL →      │
│   Render     │    │   Calculator │    │   Nodes/     │    │   Nodes/     │
│              │    │              │    │   Edges      │    │   Edges      │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 2.3 기존 Smart Summary와의 관계

| 항목 | Smart Summary (기존) | Visual Summary (신규) |
|------|---------------------|----------------------|
| 출력 | 텍스트 (Markdown) | 캔버스 노드/엣지 |
| 위치 | Editor Panel 내 탭 | 캔버스에 직접 렌더링 |
| 목적 | 읽기용 요약 | 구조화/연결 가능한 요약 |
| **대체 관계** | - | Smart Summary를 대체 |

---

## 3. 노드 타입

### 3.1 기존 노드 타입 활용

| 노드 타입 | 용도 | 기존 여부 |
|----------|------|----------|
| `shape` | 개념/주장/프레임워크 요소 (짧은 텍스트, 시각적 구분) | ✅ 있음 |
| `markdown` | 긴 텍스트 (요약 단락/챕터/근거/체크리스트/질문) | ✅ 있음 |
| `group` | 영역 컨테이너 (Overview/Timeline/Concepts/Synthesis) | ❌ **신규 구현** |

### 3.2 Shape 노드 속성 매핑

기존 `ShapeType` enum 활용:

| 의미 역할 | shapeType | color | 예시 |
|----------|-----------|-------|------|
| Thesis (핵심 주장) | `ELLIPSE` | `BLUE` | 중심 개념 |
| Concept (개념) | `HEXAGON` | `PURPLE` | 용어/개념 노드 |
| Claim (주장) | `RECTANGLE` | `GREEN` | 논증 요소 |
| Evidence (근거) | `RECTANGLE` (dashed) | `GRAY` | 지지 근거 |
| Framework (프레임워크) | `ELLIPSE` | `ORANGE` | 모델 요소 |
| Tradeoff/Risk | `DIAMOND` | `RED` | 경고/트레이드오프 |
| Insight | `ELLIPSE` | `AMBER` | 인사이트 |

### 3.3 Shape 노드 Content 활용

Shape 노드는 **Note View**를 통해 `content` (TipTap JSON)를 담을 수 있음. Visual Summary에서 이를 적극 활용:

**데이터 구조:**
```typescript
interface ShapeBlockNodeData {
  title: string;              // Shape 내부에 표시되는 짧은 텍스트
  properties: {
    shapeType: ShapeType;
    color: ColorToken;
    borderStyle: BorderStyle;
  };
  content?: TipTapJSON;       // Note View에서 표시되는 상세 내용
}
```

**활용 방식:**
- `title`: Shape 안에 표시될 짧은 라벨 (예: "인지 부조화")
- `content`: Note View에서 볼 수 있는 상세 설명 (예: "기존 신념과 새로운 정보가 충돌할 때 발생하는 심리적 불편함...")

**LLM 생성 시:**
```
Phase A (Skeleton): title만 설정 (빈 content)
Phase B (Content Fill): @update로 content 추가

예시 Patch DSL:
@update c_01 { 
  title: "인지 부조화"
  content: "기존 신념과 새로운 정보가 충돌할 때 발생하는 심리적 불편함. 페스팅거(1957)가 제안한 개념으로..."
}
```

이를 통해 Shape 노드는 "한눈에 보는 라벨 + 클릭 시 상세 정보"의 2계층 구조를 가짐.

### 3.4 Group 노드 (신규 구현)

**참조:** [React Flow Sub Flows](https://reactflow.dev/examples/grouping/sub-flows), [Parent-Child Relation](https://reactflow.dev/examples/grouping/parent-child-relation)

**핵심 기능:**
1. **그룹 컨테이너**: 자식 노드를 포함하는 시각적 경계
2. **Parent-Child 관계**: `parentId`, `extent: 'parent'` 활용
3. **그룹 핸들**: 그룹 노드에도 연결 핸들 제공
4. **Detach 기능**: 자식 노드를 그룹에서 분리
5. **Drag Collision**: 드래그 시 그룹에 자동 포함

**데이터 구조 (기존 blocks/block_mounts와 동일):**

```typescript
// BlockType enum에 추가
export enum BlockType {
  // ... 기존 타입들
  GROUP = 'group',
}

// Group 노드 Properties
interface GroupBlockProperties {
  title: string;
  layoutHint: 'stack' | 'grid' | 'free';
  color: ColorToken;
  collapsed?: boolean; // 접기/펼치기 (향후)
}

// React Flow Node 구조
interface GroupNode {
  id: string;
  type: 'group';
  position: { x: number; y: number };
  style: { width: number; height: number };
  data: GroupBlockNodeData;
}

// 자식 노드 구조
interface ChildNode {
  id: string;
  type: 'shape' | 'markdown';
  position: { x: number; y: number }; // 부모 기준 상대 좌표
  parentId: string; // 그룹 노드 ID
  extent: 'parent'; // 부모 영역 내 제한
  data: BaseNodeData;
}
```

---

## 4. 엣지 (Edge)

### 4.1 기존 Edge 구조 활용

현재 Edge 엔티티 속성:
- `edgeShape`: default, straight, step, smoothstep, simplebezier
- `edgeLabel`: 자유 텍스트
- `edgeStyle`: stroke color, strokeWidth
- `markerEnd`: 화살표 마커 (React Flow 지원)

### 4.2 화살표 (Arrow Marker)

React Flow의 `markerEnd` 속성을 활용하여 방향성 표시:

```typescript
// React Flow Edge 구조
interface EdgeWithMarker {
  id: string;
  source: string;
  target: string;
  markerEnd: {
    type: MarkerType.ArrowClosed;  // 채워진 화살표
    width: number;
    height: number;
    color?: string;  // edgeStyle.stroke와 동일하게
  };
}
```

**Canvasdown DSL에서 화살표 표현:**
```
// 기본 화살표 (→)
source -> target : "label"

// 양방향 화살표 (↔) - 향후 지원
source <-> target : "label"
```

**Visual Summary에서 화살표 사용:**
- 모든 엣지에 기본적으로 `markerEnd` 화살표 적용
- 관계의 방향성을 명확하게 시각화 (예: 근거 → 주장)

### 4.3 의미 관계 표현

별도의 custom edge type을 정의하지 않고, **템플릿 텍스트로 LLM에게 전달**하여 `edgeLabel`, `edgeStyle`, `markerEnd`로 의미 표현:

| 관계 타입 | edgeLabel | edgeStyle | arrow | 예시 |
|----------|-----------|-----------|-------|------|
| supports | "supports" | solid, gray | → | 근거 → 주장 |
| explains | "explains" | solid, blue | → | 설명 관계 |
| example_of | "example" | dashed, green | → | 예시 관계 |
| leads_to | "leads to" | solid, blue | → | 인과 관계 |
| part_of | "part of" | solid, purple | → | 구성 관계 |
| contrasts | "contrasts" | dotted, orange | ↔ | 대비 관계 (양방향) |
| tradeoff | "tradeoff" | dotted, red | ↔ | 트레이드오프 (양방향) |
| step | "→" | solid, gray | → | 순서/단계 |

**템플릿에서 정의 예시:**
```
Edge Rules:
- supports: label="supports", style=solid, color=gray, arrow=end
- explains: label="explains", style=solid, color=blue, arrow=end
- contrasts: label="contrasts", style=dotted, color=orange, arrow=both
- All edges have arrow markers by default (markerEnd: ArrowClosed)
```

---

## 5. 템플릿 시스템

### 5.1 템플릿 5종

#### Template 1) Lecture Map (Default)

**목표**: 강연/팟캐스트의 흐름+개념을 동시에 정리

**Layout**: `canvas TB` (Top to Bottom) - 전체 흐름을 위에서 아래로

**Zones (Groups):**
| Zone | Layout | 설명 |
|------|--------|------|
| Overview | TB | 핵심 논지 (상단) |
| Timeline | LR | 챕터/흐름 (좌→우 타임라인) |
| Concept Graph | TB | 개념 관계망 (중앙) |
| Synthesis | TB | 액션/질문 (하단) |

**Slots:**
- Thesis (1): shape, ELLIPSE, BLUE, content="핵심 주장 텍스트"
- Chapters (1): markdown, content="## 챕터별 요약"
- Concepts (8-15): shape, HEXAGON, PURPLE, content="개념명 + 간단 설명"
- Actions (1): markdown, content="- [ ] 액션 아이템"
- Questions (1): markdown, content="- 열린 질문들"

---

#### Template 2) Argument Map

**목표**: Thesis → Claims → Evidence (논증 구조)

**Layout**: `canvas TB` (Top to Bottom) - 논증 계층을 위에서 아래로

**Zones:**
| Zone | Layout | 설명 |
|------|--------|------|
| Thesis | TB | 중심 주장 (최상단) |
| Claims | LR | 하위 주장들 (가로 배열) |
| Evidence | TB | 근거들 (각 Claim 아래) |
| Actions | TB | 실행 항목 (하단) |

**Slots:**
- Thesis (1): shape, ELLIPSE, BLUE, content="메인 주장"
- Claims (3-7): shape, RECTANGLE, GREEN, content="주장 요약"
- Evidence (각 claim당 1-3): shape, RECTANGLE (dashed), GRAY, content="근거 설명"
- Counterpoint (optional): shape, DIAMOND, RED, content="반론/한계"
- Actions (1): markdown, content="실행 계획"

---

#### Template 3) Framework Canvas

**목표**: 모델/프레임워크를 중앙에 두고 주변에 정의·사례·리스크·행동 배치

**Layout**: `canvas TB` - 프레임워크를 중앙에 배치

**Zones:**
| Zone | Layout | 설명 |
|------|--------|------|
| Framework Core | LR | 프레임워크 구성요소 (가로 배열) |
| Definitions | TB | 정의/설명 (좌측) |
| Examples | TB | 사례들 (우측) |
| Risks | LR | 리스크/트레이드오프 (하단 좌) |
| Actions | TB | 실행 항목 (하단 우) |

**Slots:**
- Framework parts (4-12): shape, ELLIPSE/RECTANGLE, ORANGE, content="구성요소명 + 역할"
- Definitions (2-5): markdown, content="용어 정의"
- Examples (1-3): markdown, content="구체적 사례"
- Tradeoff/Risk: shape, DIAMOND, RED, content="주의사항"
- Actions/Questions: markdown, content="적용 방법"

---

#### Template 4) Concept Graph

**목표**: 용어/개념 관계망 (정의/관계 중심)

**Layout**: `canvas LR` (Left to Right) - 관계망을 자유롭게 펼침

**Zones:**
| Zone | Layout | 설명 |
|------|--------|------|
| Glossary | TB | 핵심 개념 (좌측) |
| Relations | LR | 관계 네트워크 (중앙, 자유 배치) |
| Notes | TB | 부가 설명 (우측) |

**Slots:**
- Concepts (10-20): shape, HEXAGON, PURPLE, content="개념명: 한줄 정의"
- Edges (15-40): explains, relates_to, part_of
- Notes (2-6): markdown, content="추가 컨텍스트"

---

#### Template 5) Synthesis Board

**목표**: 정보 조각을 클러스터링해 인사이트/행동으로 승화

**Layout**: `canvas LR` (Left to Right) - 수집→클러스터→인사이트 흐름

**Zones:**
| Zone | Layout | 설명 |
|------|--------|------|
| Nuggets | grid | 정보 조각들 (좌측, 그리드 배열) |
| Clusters | TB | 테마별 그룹 (중앙) |
| Insights | TB | 도출된 인사이트 (우측 상단) |
| Actions | TB | 실행 항목 (우측 하단) |

**Slots:**
- Nuggets (8-20): small markdown, content="핵심 정보 조각"
- Cluster groups (3-7): group, title="테마명"
- Insights (3-7): shape, ELLIPSE, AMBER, content="인사이트 문장"
- Actions/Questions: markdown, content="다음 단계"

---

### 5.2 템플릿 저장 위치

```
apps/web/src/domains/ai-visual-summary/
├── templates/
│   ├── index.ts                    # 템플릿 export
│   ├── lecture-map.template.ts     # Lecture Map 템플릿 spec
│   ├── argument-map.template.ts    # Argument Map 템플릿 spec
│   ├── framework-canvas.template.ts
│   ├── concept-graph.template.ts
│   └── synthesis-board.template.ts
└── shared/
    └── types/
        └── template.types.ts       # 템플릿 타입 정의
```

**템플릿 구조:**
```typescript
interface VisualTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  // LLM에게 전달할 자연어 규칙
  promptSpec: string;
  
  // 제한값
  limits: {
    maxConcepts: number;
    maxEdges: number;
    maxMarkdownChars: number;
  };
}
```

---

## 6. LLM 실행 방식

### 6.1 모델 선택

**Grok 4.1 Fast Reasoning** 사용:
- 2M 토큰 컨텍스트 윈도우
- 저렴한 비용 ($0.20/M input, $0.50/M output)
- reasoning 지원으로 복잡한 구조 생성에 적합

### 6.2 Agent Loop (프롬프트 기반)

별도의 프로그래매틱 phase 분리 없이, **프롬프트로 정의하여 LLM이 자율적으로 수행**:

```
=== EXECUTION PHASES ===

You will generate the visual summary in two phases:

**Phase A - Skeleton:**
1. Create all group nodes (zones) first
2. Create placeholder nodes for each slot (thesis, concepts, etc.)
3. Create basic structural edges (relates_to, step)
4. Output: Complete Canvasdown DSL

**Phase B - Content Fill:**
1. Fill in thesis/chapters content
2. Fill in concept labels from the transcript
3. Add evidence/examples/notes
4. Refine edge types (relates_to → supports/explains/etc.)
5. Output: Canvasdown Patch DSL

You must complete both phases in a single response.
First output the Skeleton DSL, then output the Content Patch DSL.
```

### 6.3 스트리밍 구현

**기존 패턴 참조**: `ai-management/frontend/components/ai-agent-runner/core/use-ai-agent.business.ts`

Vercel AI SDK의 `useChat` 훅을 활용한 클라이언트-서버 스트리밍 패턴 사용:

#### 6.3.1 서버 API Route

```typescript
// app/api/visual-summary/route.ts
import { streamText } from 'ai';
import { createHeliconeXAI, buildHeliconeHeaders } from '@/domains/ai-management/backend/providers/helicone-provider';

export async function POST(req: Request) {
  const { summary, templateId, templateSpec } = await req.json();

  const headers = buildHeliconeHeaders({
    sessionName: 'visual-summary',
    sessionPath: '/visual-summary',
    promptId: `visual-summary-${templateId}`,
  });

  const xai = createHeliconeXAI(headers);

  const result = streamText({
    model: xai('grok-4-1-fast-reasoning'),
    system: buildVisualSummarySystemPrompt(templateSpec),
    prompt: buildVisualSummaryUserPrompt(summary),
  });

  return result.toUIMessageStreamResponse();
}
```

#### 6.3.2 클라이언트 훅

```typescript
// domains/ai-visual-summary/frontend/hooks/use-visual-summary.ts
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useMemo, useCallback } from 'react';

interface UseVisualSummaryReturn {
  messages: UIMessage[];
  generateVisualSummary: (summary: string, templateId: string) => void;
  isGenerating: boolean;
  error: Error | null;
}

export function useVisualSummary(props: {
  pageId: string;
  youtubeBlockId: string;
  onDslChunk?: (chunk: string) => void;  // DSL 청크 콜백
}): UseVisualSummaryReturn {
  
  const chatTransport = useMemo(
    () => new DefaultChatTransport({ api: '/api/visual-summary' }),
    []
  );

  const {
    messages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport: chatTransport,
    
    // 스트리밍 청크 처리
    onMessage: (message) => {
      if (message.role === 'assistant' && message.content) {
        // DSL 청크를 캔버스 렌더러에 전달
        props.onDslChunk?.(message.content);
      }
    },
    
    onError: (error) => {
      console.error('[useVisualSummary] Error:', error);
    },
  });

  const generateVisualSummary = useCallback(
    (summary: string, templateId: string) => {
      sendMessage({
        text: summary,
        metadata: {
          templateId,
          pageId: props.pageId,
          youtubeBlockId: props.youtubeBlockId,
        },
      });
    },
    [sendMessage, props.pageId, props.youtubeBlockId]
  );

  return {
    messages,
    generateVisualSummary,
    isGenerating: status === 'submitted' || status === 'streaming',
    error: error || null,
  };
}
```

#### 6.3.3 스트리밍 렌더링 전략

1. **청크 수집**: `onMessage` 콜백으로 DSL 텍스트 누적
2. **부분 파싱**: 완성된 노드/엣지 단위로 파싱 시도
3. **점진적 렌더링**: 파싱 성공한 요소만 캔버스에 추가
4. **UX 흐름**:
   - Skeleton 노드가 먼저 나타남 (빈 라벨)
   - Content Patch로 라벨/내용이 채워짐
   - 실시간으로 캔버스가 구축되는 시각적 피드백

### 6.4 에러 처리

**LLM Agent에게 위임:**
- 프롬프트에 에러 처리 지침 포함
- Parse 실패 시 LLM이 자체 수정 시도
- 최종 실패 시 단순 markdown 노드로 fallback

```
=== ERROR HANDLING ===

If the DSL you generate fails to parse:
1. Review the error message
2. Fix the syntax issue
3. Re-output the corrected DSL

If you cannot generate a valid structured summary:
1. Create a single markdown node with the key points
2. This is the fallback option
```

---

## 7. 캔버스 배치 로직

### 7.1 위치 자동 계산

Visual Summary 노드를 **기존 YouTube 블록 옆에 배치**:

```typescript
interface PositionCalculator {
  /**
   * YouTube 블록 기준으로 Visual Summary 시작 위치 계산
   * 
   * @param youtubeBlockPosition - YouTube 블록의 현재 위치
   * @param youtubeBlockSize - YouTube 블록의 크기
   * @param existingNodes - 캔버스의 기존 노드들 (충돌 방지)
   * @returns Visual Summary 루트 위치
   */
  calculateStartPosition(
    youtubeBlockPosition: { x: number; y: number },
    youtubeBlockSize: { width: number; height: number },
    existingNodes: Node[]
  ): { x: number; y: number };
}
```

**배치 전략:**
1. YouTube 블록의 **오른쪽**에 배치 (기본)
2. 오른쪽에 공간이 부족하면 **아래쪽**에 배치
3. 기존 노드와 충돌 시 **자동으로 오프셋 조정**

### 7.2 Canvasdown Layout

Canvasdown의 dagre 레이아웃 활용:
```
canvas LR  // Left to Right 방향
```

시작 위치만 계산하고, 내부 노드 배치는 dagre가 처리.

---

## 8. UX 흐름

### 8.1 액션 아이템 버튼 → Popover → 템플릿 선택

```
┌─────────────────────────────────────────────────────────────┐
│  YouTube Block Action Items                                  │
│  ┌─────┐ ┌─────┐ ┌─────────────────┐                        │
│  │ 📋  │ │ 🔗  │ │ ✨ Visual Summary│ ← 클릭                │
│  └─────┘ └─────┘ └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌───────────────────────┐
              │   Select Template     │
              ├───────────────────────┤
              │ ○ Lecture Map         │ ← Default
              │ ○ Argument Map        │
              │ ○ Framework Canvas    │
              │ ○ Concept Graph       │
              │ ○ Synthesis Board     │
              ├───────────────────────┤
              │      [Generate]       │
              └───────────────────────┘
```

### 8.2 생성 중 UI

1. **Loading State**: 스피너 + "Generating visual summary..."
2. **Skeleton First**: 그룹/슬롯 구조가 먼저 나타남
3. **Content Fill**: 내용이 점진적으로 채워짐 (스트리밍)
4. **Complete**: 완료 토스트 + 캔버스 자동 포커스

### 8.3 후속 액션 (향후)

- Expand section: 특정 그룹 디테일 추가
- Refine relationships: 엣지 정교화
- Compress: 더 짧게
- Add more concepts: 개념 추가

---

## 9. 파일 구조

```
apps/web/src/domains/ai-visual-summary/
├── docs/
│   ├── plan.md                 # 이 문서
│   ├── draft-plan.md           # 초안 (참고용)
│   ├── canvasdown.md           # Canvasdown 문서
│   └── visualiz-method.md      # 템플릿 방법론
│
├── frontend/
│   ├── components/
│   │   ├── visual-summary-action/      # Action Item 버튼
│   │   │   ├── index.tsx
│   │   │   ├── template-picker.tsx     # 템플릿 선택 Popover
│   │   │   └── use-visual-summary.ts   # 비즈니스 훅
│   │   │
│   │   └── group-node/                 # Group 노드 컴포넌트
│   │       ├── index.tsx
│   │       ├── group-node.view.tsx
│   │       └── core/
│   │           └── use-group-node.ts
│   │
│   └── hooks/
│       ├── use-canvasdown-integration.ts  # Canvasdown 통합 훅
│       └── use-position-calculator.ts     # 위치 계산 훅
│
├── backend/
│   └── services/
│       ├── generate-visual-summary.service.ts  # LLM 호출
│       └── canvasdown-registry.service.ts      # 블록 타입 등록
│
├── templates/
│   ├── index.ts
│   ├── lecture-map.template.ts
│   ├── argument-map.template.ts
│   ├── framework-canvas.template.ts
│   ├── concept-graph.template.ts
│   └── synthesis-board.template.ts
│
└── shared/
    └── types/
        ├── template.types.ts
        └── visual-summary.types.ts
```

---

## 10. 구현 단계

### Phase 1: 기반 구축
1. [ ] Canvasdown 패키지 설치 및 통합
2. [ ] SSOTA 블록 타입 Canvasdown 등록 (shape, markdown)
3. [ ] Group 노드 구현 (BlockType.GROUP 추가)
4. [ ] 위치 자동 계산 로직 구현

### Phase 2: 템플릿 시스템
5. [ ] 템플릿 타입 정의
6. [ ] 5개 템플릿 spec 작성 (자연어 규칙)
7. [ ] 템플릿 선택 Popover UI 구현

### Phase 3: LLM 통합
8. [ ] Visual Summary 생성 서비스 구현 (Grok)
9. [ ] 스트리밍 렌더링 구현
10. [ ] 에러 처리 및 fallback 로직

### Phase 4: UX 완성
11. [ ] YouTube 블록에 Visual Summary 액션 추가
12. [ ] 생성 중 로딩 UI
13. [ ] 완료 후 캔버스 포커스

### Phase 5: 테스트 및 개선
14. [ ] 다양한 영상으로 테스트
15. [ ] 템플릿 품질 개선
16. [ ] 성능 최적화

---

## 11. 기술적 고려사항

### 11.1 Canvasdown 버전

현재 npm 배포 버전 사용:
- `@ssota-labs/canvasdown`: DSL 파서, 타입 레지스트리
- `@ssota-labs/canvasdown-reactflow`: React Flow 어댑터

**Roadmap 확인:**
- ✅ Patch DSL 지원
- 🚧 Streaming Parser (진행 중) - 완성 시 스트리밍 UX 개선 가능
- 📋 Subgraph/grouping support (계획) - Group 노드와 연계 가능

### 11.2 DB 스키마 변경

Group 노드를 위한 스키마 변경 필요:

```sql
-- BlockType enum에 'group' 추가 (if using enum)
ALTER TYPE block_type ADD VALUE 'group';

-- 또는 blocks 테이블의 block_type 컬럼이 text인 경우 변경 불필요
```

Group 노드의 properties:
```json
{
  "title": "Overview",
  "layoutHint": "stack",
  "color": "blue"
}
```

### 11.3 성능 고려

- **토큰 제한**: Grok 2M 컨텍스트로 대부분의 요약 처리 가능
- **렌더링 성능**: 노드 수 제한 (max 40-50개)으로 React Flow 성능 유지
- **스트리밍**: 부분 렌더링으로 체감 속도 개선

---

## 12. 의존성

### 12.1 외부 패키지

```json
{
  "@ssota-labs/canvasdown": "^0.2.0",
  "@ssota-labs/canvasdown-reactflow": "^0.2.0"
}
```

### 12.2 내부 도메인 의존성

- `ai-management`: Helicone provider, Grok 통합
- `canvas-management`: React Flow 통합, 노드/엣지 관리
- `block-management`: 블록 타입, 노드 컴포넌트
- `youtube-app-space`: YouTube 블록, 요약 데이터

---

## 13. 참고 문서

- [Canvasdown GitHub](https://github.com/ssota-labs/canvasdown)
- [React Flow Sub Flows](https://reactflow.dev/examples/grouping/sub-flows)
- [React Flow Parent-Child Relation](https://reactflow.dev/examples/grouping/parent-child-relation)
- [draft-plan.md](./draft-plan.md) - 초안 기획서
- [visualiz-method.md](./visualiz-method.md) - 템플릿 방법론
