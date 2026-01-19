# Read Model Pattern Guide

## 📋 개요

Read Model 패턴은 CQRS (Command Query Responsibility Segregation)의 Query Side를 구현하는 패턴입니다. Use Case에 최적화된 조회 전용 모델을 별도로 관리하여 성능과 확장성을 향상시킵니다.

## 🎯 언제 사용하는가?

### ✅ 사용하는 경우

1. **Use Case에 최적화된 조회가 필요할 때**
   - 여러 도메인의 데이터를 JOIN하여 조회
   - 특정 화면/기능에 최적화된 데이터 구조 필요

2. **자주 사용되는 조회 패턴**
   - Share 도메인의 Workspace 선택 UI
   - User Profile View (프로필 + 기본 조직 정보)

3. **성능 최적화가 중요한 경우**
   - 복잡한 JOIN 쿼리
   - 대량 데이터 조회

### ❌ 사용하지 않는 경우

1. **단순한 Entity 조회**
   - Repository의 `findById`, `findAll` 등으로 충분한 경우

2. **Write와 Read가 동일한 구조**
   - Entity 구조 그대로 사용해도 되는 경우

3. **일회성 조회**
   - 특정 Use Case에서만 사용되고 재사용되지 않는 경우

## 🏗️ 아키텍처 패턴

### 패턴 1: Read Model (추천)

```typescript
// apps/web/src/domains/workspace-management/backend/read-models/workspace-selection.view.ts

export interface WorkspaceSelectionView {
  id: string;
  name: string;
  icon?: string;
  organization: {
    id: string;
    name: string;
    // 나중에 필요하면 여기에 추가 가능
  } | null;
}

export class DrizzleWorkspaceSelectionViewRepository {
  async getByUserId(userId: UserId): Promise<WorkspaceSelectionView[]> {
    // Use Case에 최적화된 단일 쿼리
    const result = await adminDb
      .select({
        workspace: workspaces,
        organization: organizations,
      })
      .from(workspaces)
      .leftJoin(workspaceMembers, ...)
      .leftJoin(organizations, ...)
      .where(...)
      .orderBy(...);

    return result.map(row => ({
      id: row.workspace.id,
      name: row.workspace.name,
      icon: row.workspace.icon ?? undefined,
      organization: row.organization ? {
        id: row.organization.id,
        name: row.organization.name,
      } : null,
    }));
  }
}
```

**장점:**
- Use Case에 최적화된 구조
- 확장 용이 (organization 객체에 필드 추가)
- Repository는 Aggregate만 관리 (책임 분리)
- 도메인 경계 명확

**단점:**
- 코드 중복 가능성 (Repository와 유사한 로직)
- 테스트 복잡도 증가 (두 레이어 모두 테스트 필요)
- Write/Read 일관성 문제 가능 (캐싱 시)

### 패턴 2: Repository에서 JOIN (비추천)

```typescript
// ❌ 나쁜 예: Repository가 Use Case에 종속됨
async findByUserIdWithOrganization(
  userId: UserId
): Promise<Array<{ workspace: Workspace; organizationName: string | null }>> {
  // 특정 Use Case에 종속된 메서드
}
```

**문제점:**
- Repository 책임 과다 (Use Case에 종속)
- 확장성 문제 (필드 추가 시 메서드 증가)
- 도메인 경계 위반

### 패턴 3: Query Service에서 조합

```typescript
// 각 도메인의 Repository를 호출하여 조합
const workspaces = await workspaceRepository.findByUserId(userId);
const orgIds = workspaces.map(w => w.organizationId);
const organizations = await organizationRepository.findByIds(orgIds);
```

**장점:**
- 도메인 경계 명확
- 각 Repository는 자신의 Aggregate만 관리

**단점:**
- N+1 문제 가능성 (배치 조회 필요)
- 성능 이슈 가능 (네트워크 왕복 증가)

## 📊 성능 최적화

### JOIN vs 별도 쿼리

#### JOIN 방식 (추천)

```typescript
// 1번의 쿼리로 모든 데이터 조회
workspaces 
  LEFT JOIN workspaceMembers 
  LEFT JOIN organizations
```

**장점:**
- 네트워크 왕복 1회
- 쿼리 파싱 1회
- 실행 계획 최적화 가능
- 데이터 전송량 최소화

**단점:**
- 데이터가 매우 클 때 중간 결과가 커질 수 있음

#### 별도 쿼리 방식

```typescript
// 1. Workspaces 조회
const workspaces = await getWorkspaces();

// 2. Organization IDs 수집
const orgIds = [...new Set(workspaces.map(w => w.organizationId))];

// 3. Organizations 조회
const organizations = await getOrganizations(orgIds);
```

**장점:**
- 캐싱 가능 (Organizations는 자주 변경되지 않음)
- 병렬 처리 가능

**단점:**
- 네트워크 왕복 2-3회
- 쿼리 파싱 2-3회
- 성능 저하 가능

**결론:** 일반적으로 JOIN 방식이 더 효율적입니다. 데이터가 수만 건 이상일 때만 별도 쿼리 고려.

### 인덱스 최적화

Read Model 쿼리에 최적화된 인덱스를 추가합니다.

```sql
-- Read Model 쿼리 최적화 인덱스
CREATE INDEX idx_workspaces_owner_id 
  ON workspaces(owner_id) 
  WHERE deleted_at IS NULL AND owner_id IS NOT NULL;

CREATE INDEX idx_workspaces_selection_sort 
  ON workspaces(is_default DESC, created_at ASC) 
  WHERE deleted_at IS NULL;

CREATE INDEX idx_workspace_members_workspace_user 
  ON workspace_members(workspace_id, user_id);
```

**주의사항:**
- Write 성능 저하 (INSERT/UPDATE/DELETE 시 인덱스 업데이트)
- 저장 공간 증가
- 인덱스 관리 복잡도 증가

## 🔄 데이터 흐름

```
Action → Query Service → Read Model → DB
```

각 레이어의 책임:
- **Action**: 인증/검증, Service/Query Service 호출
- **Query Service**: Repository 호출, DTO 변환
- **Read Model**: Use Case에 최적화된 데이터 조회
- **DB**: 데이터 저장

## 📝 구현 가이드

### 1. Read Model 생성

```typescript
// apps/web/src/domains/[domain]/backend/read-models/[view-name].view.ts

export interface [ViewName]View {
  // Use Case에 최적화된 구조
  id: string;
  // ...
}

export class Drizzle[ViewName]ViewRepository {
  async getBy[Key](key: Key): Promise<[ViewName]View[]> {
    // Use Case에 최적화된 단일 쿼리
  }
}
```

### 2. Query Service에서 사용

```typescript
// apps/web/src/domains/[domain]/backend/services/queries/[query-name].ts

import { Drizzle[ViewName]ViewRepository } from '../../read-models/[view-name].view';

export async function [queryFunction](
  params: Params
): Promise<Result<DTO[], Error>> {
  const viewRepository = new Drizzle[ViewName]ViewRepository();
  const views = await viewRepository.getBy[Key](key);
  
  // Read Model View를 DTO로 변환
  return Result.success(views.map(view => ({
    // DTO 변환
  })));
}
```

### 3. Action에서 사용

```typescript
// apps/web/src/domains/[domain]/actions/[action-name].ts

import { [queryFunction] } from '@/domains/[domain]/backend/services';

export async function [actionName](
  params: Params
): Promise<DTO> {
  const result = await [queryFunction](params);
  
  if (result.isError()) {
    return handleError(result.error);
  }
  
  return result.value;
}
```

## ⚠️ 주의사항

### 1. 코드 중복 방지

- Repository와 Read Model의 유사한 로직을 정기적으로 리팩토링
- 공통 쿼리 로직은 유틸리티 함수로 추출

### 2. 테스트 전략

- Read Model 단위 테스트
- Query Service 통합 테스트
- End-to-End 테스트

### 3. 일관성 관리

- Write 후 Read Model 캐싱 무효화
- 이벤트 기반 동기화 고려 (필요 시)

## 📚 참고 사례

### User Profile View

```typescript
// apps/web/src/domains/user-management/backend/read-models/user-profile.view.ts

export interface UserProfileView {
  userId: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  defaultOrganization: {
    id: string;
    name: string;
  };
  // ...
}
```

**사용처:** 사용자 프로필과 기본 조직 정보를 함께 조회

### Workspace Selection View

```typescript
// apps/web/src/domains/workspace-management/backend/read-models/workspace-selection.view.ts

export interface WorkspaceSelectionView {
  id: string;
  name: string;
  icon?: string;
  organization: {
    id: string;
    name: string;
  } | null;
}
```

**사용처:** Share 도메인에서 Workspace 선택 UI

## 🔗 관련 문서

- [Server-Side DDD Conventions](./server-side-ddd-conventions.md)
- [Database Migration Guide](../../../apps/web/DB_MIGRATION_WORKFLOW.md)
