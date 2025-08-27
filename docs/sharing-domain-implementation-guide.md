# Sharing Domain - Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the Sharing Domain in our canvas-based platform. It covers database schema updates, API development, UI integration, and deployment considerations.

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database with RLS enabled
- Redis for caching
- Existing canvas domain implementation
- Authentication system (Clerk)

## Phase 1: Database Schema Implementation

### Step 1: Update Database Schema

Create a new migration file for the sharing domain:

```sql
-- apps/web/drizzle/migrations/000X_add_sharing_domain.sql

-- Enums
CREATE TYPE share_target AS ENUM ('workspace', 'page');
CREATE TYPE share_role AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'revoked');

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

-- Main sharing entity
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type share_target NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  page_block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  default_org_role share_role DEFAULT 'viewer',
  allow_public_link BOOLEAN DEFAULT false,
  allow_duplicate BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual share members
CREATE TABLE share_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES shares(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  invite_email TEXT,
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
  allow_indexing BOOLEAN DEFAULT false,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organization_members_org ON organization_members (organization_id);
CREATE INDEX idx_organization_members_user ON organization_members (user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members (workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members (user_id);
CREATE INDEX idx_shares_workspace ON shares (workspace_id);
CREATE INDEX idx_shares_page ON shares (page_block_id);
CREATE INDEX idx_share_members_share ON share_members (share_id);
CREATE INDEX idx_share_members_user ON share_members (user_id);
CREATE INDEX idx_share_members_email ON share_members (invite_email);
CREATE INDEX idx_share_links_token ON share_links (token);
CREATE INDEX idx_share_links_share ON share_links (share_id);

-- Constraints
ALTER TABLE organization_members ADD CONSTRAINT unique_org_member UNIQUE (organization_id, user_id);
ALTER TABLE workspace_members ADD CONSTRAINT unique_workspace_member UNIQUE (workspace_id, user_id);
ALTER TABLE share_members ADD CONSTRAINT unique_share_member UNIQUE (share_id, user_id) WHERE user_id IS NOT NULL;
ALTER TABLE share_members ADD CONSTRAINT unique_share_email UNIQUE (share_id, invite_email) WHERE invite_email IS NOT NULL;
```

### Step 2: Update Drizzle Schema

Add the new tables to your Drizzle schema:

```typescript
// apps/web/src/db/schema.ts

// Add these enums and tables to your existing schema
export const shareTargetEnum = pgEnum("share_target", ["workspace", "page"]);
export const shareRoleEnum = pgEnum("share_role", ["owner", "editor", "viewer"]);
export const inviteStatusEnum = pgEnum("invite_status", ["pending", "accepted", "revoked"]);

export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  organization_id: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: shareRoleEnum("role").notNull().default("viewer"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspace_id: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: shareRoleEnum("role").notNull().default("viewer"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shares = pgTable("shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  target_type: shareTargetEnum("target_type").notNull(),
  workspace_id: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  page_block_id: uuid("page_block_id").references(() => blocks.id, { onDelete: "cascade" }),
  created_by: text("created_by").references(() => users.id, { onDelete: "set null" }),
  default_org_role: shareRoleEnum("default_org_role").default("viewer"),
  allow_public_link: integer("allow_public_link").default(0).notNull(),
  allow_duplicate: integer("allow_duplicate").default(1).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shareMembers = pgTable("share_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  share_id: uuid("share_id").references(() => shares.id, { onDelete: "cascade" }).notNull(),
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  invite_email: text("invite_email"),
  role: shareRoleEnum("role").notNull().default("viewer"),
  status: inviteStatusEnum("status").default("pending").notNull(),
  inviter_user_id: text("inviter_user_id").references(() => users.id, { onDelete: "set null" }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shareLinks = pgTable("share_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  share_id: uuid("share_id").references(() => shares.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  is_enabled: integer("is_enabled").default(1).notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  password_hash: text("password_hash"),
  allow_indexing: integer("allow_indexing").default(0).notNull(),
  created_by: text("created_by").references(() => users.id, { onDelete: "set null" }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Add relations
export const sharesRelations = relations(shares, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [shares.workspace_id],
    references: [workspaces.id],
  }),
  pageBlock: one(blocks, {
    fields: [shares.page_block_id],
    references: [blocks.id],
  }),
  createdBy: one(users, {
    fields: [shares.created_by],
    references: [users.id],
  }),
  members: many(shareMembers),
  links: many(shareLinks),
}));

export const shareMembersRelations = relations(shareMembers, ({ one }) => ({
  share: one(shares, {
    fields: [shareMembers.share_id],
    references: [shares.id],
  }),
  user: one(users, {
    fields: [shareMembers.user_id],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [shareMembers.inviter_user_id],
    references: [users.id],
  }),
}));

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  share: one(shares, {
    fields: [shareLinks.share_id],
    references: [shares.id],
  }),
  createdBy: one(users, {
    fields: [shareLinks.created_by],
    references: [users.id],
  }),
}));
```

### Step 3: Update RLS Policies

Add enhanced RLS policies for the existing tables:

```sql
-- Enhanced blocks SELECT policy
DROP POLICY IF EXISTS "Enable read access for workspace members" ON blocks;

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

-- Apply similar policies to edges and block_positions tables
```

## Phase 2: API Implementation

### Step 1: Create Sharing Service

```typescript
// apps/web/src/lib/services/sharing-service.ts

import { db } from "@/db";
import { shares, shareLinks, shareMembers, blocks, edges, blockPositions } from "@/db/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export class SharingService {
  // Generate secure random token
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Create a new share
  async createShare(data: {
    targetType: 'workspace' | 'page';
    workspaceId: string;
    pageBlockId?: string;
    createdBy: string;
    allowPublicLink?: boolean;
    allowDuplicate?: boolean;
    defaultOrgRole?: 'viewer' | 'editor';
  }) {
    const share = await db.insert(shares).values({
      target_type: data.targetType,
      workspace_id: data.workspaceId,
      page_block_id: data.pageBlockId,
      created_by: data.createdBy,
      allow_public_link: data.allowPublicLink ? 1 : 0,
      allow_duplicate: data.allowDuplicate !== false ? 1 : 0,
      default_org_role: data.defaultOrgRole || 'viewer',
    }).returning();

    return share[0];
  }

  // Create a public link for a share
  async createPublicLink(data: {
    shareId: string;
    createdBy: string;
    expiresAt?: Date;
    password?: string;
    allowIndexing?: boolean;
  }) {
    const token = this.generateToken();
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    const link = await db.insert(shareLinks).values({
      share_id: data.shareId,
      token,
      is_enabled: 1,
      expires_at: data.expiresAt,
      password_hash: passwordHash,
      allow_indexing: data.allowIndexing ? 1 : 0,
      created_by: data.createdBy,
    }).returning();

    return link[0];
  }

  // Validate share token and get share info
  async validateShareToken(token: string) {
    const link = await db.query.shareLinks.findFirst({
      where: and(
        eq(shareLinks.token, token),
        eq(shareLinks.is_enabled, 1),
        or(
          isNull(shareLinks.expires_at),
          shareLinks.expires_at > new Date()
        )
      ),
      with: {
        share: {
          with: {
            workspace: true,
            pageBlock: true,
          }
        }
      }
    });

    return link;
  }

  // Get canvas data for public view
  async getPublicCanvasData(token: string) {
    const link = await this.validateShareToken(token);
    if (!link) throw new Error('Invalid or expired token');

    const { share } = link;
    
    if (share.target_type === 'workspace') {
      // Get all blocks in workspace
      const blocks = await db.query.blocks.findMany({
        where: eq(blocks.workspace_id, share.workspace_id),
        with: {
          positions: true,
        }
      });

      const edges = await db.query.edges.findMany({
        where: eq(edges.workspace_id, share.workspace_id),
      });

      return { blocks, edges, share };
    } else {
      // Get page and all contained blocks
      const pageTree = await this.getPageTree(share.page_block_id!);
      return { ...pageTree, share };
    }
  }

  // Get page tree (page and all contained blocks)
  private async getPageTree(pageId: string) {
    // This is a simplified version - you'll need to implement
    // the recursive query to get all contained blocks
    const blocks = await db.query.blocks.findMany({
      where: eq(blocks.id, pageId),
      with: {
        positions: true,
      }
    });

    const edges = await db.query.edges.findMany({
      where: eq(edges.source_block_id, pageId),
    });

    return { blocks, edges };
  }

  // Duplicate template
  async duplicateTemplate(data: {
    shareId: string;
    targetWorkspaceId: string;
    userId: string;
  }) {
    const share = await db.query.shares.findFirst({
      where: eq(shares.id, data.shareId),
      with: {
        workspace: true,
      }
    });

    if (!share || !share.allow_duplicate) {
      throw new Error('Template duplication not allowed');
    }

    // Get source data
    const sourceData = await this.getPublicCanvasData(share.id);
    
    // Duplicate blocks and edges
    const idMapping = new Map<string, string>();
    
    // Create blocks in topological order
    for (const block of sourceData.blocks) {
      const newBlock = await db.insert(blocks).values({
        ...block,
        id: undefined,
        workspace_id: data.targetWorkspaceId,
        parent_block_id: idMapping.get(block.parent_block_id || '') || null,
      }).returning();

      idMapping.set(block.id, newBlock[0].id);
    }

    // Create edges with mapped IDs
    for (const edge of sourceData.edges) {
      await db.insert(edges).values({
        ...edge,
        id: undefined,
        workspace_id: data.targetWorkspaceId,
        source_block_id: idMapping.get(edge.source_block_id)!,
        target_block_id: idMapping.get(edge.target_block_id)!,
      });
    }

    // Create positions
    for (const block of sourceData.blocks) {
      for (const position of block.positions) {
        await db.insert(blockPositions).values({
          ...position,
          id: undefined,
          block_id: idMapping.get(block.id)!,
          context_block_id: idMapping.get(position.context_block_id)!,
        });
      }
    }

    return {
      success: true,
      newWorkspaceId: data.targetWorkspaceId,
      newPageId: share.target_type === 'page' ? idMapping.get(share.page_block_id!) : null,
    };
  }
}

export const sharingService = new SharingService();
```

### Step 2: Create API Routes

```typescript
// apps/web/src/app/api/shares/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { sharingService } from "@/lib/services/sharing-service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, workspaceId, pageBlockId, allowPublicLink, allowDuplicate, defaultOrgRole } = body;

    const share = await sharingService.createShare({
      targetType,
      workspaceId,
      pageBlockId,
      createdBy: userId,
      allowPublicLink,
      allowDuplicate,
      defaultOrgRole,
    });

    return NextResponse.json(share);
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

```typescript
// apps/web/src/app/api/shares/[id]/links/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { sharingService } from "@/lib/services/sharing-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { expiresAt, password, allowIndexing } = body;

    const link = await sharingService.createPublicLink({
      shareId: params.id,
      createdBy: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      password,
      allowIndexing,
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error creating public link:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

```typescript
// apps/web/src/app/api/shares/[id]/duplicate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { sharingService } from "@/lib/services/sharing-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetWorkspaceId } = body;

    const result = await sharingService.duplicateTemplate({
      shareId: params.id,
      targetWorkspaceId,
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error duplicating template:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

```typescript
// apps/web/src/app/api/public/canvas/[token]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { sharingService } from "@/lib/services/sharing-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const canvasData = await sharingService.getPublicCanvasData(params.token);
    return NextResponse.json(canvasData);
  } catch (error) {
    console.error('Error getting public canvas:', error);
    return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
  }
}
```

### Step 3: Create Public View Route

```typescript
// apps/web/src/app/s/[token]/page.tsx

import { notFound } from "next/navigation";
import { sharingService } from "@/lib/services/sharing-service";
import { PublicCanvasView } from "@/domains/react-flow-canvas/components/public-canvas-view";

interface PublicCanvasPageProps {
  params: { token: string };
}

export default async function PublicCanvasPage({ params }: PublicCanvasPageProps) {
  try {
    const link = await sharingService.validateShareToken(params.token);
    if (!link) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-background">
        <PublicCanvasView token={params.token} />
      </div>
    );
  } catch (error) {
    console.error('Error loading public canvas:', error);
    notFound();
  }
}
```

## Phase 3: UI Integration

### Step 1: Create Share Modal Component

```typescript
// apps/web/src/domains/canvas/components/share-modal.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Share2, Users, Link, Settings } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  pageId?: string;
}

export function ShareModal({ isOpen, onClose, workspaceId, pageId }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState("link");
  const [isLoading, setIsLoading] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const handleCreatePublicLink = async () => {
    setIsLoading(true);
    try {
      // Create share first
      const shareResponse = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: pageId ? 'page' : 'workspace',
          workspaceId,
          pageBlockId: pageId,
          allowPublicLink: true,
          allowDuplicate: true,
        }),
      });

      const share = await shareResponse.json();

      // Create public link
      const linkResponse = await fetch(`/api/shares/${share.id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowIndexing: false,
        }),
      });

      const link = await linkResponse.json();
      setPublicLink(`${window.location.origin}/s/${link.token}`);
    } catch (error) {
      console.error('Error creating public link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (publicLink) {
      await navigator.clipboard.writeText(publicLink);
      // Show toast notification
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Canvas
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Public Link</Label>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view this canvas
              </p>
            </div>

            {!publicLink ? (
              <Button onClick={handleCreatePublicLink} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Public Link"}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={publicLink} readOnly />
                  <Button onClick={handleCopyLink} size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Link created successfully
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="space-y-2">
              <Label>Invite People</Label>
              <p className="text-sm text-muted-foreground">
                Invite specific people to collaborate
              </p>
            </div>
            
            <div className="space-y-2">
              <Input placeholder="Enter email address" />
              <Button>Send Invitation</Button>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Duplication</Label>
                  <p className="text-sm text-muted-foreground">
                    Let others copy this template
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Search Engine Indexing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow search engines to index this content
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 2: Add Share Button to Canvas Header

```typescript
// apps/web/src/domains/canvas/components/canvas/canvas-header.tsx

// Add to existing imports
import { Share2 } from "lucide-react";
import { ShareModal } from "../share-modal";

// Add to component state
const [isShareModalOpen, setIsShareModalOpen] = useState(false);

// Add share button to toolbar
<Button
  variant="ghost"
  size="sm"
  onClick={() => setIsShareModalOpen(true)}
  className="flex items-center gap-2"
>
  <Share2 className="h-4 w-4" />
  Share
</Button>

// Add modal at the end of component
<ShareModal
  isOpen={isShareModalOpen}
  onClose={() => setIsShareModalOpen(false)}
  workspaceId={workspaceId}
  pageId={currentPageId}
/>
```

### Step 3: Create Public Canvas View Component

```typescript
// apps/web/src/domains/react-flow-canvas/components/public-canvas-view.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { ReactFlow, Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

interface PublicCanvasViewProps {
  token: string;
}

export function PublicCanvasView({ token }: PublicCanvasViewProps) {
  const [canvasData, setCanvasData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCanvas = async () => {
      try {
        const response = await fetch(`/api/public/canvas/${token}`);
        if (!response.ok) {
          throw new Error('Canvas not found');
        }
        const data = await response.json();
        setCanvasData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load canvas');
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvas();
  }, [token]);

  const handleDuplicate = async () => {
    // Redirect to login/signup if not authenticated
    // Then handle duplication
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    // Show toast notification
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Canvas Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              {canvasData?.share?.pageBlock?.name || 'Shared Canvas'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            
            {canvasData?.share?.allow_duplicate && (
              <Button onClick={handleDuplicate}>
                <Download className="h-4 w-4 mr-2" />
                Duplicate to My Workspace
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={canvasData?.blocks?.map((block: any) => ({
            id: block.id,
            type: 'default',
            position: { x: block.positions?.[0]?.x_position || 0, y: block.positions?.[0]?.y_position || 0 },
            data: { label: block.name },
          })) || []}
          edges={canvasData?.edges?.map((edge: any) => ({
            id: edge.id,
            source: edge.source_block_id,
            target: edge.target_block_id,
            type: 'default',
          })) || []}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
```

## Phase 4: Testing & Deployment

### Step 1: Create Tests

```typescript
// apps/web/src/lib/services/__tests__/sharing-service.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SharingService } from '../sharing-service';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
    query: {
      shares: {
        findFirst: vi.fn(),
      },
      shareLinks: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe('SharingService', () => {
  let service: SharingService;

  beforeEach(() => {
    service = new SharingService();
    vi.clearAllMocks();
  });

  describe('createShare', () => {
    it('should create a share with correct data', async () => {
      const mockShare = { id: '1', target_type: 'page', workspace_id: 'ws1' };
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockShare]),
        }),
      } as any);

      const result = await service.createShare({
        targetType: 'page',
        workspaceId: 'ws1',
        pageBlockId: 'page1',
        createdBy: 'user1',
        allowPublicLink: true,
      });

      expect(result).toEqual(mockShare);
    });
  });

  describe('validateShareToken', () => {
    it('should return null for invalid token', async () => {
      vi.mocked(db.query.shareLinks.findFirst).mockResolvedValue(null);

      const result = await service.validateShareToken('invalid-token');

      expect(result).toBeNull();
    });
  });
});
```

### Step 2: Environment Configuration

```typescript
// apps/web/src/lib/config/sharing.ts

export const sharingConfig = {
  // Token generation
  tokenLength: 32,
  tokenExpiryDays: 30,
  
  // Rate limiting
  maxLinksPerShare: 5,
  maxSharesPerUser: 100,
  
  // Caching
  cacheTtl: 3600, // 1 hour
  
  // Security
  passwordMinLength: 6,
  maxLoginAttempts: 5,
  
  // Analytics
  trackPublicViews: true,
  trackDuplications: true,
};
```

### Step 3: Deployment Checklist

- [ ] Database migrations applied
- [ ] RLS policies updated
- [ ] API routes deployed
- [ ] Environment variables configured
- [ ] Redis cache configured
- [ ] CDN configured for static assets
- [ ] Monitoring and alerting set up
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] User acceptance testing completed

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Check that `app.user_id` and `app.share_token` are properly set
   - Verify policy syntax and table references
   - Test with different user roles

2. **Performance Issues**
   - Monitor database query performance
   - Implement caching for public views
   - Optimize recursive queries for page trees

3. **Security Issues**
   - Validate token generation randomness
   - Check password hashing implementation
   - Verify scope enforcement

### Debug Tools

```typescript
// Debug middleware for development
export function debugSharingMiddleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Share Token:', req.headers.get('x-share-token'));
    console.log('User ID:', req.headers.get('x-user-id'));
  }
}
```

---

This implementation guide provides a comprehensive roadmap for building the sharing domain. Follow the phases sequentially and test thoroughly at each step. The modular approach allows for incremental development and validation.
