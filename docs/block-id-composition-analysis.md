# BlockNodeData의 ID 구성 분석

**작성일**: 2025-01-XX  
**분석 범위**: Block 생성 및 마운트 플로우, React Flow ACL

## 📋 개요

`BlockNodeData`에는 세 가지 ID 관련 필드가 있습니다:
- `blockMountId`: 블록 마운트 ID (페이지에 배치된 인스턴스 ID)
- `blockId`: 실제 블록 ID (블록 데이터 ID)
- React Flow Node의 `id`: React Flow에서 사용하는 노드 ID

이 문서는 이 세 가지 ID가 어떻게 생성되고 구성되는지 추적합니다.

---

## 🔍 ID 생성 플로우

### 1. Block 생성 시 `blockId` 생성

**위치**: `apps/web/src/domains/block-management/backend/services/block/lifecycle/create-block.service.ts`

```typescript
// 1. BlockId 생성 (UUID v4)
const command: CreateBlockCommand = {
  workspaceId,
  userId: safeUserId,
  blockId: BlockId.generate(), // ✅ 여기서 생성
  blockType,
  title: safeDto.title,
  initialProperties: safeDto.initialProperties,
  initialContent: safeDto.initialContent,
};

// 2. BlockAggregate 생성
const aggregate = BlockAggregate.create(command);
```

**생성 방식**:
- `BlockId.generate()` → `crypto.randomUUID()` (UUID v4)
- **용도**: `blocks` 테이블의 `id` 컬럼
- **특징**: 블록 데이터 자체의 고유 식별자

**관련 파일**:
- `apps/web/src/domains/block-management/shared/value-objects/block-id.vo.ts`
  ```typescript
  static generate(): BlockId {
    const uuid = crypto.randomUUID();
    return new BlockId(uuid);
  }
  ```

---

### 2. Block Mount 시 `blockMountId` 생성

**위치**: `apps/web/src/domains/canvas-management/backend/services/block-mount/create-and-mount-block.service.ts`

```typescript
// 1. Block 생성 (blockId 생성됨)
const blockResult = await createBlock(createBlockRequest, safeUserId, blockRepository);
const blockAggregate = blockResult.value;

// 2. BlockMountId 생성 (UUID v4)
const blockMountId = BlockMountId.generate(); // ✅ 여기서 생성

// 3. MountBlockCommand 생성
const mountBlockCommand: MountBlockCommand = {
  blockMountId, // ✅ blockMountId 사용
  pageId: pageIdVO,
  blockId: blockAggregate.getBlock().id, // ✅ 위에서 생성된 blockId 사용
  position: positionVO,
  size: sizeVO,
  viewMode,
  viewModeSizes,
  userId: safeUserId,
};

// 4. BlockMountAggregate 생성
const blockMountAggregate = BlockMountAggregate.mountBlock(mountBlockCommand);
```

**생성 방식**:
- `BlockMountId.generate()` → `crypto.randomUUID()` (UUID v4)
- **용도**: `block_mounts` 테이블의 `id` 컬럼
- **특징**: 페이지에 배치된 블록 인스턴스의 고유 식별자

**관련 파일**:
- `apps/web/src/domains/canvas-management/shared/value-objects/block-mount-id.vo.ts`
  ```typescript
  static generate(): BlockMountId {
    const uuid = crypto.randomUUID();
    return new BlockMountId(uuid);
  }
  ```

---

### 3. React Flow Node의 `id` 설정

**위치**: `apps/web/src/domains/canvas-management/frontend/acl/react-flow.acl.ts`

#### 3.1. DB에서 로드 시 변환

```typescript
export function toReactFlowNode(
  block: BlockView,
  blockMount: BlockMountView
): Node<BaseNodeData> {
  return {
    id: blockMount.blockMountId, // ✅ React Flow node ID = blockMountId
    type: block.blockType,
    position: blockMount.position,
    data: transformBlockViewToNodeData(block, blockMount.blockMountId),
    width: blockMount.size.width,
    height: blockMount.size.height,
    zIndex: blockMount.zOrder,
  };
}
```

#### 3.2. CanvasViewData에서 변환

```typescript
export function toReactFlowNodeFromCanvasView(
  block: CanvasViewData['blocks'][0]
): CustomNodeType {
  const node: Node<BaseNodeData> = {
    id: block.blockMountId, // ✅ React Flow node ID = blockMountId
    type: block.blockType,
    position: block.position,
    data: {
      blockMountId: block.blockMountId,
      blockId: block.blockId,
      // ... 기타 필드
    },
    // ...
  };
  return node as CustomNodeType;
}
```

**핵심 규칙**:
- **React Flow Node의 `id` = `blockMountId`**
- React Flow는 노드를 식별하기 위해 `id`를 사용하므로, `blockMountId`를 사용

---

### 4. BlockNodeData 구성

**위치**: `apps/web/src/domains/block-management/shared/types/block-data.types.ts`

```typescript
export interface BaseNodeData extends Record<string, unknown> {
  blockMountId: string;  // ✅ block_mounts.id (페이지에 배치된 인스턴스 ID)
  blockId: string;       // ✅ blocks.id (실제 블록 데이터 ID)
  blockType: BlockType;
  title: string;
  viewMode: BlockViewModeValue;
  sizes?: ViewModeSizeMap;
  properties: BlockProperties<BlockType>;
  customProperties: CustomPropertyDefinition[];
  content?: unknown;
  createdAt?: string;
  updatedAt?: string;
  createdByProfile: UserProfile;
}
```

**변환 함수**: `transformBlockViewToNodeData`

```typescript
export function transformBlockViewToNodeData(
  blockView: BlockView,
  blockMountId: string
): BaseNodeData {
  return {
    blockMountId,                    // ✅ blockMountId 전달받음
    blockId: blockView.blockId,      // ✅ BlockView에서 blockId 가져옴
    blockType: blockView.blockType,
    title: blockView.title,
    properties: cleanNestedProperties(blockView.properties),
    customProperties: blockView.customProperties,
    content: blockView.content,
    viewMode: blockView.viewMode,
    sizes: blockView.viewModeSizes,
    createdAt: blockView.createdAt,
    updatedAt: blockView.updatedAt,
    createdByProfile: blockView.createdByProfile || { /* ... */ },
  };
}
```

---

## 🔄 전체 플로우 다이어그램

```
1. 사용자 액션: 블록 생성 요청
   ↓
2. createAndMountBlockAction (Server Action)
   ↓
3. createAndMountBlock (Service)
   ├─→ createBlock (Block Service)
   │   ├─→ BlockId.generate() → blockId 생성 (UUID v4)
   │   ├─→ BlockAggregate.create(command)
   │   └─→ blockRepository.create(block)
   │
   └─→ BlockMountId.generate() → blockMountId 생성 (UUID v4)
       ├─→ BlockMountAggregate.mountBlock(command)
       └─→ blockMountRepository.create(blockMount)
   ↓
4. 서버 응답: BlockCreatedAndMountedDTO
   {
     blockId: "uuid-block-id",        // ✅ blocks.id
     blockMountId: "uuid-mount-id",   // ✅ block_mounts.id
     // ... 기타 필드
   }
   ↓
5. React Flow ACL 변환
   toReactFlowNodeFromCanvasView()
   {
     id: blockMountId,                 // ✅ React Flow Node ID
     data: {
       blockMountId: blockMountId,     // ✅ block_mounts.id
       blockId: blockId,               // ✅ blocks.id
       // ... 기타 필드
     }
   }
   ↓
6. React Flow Store에 추가
   - Node.id = blockMountId
   - Node.data.blockMountId = blockMountId
   - Node.data.blockId = blockId
```

---

## 📊 ID 관계 정리

| ID 타입 | 생성 위치 | 생성 방식 | DB 테이블 | React Flow Node ID | BlockNodeData 필드 |
|---------|----------|----------|-----------|-------------------|-------------------|
| `blockId` | `createBlock` 서비스 | `BlockId.generate()` | `blocks.id` | ❌ | `data.blockId` |
| `blockMountId` | `createAndMountBlock` 서비스 | `BlockMountId.generate()` | `block_mounts.id` | ✅ `node.id` | `data.blockMountId` |

---

## 🎯 핵심 포인트

### 1. **blockId vs blockMountId**

- **`blockId`**: 블록 데이터 자체의 ID
  - 하나의 블록은 여러 페이지에 마운트될 수 있음
  - 블록의 속성, 콘텐츠 등을 식별
  
- **`blockMountId`**: 페이지에 배치된 블록 인스턴스의 ID
  - 같은 블록을 다른 페이지에 마운트하면 다른 `blockMountId` 생성
  - 페이지 내 위치, 크기, z-order 등을 식별

### 2. **React Flow Node ID**

- **React Flow Node의 `id` = `blockMountId`**
- React Flow는 노드를 식별하기 위해 `id`를 사용
- `getNode(nodeId)` 호출 시 `blockMountId`를 전달해야 함

### 3. **use-block-property-update.ts에서의 사용**

```typescript
const updatePropertyImmediate = useCallback(
  <T>(
    blockId: string,        // ⚠️ 실제로는 blockMountId를 받아야 함
    propertyPath: string,
    value: T,
    blockData: BlockNodeData
  ): void => {
    // React Flow node id는 blockMountId (blockId와 다를 수 있음)
    const nodeId = blockData.blockMountId; // ✅ blockMountId 사용
    
    // Get latest data
    const latestNode = getNode(nodeId); // ✅ blockMountId로 노드 조회
    const currentBlockData = (latestNode?.data as BlockNodeData) || blockData;
    // ...
  }
);
```

**주의사항**:
- 함수 파라미터 이름이 `blockId`이지만, 실제로는 `blockMountId`를 사용해야 함
- React Flow의 `getNode()`는 `blockMountId`를 받아야 함

---

## 📝 요약

1. **`blockId`**: 
   - `BlockId.generate()`로 생성 (UUID v4)
   - `blocks` 테이블의 `id`
   - 블록 데이터 자체의 식별자

2. **`blockMountId`**:
   - `BlockMountId.generate()`로 생성 (UUID v4)
   - `block_mounts` 테이블의 `id`
   - 페이지에 배치된 블록 인스턴스의 식별자
   - **React Flow Node의 `id`로 사용됨**

3. **React Flow Node의 `id`**:
   - `blockMountId`와 동일
   - `toReactFlowNode()` 함수에서 설정
   - `getNode(nodeId)` 호출 시 `blockMountId` 사용

4. **BlockNodeData**:
   - `blockMountId`: React Flow Node ID (block_mounts.id)
   - `blockId`: 실제 블록 ID (blocks.id)
   - 두 ID는 서로 다른 목적을 가짐
