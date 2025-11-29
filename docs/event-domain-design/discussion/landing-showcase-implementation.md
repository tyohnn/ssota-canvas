# Landing Showcase 구현 문서

## 개요

스크롤 기반 인터랙티브 마케팅 랜딩페이지. 100vh 고정 화면에서 휠 스크롤에 따라 좌측 메시지와 우측 Canvas가 동시에 전환되며 제품의 핵심 가치를 시연합니다.

**URL**: `/showcase`

**핵심 컨셉**: 
- Apple 스타일 scroll-jacking (화면 고정, 콘텐츠만 전환)
- 튜토리얼 + 마케팅 메시지 통합
- 실제 블록 컴포넌트 재사용 (read-only 모드)

---

## 아키텍처

### 파일 구조

```
apps/web/src/
  app/(main)/
    showcase/
      page.tsx                 # 메인 페이지 (100vh 고정)
      layout.tsx              # 레이아웃
  domains/landing/
    components/
      canvas-demo/
        index.tsx              # Canvas 데모 메인
        canvas-demo-controller.tsx  # 섹션별 제어
        landing-canvas-wrapper.tsx  # Read-only Canvas
        hooks/
          use-scroll-sections.ts    # 휠 스크롤 감지
        data/
          section1-data.ts     # Section 1 블록 데이터
  domains/canvas-management/
    frontend/
      config/
        node-types.config.ts   # 중앙 집중식 nodeTypes 정의
```

---

## 기술 스택

### 1. 스크롤 제어

**Wheel Event 기반 스크롤 제어**:
```typescript
// use-scroll-sections.ts
useEffect(() => {
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault(); // 기본 스크롤 차단
    
    const delta = e.deltaY;
    const newAccumulated = accumulatedScroll + delta;
    
    // 50px당 1 phase 전환
    const progress = clampedScroll / maxScroll;
    calculateSectionAndPhase(progress);
  };
  
  window.addEventListener('wheel', handleWheel, { passive: false });
}, []);
```

**특징**:
- Canvas 위에서도 스크롤 감지 ✅
- 누적 스크롤 값으로 정확한 진행률 계산
- Section 5개 × Phase 4개 = 총 19개 단계

### 2. React Flow Integration

**Read-only Canvas**:
```typescript
<ReactFlow
  nodesDraggable={false}
  nodesConnectable={false}
  elementsSelectable={false}
  panOnDrag={false}
  panOnScroll={false}
  zoomOnScroll={false}
  zoomOnPinch={false}
  // 모든 상호작용 비활성화
>
```

**Edge Enrichment** (중요!):
```typescript
const enrichedEdges = useMemo(
  () =>
    edges.map(edge => ({
      ...edge,
      type: 'custom',  // CustomEdge 사용
      data: {
        pageId,
        orgId,
        workspaceId,
        actualEdgeShape: 'default',
      },
    })),
  [edges, pageId, orgId, workspaceId]
);
```

### 3. 중앙 집중식 Node Types

**Before**: 각 Canvas마다 nodeTypes 정의 (중복)  
**After**: Config 한 곳에서 관리

```typescript
// config/node-types.config.ts
export const CANVAS_NODE_TYPES: NodeTypes = {
  [BlockType.TEXT]: TextBlock,
  [BlockType.SHAPE]: ShapeBlock,
  [BlockType.GITHUB_BRANCH]: GitHubBranchBlock,
  // ... 모든 블록 타입
};

// 사용
import { CANVAS_NODE_TYPES } from '@/domains/canvas-management/frontend/config/node-types.config';
const nodeTypes = CANVAS_NODE_TYPES;
```

---

## Section 1: For Software Development

### 계층 구조

```
Section 1
└── For Software Development
    ├── Phase 1: Plan
    ├── Phase 2: Design
    ├── Phase 3: Develop
    └── Phase 4: Deploy
```

### Phase 1: Plan

**좌측 카피**:
```
ONE CANVAS WHERE YOUR WORK LIVES

From Plan, Research, Design
to Make, Create, Develop
on limitless canvas with collaborating AI

🚀 For Software Development

[Phase Title] Plan
[Description] Transform meeting recordings into structured specs
```

**Canvas 블록**:
1. **Audio Block** - 회의 녹음
   - `audioUrl`: 실제 재생 가능한 오디오 파일
   - `title`: "Product Planning Meeting"
   - `playbackRate`: 1, `volume`: 0.8

2. **Markdown Block** - 회의록
   - TipTap JSON 구조
   - 실제 회의록 형식 (날짜, 참석자, 안건, 결정사항, 다음 단계)

3. **IA Section** (4개 페이지)
   - Login, Dashboard, Canvas, Settings
   - 모두 `rounded_rectangle` (통일)
   - 다른 색상 (blue, green, purple, amber)

4. **User Flow Section** (5개 단계)
   - Visit Site → Sign Up → Onboarding → Create Workspace → First Canvas
   - 다양한 도형 (ellipse, rectangle, diamond)
   - 사용자의 실제 행동 표현

**엣지**: 총 9개

### Phase 2: Design

**Canvas 블록**:
- Button Component 4가지 State
  - Default, Hover, Active, Disabled
  - 모두 `rounded_rectangle`
  - 점진적인 색상 변화

**엣지**: 3개 (순차 연결)

### Phase 3: Develop

**Canvas 블록**:
- React Preview Block (코드 에디터)
- GitHub Commit Block
- GitHub PR Block (Text 블록으로 표현)

**엣지**: 2개

### Phase 4: Deploy

**Canvas 블록**:
- PR #42 (Text 블록)
- Vercel Deployment Block
- Live Status (Shape - ellipse, green)

**엣지**: 2개

---

## 새로 추가된 블록 타입

### 1. GitHub Branch Block
- **Properties**: `repository`, `branchName`
- **Auto-fetch**: lastCommit, commitCount, status, updatedAt
- **크기**: 320 × 180px

### 2. GitHub Commit Block
- **Properties**: `repository`, `commitHash`
- **Auto-fetch**: commitMessage, author, ciStatus, filesChanged
- **크기**: 320 × 160px

### 3. React Preview Block
- **Properties**: `code`
- **기능**: Sandpack 통합, Preview/Code 탭
- **크기**: 500 × 400px

### 4. Vercel Deployment Block
- **Properties**: `projectName`, `deploymentUrl`
- **Auto-fetch**: status, branch, buildTime
- **크기**: 350 × 200px

---

## 타입 시스템 개선

### BlockPropertiesMap (확장 가능)

**Before** (100줄 중첩 삼항):
```typescript
export type BlockProperties<T> = 
  T extends 'text' ? TextBlockProperties
  : T extends 'shape' ? ShapeBlockProperties
  : ... // 100 more lines
```

**After** (Map 구조):
```typescript
type BlockPropertiesMap = {
  text: TextBlockProperties;
  github_branch: GithubBranchBlockProperties; // 추가 쉬움
};

export type BlockProperties<T extends BlockType> = 
  T extends keyof BlockPropertiesMap
    ? BlockPropertiesMap[T]
    : Record<string, any>;
```

### CustomNodeType 자동 생성

**Before**:
```typescript
export type CustomNodeType =
  | TextBlockNode
  | ShapeBlockNode
  | GithubBranchBlockNode
  // ... 100 more types
```

**After**:
```typescript
export type CustomNodeType = 
  BuiltInNode | Node<BlockNodeData, BlockType>;
```

---

## 새 블록 추가 시 수정 필요한 곳

**총 8곳만 수정**:

1. `db/schema.ts` - blockTypeEnum
2. `block-types.ts` - BlockType 상수 + BLOCK_TYPE_SIZES
3. `{name}.vo.ts` - Properties Interface
4. `block-properties/index.ts` - Export
5. `block-data.types.ts` - BlockPropertiesMap
6. `block-data.types.ts` - NodeData Interface + Union
7. `node-types.config.ts` - CANVAS_NODE_TYPES
8. `{name}/index.tsx` - 컴포넌트 구현

**자동 처리**:
- ✅ CustomNodeType
- ✅ BlockProperties<T>
- ✅ 모든 Canvas에 자동 적용

---

## 애니메이션

### Framer Motion

```typescript
// 좌측 콘텐츠 전환
<AnimatePresence mode="wait">
  <motion.div
    key={`section-${section}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
  >
</AnimatePresence>

// Phase 텍스트 전환
<motion.div
  key={`phase-${subPhase}`}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.4 }}
>
```

### Canvas 전환

```typescript
// Viewport 애니메이션
useEffect(() => {
  if (viewport) {
    reactFlow.setViewport(viewport, { duration: 800 });
  }
}, [viewport]);
```

---

## 성능 최적화

### 1. useMemo로 데이터 캐싱
```typescript
const enrichedEdges = useMemo(
  () => edges.map(edge => ({ ...edge, ... })),
  [edges, pageId, orgId, workspaceId]
);
```

### 2. useEffect dependency 최소화
```typescript
// canvasModeContext 제거하여 무한 루프 방지
useEffect(() => {
  if (canvasMode === 'default') {
    canvasModeContext.exitToDefaultMode();
  }
}, [canvasMode, selectedNodeId]); // canvasModeContext 제외
```

### 3. Passive event listeners
```typescript
window.addEventListener('wheel', handleWheel, { passive: false });
```

---

## 트러블슈팅

### 문제: 엣지가 렌더링되지 않음

**원인**: CustomEdge에 필수 메타데이터 누락

**해결**:
```typescript
// useMemo로 edges enrichment
const enrichedEdges = useMemo(
  () =>
    edges.map(edge => ({
      ...edge,
      type: 'custom',
      data: {
        pageId,
        orgId,
        workspaceId,
        actualEdgeShape: 'default',
      },
    })),
  [edges, pageId, orgId, workspaceId]
);

// useEdgesState에 enrichedEdges 전달
const [internalEdges, setEdges, onEdgesChange] = useEdgesState(enrichedEdges);
```

### 문제: Audio Block playbackRate 에러

**원인**: properties에 필수 값 누락

**해결**:
```typescript
properties: {
  audioUrl: 'https://...',
  playbackRate: 1,  // 필수
  volume: 0.8,      // 필수
}
```

### 문제: 무한 루프

**원인**: useEffect dependency에 context 포함

**해결**: dependency에서 context 메서드 제외

---

## 베스트 프랙티스

### 1. 블록 데이터 구조

```typescript
{
  id: 'unique-id',
  type: 'block_type',  // BlockType enum 값
  position: { x: 100, y: 200 },
  data: {
    blockId: 'block-id',
    blockMountId: 'block-mount-id',
    blockType: 'block_type',
    title: 'Block Title',
    content: {},  // TipTap JSON, JSONB 등
    properties: {
      // 사용자가 입력/설정하는 값만
    },
    customProperties: [],
  },
  width: 300,
  height: 200,
}
```

### 2. 엣지 데이터 구조

```typescript
{
  id: 'edge-id',
  source: 'source-block-mount-id',
  target: 'target-block-mount-id',
  // type과 data는 enrichment에서 자동 추가
}
```

### 3. Properties 원칙

- ✅ 사용자 입력/선택 (2-3개 권장)
- ❌ 자동 fetch 데이터
- ❌ 렌더링 옵션
- ❌ 내부 상태

---

## 향후 계획

### Section 2-5 구현

- [ ] Section 2: AI 협업 (Jarvis)
- [ ] Section 3: 블록 추가 및 변환
- [ ] Section 4: 블록 앱스페이스
- [ ] Section 5: 커스텀 속성

### 개선사항

- [ ] 모바일 반응형
- [ ] 키보드 내비게이션
- [ ] 접근성 개선
- [ ] 성능 최적화

---

## 참고 문서

- [Block Properties Principle](../domains/block-management-domain/block-definitions/00-block-properties-principle.md)
- [How to Add New Block](../domains/block-management-domain/block-definitions/00-how-to-add-new-block.md)
- [Component Development Guidelines](./frontend-architecture/component-development-guidelines.md)

---

**작성일**: 2025-11-27  
**상태**: Section 1 완료, Section 2-5 진행 예정

