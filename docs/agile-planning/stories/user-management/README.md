# User Management Domain - Stories

## 📋 Story 목록 및 우선순위

### Phase 1: 핵심 인증 및 기본 기능 (High Priority)
1. **Story-001: 구글 OAuth 로그인** (5 points, High)
   - **의존성**: 없음 (최우선)
   - **목표**: 사용자가 구글 계정으로 로그인할 수 있도록 함
   - **완료 기준**: 구글 OAuth 연동, Supabase Auth 통합
   - **상태**: 🟢 100% 완료

2. **Story-002: 사용자 프로필 생성** (3 points, High)
   - **의존성**: Story-001
   - **목표**: 로그인 후 사용자 프로필 자동 생성
   - **완료 기준**: 프로필 생성, 구글 계정 정보 동기화
   - **상태**: 🟢 100% 완료

3. **Story-003: 기본 조직 자동 생성** (3 points, High)
   - **의존성**: Story-002
   - **목표**: 사용자 등록 시 기본 조직 자동 생성 (Organization Management Domain으로 요청)
   - **완료 기준**: 기본 조직 생성 요청 발행, Organization Management Domain 통합
   - **상태**: 🟢 100% 완료

### Phase 2: 사용자 계정 관리 (계획 중)
4. **Story-004: 사용자 프로필 수정** (2 points, Medium) - 📋 계획 중
   - **의존성**: Story-002
   - **목표**: 사용자가 프로필 정보를 수정할 수 있도록 함
   - **완료 기준**: 이름, 이메일, 프로필 이미지 수정

5. **Story-005: 사용자 계정 삭제** (3 points, Low) - 📋 계획 중
   - **의존성**: Story-004
   - **목표**: 사용자가 계정을 삭제할 수 있도록 함
   - **완료 기준**: 소프트 삭제, 30일 보관, Organization Management Domain 통합

## 🎯 Sprint 계획 및 현재 진행 상황

### Sprint 1: 핵심 인증 시스템 (2주) - 🟢 완료 (100% 완료)
**목표**: 사용자가 구글 계정으로 로그인하고 기본 프로필을 생성할 수 있도록 함

**포함 Story**:
- Story-001: 구글 OAuth 로그인 (5 points) - 🟢 100% 완료
- Story-002: 사용자 프로필 생성 (3 points) - 🟢 100% 완료
- Story-003: 기본 조직 자동 생성 (3 points) - 🟢 100% 완료

**총 포인트**: 11 points  
**현재 상황**: 백엔드 로직, 프론트엔드 UI, 테스트 코드 모두 완료

### Sprint 2+: 사용자 계정 관리 - 📋 계획 중
**목표**: 사용자가 프로필을 수정하고 계정을 관리할 수 있도록 함

**계획 중 Story**:
- Story-004: 사용자 프로필 수정 (2 points) - 📋 계획 중
- Story-005: 사용자 계정 삭제 (3 points) - 📋 계획 중

**총 포인트**: 5 points  
**현재 상황**: 설계 대기 중

## 🔗 의존성 다이어그램

```
Story-001 (구글 OAuth 로그인)
    ↓
Story-002 (사용자 프로필 생성)
    ↓
Story-003 (기본 조직 자동 생성)
    ↓
Organization Management Domain Stories...
    
Story-004 (사용자 프로필 수정) - 계획 중
    ↓
Story-005 (사용자 계정 삭제) - 계획 중
```

## 📊 Story 포인트 분석

### 포인트 분포 (현재 정의된 Story)
- **5 points**: 1개 (Story-001)
- **3 points**: 2개 (Story-002, Story-003)

### 총 포인트: 11 points (완료)

### 예상 개발 기간 및 현재 상황
- **Sprint 1**: 11 points (2주) - 🟢 완료

**총 예상 기간**: 2주  
**현재 진행률**: 100% 완료 (11/11 points)

### 향후 계획 (Phase 2)
- **Story-004**: 사용자 프로필 수정 (2 points)
- **Story-005**: 사용자 계정 삭제 (3 points)

**추가 포인트**: 5 points (약 1주)  
**전체 예상 기간**: 3주

## 🎯 Definition of Done (전체)

### 기능적 완료
- [x] Story-001~003 Acceptance Criteria 충족 ✅
- [x] 사용자 인증부터 기본 조직 생성까지 전체 플로우 동작 ✅
- [x] 에러 처리 및 예외 상황 대응 ✅

### 기술적 완료
- [x] Story-001~003 단위 테스트 커버리지 80% 이상 ✅
- [x] E2E 테스트 통과 ✅
- [x] 코드 리뷰 완료 ✅
- [x] 성능 요구사항 충족 ✅

### 품질 완료
- [x] Supabase Auth 통합 완료 ✅
- [x] RLS 정책 적용 완료 ✅
- [x] Organization Management Domain 통합 완료 ✅
- [ ] 사용자 프로필 수정 기능 (Story-004)
- [ ] 사용자 계정 삭제 기능 (Story-005)

## 📁 관련 문서

### Epic 문서
- [Epic-001: User Management](../../epics/epic-001-core-platform-foundation.md)

### 도메인 설계 문서
- [Event Storming](../../../event-domain-design/domains/user-management-domain/01-event-storm.md)
- [Process Model](../../../event-domain-design/domains/user-management-domain/02-process-model.md) - Scenario 0, 1, 8
- [Software Design](../../../event-domain-design/domains/user-management-domain/03-software-design.md)
- [Testing Strategy](../../../event-domain-design/domains/user-management-domain/04-testing-strategy.md)
- [Technical Specification](../../../event-domain-design/domains/user-management-domain/05-technical-specification.md) - v5.0
- [Database Schema](../../../event-domain-design/domains/user-management-domain/06-db-schema.md) - v6.0
- [Frontend Specification](../../../event-domain-design/domains/user-management-domain/07-frontend-specification.md)

### 가이드 문서
- [Story 정의 가이드](../../guide/04-story-definition-guide.md)
- [Sprint 계획 가이드](../../guide/05-sprint-planning-guide.md)

## 🚀 다음 단계 및 우선순위

### 장기 계획 (Medium Priority)
1. **Story-004 정의**: 사용자 프로필 수정 기능
2. **Story-005 정의**: 사용자 계정 삭제 기능 (Scenario 8)

### 도메인 간 통합
3. **Organization Management Domain**: 조직 관련 Story는 Organization Management Domain에서 관리
   - 조직 조회, 선택, 생성, 멤버 초대, 역할 변경 등
   - [Organization Management Stories](../organization-management/README.md) 참조

### 품질 개선
4. **성능 최적화**: 프로필 조회 캐싱
5. **모니터링 설정**: 인증 에러 및 성능 모니터링
6. **접근성 개선**: 웹 접근성 기준 충족

---

*이 문서는 User Management Domain의 모든 Story를 체계적으로 관리하기 위한 메인 문서입니다.*
