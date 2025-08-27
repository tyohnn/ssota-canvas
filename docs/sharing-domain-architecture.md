# Sharing Domain Architecture

## Overview

The Sharing Domain is the core viral engine of our service, enabling canvas file sharing similar to Notion. It allows non-service users to access and view canvases through shared links, creating awareness of our service and driving user acquisition.

### Core Objectives

- **Viral Growth**: Enable canvas sharing to non-users for service discovery
- **Collaboration**: Support team-based editing and viewing permissions
- **Template Distribution**: Allow users to duplicate and customize shared templates
- **Access Control**: Granular permission management for different sharing scenarios

### Key Features

1. **Organization Auto-Permissions**: Automatic access for organization members with configurable roles
2. **Email Invitations**: Invite specific users by email with view/edit permissions
3. **Public Link Sharing**: Generate view-only links accessible to anyone
4. **Template Duplication**: Copy shared content to user's own workspace

## Domain Model

### Core Entities

```typescript
// Sharing targets
enum ShareTarget {
  WORKSPACE = "workspace",  // Share entire workspace
  PAGE = "page"            // Share specific page/canvas
}

// Permission levels
enum ShareRole {
  OWNER = "owner",     // Full control
  EDITOR = "editor",   // Can edit content
  VIEWER = "viewer"    // Read-only access
}

// Invitation status
enum InviteStatus {
  PENDING = "pending",
  ACCEPTED = "accepted", 
  REVOKED = "revoked"
}
```

### Database Schema

#### Organization & Workspace Membership

```sql
-- Organization membership (for auto-permissions)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role share_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace membership
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role share_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Sharing Configuration

```sql
-- Main sharing entity
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type share_target NOT NULL,           -- workspace | page
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  page_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE, -- for page sharing
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  default_org_role share_role DEFAULT 'viewer', -- Auto-permission level for org members
  allow_public_link BOOLEAN DEFAULT false,
  allow_duplicate BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual share members
CREATE TABLE share_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES shares(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- Registered user
  invite_email TEXT,                                   -- Unregistered user
  role share_role NOT NULL DEFAULT 'viewer',
  status invite_status DEFAULT 'pending',
  inviter_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public share links
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES shares(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  password_hash TEXT,
  allow_indexing BOOLEAN DEFAULT false, -- SEO control
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

#### Access Control Matrix

| Resource | Owner | Org Member | Workspace Member | Share Member | Public Link |
|----------|-------|------------|------------------|--------------|-------------|
| blocks   | ✅    | ✅ (if org_role) | ✅ (if member) | ✅ (if member) | ✅ (if token valid) |
| edges    | ✅    | ✅ (if org_role) | ✅ (if member) | ✅ (if member) | ✅ (if token valid) |
| positions| ✅    | ✅ (if org_role) | ✅ (if member) | ✅ (if member) | ✅ (if token valid) |

#### RLS Policy Implementation

```sql
-- Enhanced blocks SELECT policy
CREATE POLICY "Enable read access for shared resources" ON blocks
FOR SELECT TO authenticated
USING (
  -- Original owner access
  EXISTS (
    SELECT 1 FROM workspaces 
    WHERE workspaces.id = blocks.workspace_id 
    AND workspaces.owner_id = current_setting('app.user_id', true)
  )
  OR
  -- Organization member access
  EXISTS (
    SELECT 1 FROM organization_members om
    JOIN workspaces w ON w.organization_id = om.organization_id
    JOIN shares s ON s.workspace_id = w.id
    WHERE w.id = blocks.workspace_id
    AND om.user_id = current_setting('app.user_id', true)
    AND om.role >= s.default_org_role
  )
  OR
  -- Workspace member access
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = blocks.workspace_id
    AND wm.user_id = current_setting('app.user_id', true)
  )
  OR
  -- Share member access
  EXISTS (
    SELECT 1 FROM share_members sm
    JOIN shares s ON s.id = sm.share_id
    WHERE s.workspace_id = blocks.workspace_id
    AND sm.user_id = current_setting('app.user_id', true)
    AND sm.status = 'accepted'
  )
  OR
  -- Public link access
  (
    current_setting('app.share_token', true) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM share_links sl
      JOIN shares s ON s.id = sl.share_id
      WHERE sl.token = current_setting('app.share_token', true)
      AND sl.is_enabled = true
      AND (sl.expires_at IS NULL OR sl.expires_at > NOW())
      AND s.workspace_id = blocks.workspace_id
      AND (
        s.target_type = 'workspace'
        OR (
          s.target_type = 'page' 
          AND blocks.id IN (
            -- Page scope: include page and all contained blocks
            WITH RECURSIVE page_tree AS (
              SELECT id FROM blocks WHERE id = s.page_block_id
              UNION ALL
              SELECT b.id FROM blocks b
              JOIN edges e ON e.target_block_id = b.id
              JOIN page_tree pt ON pt.id = e.source_block_id
              WHERE e.edge_type = 'contains'
            )
            SELECT id FROM page_tree
          )
        )
      )
    )
  )
);
```

## API Design

### Internal APIs

#### Share Management

```typescript
// Create share
POST /api/shares
{
  targetType: "workspace" | "page",
  workspaceId: string,
  pageBlockId?: string, // Required for page sharing
  allowPublicLink?: boolean,
  allowDuplicate?: boolean,
  defaultOrgRole?: "viewer" | "editor"
}

// Get share details
GET /api/shares/:id

// Update share settings
PATCH /api/shares/:id
{
  allowPublicLink?: boolean,
  allowDuplicate?: boolean,
  defaultOrgRole?: "viewer" | "editor"
}

// Delete share
DELETE /api/shares/:id
```

#### Member Management

```typescript
// Add member
POST /api/shares/:id/members
{
  email: string,
  role: "viewer" | "editor"
}

// Update member
PATCH /api/shares/:id/members/:memberId
{
  role?: "viewer" | "editor",
  status?: "pending" | "accepted" | "revoked"
}

// Remove member
DELETE /api/shares/:id/members/:memberId
```

#### Link Management

```typescript
// Create public link
POST /api/shares/:id/links
{
  expiresAt?: string,
  password?: string,
  allowIndexing?: boolean
}

// Update link
PATCH /api/shares/:id/links/:linkId
{
  isEnabled?: boolean,
  expiresAt?: string,
  password?: string,
  allowIndexing?: boolean
}

// Delete link
DELETE /api/shares/:id/links/:linkId
```

#### Template Duplication

```typescript
// Duplicate shared content
POST /api/shares/:id/duplicate
{
  targetWorkspaceId: string
}

// Response
{
  success: boolean,
  newWorkspaceId?: string,
  newPageId?: string,
  message: string
}
```

### Public Routes

```typescript
// Public view route
GET /s/:token

// Password verification (if required)
POST /s/:token/verify
{
  password: string
}
```

## Template Duplication Algorithm

### Scope Determination

```typescript
interface DuplicationScope {
  blocks: Block[];
  edges: Edge[];
  positions: BlockPosition[];
}

function determineScope(
  targetType: ShareTarget,
  workspaceId: string,
  pageBlockId?: string
): DuplicationScope {
  if (targetType === "workspace") {
    return {
      blocks: await getWorkspaceBlocks(workspaceId),
      edges: await getWorkspaceEdges(workspaceId),
      positions: await getWorkspacePositions(workspaceId)
    };
  } else {
    // Page scope: collect page and all contained blocks
    const pageTree = await collectPageTree(pageBlockId);
    return {
      blocks: pageTree.blocks,
      edges: pageTree.edges,
      positions: pageTree.positions
    };
  }
}
```

### ID Mapping & Creation

```typescript
interface IdMapping {
  [oldId: string]: string;
}

async function duplicateContent(
  scope: DuplicationScope,
  targetWorkspaceId: string
): Promise<DuplicationResult> {
  const idMapping: IdMapping = {};
  
  // Create blocks in topological order (parent → child)
  const sortedBlocks = topologicalSort(scope.blocks, scope.edges);
  
  for (const block of sortedBlocks) {
    const newBlock = await createBlock({
      ...block,
      id: undefined, // Let DB generate new ID
      workspace_id: targetWorkspaceId,
      parent_block_id: idMapping[block.parent_block_id] || null
    });
    
    idMapping[block.id] = newBlock.id;
  }
  
  // Create edges with mapped IDs
  for (const edge of scope.edges) {
    await createEdge({
      ...edge,
      id: undefined,
      workspace_id: targetWorkspaceId,
      source_block_id: idMapping[edge.source_block_id],
      target_block_id: idMapping[edge.target_block_id]
    });
  }
  
  // Create positions
  for (const position of scope.positions) {
    await createBlockPosition({
      ...position,
      id: undefined,
      block_id: idMapping[position.block_id],
      context_block_id: idMapping[position.context_block_id]
    });
  }
  
  return {
    success: true,
    newWorkspaceId: targetWorkspaceId,
    newPageId: idMapping[scope.rootBlockId]
  };
}
```

## UI/UX Design

### Canvas Integration

#### Share Button Location
- **File**: `apps/web/src/domains/canvas/components/canvas/canvas-header.tsx`
- **Position**: Top-right toolbar, next to existing action buttons
- **Icon**: Share icon with dropdown for quick actions

#### Share Modal Design

```typescript
interface ShareModalProps {
  workspaceId: string;
  currentPageId?: string;
  onClose: () => void;
}

// Modal tabs
enum ShareModalTab {
  MEMBERS = "members",
  LINK = "link", 
  SCOPE = "scope",
  ADVANCED = "advanced"
}
```

**Members Tab**
- Organization auto-permissions toggle
- Default role selector (viewer/editor)
- Individual member list with role management
- Email invitation form
- Invitation status indicators

**Link Tab**
- Public link generation
- Link settings (expiry, password, indexing)
- Copy link functionality
- Link analytics (views, time spent)

**Scope Tab**
- Share target selection (workspace vs current page)
- Page tree preview for page sharing
- Breadcrumb navigation

**Advanced Tab**
- Duplicate permission toggle
- Watermark/branding options
- Public view UI restrictions

### Public View Design

#### Route Structure
```
/s/[token] → PublicCanvasView
├── Password verification (if required)
├── Canvas renderer (read-only)
├── Template duplication CTA
└── SEO meta tags
```

#### Read-Only Canvas
- **File**: `apps/web/src/domains/react-flow-canvas/components/public-canvas-view.tsx`
- **Features**:
  - Disabled editing tools
  - Minimized selection interactions
  - Removed context menus
  - Template duplication CTA button
  - Watermark (if enabled)

#### Template Duplication CTA
- **Position**: Top-right corner, prominent placement
- **Flow**: 
  1. "Duplicate to My Workspace" button
  2. Login/signup modal (if not authenticated)
  3. Workspace selection (if multiple workspaces)
  4. Confirmation and redirect to editor

## Security Considerations

### Link Security
- **Token Generation**: Cryptographically secure random tokens (32+ characters)
- **Expiration**: Configurable expiry dates
- **Password Protection**: Optional password with secure hashing
- **Rate Limiting**: Prevent abuse of link generation

### Access Control
- **Scope Enforcement**: Database-level scope validation
- **Permission Inheritance**: Clear permission hierarchy
- **Audit Logging**: Track access and modifications

### SEO & Privacy
- **Indexing Control**: Default noindex, explicit opt-in for public content
- **Robots Meta**: Dynamic robots meta tags based on settings
- **Analytics**: Track public view metrics without compromising privacy

## Performance Optimization

### Caching Strategy
```typescript
// Public view caching
const cacheKey = `public-canvas:${token}:${version}`;
const cachedCanvas = await redis.get(cacheKey);

if (!cachedCanvas) {
  const canvas = await loadPublicCanvas(token);
  await redis.setex(cacheKey, 3600, JSON.stringify(canvas)); // 1 hour TTL
}
```

### Database Optimization
- **Indexes**: Composite indexes on frequently queried combinations
- **Query Optimization**: Efficient scope determination queries
- **Connection Pooling**: Optimize for concurrent public access

## Analytics & Metrics

### Key Events
```typescript
interface SharingEvents {
  share_created: {
    targetType: ShareTarget;
    allowPublicLink: boolean;
    allowDuplicate: boolean;
  };
  share_member_added: {
    shareId: string;
    role: ShareRole;
    isOrgMember: boolean;
  };
  share_link_opened: {
    shareId: string;
    token: string;
    userAgent: string;
    referrer?: string;
  };
  template_duplicated: {
    shareId: string;
    targetWorkspaceId: string;
    scope: ShareTarget;
  };
}
```

### Success Metrics
- **Viral Coefficient**: Shares created per user
- **Conversion Rate**: Public view → signup conversion
- **Engagement**: Average time spent on public views
- **Template Adoption**: Duplication rate and usage

## Implementation Phases

### Phase 1: Public Links & Template Duplication
**Timeline**: 2-3 weeks
**Scope**:
- Basic share creation (page scope only)
- Public link generation and viewing
- Template duplication functionality
- Read-only canvas renderer

**Deliverables**:
- Database schema for `shares`, `share_links`
- Public view route (`/s/[token]`)
- Canvas sharing UI integration
- Template duplication flow

### Phase 2: Member Management
**Timeline**: 2-3 weeks
**Scope**:
- Organization auto-permissions
- Email invitations
- Member role management
- Invitation acceptance flow

**Deliverables**:
- `organization_members`, `workspace_members`, `share_members` tables
- Enhanced RLS policies
- Member management UI
- Email notification system

### Phase 3: Advanced Features
**Timeline**: 2-3 weeks
**Scope**:
- Workspace-level sharing
- Advanced link settings (password, expiry)
- SEO optimization options
- Analytics dashboard

**Deliverables**:
- Advanced sharing settings
- Analytics tracking
- Performance optimizations
- Security hardening

## Integration Points

### Canvas Domain Integration
```typescript
// apps/web/src/domains/canvas/hooks/use-canvas-sharing.ts
export function useCanvasSharing(workspaceId: string, pageId?: string) {
  const [shareConfig, setShareConfig] = useState<ShareConfig | null>(null);
  const [isPublicView, setIsPublicView] = useState(false);
  
  // Load share configuration
  // Handle public view mode
  // Manage sharing permissions
}
```

### React Flow Canvas Integration
```typescript
// apps/web/src/domains/react-flow-canvas/components/public-canvas-view.tsx
export function PublicCanvasView({ token }: { token: string }) {
  // Verify token and load canvas
  // Render read-only canvas
  // Show duplication CTA
  // Handle SEO meta tags
}
```

### API Integration
```typescript
// apps/web/src/lib/api/sharing.ts
export const sharingApi = {
  createShare: (data: CreateShareRequest) => 
    fetch('/api/shares', { method: 'POST', body: JSON.stringify(data) }),
  
  getPublicCanvas: (token: string) =>
    fetch(`/api/public/canvas/${token}`),
    
  duplicateTemplate: (shareId: string, targetWorkspaceId: string) =>
    fetch(`/api/shares/${shareId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ targetWorkspaceId })
    })
};
```

## Testing Strategy

### Unit Tests
- Share creation and validation
- Permission calculation logic
- Template duplication algorithm
- RLS policy verification

### Integration Tests
- API endpoint functionality
- Database transaction integrity
- Public view rendering
- Authentication flow

### E2E Tests
- Complete sharing workflow
- Public view user experience
- Template duplication process
- Cross-browser compatibility

## Monitoring & Alerting

### Key Metrics
- Public link access patterns
- Template duplication success rate
- API response times
- Error rates by endpoint

### Alerts
- High error rates on sharing endpoints
- Unusual traffic patterns
- Database performance degradation
- Security incidents (failed access attempts)

## Future Enhancements

### Advanced Features
- **Real-time Collaboration**: Live editing with multiple users
- **Version Control**: Track changes and enable rollbacks
- **Advanced Permissions**: Custom permission sets
- **Embedding**: Embed canvases in external websites

### Platform Integration
- **Social Sharing**: Direct sharing to social platforms
- **API Access**: Programmatic access to shared content
- **Webhook Support**: Notifications for sharing events
- **Third-party Integrations**: Slack, Discord, etc.

---

This architecture provides a comprehensive foundation for implementing the sharing domain while maintaining security, performance, and scalability. The phased approach allows for iterative development and validation of core functionality before adding advanced features.
