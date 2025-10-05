# [Domain Name] - Frontend Specification

Software Design을 기반으로 한 프론트엔드 구현 명세서입니다.

---

## 🎯 Frontend Implementation Overview

### 구현 범위
- **도메인**: [도메인명] (예: User Management, Workspace Structure)
- **주요 기능**: [핵심 기능 목록]
- **UI 컴포넌트**: [주요 컴포넌트 목록]

### 개발 우선순위
1. **Phase 1**: 핵심 타입 및 Context 구현
2. **Phase 2**: Server Actions 및 Hook 구현  
3. **Phase 3**: 컴포넌트 구현 및 통합

---

### 1.1 DTO 타입 정의

#### [EntityName]View DTO
- **파일 위치**: `src/domains/[도메인명]/shared/dtos/index.ts`
- **역할**: [EntityName]의 상세 정보를 클라이언트에 전달하는 DTO
- **주요 속성**:
  - [entityId]: [EntityName] ID (string으로 직렬화)
  - [property1]: [EntityName]의 주요 속성
  - [property2]: [EntityName]의 부가 속성
  - [property3]: [EntityName]의 선택적 속성
  - [relatedEntity]: 관련 엔티티 정보 (ID, 이름)
  - lastLoginAt: 마지막 로그인 시각 (ISO 8601 string)
  - createdAt: 생성 시각 (ISO 8601 string)
- **특징**: Next.js Server Actions 직렬화 제약을 준수하는 plain object

#### [EntityName]Summary DTO
- **역할**: 목록 및 드롭다운에서 사용하는 [EntityName] 요약 정보
- **주요 속성**:
  - id: [EntityName] ID (string으로 직렬화)
  - name: [EntityName] 이름
  - isDefault: 기본 [EntityName] 여부
  - role: 사용자 역할 (owner, admin, member)
  - createdAt: 생성 시각 (ISO 8601 string)
- **특징**: UI 컴포넌트에서 자주 사용되는 최소한의 정보만 포함

#### Request DTOs
- **Create[EntityName]Request**: [EntityName] 생성 요청 데이터
- **Update[EntityName]Request**: [EntityName] 업데이트 요청 데이터
- **특징**: 폼 입력 데이터를 구조화하여 전달

### 1.2 공통 타입 정의

#### Result 타입
- **파일 위치**: `src/domains/[도메인명]/shared/types/index.ts`
- **역할**: 함수형 에러 처리를 위한 Result 패턴 구현
- **주요 기능**:
  - 성공/실패 상태를 명시적으로 표현
  - 타입 안전한 에러 처리
  - 체이닝을 통한 함수형 프로그래밍 지원
- **주요 메서드**:
  - success(): 성공 결과 생성
  - error(): 에러 결과 생성
  - isSuccess(): 성공 여부 확인
  - isError(): 에러 여부 확인
- **특징**: 예외 대신 명시적 에러 처리를 통해 안전한 코드 작성 지원

## 🎛️ 2. React Context 구현

### 2.1 Context 타입 정의

#### [DomainName]Context
- **파일 위치**: `src/domains/[도메인명]/frontend/contexts/[도메인명]-context.tsx`
- **역할**: [EntityName] 관련 전역 상태를 관리하는 React Context
- **주요 상태**:
  - [entities]: [EntityName] 목록 ([EntityName]Summary[])
  - selected[EntityName]Id: 현재 선택된 [EntityName] ID
  - isLoading: 로딩 상태
  - error: 에러 상태
- **주요 액션**:
  - select[EntityName](): [EntityName] 선택
  - refresh[Entities](): [EntityName] 목록 새로고침
- **특징**: 쿠키 기반 영속성을 통해 선택 상태 유지

### 2.2 Provider 구현

#### [DomainName]Provider
- **파일 위치**: `src/domains/[도메인명]/frontend/contexts/[도메인명]-context.tsx`
- **역할**: [EntityName] 관련 상태를 관리하고 하위 컴포넌트에 제공하는 Provider
- **주요 기능**:
  - 초기 데이터 로드 및 상태 관리
  - [EntityName] 선택 우선순위 처리 (URL 파라미터 > 쿠키 > 기본 [EntityName])
  - 쿠키 기반 영속성 관리
  - 에러 상태 관리
- **주요 메서드**:
  - select[EntityName](): [EntityName] 선택 및 쿠키 저장
  - refresh[Entities](): [EntityName] 목록 새로고침
- **특징**: Server Components에서 전달받은 초기 데이터를 활용하여 클라이언트 상태 초기화

#### use[DomainName] Hook
- **역할**: [DomainName]Context에 안전하게 접근하는 커스텀 훅
- **특징**: Provider 외부에서 사용 시 에러 발생으로 안전성 보장

## ⚡ 3. Server Actions 구현

### 3.1 Server Actions 정의

#### [DomainName]Management Actions
- **파일 위치**: `src/domains/[도메인명]/actions/[도메인명].actions.ts`
- **역할**: Next.js Server Actions를 통해 클라이언트에서 호출 가능한 서버 함수들 제공
- **주요 Actions**:
  - create[EntityName]Action(): [EntityName] 생성 및 관련 객체 자동 생성
  - get[Entities]Action(): [EntityName] 목록 조회
  - update[EntityName]Action(): [EntityName] 정보 업데이트
  - delete[EntityName]Action(): [EntityName] 삭제
- **인증 처리**: 모든 Action에서 Supabase Auth를 통한 사용자 인증 확인
- **에러 처리**: Result 패턴을 통한 일관된 에러 처리 및 사용자 친화적 메시지 제공
- **특징**: Drizzle ORM과 Service Layer를 활용하여 도메인 로직 실행

### 3.2 쿠키 유틸리티

#### Cookie Helpers
- **파일 위치**: `src/domains/[도메인명]/frontend/utils/cookie-helpers.ts`
- **역할**: 쿠키 기반 영속성을 위한 유틸리티 함수들 제공
- **주요 기능**:
  - 쿠키 값 읽기 (getCookieValue)
  - 쿠키 값 설정 (setCookieValue)
  - 쿠키 값 삭제 (removeCookieValue)
- **주요 상수**:
  - [ENTITY]_COOKIE_KEYS: [EntityName] 선택 관련 쿠키 키 정의
- **특징**: SSR 환경에서 안전하게 동작하도록 document 존재 여부 확인

## 🎣 4. Custom Hook 구현

### 4.1 메인 Hook 정의

#### use[DomainName] Hook
- **파일 위치**: `src/domains/[도메인명]/frontend/hooks/use-[domain-name].ts`
- **역할**: [EntityName] 관련 비즈니스 로직을 위한 커스텀 훅
- **주요 기능**:
  - 현재 선택된 [EntityName] 정보 제공
  - 기본 [EntityName] 정보 제공
  - [EntityName] 선택 가능 여부 확인
  - [EntityName] 이름으로 검색
  - 소유한 [EntityName]만 필터링
- **주요 메서드**:
  - canSelect[EntityName](): [EntityName] 선택 가능 여부 확인
  - isDefault[EntityName](): 기본 [EntityName] 여부 확인
  - find[EntityName]ByName(): 이름으로 [EntityName] 검색
- **특징**: Context를 적절히 추상화하여 비즈니스 로직 메서드 제공

## 🧩 5. 컴포넌트 구현

### 5.1 Switcher 컴포넌트

#### [EntityName]Switcher 컴포넌트
- **파일 위치**: `src/domains/[도메인명]/frontend/components/[entity-name]-switcher.tsx`
- **역할**: [EntityName] 선택을 위한 드롭다운 UI 컴포넌트
- **주요 기능**:
  - 현재 선택된 [EntityName] 표시
  - [EntityName] 목록 드롭다운 표시
  - [EntityName] 선택 및 상태 업데이트
  - 새 [EntityName] 추가 버튼
- **주요 특징**:
  - shadcn/ui DropdownMenu 컴포넌트 활용
  - SidebarMenu와 통합된 디자인
  - 키보드 단축키 지원 (⌘1, ⌘2, ...)
  - 기본 [EntityName] 표시
- **의존성**: use[DomainName] Hook을 통한 상태 관리

## 🔗 6. 앱 레벨 통합

### 6.1 Provider 설정

#### RootLayout 통합
- **파일 위치**: `src/app/layout.tsx`
- **역할**: 앱 레벨에서 도메인 Provider들을 설정하여 전역 상태 관리
- **주요 기능**:
  - [DomainName]Provider를 다른 도메인 Provider들과 함께 중첩 배치
  - 의존성 순서에 따른 Provider 계층 구조 구성
  - 전역 상태 관리 환경 제공
- **특징**: AuthProvider → [DomainName]Provider → [OtherDomain]Provider 순서로 중첩

### 6.2 페이지에서 사용

#### 페이지 컴포넌트
- **파일 위치**: `src/app/[page-name]/page.tsx`
- **역할**: [EntityName] 관련 기능을 사용하는 페이지 컴포넌트
- **주요 기능**:
  - use[DomainName] Hook을 통한 상태 접근
  - [EntityName]Switcher 컴포넌트 렌더링
  - 로딩 및 에러 상태 처리
- **특징**: Hook을 통한 상태 관리 및 컴포넌트 조합

## 📊 7. 구현 완료 체크리스트

### 7.1 DTO 타입 정의 완료 확인
- [ ] DTO 인터페이스가 Plain Object로 정의되었는가?
- [ ] Date 객체가 ISO 문자열로 직렬화되었는가?
- [ ] Value Object가 string으로 직렬화되었는가?
- [ ] Next.js Server Actions 직렬화 제약을 준수하는가?

### 7.2 Context 구현 완료 확인
- [ ] 도메인별로 독립적인 Context가 생성되었는가?
- [ ] DTO 배열과 선택된 엔티티 상태가 관리되는가?
- [ ] 쿠키 기반 영속성이 구현되었는가?
- [ ] 초기 데이터 로드 로직이 구현되었는가?

### 7.3 Server Actions 구현 완료 확인
- [ ] Supabase Auth 인증 확인이 포함되었는가?
- [ ] 의존성 주입 패턴으로 Service Layer를 사용하는가?
- [ ] Command 객체를 활용하여 입력을 구조화했는가?
- [ ] DTO 직렬화가 올바르게 구현되었는가?
- [ ] revalidatePath로 관련 페이지 재검증이 포함되었는가?

### 7.4 Hook 구현 완료 확인
- [ ] Context를 적절히 추상화한 Hook이 구현되었는가?
- [ ] 비즈니스 로직 메서드가 포함되었는가?
- [ ] 선택된 엔티티, 기본 엔티티 등 유틸리티가 제공되는가?
- [ ] 에러 상태가 적절히 처리되는가?

### 7.5 컴포넌트 구현 완료 확인
- [ ] 컴포넌트에서 직접 Context 접근을 피하고 Hook을 사용하는가?
- [ ] Switcher 컴포넌트가 드롭다운으로 구현되었는가?
- [ ] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [ ] 빈 상태 처리가 포함되었는가?

### 7.6 앱 통합 완료 확인
- [ ] Provider가 적절한 순서로 중첩 배치되었는가?
- [ ] 초기 데이터가 Server Components에서 전달되는가?
- [ ] 쿠키 기반 영속성이 올바르게 작동하는가?
- [ ] 페이지별로 필요한 Hook만 선택적으로 사용하는가?

## 📚 8. 관련 문서 및 참조

### 8.1 필수 선행 문서
- **Software Design 문서**: `../domains/[도메인명]/software-design.md`
  - Aggregate, Command, Event 정의 확인
  - 비즈니스 규칙 및 정책 참조
  - Read Models 및 Context Map 확인

- **Technical Specification 가이드**: `../guide/06-technical-specification-guide.md`
  - DTO 직렬화 패턴 참조
  - Service Layer 패턴 참조
  - 에러 처리 및 의존성 주입 패턴

- **Code Conventions**: `../guide/08-code-conventions.md`
  - DTO 직렬화 컨벤션
  - Next.js Server Actions 제약사항

### 8.2 기술 스택 참조
- **Next.js 14**: App Router, Server Actions, revalidatePath
- **React 18**: Context API, useState, useEffect
- **TypeScript**: 인터페이스, 타입 정의, 제네릭
- **Supabase**: 인증, 데이터베이스
- **Drizzle ORM**: 타입 안전한 쿼리
- **UI 라이브러리**: shadcn/ui 컴포넌트 (DropdownMenu, SidebarMenu 등)

### 8.3 폴더 구조 요약
```
src/
├── domains/[도메인명]/
│   ├── shared/
│   │   ├── dtos/
│   │   │   └── index.ts                    # DTO 인터페이스들
│   │   ├── types/
│   │   │   └── index.ts                    # Result 패턴 및 공통 타입
│   │   ├── commands/                       # Command 객체들
│   │   ├── errors/                         # 에러 타입들
│   │   └── value-objects/                  # Value Object들
│   ├── frontend/
│   │   ├── contexts/
│   │   │   └── [도메인명]-context.tsx      # Context 타입 정의 + Provider
│   │   ├── hooks/
│   │   │   └── use-[domain-name].ts        # 메인 Hook
│   │   ├── components/
│   │   │   └── [entity-name]-switcher.tsx  # Switcher 컴포넌트
│   │   └── utils/
│   │       └── cookie-helpers.ts           # 쿠키 유틸리티
│   └── actions/
│       └── [도메인명].actions.ts           # Server Actions
└── app/
    ├── layout.tsx                          # Provider 설정
    └── [page]/page.tsx                     # 페이지에서 Hook 사용
```

### 8.4 개발 순서 권장사항
1. **Software Design 완료 확인** → Aggregate, Command, Event 정의 완료
2. **DTO 정의** → `shared/dtos/index.ts` 작성
3. **Context 구현** → Context 타입 정의 + Provider 구현
4. **Server Actions** → DTO 직렬화 + Service Layer 연동
5. **Hook 구현** → Context 연결 + 비즈니스 로직 메서드
6. **컴포넌트** → Hook 사용 + Switcher UI 구현
7. **앱 통합** → Provider 설정 + 초기 데이터 전달
8. **테스트** → 각 레이어별 단위 테스트 및 통합 테스트

이 Frontend Specification은 **[Domain Name] 도메인**의 완전한 프론트엔드 구현 명세서입니다.
