# DTO Serialization Guide - Next.js Server Actions & Domain Models

## 🎯 문제 정의

Next.js의 Server Actions와 Client Components 간 데이터 전달 시, **클래스 인스턴스나 복잡한 객체는 직렬화할 수 없습니다**.

```typescript
// ❌ 이렇게 하면 에러 발생
export async function getOrganization() {
  return new OrganizationId("org_123");  // Error: Classes cannot be serialized
}

// ✅ 이렇게 해야 함
export async function getOrganization() {
  return { id: "org_123" };  // OK: Plain object
}
```

## 🏗️ 설계 원칙

### CQRS의 Read/Write 분리

```
┌─────────────────────────────────────────────────────────┐
│              WRITE SIDE (Command)                       │
│  • Value Objects (클래스)                                │
│  • Entities (클래스)                                     │
│  • Aggregates (클래스)                                   │
│  • 비즈니스 로직 & 불변식 검증                            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              READ SIDE (Query)                          │
│  • Read Models (interface, plain object)                │
│  • DTOs (interface, plain object)                       │
│  • 데이터 투영 & 최적화된 조회                            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│         Next.js Server Actions (Boundary)               │
│  • DTO 직렬화 (클래스 → plain object)                    │
│  • Date → ISO string 변환                               │
│  • 클라이언트 전달용 타입 보장                            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│            Client Components                            │
│  • Plain objects만 사용                                  │
│  • Date는 string으로 처리                                │
└─────────────────────────────────────────────────────────┘
```

## 📝 구현 패턴

### 1. Read Models는 처음부터 Plain Object로 정의

```typescript
// ✅ 좋은 설계: Read Model을 DTO로 정의
// apps/web/src/domains/user-management/shared/events/index.ts

export interface OrganizationSummary {
  id: string;                    // ❌ OrganizationId 클래스 대신
  name: string;
  isDefault: boolean;
  createdAt: string;             // ❌ Date 대신 ISO 8601 string
}

export interface UserProfileView {
  userId: string;                // ❌ UserId 클래스 대신
  email: string;
  name: string;
  defaultOrganization: {
    id: string;                  // ❌ OrganizationId 클래스 대신
    name: string;
  };
  createdAt: string;             // ❌ Date 대신 ISO 8601 string
}
```

### 2. Repository에서 직렬화 수행

```typescript
// apps/web/src/domains/user-management/backend/read-models/user-profile.view.ts

export class DrizzleUserProfileViewRepository {
  async getByUserId(userId: UserId): Promise<UserProfileView | null> {
    const db = await createDrizzleSupabaseClient();
    
    const userProfile = await db.rls(tx =>
      tx.query.profiles.findFirst({
        where: eq(profiles.user_id, userId.value),
      })
    );

    if (!userProfile) return null;

    const defaultOrg = await db.rls(tx =>
      tx.query.organizations.findFirst({
        where: eq(organizations.owner_id, userId.value),
      })
    );

    // ✅ 직렬화: 클래스 → plain object
    return {
      userId: userProfile.user_id,                    // string (이미 직렬화됨)
      email: userProfile.email,
      name: userProfile.name || 'User',
      defaultOrganization: {
        id: defaultOrg.id,                            // string (이미 직렬화됨)
        name: defaultOrg.name,
      },
      createdAt: new Date(userProfile.created_at).toISOString(),  // Date → ISO string
    };
  }
}
```

### 3. Service에서 직렬화 수행

```typescript
// apps/web/src/domains/user-management/backend/services/user-management.service.ts

async getUserOrganizations(
  command: GetUserOrganizationsCommand
): Promise<Result<OrganizationSummary[], UserManagementError>> {
  const organizations = await this.organizationRepository.findByOwnerId(
    new UserId(command.userId)
  );

  // ✅ 직렬화: Aggregate → DTO
  const summaries: OrganizationSummary[] = organizations.map(org => ({
    id: org.id.value,                                // OrganizationId → string
    name: org.entity.name,
    isDefault: org.entity.isDefault,
    createdAt: org.entity.createdAt.toISOString(),   // Date → ISO string
  }));

  return Result.success(summaries);
}
```

### 4. Server Actions는 DTO를 그대로 반환

```typescript
// apps/web/src/domains/user-management/actions/user-management.actions.ts

export async function getUserOrganizationsAction(): Promise<OrganizationSummary[]> {
  const result = await service.getUserOrganizations(command);
  
  if (result.isError()) {
    throw new Error(result.error.message);
  }

  // ✅ 이미 직렬화된 DTO를 그대로 반환
  return result.value;  // OrganizationSummary[] (plain objects)
}
```

## 🔄 직렬화 체크리스트

### Value Objects 직렬화
```typescript
// ❌ 클래스 인스턴스
const userId: UserId = new UserId("user_123");
const orgId: OrganizationId = new OrganizationId("org_456");

// ✅ Plain string
const userId: string = userId.value;
const orgId: string = orgId.value;
```

### Date 직렬화
```typescript
// ❌ Date 객체
const createdAt: Date = new Date();

// ✅ ISO 8601 string
const createdAt: string = new Date().toISOString();
// 결과: "2025-10-03T16:30:00.000Z"
```

### 중첩 객체 직렬화
```typescript
// ❌ 중첩된 클래스
interface OrganizationDetail {
  id: OrganizationId;
  owner: {
    id: UserId;
    email: UserEmail;
  };
}

// ✅ 중첩된 plain object
interface OrganizationDetail {
  id: string;
  owner: {
    id: string;
    email: string;
  };
}
```

## 🎨 네이밍 컨벤션

### DTO 타입 명명
```typescript
// Pattern 1: 직접 DTO 명시 (명확함)
export interface UserProfileDTO { ... }
export interface OrganizationSummaryDTO { ... }

// Pattern 2: View/Summary 접미사 (CQRS 스타일) - 우리가 선택한 방식
export interface UserProfileView { ... }      // ✅ Read Model을 DTO로 사용
export interface OrganizationSummary { ... }  // ✅ Read Model을 DTO로 사용
```

### 주석으로 의도 명확히
```typescript
// ============================================
// DTOs for Client-Server Communication
// ============================================
// These are plain objects that can be serialized across the Next.js boundary

export interface OrganizationSummary {
  id: string;                    // Serialized from OrganizationId
  name: string;
  createdAt: string;             // ISO 8601 string (serialized from Date)
}
```

## ⚠️ 일반적인 실수

### 실수 1: Repository에서 Value Object 반환
```typescript
// ❌ 나쁜 예
async getByUserId(userId: UserId): Promise<UserProfileView> {
  return {
    userId: new UserId(data.user_id),  // ❌ 클래스 반환
    createdAt: new Date(data.created_at),  // ❌ Date 객체 반환
  };
}

// ✅ 좋은 예
async getByUserId(userId: UserId): Promise<UserProfileView> {
  return {
    userId: data.user_id,              // ✅ string 반환
    createdAt: new Date(data.created_at).toISOString(),  // ✅ ISO string 반환
  };
}
```

### 실수 2: Actions에서 Aggregate 직접 반환
```typescript
// ❌ 나쁜 예
export async function createOrganization() {
  const result = await service.createOrganization(command);
  return result.value;  // OrganizationAggregate (클래스!)
}

// ✅ 좋은 예
export async function createOrganization() {
  const result = await service.createOrganization(command);
  return {
    id: result.value.id.value,           // 직렬화
    name: result.value.entity.name,
    createdAt: result.value.entity.createdAt.toISOString(),
  };
}
```

### 실수 3: 불필요한 중복 변환
```typescript
// ❌ 나쁜 예: Service에서 이미 직렬화했는데 Action에서 또 변환
// Service
return summaries.map(org => ({
  id: org.id.value,  // 직렬화
}));

// Action
return result.value.map(org => ({
  id: org.id.value,  // ❌ 이미 string인데 또 .value 호출
}));

// ✅ 좋은 예: Service에서 한 번만 직렬화
// Service
return summaries.map(org => ({
  id: org.id.value,  // 직렬화
}));

// Action
return result.value;  // ✅ 그대로 반환
```

## 📊 레이어별 책임

| 레이어 | 사용 타입 | 직렬화 책임 | 예시 |
|--------|-----------|-------------|------|
| **Domain** | Value Objects, Entities | ❌ 없음 | `UserId`, `OrganizationAggregate` |
| **Repository (Read)** | DTO (plain object) | ✅ **여기서 수행** | `UserProfileView` 반환 |
| **Service** | DTO (plain object) | ✅ **여기서 수행** | `OrganizationSummary[]` 반환 |
| **Server Actions** | DTO (plain object) | ❌ 이미 직렬화됨 | 그대로 반환 |
| **Client** | DTO (plain object) | ❌ 없음 | `UserProfileView` 사용 |

## 🔍 타입 검증

TypeScript를 활용하여 직렬화 가능 여부를 컴파일 타임에 체크:

```typescript
// Helper type: 직렬화 가능한 타입만 허용
type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | Serializable[] 
  | { [key: string]: Serializable };

// DTO는 Serializable만 허용
type DTO<T> = T extends Serializable ? T : never;

// 사용 예
export interface OrganizationSummary extends DTO<{
  id: string;
  name: string;
  createdAt: string;
}> {}
```

## ✅ 검증 체크리스트

### Server Action 작성 시
- [ ] 반환 타입이 plain object인가?
- [ ] Value Objects를 `.value`로 직렬화했는가?
- [ ] Date를 `.toISOString()`로 변환했는가?
- [ ] 중첩 객체도 모두 plain object인가?

### Read Model 정의 시
- [ ] interface로 정의했는가? (class 아님)
- [ ] 모든 필드가 primitive 또는 plain object인가?
- [ ] 주석으로 직렬화 의도를 명확히 했는가?

### Repository 구현 시
- [ ] 반환 시 Value Objects를 string으로 변환했는가?
- [ ] 반환 시 Date를 ISO string으로 변환했는가?

## 📚 참고자료

- [Next.js Server Actions - Serialization](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations#serialization)
- [DDD - CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [DTO Pattern](https://martinfowler.com/eaaCatalog/dataTransferObject.html)

---

**핵심 원칙**: Read Side (Query)는 클라이언트 친화적인 plain object로, Write Side (Command)는 도메인 모델로 유지하여 CQRS의 이점을 극대화합니다.

