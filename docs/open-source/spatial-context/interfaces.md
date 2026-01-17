# 핵심 인터페이스 정의

## 개요

Spatial Context SDK의 핵심 인터페이스 및 타입 정의입니다. 각 컨텍스트 모듈의 public API를 명확히 정의합니다.

---

## 공통 타입

### Block & Edge

```typescript
/**
 * 블록 기본 정보
 */
export interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

/**
 * 블록 상세 정보 (컨텍스트 전달용)
 */
export interface BlockInfo {
  id: string;
  type: string;
  title?: string;
  content?: string;
  properties: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

/**
 * 엣지 정보
 */
export interface Edge {
  id: string;
  source: string;  // Block ID
  target: string;  // Block ID
  data?: Record<string, unknown>;
}

/**
 * 그래프 데이터
 */
export interface Graph {
  nodes: Block[];
  edges: Edge[];
}
```

---

## Focus Context

### FocusContextOptions

```typescript
export interface FocusContextOptions {
  /**
   * 현재 선택된 블록 ID
   */
  selectedBlockId?: string | null;

  /**
   * 엣지 연결 탐색 깊이 (1 = 직접 연결만)
   * @default 1
   */
  edgeDepth?: number;

  /**
   * 거리 기반 탐색 반경 (픽셀)
   * @default 100
   */
  proximityRadius?: number;

  /**
   * 포함할 블록 속성 필터
   */
  includeProperties?: string[];

  /**
   * 최대 결과 수
   * @default 20
   */
  maxResults?: number;
}
```

### FocusContextResult

```typescript
export interface FocusContextResult {
  /**
   * 현재 선택된 블록
   */
  selectedBlock: BlockInfo | null;

  /**
   * 엣지로 연결된 블록들
   */
  connectedBlocks: BlockInfo[];

  /**
   * 거리적으로 가까운 블록들
   */
  nearbyBlocks: BlockInfo[];

  /**
   * 컨텍스트 요약 (LLM 프롬프트용)
   */
  summary: string;
}
```

### FocusContextProvider

```typescript
export interface FocusContextProvider {
  /**
   * Focus Context 조회
   */
  getContext(
    selectedBlockId: string | null,
    options?: FocusContextOptions
  ): FocusContextResult;

  /**
   * 그래프 데이터 설정
   */
  setGraph(graph: Graph): void;
}
```

---

## Semantic Context

### EmbeddingProvider (플러그인 인터페이스)

```typescript
/**
 * 임베딩 제공자 인터페이스 (플러그인 패턴)
 */
export interface EmbeddingProvider {
  /**
   * 텍스트를 임베딩 벡터로 변환
   */
  embed(text: string): Promise<number[]>;

  /**
   * 여러 텍스트를 일괄 임베딩
   */
  embedBatch(texts: string[]): Promise<number[][]>;

  /**
   * 임베딩 벡터 차원
   */
  dimensions: number;
}
```

### SemanticContextOptions

```typescript
export interface SemanticContextOptions {
  /**
   * 검색 쿼리 (유저 발화)
   */
  query: string;

  /**
   * 검색 전략
   * @default 'hybrid'
   */
  strategy?: 'vector' | 'bm25' | 'hybrid';

  /**
   * 하이브리드 검색 시 벡터 가중치 (0-1)
   * @default 0.7
   */
  vectorWeight?: number;

  /**
   * 최대 결과 수
   * @default 10
   */
  topK?: number;

  /**
   * 최소 유사도 임계값
   * @default 0.5
   */
  minScore?: number;
}
```

### SemanticSearchResult

```typescript
export interface SemanticSearchResult {
  block: BlockInfo;
  score: number;
  matchType: 'vector' | 'bm25' | 'hybrid';
}
```

### SemanticContextResult

```typescript
export interface SemanticContextResult {
  /**
   * 의미적으로 관련된 블록들
   */
  relevantBlocks: SemanticSearchResult[];

  /**
   * 검색 메타데이터
   */
  metadata: {
    totalSearched: number;
    searchTime: number;
    strategy: string;
  };

  /**
   * 컨텍스트 요약 (LLM 프롬프트용)
   */
  summary: string;
}
```

### SemanticContextProvider

```typescript
export interface SemanticContextProvider {
  /**
   * 임베딩 제공자 설정
   */
  setEmbeddingProvider(provider: EmbeddingProvider): void;

  /**
   * 블록 인덱싱
   */
  indexBlocks(blocks: BlockInfo[]): Promise<void>;

  /**
   * 시맨틱 검색
   */
  search(options: SemanticContextOptions): Promise<SemanticContextResult>;
}
```

---

## Work Context

### CanvasEventType

```typescript
export type CanvasEventType =
  | 'block.created'
  | 'block.updated'
  | 'block.deleted'
  | 'block.moved'
  | 'block.resized'
  | 'block.selected'
  | 'edge.created'
  | 'edge.deleted'
  | 'viewport.changed'
  | 'user.action';
```

### CanvasEvent

```typescript
export interface CanvasEvent {
  id: string;
  type: CanvasEventType;
  timestamp: Date;

  /**
   * 이벤트 대상
   */
  targetId?: string;
  targetType?: 'block' | 'edge' | 'viewport';

  /**
   * 이벤트 상세 데이터
   */
  data: Record<string, unknown>;

  /**
   * 이벤트 발생 사용자
   */
  userId?: string;

  /**
   * 세션 식별자
   */
  sessionId?: string;
}
```

### WorkContextOptions

```typescript
export interface WorkContextOptions {
  /**
   * 시간 범위 필터
   */
  timeRange?: {
    from?: Date;
    to?: Date;
  };

  /**
   * 이벤트 타입 필터
   */
  eventTypes?: CanvasEventType[];

  /**
   * 특정 블록 관련 이벤트만
   */
  blockIds?: string[];

  /**
   * 최대 이벤트 수
   * @default 50
   */
  maxEvents?: number;

  /**
   * 관련성 검색 쿼리 (유저 발화)
   */
  relevanceQuery?: string;
}
```

### WorkContextResult

```typescript
export interface WorkContextResult {
  /**
   * 관련 이벤트 목록
   */
  events: CanvasEvent[];

  /**
   * 이벤트 요약
   */
  summary: {
    totalEvents: number;
    eventTypeCounts: Record<CanvasEventType, number>;
    timeRange: { from: Date; to: Date };
  };

  /**
   * 컨텍스트 요약 (LLM 프롬프트용)
   */
  contextSummary: string;
}
```

### WorkContextProvider

```typescript
export interface WorkContextProvider {
  /**
   * 이벤트 기록
   */
  recordEvent(event: Omit<CanvasEvent, 'id' | 'timestamp'>): void;

  /**
   * 컨텍스트 조회
   */
  getContext(options?: WorkContextOptions): WorkContextResult;

  /**
   * 이벤트 스트림 구독
   */
  subscribe(
    callback: (event: CanvasEvent) => void
  ): () => void;  // unsubscribe 함수 반환

  /**
   * 세션 관리
   */
  startSession(): string;
  endSession(sessionId: string): void;
}
```

---

## Action Context

### ActionParameter

```typescript
/**
 * 액션 파라미터 스키마 (JSON Schema 기반)
 */
export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  properties?: Record<string, ActionParameter>;  // for object type
  items?: ActionParameter;  // for array type
}
```

### ActionDefinition

```typescript
export interface ActionDefinition {
  id: string;
  name: string;
  description: string;

  /**
   * 액션 대상 (특정 블록 타입 또는 전역)
   */
  target: 'global' | string[];  // 'global' or block type names

  /**
   * 파라미터 스키마
   */
  parameters: ActionParameter[];

  /**
   * 가용성 조건 (optional)
   */
  isAvailable?: (context: ActionAvailabilityContext) => boolean;

  /**
   * 액션 실행 핸들러
   */
  execute: (params: Record<string, unknown>) => Promise<ActionResult>;
}
```

### ActionAvailabilityContext

```typescript
export interface ActionAvailabilityContext {
  selectedBlocks: BlockInfo[];
  canvasState: Graph;
  userPermissions?: string[];
}
```

### ActionResult

```typescript
export interface ActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
  affectedBlocks?: string[];
}
```

### ActionContextOptions

```typescript
export interface ActionContextOptions {
  /**
   * 특정 블록 타입 필터
   */
  blockTypes?: string[];

  /**
   * 전역 액션 포함 여부
   * @default true
   */
  includeGlobal?: boolean;

  /**
   * 현재 가용한 액션만 필터
   * @default true
   */
  onlyAvailable?: boolean;

  /**
   * 유저 발화 기반 관련 액션 필터
   */
  relevanceQuery?: string;
}
```

### ActionContextResult

```typescript
export interface ActionContextResult {
  /**
   * 사용 가능한 액션 목록
   */
  availableActions: ActionDefinition[];

  /**
   * 액션 카테고리별 그룹
   */
  actionsByCategory: Record<string, ActionDefinition[]>;

  /**
   * 추천 액션 (유저 발화 기반)
   */
  suggestedActions?: ActionDefinition[];

  /**
   * 컨텍스트 요약 (LLM 프롬프트용)
   */
  summary: string;
}
```

### ActionContextProvider

```typescript
export interface ActionContextProvider {
  /**
   * 액션 등록
   */
  registerAction(action: ActionDefinition): void;

  /**
   * 액션 일괄 등록
   */
  registerActions(actions: ActionDefinition[]): void;

  /**
   * 액션 조회
   */
  getContext(options?: ActionContextOptions): ActionContextResult;

  /**
   * 액션 실행
   */
  executeAction(
    actionId: string,
    params: Record<string, unknown>
  ): Promise<ActionResult>;
}
```

---

## Context Composer

### ComposeOptions

```typescript
export interface ComposeOptions {
  focus?: {
    selectedBlockId?: string | null;
    edgeDepth?: number;
    proximityRadius?: number;
  };

  semantic?: {
    query: string;
    strategy?: 'vector' | 'bm25' | 'hybrid';
    topK?: number;
  };

  work?: {
    timeRange?: { from?: Date; to?: Date };
    maxEvents?: number;
  };

  action?: {
    blockTypes?: string[];
    onlyAvailable?: boolean;
  };
}
```

### ComposedContext

```typescript
export interface ComposedContext {
  focus?: FocusContextResult;
  semantic?: SemanticContextResult;
  work?: WorkContextResult;
  action?: ActionContextResult;
}
```

### SpatialContext (메인 클래스)

```typescript
export class SpatialContext {
  // Context providers
  focus: FocusContextProvider;
  semantic: SemanticContextProvider;
  work: WorkContextProvider;
  action: ActionContextProvider;

  /**
   * 그래프 데이터 설정
   */
  setGraph(graph: Graph): void;

  /**
   * 블록 타입 등록
   */
  registerBlockType(config: BlockTypeConfig): void;

  /**
   * 여러 컨텍스트 조합
   */
  compose(options: ComposeOptions): Promise<ComposedContext>;

  /**
   * LLM 프롬프트 생성
   */
  toPrompt(context: ComposedContext): string;

  /**
   * LLM Tool 정의 생성
   */
  toTools(actions: ActionDefinition[]): LLMTool[];
}
```

---

## LLM 통합

### LLMTool

```typescript
/**
 * LLM Tool 정의 (OpenAI Function Calling 형식)
 */
export interface LLMTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}
```

### LLMToolConverter

```typescript
export interface LLMToolConverter {
  /**
   * OpenAI Function Calling 형식
   */
  toOpenAITools(actions: ActionDefinition[]): LLMTool[];

  /**
   * Anthropic Tool Use 형식
   */
  toAnthropicTools(actions: ActionDefinition[]): AnthropicTool[];

  /**
   * MCP Tool 형식
   */
  toMCPTools(actions: ActionDefinition[]): MCPTool[];
}
```

---

## React Flow 어댑터

### ReactFlowAdapter

```typescript
/**
 * React Flow 노드/엣지를 Spatial Graph로 변환
 */
export function toSpatialGraph(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[]
): Graph;

/**
 * Spatial Graph를 React Flow 노드/엣지로 변환
 */
export function fromSpatialGraph(
  graph: Graph
): { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] };
```

### useSpatialContext Hook

```typescript
export function useSpatialContext(options: {
  embeddingProvider?: EmbeddingProvider;
  graph?: Graph;
}): {
  spatial: SpatialContext;
  context: ComposedContext | null;
  compose: (options: ComposeOptions) => Promise<void>;
};
```

---

## 타입 안전성 고려사항

### 제네릭 활용

```typescript
// 블록 타입별 커스텀 데이터 타입 지원
export interface Block<T = Record<string, unknown>> {
  id: string;
  type: string;
  data: T;
  // ...
}
```

### 타입 가드

```typescript
export function isBlock(obj: unknown): obj is Block;
export function isEdge(obj: unknown): obj is Edge;
export function isGraph(obj: unknown): obj is Graph;
```

---

## 확장성 고려사항

### 플러그인 인터페이스

- `EmbeddingProvider`: 임베딩 제공자
- `EventStore`: 이벤트 저장소 (인메모리, 로컬 스토리지, 서버 등)
- `VectorIndex`: 벡터 인덱스 (인메모리, 외부 DB 등)

### 설정 인터페이스

```typescript
export interface SpatialContextConfig {
  embeddingProvider?: EmbeddingProvider;
  eventStore?: EventStore;
  vectorIndex?: VectorIndex;
  defaultOptions?: {
    focus?: Partial<FocusContextOptions>;
    semantic?: Partial<SemanticContextOptions>;
    work?: Partial<WorkContextOptions>;
    action?: Partial<ActionContextOptions>;
  };
}
```
