# Database Schema: [Domain Name] Domain

## 🎯 개요

**도메인**: [Domain Name]  
**작성자**: 백엔드개발자 + DBA  
**작성일**: YYYY-MM-DD  
**버전**: v1.0

**Technical Specification 참조**: `05-technical-specification.md`  
**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**다음 단계**: 실제 마이그레이션 및 구현

---

> **작성 시점**: Technical Specification 완료 후, 실제 마이그레이션 작성 전  
> **목적**: DDD Aggregate를 데이터베이스 스키마로 전환, 성능 최적화 및 RLS 정책 정의

**기반 문서**: [Technical Specification](./05-technical-specification.md)

---

### 주요 변경사항 (v1.0)
- **초기 스키마 설계**: [주요 변경 내용 설명]
- **테이블 추가**: [추가된 테이블 목록]
- **인덱스 최적화**: [최적화된 쿼리 패턴]

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 범위**: [지원하는 Scenario 번호 및 설명]
2. **DDD Aggregate 경계 반영**: [Aggregate명] Aggregate의 불변식을 DB 제약조건으로 구현
3. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리
4. **MECE 구조**: 누락 없이, 중복 없이 명확한 경계
5. **성능 최적화**: Read Model 쿼리 패턴에 맞춘 인덱스 설계
6. **타입 안전성**: Drizzle ORM을 통한 타입 안전성 확보
7. **권한 기반 접근**: RLS 정책을 통한 데이터 접근 제어
8. **확장성**: 향후 기능 확장을 고려한 테이블 설계

### 테이블 관계도
```
[테이블 간 관계를 ASCII 다이어그램으로 표현]

┌─────────────────┐
│  [Table1]       │
│                 │
│ • id (PK)       │
│ • [field1]      │
│ • [field2]      │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│  [Table2]       │
│                 │
│ • id (PK)       │
│ • [table1_id]   │
│ • [field1]      │
└─────────────────┘
```

---

## 📋 Table Definitions

### 1. [enum_name] enum (public schema)

[enum의 목적 설명]

```sql
-- [enum_name] enum 정의
CREATE TYPE [enum_name] AS ENUM (
    '[VALUE_1]',      -- [설명]
    '[VALUE_2]',      -- [설명]
    '[VALUE_3]'       -- [설명]
);

-- Comments
COMMENT ON TYPE [enum_name] IS '[Domain Name] Domain - [enum 설명]';
COMMENT ON ENUM VALUE [enum_name].[VALUE_1] IS '[값 설명]';
COMMENT ON ENUM VALUE [enum_name].[VALUE_2] IS '[값 설명]';
COMMENT ON ENUM VALUE [enum_name].[VALUE_3] IS '[값 설명]';
```

---

### 2. [table_name] 테이블 (public schema)

[테이블의 목적 설명]

```sql
CREATE TABLE [table_name] (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- [Section Name] Fields
    [field1] TEXT NOT NULL,
    [field2] [enum_name] NOT NULL DEFAULT '[default_value]',
    [foreign_key_id] UUID NOT NULL REFERENCES [other_table](id) ON DELETE CASCADE,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- 소프트 삭제 (필요한 경우)
    
    -- Constraints
    CONSTRAINT [table_name]_[field]_not_empty CHECK (LENGTH(TRIM([field])) > 0),
    CONSTRAINT [table_name]_unique_[field] UNIQUE ([field1], [field2])
);

-- Indexes for Performance
CREATE INDEX idx_[table_name]_[field] ON [table_name]([field]);
CREATE INDEX idx_[table_name]_[composite] ON [table_name]([field1], [field2]);
CREATE INDEX idx_[table_name]_[partial] ON [table_name]([field]) WHERE [condition];

-- Comments
COMMENT ON TABLE [table_name] IS '[Domain Name] Domain - [테이블 설명]';
COMMENT ON COLUMN [table_name].id IS '[설명]';
COMMENT ON COLUMN [table_name].[field1] IS '[설명]';
COMMENT ON COLUMN [table_name].[field2] IS '[설명]';
COMMENT ON COLUMN [table_name].created_at IS '생성 시각';
COMMENT ON COLUMN [table_name].updated_at IS '수정 시각';
COMMENT ON COLUMN [table_name].deleted_at IS '삭제 시각 (소프트 삭제)';
```

> **💡 설계 노트**  
> [테이블 설계 시 고려사항이나 주의사항 설명]

---

## 🔒 Row Level Security (RLS) Policies

### 1. RLS 전략: [전략명]

**핵심 원칙**:
- ✅ **RLS**: [RLS 레이어의 역할 설명]
- ✅ **Application**: [Application 레이어의 역할 설명]
- ✅ **adminDb**: [adminDb 사용 시점 설명]

**참고**: [참고할 수 있는 Best Practice나 패턴]

### 2. RLS 활성화

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE [table1] ENABLE ROW LEVEL SECURITY;
ALTER TABLE [table2] ENABLE ROW LEVEL SECURITY;
ALTER TABLE [table3] ENABLE ROW LEVEL SECURITY;
```

### 3. [Table1] 테이블 RLS 정책

```sql
-- SELECT: [접근 권한 설명]
CREATE POLICY "Enable read access for [condition]" ON [table1]
    FOR SELECT TO [role]
    USING ([condition]);

-- INSERT: [접근 권한 설명]
CREATE POLICY "Enable insert for [condition]" ON [table1]
    FOR INSERT TO authenticated
    WITH CHECK ([condition]);

-- UPDATE: [접근 권한 설명]
CREATE POLICY "Enable update for [condition]" ON [table1]
    FOR UPDATE TO authenticated
    USING ([condition])
    WITH CHECK ([condition]);

-- DELETE: [접근 권한 설명]
CREATE POLICY "Enable delete for [condition]" ON [table1]
    FOR DELETE TO authenticated
    USING ([condition]);
```

**RLS 전략 설명**:
- **SELECT**: [SELECT 권한 설명]
- **INSERT/UPDATE/DELETE**: [변경 권한 설명]
- **특별한 케이스**: [특수한 권한 처리 방법]

**Application-level 권한 체크 예시**:
```typescript
// [Service명].method()
// Step 1: RLS로 기본 권한 확인
const data = await db.rls(...) // WHERE [condition]

// Step 2: Application-level 권한 체크
if ([permission_check]) {
  // Step 3: adminDb로 전체 데이터 조회 (RLS 우회)
  return await db.admin.select(...)
}
```

---

## 💼 비즈니스 로직 처리 방침

### SSOT(Single Source of Truth) 원칙
- **비즈니스 로직**: 애플리케이션 서버 코드에서 관리 (TypeScript/Node.js)
- **데이터베이스**: 단순한 데이터 저장소 역할 + 기본 제약조건만
- **PostgreSQL 함수**: 사용하지 않음 (유지보수성 및 테스트 용이성을 위해)

### Layered Security Model (선택적)

**1️⃣ RLS Layer (Defense in Depth)**
- 역할: [RLS의 역할]
- 정책: [적용되는 정책]
- 장점: [장점]

**2️⃣ Application Layer (Primary Authorization)**
- 역할: [Application Layer의 역할]
- 구현: [구현 방법]
- 예시: [구체적 예시]

**3️⃣ adminDb 사용 시점**
- [시점 1]: [설명]
- [시점 2]: [설명]
- 전제 조건: [adminDb 사용 전 확인사항]

---

## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략

```sql
-- [최적화 목적 1]
CREATE INDEX idx_[table]_[fields] ON [table]([field1], [field2]);

-- [최적화 목적 2]
CREATE INDEX idx_[table]_[field]_[condition] ON [table]([field]) WHERE [condition];

-- [최적화 목적 3]
CREATE INDEX idx_[table]_[composite] ON [table]([field1], [field2], [field3]);
```

### 2. 쿼리 성능 최적화

```sql
-- [자주 사용되는 쿼리 패턴 1]
CREATE INDEX idx_[table]_[pattern1] ON [table]([fields]) WHERE [condition];

-- [자주 사용되는 쿼리 패턴 2]
CREATE INDEX idx_[table]_[pattern2] ON [table]([fields]);

-- [정렬 최적화]
CREATE INDEX idx_[table]_[sort] ON [table]([field] DESC);
```

### 3. 읽기 최적화 뷰 (선택적)

```sql
-- [View 목적 설명]
CREATE VIEW [view_name] AS
SELECT 
    t1.[field1],
    t1.[field2],
    t2.[field1] as [alias]
FROM [table1] t1
LEFT JOIN [table2] t2 ON t1.id = t2.[foreign_key]
WHERE [condition];

-- Comments
COMMENT ON VIEW [view_name] IS '[Domain Name] Domain - [뷰 설명]';
```

---

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. [점검 항목 1] 확인
SELECT '[Issue description]' as issue, COUNT(*) as count
FROM [table]
WHERE [condition];

-- 2. [점검 항목 2] 확인
SELECT '[Issue description]' as issue, COUNT(*) as count
FROM [table]
WHERE [condition];

-- 3. [점검 항목 3] 확인
SELECT '[Issue description]' as issue, COUNT(*) as count
FROM (
    SELECT [field], COUNT(*) as [count]
    FROM [table]
    WHERE [condition]
    GROUP BY [field]
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
WHERE query LIKE '%[table]%'
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
WHERE tablename IN ('[table1]', '[table2]', '[table3]')
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
WHERE tablename IN ('[table1]', '[table2]', '[table3]')
ORDER BY idx_scan DESC;
```

---

## 🧹 데이터 정리 및 보관 정책 (선택적)

### 1. 소프트 삭제된 데이터 정리

```sql
-- [보관 기간] 경과한 삭제 데이터 영구 삭제
-- 주의: 이 작업은 애플리케이션 레벨에서 수행하거나, 별도 백그라운드 작업으로 실행해야 함
DELETE FROM [table]
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '[days] days';
```

### 2. 고아 데이터 정리

```sql
-- [조건]에 해당하는 고아 데이터 확인
SELECT [fields]
FROM [table1] t1
LEFT JOIN [table2] t2 ON t1.[fk] = t2.id
WHERE t2.id IS NULL;
```

---

## ✅ 검증 체크리스트

### Scenario 지원
- [ ] **[Scenario 1]**: [설명]
- [ ] **[Scenario 2]**: [설명]
- [ ] **[Scenario 3]**: [설명]
- [ ] **[추가 기능]**: [설명]

### 데이터 무결성
- [ ] **[제약조건 1]**: [설명]
- [ ] **[제약조건 2]**: [설명]
- [ ] **[제약조건 3]**: [설명]
- [ ] **FK 관계**: 모든 외래키가 올바르게 설정됨
- [ ] **Unique 제약**: 중복 방지가 필요한 필드에 제약 설정
- [ ] **Check 제약**: 비즈니스 규칙이 DB 레벨에서 검증됨
- [ ] **Enum 타입**: 타입 안전성 확보
- [ ] **RLS 보안**: 적절한 접근 제어 정책 적용

### 성능 최적화
- [ ] **핵심 인덱스**: 주요 조회 패턴에 인덱스 적용
- [ ] **복합 인덱스**: 자주 사용되는 조합 쿼리 최적화
- [ ] **부분 인덱스**: 조건부 인덱스로 저장 공간 절약
- [ ] **정렬 인덱스**: 정렬이 필요한 쿼리 최적화
- [ ] **통합 뷰**: 복잡한 조인 쿼리 최적화 (선택적)

### 아키텍처 일관성
- [ ] **DDD 원칙**: Aggregate 경계와 DB 스키마 일치
- [ ] **단일 책임**: 각 테이블이 명확한 역할
- [ ] **확장성**: 향후 추가 기능 확장 가능한 구조
- [ ] **타입 안전성**: Drizzle ORM과 TypeScript 타입 일치
- [ ] **이벤트 기반 설계**: 도메인 이벤트 발행을 위한 구조 지원
- [ ] **CQRS 지원**: Command와 Query 분리를 위한 구조

---

## 🔗 도메인 간 통합

### [Other Domain 1]과의 통합
- **[table].[field]**: [연동 설명]
- **[관계 설명]**: [상세 설명]

### [Other Domain 2]과의 통합
- **[table].[field]**: [연동 설명]
- **[관계 설명]**: [상세 설명]

---

## 📚 References

### 관련 문서
- [Software Design](./03-software-design.md) - [Aggregate명] 정의 및 Read Model
- [Process Model](./02-process-model.md) - Scenario 상세 프로세스
- [Event Storming](./01-event-storm.md) - 도메인 이벤트 및 명령
- [Technical Specification](./05-technical-specification.md) - 구현 가이드 및 TDD 순서

### 외부 참조
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📝 작성 가이드

### 작성 시 주의사항
1. **테이블 설계**: Software Design의 Aggregate와 일치하도록 설계
2. **인덱스 전략**: Read Model 쿼리 패턴 분석 후 인덱스 추가
3. **RLS 정책**: 최소 권한 원칙 적용, 복잡한 로직은 Application Layer에서 처리
4. **주석**: 모든 테이블, 컬럼, enum에 의미 있는 주석 추가
5. **제약조건**: 비즈니스 규칙을 DB 제약조건으로 구현
6. **마이그레이션**: Drizzle ORM으로 생성할 수 있는 형태로 작성

### 템플릿 사용 순서
1. **개요 작성**: 도메인, 작성자, 버전 정보 입력
2. **테이블 관계도**: ASCII 다이어그램으로 테이블 간 관계 표현
3. **Enum 정의**: 필요한 enum 타입 정의
4. **테이블 정의**: 각 테이블의 컬럼, 제약조건, 인덱스 정의
5. **RLS 정책**: 테이블별 접근 권한 정책 정의
6. **성능 최적화**: 주요 쿼리 패턴에 맞춘 인덱스 추가
7. **모니터링**: 정기 점검 쿼리 작성
8. **검증**: 체크리스트 확인

---

이 데이터베이스 스키마는 [Domain Name] Domain의 [Scenario 범위]를 완전히 지원하며, [주요 기능]을 제공합니다. DDD 원칙과 성능 최적화, 보안을 모두 고려한 설계로 확장 가능하고 유지보수하기 쉬운 구조를 제공합니다.

