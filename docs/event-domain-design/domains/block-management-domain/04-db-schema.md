# Database Schema: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + 주니어개발자  
**작성일**: 2025-10-19  
**버전**: v1.0

**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: 실제 마이그레이션 및 구현

---

> **작성 시점**: Software Design 완료 후, Canvas Management Domain 연동 준비  
> **목적**: Block Aggregate를 데이터베이스 스키마로 전환, Canvas Management와의 직접 DB JOIN 지원

**기반 문서**: [Software Design](./03-software-design.md)

---

### 주요 변경사항 (v1.0)
- **초기 스키마 설계**: Block Aggregate를 단일 blocks 테이블로 매핑
- **워크스페이스 격리**: workspace_id 필드 추가 및 RLS 정책 적용
- **Canvas 연동**: 메타데이터 필드 추가로 확장성 확보

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 범위**: 블록 생성, 수정, 삭제 기본 CRUD 시나리오 지원
2. **DDD Aggregate 경계 반영**: Block Aggregate의 불변식을 DB 제약조건으로 구현
3. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리, DB는 단순 저장소 역할
4. **Canvas 연동**: Canvas Management Domain이 직접 JOIN으로 조회할 수 있는 구조
5. **성능 최적화**: 워크스페이스별 조회 패턴에 맞춘 인덱스 설계
6. **워크스페이스 격리**: RLS 정책을 통한 워크스페이스별 데이터 접근 제어
7. **소프트 삭제**: deleted_at으로 데이터 보존 및 Canvas 호환성 확보

### 테이블 관계도
```
┌─────────────────────────┐
│     Workspace           │
│  (외부 도메인)           │
│  • id (PK)              │
│  • name                 │
└──────────┬──────────────┘
           │ 1:N
           ▼
┌─────────────────────────┐
│       blocks            │
│                         │
│ • id (PK)               │
│ • workspace_id (FK)     │
│ • block_type            │
│ • title                 │
│ • content               │
│ • metadata              │
│ • created_at            │
│ • updated_at            │
│ • deleted_at            │
└─────────────────────────┘
           │ 1:N
           ▼
┌─────────────────────────┐
│    block_mounts         │
│  (Canvas Domain)        │
│  • id (PK)              │
│  • block_id (FK)        │
│  • page_id              │
│  • position_x           │
│  • position_y           │
└─────────────────────────┘
```

---

## 📋 Table Definitions

### 1. block_type enum (public schema)

블록 타입을 정의하는 enum - 지원되는 블록 종류를 제한

```sql
-- block_type enum 정의
CREATE TYPE block_type_enum AS ENUM (
    'text',         -- 텍스트 블록
    'image',        -- 이미지 블록
    'code',         -- 코드 블록
    'page',         -- 페이지 블록
    'shape',        -- 도형 블록
    'todo'          -- 할일 목록 블록
);

-- Comments
COMMENT ON TYPE block_type_enum IS 'Block Management Domain - 지원되는 블록 타입';
COMMENT ON ENUM VALUE block_type_enum.text IS '텍스트 콘텐츠 블록';
COMMENT ON ENUM VALUE block_type_enum.image IS '이미지 콘텐츠 블록';
COMMENT ON ENUM VALUE block_type_enum.code IS '코드 콘텐츠 블록';
COMMENT ON ENUM VALUE block_type_enum.page IS '페이지 블록 (네스티드 페이지)';
COMMENT ON ENUM VALUE block_type_enum.shape IS '도형 블록 (기하학적 도형)';
COMMENT ON ENUM VALUE block_type_enum.todo IS '할일 목록 블록';
```

---

### 2. blocks 테이블 (public schema)

Block Aggregate의 핵심 테이블 - 재사용 가능한 블록 정보 저장

```sql
CREATE TABLE blocks (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Workspace Isolation
    workspace_id UUID NOT NULL, -- 워크스페이스 ID (RLS 정책용)
    
    -- Block Content Fields
    block_type block_type_enum NOT NULL DEFAULT 'text',
    metadata JSONB DEFAULT '{}', -- 블록 타입별 확장 속성
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- 소프트 삭제
    
    -- Constraints
    CONSTRAINT blocks_metadata_valid CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object'),
    CONSTRAINT blocks_not_deleted_and_updated CHECK (deleted_at IS NULL OR updated_at <= deleted_at)
);
```

**Performance Indexes**:
```sql
-- Canvas JOIN 최적화를 위한 핵심 인덱스
CREATE INDEX idx_blocks_workspace_active ON blocks(workspace_id, block_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_workspace_created ON blocks(workspace_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_deleted_at ON blocks(deleted_at) WHERE deleted_at IS NULL;

-- 블록 타입별 조회 최적화 (Canvas 렌더링용)
CREATE INDEX idx_blocks_type_active ON blocks(block_type) WHERE deleted_at IS NULL;

-- 메타데이터 조회 최적화 (GIN 인덱스)
CREATE INDEX idx_blocks_metadata_gin ON blocks USING GIN (metadata) WHERE deleted_at IS NULL;
```

**RLS Policy Setup**:
```sql
-- RLS 활성화
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- 워크스페이스 멤버만 접근 가능
CREATE POLICY "Enable read access for workspace members" ON blocks
    FOR SELECT TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Enable insert for workspace members" ON blocks
    FOR INSERT TO authenticated
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Enable update for workspace members" ON blocks
    FOR UPDATE TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Enable delete for workspace members" ON blocks
    FOR DELETE TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = (SELECT auth.uid())
        )
    );
```

**Comments**:
```sql
COMMENT ON TABLE blocks IS 'Block Management Domain - 재사용 가능한 블록 정보 저장';
COMMENT ON COLUMN blocks.id IS '블록 고유 식별자 (UUID)';
COMMENT ON COLUMN blocks.workspace_id IS '워크스페이스 ID (RLS 정책으로 격리)';
COMMENT ON COLUMN blocks.block_type IS '블록 타입 (text, image, code, page, shape, todo)';
COMMENT ON COLUMN blocks.metadata IS '블록 타입별 확장 속성 (JSONB)';
COMMENT ON COLUMN blocks.created_at IS '생성 시각';
COMMENT ON COLUMN blocks.updated_at IS '수정 시각';
COMMENT ON COLUMN blocks.deleted_at IS '삭제 시각 (소프트 삭제)';
```

> **💡 설계 노트**  
> - **워크스페이스 격리**: workspace_id를 통해 RLS 정책으로 자동 필터링
> - **Canvas 연동**: Canvas에서 직접 JOIN으로 조회 가능한 구조
> - **메타데이터 확장성**: JSONB로 블록 타입별 속성 확장 지원
> - **성능 최적화**: deleted_at 조건부 인덱스로 조회 성능 향상

---

## 🔒 Row Level Security (RLS) Policies

### 1. RLS 전략: Workspace-based Isolation

**핵심 원칙**:
- ✅ **RLS**: 워크스페이스 멤버십 기반 접근 제어
- ✅ **Application**: 복잡한 권한 로직은 도메인 서비스에서 처리
- ✅ **adminDb**: 워크스페이스 관리자 권한 확인 후 사용

**참고**: Canvas Management Domain과 동일한 workspace_members 테이블 참조

### 2. Application-level 권한 체크 연계

```typescript
// BlockRepository.getBlocksInWorkspace()
// Step 1: Application-level 권한 체크 - 워크스페이스 멤버십 확인
const isMember = await workspaceMemberRepo.isMember(workspaceId, userId);
if (!isMember) {
  return Result.err('NOT_WORKSPACE_MEMBER');
}

// Step 2: RLS로 자동 필터링된 조회
const blocks = await db.select().from(blocksTable)
  .where(and(
    eq(blocksTable.workspaceId, workspaceId),
    isNull(blocksTable.deletedAt)
  ));

return Result.ok(blocks);
```

**RLS 전략 설명**:
- **SELECT**: 워크스페이스 멤버만 접근 가능
- **INSERT/UPDATE/DELETE**: 워크스페이스 멤버만 변경 가능
- **특별한 케이스**: Canvas에서 직접 JOIN 시에도 RLS 자동 적용

---

## 💼 비즈니스 로직 처리 방침

### SSOT(Single Source of Truth) 원칙
- **비즈니스 로직**: Block Aggregate에서 블록 타입 검증, 메타데이터 스키마 검증
- **데이터베이스**: 데이터 저장 및 기본 제약조건만 처리
- **PostgreSQL 함수**: 사용하지 않음 (유지보수성 및 테스트 용이성을 위해)

### Layered Security Model

**1️⃣ RLS Layer (Defense in Depth)**
- 역할: 워크스페이스 멤버십 기반 기본 접근 제어
- 정책: workspace_members 테이블 기반 자동 필터링
- 장점: SQL 레벨에서 보안 강화, 실수 방지

**2️⃣ Application Layer (Primary Authorization)**
- 역할: 복잡한 비즈니스 권한 로직 처리
- 구현: BlockRepository에서 권한 검증 후 조회/수정
- 예시: 블록 생성 권한, 수정 권한, 삭제 권한 세분화

**3️⃣ adminDb 사용 시점**
- 워크스페이스 관리자가 멤버십 데이터 조회 시
- 시스템 레벨 블록 통계 수집 시
- 전제 조건: 적절한 권한 검증 완료 후

---

## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략

```sql
-- Canvas JOIN 최적화 - 가장 중요한 쿼리 패턴
CREATE INDEX idx_blocks_workspace_active ON blocks(workspace_id, block_type) WHERE deleted_at IS NULL;

-- 시간순 조회 최적화
CREATE INDEX idx_blocks_workspace_created ON blocks(workspace_id, created_at DESC) WHERE deleted_at IS NULL;

-- 블록 타입별 필터링 최적화
CREATE INDEX idx_blocks_type_active ON blocks(block_type) WHERE deleted_at IS NULL;
```

### 2. 쿼리 성능 최적화

```sql
-- Canvas에서 자주 사용되는 JOIN 패턴
-- blocks JOIN block_mounts WHERE active blocks only
CREATE INDEX idx_blocks_canvas_join ON blocks(workspace_id, id) WHERE deleted_at IS NULL;

-- 메타데이터 검색 최적화 (GIN 인덱스)
CREATE INDEX idx_blocks_metadata_gin ON blocks USING GIN (metadata) WHERE deleted_at IS NULL;

-- 삭제 상태 확인 최적화
CREATE INDEX idx_blocks_deleted_status ON blocks(deleted_at) WHERE deleted_at IS NULL;
```

### 3. Canvas 조회 최적화

Canvas Management Domain에서 자주 사용될 쿼리 패턴:

```sql
-- Canvas에서 블록 정보와 함께 마운트 정보 조회
SELECT 
  b.id,
  b.block_type,
  b.metadata,
  bm.position_x,
  bm.position_y
FROM blocks b
JOIN block_mounts bm ON b.id = bm.block_id
WHERE bm.page_id = $1 
  AND b.deleted_at IS NULL 
  AND bm.deleted_at IS NULL
ORDER BY bm.position_y, bm.position_x;
```

**최적화 포인트**:
- `idx_blocks_workspace_active`: 워크스페이스별 활성 블록 필터링
- `deleted_at IS NULL` 조건부 인덱스로 삭제된 블록 자동 제외

---

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. 소프트 삭제된 블록 확인 (30일 이상)
SELECT 'Soft deleted blocks (30+ days)' as issue, COUNT(*) as count
FROM blocks
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';

-- 2. 고아 블록 확인 (워크스페이스가 없는 블록)
SELECT 'Orphan blocks' as issue, COUNT(*) as count
FROM blocks b
LEFT JOIN workspaces w ON b.workspace_id = w.id
WHERE w.id IS NULL AND b.deleted_at IS NULL;

-- 3. 메타데이터 스키마 검증 (JSON 스키마 오류 확인)
SELECT 'Invalid metadata' as issue, COUNT(*) as count
FROM blocks
WHERE metadata IS NOT NULL 
  AND NOT (metadata ? 'schema_version' OR jsonb_typeof(metadata) = 'object')
  AND deleted_at IS NULL;
```

### 2. 성능 모니터링

```sql
-- 느린 블록 조회 쿼리 식별
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%blocks%'
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
WHERE tablename = 'blocks'
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- 인덱스 사용률 확인
SELECT 
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'blocks'
ORDER BY idx_scan DESC;
```

---

## 🧹 데이터 정리 및 보관 정책

### 1. 소프트 삭제된 데이터 정리

```sql
-- 90일 경과한 삭제 블록 영구 삭제
-- 주의: 이 작업은 별도 배치 작업으로 실행해야 함
DELETE FROM blocks
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '90 days';
```

### 2. Canvas 연동 무결성 확인

```sql
-- Canvas에 마운트되었지만 삭제된 블록 확인
SELECT b.id, b.title, b.deleted_at, COUNT(bm.id) as mount_count
FROM blocks b
JOIN block_mounts bm ON b.id = bm.block_id
WHERE b.deleted_at IS NOT NULL 
  AND bm.deleted_at IS NULL
GROUP BY b.id, b.title, b.deleted_at
ORDER BY mount_count DESC;
```

---

## ✅ 검증 체크리스트

### Scenario 지원
- [x] **블록 생성**: workspace_id, block_type, metadata 저장 가능
- [x] **블록 수정**: block_type, metadata 수정 가능 (삭제된 블록 제외)
- [x] **블록 삭제**: deleted_at 타임스탬프 설정으로 소프트 삭제
- [x] **Canvas 연동**: JOIN을 통한 블록 정보 조회 지원

### 데이터 무결성
- [x] **Primary Key**: UUID로 고유성 보장
- [x] **워크스페이스 참조**: workspace_id 필수 (RLS 정책)
- [x] **블록 타입**: enum으로 제한된 타입만 허용
- [x] **메타데이터 검증**: JSONB 타입 및 구조 검증
- [x] **소프트 삭제**: deleted_at 조건으로 업데이트 시간 검증
- [x] **RLS 보안**: 워크스페이스 멤버십 기반 접근 제어

### 성능 최적화
- [x] **워크스페이스 인덱스**: workspace_id 기반 조회 최적화
- [x] **활성 블록 필터링**: deleted_at IS NULL 조건부 인덱스
- [x] **타입별 조회**: block_type 인덱스로 타입별 필터링 최적화
- [x] **Canvas JOIN**: 복합 인덱스로 JOIN 성능 향상
- [x] **메타데이터 검색**: GIN 인덱스로 JSONB 검색 최적화

### 아키텍처 일관성
- [x] **DDD 원칙**: Block Aggregate를 단일 테이블로 매핑
- [x] **단일 책임**: 블록 정보 저장에만 집중
- [x] **확장성**: metadata JSONB로 블록 타입별 확장 가능
- [x] **타입 안전성**: enum과 제약조건으로 타입 안전성 확보
- [x] **Canvas 연동**: 직접 JOIN 구조로 단순하고 효율적인 연동

---

## 🔗 도메인 간 통합

### Canvas Management Domain과의 통합
- **blocks.id**: block_mounts.block_id와 1:N 관계
- **워크스페이스 격리**: 동일한 workspace_members 테이블로 RLS 정책 공유
- **소프트 삭제**: deleted_at IS NULL 조건으로 일관된 필터링

### Workspace Management Domain과의 통합
- **blocks.workspace_id**: workspaces.id와 N:1 관계
- **RLS 정책**: workspace_members 테이블 기반 자동 접근 제어

---

## 📚 References

### 관련 문서
- [Software Design](./03-software-design.md) - Block Aggregate 정의 및 비즈니스 로직
- [Process Model](./02-process-model.md) - 블록 CRUD 시나리오 상세 프로세스
- [Event Storming](./01-event-storm.md) - 블록 도메인 이벤트 및 명령
- [Canvas Management DB Schema](../canvas-management-domain/04-db-schema.md) - 연동 구조 참조

### 외부 참조
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

이 데이터베이스 스키마는 Block Management Domain의 기본 CRUD 시나리오를 완전히 지원하며, Canvas Management Domain과의 효율적인 연동을 제공합니다. 워크스페이스 기반 격리와 성능 최적화를 모두 고려한 설계로 확장 가능하고 유지보수하기 쉬운 구조를 제공합니다.
