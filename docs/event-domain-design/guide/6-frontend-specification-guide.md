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

### 1.1 타입 파일 구조 정의

**목표**: Software Design의 Aggregate 타입을 프론트엔드에서 재사용할 수 있는 구조로 정의

**작업 과정**:
1. **기본 도메인 타입 파일 생성**: `src/domains/[도메인명]/types.ts`
   - Software Design의 Aggregate 속성을 그대로 interface로 정의
   - Value Object들을 type alias로 정의
   - DB 스키마와 다른 부분은 주석으로 명시

2. **클라이언트 확장 타입 파일 생성**: `src/domains/[도메인명]/client-types.ts`
   - UI에서 필요한 추가 필드들 (예: `memberCount`, `role` 등)
   - 여러 Aggregate를 조합한 View 타입들
   - 폼 입력용 타입들

**파일 구조 예시**:
```
src/domains/[도메인명]/
├── types.ts              # Software Design 기반 기본 타입
├── client-types.ts       # 클라이언트 전용 확장 타입
├── commands/             # Command 객체들
├── errors/              # 에러 타입들
└── hooks/               # React Hook들
```

### 1.2 타입 정의 가이드라인

**Aggregate 타입 정의 시 주의사항**:
- Software Design의 속성을 **정확히** 동일하게 정의
- DB 스키마와 다른 부분(예: 계산 필드)은 주석으로 설명
- 클라이언트에서만 필요한 필드는 별도 파일로 분리

**Value Object 정의**:
- 단순 타입은 `type alias` 사용
- 복잡한 검증이 필요한 경우 `class` 고려

### 1.3 Read Models 타입 활용

**목표**: Technical Specification에서 정의된 Read Models를 프론트엔드에서 효과적으로 활용

**작업 과정**:
1. **Read Models 타입 Import**: Technical Specification의 Read Models 타입을 그대로 활용
2. **Context 상태 정의**: Read Models를 Context 상태로 관리
3. **초기 로드 및 갱신**: Server Actions를 통한 Read Models 데이터 관리

**활용 예시**:
- `UserOrganizationView`: 사용자-조직 관계 정보 (드롭다운, 헤더 등)
- `WorkspaceHierarchyView`: 워크스페이스-페이지 구조 (네비게이션, 사이드바 등)
- `ProjectSummaryView`: 프로젝트 요약 정보 (대시보드, 카드 등)

---

## 2단계. React Context 설계

### 2.1 Context 구조 설계

**목표**: 도메인별로 독립적인 Context를 만들어 상태와 액션을 관리

**작업 과정**:
1. **Context 타입 정의**: `src/contexts/[도메인명]Context.tsx`
   - State 인터페이스: 도메인 엔티티들 + UI 상태 + 에러 상태
   - Actions 인터페이스: Software Design의 Command들을 기반으로 정의
   - Context 타입: State와 Actions를 포함

2. **Provider 구현**: `src/contexts/[도메인명]Provider.tsx`
   - useState로 상태 관리
   - useEffect로 초기 데이터 로드
   - 각 액션을 Server Actions와 연결

### 2.2 Context 설계 가이드라인

**State 구조**:
- **도메인 엔티티**: Software Design의 Aggregate들
- **UI 상태**: 로딩, 진행 중 상태들 (예: `isLoading`, `isProcessing`)
- **에러 상태**: 통합된 에러 메시지

**Actions 구조**:
- Software Design의 **Command**들을 기반으로 메서드 정의
- **낙관적 업데이트** 패턴 적용 (UI 먼저 업데이트 → 서버 검증 → 실패 시 롤백)
- **에러 처리** 및 **상태 복구** 로직 포함

**Provider 패턴**:
- 초기 데이터 로드를 위한 useEffect
- Server Actions 호출 시 try-catch로 에러 처리
- 상태 업데이트는 setState의 함수형 업데이트 사용

---

## 3단계. Server Actions 연동 설계

### 3.1 Server Actions 구조 설계

**목표**: Technical Specification 패턴을 따라 Server Actions를 구현하여 Context와 연결

**작업 과정**:
1. **Server Actions 파일 생성**: `src/server-actions/[도메인명]/[액션명].action.ts`
   - Technical Specification의 **Result 패턴** 사용
   - **의존성 주입** 패턴으로 Service Layer 활용
   - Software Design의 **Command 객체** 사용

2. **에러 타입 정의**: `src/domains/[도메인명]/errors/[도메인명].errors.ts`
   - 체계적인 에러 코드 enum 정의
   - 특화된 에러 클래스들 (Authentication, Authorization, BusinessRule, Validation)

### 3.2 Server Actions 설계 가이드라인

**Server Action 구조**:
```typescript
// 표준 패턴
export async function [액션명]Action(
  // 입력 파라미터들
): Promise<Result<SuccessType, ErrorType>> {
  try {
    // 1. Input 검증
    // 2. 의존성 주입 (Service, Repository 등)
    // 3. Command 생성 및 검증
    // 4. 도메인 로직 실행
    // 5. 크로스-도메인 이벤트 처리
    // 6. 관련 페이지 재검증 (revalidatePath)
    // 7. 성공 응답
    return Result.ok(successData);
  } catch (error) {
    // 8. 에러 분류 및 처리
    return Result.fail(appropriateErrorCode);
  }
}
```

**핵심 원칙**:
- **Result 패턴**: 성공/실패를 명시적으로 구분
- **Command 객체**: Software Design의 Command를 그대로 활용
- **Service Layer**: 비즈니스 로직은 Service에서 처리
- **에러 분류**: 인증, 권한, 비즈니스 규칙, 검증 에러 구분

---

## 4단계. Custom Hook 설계

### 4.1 Hook 구조 설계

**목표**: Context를 사용하는 Custom Hook을 만들어 컴포넌트에서 쉽게 사용

**작업 과정**:
1. **메인 Hook 생성**: `src/domains/[도메인명]/hooks/use-[도메인명].ts`
   - Context에서 state와 actions를 가져옴
   - 낙관적 업데이트 로직 포함
   - Result 패턴 기반 에러 처리

2. **특화된 Hook들 생성**: 필요에 따라 개별 Hook 제공
   - `useCurrentUser()`: 현재 사용자 정보만
   - `use[도메인명]Actions()`: 액션만 필요한 경우
   - `use[특정엔티티]()`: 특정 엔티티만 필요한 경우

### 4.2 Hook 설계 가이드라인

**메인 Hook 패턴**:
- **Context 연결**: useContext로 도메인 Context 사용
- **낙관적 업데이트**: useOptimistic 또는 useState로 즉시 UI 반영
- **비동기 처리**: useTransition으로 Server Actions 호출
- **에러 처리**: Result 패턴의 에러 코드별 분기 처리

**특화 Hook 패턴**:
- 메인 Hook을 기반으로 필요한 부분만 추출
- 컴포넌트에서 불필요한 의존성 방지
- 성능 최적화를 위한 선택적 구독

---

## 5단계. 컴포넌트 연동 설계

### 5.1 컴포넌트 구조 설계

**목표**: Hook을 사용하여 도메인 로직과 UI를 분리한 컴포넌트 구현

**작업 과정**:
1. **도메인별 컴포넌트 폴더 생성**: `src/components/[도메인명]/`
   - 각 도메인의 주요 기능별로 컴포넌트 분리
   - Hook을 통해 상태와 액션에 접근
   - UI 라이브러리 컴포넌트 활용

2. **컴포넌트 패턴 적용**:
   - **Presentation 컴포넌트**: UI만 담당
   - **Container 컴포넌트**: Hook을 사용하여 로직 처리
   - **Form 컴포넌트**: 입력 검증 및 제출 처리

### 5.2 컴포넌트 설계 가이드라인

**Hook 사용 패턴**:
- 컴포넌트에서 직접 Context 접근 금지
- 반드시 Custom Hook을 통해 접근
- 필요한 데이터만 구독하여 불필요한 리렌더링 방지

**에러 처리 패턴**:
- Hook에서 발생한 에러를 try-catch로 처리
- 사용자 친화적 메시지로 변환
- toast, alert 등으로 즉시 피드백 제공

**로딩 상태 처리**:
- Hook에서 제공하는 로딩 상태 활용
- 버튼 비활성화, 스피너 표시 등으로 UX 향상

---

## 6단계. 앱 레벨 통합 설계

### 6.1 Provider 통합 설계

**목표**: 앱 전체에서 도메인 Context들을 사용할 수 있도록 Provider 설정

**작업 과정**:
1. **Root Layout에 Provider 추가**: `src/app/layout.tsx`
   - 각 도메인의 Provider를 중첩으로 배치
   - 의존성 순서에 따라 Provider 순서 결정

2. **페이지별 Hook 사용**: 각 페이지에서 필요한 Hook만 사용
   - 전역 상태는 Provider를 통해 공유
   - 페이지별로 필요한 도메인 Hook만 import

### 6.2 통합 설계 가이드라인

**Provider 중첩 순서**:
- 의존성이 적은 도메인부터 상위에 배치
- 인증 관련 Provider는 가장 상위에 배치
- 각 도메인 Provider는 독립적으로 동작

**페이지별 사용 패턴**:
- 필요한 도메인 Hook만 선택적으로 사용
- 로딩 상태와 에러 상태를 적절히 처리
- 권한에 따른 조건부 렌더링 적용

---

## 💡 핵심 설계 패턴 정리

### 7.1 전체 아키텍처 플로우

```
Software Design (도메인 모델)
         ↓
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │    │  React Context   │    │ Server Actions  │
│                 │    │                  │    │                 │
│ • Custom Hook   │◄──►│ • 도메인별 상태  │◄──►│ • Result 패턴   │
│ • 낙관적 업데이트│    │ • 액션 메서드    │    │ • Command 객체  │
│ • 에러 처리     │    │ • 에러 관리      │    │ • Service Layer │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 7.2 도메인 연동 패턴

**타입 연동**:
- Software Design → 프론트엔드 타입 정의
- Aggregate 속성을 interface로 변환
- 클라이언트 전용 확장 타입 분리

**상태 관리**:
- 도메인별 독립적인 Context
- Command 기반 액션 메서드
- 낙관적 업데이트 + 서버 검증

**에러 처리**:
- Result 패턴으로 성공/실패 명시적 구분
- 에러 코드별 사용자 친화적 메시지 변환
- Context → Hook → Component 레벨별 처리

### 7.3 개발 프로세스

1. **Software Design 완료** → 도메인 모델 확정
2. **타입 정의** → 기본 타입 + 클라이언트 확장 타입
3. **Context 설계** → 상태 + 액션 인터페이스 정의
4. **Server Actions** → Technical Specification 패턴 적용
5. **Hook 구현** → Context 연결 + 낙관적 업데이트
6. **컴포넌트** → Hook 사용 + UI 구현
7. **앱 통합** → Provider 설정 + 페이지 연결

---

## ✅ 검증 체크리스트

### 타입 연동
- [ ] Software Design의 Aggregate 타입이 정확히 재현되었는가?
- [ ] 클라이언트 전용 타입이 별도 파일로 분리되었는가?
- [ ] Value Object들이 적절한 타입으로 정의되었는가?

### Context 설계
- [ ] 도메인별로 독립적인 Context가 생성되었는가?
- [ ] State와 Actions가 명확히 분리되었는가?
- [ ] 초기 데이터 로드 로직이 구현되었는가?

### Server Actions
- [ ] Technical Specification의 Result 패턴을 사용하는가?
- [ ] Command 객체를 활용하여 입력을 구조화했는가?
- [ ] 의존성 주입 패턴으로 Service Layer를 사용하는가?
- [ ] 에러 분류가 체계적으로 이루어지는가?

### Hook 구현
- [ ] Context를 적절히 추상화한 Hook이 구현되었는가?
- [ ] 낙관적 업데이트 로직이 포함되었는가?
- [ ] Result 패턴 기반 에러 처리가 구현되었는가?

### 컴포넌트 연동
- [ ] 컴포넌트에서 직접 Context 접근을 피하고 Hook을 사용하는가?
- [ ] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [ ] 사용자 친화적인 피드백이 제공되는가?

### 앱 통합
- [ ] Provider가 적절한 순서로 중첩 배치되었는가?
- [ ] 페이지별로 필요한 Hook만 선택적으로 사용하는가?

---

## 📚 References

### 필수 선행 문서
- [Software Design 문서](../domains/[도메인명]/software-design.md) - Aggregate, Command, Event 정의
- [Technical Specification 템플릿](../template/4-technical-specification-template.md) - Result 패턴, Service Layer 패턴

### 기술 스택 가이드
- Next.js 14 (App Router, Server Actions)
- React 18 (Context API, useOptimistic, useTransition)
- TypeScript (인터페이스, 타입 정의)

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
