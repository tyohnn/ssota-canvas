# Performance Optimization: Caching Strategy Discussion

## 📋 문서 정보

- **작성일**: 2025-01-XX
- **상태**: Discussion (미구현)
- **관련 도메인**: block-management, canvas-management, organization-management
- **우선순위**: Medium (트래픽 증가 시 적용)

---

## 🎯 개요

현재 `updateBlockPropertyAction`의 성능 분석 결과, **Defense in Depth** 보안 전략으로 인해 총 **6-7회의 DB 호출**이 발생합니다. 

**현재 상태**:
- ✅ Optimistic Update로 사용자는 0ms 지연 체감
- ✅ 백그라운드 동기화 26-38ms (충분히 빠름)
- ✅ Phase 1 (Low Hanging Fruit) 적용 완료 (7회 → 6회)
- ⚠️ 권한 캐싱 미적용

**목표**: 
- 캐싱 전략을 통해 DB 호출을 **6회 → 3회**로 감소 (50% 성능 향상)
- 예상 레이턴시: 26-38ms → **13-18ms**

---

## 📊 현재 DB 호출 분석

### 호출 순서 및 캐싱 가능성

```typescript
// 1. 인증 확인 (auth.users)
getAuthenticatedUser() 
  → Supabase Auth
  ✅ 캐싱 가능: Session 기반 (Supabase 자체 캐싱)

// 2. 조직 멤버십 확인 (organization_members)
verifyOrganizationMembership()
  → DB 조회 (orgId, userId → role)
  ✅ 캐싱 가능: 짧은 TTL (30-60초)

// 3. 워크스페이스 조회 (workspaces)
verifyWorkspaceAccess()
  → DB 조회 (workspaceId → isDefault)
  ✅ 캐싱 가능: 중간 TTL (5-10분, 거의 변경 안됨)

// 4. 워크스페이스 멤버십 확인 (workspace_members) - 조건부
verifyWorkspaceAccess()
  → DB 조회 (workspaceId, userId → isMember)
  ✅ 캐싱 가능: 짧은 TTL (30-60초)

// 5. 블록 조회 (blocks)
blockRepository.findById()
  → DB 조회 (blockId → block + workspaceId 확인)
  ❌ 캐싱 불가: 실시간 변경 가능 (속성 업데이트)

// 6. 블록 업데이트 (blocks)
blockRepository.update()
  → DB 쓰기
  ❌ 캐싱 불가: Write Operation
```

---

## 🚀 Phase 2: 권한 캐싱 전략

### 캐싱 대상

1. **조직 멤버십** (organization_members)
2. **워크스페이스 메타데이터** (workspaces)
3. **워크스페이스 멤버십** (workspace_members)

### 캐싱 불가능 대상

- ❌ **블록 데이터**: 실시간 변경이 빈번함
- ❌ **블록 업데이트**: Write Operation

---

## 🏗️ Redis 캐싱 아키텍처

### Key 구조

```typescript
// 1. 조직 멤버십
Key: `perm:org:${userId}:${orgId}`
Value: { role: 'owner' | 'admin' | 'member', cachedAt: timestamp }
TTL: 60초

// 2. 워크스페이스 메타데이터
Key: `workspace:${workspaceId}`
Value: { isDefault: boolean, organizationId: string, name: string, cachedAt: timestamp }
TTL: 600초 (10분)

// 3. 워크스페이스 멤버십
Key: `perm:ws:${userId}:${workspaceId}`
Value: { isMember: boolean, cachedAt: timestamp }
TTL: 60초

// 4. 통합 권한 (최적화)
Key: `perm:full:${userId}:${orgId}:${workspaceId}`
Value: { hasAccess: boolean, orgRole: MemberRole, cachedAt: timestamp }
TTL: 60초
```

### 캐시 무효화 전략

```typescript
// Event-Driven Cache Invalidation

// 1. 조직 멤버 추가/제거/역할 변경 시
organizationMemberUpdated(event) {
  // 해당 사용자의 모든 조직 권한 캐시 무효화
  redis.del(`perm:org:${event.userId}:${event.orgId}`);
  redis.del(`perm:full:${event.userId}:${event.orgId}:*`); // pattern
}

// 2. 워크스페이스 멤버 추가/제거 시
workspaceMemberUpdated(event) {
  // 해당 사용자의 워크스페이스 권한 캐시 무효화
  redis.del(`perm:ws:${event.userId}:${event.workspaceId}`);
  redis.del(`perm:full:${event.userId}:*:${event.workspaceId}`); // pattern
}

// 3. 워크스페이스 메타데이터 변경 시
workspaceUpdated(event) {
  // 워크스페이스 메타데이터 캐시 무효화
  redis.del(`workspace:${event.workspaceId}`);
}
```

---

## 💻 구현 예시

### 1. Redis Client 설정

```typescript
// lib/redis/client.ts
import { Redis } from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      },
    });
  }
  return redisClient;
}
```

### 2. 캐시 래퍼 함수

```typescript
// domains/common/cache/permission-cache.ts
import { getRedisClient } from '@/lib/redis/client';
import type { MemberRole, MemberRoleOrNull } from '@/domains/organization-management/shared/types';

interface CachedOrgPermission {
  role: MemberRoleOrNull;
  cachedAt: number;
}

interface CachedWorkspacePermission {
  isMember: boolean;
  cachedAt: number;
}

interface CachedFullPermission {
  hasAccess: boolean;
  orgRole: MemberRole;
  cachedAt: number;
}

/**
 * 조직 멤버십 캐시 조회
 */
export async function getCachedOrgPermission(
  userId: string,
  orgId: string
): Promise<CachedOrgPermission | null> {
  try {
    const redis = getRedisClient();
    const key = `perm:org:${userId}:${orgId}`;
    const cached = await redis.get(key);
    
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('[getCachedOrgPermission] Error:', error);
    return null; // 캐시 실패 시 DB로 폴백
  }
}

/**
 * 조직 멤버십 캐시 저장
 */
export async function setCachedOrgPermission(
  userId: string,
  orgId: string,
  role: MemberRoleOrNull,
  ttl: number = 60
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `perm:org:${userId}:${orgId}`;
    const value: CachedOrgPermission = {
      role,
      cachedAt: Date.now(),
    };
    
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('[setCachedOrgPermission] Error:', error);
    // 캐시 저장 실패는 무시 (DB가 SSOT)
  }
}

/**
 * 통합 권한 캐시 조회 (최적화)
 */
export async function getCachedFullPermission(
  userId: string,
  orgId: string,
  workspaceId: string
): Promise<CachedFullPermission | null> {
  try {
    const redis = getRedisClient();
    const key = `perm:full:${userId}:${orgId}:${workspaceId}`;
    const cached = await redis.get(key);
    
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('[getCachedFullPermission] Error:', error);
    return null;
  }
}

/**
 * 통합 권한 캐시 저장
 */
export async function setCachedFullPermission(
  userId: string,
  orgId: string,
  workspaceId: string,
  hasAccess: boolean,
  orgRole: MemberRole,
  ttl: number = 60
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `perm:full:${userId}:${orgId}:${workspaceId}`;
    const value: CachedFullPermission = {
      hasAccess,
      orgRole,
      cachedAt: Date.now(),
    };
    
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('[setCachedFullPermission] Error:', error);
  }
}

/**
 * 사용자의 모든 권한 캐시 무효화
 */
export async function invalidateUserPermissions(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const pattern = `perm:*:${userId}:*`;
    
    // SCAN을 사용하여 안전하게 삭제
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('[invalidateUserPermissions] Error:', error);
  }
}
```

### 3. 캐싱이 적용된 verifyAccess

```typescript
// domains/common/auth/helpers.ts (수정)
import {
  getCachedFullPermission,
  setCachedFullPermission,
} from '@/domains/common/cache/permission-cache';

export async function verifyAccessWithCache(
  organizationId: string,
  workspaceId: string,
  userId: string
): Promise<AccessVerificationResult> {
  // 1. 캐시 확인
  const cached = await getCachedFullPermission(userId, organizationId, workspaceId);
  
  if (cached) {
    console.log('[verifyAccessWithCache] Cache hit');
    return {
      success: cached.hasAccess,
      error: cached.hasAccess ? undefined : 'NOT_ORG_MEMBER', // cached에 error 정보도 저장할 수 있음
      orgRole: cached.orgRole,
    };
  }

  console.log('[verifyAccessWithCache] Cache miss - fetching from DB');

  // 2. 캐시 미스: DB에서 조회
  const result = await verifyAccess(organizationId, workspaceId, userId);

  // 3. 결과 캐싱 (성공한 경우만)
  if (result.success && result.orgRole) {
    await setCachedFullPermission(
      userId,
      organizationId,
      workspaceId,
      true,
      result.orgRole,
      60 // TTL: 60초
    );
  }

  return result;
}
```

---

## 📈 예상 성능 개선

### Before (캐싱 전)

```
1. Supabase Auth          ~5ms
2. Organization Member    ~3ms  ← 캐싱 가능
3. Workspace 조회         ~3ms  ← 캐싱 가능
4. Workspace Member       ~3ms  ← 캐싱 가능
5. Block 조회             ~3ms
6. Block 업데이트         ~5ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 레이턴시: 22-26ms
+ 네트워크: 10-20ms
= 32-46ms
```

### After (캐싱 후)

```
1. Supabase Auth          ~5ms
2-4. 캐시 조회            ~1ms  ← Redis (in-memory)
5. Block 조회             ~3ms
6. Block 업데이트         ~5ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 레이턴시: 14-16ms
+ 네트워크: 10-20ms
= 24-36ms (약 30% 개선)
```

---

## ⚠️ 트레이드오프 및 고려사항

### 장점

1. **성능 향상**: DB 호출 3회 감소 (50% 감소)
2. **DB 부하 감소**: 빈번한 권한 체크가 DB에 부담 X
3. **확장성**: 트래픽 증가에도 안정적

### 단점

1. **복잡도 증가**:
   - Redis 인프라 추가 필요
   - 캐시 무효화 로직 관리

2. **캐시 불일치 위험** (Eventual Consistency):
   - TTL 내에 권한 변경 시 최대 60초 지연
   - 완화 방법: Event-driven 캐시 무효화

3. **메모리 비용**:
   - Redis 서버 운영 비용
   - 완화 방법: 작은 데이터 크기 (권한 정보만)

### 실리콘밸리 표준

- ✅ **Notion**: Redis 권한 캐싱 사용
- ✅ **Linear**: GraphQL + in-memory 캐싱
- ✅ **Figma**: Room 단위 권한 (WebSocket session)

**대부분의 기업이 권한 캐싱을 사용합니다.**

---

## 🎯 적용 시점 권장사항

### 즉시 적용 X (현재 상태로 충분)

- ✅ Optimistic Update로 UX 문제 없음
- ✅ 30-45ms 응답 시간은 충분히 빠름
- ✅ 프로덕션 배포 가능 수준

### 적용 고려 시점

1. **동시 접속 사용자 > 100명**
2. **평균 응답 시간 > 100ms**
3. **DB CPU 사용률 > 70%**
4. **권한 체크 쿼리가 Slow Query Log에 빈번히 등장**

### 모니터링 메트릭

```typescript
// Prometheus / Datadog 메트릭 예시
- api_latency_ms{action="updateBlockProperty", percentile="p95"}
- db_query_count{table="organization_members", operation="select"}
- db_cpu_usage_percent
- cache_hit_rate{cache_type="permission"}
```

---

## 🚀 적용 로드맵

### Phase 2: 권한 캐싱 (트래픽 증가 시)

**작업 항목**:
1. Redis 인프라 설정
2. 캐시 래퍼 함수 구현
3. `verifyAccessWithCache` 구현
4. 캐시 무효화 이벤트 핸들러 구현
5. 모니터링 대시보드 구축
6. A/B 테스트 (캐싱 O vs X)

**예상 소요 시간**: 1-2주
**난이도**: ⭐⭐

---

## 📚 참고 자료

### 실리콘밸리 Best Practices

- [Notion Engineering Blog - Caching Strategy](https://notion.engineering)
- [Linear - GraphQL Caching](https://linear.app/blog)
- [Redis Best Practices - Permission Caching](https://redis.io/docs/manual/patterns/)

### 관련 논의

- `/docs/event-domain-design/discussion/server-side-ddd-conventions.md`
- `/docs/event-domain-design/discussion/repository-discussion.md`

---

## ✅ 결론

**현재 상태**: 프로덕션 배포 가능 ✅

**권장사항**: 
- Phase 1 (Low Hanging Fruit) 완료 ✅
- Phase 2 (권한 캐싱)은 트래픽 모니터링 후 결정
- "Premature optimization is the root of all evil" 원칙 준수

**Next Steps**:
1. 프로덕션 배포
2. 모니터링 메트릭 수집
3. 사용자 증가 추이 관찰
4. 필요시 Phase 2 적용

