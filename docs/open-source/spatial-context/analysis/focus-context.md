# Focus Context 분석

## 개요

**Focus Context (초점 맥락)**은 현재 업무가 진행되고 있는 주제에 초점을 맞춰 관련된 컨텍스트를 전달합니다.

**설계 원리**: 의미적으로 가까운 정보들의 물리적인 거리를 가깝게 배치하는 사람의 사고 특성을 반영합니다.

---

## 핵심 기능

### 1. 현재 선택 블록
- **정의**: 유저가 지금 초점을 맞추고 있는 블록의 속성과 내용
- **우선순위**: 최우선
- **목적**: 명시적 의도 파악

### 2. 엣지 연결 블록
- **정의**: 해당 블록과 엣지로 연결된 블록 정보
- **탐색 깊이**: 1-hop (직접 연결만, 기본값)
- **목적**: 사용자가 명시적으로 연결한 관계 활용

### 3. 거리 기반 근접 블록
- **정의**: 물리적으로 가까운 블록 탐색
- **알고리즘**: 유클리드 거리 계산
- **목적**: 공간적 맥락 이해

---

## SSOTA 구현 분석

### 구현 위치

#### 1. 선택 블록 추출
**파일**: `apps/web/src/domains/ai-management/backend/services/context-assembly.service.ts`

```typescript
// 라인 146-149
const selectedBlocks = await this.getBlocksByIds(
  pageId,
  selectedBlockIds || []
);
```

**로직**:
- 블록 ID 목록을 받아 블록 정보 조회
- `getBlocksByIds()` 메서드 사용
- 페이지별 필터링 (`pageId`)

#### 2. 엣지 기반 연결 블록 탐색
**파일**: `apps/web/src/domains/ai-management/backend/services/context-assembly.service.ts`

```typescript
// 라인 187-238
private async getConnectedBlocks(
  pageId: string,
  selectedBlockIds: string[]
): Promise<BlockInfo[]>
```

**알고리즘**:
1. **엣지 조회**: 선택된 블록과 연결된 edges 조회
   ```sql
   SELECT * FROM edges
   WHERE page_id = ?
     AND (source_block_mount_id IN (?) OR target_block_mount_id IN (?))
     AND deleted_at IS NULL
   ```

2. **연결 블록 ID 수집**: 
   - source가 선택된 블록이면 target 추가
   - target이 선택된 블록이면 source 추가
   - 선택된 블록 자신은 제외

3. **블록 정보 조회**: 수집된 ID로 블록 정보 조회

**특징**:
- **1-hop만 탐색**: 직접 연결된 블록만 (depth=1)
- **양방향 탐색**: source ↔ target 모두 고려
- **중복 제거**: Set 사용

#### 3. 거리 기반 근접 블록 탐색
**파일**: `apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/use-ai-agent.ts`

```typescript
// 라인 116-136
const NEARBY_DISTANCE_THRESHOLD = 1000;  // 1000px
const MAX_NEARBY_BLOCKS = 10;

// 기준점 계산
const referenceCenterX = selectedNodes.length > 0
  ? sumX / selectedNodes.length  // 선택된 블록 중심
  : (canvasWidth / 2 - viewport.x) / viewport.zoom;  // 뷰포트 중심

// 거리 계산 및 필터링
const nodesWithDistance = allNodes
  .map(node => {
    const dx = node.position.x - referenceCenterX;
    const dy = node.position.y - referenceCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return { node, distance };
  })
  .filter(item => item.distance <= NEARBY_DISTANCE_THRESHOLD)
  .sort((a, b) => a.distance - b.distance)
  .slice(0, MAX_NEARBY_BLOCKS);
```

**알고리즘**:
1. **기준점 계산**:
   - 선택된 블록이 있으면: 선택된 블록들의 중심 좌표
   - 선택된 블록이 없으면: 뷰포트 중앙 좌표

2. **거리 계산**: 유클리드 거리 (`√(dx² + dy²)`)

3. **필터링**: 반경 1000px 이내

4. **정렬**: 거리 가까운 순

5. **제한**: 최대 10개

**특징**:
- **Zoom 레벨 체크**: `viewport.zoom >= 0.75`일 때만 계산
- **Viewport 기반**: 화면에 보이는 블록만 대상

---

## 알고리즘 분석

### 1. 그래프 탐색 (BFS)

**현재 구현**: 1-hop만 탐색 (직접 연결)

**SDK 설계**:
- **depth 파라미터**: 탐색 깊이 설정 가능
- **BFS 알고리즘**: 깊이 제한 BFS 구현
- **순환 방지**: 방문한 노드 추적

**의사 코드**:
```
function getConnectedBlocks(startBlockIds, depth = 1):
  visited = Set()
  result = []
  queue = Queue(startBlockIds)
  
  for level in range(depth):
    currentLevel = queue.dequeueAll()
    for blockId in currentLevel:
      if blockId not in visited:
        visited.add(blockId)
        neighbors = getNeighbors(blockId)  // edges로 연결된 블록
        result.extend(neighbors)
        queue.enqueue(neighbors)
  
  return result
```

### 2. 거리 계산 (유클리드 거리)

**현재 구현**: 2D 평면 유클리드 거리

**SDK 설계**:
- **거리 함수**: 플러그인 가능 (유클리드, 맨해튼 등)
- **기준점**: 선택 블록 중심 또는 사용자 지정
- **반경 필터**: 설정 가능

**수식**:
```
distance = √((x₂ - x₁)² + (y₂ - y₁)²)
```

### 3. 결과 정렬

**우선순위**:
1. 선택된 블록 (최우선)
2. 엣지로 연결된 블록
3. 거리적으로 가까운 블록

---

## 인터페이스 설계

### FocusContextProvider

```typescript
export interface FocusContextProvider {
  /**
   * Focus Context 조회
   * @param selectedBlockId - 현재 선택된 블록 ID
   * @param options - 옵션
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

### FocusContextOptions

```typescript
export interface FocusContextOptions {
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

---

## 사용 예시

### 기본 사용

```typescript
import { SpatialContext } from '@spatial-context/core';

const spatial = new SpatialContext();

// 그래프 데이터 설정
spatial.setGraph({
  nodes: canvasNodes,
  edges: canvasEdges,
});

// Focus Context 조회
const focusContext = spatial.focus.getContext('block-123', {
  edgeDepth: 2,           // 2-hop까지 탐색
  proximityRadius: 200,   // 200px 반경
  maxResults: 10,
});

console.log(focusContext.selectedBlock);
console.log(focusContext.connectedBlocks);
console.log(focusContext.nearbyBlocks);
```

### React Flow 통합

```typescript
import { useSpatialContext } from '@spatial-context/react-flow';
import { useReactFlow } from '@xyflow/react';

function MyCanvas() {
  const { getNodes, getEdges } = useReactFlow();
  const { spatial } = useSpatialContext();

  const handleSelection = (selectedNodeId: string | null) => {
    // React Flow 노드/엣지를 Spatial Graph로 변환
    const graph = toSpatialGraph(getNodes(), getEdges());
    spatial.setGraph(graph);

    // Focus Context 조회
    const context = spatial.focus.getContext(selectedNodeId);
    
    // LLM에 전달
    sendToLLM(context.summary);
  };
}
```

---

## 성능 고려사항

### 최적화 전략

1. **캐싱**: 
   - 그래프 구조 캐싱
   - 거리 계산 결과 캐싱

2. **지연 계산**:
   - 필요한 컨텍스트만 계산
   - Lazy evaluation

3. **배치 처리**:
   - 여러 블록의 연결 정보 일괄 조회

### 예상 성능

- **1-hop 탐색**: O(E) - E는 엣지 수
- **거리 계산**: O(N) - N은 노드 수
- **전체**: O(E + N) - 선형 시간

---

## SSOTA 특화 로직 제거 포인트

### 제거 대상

1. **페이지 ID 필터링**: 
   - 현재: `pageId` 기반 필터링
   - SDK: 그래프 데이터 자체에 포함

2. **블록 마운트 테이블 조인**:
   - 현재: `blockMounts` 테이블 조인
   - SDK: 그래프 데이터 구조로 통합

3. **삭제된 블록 제외**:
   - 현재: `deleted_at IS NULL` 체크
   - SDK: 그래프 데이터에 포함되지 않음

### 유지 대상

1. **그래프 탐색 알고리즘**: BFS 로직
2. **거리 계산**: 유클리드 거리 공식
3. **필터링 및 정렬**: 범용 로직

---

## README 섹션 초안

### Focus Context (초점 맥락)

> "What am I looking at right now?"

Extracts context based on the user's current focus:

```typescript
const focusContext = await spatial.focus.getContext({
  selectedBlockId: 'block-123',
  edgeDepth: 2,           // Include blocks up to 2 edges away
  proximityRadius: 200,   // Include blocks within 200px
});

// Result:
// - Currently selected block with full properties
// - Blocks connected via edges (up to depth 2)
// - Nearby blocks within radius
```

**Use cases**:
- Understanding what the user is working on
- Finding related information in connected blocks
- Utilizing spatial proximity as semantic proximity
