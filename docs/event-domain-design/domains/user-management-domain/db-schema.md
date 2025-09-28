# User Management Domain - Database Schema

Technical Specification을 기반으로 한 데이터베이스 스키마 설계 문서입니다.

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**버전**: 1.0  
**기반 문서**: [Technical Specification](./technical-specification.md)

---

## 🎯 Schema Overview

### 설계 원칙
1. **DDD Aggregate 경계 반영**: 각 Aggregate의 불변식을 DB 제약조건으로 구현
2. **Clerk 동기화 지원**: 외부 시스템과의 일관성 보장을 위한 인덱스 설계
3. **소프트 삭제 패턴**: 30일 보관 정책을 위한 `deleted_at` 컬럼
4. **성능 최적화**: Read Model 쿼리 패턴에 맞춘 인덱스 설계
5. **확장성**: 향후 도메인 확장을 고려한 스키마 구조

### 테이블 관계도
```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │  organizations  │       │   memberships   │
│                 │       │                 │       │                 │
│ • id (PK)       │       │ • id (PK)       │       │ • id (PK)       │
│ • clerk_id      │       │ • clerk_id      │       │ • user_id (FK)  │
│ • email         │◄──────┤ • owner_id (FK) │◄──────┤ • org_id (FK)   │
│ • name          │       │ • name          │       │ • role          │
│ • avatar_url    │       │ • slug          │       │ • status        │
│ • created_at    │       │ • is_default    │       │ • invited_by    │
│ • updated_at    │       │ • created_at    │       │ • invited_at    │
│ • deleted_at    │       │ • updated_at    │       │ • joined_at     │
└─────────────────┘       │ • deleted_at    │       │ • created_at    │
                          └─────────────────┘       │ • updated_at    │
                                                    │ • deleted_at    │
                                                    │ • invitee_email │
                                                    └─────────────────┘
```

---

## 📋 Table Definitions

### 1. users 테이블

사용자 기본 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Clerk Integration
    clerk_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- User Information
    email VARCHAR(254) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    
    -- Audit Fields
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes for Performance
CREATE UNIQUE INDEX idx_users_clerk_id ON users(clerk_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC) WHERE deleted_at IS NULL;

-- Comments
COMMENT ON TABLE users IS 'User Management Domain - 사용자 기본 정보';
COMMENT ON COLUMN users.id IS 'Supabase 내부 사용자 ID (UUID)';
COMMENT ON COLUMN users.clerk_id IS 'Clerk 외부 시스템 사용자 ID';
COMMENT ON COLUMN users.email IS '사용자 이메일 (254자 제한, RFC 5321 준수)';
COMMENT ON COLUMN users.name IS '사용자 표시명';
COMMENT ON COLUMN users.avatar_url IS '프로필 이미지 URL (Clerk에서 제공)';
COMMENT ON COLUMN users.last_login_at IS '마지막 로그인 시간';
COMMENT ON COLUMN users.deleted_at IS '소프트 삭제 시간 (30일 보관 후 완전 삭제)';
```

### 2. organizations 테이블

조직 정보와 소유권을 관리하는 테이블입니다.

```sql
CREATE TABLE organizations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Clerk Integration
    clerk_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Organization Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    
    -- Ownership
    owner_id UUID NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Keys
    CONSTRAINT fk_organizations_owner FOREIGN KEY (owner_id) 
        REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT organizations_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT organizations_slug_format CHECK (
        slug ~* '^[a-z0-9-]+$' AND 
        LENGTH(slug) >= 3 AND 
        LENGTH(slug) <= 50
    )
);

-- Indexes for Performance
CREATE UNIQUE INDEX idx_organizations_clerk_id ON organizations(clerk_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_is_default ON organizations(is_default) WHERE is_default = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NOT NULL;

-- Comments
COMMENT ON TABLE organizations IS 'User Management Domain - 조직 정보 및 소유권 관리';
COMMENT ON COLUMN organizations.id IS 'Supabase 내부 조직 ID (UUID)';
COMMENT ON COLUMN organizations.clerk_id IS 'Clerk 외부 시스템 조직 ID';
COMMENT ON COLUMN organizations.name IS '조직 표시명';
COMMENT ON COLUMN organizations.slug IS '조직 URL 슬러그 (3-50자, 소문자+숫자+하이픈)';
COMMENT ON COLUMN organizations.owner_id IS '조직 소유자 사용자 ID';
COMMENT ON COLUMN organizations.is_default IS '기본 조직 여부 (사용자당 1개)';
COMMENT ON COLUMN organizations.deleted_at IS '소프트 삭제 시간 (30일 보관 후 완전 삭제)';
```

### 3. memberships 테이블

사용자-조직 간의 멤버십과 초대를 관리하는 테이블입니다.

```sql
CREATE TABLE memberships (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    organization_id UUID NOT NULL,
    user_id UUID, -- NULL for pending invitations
    
    -- Membership Information
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
    
    -- Invitation Information
    invited_by UUID,
    invitee_email VARCHAR(254), -- For pending invitations
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Keys
    CONSTRAINT fk_memberships_organization FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_memberships_invited_by FOREIGN KEY (invited_by) 
        REFERENCES users(id) ON DELETE SET NULL,
    
    -- Business Rules Constraints
    CONSTRAINT memberships_user_or_email CHECK (
        (status = 'pending' AND user_id IS NULL AND invitee_email IS NOT NULL) OR
        (status IN ('active', 'removed') AND user_id IS NOT NULL)
    ),
    CONSTRAINT memberships_invitation_fields CHECK (
        (status = 'pending' AND invited_by IS NOT NULL AND invited_at IS NOT NULL) OR
        (status != 'pending')
    ),
    CONSTRAINT memberships_joined_at_logic CHECK (
        (status = 'active' AND joined_at IS NOT NULL) OR
        (status != 'active')
    ),
    CONSTRAINT memberships_invitee_email_format CHECK (
        invitee_email IS NULL OR 
        invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Indexes for Performance
CREATE INDEX idx_memberships_organization_id ON memberships(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_memberships_user_id ON memberships(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_memberships_invited_by ON memberships(invited_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_memberships_status ON memberships(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_memberships_role ON memberships(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_memberships_invitee_email ON memberships(invitee_email) WHERE status = 'pending' AND deleted_at IS NULL;
CREATE INDEX idx_memberships_invited_at ON memberships(invited_at) WHERE status = 'pending' AND deleted_at IS NULL;
CREATE INDEX idx_memberships_deleted_at ON memberships(deleted_at) WHERE deleted_at IS NOT NULL;

-- Unique Constraints
CREATE UNIQUE INDEX idx_memberships_user_org_unique ON memberships(user_id, organization_id) 
    WHERE deleted_at IS NULL AND user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_memberships_email_org_pending ON memberships(invitee_email, organization_id) 
    WHERE status = 'pending' AND deleted_at IS NULL;

-- Comments
COMMENT ON TABLE memberships IS 'User Management Domain - 사용자-조직 멤버십 및 초대 관리';
COMMENT ON COLUMN memberships.id IS 'Supabase 내부 멤버십 ID (UUID)';
COMMENT ON COLUMN memberships.organization_id IS '조직 ID (FK)';
COMMENT ON COLUMN memberships.user_id IS '사용자 ID (FK) - 초대 수락 전에는 NULL';
COMMENT ON COLUMN memberships.role IS '멤버 역할: owner(소유자), admin(관리자), member(일반멤버)';
COMMENT ON COLUMN memberships.status IS '멤버십 상태: pending(초대대기), active(활성), removed(제거됨)';
COMMENT ON COLUMN memberships.invited_by IS '초대한 사용자 ID (FK)';
COMMENT ON COLUMN memberships.invitee_email IS '초대받은 이메일 (초대 대기 중일 때만)';
COMMENT ON COLUMN memberships.invited_at IS '초대 시간';
COMMENT ON COLUMN memberships.joined_at IS '가입 완료 시간 (초대 수락 시)';
COMMENT ON COLUMN memberships.deleted_at IS '소프트 삭제 시간';
```

---

## 🔒 Business Rules & Constraints

### 1. 조직 소유권 규칙

```sql
-- 각 조직은 정확히 하나의 Owner를 가져야 함
CREATE OR REPLACE FUNCTION check_single_owner_per_organization()
RETURNS TRIGGER AS $$
BEGIN
    -- Owner 역할 변경 시 검증
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.role = 'owner' THEN
        -- 같은 조직에 다른 Owner가 있는지 확인
        IF EXISTS (
            SELECT 1 FROM memberships 
            WHERE organization_id = NEW.organization_id 
            AND role = 'owner' 
            AND status = 'active'
            AND deleted_at IS NULL 
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        ) THEN
            RAISE EXCEPTION 'Organization can have only one owner';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_owner_per_organization
    BEFORE INSERT OR UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION check_single_owner_per_organization();
```

### 2. 기본 조직 규칙

```sql
-- 각 사용자는 정확히 하나의 기본 조직을 가져야 함
CREATE OR REPLACE FUNCTION check_single_default_organization_per_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 기본 조직 생성/변경 시 검증
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_default = TRUE THEN
        -- 같은 소유자의 다른 기본 조직이 있는지 확인
        IF EXISTS (
            SELECT 1 FROM organizations 
            WHERE owner_id = NEW.owner_id 
            AND is_default = TRUE 
            AND deleted_at IS NULL 
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'User can have only one default organization';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_default_organization_per_user
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION check_single_default_organization_per_user();
```

### 3. 초대 만료 규칙

```sql
-- 30일 후 초대 자동 만료
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE memberships 
    SET status = 'removed', 
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE status = 'pending' 
    AND invited_at < NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 매일 자정에 실행되는 크론 작업 (Supabase Edge Functions 또는 외부 스케줄러 필요)
```

### 4. 소프트 삭제 정리 규칙

```sql
-- 30일 후 완전 삭제
CREATE OR REPLACE FUNCTION cleanup_soft_deleted_records()
RETURNS void AS $$
BEGIN
    -- 사용자 완전 삭제
    DELETE FROM users 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
    
    -- 조직 완전 삭제
    DELETE FROM organizations 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
    
    -- 멤버십 완전 삭제
    DELETE FROM memberships 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Read Model Optimized Views

### 1. UserOrganizationView

사용자의 조직 목록과 컨텍스트 정보를 위한 뷰입니다.

```sql
CREATE OR REPLACE VIEW user_organization_view AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.avatar_url as user_avatar_url,
    u.last_login_at,
    
    -- 조직 정보 (JSON 배열로 집계)
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', o.id,
                'name', o.name,
                'slug', o.slug,
                'role', m.role,
                'isDefault', o.is_default,
                'memberCount', org_stats.member_count
            ) ORDER BY o.is_default DESC, m.joined_at ASC
        ) FILTER (WHERE o.id IS NOT NULL), 
        '[]'::json
    ) as organizations,
    
    -- 현재 조직 ID (기본 조직)
    default_org.id as current_organization_id

FROM users u
LEFT JOIN memberships m ON u.id = m.user_id 
    AND m.status = 'active' 
    AND m.deleted_at IS NULL
LEFT JOIN organizations o ON m.organization_id = o.id 
    AND o.deleted_at IS NULL
LEFT JOIN organizations default_org ON u.id = default_org.owner_id 
    AND default_org.is_default = TRUE 
    AND default_org.deleted_at IS NULL
LEFT JOIN (
    -- 조직별 멤버 수 계산
    SELECT 
        organization_id,
        COUNT(*) as member_count
    FROM memberships 
    WHERE status = 'active' AND deleted_at IS NULL
    GROUP BY organization_id
) org_stats ON o.id = org_stats.organization_id

WHERE u.deleted_at IS NULL
GROUP BY u.id, u.name, u.email, u.avatar_url, u.last_login_at, default_org.id;

-- 인덱스 최적화
CREATE INDEX idx_user_org_view_user_id ON memberships(user_id, status) 
    WHERE status = 'active' AND deleted_at IS NULL;
```

### 2. OrganizationMemberView

조직의 멤버 목록과 초대 상태를 위한 뷰입니다.

```sql
CREATE OR REPLACE VIEW organization_member_view AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    
    -- 활성 멤버 (JSON 배열)
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'userId', u.id,
                'email', u.email,
                'name', u.name,
                'role', m.role,
                'joinedAt', m.joined_at,
                'lastActiveAt', u.last_login_at
            ) ORDER BY m.role = 'owner' DESC, m.role = 'admin' DESC, m.joined_at ASC
        ) FILTER (WHERE m.status = 'active' AND m.deleted_at IS NULL), 
        '[]'::json
    ) as members,
    
    -- 대기 중인 초대 (JSON 배열)
    COALESCE(
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'invitationId', pending.id,
                'email', pending.invitee_email,
                'role', pending.role,
                'invitedBy', inviter.name,
                'invitedAt', pending.invited_at,
                'expiresAt', pending.invited_at + INTERVAL '30 days'
            ) ORDER BY pending.invited_at DESC
        ) FILTER (WHERE pending.status = 'pending' AND pending.deleted_at IS NULL), 
        '[]'::json
    ) as pending_invitations,
    
    -- 총 멤버 수
    COUNT(*) FILTER (WHERE m.status = 'active' AND m.deleted_at IS NULL) as total_member_count

FROM organizations o
LEFT JOIN memberships m ON o.id = m.organization_id
LEFT JOIN users u ON m.user_id = u.id AND u.deleted_at IS NULL
LEFT JOIN memberships pending ON o.id = pending.organization_id 
    AND pending.status = 'pending' 
    AND pending.deleted_at IS NULL
LEFT JOIN users inviter ON pending.invited_by = inviter.id

WHERE o.deleted_at IS NULL
GROUP BY o.id, o.name;

-- 인덱스 최적화
CREATE INDEX idx_org_member_view_org_id ON memberships(organization_id, status) 
    WHERE deleted_at IS NULL;
```

---

## 🚀 Performance Optimization

### 1. 파티셔닝 전략 (대규모 확장 시)

```sql
-- 멤버십 테이블을 조직 ID로 파티셔닝 (1M+ 레코드 시 고려)
-- CREATE TABLE memberships_partitioned (LIKE memberships) 
-- PARTITION BY HASH (organization_id);
```

### 2. 캐싱 전략

```sql
-- 자주 조회되는 데이터를 위한 Materialized View
CREATE MATERIALIZED VIEW user_organization_summary AS
SELECT 
    u.id as user_id,
    COUNT(m.id) as organization_count,
    MAX(m.joined_at) as last_joined_at,
    BOOL_OR(m.role = 'owner') as has_owned_organizations
FROM users u
LEFT JOIN memberships m ON u.id = m.user_id 
    AND m.status = 'active' 
    AND m.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id;

-- 매시간 갱신
CREATE INDEX idx_user_org_summary_user_id ON user_organization_summary(user_id);
```

### 3. 쿼리 최적화

```sql
-- 조직별 멤버 수 빠른 조회를 위한 함수
CREATE OR REPLACE FUNCTION get_organization_member_count(org_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM memberships 
        WHERE organization_id = org_id 
        AND status = 'active' 
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 🔧 Migration Scripts

### 1. 초기 스키마 생성

```sql
-- 1. 테이블 생성
\i create_users_table.sql
\i create_organizations_table.sql  
\i create_memberships_table.sql

-- 2. 인덱스 생성
\i create_indexes.sql

-- 3. 제약조건 및 트리거 생성
\i create_constraints.sql
\i create_triggers.sql

-- 4. 뷰 생성
\i create_views.sql

-- 5. 함수 생성
\i create_functions.sql
```

### 2. 데이터 마이그레이션 (기존 시스템에서)

```sql
-- Clerk 데이터 동기화를 위한 임시 테이블
CREATE TEMPORARY TABLE clerk_sync_data (
    clerk_user_id VARCHAR(255),
    clerk_org_id VARCHAR(255),
    user_email VARCHAR(254),
    org_name VARCHAR(255),
    user_role VARCHAR(20)
);

-- 마이그레이션 로직은 애플리케이션 레벨에서 처리
```

---

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. 고아 레코드 확인
SELECT 'Orphaned memberships' as issue, COUNT(*) as count
FROM memberships m
LEFT JOIN users u ON m.user_id = u.id
LEFT JOIN organizations o ON m.organization_id = o.id
WHERE (m.user_id IS NOT NULL AND u.id IS NULL) 
   OR o.id IS NULL;

-- 2. 만료된 초대 확인
SELECT 'Expired invitations' as issue, COUNT(*) as count
FROM memberships 
WHERE status = 'pending' 
AND invited_at < NOW() - INTERVAL '30 days'
AND deleted_at IS NULL;

-- 3. 기본 조직 누락 사용자 확인
SELECT 'Users without default org' as issue, COUNT(*) as count
FROM users u
LEFT JOIN organizations o ON u.id = o.owner_id AND o.is_default = TRUE AND o.deleted_at IS NULL
WHERE u.deleted_at IS NULL AND o.id IS NULL;
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
WHERE query LIKE '%memberships%' OR query LIKE '%organizations%' OR query LIKE '%users%'
ORDER BY total_time DESC
LIMIT 10;
```

---

## ✅ 검증 체크리스트

### 스키마 무결성
- [ ] 모든 Foreign Key 제약조건이 올바르게 설정되었는가?
- [ ] Business Rule이 데이터베이스 제약조건으로 구현되었는가?
- [ ] 소프트 삭제 패턴이 모든 테이블에 일관되게 적용되었는가?
- [ ] Clerk ID 동기화를 위한 인덱스가 설정되었는가?

### 성능 최적화
- [ ] Read Model 쿼리에 필요한 인덱스가 모두 생성되었는가?
- [ ] 복합 인덱스가 쿼리 패턴에 맞게 설계되었는가?
- [ ] Partial Index가 적절히 활용되었는가?
- [ ] View가 성능을 고려하여 설계되었는가?

### 확장성
- [ ] UUID를 사용하여 분산 환경에서 확장 가능한가?
- [ ] 파티셔닝 전략이 고려되었는가?
- [ ] 캐싱 전략이 수립되었는가?

---

이 데이터베이스 스키마는 User Management Domain의 Technical Specification을 완전히 반영하며, DDD의 Aggregate 경계와 비즈니스 규칙을 데이터베이스 레벨에서 보장합니다.
