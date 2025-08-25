# Canvas Data Flow 리팩토링 계획서

## 📋 문서 개요

- **작성일**: 2024년 12월 현재
- **목적**: Canvas 데이터 흐름 구조 개선을 위한 점진적 리팩토링 계획 수립
- **범위**: Workflow Canvas 도메인 전체 (`/xbowl/apps/web/src/domains/workflow-canvas/`)
- **예상 작업 기간**: 2-3주 (단계별 검증 포함)

## 🎯 리팩토링 목적 및 배경

### 현재 상황

현재 Canvas 시스템에서는 `allWorkspaceBlocks` (React Flow Node 타입)이 모든 데이터의 기원 역할을 하고 있으나, 이는 다음과 같은 문제를 야기하고 있습니다:

1. **데이터 소유권 혼재**: React Flow 타입이 원본 데이터 역할을 하여 DB 스키마와 불일치
2. **Page Explorer 비효율성**: Page block의 중복 없는 목록이 필요하지만 React Flow 타입에서 추출해야 함
3. **위치 데이터 복잡성**: 하나의 page block이 여러 컨텍스트에서 다른 position을 가지는 구조가 명확하지 않음
4. **확장성 제약**: 새로운 기능 추가 시 데이터 흐름이 복잡해짐

### 리팩토링 목표

- **DB 데이터를 진실의 단일 소스(Single Source of Truth)로 확립**
- **React Flow 블록을 파생 상태로 전환하여 active page 기반 동적 생성**
- **Page Explorer가 중복 없는 깨끗한 DB block 데이터 사용**
- **명확하고 예측 가능한 데이터 흐름 구축**

## 🏗️ 현재 구조 vs 목표 구조

### 현재 데이터 흐름

```
DB (blocks, edges, positions)
  ↓ (초기 로드 시 1회 변환)
useReactFlowCanvasState.allWorkspaceBlocks (React Flow Node[])
  ↓ (모든 컴포넌트가 의존)
Page Explorer, Canvas Rendering, Editor Panel
```

### 목표 데이터 흐름

```
useDbCanvasState (메인 그라운드 트루스)
├── dbBlocks: DbBlock[] (unique page blocks)
├── dbEdges: DbEdge[]
└── dbBlockPositions: DbBlockPosition[] (context-based)
     ↓ (파생 상태, active page 기반)
useReactFlowCanvasState.displayBlocks (동적 생성)
├── displayBlocks: ReactFlowNode[] (현재 페이지용)
└── displayEdges: ReactFlowEdge[] (현재 페이지용)
     ↓ (사용)
Canvas Rendering Only

Page Explorer ← dbBlocks (직접 사용)
```

## 📊 아키텍처 설계

### 핵심 원칙

1. **Single Source of Truth**: DB 데이터가 유일한 진실
2. **Derived State Pattern**: React Flow 데이터는 파생 상태
3. **Context Separation**: 각 컨텍스트(페이지)별 위치 데이터 분리
4. **Lazy Loading**: 현재 활성 페이지의 블록만 React Flow로 변환

### 새로운 훅 구조

#### A. useDbCanvasState (신규 생성)

```typescript
interface DbCanvasState {
  // 원본 DB 데이터 (Single Source of Truth)
  dbBlocks: DbBlock[]; // 각 page block은 고유함
  dbEdges: DbEdge[];
  dbBlockPositions: DbBlockPosition[]; // context_block_id = page block ID

  // 상태 관리
  loading: boolean;
  error: string | null;

  // CRUD 작업 (모든 데이터 변경의 단일 진입점)
  addBlock: (block: Omit<DbBlock, "id">) => Promise<DbBlock>;
  updateBlock: (id: string, updates: Partial<DbBlock>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;

  addEdge: (edge: Omit<DbEdge, "id">) => Promise<DbEdge>;
  updateEdge: (id: string, updates: Partial<DbEdge>) => Promise<void>;
  deleteEdge: (id: string) => Promise<void>;

  updateBlockPosition: (
    blockId: string,
    contextId: string,
    position: { x: number; y: number }
  ) => Promise<void>;
  batchUpdatePositions: (
    updates: Array<{
      blockId: string;
      contextId: string;
      position: { x: number; y: number };
    }>
  ) => Promise<void>;
}
```

#### B. useReactFlowCanvasState (기존 훅 개편)

```typescript
interface ReactFlowCanvasState {
  // 현재 활성 페이지 기반 파생 데이터
  displayBlocks: ReactFlowNode[]; // activePageId 기반 동적 생성
  displayEdges: ReactFlowEdge[]; // activePageId 기반 동적 생성

  // 선택 및 인터랙션 상태 (React Flow 전용)
  selectedBlocks: string[];
  selectedEdges: string[];
  isDragging: boolean;
  isConnecting: boolean;
  zoom: number;
  pan: { x: number; y: number };

  // React Flow 전용 작업
  setDisplayBlocks: (blocks: ReactFlowNode[]) => void;
  setDisplayEdges: (edges: ReactFlowEdge[]) => void;
  // ... 기타 React Flow 관련 메서드
}
```

## 🚀 단계별 리팩토링 계획

### Phase 1: 새로운 DB 상태 훅 생성 (1-2일)

#### Task 1.1: useDbCanvasState 훅 생성

- **파일**: `hooks/state/useDbCanvasState.tsx` (신규)
- **목적**: DB 데이터의 CRUD 작업을 담당하는 메인 상태 훅 생성
- **이유**: 현재 분산된 DB 작업을 중앙화하여 데이터 일관성 확보

**구현 내용:**

```typescript
// hooks/state/useDbCanvasState.tsx
export function useDbCanvasState(
  workspaceId: string,
  initialDbBlocks?: DbBlock[],
  initialDbEdges?: DbEdge[],
  initialDbBlockPositions?: DbBlockPosition[]
) {
  // useState로 DB 데이터 관리
  const [dbBlocks, setDbBlocks] = useState<DbBlock[]>(initialDbBlocks || []);
  const [dbEdges, setDbEdges] = useState<DbEdge[]>(initialDbEdges || []);
  const [dbBlockPositions, setDbBlockPositions] = useState<DbBlockPosition[]>(
    initialDbBlockPositions || []
  );

  // CRUD 작업 구현
  // DB 액션과 로컬 상태 동기화
}
```

#### Task 1.2: 초기 데이터 로딩 및 동기화

- **목적**: 기존 초기화 로직을 새 훅으로 이관
- **검증**: 기존과 동일한 데이터가 로드되는지 확인

### Phase 2: useCanvasEventHandler 개편 (2-3일)

#### Task 2.1: DB 상태 우선 구조로 변경

- **파일**: `hooks/component/useCanvasHandler.tsx`
- **목적**: 모든 블록 조작이 DB 상태를 먼저 업데이트하도록 변경
- **이유**: 데이터 흐름을 단순화하고 일관성 확보

**주요 변경 사항:**

```typescript
export function useCanvasEventHandler(/* ... */) {
  // 기존: canvasState만 사용
  // 신규: dbState를 우선으로 사용
  const dbState = useDbCanvasState(
    workspaceId,
    initialDbBlocks,
    initialDbEdges,
    initialDbBlockPositions
  );
  const canvasState = useReactFlowCanvasState(); // DB 상태에 의존하는 파생 상태로 변경

  // 예: 블록 업데이트 시
  const handleBlockUpdate = async (blockId: string, updates: any) => {
    // 1. DB 상태 먼저 업데이트
    await dbState.updateBlock(blockId, updates);
    // 2. React Flow는 자동으로 반영됨 (effect 통해)
  };
}
```

#### Task 2.2: 위치 업데이트 로직 개선

- **목적**: `currentBlockPositions` 상태를 DB 상태로 통합
- **이유**: 위치 데이터의 이중 관리 문제 해결

### Phase 3: React Flow 상태 분리 (2-3일)

#### Task 3.1: displayBlocks 동적 생성 로직 구현

- **파일**: `hooks/state/useReactFlowCanvasState.tsx`
- **목적**: Active page 변경 시 해당 페이지 블록만 React Flow 형태로 변환
- **이유**: 메모리 효율성 향상 및 렌더링 성능 개선

**핵심 로직:**

```typescript
// activePageId가 변경될 때마다 displayBlocks 재생성
useEffect(() => {
  if (!activePageId || !dbBlocks || !dbBlockPositions) return;

  const pagePolicy = PageRenderingPolicyFactory.getPolicy(activePageType);
  const contextPositions = getContextPositions(activePageId, dbBlockPositions);

  const { blocks: displayBlocks, edges: displayEdges } =
    pagePolicy.getBlocksAndEdges(
      activePageId,
      dbBlocks,
      dbEdges,
      contextPositions
    );

  setDisplayBlocks(displayBlocks);
  setDisplayEdges(displayEdges);
}, [activePageId, dbBlocks, dbEdges, dbBlockPositions]);
```

#### Task 3.2: allWorkspaceBlocks 제거

- **목적**: 기존 전체 블록 배열을 제거하고 displayBlocks만 사용
- **주의사항**: 점진적 제거로 기능 손상 방지

### Phase 4: Page Explorer 개편 (1-2일)

#### Task 4.1: DB blocks 직접 사용으로 변경

- **파일**: `hooks/component/usePageBlockExplorerHandler.tsx`
- **목적**: Page Explorer가 중복 없는 깨끗한 DB block 데이터 사용
- **이유**: 불필요한 React Flow 타입 변환 제거

**주요 변경:**

```typescript
export function usePageBlockExplorerHandler() {
  // 기존: allWorkspaceBlocks 사용
  // 신규: dbBlocks 직접 사용
  const { dbBlocks } = useDbCanvasState();

  // Page block만 필터링 (중복 없음)
  const pageBlocks = useMemo(
    () => dbBlocks.filter((block) => isPageBlockType(block.block_type)),
    [dbBlocks]
  );

  // 트리 구조 생성 시 DB 타입 직접 사용
}
```

#### Task 4.2: Page block 생성 로직 개선

- **목적**: 새 페이지 생성 시 DB 상태를 직접 업데이트
- **검증**: 생성된 페이지가 즉시 목록에 반영되는지 확인

### Phase 5: Canvas Context 정리 (1일)

#### Task 5.1: 불필요한 상태 제거

- **파일**: `contexts/CanvasContext.tsx`
- **목적**: allWorkspaceBlocks 등 중복 상태 제거
- **이유**: Context 크기 축소 및 성능 개선

#### Task 5.2: 인터페이스 단순화

- **목적**: 외부에 노출되는 인터페이스 정리
- **검증**: 모든 컴포넌트가 정상 작동하는지 확인

## 🧪 테스트 전략

### 각 Phase별 테스트

1. **기능 테스트**: 기존 기능이 모두 정상 작동하는지 확인
2. **성능 테스트**: 메모리 사용량 및 렌더링 성능 측정
3. **데이터 일관성 테스트**: DB와 UI 상태의 동기화 확인

### 테스트 시나리오

```typescript
// 예: Phase 3 완료 후 테스트
describe("Canvas Data Flow Refactoring - Phase 3", () => {
  it("should display correct blocks when active page changes", () => {
    // 1. 페이지 A 선택
    // 2. displayBlocks가 페이지 A의 블록만 포함하는지 확인
    // 3. 페이지 B 선택
    // 4. displayBlocks가 페이지 B의 블록으로 변경되는지 확인
  });

  it("should maintain position data across page switches", () => {
    // 위치 데이터가 페이지 전환 시 유지되는지 확인
  });
});
```

## 🚨 리스크 관리 및 롤백 계획

### 식별된 리스크

1. **기능 손상**: 리팩토링 과정에서 기존 기능 손상 가능성
2. **성능 저하**: 새로운 구조로 인한 일시적 성능 저하
3. **데이터 불일치**: DB와 UI 상태 간 동기화 문제

### 롤백 전략

- **각 Phase별 Git 태그**: 문제 발생 시 이전 단계로 롤백 가능
- **Feature Flag**: 새 기능을 점진적으로 활성화
- **Parallel Implementation**: 기존 코드를 유지하면서 새 코드 병행 개발

### 롤백 트리거

- 기존 기능 손상 감지
- 성능 20% 이상 저하
- 데이터 불일치 문제 발생

## 📏 성공 지표

### 기술적 지표

- [ ] 모든 기존 기능 정상 작동
- [ ] Page Explorer 렌더링 성능 20% 이상 개선
- [ ] Canvas 메모리 사용량 15% 이상 감소
- [ ] 코드 복잡도 감소 (순환 의존성 제거)

### 개발자 경험 지표

- [ ] 새로운 페이지 타입 추가 시간 50% 단축
- [ ] 데이터 흐름 이해도 향상 (문서화 점수 기준)
- [ ] 버그 수정 시간 단축

## 🔄 후속 작업

### 리팩토링 완료 후 계획

1. **추가 최적화**: React.memo, useMemo 적용
2. **타입 안전성 강화**: 더 엄격한 타입 정의
3. **에러 처리 개선**: 더 세밀한 에러 핸들링
4. **문서 업데이트**: 새로운 구조에 맞는 개발 가이드 작성

### 확장 가능성

- **실시간 협업**: 새로운 데이터 구조로 실시간 동기화 용이
- **언두/리두**: DB 상태 기반 히스토리 관리
- **오프라인 모드**: 로컬 상태와 서버 상태 분리

## 📝 주의사항 및 고려사항

### 개발 시 주의사항

1. **점진적 변경**: 한 번에 너무 많은 변경 금지
2. **하위 호환성**: 기존 API 인터페이스 최대한 유지
3. **테스트 우선**: 각 변경 후 반드시 테스트 실행
4. **코드 리뷰**: 각 Phase 완료 시 코드 리뷰 필수

### 성능 고려사항

- **워크스페이스당 최대 100개 블록**: 현재 성능 요구사항 충족
- **메모이제이션**: 비싼 계산은 memoization 적용
- **Lazy Loading**: 필요한 데이터만 로드

### 확장성 고려사항

- **미래 스키마 변경**: DB 스키마 변경에 유연한 구조
- **새로운 블록 타입**: 쉽게 확장 가능한 아키텍처
- **다중 워크스페이스**: 향후 다중 워크스페이스 지원 대비

## 📚 참고 자료

### 관련 문서

- Canvas Architecture Specification
- Workflow State Management Guide
- Database Schema Documentation

### 코드 참조

- `useReactFlowCanvasState.tsx`: 현재 React Flow 상태 관리
- `useCanvasHandler.tsx`: 현재 이벤트 핸들러 구조
- `PageRenderingPolicyFactory`: 페이지별 렌더링 정책

---

**문서 버전**: v1.0  
**최종 업데이트**: 2024년 12월  
**담당자**: Canvas Team  
**검토자**: Architecture Team
