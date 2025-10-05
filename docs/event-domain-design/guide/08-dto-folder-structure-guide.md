# DTO Folder Structure Guide - 관심사 분리와 명확한 폴더 구성

## 🎯 핵심 원칙

> **"서로 다른 목적의 타입은 서로 다른 위치에!"**

DTO와 Domain Events는 서로 다른 관심사를 가지므로 별도의 폴더에 분리해야 합니다.

---

## 🚨 잘못된 구조 (기존)

```typescript
// ❌ 나쁜 예: shared/events/index.ts
export class UserProfileCreatedEvent {
  constructor(
    public readonly userId: UserId,        // Domain Event (클래스)
    public readonly email: UserEmail,
    // ...
  ) {}
}

export interface OrganizationSummary {     // DTO (interface) - 잘못된 위치!
  id: string;
  name: string;
  // ...
}
```

**문제점:**
- 🚨 **관심사 혼재**: Domain Events ≠ Data Transfer Objects
- 🚨 **의존성 혼란**: events import 시 불필요한 DTO도 함께 딸려옴
- 🚨 **유지보수성**: 서로 다른 이유로 변경되는데 같은 파일에 위치
- 🚨 **명확성 부족**: Import 경로가 의도를 명확히 드러내지 않음

---

## ✅ 올바른 구조 (개선)

```typescript
shared/
├── aggregates/         # 도메인 로직
├── entities/          # 도메인 엔티티  
├── value-objects/     # 불변 값 객체
├── commands/          # 입력 데이터 구조
├── events/            # 🔥 Domain Events만 (클래스)
├── dtos/             # ✅ Data Transfer Objects (interfaces)
├── errors/           # 도메인 에러
└── types/            # 기타 타입
```

### Domain Events (내부 도메인 간 통신)
```typescript
// shared/events/index.ts
export class UserProfileCreatedEvent {
  constructor(
    public readonly userId: UserId,        // Value Object (복잡한 객체)
    public readonly email: UserEmail,     // Value Object
    public readonly timestamp: Date       // Date 객체
  ) {}
}
```

### DTOs (외부 경계와 데이터 교환)
```typescript
// shared/dtos/index.ts
export interface UserProfileView {
  userId: string;                         // Primitive (직렬화 가능)
  email: string;                          // Primitive
  createdAt: string;                      // ISO String (직렬화됨)
}
```

---

## 📋 설계 비교표

| 구분 | Domain Events | DTOs |
|------|---------------|------|
| **목적** | **내부 도메인 간 통신** | **외부 시스템과의 데이터 교환** |
| **형태** | Rich Objects (클래스) | Plain Objects (interface) |
| **의존성** | Value Objects에 의존 | 순수 TypeScript interfaces |
| **변경 이유** | 비즈니스 규칙 변경 | 클라이언트/API 요구사항 변경 |
| **사용 계층** | Domain ↔ Domain | Server ↔ Client |
| **직렬화** | ❌ 불가능 (클래스) | ✅ 가능 (plain object) |
| **생명주기** | Domain 로직에 따라 | API 스펙에 따라 |

---

## 🏗️ DTO 폴더 구조 옵션

### 옵션 1: 단일 파일 방식 (권장 - 현재 구현)
```typescript
// shared/dtos/index.ts
export interface UserProfileView {
  userId: string;
  email: string;
  createdAt: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}
```

**장점:**
- 🟢 **단순함**: 하나의 파일로 모든 DTO 관리
- 🟢 **일관성**: 모든 DTO가 같은 위치에
- 🟢 **간편함**: import 경로 통일
- 🟢 **소규모 프로젝트 적합**: 도메인이 작을 때 유리

### 옵션 2: 도메인별 분리 방식
```typescript
// shared/dtos/user.dto.ts
export interface UserProfileView { ... }
export interface UserRegistrationResult { ... }

// shared/dtos/organization.dto.ts
export interface OrganizationSummary { ... }
export interface CreateOrganizationRequest { ... }

// shared/dtos/index.ts (Barrel export)
export * from './user.dto';
export * from './organization.dto';
```

**장점:**
- 🟢 **확장성**: 도메인이 커져도 관리 가능
- 🟢 **명확성**: DTO 용도별 분리
- 🟢 **유지보수성**: 관련 DTO끼리 그룹화

**단점:**
- 🔴 **복잡성**: 파일 수 증가
- 🔴 **오버엔지니어링**: 작은 프로젝트에는 과도

---

## 📂 Import 경로 비교

### Before (❌ 문제가 있는 구조)
```typescript
// 이상한 Import 경로들
import { UserProfileView } from '../shared/events';         // 🤔 DTO를 events에서?
import { OrganizationSummary } from '../shared/events';    // 🤔 왜 여기서?
```

**문제:**
- 의도를 파악하기 어려움
- Domain Events import 시 불필요한 DTO도 포함
- 폴더 목적과 불일치

### After (✅ 개선된 구조)
```typescript
// 명확한 Import 경로들
import { UserProfileView } from '../shared/dtos';           // ✅ DTO는 dtos에서
import { UserCreatedEvent } from '../shared/events';        // ✅ Events는 events에서

// 또는 개별 분리된 경우
import { UserProfileView } from '../shared/dtos/user.dto';
import { OrganizationSummary } from '../shared/dtos/organization.dto';
```

**개선점:**
- 의도가 명확함
- 적절한 의존성 구분
- 폴더 목적과 일치

---

## 🎯 DTOs 위치 선택 기준

### ✅ 권장 위치들

#### 1. `shared/dtos/` (현재 선택) ⭐
```
shared/dtos/
├── index.ts                   # 모든 DTO export
├── user.dto.ts               # 사용자 관련 DTO
└── organization.dto.ts       # 조직 관련 DTO
```

**장점:**
- 도메인 내부에서 공유 가능
- 적절한 추상화 레벨
- 명확한 위치

#### 2. `types/dtos/`
```
types/
├── dtos/
└── internal/
```

**사용 시기:** TypeScript 중점 프로젝트

#### 3. `contracts/`
```
contracts/
├── api/
├── events/
└── services/
```

**사용 시기:** API 중심 설계

### ❌ 피해야 할 위치들

| 위치 | 문제점 | 이유 |
|------|--------|------|
| `events/` | 🚨 관심사 혼재 | Domain Events와 목적이 다름 |
| `actions/` | 🚨 로직과 타입 혼재 | Server Actions는 실행 로직 |
| `components/` | 🚨 UI와 비즈니스 혼재 | React 컴포넌트 전용 |
| `repositories/` | 🚨 데이터 접근과 혼재 | Repository는 구현 세부사항 |

---

## 📊 마이그레이션 가이드

### Step 1: 새로운 DTO 폴더 생성
```bash
mkdir -p apps/web/src/domains/user-management/shared/dtos
```

### Step 2: DTO 파일 이동 및 정리
```typescript
// 1. 기존 events/index.ts에서 DTO 제거
- export interface OrganizationSummary { ... }  // 제거

// 2. 새로운 dtos/index.ts에 DTO 정의
+ export interface OrganizationSummary { ... }   // 추가
```

### Step 3: Import 경로 수정
```typescript
// Before
import { OrganizationSummary } from '../shared/events';  // 👎

// After  
import { OrganizationSummary } from '../shared/dtos';    // 👍
```

### Step 4: 모든 파일에서 import 업데이트
```bash
# 검색하여 모든 파일 업데이트
find . -name "*.ts" -o -name "*.tsx" | xargs grep "from.*events.*OrganizationSummary"
```

---

## 🔍 실제 구현 예시

### User Management Domain DTO 구조
```typescript
// shared/dtos/index.ts
export interface UserProfileView {
  userId: string;                          // Serialized from UserId
  email: string;
  name: string;
  profileImageUrl?: string;
  defaultOrganization: {
    id: string;                            // Serialized from OrganizationId
    name: string;
  };
  createdAt: string;                      // ISO 8601 string
}

export interface OrganizationSummary {
  id: string;                              // Serialized from OrganizationId
  name: string;
  isDefault: boolean;
  role?: 'owner' | 'admin' | 'member';
  createdAt: string;                      // ISO 8601 string
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  id: string;
  name?: string;
  description?: string;
}
```

### Server Actions에서 사용
```typescript
// actions/user-management.actions.ts
import type { OrganizationSummary } from '../shared/dtos';  // 명확한 경로

export async function getUserOrganizationsAction(): Promise<OrganizationSummary[]> {
  // Implementation...
}
```

### Service Layer에서 사용
```typescript
// backend/services/user-management.service.ts
import type { OrganizationSummary } from '../../shared/dtos';  // 명확한 경로

async getUserOrganizations(): Promise<Result<OrganizationSummary[], Error>> {
  // Implementation...
}
```

---

## ✅ 검증 체크리스트

### 폴더 구조 검증
- [ ] Domain Events와 DTOs가 별도 폴더에 있는가?
- [ ] 각 폴더의 목적이 명확한가?
- [ ] Import 경로가 의도를 드러내는가?

### DTO 설계 검증
- [ ] 모든 DTO가 plain objects인가? (직렬화 가능)
- [ ] Date 타입이 ISO string으로 변환되었는가?
- [ ] Value Objects가 string으로 직렬화되었는가?

### 의존성 검증
- [ ] Domain Events에서 Value Objects를 사용하는가?
- [ ] DTOs가 외부 의존성이 없는가?
- [ ] 각각의 변경 이유가 분리되었는가?

---

## 📚 참고 자료

- [Domain-Driven Design - Layered Architecture](https://martinfowler.com/bliki/DDD_Layers.html)
- [DTO Pattern](https://martinfowler.com/eaaCatalog/dataTransferObject.html)
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)

---

**핵심 원칙**: 
1. **관심사별 분리**: 서로 다른 목적의 코드는 다른 위치에
2. **명확한 의도**: 폴더와 파일명이 용도를 명확히 드러냄
3. **적절한 레벨**: 과도한 분리는 오히려 복잡성 증가

이렇게 분리하면 코드의 의도가 명확해지고, 유지보수가 쉬워집니다! 🚀
