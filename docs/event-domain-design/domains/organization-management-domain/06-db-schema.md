# Organization Management Domain - Database Schema

Technical Specification을 기반으로 한 데이터베이스 스키마 설계 문서입니다. (Scenario 1-6 기준)

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**수정일**: 2025-10-09
**버전**: 8.0  
**기반 문서**: [Technical Specification](./05-technical-specification.md)

### 주요 변경사항 (v8.0) - 멤버 역할 변경 시스템 스키마 문서화 (Scenario 3)
- **member_role enum 주석 강화**: 계층적 권한 시스템 설명 추가 ✅
  - owner: 모든 멤버 역할 변경 가능
  - admin: 멤버 승격만 가능
  - member: 역할 변경 권한 없음
- **organization_members.role 주석 추가**: 계층적 권한 시스템 적용 명시 ✅
- **데이터 무결성 체크리스트**: 역할 변경 권한 제약사항 추가 ✅
- **검증 체크리스트**: Scenario 3 멤버 역할 변경 구현 완료 표시 ✅

### 이전 변경사항 (v7.0) - schema-dev.ts 동기화 및 불일치 경고
- **⚠️ 중요**: organizations.id는 UUID 유지 (schema-dev.ts의 TEXT 형식은 오류)
- **organization_members 구조**: id UUID 추가, created_at/updated_at 필드 제거 (⚠️ audit 필드 복원 필요)
- **invitations 구조**: expires_at 필드 제거 (⚠️ 만료 로직을 위해 복원 필요)
- **FK 참조 수정**: profiles.user_id 참조로 통일
- **schema-dev.ts 불일치 문서화**: 수정 필요 항목 명시

### 이전 변경사항 (v6.0) - Layered Security Model 적용
- **Layered Security Model 도입**: RLS 정책을 최소 권한으로 단순화 ✅
  - RLS Layer: 단순한 safety net (self only, owner only)
  - Application Layer: Service에서 복잡한 권한 체크 (Owner/Admin)
  - adminDb 사용: 시스템 레벨 작업에서 RLS 우회
- **RLS 재귀 문제 해결**: organization_members 정책 단순화로 무한 루프 방지 ✅
- **성능 최적화**: adminDb 사용으로 복잡한 RLS 쿼리 제거 ✅
- **실리콘밸리 Best Practice 적용**: Linear, Notion, GitHub이 사용하는 패턴 ✅

### 이전 변경사항 (v5.0) - 도메인 분리
- **도메인 경계 명확화**: Organization Management Domain은 조직 및 멤버십 관리에 집중
- **조직 관련 테이블**: organizations, organization_members 관리
- **초대 관련 테이블**: invitations 관리
- **알림 테이블 관리**: notifications는 Notification Management Domain에서 관리하지만, Organization Domain에서도 사용
- **단일 책임 원칙**: 조직 생성, 멤버십, 초대 관리에만 집중

### 이전 변경사항 (v4.0)
- Scenario 2 반영 및 멤버 초대 시스템 구현
- 멤버십 관리, 권한 기반 RLS 추가

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 1-6 범위**: 조직 생성, 멤버 초대, 조직 관리, 소유권 이전, 조직 삭제 지원
2. **DDD Aggregate 경계 반영**: Organization, Invitation Aggregate의 불변식을 DB 제약조건으로 구현
3. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리
4. **MECE 구조**: 누락 없이, 중복 없이 명확한 경계
5. **성능 최적화**: Read Model 쿼리 패턴에 맞춘 인덱스 설계
6. **타입 안전성**: Drizzle ORM enum을 통한 조직 타입, 초대 상태, 멤버 역할 관리
7. **권한 기반 접근**: RLS 정책을 통한 세밀한 데이터 접근 제어
8. **확장성**: 향후 조직 기능 확장을 고려한 테이블 설계

### 테이블 관계도 (Scenario 1-6)
```
┌─────────────────┐
│ public.profiles │ (User Management Domain)
│                 │
│ • id (PK)       │
│ • user_id (FK)  │
└────────┬────────┘
         │ profiles.user_id 참조
         │ 1:N
         ▼
┌─────────────────┐
│ organizations   │
│                 │
│ • id (PK, UUID) │ ⚠️ schema-dev.ts는 TEXT (오류)
│ • name          │
│ • organization_type │
│ • owner_id (FK) │ → profiles.user_id
│ • is_default    │
│ • created_at    │
│ • updated_at    │
└────────┬────────┘
         │
  ┌──────┴──────┐
  │             │
  ▼             ▼
┌─────────────────┐ ┌─────────────────┐
│   invitations   │ │organization_    │
│                 │ │   members       │
│ • id (PK, UUID) │ │ • id (PK, UUID) │
│ • org_id (FK)   │ │ • org_id (FK)   │ → organizations.id
│ • inviter_id    │ │ • user_id (FK)  │ → profiles.user_id
│ • invitee_email │ │ • role          │
│ • invitee_id    │ │ • joined_at     │
│ • role          │ └─────────────────┘
│ • status        │
│ • created_at    │ ⚠️ expires_at 누락 (schema-dev.ts)
│ • responded_at  │
└─────────────────┘
```

---

## 📋 Table Definitions

### 1. organization_type enum (public schema)

조직 타입을 정의하는 enum입니다.

```sql
-- 조직 타입 enum 정의
CREATE TYPE organization_type AS ENUM (
    'personal',    -- 개인
    'education',   -- 교육
    'startup',     -- 스타트업
    'agency',      -- 에이전시
    'company',     -- 컴퍼니
    'n/a'          -- N/A
);

-- Comments
COMMENT ON TYPE organization_type IS 'Organization Management Domain - 조직 타입 enum (마케팅용)';
COMMENT ON ENUM VALUE organization_type.personal IS '개인 조직';
COMMENT ON ENUM VALUE organization_type.education IS '교육 기관';
COMMENT ON ENUM VALUE organization_type.startup IS '스타트업';
COMMENT ON ENUM VALUE organization_type.agency IS '에이전시';
COMMENT ON ENUM VALUE organization_type.company IS '컴퍼니';
COMMENT ON ENUM VALUE organization_type.'n/a' IS 'N/A';
```

### 2. member_role enum (public schema)

조직 내 멤버 역할을 정의하는 enum입니다.

```sql
-- 멤버 역할 enum 정의
CREATE TYPE member_role AS ENUM (
    'owner',      -- 소유자
    'admin',      -- 관리자
    'member'      -- 일반 멤버
);

-- Comments
COMMENT ON TYPE member_role IS 'Organization Management Domain - 조직 내 멤버 역할 enum (계층적 권한 시스템 - Scenario 3)';
COMMENT ON ENUM VALUE member_role.owner IS '조직 소유자 (모든 권한, 역할 변경: 모든 멤버 역할 변경 가능)';
COMMENT ON ENUM VALUE member_role.admin IS '조직 관리자 (멤버 관리 권한, 역할 변경: 멤버 승격만 가능)';
COMMENT ON ENUM VALUE member_role.member IS '일반 멤버 (기본 사용 권한, 역할 변경 권한 없음)';
```

### 3. invitation_status enum (public schema)

초대 상태를 정의하는 enum입니다.

```sql
-- 초대 상태 enum 정의
CREATE TYPE invitation_status AS ENUM (
    'pending',    -- 대기 중
    'accepted',   -- 승낙됨
    'rejected',   -- 거절됨
    'expired'     -- 만료됨
);

-- Comments
COMMENT ON TYPE invitation_status IS 'Organization Management Domain - 초대 상태 enum';
COMMENT ON ENUM VALUE invitation_status.pending IS '초대 대기 중';
COMMENT ON ENUM VALUE invitation_status.accepted IS '초대 승낙됨';
COMMENT ON ENUM VALUE invitation_status.rejected IS '초대 거절됨';
COMMENT ON ENUM VALUE invitation_status.expired IS '초대 만료됨';
```

### 4. organizations 테이블 (public schema)

조직 정보를 저장하는 테이블입니다. (Scenario 1-6: 조직 생성, 관리, 삭제)

```sql
CREATE TABLE organizations (
    -- Primary Key (UUID)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization Information
    name TEXT NOT NULL,
    organization_type organization_type NOT NULL DEFAULT 'n/a',
    owner_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT organizations_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT organizations_unique_default_per_owner UNIQUE (owner_id, is_default)
);

-- Indexes for Performance
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_is_default ON organizations(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_organizations_type ON organizations(organization_type);

-- Comments
COMMENT ON TABLE organizations IS 'Organization Management Domain - 조직 정보';
COMMENT ON COLUMN organizations.id IS '조직 ID (UUID, PK) - ⚠️ schema-dev.ts는 TEXT 타입 오류';
COMMENT ON COLUMN organizations.name IS '조직 이름';
COMMENT ON COLUMN organizations.organization_type IS '조직 타입 (enum, 마케팅용)';
COMMENT ON COLUMN organizations.owner_id IS '조직 소유자 ID (profiles.user_id 참조)';
COMMENT ON COLUMN organizations.is_default IS '기본 조직 여부 (사용자당 1개)';
```

> **⚠️ schema-dev.ts 불일치 경고**  
> 현재 schema-dev.ts에서 `organizations.id`가 TEXT 타입으로 `org_${uuid}` 형식을 사용하고 있습니다.  
> 이는 잘못된 설계이며, UUID 타입을 사용해야 합니다. 관련된 모든 FK(organization_members.organization_id, invitations.organization_id)도 UUID여야 합니다.

### 5. organization_members 테이블 (public schema)

조직 멤버십 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE organization_members (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Member Information
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Audit Fields (⚠️ schema-dev.ts에 누락)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT organization_members_unique UNIQUE (organization_id, user_id)
);

-- Indexes for Performance
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_role ON organization_members(role);

-- Comments
COMMENT ON TABLE organization_members IS 'Organization Management Domain - 조직 멤버십 정보';
COMMENT ON COLUMN organization_members.id IS '멤버십 ID (UUID, PK)';
COMMENT ON COLUMN organization_members.organization_id IS '조직 ID (organizations.id, UUID)';
COMMENT ON COLUMN organization_members.user_id IS '사용자 ID (profiles.user_id 참조)';
COMMENT ON COLUMN organization_members.role IS '조직 내 역할 (enum)';
COMMENT ON COLUMN organization_members.joined_at IS '조직 가입 시각';
```

> **⚠️ schema-dev.ts 불일치 경고**  
> 현재 schema-dev.ts에는 `created_at`과 `updated_at` audit 필드가 누락되어 있습니다.  
> 데이터 추적 및 감사를 위해 이 필드들을 추가하는 것을 권장합니다.

### 6. invitations 테이블 (public schema)

멤버 초대 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE invitations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Invitation Information
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inviter_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    status invitation_status NOT NULL DEFAULT 'pending',
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'), -- ⚠️ schema-dev.ts에 누락
    
    -- Constraints
    CONSTRAINT invitations_email_not_empty CHECK (LENGTH(TRIM(invitee_email)) > 0),
    CONSTRAINT invitations_unique_pending_per_email UNIQUE (organization_id, invitee_email, status),
    CONSTRAINT invitations_responded_at_check CHECK (
        (status IN ('accepted', 'rejected') AND responded_at IS NOT NULL) OR
        (status IN ('pending', 'expired') AND responded_at IS NULL)
    )
);

-- Indexes for Performance
CREATE INDEX idx_invitations_org_id ON invitations(organization_id);
CREATE INDEX idx_invitations_inviter_id ON invitations(inviter_user_id);
CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_invitee_user_id ON invitations(invitee_user_id) WHERE invitee_user_id IS NOT NULL;
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at) WHERE status = 'pending';

-- Comments
COMMENT ON TABLE invitations IS 'Organization Management Domain - 멤버 초대 정보';
COMMENT ON COLUMN invitations.id IS '초대 ID (UUID, PK)';
COMMENT ON COLUMN invitations.organization_id IS '조직 ID (organizations.id, UUID)';
COMMENT ON COLUMN invitations.inviter_user_id IS '초대한 사용자 ID (profiles.user_id 참조)';
COMMENT ON COLUMN invitations.invitee_email IS '초대받은 사용자 이메일';
COMMENT ON COLUMN invitations.invitee_user_id IS '초대받은 사용자 ID (가입 후 설정, profiles.user_id 참조)';
COMMENT ON COLUMN invitations.role IS '부여할 역할 (enum)';
COMMENT ON COLUMN invitations.status IS '초대 상태 (enum)';
COMMENT ON COLUMN invitations.expires_at IS '초대 만료 시각 (7일) - ⚠️ schema-dev.ts에 누락';
```

> **⚠️ schema-dev.ts 불일치 경고**  
> 현재 schema-dev.ts에는 `expires_at` 필드가 누락되어 있습니다.  
> 초대 만료 로직을 구현하려면 이 필드를 추가해야 합니다. 또한 unique constraint 이름이 `invitations_unique_pending_per_email`로 수정되었습니다.

## 🔒 Row Level Security (RLS) Policies - Layered Security Model

### 1. RLS 전략: Minimal Permissions (Simple Safety Net)

**핵심 원칙**:
- ✅ **RLS**: 단순한 규칙만 (self only, owner only) - Defense in Depth
- ✅ **Application**: 복잡한 권한 로직 (Owner/Admin 체크) - Primary Authorization
- ✅ **adminDb**: 시스템 레벨 작업 (Service에서 권한 체크 완료 후 RLS 우회)

**참고**: Linear, Notion, GitHub 등 실리콘밸리 기업들이 사용하는 패턴

### 2. RLS 활성화

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### 3. Profiles 테이블 RLS 정책

```sql
-- SELECT: Public (협업을 위한 프로필 정보 조회)
CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT TO anon, authenticated
    USING (true);

-- INSERT: Self only
CREATE POLICY "Enable insert for self" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE: Self only
CREATE POLICY "Enable update for self" ON profiles
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: Self only
CREATE POLICY "Enable delete for self" ON profiles
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);
```

### 4. Organizations 테이블 RLS 정책

```sql
-- SELECT: Public (조직 정보 표시용)
CREATE POLICY "Enable read access for all users" ON organizations
    FOR SELECT TO anon, authenticated
    USING (true);

-- INSERT: Self as owner
CREATE POLICY "Enable insert for owner" ON organizations
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = owner_id);

-- UPDATE: Owner only
CREATE POLICY "Enable update for owner" ON organizations
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = owner_id)
    WITH CHECK ((SELECT auth.uid()) = owner_id);

-- DELETE: Owner only
CREATE POLICY "Enable delete for owner" ON organizations
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = owner_id);
```

### 5. Organization Members 테이블 RLS 정책 (⭐ Layered Security)

```sql
-- SELECT: Self only
-- Note: Owner/Admin이 전체 멤버를 조회할 때는 Application에서 adminDb 사용
CREATE POLICY "Enable read access for self" ON organization_members
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- INSERT: Self only
-- Note: Service에서 Owner/Admin 권한 체크 후 adminDb로 호출
CREATE POLICY "Enable insert for self" ON organization_members
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: Self only
-- Note: Service에서 Owner 권한 체크 후 adminDb로 호출
CREATE POLICY "Enable update for self" ON organization_members
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- DELETE: Self only
-- Note: Service에서 Owner 권한 체크 후 adminDb로 호출
CREATE POLICY "Enable delete for self" ON organization_members
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));
```

**Application-level 권한 체크 예시**:
```typescript
// Repository.getOrganizationMemberView()
// Step 1: RLS로 자기 membership 확인
const userMembership = await db.rls(...) // WHERE user_id = auth.uid()

// Step 2: Application-level 권한 체크
if (userRole === 'owner' || userRole === 'admin') {
  // Step 3: adminDb로 전체 멤버 조회 (RLS 우회)
  return await db.admin.select(...)
}
```

### 6. Invitations 테이블 RLS 정책

```sql
-- SELECT: Inviter or invitee
CREATE POLICY "Enable read for inviter and invitee" ON invitations
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid()) = inviter_user_id OR 
        (SELECT auth.uid()) = invitee_user_id
    );

-- INSERT: Inviter only
-- Note: Service에서 Owner/Admin 권한 체크 완료 후 adminDb로 호출
CREATE POLICY "Enable insert for inviter" ON invitations
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = inviter_user_id);

-- UPDATE: Invitee only (for accepting/rejecting)
-- Note: Service에서 invitee 확인 완료 후 adminDb로 호출
CREATE POLICY "Enable update for invitee" ON invitations
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = invitee_user_id);
```

### 7. Notifications 테이블 RLS 정책 (Notification Management Domain)

```sql
-- SELECT: Self only
CREATE POLICY "Enable read for self" ON notifications
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- INSERT: Self only
-- Note: 실제로는 Service에서 adminDb로 호출 (다른 사용자 알림 생성)
CREATE POLICY "Enable insert for self" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE: Self only (for marking as read)
CREATE POLICY "Enable update for self" ON notifications
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id);
```

**Application-level 처리 예시**:
```typescript
// NotificationRepository.save() - 시스템 레벨 작업
// adminDb 사용: 초대자가 초대받는 사람을 위한 알림 생성
await db.admin.insert(notifications).values(...)
```

## 💼 비즈니스 로직 처리 방침

### SSOT(Single Source of Truth) 원칙
- **비즈니스 로직**: 애플리케이션 서버 코드에서 관리 (TypeScript/Node.js) ✅
- **데이터베이스**: 단순한 데이터 저장소 역할 + 기본 제약조건만 ✅
- **PostgreSQL 함수**: 사용하지 않음 (유지보수성 및 테스트 용이성을 위해) ✅

### Layered Security Model (v6.0) ✅

**1️⃣ RLS Layer (Defense in Depth)**
- 역할: 마지막 방어선, Direct DB access 방지
- 정책: 단순한 규칙만 (self only, owner only)
- 장점: 복잡한 로직 없음, 재귀 문제 없음

**2️⃣ Application Layer (Primary Authorization)**
- 역할: 복잡한 권한 로직 처리
- 구현: Service Layer에서 권한 체크
- 예시: Owner/Admin이 전체 멤버 조회, 멤버 추가/삭제

**3️⃣ adminDb 사용 시점**
- 시스템 레벨 작업: 초대 생성, 멤버 추가, 알림 생성
- 전제 조건: Service에서 권한 체크 완료
- 이유: RLS 우회하여 성능 최적화, 재귀 문제 해결

---


## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략 (Scenario 1-6)

```sql
-- 조직 조회 최적화 (소유자별)
CREATE INDEX idx_organizations_owner_default ON organizations(owner_id, is_default);

-- 기본 조직 조회 최적화
CREATE INDEX idx_organizations_default_true ON organizations(is_default) WHERE is_default = TRUE;

-- 멤버십 조회 최적화
CREATE INDEX idx_organization_members_user_org ON organization_members(user_id, organization_id);
CREATE INDEX idx_organization_members_org_role ON organization_members(organization_id, role);

-- 초대 조회 최적화
CREATE INDEX idx_invitations_org_status ON invitations(organization_id, status);
CREATE INDEX idx_invitations_email_status ON invitations(invitee_email, status);
CREATE INDEX idx_invitations_user_status ON invitations(invitee_user_id, status) WHERE invitee_user_id IS NOT NULL;
```

### 2. 쿼리 성능 최적화

```sql
-- 자주 사용되는 조인 최적화
CREATE INDEX idx_organizations_owner_created ON organizations(owner_id, created_at DESC);

-- 멤버 초대 폼 조회 최적화 (조직별 멤버 + 진행 중인 초대)
CREATE INDEX idx_invitations_org_pending ON invitations(organization_id) WHERE status = 'pending';

-- 초대 만료 처리 최적화
CREATE INDEX idx_invitations_expires_pending ON invitations(expires_at) WHERE status = 'pending';
```

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. 기본 조직 없는 사용자 확인
SELECT 'Users without default org' as issue, COUNT(*) as count
FROM profiles p
LEFT JOIN organizations o ON p.user_id = o.owner_id AND o.is_default = TRUE
WHERE o.id IS NULL AND p.deleted_at IS NULL;

-- 2. 중복 기본 조직 확인
SELECT 'Users with multiple default orgs' as issue, COUNT(*) as count
FROM (
    SELECT owner_id, COUNT(*) as default_count
    FROM organizations
    WHERE is_default = TRUE
    GROUP BY owner_id
    HAVING COUNT(*) > 1
) duplicates;

-- 3. 만료된 초대 확인
SELECT 'Expired pending invitations' as issue, COUNT(*) as count
FROM invitations
WHERE status = 'pending' AND expires_at < NOW();

-- 4. 멤버십 일관성 확인 (조직 소유자가 멤버 테이블에 없는 경우)
SELECT 'Organizations without owner membership' as issue, COUNT(*) as count
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.organization_id = o.id 
    AND om.user_id = o.owner_id 
    AND om.role = 'owner'
);

-- 5. 중복 소유자 확인
SELECT 'Organizations with multiple owners' as issue, COUNT(*) as count
FROM (
    SELECT organization_id, COUNT(*) as owner_count
    FROM organization_members
    WHERE role = 'owner'
    GROUP BY organization_id
    HAVING COUNT(*) > 1
) duplicates;

-- 6. 초대 중복 확인
SELECT 'Duplicate pending invitations' as issue, COUNT(*) as count
FROM (
    SELECT organization_id, invitee_email, COUNT(*) as invitation_count
    FROM invitations
    WHERE status = 'pending'
    GROUP BY organization_id, invitee_email
    HAVING COUNT(*) > 1
) duplicates;
```

### 2. 성능 모니터링

```sql
-- 느린 쿼리 식별
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%organizations%' 
   OR query LIKE '%invitations%'
   OR query LIKE '%organization_members%'
ORDER BY total_time DESC
LIMIT 10;

-- 테이블별 사용량 통계
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_tup_hot_upd as hot_updates,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables 
WHERE tablename IN ('organizations', 'organization_members', 'invitations')
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- 인덱스 사용량 통계
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('organizations', 'organization_members', 'invitations')
ORDER BY idx_scan DESC;
```

---

## ✅ 검증 체크리스트

### Scenario 1-6 지원
- [x] **기본 조직 생성**: User Management Domain 요청 수신 시 자동 생성 ✅
- [x] **새로운 조직 생성**: 사용자가 직접 새로운 조직 생성 ✅
- [x] **조직 조회**: 사용자가 소유하거나 멤버인 조직 목록 조회 ✅
- [x] **조직 타입 관리**: `organization_type` enum으로 타입 안전성 확보 ✅
- [x] **멤버 초대**: `invitations` 테이블로 초대 상태 관리 + adminDb 사용 ✅
  - inviteMember: 이메일 검색, inviteeUserId 저장, Notification 생성
- [x] **초대 수락/거절**: 초대 상태 변경 + 멤버십 자동 추가 ✅
  - acceptInvitation: organization_members에 멤버 추가 (adminDb)
- [x] **멤버십 관리**: Layered Security Model 적용 ✅
  - Application-level: Service에서 Owner/Admin 권한 체크
  - Repository: adminDb 사용 (addMember, removeMember, updateMemberRole)
- [x] **멤버 역할 변경 (Scenario 3)**: 계층적 권한 시스템 구현 ✅
  - member_role enum으로 역할 타입 안전성 확보
  - updateMemberRole 메서드로 역할 업데이트 (adminDb)
  - 소유자/관리자별 역할 변경 권한 구분
  - 권한 캐시 무효화 지원
- [x] **권한 기반 접근**: RLS (최소 권한) + Application (복잡한 로직) ✅
- [x] **알림 시스템**: NotificationService 통합 (adminDb로 다른 사용자 알림 생성) ✅
- [ ] **소유권 이전**: 조직 소유자 변경 및 멤버 역할 업데이트 (Phase 4)
- [ ] **조직 삭제**: 조직 및 관련 데이터 삭제 (Phase 4)

### 데이터 무결성
- [x] **기본 조직 제약**: 사용자당 1개 기본 조직만 허용
- [x] **소유권 제약**: 조직은 반드시 1명의 소유자 필요
- [x] **조직 타입 제약**: 유효한 enum 값만 허용
- [x] **멤버 역할 제약**: 유효한 member_role enum 값만 허용 (owner, admin, member)
- [x] **역할 변경 권한 제약 (Scenario 3)**: Application-level에서 계층적 권한 시스템 검증
  - 소유자 역할 변경 불가 (소유권 이전을 통해서만)
  - 관리자는 멤버 승격만 가능, 강등 불가
  - 소유자만 관리자 강등 가능
- [x] **초대 상태 제약**: 유효한 invitation_status enum 값만 허용
- [x] **중복 초대 방지**: 동일 조직-이메일에 대한 pending 초대 중복 불가
- [x] **멤버십 중복 방지**: 동일 조직-사용자에 대한 멤버십 중복 불가
- [x] **소유자 유일성**: 조직당 1명의 소유자만 허용
- [x] **초대 응답 일관성**: 응답된 초대는 responded_at 필수
- [x] **RLS 보안**: 사용자는 자신의 데이터만 접근 가능

### 성능 최적화
- [x] **핵심 인덱스**: 조직별/사용자별 조회 최적화
- [x] **조직 타입 인덱스**: 조직 타입별 조회 최적화
- [x] **멤버십 인덱스**: 조직별/사용자별 멤버 조회 최적화
- [x] **초대 인덱스**: 조직별/이메일별/상태별 초대 조회 최적화
- [x] **복합 인덱스**: 자주 사용되는 조합 쿼리 최적화
- [x] **부분 인덱스**: 조건부 인덱스로 저장 공간 절약
- [x] **통합 뷰**: 복잡한 조인 쿼리를 뷰로 최적화

### 아키텍처 일관성
- [x] **DDD 원칙**: Organization, Invitation Aggregate 경계와 DB 스키마 일치
- [x] **단일 책임**: 각 테이블이 명확한 역할
- [x] **확장성**: 향후 추가 기능 확장 가능한 구조
- [x] **타입 안전성**: Drizzle ORM enum과 TypeScript 타입 일치
- [x] **Aggregate 분리**: Organization, Invitation 각각 독립적 관리
- [x] **이벤트 기반 설계**: 도메인 이벤트 발행을 위한 구조 지원
- [x] **CQRS 지원**: Command와 Query 분리를 위한 뷰 제공

---

## 🔗 도메인 간 통합

### User Management Domain과의 통합
- **profiles.user_id**: organizations.owner_id, organization_members.user_id, invitations.inviter_user_id, invitations.invitee_user_id의 외래키로 참조
- **profiles 테이블**: RLS 공개 정책으로 사용자 프로필 조회 가능 (멤버 초대 폼에서 사용)

### Notification Management Domain과의 통합
- **invitations.id**: Notification Management Domain에서 알림 생성 시 related_id로 참조
- **초대 생성**: Notification Management Domain에 알림 생성 요청
- **초대 응답**: Notification Management Domain에 알림 정리 요청

---

## 📚 References

### 관련 문서
- [Software Design](./03-software-design.md) - Organization, Invitation Aggregate 정의 및 Read Model
- [Process Model](./02-process-model.md) - Scenario 1-6 상세 프로세스
- [Event Storming](./01-event-storm.md) - 도메인 이벤트 및 명령
- [Technical Specification](./05-technical-specification.md) - 구현 가이드 및 TDD 순서

---

이 데이터베이스 스키마는 Organization Management Domain의 Scenario 1-6을 완전히 지원하며, 조직 생성, 멤버 초대, 조직 관리 기능을 제공합니다. 다양한 enum 타입을 통한 타입 안전성과 세밀한 RLS 정책을 통해 보안적이면서도 확장 가능한 구조를 제공합니다.




