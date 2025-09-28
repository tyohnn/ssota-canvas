# Component System Domain - API Specification (Simplified)

Component System Domain의 단순화된 Server Actions 및 Query 함수 명세를 정의합니다.

---

## 🎯 API Overview (Simplified)

Component System Domain은 단순화되어 다음과 같은 API 카테고리를 제공합니다:

- **Component Management**: 컴포넌트 CRUD 및 라이브러리 관리
- **Component Instance**: 블럭 기반 인스턴스 생성/수정
- **Style Override**: 스타일 속성만 오버라이드
- **Frontend Rendering**: 프론트엔드에서 데이터 조합

### 핵심 단순화 사항
- ~~복잡한 동기화 API~~ → 제거
- ~~속성별 오버라이드 API~~ → 스타일만 처리  
- ~~생명주기 추적 API~~ → 간단한 CRUD
- **렌더링 시점 조합** → 프론트엔드에서 처리

---

## 🚀 Server Actions (Commands)

### 1. Component Management Actions

#### createComponentAction

컴포넌트 생성

```typescript
// Input Schema
const createComponentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['general', 'ui', 'data', 'layout', 'custom']).default('general'),
  workspaceId: z.string().uuid(),
  sourceBlockId: z.string().uuid().optional(),
  defaultProperties: z.record(z.any()).default({}),
  styleRules: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([])
});

type CreateComponentInput = z.infer<typeof createComponentSchema>;

// Output
interface CreateComponentResult {
  success: boolean;
  componentId?: string;
  errors?: FieldError[];
}

// Implementation
export async function createComponentAction(
  input: CreateComponentInput
): Promise<CreateComponentResult> {
  'use server'
  
  try {
    // 1. Input validation
    const validated = createComponentSchema.parse(input);
    
    // 2. Permission check
    await verifyWorkspaceAccess(validated.workspaceId, 'write');
    
    // 3. Domain command
    const command = new CreateComponentCommand(validated);
    const events = await componentService.createComponent(command);
    
    // 4. Process cross-domain events
    await processCrossDomainEvents(events);
    
    return { success: true, componentId: events[0].data.componentId };
    
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, errors: mapValidationErrors(error) };
    }
    throw error;
  }
}
```

#### updateComponentAction

컴포넌트 업데이트

```typescript
const updateComponentSchema = z.object({
  componentId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.enum(['general', 'ui', 'data', 'layout', 'custom']).optional(),
  defaultProperties: z.record(z.any()).optional(),
  styleRules: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional()
});

export async function updateComponentAction(
  input: z.infer<typeof updateComponentSchema>
): Promise<UpdateComponentResult> {
  'use server'
  
  try {
    const validated = updateComponentSchema.parse(input);
    
    // Permission check
    await verifyComponentAccess(validated.componentId, 'write');
    
    // Domain command
    const command = new UpdateComponentCommand(validated);
    const events = await componentService.updateComponent(command);
    
    // Auto-sync affected instances if properties changed
    if (events.some(e => e.type === 'ComponentPropertiesUpdated')) {
      await triggerInstanceSync(validated.componentId, 'auto');
    }
    
    return { success: true, componentId: validated.componentId };
    
  } catch (error) {
    if (error instanceof ComponentNotFoundError) {
      return { success: false, errors: [{ field: 'componentId', message: 'Component not found' }] };
    }
    throw error;
  }
}
```

#### deleteComponentAction

컴포넌트 삭제 (안전 장치 포함)

```typescript
const deleteComponentSchema = z.object({
  componentId: z.string().uuid(),
  conversionStrategy: z.enum(['convert_to_blocks', 'delete_instances']).default('convert_to_blocks'),
  userConfirmation: z.boolean()
});

export async function deleteComponentAction(
  input: z.infer<typeof deleteComponentSchema>
): Promise<DeleteComponentResult> {
  'use server'
  
  try {
    const validated = deleteComponentSchema.parse(input);
    
    if (!validated.userConfirmation) {
      throw new ValidationError('User confirmation required for component deletion');
    }
    
    // Permission check
    await verifyComponentAccess(validated.componentId, 'admin');
    
    // Safety analysis
    const impactAnalysis = await componentLifecycleService.analyzeDeletionImpact(validated.componentId);
    
    if (impactAnalysis.instanceCount > 100 && !validated.userConfirmation) {
      return { 
        success: false, 
        requiresConfirmation: true,
        impactAnalysis 
      };
    }
    
    // Domain command
    const command = new DeleteComponentCommand(validated);
    const events = await componentLifecycleService.deleteComponent(command);
    
    return { 
      success: true, 
      deletedComponentId: validated.componentId,
      convertedInstances: events.filter(e => e.type === 'InstanceConvertedToBlock').length
    };
    
  } catch (error) {
    throw error;
  }
}
```

### 2. Instance Management Actions

#### createComponentInstanceAction

컴포넌트 인스턴스 생성

```typescript
const createInstanceSchema = z.object({
  componentId: z.string().uuid(),
  pageId: z.string().uuid(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  initialOverrides: z.record(z.any()).optional()
});

export async function createComponentInstanceAction(
  input: z.infer<typeof createInstanceSchema>
): Promise<CreateInstanceResult> {
  'use server'
  
  try {
    const validated = createInstanceSchema.parse(input);
    
    // Permission checks
    await verifyComponentAccess(validated.componentId, 'read');
    await verifyPageAccess(validated.pageId, 'write');
    
    // Domain command
    const command = new CreateComponentInstanceCommand(validated);
    const events = await componentService.createInstance(command);
    
    // Cross-domain integration (Visual Canvas)
    await processInstanceCreationEvents(events);
    
    return { 
      success: true, 
      instanceId: events[0].data.instanceId,
      blockId: events[0].data.blockId
    };
    
  } catch (error) {
    if (error instanceof ComponentNotFoundError) {
      return { success: false, errors: [{ field: 'componentId', message: 'Component not found' }] };
    }
    throw error;
  }
}
```

#### detachInstanceAction

인스턴스를 컴포넌트에서 분리

```typescript
const detachInstanceSchema = z.object({
  instanceId: z.string().uuid(),
  preserveProperties: z.boolean().default(true),
  preserveOverrides: z.boolean().default(true),
  userConfirmation: z.boolean()
});

export async function detachInstanceAction(
  input: z.infer<typeof detachInstanceSchema>
): Promise<DetachInstanceResult> {
  'use server'
  
  try {
    const validated = detachInstanceSchema.parse(input);
    
    if (!validated.userConfirmation) {
      throw new ValidationError('User confirmation required for instance detachment');
    }
    
    // Permission check
    await verifyInstanceAccess(validated.instanceId, 'write');
    
    // Domain command
    const command = new DetachSingleInstanceCommand(validated);
    const events = await componentLifecycleService.detachInstance(command);
    
    // Notify Visual Canvas of block conversion
    await processInstanceDetachmentEvents(events);
    
    return { 
      success: true, 
      detachedInstanceId: validated.instanceId,
      newBlockId: events[0].data.newBlockId
    };
    
  } catch (error) {
    throw error;
  }
}
```

### 3. Property Override Actions

#### overrideInstancePropertyAction

인스턴스 속성 오버라이드

```typescript
const overridePropertySchema = z.object({
  instanceId: z.string().uuid(),
  propertyKey: z.string().min(1),
  propertyValue: z.any(),
  overrideReason: z.enum(['manual', 'auto', 'bulk_update']).default('manual')
});

export async function overrideInstancePropertyAction(
  input: z.infer<typeof overridePropertySchema>
): Promise<OverridePropertyResult> {
  'use server'
  
  try {
    const validated = overridePropertySchema.parse(input);
    
    // Permission check
    await verifyInstanceAccess(validated.instanceId, 'write');
    
    // Validate property exists and type matches
    await validatePropertyOverride(validated.instanceId, validated.propertyKey, validated.propertyValue);
    
    // Domain command
    const command = new OverrideInstancePropertyCommand(validated);
    const events = await propertyOverrideService.overrideProperty(command);
    
    // Notify Visual Canvas of property change
    await processPropertyOverrideEvents(events);
    
    return { 
      success: true, 
      overrideId: events[0].data.overrideId 
    };
    
  } catch (error) {
    if (error instanceof PropertyTypeError) {
      return { success: false, errors: [{ field: 'propertyValue', message: error.message }] };
    }
    throw error;
  }
}
```

#### resetInstancePropertyAction

인스턴스 속성 리셋 (기본값으로 복원)

```typescript
const resetPropertySchema = z.object({
  instanceId: z.string().uuid(),
  propertyKey: z.string().min(1)
});

export async function resetInstancePropertyAction(
  input: z.infer<typeof resetPropertySchema>
): Promise<ResetPropertyResult> {
  'use server'
  
  try {
    const validated = resetPropertySchema.parse(input);
    
    // Permission check
    await verifyInstanceAccess(validated.instanceId, 'write');
    
    // Domain command
    const command = new ResetInstancePropertyCommand(validated);
    const events = await propertyOverrideService.resetProperty(command);
    
    return { success: true };
    
  } catch (error) {
    throw error;
  }
}
```

### 4. Synchronization Actions

#### syncComponentInstancesAction

컴포넌트 인스턴스 동기화

```typescript
const syncInstancesSchema = z.object({
  componentId: z.string().uuid(),
  syncType: z.enum(['full', 'partial', 'properties_only', 'style_only']).default('full'),
  targetInstances: z.array(z.string().uuid()).optional(), // If not provided, sync all
  batchSize: z.number().min(1).max(100).default(10)
});

export async function syncComponentInstancesAction(
  input: z.infer<typeof syncInstancesSchema>
): Promise<SyncInstancesResult> {
  'use server'
  
  try {
    const validated = syncInstancesSchema.parse(input);
    
    // Permission check
    await verifyComponentAccess(validated.componentId, 'write');
    
    // Domain command
    const command = new SyncAllInstancesCommand(validated);
    const sessionId = await componentSyncService.startSyncSession(command);
    
    // Process sync in background
    processBackgroundSync(sessionId);
    
    return { 
      success: true, 
      syncSessionId: sessionId 
    };
    
  } catch (error) {
    throw error;
  }
}
```

---

## 📊 Query Functions (Queries)

### 1. Component Queries

#### getComponentLibraryQuery

워크스페이스의 컴포넌트 라이브러리 조회

```typescript
interface ComponentLibraryQueryParams {
  workspaceId: string;
  category?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getComponentLibraryQuery(
  params: ComponentLibraryQueryParams
): Promise<ComponentLibraryResult> {
  
  // Permission check
  await verifyWorkspaceAccess(params.workspaceId, 'read');
  
  // Build query
  let query = db
    .select({
      id: components.id,
      name: components.name,
      description: components.description,
      category: components.category,
      tags: components.tags,
      instanceCount: sql<number>`COUNT(ci.id)`,
      lastUsed: sql<Date>`MAX(ci.created_at)`,
      createdAt: components.createdAt
    })
    .from(components)
    .leftJoin(componentInstances, eq(components.id, componentInstances.componentId))
    .where(
      and(
        eq(components.workspaceId, params.workspaceId),
        isNull(components.deletedAt)
      )
    )
    .groupBy(components.id);
  
  // Apply filters
  if (params.category) {
    query = query.where(eq(components.category, params.category));
  }
  
  if (params.search) {
    query = query.where(
      or(
        ilike(components.name, `%${params.search}%`),
        ilike(components.description, `%${params.search}%`)
      )
    );
  }
  
  // Apply pagination
  const limit = params.limit || 20;
  const offset = params.offset || 0;
  
  const result = await query
    .limit(limit)
    .offset(offset)
    .orderBy(desc(components.createdAt));
  
  return {
    components: result,
    total: await getComponentCount(params),
    hasMore: result.length === limit
  };
}
```

#### getComponentDetailsQuery

컴포넌트 상세 정보 조회

```typescript
export async function getComponentDetailsQuery(
  componentId: string
): Promise<ComponentDetailsResult> {
  
  // Permission check
  await verifyComponentAccess(componentId, 'read');
  
  // Get component with properties
  const [component] = await db
    .select()
    .from(components)
    .leftJoin(componentProperties, eq(components.id, componentProperties.componentId))
    .where(
      and(
        eq(components.id, componentId),
        isNull(components.deletedAt)
      )
    );
  
  if (!component) {
    throw new ComponentNotFoundError(componentId);
  }
  
  // Get instance statistics
  const instanceStats = await db
    .select({
      totalInstances: sql<number>`COUNT(*)`,
      instancesNeedingSync: sql<number>`COUNT(*) FILTER (WHERE needs_sync = true)`,
      lastInstanceUpdate: sql<Date>`MAX(updated_at)`
    })
    .from(componentInstances)
    .where(
      and(
        eq(componentInstances.componentId, componentId),
        isNull(componentInstances.deletedAt)
      )
    );
  
  return {
    ...component,
    instanceStats: instanceStats[0]
  };
}
```

### 2. Instance Queries

#### getComponentInstancesQuery

컴포넌트 인스턴스 목록 조회

```typescript
interface InstanceQueryParams {
  componentId?: string;
  pageId?: string;
  needsSync?: boolean;
  hasOverrides?: boolean;
  limit?: number;
  offset?: number;
}

export async function getComponentInstancesQuery(
  params: InstanceQueryParams
): Promise<InstanceListResult> {
  
  let query = db
    .select({
      instanceId: componentInstances.id,
      componentId: componentInstances.componentId,
      componentName: components.name,
      blockId: componentInstances.blockId,
      pageId: componentInstances.pageId,
      needsSync: componentInstances.needsSync,
      lastSynced: componentInstances.lastSyncedAt,
      overrideCount: sql<number>`COUNT(ipo.id)`,
      createdAt: componentInstances.createdAt
    })
    .from(componentInstances)
    .leftJoin(components, eq(componentInstances.componentId, components.id))
    .leftJoin(instancePropertyOverrides, 
      and(
        eq(componentInstances.id, instancePropertyOverrides.instanceId),
        eq(instancePropertyOverrides.isActive, true)
      )
    )
    .where(isNull(componentInstances.deletedAt))
    .groupBy(componentInstances.id, components.name);
  
  // Apply filters
  if (params.componentId) {
    query = query.where(eq(componentInstances.componentId, params.componentId));
  }
  
  if (params.pageId) {
    query = query.where(eq(componentInstances.pageId, params.pageId));
  }
  
  if (params.needsSync !== undefined) {
    query = query.where(eq(componentInstances.needsSync, params.needsSync));
  }
  
  // Apply pagination
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  
  const result = await query
    .limit(limit)
    .offset(offset)
    .orderBy(desc(componentInstances.createdAt));
  
  return {
    instances: result,
    total: await getInstanceCount(params),
    hasMore: result.length === limit
  };
}
```

### 3. Synchronization Queries

#### getSyncSessionStatusQuery

동기화 세션 상태 조회

```typescript
export async function getSyncSessionStatusQuery(
  sessionId: string
): Promise<SyncSessionStatusResult> {
  
  const [session] = await db
    .select()
    .from(componentSyncSessions)
    .where(eq(componentSyncSessions.id, sessionId));
  
  if (!session) {
    throw new SyncSessionNotFoundError(sessionId);
  }
  
  // Permission check
  await verifyComponentAccess(session.componentId, 'read');
  
  return {
    sessionId: session.id,
    componentId: session.componentId,
    status: session.status,
    progress: session.progressPercentage,
    totalInstances: session.targetInstances.length,
    successfulInstances: session.successfulInstances.length,
    failedInstances: session.failedInstances.length,
    estimatedTimeRemaining: calculateEstimatedTime(session),
    startedAt: session.startedAt,
    completedAt: session.completedAt
  };
}
```

---

## ⚡ Real-time Subscriptions

### Component Library Updates

```typescript
export function subscribeToComponentLibrary(workspaceId: string) {
  return createSupabaseSubscription(
    'components',
    {
      event: '*',
      schema: 'public',
      filter: `workspace_id=eq.${workspaceId}`
    },
    (payload) => {
      // Handle component library updates
      notifyComponentLibraryChange(payload);
    }
  );
}
```

### Sync Progress Updates

```typescript
export function subscribeToSyncProgress(sessionId: string) {
  return createSupabaseSubscription(
    'component_sync_sessions',
    {
      event: 'UPDATE',
      schema: 'public',
      filter: `id=eq.${sessionId}`
    },
    (payload) => {
      // Handle sync progress updates
      notifySyncProgress(payload.new);
    }
  );
}
```

---

## 🔒 Error Handling

### Domain-Specific Errors

```typescript
export class ComponentSystemError extends DomainError {
  abstract readonly code: string;
  abstract readonly statusCode: number;
}

export class ComponentNotFoundError extends ComponentSystemError {
  readonly code = 'COMPONENT_NOT_FOUND';
  readonly statusCode = 404;
  
  constructor(componentId: string) {
    super(`Component not found: ${componentId}`, { componentId });
  }
}

export class InstanceSyncFailedError extends ComponentSystemError {
  readonly code = 'INSTANCE_SYNC_FAILED';
  readonly statusCode = 500;
  
  constructor(instanceId: string, reason: string) {
    super(`Instance sync failed: ${reason}`, { instanceId, reason });
  }
}

export class PropertyOverrideError extends ComponentSystemError {
  readonly code = 'PROPERTY_OVERRIDE_ERROR';
  readonly statusCode = 400;
  
  constructor(propertyKey: string, reason: string) {
    super(`Property override failed: ${reason}`, { propertyKey, reason });
  }
}
```

---

## ⚡ Performance Optimizations

### 1. Caching Strategy

```typescript
// Component library caching
const COMPONENT_LIBRARY_CACHE_TTL = 300; // 5 minutes

export async function getCachedComponentLibrary(workspaceId: string) {
  const cacheKey = `component_library:${workspaceId}`;
  
  let cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const result = await getComponentLibraryQuery({ workspaceId });
  await redis.setex(cacheKey, COMPONENT_LIBRARY_CACHE_TTL, JSON.stringify(result));
  
  return result;
}
```

### 2. Batch Operations

```typescript
// Batch instance property override
export async function batchOverridePropertiesAction(
  inputs: OverridePropertyInput[]
): Promise<BatchOverrideResult> {
  'use server'
  
  const results = await Promise.allSettled(
    inputs.map(input => overrideInstancePropertyAction(input))
  );
  
  return {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results
  };
}
```

### 3. Background Processing

```typescript
// Background sync processing
export async function processBackgroundSync(sessionId: string) {
  const session = await getSyncSession(sessionId);
  
  // Update status to running
  await updateSyncSession(sessionId, { status: 'running' });
  
  try {
    // Process instances in batches
    for (const batch of chunk(session.targetInstances, 10)) {
      await processSyncBatch(sessionId, batch);
      
      // Update progress
      const progress = calculateProgress(sessionId);
      await updateSyncSession(sessionId, { progressPercentage: progress });
    }
    
    await updateSyncSession(sessionId, { 
      status: 'completed', 
      completedAt: new Date() 
    });
    
  } catch (error) {
    await updateSyncSession(sessionId, { 
      status: 'failed',
      errorMessage: error.message 
    });
  }
}
```

---

## 📊 Rate Limiting

```typescript
// Component creation rate limiting
const COMPONENT_CREATION_LIMIT = 10; // per minute per user
const SYNC_OPERATION_LIMIT = 3; // per minute per component

export async function rateLimitComponentCreation(userId: string) {
  const key = `component_creation:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 60);
  }
  
  if (current > COMPONENT_CREATION_LIMIT) {
    throw new RateLimitExceededError('Component creation limit exceeded');
  }
}
```

---

## ✅ API Validation Checklist

- [x] All inputs validated with Zod schemas
- [x] Proper permission checks for each action
- [x] Domain-specific error handling
- [x] Cross-domain event processing
- [x] Rate limiting for sensitive operations
- [x] Caching for frequently accessed data
- [x] Background processing for long operations
- [x] Real-time subscriptions for updates
- [x] Batch operations for efficiency
- [x] Comprehensive query functions
