# 패키지 구조 설계

## 개요

Spatial Context SDK의 패키지 구조 및 모듈 설계입니다. 프레임워크 독립적인 Core 패키지와 React Flow 어댑터로 구성됩니다.

---

## 패키지 구조

```
packages/
├── spatial-context-core/          # @spatial-context/core
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   ├── src/
│   │   ├── index.ts                    # 메인 진입점
│   │   ├── spatial-context.ts          # SpatialContext 메인 클래스
│   │   │
│   │   ├── types/                      # 공통 타입
│   │   │   ├── index.ts
│   │   │   ├── block.ts                # Block, BlockInfo
│   │   │   ├── edge.ts                 # Edge, EdgeInfo
│   │   │   ├── graph.ts                 # Graph, GraphData
│   │   │   └── context.ts              # Context 관련 타입
│   │   │
│   │   ├── focus/                      # Focus Context
│   │   │   ├── index.ts
│   │   │   ├── focus-context-provider.ts
│   │   │   ├── graph-traversal.ts      # BFS/DFS 탐색
│   │   │   └── proximity-search.ts     # 거리 기반 검색
│   │   │
│   │   ├── semantic/                   # Semantic Context
│   │   │   ├── index.ts
│   │   │   ├── semantic-context-provider.ts
│   │   │   ├── embedding-provider.ts   # 플러그인 인터페이스
│   │   │   ├── vector-index.ts          # 벡터 인덱스 (인메모리)
│   │   │   └── bm25.ts                 # BM25 검색 구현
│   │   │
│   │   ├── work/                       # Work Context
│   │   │   ├── index.ts
│   │   │   ├── work-context-provider.ts
│   │   │   ├── event-store.ts          # 이벤트 저장소
│   │   │   └── event-filter.ts         # 이벤트 필터
│   │   │
│   │   ├── action/                     # Action Context
│   │   │   ├── index.ts
│   │   │   ├── action-context-provider.ts
│   │   │   ├── action-registry.ts      # 액션 레지스트리
│   │   │   └── llm-tools.ts            # LLM Tool 변환
│   │   │
│   │   ├── composer/                   # Context Composer
│   │   │   ├── index.ts
│   │   │   └── context-composer.ts
│   │   │
│   │   └── llm/                        # LLM 통합 유틸리티
│   │       ├── index.ts
│   │       ├── prompt-generator.ts
│   │       └── tool-converter.ts
│   │
│   └── src/__tests__/                  # 테스트
│       ├── focus/
│       ├── semantic/
│       ├── work/
│       ├── action/
│       └── integration/
│
├── spatial-context-react-flow/    # @spatial-context/react-flow
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   ├── src/
│   │   ├── index.ts
│   │   ├── adapters/                  # React Flow 어댑터
│   │   │   ├── index.ts
│   │   │   ├── to-spatial-graph.ts     # React Flow → Spatial Graph
│   │   │   └── from-spatial-graph.ts  # Spatial Graph → React Flow
│   │   │
│   │   ├── hooks/                      # React 훅
│   │   │   ├── index.ts
│   │   │   ├── use-spatial-context.ts
│   │   │   └── use-spatial-context-patch.ts
│   │   │
│   │   └── providers/                  # Context Providers
│   │       ├── index.ts
│   │       └── spatial-context-provider.tsx
│   │
│   └── src/__tests__/
│
└── examples/                          # 예시 애플리케이션
    ├── basic-usage/
    ├── react-flow-integration/
    └── llm-integration/
```

---

## 모듈 설계 원칙

### 1. 프레임워크 독립성
- **Core 패키지**: 순수 TypeScript, React 의존성 없음
- **어댑터 패키지**: React Flow 전용, 선택적 사용

### 2. 트리 셰이킹
- 각 모듈 독립적 export
- 필요한 컨텍스트만 import 가능
- 예: `import { FocusContextProvider } from '@spatial-context/core/focus'`

### 3. 플러그인 패턴
- 임베딩 제공자: 플러그인 인터페이스
- 저장소: 추상 인터페이스, 다양한 구현체 지원

### 4. 타입 안정성
- 모든 공개 API에 TypeScript 타입 정의
- 제네릭을 활용한 유연한 타입 시스템

---

## Core 패키지 상세 설계

### types/ - 공통 타입

#### block.ts
```typescript
export interface Block {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface BlockInfo {
  id: string;
  type: string;
  title?: string;
  content?: string;
  properties: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}
```

#### edge.ts
```typescript
export interface Edge {
  id: string;
  source: string;  // Block ID
  target: string;  // Block ID
  data?: Record<string, unknown>;
}

export interface EdgeInfo {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: Record<string, unknown>;
}
```

#### graph.ts
```typescript
export interface Graph {
  nodes: Block[];
  edges: Edge[];
}

export interface GraphData {
  blocks: BlockInfo[];
  edges: EdgeInfo[];
}
```

### focus/ - Focus Context

**책임**: 선택 블록, 연결 블록, 근접 블록 탐색

**핵심 클래스**:
- `FocusContextProvider`: Focus Context 제공자
- `GraphTraversal`: BFS/DFS 그래프 탐색
- `ProximitySearch`: 거리 기반 검색

**의존성**: `types/` (Block, Edge, Graph)

### semantic/ - Semantic Context

**책임**: 벡터 검색, BM25 검색, 하이브리드 검색

**핵심 클래스**:
- `SemanticContextProvider`: Semantic Context 제공자
- `EmbeddingProvider`: 플러그인 인터페이스
- `VectorIndex`: 인메모리 벡터 인덱스
- `BM25Search`: BM25 검색 구현

**의존성**: 
- `types/` (Block, Graph)
- 외부: 임베딩 제공자 (플러그인)

### work/ - Work Context

**책임**: 이벤트 추적, 히스토리 관리, 시간 가중치 검색

**핵심 클래스**:
- `WorkContextProvider`: Work Context 제공자
- `EventStore`: 이벤트 저장소 (인메모리 또는 영구 저장)
- `EventFilter`: 이벤트 필터링

**의존성**: `types/` (Event 타입)

### action/ - Action Context

**책임**: 액션 정의, 등록, 실행, LLM Tool 변환

**핵심 클래스**:
- `ActionContextProvider`: Action Context 제공자
- `ActionRegistry`: 액션 레지스트리
- `LLMToolConverter`: LLM Tool 변환 유틸리티

**의존성**: `types/` (Action 타입)

### composer/ - Context Composer

**책임**: 여러 컨텍스트 조합, 통합 컨텍스트 생성

**핵심 클래스**:
- `ContextComposer`: 컨텍스트 조합기

**의존성**: `focus/`, `semantic/`, `work/`, `action/`

### llm/ - LLM 통합

**책임**: LLM 프롬프트 생성, Tool 정의 생성

**핵심 클래스**:
- `PromptGenerator`: 프롬프트 생성기
- `ToolConverter`: Tool 정의 변환기

**의존성**: `composer/`

---

## React Flow 어댑터 패키지

### adapters/ - 데이터 변환

**책임**: React Flow 노드/엣지 ↔ Spatial Graph 변환

**핵심 함수**:
- `toSpatialGraph(nodes, edges)`: React Flow → Spatial Graph
- `fromSpatialGraph(graph)`: Spatial Graph → React Flow

### hooks/ - React 훅

**책임**: React 컴포넌트에서 쉽게 사용할 수 있는 훅 제공

**핵심 훅**:
- `useSpatialContext()`: Spatial Context 사용
- `useSpatialContextPatch()`: Patch 모드 사용

### providers/ - Context Provider

**책임**: React Context를 통한 전역 상태 관리

**핵심 컴포넌트**:
- `SpatialContextProvider`: Spatial Context Provider

---

## 패키지 간 의존성

```
spatial-context-core (독립적)
    ↑
    │ (의존)
    │
spatial-context-react-flow
    ↑
    │ (사용)
    │
examples/
```

- **Core**: 외부 의존성 없음 (순수 TypeScript)
- **React Flow 어댑터**: Core 의존, React Flow 의존
- **예시**: 두 패키지 모두 사용

---

## 빌드 및 배포 전략

### 빌드 설정

#### Core 패키지
- **타입**: ESM + CJS (dual package)
- **번들러**: tsup 또는 esbuild
- **타입 정의**: `.d.ts` 파일 생성

#### React Flow 어댑터
- **타입**: ESM + CJS
- **번들러**: tsup 또는 esbuild
- **Peer Dependencies**: `@xyflow/react`, `react`, `react-dom`

### 배포 전략

1. **npm 패키지**: `@spatial-context/core`, `@spatial-context/react-flow`
2. **버전 관리**: Semantic Versioning
3. **문서**: GitHub Pages 또는 Vercel

---

## 확장성 고려사항

### 향후 추가 가능한 모듈

1. **다른 렌더러 어댑터**
   - `@spatial-context/d3`
   - `@spatial-context/canvas`

2. **벡터 DB 통합**
   - `@spatial-context/pinecone`
   - `@spatial-context/qdrant`

3. **LLM 특화 어댑터**
   - `@spatial-context/openai`
   - `@spatial-context/anthropic`

---

## 마이그레이션 전략

### SSOTA에서 SDK로 전환

1. **단계적 전환**: 
   - Core 패키지 먼저 구현
   - SSOTA에서 Core 사용
   - 점진적으로 SSOTA 특화 로직 제거

2. **호환성 레이어**:
   - SSOTA 특화 어댑터 제공 (임시)
   - 점진적으로 범용 인터페이스로 전환
