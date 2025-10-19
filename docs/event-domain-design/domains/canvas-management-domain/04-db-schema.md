# Database Schema: Canvas Management Domain

## 🎯 개요

**도메인**: Canvas Management Domain  
**작성자**: 백엔드개발자 + DBA  
**작성일**: 2025-10-19  
**버전**: v1.1

**Technical Specification 참조**: `04-technical-specification.md`  
**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: 실제 마이그레이션 및 구현

---

> **작성 시점**: Technical Specification 완료 후, 실제 마이그레이션 작성 전  
> **목적**: DDD Aggregate를 데이터베이스 스키마로 전환, 성능 최적화 및 RLS 정책 정의

**기반 문서**: [Technical Specification](./04-technical-specification.md)

---

### 주요 변경사항 (v1.0)
- **초기 스키마 설계**: Canvas Management Domain의 4개 Aggregate를 테이블로 전환
- **테이블 추가**: canvases, block_mounts, edges, viewports 테이블
- **인덱스 최적화**: Process Model의 Read Model 쿼리 패턴에 맞춘 인덱스 설계

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 범위**: Process Model Scenario 0-9 전체 지원
2. **DDD Aggregate 경계 반영**: Canvas, BlockMount, Edge, Viewport Aggregate의 불변식을 DB 제약조건으로 구현
3. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리
4. **MECE 구조**: 누락 없이, 중복 없이 명확한 경계
5. **성능 최적화**: Read Model 쿼리 패턴에 맞춘 인덱스 설계
6. **타입 안전성**: Drizzle ORM을 통한 타입 안전성 확보
7. **권한 기반 접근**: RLS 정책을 통한 데이터 접근 제어
8. **확장성**: 향후 기능 확장을 고려한 테이블 설계

### 테이블 관계도
```
[페이지 중심의 데이터 구조 - 블럭/엣지는 공통 데이터, 뷰포트는 사용자별]

┌─────────────────┐
│     pages       │ (Workspace Management Domain)
│                 │
│ • id (PK)       │ 
│ • workspace_id  │ ⚠️ CanvasAggregate는 page_id를 기반으로 동작
└────────┬────────┘    (별도 canvases 테이블 없음 - 페이지 1:1 매핑)
         │ 1:N
         ▼
┌─────────────────┐
│  block_mounts   │
│                 │
│ • id (PK)       │
│ • page_id (FK)  │
│ • block_id (FK) │
│ • position_x,y  │
│ • size_w,h      │
│ • z_order       │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐        ┌─────────────────┐
│     edges       │        │    viewports    │
│                 │        │                 │
│ • id (PK)       │        │ • id (PK)       │
│ • page_id (FK)  │        │ • page_id (FK)  │
│ • source_id     │        │ • user_id (FK)  │
│ • target_id     │        │ • zoom_level    │
│ • edge_type     │        │ • center_x,y    │
└─────────────────┘        └─────────────────┘
```

> **💡 설계 노트: CanvasAggregate vs DB Schema**  
> - **CanvasAggregate**: 도메인 모델에서는 캔버스 초기화 상태를 관리하는 Aggregate로 존재
> - **DB Schema**: 캔버스는 페이지와 1:1 관계이므로 별도 테이블 없이 `page_id`로 식별
> - **Repository 구현**: `CanvasRepository`는 `page_id`를 기반으로 관련 데이터 조회
> - **React Flow State**: 캔버스 초기화 상태(reactFlowInstanceId)는 클라이언트 메모리에서만 관리

---

## 📋 Table Definitions

### 1. edge_type enum (public schema)

엣지 연결선의 타입을 정의하는 enum (React Flow 기본 타입 기준)

```sql
-- edge_type enum 정의 (React Flow 기본 엣지 타입)
CREATE TYPE edge_type AS ENUM (
    'default',      -- 기본 베지어 곡선 (React Flow 기본값)
    'straight',     -- 직선
    'step',         -- 스텝
    'smoothstep',   -- 스무스스텝
    'simplebezier'  -- 단순 베지어 곡선
);

-- Comments
COMMENT ON TYPE edge_type IS 'Canvas Management Domain - 엣지 연결선 타입 (React Flow 기본 타입)';
COMMENT ON ENUM VALUE edge_type.default IS '기본 베지어 곡선 엣지 (type 속성 미지정 시 기본값)';
COMMENT ON ENUM VALUE edge_type.straight IS '직선 형태의 연결선';
COMMENT ON ENUM VALUE edge_type.step IS '스텝 형태의 연결선';
COMMENT ON ENUM VALUE edge_type.smoothstep IS '부드러운 스텝 형태의 연결선';
COMMENT ON ENUM VALUE edge_type.simplebezier IS '단순 베지어 곡선 연결선';
```

**React Flow 기본 엣지 타입 참고**:
- React Flow는 5가지 기본 엣지 타입을 제공합니다
- `type` 속성을 지정하지 않으면 `'default'` (베지어 곡선)가 사용됩니다
- 커스텀 엣지 타입을 정의하지 않는 한 이 5가지 타입이 항상 사용 가능합니다
- 참고: [React Flow Edge Types Documentation](https://reactflow.dev/learn/customization/custom-edges#default-edge-types)

### 2. alignment_type enum (public schema)

블럭 정렬 방향을 정의하는 enum

```sql
-- alignment_type enum 정의
CREATE TYPE alignment_type AS ENUM (
    'TOP',                -- 상단 정렬
    'BOTTOM',             -- 하단 정렬
    'LEFT',               -- 좌측 정렬
    'RIGHT',              -- 우측 정렬
    'HORIZONTAL_CENTER',  -- 수평 중앙 정렬
    'VERTICAL_CENTER',    -- 수직 중앙 정렬
    'HORIZONTAL_DISTRIBUTE', -- 수평 균등 분포
    'VERTICAL_DISTRIBUTE'    -- 수직 균등 분포
);

-- Comments
COMMENT ON TYPE alignment_type IS 'Canvas Management Domain - 블럭 정렬 및 분포 타입';
COMMENT ON ENUM VALUE alignment_type.TOP IS '상단 정렬';
COMMENT ON ENUM VALUE alignment_type.BOTTOM IS '하단 정렬';
COMMENT ON ENUM VALUE alignment_type.LEFT IS '좌측 정렬';
COMMENT ON ENUM VALUE alignment_type.RIGHT IS '우측 정렬';
COMMENT ON ENUM VALUE alignment_type.HORIZONTAL_CENTER IS '수평 중앙 정렬';
COMMENT ON ENUM VALUE alignment_type.VERTICAL_CENTER IS '수직 중앙 정렬';
COMMENT ON ENUM VALUE alignment_type.HORIZONTAL_DISTRIBUTE IS '수평 균등 분포';
COMMENT ON ENUM VALUE alignment_type.VERTICAL_DISTRIBUTE IS '수직 균등 분포';
```

---

### 3. block_mounts 테이블 (public schema)

블럭 마운팅 정보를 저장하는 테이블 (BlockMount Aggregate Root) - 페이지에 직접 연결

```sql
CREATE TABLE block_mounts (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    page_id UUID NOT NULL, -- Workspace Management Domain과의 외부 참조
    
    -- Block Mount Fields
    block_id UUID NOT NULL, -- Block Domain과의 외부 참조
    position_x DECIMAL(10, 2) NOT NULL DEFAULT 0,
    position_y DECIMAL(10, 2) NOT NULL DEFAULT 0,
    size_width DECIMAL(8, 2) NOT NULL DEFAULT 100,
    size_height DECIMAL(8, 2) NOT NULL DEFAULT 100,
    z_order INTEGER NOT NULL DEFAULT 0,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- 소프트 삭제
    
    -- Constraints
    CONSTRAINT block_mounts_position_x_range CHECK (position_x >= -999999 AND position_x <= 999999),
    CONSTRAINT block_mounts_position_y_range CHECK (position_y >= -999999 AND position_y <= 999999),
    CONSTRAINT block_mounts_size_width_range CHECK (size_width >= 1 AND size_width <= 10000),
    CONSTRAINT block_mounts_size_height_range CHECK (size_height >= 1 AND size_height <= 10000),
    CONSTRAINT block_mounts_z_order_range CHECK (z_order >= 0 AND z_order <= 2147483647),
    CONSTRAINT block_mounts_unique_page_block UNIQUE (page_id, block_id) WHERE deleted_at IS NULL
);

-- Basic Indexes (자세한 인덱스 전략은 Performance Optimization Strategy 섹션 참조)

-- Comments
COMMENT ON TABLE block_mounts IS 'Canvas Management Domain - 블럭 마운팅 정보';
COMMENT ON COLUMN block_mounts.id IS '블럭 마운트 고유 식별자';
COMMENT ON COLUMN block_mounts.page_id IS '소속 페이지 ID (Workspace Management Domain)';
COMMENT ON COLUMN block_mounts.block_id IS '마운트된 블럭 ID (Block Domain)';
COMMENT ON COLUMN block_mounts.position_x IS '블럭 X 좌표';
COMMENT ON COLUMN block_mounts.position_y IS '블럭 Y 좌표';
COMMENT ON COLUMN block_mounts.size_width IS '블럭 너비';
COMMENT ON COLUMN block_mounts.size_height IS '블럭 높이';
COMMENT ON COLUMN block_mounts.z_order IS '레이어 순서 (높을수록 위)';
COMMENT ON COLUMN block_mounts.created_at IS '생성 시각';
COMMENT ON COLUMN block_mounts.updated_at IS '수정 시각';
COMMENT ON COLUMN block_mounts.deleted_at IS '삭제 시각 (소프트 삭제)';
```

> **💡 설계 개선 노트**  
> - **페이지 직접 연결**: 블럭과 엣지는 페이지에 직접 연결하여 모든 뷰에서 공통 사용
> - **뷰 독립적 데이터**: Canvas, List, Kanban 뷰 모두 같은 블럭 데이터를 다른 방식으로 렌더링
> - **Position, Size VO**: 별도 컬럼으로 분해하여 저장 (쿼리 편의성)
> - **FK 제약조건**: `page_id`, `block_id`는 외부 도메인이므로 FK 설정하지 않음

---

### 4. edges 테이블 (public schema)

엣지 연결 정보를 저장하는 테이블 (Edge Aggregate Root) - 페이지에 직접 연결

```sql
CREATE TABLE edges (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    page_id UUID NOT NULL, -- Workspace Management Domain과의 외부 참조
    
    -- Edge Fields
    source_block_id UUID NOT NULL, -- Block Domain과의 외부 참조
    target_block_id UUID NOT NULL, -- Block Domain과의 외부 참조
    edge_type edge_type NOT NULL DEFAULT 'default',
    edge_label TEXT DEFAULT '',
    edge_style_color TEXT DEFAULT '#000000',
    edge_style_thickness INTEGER DEFAULT 2,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- 소프트 삭제
    
    -- Constraints
    CONSTRAINT edges_thickness_range CHECK (edge_style_thickness >= 1 AND edge_style_thickness <= 10),
    CONSTRAINT edges_unique_page_source_target UNIQUE (page_id, source_block_id, target_block_id) WHERE deleted_at IS NULL
);

-- Basic Indexes (자세한 인덱스 전략은 Performance Optimization Strategy 섹션 참조)

-- Comments
COMMENT ON TABLE edges IS 'Canvas Management Domain - 엣지 연결 정보';
COMMENT ON COLUMN edges.id IS '엣지 고유 식별자';
COMMENT ON COLUMN edges.page_id IS '소속 페이지 ID (Workspace Management Domain)';
COMMENT ON COLUMN edges.source_block_id IS '연결 소스 블럭 ID (Block Domain)';
COMMENT ON COLUMN edges.target_block_id IS '연결 타겟 블럭 ID (Block Domain)';
COMMENT ON COLUMN edges.edge_type IS '엣지 타입 (React Flow 기본 타입: default, straight, step, smoothstep, simplebezier)';
COMMENT ON COLUMN edges.edge_label IS '엣지 레이블';
COMMENT ON COLUMN edges.edge_style_color IS '엣지 색상';
COMMENT ON COLUMN edges.edge_style_thickness IS '엣지 두께 (1-10px)';
COMMENT ON COLUMN edges.created_at IS '생성 시각';
COMMENT ON COLUMN edges.updated_at IS '수정 시각';
COMMENT ON COLUMN edges.deleted_at IS '삭제 시각 (소프트 삭제)';
```

> **💡 설계 개선 노트**  
> - **페이지 직접 연결**: 엣지도 페이지에 직접 연결하여 모든 뷰에서 공통 사용
> - **다중 뷰 지원**: Canvas, List, Kanban 뷰에서 모두 같은 엣지 데이터 활용 가능
> - **self-loop 허용**: source_block_id === target_block_id 허용
> - **EdgeStyle VO**: color, thickness를 개별 컬럼으로 분해하여 저장
> - **블럭 삭제 시**: 연결된 엣지 찾기를 위한 인덱스 설정

---

### 5. viewports 테이블 (public schema)

뷰포트 정보를 저장하는 테이블 (Viewport Aggregate Root) - 사용자별 뷰포트 설정

```sql
CREATE TABLE viewports (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys
    page_id UUID NOT NULL, -- Workspace Management Domain과의 외부 참조
    user_id UUID NOT NULL, -- User Management Domain과의 외부 참조
    
    -- Viewport Fields
    zoom_level DECIMAL(4, 2) NOT NULL DEFAULT 1.0,
    center_x DECIMAL(10, 2) NOT NULL DEFAULT 0,
    center_y DECIMAL(10, 2) NOT NULL DEFAULT 0,
    last_saved TIMESTAMPTZ, -- 마지막 저장 시각
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT viewports_zoom_level_range CHECK (zoom_level >= 0.1 AND zoom_level <= 5.0),
    CONSTRAINT viewports_center_x_range CHECK (center_x >= -999999 AND center_x <= 999999),
    CONSTRAINT viewports_center_y_range CHECK (center_y >= -999999 AND center_y <= 999999),
    CONSTRAINT viewports_unique_page_user UNIQUE (page_id, user_id)
);

-- Basic Indexes (자세한 인덱스 전략은 Performance Optimization Strategy 섹션 참조)

-- Comments
COMMENT ON TABLE viewports IS 'Canvas Management Domain - 뷰포트 정보';
COMMENT ON COLUMN viewports.id IS '뷰포트 고유 식별자';
COMMENT ON COLUMN viewports.page_id IS '소속 페이지 ID (Workspace Management Domain)';
COMMENT ON COLUMN viewports.user_id IS '사용자 ID (User Management Domain)';
COMMENT ON COLUMN viewports.zoom_level IS '줌 레벨 (0.1 - 5.0)';
COMMENT ON COLUMN viewports.center_x IS '뷰포트 중심 X 좌표';
COMMENT ON COLUMN viewports.center_y IS '뷰포트 중심 Y 좌표';
COMMENT ON COLUMN viewports.last_saved IS '마지막 저장 시각';
COMMENT ON COLUMN viewports.created_at IS '생성 시각';
COMMENT ON COLUMN viewports.updated_at IS '수정 시각';
```

> **💡 설계 개선 노트**  
> - **사용자별 뷰포트**: 같은 페이지라도 각 사용자마다 개별 뷰포트 설정 (줌, 패닝 위치 등)
> - **멀티 유저 지원**: 여러 사용자가 동시에 같은 페이지에서 각자 다른 뷰포트로 작업 가능
> - **페이지-사용자 고유성**: 페이지와 사용자 조합으로 UNIQUE 제약조건 설정
> - **외부 참조**: page_id와 user_id는 각각 Workspace, User Management Domain과의 외부 참조
> - **소프트 삭제 없음**: 뷰포트는 일시적 상태이므로 하드 삭제

---

## 🚀 Performance Optimization Strategy

### 📊 주요 쿼리 패턴 분석

Process Model과 Technical Specification 기반 쿼리 패턴 분석:

#### 1. 자주 사용되는 조회 패턴

**Block Mount 관련 쿼리**:
```sql
-- 페이지별 모든 블럭 조회 (z-order 정렬) - Scenario 0, 1, 2, 5
SELECT * FROM block_mounts 
WHERE page_id = $1 AND deleted_at IS NULL 
ORDER BY z_order DESC;

-- 특정 블럭 ID로 조회 - Scenario 2, 3, 8
SELECT * FROM block_mounts 
WHERE block_id = $1 AND deleted_at IS NULL;

-- 블럭 위치 기반 스냅 가이드 계산 - Scenario 6
SELECT position_x, position_y, size_width, size_height 
FROM block_mounts 
WHERE page_id = $1 AND deleted_at IS NULL;
```

**Edge 관련 쿼리**:
```sql
-- 페이지별 모든 엣지 조회 - Scenario 7
SELECT * FROM edges 
WHERE page_id = $1 AND deleted_at IS NULL;

-- 블럭 연결된 모든 엣지 조회 (블럭 삭제 시) - Scenario 8
SELECT * FROM edges 
WHERE (source_block_id = $1 OR target_block_id = $1) 
  AND deleted_at IS NULL;
```

**Viewport 관련 쿼리**:
```sql
-- 사용자별 페이지 뷰포트 조회 - Scenario 9
SELECT * FROM viewports 
WHERE page_id = $1 AND user_id = $2;
```

---

## 🎯 Index Strategy

### Core Performance Indexes

#### 1. block_mounts 테이블 인덱스

```sql
-- 기본 인덱스들
CREATE INDEX idx_block_mounts_page_id ON block_mounts(page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_block_mounts_block_id ON block_mounts(block_id) WHERE deleted_at IS NULL;

-- 성능 최적화 복합 인덱스들
-- Scenario 0, 1, 6: 페이지별 블럭 조회 + z-order 정렬 최적화 (가장 자주 사용)
CREATE INDEX idx_block_mounts_page_z_order ON block_mounts(page_id, z_order DESC, id) WHERE deleted_at IS NULL;

-- Scenario 6: 스냅 가이드 계산을 위한 위치 기반 조회
CREATE INDEX idx_block_mounts_position_spatial ON block_mounts(page_id, position_x, position_y, size_width, size_height) WHERE deleted_at IS NULL;

-- Scenario 5: 다중 블럭 정렬/분포 작업을 위한 배치 업데이트
CREATE INDEX idx_block_mounts_batch_update ON block_mounts(id, page_id, z_order) WHERE deleted_at IS NULL;
```

#### 2. edges 테이블 인덱스

```sql
-- 기본 인덱스들
CREATE INDEX idx_edges_page_id ON edges(page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_edges_source_block_id ON edges(source_block_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_edges_target_block_id ON edges(target_block_id) WHERE deleted_at IS NULL;

-- 성능 최적화 복합 인덱스들
-- Scenario 7: 페이지별 엣지 조회 + 타입별 정렬
CREATE INDEX idx_edges_page_type ON edges(page_id, edge_type, created_at) WHERE deleted_at IS NULL;

-- Scenario 8: 블럭 삭제 시 연결된 엣지 찾기 (OR 조건 최적화)
CREATE INDEX idx_edges_source_connected ON edges(source_block_id, id) WHERE deleted_at IS NULL;
CREATE INDEX idx_edges_target_connected ON edges(target_block_id, id) WHERE deleted_at IS NULL;
```

#### 3. viewports 테이블 인덱스

```sql
-- 기본 인덱스들
CREATE INDEX idx_viewports_page_id ON viewports(page_id);
CREATE INDEX idx_viewports_user_id ON viewports(user_id);
CREATE INDEX idx_viewports_last_saved ON viewports(last_saved DESC) WHERE last_saved IS NOT NULL;

-- 성능 최적화 복합 인덱스들
-- Scenario 9: 사용자별 페이지 뷰포트 빠른 조회 (Covering Index)
CREATE INDEX idx_viewports_page_user_fast ON viewports(page_id, user_id) 
INCLUDE (zoom_level, center_x, center_y, last_saved);

-- Scenario 9: 사용자별 최근 뷰포트 히스토리
CREATE INDEX idx_viewports_user_recent ON viewports(user_id, last_saved DESC) WHERE last_saved IS NOT NULL;
```

### 📈 쿼리 성능 최적화 전략

#### 1. 부분 인덱스 (Partial Index) 활용

**deleted_at IS NULL 조건**:
- 소프트 삭제되지 않은 레코드만 인덱싱
- 인덱스 크기 감소 및 조회 성능 향상
- 모든 주요 테이블에 적용

#### 2. 복합 인덱스 컬럼 순서 최적화

**선택도(Selectivity) 기준 정렬**:
1. **page_id**: 가장 선택도가 높음 (페이지별 분할)
2. **z_order**: 정렬 기준 (블럭 레이어 순서)
3. **user_id**: 사용자별 분할 (viewports)
4. **id**: 고유 식별자 (마지막 정렬)

#### 3. INCLUDE 절 활용

**Covering Index로 추가 컬럼 포함**:
```sql
-- 뷰포트 조회 시 추가 컬럼들을 인덱스에 포함하여 테이블 접근 방지
CREATE INDEX idx_viewports_page_user_covering ON viewports(page_id, user_id) 
INCLUDE (zoom_level, center_x, center_y, updated_at);
```

### 🔍 모니터링 및 성능 측정

#### 1. 인덱스 사용률 모니터링

```sql
-- 인덱스 사용 통계 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('block_mounts', 'edges', 'viewports')
ORDER BY idx_scan DESC;
```

#### 2. 느린 쿼리 식별

```sql
-- pg_stat_statements를 통한 성능 분석
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%block_mounts%' 
   OR query LIKE '%edges%' 
   OR query LIKE '%viewports%'
ORDER BY total_time DESC
LIMIT 10;
```

#### 3. 실행 계획 분석

```sql
-- 주요 쿼리 패턴 분석
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
SELECT * FROM block_mounts 
WHERE page_id = $1 AND deleted_at IS NULL 
ORDER BY z_order DESC;
```

---

## 🔐 Row Level Security (RLS) Policy

### 🎯 RLS 전략

Canvas Management Domain은 **최후의 보루** 전략을 적용합니다:
- **Application-level**: 복잡한 비즈니스 권한 로직 (페이지 접근 권한 등)
- **RLS**: 단순한 user_id 기반 최후의 보루

### 📋 RLS 정책 구현

#### 1. 기본 설정

```sql
-- RLS 활성화 (모든 테이블)
ALTER TABLE block_mounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewports ENABLE ROW LEVEL SECURITY;

-- 사용자 인증 확인 함수
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub'::text,
    current_setting('request.jwt.claims', true)::json->>'user_id'::text
  )::UUID;
$$ LANGUAGE SQL STABLE;
```

#### 2. block_mounts & edges 테이블 RLS 정책

```sql
-- 블럭 마운트 CRUD 정책 (인증된 사용자만)
CREATE POLICY "Enable all for authenticated users" ON block_mounts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 엣지 CRUD 정책 (인증된 사용자만)
CREATE POLICY "Enable all for authenticated users" ON edges
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
```

#### 3. viewports 테이블 RLS 정책

```sql
-- 뷰포트 조회/수정 정책 (사용자별 소유권만)
CREATE POLICY "Enable read for own viewport" ON viewports
  FOR SELECT TO authenticated
  USING (user_id = auth.user_id());

CREATE POLICY "Enable insert for own viewport" ON viewports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.user_id());

CREATE POLICY "Enable update for own viewport" ON viewports
  FOR UPDATE TO authenticated
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());

CREATE POLICY "Enable delete for own viewport" ON viewports
  FOR DELETE TO authenticated
  USING (user_id = auth.user_id());
```

### 🔒 보안 원칙

- **block_mounts & edges**: 페이지 권한은 Application-level에서 관리, RLS는 최후의 보루
- **viewports**: 사용자별 데이터 격리로 개인 정보 보호

---

## 📊 모니터링 및 유지보수 계획

### 🔍 정기 점검 쿼리

#### 1. 데이터 무결성 확인

```sql
-- 1. 고아 블럭 마운트 레코드 확인 (존재하지 않는 페이지 참조)
SELECT 'Orphan block_mounts' as issue, COUNT(*) as count
FROM block_mounts bm
LEFT JOIN workspace_management.pages p ON bm.page_id = p.id
WHERE bm.page_id IS NOT NULL 
  AND p.id IS NULL 
  AND bm.deleted_at IS NULL;

-- 2. 고아 엣지 레코드 확인 (존재하지 않는 블럭 참조)
SELECT 'Orphan edges' as issue, COUNT(*) as count
FROM edges e
LEFT JOIN workspace_management.pages p ON e.page_id = p.id
WHERE e.page_id IS NOT NULL 
  AND p.id IS NULL 
  AND e.deleted_at IS NULL;

-- 3. 고아 뷰포트 레코드 확인 (존재하지 않는 페이지/사용자 참조)
SELECT 'Orphan viewports' as issue, COUNT(*) as count
FROM viewports v
LEFT JOIN workspace_management.pages p ON v.page_id = p.id
WHERE v.page_id IS NOT NULL 
  AND p.id IS NULL;
```

#### 2. 데이터 정합성 확인

```sql
-- 4. 중복 블럭 마운트 확인 (동일한 페이지+블럭 조합)
SELECT 'Duplicate block mounts' as issue, COUNT(*) as count
FROM (
  SELECT page_id, block_id, COUNT(*) as cnt
  FROM block_mounts 
  WHERE deleted_at IS NULL
  GROUP BY page_id, block_id
  HAVING COUNT(*) > 1
) duplicates;

-- 5. 중복 엣지 확인 (동일한 페이지+소스+타겟 조합)
SELECT 'Duplicate edges' as issue, COUNT(*) as count
FROM (
  SELECT page_id, source_block_id, target_block_id, COUNT(*) as cnt
  FROM edges 
  WHERE deleted_at IS NULL
  GROUP BY page_id, source_block_id, target_block_id
  HAVING COUNT(*) > 1
) duplicates;
```

#### 3. 성능 이슈 모니터링

```sql
-- 6. 느린 쿼리 확인
SELECT 'Slow queries' as issue, COUNT(*) as count
FROM pg_stat_statements 
WHERE mean_time > 1000; -- 1초 이상

-- 7. 인덱스 사용률 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('block_mounts', 'edges', 'viewports')
  AND idx_scan = 0  -- 사용되지 않는 인덱스
ORDER BY tablename, idx_scan;
```

### 📈 성능 모니터링

#### 1. 테이블별 사용량 통계

```sql
-- Canvas Management Domain 테이블 사용량
SELECT 
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    seq_scan,
    idx_scan,
    ROUND(n_live_tup * pg_column_size(row(1)) / 1024.0 / 1024.0, 2) as estimated_mb
FROM pg_stat_user_tables 
WHERE tablename IN ('block_mounts', 'edges', 'viewports')
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;
```

#### 2. 인덱스 효율성 분석

```sql
-- 인덱스 사용률 및 효율성
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read > 0 THEN ROUND((idx_tup_fetch::numeric / idx_tup_read) * 100, 2)
        ELSE 0 
    END as efficiency_percent
FROM pg_stat_user_indexes 
WHERE tablename IN ('block_mounts', 'edges', 'viewports')
ORDER BY idx_scan DESC;
```

### 🧹 데이터 정리 정책

#### 1. 소프트 삭제된 레코드 정리

```sql
-- 90일 이상 된 소프트 삭제 레코드 조회 (실제 삭제 전 점검용)
SELECT 
    'Old soft deleted records' as cleanup_type,
    tablename,
    COUNT(*) as record_count,
    MIN(deleted_at) as oldest_deleted,
    MAX(deleted_at) as newest_deleted
FROM (
    SELECT 'block_mounts' as tablename, deleted_at FROM block_mounts WHERE deleted_at IS NOT NULL
    UNION ALL
    SELECT 'edges' as tablename, deleted_at FROM edges WHERE deleted_at IS NOT NULL
) all_deleted
WHERE deleted_at < NOW() - INTERVAL '90 days'
GROUP BY tablename;
```

#### 2. 뷰포트 데이터 정리

```sql
-- 30일 이상 비활성 뷰포트 확인 (사용자 정책에 따라 정리 가능)
SELECT 
    user_id,
    COUNT(*) as inactive_viewports,
    MIN(last_saved) as oldest_viewport,
    MAX(last_saved) as newest_viewport
FROM viewports 
WHERE last_saved < NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY inactive_viewports DESC;
```

### 🚨 알림 및 알레트

#### 1. 임계값 기반 알림

```sql
-- 성능 임계값 체크 (일일 모니터링용)
WITH performance_metrics AS (
    SELECT 
        'high_seq_scan' as alert_type,
        tablename,
        seq_scan,
        CASE WHEN seq_scan > 1000 THEN 'WARNING' ELSE 'OK' END as status
    FROM pg_stat_user_tables 
    WHERE tablename IN ('block_mounts', 'edges', 'viewports')
),
data_volume_metrics AS (
    SELECT 
        'high_row_count' as alert_type,
        tablename,
        n_live_tup as row_count,
        CASE WHEN n_live_tup > 100000 THEN 'WARNING' ELSE 'OK' END as status
    FROM pg_stat_user_tables 
    WHERE tablename IN ('block_mounts', 'edges', 'viewports')
)
SELECT * FROM performance_metrics WHERE status = 'WARNING'
UNION ALL
SELECT * FROM data_volume_metrics WHERE status = 'WARNING';
```

### 📋 유지보수 체크리스트

#### 주간 점검 (매주 월요일)
- [ ] 데이터 무결성 확인 (고아 레코드 검사)
- [ ] 성능 지표 리뷰 (테이블 사용량, 인덱스 효율성)
- [ ] 느린 쿼리 분석 및 최적화 검토

#### 월간 점검 (매월 첫째 주)
- [ ] 소프트 삭제된 레코드 정리 검토
- [ ] 인덱스 사용률 분석 및 미사용 인덱스 정리 검토
- [ ] 스토리지 사용량 분석

#### 분기 점검 (분기 말)
- [ ] 전체 성능 메트릭 리뷰
- [ ] 데이터 아카이빙 정책 검토
- [ ] 인덱스 전략 재검토 및 최적화

---

## 🔗 Technical Specification 연계

### Aggregate ↔ Table 매핑 전략

| Aggregate (Tech Spec) | DB Table | 구현 전략 |
|----------------------|----------|-----------|
| CanvasAggregate | ❌ 테이블 없음 | `page_id` 기반으로 관련 데이터 조회 (Virtual Aggregate) |
| BlockMountAggregate | ✅ `block_mounts` | 직접 매핑 (1:1) |
| EdgeAggregate | ✅ `edges` | 직접 매핑 (1:1) |
| ViewportAggregate | ✅ `viewports` | 직접 매핑 (1:1) |

### CanvasRepository 구현 가이드

`CanvasAggregate`는 도메인 모델에 존재하지만 별도 테이블이 없으므로, Repository 구현 시 다음 전략을 사용:

```typescript
// Technical Specification의 CanvasRepository 인터페이스
interface CanvasRepository {
  save(canvas: CanvasAggregate): Promise<void>;
  findById(canvasId: CanvasId): Promise<CanvasAggregate | null>;
  findByPageId(pageId: PageId): Promise<CanvasAggregate | null>;
  delete(canvasId: CanvasId): Promise<void>;
}

// DB Schema 기반 구현 전략
class DrizzleCanvasRepository implements CanvasRepository {
  async findByPageId(pageId: PageId): Promise<CanvasAggregate | null> {
    // 1. page_id가 Workspace Management Domain에 존재하는지 확인
    const pageExists = await this.workspaceManagementService.checkPageExists(pageId);
    if (!pageExists) return null;
    
    // 2. CanvasAggregate를 메모리에서 재구성
    //    - canvasId = pageId (1:1 매핑)
    //    - reactFlowInstanceId는 클라이언트에서 관리 (DB 저장 불필요)
    //    - isInitialized는 block_mounts 존재 여부로 판단
    
    const blockCount = await db.select({ count: sql`COUNT(*)` })
      .from(blockMounts)
      .where(eq(blockMounts.pageId, pageId));
    
    // 3. Virtual CanvasAggregate 생성
    const canvas = new Canvas(
      new CanvasId(pageId.value), // canvasId = pageId
      pageId,
      null, // reactFlowInstanceId는 클라이언트 메모리에서만 관리
      blockCount > 0, // 블럭이 있으면 초기화된 것으로 간주
      new Date(),
      new Date()
    );
    
    return new CanvasAggregate(canvas);
  }
  
  async save(canvas: CanvasAggregate): Promise<void> {
    // CanvasAggregate 자체는 DB에 저장하지 않음
    // 관련 BlockMount, Edge, Viewport는 각각의 Repository에서 저장
    // 이 메서드는 no-op 또는 검증만 수행
    
    // 페이지 존재 여부 확인
    const pageExists = await this.workspaceManagementService.checkPageExists(
      canvas.pageId
    );
    
    if (!pageExists) {
      throw new CanvasManagementError('PAGE_NOT_FOUND', 'Page does not exist');
    }
    
    // 실제 저장은 BlockMountRepository, EdgeRepository 등에서 수행
  }
}
```

### Value Object 복원 전략

DB 컬럼에서 Value Object로 복원하는 방법:

```typescript
// Position VO 복원
const position = new Position(
  blockMountRow.position_x,
  blockMountRow.position_y
);

// Size VO 복원
const size = new Size(
  blockMountRow.size_width,
  blockMountRow.size_height
);

// ZOrder VO 복원
const zOrder = new ZOrder(blockMountRow.z_order);

// EdgeType VO 복원
const edgeType = new EdgeType(edgeRow.edge_type);

// EdgeStyle VO 복원
const edgeStyle = new EdgeStyle(
  edgeRow.edge_style_color,
  edgeRow.edge_style_thickness
);
```

### 주요 쿼리 패턴과 인덱스 활용

Technical Specification의 Repository 메서드와 DB 인덱스 매핑:

| Repository 메서드 | 사용 인덱스 | 쿼리 패턴 |
|------------------|-----------|----------|
| `BlockMountRepository.findByPageId()` | `idx_block_mounts_page_z_order` | `WHERE page_id = ? ORDER BY z_order DESC` |
| `BlockMountRepository.findByBlockId()` | `idx_block_mounts_block_id` | `WHERE block_id = ?` |
| `EdgeRepository.findByConnectedBlockId()` | `idx_edges_source_block_id`, `idx_edges_target_block_id` | `WHERE source_block_id = ? OR target_block_id = ?` |
| `ViewportRepository.findByPageId()` | `idx_viewports_page_user_fast` (Covering) | `WHERE page_id = ? AND user_id = ?` |

### Invariants → DB Constraints 매핑 확인

Technical Specification의 모든 Invariants가 DB 제약조건으로 구현되었는지 확인:

✅ **BlockMountAggregate Invariants**:
- ✅ 블럭은 반드시 하나 이상의 페이지에 마운트되어야 함 → `NOT NULL page_id`
- ✅ 새로 생성된 블럭은 최상위 z-order에 배치됨 → Application Logic (Repository에서 처리)
- ✅ 스냅 임계값 5px 이내에서만 자동 정렬 적용 → Application Logic
- ✅ 드래그/리사이즈 종료 시에만 DB 저장 → Application Logic
- ✅ Position 범위 검증 → `CHECK (position_x/y >= -999999 AND <= 999999)`
- ✅ Size 범위 검증 → `CHECK (size_width/height >= 1 AND <= 10000)`
- ✅ ZOrder 범위 검증 → `CHECK (z_order >= 0 AND <= 2147483647)`

✅ **EdgeAggregate Invariants**:
- ✅ 엣지는 특정 페이지에서만 존재함 → `NOT NULL page_id`
- ✅ 자기 자신으로의 엣지(self-loop) 허용 → 제약조건 없음 (허용)
- ✅ 블럭 삭제 시 연결된 모든 엣지 자동 삭제 → Application Logic (Service Layer에서 처리)
- ✅ 엣지 타입은 지원되는 형식만 허용 → `edge_type` ENUM

✅ **ViewportAggregate Invariants**:
- ✅ 줌 레벨은 최소/최대 제한 범위 내에서만 가능 → `CHECK (zoom_level >= 0.1 AND <= 5.0)`
- ✅ 페이지별+사용자별 뷰포트 유일성 → `UNIQUE (page_id, user_id)`
- ✅ 페이지 이탈 시에만 뷰포트 상태 자동 저장 → Application Logic

---

## ✅ 검증 체크리스트

### DB Schema ↔ Technical Specification 연계 검증
- [x] **Aggregate → Table 매핑**: 4개 Aggregate 중 3개는 직접 매핑, 1개(Canvas)는 Virtual Aggregate로 처리
- [x] **Value Objects → Columns**: 모든 VO가 적절한 DB 컬럼으로 분해됨
- [x] **Invariants → Constraints**: 모든 비즈니스 규칙이 DB 제약조건 또는 Application Logic으로 구현됨
- [x] **Repository Methods → Indexes**: 모든 Repository 메서드에 필요한 인덱스가 설계됨

### Process Model Scenario 지원 검증
- [x] **Scenario 0**: 캔버스 초기화 및 데이터 로드 (CanvasAggregate는 Virtual로 처리)
- [x] **Scenario 1**: 블럭 생성 및 마운팅 (`block_mounts` 테이블)
- [x] **Scenario 2**: 블럭 변환 (`block_mounts` 테이블, 인덱스 최적화)
- [x] **Scenario 3**: 블럭 복제 (`block_mounts` 테이블)
- [x] **Scenario 4**: 블럭 선택 (Frontend State, DB 저장 불필요)
- [x] **Scenario 5**: 블럭 정렬 도구 (`block_mounts` 배치 업데이트 인덱스)
- [x] **Scenario 6**: 스마트 가이드 & 스냅 (위치 기반 spatial 인덱스)
- [x] **Scenario 7**: 엣지 생성 및 관리 (`edges` 테이블)
- [x] **Scenario 8**: 블럭 삭제 및 엣지 정리 (soft delete, 연결 인덱스)
- [x] **Scenario 9**: 뷰포트 관리 (`viewports` 테이블, user별 관리)

### 성능 최적화 검증
- [x] **Read Model 쿼리 최적화**: 15개 인덱스 설계 완료
- [x] **Partial Indexes**: `WHERE deleted_at IS NULL` 조건으로 인덱스 크기 최적화
- [x] **Covering Indexes**: `INCLUDE` 절로 테이블 접근 방지
- [x] **Composite Indexes**: 선택도 기준 컬럼 순서 최적화

### RLS 정책 검증
- [x] **인증 기반 접근**: `authenticated` 역할 기반 정책 설정
- [x] **사용자별 데이터 격리**: `viewports` 테이블의 `user_id` 기반 소유권 확인
- [x] **Application-level 권한**: 복잡한 비즈니스 권한은 Service Layer에서 처리

---

**DB Schema 워크샵 완료 날짜**: 2025-01-17  
**다음 단계**: Technical Specification 기반 실제 구현 (`07-tdd-implementation.md`)
