# Testing Strategy: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + QA  
**작성일**: 2025-10-22  
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

Block Management Domain의 테스트 전략은 **유연한 속성 시스템**과 **블록 타입별 특화 기능(Tools)**을 중심으로 설계됩니다. Canvas Management Domain과의 연동을 고려한 체계적인 테스트 계층을 구축하여 도메인 로직의 정확성과 시스템 안정성을 보장합니다.

### Process Model 연결점

- **입력**: `02-process-model.md` - 5개 주요 시나리오 (Canvas 연동, Custom Properties, Property Values, Media Upload, Block Tools)
- **입력**: `04-technical-specification.md` - 1개 주요 Aggregate (BlockAggregate) + 14개 Commands + 20개 Events
- **출력**: Unit/Integration/E2E 테스트 케이스

### 커버리지 목표 요약

```
전체 코드 커버리지: 85% 이상
- Unit Tests:       70%  (25-30개)
- Integration Tests: 20%  (8-12개)
- E2E Tests:        10%  (3-4개)
```

---

## 🗺️ Process Model → Test 매핑

### Scenario 0: Canvas Management 연동

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: CreateBlockCommand | Unit | BlockAggregate.createBlock() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: UpdateBlockCommand | Unit | BlockAggregate.updateBlockType() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: DeleteBlockCommand | Unit | BlockAggregate.deleteBlock() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Block Manager | Integration | BlockManagementService 통합 테스트 | ⭐️⭐️⭐️⭐️⭐️ |
| Repository: BlockRepository | Integration | DB 연동 및 RLS 정책 테스트 | ⭐️⭐️⭐️⭐️ |
| Server Actions | Integration | createBlockAction, updateBlockAction, deleteBlockAction | ⭐️⭐️⭐️⭐️⭐️ |
| 전체 플로우 | E2E | 블록 생성 → 수정 → 삭제 시나리오 | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 1: Custom Properties 관리

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: AddCustomPropertyCommand | Unit | BlockAggregate.addCustomProperty() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: ChangePropertyTypeCommand | Unit | BlockAggregate.changePropertyType() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: DeleteCustomPropertyCommand | Unit | BlockAggregate.deleteCustomProperty() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Property Manager | Integration | 커스텀 속성 관리 통합 테스트 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | E2E | 커스텀 속성 추가 → 편집 → 삭제 시나리오 | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 2: Property Values 관리

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: SetPropertyValueCommand | Unit | BlockAggregate.setPropertyValue() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: ClearPropertyValueCommand | Unit | BlockAggregate.clearPropertyValue() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Property Value Manager | Integration | 속성 값 관리 통합 테스트 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | E2E | 속성 값 설정 → 변경 → 초기화 시나리오 | ⭐️⭐️⭐️⭐️ |

### Scenario 3: Media Upload 처리

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: UploadMediaCommand | Unit | BlockAggregate.uploadMedia() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: DeleteMediaFileCommand | Unit | BlockAggregate.deleteMediaFile() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Media Upload Manager | Integration | SupabaseStorageAdapter 통합 테스트 | ⭐️⭐️⭐️⭐️ |
| ACL: SupabaseStorageAdapter | Integration | 파일 업로드/삭제 ACL 테스트 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | E2E | 미디어 업로드 → 삭제 시나리오 | ⭐️⭐️⭐️⭐️⭐️ |

### Scenario 4: Block Tools 실행

| Process Model 요소 | 테스트 종류 | 테스트 케이스 | 우선순위 |
|-------------------|------------|-------------|---------|
| Command: ExecuteBlockToolCommand | Unit | BlockAggregate.executeBlockTool() | ⭐️⭐️⭐️⭐️⭐️ |
| Command: ExecuteBlockToolByAICommand | Unit | BlockAggregate.executeBlockToolByAI() | ⭐️⭐️⭐️⭐️⭐️ |
| System: Block Tool Executor | Integration | 블록 툴 실행 통합 테스트 | ⭐️⭐️⭐️⭐️ |
| 전체 플로우 | E2E | 블록 툴 실행 → 결과 처리 시나리오 | ⭐️⭐️⭐️⭐️⭐️ |

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
      const validTypes = ['youtube', 'python', 'markdown', 'image', 'file', 'link', 'shape', 'page_mention', 'latex', 'github_pr', 'react_component'];
      validTypes.forEach(type => {
        const blockType = new BlockType(type);
        expect(blockType.value).toBe(type);
      });
    })
    
    it('지원되지 않는 타입에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new BlockType('invalid-type')).toThrow(BlockManagementError);
    })
  })
  
  describe('getMetadataSchema', () => {
    it('각 타입별 메타데이터 스키마를 반환해야 한다', () => {
      const youtubeType = new BlockType('youtube');
      const schema = youtubeType.getMetadataSchema();
      expect(schema).toBeDefined();
      expect(schema.required).toContain('youtubeUrl');
    })
  })
  
  describe('getDefaultProperties', () => {
    it('각 타입별 기본 속성을 반환해야 한다', () => {
      const youtubeType = new BlockType('youtube');
      const defaultProps = youtubeType.getDefaultProperties();
      expect(defaultProps).toBeDefined();
      expect(defaultProps).toHaveProperty('youtubeUrl');
    })
  })
  
  describe('getAvailableTools', () => {
    it('각 타입별 사용 가능한 툴 목록을 반환해야 한다', () => {
      const youtubeType = new BlockType('youtube');
      const tools = youtubeType.getAvailableTools();
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 블록 타입별 메타데이터 검증의 핵심

#### PropertyType VO
```typescript
describe('PropertyType Value Object', () => {
  describe('생성자', () => {
    it('지원되는 속성 타입으로 생성되어야 한다', () => {
      const validTypes = ['text', 'url', 'email', 'phone', 'select', 'status', 'datetime', 'media', 'profile'];
      validTypes.forEach(type => {
        const propertyType = new PropertyType(type);
        expect(propertyType.value).toBe(type);
      });
    })
    
    it('지원되지 않는 타입에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new PropertyType('invalid-type')).toThrow(BlockManagementError);
    })
  })
  
  describe('validateValue', () => {
    it('각 타입별 값 검증을 수행해야 한다', () => {
      const textType = new PropertyType('text');
      expect(() => textType.validateValue('Hello World')).not.toThrow();
      
      const emailType = new PropertyType('email');
      expect(() => emailType.validateValue('test@example.com')).not.toThrow();
      expect(() => emailType.validateValue('invalid-email')).toThrow(BlockManagementError);
    })
  })
  
  describe('getDefaultOptions', () => {
    it('각 타입별 기본 옵션을 반환해야 한다', () => {
      const selectType = new PropertyType('select');
      const options = selectType.getDefaultOptions();
      expect(options).toBeDefined();
      expect(Array.isArray(options)).toBe(true);
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 커스텀 속성 타입별 검증의 핵심

#### MediaURL VO
```typescript
describe('MediaURL Value Object', () => {
  describe('생성자', () => {
    it('유효한 URL로 생성되어야 한다', () => {
      const url = new MediaURL('https://example.com/image.jpg');
      expect(url.value).toBe('https://example.com/image.jpg');
    })
    
    it('잘못된 URL 형식에 대해 예외를 발생시켜야 한다', () => {
      expect(() => new MediaURL('invalid-url')).toThrow(BlockManagementError);
    })
  })
  
  describe('validateFileType', () => {
    it('지원되는 파일 타입을 검증해야 한다', () => {
      const imageUrl = new MediaURL('https://example.com/image.jpg');
      expect(() => imageUrl.validateFileType('image')).not.toThrow();
      expect(() => imageUrl.validateFileType('video')).toThrow(BlockManagementError);
    })
  })
  
  describe('validateFileSize', () => {
    it('파일 크기 제한을 검증해야 한다', () => {
      const imageUrl = new MediaURL('https://example.com/image.jpg');
      expect(() => imageUrl.validateFileSize(5 * 1024 * 1024)).not.toThrow(); // 5MB
      expect(() => imageUrl.validateFileSize(15 * 1024 * 1024)).toThrow(BlockManagementError); // 15MB
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**이유**: 미디어 파일 관리의 핵심

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
        new BlockType('youtube'),
        { youtubeUrl: 'https://youtube.com/watch?v=123' }
      );
      
      expect(block.id).toBeDefined();
      expect(block.workspaceId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(block.blockType.value).toBe('youtube');
      expect(block.properties).toEqual({ youtubeUrl: 'https://youtube.com/watch?v=123' });
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
      const block = Block.create(/* youtube block */);
      const newType = new BlockType('python');
      
      block.updateBlockType(newType);
      
      expect(block.blockType.value).toBe('python');
      expect(block.updatedAt.getTime()).toBeGreaterThan(block.createdAt.getTime());
    })
    
    it('메타데이터가 새 타입 스키마에 맞지 않으면 예외를 발생시켜야 한다', () => {
      const block = Block.create(/* youtube with youtubeUrl */);
      const imageType = new BlockType('image');
      
      expect(() => block.updateBlockType(imageType)).toThrow(BlockManagementError);
    })
  })
  
  describe('addCustomProperty', () => {
    it('커스텀 속성을 추가해야 한다', () => {
      const block = Block.create(/* ... */);
      
      block.addCustomProperty('description', 'text', {});
      
      expect(block.customProperties).toHaveProperty('description');
      expect(block.customProperties.description.type).toBe('text');
    })
    
    it('최대 50개의 커스텀 속성 제한을 확인해야 한다', () => {
      const block = Block.create(/* ... */);
      
      // 50개 속성 추가
      for (let i = 0; i < 50; i++) {
        block.addCustomProperty(`prop${i}`, 'text', {});
      }
      
      expect(() => block.addCustomProperty('prop51', 'text', {})).toThrow(BlockManagementError);
    })
  })
  
  describe('setPropertyValue', () => {
    it('속성 값을 설정해야 한다', () => {
      const block = Block.create(/* ... */);
      block.addCustomProperty('description', 'text', {});
      
      block.setPropertyValue('description', 'Important note');
      
      expect(block.properties).toHaveProperty('description', 'Important note');
    })
    
    it('속성 타입에 맞지 않는 값은 예외를 발생시켜야 한다', () => {
      const block = Block.create(/* ... */);
      block.addCustomProperty('email', 'email', {});
      
      expect(() => block.setPropertyValue('email', 'invalid-email')).toThrow(BlockManagementError);
    })
  })
  
  describe('uploadMedia', () => {
    it('미디어 파일을 업로드해야 한다', async () => {
      const block = Block.create(/* ... */);
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      await block.uploadMedia(mockFile, 'image');
      
      expect(block.properties).toHaveProperty('image');
      expect(block.properties.image).toMatch(/^https:\/\/.*\.jpg$/);
    })
    
    it('파일 크기 제한을 확인해야 한다', async () => {
      const block = Block.create(/* ... */);
      const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      await expect(block.uploadMedia(largeFile, 'image')).rejects.toThrow(BlockManagementError);
    })
  })
  
  describe('executeBlockTool', () => {
    it('블록 툴을 실행해야 한다', async () => {
      const block = Block.create(/* youtube block */);
      
      const result = await block.executeBlockTool('getComments', {});
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    })
    
    it('지원되지 않는 툴은 예외를 발생시켜야 한다', async () => {
      const block = Block.create(/* youtube block */);
      
      await expect(block.executeBlockTool('invalidTool', {})).rejects.toThrow(BlockManagementError);
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
      const aggregate = new BlockAggregate();
      const command = new CreateBlockCommand({
        workspaceId: '123e4567-e89b-12d3-a456-426614174000',
        blockType: 'youtube',
        initialMetadata: { youtubeUrl: 'https://youtube.com/watch?v=123' }
      });
      
      const result = aggregate.createBlock(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toHaveLength(1);
      expect(aggregate.getUncommittedEvents()[0]).toBeInstanceOf(BlockCreatedEvent);
    })
    
    it('잘못된 워크스페이스 ID에 대해 예외를 발생시켜야 한다', () => {
      const aggregate = new BlockAggregate();
      const command = new CreateBlockCommand({
        workspaceId: 'invalid-workspace',
        blockType: 'youtube'
      });
      
      expect(() => aggregate.createBlock(command)).toThrow(WorkspaceAccessDeniedError);
    })
  })
  
  describe('addCustomProperty', () => {
    it('커스텀 속성을 추가하고 CustomPropertyAdded 이벤트를 발행해야 한다', () => {
      const aggregate = new BlockAggregate(/* existing block */);
      const command = new AddCustomPropertyCommand({
        blockId: 'block-id',
        name: 'description',
        type: 'text',
        options: {}
      });
      
      const result = aggregate.addCustomProperty(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toContainEqual(
        expect.objectContaining({ type: 'CustomPropertyAdded' })
      );
    })
    
    it('최대 50개 속성 제한을 확인해야 한다', () => {
      const aggregate = new BlockAggregate(/* block with 50 properties */);
      const command = new AddCustomPropertyCommand({
        blockId: 'block-id',
        name: 'prop51',
        type: 'text'
      });
      
      expect(() => aggregate.addCustomProperty(command)).toThrow(BlockManagementError);
    })
  })
  
  describe('setPropertyValue', () => {
    it('속성 값을 설정하고 PropertyValueSet 이벤트를 발행해야 한다', () => {
      const aggregate = new BlockAggregate(/* block with custom property */);
      const command = new SetPropertyValueCommand({
        blockId: 'block-id',
        propertyId: 'description',
        value: 'Important note'
      });
      
      const result = aggregate.setPropertyValue(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toContainEqual(
        expect.objectContaining({ type: 'PropertyValueSet' })
      );
    })
    
    it('속성 타입에 맞지 않는 값은 예외를 발생시켜야 한다', () => {
      const aggregate = new BlockAggregate(/* block with email property */);
      const command = new SetPropertyValueCommand({
        blockId: 'block-id',
        propertyId: 'email',
        value: 'invalid-email'
      });
      
      expect(() => aggregate.setPropertyValue(command)).toThrow(BlockManagementError);
    })
  })
  
  describe('uploadMedia', () => {
    it('미디어를 업로드하고 ImageUploadedToStorage 이벤트를 발행해야 한다', async () => {
      const aggregate = new BlockAggregate(/* ... */);
      const command = new UploadMediaCommand({
        blockId: 'block-id',
        file: new File(['content'], 'test.jpg', { type: 'image/jpeg' }),
        propertyId: 'image'
      });
      
      const result = await aggregate.uploadMedia(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toContainEqual(
        expect.objectContaining({ type: 'ImageUploadedToStorage' })
      );
    })
  })
  
  describe('executeBlockTool', () => {
    it('블록 툴을 실행하고 BlockToolExecutedByUser 이벤트를 발행해야 한다', async () => {
      const aggregate = new BlockAggregate(/* youtube block */);
      const command = new ExecuteBlockToolCommand({
        blockId: 'block-id',
        toolType: 'getComments',
        parameters: {}
      });
      
      const result = await aggregate.executeBlockTool(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(aggregate.getUncommittedEvents()).toContainEqual(
        expect.objectContaining({ type: 'BlockToolExecutedByUser' })
      );
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
**Process Model 매핑**: Scenario 0-4 모든 시나리오

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
      
      const result = await repository.findById(nonExistentId);
      
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
  
  describe('JSONB 쿼리', () => {
    it('properties JSONB 컬럼으로 검색해야 한다', async () => {
      const repository = new DrizzleBlockRepository(db);
      const block = Block.create(/* youtube block */);
      block.setPropertyValue('youtubeUrl', 'https://youtube.com/watch?v=123');
      await repository.save(block);
      
      const results = await repository.findBlocksByPropertyValue('youtubeUrl', 'https://youtube.com/watch?v=123');
      
      expect(results).toHaveLength(1);
      expect(results[0].id.value).toBe(block.id.value);
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
  let mockStorageAdapter: jest.Mocked<SupabaseStorageAdapter>;
  let mockAuthAdapter: jest.Mocked<SupabaseAuthAdapter>;
  let mockWorkspaceACL: jest.Mocked<WorkspaceManagementACL>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockStorageAdapter = createMockStorageAdapter();
    mockAuthAdapter = createMockAuthAdapter();
    mockWorkspaceACL = createMockWorkspaceACL();
    service = new BlockManagementService(
      mockRepository, 
      mockStorageAdapter, 
      mockAuthAdapter, 
      mockWorkspaceACL
    );
  })

  describe('createBlock', () => {
    it('정상 플로우를 완료해야 한다', async () => {
      const command = new CreateBlockCommand({
        workspaceId: 'valid-workspace',
        blockType: 'youtube',
        initialMetadata: { youtubeUrl: 'https://youtube.com/watch?v=123' }
      });
      
      mockWorkspaceACL.validateWorkspaceAccess.mockResolvedValue(Result.ok());
      mockRepository.save.mockResolvedValue();
      
      const result = await service.createBlock(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    })
    
    it('워크스페이스 접근 권한이 없으면 실패해야 한다', async () => {
      const command = new CreateBlockCommand({
        workspaceId: 'unauthorized-workspace',
        blockType: 'youtube'
      });
      
      mockWorkspaceACL.validateWorkspaceAccess.mockResolvedValue(
        Result.err(new WorkspaceAccessDeniedError())
      );
      
      const result = await service.createBlock(command);
      
      expect(result.isError()).toBe(true);
      expect(result.error).toBeInstanceOf(WorkspaceAccessDeniedError);
    })
  })

  describe('addCustomProperty', () => {
    it('커스텀 속성 추가 플로우를 완료해야 한다', async () => {
      const command = new AddCustomPropertyCommand({
        blockId: 'existing-block',
        name: 'description',
        type: 'text',
        options: {}
      });
      
      const existingBlock = Block.create(/* ... */);
      mockRepository.findById.mockResolvedValue(existingBlock);
      mockWorkspaceACL.validateWorkspaceAccess.mockResolvedValue(Result.ok());
      mockRepository.save.mockResolvedValue();
      
      const result = await service.addCustomProperty(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ 
          customProperties: expect.objectContaining({ description: expect.any(Object) })
        })
      );
    })
  })

  describe('uploadMedia', () => {
    it('미디어 업로드 플로우를 완료해야 한다', async () => {
      const command = new UploadMediaCommand({
        blockId: 'existing-block',
        file: new File(['content'], 'test.jpg', { type: 'image/jpeg' }),
        propertyId: 'image'
      });
      
      const existingBlock = Block.create(/* ... */);
      mockRepository.findById.mockResolvedValue(existingBlock);
      mockStorageAdapter.uploadFile.mockResolvedValue(Result.ok('https://storage.example.com/image.jpg'));
      mockRepository.save.mockResolvedValue();
      
      const result = await service.uploadMedia(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(mockStorageAdapter.uploadFile).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    })
  })

  describe('executeBlockTool', () => {
    it('블록 툴 실행 플로우를 완료해야 한다', async () => {
      const command = new ExecuteBlockToolCommand({
        blockId: 'youtube-block',
        toolType: 'getComments',
        parameters: {}
      });
      
      const youtubeBlock = Block.create(/* youtube block */);
      mockRepository.findById.mockResolvedValue(youtubeBlock);
      mockRepository.save.mockResolvedValue();
      
      const result = await service.executeBlockTool(command);
      
      expect(result.isSuccess()).toBe(true);
      expect(mockRepository.save).toHaveBeenCalled();
    })
  })
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0-4 전체 플로우

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
      formData.append('blockType', 'youtube');
      formData.append('initialMetadata', JSON.stringify({ youtubeUrl: 'https://youtube.com/watch?v=123' }));
      
      const result = await createBlockAction(formData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.blockType).toBe('youtube');
    })
    
    it('미인증 사용자는 거부해야 한다', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });
      
      const formData = new FormData();
      formData.append('workspaceId', 'workspace-123');
      formData.append('blockType', 'youtube');
      
      await expect(createBlockAction(formData)).rejects.toThrow('Authentication required');
    })
  })

  describe('manageCustomPropertyAction', () => {
    it('커스텀 속성 추가를 수행해야 한다', async () => {
      const formData = new FormData();
      formData.append('action', 'add');
      formData.append('blockId', 'block-123');
      formData.append('name', 'description');
      formData.append('type', 'text');
      
      const result = await manageCustomPropertyAction(formData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('description');
      expect(result.type).toBe('text');
    })
  })

  describe('manageMediaAction', () => {
    it('미디어 파일 업로드를 수행해야 한다', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('action', 'upload');
      formData.append('blockId', 'block-123');
      formData.append('file', file);
      
      const result = await manageMediaAction(formData);
      
      expect(result).toBeDefined();
      expect(result.url).toMatch(/^https:\/\/.*\.jpg$/);
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
test('사용자가 새로운 YouTube 블록을 생성한다', async ({ page }) => {
  // Given: 사용자가 블록 관리 페이지에 접속한 상태
  await page.goto('/blocks');
  await expect(page.locator('[data-testid="block-list"]')).toBeVisible();
  
  // When: 새 블록 생성 버튼을 클릭
  await page.click('[data-testid="create-block-button"]');
  
  // Then: 블록 타입 선택 다이얼로그가 표시된다
  await expect(page.locator('[data-testid="block-type-selector"]')).toBeVisible();
  
  // When: YouTube 블록 타입을 선택
  await page.click('[data-testid="block-type-youtube"]');
  
  // Then: YouTube URL 입력 폼이 표시된다
  await expect(page.locator('[data-testid="youtube-url-input"]')).toBeVisible();
  
  // When: YouTube URL을 입력하고 저장
  await page.fill('[data-testid="youtube-url-input"]', 'https://youtube.com/watch?v=123');
  await page.click('[data-testid="save-block-button"]');
  
  // Then: 블록이 생성되고 BlockListView에 표시된다
  await expect(page.locator('[data-testid="block-item"]').first()).toBeVisible();
  await expect(page.locator('[data-testid="block-item"]').first()).toContainText('youtube');
  
  // When: 생성된 블록을 클릭
  await page.click('[data-testid="block-item"]').first();
  
  // Then: 블록 편집 화면으로 이동한다
  await expect(page.locator('[data-testid="block-editor"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 0 - Sequence 1

---

### 2. 커스텀 속성 관리 시나리오 (Scenario 1)

```typescript
test('사용자가 블록에 커스텀 속성을 추가한다', async ({ page }) => {
  // Given: 기존 블록이 존재하는 상태
  await page.goto('/blocks');
  await expect(page.locator('[data-testid="block-item"]')).toBeVisible();
  
  // When: 블록의 편집 버튼을 클릭
  await page.click('[data-testid="edit-block-button"]');
  
  // Then: 블록 편집 폼이 표시된다
  await expect(page.locator('[data-testid="block-editor"]')).toBeVisible();
  
  // When: 커스텀 속성 추가 버튼을 클릭
  await page.click('[data-testid="add-custom-property-button"]');
  
  // Then: 속성 추가 폼이 표시된다
  await expect(page.locator('[data-testid="property-name-input"]')).toBeVisible();
  await expect(page.locator('[data-testid="property-type-select"]')).toBeVisible();
  
  // When: 속성 정보를 입력하고 저장
  await page.fill('[data-testid="property-name-input"]', 'description');
  await page.selectOption('[data-testid="property-type-select"]', 'text');
  await page.click('[data-testid="save-property-button"]');
  
  // Then: 커스텀 속성이 추가되고 속성 목록에 표시된다
  await expect(page.locator('[data-testid="custom-property-list"]')).toContainText('description');
  await expect(page.locator('[data-testid="custom-property-list"]')).toContainText('text');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 1 전체

---

### 3. 미디어 업로드 시나리오 (Scenario 3)

```typescript
test('사용자가 블록에 이미지를 업로드한다', async ({ page }) => {
  // Given: 기존 블록이 존재하는 상태
  await page.goto('/blocks');
  await expect(page.locator('[data-testid="block-item"]')).toBeVisible();
  
  // When: 블록의 편집 버튼을 클릭
  await page.click('[data-testid="edit-block-button"]');
  
  // Then: 블록 편집 폼이 표시된다
  await expect(page.locator('[data-testid="block-editor"]')).toBeVisible();
  
  // When: 미디어 업로드 버튼을 클릭
  await page.click('[data-testid="upload-media-button"]');
  
  // Then: 파일 선택 다이얼로그가 표시된다
  await expect(page.locator('[data-testid="file-input"]')).toBeVisible();
  
  // When: 이미지 파일을 선택
  const fileInput = page.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles('test-files/sample-image.jpg');
  
  // Then: 업로드 진행률이 표시된다
  await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
  
  // Then: 업로드가 완료되고 이미지가 표시된다
  await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  await expect(page.locator('[data-testid="uploaded-image"]')).toBeVisible();
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 3 전체

---

### 4. 블록 툴 실행 시나리오 (Scenario 4)

```typescript
test('사용자가 YouTube 블록의 툴을 실행한다', async ({ page }) => {
  // Given: YouTube 블록이 존재하는 상태
  await page.goto('/blocks');
  await expect(page.locator('[data-testid="block-item"]')).toBeVisible();
  
  // When: 블록의 툴 버튼을 클릭
  await page.click('[data-testid="block-tools-button"]');
  
  // Then: 사용 가능한 툴 목록이 표시된다
  await expect(page.locator('[data-testid="tool-list"]')).toBeVisible();
  await expect(page.locator('[data-testid="tool-list"]')).toContainText('댓글 가져오기');
  
  // When: '댓글 가져오기' 툴을 클릭
  await page.click('[data-testid="tool-get-comments"]');
  
  // Then: 툴 실행 확인 다이얼로그가 표시된다
  await expect(page.locator('[data-testid="tool-execution-dialog"]')).toBeVisible();
  
  // When: 실행 확인
  await page.click('[data-testid="confirm-tool-execution"]');
  
  // Then: 툴 실행이 시작되고 진행률이 표시된다
  await expect(page.locator('[data-testid="tool-progress"]')).toBeVisible();
  
  // Then: 툴 실행이 완료되고 결과가 표시된다
  await expect(page.locator('[data-testid="tool-result"]')).toBeVisible();
  await expect(page.locator('[data-testid="tool-result"]')).toContainText('댓글을 성공적으로 가져왔습니다');
})
```

**테스트 우선순위**: ⭐️⭐️⭐️⭐️⭐️  
**Process Model 매핑**: Scenario 4 전체

---

### 5. 에러 시나리오

```typescript
test('권한이 없는 워크스페이스에서 블록 생성 시 에러가 표시된다', async ({ page }) => {
  // Given: 권한이 없는 워크스페이스에서 블록 생성 시도
  await page.goto('/blocks?workspaceId=unauthorized-workspace');
  
  // When: 새 블록 생성 시도
  await page.click('[data-testid="create-block-button"]');
  await page.click('[data-testid="block-type-youtube"]');
  
  // Then: 에러 메시지가 표시된다
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-message"]')).toContainText(
    '워크스페이스 접근 권한이 없습니다'
  );
})

test('파일 크기 제한 초과 시 에러가 표시된다', async ({ page }) => {
  // Given: 블록 편집 화면
  await page.goto('/blocks');
  await page.click('[data-testid="edit-block-button"]');
  
  // When: 큰 파일을 업로드 시도
  const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
  const fileInput = page.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles(largeFile);
  
  // Then: 파일 크기 제한 에러가 표시된다
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="error-message"]')).toContainText(
    '파일 크기가 10MB를 초과합니다'
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
3. PropertyType VO → RED-GREEN-REFACTOR
4. MediaURL VO → RED-GREEN-REFACTOR

### Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
1. Block Entity → RED-GREEN-REFACTOR

### Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
1. BlockAggregate → RED-GREEN-REFACTOR

### Phase 4: Repository (⭐️⭐️⭐️⭐️)
1. BlockRepository (통합 테스트) → RED-GREEN-REFACTOR

### Phase 5: Service (⭐️⭐️⭐️⭐️)
1. BlockManagementService (통합 테스트) → RED-GREEN-REFACTOR

### Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
1. createBlockAction (통합 테스트) → RED-GREEN-REFACTOR
2. updateBlockAction (통합 테스트) → RED-GREEN-REFACTOR
3. deleteBlockAction (통합 테스트) → RED-GREEN-REFACTOR
4. manageCustomPropertyAction (통합 테스트) → RED-GREEN-REFACTOR
5. manageMediaAction (통합 테스트) → RED-GREEN-REFACTOR

### Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
1. 블록 생성 시나리오
2. 커스텀 속성 관리 시나리오
3. 미디어 업로드 시나리오
4. 블록 툴 실행 시나리오
5. 에러 시나리오
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
- [x] Process Model의 모든 시나리오가 테스트 케이스로 매핑되었는가? (Scenario 0-4 - 5개 시나리오)
- [x] Technical Specification의 모든 Aggregate가 테스트 계획에 포함되었는가? (BlockAggregate)
- [x] 핵심 불변식이 테스트로 검증 가능한가? (워크스페이스 격리, 속성 개수 제한, 파일 크기 제한)

### 완전성 검증
- [x] 모든 Happy Path가 커버되는가? (생성, 수정, 삭제, 커스텀 속성, 미디어, 툴)
- [x] 주요 에러 시나리오가 테스트되는가? (권한 없음, 잘못된 입력, 삭제된 블록)
- [x] 경계값 테스트가 포함되어 있는가? (UUID 형식, 블록 타입 enum, 속성 타입 enum, 파일 크기)
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