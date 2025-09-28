# Workspace Structure Domain - Database Schema

DDD Aggregates를 PostgreSQL 테이블로 매핑하는 스키마 설계입니다.

---

## 🎯 Schema Design Principles

1. **Aggregate → Table Mapping**: 각 Aggregate Root는 독립적인 테이블
2. **Clerk Integration**: Clerk ID를 통한 외부 시스템 동기화
3. **Hierarchy Performance**: 계층 구조 쿼리 최적화
4. **Soft Delete Pattern**: 모든 데이터는 복구 가능하도록 설계

---

## 📊 Core Tables

### 1. organizations
**Aggregate Mapping**: Organization Aggregate → organizations  
**Purpose**: Clerk과 동기화되는 조직 정보

```sql
CREATE TABLE organizations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Clerk Integration
  clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Core Data
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  
  -- Sync Management
  sync_status VARCHAR(50) DEFAULT 'synced',
  last_sync_at TIMESTAMP DEFAULT NOW(),
  sync_retry_count INTEGER DEFAULT 0,
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_organizations_clerk_id ON organizations(clerk_org_id);
CREATE INDEX idx_organizations_sync_status ON organizations(sync_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at);
```

**Domain Mapping**:
- `id` ↔ `OrganizationId` Value Object
- `clerk_org_id` ↔ `ClerkOrganizationId` Value Object
- `sync_status` ↔ `SyncStatus` Enum ('synced', 'pending', 'failed')

---

### 2. workspaces
**Aggregate Mapping**: Workspace Aggregate → workspaces  
**Purpose**: 독립적인 작업 공간 컨테이너

```sql
CREATE TABLE workspaces (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Core Data
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255), -- URL or emoji
  
  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_by UUID NOT NULL, -- User ID from Clerk
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL,
  scheduled_deletion_at TIMESTAMP NULL -- 30일 후 완전 삭제
);

-- Indexes
CREATE INDEX idx_workspaces_org_id ON workspaces(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_workspaces_created_by ON workspaces(created_by);
CREATE INDEX idx_workspaces_deleted_at ON workspaces(deleted_at);
CREATE INDEX idx_workspaces_scheduled_deletion ON workspaces(scheduled_deletion_at) WHERE scheduled_deletion_at IS NOT NULL;

-- RLS Policy for Organization-based access
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
```

**Domain Mapping**:
- `id` ↔ `WorkspaceId` Value Object
- `organization_id` ↔ `OrganizationId` Value Object
- `settings` ↔ `WorkspaceSettings` Value Object

---

### 3. pages
**Aggregate Mapping**: PageLifecycle Aggregate → pages  
**Purpose**: Page 생성, 삭제, 복구 생명주기 관리

```sql
CREATE TABLE pages (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  parent_id UUID REFERENCES pages(id), -- Self-referencing for hierarchy
  
  -- Core Data
  title VARCHAR(500) NOT NULL,
  icon VARCHAR(255), -- Emoji or icon identifier
  
  -- Hierarchy Management
  "order" INTEGER NOT NULL DEFAULT 0, -- Order within same parent
  depth INTEGER NOT NULL DEFAULT 0, -- Cached depth for performance
  
  -- Path for fast hierarchy queries (Materialized Path pattern)
  path TEXT, -- e.g., "/parent1/parent2/current"
  
  -- Audit Fields
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL,
  scheduled_deletion_at TIMESTAMP NULL -- 30일 후 완전 삭제
);

-- Critical Indexes for hierarchy performance
CREATE INDEX idx_pages_workspace_id ON pages(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_parent_id ON pages(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_path ON pages USING gin(path gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_order ON pages(workspace_id, parent_id, "order") WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_depth ON pages(workspace_id, depth) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_deleted_at ON pages(deleted_at);
CREATE INDEX idx_pages_scheduled_deletion ON pages(scheduled_deletion_at) WHERE scheduled_deletion_at IS NOT NULL;

-- Constraint to prevent circular references
ALTER TABLE pages ADD CONSTRAINT chk_pages_no_self_parent 
  CHECK (id != parent_id);
```

**Domain Mapping**:
- `id` ↔ `PageId` Value Object
- `workspace_id` ↔ `WorkspaceId` Value Object
- `parent_id` ↔ `PageId` Value Object (nullable)
- `path` ↔ Materialized Path for hierarchy queries

---

### 4. page_hierarchy_cache
**Purpose**: PageHierarchy Aggregate의 성능 최적화를 위한 캐시 테이블

```sql
CREATE TABLE page_hierarchy_cache (
  -- Composite Primary Key
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  page_id UUID NOT NULL REFERENCES pages(id),
  
  -- Hierarchy Information
  ancestors UUID[] NOT NULL, -- Array of ancestor page IDs
  descendants UUID[] NOT NULL, -- Array of descendant page IDs
  sibling_count INTEGER NOT NULL DEFAULT 0,
  child_count INTEGER NOT NULL DEFAULT 0,
  
  -- Performance Data
  max_depth INTEGER NOT NULL DEFAULT 0,
  
  -- Cache Management
  last_updated_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (workspace_id, page_id)
);

-- Indexes for hierarchy queries
CREATE INDEX idx_page_hierarchy_workspace ON page_hierarchy_cache(workspace_id);
CREATE INDEX idx_page_hierarchy_page ON page_hierarchy_cache(page_id);
CREATE INDEX idx_page_hierarchy_ancestors ON page_hierarchy_cache USING gin(ancestors);
CREATE INDEX idx_page_hierarchy_descendants ON page_hierarchy_cache USING gin(descendants);
```

**Usage**:
- 복잡한 계층 쿼리 성능 향상
- 순환 참조 체크 가속화
- Page 이동 영향 분석 최적화

---

## 🔄 Clerk Sync Tables

### 5. clerk_sync_queue
**Purpose**: Clerk Webhook 처리 및 재시도 관리

```sql
CREATE TABLE clerk_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Clerk Data
  clerk_event_type VARCHAR(100) NOT NULL, -- 'organization.created', etc.
  clerk_object_id VARCHAR(255) NOT NULL,
  
  -- Payload
  webhook_payload JSONB NOT NULL,
  
  -- Processing Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Error Handling
  last_error_message TEXT,
  last_error_at TIMESTAMP,
  
  -- Timing
  scheduled_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for queue processing
CREATE INDEX idx_sync_queue_status ON clerk_sync_queue(status, scheduled_at);
CREATE INDEX idx_sync_queue_clerk_object ON clerk_sync_queue(clerk_object_id);
CREATE INDEX idx_sync_queue_retry ON clerk_sync_queue(retry_count) WHERE status = 'failed';
```

---

## 🎭 Migration Strategy

### Migration Files Structure
```
migrations/
├── 001_create_organizations.sql
├── 002_create_workspaces.sql  
├── 003_create_pages.sql
├── 004_create_page_hierarchy_cache.sql
├── 005_create_clerk_sync_queue.sql
├── 006_add_workspace_rls_policies.sql
└── 007_add_performance_indexes.sql
```

### Key Migration Considerations

1. **Organizations First**: Clerk 동기화 기반이므로 먼저 생성
2. **Hierarchy Constraints**: Pages 테이블에 순환 참조 방지 제약 조건
3. **Performance Indexes**: 계층 쿼리 최적화를 위한 복합 인덱스
4. **RLS Policies**: Organization 기반 행 수준 보안

---

## 🔍 Query Patterns

### Workspace Structure Tree Query
```sql
-- Get complete page hierarchy for workspace
WITH RECURSIVE page_tree AS (
  -- Root pages (no parent)
  SELECT 
    id, workspace_id, parent_id, title, icon, "order", depth, 
    ARRAY[id] as path_ids,
    title as path_names
  FROM pages 
  WHERE workspace_id = $1 
    AND parent_id IS NULL 
    AND deleted_at IS NULL
  
  UNION ALL
  
  -- Child pages
  SELECT 
    p.id, p.workspace_id, p.parent_id, p.title, p.icon, p."order", p.depth,
    pt.path_ids || p.id,
    pt.path_names || ' / ' || p.title
  FROM pages p
  JOIN page_tree pt ON p.parent_id = pt.id
  WHERE p.deleted_at IS NULL
)
SELECT * FROM page_tree 
ORDER BY path_ids;
```

### Page Movement Validation
```sql
-- Check if page movement would create circular reference
WITH RECURSIVE descendants AS (
  SELECT id FROM pages WHERE id = $1 -- target page
  UNION ALL
  SELECT p.id FROM pages p
  JOIN descendants d ON p.parent_id = d.id
  WHERE p.deleted_at IS NULL
)
SELECT EXISTS(
  SELECT 1 FROM descendants WHERE id = $2 -- proposed new parent
) as would_create_cycle;
```

### Performance-Optimized Hierarchy Query
```sql
-- Using hierarchy cache for fast queries
SELECT 
  p.id, p.title, p.icon,
  hc.ancestors,
  hc.child_count,
  hc.max_depth
FROM pages p
JOIN page_hierarchy_cache hc ON p.id = hc.page_id
WHERE hc.workspace_id = $1
  AND p.deleted_at IS NULL
ORDER BY array_length(hc.ancestors, 1), p."order";
```

---

## 📈 Performance Optimizations

### 1. Materialized Path Pattern
- `pages.path` 컬럼으로 빠른 계층 쿼리
- GIN 인덱스로 텍스트 검색 최적화

### 2. Hierarchy Cache Table
- 복잡한 계층 계산 미리 저장
- Page 변경 시 캐시 무효화 및 재계산

### 3. Composite Indexes
- `(workspace_id, parent_id, "order")` - 순서 정렬
- `(workspace_id, depth)` - 깊이 기반 쿼리

### 4. Array Columns for Relationships
- `ancestors[]`, `descendants[]` - 관계 정보 저장
- GIN 인덱스로 배열 쿼리 최적화

---

## 🛡️ Data Integrity

### Constraints
```sql
-- Prevent self-referencing
ALTER TABLE pages ADD CONSTRAINT chk_no_self_parent 
  CHECK (id != parent_id);

-- Depth limit for performance
ALTER TABLE pages ADD CONSTRAINT chk_depth_limit 
  CHECK (depth <= 50);

-- Order must be non-negative
ALTER TABLE pages ADD CONSTRAINT chk_order_positive 
  CHECK ("order" >= 0);

-- Sync retry limit
ALTER TABLE clerk_sync_queue ADD CONSTRAINT chk_retry_limit 
  CHECK (retry_count <= max_retries);
```

### Triggers
```sql
-- Auto-update hierarchy cache on page changes
CREATE OR REPLACE FUNCTION update_page_hierarchy_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Invalidate cache for affected workspace
  DELETE FROM page_hierarchy_cache 
  WHERE workspace_id = COALESCE(NEW.workspace_id, OLD.workspace_id);
  
  -- Trigger cache rebuild (async job)
  INSERT INTO background_jobs (job_type, payload) 
  VALUES ('rebuild_hierarchy_cache', 
          jsonb_build_object('workspace_id', COALESCE(NEW.workspace_id, OLD.workspace_id)));
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hierarchy_cache
  AFTER INSERT OR UPDATE OR DELETE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_page_hierarchy_cache();
```

---

## 🔒 Security & Access Control

### Row Level Security (RLS)
```sql
-- Workspaces: Organization members only
CREATE POLICY workspace_org_members ON workspaces
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE clerk_org_id = auth.jwt() ->> 'org_id'
    )
  );

-- Pages: Workspace members only  
CREATE POLICY page_workspace_members ON pages
  FOR ALL TO authenticated
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN organizations o ON w.organization_id = o.id
      WHERE o.clerk_org_id = auth.jwt() ->> 'org_id'
    )
  );
```

---

## 📊 Monitoring & Analytics

### Performance Metrics Tables
```sql
CREATE TABLE query_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_type VARCHAR(100) NOT NULL,
  workspace_id UUID REFERENCES workspaces(id),
  execution_time_ms INTEGER NOT NULL,
  record_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Track slow queries
CREATE INDEX idx_query_metrics_slow ON query_performance_metrics(execution_time_ms DESC);
```

### Usage Analytics
```sql
CREATE TABLE workspace_usage_stats (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id),
  total_pages INTEGER DEFAULT 0,
  max_depth INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

이 스키마 설계는 **높은 성능의 계층 구조 쿼리**와 **Clerk과의 안정적인 동기화**를 모두 지원하도록 최적화되었습니다.
