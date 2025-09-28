# Component System Domain - Database Schema (Simplified)

Component System Domain의 단순화된 데이터베이스 스키마를 정의합니다.

---

## 🎯 Schema Overview (Simplified Design)

Component System Domain은 단순화되어 다음 구조로 구성됩니다:

- **components**: 컴포넌트 정의 및 모든 속성 정보
- **blocks 테이블 확장**: 인스턴스 정보를 블럭 테이블에 통합
- **렌더링 시점 조합**: 프론트엔드에서 컴포넌트 + 오버라이드 데이터 조합

### 핵심 설계 원칙

1. **인스턴스 = 블럭**: 별도 인스턴스 테이블 없이 블럭이 인스턴스 역할
2. **렌더링 시점 조합**: DB에 중복 저장하지 않고 프론트에서 데이터 조합
3. **스타일만 오버라이드**: 기본/커스텀 속성은 오버라이드 개념 없음
4. **단순한 추적**: 복잡한 동기화 세션이나 생명주기 추적 제거

---

## 📊 Simplified Table Structure

| 기존 복잡한 구조 | 단순화된 구조 | 변경 내용 |
|-----------------|--------------|----------|
| ~~component_properties~~ | `components.properties` | 컬럼으로 통합 |
| ~~component_instances~~ | `blocks.component_id` | 블럭에 컬럼 추가 |
| ~~instance_property_overrides~~ | `blocks.style_overrides` | 간단한 JSON으로 저장 |
| ~~component_sync_sessions~~ | 제거 | 복잡한 동기화 로직 제거 |
| ~~component_lifecycle_events~~ | 제거 | 간단한 CRUD로 충분 |

---

## 🗃️ Table Definitions

### 1. components (단순화)

컴포넌트 정의 및 모든 속성 정보를 하나의 테이블에 저장

```sql
CREATE TABLE components (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  
  -- Workspace Context
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Component Properties (통합된 속성 정의)
  default_properties JSONB DEFAULT '{}',    -- 기본 속성
  custom_properties JSONB DEFAULT '{}',     -- 커스텀 속성  
  style_properties JSONB DEFAULT '{}',      -- 스타일 속성 (이전 style_rules)
  
  -- Metadata
  version INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  
  -- Audit
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_name CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
  CONSTRAINT valid_category CHECK (category IN ('general', 'ui', 'data', 'layout', 'custom'))
);

-- Indexes
CREATE INDEX idx_components_workspace ON components(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_components_category ON components(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_components_created_by ON components(created_by);
CREATE INDEX idx_components_tags ON components USING GIN (tags);
```

**속성 구조 정의**:
- **default_properties**: 블럭 타입의 기본 속성 (현재 코드베이스와 동일)
- **custom_properties**: 사용자가 정의한 커스텀 속성 (현재 코드베이스와 동일)
- **style_properties**: 스타일 관련 속성 (위치, 크기 제외한 색상, 폰트 등)

**Domain Mapping**:
- **Entity**: Component  
- **Aggregate Root**: Component Aggregate
- **Properties**: `id`, `name`, `defaultProperties`, `customProperties`, `styleProperties`

---

### 2. blocks 테이블 확장 (Visual Canvas Domain 수정)

기존 blocks 테이블에 컴포넌트 인스턴스 정보를 추가

```sql
-- 기존 blocks 테이블에 컴포넌트 관련 컬럼 추가
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES components(id);
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS style_overrides JSONB DEFAULT '{}';
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS block_subtype VARCHAR(50) DEFAULT 'regular';

-- 블럭 타입 제약조건 업데이트 (기존 + 새로운 타입들)
ALTER TABLE blocks ADD CONSTRAINT valid_block_type CHECK (
  type IN ('text', 'image', 'video', 'shape', 'page', 'component-instance')
);

-- 블럭 서브타입 제약조건 추가
ALTER TABLE blocks ADD CONSTRAINT valid_block_subtype CHECK (
  block_subtype IN ('regular', 'instance', 'page')
);

-- 컴포넌트 인스턴스용 인덱스 추가
CREATE INDEX idx_blocks_component_id ON blocks(component_id) WHERE component_id IS NOT NULL;
CREATE INDEX idx_blocks_subtype ON blocks(block_subtype);
CREATE INDEX idx_blocks_component_instance ON blocks(type, component_id) WHERE type = 'component-instance';
```

**블럭 타입 및 서브타입 정의**:
- **type**: `text`, `image`, `video`, `shape`, `page`, `component-instance` (렌더링 방식 결정)
- **block_subtype**: `regular`, `instance`, `page` (비즈니스 로직 분류)
- **component_id**: NULL이면 일반 블럭, 값이 있으면 컴포넌트 인스턴스
- **style_overrides**: 스타일 속성만 오버라이드 (JSON 경로와 값의 쌍)

**style_overrides 예시**:
```json
{
  "color": "#ff0000",           // 오버라이드된 색상
  "fontSize": "16px",           // 오버라이드된 폰트 크기
  "backgroundColor": "#f0f0f0"  // 오버라이드된 배경색
}
```

**Domain Mapping**:
- **Entity**: Block (확장)
- **Component Instance Logic**: `type='component-instance'` + `component_id IS NOT NULL`
- **Style Override**: `style_overrides` JSON 필드

---

## 🎯 렌더링 시점 데이터 조합 전략

### 프론트엔드에서의 인스턴스 렌더링

```typescript
// 컴포넌트 인스턴스 렌더링을 위한 데이터 조합
interface ComponentInstanceRenderData {
  // 블럭 기본 정보
  blockId: string;
  blockType: 'component-instance';
  
  // 컴포넌트 정보 (DB에서 조회)
  component: {
    id: string;
    name: string;
    defaultProperties: Record<string, any>;
    customProperties: Record<string, any>;
    styleProperties: Record<string, any>;
  };
  
  // 오버라이드 정보 (블럭에서 조회)
  styleOverrides: Record<string, any>;
  
  // 최종 렌더링 속성 (프론트에서 조합)
  finalProperties: Record<string, any>;
}

// 렌더링 시점에서 데이터 조합
function combineInstanceData(
  block: Block, 
  component: Component
): ComponentInstanceRenderData {
  return {
    blockId: block.id,
    blockType: 'component-instance',
    component: {
      id: component.id,
      name: component.name,
      defaultProperties: component.default_properties,
      customProperties: component.custom_properties,
      styleProperties: component.style_properties,
    },
    styleOverrides: block.style_overrides || {},
    // 최종 속성 = 컴포넌트 속성 + 스타일 오버라이드
    finalProperties: {
      ...component.default_properties,
      ...component.custom_properties,
      ...component.style_properties,
      ...block.style_overrides, // 스타일만 오버라이드
    }
  };
}
```

### 오버라이드 정책

1. **스타일 속성만 오버라이드**: 색상, 폰트, 배경 등
2. **위치/크기 제외**: `x`, `y`, `width`, `height`는 `block_page_positions`에서 관리
3. **기본/커스텀 속성 수정 시**: 오버라이드가 아닌 컴포넌트 자체 수정으로 처리

---

## 🔐 Row Level Security (RLS)

### Workspace-based Access Control

```sql
-- Enable RLS on components table
ALTER TABLE components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for components
CREATE POLICY "Users can view components in their accessible workspaces" ON components
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create components in their workspaces with write access" ON components
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Users can update components they created or have admin access" ON components
  FOR UPDATE USING (
    created_by = auth.uid() OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

---

## 📈 Performance Optimizations

### 1. Query Optimization

```sql
-- 컴포넌트 인스턴스 조회 최적화
CREATE INDEX idx_blocks_component_workspace ON blocks(component_id, page_id) 
  WHERE component_id IS NOT NULL AND deleted_at IS NULL;

-- 컴포넌트 라이브러리 조회 최적화  
CREATE INDEX idx_components_active ON components(workspace_id, created_at) 
  WHERE deleted_at IS NULL;

-- 스타일 오버라이드가 있는 인스턴스 조회
CREATE INDEX idx_blocks_style_overrides ON blocks 
  USING GIN (style_overrides) 
  WHERE style_overrides != '{}';
```

### 2. Materialized Views (단순화)

```sql
-- 컴포넌트 사용 통계 (단순화된 버전)
CREATE MATERIALIZED VIEW component_usage_stats AS
SELECT 
  c.id,
  c.name,
  c.workspace_id,
  COUNT(b.id) as instance_count,
  MAX(b.updated_at) as last_instance_update
FROM components c
LEFT JOIN blocks b ON c.id = b.component_id 
  AND b.deleted_at IS NULL 
  AND b.type = 'component-instance'
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name, c.workspace_id;

CREATE UNIQUE INDEX idx_component_usage_stats_id ON component_usage_stats(id);
CREATE INDEX idx_component_usage_stats_workspace ON component_usage_stats(workspace_id);
```

---

## 🔄 Migration Strategy (단순화)

### Phase 1: 기본 구조
1. Create `components` table
2. Add component-related columns to `blocks` table
3. Set up basic RLS policies

### Phase 2: 프론트엔드 통합
1. Implement frontend data combination logic
2. Create component rendering system
3. Add style override functionality

### Phase 3: 최적화
1. Create materialized views
2. Add performance indexes
3. Fine-tune queries

---

## 📊 Data Size Estimation (단순화)

**Assumptions**:
- 10,000 workspaces
- Average 50 components per workspace
- Average 100 instances per component (blocks with component_id)

**Estimated Data Volume**:
- `components`: 500K records (~50MB)
- `blocks` (component instances): 50M records (~5GB 추가)

**Total Estimated Size**: ~5GB (기존 blocks 테이블 대비 10% 증가)

---

## ✅ Simplified Schema Validation Checklist

- [x] **단순화된 테이블 구조**: 1개 핵심 테이블 (`components`) + `blocks` 확장
- [x] **프론트엔드 데이터 조합**: 렌더링 시점에서 컴포넌트 + 오버라이드 조합
- [x] **스타일만 오버라이드**: 복잡한 속성 추적 제거, 스타일만 JSON으로 저장
- [x] **블럭 타입/서브타입**: 렌더링 방식과 비즈니스 로직 분리
- [x] **성능 최적화**: 필요한 인덱스만 추가
- [x] **복잡한 동기화 제거**: 실시간 동기화 세션 추적 없음
- [x] **간단한 RLS**: 워크스페이스 기반 접근 제어만
- [x] **데이터 크기 최적화**: ~5GB (기존 대비 10% 증가)

---

## 🎯 핵심 단순화 요약

### ✅ 제거된 복잡성
- ~~`component_properties` 테이블~~ → `components` 컬럼으로 통합
- ~~`component_instances` 테이블~~ → `blocks` 확장으로 통합  
- ~~`instance_property_overrides` 테이블~~ → `blocks.style_overrides` JSON
- ~~`component_sync_sessions` 테이블~~ → 복잡한 동기화 로직 제거
- ~~`component_lifecycle_events` 테이블~~ → 단순한 CRUD로 충분

### ✅ 유지된 핵심 기능
- **컴포넌트 정의**: `components` 테이블에서 모든 속성 관리
- **인스턴스 생성**: `blocks` 테이블의 `component_id`로 관리
- **스타일 오버라이드**: `blocks.style_overrides` JSON으로 간단 저장
- **렌더링 조합**: 프론트엔드에서 실시간 데이터 조합

### ✅ 성능 및 단순성
- **테이블 수**: 6개 → 1개 + blocks 확장
- **데이터 크기**: ~14GB → ~5GB
- **복잡도**: 높음 → 낮음
- **유지보수성**: 어려움 → 쉬움
