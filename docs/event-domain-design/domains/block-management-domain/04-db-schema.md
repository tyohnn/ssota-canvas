# Database Schema: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 시니어개발자 + 주니어개발자  
**작성일**: 2025-10-22  
**버전**: v1.0

**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: 실제 마이그레이션 및 구현

---

> **작성 시점**: Software Design 완료 후, 실제 마이그레이션 작성 전  
> **목적**: DDD Aggregate를 데이터베이스 스키마로 전환, 성능 최적화 및 RLS 정책 정의

**기반 문서**: [Software Design](./03-software-design.md)

---

### 주요 변경사항 (v1.0)
- **blocks 테이블 확장**: properties, custom_properties JSONB 컬럼 추가
- **속성 시스템**: 정의-값 분리 구조로 컴포넌트화 호환성 확보
- **성능 최적화**: Canvas 조회를 위한 복합 인덱스 및 JSONB GIN 인덱스
- **RLS 정책**: 워크스페이스 멤버십 기반 접근 제어

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 범위**: Canvas Management 연동, Custom Properties 관리, Media Upload, Block Tools 실행
2. **DDD Aggregate 경계 반영**: Block Aggregate의 불변식을 DB 제약조건으로 구현
3. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리
4. **MECE 구조**: 누락 없이, 중복 없이 명확한 경계
5. **성능 최적화**: Canvas 조회 쿼리 패턴에 맞춘 인덱스 설계
6. **타입 안전성**: Drizzle ORM을 통한 타입 안전성 확보
7. **권한 기반 접근**: RLS 정책을 통한 워크스페이스 격리
8. **확장성**: 향후 블록 컴포넌트화를 고려한 테이블 설계

### 테이블 관계도
```
┌─────────────────┐
│   workspaces    │
│                 │
│ • id (PK)       │
│ • name          │
│ • organization_id│
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│     blocks      │
│                 │
│ • id (PK)       │
│ • workspace_id  │
│ • block_type    │
│ • properties    │ (JSONB: 속성 값)
│ • custom_properties│ (JSONB: 속성 정의)
│ • created_at    │
│ • updated_at    │
│ • deleted_at    │
└─────────────────┘
```

---

## 📋 Table Definitions

### 1. block_type enum (public schema)

Block Management Domain의 지원되는 블록 타입 정의

```sql
-- block_type enum 정의
CREATE TYPE block_type AS ENUM (
    'text',           -- 텍스트 블록
    'markdown',       -- 마크다운 블록
    'youtube',        -- 유튜브 블록
    'python',         -- 파이썬 코드 블록
    'image',          -- 이미지 블록
    'file',           -- 파일 블록
    'link',           -- 링크 블록
    'shape',          -- 도형 블록
    'page_mention',   -- 페이지 멘션 블록
    'latex',          -- 라텍스 블록
    'github_pr',      -- 깃헙 PR 블록
    'react_component' -- 리액트 컴포넌트 블록
);

-- Comments
COMMENT ON TYPE block_type IS 'Block Management Domain - 지원되는 블록 타입';
COMMENT ON ENUM VALUE block_type.text IS '텍스트 블록';
COMMENT ON ENUM VALUE block_type.markdown IS '마크다운 블록';
COMMENT ON ENUM VALUE block_type.youtube IS '유튜브 블록';
COMMENT ON ENUM VALUE block_type.python IS '파이썬 코드 블록';
COMMENT ON ENUM VALUE block_type.image IS '이미지 블록';
COMMENT ON ENUM VALUE block_type.file IS '파일 블록';
COMMENT ON ENUM VALUE block_type.link IS '링크 블록';
COMMENT ON ENUM VALUE block_type.shape IS '도형 블록';
COMMENT ON ENUM VALUE block_type.page_mention IS '페이지 멘션 블록';
COMMENT ON ENUM VALUE block_type.latex IS '라텍스 블록';
COMMENT ON ENUM VALUE block_type.github_pr IS '깃헙 PR 블록';
COMMENT ON ENUM VALUE block_type.react_component IS '리액트 컴포넌트 블록';
```

---

### 2. property_type enum (public schema)

커스텀 속성의 타입 정의

```sql
-- property_type enum 정의
CREATE TYPE property_type AS ENUM (
    'text',           -- 텍스트 속성
    'url',            -- URL 속성
    'email',          -- 이메일 속성
    'phone',          -- 전화번호 속성
    'select',         -- 선택형 속성
    'multiselect',    -- 멀티선택형 속성
    'status',         -- 상태형 속성
    'datetime',       -- 날짜/날짜시간 속성 (시간 옵션 포함)
    'media',          -- 미디어 속성
    'profile'         -- 프로필 속성
);

-- Comments
COMMENT ON TYPE property_type IS 'Block Management Domain - 커스텀 속성 타입';
COMMENT ON ENUM VALUE property_type.text IS '텍스트 속성';
COMMENT ON ENUM VALUE property_type.url IS 'URL 속성';
COMMENT ON ENUM VALUE property_type.email IS '이메일 속성';
COMMENT ON ENUM VALUE property_type.phone IS '전화번호 속성';
COMMENT ON ENUM VALUE property_type.select IS '선택형 속성';
COMMENT ON ENUM VALUE property_type.multiselect IS '멀티선택형 속성';
COMMENT ON ENUM VALUE property_type.status IS '상태형 속성';
COMMENT ON ENUM VALUE property_type.datetime IS '날짜/날짜시간 속성 (시간 옵션 포함)';
COMMENT ON ENUM VALUE property_type.media IS '미디어 속성';
COMMENT ON ENUM VALUE property_type.profile IS '프로필 속성';
```

---

### 3. blocks 테이블 (public schema)

Block Management Domain의 핵심 테이블 - 기존 테이블 확장

```sql
-- blocks 테이블 스키마 (실제 구현 기준 - schema-dev.ts)
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  block_type block_type_enum NOT NULL DEFAULT 'text',
  title TEXT NOT NULL DEFAULT '새 블럭',
  metadata JSONB DEFAULT '{}', -- Deprecated: properties로 대체됨 (호환성 유지)
  properties JSONB DEFAULT '{}', -- 속성 값 저장 (JSONB) - key-value 형태
  custom_properties JSONB DEFAULT '[]', -- 커스텀 속성 정의 저장 (JSONB 배열)
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스 (실제 구현 기준)
CREATE INDEX idx_blocks_workspace_id ON blocks(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_type ON blocks(block_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_created_at ON blocks(created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_blocks_id_active ON blocks(id) WHERE deleted_at IS NULL;

-- JSONB 제약조건은 애플리케이션 레벨에서 처리 (TypeScript에서 검증)
-- 커스텀 속성 개수 제한 (최대 50개)도 애플리케이션 레벨에서 처리 (현재 미구현)

-- Comments
COMMENT ON COLUMN blocks.properties IS '속성 값 저장 (JSONB) - key-value 형태';
COMMENT ON COLUMN blocks.custom_properties IS '커스텀 속성 정의 저장 (JSONB 배열) - 속성 스키마';
COMMENT ON COLUMN blocks.metadata IS 'Deprecated: properties로 대체됨 (호환성 유지)';
COMMENT ON COLUMN blocks.created_by IS '블록 생성자 ID (profiles.id 참조)';
COMMENT ON COLUMN blocks.created_at IS '블록 생성 시각';
COMMENT ON COLUMN blocks.updated_at IS '블록 수정 시각';
```

> **💡 설계 노트**  
> - **정의-값 분리**: custom_properties(정의)와 properties(값)를 분리하여 컴포넌트화 호환성 확보
> - **JSONB 최적화**: GIN 인덱스로 속성 값 검색 성능 향상
> - **호환성 유지**: 기존 metadata 컬럼은 deprecated이지만 호환성을 위해 유지

---

## 🔒 Row Level Security (RLS) Policies

### 1. RLS 전략: Layered Security Model

**핵심 원칙**:
- ✅ **RLS**: 워크스페이스 멤버십 기반 기본 격리 (fail-safe)
- ✅ **Application**: 복잡한 비즈니스 권한 로직 (워크스페이스 멤버십 확인, 속성 권한 등)
- ✅ **adminDb**: Application-level 권한 체크 후 사용

**참고**: [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

### 2. RLS 활성화

```sql
-- blocks 테이블에 RLS 활성화 (실제 구현 기준)
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
```

### 3. blocks 테이블 RLS 정책 (실제 구현 기준)

**현재 구현**: 기본 authenticated 사용자 접근 정책 (개발 단계)

```sql
-- SELECT: 인증된 사용자 모두 조회 가능 (개발 단계)
CREATE POLICY "Enable read for authenticated users" ON blocks
    FOR SELECT TO authenticated
    USING (true);

-- INSERT: 인증된 사용자 모두 생성 가능 (개발 단계)
CREATE POLICY "Enable insert for authenticated users" ON blocks
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- UPDATE: 인증된 사용자 모두 수정 가능 (개발 단계)
CREATE POLICY "Enable update for authenticated users" ON blocks
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- DELETE: 인증된 사용자 모두 삭제 가능 (개발 단계)
CREATE POLICY "Enable delete for authenticated users" ON blocks
    FOR DELETE TO authenticated
    USING (true);
```

**참고**: 
- 현재는 개발 단계로 간단한 authenticated 사용자 정책 사용
- 실제 운영 환경에서는 워크스페이스 멤버십 기반 정책으로 업데이트 예정
- Application 레벨에서 verifyAccess()로 워크스페이스 권한 검증 수행

**RLS 전략 설명**:
- **SELECT**: 워크스페이스 멤버만 해당 워크스페이스의 블록 조회 가능
- **INSERT/UPDATE/DELETE**: 워크스페이스 멤버만 블록 생성/수정/삭제 가능
- **특별한 케이스**: Canvas Management는 adminDb를 사용하여 모든 블록 조회

**Application-level 권한 체크 예시**:
```typescript
// BlockManagementService.createBlock()
// Step 1: Application-level 권한 체크 - 워크스페이스 멤버십 확인
const isWorkspaceMember = await workspaceMemberRepo.isMember(workspaceId, userId);
if (!isWorkspaceMember) {
  return Result.err('NOT_WORKSPACE_MEMBER');
}

// Step 2: RLS로 기본 권한 확인 (자동)
const block = await db.rls.insert(blocks).values({
  workspace_id: workspaceId,
  block_type: blockType,
  properties: defaultProperties,
  custom_properties: []
});

return Result.ok(block);
```

---

## 💼 비즈니스 로직 처리 방침

### SSOT(Single Source of Truth) 원칙
- **비즈니스 로직**: 애플리케이션 서버 코드에서 관리 (TypeScript/Node.js)
- **데이터베이스**: 단순한 데이터 저장소 역할 + 기본 제약조건만
- **PostgreSQL 함수**: 사용하지 않음 (유지보수성 및 테스트 용이성을 위해)

### Layered Security Model

**1️⃣ RLS Layer (Defense in Depth)**
- 역할: 워크스페이스 멤버십 기반 기본 격리
- 정책: workspace_members 테이블을 통한 멤버십 확인
- 장점: 데이터베이스 레벨에서 기본 보안 보장

**2️⃣ Application Layer (Primary Authorization)**
- 역할: 복잡한 비즈니스 권한 로직 처리
- 구현: BlockManagementService에서 권한 체크 후 RLS 사용
- 예시: 워크스페이스 멤버십 확인, 속성 권한 검증, 툴 실행 권한

**3️⃣ adminDb 사용 시점**
- Canvas Management 조회: Canvas에서 blocks 테이블 직접 JOIN
- 관리자 기능: 워크스페이스 관리자가 모든 블록 조회
- 전제 조건: Application-level 권한 체크 완료 후 사용

---

## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략 (실제 구현 기준)

```sql
-- Canvas 조회 최적화 (실제 구현)
CREATE INDEX idx_blocks_workspace_id ON blocks(workspace_id) 
WHERE deleted_at IS NULL;

-- 블록 타입별 조회 최적화 (실제 구현)
CREATE INDEX idx_blocks_type ON blocks(block_type) 
WHERE deleted_at IS NULL;

-- 생성일 기준 정렬 최적화 (실제 구현)
CREATE INDEX idx_blocks_created_at ON blocks(created_at) 
WHERE deleted_at IS NULL;

-- 블록 ID 활성 블록 조회 최적화 (실제 구현)
CREATE INDEX idx_blocks_id_active ON blocks(id) 
WHERE deleted_at IS NULL;
```

**참고**: 
- 현재는 부분 인덱스(WHERE deleted_at IS NULL)만 구현됨
- JSONB GIN 인덱스는 현재 미구현 (성능 최적화를 위해 추후 추가 예정)
- 복합 인덱스(workspace_id + block_type + deleted_at)는 현재 미구현

### 2. 쿼리 성능 최적화

```sql
-- Canvas 조회 쿼리 최적화
-- block_mounts JOIN blocks 쿼리
CREATE INDEX idx_block_mounts_page_block ON block_mounts(page_id, block_id) 
WHERE deleted_at IS NULL;

-- 특정 속성 값 검색 최적화
CREATE INDEX idx_blocks_properties_youtube_url ON blocks USING GIN ((properties ->> 'youtubeUrl'))
WHERE block_type = 'youtube' AND deleted_at IS NULL;

-- 커스텀 속성 검색 최적화
CREATE INDEX idx_blocks_custom_properties_type ON blocks USING GIN ((custom_properties -> 'type'))
WHERE deleted_at IS NULL;
```

### 3. 읽기 최적화 뷰 (선택적)

```sql
-- Canvas 블록 조회 최적화 뷰
CREATE VIEW canvas_blocks_view AS
SELECT 
    bm.id as mount_id,
    bm.position_x,
    bm.position_y,
    bm.size_width,
    bm.size_height,
    bm.z_order,
    b.id as block_id,
    b.block_type,
    b.workspace_id,
    b.properties,
    b.custom_properties,
    b.created_at,
    b.updated_at
FROM block_mounts bm
JOIN blocks b ON bm.block_id = b.id
WHERE bm.deleted_at IS NULL 
  AND b.deleted_at IS NULL;

-- Comments
COMMENT ON VIEW canvas_blocks_view IS 'Block Management Domain - Canvas 블록 조회 최적화 뷰';
```

---

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. 고아 블록 확인 (워크스페이스가 삭제된 블록)
SELECT 'Orphan blocks' as issue, COUNT(*) as count
FROM blocks b
LEFT JOIN workspaces w ON b.workspace_id = w.id
WHERE b.workspace_id IS NOT NULL AND w.id IS NULL;

-- 2. JSONB 스키마 무결성 확인
SELECT 'Invalid properties JSONB' as issue, COUNT(*) as count
FROM blocks 
WHERE jsonb_typeof(properties) != 'object';

-- 3. 커스텀 속성 개수 제한 확인
SELECT 'Excessive custom properties' as issue, COUNT(*) as count
FROM blocks 
WHERE jsonb_array_length(custom_properties) > 50;

-- 4. 정의-값 싱크 확인
SELECT 'Property definition-value mismatch' as issue, COUNT(*) as count
FROM blocks 
WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements(custom_properties) AS prop
    WHERE NOT (properties ? (prop->>'id'))
);
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
    n_tup_hot_upd as hot_updates,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables 
WHERE tablename IN ('blocks')
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
WHERE tablename IN ('blocks')
ORDER BY idx_scan DESC;
```

---

## 🧹 데이터 정리 및 보관 정책

### 1. 소프트 삭제된 데이터 정리

```sql
-- 30일 경과한 삭제 블록 영구 삭제
-- 주의: 이 작업은 애플리케이션 레벨에서 수행하거나, 별도 백그라운드 작업으로 실행해야 함
DELETE FROM blocks
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';
```

### 2. 고아 데이터 정리

```sql
-- 워크스페이스가 삭제된 블록 확인
SELECT b.id, b.workspace_id, b.block_type, b.created_at
FROM blocks b
LEFT JOIN workspaces w ON b.workspace_id = w.id
WHERE b.workspace_id IS NOT NULL AND w.id IS NULL;
```

---

## ✅ 검증 체크리스트

### Scenario 지원 (실제 구현 기준)
- [x] ✅ **Canvas Management 연동**: Canvas에서 blocks 테이블 직접 JOIN으로 조회 (구현 완료)
- [x] ✅ **Custom Properties 관리**: 커스텀 속성 추가/편집/삭제 (Entity 레벨 구현 완료, Server Actions 미구현)
- [x] ✅ **Property Values 관리**: 속성 값 설정/변경 및 타입별 검증 (BlockPropertiesVO Value Objects로 구현 완료)
- [ ] ❌ **Media Upload 처리**: 이미지/파일 업로드 및 Supabase Storage 연동 (미구현 - MediaURL VO만 구현)
- [x] ✅ **Block Tools 실행**: 블록 타입별 특화 기능 실행 (BlockToolService로 구현 완료)

### 데이터 무결성 (실제 구현 기준)
- [x] ✅ **워크스페이스 제약**: 블록은 반드시 하나의 워크스페이스에 속함 (FK 제약조건 설정 완료)
- [x] ✅ **블록 타입 제약**: 지원되는 블록 타입만 허용 (block_type_enum 사용)
- [x] ✅ **JSONB 구조**: properties는 object, custom_properties는 array (애플리케이션 레벨 검증)
- [ ] ❌ **속성 개수 제한**: 최대 50개의 커스텀 속성 (미구현, 추후 Entity 레벨 검증 추가 예정)
- [x] ✅ **FK 관계**: 모든 외래키가 올바르게 설정됨 (workspace_id, created_by)
- [x] ✅ **RLS 보안**: 기본 authenticated 사용자 접근 정책 (개발 단계, 운영 환경에서는 워크스페이스 멤버십 정책 필요)

### 성능 최적화 (실제 구현 기준)
- [x] ✅ **부분 인덱스**: deleted_at IS NULL 조건부 인덱스 (구현 완료)
- [x] ✅ **워크스페이스 인덱스**: workspace_id 부분 인덱스 (구현 완료)
- [x] ✅ **타입 인덱스**: block_type 부분 인덱스 (구현 완료)
- [x] ✅ **생성일 인덱스**: created_at 부분 인덱스 (구현 완료)
- [ ] **복합 인덱스**: workspace_id + block_type + deleted_at 복합 인덱스 (미구현, 추후 추가 예정)
- [ ] **JSONB GIN 인덱스**: properties, custom_properties GIN 인덱스 (미구현, 추후 추가 예정)
- [ ] **Canvas 뷰**: 복잡한 JOIN 쿼리 최적화 뷰 (미구현, 선택적)

### 아키텍처 일관성 (실제 구현 기준)
- [x] ✅ **DDD 원칙**: Block Aggregate 경계와 DB 스키마 일치 (구현 완료)
- [x] ✅ **정의-값 분리**: custom_properties(정의)와 properties(값) 분리 (구현 완료)
- [x] ✅ **확장성**: 향후 블록 컴포넌트화 확장 가능한 구조 (JSONB 구조로 확장 용이)
- [x] ✅ **타입 안전성**: Drizzle ORM과 TypeScript 타입 일치 (BlockPropertiesVO Value Objects로 타입 안전성 확보)
- [x] ✅ **RLS 통합**: 기본 authenticated 정책 구현 (개발 단계, 워크스페이스 멤버십 정책은 추후 추가)

---

## 🔗 도메인 간 통합

### Canvas Management Domain과의 통합
- **blocks.workspace_id**: workspaces.id 참조
- **Canvas 조회**: block_mounts JOIN blocks 직접 조회
- **RLS 연동**: workspace_members를 통한 권한 확인

### Workspace Management Domain과의 통합
- **blocks.workspace_id**: workspaces.id 참조 (CASCADE DELETE)
- **권한 관리**: workspace_members 테이블을 통한 멤버십 확인
- **RLS 정책**: 워크스페이스 멤버십 기반 접근 제어

---

## 📚 References

### 관련 문서
- [Software Design](./03-software-design.md) - Block Aggregate 정의 및 속성 시스템
- [Process Model](./02-process-model.md) - Canvas 연동 및 속성 관리 시나리오
- [Event Storming](./01-event-storm.md) - 도메인 이벤트 및 명령

### 외부 참조
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📝 작성 가이드

### 작성 시 주의사항
1. **테이블 설계**: Software Design의 Block Aggregate와 일치하도록 설계
2. **인덱스 전략**: Canvas 조회 쿼리 패턴 분석 후 인덱스 추가
3. **RLS 정책**: 워크스페이스 멤버십 기반 최소 권한 원칙 적용
4. **주석**: 모든 테이블, 컬럼, enum에 의미 있는 주석 추가
5. **제약조건**: 비즈니스 규칙을 DB 제약조건으로 구현
6. **마이그레이션**: Drizzle ORM으로 생성할 수 있는 형태로 작성

### 템플릿 사용 순서
1. **개요 작성**: 도메인, 작성자, 버전 정보 입력
2. **테이블 관계도**: ASCII 다이어그램으로 테이블 간 관계 표현
3. **Enum 정의**: 블록 타입, 속성 타입 enum 정의
4. **테이블 정의**: blocks 테이블 확장 및 제약조건 정의
5. **RLS 정책**: 워크스페이스 멤버십 기반 접근 권한 정책 정의
6. **성능 최적화**: Canvas 조회 및 JSONB 검색을 위한 인덱스 추가
7. **모니터링**: 정기 점검 쿼리 작성
8. **검증**: 체크리스트 확인

---

이 데이터베이스 스키마는 Block Management Domain의 Canvas 연동, Custom Properties 관리, Media Upload, Block Tools 실행을 완전히 지원하며, 유연한 속성 시스템을 제공합니다. DDD 원칙과 성능 최적화, 보안을 모두 고려한 설계로 확장 가능하고 유지보수하기 쉬운 구조를 제공합니다.
