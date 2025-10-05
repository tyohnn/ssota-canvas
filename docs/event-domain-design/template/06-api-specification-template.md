# [Domain Name] - API Specification

[Domain]의 HTTP API 계약을 정의합니다.

---

## 🎯 API Design Principles

1. **RESTful Design**: 표준 HTTP 메소드와 상태 코드 사용
2. **Type Safety**: 모든 요청/응답에 TypeScript 타입 정의
3. **Authentication**: Clerk JWT 토큰 기반 인증
4. **Authorization**: 역할 기반 접근 제어 (RBAC)
5. **Error Handling**: 구조화된 에러 응답
6. **Versioning**: URL 경로 기반 버전 관리 (/api/v1/*)

---

## 🔐 Authentication & Authorization

### 인증 방식
- **Bearer Token**: `Authorization: Bearer <clerk-jwt-token>`
- **Cookie**: Clerk가 자동 설정하는 세션 쿠키

### 권한 레벨
| Level | 설명 | API 접근 |
|-------|------|----------|
| **OWNER** | [도메인] 소유자 | 모든 작업 |
| **ADMIN** | 관리자 | 생성/수정/삭제 |
| **EDITOR** | 편집자 | 생성/수정 |
| **VIEWER** | 조회자 | 조회만 |

---

## 📝 API Endpoints

### [기능 그룹] Commands

#### POST /api/v1/[domain]/[resource]
**설명**: [구체적 기능 설명]

**요청 본문**:
```typescript
interface [RequestName]Request {
  [field1]: [Type1];                    // [필드 설명]
  [field2]?: [Type2];                   // [필드 설명] (선택사항)
  [field3]: [Type3];                    // [필드 설명]
}
```

**응답**:
```typescript
interface [ResponseName]Response {
  success: true;
  data: {
    [field1]: [Type1];                    // [필드 설명]
    [field2]: [Type2];                    // [필드 설명]
    [field3]: [Type3];                    // [필드 설명]
  };
} | {
  success: false;
  error: {
    code: string;                         // 에러 코드
    message: string;                      // 사용자 친화적 메시지
    details?: any;                        // 추가 정보 (개발용)
  };
}
```

**에러 코드**:
- `UNAUTHORIZED`: 인증 필요
- `FORBIDDEN`: 권한 부족
- `VALIDATION_ERROR`: 입력값 검증 실패
- `[DOMAIN_SPECIFIC_ERROR]`: [도메인 특화 에러]
- `INTERNAL_ERROR`: 서버 내부 오류

**권한**: `[REQUIRED_PERMISSION]` 이상

#### GET /api/v1/[domain]/[resource]
**설명**: [조회 기능 설명]

**쿼리 파라미터**:
```typescript
interface [QueryName]Query {
  page?: number;      // 페이지 번호 (1부터 시작, 기본: 1)
  limit?: number;     // 페이지 크기 (1-100, 기본: 20)
  sortBy?: string;    // 정렬 필드
  sortOrder?: 'asc' | 'desc'; // 정렬 방향
  [filterField]?: [FilterType]; // 필터 조건
}
```

**응답**:
```typescript
interface [ListResponseName]Response {
  success: true;
  data: {
    [items]: Array<{
      [field1]: [Type1];
      [field2]: [Type2];
      // ...
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

---

## 🎨 Data Schemas

### [주요 타입 이름]
```typescript
interface [MainTypeName] {
  id: string;                    // UUID
  [field1]: [Type1];             // [필드 설명]
  [field2]?: [Type2];            // [필드 설명] (선택사항)
  [field3]: [Type3];             // [필드 설명]
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  [status]?: [StatusType];       // 상태 필드
}
```

### 필터/검색 타입
```typescript
interface [FilterName] {
  [filterField1]?: [FilterType1];    // [필터 설명]
  [filterField2]?: [FilterType2];    // [필터 설명]
  [searchField]?: string;             // 검색어
}
```

### 공통 에러 응답
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;                 // 에러 분류 코드
    message: string;              // 사용자 친화적 메시지
    details?: {                   // 추가 정보 (개발용)
      field?: string;             // 검증 실패 필드
      value?: any;                // 잘못된 값
      constraint?: string;        // 위반된 제약조건
    };
    timestamp: string;            // ISO 8601
    correlationId: string;        // 추적 ID
  };
}
```

---

## 🚨 Error Handling

### HTTP 상태 코드
| 코드 | 의미 | 설명 |
|------|------|------|
| **200** | OK | 성공 |
| **201** | Created | 리소스 생성 성공 |
| **400** | Bad Request | 잘못된 요청 (검증 실패) |
| **401** | Unauthorized | 인증 필요 |
| **403** | Forbidden | 권한 부족 |
| **404** | Not Found | 리소스를 찾을 수 없음 |
| **409** | Conflict | 리소스 충돌 |
| **429** | Too Many Requests | 요청 제한 초과 |
| **500** | Internal Server Error | 서버 내부 오류 |

### 도메인별 에러 코드
```typescript
enum [DomainName]Error {
  [SPECIFIC_ERROR_1] = '[ERROR_CODE_1]',
  [SPECIFIC_ERROR_2] = '[ERROR_CODE_2]',
  [SPECIFIC_ERROR_3] = '[ERROR_CODE_3]',
}
```

---

## 📞 SDK 생성 예시

### TypeScript SDK
```typescript
import { [DomainName]API } from '@xbowl/[domain-name]-sdk';

const api = new [DomainName]API({
  baseURL: 'https://api.xbowl.com',
  getToken: () => localStorage.getItem('clerk-token')
});

// [기능] 실행
const result = await api.[resource].[method]({
  [param1]: [value1],
  [param2]: [value2]
});

if (result.success) {
  console.log('[기능] 성공:', result.data);
} else {
  console.error('실패:', result.error.message);
}
```

### JavaScript SDK
```javascript
import [DomainName]API from '@xbowl/[domain-name]-js-sdk';

const api = new [DomainName]API({
  baseURL: 'https://api.xbowl.com',
  token: localStorage.getItem('clerk-token')
});

try {
  const result = await api.[resource].[method]({
    [param1]: [value1],
    [param2]: [value2]
  });

  console.log('[기능] 성공:', result);
} catch (error) {
  console.error('실패:', error.message);
}
```

---

## 🎯 사용 예시

### 기본 사용법
```typescript
// 1. [기능] 생성
const createResult = await api.[resource].create({
  name: '새 [리소스]',
  description: '[설명]'
});

if (createResult.success) {
  const [resourceId] = createResult.data.id;

  // 2. [기능] 조회
  const getResult = await api.[resource].getById(resourceId);
  console.log('조회 결과:', getResult.data);

  // 3. [기능] 업데이트
  const updateResult = await api.[resource].update(resourceId, {
    name: '수정된 이름'
  });

  // 4. [기능] 삭제
  await api.[resource].delete(resourceId);
}
```

### 고급 사용법
```typescript
// 필터와 페이징
const filteredResult = await api.[resource].list({
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  status: 'active'
});

// 검색
const searchResult = await api.[resource].search({
  query: '검색어',
  limit: 20
});
```

---

## 📚 Support & Documentation

### 문의 방법
- **이슈 트래커**: GitHub Issues
- **문서**: `/docs/api/[domain-name]/` 참조
- **지원**: support@example.com

### 변경 이력
- **v1.0.0**: 초기 API 버전
- **v1.1.0**: [변경 사항]

---

이 API 명세서는 **외부 시스템과의 계약**을 정의하며, 구현 세부사항과는 독립적입니다.
