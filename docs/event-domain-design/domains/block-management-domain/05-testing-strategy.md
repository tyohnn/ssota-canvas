# Testing Strategy: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + QA  
**작성일**: 2025-10-19  
**버전**: v1.0

**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**Technical Specification 참조**: `04-technical-specification.md`  
**다음 단계**: TDD Implementation

---

> **가이드 참조**: `docs/event-domain-design/guide/05-testing-strategy-guide.md`  
> **작성 시점**: Technical Specification 완료 후, TDD Implementation 시작 전  
> **목적**: Technical Specification의 수도코드를 바탕으로 체계적인 테스트 전략 수립

---

## 📊 Testing Strategy Overview

### 도메인 테스트 전략 요약

Block Management Domain의 테스트 전략은 블록 생명주기 관리 (생성, 수정, 삭제)와 Canvas Management Domain과의 연동을 중심으로 설계됩니다. Value Object부터 E2E 테스트까지 체계적인 테스트 계층을 구축하여 도메인 로직의 정확성과 시스템 안정성을 보장합니다.

### Process Model 연결점

- **입력**: `02-process-model.md` - 1개 주요 시나리오 (Block 생성 및 관리)
- **입력**: `04-technical-specification.md` - 1개 주요 Aggregate (BlockAggregate)
- **출력**: Unit/Integration/E2E 테스트 케이스

### 커버리지 목표 요약

```
전체 코드 커버리지: 85% 이상
- Unit Tests:       70%  (25-30개)
- Integration Tests: 25%  (8-12개)
- E2E Tests:        5%   (3-4개)
```

---

## 🗺️ Process Model → Test 매핑

### Scenario 0: Block 생성 및 관리

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: CreateBlockCommand | Unit | BlockAggregate.createBlock() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: UpdateBlockCommand | Unit | BlockAggregate.updateBlockType() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: DeleteBlockCommand | Unit | BlockAggregate.deleteBlock() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Block Manager | Integration | BlockManagementService 통합 테스트 | ⭐️⭐️⭐️⭐️⭐️ |
| Repository: BlockRepository | Integration | DB 연동 및 RLS 정책 테스트 | ⭐️⭐️⭐️⭐️ |
| Server Actions | Integration | createBlockAction, updateBlockAction, deleteBlockAction | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 | E2E | 블록 생성 → 수정 → 삭제 시나리오 | ⭐️⭐️⭐️⭐️⭐️ |

---

## 🧪 Unit Tests 전략

### 1. Value Objects 테스트

#### BlockId VO
```typescript
describe('BlockId Value Object', () => {
  describe('생성자', () => {
    it('유효한 UUID로 생성되어야 한다', () => {
      const id = new BlockId('123e4567-e89b-12d3-a456-426614174000');
      expect(id.value).toBe('123e4567-e89b-12d3-a456-426614174000');
    })
    
    it('잘못된 UUID 형식에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new BlockId('invalid-uuid')).toThrow(BlockManagementError);
    })
    
    it('빈 문자열은 허용하지 않아야 한다', () => {
      expect(() => new BlockId('')).toThrow(BlockManagementError);
    })
    
    it('null이나 undefined는 허용하지 않아야 한다', () => {
      expect(() => new BlockId(null as any)).toThrow(BlockManagementError);
      expect(() => new BlockId(undefined as any)).toThrow(BlockManagementError);
    })
  })
  
  describe('equals', () => {
    it('동일한 UUID를 가진 BlockId는 같다고 판정되어야 한다', () => {
      const id1 = new BlockId('123e4567-e89b-12d3-a456-426614174000');
      const id2 = new BlockId('123e4567-e89b-12d3-a456-426614174000');
      expect(id1.equals(id2)).toBe(true);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 모든 Block 관련 작업의 핵심 식별자로 사용

#### BlockType VO
```typescript
describe('BlockType Value Object', () => {
  describe('생성자', () => {
    it('지원되는 블록 타입으로 생성되어야 한다', () => {
      const validTypes = ['text', 'image', 'code', 'page', 'shape', 'todo'];
      validTypes.forEach(type => {
        const blockType = new BlockType(type);
        expect(blockType.value).toBe(type);
      });
    })
    
    it('지원되지 않는 타입에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new BlockType('invalid-type')).toThrow(BlockManagementError);
    })
  })
  
  describe('schema validation', () => {
    it('각 타입별 메타데이터 스키마를 반환해야 한다', () => {
      const textType = new BlockType('text');
      const schema = textType.getMetadataSchema();
      expect(schema).toBeDefined();
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 블록 타입별 메타데이터 검증의 핵심

#### Metadata VO
```typescript
describe('Metadata Value Object', () => {
  describe('생성자', () => {
    it('유효한 JSON 객체로 생성되어야 한다', () => {
      const metadata = new Metadata({ title: 'Test', content: 'Hello' });
      expect(metadata.value).toEqual({ title: 'Test', content: 'Hello' });
    })
    
    it('null이나 빈 객체는 허용되어야 한다', () => {
      const emptyMetadata = new Metadata({});
      const nullMetadata = new Metadata(null);
      expect(emptyMetadata.value).toEqual({});
      expect(nullMetadata.value).toBeNull();
    })
  })
  
  describe('validation', () => {
    it('블록 타입별 스키마에 맞는 메타데이터를 검증해야 한다', () => {
      const textMetadata = new Metadata({ content: 'Hello' });
      const blockType = new BlockType('text');
      expect(() => textMetadata.validateSchema(blockType)).not.toThrow();
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️

---

### 2. Entities 테스트

#### Block Entity
```typescript
describe('Block Entity', () => {
  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      const block = Block.create(
        BlockId.generate(),
        '123e4567-e89b-12d3-a456-426614174000',
        new BlockType('text'),
        new Metadata({ content: 'Hello' })
      );
      
      expect(block.id).toBeDefined();
      expect(block.workspaceId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(block.type.value).toBe('text');
      expect(block.metadata.value).toEqual({ content: 'Hello' });
    })
    
    it('생성 시점과 수정 시점이 기록되어야 한다', () => {
      const block = Block.create(/* ... */);
      expect(block.createdAt).toBeInstanceOf(Date);
      expect(block.updatedAt).toBeInstanceOf(Date);
      expect(block.deletedAt).toBeNull();
    })
  })
  
  describe('updateBlockType', () => {
    it('새로운 타입으로 변경되어야 한다', () => {
      const block = Block.create(/* ... */);
      const newType = new BlockType('image');
      
      block.updateBlockType(newType);
      
      expect(block.type.value).toBe('image');
      expect(block.updatedAt.getTime()).toBeGreaterThan(block.createdAt.getTime());
    })
    
    it('메타데이터가 새 타입 스키마에 맞지 않으면 예외를 발생시켜야 한다', () => {
      const block = Block.create(/* text with content metadata */);
      const imageType = new BlockType('image');
      
      expect(() => block.updateBlockType(imageType)).toThrow(BlockManagementError);
    })
  })
  
  describe('delete', () => {
    it('소프트 삭제로 deletedAt이 설정되어야 한다', () => {
      const block = Block.create(/* ... */);
      
      block.delete();
      
      expect(block.deletedAt).toBeInstanceOf(Date);
      expect(block.isDeleted()).toBe(true);
    })
    
    it('이미 삭제된 블록은 다시 삭제할 수 없다', () => {
      const block = Block.create(/* ... */);
      block.delete();
      
      expect(() => block.delete()).toThrow(BlockManagementError);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️

---

### 3. Aggregates 테스트

#### BlockAggregate
```typescript
describe('BlockAggregate', () => {
  describe('createBlock', () => {
    it('새 블록을 생성하고 BlockCreated 이벤트를 발행해야 한다', () => {
      const aggregate = new BlockAggregate(/* ... */);
      const command = new CreateBlockCommand({
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        blockType: 'text',
        initialMetadata: { content: 'Hello' }
      });
      
      const result = aggregate.createBlock(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);
      expect(aggregate.getUncommittedEvents()[0]).toBeInstanceOf(BlockCreatedEvent);
    })
    
    it('잘못된 워크스페이스 ID에 대해 예외를 발생시켜야 한다', () => {
      const aggregate = new BlockAggregate(/* ... */);
      const command = new CreateBlockCommand({
        workspaceId: 'invalid-workspace',
        blockType: 'text'
      });
      
      expect(() => aggregate.createBlock(command)).toThrow(WorkspaceAccessDeniedError);
    })
  })
  
  describe('updateBlockType', () => {
    it('블록 타입을 변경하고 BlockTypeChanged 이벤트를 발행해야 한다', () => {
      const aggregate = new BlockAggregate(/* existing block */);
      const command = new UpdateBlockCommand({
        blockId: 'block-id',
        blockType: 'image'
      });
      
      const result = aggregate.updateBlockType(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toContainEqual(
        expect.objectContaining({ type: 'BlockTypeChanged' })
      );
    })
    
    it('삭제된 블록은 수정할 수 없다', () => {
      const aggregate = new BlockAggregate(/* deleted block */);
      
      expect(() => aggregate.updateBlockType(/* command */)).toThrow(BlockManagementError);
    })
  })
  
  describe('deleteBlock', () => {
    it('블록을 소프트 삭제하고 BlockDeleted 이벤트를 발행해야 한다', () => {
      const aggregate = new BlockAggregate(/* ... */);
      const command = new DeleteBlockCommand({ blockId: 'block-id' });
      
      const result = aggregate.deleteBlock(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(aggregate.block.isDeleted()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toContainEqual(
        expect.objectContaining({ type: 'BlockDeleted' })
      );
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 - Sequence 1, 2, 3

---

## 🔗 Integration Tests 전략

### 1. Repository 통합 테스트

#### BlockRepository Integration Tests
```typescript
describe('BlockRepository Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  })
  
  describe('save', () => {
    it('Block Aggregate를 데이터베이스에 저장해야 한다', async () => {
      const repository = new DrizzleBlockRepository(db);
      const block = Block.create(/* ... */);
      
      await repository.save(block);
      
      const savedBlock = await repository.findById(block.id);
      expect(savedBlock).toBeDefined();
      expect(savedBlock?.workspaceId).toBe(block.workspaceId);
    })
    
    it('RLS 정책이 적용되어야 한다', async () => {
      const repository = new DrizzleBlockRepository(db);
      const block = Block.create(/* 다른 워크스페이스 */);
      
      await expect(repository.save(block)).rejects.toThrow();
    })
  })
  
  describe('findById', () => {
    it('ID로 Block을 찾아야 한다', async () => {
      const repository = new DrizzleBlockRepository(db);
      const block = Block.create(/* ... */);
      await repository.save(block);
      
      const foundBlock = await repository.findById(block.id);
      
      expect(foundBlock).toBeDefined();
      expect(foundBlock?.id.value).toBe(block.id.value);
    })
    
    it('존재하지 않는 ID는 null을 반환해야 한다', async () => {
      const repository = new DrizzleBlockRepository(db);
      const nonExistentId = BlockId.generate();
      
      const result = await repository.findByI(nonExistentId);
      
      expect(result).toBeNull();
    })
    
    it('삭제된 블록은 찾지 않아야 한다 (soft delete)', async () => {
      const repository = new DrizzleBlockRepository(db);
      const block = Block.create(/* ... */);
      await repository.save(block);
      
      block.delete();
      await repository.save(block);
      
      const foundBlock = await repository.findById(block.id);
      expect(foundBlock).toBeNull();
    })
  })
  
  describe('findByWorkspace', () => {
    it('워크스페이스별 블록 목록을 반환해야 한다', async () => {
      const repository = new DrizzleBlockRepository(db);
      const workspaceId = 'workspace-1';
      
      // 여러 블록 생성 및 저장
      const blocks = [
        Block.create(/* workspace-1 */),
        Block.create(/* workspace-1 */),
        Block.create(/* workspace-2 */)
      ];
      
      for (const block of blocks) {
        await repository.save(block);
      }
      
      const workspaceBlocks = await repository.findByWorkspace(workspaceId);
      
      expect(workspaceBlocks).toHaveLength(2);
      expect(workspaceBlocks.every(b => b.workspaceId === workspaceId)).toBe(true);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**테스트 환경**: 테스트용 Supabase 인스턴스 또는 로컬 PostgreSQL

---

### 2. Service 통합 테스트

#### BlockManagementService Integration Tests
```typescript
describe('BlockManagementService Integration Tests', () => {
  let service: BlockManagementService;
  let mockRepository: jest.Mocked<BlockRepository>;
  let mockACL: jest.Mocked<WorkspaceManagementACL>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockACL = createMockACL();
    service = new BlockManagementService(mockRepository, mockACL);
  })

  describe('createBlock', () => {
    it('정상 플로우를 완료해야 한다', async () => {
      const command = new CreateBlockCommand({
        workspaceId: 'valid-workspace',
        blockType: 'text',
        initialMetadata: { content: 'Hello' }
      });
      
      mockACL.validateWorkspaceAccess.mockResolvedValue(Result.ok());
      mockRepository.save.mockResolvedValue();
      
      const result = await service.createBlock(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    })
    
    it('워크스페이스 접근 권한이 없으면 실패해야 한다', async () => {
      const command = new CreateBlockCommand({
        workspaceId: 'unauthorized-workspace',
        blockType: 'text'
      });
      
      mockACL.validateWorkspaceAccess.mockResolvedValue(
        Result.err(new WorkspaceAccessDeniedError())
      );
      
      const result = await service.createBlock(command);
      
      expect(result.isError()).toBe(true);
      expect(result.error).toBeInstanceOf(WorkspaceAccessDeniedError);
    })
  })

  describe('updateBlock', () => {
    it('트랜잭션이 올바르게 동작해야 한다', async () => {
      const command = new UpdateBlockCommand({
        blockId: 'existing-block',
        blockType: 'image'
      });
      
      const existingBlock = Block.create(/* ... */);
      mockRepository.findById.mockResolvedValue(existingBlock);
      mockACL.validateWorkspaceAccess.mockResolvedValue(Result.ok());
      mockRepository.save.mockResolvedValue();
      
      const result = await service.updateBlock(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.objectContaining({ value: 'image' }) })
      );
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 전체 플로우

---

### 3. Server Actions 통합 테스트

#### Block Management Server Actions
```typescript
describe('Server Actions Integration Tests', () => {
  let mockSupabase: jest.Mocked<any>;
  
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    jest.mocked(createClient).mockReturnValue(mockSupabase);
  })

  describe('createBlockAction', () => {
    it('인증된 사용자의 블록 생성을 수행해야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });
      
      const formData = new FormData();
      formData.append('workspaceId', 'workspace-123');
      formData.append('blockType', 'text');
      formData.append('initialMetadata', JSON.stringify({ content: 'Hello' }));
      
      const result = await createBlockAction(formData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.blockType).toBe('text');
    })
    
    it('미인증 사용자는 거부해야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });
      
      const formData = new FormData();
      formData.append('workspaceId', 'workspace-123');
      formData.append('blockType', 'text');
      
      await expect(createBlockAction(formData)).rejects.toThrow('Authentication required');
    })
    
    it('성공 시 Result.ok를 반환해야 한다', async () => {
      // 인증 및 권한 설정
      const formData = new FormData();
      formData.append('workspaceId', 'workspace-123');
      formData.append('blockType', 'text');
      
      const result = await createBlockAction(formData);
      
      expect(result).toBeDefined();
      expect(typeof result.id).toBe('string');
    })
  })

  describe('updateBlockAction', () => {
    it('트랜잭션 플로우를 수행해야 한다', async () => {
      const formData = new FormData();
      formData.append('blockId', 'block-123');
      formData.append('blockType', 'image');
      
      const result = await updateBlockAction(formData);
      
      expect(result).toBeDefined();
    })
  })

  describe('deleteBlockAction', () => {
    it('소프트 삭제를 수행해야 한다', async () => {
      const formData = new FormData();
      formData.append('blockId', 'block-123');
      
      await deleteBlockAction(formData);
      
      // 검증: 블록이 삭제되었지만 물리적으로는 존재해야 함 (soft delete)
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: Server Actions는 클라이언트와의 주요 접점

---

## 🎭 E2E Tests 전략

### 1. 블록 생성 시나리오 (Scenario 0 - Sequence 1)

```typescript
test('사용자가 새로운 텍스트 블록을 생성한다', async ({ page }) => {
  // Given: 사용자가 블록 관리 페이지에 접속한 상태
  await page.goto('/blocks');
  await expect(page.locator('[data-testid="block-list"]')).toBeVisible();
  
  // When: 새 블록 생성 버튼을 클릭
  await page.click('[data-testid="create-block-button"]');
  
  // Then: 블록 타입 선택 다이얼로그가 표시된다
  await expect(page.locator('[data-testid="block-type-selector"]')).toBeVisible();
  
  // When: 텍스트 블록 타입을 선택
  await page.click('[data-testid="block-type-text"]');
  
  // Then: 블록이 생성되고 BlockListView에 표시된다
  await expect(page.locator('[data-testid="block-item"]').first()).toBeVisible();
  await expect(page.locator('[data-testid="block-item"]').first()).toContainText('text');
  
  // When: 생성된 블록을 클릭
  await page.click('[data-testid="block-item"]').first();
  
  // Then: 블록 편집 화면으로 이동한다
  await expect(page.locator('[data-testid="block-editor"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 - Sequence 1

---

### 2. 블록 수정 시나리오 (Scenario 0 - Sequence 2)

```typescript
test('사용자가 블록 정보를 수정한다', async ({ page }) => {
  // Given: 기존 블록이 존재하는 상태
  await page.goto('/blocks');
  await expect(page.locator('[data-testid="block-item"]')).toBeVisible();
  
  // When: 블록의 편집 버튼을 클릭
  await page.click('[data-testid="edit-block-button"]');
  
  // Then: 블록 편집 폼이 표시된다
  await expect(page.locator('[data-testid="block-editor"]')).toBeVisible();
  
  // When: 블록 타입을 변경하고 저장
  await page.selectOption('[data-testid="block-type-select"]', 'image');
  await page.fill('[data-testid="metadata-editor"]', JSON.stringify({ url: 'test.jpg' }));
  await page.click('[data-testid="save-block-button"]');
  
  // Then: 변경사항이 저장되고 목록에 반영된다
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="block-item"]')).toContainText('image');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 - Sequence 2

---

### 3. 블록 삭제 시나리오 (Scenario 0 - Sequence 3)

```typescript
test('사용자가 블록을 삭제한다', async ({ page }) => {
  // Given: 기존 블록이 존재하는 상태
  await page.goto('/blocks');
  await expect(page.locator('[data-testid="block-item"]')).toBeVisible();
  
  // When: 블록의 삭제 버튼을 클릭
  await page.click('[data-testid="delete-block-button"]');
  
  // Then: 삭제 확인 다이얼로그가 표시된다
  await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
  
  // When: 삭제 확인
  await page.click('[data-testid="confirm-delete-button"]');
  
  // Then: 블록이 목록에서 사라진다 (소프트 삭제)
  await expect(page.locator('[data-testid="block-item"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 - Sequence 3

---

### 4. 에러 시나리오

```typescript
test('권한이 없는 워크스페이스에서 블록 생성 시 에러가 표시된다', async ({ page }) => {
  // Given: 권한이 없는 워크스페이스에서 블록 생성 시도
  await page.goto('/blocks?workspaceId=unauthorized-workspace');
  
  // When: 새 블록 생성 시도
  await page.click('[data-testid="create-block-button"]');
  await page.click('[data-testid="block-type-text"]');
  
  // Then: 에러 메시지가 표시된다
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-message"]')).toContainText(
    '워크스페이스 접근 권한이 없습니다'
  );
})
```

**테스트 우선순위**: ⭐️⭐️⭐️

---

## 📈 커버리지 목표 및 TDD 사이클

### 레이어별 커버리지 목표

| 레이어 | 목표 커버리지 | 우선순위 |
|--------|--------------|---------|
| Value Objects | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Entities | 95% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Aggregates | 90% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| Services | 85% 이상 | ⭐️⭐️⭐️⭐️ |
| Repositories | 80% 이상 | ⭐️⭐️⭐️⭐️ |
| Server Actions | 85% 이상 | ⭐️⭐️⭐️⭐️⭐️ |
| UI Components | 70% 이상 | ⭐️⭐️⭐️ |

### 전체 커버리지 목표

```
전체 코드 커버리지: 85% 이상
- Branches: 80% 이상
- Functions: 85% 이상
- Lines: 85% 이상
- Statements: 85% 이상
```

### TDD 구현 순서

```markdown
### Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
1. BlockId VO → RED-GREEN-REFACTOR
2. BlockType VO → RED-GREEN-REFACTOR
3. Metadata VO → RED-GREEN-REFACTOR

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. Block Entity → RED-GREEN-REFACTOR

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. BlockAggregate → RED-GREEN-REFACTOR

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. DrizzleBlockRepository (통합 테스트) → RED-GREEN-REFACTOR

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. BlockManagementService (통합 테스트) → RED-GREEN-REFACTOR

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. createBlockAction (통합 테스트) → RED-GREEN-REFACTOR
2. updateBlockAction (통합 테스트) → RED-GREEN-REFACTOR
3. deleteBlockAction (통합 테스트) → RED-GREEN-REFACTOR

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. 블록 생성 시나리오
2. 블록 수정 시나리오
3. 블록 삭제 시나리오
```

### TDD 사이클 예시

**BlockId 구현 예시**:

```typescript
// 1. RED: 테스트 먼저 작성
describe('BlockId', () => {
  it('유효한 UUID로 생성되어야 한다', () => {
    const id = new BlockId('123e4567-e89b-12d3-a456-426614174000');
    expect(id.value).toBe('123e4567-e89b-12d3-a456-426614174000');
  })
})

// 실행: FAIL (BlockId 클래스 없음)

// 2. GREEN: 최소 구현
export class BlockId {
  constructor(public readonly value: string) {}
}

// 실행: PASS

// 3. REFACTOR: 검증 로직 추가
export class BlockId {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new BlockManagementError('Invalid UUID format');
    }
  }
  
  private isValid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }
  
  equals(other: BlockId): boolean {
    return this.value === other.value;
  }
}

// 실행: PASS (기존 테스트 통과 + 새 테스트 추가)
```

---

## ⚙️ 테스트 도구 및 설정

### Unit & Integration Tests
- **프레임워크**: Vitest
- **Assertion**: expect (Vitest 내장)
- **Mock**: vi (Vitest 내장)
- **커버리지**: v8
- **설정 파일**: `vitest.config.ts`

### E2E Tests
- **프레임워크**: Playwright
- **브라우저**: Chromium, Firefox, WebKit
- **스크린샷**: 실패 시 자동 캡처
- **비디오**: 실패 시 자동 녹화
- **설정 파일**: `playwright.config.ts`

### 테스트 데이터베이스
- **로컬**: PostgreSQL (Docker)
- **CI/CD**: Supabase 테스트 인스턴스
- **정리 전략**: 각 테스트 후 데이터 완전 삭제 (`cleanDatabase()`)

### Canvas Domain 연동 테스트
- **DB JOIN 테스트**: Canvas에서 Block 조회 쿼리 성능 테스트
- **RLS 정책 테스트**: 워크스페이스별 데이터 격리 확인
- **소프트 삭제 호환성**: 삭제된 블록이 Canvas에서 올바르게 필터링되는지 확인

---

## ✅ 검증 체크리스트

### 일관성 검증
- [x] Process Model의 모든 시나리오가 테스트 케이스로 매핑되었는가? (Scenario 0 - 3개 Sequence)
- [x] Technical Specification의 모든 Aggregate가 테스트 계획에 포함되었는가? (BlockAggregate)
- [x] 핵심 불변식이 테스트로 검증 가능한가? (워크스페이스 격리, 메타데이터 스키마)

### 완전성 검증
- [x] 모든 Happy Path가 커버되는가? (생성, 수정, 삭제)
- [x] 주요 에러 시나리오가 테스트되는가? (권한 없음, 잘못된 입력, 삭제된 블록)
- [x] 경계값 테스트가 포함되어 있는가? (UUID 형식, 블록 타입 enum, 메타데이터 스키마)
- [x] 커버리지 목표를 달성할 수 있는가? (85% 이상)

### 실용성 검증
- [x] 테스트는 독립적으로 실행 가능한가? (각 테스트 후 DB 정리)
- [x] 테스트는 빠르게 실행되는가? (Unit < 100ms, Integration < 1s)
- [x] 테스트는 반복 실행해도 동일한 결과를 내는가? (결정적 테스트)
- [x] 테스트 실패 시 원인을 명확히 알 수 있는가? (명확한 에러 메시지)

### Canvas Domain 연동 검증
- [x] Block Management 테스트가 Canvas 연동을 고려하는가?
- [x] DB JOIN 성능 테스트가 포함되어 있는가?
- [x] 소프트 삭제 호환성 테스트가 있는가?
- [x] RLS 정책이 올바르게 작동하는가?

---

## 🚀 다음 단계

이 Testing Strategy 문서를 기반으로 다음 단계를 진행하세요:

### TDD Implementation
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 코드 + 테스트 코드
- **내용**:
  - RED-GREEN-REFACTOR 사이클 적용
  - 커버리지 목표 달성
  - Canvas Management Domain 연동 테스트

---

**문서 작성 완료 후**:
- [ ] 시니어개발자 리뷰 완료
- [ ] QA 리뷰 완료 (있는 경우)
- [ ] Technical Specification과의 일관성 확인
- [ ] Canvas Management Domain 연동 검증
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

이 Testing Strategy를 따라 **Canvas Management Domain과 완벽하게 연동되는 Block Management Domain**을 높은 품질로 구현할 수 있습니다! 🎉
