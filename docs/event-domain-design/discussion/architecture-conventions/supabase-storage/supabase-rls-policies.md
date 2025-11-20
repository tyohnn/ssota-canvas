# Supabase Storage RLS Policies 설정 가이드

## 📋 개요

Supabase Storage의 Row Level Security (RLS) 정책 설정 가이드입니다.

---

## 🚀 Phase 1: 간단한 정책 (현재)

개발 초기 단계에서는 인증된 사용자라면 누구나 접근 가능하도록 설정합니다.

### 1. INSERT Policy (파일 업로드)

**Supabase Dashboard 설정**:
```
Policy name: Authenticated users can upload to canvas-assets
Allowed operation: ✓ INSERT
Target roles: authenticated
Policy definition:
```

```sql
bucket_id = 'canvas-assets'
```

### 2. SELECT Policy (파일 접근/다운로드)

**Supabase Dashboard 설정**:
```
Policy name: Authenticated users can access canvas-assets
Allowed operation: ✓ SELECT
Target roles: authenticated
Policy definition:
```

```sql
bucket_id = 'canvas-assets'
```

### 3. DELETE Policy (파일 삭제)

**Supabase Dashboard 설정**:
```
Policy name: Authenticated users can delete from canvas-assets
Allowed operation: ✓ DELETE
Target roles: authenticated
Policy definition:
```

```sql
bucket_id = 'canvas-assets'
```

### 4. UPDATE Policy (파일 수정) - Optional

**Supabase Dashboard 설정**:
```
Policy name: Authenticated users can update canvas-assets
Allowed operation: ✓ UPDATE
Target roles: authenticated
Policy definition:
```

```sql
bucket_id = 'canvas-assets'
```

---

## 🔒 Phase 2: Organization 기반 정책 (프로덕션)

실제 프로덕션 환경에서는 Organization 단위로 접근을 제한해야 합니다.

### 전제 조건

JWT Token에 `org_id`가 포함되어 있어야 합니다:

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "org_id": "org_123",
  "role": "authenticated"
}
```

### 1. INSERT Policy (조직별 업로드)

```sql
-- Policy name: Users can upload to their org's folder
-- Allowed operation: INSERT
-- Target roles: authenticated

bucket_id = 'canvas-assets' AND
(storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
```

**설명**:
- `storage.foldername(name)`: 파일 경로를 `/`로 분리한 배열 반환
  - 예: `images/org_123/ws_456/file.jpg` → `['images', 'org_123', 'ws_456', 'file.jpg']`
- `[1]`: 배열의 두 번째 요소 (org_id)
- `auth.jwt() ->> 'org_id'`: JWT에서 org_id 추출
- 조건: 업로드하려는 폴더의 org_id가 사용자의 org_id와 일치해야 함

### 2. SELECT Policy (조직별 접근)

```sql
-- Policy name: Users can access their org's files
-- Allowed operation: SELECT
-- Target roles: authenticated

bucket_id = 'canvas-assets' AND
(storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
```

### 3. DELETE Policy (조직별 삭제)

```sql
-- Policy name: Users can delete their org's files
-- Allowed operation: DELETE
-- Target roles: authenticated

bucket_id = 'canvas-assets' AND
(storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
```

### 4. Path 구조 업데이트

Organization 기반 정책을 사용하려면 path가 다음과 같아야 합니다:

```
images/{orgId}/{workspaceId}/{pageId}/{blockId}/{timestamp}-{uuid}.{ext}
       ^^^^^^^
       이 부분이 JWT의 org_id와 일치해야 함
```

---

## 🔄 Migration: Phase 1 → Phase 2

### 단계별 전환

**1. JWT에 org_id 추가**

```typescript
// Supabase Auth Hook or Custom Claims
const session = await supabase.auth.getSession();
// Ensure session.user.app_metadata.org_id exists
```

**2. Context Hook 구현**

```typescript
// apps/web/src/domains/canvas-management/frontend/hooks/use-canvas-context.ts

export function useCanvasContext() {
  const { orgId, workspaceId } = /* get from URL or state */;
  const { pageId } = /* get from canvas state */;
  
  return { orgId, workspaceId, pageId };
}
```

**3. useSupabaseStorage에 context 전달**

```typescript
const { orgId, workspaceId, pageId } = useCanvasContext();

await upload({
  bucket: StorageBucket.CANVAS_ASSETS,
  file,
  orgId,
  workspaceId,
  pageId,
  blockId,
});
```

**4. RLS Policy 업데이트**

기존 정책 삭제하고 Organization 기반 정책으로 교체

---

## 🧪 테스트

### Phase 1 정책 테스트

```typescript
// Test 1: 인증된 사용자는 업로드 가능
const { data, error } = await supabase.storage
  .from('canvas-assets')
  .upload('temp/test.jpg', file);

console.log(error); // Should be null

// Test 2: 익명 사용자는 업로드 불가
await supabase.auth.signOut();
const { data, error } = await supabase.storage
  .from('canvas-assets')
  .upload('temp/test.jpg', file);

console.log(error); // Should have "not authorized" error
```

### Phase 2 정책 테스트

```typescript
// Test 1: 자신의 org에는 업로드 가능
const { data, error } = await supabase.storage
  .from('canvas-assets')
  .upload('images/org_123/test.jpg', file);
// org_123 = current user's org_id

console.log(error); // Should be null

// Test 2: 다른 org에는 업로드 불가
const { data, error } = await supabase.storage
  .from('canvas-assets')
  .upload('images/org_456/test.jpg', file);
// org_456 = different org

console.log(error); // Should have "policy violation" error
```

---

## 🎯 권장 사항

### 현재 (개발 중)
✅ **Phase 1 정책 사용** (간단한 정책)
- 빠른 개발 및 테스트
- 인증된 사용자만 접근
- temp 폴더 사용

### 프로덕션 출시 전
🔜 **Phase 2 정책으로 전환** (Organization 기반)
- 보안 강화
- 조직별 데이터 격리
- 실제 path 구조 사용

---

## 📝 SQL 스크립트 (복사용)

### Phase 1: 간단한 정책

```sql
-- INSERT Policy
CREATE POLICY "Authenticated users can upload to canvas-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'canvas-assets');

-- SELECT Policy
CREATE POLICY "Authenticated users can access canvas-assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'canvas-assets');

-- DELETE Policy
CREATE POLICY "Authenticated users can delete from canvas-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'canvas-assets');
```

### Phase 2: Organization 기반 정책

```sql
-- INSERT Policy
CREATE POLICY "Users can upload to their org's folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'canvas-assets' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

-- SELECT Policy
CREATE POLICY "Users can access their org's files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'canvas-assets' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);

-- DELETE Policy
CREATE POLICY "Users can delete their org's files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'canvas-assets' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'org_id'
);
```

---

## 🔍 디버깅

### 에러: "new row violates row-level security policy"

**원인**:
- INSERT policy가 설정되지 않았거나
- Policy 조건이 false를 반환함

**해결**:
1. Policy가 존재하는지 확인
2. Target roles에 `authenticated` 선택 확인
3. Policy definition이 올바른지 확인
4. 사용자가 인증되었는지 확인

### Policy 디버깅

```sql
-- 현재 사용자의 JWT 확인
SELECT auth.jwt();

-- 현재 사용자의 org_id 확인
SELECT auth.jwt() ->> 'org_id';

-- Storage objects 확인
SELECT * FROM storage.objects WHERE bucket_id = 'canvas-assets';
```

---

## 📖 관련 문서

- [Supabase Storage Strategy](./supabase-storage-strategy.md)
- [Storage Implementation Guide](./storage-implementation-guide.md)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

