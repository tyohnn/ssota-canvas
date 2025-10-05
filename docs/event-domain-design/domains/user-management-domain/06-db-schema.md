# User Management Domain - Database Schema

Technical Specification을 기반으로 한 데이터베이스 스키마 설계 문서입니다.

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**수정일**: 2025-09-29
**버전**: 2.1  
**기반 문서**: [Technical Specification](./technical-specification.md)

### 주요 변경사항 (v2.1)
- 조직 ID에 `org_` 접두사 자동 적용 (TEXT 타입으로 변경)
- RLS 정책 개선: 공개 프로필 뷰 추가로 이메일 초대 시 미리보기 지원
- 향후 멤버십 확장을 위한 RLS 정책 주석 추가
- **SSOT 원칙 적용**: PostgreSQL 함수 제거, 모든 비즈니스 로직을 애플리케이션 코드로 이동
- 이벤트 기반 비즈니스 로직 처리 가이드 추가
- View 정의 및 Drizzle ORM 완전 통합 방법 상세 설명

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 0-1 범위**: 유저 가입, 기본 조직 생성, 조직 조회만 지원
2. **Supabase Auth 통합**: `auth.users`와 `public.profiles` 분리 설계
1. **DDD Aggregate 경계 반영**: 각 Aggregate의 불변식을 DB 제약조건으로 구현
3. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리
4. **MECE 구조**: 누락 없이, 중복 없이 명확한 경계
3. **소프트 삭제 패턴**: 30일 보관 정책을 위한 `deleted_at` 컬럼
4. **성능 최적화**: Read Model 쿼리 패턴에 맞춘 인덱스 설계

### 테이블 관계도 (Scenario 0-1)
```
┌─────────────────┐       ┌─────────────────┐
│   auth.users    │       │ public.profiles │
│  (Supabase)     │       │                 │
│                 │       │ • id (FK)       │
│ • id (PK)       │◄──────┤ • name          │
│ • email         │       │ • avatar_url    │
│ • created_at    │       │ • created_at    │
└─────────────────┘       │ • updated_at    │
                          └─────────────────┘
                                   │
                                   │ 1:1
                                   ▼
                          ┌─────────────────┐
                          │ organizations   │
                          │                 │
                          │ • id (PK)       │
                          │ • name          │
                          │ • owner_id (FK) │
                          │ • is_default    │
                          │ • created_at    │
                          │ • updated_at    │
                          └─────────────────┘
```

---

## 📋 Table Definitions

### 1. profiles 테이블 (public schema)

사용자 추가 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE profiles (
    -- Primary Key (Supabase Auth ID와 1:1 매핑)
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- User Information
    name TEXT,
    email TEXT,
    avatar_url TEXT,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT profiles_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes for Performance
CREATE INDEX idx_profiles_name ON profiles(name) WHERE name IS NOT NULL;

-- Comments
COMMENT ON TABLE profiles IS 'User Management Domain - 유저 프로필 정보 (auth.users 확장)';
COMMENT ON COLUMN profiles.id IS 'Supabase Auth 유저 ID (auth.users.id와 1:1)';
COMMENT ON COLUMN profiles.name IS '유저 표시명';
COMMENT ON COLUMN profiles.email IS '유저 대표 이메일';
COMMENT ON COLUMN profiles.avatar_url IS '프로필 이미지 URL';
```

### 2. organizations 테이블 (public schema)

조직 정보를 저장하는 테이블입니다. (Scenario 0-1: 기본 조직 생성만)

```sql
CREATE TABLE organizations (
    -- Primary Key (org_ 접두사 포함)
    id TEXT PRIMARY KEY DEFAULT ('org_' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    
    -- Organization Information
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT organizations_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT organizations_unique_default_per_owner UNIQUE (owner_id, is_default) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for Performance
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_is_default ON organizations(is_default) WHERE is_default = TRUE;

-- Comments
COMMENT ON TABLE organizations IS 'User Management Domain - 조직 정보';
COMMENT ON COLUMN organizations.id IS '조직 ID (org_ 접두사 포함)';
COMMENT ON COLUMN organizations.name IS '조직 이름';
COMMENT ON COLUMN organizations.owner_id IS '조직 소유자 ID (profiles.id)';
COMMENT ON COLUMN organizations.is_default IS '기본 조직 여부 (사용자당 1개)';
```

---

## 🔒 Row Level Security (RLS) Policies

### 1. RLS 활성화

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
```

### 2. Profiles 테이블 RLS 정책

```sql
-- 자신의 모든 프로필 정보 조회/수정 가능
CREATE POLICY "profiles_select_own_full" ON profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 공개 프로필 정보 뷰 (이메일 초대 시 미리보기용)
CREATE VIEW public_profiles AS
SELECT 
    id,
    name,
    avatar_url,
    created_at
FROM profiles;

-- 공개 프로필 뷰 RLS (모든 인증 사용자가 조회 가능)
ALTER VIEW public_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_profiles_select" ON public_profiles
    FOR SELECT TO authenticated
    USING (true);
```

### 3. Organizations 테이블 RLS 정책

```sql
-- Scenario 0-1: 사용자는 자신이 소유한 조직만 조회/수정 가능
-- 향후 멤버십 기능 추가 시 organization_members 테이블과 조인 필요
CREATE POLICY "organizations_select_accessible" ON organizations
    FOR SELECT TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "organizations_insert_own" ON organizations
    FOR INSERT TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "organizations_update_own" ON organizations
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- 향후 멤버십 확장 시 사용할 정책 (주석 처리)
-- CREATE POLICY "organizations_select_member_accessible" ON organizations
--     FOR SELECT TO authenticated
--     USING (
--         owner_id = auth.uid() OR 
--         id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid()
--         )
--     );
```

---

## 💼 비즈니스 로직 처리 방침

### SSOT(Single Source of Truth) 원칙
- **비즈니스 로직**: 애플리케이션 서버 코드에서 관리 (TypeScript/Node.js)
- **데이터베이스**: 단순한 데이터 저장소 역할 + 기본 제약조건만
- **PostgreSQL 함수**: 사용하지 않음 (유지보수성 및 테스트 용이성을 위해)

---

## 📊 Read Model Views

### 1. UserOrganizationView 지원 뷰 (Drizzle 통합 권장)

```sql
-- 사용자 조직 정보 조인 뷰 (Scenario 1용)
-- Drizzle ORM에서 타입 안전성을 위해 뷰 정의
CREATE OR REPLACE VIEW user_organization_view AS
SELECT 
    p.id as user_id,
    p.name as user_name,
    p.avatar_url as user_avatar_url,
    o.id as organization_id,
    o.name as organization_name,
    o.is_default,
    o.created_at as organization_created_at
FROM profiles p
LEFT JOIN organizations o ON p.id = o.owner_id;

-- RLS 정책 적용 (사용자는 자신의 데이터만 조회)
ALTER VIEW user_organization_view ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_organization_view_select" ON user_organization_view
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Comments
COMMENT ON VIEW user_organization_view IS '사용자 조직 정보 조인 뷰 (Drizzle ORM 연동)';
```

### 2. UserProfileView 지원 뷰

```sql
-- 사용자 프로필 정보 조인 뷰 (기본 조직 포함)
CREATE OR REPLACE VIEW user_profile_view AS
SELECT 
    p.id as user_id,
    au.email as user_email,
    p.name as user_name,
    p.avatar_url as user_avatar_url,
    au.created_at as user_created_at,
    au.last_sign_in_at as last_login_at,
    -- 기본 조직 정보
    default_org.id as default_organization_id,
    default_org.name as default_organization_name
FROM profiles p
JOIN auth.users au ON p.id = au.id
LEFT JOIN organizations default_org ON p.id = default_org.owner_id AND default_org.is_default = TRUE;

-- RLS 정책 적용
CREATE POLICY "user_profile_view_select" ON user_profile_view
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Comments
COMMENT ON VIEW user_profile_view IS '사용자 프로필 정보 조인 뷰 (기본 조직 포함)';
```

---

## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략 (Scenario 0-1)

```sql
-- 사용자 조회 최적화
CREATE INDEX idx_profiles_id_name ON profiles(id, name);

-- 조직 조회 최적화 (소유자별)
CREATE INDEX idx_organizations_owner_default ON organizations(owner_id, is_default);

-- 기본 조직 조회 최적화
CREATE INDEX idx_organizations_default_true ON organizations(is_default) WHERE is_default = TRUE;
```

### 2. 쿼리 성능 최적화

```sql
-- 자주 사용되는 조인 최적화
CREATE INDEX idx_organizations_owner_created ON organizations(owner_id, created_at DESC);
```

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. 프로필 없는 사용자 확인
SELECT 'Users without profiles' as issue, COUNT(*) as count
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 2. 기본 조직 없는 사용자 확인
SELECT 'Users without default org' as issue, COUNT(*) as count
FROM profiles p
LEFT JOIN organizations o ON p.id = o.owner_id AND o.is_default = TRUE
WHERE o.id IS NULL;

-- 3. 중복 기본 조직 확인
SELECT 'Users with multiple default orgs' as issue, COUNT(*) as count
FROM (
    SELECT owner_id, COUNT(*) as default_count
    FROM organizations
    WHERE is_default = TRUE
    GROUP BY owner_id
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
WHERE query LIKE '%profiles%' OR query LIKE '%organizations%'
ORDER BY total_time DESC
LIMIT 5;
```

---

## ✅ 검증 체크리스트

### Scenario 0-1 지원
- [x] **유저 가입**: `auth.users` + `profiles` 테이블로 구글 OAuth 사용자 생성
- [x] **기본 조직 생성**: `create_default_organization` 함수로 자동 생성
- [x] **조직 조회**: `get_user_organizations` 함수로 소유 조직 목록 조회
- [x] **초기 조직 선택**: 프론트엔드에서 기본 조직 자동 선택

### 데이터 무결성
- [x] **1:1 매핑**: `profiles.id` = `auth.users.id`
- [x] **기본 조직 제약**: 사용자당 1개 기본 조직만 허용
- [x] **소유권 제약**: 조직은 반드시 1명의 소유자 필요
- [x] **RLS 보안**: 사용자는 자신의 데이터만 접근 가능

### 성능 최적화
- [x] **핵심 인덱스**: 사용자별 조직 조회 최적화
- [x] **단순한 뷰**: 복잡한 비즈니스 로직 제외
- [x] **함수 활용**: 자주 사용되는 쿼리 패턴 함수화

### 아키텍처 일관성
- [x] **DDD 원칙**: Aggregate 경계와 DB 스키마 일치
- [x] **단일 책임**: 각 테이블이 명확한 역할
- [x] **확장성**: 향후 Scenario 2+ 확장 가능한 구조

---

## 📚 References

### 관련 문서
- [Software Design](./software-design.md) - Aggregate 정의 및 Read Model
- [Process Model](./process-model.md) - Scenario 0-1 상세 프로세스
- [Event Storming](./event-storm.md) - 도메인 이벤트 및 명령

---

이 데이터베이스 스키마는 User Management Domain의 Scenario 0-1을 완전히 지원하며, Supabase Auth와의 통합을 통해 단순하면서도 확장 가능한 구조를 제공합니다.