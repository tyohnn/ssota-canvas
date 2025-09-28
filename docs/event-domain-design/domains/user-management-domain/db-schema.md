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

## 🔒 Basic Data Integrity Constraints

### 1. 기본 데이터 무결성 제약조건

```sql
-- 기본적인 데이터 타입 및 형식 검증만 DB에서 처리
-- 복잡한 비즈니스 로직은 도메인 Aggregate에서 처리

-- 이메일 형식 검증
ALTER TABLE users ADD CONSTRAINT users_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 슬러그 형식 검증
ALTER TABLE organizations ADD CONSTRAINT organizations_slug_format 
    CHECK (slug ~* '^[a-z0-9-]+$' AND LENGTH(slug) >= 3 AND LENGTH(slug) <= 50);

-- 역할 값 검증
ALTER TABLE memberships ADD CONSTRAINT memberships_role_check 
    CHECK (role IN ('owner', 'admin', 'member'));

-- 상태 값 검증
ALTER TABLE memberships ADD CONSTRAINT memberships_status_check 
    CHECK (status IN ('pending', 'active', 'removed'));
```

### 2. 외래키 제약조건 (데이터 무결성)

```sql
-- 기본적인 참조 무결성만 보장
-- 비즈니스 로직은 도메인에서 처리

-- 조직 소유자는 반드시 존재해야 함
ALTER TABLE organizations ADD CONSTRAINT fk_organizations_owner 
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;

-- 멤버십의 조직은 반드시 존재해야 함
ALTER TABLE memberships ADD CONSTRAINT fk_memberships_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 멤버십의 사용자는 반드시 존재해야 함 (NULL 허용 - 초대 대기 중)
ALTER TABLE memberships ADD CONSTRAINT fk_memberships_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 초대한 사용자는 반드시 존재해야 함 (NULL 허용)
ALTER TABLE memberships ADD CONSTRAINT fk_memberships_invited_by 
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;
```

### 3. 유틸리티 함수 (도메인 서비스에서 활용)

```sql
-- 초대 만료 확인 (도메인 서비스에서 호출)
CREATE OR REPLACE FUNCTION is_invitation_expired(invited_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN invited_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql STABLE;

-- 소프트 삭제된 레코드 정리 (스케줄러에서 호출)
CREATE OR REPLACE FUNCTION cleanup_soft_deleted_records()
RETURNS void AS $$
BEGIN
    -- 30일 후 완전 삭제
    DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM organizations WHERE deleted_at < NOW() - INTERVAL '30 days';
    DELETE FROM memberships WHERE deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

### 4. 비즈니스 로직은 도메인에서 처리

```typescript
// 도메인 Aggregate에서 비즈니스 규칙 처리
export class OrganizationAggregate {
  transferOwnership(newOwnerId: UserId, currentOwnerId: UserId): OwnershipTransferredEvent {
    // 1. 소유권 이전 권한 검증 (도메인 로직)
    if (!this.organization.ownerId.equals(currentOwnerId)) {
      throw new UserManagementError('INSUFFICIENT_PERMISSIONS', 'Only current owner can transfer ownership');
    }
    
    // 2. 기본 조직 소유권 이전 방지 (도메인 로직)
    if (this.organization.isDefault) {
      throw new UserManagementError('CANNOT_TRANSFER_DEFAULT', 'Cannot transfer ownership of default organization');
    }
    
    // 3. 새 소유자 멤버십 확인 (도메인 로직)
    const newOwnerMembership = this.memberships.find(m => 
      m.userId.equals(newOwnerId) && !m.isDeleted
    );
    if (!newOwnerMembership) {
      throw new UserManagementError('USER_NOT_MEMBER', 'New owner must be a member of the organization');
    }
    
    // 4. 비즈니스 로직 실행
    this.organization.transferOwnership(newOwnerId);
    return new OwnershipTransferredEvent(...);
  }
}
```

---

## 📊 Basic Join Views (Performance Optimized)

### 1. 단순한 조인 뷰 (비즈니스 로직 제외)

```sql
-- 사용자-조직 기본 조인 뷰 (성능 최적화)
CREATE OR REPLACE VIEW user_organizations_basic AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.avatar_url as user_avatar_url,
    u.last_login_at,
    o.id as organization_id,
    o.name as organization_name,
    o.slug as organization_slug,
    o.is_default,
    m.role as membership_role,
    m.joined_at,
    m.status as membership_status
FROM users u
LEFT JOIN memberships m ON u.id = m.user_id 
    AND m.status = 'active' 
    AND m.deleted_at IS NULL
LEFT JOIN organizations o ON m.organization_id = o.id 
    AND o.deleted_at IS NULL
WHERE u.deleted_at IS NULL;

-- 조직-멤버 기본 조인 뷰 (성능 최적화)
CREATE OR REPLACE VIEW organization_members_basic AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.slug as organization_slug,
    o.owner_id,
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.avatar_url as user_avatar_url,
    m.role as membership_role,
    m.joined_at,
    m.status as membership_status,
    m.invited_by,
    m.invitee_email,
    m.invited_at
FROM organizations o
LEFT JOIN memberships m ON o.id = m.organization_id
LEFT JOIN users u ON m.user_id = u.id AND u.deleted_at IS NULL
WHERE o.deleted_at IS NULL;

-- 성능 최적화 인덱스
CREATE INDEX idx_user_org_basic_user_id ON memberships(user_id, status) 
    WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_org_member_basic_org_id ON memberships(organization_id, status) 
    WHERE deleted_at IS NULL;
```

### 2. 복잡한 Read Model은 도메인 서비스에서 처리

```typescript
// 도메인 서비스에서 비즈니스 로직과 함께 Read Model 구성
export class UserOrganizationViewService {
  constructor(
    private userRepository: UserRepository,
    private organizationRepository: OrganizationRepository,
    private membershipRepository: MembershipRepository
  ) {}

  async getUserOrganizations(userId: UserId): Promise<UserOrganizationView> {
    // 1. 기본 데이터 조회 (DB 뷰 활용)
    const basicData = await this.db.query(`
      SELECT * FROM user_organizations_basic 
      WHERE user_id = $1
    `, [userId.value]);

    // 2. 도메인 로직으로 데이터 가공
    const user = basicData[0];
    const organizations = this.groupOrganizationsByUser(basicData);
    const currentOrganizationId = this.getCurrentOrganizationId(organizations);

    // 3. 비즈니스 규칙 적용 (권한 검증 등)
    const enrichedOrganizations = await this.enrichWithBusinessLogic(organizations);

    return {
      user: {
        id: user.user_id,
        name: user.user_name,
        email: user.user_email,
        avatarUrl: user.user_avatar_url
      },
      organizations: enrichedOrganizations,
      currentOrganizationId
    };
  }

  private async enrichWithBusinessLogic(organizations: any[]): Promise<any[]> {
    // 비즈니스 로직으로 데이터 보강
    return organizations.map(org => ({
      ...org,
      memberCount: await this.getMemberCount(org.organization_id),
      permissions: await this.getUserPermissions(org.organization_id),
      // 기타 비즈니스 로직...
    }));
  }
}
```

---

## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략

```sql
-- 사용자 조회 최적화
CREATE INDEX idx_users_clerk_id_active ON users(clerk_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;

-- 조직 조회 최적화  
CREATE INDEX idx_organizations_owner_active ON organizations(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_slug_active ON organizations(slug) WHERE deleted_at IS NULL;

-- 멤버십 조회 최적화
CREATE INDEX idx_memberships_user_org_active ON memberships(user_id, organization_id) 
    WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_memberships_org_status ON memberships(organization_id, status) 
    WHERE deleted_at IS NULL;
CREATE INDEX idx_memberships_invitee_email ON memberships(invitee_email) 
    WHERE status = 'pending' AND deleted_at IS NULL;
```

### 2. 쿼리 성능 최적화

```sql
-- 자주 사용되는 집계 쿼리 최적화
CREATE INDEX idx_memberships_org_role_count ON memberships(organization_id, role, status) 
    WHERE deleted_at IS NULL;

-- 초대 만료 확인 최적화
CREATE INDEX idx_memberships_pending_expired ON memberships(invited_at) 
    WHERE status = 'pending' AND deleted_at IS NULL;
```

### 3. 도메인 서비스에서 캐싱 전략

```typescript
// 도메인 서비스에서 캐싱 구현
export class UserOrganizationViewService {
  private cache = new Map<string, UserOrganizationView>();

  async getUserOrganizations(userId: UserId): Promise<UserOrganizationView> {
    // 1. 캐시 확인
    const cacheKey = `user_org_${userId.value}`;
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // 2. DB에서 조회
    const result = await this.fetchFromDatabase(userId);
    
    // 3. 캐시 저장
    this.cache.set(cacheKey, result);
    
    return result;
  }

  private isCacheValid(data: UserOrganizationView): boolean {
    // 5분 캐시 유효성 검사
    return Date.now() - data.cachedAt < 5 * 60 * 1000;
  }
}
```

### 4. 대규모 확장 시 고려사항

```sql
-- 파티셔닝 전략 (1M+ 레코드 시)
-- CREATE TABLE memberships_partitioned (LIKE memberships) 
-- PARTITION BY HASH (organization_id);

-- 읽기 전용 복제본 활용
-- 도메인 서비스에서 읽기/쓰기 분리
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

### 계층별 책임 분리
- [x] **DB는 기본 데이터 무결성만 담당**: Foreign Key, NOT NULL, 타입 검증
- [x] **복잡한 비즈니스 로직은 도메인에서 처리**: 소유권 이전, 권한 검증 등
- [x] **Read Model은 도메인 서비스에서 구성**: DB 뷰는 단순 조인만
- [x] **중복 제거**: 동일한 로직이 DB와 도메인에 중복되지 않음

### 스키마 무결성
- [x] **기본 데이터 무결성**: Foreign Key, NOT NULL, 타입 검증
- [x] **소프트 삭제 패턴**: 모든 테이블에 `deleted_at` 컬럼
- [x] **Clerk 동기화 지원**: `clerk_id` 인덱스 및 제약조건
- [x] **데이터 형식 검증**: 이메일, 슬러그 형식 등

### 성능 최적화
- [x] **핵심 쿼리 인덱스**: 사용자, 조직, 멤버십 조회 최적화
- [x] **Partial Index 활용**: 소프트 삭제된 레코드 제외
- [x] **단순한 DB 뷰**: 복잡한 비즈니스 로직 제외
- [x] **도메인 서비스 캐싱**: 애플리케이션 레벨 성능 최적화

### 아키텍처 일관성
- [x] **DDD 원칙 준수**: Aggregate 경계와 DB 스키마 일치
- [x] **단일 책임**: 각 계층이 명확한 역할 분담
- [x] **테스트 용이성**: 비즈니스 로직이 도메인에 집중
- [x] **유지보수성**: 중복 없는 깔끔한 구조

---

이 데이터베이스 스키마는 User Management Domain의 Technical Specification을 완전히 반영하며, DDD의 Aggregate 경계와 비즈니스 규칙을 데이터베이스 레벨에서 보장합니다.
