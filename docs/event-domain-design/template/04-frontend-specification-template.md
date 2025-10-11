# Frontend Specification: [Domain Name] Domain

## 🎯 개요

**도메인**: [Domain Name]  
**작성자**: 프론트엔드개발자 + UX/UI 디자이너  
**작성일**: YYYY-MM-DD  
**버전**: v1.0

**User Flow 참조**: `03-user-flow.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: 프론트엔드 구현

---

> **가이드 참조**: `docs/event-domain-design/guide/04-frontend-specification-guide.md`  
> **작성 시점**: User Flow 완료 후, 실제 구현 시작 전  
> **목적**: User Flow를 React 구조로 전환, DTO 설계, Context/Hooks/Components 정의

---

## 📊 Frontend Specification Overview

### 프론트엔드 구현 개요

[이 도메인의 프론트엔드 구현 전략을 간략히 설명]

### User Flow 연결점

- **입력**: `03-user-flow.md` - [주요 화면 N개]
- **입력**: `03-software-design.md` - [주요 Aggregate M개]
- **출력**: React Context, Hooks, Components

### 핵심 설계 원칙

- **타입 재사용**: Software Design의 타입을 DTO로 직렬화
- **도메인 분리**: 각 도메인별로 독립적인 Context/Hook 구조
- **Result 패턴**: 함수형 에러 처리
- **낙관적 업데이트**: 사용자 경험 향상
- **의존성 주입**: Server Actions에서 Service Layer 활용

---

## 📦 DTO 및 타입 정의

> **가이드 참조**: Phase 2.2 - DTO 및 타입 설계

### 1. DTO 인터페이스

#### [Entity1]View DTO

- **파일 위치**: `src/domains/[domain]/shared/dtos/index.ts`
- **역할**: [Entity1]의 조회 정보를 직렬화 가능한 형태로 제공
- **주요 속성**:
  - id: string (Value Object → string 직렬화)
  - [property1]: string
  - [property2]: number
  - [relatedEntity]: 관련 엔티티 정보 (중첩 객체)
  - createdAt: string (Date → ISO 8601 string)
  - updatedAt: string (Date → ISO 8601 string)
- **직렬화 규칙**:
  - Value Object → string 변환
  - Date → ISO 8601 string 변환
  - Plain Object만 사용 (클래스, 함수 금지)
- **특징**: Next.js Server Actions의 직렬화 제약을 준수

**사용 위치**:
- [화면 1]: 상세 정보 표시
- [화면 2]: 목록 표시

---

#### [Entity1]Summary DTO

- **파일 위치**: `src/domains/[domain]/shared/dtos/index.ts`
- **역할**: [Entity1]의 요약 정보를 제공하여 목록 표시 최적화
- **주요 속성**:
  - id: string
  - name: string
  - isDefault: boolean (기본 선택 여부)
  - role: string ('owner' | 'admin' | 'member')
  - createdAt: string
- **특징**: 최소한의 정보만 포함하여 목록 조회 성능 향상

**사용 위치**:
- Switcher 컴포넌트: 드롭다운 목록
- 사이드바: 간략 정보 표시

---

#### Request DTOs

- **파일 위치**: `src/domains/[domain]/shared/dtos/index.ts`
- **역할**: Server Actions에 전달되는 입력 데이터 구조 정의
- **Create[Entity1]Request**:
  - name: string (필수)
  - [property]: string
  - [추가 필드]
- **Update[Entity1]Request**:
  - [property]: string (수정할 필드만)
  - [추가 필드]
- **특징**: 폼 입력 데이터를 Server Actions에 전달하기 위한 타입

**사용 위치**:
- 생성 폼: Create[Entity1]Request
- 수정 폼: Update[Entity1]Request

---

### 2. Result 패턴

- **파일 위치**: `src/domains/[domain]/shared/types/index.ts`
- **역할**: 함수형 에러 처리를 위한 Result 패턴
- **주요 속성**:
  - success: boolean (성공 여부)
  - data?: T (성공 시 데이터)
  - error?: E (실패 시 에러)
- **주요 메서드**:
  - isSuccess(): 성공 여부 확인
  - isError(): 실패 여부 확인
- **특징**: try-catch 대신 함수형 에러 처리 패턴 사용

**사용 예시**:
- Server Actions의 반환값으로 사용
- 에러를 명시적으로 처리하여 타입 안전성 확보
- 성공/실패 시나리오를 명확히 분리

---

## 🎯 React Context 설계

> **가이드 참조**: Phase 2.3 - Context 및 Hooks 설계

### 1. Context 타입 정의

#### [DomainName]Context

- **파일 위치**: `src/domains/[domain]/frontend/contexts/[domain-name]-context.tsx`
- **역할**: [DomainName] 도메인의 전역 상태를 관리하는 React Context
- **State 속성**:
  - [entities]: [Entity1]Summary[] (DTO 배열)
  - selected[Entity]Id: string | null (선택된 엔티티 ID)
  - isLoading: boolean (로딩 상태)
  - error: string | null (에러 상태)
- **Actions 메서드**:
  - select[Entity](id): 엔티티 선택 및 쿠키에 저장
  - refresh[Entities](): Server Actions 호출하여 데이터 갱신
- **Context 타입**: State + Actions 결합
- **특징**: 
  - 도메인별 독립적인 Context 구조
  - DTO 기반 상태 관리
  - 쿠키 기반 영속성

**데이터 흐름**:
1. Server Components에서 초기 데이터 로드
2. Provider를 통해 하위 컴포넌트에 상태 전달
3. Hook을 통해 컴포넌트에서 상태 접근
4. Actions를 통해 상태 업데이트

---

### 2. Provider 구현 패턴

- **파일 위치**: `src/domains/[domain]/frontend/contexts/[domain-name]-context.tsx`
- **역할**: [DomainName]Context를 실제로 구현하는 Provider 컴포넌트
- **주요 기능**:
  - useState를 통한 DTO 상태 관리
  - useEffect를 통한 초기 데이터 로드
  - 쿠키에서 선택 상태 복원
  - URL 파라미터 확인 및 우선순위 처리 (URL > 쿠키 > 기본값)
  - select[Entity] 액션: 상태 업데이트 + 쿠키 저장
  - refresh[Entities] 액션: Server Actions 호출 + 상태 갱신
- **Props**:
  - children: React.ReactNode (하위 컴포넌트)
  - initial[Entities]: [Entity1]Summary[] (서버에서 전달된 초기 데이터)
- **특징**:
  - Server Components에서 초기 데이터를 받아 클라이언트에서 상태 관리
  - 쿠키 기반 영속성으로 페이지 새로고침 시에도 선택 상태 유지

**구현 플로우**:
1. Server Components에서 initial[Entities] 전달
2. useState로 상태 초기화
3. useEffect에서 쿠키/URL 기반 선택 상태 복원
4. Context Provider로 하위 컴포넌트에 상태 전달

---

## 🪝 Custom Hooks 설계

> **가이드 참조**: Phase 2.4 Part 2 - Custom Hooks 설계

### 1. 메인 Hook

#### use[DomainName] Hook

- **파일 위치**: `src/domains/[domain]/frontend/hooks/use-[domain-name].ts`
- **역할**: [DomainName]Context를 사용하기 쉽게 추상화한 메인 Hook
- **주요 기능**:
  - Context 상태 및 Actions 접근
  - 선택된 엔티티 추출 (useMemo)
  - 기본 엔티티 추출 (useMemo)
  - 비즈니스 로직 메서드 제공
- **제공 메서드**:
  - selected[Entity]: 현재 선택된 엔티티 (useMemo로 최적화)
  - default[Entity]: 기본 엔티티 (useMemo로 최적화)
  - canSelect[Entity](id): 선택 가능 여부 검증
  - find[Entity]ByName(name): 이름으로 엔티티 검색
- **반환값**: Context 상태 + 추가 유틸리티 메서드
- **특징**:
  - Context를 직접 사용하지 않고 Hook을 통해 접근
  - 비즈니스 로직을 Hook에 캡슐화
  - useMemo로 불필요한 재계산 방지

**사용 시나리오**:
- 컴포넌트에서 선택된 엔티티 정보 표시
- 드롭다운에서 선택 가능한 엔티티 목록 필터링
- 이름으로 엔티티 검색 및 표시

---

### 2. Context Hook

- **파일 위치**: `src/domains/[domain]/frontend/contexts/[domain-name]-context.tsx`
- **역할**: [DomainName]Context 접근을 위한 내부 Hook
- **주요 기능**:
  - useContext를 통해 Context 접근
  - Provider 외부 사용 시 에러 발생
- **특징**:
  - 타입 안전성 보장
  - Provider 누락 시 명확한 에러 메시지
  - 메인 Hook에서 내부적으로 사용

---

## 🎨 UI 컴포넌트 설계

> **가이드 참조**: Phase 2.4 Part 3 - 컴포넌트 연동

### 1. Switcher 컴포넌트

#### [Entity]Switcher

- **파일 위치**: `src/domains/[domain]/frontend/components/[entity]-switcher.tsx`
- **역할**: [Entity] 목록을 드롭다운으로 표시하고 선택할 수 있는 컴포넌트
- **주요 기능**:
  - 현재 선택된 엔티티 이름 표시
  - 엔티티 목록을 드롭다운으로 표시
  - 엔티티 선택 시 Hook의 select[Entity] 메서드 호출
  - 기본 엔티티에 Badge 표시
  - 로딩 상태 처리
- **사용 Hook**: use[DomainName]()
- **UI 라이브러리**: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Badge
- **특징**:
  - Hook을 통해 Context 상태 접근
  - 선택 시 자동으로 쿠키에 저장
  - 반응형 디자인 적용

**사용 위치**:
- 헤더: 전역 엔티티 선택
- 사이드바: 네비게이션 영역
- 대시보드: 엔티티별 정보 표시

---

### 2. List 컴포넌트

#### [Entity]List

- **파일 위치**: `src/domains/[domain]/frontend/components/[entity]-list.tsx`
- **역할**: [Entity] 목록을 리스트 형태로 표시하는 컴포넌트
- **주요 기능**:
  - 엔티티 목록을 순회하며 표시
  - 로딩 상태 시 Skeleton 표시
  - 에러 발생 시 ErrorMessage 표시
  - 빈 목록 시 EmptyState 표시
- **사용 Hook**: use[DomainName]()
- **UI 라이브러리**: Skeleton, ErrorMessage, EmptyState
- **특징**:
  - 다양한 상태 처리 (로딩, 에러, 빈 상태)
  - 키 속성으로 엔티티 ID 사용
  - 반응형 디자인 적용

**사용 위치**:
- 대시보드: 엔티티 목록 표시
- 설정 화면: 관리용 목록

---

### 3. Form 컴포넌트

#### Create[Entity]Form

- **파일 위치**: `src/domains/[domain]/frontend/components/create-[entity]-form.tsx`
- **역할**: [Entity] 생성을 위한 폼 컴포넌트
- **주요 기능**:
  - 폼 필드 입력 및 검증
  - useTransition을 통한 비동기 상태 관리
  - Server Actions 호출
  - 에러 처리 및 성공 메시지 표시
  - 제출 중 버튼 비활성화
- **사용 Hook**: useTransition
- **사용 Actions**: create[Entity]Action
- **UI 라이브러리**: Form, Button, Input 등
- **특징**:
  - Server Actions와 직접 연동
  - useTransition으로 로딩 상태 관리
  - Result 패턴으로 에러 처리
  - 접근성 고려 (aria-label, role 등)

**사용 위치**:
- 생성 모달: 새 엔티티 추가
- 온보딩: 초기 설정

---

## 🔗 앱 레벨 통합

> **가이드 참조**: Phase 3.2 - 앱 레벨 통합 설계

### 1. Provider 중첩 순서

**Root Layout 통합**:
```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <[Domain1]Provider initial[Entities]={initial[Entities]}>
            <[Domain2]Provider>
              {children}
            </[Domain2]Provider>
          </[Domain1]Provider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Provider 순서 원칙**:
- 의존성이 적은 도메인부터 상위에 배치
- 인증 Provider는 가장 상위
- 각 도메인 Provider는 독립적으로 동작

---

### 2. 초기 데이터 전달

**Server Components에서 데이터 로드**:
```typescript
// src/app/[page]/layout.tsx
export default async function [Page]Layout({ children }) {
  const [entities] = await get[Entities]Action();
  
  return (
    <[DomainName]Provider initial[Entities]={[entities]}>
      {children}
    </[DomainName]Provider>
  );
}
```

---

### 3. 페이지에서 Hook 사용

**페이지 컴포넌트**:
```typescript
// src/app/[page]/page.tsx
export default function [Page]Page() {
  const { selected[Entity], [entities], select[Entity] } = use[DomainName]();
  
  return (
    <div>
      <[Entity]Switcher />
      <[Entity]List />
    </div>
  );
}
```

---

## 🔐 쿠키 기반 영속성

### Cookie Helpers

**유틸리티 함수**:
```typescript
// src/domains/[domain]/frontend/utils/cookie-helpers.ts

export const [ENTITY]_COOKIE_KEYS = {
  SELECTED_[ENTITY]_ID: 'selected-[entity]-id',
};

export function getSelected[Entity]IdFromCookie(): string | null {
  // document.cookie에서 읽기
}

export function setSelected[Entity]IdToCookie(id: string): void {
  // document.cookie에 저장
}
```

---

## ✅ 검증 체크리스트

### DTO 타입 정의
- [ ] DTO 인터페이스가 Plain Object로 정의되었는가?
- [ ] Date 객체가 ISO 문자열로 직렬화되었는가?
- [ ] Value Object가 string으로 직렬화되었는가?
- [ ] Next.js Server Actions 직렬화 제약을 준수하는가?

### Context 설계
- [ ] 도메인별로 독립적인 Context가 생성되었는가?
- [ ] DTO 배열과 선택된 엔티티 상태가 관리되는가?
- [ ] 쿠키 기반 영속성이 구현되었는가?
- [ ] 초기 데이터 로드 로직이 구현되었는가?

### Server Actions 연동
- [ ] Supabase Auth 인증 확인이 포함되었는가?
- [ ] 의존성 주입 패턴으로 Service Layer를 사용하는가?
- [ ] Command 객체를 활용하여 입력을 구조화했는가?
- [ ] DTO 직렬화가 올바르게 구현되었는가?
- [ ] revalidatePath로 관련 페이지 재검증이 포함되었는가?

### Hook 구현
- [ ] Context를 적절히 추상화한 Hook이 구현되었는가?
- [ ] 비즈니스 로직 메서드가 포함되었는가?
- [ ] 선택된 엔티티, 기본 엔티티 등 유틸리티가 제공되는가?
- [ ] 에러 상태가 적절히 처리되는가?

### 컴포넌트 연동
- [ ] 컴포넌트에서 직접 Context 접근을 피하고 Hook을 사용하는가?
- [ ] Switcher 컴포넌트가 드롭다운으로 구현되었는가?
- [ ] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [ ] 빈 상태 처리가 포함되었는가?

### 앱 통합
- [ ] Provider가 적절한 순서로 중첩 배치되었는가?
- [ ] 초기 데이터가 Server Components에서 전달되는가?
- [ ] 쿠키 기반 영속성이 올바르게 작동하는가?
- [ ] 페이지별로 필요한 Hook만 선택적으로 사용하는가?

---

## 🚀 다음 단계

이 Frontend Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 프론트엔드 코드 (Context, Hooks, Components)
- **내용**:
  - Context 구현 및 Provider 설정
  - Custom Hooks 구현
  - UI 컴포넌트 구현
  - React Testing Library로 테스트

---

**문서 작성 완료 후**:
- [ ] 프론트엔드 개발자 리뷰 완료
- [ ] UX/UI 디자이너 리뷰 완료
- [ ] User Flow와 일관성 확인
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

## 📁 폴더 구조 요약

```
src/domains/[도메인명]/
├── shared/
│   ├── dtos/
│   │   └── index.ts                    # DTO 인터페이스들
│   ├── types/
│   │   └── index.ts                    # Result 패턴 및 공통 타입
│   ├── commands/                       # Command 객체들
│   └── errors/                         # 에러 타입들
├── frontend/
│   ├── contexts/
│   │   └── [도메인명]-context.tsx      # Context + Provider
│   ├── hooks/
│   │   └── use-[domain-name].ts        # 메인 Hook
│   ├── components/
│   │   ├── [entity]-switcher.tsx       # Switcher 컴포넌트
│   │   ├── [entity]-list.tsx           # List 컴포넌트
│   │   └── create-[entity]-form.tsx    # Form 컴포넌트
│   └── utils/
│       └── cookie-helpers.ts           # 쿠키 유틸리티
└── actions/
    └── [도메인명].actions.ts           # Server Actions
```

---

이 Frontend Specification을 따라 **User Flow 기반의 [Domain Name] 프론트엔드**를 구현할 수 있습니다! 🎨
