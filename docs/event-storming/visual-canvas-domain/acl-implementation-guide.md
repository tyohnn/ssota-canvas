# Visual Canvas Domain - ACL Implementation Guide

## 🚀 구현 순서

### Phase 1: 기본 구조 설정

#### 1. 폴더 구조 생성
```bash
src/
├── domains/visual-canvas/
│   ├── entities/
│   │   ├── Block.ts
│   │   ├── Edge.ts
│   │   └── Position.ts
│   ├── value-objects/
│   │   ├── BlockId.ts
│   │   ├── BlockType.ts
│   │   └── BlockContent.ts
│   ├── aggregates/
│   │   ├── BlockAggregate.ts
│   │   └── CanvasAggregate.ts
│   └── repositories/
│       └── BlockRepository.ts
│
└── infrastructure/canvas/
    ├── adapters/
    │   ├── CanvasAdapter.ts        # Interface
    │   └── ReactFlowAdapter.ts     # Implementation
    ├── translators/
    │   ├── BlockToNodeTranslator.ts
    │   └── NodeToCommandTranslator.ts
    └── mappers/
        └── EventMapper.ts
```

#### 2. Core Interfaces 정의

```typescript
// src/infrastructure/canvas/adapters/CanvasAdapter.ts
export interface CanvasAdapter {
  initialize(config: CanvasConfig): Promise<void>;
  dispose(): void;
  
  // Data loading
  loadData(data: CanvasData): Promise<void>;
  
  // Event subscriptions
  on(event: CanvasEventType, handler: Function): void;
  off(event: CanvasEventType, handler: Function): void;
  
  // Commands
  execute(command: CanvasCommand): Promise<void>;
  
  // State queries
  getState(): CanvasState;
}

export interface CanvasData {
  blocks: Array<{
    id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    data: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: any;
  }>;
}
```

---

### Phase 2: Translator 구현

#### 1. Block to Node Translator

```typescript
// src/infrastructure/canvas/translators/BlockToNodeTranslator.ts
import { Block, BlockPosition } from '@/domains/visual-canvas/entities';
import { Component } from '@/domains/component-system/entities';
import type { Node as ReactFlowNode } from '@xyflow/react';

export class BlockToNodeTranslator {
  translate(
    block: Block,
    position: BlockPosition,
    component?: Component  // 컴포넌트 인스턴스인 경우
  ): ReactFlowNode {
    // 컴포넌트 인스턴스인 경우 렌더링 시점에서 데이터 조합
    const finalData = this.combineBlockData(block, component);
    
    return {
      id: block.id.value,
      type: this.mapBlockType(block.type, block.block_subtype),
      position: {
        x: position.x,
        y: position.y
      },
      data: {
        label: finalData.getDisplayText(),
        blockData: {
          id: block.id.value,
          type: block.type.value,
          subtype: block.block_subtype,
          content: block.content.toJSON(),
          // 컴포넌트 인스턴스 전용 데이터
          componentId: block.component_id,
          styleOverrides: block.style_overrides,
          finalProperties: finalData.properties
        }
      },
      width: position.width,
      height: position.height,
      selected: false,
      draggable: !block.isLocked,
      selectable: true
    };
  }

  private mapBlockType(blockType: BlockType, subtype: string): string {
    const typeMap: Record<string, string> = {
      'text': 'textNode',
      'image': 'imageNode',
      'video': 'videoNode',
      'shape': 'shapeNode',
      'page': 'pageNode',
      'component-instance': 'componentInstanceNode'
    };
    
    return typeMap[blockType.value] || 'defaultNode';
  }

  private combineBlockData(block: Block, component?: Component): any {
    if (!component || block.type !== 'component-instance') {
      return {
        getDisplayText: () => block.content.getDisplayText(),
        properties: {
          ...block.default_properties,
          ...block.custom_properties
        }
      };
    }

    // 컴포넌트 인스턴스: 렌더링 시점에서 데이터 조합
    return {
      getDisplayText: () => component.name || 'Component Instance',
      properties: {
        ...component.default_properties,
        ...component.custom_properties,
        ...component.style_properties,
        ...block.style_overrides  // 스타일만 오버라이드
      }
    };
  }
}
```

#### 2. Node to Command Translator

```typescript
// src/infrastructure/canvas/translators/NodeToCommandTranslator.ts
import { NodeChange, Connection } from '@xyflow/react';
import { 
  MoveBlockCommand, 
  CreateEdgeCommand 
} from '@/domains/visual-canvas/commands';

export class NodeToCommandTranslator {
  translateNodeChange(change: NodeChange): MoveBlockCommand | null {
    if (change.type !== 'position' || !change.position) {
      return null;
    }

    return new MoveBlockCommand({
      blockId: change.id,
      newPosition: {
        x: change.position.x,
        y: change.position.y
      },
      pageId: this.getCurrentPageId()
    });
  }

  translateConnection(connection: Connection): CreateEdgeCommand {
    return new CreateEdgeCommand({
      sourceBlockId: connection.source!,
      targetBlockId: connection.target!,
      sourceHandle: connection.sourceHandle || 'default',
      targetHandle: connection.targetHandle || 'default',
      pageId: this.getCurrentPageId()
    });
  }

  private getCurrentPageId(): string {
    // Workspace Structure Domain Context에서 현재 페이지 ID 가져오기
    // 실제 구현에서는 React Context나 Store에서 가져옴
    return useWorkspaceStructureContext().currentPageId;
  }
}
```

---

### Phase 3: React Flow Adapter 구현

```typescript
// src/infrastructure/canvas/adapters/ReactFlowAdapter.ts
import { 
  ReactFlowProvider, 
  ReactFlowInstance,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection
} from '@xyflow/react';
import { CanvasAdapter, CanvasData, CanvasCommand } from './CanvasAdapter';
import { BlockToNodeTranslator } from '../translators/BlockToNodeTranslator';
import { NodeToCommandTranslator } from '../translators/NodeToCommandTranslator';

export class ReactFlowAdapter implements CanvasAdapter {
  private instance: ReactFlowInstance | null = null;
  private blockTranslator = new BlockToNodeTranslator();
  private commandTranslator = new NodeToCommandTranslator();
  private eventHandlers = new Map<string, Set<Function>>();

  async initialize(config: CanvasConfig): Promise<void> {
    // React Flow 초기화 로직
    // Container에 ReactFlow 컴포넌트 마운트
  }

  async loadData(data: CanvasData): Promise<void> {
    if (!this.instance) throw new Error('Canvas not initialized');

    const nodes = data.blocks.map(block => ({
      id: block.id,
      type: 'default',
      position: block.position,
      data: block.data
    }));

    const edges = data.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep'
    }));

    this.instance.setNodes(nodes);
    this.instance.setEdges(edges);
  }

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // React Flow 이벤트 연결
    switch (event) {
      case 'nodeMove':
        this.setupNodeMoveHandler(handler);
        break;
      case 'edgeCreate':
        this.setupEdgeCreateHandler(handler);
        break;
      // ... 다른 이벤트들
    }
  }

  private setupNodeMoveHandler(handler: Function): void {
    const onNodesChange = (changes: NodeChange[]) => {
      changes
        .filter(change => change.type === 'position')
        .forEach(change => {
          const command = this.commandTranslator.translateNodeChange(change);
          if (command) {
            handler(command);
          }
        });
    };

    // React Flow에 핸들러 등록
    if (this.instance) {
      this.instance.onNodesChange = onNodesChange;
    }
  }

  async execute(command: CanvasCommand): Promise<void> {
    switch (command.type) {
      case 'addNode':
        await this.addNode(command.data);
        break;
      case 'removeNode':
        await this.removeNode(command.data.nodeId);
        break;
      case 'updateNode':
        await this.updateNode(command.data);
        break;
      // ... 다른 명령들
    }
  }

  dispose(): void {
    // React Flow 정리
    this.instance = null;
    this.eventHandlers.clear();
  }
}
```

---

### Phase 4: 도메인 서비스와 통합

```typescript
// src/domains/visual-canvas/services/CanvasService.ts
import { CanvasAdapter } from '@/infrastructure/canvas/adapters/CanvasAdapter';
import { BlockRepository } from '../repositories/BlockRepository';
import { ComponentRepository } from '@/domains/component-system/repositories/ComponentRepository';

export class CanvasService {
  constructor(
    private adapter: CanvasAdapter,
    private blockRepository: BlockRepository,
    private componentRepository: ComponentRepository
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Adapter에서 오는 이벤트를 도메인 명령으로 변환
    this.adapter.on('nodeMove', async (command: MoveBlockCommand) => {
      try {
        const block = await this.blockRepository.findById(command.blockId);
        if (!block) throw new Error('Block not found');

        block.updatePosition(command.newPosition);
        await this.blockRepository.save(block);
        
        // EventBus 대신 직접 이벤트 반환
        return [new BlockMovedEvent({
          blockId: command.blockId,
          newPosition: command.newPosition
        })];
      } catch (error) {
        console.error('Failed to move block:', error);
        return [];
      }
    });

    // 스타일 오버라이드 처리 (단순화됨)
    this.adapter.on('styleOverride', async (command: OverrideStyleCommand) => {
      try {
        const block = await this.blockRepository.findById(command.blockId);
        if (!block || !block.component_id) {
          throw new Error('Block not found or not a component instance');
        }

        // 스타일 오버라이드만 업데이트 (간단한 JSON 업데이트)
        block.updateStyleOverrides(command.styleOverrides);
        await this.blockRepository.save(block);

        return [new BlockStyleOverrideEvent({
          blockId: command.blockId,
          styleOverrides: command.styleOverrides
        })];
      } catch (error) {
        console.error('Failed to override style:', error);
        return [];
      }
    });
  }

  async loadCanvas(pageId: string): Promise<void> {
    // 블럭과 컴포넌트 정보를 함께 조회
    const blocks = await this.blockRepository.findByPage(pageId);
    const positions = await this.blockRepository.findPositions(pageId);
    
    // 컴포넌트 인스턴스들의 컴포넌트 정보 조회
    const componentIds = blocks
      .filter(block => block.component_id)
      .map(block => block.component_id);
    
    const components = componentIds.length > 0 
      ? await this.componentRepository.findByIds(componentIds)
      : [];

    const canvasData = this.prepareCanvasData(blocks, positions, components);
    await this.adapter.loadData(canvasData);
  }

  private prepareCanvasData(blocks: Block[], positions: BlockPosition[], components: Component[]): CanvasData {
    const componentMap = new Map(components.map(c => [c.id, c]));
    
    return {
      blocks: blocks.map(block => {
        const position = positions.find(p => p.block_id === block.id);
        const component = block.component_id ? componentMap.get(block.component_id) : undefined;
        
        return {
          id: block.id,
          position: { x: position?.x || 0, y: position?.y || 0 },
          size: { width: position?.width || 200, height: position?.height || 100 },
          data: {
            block,
            component,  // 컴포넌트 정보 포함
            finalProperties: this.combineProperties(block, component)
          }
        };
      }),
      edges: [] // 엣지 로직은 동일
    };
  }

  private combineProperties(block: Block, component?: Component): any {
    if (!component) {
      return {
        ...block.default_properties,
        ...block.custom_properties
      };
    }

    // 렌더링 시점에서 컴포넌트 속성 + 스타일 오버라이드 조합
    return {
      ...component.default_properties,
      ...component.custom_properties,
      ...component.style_properties,
      ...block.style_overrides  // 스타일만 오버라이드
    };
  }
}
```

---

### Phase 5: Cross-Domain Integration

#### Page Context Integration
```typescript
// src/infrastructure/canvas/adapters/PageContextAdapter.ts
import { useWorkspaceStructure } from '@/domains/workspace-structure/hooks';

export class PageContextAdapter {
  constructor(private workspaceStructureService: WorkspaceStructureService) {}

  async validatePageAccess(pageId: string, userId: string): Promise<boolean> {
    return await this.workspaceStructureService.hasPageAccess(pageId, userId);
  }

  async getPageMetadata(pageId: string): Promise<PageMetadata> {
    return await this.workspaceStructureService.getPageMetadata(pageId);
  }

  getCurrentPageId(): string {
    return useWorkspaceStructure().currentPageId;
  }
}
```

#### Cross-Domain Event Processing
```typescript
// src/integration/canvas-workspace-integration.ts
export class CanvasWorkspaceIntegration {
  constructor(
    private canvasService: CanvasService,
    private pageContextAdapter: PageContextAdapter
  ) {}

  async handleWorkspaceEvent(event: WorkspaceStructureEvent): Promise<void> {
    switch (event.type) {
      case 'PageCreated':
        await this.canvasService.initializeCanvas(event.pageId);
        break;
      
      case 'PageDeleted':
        await this.canvasService.cleanupCanvas(event.pageId);
        break;
      
      case 'PageMoved':
        await this.canvasService.updateCanvasContext(
          event.pageId, 
          event.newWorkspaceId
        );
        break;
    }
  }
}
```

### Phase 6: React 컴포넌트 통합

```typescript
// src/presentation/components/canvas/VisualCanvas.tsx
import React, { useEffect, useRef } from 'react';
import { ReactFlowAdapter } from '@/infrastructure/canvas/adapters/ReactFlowAdapter';
import { CanvasService } from '@/domains/visual-canvas/services/CanvasService';
import { PageContextAdapter } from '@/infrastructure/canvas/adapters/PageContextAdapter';
import { useBlockRepository } from '@/hooks/useBlockRepository';
import { useWorkspaceStructure } from '@/domains/workspace-structure/hooks';

export function VisualCanvas({ pageId }: { pageId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<ReactFlowAdapter>();
  const serviceRef = useRef<CanvasService>();
  const blockRepository = useBlockRepository();

  useEffect(() => {
    if (!containerRef.current) return;

    // Adapter 초기화
    const adapter = new ReactFlowAdapter();
    adapter.initialize({
      container: containerRef.current,
      // ... 기타 설정
    });

    // Service 생성
    const service = new CanvasService(
      adapter,
      blockRepository,
      eventBus
    );

    adapterRef.current = adapter;
    serviceRef.current = service;

    // 캔버스 데이터 로드
    service.loadCanvas(pageId);

    return () => {
      adapter.dispose();
    };
  }, [pageId]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* React Flow가 여기에 렌더링됨 */}
    </div>
  );
}
```

---

## 🧪 테스트 전략

### 1. Unit Tests

```typescript
// BlockToNodeTranslator.test.ts
describe('BlockToNodeTranslator', () => {
  it('should translate block to node correctly', () => {
    const block = Block.create({
      type: BlockType.Text,
      content: new TextContent('Hello')
    });
    
    const position = new BlockPosition(100, 200, 150, 50);
    const translator = new BlockToNodeTranslator();
    
    const node = translator.translate(block, position);
    
    expect(node.id).toBe(block.id.value);
    expect(node.position).toEqual({ x: 100, y: 200 });
    expect(node.data.label).toBe('Hello');
  });
});
```

### 2. Integration Tests

```typescript
// CanvasService.integration.test.ts
describe('CanvasService Integration', () => {
  it('should handle block move from adapter', async () => {
    const mockAdapter = new MockCanvasAdapter();
    const service = new CanvasService(
      mockAdapter,
      blockRepository,
      eventBus
    );

    // 블럭 이동 시뮬레이션
    await mockAdapter.simulateNodeMove('block-1', { x: 300, y: 400 });

    // 결과 검증
    const updatedBlock = await blockRepository.findById('block-1');
    expect(updatedBlock.position).toEqual({ x: 300, y: 400 });
  });
});
```

---

## 📊 성능 고려사항

### 1. Debouncing
```typescript
// 드래그 중 과도한 업데이트 방지
const debouncedMove = debounce((command: MoveBlockCommand) => {
  this.handleBlockMove(command);
}, 100);
```

### 2. Batch Updates
```typescript
// 여러 변경사항을 모아서 처리
const batchProcessor = new BatchProcessor<DomainCommand>();
batchProcessor.process(commands => {
  // 한 번에 처리
});
```

### 3. Virtual Scrolling
대량의 노드 처리를 위한 가상 스크롤링 고려

---

## ✅ 구현 체크리스트 (단순화됨)

- [ ] **Phase 1**: 기본 구조 설정
  - [ ] 폴더 구조 생성
  - [ ] Core interfaces 정의
  
- [ ] **Phase 2**: Translator 구현 (컴포넌트 통합)
  - [ ] BlockToNodeTranslator (컴포넌트 데이터 조합 포함)
  - [ ] NodeToCommandTranslator
  - [ ] 스타일 오버라이드 처리 로직
  
- [ ] **Phase 3**: React Flow Adapter (단순화)
  - [ ] 초기화 로직
  - [ ] 이벤트 핸들링
  - [ ] 명령 실행
  - [ ] 컴포넌트 인스턴스 렌더링 지원
  
- [ ] **Phase 4**: 도메인 서비스 통합 (EventBus 제거)
  - [ ] CanvasService (직접 이벤트 반환)
  - [ ] BlockRepository 연동
  - [ ] ComponentRepository 연동 (단순 조회)
  - [ ] 렌더링 시점 데이터 조합 로직
  
- [ ] **Phase 5**: Cross-Domain Integration (단순화)
  - [ ] PageContextAdapter 구현
  - [ ] Workspace Structure 이벤트 처리
  - [ ] 컴포넌트 데이터 조회 및 조합
  
- [ ] **Phase 6**: React 컴포넌트
  - [ ] VisualCanvas 컴포넌트
  - [ ] Context 설정
  - [ ] 스타일 오버라이드 UI 구현
  
- [ ] **Phase 7**: 테스트 (단순화)
  - [ ] Unit tests (데이터 조합 로직)
  - [ ] Integration tests (컴포넌트 인스턴스 렌더링)
  - [ ] E2E tests (스타일 오버라이드)

---

## 🎯 단순화된 구현 포인트

### ✅ 핵심 단순화 사항
1. **EventBus 제거**: 직접 이벤트 반환으로 단순화
2. **복잡한 동기화 제거**: 렌더링 시점에서 프론트엔드 조합
3. **스타일만 오버라이드**: 복잡한 속성 추적 제거
4. **블럭 테이블 통합**: 별도 인스턴스 테이블 없이 blocks 확장
5. **단순한 Repository**: ComponentRepository는 단순 조회만

### ⚡ 성능 최적화 포인트
1. **배치 조회**: 컴포넌트 정보를 한 번에 조회
2. **프론트엔드 캐싱**: 조합된 데이터를 프론트에서 캐시
3. **필요시에만 조합**: 컴포넌트 인스턴스만 조합 로직 적용

### 🔧 구현 난이도
- **기존 복잡한 설계**: 높음 (EventBus, 복잡한 동기화, 다중 테이블)
- **단순화된 설계**: 낮음 (직접 조합, 단순 조회, 통합 테이블)
