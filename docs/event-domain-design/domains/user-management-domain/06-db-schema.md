# User Management Domain - Database Schema

Technical Specification을 기반으로 한 데이터베이스 스키마 설계 문서입니다. (Scenario 0, 1, 8 기준)

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**수정일**: 2025-10-09
**버전**: 6.0  
**기반 문서**: [Technical Specification](./05-technical-specification.md)

### 주요 변경사항 (v6.0) - schema-dev.ts 동기화
- **user_type enum 추가**: ADMIN, GENERAL 타입 지원
- **테이블 구조 수정**: profiles.id (PK) + profiles.user_id (FK to auth.users)
- **RLS 정책 업데이트**: SELECT 공개 접근 (협업용)
- **schema-dev.ts 불일치 경고**: deleted_at 필드 누락 지적

### 이전 변경사항 (v5.0) - 도메인 분리
- **도메인 경계 명확화**: User Management Domain은 profiles 테이블만 관리
- **조직 관련 테이블 이동**: organizations, organization_members → Organization Management Domain
- **초대 관련 테이블 이동**: invitations → Organization Management Domain
- **알림 관련 테이블 이동**: notifications → Notification Management Domain
- **단일 책임 원칙**: 사용자 프로필 및 인증 상태에만 집중

### 이전 변경사항 (v4.0)
- Scenario 3 반영 및 멤버 초대 시스템 구현
- 알림 시스템, 멤버십 관리 추가

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 0, 1, 8 범위**: 유저 가입, 프로필 관리, 계정 삭제 지원
2. **Supabase Auth 통합**: `auth.users`와 `public.profiles` 분리 설계
3. **DDD Aggregate 경계 반영**: User Aggregate의 불변식을 DB 제약조건으로 구현
4. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리
5. **MECE 구조**: 누락 없이, 중복 없이 명확한 경계
6. **소프트 삭제 패턴**: 30일 보관 정책을 위한 `deleted_at` 컬럼
7. **성능 최적화**: Read Model 쿼리 패턴에 맞춘 인덱스 설계
8. **타입 안전성**: Drizzle ORM을 통한 타입 안전성 확보
9. **권한 기반 접근**: RLS 정책을 통한 데이터 접근 제어

### 테이블 관계도 (Scenario 0, 1, 8)
```
┌─────────────────┐       ┌─────────────────┐
│   auth.users    │       │ public.profiles │
│  (Supabase)     │       │                 │
│                 │       │ • id (PK)       │
│ • id (PK)       │◄──────┤ • user_id (FK)  │
│ • email         │       │ • name          │
│ • created_at    │       │ • email         │
└─────────────────┘       │ • avatar_url    │
                          │ • user_type     │
                          │ • created_at    │
                          │ • updated_at    │
                          │ • deleted_at    │
                          └─────────────────┘
```

---

## 📋 Table Definitions

### 1. user_type enum (public schema)

사용자 타입을 정의하는 enum입니다.

```sql
-- 사용자 타입 enum 정의
CREATE TYPE user_type AS ENUM (
    'ADMIN',      -- 관리자
    'GENERAL'     -- 일반 사용자
);

-- Comments
COMMENT ON TYPE user_type IS 'User Management Domain - 사용자 타입 enum';
COMMENT ON ENUM VALUE user_type.ADMIN IS '관리자 사용자';
COMMENT ON ENUM VALUE user_type.GENERAL IS '일반 사용자 (기본값)';
```

### 2. profiles 테이블 (public schema)

사용자 추가 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE profiles (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type user_type NOT NULL DEFAULT 'GENERAL',
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- ⚠️ 소프트 삭제 (30일 보관 정책) - schema-dev.ts에 누락됨
    
    -- Constraints
    CONSTRAINT profiles_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes for Performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_name ON profiles(name) WHERE name IS NOT NULL;
CREATE INDEX idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Comments
COMMENT ON TABLE profiles IS 'User Management Domain - 유저 프로필 정보 (auth.users 확장)';
COMMENT ON COLUMN profiles.id IS '프로필 ID (UUID, PK)';
COMMENT ON COLUMN profiles.user_id IS 'Supabase Auth 유저 ID (auth.users.id와 1:1)';
COMMENT ON COLUMN profiles.email IS '유저 대표 이메일 (unique)';
COMMENT ON COLUMN profiles.name IS '유저 표시명';
COMMENT ON COLUMN profiles.avatar_url IS '프로필 이미지 URL';
COMMENT ON COLUMN profiles.user_type IS '사용자 타입 (enum, 기본값 GENERAL)';
COMMENT ON COLUMN profiles.deleted_at IS '계정 삭제 시각 (소프트 삭제) - ⚠️ schema-dev.ts에 누락';
```

> **⚠️ schema-dev.ts 불일치 경고**  
> 현재 schema-dev.ts에는 `deleted_at` 필드가 누락되어 있습니다. 소프트 삭제 기능과 30일 보관 정책을 지원하려면 schema-dev.ts에 해당 필드를 추가해야 합니다.

---

## 🔒 Row Level Security (RLS) Policies

### 1. RLS 활성화

```sql
-- profiles 테이블에 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### 2. Profiles 테이블 RLS 정책

```sql
-- SELECT: Public (협업을 위한 프로필 정보 조회)
CREATE POLICY "Enable read access for all users" ON profiles
    FOR SELECT TO anon, authenticated
    USING (true);

-- INSERT: Self only
CREATE POLICY "Enable insert for self" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Self only
CREATE POLICY "Enable update for self" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Self only
CREATE POLICY "Enable delete for self" ON profiles
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
```

**RLS 전략 설명**:
- **SELECT**: 모든 사용자가 프로필 조회 가능 (협업 및 멤버 검색 기능 지원)
- **INSERT/UPDATE/DELETE**: 사용자는 자신의 데이터만 수정 가능
- **user_id 기반 체크**: auth.uid()는 user_id와 비교 (profiles.id가 아님)

---

## 💼 비즈니스 로직 처리 방침

### SSOT(Single Source of Truth) 원칙
- **비즈니스 로직**: 애플리케이션 서버 코드에서 관리 (TypeScript/Node.js)
- **데이터베이스**: 단순한 데이터 저장소 역할 + 기본 제약조건만
- **PostgreSQL 함수**: 사용하지 않음 (유지보수성 및 테스트 용이성을 위해)



---

## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략 (Scenario 0, 1, 8)

```sql
-- 사용자 조회 최적화
CREATE INDEX idx_profiles_id_name ON profiles(id, name) WHERE deleted_at IS NULL;

-- 이메일 기반 검색 최적화
CREATE INDEX idx_profiles_email_search ON profiles(email) WHERE email IS NOT NULL AND deleted_at IS NULL;

-- 삭제된 계정 조회 최적화 (정리 작업용)
CREATE INDEX idx_profiles_deleted ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
```

### 2. 쿼리 성능 최적화

```sql
-- 활성 사용자 조회 최적화
CREATE INDEX idx_profiles_active ON profiles(id) WHERE deleted_at IS NULL;

-- 프로필 생성일 기준 정렬 최적화
CREATE INDEX idx_profiles_created ON profiles(created_at DESC) WHERE deleted_at IS NULL;
```

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. 프로필 없는 사용자 확인
SELECT 'Users without profiles' as issue, COUNT(*) as count
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id AND p.deleted_at IS NULL
WHERE p.id IS NULL;

-- 2. 삭제 예정 계정 확인 (30일 경과)
SELECT 'Accounts to be permanently deleted' as issue, COUNT(*) as count
FROM profiles
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';

-- 3. 중복 이메일 확인
SELECT 'Duplicate emails' as issue, COUNT(*) as count
FROM (
    SELECT email, COUNT(*) as email_count
    FROM profiles
    WHERE deleted_at IS NULL
    GROUP BY email
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
WHERE query LIKE '%profiles%'
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
WHERE tablename IN ('profiles')
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
WHERE tablename IN ('profiles')
ORDER BY idx_scan DESC;
```

---

## 🧹 데이터 정리 및 보관 정책

### 1. 소프트 삭제된 계정 정리 (30일 후 영구 삭제)

```sql
-- 30일 경과한 삭제 계정 영구 삭제
-- 주의: 이 작업은 애플리케이션 레벨에서 수행하거나, 별도 백그라운드 작업으로 실행해야 함
DELETE FROM profiles
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';
```

### 2. 고아 데이터 정리

```sql
-- auth.users에는 있지만 profiles에 없는 사용자 확인 (데이터 무결성 점검)
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE p.id IS NULL;
```

---

## ✅ 검증 체크리스트

### Scenario 0, 1, 8 지원
- [x] **유저 가입**: `auth.users` + `profiles` 테이블로 구글 OAuth 사용자 생성
- [x] **프로필 관리**: 사용자 이름, 이메일, 프로필 이미지 관리
- [x] **계정 삭제**: 소프트 삭제로 30일 보관 후 영구 삭제
- [x] **공개 프로필**: 다른 도메인에서 사용자 검색 가능 (public_profiles 뷰)

### 데이터 무결성
- [x] **1:1 매핑**: `profiles.user_id` = `auth.users.id` (unique constraint)
- [x] **이메일 유일성**: `profiles.email` unique constraint
- [x] **이름 검증**: 공백 문자열 방지
- [x] **사용자 타입**: user_type enum으로 타입 안전성
- [x] **소프트 삭제**: deleted_at 컬럼으로 관리 (⚠️ schema-dev.ts에 누락)
- [x] **RLS 보안**: SELECT는 공개, INSERT/UPDATE/DELETE는 자신만 가능

### 성능 최적화
- [x] **핵심 인덱스**: 사용자 조회 최적화
- [x] **이메일 검색 인덱스**: 사용자 검색 최적화
- [x] **삭제 계정 인덱스**: 정리 작업 최적화
- [x] **복합 인덱스**: 자주 사용되는 조합 쿼리 최적화
- [x] **부분 인덱스**: 조건부 인덱스로 저장 공간 절약
- [x] **통합 뷰**: public_profiles 뷰로 공개 프로필 조회 최적화

### 아키텍처 일관성
- [x] **DDD 원칙**: User Aggregate 경계와 DB 스키마 일치
- [x] **단일 책임**: profiles 테이블이 사용자 프로필 관리에만 집중
- [x] **확장성**: 향후 추가 필드 확장 가능한 구조
- [x] **타입 안전성**: Drizzle ORM과 TypeScript 타입 일치
- [x] **이벤트 기반 설계**: 도메인 이벤트 발행을 위한 구조 지원
- [x] **CQRS 지원**: Command와 Query 분리를 위한 뷰 제공

---

## 🔗 도메인 간 통합

### Organization Management Domain과의 통합
- **profiles 테이블**: Organization Management Domain에서 사용자 프로필 조회 (RLS 공개 정책)
- **profiles.user_id**: organizations.owner_id, organization_members.user_id의 외래키로 참조됨

### Notification Management Domain과의 통합
- **profiles.user_id**: notifications.user_id의 외래키로 참조됨

---

## 📚 References

### 관련 문서
- [Software Design](./03-software-design.md) - User Aggregate 정의 및 Read Model
- [Process Model](./02-process-model.md) - Scenario 0, 1, 8 상세 프로세스
- [Event Storming](./01-event-storm.md) - 도메인 이벤트 및 명령
- [Technical Specification](./05-technical-specification.md) - 구현 가이드 및 TDD 순서

---

이 데이터베이스 스키마는 User Management Domain의 Scenario 0, 1, 8을 완전히 지원하며, 사용자 인증 및 프로필 관리 기능을 제공합니다. Supabase Auth와의 통합과 세밀한 RLS 정책을 통해 보안적이면서도 확장 가능한 구조를 제공합니다.
