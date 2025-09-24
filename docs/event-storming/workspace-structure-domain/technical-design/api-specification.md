# Workspace Structure Domain - API Specification

Domain Commands와 Queries를 Next.js Server Actions로 구현하는 명세입니다.

---

## 🎯 API Design Principles

1. **Server Actions First**: Next.js Server Actions를 활용한 type-safe API
2. **Domain Event Returns**: EventBus 대신 Domain Events 직접 반환
3. **Clerk Integration**: Clerk 권한 검증과 Organization 동기화
4. **Hierarchical Performance**: 계층 구조 최적화된 쿼리

---

## 📝 Server Actions

### Organization Commands

#### syncOrganizationAction
**Purpose**: Clerk Webhook을 통한 Organization 동기화  
**Domain Command**: SyncOrganizationFromClerk

```typescript
// Input Schema
const syncOrganizationInput = z.object({
  clerkOrgId: z.string(),
  webhookType: z.enum(['organization.created', 'organization.updated', 'organization.deleted']),
  orgData: z.object({
    name: z.string(),
    slug: z.string().optional(),
    members: z.array(z.object({
      userId: z.string(),
      role: z.enum(['admin', 'basic_member'])
    }))
  })
});

// Server Action
export async function syncOrganizationAction(
  input: z.infer<typeof syncOrganizationInput>
): Promise<Result<SyncResult, OrganizationError>> {
  try {
    // 1. Validate webhook signature (security)
    const validated = syncOrganizationInput.parse(input);
    
    // 2. Create domain command
    const command = new SyncOrganizationCommand(
      validated.clerkOrgId,
      validated.webhookType,
      validated.orgData
    );
    
    // 3. Execute through domain service
    const events = await organizationService.syncFromClerk(command);
    
    // 4. Process events (integration with other domains)
    await processOrganizationEvents(events);
    
    return Result.ok({ 
      syncedOrgId: events[0].organizationId,
      eventsProcessed: events.length 
    });
    
  } catch (error) {
    // Queue for retry
    await clerkSyncQueue.enqueue(input, error.message);
    return Result.fail(OrganizationError.SYNC_FAILED);
  }
}

// Error Types
enum OrganizationError {
  SYNC_FAILED = 'SYNC_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  WEBHOOK_INVALID = 'WEBHOOK_INVALID'
}
```

### Workspace Commands

#### createWorkspaceAction
**Purpose**: 새 Workspace 생성  
**Domain Command**: CreateWorkspace

```typescript
const createWorkspaceInput = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  icon: z.string().optional(), // emoji or URL
  templateId: z.string().uuid().optional()
});

export async function createWorkspaceAction(
  input: z.infer<typeof createWorkspaceInput>
): Promise<Result<{ workspaceId: string; pageId: string }, WorkspaceError>> {
  try {
    // 1. Get current user and organization from Clerk
    const { userId, orgId } = auth();
    if (!userId || !orgId) {
      return Result.fail(WorkspaceError.UNAUTHORIZED);
    }

    // 2. Validate input
    const validated = createWorkspaceInput.parse(input);
    
    // 3. Check organization limits (Free tier: 5 workspaces)
    const currentWorkspaceCount = await workspaceRepo.countByOrganization(orgId);
    const orgPlan = await getOrganizationPlan(orgId);
    
    if (orgPlan === 'free' && currentWorkspaceCount >= 5) {
      return Result.fail(WorkspaceError.LIMIT_EXCEEDED);
    }
    
    // 4. Create domain command
    const command = new CreateWorkspaceCommand(
      orgId,
      validated.name,
      validated.description,
      validated.icon,
      userId,
      validated.templateId
    );
    
    // 5. Execute through domain service
    const events = await workspaceCoordinator.createWorkspace(command);
    
    // 6. Process events (e.g., template copying)
    await processWorkspaceEvents(events);
    
    // 7. Extract results
    const workspaceCreated = events.find(e => e.type === 'WorkspaceCreated');
    const pageCreated = events.find(e => e.type === 'PageCreated');
    
    return Result.ok({
      workspaceId: workspaceCreated.workspaceId,
      pageId: pageCreated.pageId
    });
    
  } catch (error) {
    if (error instanceof InsufficientPermissionError) {
      return Result.fail(WorkspaceError.PERMISSION_DENIED);
    }
    return Result.fail(WorkspaceError.CREATION_FAILED);
  }
}

enum WorkspaceError {
  UNAUTHORIZED = 'UNAUTHORIZED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  CREATION_FAILED = 'CREATION_FAILED',
  NOT_FOUND = 'NOT_FOUND'
}
```

#### deleteWorkspaceAction
**Purpose**: Workspace 삭제 (Danger Zone)  
**Domain Command**: DeleteWorkspace

```typescript
const deleteWorkspaceInput = z.object({
  workspaceId: z.string().uuid(),
  confirmationText: z.string(),
  permanentDelete: z.boolean().default(false)
});

export async function deleteWorkspaceAction(
  input: z.infer<typeof deleteWorkspaceInput>
): Promise<Result<void, WorkspaceError>> {
  try {
    const { userId } = auth();
    const validated = deleteWorkspaceInput.parse(input);
    
    // 1. Get workspace and verify ownership
    const workspace = await workspaceRepo.findById(validated.workspaceId);
    if (!workspace) {
      return Result.fail(WorkspaceError.NOT_FOUND);
    }
    
    // 2. Verify user is workspace owner
    const hasOwnerAccess = await checkWorkspaceOwnership(userId, validated.workspaceId);
    if (!hasOwnerAccess) {
      return Result.fail(WorkspaceError.PERMISSION_DENIED);
    }
    
    // 3. Verify confirmation text matches workspace name
    if (validated.confirmationText !== workspace.name) {
      return Result.fail(WorkspaceError.CONFIRMATION_MISMATCH);
    }
    
    // 4. Execute deletion
    const command = new DeleteWorkspaceCommand(
      validated.workspaceId,
      userId,
      validated.permanentDelete
    );
    
    const events = await workspaceCoordinator.deleteWorkspace(command);
    
    // 5. Process cascading deletions (Visual Canvas blocks, etc.)
    await processWorkspaceDeletionEvents(events);
    
    return Result.ok(undefined);
    
  } catch (error) {
    return Result.fail(WorkspaceError.DELETION_FAILED);
  }
}
```

### Page Commands

#### createPageAction
**Purpose**: 새 Page 생성  
**Domain Command**: CreatePage

```typescript
const createPageInput = z.object({
  workspaceId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  icon: z.string().optional(),
  position: z.number().int().min(0).optional() // insert position
});

export async function createPageAction(
  input: z.infer<typeof createPageInput>
): Promise<Result<{ pageId: string }, PageError>> {
  try {
    const { userId } = auth();
    const validated = createPageInput.parse(input);
    
    // 1. Verify workspace access (Editor level required)
    const hasAccess = await checkWorkspacePermission(
      userId, 
      validated.workspaceId, 
      'EDITOR'
    );
    
    if (!hasAccess) {
      return Result.fail(PageError.PERMISSION_DENIED);
    }
    
    // 2. Validate parent exists and hierarchy depth
    if (validated.parentId) {
      const parent = await pageRepo.findById(validated.parentId);
      if (!parent || parent.depth >= 50) {
        return Result.fail(PageError.HIERARCHY_TOO_DEEP);
      }
    }
    
    // 3. Create domain command
    const command = new CreatePageCommand(
      validated.workspaceId,
      validated.parentId,
      validated.title,
      validated.icon,
      userId,
      validated.position
    );
    
    // 4. Execute through domain service
    const events = await pageLifecycleService.createPage(command);
    
    // 5. Process events (canvas initialization, etc.)
    await processPageEvents(events);
    
    const pageCreated = events.find(e => e.type === 'PageCreated');
    return Result.ok({ pageId: pageCreated.pageId });
    
  } catch (error) {
    if (error instanceof CircularReferenceError) {
      return Result.fail(PageError.CIRCULAR_REFERENCE);
    }
    return Result.fail(PageError.CREATION_FAILED);
  }
}

enum PageError {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  HIERARCHY_TOO_DEEP = 'HIERARCHY_TOO_DEEP',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  CREATION_FAILED = 'CREATION_FAILED',
  NOT_FOUND = 'NOT_FOUND'
}
```

#### movePageToWorkspaceAction
**Purpose**: Page를 다른 Workspace로 이동 (핵심 기능)  
**Domain Command**: MovePageToWorkspace

```typescript
const movePageInput = z.object({
  pageId: z.string().uuid(),
  targetWorkspaceId: z.string().uuid(),
  newParentId: z.string().uuid().optional(),
  newPosition: z.number().int().min(0).optional()
});

export async function movePageToWorkspaceAction(
  input: z.infer<typeof movePageInput>
): Promise<Result<MovementResult, PageError>> {
  try {
    const { userId } = auth();
    const validated = movePageInput.parse(input);
    
    // 1. Get current page and source workspace
    const page = await pageRepo.findById(validated.pageId);
    if (!page) {
      return Result.fail(PageError.NOT_FOUND);
    }
    
    // 2. Verify permissions on both workspaces (Editor required)
    const [hasSourceAccess, hasTargetAccess] = await Promise.all([
      checkWorkspacePermission(userId, page.workspaceId, 'EDITOR'),
      checkWorkspacePermission(userId, validated.targetWorkspaceId, 'EDITOR')
    ]);
    
    if (!hasSourceAccess || !hasTargetAccess) {
      return Result.fail(PageError.PERMISSION_DENIED);
    }
    
    // 3. Validate new hierarchy won't create cycles
    if (validated.newParentId) {
      const wouldCreateCycle = await checkCircularReference(
        validated.pageId, 
        validated.newParentId
      );
      
      if (wouldCreateCycle) {
        return Result.fail(PageError.CIRCULAR_REFERENCE);
      }
    }
    
    // 4. Create domain command
    const command = new MovePageToWorkspaceCommand(
      validated.pageId,
      page.workspaceId, // source
      validated.targetWorkspaceId,
      validated.newParentId,
      validated.newPosition,
      userId
    );
    
    // 5. Execute movement
    const events = await workspaceCoordinator.movePageToWorkspace(command);
    
    // 6. Process cross-domain events (Visual Canvas block migration)
    await processPageMovementEvents(events);
    
    return Result.ok({
      pageId: validated.pageId,
      newWorkspaceId: validated.targetWorkspaceId,
      eventsTriggered: events.length
    });
    
  } catch (error) {
    return Result.fail(PageError.MOVEMENT_FAILED);
  }
}

interface MovementResult {
  pageId: string;
  newWorkspaceId: string;
  eventsTriggered: number;
}
```

#### deletePageAction
**Purpose**: Page 삭제 (휴지통으로 이동)  
**Domain Command**: DeletePage

```typescript
const deletePageInput = z.object({
  pageId: z.string().uuid(),
  recursive: z.boolean().default(true) // delete child pages too
});

export async function deletePageAction(
  input: z.infer<typeof deletePageInput>
): Promise<Result<DeletionSummary, PageError>> {
  try {
    const { userId } = auth();
    const validated = deletePageInput.parse(input);
    
    // 1. Get page and verify access
    const page = await pageRepo.findById(validated.pageId);
    if (!page) {
      return Result.fail(PageError.NOT_FOUND);
    }
    
    const hasAccess = await checkWorkspacePermission(
      userId, 
      page.workspaceId, 
      'EDITOR'
    );
    
    if (!hasAccess) {
      return Result.fail(PageError.PERMISSION_DENIED);
    }
    
    // 2. Count affected pages (for user confirmation)
    const affectedPageCount = validated.recursive 
      ? await getDescendantCount(validated.pageId)
      : 1;
    
    // 3. Execute deletion
    const command = new DeletePageCommand(
      validated.pageId,
      userId,
      validated.recursive
    );
    
    const events = await pageLifecycleService.deletePage(command);
    
    // 4. Process cascading effects (Visual Canvas cleanup)
    await processPageDeletionEvents(events);
    
    return Result.ok({
      deletedPageCount: affectedPageCount,
      scheduledDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      canRestore: true
    });
    
  } catch (error) {
    return Result.fail(PageError.DELETION_FAILED);
  }
}

interface DeletionSummary {
  deletedPageCount: number;
  scheduledDeletionDate: Date;
  canRestore: boolean;
}
```

---

## 🔍 Query Functions

### getWorkspaceStructureQuery
**Purpose**: Workspace의 전체 Page 계층구조 로드

```typescript
interface WorkspaceStructure {
  workspace: {
    id: string;
    name: string;
    icon?: string;
    organization: {
      id: string;
      name: string;
    };
  };
  pageTree: PageTreeNode[];
  stats: {
    totalPages: number;
    maxDepth: number;
    lastActivity: string;
  };
}

interface PageTreeNode {
  id: string;
  title: string;
  icon?: string;
  depth: number;
  order: number;
  hasBlocks: boolean; // from Visual Canvas domain
  lastModified: string;
  children: PageTreeNode[];
}

export async function getWorkspaceStructureQuery(
  workspaceId: string
): Promise<Result<WorkspaceStructure, QueryError>> {
  try {
    const { userId } = auth();
    
    // 1. Verify access
    const hasAccess = await checkWorkspacePermission(userId, workspaceId, 'VIEWER');
    if (!hasAccess) {
      return Result.fail(QueryError.PERMISSION_DENIED);
    }
    
    // 2. Use optimized hierarchy query
    const structure = await workspaceQueryHandler.getWorkspaceStructure(workspaceId);
    
    // 3. Enhance with Visual Canvas data (has blocks?)
    const enhancedStructure = await enhanceWithCanvasData(structure);
    
    return Result.ok(enhancedStructure);
    
  } catch (error) {
    return Result.fail(QueryError.QUERY_FAILED);
  }
}
```

### getPageNavigationQuery
**Purpose**: 특정 Page의 네비게이션 정보 (브레드크럼, 형제 페이지)

```typescript
interface PageNavigation {
  page: {
    id: string;
    title: string;
    icon?: string;
  };
  breadcrumb: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
  siblings: Array<{
    id: string;
    title: string;
    order: number;
  }>;
  children: Array<{
    id: string;
    title: string;
    hasChildren: boolean;
  }>;
  workspace: {
    id: string;
    name: string;
  };
}

export async function getPageNavigationQuery(
  pageId: string
): Promise<Result<PageNavigation, QueryError>> {
  try {
    const { userId } = auth();
    
    // 1. Get page and verify access
    const page = await pageRepo.findById(pageId);
    if (!page) {
      return Result.fail(QueryError.NOT_FOUND);
    }
    
    const hasAccess = await checkWorkspacePermission(
      userId, 
      page.workspaceId, 
      'VIEWER'
    );
    
    if (!hasAccess) {
      return Result.fail(QueryError.PERMISSION_DENIED);
    }
    
    // 2. Use cached navigation query
    const navigation = await navigationQueryHandler.getPageNavigation(pageId);
    
    return Result.ok(navigation);
    
  } catch (error) {
    return Result.fail(QueryError.QUERY_FAILED);
  }
}
```

### searchPagesQuery
**Purpose**: Workspace 내 Page 검색

```typescript
const searchPagesInput = z.object({
  workspaceId: z.string().uuid(),
  query: z.string().min(2),
  limit: z.number().min(1).max(100).default(20),
  includeContent: z.boolean().default(false) // search in Visual Canvas blocks too
});

export async function searchPagesQuery(
  input: z.infer<typeof searchPagesInput>
): Promise<Result<PageSearchResult[], QueryError>> {
  try {
    const { userId } = auth();
    const validated = searchPagesInput.parse(input);
    
    // 1. Verify workspace access
    const hasAccess = await checkWorkspacePermission(
      userId, 
      validated.workspaceId, 
      'VIEWER'
    );
    
    if (!hasAccess) {
      return Result.fail(QueryError.PERMISSION_DENIED);
    }
    
    // 2. Execute search with performance optimization
    const results = await searchQueryHandler.searchPages({
      workspaceId: validated.workspaceId,
      query: validated.query,
      limit: validated.limit,
      includeContent: validated.includeContent
    });
    
    return Result.ok(results);
    
  } catch (error) {
    return Result.fail(QueryError.QUERY_FAILED);
  }
}

interface PageSearchResult {
  id: string;
  title: string;
  icon?: string;
  path: string; // breadcrumb path
  relevanceScore: number;
  matchedContent?: string; // snippet
  lastModified: string;
}
```

---

## 🔄 Event Processing

### Cross-Domain Event Integration
```typescript
// Process domain events without EventBus
async function processWorkspaceEvents(events: DomainEvent[]): Promise<void> {
  for (const event of events) {
    switch (event.type) {
      case 'WorkspaceCreated':
        // Set up default permissions in Collaboration domain
        await setupDefaultPermissions(event.workspaceId, event.createdBy);
        break;
        
      case 'PageCreated':
        // Initialize empty canvas in Visual Canvas domain
        await initializePageCanvas(event.pageId);
        break;
        
      case 'PageMovedToWorkspace':
        // Migrate Visual Canvas blocks
        await migratePageBlocks(event.pageId, event.targetWorkspaceId);
        break;
    }
  }
}

async function processPageDeletionEvents(events: DomainEvent[]): Promise<void> {
  for (const event of events) {
    switch (event.type) {
      case 'PageMovedToTrash':
        // Soft delete Visual Canvas blocks
        await softDeletePageBlocks(event.pageId);
        break;
        
      case 'PagePermanentlyDeleted':
        // Hard delete all related data
        await permanentlyDeletePageData(event.pageId);
        break;
    }
  }
}
```

---

## 🚀 Performance Optimizations

### 1. Cached Hierarchy Queries
```typescript
// Use hierarchy cache table for fast queries
async function getCachedWorkspaceStructure(workspaceId: string): Promise<WorkspaceStructure> {
  return await db.query(`
    SELECT 
      p.id, p.title, p.icon, p.depth, p."order",
      hc.child_count,
      array_length(hc.ancestors, 1) as ancestor_count
    FROM pages p
    JOIN page_hierarchy_cache hc ON p.id = hc.page_id
    WHERE hc.workspace_id = $1 
      AND p.deleted_at IS NULL
    ORDER BY hc.ancestors, p."order"
  `, [workspaceId]);
}
```

### 2. Batch Operations
```typescript
// Batch page operations for performance
export async function batchMovePages(
  pageIds: string[],
  targetWorkspaceId: string
): Promise<Result<BatchMoveResult, PageError>> {
  // Validate all pages at once
  // Execute as single transaction
  // Process events in batch
}
```

### 3. Background Cache Updates
```typescript
// Update hierarchy cache asynchronously
async function scheduleHierarchyCacheUpdate(workspaceId: string): Promise<void> {
  await backgroundJobs.enqueue('rebuild_hierarchy_cache', {
    workspaceId,
    priority: 'high'
  });
}
```

---

## 🛡️ Error Handling

### Comprehensive Error Types
```typescript
// Unified error handling across all actions
type WorkspaceAPIError = 
  | OrganizationError 
  | WorkspaceError 
  | PageError 
  | QueryError;

interface ErrorResponse {
  error: {
    code: WorkspaceAPIError;
    message: string;
    details?: any;
    timestamp: string;
    correlationId: string;
  };
}

// User-friendly error messages
const ERROR_MESSAGES: Record<WorkspaceAPIError, string> = {
  [WorkspaceError.LIMIT_EXCEEDED]: '워크스페이스 생성 한도에 도달했습니다. 요금제를 업그레이드하세요.',
  [PageError.HIERARCHY_TOO_DEEP]: '페이지 중첩이 너무 깊습니다. 최대 50단계까지 가능합니다.',
  [PageError.CIRCULAR_REFERENCE]: '순환 참조가 발생합니다. 페이지를 자기 자신의 하위로 이동할 수 없습니다.',
  // ... more messages
};
```

이 API 설계는 **Next.js Server Actions의 타입 안전성**과 **도메인 이벤트 기반 통합**을 모두 활용하여 확장 가능하고 유지보수하기 쉬운 구조를 제공합니다.
