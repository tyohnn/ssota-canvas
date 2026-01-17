# Database Migration Validation Guide

## 📋 개요

마이그레이션을 dev 브랜치에서 테스트했지만, main 브랜치의 다양한 데이터와 복잡한 케이스로 인해 실패하는 문제를 방지하기 위한 검증 가이드입니다.

## 🎯 문제 상황

- **Dev 브랜치**: 데이터가 적어서 마이그레이션 통과
- **Main 브랜치**: 다양한 데이터와 복잡한 케이스로 인해 마이그레이션 실패
- **원인**: 모든 엣지 케이스를 미리 생각하기 어려움

## ✅ 마이그레이션 검증 체크리스트

### 기본 검증 항목

1. **NULL 값 체크**
   - NOT NULL 제약조건 추가 전 NULL 값 존재 여부 확인
   - 소프트 삭제된 데이터의 NULL 처리

2. **중복 데이터 체크 (UNIQUE 제약조건)**
   - 단일 컬럼 중복
   - 복합 키 중복
   - 부분 UNIQUE 제약조건 위반 (WHERE 조건 포함)

3. **외래키 무결성 체크**
   - 참조하는 레코드가 존재하는지 확인
   - CASCADE 동작 확인

4. **데이터 타입 호환성 체크**
   - 컬럼 타입 변경 시 기존 데이터 호환성
   - ENUM 값 변경 시 기존 데이터 호환성

### 추가 검증 항목

5. **CHECK 제약조건 위반**
   - 범위 검증 (예: `position_x >= -999999`)
   - 형식 검증 (예: 정규식 패턴)
   - 길이 제한 (예: `LENGTH(name) <= 100`)
   - 논리적 제약 (예: `NOT (is_default = true AND deletable = true)`)

6. **부분 UNIQUE 제약조건 위반**
   - WHERE 조건이 포함된 UNIQUE 제약조건
   - 예: `UNIQUE (organization_id, is_default) WHERE is_default = true`

7. **NOT NULL 제약조건 추가 시**
   - NULL 값 존재 여부 확인
   - 소프트 삭제된 데이터의 NULL 처리

8. **ENUM 타입 변경/추가 시**
   - 기존 데이터가 새 ENUM 값과 호환되는지
   - 사용 중인 ENUM 값 목록 확인

9. **JSON/JSONB 구조 변경 시**
   - JSON 스키마 호환성
   - 필수 필드 존재 여부
   - 타입 불일치

10. **소프트 삭제된 데이터 처리**
    - `deleted_at IS NULL` 조건이 있는 인덱스/제약조건
    - 소프트 삭제된 데이터와의 충돌

11. **부분 인덱스 조건 위반**
    - 인덱스 조건과 데이터 일치 여부
    - 조건 변경 시 기존 데이터 영향

12. **순환 참조 가능성**
    - 자기 참조 순환 (예: `pages.parent_id`)
    - 깊이 제한 위반

13. **기본값 호환성**
    - 기존 NULL 값 처리
    - 기본값 타입 호환성

14. **컬럼 삭제 시 의존성**
    - 인덱스 의존성
    - 제약조건 의존성
    - 애플리케이션 코드 의존성

15. **외래키 CASCADE 동작 확인**
    - CASCADE로 인한 예상치 못한 삭제
    - SET NULL로 인한 NULL 값 증가

## 🛠️ 검증 스크립트 예시

### Pre-Migration Validation

```sql
-- scripts/migration-pre-check.sql
-- 마이그레이션 적용 전 실행하여 데이터 상태 확인

-- 1. NULL 값이 있는지 확인
SELECT 
  'workspaces.owner_id' as column_name,
  COUNT(*) as null_count
FROM workspaces 
WHERE owner_id IS NULL AND deleted_at IS NULL;

-- 2. 제약조건 위반 가능성 확인
SELECT 
  'duplicate_default_workspaces' as issue,
  organization_id,
  COUNT(*) as count
FROM workspaces
WHERE is_default = true AND deleted_at IS NULL
GROUP BY organization_id
HAVING COUNT(*) > 1;

-- 3. 외래키 무결성 확인
SELECT 
  'orphaned_workspaces' as issue,
  COUNT(*) as count
FROM workspaces w
LEFT JOIN organizations o ON w.organization_id = o.id
WHERE w.deleted_at IS NULL AND o.id IS NULL;

-- 4. 데이터 타입 호환성 확인
SELECT 
  'invalid_order_format' as issue,
  COUNT(*) as count
FROM pages
WHERE "order" !~ '^[a-zA-Z0-9]+$' 
  AND deleted_at IS NULL;
```

### Safe Migration Template

```sql
-- templates/safe-migration-template.sql
-- 마이그레이션 작성 시 이 템플릿을 따라 작성

-- ============================================
-- Migration: [설명]
-- ============================================
-- 
-- Pre-migration Checks:
-- 1. [ ] NULL 값 체크
-- 2. [ ] 중복 데이터 체크 (UNIQUE 제약조건)
-- 3. [ ] 외래키 무결성 체크
-- 4. [ ] 데이터 타입 호환성 체크
-- 5. [ ] CHECK 제약조건 위반 (범위, 형식, 길이)
-- 6. [ ] 부분 UNIQUE 제약조건 위반 (WHERE 조건)
-- 7. [ ] NOT NULL 제약조건 추가 시 NULL 값 존재
-- 8. [ ] ENUM 타입 호환성
-- 9. [ ] JSON/JSONB 구조 검증
-- 10. [ ] 소프트 삭제된 데이터 처리 (deleted_at)
-- 11. [ ] 부분 인덱스 조건 위반
-- 12. [ ] 순환 참조 가능성
-- 13. [ ] 기본값 호환성
-- 14. [ ] 컬럼 삭제 시 의존성
-- 15. [ ] 외래키 CASCADE 동작 확인
--
-- Rollback Strategy:
-- [롤백 방법 설명]
--
-- ============================================

-- Step 1: Pre-migration validation
DO $$
DECLARE
  validation_error TEXT;
BEGIN
  -- Check 1: NULL values
  IF EXISTS (
    SELECT 1 FROM [table] 
    WHERE [condition] AND [column] IS NULL
  ) THEN
    validation_error := 'NULL values found in [column]';
    RAISE EXCEPTION '%', validation_error;
  END IF;
  
  -- Check 2: Duplicates
  IF EXISTS (
    SELECT 1 FROM [table]
    GROUP BY [columns]
    HAVING COUNT(*) > 1
  ) THEN
    validation_error := 'Duplicate values found';
    RAISE EXCEPTION '%', validation_error;
  END IF;
  
  -- Check 3: Foreign key integrity
  IF EXISTS (
    SELECT 1 FROM [table] t
    LEFT JOIN [referenced_table] r ON t.[fk_column] = r.[pk_column]
    WHERE t.[condition] AND r.[pk_column] IS NULL
  ) THEN
    validation_error := 'Orphaned records found';
    RAISE EXCEPTION '%', validation_error;
  END IF;
  
  -- ... 추가 검증 로직
  
END $$;

-- Step 2: Safe migration (transactional)
BEGIN;
  -- Migration logic here
  -- ...
COMMIT;

-- Step 3: Post-migration validation
DO $$
BEGIN
  -- Verify migration success
  IF NOT EXISTS (
    SELECT 1 FROM [table] WHERE [expected_state]
  ) THEN
    RAISE EXCEPTION 'Migration validation failed';
  END IF;
END $$;
```

## 🔄 워크플로우

### 1. 마이그레이션 작성 전

```bash
# Pre-check 스크립트 실행
psql $DEV_DB_URL < scripts/migration-pre-check.sql
```

### 2. 마이그레이션 작성

- 템플릿 사용
- 검증 로직 포함
- 롤백 전략 명시

### 3. 로컬 테스트

```bash
# 빈 DB로 테스트
pnpm supabase:reset
```

### 4. Dev 테스트

```bash
# Main 데이터 샘플을 Dev에 복사 후 테스트
# (복잡한 케이스 포함)
```

### 5. CI/CD 검증

```yaml
# .github/workflows/migration-validation.yml
- name: Run migration validation
  run: |
    pnpm run migration:pre-check
    supabase migration up
    pnpm run migration:post-check
```

## 📊 실제 사례

### 사례 1: NOT NULL 제약조건 추가

```sql
-- ❌ 나쁜 예: 검증 없이 바로 NOT NULL 추가
ALTER TABLE edges ALTER COLUMN source_handle SET NOT NULL;
-- → NULL 값이 있으면 실패

-- ✅ 좋은 예: 검증 후 안전하게 추가
-- Step 1: NULL 값 확인 및 처리
UPDATE edges 
SET source_handle = 'left' 
WHERE source_handle IS NULL;

-- Step 2: 검증
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM edges WHERE source_handle IS NULL) THEN
    RAISE EXCEPTION 'NULL values still exist';
  END IF;
END $$;

-- Step 3: NOT NULL 제약조건 추가
ALTER TABLE edges ALTER COLUMN source_handle SET NOT NULL;
```

### 사례 2: 부분 UNIQUE 제약조건

```sql
-- ❌ 나쁜 예: 중복 확인 없이 제약조건 추가
ALTER TABLE workspaces 
  ADD CONSTRAINT workspaces_unique_default 
  UNIQUE (organization_id, is_default) 
  WHERE is_default = true;
-- → 중복된 default workspace가 있으면 실패

-- ✅ 좋은 예: 중복 확인 후 처리
-- Step 1: 중복 확인
SELECT organization_id, COUNT(*) 
FROM workspaces
WHERE is_default = true AND deleted_at IS NULL
GROUP BY organization_id
HAVING COUNT(*) > 1;

-- Step 2: 중복 제거 (비즈니스 로직에 따라)
UPDATE workspaces 
SET is_default = false 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
      ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at) as rn
    FROM workspaces
    WHERE is_default = true AND deleted_at IS NULL
  ) t WHERE rn > 1
);

-- Step 3: 제약조건 추가
ALTER TABLE workspaces 
  ADD CONSTRAINT workspaces_unique_default 
  UNIQUE (organization_id, is_default) 
  WHERE is_default = true;
```

## 🚨 자주 발생하는 실패 케이스

### 1. 소프트 삭제된 데이터

```sql
-- 문제: deleted_at IS NULL 조건이 있는 인덱스/제약조건
-- 해결: 소프트 삭제된 데이터도 고려
WHERE deleted_at IS NULL OR deleted_at IS NOT NULL
```

### 2. 부분 인덱스 조건

```sql
-- 문제: 인덱스 조건과 데이터 불일치
-- 해결: 인덱스 조건 변경 전 데이터 확인
SELECT COUNT(*) FROM workspaces 
WHERE is_personal = true AND deleted_at IS NULL AND owner_id IS NULL;
```

### 3. ENUM 값 변경

```sql
-- 문제: 기존 데이터가 새 ENUM 값과 호환되지 않음
-- 해결: 사용 중인 ENUM 값 확인
SELECT DISTINCT status FROM invitations;
```

## 📚 참고 문서

- [DB Migration Workflow](../../../apps/web/DB_MIGRATION_WORKFLOW.md)
- [Read Model Pattern Guide](./read-model-pattern-guide.md)
