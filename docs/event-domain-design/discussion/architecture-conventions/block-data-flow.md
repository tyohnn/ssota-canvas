# Block 데이터 흐름 분석

## 📊 스키마 구조

### 1. DB Schema (Drizzle)

```typescript
// blocks 테이블: 블록 정의 (재사용 가능)
blocks {
  id: uuid                    // 실제 블록 ID
  workspace_id: uuid
  block_type: enum
  properties: jsonb           // 블록의 실제 데이터
  custom_properties: jsonb
  created_by: uuid
}

// block_mounts 테이블: 페이지에 배치된 블록 인스턴스
block_mounts {
  id: uuid                    // 블록 마운트 ID (인스턴스)
  page_id: uuid               // 어느 페이지에 배치됐는지
  block_id: uuid              // 어떤 블록인지 (blocks.id FK)
  position_x: decimal
  position_y: decimal
  size_width: decimal
  size_height: decimal
  z_order: integer
}
```

**관계**:
- 하나의 `block`은 여러 페이지에 `mount` 될 수 있음 (1:N)
- 각 `block_mount`는 특정 `page`에 배치된 블록의 인스턴스

---

## 🔄 데이터 변환 Flow

### Step 1: DB → BlockView

```typescript
// Query에서 가져온 데이터
{
  blockId: 'block_abc',           // blocks.id
  blockMountId: 'mount_123',      // block_mounts.id
  blockType: 'image',
  properties: { imageUrl: '...' },
  position: { x: 100, y: 200 },
  size: { width: 300, height: 200 },
}
```

### Step 2: BlockView → React Flow Node

```typescript
// react-flow.acl.ts: toReactFlowNodeFromCanvasView()
export function toReactFlowNodeFromCanvasView(
  block: CanvasViewData['blocks'][0],
  additionalData: { pageId, orgId, workspaceId }
): CustomNodeType {
  return {
    id: block.blockMountId,        // ⚠️ React Flow Node ID = blockMountId
    type: block.blockType,
    position: block.position,
    data: {
      blockMountId: block.blockMountId,  // mount_123
      blockId: block.blockId,             // block_abc
      blockType: block.blockType,
      properties: block.properties,
      pageId: additionalData.pageId,      // page_789
      orgId: additionalData.orgId,        // org_456
      workspaceId: additionalData.workspaceId,  // ws_def
    },
    width: block.size.width,
    height: block.size.height,
  };
}
```

### Step 3: React Flow Node → Component Props

```typescript
// ImageBlock Component
export const ImageBlock = memo(function ImageBlock({
  id,        // React Flow Node ID = blockMountId (mount_123)
  data,      // Node의 data
}: NodeProps) {
  const nodeData = data as ImageBlockNodeData;
  
  // nodeData 구조:
  {
    blockMountId: 'mount_123',   // block_mounts.id
    blockId: 'block_abc',         // blocks.id ⭐ 실제 블록 ID
    blockType: 'image',
    properties: { imageUrl: '...' },
    pageId: 'page_789',
    orgId: 'org_456',
    workspaceId: 'ws_def',
  }
});
```

### Step 4: Editor Panel

```typescript
// EditorPanel Component
export function EditorPanel({ 
  blockId,    // React Flow Node ID = blockMountId (mount_123)
  isOpen 
}: EditorPanelProps) {
  // React Flow Store에서 노드 가져오기
  const blockNode = nodes.find(node => node.id === blockId);
  const blockData = blockNode?.data;
  
  // blockData 구조:
  {
    blockMountId: 'mount_123',   // 마운트 ID
    blockId: 'block_abc',         // ⭐ 실제 블록 ID
    orgId: 'org_456',
    workspaceId: 'ws_def',
    pageId: 'page_789',
    properties: { ... }
  }
  
  return (
    <BlockPropertiesSection 
      blockId={blockId}        // mount_123 (React Flow Node ID)
      blockData={blockData}     // 전체 data 객체
    />
  );
}
```

### Step 5: Property Renderer

```typescript
// BlockPropertiesSection
<BlockPropertyRenderer
  blockId={blockId}           // mount_123 (React Flow용)
  propertyKey="imageUrl"
  propertyDef={...}
  value={value}
  blockData={blockData}       // ⭐ 여기에 실제 blockId 포함
/>

// BlockPropertyRenderer
<ImageUploadProperty
  value={value}
  propertyDef={propertyDef}
  onChange={handleValueChange}
  blockData={blockData}       // ⭐ 전체 context 전달
/>

// ImageUploadProperty에서 사용
blockData = {
  blockMountId: 'mount_123',
  blockId: 'block_abc',       // ⭐ 실제 블록 ID
  orgId: 'org_456',
  workspaceId: 'ws_def',
  pageId: 'page_789',
}
```

---

## 🎯 핵심 포인트

### **ID 구분**

| 이름 | 값 | 의미 | 용도 |
|------|-----|------|------|
| **blockMountId** | `mount_123` | 페이지에 배치된 블록 인스턴스 ID | React Flow Node ID, 위치/크기 관리 |
| **blockId** | `block_abc` | 실제 블록 ID | 블록 데이터, Storage path |

### **Storage Path에 사용할 ID**

```typescript
// ✅ 올바른 사용: blockData.blockId (실제 블록 ID)
const path = `images/${orgId}/${workspaceId}/${pageId}/${blockData.blockId}/${timestamp}-${uuid}.jpg`;
//                                                       ^^^^^^^^^^^^^^^^^^
//                                                       block_abc (실제 블록 ID)

// ❌ 잘못된 사용: blockData.blockMountId (마운트 인스턴스 ID)
const path = `images/${orgId}/${workspaceId}/${pageId}/${blockData.blockMountId}/${timestamp}-${uuid}.jpg`;
//                                                       ^^^^^^^^^^^^^^^^^^^^^^
//                                                       mount_123 (마운트 ID)
```

### **왜 blockId를 사용해야 하나?**

**시나리오**: 같은 이미지 블록이 여러 페이지에 배치됨

```
Block (block_abc):
  properties: { imageUrl: 'cat.jpg' }

Mount 1 (mount_123):
  page_id: page_A
  block_id: block_abc
  position: (100, 200)

Mount 2 (mount_456):
  page_id: page_B
  block_id: block_abc    // 같은 블록!
  position: (300, 400)
```

**Storage Path**:
- ✅ `images/org/ws/page_A/block_abc/cat.jpg` (blockId 사용)
  - 페이지 A에서 업로드
  - 페이지 B에서도 동일한 이미지 표시
  
- ❌ `images/org/ws/page_A/mount_123/cat.jpg` (blockMountId 사용)
  - 페이지 A에서만 보임
  - 페이지 B에서는 다른 경로이므로 이미지 없음

---

## 🔄 현재 코드 상태

### **ImageUploadProperty의 BlockContext**

```typescript
interface BlockContext {
  orgId: string;
  workspaceId: string;
  pageId: string;
  blockId: string;    // ⭐ 이것은 blockData.blockId (실제 블록 ID)
}

// 사용 시
await upload({
  bucket: StorageBucket.CANVAS_ASSETS,
  file,
  orgId: blockData?.orgId,
  workspaceId: blockData?.workspaceId,
  pageId: blockData?.pageId,
  blockId: blockData?.blockId,    // ⭐ 실제 블록 ID (block_abc)
});
```

### **ImageBlock에서**

```typescript
const nodeData = data as ImageBlockNodeData;

await upload({
  orgId: nodeData.orgId,
  workspaceId: nodeData.workspaceId,
  pageId: nodeData.pageId,
  blockId: nodeData.blockId,    // ⭐ 실제 블록 ID
});
```

---

## ✅ 결론

### **명확한 타입 정의 필요**

현재 `BlockContext`의 `blockId`는 **실제 블록 ID** (`blocks.id`)입니다.

혼동을 피하기 위해 주석을 추가하거나, 더 명확한 네이밍을 고려할 수 있습니다:

```typescript
interface BlockContext {
  orgId: string;
  workspaceId: string;
  pageId: string;
  blockId: string;  // blocks.id (NOT block_mounts.id)
}

// 또는 더 명확하게
interface StorageContext {
  orgId: string;
  workspaceId: string;
  pageId: string;
  actualBlockId: string;  // 실제 블록 ID (blocks.id)
}
```

### **데이터 흐름 요약**

```
DB (blocks + block_mounts)
    ↓
BlockView (blockId + blockMountId)
    ↓
React Flow Node (id = blockMountId, data.blockId = blockId)
    ↓
Component Props (id = blockMountId, data = BaseNodeData)
    ↓
Editor Panel (blockId = blockMountId, blockData = node.data)
    ↓
Property Renderer (blockData.blockId = 실제 블록 ID)
    ↓
ImageUploadProperty (blockData.blockId → Storage path)
```

---

## 📝 권장 사항

현재 구현은 **올바르게** 동작합니다:
- ✅ `blockData.blockId`는 실제 블록 ID (`blocks.id`)
- ✅ Storage path에 사용하기 적합
- ✅ 같은 블록이 여러 페이지에 마운트되어도 같은 이미지 공유

다만, 타입과 주석을 명확하게 하여 혼동을 방지하는 것이 좋습니다.

