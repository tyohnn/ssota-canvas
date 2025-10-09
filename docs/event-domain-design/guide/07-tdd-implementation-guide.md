# TDD 기반 실제 구현 가이드

이 문서는 **Technical Specification**을 기반으로 **TDD 사이클**을 적용하여 실제 코드를 구현하는 프로세스를 설명합니다. 주니어 개발자가 단계별로 따라할 수 있도록 작성되었습니다.

**작성 시점**: Technical Specification 완료 후, 실제 코드 작성 시작  
**목적**: RED-GREEN-REFACTOR 사이클을 실전에 적용하는 방법 학습

---

## 🎯 TDD 기본 원칙

### TDD 사이클 (RED-GREEN-REFACTOR)

```
1. 🔴 RED: 실패하는 테스트 작성
   ↓
2. 🟢 GREEN: 테스트를 통과하는 최소 코드 작성
   ↓
3. 🔵 REFACTOR: 코드 개선 (테스트는 여전히 통과)
   ↓
   반복 →
```

### 핵심 규칙

1. **테스트 없이 코드를 작성하지 않는다**
2. **실패하는 테스트를 먼저 본다** (RED 확인)
3. **테스트를 통과하는 최소 코드만 작성한다**
4. **리팩토링 시 테스트가 깨지면 안 된다**
5. **커밋 전 모든 테스트를 실행한다**

---

## 🚀 실전 구현 프로세스

### Phase별 구현 순서 (Technical Specification 참조)

```markdown
Phase 1: Value Objects (⭐️⭐️⭐️⭐️⭐️)
Phase 2: Entities (⭐️⭐️⭐️⭐️⭐️)
Phase 3: Aggregates (⭐️⭐️⭐️⭐️⭐️)
Phase 4: Repository (⭐️⭐️⭐️⭐️)
Phase 5: Service (⭐️⭐️⭐️⭐️)
Phase 6: Server Actions (⭐️⭐️⭐️⭐️⭐️)
Phase 7: E2E Tests (⭐️⭐️⭐️⭐️⭐️)
```

---

## 📝 Phase 1: Value Objects 구현

### 1.1 준비 단계

**Technical Specification 확인**:
```typescript
// 구현 수도코드
class UserEmail {
  constructor(email: string) {
    // 1. 빈 값 검증
    // 2. 이메일 형식 검증
    // 3. 길이 제한 검증
  }
}

// 테스트 수도코드
describe('UserEmail', () => {
  it('유효한 이메일로 생성', () => {
    // Given: 'test@example.com'
    // When: new UserEmail(email)
    // Then: userEmail.value === email
  })
})
```

### 1.2 TDD 사이클 적용

#### Step 1: 🔴 RED - 실패하는 테스트 작성

```bash
# 1. 테스트 파일 생성
cd apps/web
mkdir -p src/domains/user-management/shared/value-objects/__tests__
touch src/domains/user-management/shared/value-objects/__tests__/user-email.test.ts
```

```typescript
// user-email.test.ts
import { describe, it, expect } from 'vitest';
import { UserEmail } from '../user-email.vo';
import { UserManagementError } from '../../errors/user-management.error';

describe('UserEmail Value Object', () => {
  describe('생성자', () => {
    it('유효한 이메일 주소로 생성되어야 한다', () => {
      // Given
      const validEmail = 'test@example.com';

      // When
      const userEmail = new UserEmail(validEmail);

      // Then
      expect(userEmail.value).toBe(validEmail);
    });

    it('잘못된 이메일 형식에 대해 예외를 발생시켜야 한다', () => {
      // Given
      const invalidEmail = 'invalid-email';

      // When & Then
      expect(() => new UserEmail(invalidEmail)).toThrow(UserManagementError);
      expect(() => new UserEmail(invalidEmail)).toThrow('Invalid email format');
    });
  });
});
```

```bash
# 2. 테스트 실행 (실패 확인)
pnpm test user-email.test.ts

# 예상 결과: ❌ FAIL
# - UserEmail 클래스를 찾을 수 없음
```

#### Step 2: 🟢 GREEN - 최소 구현

```bash
# 1. 구현 파일 생성
touch src/domains/user-management/shared/value-objects/user-email.vo.ts
```

```typescript
// user-email.vo.ts (최소 구현)
import { UserManagementError } from '../errors/user-management.error';

export class UserEmail {
  constructor(public readonly value: string) {
    // 최소한의 검증
    if (!value || value.trim().length === 0) {
      throw new UserManagementError(
        'INVALID_EMAIL_FORMAT',
        'Invalid email format'
      );
    }
    
    // 간단한 이메일 정규식
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new UserManagementError(
        'INVALID_EMAIL_FORMAT',
        'Invalid email format'
      );
    }
  }
}
```

```bash
# 2. 테스트 실행 (통과 확인)
pnpm test user-email.test.ts

# 예상 결과: ✅ PASS
```

#### Step 3: 🔵 REFACTOR - 코드 개선

```typescript
// user-email.vo.ts (리팩토링)
import { UserManagementError } from '../errors/user-management.error';

export class UserEmail {
  private static readonly MAX_LENGTH = 255;
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(public readonly value: string) {
    this.validate(value);
  }

  private validate(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new UserManagementError(
        'INVALID_EMAIL_FORMAT',
        'Email cannot be empty'
      );
    }

    if (email.length > UserEmail.MAX_LENGTH) {
      throw new UserManagementError(
        'INVALID_EMAIL_FORMAT',
        `Email cannot exceed ${UserEmail.MAX_LENGTH} characters`
      );
    }

    if (!UserEmail.EMAIL_REGEX.test(email)) {
      throw new UserManagementError(
        'INVALID_EMAIL_FORMAT',
        'Invalid email format'
      );
    }
  }

  equals(other: UserEmail): boolean {
    return this.value === other.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }
}
```

```bash
# 3. 리팩토링 후 테스트 실행
pnpm test user-email.test.ts

# 예상 결과: ✅ PASS (여전히 통과!)
```

#### Step 4: 추가 테스트 케이스 작성

```typescript
// user-email.test.ts (추가 테스트)
describe('UserEmail Value Object', () => {
  // ... 기존 테스트 ...

  it('255자를 초과하는 이메일은 거부해야 한다', () => {
    // Given
    const longEmail = 'a'.repeat(250) + '@example.com';

    // When & Then
    expect(() => new UserEmail(longEmail)).toThrow(UserManagementError);
  });

  describe('equals', () => {
    it('동일한 이메일은 같다고 판단되어야 한다', () => {
      // Given
      const email1 = new UserEmail('test@example.com');
      const email2 = new UserEmail('test@example.com');

      // When & Then
      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe('getDomain', () => {
    it('이메일에서 도메인을 추출해야 한다', () => {
      // Given
      const email = new UserEmail('user@example.com');

      // When
      const domain = email.getDomain();

      // Then
      expect(domain).toBe('example.com');
    });
  });
});
```

```bash
# 4. 전체 테스트 실행
pnpm test user-email.test.ts

# 예상 결과: ✅ PASS (모든 테스트 통과)
```

#### Step 5: 커밋

```bash
# 1. 커버리지 확인
pnpm test:coverage user-email.test.ts

# 목표: Value Objects 95% 이상

# 2. Git 커밋
git add src/domains/user-management/shared/value-objects/user-email.vo.ts
git add src/domains/user-management/shared/value-objects/__tests__/user-email.test.ts
git commit -m "test(user-email): add UserEmail value object with TDD

- Implement email validation logic
- Add comprehensive test cases
- Achieve 95%+ coverage for Value Object"
```

---

## 📝 Phase 2: Entities 구현

### 2.1 Entity 테스트 작성 (RED)

```typescript
// user.entity.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '../user.entity';
import { UserId } from '../value-objects/ids.vo';
import { UserEmail } from '../value-objects/user-email.vo';

describe('User Entity', () => {
  let userId: UserId;
  let userEmail: UserEmail;

  beforeEach(() => {
    userId = new UserId('user-123');
    userEmail = new UserEmail('test@example.com');
  });

  describe('생성', () => {
    it('모든 필수 속성으로 생성되어야 한다', () => {
      // Given
      const name = 'Test User';
      const avatarUrl = 'https://example.com/avatar.jpg';

      // When
      const user = new User(userId, userEmail, name, avatarUrl, new Date(), new Date());

      // Then
      expect(user.id).toBe(userId);
      expect(user.email).toBe(userEmail);
      expect(user.name).toBe(name);
      expect(user.avatarUrl).toBe(avatarUrl);
    });

    it('createdAt과 updatedAt이 같아야 한다', () => {
      // Given
      const now = new Date();

      // When
      const user = new User(userId, userEmail, 'Test User', null, now, now);

      // Then
      expect(user.createdAt.getTime()).toBe(user.updatedAt.getTime());
    });
  });

  describe('updateProfile', () => {
    it('프로필 업데이트 시 updatedAt이 갱신되어야 한다', () => {
      // Given
      const user = new User(userId, userEmail, 'Old Name', null, new Date(), new Date());
      const originalUpdatedAt = user.updatedAt;

      // 시간 차이를 만들기 위해 약간 대기
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // When
      user.updateProfile('New Name', 'new-avatar.jpg');

      // Then
      expect(user.name).toBe('New Name');
      expect(user.avatarUrl).toBe('new-avatar.jpg');
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('createdAt은 변경되지 않아야 한다', () => {
      // Given
      const user = new User(userId, userEmail, 'Old Name', null, new Date(), new Date());
      const originalCreatedAt = user.createdAt;

      // When
      user.updateProfile('New Name', 'new-avatar.jpg');

      // Then
      expect(user.createdAt).toBe(originalCreatedAt);
    });
  });
});
```

```bash
# 테스트 실행 (실패)
pnpm test user.entity.test.ts
# ❌ FAIL: User 클래스 없음
```

### 2.2 Entity 구현 (GREEN)

```typescript
// user.entity.ts
import { UserId } from '../value-objects/ids.vo';
import { UserEmail } from '../value-objects/user-email.vo';

export class User {
  constructor(
    public readonly id: UserId,
    public readonly email: UserEmail,
    public name: string,
    public avatarUrl: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  updateProfile(name: string, avatarUrl: string | null): void {
    this.name = name;
    this.avatarUrl = avatarUrl;
    this.updatedAt = new Date();
  }

  updateEmail(email: UserEmail): void {
    // 타입을 readonly로 선언했으므로 실제로는 재할당 불가
    // 새로운 User 인스턴스를 생성하거나 설계 재검토 필요
    (this as any).email = email;
    this.updatedAt = new Date();
  }
}
```

```bash
# 테스트 실행 (통과)
pnpm test user.entity.test.ts
# ✅ PASS
```

---

## 📝 Phase 3: Aggregates 구현

### 3.1 Aggregate 테스트 작성 (RED)

```typescript
// user.aggregate.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { UserAggregate } from '../user.aggregate';
import { UserProfileCreatedEvent, UserUpdatedEvent } from '../../events';

describe('UserAggregate', () => {
  let validSupabaseUser: any;

  beforeEach(() => {
    validSupabaseUser = {
      id: 'user_123456789',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
  });

  describe('createFromSupabaseAuth', () => {
    it('유효한 Supabase User로부터 생성되어야 한다', () => {
      // When
      const aggregate = UserAggregate.createFromSupabaseAuth(validSupabaseUser);

      // Then
      expect(aggregate.user.id.value).toBe(validSupabaseUser.id);
      expect(aggregate.user.email.value).toBe(validSupabaseUser.email);
      expect(aggregate.user.name).toBe(validSupabaseUser.user_metadata.name);
    });

    it('이메일이 없으면 예외를 발생시켜야 한다', () => {
      // Given
      const userWithoutEmail = { ...validSupabaseUser, email: undefined };

      // When & Then
      expect(() => {
        UserAggregate.createFromSupabaseAuth(userWithoutEmail);
      }).toThrow();
    });
  });
});
```

### 3.2 Aggregate 구현 (GREEN)

```typescript
// user.aggregate.ts
import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/ids.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { UserProfileCreatedEvent, UserUpdatedEvent } from '../events';
import { UserManagementError } from '../errors/user-management.error';

export class UserAggregate {
  private _events: DomainEvent[] = [];

  constructor(private _user: User) {}

  static createFromSupabaseAuth(supabaseUser: any): UserAggregate {
    if (!supabaseUser.email) {
      throw new UserManagementError(
        'SUPABASE_AUTH_FAILED',
        'Email is required'
      );
    }

    const user = new User(
      new UserId(supabaseUser.id),
      new UserEmail(supabaseUser.email),
      supabaseUser.user_metadata?.name || 'User',
      supabaseUser.user_metadata?.avatar_url || null,
      new Date(supabaseUser.created_at || Date.now()),
      new Date(supabaseUser.updated_at || Date.now())
    );

    const aggregate = new UserAggregate(user);
    
    aggregate.addEvent(new UserProfileCreatedEvent(
      user.id.value,
      user.email.value,
      user.name,
      new Date()
    ));

    return aggregate;
  }

  updateFromSupabaseAuth(supabaseUser: any): UserUpdatedEvent {
    const newName = supabaseUser.user_metadata?.name || this._user.name;
    const newAvatarUrl = supabaseUser.user_metadata?.avatar_url || this._user.avatarUrl;

    this._user.updateProfile(newName, newAvatarUrl);

    const event = new UserUpdatedEvent(
      this._user.id.value,
      newName,
      newAvatarUrl,
      new Date()
    );

    this.addEvent(event);
    return event;
  }

  get user(): User {
    return this._user;
  }

  get id(): UserId {
    return this._user.id;
  }

  get entity(): User {
    return this._user;
  }

  private addEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._events];
  }

  clearEvents(): void {
    this._events = [];
  }
}
```

---

## 📝 Phase 4-7: 동일한 패턴 적용

각 Phase마다 동일한 TDD 사이클을 적용합니다:

### Phase 4: Repository (통합 테스트)
1. Repository 인터페이스 테스트 작성 (RED)
2. Drizzle 구현체 작성 (GREEN)
3. 쿼리 최적화 (REFACTOR)

### Phase 5: Service (통합 테스트)
1. Service 메서드 테스트 작성 (RED)
2. 비즈니스 로직 구현 (GREEN)
3. 트랜잭션 처리 개선 (REFACTOR)

### Phase 6: Server Actions (통합 테스트)
1. Server Actions 테스트 작성 (RED)
2. 인증 및 Service 호출 구현 (GREEN)
3. 에러 처리 개선 (REFACTOR)

### Phase 7: E2E Tests
1. 사용자 시나리오 테스트 작성 (RED)
2. UI + 전체 플로우 구현 (GREEN)
3. UX 개선 (REFACTOR)

---

## ✅ 체크리스트

### 각 TDD 사이클마다

- [ ] **RED 확인**: 테스트가 실패하는 것을 직접 확인했는가?
- [ ] **GREEN 확인**: 테스트가 통과하는가?
- [ ] **REFACTOR 후 통과**: 리팩토링 후에도 모든 테스트가 통과하는가?
- [ ] **커밋**: 각 사이클 후 의미있는 커밋을 했는가?

### Phase 완료 시

- [ ] **커버리지 목표**: Testing Strategy의 목표를 달성했는가?
- [ ] **모든 테스트 통과**: 전체 테스트 스위트가 통과하는가?
- [ ] **린터 에러 없음**: ESLint, TypeScript 에러가 없는가?
- [ ] **문서 업데이트**: Technical Specification을 실제 구현으로 업데이트했는가?

---

## 💡 실무 팁

### 1. 테스트 먼저의 이점 체감하기

**Before TDD**:
```
구현 → 버그 발견 → 수정 → 또 버그 → 수정 → ...
(불확실성 높음)
```

**After TDD**:
```
테스트 → 구현 → 통과 → 리팩토링 → 여전히 통과!
(확신을 가지고 개발)
```

### 2. 작은 단계로 나누기

❌ **나쁜 예**: 한 번에 전체 클래스 구현
```typescript
// 모든 메서드를 한 번에 구현
class UserEmail {
  validate() { ... }
  equals() { ... }
  getDomain() { ... }
  toString() { ... }
  // ... 10개 메서드
}
```

✅ **좋은 예**: 하나씩 TDD 사이클
```typescript
// 1차: 생성자만
class UserEmail {
  constructor(value: string) { ... }
}

// 2차: equals 추가
class UserEmail {
  constructor(value: string) { ... }
  equals(other: UserEmail) { ... }
}

// 3차: getDomain 추가
// ...
```

### 3. 리팩토링 두려워하지 않기

테스트가 있으면 자신있게 리팩토링 가능:
```typescript
// Before: 복잡한 중첩 if
if (email) {
  if (email.length > 0) {
    if (email.includes('@')) {
      // ...
    }
  }
}

// After: Early return (테스트가 보호함!)
if (!email || email.length === 0) return false;
if (!email.includes('@')) return false;
// ...
```

### 4. 커밋 단위

```bash
# ❌ 나쁜 예: 한 번에 커밋
git commit -m "user management domain 구현"

# ✅ 좋은 예: TDD 사이클마다 커밋
git commit -m "test(user-email): add UserEmail value object with basic validation"
git commit -m "refactor(user-email): extract validation logic to private method"
git commit -m "test(user): add User entity with profile update"
```

---

## 🚀 다음 단계

TDD로 구현을 완료했다면:

1. **커버리지 확인**
   ```bash
   pnpm test:coverage
   ```

2. **문서 업데이트**
   - Technical Specification의 "구현 상태" 섹션 업데이트
   - Testing Strategy의 커버리지 달성 여부 체크

3. **코드 리뷰 요청**
   - PR 생성
   - 시니어 개발자 리뷰 요청

4. **다음 Phase로 이동**
   - Testing Strategy의 우선순위에 따라 진행

---

**핵심 원칙**: 
- 🔴 **RED**: 실패를 먼저 본다
- 🟢 **GREEN**: 최소한으로 통과시킨다  
- 🔵 **REFACTOR**: 자신있게 개선한다

TDD는 처음에는 느리게 느껴지지만, 버그가 적고 유지보수가 쉬운 코드를 만들어줍니다! 🎉

