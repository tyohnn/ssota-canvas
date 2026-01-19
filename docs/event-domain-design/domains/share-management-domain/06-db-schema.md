# Database Schema: Share Management Domain

## 🎯 개요

**도메인**: Share Management  
**작성자**: 백엔드개발자 + DBA  
**작성일**: 2026-01-02  
**버전**: v1.0

**Technical Specification 참조**: `04-technical-specification.md`  
**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: 실제 마이그레이션 및 구현

---

> **작성 시점**: Technical Specification 완료 후, 실제 마이그레이션 작성 전  
> **목적**: DDD Aggregate를 데이터베이스 스키마로 전환, 성능 최적화 및 RLS 정책 정의

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 범위**: Scenario 1~3 (게시/접속/복제)
2. **DDD Aggregate 경계 반영**: PublishedPage, CopyWorkflow Aggregate 중심 설계
3. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리
4. **MECE 구조**: 누락 없이, 중복 없이 명확한 경계
5. **성능 최적화**: publish_token 조회/복제 플로우 기준 인덱스 설계
6. **타입 안전성**: Drizzle ORM을 통한 타입 안전성 확보
7. **권한 기반 접근**: RLS 정책을 통한 데이터 접근 제어
8. **확장성**: 향후 unpublish/링크 만료를 고려한 필드 추가 여지

### 테이블 관계도
```
PublishedPage (1) ── (N) CopyWorkflow
   │ page_id                │ publish_token
```

---

## 📋 Table Definitions

### 0. 확장

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

### 1. published_pages 테이블 (public schema)

게시된 페이지의 상태 및 링크 정보를 저장합니다.

```sql
CREATE TABLE published_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL,
    owner_id UUID NOT NULL,
    publish_token TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snapshot_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT published_pages_publish_token_unique UNIQUE (publish_token),
    CONSTRAINT published_pages_status_check CHECK (status IN ('published'))
);

CREATE INDEX idx_published_pages_page_id ON published_pages(page_id);
CREATE INDEX idx_published_pages_owner_id ON published_pages(owner_id);

COMMENT ON TABLE published_pages IS 'Share Management - published pages';
COMMENT ON COLUMN published_pages.publish_token IS 'Base64(UUID) token, /p/[token]';
COMMENT ON COLUMN published_pages.status IS '향후 unpublish/expired 확장을 고려한 필드';
COMMENT ON COLUMN published_pages.snapshot_version IS '게시 시점 페이지 스냅샷 식별자 (Page Domain snapshot id 또는 version string)';
```

---

### 2. copy_workflows 테이블 (public schema)

복제 플로우 상태를 저장합니다.

```sql
CREATE TABLE copy_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publish_token TEXT NOT NULL,
    requester_id UUID,
    status TEXT NOT NULL,
    target_workspace_id UUID,
    failure_reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CONSTRAINT copy_workflows_status_check CHECK (
      status IN ('pending','waiting_login','selecting_workspace','copying','completed','failed')
    ),
    CONSTRAINT copy_workflows_completed_at_check CHECK (
      (status IN ('completed','failed') AND completed_at IS NOT NULL)
      OR
      (status NOT IN ('completed','failed') AND completed_at IS NULL)
    )
    -- 상태 확장 시 completed_at_check 수정 필요
);

CREATE INDEX idx_copy_workflows_publish_token ON copy_workflows(publish_token);
CREATE INDEX idx_copy_workflows_requester_id ON copy_workflows(requester_id);
CREATE INDEX idx_copy_workflows_status ON copy_workflows(status);

COMMENT ON TABLE copy_workflows IS 'Share Management - copy workflow states';
```

---

## 🔒 Row Level Security (RLS) Policies

### RLS 전략
- **RLS**: 기본 접근 제어 (요청자 단위 조회/수정)
- **Application**: 소유권/권한 검증은 도메인에서 수행
- **Supabase service_role**: 서버 전용 키로 통계/관리 목적 조회

### RLS 활성화

```sql
ALTER TABLE published_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_workflows ENABLE ROW LEVEL SECURITY;
```

### published_pages 정책

```sql
CREATE POLICY "published_pages_read" ON published_pages
  FOR SELECT TO anon, authenticated
  USING (true); -- 게시 페이지는 비회원 포함 누구나 조회 가능

CREATE POLICY "published_pages_write" ON published_pages
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
```

**운영 보안 메모**:
- publish_token은 충분히 랜덤하며, 추가적인 rate limit/abuse 방지는 애플리케이션 레벨에서 수행한다
- published_pages의 UPDATE/DELETE는 Supabase service_role(서버 전용)로만 수행한다

### copy_workflows 정책

```sql
CREATE POLICY "copy_workflows_read" ON copy_workflows
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

CREATE POLICY "copy_workflows_write" ON copy_workflows
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "copy_workflows_update" ON copy_workflows
  FOR UPDATE TO authenticated
  USING (requester_id = auth.uid());
```

**운영 보안 메모**:
- requester_id가 NULL인 workflow는 server(service_role)만 상태 전이를 수행한다

---

## 💼 비즈니스 로직 처리 방침

- **비즈니스 로직**: 애플리케이션 서버에서 관리
- **DB**: 단순 저장 + 제약조건만 유지
- **PostgreSQL 함수**: 사용하지 않음
- **publish_token 검증**: 형식 검증은 도메인 계층에서 수행
- **FK 미사용 이유**: 게시 페이지 삭제 이후에도 복제 이력 보존을 위해 publish_token FK 미사용
- **copy_workflows.publish_token 유효성**: PublishedPage 조회 성공 이후에만 생성되며, DB 레벨 검증은 의도적으로 두지 않는다
- **비회원 워크플로우**: requester_id가 NULL인 복제 플로우는 서버에서만 관리

---

## 🚀 Performance Optimization

### 핵심 인덱스 전략

```sql
-- publish_token 기반 조회
CREATE INDEX idx_published_pages_publish_token ON published_pages(publish_token);

-- 복제 플로우 검색
CREATE INDEX idx_copy_workflows_publish_token ON copy_workflows(publish_token);
CREATE INDEX idx_copy_workflows_status ON copy_workflows(status);
```

---

*이 문서는 Share Management Domain의 DB 스키마 정의입니다.*
