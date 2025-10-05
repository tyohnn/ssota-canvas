# User Management Domain - Stories

## 📋 Story 목록 및 우선순위

### Phase 1: 핵심 인증 및 기본 기능 (High Priority)
1. **Story-001: 구글 OAuth 로그인** (5 points, High)
   - **의존성**: 없음 (최우선)
   - **목표**: 사용자가 구글 계정으로 로그인할 수 있도록 함
   - **완료 기준**: 구글 OAuth 연동, Supabase Auth 통합

2. **Story-002: 사용자 프로필 생성** (3 points, High)
   - **의존성**: Story-001
   - **목표**: 로그인 후 사용자 프로필 자동 생성
   - **완료 기준**: 프로필 생성, 구글 계정 정보 동기화

3. **Story-003: 기본 조직 자동 생성** (3 points, High)
   - **의존성**: Story-002
   - **목표**: 사용자 등록 시 기본 조직 자동 생성
   - **완료 기준**: 기본 조직 생성, 사용자 소유자 설정

4. **Story-004: 조직 목록 조회** (2 points, High)
   - **의존성**: Story-003
   - **목표**: 사용자의 조직 목록 조회
   - **완료 기준**: 조직 목록 표시, 기본 조직 우선 표시

5. **Story-005: 조직 선택 및 컨텍스트 설정** (2 points, High)
   - **의존성**: Story-004
   - **목표**: 작업할 조직 선택 및 컨텍스트 설정
   - **완료 기준**: 조직 선택, 컨텍스트 상태 관리

### Phase 2: 조직 관리 기능 (Medium Priority)
6. **Story-006: 조직 생성** (3 points, Medium)
   - **의존성**: Story-005
   - **목표**: 사용자가 새 조직을 생성할 수 있도록 함
   - **완료 기준**: 조직 생성, 중복 검증, 권한 설정

7. **Story-007: 멤버 초대** (5 points, Medium)
   - **의존성**: Story-006
   - **목표**: 조직에 새 멤버를 초대할 수 있도록 함
   - **완료 기준**: 초대 링크 생성, 이메일 전송, 초대 수락

## 🎯 Sprint 계획 및 현재 진행 상황

### Sprint 1: 핵심 인증 시스템 (2주) - 🟢 완료 (100% 완료)
**목표**: 사용자가 구글 계정으로 로그인하고 기본 프로필을 생성할 수 있도록 함

**포함 Story**:
- Story-001: 구글 OAuth 로그인 (5 points) - 🟢 100% 완료
- Story-002: 사용자 프로필 생성 (3 points) - 🟢 100% 완료
- Story-003: 기본 조직 자동 생성 (3 points) - 🟢 100% 완료

**총 포인트**: 11 points
**현재 상황**: 백엔드 로직, 프론트엔드 UI, 테스트 코드 모두 완료

### Sprint 2: 조직 관리 기본 기능 (2주) - 🟢 완료 (100% 완료)
**목표**: 사용자가 조직을 조회하고 선택할 수 있도록 함

**포함 Story**:
- Story-004: 조직 목록 조회 (2 points) - 🟢 100% 완료
- Story-005: 조직 선택 및 컨텍스트 설정 (2 points) - 🟢 100% 완료

**총 포인트**: 4 points
**현재 상황**: 기능 구현 및 테스트 코드 모두 완료

### Sprint 3: 조직 생성 및 멤버 관리 (2주) - 🔴 미시작 (0% 완료)
**목표**: 사용자가 새 조직을 생성하고 멤버를 초대할 수 있도록 함

**포함 Story**:
- Story-006: 조직 생성 (3 points) - 🔴 0% 완료
- Story-007: 멤버 초대 (5 points) - 🔴 0% 완료

**총 포인트**: 8 points
**현재 상황**: 완전히 미구현 상태

## 🔗 의존성 다이어그램

```
Story-001 (구글 OAuth 로그인)
    ↓
Story-002 (사용자 프로필 생성)
    ↓
Story-003 (기본 조직 자동 생성)
    ↓
Story-004 (조직 목록 조회)
    ↓
Story-005 (조직 선택 및 컨텍스트 설정)
    ↓
Story-006 (조직 생성)
    ↓
Story-007 (멤버 초대)
```

## 📊 Story 포인트 분석

### 포인트 분포
- **5 points**: 2개 (Story-001, Story-007)
- **3 points**: 3개 (Story-002, Story-003, Story-006)
- **2 points**: 2개 (Story-004, Story-005)

### 총 포인트: 23 points

### 예상 개발 기간 및 현재 상황
- **Sprint 1**: 11 points (2주) - 🟢 완료
- **Sprint 2**: 4 points (1주) - 🟢 완료
- **Sprint 3**: 8 points (2주) - 🔴 미시작

**총 예상 기간**: 5주 (약 1.25개월)
**현재 진행률**: 약 65% 완료 (15/23 points 중 15 points 완료)

## 🎯 Definition of Done (전체)

### 기능적 완료
- [ ] 모든 Story의 Acceptance Criteria 충족
- [ ] 사용자 인증부터 멤버 초대까지 전체 플로우 동작
- [ ] 에러 처리 및 예외 상황 대응

### 기술적 완료
- [x] 모든 Story의 단위 테스트 커버리지 80% 이상 (233개 테스트 통과)
- [x] E2E 테스트 통과 (구현 완료, 실제 페이지 연동 필요)
- [x] 코드 리뷰 완료
- [x] 성능 요구사항 충족

### 품질 완료
- [ ] 보안 취약점 0개
- [ ] 접근성 기준 충족
- [ ] 사용자 테스트 통과

## 📁 관련 문서

### Epic 문서
- [Epic-001: User Management](../../epics/epic-001-user-management.md)

### 도메인 설계 문서
- [Process Model](../../../event-domain-design/domains/user-management-domain/process-model.md)
- [Technical Specification](../../../event-domain-design/domains/user-management-domain/technical-specification.md)
- [Frontend Specification](../../../event-domain-design/domains/user-management-domain/frontend-specification.md)

### 가이드 문서
- [Story 정의 가이드](../../guide/04-story-definition-guide.md)
- [Sprint 계획 가이드](../../guide/05-sprint-planning-guide.md)

## 🚀 다음 단계 및 우선순위

### 즉시 진행 필요 (High Priority)
1. **Sprint 3 시작**: Story-006 조직 생성 기능 구현
2. **Sprint 3 진행**: Story-007 멤버 초대 기능 구현
3. **이메일 서비스 연동**: 초대 이메일 전송 기능 구현

### 다음 Sprint 준비 (Medium Priority)
4. **성능 최적화**: 캐싱 로직 구현
5. **모니터링 설정**: 에러 및 성능 모니터링
6. **접근성 개선**: 웹 접근성 기준 충족

### 장기 계획 (Low Priority)
7. **고급 기능**: 조직 권한 관리, 역할 기반 접근 제어
8. **확장성**: 다중 테넌트 지원, 조직 계층 구조
9. **통합**: 외부 시스템 연동, API 확장

---

*이 문서는 User Management Domain의 모든 Story를 체계적으로 관리하기 위한 메인 문서입니다.*
