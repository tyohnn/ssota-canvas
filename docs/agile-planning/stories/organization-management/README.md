# Organization Management Domain - Stories

## 📋 Story 목록 및 우선순위

### Phase 1: 조직 조회 및 선택 (High Priority)
1. **Story-001: 조직 목록 조회** (2 points, High)
   - **의존성**: User Management Story-003 (기본 조직 자동 생성)
   - **목표**: 사용자의 조직 목록 조회 (소유자 + 멤버 조직)
   - **완료 기준**: 조직 목록 표시, 역할 정보 포함, 정렬 적용

2. **Story-002: 조직 선택 및 컨텍스트 설정** (2 points, High)
   - **의존성**: Story-001
   - **목표**: 작업할 조직 선택 및 컨텍스트 설정
   - **완료 기준**: 조직 선택, 컨텍스트 상태 관리, 쿠키 저장

### Phase 2: 조직 생성 및 멤버 초대 (Medium Priority)
3. **Story-003: 조직 생성** (3 points, Medium)
   - **의존성**: Story-002
   - **목표**: 사용자가 새 조직을 생성할 수 있도록 함
   - **완료 기준**: 조직 생성, 조직 타입 선택, 자동 컨텍스트 전환

4. **Story-004: 멤버 초대** (5 points, Medium)
   - **의존성**: Story-003
   - **목표**: 조직에 새 멤버를 초대할 수 있도록 함
   - **완료 기준**: 초대 생성, 알림 발송, 초대 수락/거절

### Phase 3: 조직 멤버십 관리 (High Priority)
5. **Story-005: 멤버 역할 변경** (5 points, High)
   - **의존성**: Story-004
   - **목표**: 멤버의 역할을 변경할 수 있도록 함
   - **완료 기준**: 계층적 권한 시스템, 역할 변경, Layered Authorization

### Phase 4: 개인 워크스페이스 시스템 (High Priority)
6. **Story-006: 개인 워크스페이스 자동 생성** (5 points, High) - 📋 구현 대기 중
   - **의존성**: Story-003, Story-004
   - **목표**: 조직 생성 및 초대 승낙 시 개인 워크스페이스 자동 생성
   - **완료 기준**: Default + 개인 워크스페이스 생성, 접근 제한, UI 배지 표시

### Phase 5: 조직 관리 고급 기능 (계획 중)
7. **Story-007: 멤버 제거** (3 points, Medium) - 📋 계획 중
   - **의존성**: Story-006
   - **목표**: 조직에서 멤버를 제거할 수 있도록 함
   - **완료 기준**: 멤버 제거, 워크스페이스 이전, 세션 무효화, 개인 워크스페이스 처리

8. **Story-008: 조직 소유권 이전** (5 points, Medium) - 📋 계획 중
   - **의존성**: Story-005
   - **목표**: 조직 소유권을 다른 멤버에게 이전할 수 있도록 함
   - **완료 기준**: 소유권 이전, 권한 변경, 확인 코드 입력, 개인 워크스페이스 유지

9. **Story-009: 조직 삭제** (3 points, Low) - 📋 계획 중
   - **의존성**: Story-007, Story-008
   - **목표**: 조직을 삭제할 수 있도록 함
   - **완료 기준**: 소프트 삭제, 30일 보관, 관련 데이터 정리, 개인 워크스페이스 정리

---

## 🎯 Sprint 계획 및 현재 진행 상황

### Sprint 2: 조직 조회 및 선택 (1주) - 🟢 완료 (100% 완료)
**목표**: 사용자가 조직을 조회하고 선택할 수 있도록 함

**포함 Story**:
- Story-001: 조직 목록 조회 (2 points) - 🟢 100% 완료
- Story-002: 조직 선택 및 컨텍스트 설정 (2 points) - 🟢 100% 완료

**총 포인트**: 4 points  
**현재 상황**: 기능 구현 및 테스트 코드 모두 완료

### Sprint 3: 조직 생성 및 멤버 초대 (2주) - 🟢 완료 (100% 완료)
**목표**: 사용자가 새 조직을 생성하고 멤버를 초대할 수 있도록 함

**포함 Story**:
- Story-003: 조직 생성 (3 points) - 🟢 100% 완료
- Story-004: 멤버 초대 (5 points) - 🟢 100% 완료

**총 포인트**: 8 points  
**현재 상황**: Layered Security Model 적용 완료, Notification Service 통합 완료

### Sprint 4: 멤버십 관리 (1주) - 🟢 완료 (100% 완료)
**목표**: 조직 내 멤버 역할을 관리할 수 있도록 함

**포함 Story**:
- Story-005: 멤버 역할 변경 (5 points) - 🟢 100% 완료

**총 포인트**: 5 points  
**현재 상황**: TDD 기반 구현 완료, Layered Authorization 적용, 38/38 테스트 통과

### Sprint 5: 개인 워크스페이스 시스템 (1주) - 🟡 구현 대기 중
**목표**: 조직 생성 및 초대 승낙 시 개인 워크스페이스 자동 생성

**포함 Story**:
- Story-006: 개인 워크스페이스 자동 생성 (5 points) - 🟡 구현 대기 중

**총 포인트**: 5 points  
**예상 일정**: 3일 (Backend 1일 + Database/Frontend 1일 + Testing 1일)

---

## 🔗 의존성 다이어그램

```
User Management Story-003 (기본 조직 자동 생성)
    ↓
Story-001 (조직 목록 조회)
    ↓
Story-002 (조직 선택 및 컨텍스트 설정)
    ↓
Story-003 (조직 생성) ────┐
    ↓                     │
Story-004 (멤버 초대) ────┤
    ↓                     │
Story-005 (멤버 역할 변경) │
    ↓                     │
Story-006 (개인 워크스페이스 자동 생성) ←┘ - 구현 대기 중
    ↓
Story-007 (멤버 제거) - 계획 중
    ↓
Story-008 (조직 소유권 이전) - 계획 중
    ↓
Story-009 (조직 삭제) - 계획 중
```

---

## 📊 Story 포인트 분석

### 포인트 분포 (현재 정의된 Story)
- **5 points**: 3개 (Story-004, Story-005, Story-006)
- **3 points**: 1개 (Story-003)
- **2 points**: 2개 (Story-001, Story-002)

### 총 포인트: 22 points (현재 정의된 Story 기준)

### 예상 개발 기간 및 현재 상황
- **Sprint 2**: 4 points (1주) - 🟢 완료
- **Sprint 3**: 8 points (2주) - 🟢 완료
- **Sprint 4**: 5 points (1주) - 🟢 완료
- **Sprint 5**: 5 points (1주) - 🟡 구현 대기 중

**총 예상 기간**: 5주 (약 1.25개월)  
**현재 진행률**: 77% 완료 (17/22 points 완료)

### 향후 계획 (Phase 5)
- **Story-007**: 멤버 제거 (3 points)
- **Story-008**: 조직 소유권 이전 (5 points)
- **Story-009**: 조직 삭제 (3 points)

**추가 포인트**: 11 points (약 2주)  
**전체 예상 기간**: 7주 (약 1.75개월)

---

## 🎯 Definition of Done (전체)

### 기능적 완료
- [x] 조직 조회 및 선택 기능 동작 (Story-001, Story-002) ✅
- [x] 조직 생성 기능 동작 (Story-003) ✅
- [x] 멤버 초대 및 수락 기능 동작 (Story-004) ✅
- [x] 멤버 역할 변경 기능 동작 (Story-005) ✅
- [x] 에러 처리 및 예외 상황 대응 ✅

### 기술적 완료
- [x] Story-001~005 단위 테스트 커버리지 95% 이상 ✅
- [x] Story-001~005 통합 테스트 통과 ✅
- [x] 코드 리뷰 완료 ✅
- [x] 성능 요구사항 충족 ✅

### 품질 완료
- [x] Layered Security Model 적용 (Story-004) ✅
- [x] Notification Service 통합 완료 (Story-004) ✅
- [x] Layered Authorization 적용 (Story-005) ✅
- [x] 계층적 권한 시스템 구현 (Story-005) ✅
- [x] 보안 취약점 0개 ✅
- [x] 접근성 기준 충족 (shadcn/ui) ✅

---

## 📁 관련 문서

### Epic 문서
- [Epic-002: Organization Management](../../epics/epic-002-organization-management.md) (작성 필요)

### 도메인 설계 문서
- [Event Storming](../../../event-domain-design/domains/organization-management-domain/01-event-storm.md)
- [Process Model](../../../event-domain-design/domains/organization-management-domain/02-process-model.md) - Scenario 1-6
- [Software Design](../../../event-domain-design/domains/organization-management-domain/03-software-design.md)
- [Testing Strategy](../../../event-domain-design/domains/organization-management-domain/04-testing-strategy.md)
- [Technical Specification](../../../event-domain-design/domains/organization-management-domain/05-technical-specification.md) - v9.0
- [Database Schema](../../../event-domain-design/domains/organization-management-domain/06-db-schema.md) - v8.0
- [Frontend Specification](../../../event-domain-design/domains/organization-management-domain/07-frontend-specification.md) - v9.0

### 가이드 문서
- [Story 정의 가이드](../../guide/04-story-definition-guide.md)
- [Sprint 계획 가이드](../../guide/05-sprint-planning-guide.md)

---

## 🚀 다음 단계 및 우선순위

### 즉시 진행 필요 (High Priority)
1. **Sprint 5 시작**: Story-006 개인 워크스페이스 자동 생성 기능 구현
   - Backend: WorkspaceCrudService.createPersonalWorkspace 구현
   - Database: is_personal, owner_id 마이그레이션
   - Frontend: 개인 워크스페이스 배지 및 접근 제한 UI
   - Testing: Integration + E2E 테스트

### 다음 Sprint 준비 (Medium Priority)
2. **Story-007 정의**: 멤버 제거 기능 (Scenario 4, 개인 워크스페이스 처리 포함)
3. **Story-008 정의**: 조직 소유권 이전 기능 (Scenario 5)
4. **Story-009 정의**: 조직 삭제 기능 (Scenario 6, 개인 워크스페이스 정리 포함)

### 장기 계획 (Low Priority)
5. **고급 기능**: 조직 설정 관리, 조직 통계
6. **확장성**: 벌크 초대, 초대 템플릿, 조건부 초대
7. **통합**: Workspace Structure Domain 연동

---

## 📈 Process Model 매핑

### Scenario 매핑 (Process Model 기준)
- **Scenario 1**: 새로운 조직 생성 → **Story-003** + **Story-006** (개인 워크스페이스 추가)
- **Scenario 2**: 멤버 초대 및 수락 → **Story-004** + **Story-006** (개인 워크스페이스 추가)
- **Scenario 3**: 멤버 역할 변경 → **Story-005** ✅
- **Scenario 4**: 멤버 제거 → **Story-007** (계획 중)
- **Scenario 5**: 조직 소유권 이전 → **Story-008** (계획 중)
- **Scenario 6**: 조직 삭제 → **Story-009** (계획 중)

### 기반 시스템 (Story-001, Story-002)
- **Story-001**: 조직 목록 조회 (조직 조회 기능)
- **Story-002**: 조직 선택 (조직 컨텍스트 설정)

---

## 🎯 핵심 아키텍처 패턴

### Layered Security Model (Story-004에서 도입)
- **RLS Layer**: 단순한 규칙 (self-only, owner-only)
- **Application Layer**: 복잡한 권한 로직 (Owner/Admin 체크)
- **adminDb**: 시스템 레벨 작업 (권한 체크 완료 후)

### Layered Authorization (Story-005에서 도입)
- **Frontend Layer**: 사용자 경험 최적화 (UX) ❌ 보안 아님
- **Backend Layer**: 실제 보안 검증 (보안) ✅ 진짜 보안
- **이중 검증**: 프론트엔드 + 백엔드 모두 검증

### Domain Integration
- **Service → Service**: Notification Service 통합 (Action → Action 호출 금지)
- **Profile 테이블 사용**: user_metadata 대신 profiles 테이블에서 inviterName 조회

---

## 📊 구현 현황 요약

### 완료된 Story (5개)
- ✅ **Story-001**: 조직 목록 조회 (v8.0 - 소유자 + 멤버 조직)
- ✅ **Story-002**: 조직 선택 및 컨텍스트 설정
- ✅ **Story-003**: 조직 생성 (조직 타입 시스템)
- ✅ **Story-004**: 멤버 초대 (Layered Security, Notification 통합)
- ✅ **Story-005**: 멤버 역할 변경 (Layered Authorization, TDD 구현)

### 구현 대기 중 Story (1개)
- 🟡 **Story-006**: 개인 워크스페이스 자동 생성 (조직 생성/초대 승낙 시)

### 계획 중 Story (3개)
- 📋 **Story-007**: 멤버 제거 (개인 워크스페이스 처리 포함)
- 📋 **Story-008**: 조직 소유권 이전
- 📋 **Story-009**: 조직 삭제 (개인 워크스페이스 정리 포함)

---

## 🔧 기술 스택 구현 상태

### Backend
- [x] **Drizzle ORM**: organizations, organization_members, invitations 테이블 ✅
- [x] **Repository 패턴**: OrganizationRepository, InvitationRepository, OrganizationMemberRepository ✅
- [x] **Service Layer**: OrganizationManagementService ✅
- [x] **Server Actions**: 조직 생성, 멤버 초대, 초대 응답, 멤버 역할 변경 ✅
- [x] **Layered Security**: RLS + Application-level + adminDb ✅
- [x] **멤버 역할 변경**: changeMemberRoleAction ✅ (Story-005)

### Frontend
- [x] **React Context**: OrganizationContext, MemberManagementContext ✅
- [x] **Custom Hooks**: useOrganization, useMemberManagement, useRoleChange ✅
- [x] **UI Components**: OrganizationSwitcher, CreateOrganizationDialog, MemberInvitationForm, MemberListTable ✅
- [x] **DTO 직렬화**: Plain Object, ISO 문자열 변환 ✅
- [x] **useRoleChange Hook**: 권한 검증 로직 ✅ (Story-005)
- [x] **MemberRoleSelector**: 클릭 가능한 역할 배지 ✅ (Story-005)
- [x] **RoleChangeConfirmationDialog**: 확인 다이얼로그 ✅ (Story-005)

### Database
- [x] **organization_type enum**: 조직 타입 (6가지) ✅
- [x] **member_role enum**: 멤버 역할 (owner, admin, member) ✅
- [x] **invitation_status enum**: 초대 상태 ✅
- [x] **RLS 정책**: Layered Security Model 적용 ✅

### Domain Integration
- [x] **User Management Domain**: UserId 참조, 기본 조직 생성 요청 수신 ✅
- [x] **Notification Management Domain**: NotificationService 통합 (Service Layer) ✅

---

## 🎯 Phase별 진행 상황

### Phase 1: 조직 조회 및 선택 - 🟢 완료
- [x] Story-001: 조직 목록 조회 ✅
- [x] Story-002: 조직 선택 및 컨텍스트 설정 ✅

### Phase 2: 조직 생성 및 멤버 초대 - 🟢 완료
- [x] Story-003: 조직 생성 ✅
- [x] Story-004: 멤버 초대 ✅

### Phase 3: 조직 멤버십 관리 - 🟢 완료
- [x] Story-005: 멤버 역할 변경 ✅ (TDD 구현 완료)

### Phase 4: 개인 워크스페이스 시스템 - 🟡 구현 대기 중
- [ ] Story-006: 개인 워크스페이스 자동 생성 🟡 (구현 대기 중)

### Phase 5: 조직 관리 고급 기능 - 📋 계획 중
- [ ] Story-007: 멤버 제거
- [ ] Story-008: 조직 소유권 이전
- [ ] Story-009: 조직 삭제

---

## 📝 주요 설계 결정사항

### 1. Aggregate 분리 (Software Design)
- Organization Aggregate: 조직 생성/관리
- Invitation Aggregate: 멤버 초대 관리
- Notification System (External): 알림 관리

### 2. 계층적 역할 시스템 (Scenario 3)
- 소유자 > 관리자 > 멤버
- 역할별 권한 차별화
- 소유권 이전을 통한 소유자 변경

### 3. Layered Security Model (Story-004)
- RLS: 최소 권한 (Defense in Depth)
- Application: 복잡한 권한 로직 (Primary Authorization)
- adminDb: 시스템 레벨 작업

### 4. Layered Authorization (Story-005)
- Frontend: 사용자 경험 최적화 (조건부 렌더링)
- Backend: 실제 보안 검증 (비즈니스 규칙 강제)

### 5. 두 단계 프로세스 (Scenario 3)
- Step 1: 역할 옵션 선택 (권한 검증)
- Step 2: 확인 다이얼로그 (역할 업데이트)

---

## 🚀 다음 단계

### 즉시 진행 (Next Sprint - Phase 4)
1. **Story-006 구현**: 개인 워크스페이스 자동 생성 기능 (Scenario 1, 2 확장)
   - Day 1: Backend (WorkspaceCrudService.createPersonalWorkspace, Service 통합)
   - Day 2: Database (is_personal, owner_id 마이그레이션) + Frontend (배지, 접근 제한 UI)
   - Day 3: Testing (Unit, Integration, E2E)

### 다음 Sprint (Phase 5)
2. **Story-007 정의 및 구현**: 멤버 제거 기능 (Scenario 4 기반)
   - Backend: removeMember 메서드 구현
   - Frontend: 멤버 제거 버튼 및 확인 다이얼로그
   - 개인 워크스페이스 처리: 삭제 또는 이전
   - Testing: TDD 기반 구현

3. **Story-008 정의 및 구현**: 조직 소유권 이전 기능 (Scenario 5 기반)
   - Backend: transferOwnership 메서드 구현
   - Frontend: 소유권 이전 폼 및 확인 절차
   - 개인 워크스페이스 유지 (owner_id 변경 없음)
   - Testing: 보안 중점 테스트

4. **Story-009 정의 및 구현**: 조직 삭제 기능 (Scenario 6 기반)
   - Backend: deleteOrganization 메서드 구현
   - Frontend: 삭제 확인 및 컨텍스트 전환
   - 개인 워크스페이스 정리 (소프트 삭제)
   - Testing: 데이터 정리 검증

### 품질 개선
4. **성능 최적화**: 권한 캐시, 쿼리 최적화
5. **모니터링 설정**: 에러 및 성능 모니터링
6. **Epic-002 문서 작성**: Organization Management Epic

---

## 📚 참고 자료

### Process Model 시나리오
- **Scenario 1**: 새로운 조직 생성 → Story-003 + Story-006 (개인 워크스페이스)
- **Scenario 2**: 멤버 초대 및 수락 → Story-004 + Story-006 (개인 워크스페이스)
- **Scenario 3**: 멤버 역할 변경 → Story-005 ✅
- **Scenario 4**: 멤버 제거 → Story-007 (계획 중)
- **Scenario 5**: 조직 소유권 이전 → Story-008 (계획 중)
- **Scenario 6**: 조직 삭제 → Story-009 (계획 중)

### 핵심 Policy (Process Model)
1. 새로운 조직 생성: 모든 인증된 사용자 가능
2. 조직 이름 고유성: 플랫폼 내 고유
3. 3단계 역할 시스템: 소유자 > 관리자 > 멤버
4. **워크스페이스 자동 생성**: 조직 생성 시 Default + 개인 워크스페이스 자동 생성
5. **개인 워크스페이스**: 초대 승낙 시 해당 멤버의 개인 워크스페이스 자동 생성
6. 소유권 이전: 소유자 역할은 이전을 통해서만 변경
7. 권한 기반 초대: 소유자와 관리자만 멤버 초대 가능
8. 30일 초대 유효기간: 초대 링크 30일 후 자동 만료
9. 소프트 삭제: 30일 유예 기간 제공
10. 계층적 삭제: 조직 삭제 시 하위 요소 함께 처리

---

*이 문서는 Organization Management Domain의 모든 Story를 체계적으로 관리하기 위한 메인 문서입니다.*

