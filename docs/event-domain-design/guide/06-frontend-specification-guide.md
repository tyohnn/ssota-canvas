# Frontend Specification 가이드

이 문서는 **Software Design**에서 정의된 도메인 모델을 **React/Next.js 프론트엔드**에서 어떻게 연동하고 활용할지에 대한 **프로세스 가이드**입니다. 

주니어 개발자가 도메인별로 일관된 프론트엔드 구조를 만들 수 있도록 단계별 과정을 제시합니다.

---

## 🎯 Frontend Specification Overview

### 목적
- Software Design의 Aggregate, Command, Event를 프론트엔드에서 어떻게 활용할지 정의
- 도메인별로 일관된 React Context 및 Hook 구조 설계 방법 제시
- Server Actions와 클라이언트 상태 관리 연동 패턴 정의

### 핵심 원칙
- **타입 재사용**: Software Design의 타입을 클라이언트에서 그대로 활용
- **도메인 분리**: 각 도메인별로 독립적인 Context/Hook 구조
- **Result 패턴**: Technical Specification과 동일한 에러 처리 방식
- **낙관적 업데이트**: 사용자 경험 향상을 위한 즉시 UI 반영
- **의존성 주입**: Server Actions에서 Service Layer 활용

---

## 🛠️ 작업 시작 전 준비사항

### 필수 조건
- Software Design 문서가 완료되어 있어야 함
- Technical Specification 템플릿의 패턴 숙지 필요
- 해당 도메인의 Aggregate, Command, Event 정의 완료

### Git 브랜치 준비
```bash
# 최신 도메인 브랜치로 이동 후 동기화
git checkout domain/[도메인번호]-[도메인명]
git pull origin domain/[도메인번호]-[도메인명]
```

---

## 1단계. 도메인 타입 연동 설계

### 1.1 DTO 기반 타입 구조 정의

**목표**: Software Design의 Aggregate를 DTO로 직렬화하여 프론트엔드에서 활용

**작업 과정**:
1. **DTO 타입 파일 생성**: `src/domains/[도메인명]/shared/dtos/index.ts`
   - Next.js Server Actions 직렬화를 위한 Plain Object 인터페이스
   - Domain Objects → DTO 변환을 위한 타입 정의
   - 클라이언트-서버 통신용 데이터 구조

2. **공통 타입 파일 생성**: `src/domains/[도메인명]/shared/types/index.ts`
   - Result 패턴 (함수형 에러 처리)
   - 공통 유틸리티 타입들
   - 도메인 전반에서 사용되는 기본 타입들

**파일 구조 예시**:
```
src/domains/[도메인명]/
├── shared/
│   ├── dtos/
│   │   └── index.ts          # DTO 인터페이스들 (직렬화 가능)
│   ├── types/
│   │   └── index.ts          # Result 패턴 및 공통 타입
│   ├── commands/             # Command 객체들
│   ├── errors/              # 에러 타입들
│   └── value-objects/       # Value Object들
├── frontend/
│   ├── contexts/            # React Context
│   ├── hooks/               # Custom Hooks
│   ├── components/          # UI 컴포넌트
│   └── utils/               # 클라이언트 유틸리티
└── actions/                 # Server Actions
```

### 1.2 DTO 타입 정의 가이드라인

**DTO 정의 시 주의사항**:
- **Plain Object만 사용**: 클래스, 함수, Date 객체 등 직렬화 불가능한 타입 금지
- **ISO 문자열 사용**: Date → string 변환 (예: `createdAt: string`)
- **Value Object 직렬화**: Domain Value Object → string 변환 (예: `UserId` → `string`)
- **의미 있는 이름**: View, Summary, Request 등 용도별 명확한 네이밍

**Result 패턴 활용**:
- 함수형 에러 처리: `Result<T, E>` 클래스 사용
- 성공/실패 명시적 구분: `isSuccess()`, `isError()` 메서드
- 타입 안전성: 컴파일 타임 에러 처리 보장

### 1.3 DTO 직렬화 패턴

**목표**: Domain Objects를 클라이언트에서 사용 가능한 DTO로 변환

**작업 과정**:
1. **Server Actions에서 직렬화**: Domain Objects → DTO 변환
2. **Context에서 DTO 활용**: 직렬화된 데이터를 상태로 관리
3. **컴포넌트에서 사용**: DTO 데이터를 UI에 표시

**직렬화 예시**:
- `UserProfileView`: 사용자 프로필 정보 (헤더, 프로필 페이지 등)
- `OrganizationSummary`: 조직 요약 정보 (드롭다운, 사이드바 등)
- `CreateOrganizationRequest`: 조직 생성 요청 (폼 입력 등)

---

## 2단계. React Context 설계

### 2.1 Context 구조 설계

**목표**: 도메인별로 독립적인 Context를 만들어 DTO 상태와 액션을 관리

**작업 과정**:
1. **Context 타입 정의**: `src/domains/[도메인명]/frontend/contexts/[도메인명]-context.tsx`
   - State 인터페이스: DTO 배열 + 선택된 엔티티 + UI 상태 + 에러 상태
   - Actions 인터페이스: Server Actions를 기반으로 정의
   - Context 타입: State와 Actions를 포함

2. **Provider 구현**: 동일 파일에서 Provider와 Hook 함께 구현
   - useState로 DTO 상태 관리
   - useEffect로 초기 데이터 로드
   - Server Actions 호출 및 에러 처리

### 2.2 Context 설계 가이드라인

**State 구조**:
- **DTO 배열**: Server Actions에서 받은 직렬화된 데이터 (예: `OrganizationSummary[]`)
- **선택된 엔티티**: 현재 선택된 엔티티 ID (예: `selectedOrganizationId`)
- **UI 상태**: 로딩, 에러 상태 (예: `isLoading`, `error`)
- **영속성**: 쿠키를 통한 선택 상태 유지

**Actions 구조**:
- **선택 액션**: 엔티티 선택 및 쿠키 저장 (예: `selectOrganization`)
- **새로고침 액션**: Server Actions 호출하여 데이터 갱신 (예: `refreshOrganizations`)
- **에러 처리**: try-catch로 에러 상태 관리

**Provider 패턴**:
- 초기 데이터 로드를 위한 useEffect
- 쿠키 기반 상태 복원 로직
- Server Actions 호출 시 에러 처리
- 선택 우선순위: URL 파라미터 > 쿠키 > 기본값

---

## 3단계. Server Actions 연동 설계

### 3.1 Server Actions 구조 설계

**목표**: Technical Specification 패턴을 따라 Server Actions를 구현하여 DTO 반환

**작업 과정**:
1. **Server Actions 파일 생성**: `src/domains/[도메인명]/actions/[도메인명].actions.ts`
   - **의존성 주입** 패턴으로 Service Layer 활용
   - Software Design의 **Command 객체** 사용
   - **DTO 직렬화**하여 클라이언트에 반환

2. **에러 처리**: try-catch로 에러 처리하고 throw로 전파
   - 인증 에러: Supabase Auth 확인
   - 비즈니스 에러: Service Layer에서 발생
   - 시스템 에러: 예상치 못한 에러

### 3.2 Server Actions 설계 가이드라인

**Server Action 구조**:
```typescript
// 표준 패턴
export async function [액션명]Action(
  // 입력 파라미터들
): Promise<[DTOType]> {
  try {
    // 1. Supabase Auth 인증 확인
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Authentication required');

    // 2. 의존성 주입 (Repository, Service)
    const userRepository = new DrizzleUserRepository();
    const organizationRepository = new DrizzleOrganizationRepository();
    const supabaseAuthService = new SupabaseAuthService(supabase);
    const service = new UserManagementService(userRepository, organizationRepository, supabaseAuthService);

    // 3. Command 생성
    const command: [CommandType] = { /* ... */ };

    // 4. 도메인 로직 실행
    const result = await service.[methodName](command);
    if (result.isError()) throw new Error(result.error.message);

    // 5. DTO 직렬화 및 반환
    return {
      id: result.value.id.value, // Value Object → string
      name: result.value.entity.name,
      createdAt: result.value.entity.createdAt.toISOString(), // Date → string
    };
  } catch (error) {
    throw error; // 에러 전파
  }
}
```

**핵심 원칙**:
- **DTO 반환**: Domain Objects를 직렬화하여 반환
- **Command 객체**: Software Design의 Command를 그대로 활용
- **Service Layer**: 비즈니스 로직은 Service에서 처리
- **에러 전파**: try-catch로 에러를 catch하고 throw로 전파
- **revalidatePath**: 데이터 변경 시 관련 페이지 재검증

---

## 4단계. Custom Hook 설계

### 4.1 Hook 구조 설계

**목표**: Context를 사용하는 Custom Hook을 만들어 컴포넌트에서 쉽게 사용

**작업 과정**:
1. **메인 Hook 생성**: `src/domains/[도메인명]/frontend/hooks/use-[도메인명].ts`
   - Context에서 state와 actions를 가져옴
   - 비즈니스 로직 메서드 추가 (검색, 필터링, 검증 등)
   - DTO 데이터를 기반으로 한 유틸리티 함수 제공

2. **Context Hook**: Context 파일에서 기본 Hook 제공
   - Context 접근 및 에러 처리
   - Provider 내부에서만 사용 가능하도록 보장

### 4.2 Hook 설계 가이드라인

**메인 Hook 패턴**:
- **Context 연결**: Context Hook을 통해 도메인 Context 사용
- **비즈니스 로직**: DTO 데이터를 기반으로 한 유틸리티 메서드
- **선택적 데이터**: 현재 선택된 엔티티, 기본 엔티티 등
- **검증 메서드**: 권한 확인, 상태 검증 등

**Hook 메서드 예시**:
- `selectedOrganization`: 현재 선택된 조직 정보
- `defaultOrganization`: 기본 조직 정보
- `canSelectOrganization(id)`: 조직 선택 가능 여부
- `isDefaultOrganization(id)`: 기본 조직 여부
- `findOrganizationByName(name)`: 이름으로 조직 검색
- `ownedOrganizations`: 소유한 조직만 필터링

**Context Hook 패턴**:
- Context 접근 및 undefined 체크
- Provider 내부에서만 사용 가능하도록 에러 처리
- 타입 안전성 보장

---

## 5단계. 컴포넌트 연동 설계

### 5.1 컴포넌트 구조 설계

**목표**: Hook을 사용하여 도메인 로직과 UI를 분리한 컴포넌트 구현

**작업 과정**:
1. **도메인별 컴포넌트 폴더 생성**: `src/domains/[도메인명]/frontend/components/`
   - 각 도메인의 주요 기능별로 컴포넌트 분리
   - Hook을 통해 DTO 상태와 액션에 접근
   - UI 라이브러리 컴포넌트 활용

2. **컴포넌트 패턴 적용**:
   - **Switcher 컴포넌트**: 드롭다운으로 엔티티 선택 (예: OrganizationSwitcher)
   - **List 컴포넌트**: 엔티티 목록 표시
   - **Form 컴포넌트**: 입력 검증 및 제출 처리

### 5.2 컴포넌트 설계 가이드라인

**Hook 사용 패턴**:
- 컴포넌트에서 직접 Context 접근 금지
- 반드시 Custom Hook을 통해 접근
- DTO 데이터를 기반으로 한 UI 렌더링

**Switcher 컴포넌트 패턴**:
- 드롭다운 메뉴로 엔티티 선택
- 현재 선택된 엔티티 표시
- 선택 시 Hook의 select 메서드 호출
- 라우팅 연동 (필요시)

**에러 처리 패턴**:
- Hook에서 제공하는 에러 상태 활용
- 에러 메시지를 사용자 친화적으로 표시
- 로딩 상태와 에러 상태를 적절히 처리

**로딩 상태 처리**:
- Hook에서 제공하는 로딩 상태 활용
- 스피너, 스켈레톤 등으로 UX 향상
- 데이터가 없을 때의 빈 상태 처리

---

## 6단계. 앱 레벨 통합 설계

### 6.1 Provider 통합 설계

**목표**: 앱 전체에서 도메인 Context들을 사용할 수 있도록 Provider 설정

**작업 과정**:
1. **Root Layout에 Provider 추가**: `src/app/layout.tsx`
   - 각 도메인의 Provider를 중첩으로 배치
   - 초기 데이터를 Server Components에서 전달
   - 의존성 순서에 따라 Provider 순서 결정

2. **페이지별 Hook 사용**: 각 페이지에서 필요한 Hook만 사용
   - 전역 상태는 Provider를 통해 공유
   - 페이지별로 필요한 도메인 Hook만 import

### 6.2 통합 설계 가이드라인

**Provider 중첩 순서**:
- 의존성이 적은 도메인부터 상위에 배치
- 인증 관련 Provider는 가장 상위에 배치
- 각 도메인 Provider는 독립적으로 동작

**초기 데이터 전달**:
- Server Components에서 Server Actions 호출
- 초기 데이터를 Provider에 props로 전달
- 클라이언트에서 추가 로딩 최소화

**페이지별 사용 패턴**:
- 필요한 도메인 Hook만 선택적으로 사용
- 로딩 상태와 에러 상태를 적절히 처리
- 권한에 따른 조건부 렌더링 적용

**쿠키 기반 영속성**:
- 선택된 엔티티 상태를 쿠키로 저장
- 새로고침 시에도 선택 상태 유지
- URL 파라미터와 쿠키 우선순위 관리

---

## 💡 핵심 설계 패턴 정리

### 7.1 전체 아키텍처 플로우

```
Software Design (도메인 모델)
         ↓
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │    │  React Context   │    │ Server Actions  │
│                 │    │                  │    │                 │
│ • Custom Hook   │◄──►│ • DTO 상태 관리  │◄──►│ • DTO 직렬화    │
│ • Switcher UI   │    │ • 선택 상태      │    │ • Command 객체  │
│ • 에러 처리     │    │ • 쿠키 영속성    │    │ • Service Layer │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 7.2 도메인 연동 패턴

**DTO 기반 연동**:
- Software Design → DTO 인터페이스 정의
- Domain Objects → DTO 직렬화
- Plain Object만 사용하여 Next.js 호환성 보장

**상태 관리**:
- 도메인별 독립적인 Context
- DTO 배열 + 선택된 엔티티 상태
- 쿠키 기반 영속성으로 선택 상태 유지

**에러 처리**:
- try-catch로 에러 처리하고 throw로 전파
- Context에서 에러 상태 관리
- Hook에서 에러 상태를 컴포넌트에 전달

### 7.3 개발 프로세스

1. **Software Design 완료** → 도메인 모델 확정
2. **DTO 정의** → 직렬화 가능한 인터페이스 정의
3. **Context 설계** → DTO 상태 + 액션 인터페이스 정의
4. **Server Actions** → DTO 직렬화 + Service Layer 연동
5. **Hook 구현** → Context 연결 + 비즈니스 로직 메서드
6. **컴포넌트** → Hook 사용 + Switcher UI 구현
7. **앱 통합** → Provider 설정 + 초기 데이터 전달

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

### Server Actions
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

## 📚 References

### 필수 선행 문서
- [Software Design 문서](../domains/[도메인명]/software-design.md) - Aggregate, Command, Event 정의
- [Technical Specification 가이드](./05-technical-specification-guide.md) - DTO 직렬화, Service Layer 패턴
- [Code Conventions](./08-code-conventions.md) - DTO 직렬화 컨벤션

### 기술 스택 가이드
- Next.js 14 (App Router, Server Actions, revalidatePath)
- React 18 (Context API, useState, useEffect)
- TypeScript (인터페이스, 타입 정의)
- Supabase (인증, 데이터베이스)
- Drizzle ORM (타입 안전한 쿼리)

---

---

## 📊 8단계. 프로젝트 진행 상황 업데이트

### 8.1 project-progress.md 업데이트

**목표**: Frontend Specification 완료 상태를 프로젝트 전체 진행 상황에 반영

**작업 과정**:
```bash
# 1. 현재 날짜 확인
date

# 2. project-progress.md 파일 열기
# docs/project-progress.md
```

**업데이트 내용**:
1. **Overall Progress Overview 테이블 업데이트**:
   ```markdown
   | [Domain Name] | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | **100%** |
   ```

2. **해당 도메인 섹션 업데이트**:
   ```markdown
   ### [N]. [Domain Name] Domain ✅ **완료**
   
   #### 설계 진행 상황
   - [x] **Event Storming**: `docs/event-domain-design/[domain-name]/event-storm.md`
   - [x] **Process Model**: `docs/event-domain-design/[domain-name]/process-model.md`
   - [x] **Software Design**: `docs/event-domain-design/[domain-name]/software-design.md`
   - [x] **Technical Design**:
     - [x] Database Schema: `docs/event-domain-design/[domain-name]/project-technical-design/database-schema.md`
     - [x] API Specification: `docs/event-domain-design/[domain-name]/project-technical-design/api-specification.md`
     - [x] Technical Specification: `docs/event-domain-design/[domain-name]/technical-specification.md`
   - [x] **Frontend Specification**: `docs/event-domain-design/[domain-name]/frontend-specification.md`
     - React Context 및 Hook 설계
     - Server Actions 연동 패턴
     - 컴포넌트 구조 및 통합 방법
   ```

3. **전체 진행률 업데이트**:
   - 해당 도메인의 진행률을 80% → 100%로 업데이트
   - 완료된 도메인 수 증가에 따른 전체 백분율 재계산
   - Next Steps 섹션에서 해당 도메인을 완료 상태로 이동

### 8.2 Git 커밋

```bash
# 변경사항 커밋
git add docs/event-domain-design/[domain-name]/frontend-specification.md docs/project-progress.md
git commit -m "feat(frontend-spec): complete [Domain Name] domain frontend specification

- Define React Context and Hook patterns
- Add Server Actions integration strategy  
- Include component structure and app-level integration
- Update project progress to 100% for [Domain Name] domain"

# 브랜치 푸시
git push origin domain/[번호]-[domain-name]

# PR 생성 (도메인 완료)
gh pr create --title "feat: complete [Domain Name] domain design" \
  --body "Complete all design phases for [Domain Name] domain:
- Event Storming
- Process Model  
- Software Design
- Technical Specification
- Frontend Specification

Ready for implementation phase."
```

---

이 Frontend Specification 가이드는 **Software Design에서 정의된 도메인 모델을 React 프론트엔드에서 어떻게 활용할지에 대한 프로세스 중심 가이드**입니다. 각 도메인마다 일관된 패턴으로 프론트엔드를 구현할 수 있도록 설계되었습니다.
