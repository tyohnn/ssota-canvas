# Database Schema: Workspace Management Domain

## 🎯 개요

**도메인**: Workspace Management  
**작성자**: 백엔드개발자 + DBA  
**작성일**: 2025-10-11  
**버전**: v1.0

**Technical Specification 참조**: `05-technical-specification.md`  
**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: 실제 마이그레이션 및 구현

---

> **작성 시점**: Technical Specification 완료 후, 실제 마이그레이션 작성 전  
> **목적**: DDD Aggregate를 데이터베이스 스키마로 전환, 성능 최적화 및 RLS 정책 정의

**기반 문서**: [Technical Specification](./05-technical-specification.md)

---

### 주요 변경사항

**v1.1 (2025-10-11)**:
- Scenario 2~5 지원 추가
- `workspace_invitations` 테이블 추가 (Scenario 3)
- `page_favorites` 테이블 RLS 정책 추가 (Scenario 5)
- 관련 인덱스 최적화

**v1.0 (2025-10-11)**:
- 초기 스키마 설계: Workspace, Page, Workspace Member 테이블 생성
- Parent ID + depth 패턴: Materialized Path 대신 단순한 Adjacency List + depth 캐시 채택
- 재귀 CTE 최적화: depth, order 인덱스로 트리 조회 최적화
- RLS 정책: Layered Security Model 적용

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 범위**: Scenario 0~5 (Workspace 생성/수정, 멤버 초대, Page 관리, 즐겨찾기)
2. **DDD Aggregate 경계 반영**: Workspace Aggregate, Page Aggregate의 불변식을 DB 제약조건으로 구현
3. **단순성 우선**: Materialized Path 대신 Parent ID로 단순화, depth만 캐시
4. **MECE 구조**: Workspace-Page 계층, 멤버십, 초대, 즐겨찾기 분리
5. **성능 최적화**: 재귀 CTE를 위한 depth, order 인덱스 설계
6. **타입 안전성**: Drizzle ORM을 통한 타입 안전성 확보
7. **권한 기반 접근**: RLS 정책 + Application-level 권한 체크
8. **확장성**: 향후 Page 템플릿, Workspace 템플릿 확장 가능

### 테이블 관계도
```
┌─────────────────────────┐
│  organizations          │ (Organization Domain)
│  • id (PK)              │
│  • owner_id             │
└──────────┬──────────────┘
           │ 1:N
           ▼
┌─────────────────────────┐
│  workspaces             │
│  • id (PK)              │
│  • organization_id (FK) │
│  • name                 │
│  • is_default           │
│  • deletable            │
└──────────┬──────────────┘
           │ 1:N
           ▼
┌─────────────────────────┐       ┌──────────────────────────┐
│  pages                  │       │  workspace_members       │
│  • id (PK)              │       │  • workspace_id (FK)     │
│  • workspace_id (FK)    │       │  • user_id (FK)          │
│  • parent_id (FK, Self) │◄──┐   └──────────────────────────┘
│  • title                │   │
│  • depth (캐시)         │   │   ┌──────────────────────────┐
│  • order                │   │   │  workspace_invitations   │
└──────────┬──────────────┘   │   │  • id (PK)               │
           │                  │   │  • workspace_id (FK)     │
           │                  │   │  • invited_user_id (FK)  │
           │                  │   │  • status                │
           │                  │   └──────────────────────────┘
           │ 1:N              │
           ▼                  │   ┌──────────────────────────┐
┌─────────────────────────┐   │   │  page_favorites          │
│  page_favorites         │   │   │  • page_id (FK)          │
│  • page_id (FK)         │───┘   │  • user_id (FK)          │
│  • user_id (FK)         │       └──────────────────────────┘
└─────────────────────────┘
```

---

## 📋 Table Definitions

### 1. workspaces 테이블 (public schema)

Workspace Aggregate를 저장하는 테이블

```sql
CREATE TABLE workspaces (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Workspace Info Fields
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    
    -- Workspace Type Fields
    is_default BOOLEAN NOT NULL DEFAULT false,
    deletable BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Fields
    created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- 소프트 삭제
    
    -- Constraints
    CONSTRAINT workspaces_name_length CHECK (LENGTH(TRIM(name)) BETWEEN 1 AND 100),
    CONSTRAINT workspaces_description_length CHECK (description IS NULL OR LENGTH(description) <= 500),
    CONSTRAINT workspaces_default_not_deletable CHECK (
        NOT (is_default = true AND deletable = true)
    ),
    CONSTRAINT workspaces_unique_default_per_org UNIQUE (organization_id, is_default) 
        WHERE is_default = true -- 조직당 1개 Default만
);

-- Indexes for Performance
CREATE INDEX idx_workspaces_organization_id ON workspaces(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_workspaces_default ON workspaces(organization_id, is_default) WHERE is_default = true;

-- Comments
COMMENT ON TABLE workspaces IS 'Workspace Management Domain - 조직 내 작업 공간';
COMMENT ON COLUMN workspaces.id IS 'Workspace 고유 식별자';
COMMENT ON COLUMN workspaces.organization_id IS '소속 조직 ID';
COMMENT ON COLUMN workspaces.name IS 'Workspace 이름 (1-100자)';
COMMENT ON COLUMN workspaces.description IS 'Workspace 설명 (최대 500자)';
COMMENT ON COLUMN workspaces.icon IS 'Workspace 아이콘 (이모지 또는 URL)';
COMMENT ON COLUMN workspaces.is_default IS 'Default Workspace 여부 (조직당 1개)';
COMMENT ON COLUMN workspaces.deletable IS '삭제 가능 여부 (Default는 false)';
COMMENT ON COLUMN workspaces.created_by IS '생성자 ID (profiles.user_id 참조)';
COMMENT ON COLUMN workspaces.created_at IS '생성 시각';
COMMENT ON COLUMN workspaces.updated_at IS '수정 시각';
COMMENT ON COLUMN workspaces.deleted_at IS '삭제 시각 (소프트 삭제, 30일 후 완전 삭제)';
```

> **💡 설계 노트**  
> - `is_default` + `deletable` 제약: Default Workspace는 반드시 deletable=false
> - 조직당 1개 Default만 허용 (Partial Unique Index)
> - organization_id 인덱스: 조직별 Workspace 조회 최적화

---

### 2. pages 테이블 (public schema)

Page Aggregate를 저장하는 테이블. **Parent ID + depth 캐시** 패턴 사용.

```sql
CREATE TABLE pages (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES pages(id) ON DELETE CASCADE, -- Self-referencing
    
    -- Page Info Fields
    title TEXT NOT NULL,
    icon TEXT,
    
    -- Hierarchy Fields
    "order" INTEGER NOT NULL DEFAULT 0, -- 같은 레벨 내 순서
    depth INTEGER NOT NULL DEFAULT 0,   -- 계층 깊이 (캐시, 0=최상위)
    
    -- Audit Fields
    created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- 소프트 삭제
    
    -- Constraints
    CONSTRAINT pages_title_length CHECK (LENGTH(TRIM(title)) BETWEEN 1 AND 200),
    CONSTRAINT pages_depth_non_negative CHECK (depth >= 0),
    CONSTRAINT pages_depth_root_consistency CHECK (
        (parent_id IS NULL AND depth = 0) OR (parent_id IS NOT NULL AND depth > 0)
    ),
    CONSTRAINT pages_order_non_negative CHECK ("order" >= 0)
);

-- Indexes for Performance (재귀 CTE 최적화)
CREATE INDEX idx_pages_workspace_id ON pages(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_parent_id ON pages(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_tree_query ON pages(workspace_id, depth, "order") WHERE deleted_at IS NULL;
-- ⭐️ 트리 조회 복합 인덱스: workspace별로 depth, order 순서로 정렬

-- Breadcrumb/Ancestor 조회용 (재귀 CTE)
CREATE INDEX idx_pages_ancestors ON pages(id, parent_id) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE pages IS 'Workspace Management Domain - Workspace 내 페이지 (캔버스)';
COMMENT ON COLUMN pages.id IS 'Page 고유 식별자';
COMMENT ON COLUMN pages.workspace_id IS '소속 Workspace ID';
COMMENT ON COLUMN pages.parent_id IS '부모 Page ID (null=최상위)';
COMMENT ON COLUMN pages.title IS '페이지 제목 (1-200자)';
COMMENT ON COLUMN pages.icon IS '페이지 아이콘 (이모지 또는 URL)';
COMMENT ON COLUMN pages."order" IS '같은 레벨 내 정렬 순서';
COMMENT ON COLUMN pages.depth IS '계층 깊이 (캐시, 0=최상위, 부모 depth + 1)';
COMMENT ON COLUMN pages.created_by IS '생성자 ID (profiles.user_id 참조)';
COMMENT ON COLUMN pages.created_at IS '생성 시각';
COMMENT ON COLUMN pages.updated_at IS '수정 시각';
COMMENT ON COLUMN pages.deleted_at IS '삭제 시각 (소프트 삭제, 30일 후 완전 삭제)';
```

> **💡 설계 노트**  
> - **Parent ID + depth 패턴**: Materialized Path 대신 단순한 Adjacency List 사용
> - **depth 캐시**: Page 생성/이동 시 계산하여 저장, 조회 성능 향상
> - **재귀 CTE 최적화**: `idx_pages_tree_query` 복합 인덱스로 트리 조회 최적화
> - **Self-referencing FK**: parent_id → pages(id), 순환 참조는 Application-level에서 방지
> - **ON DELETE CASCADE**: 부모 페이지 삭제 시 하위 페이지도 자동 삭제

---

### 3. workspace_members 테이블 (public schema)

Workspace 멤버십을 관리하는 테이블

```sql
CREATE TABLE workspace_members (
    -- Composite Primary Key
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Audit Fields
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Primary Key
    PRIMARY KEY (workspace_id, user_id)
);

-- Indexes for Performance
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);

-- Comments
COMMENT ON TABLE workspace_members IS 'Workspace Management Domain - Workspace 멤버십 (초대 여부만 저장)';
COMMENT ON COLUMN workspace_members.workspace_id IS 'Workspace ID';
COMMENT ON COLUMN workspace_members.user_id IS '멤버 사용자 ID (profiles.user_id 참조)';
COMMENT ON COLUMN workspace_members.joined_at IS 'Workspace 참여 시각';
```

> **💡 설계 노트**  
> - **Composite PK**: (workspace_id, user_id)로 중복 방지
> - **Default Workspace**: 별도 멤버십 레코드 없음 (조직 멤버 자동 접근)
> - **권한 단일화**: role은 organization_members에서 관리 (중복 제거)
>   - Workspace 권한 확인 시 organization_members.role 조회
>   - 데이터 일관성 보장 (단일 출처)
>   - 조직 권한 변경 시 모든 Workspace에 자동 반영

---

### 4. workspace_invitations 테이블 (public schema)

Workspace 멤버 초대 프로세스를 관리하는 테이블

```sql
CREATE TABLE workspace_invitations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Invitation Info
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    notification_id UUID, -- Notification Domain 참조 (soft reference)
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ, -- 수락/거절 처리 시각
    
    -- Constraints
    CONSTRAINT workspace_invitations_unique_pending UNIQUE (workspace_id, invited_user_id, status)
        WHERE status = 'PENDING' -- 같은 사용자에게 중복 초대 방지
);

-- Indexes for Performance
CREATE INDEX idx_workspace_invitations_user ON workspace_invitations(invited_user_id, status);
CREATE INDEX idx_workspace_invitations_workspace ON workspace_invitations(workspace_id, status);

-- Comments
COMMENT ON TABLE workspace_invitations IS 'Workspace Management Domain - Workspace 멤버 초대';
COMMENT ON COLUMN workspace_invitations.id IS '초대 고유 식별자';
COMMENT ON COLUMN workspace_invitations.workspace_id IS 'Workspace ID';
COMMENT ON COLUMN workspace_invitations.invited_user_id IS '초대받은 사용자 ID';
COMMENT ON COLUMN workspace_invitations.invited_by IS '초대한 사용자 ID';
COMMENT ON COLUMN workspace_invitations.status IS '초대 상태 (PENDING, ACCEPTED, REJECTED)';
COMMENT ON COLUMN workspace_invitations.notification_id IS '알림 ID (Notification Domain 참조)';
COMMENT ON COLUMN workspace_invitations.created_at IS '초대 생성 시각';
COMMENT ON COLUMN workspace_invitations.processed_at IS '초대 처리 시각 (수락/거절)';
```

> **💡 설계 노트**  
> - **Unique 제약**: 같은 사용자에게 중복 PENDING 초대 방지 (Partial Unique Index)
> - **Soft Reference**: notification_id는 외래키 아님 (도메인 간 느슨한 결합)
> - **Status 관리**: PENDING → ACCEPTED/REJECTED 단방향 전환
> - **Notification Domain 통합**: 초대 생성 시 알림 생성 (동기), notification_id 저장

---

### 5. page_favorites 테이블 (public schema)

사용자별 페이지 즐겨찾기를 관리하는 테이블

```sql
CREATE TABLE page_favorites (
    -- Composite Primary Key
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    
    -- Audit Fields
    favorited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Primary Key
    PRIMARY KEY (page_id, user_id)
);

-- Indexes for Performance
CREATE INDEX idx_page_favorites_user_id ON page_favorites(user_id);

-- Comments
COMMENT ON TABLE page_favorites IS 'Workspace Management Domain - 사용자별 즐겨찾기 페이지';
COMMENT ON COLUMN page_favorites.page_id IS 'Page ID';
COMMENT ON COLUMN page_favorites.user_id IS '사용자 ID (profiles.user_id 참조)';
COMMENT ON COLUMN page_favorites.favorited_at IS '즐겨찾기 추가 시각';
```

---

## 🔒 Row Level Security (RLS) Policies

### 1. RLS 전략: Layered Security Model

**핵심 원칙**:
- ✅ **RLS**: 최후의 보루 (Fail-safe), **생성자만 접근** (Self-only)
- ✅ **Application**: 모든 비즈니스 권한 로직 (조직 멤버, Workspace 멤버, Admin 권한 등)
- ✅ **adminDb**: Application-level 권한 체크 완료 후 RLS 우회하여 데이터 처리

**장점**:
- RLS 정책이 단순하여 유지보수 용이
- 복잡한 권한 로직은 TypeScript로 테스트 가능
- Application에서 권한 검증 후 adminDb로 안전하게 처리

**참고**: Organization Domain의 Layered Security 패턴과 동일

---

### 2. RLS 활성화

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_favorites ENABLE ROW LEVEL SECURITY;
```

---

### 3. workspaces 테이블 RLS 정책

```sql
-- 모든 작업: 생성자만 (Self-only)
-- Note: 실제 비즈니스 권한 로직은 Application에서 처리 후 adminDb 사용

-- SELECT: 생성자만 조회 가능
CREATE POLICY "Enable read for creator" ON workspaces
    FOR SELECT TO authenticated
    USING (created_by = (SELECT auth.uid()));

-- INSERT: 생성자만 삽입 가능
CREATE POLICY "Enable insert for creator" ON workspaces
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

-- UPDATE: 생성자만 수정 가능
CREATE POLICY "Enable update for creator" ON workspaces
    FOR UPDATE TO authenticated
    USING (created_by = (SELECT auth.uid()));

-- DELETE: 생성자만 삭제 가능 (소프트 삭제)
CREATE POLICY "Enable delete for creator" ON workspaces
    FOR DELETE TO authenticated
    USING (created_by = (SELECT auth.uid()));
```

**Application-level 권한 처리 예시**:
```typescript
// WorkspaceManagementService.getOrganizationWorkspaces()
// Step 1: Application-level 권한 체크 - 조직 멤버십 확인
const isOrgMember = await orgMemberRepo.isMember(orgId, userId);
if (!isOrgMember) {
  return Result.err('NOT_ORG_MEMBER');
}

// Step 2: adminDb로 조직의 모든 Workspace 조회 (RLS 우회)
const workspaces = await db.admin.select().from(workspaces)
  .where(eq(workspaces.organizationId, orgId));

return Result.ok(workspaces);
```

---

### 4. pages 테이블 RLS 정책

```sql
-- 모든 작업: 생성자만 (Self-only)
-- Note: 실제 비즈니스 권한 로직은 Application에서 처리 후 adminDb 사용

-- SELECT: 생성자만 조회 가능
CREATE POLICY "Enable read for creator" ON pages
    FOR SELECT TO authenticated
    USING (created_by = (SELECT auth.uid()));

-- INSERT: 생성자만 생성 가능
CREATE POLICY "Enable insert for creator" ON pages
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

-- UPDATE: 생성자만 수정 가능
CREATE POLICY "Enable update for creator" ON pages
    FOR UPDATE TO authenticated
    USING (created_by = (SELECT auth.uid()));

-- DELETE: 생성자만 삭제 가능
CREATE POLICY "Enable delete for creator" ON pages
    FOR DELETE TO authenticated
    USING (created_by = (SELECT auth.uid()));
```

**Application-level 권한 처리 예시**:
```typescript
// WorkspaceManagementService.verifyPageAccess()
// Step 1: Application-level 권한 체크 - 조직 멤버십 확인
const isOrgMember = await orgMemberRepo.isMember(orgId, userId);
if (!isOrgMember) {
  return Result.err('NOT_ORG_MEMBER');
}

// Step 2: Workspace 멤버십 확인 (Default Workspace는 자동 통과)
if (!workspace.isDefault) {
  const isWorkspaceMember = await workspaceMemberRepo.isMember(workspaceId, userId);
  if (!isWorkspaceMember) {
    return Result.err('NOT_WORKSPACE_MEMBER');
  }
}

// Step 3: adminDb로 페이지 조회 (RLS 우회)
const page = await db.admin.select().from(pages)
  .where(eq(pages.id, pageId));

return Result.ok(page);
```

---

### 5. workspace_members 테이블 RLS 정책

```sql
-- 모든 작업: Self only
-- Note: Admin이 멤버를 관리할 때는 Application에서 권한 체크 후 adminDb 사용

-- SELECT: Self only
CREATE POLICY "Enable read for self" ON workspace_members
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- INSERT: Self only
CREATE POLICY "Enable insert for self" ON workspace_members
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: Self only
CREATE POLICY "Enable update for self" ON workspace_members
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- DELETE: Self only
CREATE POLICY "Enable delete for self" ON workspace_members
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));
```

**Application-level 권한 처리 예시**:
```typescript
// WorkspaceManagementService.inviteMember()
// Step 1: Application-level 권한 체크 - 조직 멤버십에서 역할 확인
const myOrgMembership = await db.rls.select().from(organizationMembers)
  .where(and(
    eq(organizationMembers.organizationId, orgId),
    eq(organizationMembers.userId, currentUserId)
  ));

// Step 2: Admin 권한 확인 (조직 레벨에서)
if (!myOrgMembership || (myOrgMembership.role !== 'admin' && myOrgMembership.role !== 'owner')) {
  return Result.err('INSUFFICIENT_PERMISSION');
}

// Step 3: adminDb로 Workspace 멤버 추가 (RLS 우회)
await db.admin.insert(workspaceMembers).values({
  workspaceId,
  userId: invitedUserId,
  // role은 organization_members에서 관리됨
});

return Result.ok();
```

---

### 6. workspace_invitations 테이블 RLS 정책

```sql
-- 조회: 본인이 초대받은 것 또는 본인이 초대한 것만
-- Note: 초대 생성은 Application에서 Admin 권한 체크 후 adminDb 사용

-- SELECT: 본인 관련 초대만
CREATE POLICY "Enable read for invited user or inviter" ON workspace_invitations
    FOR SELECT TO authenticated
    USING (
        invited_user_id = (SELECT auth.uid()) 
        OR invited_by = (SELECT auth.uid())
    );

-- INSERT: 생성자만 (Application에서 Admin 체크 후 adminDb 사용)
CREATE POLICY "Enable insert for inviter" ON workspace_invitations
    FOR INSERT TO authenticated
    WITH CHECK (invited_by = (SELECT auth.uid()));

-- UPDATE: 초대받은 본인만 (수락/거절)
CREATE POLICY "Enable update for invited user" ON workspace_invitations
    FOR UPDATE TO authenticated
    USING (invited_user_id = (SELECT auth.uid()));

-- DELETE: 초대한 본인만 (취소)
CREATE POLICY "Enable delete for inviter" ON workspace_invitations
    FOR DELETE TO authenticated
    USING (invited_by = (SELECT auth.uid()));
```

**Application-level 권한 처리 예시**:
```typescript
// WorkspaceManagementService.inviteWorkspaceMember()
// Step 1: 조직 Admin + Workspace 멤버 권한 확인
const orgMember = await orgMemberRepo.findMemberRole(orgId, currentUserId);
if (!orgMember || (orgMember.role !== 'admin' && orgMember.role !== 'owner')) {
  return Result.err('NOT_ORG_ADMIN');
}

const isWorkspaceMember = await workspaceMemberRepo.isMember(workspaceId, currentUserId);
if (!isWorkspaceMember) {
  return Result.err('NOT_WORKSPACE_MEMBER');
}

// Step 2: adminDb로 초대 생성 (RLS 우회)
await db.admin.insert(workspaceInvitations).values({
  workspaceId,
  invitedUserId,
  invitedBy: currentUserId,
  status: 'PENDING'
});
```

---

### 7. page_favorites 테이블 RLS 정책

```sql
-- 모든 작업: Self only
-- Note: 즐겨찾기는 개인 데이터이므로 RLS만으로 충분

-- SELECT: Self only
CREATE POLICY "Enable read for self" ON page_favorites
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- INSERT: Self only
CREATE POLICY "Enable insert for self" ON page_favorites
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: Self only (필요시)
CREATE POLICY "Enable update for self" ON page_favorites
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- DELETE: Self only
CREATE POLICY "Enable delete for self" ON page_favorites
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));
```

**참고**: 즐겨찾기는 개인 데이터이므로 RLS 정책만으로 충분하며, adminDb 사용 불필요

---

## 💼 비즈니스 로직 처리 방침

### SSOT(Single Source of Truth) 원칙
- **비즈니스 로직**: 애플리케이션 서버 코드에서 관리 (TypeScript/Node.js)
- **데이터베이스**: 단순한 데이터 저장소 역할 + 기본 제약조건만
- **PostgreSQL 함수**: 사용하지 않음 (유지보수성 및 테스트 용이성을 위해)

### Layered Security Model

**1️⃣ RLS Layer (최후의 보루)**
- 역할: Fail-safe, 실수 방지
- 정책: **생성자만 접근** (Self-only) - 단순하고 명확
- 장점: DB 레벨 기본 보안, 유지보수 용이

**2️⃣ Application Layer (주요 권한 로직)**
- 역할: 모든 비즈니스 권한 검증 (조직 멤버, Workspace 멤버, Admin 권한 등)
- 구현: Service Layer에서 권한 체크 (TypeScript로 테스트 가능)
- 예시:
  - 조직 멤버만 Workspace 목록 조회
  - Workspace 멤버만 Page 조회
  - Admin만 멤버 초대
  - 소유자만 Workspace 생성

**3️⃣ adminDb 사용 시점 (Application-level 권한 체크 완료 후)**
- Workspace 목록 조회: 조직 멤버십 확인 후
- Page 트리 조회: Workspace 멤버십 확인 후
- Workspace 멤버 관리: Admin 권한 확인 후
- Page 생성/수정/삭제: Workspace 멤버십 확인 후
- **전제 조건**: Application에서 권한 검증 완료 필수

**권한 체크 Flow**:
```
Request → Authentication → Application-level 권한 체크 → adminDb 사용 → Response
                            (조직 멤버십 확인,           (RLS 우회)
                             Workspace 초대 여부,
                             조직 role로 권한 판단)
```

**권한 판단 로직**:
```typescript
// Step 1: 조직 멤버십 확인
const orgMember = await orgMemberRepo.findByUserId(orgId, userId);
if (!orgMember) return Result.err('NOT_ORG_MEMBER');

// Step 2: Workspace 초대 여부 확인 (Default는 자동 허용)
if (!workspace.isDefault) {
  const isInvited = await workspaceMemberRepo.isMember(workspaceId, userId);
  if (!isInvited) return Result.err('NOT_WORKSPACE_MEMBER');
}

// Step 3: 권한 확인 (조직 role 사용)
const canEdit = orgMember.role === 'owner' || orgMember.role === 'admin';
const canDelete = orgMember.role === 'owner';
```

---

## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략

```sql
-- Workspace 조회 최적화 (조직별)
CREATE INDEX idx_workspaces_org_active ON workspaces(organization_id, is_default, created_at) 
WHERE deleted_at IS NULL;

-- Page 트리 조회 최적화 (재귀 CTE)
CREATE INDEX idx_pages_tree_query ON pages(workspace_id, depth, "order") 
WHERE deleted_at IS NULL;

-- Ancestors 조회 최적화 (Breadcrumb, 순환 참조 체크)
CREATE INDEX idx_pages_parent_lookup ON pages(id, parent_id, depth) 
WHERE deleted_at IS NULL;

-- Workspace 멤버십 조회 최적화
CREATE INDEX idx_workspace_members_lookup ON workspace_members(workspace_id, user_id);
```

---

### 2. 쿼리 성능 최적화

#### 트리 조회 쿼리 (재귀 CTE)
```sql
-- Scenario 1에서 가장 빈번하게 사용되는 쿼리
WITH RECURSIVE page_tree AS (
    -- Anchor: 최상위 페이지 (parent_id IS NULL)
    SELECT 
        id, workspace_id, parent_id, title, icon, "order", depth,
        created_at, updated_at
    FROM pages 
    WHERE workspace_id = $1 
      AND parent_id IS NULL 
      AND deleted_at IS NULL
    
    UNION ALL
    
    -- Recursive: 하위 페이지
    SELECT 
        p.id, p.workspace_id, p.parent_id, p.title, p.icon, p."order", p.depth,
        p.created_at, p.updated_at
    FROM pages p
    INNER JOIN page_tree pt ON p.parent_id = pt.id
    WHERE p.deleted_at IS NULL
)
SELECT * FROM page_tree 
ORDER BY depth, "order";
```

**최적화 포인트**:
- ✅ `idx_pages_tree_query` 인덱스 사용
- ✅ depth 순서 정렬로 Breadcrumb 표시 쉬움
- ✅ deleted_at IS NULL 필터로 삭제된 페이지 제외

---

#### Ancestors 조회 쿼리 (순환 참조 체크, Breadcrumb)
```sql
-- Page 이동 시 순환 참조 체크용
WITH RECURSIVE ancestors AS (
    -- Anchor: 현재 페이지
    SELECT id, parent_id, depth, title
    FROM pages 
    WHERE id = $1
    
    UNION ALL
    
    -- Recursive: 부모 페이지
    SELECT p.id, p.parent_id, p.depth, p.title
    FROM pages p
    INNER JOIN ancestors a ON p.id = a.parent_id
)
SELECT * FROM ancestors 
ORDER BY depth DESC;
```

**사용 사례**:
- Page 이동 시 ancestors에 이동할 페이지가 있는지 체크 (순환 참조 방지)
- Breadcrumb 표시 (ancestors 목록)

---

### 3. 읽기 최적화 뷰 (선택적)

Scenario 1의 복잡한 조회를 간소화하기 위한 뷰는 **사용하지 않음**.
- 이유: 재귀 CTE를 View로 만들면 파라미터 전달 어려움
- 대안: Repository 메서드에서 재귀 CTE 직접 실행

---

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. 고아 페이지 확인 (parent_id가 존재하지 않는 페이지)
SELECT 'Orphan pages' as issue, COUNT(*) as count
FROM pages p
LEFT JOIN pages parent ON p.parent_id = parent.id
WHERE p.parent_id IS NOT NULL 
  AND parent.id IS NULL
  AND p.deleted_at IS NULL;

-- 2. depth 불일치 확인 (parent가 있는데 depth=0)
SELECT 'Incorrect depth' as issue, COUNT(*) as count
FROM pages
WHERE parent_id IS NOT NULL AND depth = 0;

-- 3. Default Workspace 중복 확인 (조직당 1개만)
SELECT 'Duplicate default workspaces' as issue, organization_id, COUNT(*) as count
FROM workspaces
WHERE is_default = true AND deleted_at IS NULL
GROUP BY organization_id
HAVING COUNT(*) > 1;

-- 4. 30일 경과 소프트 삭제 데이터 확인
SELECT 'Pages ready for permanent deletion' as issue, COUNT(*) as count
FROM pages
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';

SELECT 'Workspaces ready for permanent deletion' as issue, COUNT(*) as count
FROM workspaces
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';
```

---

### 2. 성능 모니터링

```sql
-- 재귀 CTE 쿼리 성능 확인
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%WITH RECURSIVE%page_tree%'
ORDER BY total_time DESC
LIMIT 10;

-- 테이블별 사용량 통계
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    seq_scan,
    idx_scan
FROM pg_stat_user_tables 
WHERE tablename IN ('workspaces', 'pages', 'workspace_members', 'page_favorites')
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- 인덱스 사용량 통계 (재귀 CTE 인덱스 효과 확인)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes 
WHERE tablename IN ('pages')
  AND indexname LIKE '%tree%'
ORDER BY idx_scan DESC;
```

---

## 🧹 데이터 정리 및 보관 정책

### 1. 소프트 삭제된 데이터 정리 (배치 작업)

```sql
-- 30일 경과한 Workspace 영구 삭제
-- 주의: 이 작업은 애플리케이션 레벨 배치 작업에서 수행
DELETE FROM workspaces
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';

-- 30일 경과한 Page 영구 삭제
DELETE FROM pages
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';
```

---

### 2. 고아 데이터 정리

```sql
-- 부모 페이지가 삭제된 고아 페이지 확인
SELECT p.id, p.title, p.parent_id
FROM pages p
LEFT JOIN pages parent ON p.parent_id = parent.id
WHERE p.parent_id IS NOT NULL 
  AND parent.id IS NULL
  AND p.deleted_at IS NULL;

-- Workspace가 삭제된 고아 페이지 확인
SELECT p.id, p.title, p.workspace_id
FROM pages p
LEFT JOIN workspaces ws ON p.workspace_id = ws.id
WHERE ws.id IS NULL
  AND p.deleted_at IS NULL;
```

---

## ✅ 검증 체크리스트

### Scenario 지원
- [x] **Scenario 0**: Organization 생성 시 Default Workspace + 초기 페이지 생성
- [x] **Scenario 1**: 조직 접근 → Workspace-Page 목록 조회 → 페이지 선택
- [x] **Scenario 2**: Workspace 생성 (초기 페이지 자동 생성) + Workspace 정보 수정
- [x] **Scenario 3**: Workspace 멤버 초대/수락/거절 (Notification Domain 통합)
- [x] **Scenario 4**: Page 생성/이동/수정 (순환 참조 방지, depth 자동 계산)
- [x] **Scenario 5**: Page 즐겨찾기 토글 (개인별 관리)
- [x] **권한 검증**: 조직 멤버십 + Workspace 멤버십 순차 확인
- [x] **쿠키 Fallback**: 최근 방문 페이지 검증 및 Default Fallback

### 데이터 무결성
- [x] **Default Workspace 제약**: is_default=true이면 deletable=false
- [x] **조직당 1개 Default**: Partial Unique Index로 보장
- [x] **Parent-Child 제약**: Self-referencing FK
- [x] **depth 일관성**: depth=0이면 parent_id IS NULL
- [x] **FK 관계**: 모든 외래키가 올바르게 설정됨 (5개 테이블)
- [x] **Unique 제약**: 
  - workspace_members: (workspace_id, user_id) 중복 방지
  - workspace_invitations: (workspace_id, invited_user_id, status) PENDING 중복 방지
  - page_favorites: (page_id, user_id) 중복 방지
- [x] **Check 제약**: 이름 길이, 설명 길이, depth 음수 방지, status 값 제한
- [x] **RLS 보안**: Layered Security Model 적용 (5개 테이블)

### 성능 최적화
- [x] **핵심 인덱스**: 조직별 Workspace, Workspace별 Page 조회
- [x] **복합 인덱스**: `idx_pages_tree_query` (workspace_id, depth, order)
- [x] **부분 인덱스**: deleted_at IS NULL 조건
- [x] **재귀 CTE 최적화**: depth, parent_id 인덱스

### 아키텍처 일관성
- [x] **DDD 원칙**: Workspace/Page Aggregate 경계와 테이블 일치
- [x] **단일 책임**: 각 테이블이 명확한 역할
- [x] **확장성**: 향후 Workspace/Page 템플릿 추가 가능
- [x] **타입 안전성**: Drizzle ORM과 TypeScript 타입 일치
- [x] **CQRS 지원**: Command(CRUD)와 Query(트리 조회) 분리

---

## 🔗 도메인 간 통합

### Organization Management Domain과의 통합
- **workspaces.organization_id**: Organization ID 참조 (FK)
- **RLS 정책**: organization_members 테이블 조인으로 권한 확인
- **Default Workspace**: 조직 생성 시 자동 생성 (Scenario 0)

### User Management Domain과의 통합
- **workspaces.created_by**: 생성자 사용자 ID (FK to auth.users)
- **workspace_members.user_id**: 멤버 사용자 ID (FK to auth.users)
- **page_favorites.user_id**: 즐겨찾기 사용자 ID

### Block System Domain과의 통합 (미래)
- **pages.id**: Block System에서 page_id로 참조
- **캔버스 내용**: Block System Domain에서 관리

---

## 📚 References

### 관련 문서
- [Software Design](./03-software-design.md) - Workspace/Page Aggregate 정의
- [Process Model](./02-process-model.md) - Scenario 상세 프로세스
- [Event Storming](./01-event-storm.md) - 도메인 이벤트 및 명령
- [Technical Specification](./05-technical-specification.md) - 구현 가이드 및 TDD 순서

### 외부 참조
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Recursive Queries](https://www.postgresql.org/docs/current/queries-with.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

---

이 데이터베이스 스키마는 Workspace Management Domain의 **Scenario 0~5**를 완전히 지원하며, **Parent ID + depth 캐시 패턴**으로 단순하면서도 충분한 성능을 제공합니다.

### 주요 특징:
- ✅ **5개 테이블**: workspaces, pages, workspace_members, workspace_invitations, page_favorites
- ✅ **재귀 CTE 최적화**: depth, order 인덱스로 트리 조회 성능 확보
- ✅ **Layered Security**: RLS (Self-only) + Application-level 권한 체크
- ✅ **Notification 통합**: workspace_invitations.notification_id로 느슨한 결합
- ✅ **DDD 불변식 반영**: DB 제약조건으로 비즈니스 규칙 보장

DDD 원칙과 성능 최적화, 보안을 모두 고려한 설계로 확장 가능하고 유지보수하기 쉬운 구조를 제공합니다.

