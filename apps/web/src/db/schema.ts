import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { anonRole, authenticatedRole } from 'drizzle-orm/supabase';

import { users } from './external-schema';

// Enums
export const userTypeEnum = pgEnum('user_type', ['ADMIN', 'GENERAL']);
export const organizationTypeEnum = pgEnum('organization_type', [
  'personal',
  'education',
  'startup',
  'agency',
  'company',
  'n/a',
]);
export const memberRoleEnum = pgEnum('member_role', [
  'owner',
  'admin',
  'member',
]);
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'rejected',
  'expired',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'invitation',
  'workspace-invitation',
  'system',
  'announcement',
]);

// Canvas Management Domain Enums
export const canvasEdgeShapeEnum = pgEnum('canvas_edge_shape', [
  'default',
  'straight',
  'step',
  'smoothstep',
  'simplebezier',
]);

export const edgeMarkerEnum = pgEnum('edge_marker', [
  'none',
  'arrow',
  'arrow-open',
  'circle',
  'circle-open',
  'diamond',
  'diamond-open',
]);

export const alignmentTypeEnum = pgEnum('alignment_type', [
  'TOP',
  'BOTTOM',
  'LEFT',
  'RIGHT',
  'HORIZONTAL_CENTER',
  'VERTICAL_CENTER',
  'HORIZONTAL_DISTRIBUTE',
  'VERTICAL_DISTRIBUTE',
]);

// Canvas Management Domain Enums - Block View Mode
export const blockViewModeEnum = pgEnum('block_view_mode', [
  'note',
  'original',
  'card',
]);

// Block Management Domain Enums
export const blockTypeEnum = pgEnum('block_type', [
  'text', // 텍스트 블록
  'shape', // 도형 블록
  'image', // 이미지 블록
  'markdown', // 마크다운 블록
  'link', // 링크 블록
  'youtube', // 유튜브 블록
  'pdf', // PDF 문서 블록
  'audio', // 오디오 블록
  'video', // 비디오 블록
  'file', // 파일 블록
  'python', // 파이썬 코드 블록
  'page_mention', // 페이지 멘션 블록
  'latex', // 라텍스 블록
  'react_component', // 리액트 컴포넌트 블록
  'github_branch', // 깃헙 브랜치 블록
  'github_commit', // 깃헙 커밋 블록
  'github_pr', // 깃헙 PR 블록
  'react_preview', // 리액트 프리뷰 블록 (Sandbox)
  'vercel_deployment', // Vercel 배포 블록
]);

export const propertyTypeEnum = pgEnum('property_type', [
  'text', // 텍스트 속성
  'url', // URL 속성
  'email', // 이메일 속성
  'phone', // 전화번호 속성
  'select', // 선택형 속성
  'multiselect', // 멀티선택형 속성
  'status', // 상태형 속성
  'datetime', // 날짜/날짜시간 속성 (시간 옵션 포함)
  'media', // 미디어 속성
  'profile', // 프로필 속성
]);

// Beta Management Enum
export const betaStatusEnum = pgEnum('beta_status', [
  'pending', // 신청서 작성 대기 또는 검토 중
  'approved', // 승인됨 (전체 기능 사용 가능)
]);

// Share Management Domain Enums
export const publishedPageStatusEnum = pgEnum('published_page_status', [
  'published', // 게시됨
  'unpublished', // 게시 취소됨
]);

// AI Management Domain Enums
export const eventTypeEnum = pgEnum('event_type', [
  'user_utterance', // 사용자 발화
  'ai_response', // AI 응답
  'tool_call', // 툴 호출
  'block', // 블럭 이벤트
  'edge', // 엣지 이벤트
  'component', // 컴포넌트 이벤트
  'instance', // 인스턴스 이벤트
  'property', // 속성 이벤트
  'property_value', // 속성값 이벤트
  'block_action', // 블럭 액션 이벤트
]);

export const eventActionEnum = pgEnum('event_action', [
  'created', // 생성
  'updated', // 수정
  'deleted', // 삭제
  'duplicated', // 복제
  'set', // 설정 (속성값)
  'reset', // 리셋 (속성값)
]);

// Profiles Table
// 🔐 RLS Strategy: Minimal permissions
// - SELECT: Public (all users can read profiles for collaboration)
// - INSERT/UPDATE/DELETE: Self only
//
// ⚠️ Design Decision: profiles.id = users.id (auth.users.id)
// - 단순성: userId → profileId 변환 불필요
// - 일관성: 전체 시스템에서 동일한 ID 사용
// - 성능: 추가 JOIN 불필요
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'set null' }), // users.id와 동일
    email: text('email').notNull().unique(),
    name: text('name'),
    avatar_url: text('avatar_url'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }), // Soft delete (30-day retention policy)
    user_type: userTypeEnum('user_type').default('GENERAL').notNull(),
    // Beta Access Fields
    beta_status: betaStatusEnum('beta_status').default('pending').notNull(),
    beta_application: jsonb('beta_application'), // 신청서 데이터 (JSON)
    beta_applied_at: timestamp('beta_applied_at', { withTimezone: true }),
    beta_approved_at: timestamp('beta_approved_at', { withTimezone: true }),
    beta_approved_by: uuid('beta_approved_by'), // FK constraint added in migration
  },
  table => [
    // Performance index for email search
    index('idx_profiles_email').on(table.email),
    // Beta status indexes
    index('idx_profiles_beta_status')
      .on(table.beta_status)
      .where(sql`deleted_at IS NULL`),
    index('idx_profiles_beta_pending')
      .on(table.beta_status, table.beta_applied_at)
      .where(sql`beta_status = 'pending' AND deleted_at IS NULL`),
    // SELECT: Public (for displaying member names, avatars, etc.)
    pgPolicy('Enable read access for all users', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`true`,
    }),
    // INSERT: Self only
    pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = id`,
    }),
    // UPDATE: Self only
    pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = id`,
      withCheck: sql`(select auth.uid()) = id`,
    }),
    // DELETE: Self only
    pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = id`,
    }),
  ]
).enableRLS();

// Organizations Table
// 🔐 RLS Strategy: Minimal permissions
// - SELECT: Public (for displaying organization names, etc.)
// - INSERT: Self as owner
// - UPDATE/DELETE: Owner only
export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    organization_type: organizationTypeEnum('organization_type')
      .notNull()
      .default('n/a'),
    owner_id: uuid('owner_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    is_default: boolean('is_default').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    unique('organizations_unique_default_per_owner').on(
      table.owner_id,
      table.is_default
    ),
    // SELECT: Public (for displaying organization info)
    pgPolicy('Enable read access for owner', {
      for: 'select',
      to: [anonRole, authenticatedRole],
      using: sql`(select auth.uid()) = owner_id`,
    }),
    // INSERT: Self as owner
    pgPolicy('Enable insert for owner', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = owner_id`,
    }),
    // UPDATE: Owner only
    pgPolicy('Enable update for owner', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = owner_id`,
      withCheck: sql`(select auth.uid()) = owner_id`,
    }),
    // DELETE: Owner only
    pgPolicy('Enable delete for owner', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = owner_id`,
    }),
  ]
).enableRLS();

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.id],
    references: [users.id],
  }),
  ownedOrganizations: many(organizations),
}));

// Organization Members Table
// 🔐 RLS Strategy: Minimal permissions (Simple safety net)
// - SELECT: Self only
// - INSERT/UPDATE/DELETE: Self only
// - Complex permissions (Owner/Admin viewing all members) handled in Application layer with adminDb
export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('member'),
    joined_at: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(), // Audit trail
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(), // Audit trail
  },
  table => [
    unique('organization_members_unique').on(
      table.organization_id,
      table.user_id
    ),
    // Performance indexes
    index('idx_org_members_org_id').on(table.organization_id),
    index('idx_org_members_user_id').on(table.user_id),
    // SELECT: Self only (Application uses adminDb for Owner/Admin to view all members)
    pgPolicy('Enable read access for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    // INSERT: Self only (Service checks Owner/Admin permission before calling)
    pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
    // UPDATE: Self only (Service checks Owner permission before calling)
    pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    // DELETE: Self only (Service checks Owner permission before calling)
    pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
  ]
).enableRLS();

// Invitations Table
// 🔐 RLS Strategy: Minimal permissions (Simple safety net)
// - SELECT: Inviter or invitee
// - INSERT: Inviter only (Service checks Owner/Admin permission)
// - UPDATE: Invitee only (for accepting/rejecting)
// - Note: Admin check would cause recursion, so handled in Application layer
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    inviter_user_id: uuid('inviter_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    invitee_email: text('invitee_email').notNull(),
    invitee_user_id: uuid('invitee_user_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    role: memberRoleEnum('role').notNull().default('member'),
    status: invitationStatusEnum('status').notNull().default('pending'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    responded_at: timestamp('responded_at', { withTimezone: true }),
    expires_at: timestamp('expires_at', { withTimezone: true })
      .notNull()
      .$defaultFn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
  },
  table => [
    unique('invitations_unique_pending_per_email').on(
      table.organization_id,
      table.invitee_email,
      table.status
    ),
    // Performance indexes
    index('idx_invitations_org_status')
      .on(table.organization_id, table.status)
      .where(sql`status = 'pending'`),
    // SELECT: Inviter or invitee
    pgPolicy('Enable read for inviter and invitee', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = inviter_user_id OR (select auth.uid()) = invitee_user_id`,
    }),
    // INSERT: Inviter only (Service checks if inviter is Owner/Admin before calling)
    pgPolicy('Enable insert for inviter', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = inviter_user_id`,
    }),
    // UPDATE: Invitee only (for accepting/rejecting invitations)
    pgPolicy('Enable update for invitee', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = invitee_user_id`,
    }),
  ]
).enableRLS();

// Notifications Table
// 🔐 RLS Strategy: Minimal permissions (Simple safety net)
// - SELECT: Self only
// - INSERT: Self only
// - UPDATE: Self only (for marking as read)
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    related_id: uuid('related_id'), // UUID (for invitation IDs, etc.)
    is_read: boolean('is_read').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    read_at: timestamp('read_at', { withTimezone: true }),
  },
  table => [
    // SELECT: Self only
    pgPolicy('Enable read for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
    // INSERT: Self only
    pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`(select auth.uid()) = user_id`,
    }),
    // UPDATE: Self only (for marking notifications as read)
    pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = user_id`,
    }),
  ]
).enableRLS();

// Workspace Management Domain Tables
// =================================

// Workspaces Table
// 🔐 RLS Strategy: Layered Security Model
// - RLS: Self only (creator only, fail-safe)
// - Application: All business permissions (org member, workspace member, admin, etc.)
// - adminDb: Used after Application-level permission checks
export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organization_id: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    is_default: boolean('is_default').notNull().default(false),
    is_personal: boolean('is_personal').notNull().default(false), // v1.2: 개인 워크스페이스 구분
    owner_id: uuid('owner_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }), // v1.2: 개인 워크스페이스 소유자
    deletable: boolean('deletable').notNull().default(true),
    created_by: uuid('created_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }), // Soft delete (30-day retention)
  },
  table => ({
    // Unique constraint: Only one default workspace per organization
    // Note: Partial unique index (WHERE is_default = true)는 Drizzle ORM에서 직접 지원하지 않음
    // → Migration 파일에서 수동으로 추가 필요
    // uniqueDefaultPerOrg: unique('workspaces_unique_default_per_org').on(
    //   table.organization_id,
    //   table.is_default
    // ),

    // CHECK constraints
    nameLengthCheck: check(
      'workspaces_name_length',
      sql`LENGTH(TRIM(${table.name})) BETWEEN 1 AND 100`
    ),
    descriptionLengthCheck: check(
      'workspaces_description_length',
      sql`${table.description} IS NULL OR LENGTH(${table.description}) <= 500`
    ),
    defaultNotDeletableCheck: check(
      'workspaces_default_not_deletable',
      sql`NOT (${table.is_default} = true AND ${table.deletable} = true)`
    ),
    // v1.2: 개인 워크스페이스 제약조건
    personalOwnerRequiredCheck: check(
      'workspaces_personal_owner_required',
      sql`${table.is_personal} = false OR ${table.owner_id} IS NOT NULL`
    ),
    defaultPersonalMutuallyExclusiveCheck: check(
      'workspaces_default_personal_mutually_exclusive',
      sql`NOT (${table.is_default} = true AND ${table.is_personal} = true)`
    ),

    // Indexes for performance
    orgIdIdx: index('idx_workspaces_organization_id')
      .on(table.organization_id)
      .where(sql`deleted_at IS NULL`),
    // v1.2: 개인 워크스페이스 인덱스
    personalIdx: index('idx_workspaces_personal')
      .on(table.organization_id, table.is_personal)
      .where(sql`is_personal = true AND deleted_at IS NULL`),
    personalOwnerIdx: index('idx_workspaces_personal_owner')
      .on(table.owner_id)
      .where(sql`is_personal = true AND deleted_at IS NULL`),
    defaultIdx: index('idx_workspaces_default')
      .on(table.organization_id, table.is_default)
      .where(sql`is_default = true`),
    // Read Model: Workspace By Org View 최적화
    // owner_id 필터 최적화 (WHERE 절 OR 조건)
    ownerIdIdx: index('idx_workspaces_owner_id')
      .on(table.owner_id)
      .where(sql`deleted_at IS NULL AND owner_id IS NOT NULL`),
    // GROUP BY + jsonb_agg 내부 정렬 최적화
    // organization_id로 그룹핑하면서 그룹 내 정렬(is_default DESC, created_at ASC) 지원
    orgGroupAggSortIdx: index('idx_workspaces_org_group_agg_sort')
      .on(table.organization_id, table.is_default, table.created_at)
      .where(sql`deleted_at IS NULL`),

    // RLS Policies
    // SELECT: Creator only (Application uses adminDb for org members)
    selectPolicy: pgPolicy('Enable read for creator', {
      for: 'select',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
    // INSERT: Creator only
    insertPolicy: pgPolicy('Enable insert for creator', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`created_by = (select auth.uid())`,
    }),
    // UPDATE: Creator only
    updatePolicy: pgPolicy('Enable update for creator', {
      for: 'update',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
    // DELETE: Creator only
    deletePolicy: pgPolicy('Enable delete for creator', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
  })
).enableRLS();

// Pages Table
// 🔐 RLS Strategy: Layered Security Model
// - RLS: Self only (creator only, fail-safe)
// - Application: All business permissions (workspace member check)
// - adminDb: Used after Application-level permission checks
export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    parent_id: uuid('parent_id'), // Self-referencing FK (handled in migration)
    title: text('title').notNull(),
    icon: text('icon'),
    order: text('order').notNull(),
    depth: integer('depth').notNull().default(0), // Cached depth (0 = root)
    created_by: uuid('created_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }), // Soft delete
  },
  table => ({
    // Self-referencing FK for parent_id (added in migration)
    parentIdFk: sql`ALTER TABLE pages ADD CONSTRAINT pages_parent_id_pages_id_fk FOREIGN KEY (parent_id) REFERENCES pages(id) ON DELETE CASCADE`,

    // CHECK constraints
    titleLengthCheck: check(
      'pages_title_length',
      sql`LENGTH(TRIM(${table.title})) BETWEEN 1 AND 200`
    ),
    depthNonNegativeCheck: check(
      'pages_depth_non_negative',
      sql`${table.depth} >= 0`
    ),
    depthRootConsistencyCheck: check(
      'pages_depth_root_consistency',
      sql`(${table.parent_id} IS NULL AND ${table.depth} = 0) OR (${table.parent_id} IS NOT NULL AND ${table.depth} > 0)`
    ),
    orderValidFormatCheck: check(
      'pages_order_valid_format',
      sql`${table.order} ~ '^[a-zA-Z0-9]+$' AND LENGTH(${table.order}) <= 100`
    ),

    // Indexes for tree query optimization
    workspaceIdIdx: index('idx_pages_workspace_id')
      .on(table.workspace_id)
      .where(sql`deleted_at IS NULL`),
    parentIdIdx: index('idx_pages_parent_id')
      .on(table.parent_id)
      .where(sql`deleted_at IS NULL`),
    treeQueryIdx: index('idx_pages_tree_query')
      .on(table.workspace_id, table.depth, table.order)
      .where(sql`deleted_at IS NULL`),
    ancestorsIdx: index('idx_pages_ancestors')
      .on(table.id, table.parent_id)
      .where(sql`deleted_at IS NULL`),

    // RLS Policies
    // SELECT: Creator only (Application uses adminDb for workspace members)
    selectPolicy: pgPolicy('Enable read for creator', {
      for: 'select',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
    // INSERT: Creator only
    insertPolicy: pgPolicy('Enable insert for creator', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`created_by = (select auth.uid())`,
    }),
    // UPDATE: Creator only
    updatePolicy: pgPolicy('Enable update for creator', {
      for: 'update',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
    // DELETE: Creator only
    deletePolicy: pgPolicy('Enable delete for creator', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`created_by = (select auth.uid())`,
    }),
  })
).enableRLS();

// Workspace Members Table
// 🔐 RLS Strategy: Self only
// - Application: Admin permission checks before using adminDb
// - Note: role은 organization_members에서 관리 (권한 단일화)
export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    joined_at: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    // Composite primary key
    pk: sql`ALTER TABLE workspace_members ADD PRIMARY KEY (workspace_id, user_id)`,

    // Indexes for performance
    userIdIdx: index('idx_workspace_members_user_id').on(table.user_id),
    workspaceIdIdx: index('idx_workspace_members_workspace_id').on(
      table.workspace_id
    ),

    // RLS Policies
    // SELECT: Self only
    selectPolicy: pgPolicy('Enable read for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    // INSERT: Self only
    insertPolicy: pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
    // UPDATE: Self only
    updatePolicy: pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    // DELETE: Self only
    deletePolicy: pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
  })
).enableRLS();

// Page Favorites Table
// 🔐 RLS Strategy: Self only (personal data)
export const pageFavorites = pgTable(
  'page_favorites',
  {
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    favorited_at: timestamp('favorited_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    // Composite primary key
    pk: sql`ALTER TABLE page_favorites ADD PRIMARY KEY (page_id, user_id)`,

    // Index for user's favorites lookup
    userIdIdx: index('idx_page_favorites_user_id').on(table.user_id),

    // RLS Policies
    // SELECT: Self only
    selectPolicy: pgPolicy('Enable read for self', {
      for: 'select',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    // INSERT: Self only
    insertPolicy: pgPolicy('Enable insert for self', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`user_id = (select auth.uid())`,
    }),
    // UPDATE: Self only
    updatePolicy: pgPolicy('Enable update for self', {
      for: 'update',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
    // DELETE: Self only
    deletePolicy: pgPolicy('Enable delete for self', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`user_id = (select auth.uid())`,
    }),
  })
).enableRLS();

// Workspace Invitations Table
// 🔐 RLS Strategy: Invited user or inviter can access
// - SELECT: Invited user or inviter
// - INSERT: Inviter only (Application checks Admin permission before calling)
// - UPDATE: Invited user only (for accepting/rejecting)
// - DELETE: Inviter only (for canceling invitation)
export const workspaceInvitations = pgTable(
  'workspace_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    invited_user_id: uuid('invited_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    invited_by: uuid('invited_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    status: invitationStatusEnum('status').default('pending').notNull(),
    notification_id: uuid('notification_id'), // Soft reference to Notification Domain
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    processed_at: timestamp('processed_at', { withTimezone: true }),
  },
  table => ({
    // Indexes
    userStatusIdx: index('idx_workspace_invitations_user').on(
      table.invited_user_id,
      table.status
    ),
    workspaceStatusIdx: index('idx_workspace_invitations_workspace').on(
      table.workspace_id,
      table.status
    ),

    // Unique constraint: prevent duplicate pending invitations
    uniquePendingIdx: index('idx_workspace_invitations_unique_pending')
      .on(table.workspace_id, table.invited_user_id, table.status)
      .where(sql`status = 'pending'`),

    // RLS Policies
    // SELECT: Invited user or inviter
    selectPolicy: pgPolicy('Enable read for invited user or inviter', {
      for: 'select',
      to: authenticatedRole,
      using: sql`invited_user_id = (select auth.uid()) OR invited_by = (select auth.uid())`,
    }),
    // INSERT: Inviter only
    insertPolicy: pgPolicy('Enable insert for inviter', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`invited_by = (select auth.uid())`,
    }),
    // UPDATE: Invited user only
    updatePolicy: pgPolicy('Enable update for invited user', {
      for: 'update',
      to: authenticatedRole,
      using: sql`invited_user_id = (select auth.uid())`,
    }),
    // DELETE: Inviter only
    deletePolicy: pgPolicy('Enable delete for inviter', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`invited_by = (select auth.uid())`,
    }),
  })
).enableRLS();

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(profiles, {
      fields: [organizations.owner_id],
      references: [profiles.id],
    }),
    members: many(organizationMembers),
    invitations: many(invitations),
    workspaces: many(workspaces),
  })
);

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organization_id],
      references: [organizations.id],
    }),
    user: one(profiles, {
      fields: [organizationMembers.user_id],
      references: [profiles.id],
    }),
  })
);

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organization_id],
    references: [organizations.id],
  }),
  inviter: one(profiles, {
    fields: [invitations.inviter_user_id],
    references: [profiles.id],
  }),
  invitee: one(profiles, {
    fields: [invitations.invitee_user_id],
    references: [profiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.user_id],
    references: [profiles.id],
  }),
}));

// Workspace Management Domain Relations
export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [workspaces.organization_id],
    references: [organizations.id],
  }),
  creator: one(profiles, {
    fields: [workspaces.created_by],
    references: [profiles.id],
  }),
  pages: many(pages),
  members: many(workspaceMembers),
  invitations: many(workspaceInvitations),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [pages.workspace_id],
    references: [workspaces.id],
  }),
  parent: one(pages, {
    fields: [pages.parent_id],
    references: [pages.id],
    relationName: 'pageHierarchy',
  }),
  children: many(pages, {
    relationName: 'pageHierarchy',
  }),
  creator: one(profiles, {
    fields: [pages.created_by],
    references: [profiles.id],
  }),
  favorites: many(pageFavorites),
  // Canvas Management Domain relations
  blockMounts: many(blockMounts),
  edges: many(edges),
  viewports: many(viewports),
  // AI Management Domain relations
  eventLogs: many(eventLogs),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspace_id],
      references: [workspaces.id],
    }),
    user: one(profiles, {
      fields: [workspaceMembers.user_id],
      references: [profiles.id],
    }),
  })
);

export const pageFavoritesRelations = relations(pageFavorites, ({ one }) => ({
  page: one(pages, {
    fields: [pageFavorites.page_id],
    references: [pages.id],
  }),
  user: one(profiles, {
    fields: [pageFavorites.user_id],
    references: [profiles.id],
  }),
}));

export const workspaceInvitationsRelations = relations(
  workspaceInvitations,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvitations.workspace_id],
      references: [workspaces.id],
    }),
    invitedUser: one(profiles, {
      fields: [workspaceInvitations.invited_user_id],
      references: [profiles.id],
      relationName: 'workspaceInvitedUser',
    }),
    inviter: one(profiles, {
      fields: [workspaceInvitations.invited_by],
      references: [profiles.id],
      relationName: 'workspaceInviter',
    }),
  })
);

// Canvas Management Domain Tables
// ================================

// Blocks Table
// 🔐 RLS Strategy: Basic authenticated user access
export const blocks = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspace_id: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    block_type: blockTypeEnum('block_type').notNull().default('text'),
    title: text('title').notNull().default('새 블럭'), // 블록 제목
    metadata: jsonb('metadata').default({}), // Deprecated: properties로 대체됨 (호환성 유지)
    properties: jsonb('properties').default({}), // 속성 값 저장 (JSONB) - key-value 형태
    content: jsonb('content'), // Tiptap JSON content (for markdown blocks, etc.)
    content_raw: text('content_raw'), // Raw markdown text (for context, generated from Tiptap JSON)
    custom_properties: jsonb('custom_properties').default([]), // 커스텀 속성 정의 저장 (JSONB 배열) - 속성 스키마
    created_by: uuid('created_by').references(() => profiles.id, {
      onDelete: 'set null',
    }), // 작성자 ID
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  table => ({
    // Indexes for performance
    workspaceIdIdx: index('idx_blocks_workspace_id')
      .on(table.workspace_id)
      .where(sql`deleted_at IS NULL`),
    typeIdx: index('idx_blocks_type')
      .on(table.block_type)
      .where(sql`deleted_at IS NULL`),
    createdAtIndex: index('idx_blocks_created_at')
      .on(table.created_at)
      .where(sql`deleted_at IS NULL`),
    idActiveIdx: index('idx_blocks_id_active')
      .on(table.id)
      .where(sql`deleted_at IS NULL`),

    // RLS Policies - Basic authenticated user access
    selectPolicy: pgPolicy('Enable read for authenticated users', {
      for: 'select',
      to: authenticatedRole,
      using: sql`true`,
    }),
    insertPolicy: pgPolicy('Enable insert for authenticated users', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
    updatePolicy: pgPolicy('Enable update for authenticated users', {
      for: 'update',
      to: authenticatedRole,
      using: sql`true`,
    }),
    deletePolicy: pgPolicy('Enable delete for authenticated users', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`true`,
    }),
  })
).enableRLS();

// Block Mounts Table
// 🔐 RLS Strategy: Page-based access control via pages table
export const blockMounts = pgTable(
  'block_mounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    block_id: uuid('block_id')
      .notNull()
      .references(() => blocks.id, { onDelete: 'cascade' }),
    position_x: decimal('position_x', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    position_y: decimal('position_y', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    size_width: decimal('size_width', { precision: 8, scale: 2 })
      .notNull()
      .default('100'),
    size_height: decimal('size_height', { precision: 8, scale: 2 })
      .notNull()
      .default('100'),
    z_order: integer('z_order').notNull().default(0),
    view_mode: blockViewModeEnum('view_mode').notNull().default('original'),
    view_mode_sizes: jsonb('view_mode_sizes').default(null),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  table => ({
    // Constraints
    positionXCheck: check(
      'block_mounts_position_x_range',
      sql`${table.position_x} >= -999999 AND ${table.position_x} <= 999999`
    ),
    positionYCheck: check(
      'block_mounts_position_y_range',
      sql`${table.position_y} >= -999999 AND ${table.position_y} <= 999999`
    ),
    sizeWidthCheck: check(
      'block_mounts_size_width_range',
      sql`${table.size_width} >= 1 AND ${table.size_width} <= 10000`
    ),
    sizeHeightCheck: check(
      'block_mounts_size_height_range',
      sql`${table.size_height} >= 1 AND ${table.size_height} <= 10000`
    ),
    zOrderCheck: check(
      'block_mounts_z_order_range',
      sql`${table.z_order} >= 0 AND ${table.z_order} <= 2147483647`
    ),
    uniquePageBlockCheck: unique('block_mounts_unique_page_block').on(
      table.page_id,
      table.block_id
    ),

    // Indexes for performance
    pageIdIdx: index('idx_block_mounts_page_id')
      .on(table.page_id)
      .where(sql`deleted_at IS NULL`),
    blockIdIdx: index('idx_block_mounts_block_id')
      .on(table.block_id)
      .where(sql`deleted_at IS NULL`),
    pageZOrderIdx: index('idx_block_mounts_page_z_order')
      .on(table.page_id, table.z_order)
      .where(sql`deleted_at IS NULL`),
    viewModeIdx: index('idx_block_mounts_view_mode')
      .on(table.view_mode)
      .where(sql`deleted_at IS NULL`),

    // RLS Policies - Page creator access only
    selectPolicy: pgPolicy('Enable read for page creator', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    insertPolicy: pgPolicy('Enable insert for page creator', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    updatePolicy: pgPolicy('Enable update for page creator', {
      for: 'update',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    deletePolicy: pgPolicy('Enable delete for page creator', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
  })
).enableRLS();

// Canvas Edges Table
// 🔐 RLS Strategy: Page-based access control via pages table
// ⚠️ Schema Change: edges now reference block_mounts instead of blocks
//    - Rationale: Edges represent visual connections between block instances on a specific page
//    - Performance: Eliminates JOINs on page render (most frequent operation)
//    - Logic: Page-specific connections, not global block relationships
export const edges = pgTable(
  'edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    source_block_mount_id: uuid('source_block_mount_id')
      .notNull()
      .references(() => blockMounts.id, { onDelete: 'cascade' }),
    target_block_mount_id: uuid('target_block_mount_id')
      .notNull()
      .references(() => blockMounts.id, { onDelete: 'cascade' }),
    source_handle: text('source_handle').notNull().default('right'),
    target_handle: text('target_handle').notNull().default('left'),
    edge_shape: canvasEdgeShapeEnum('edge_shape').notNull().default('default'),
    edge_label: text('edge_label').default(''),
    edge_style_color: text('edge_style_color').default('#9ca3af'),
    edge_style_thickness: integer('edge_style_thickness').default(2),
    marker_end: edgeMarkerEnum('marker_end').notNull().default('arrow'),
    marker_start: edgeMarkerEnum('marker_start'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  table => ({
    // Constraints
    thicknessCheck: check(
      'edges_thickness_range',
      sql`${table.edge_style_thickness} >= 1 AND ${table.edge_style_thickness} <= 10`
    ),
    // ⚠️ Unique constraint removed to allow soft-deleted edges to be recreated
    // Previously: uniquePageSourceTargetCheck prevented duplicate edges even after soft deletion

    // Indexes for performance
    pageIdIdx: index('idx_edges_page_id')
      .on(table.page_id)
      .where(sql`deleted_at IS NULL`),
    sourceBlockMountIdIdx: index('idx_edges_source_block_mount_id')
      .on(table.source_block_mount_id)
      .where(sql`deleted_at IS NULL`),
    targetBlockMountIdIdx: index('idx_edges_target_block_mount_id')
      .on(table.target_block_mount_id)
      .where(sql`deleted_at IS NULL`),

    // RLS Policies - Page creator access only
    selectPolicy: pgPolicy('Enable read for page creator', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    insertPolicy: pgPolicy('Enable insert for page creator', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    updatePolicy: pgPolicy('Enable update for page creator', {
      for: 'update',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    deletePolicy: pgPolicy('Enable delete for page creator', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
  })
).enableRLS();

// Viewports Table
// 🔐 RLS Strategy: User-specific access control
export const viewports = pgTable(
  'viewports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    zoom_level: decimal('zoom_level', { precision: 4, scale: 2 })
      .notNull()
      .default('1.0'),
    center_x: decimal('center_x', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    center_y: decimal('center_y', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    last_saved: timestamp('last_saved', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    // Constraints
    zoomLevelCheck: check(
      'viewports_zoom_level_range',
      sql`${table.zoom_level} >= 0.1 AND ${table.zoom_level} <= 5.0`
    ),
    centerXCheck: check(
      'viewports_center_x_range',
      sql`${table.center_x} >= -999999 AND ${table.center_x} <= 999999`
    ),
    centerYCheck: check(
      'viewports_center_y_range',
      sql`${table.center_y} >= -999999 AND ${table.center_y} <= 999999`
    ),
    uniquePageUserCheck: unique('viewports_unique_page_user').on(
      table.page_id,
      table.user_id
    ),

    // Indexes for performance
    pageUserIdIdx: index('idx_viewports_page_user').on(
      table.page_id,
      table.user_id
    ),
    userIdIdx: index('idx_viewports_user_id').on(table.user_id),

    // RLS Policies - User-specific access
    selectPolicy: pgPolicy('Enable read for own viewport', {
      for: 'select',
      to: authenticatedRole,
      using: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
    insertPolicy: pgPolicy('Enable insert for own viewport', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
    updatePolicy: pgPolicy('Enable update for own viewport', {
      for: 'update',
      to: authenticatedRole,
      using: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
    deletePolicy: pgPolicy('Enable delete for own viewport', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`${table.user_id} = (SELECT auth.uid())`,
    }),
  })
).enableRLS();

// Canvas Management Domain Relations
export const blocksRelations = relations(blocks, ({ one, many }) => ({
  blockMounts: many(blockMounts),
  createdByProfile: one(profiles, {
    fields: [blocks.created_by],
    references: [profiles.id],
  }),
}));

export const blockMountsRelations = relations(blockMounts, ({ one, many }) => ({
  page: one(pages, {
    fields: [blockMounts.page_id],
    references: [pages.id],
  }),
  block: one(blocks, {
    fields: [blockMounts.block_id],
    references: [blocks.id],
  }),
  sourceEdges: many(edges, { relationName: 'sourceBlockMount' }),
  targetEdges: many(edges, { relationName: 'targetBlockMount' }),
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  page: one(pages, {
    fields: [edges.page_id],
    references: [pages.id],
  }),
  sourceBlockMount: one(blockMounts, {
    fields: [edges.source_block_mount_id],
    references: [blockMounts.id],
    relationName: 'sourceBlockMount',
  }),
  targetBlockMount: one(blockMounts, {
    fields: [edges.target_block_mount_id],
    references: [blockMounts.id],
    relationName: 'targetBlockMount',
  }),
}));

export const viewportsRelations = relations(viewports, ({ one }) => ({
  page: one(pages, {
    fields: [viewports.page_id],
    references: [pages.id],
  }),
  user: one(users, {
    fields: [viewports.user_id],
    references: [users.id],
  }),
}));

// AI Management Domain Tables
// ============================

// Event Logs Table
// 🔐 RLS Strategy: Page-based access control
// - SELECT: Page creator only (Application uses adminDb for page members)
// - INSERT: Page creator only
// - UPDATE/DELETE: Append-Only이므로 불가
export const eventLogs = pgTable(
  'event_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    user_id: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'set null' }),
    event_type: eventTypeEnum('event_type').notNull(),
    action: eventActionEnum('action'), // null for user_utterance, ai_response, tool_call
    payload: jsonb('payload').notNull().default('{}'),
    search_content: text('search_content'), // BM25 전문 검색용 (자연어 이벤트만)
    agent_execution_id: text('agent_execution_id'), // Agent 실행 ID (툴 콜 그룹핑)
    timestamp: timestamp('timestamp', { withTimezone: true })
      .notNull()
      .defaultNow(),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => ({
    // Indexes for Performance
    // 페이지 범위 조회 최적화 (Short-Term Memory)
    pageTimestampIdx: index('idx_event_logs_page_timestamp')
      .on(table.page_id, table.timestamp)
      .where(sql`${table.page_id} IS NOT NULL`),

    // 이벤트 타입별 필터링
    pageTypeIdx: index('idx_event_logs_page_type')
      .on(table.page_id, table.event_type)
      .where(sql`${table.page_id} IS NOT NULL`),

    // Agent 실행 단위 그룹핑
    agentExecutionIdx: index('idx_event_logs_agent_execution')
      .on(table.agent_execution_id)
      .where(sql`${table.agent_execution_id} IS NOT NULL`),

    // BM25 전문 검색 최적화 (Long-Term Memory)
    // Note: 'simple' 사용 (한국어/영어 모두 지원, stemming 없음)
    // Note: GIN 인덱스는 마이그레이션 파일에서 수동 추가 필요
    // searchContentIdx: index('idx_event_logs_search_content')
    //   .using('gin')
    //   .on(sql`to_tsvector('simple', ${table.search_content})`)
    //   .where(sql`${table.search_content} IS NOT NULL`),

    // JSONB 메타데이터 필터링 최적화
    // Note: GIN 인덱스는 마이그레이션 파일에서 수동 추가 필요
    // payloadIdx: index('idx_event_logs_payload')
    //   .using('gin')
    //   .on(table.payload)
    //   .where(
    //     sql`${table.event_type} IN ('tool_call', 'block', 'edge', 'component', 'instance', 'property')`
    //   ),

    // 시간 범위 쿼리 최적화
    // Note: WHERE 조건에서 NOW()는 immutable이 아니라서 제거
    recentIdx: index('idx_event_logs_recent').on(
      table.page_id,
      table.timestamp
    ),

    // 리소스별 이벤트 조회 (block, edge, etc. + action)
    typeActionIdx: index('idx_event_logs_type_action')
      .on(table.page_id, table.event_type, table.action)
      .where(sql`${table.action} IS NOT NULL`),

    // RLS Policies
    // SELECT: Page creator only (Application uses adminDb for page members)
    selectPolicy: pgPolicy('Enable read for page creator', {
      for: 'select',
      to: authenticatedRole,
      using: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      )`,
    }),
    // INSERT: Page creator only
    insertPolicy: pgPolicy('Enable insert for page creator', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`EXISTS (
        SELECT 1 FROM pages 
        WHERE pages.id = ${table.page_id} 
          AND pages.created_by = (SELECT auth.uid())
      ) AND ${table.user_id} = (SELECT auth.uid())`,
    }),
    // UPDATE: Append-Only이므로 불가 (정책 없음)
    // DELETE: Append-Only이므로 불가 (정책 없음)
  })
).enableRLS();

// AI Management Domain Relations
export const eventLogsRelations = relations(eventLogs, ({ one }) => ({
  page: one(pages, {
    fields: [eventLogs.page_id],
    references: [pages.id],
  }),
  user: one(profiles, {
    fields: [eventLogs.user_id],
    references: [profiles.id],
  }),
}));

// Share Management Domain Tables
// =============================

export const publishedPages = pgTable(
  'published_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page_id: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    publisher_id: uuid('publisher_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    publish_token: text('publish_token').notNull().unique(),
    status: publishedPageStatusEnum('status')
      .notNull()
      .default('published'),
    published_at: timestamp('published_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    pageIdIdx: index('idx_published_pages_page_id').on(table.page_id),
    publisherIdIdx: index('idx_published_pages_publisher_id').on(table.publisher_id),
    publishTokenIdx: index('idx_published_pages_publish_token').on(
      table.publish_token
    ),

    // RLS Policies
    selectPolicy: pgPolicy('Enable read for publisher only', {
      for: 'select',
      to: authenticatedRole,
      using: sql`(select auth.uid()) = publisher_id`,
    }),
    insertPolicy: pgPolicy('Enable insert for page publisher', {
      for: 'insert',
      to: authenticatedRole,
      withCheck: sql`publisher_id = auth.uid()`,
    }),
    updatePolicy: pgPolicy('Enable update for page publisher', {
      for: 'update',
      to: authenticatedRole,
      using: sql`publisher_id = auth.uid()`,
    }),
    deletePolicy: pgPolicy('Enable delete for page publisher', {
      for: 'delete',
      to: authenticatedRole,
      using: sql`publisher_id = auth.uid()`,
    }),
  })
).enableRLS();

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Workspace Management Domain Types
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
export type PageFavorite = typeof pageFavorites.$inferSelect;
export type NewPageFavorite = typeof pageFavorites.$inferInsert;
export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;
export type NewWorkspaceInvitation = typeof workspaceInvitations.$inferInsert;

// Canvas Management Domain Types
export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type BlockMount = typeof blockMounts.$inferSelect;
export type NewBlockMount = typeof blockMounts.$inferInsert;
export type Edge = typeof edges.$inferSelect;
export type NewEdge = typeof edges.$inferInsert;
export type Viewport = typeof viewports.$inferSelect;
export type NewViewport = typeof viewports.$inferInsert;

// AI Management Domain Types
export type EventLog = typeof eventLogs.$inferSelect;
export type NewEventLog = typeof eventLogs.$inferInsert;

// Share Management Domain Types
export type PublishedPageRow = typeof publishedPages.$inferSelect;
export type NewPublishedPageRow = typeof publishedPages.$inferInsert;

// Enum Types
export type OrganizationType = (typeof organizationTypeEnum.enumValues)[number];
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];
export type InvitationStatus = (typeof invitationStatusEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type BetaStatus = (typeof betaStatusEnum.enumValues)[number];
export type CanvasEdgeShape = (typeof canvasEdgeShapeEnum.enumValues)[number];
export type EdgeMarker = (typeof edgeMarkerEnum.enumValues)[number];
export type AlignmentType = (typeof alignmentTypeEnum.enumValues)[number];
export type EventType = (typeof eventTypeEnum.enumValues)[number];
export type EventAction = (typeof eventActionEnum.enumValues)[number];
