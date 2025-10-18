# Workspace Management Domain - Stories

## 📋 Story 목록 및 우선순위

### Phase 1: Workspace-Page 조회 및 네비게이션 (High Priority)
1. **Story-001: Workspace-Page 목록 조회 및 페이지 선택** (5 points, High)
   - **의존성**: Organization Management Story-001 (조직 목록 조회)
   - **목표**: 조직 페이지 접근 → Workspace-Page 트리 조회 → 페이지 선택
   - **완료 기준**: 권한 검증, 쿠키 기반 페이지 선택, 사이드바 표시

### Phase 2: Workspace 생성 및 관리 (High Priority)
2. **Story-002: Workspace 생성 및 정보 수정** (5 points, High)
   - **의존성**: Story-001
   - **목표**: 조직 소유자가 Workspace 생성 및 정보 수정
   - **완료 기준**: Workspace 생성 모달, 설정 모달, 초기 페이지 자동 생성

3. **Story-003: Workspace 멤버 초대 및 수락/거절** (8 points, High)
   - **의존성**: Story-002
   - **목표**: Admin이 팀 멤버를 Workspace에 초대하고, 초대받은 사람이 수락/거절
   - **완료 기준**: 이메일 검색, 초대 발송, 알림 통합, 수락/거절 처리

### Phase 3: Page 생성 및 계층 구조 관리 (High Priority)
4. **Story-004: Page 생성 및 계층 구조 관리** (8 points, High)
   - **의존성**: Story-001, Story-002
   - **목표**: Workspace 멤버가 Page 생성, 드래그앤드롭 이동, 인라인 편집
   - **완료 기준**: 인라인 생성, 드래그앤드롭, 순환 참조 방지, 제목/아이콘 편집

### Phase 4: 즐겨찾기 및 UX 향상 (Medium Priority)
5. **Story-005: 페이지 즐겨찾기 토글** (3 points, Medium)
   - **의존성**: Story-001
   - **목표**: 자주 사용하는 페이지를 즐겨찾기에 추가하여 빠른 접근
   - **완료 기준**: Star 아이콘 토글, 사이드바 즐겨찾기 섹션, Optimistic update

### Phase 5: Workspace 고급 관리 (계획 중)
6. **Story-006: Page 템플릿 복제** (5 points, Medium) - 📋 계획 중
   - **의존성**: Story-004
   - **목표**: 기존 Page를 템플릿으로 복제
   - **완료 기준**: 복제 기능, 계층 구조 유지, 콘텐츠 복사

7. **Story-007: Workspace 보관 및 복원** (5 points, Low) - 📋 계획 중
   - **의존성**: Story-002
   - **목표**: Workspace를 보관하고 복원할 수 있도록 함
   - **완료 기준**: 소프트 삭제, 30일 보관, 복원 기능

8. **Story-008: Page 삭제 및 복원** (3 points, Low) - 📋 계획 중
   - **의존성**: Story-004
   - **목표**: Page를 삭제하고 복원할 수 있도록 함
   - **완료 기준**: 소프트 삭제, 휴지통, 하위 페이지 처리

---

## 🎯 Sprint 계획 및 현재 진행 상황

### Sprint 5: Workspace 네비게이션 (1주) - 📋 계획 중
**목표**: 사용자가 Workspace-Page 목록을 조회하고 페이지를 선택할 수 있도록 함

**포함 Story**:
- Story-001: Workspace-Page 목록 조회 및 페이지 선택 (5 points) - 📋 설계 완료

**총 포인트**: 5 points  
**현재 상황**: 
- Event Storming 완료 ✓
- Process Model 완료 ✓
- Software Design 완료 ✓
- User Flow 완료 ✓
- Testing Strategy 완료 ✓
- Technical Specification 완료 ✓
- Frontend Specification 완료 ✓
- Database Schema 완료 ✓

### Sprint 6: Workspace 관리 (2주) - 📋 계획 중
**목표**: 사용자가 Workspace를 생성/수정하고 멤버를 초대할 수 있도록 함

**포함 Story**:
- Story-002: Workspace 생성 및 정보 수정 (5 points) - 📋 설계 완료
- Story-003: Workspace 멤버 초대 및 수락/거절 (8 points) - 📋 설계 완료

**총 포인트**: 13 points  
**현재 상황**: 설계 완료, 구현 대기 중

### Sprint 7: Page 관리 및 즐겨찾기 (2주) - 📋 계획 중
**목표**: 사용자가 Page를 생성/관리하고 즐겨찾기를 사용할 수 있도록 함

**포함 Story**:
- Story-004: Page 생성 및 계층 구조 관리 (8 points) - 📋 설계 완료
- Story-005: 페이지 즐겨찾기 토글 (3 points) - 📋 설계 완료

**총 포인트**: 11 points  
**현재 상황**: 설계 완료, 구현 대기 중

---

## 🔗 의존성 다이어그램

```
Organization Management Story-001 (조직 목록 조회)
Organization Management Story-002 (조직 선택)
    ↓
Story-001 (Workspace-Page 목록 조회 및 페이지 선택)
    ↓                                ↓
Story-002 (Workspace 생성 및 수정)  Story-005 (즐겨찾기)
    ↓
Story-003 (멤버 초대)  ←─── Notification Domain (알림)
    ↓
Story-004 (Page 생성 및 관리)
    ↓
Story-006 (Page 템플릿 복제) - 계획 중
    ↓
Story-007 (Workspace 보관) - 계획 중
Story-008 (Page 삭제) - 계획 중
```

---

## 📚 도메인 문서 참조

### 설계 문서 (완료)
- [Event Storming](../../event-domain-design/domains/workspace-management-domain/01-event-storm.md)
- [Process Model](../../event-domain-design/domains/workspace-management-domain/02-process-model.md)
- [Software Design](../../event-domain-design/domains/workspace-management-domain/03-software-design.md)
- [User Flow](../../event-domain-design/domains/workspace-management-domain/03-user-flow.md)
- [Testing Strategy](../../event-domain-design/domains/workspace-management-domain/04-testing-strategy.md)
- [Technical Specification](../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md)
- [Frontend Specification](../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md)
- [Database Schema](../../event-domain-design/domains/workspace-management-domain/06-db-schema.md)

### 핵심 아키텍처 결정
- **계층 구조 패턴**: Parent ID + depth 캐시
- **권한 모델**: Layered Security (RLS + Application-level)
- **Page 트리**: PostgreSQL 재귀 CTE
- **Frontend**: React Context + Optimistic Update
- **도메인 통합**: Notification Domain (초대 알림)

---

## 🎯 Epic 연결

### Epic-002: Workspace & Page 관리
**목표**: 팀별로 작업 공간을 분리하고 페이지를 계층적으로 관리

**완료된 Story**: 0/5 (0%)
- Story-001: Workspace-Page 목록 조회 (설계 완료)
- Story-002: Workspace 생성 및 수정 (설계 완료)
- Story-003: 멤버 초대 (설계 완료)
- Story-004: Page 관리 (설계 완료)
- Story-005: 즐겨찾기 (설계 완료)

**Epic 진행률**: 설계 100% 완료, 구현 0% 완료

---

## 📊 전체 Progress 요약

### 완료된 설계 (Scenario 0~5)
- ✅ **Event Storming**: 도메인 이벤트 및 명령 정의
- ✅ **Process Model**: 5개 Scenario의 비즈니스 프로세스
- ✅ **Software Design**: 2개 Aggregate (Workspace, Page)
- ✅ **User Flow**: 25개 Screen 정의
- ✅ **Testing Strategy**: 221개 테스트 케이스
- ✅ **Technical Specification**: 9개 Server Actions, 4개 Repository
- ✅ **Frontend Specification**: 19개 컴포넌트, 15개 Context Actions
- ✅ **Database Schema**: 5개 테이블, RLS 정책

### 구현 대기 중
- 📋 **Backend**: Aggregates, Entities, Value Objects, Repositories, Services
- 📋 **Database**: 5개 테이블 마이그레이션
- 📋 **Server Actions**: 12개 Actions
- 📋 **Frontend**: Context, Hooks, 19개 컴포넌트
- 📋 **Tests**: 221개 테스트 (Unit, Integration, E2E)

### 예상 구현 시간
- **Backend**: 45-55시간 (TDD 기반)
- **Frontend**: 46-57시간 (컴포넌트 + 테스트)
- **총**: 약 91-112시간 (11-14일, 2명 기준)

---

## 🚀 다음 단계

### 즉시 시작 가능
1. **Story-001 구현 시작** (Workspace-Page 목록 조회)
   - TDD 기반 Backend 구현
   - Frontend Context 및 컴포넌트 구현
   - E2E 테스트 작성

### 준비 사항
- [ ] Sprint 5 계획 수립
- [ ] 개발팀 리소스 할당
- [ ] Story-001 세부 Task 정의
- [ ] Git 브랜치 전략 수립

---

## 📁 Story 문서 위치

```
docs/agile-planning/stories/workspace-management/
├── README.md                                    # 이 문서
├── story-001-workspace-page-navigation.md       # 작성 예정
├── story-002-workspace-creation-management.md   # 작성 예정
├── story-003-workspace-member-invitation.md     # 작성 예정
├── story-004-page-hierarchy-management.md       # 작성 예정
└── story-005-page-favorites.md                  # 작성 예정
```

---

## 💡 핵심 특징

### 설계 품질
- ✅ **DDD 기반 설계**: Aggregate, Entity, Value Object 명확히 정의
- ✅ **CQRS 패턴**: Command/Query 분리
- ✅ **Event Sourcing 준비**: 도메인 이벤트 발행
- ✅ **계층적 데이터**: Parent ID + depth 캐시로 성능 최적화
- ✅ **Layered Security**: RLS + Application-level 권한 체크

### 기술 스택
- **Backend**: TypeScript, Drizzle ORM, PostgreSQL
- **Frontend**: React 19, Next.js 15, shadcn/ui
- **Testing**: Vitest, React Testing Library, Playwright
- **Database**: PostgreSQL (재귀 CTE), Supabase

### 도메인 통합
- **Organization Domain**: 조직 멤버십, 권한 확인
- **Notification Domain**: 초대 알림 (Scenario 3)
- **User Management Domain**: 프로필 조회

---

**Workspace Management Domain의 모든 Story 설계가 완료되었습니다!** 🎉  
이제 Sprint 계획을 수립하고 구현을 시작할 수 있습니다.

