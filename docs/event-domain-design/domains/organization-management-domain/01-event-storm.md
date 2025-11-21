# Organization Management Domain - Event Storming

## 📊 Domain Overview
**비즈니스 가치**: 조직 생성, 관리, 멤버십 관리를 통해 체계적인 협업 환경을 제공. 사용자들이 조직 단위로 협업할 수 있는 기반을 제공하는 핵심 도메인.

## 📝 핵심 개념 정리

### 조직 및 멤버십 관리 전략
- **조직**: 사용자들이 소속되는 조직 단위 (기본 조직, 일반 조직)
- **멤버십**: 사용자-조직 간의 소속 관계 (소유자, 관리자, 멤버)
- **초대**: 조직에 새 멤버를 초대하는 과정 및 상태 관리
- **권한**: 조직 내 사용자 권한 수준 (소유자 > 관리자 > 멤버)

### 사용자-조직 계층 구조
```
사용자 (플랫폼 계정)
├── 소유 조직 (소유자 관계)
│   ├── 조직 A (소유)
│   └── 조직 B (소유)
└── 소속 조직 (멤버 관계)
    ├── 조직 C (멤버)
    └── 조직 D (멤버)
```

### 도메인 범위 및 경계
- **조직**: 플랫폼에서 관리하는 조직 정보 (기본 정보 + 설정)
- **멤버십**: 유저-조직 간 관계 (역할: 소유자, 관리자, 멤버)
- **초대**: 조직 멤버 초대 링크 및 상태 관리
- **권한**: 조직 내 사용자 권한 및 접근 제어

### 비즈니스 규칙 및 정책
- **기본 조직 정책**: 유저 등록 시 개인 조직 자동 생성 (유저가 소유자)
- **초대 정책**: 초대 데이터와 알림을 통한 초대
- **삭제 정책**: 조직 소프트 삭제 후 30일 보관, 이후 완전 삭제
- **권한 정책**: 소유자 > 관리자 > 멤버 (현재 3단계 역할만 지원)

---

## 🟠 Domain Events (시간 순서)

### 조직 생성 & 관리 Events
- 기본 조직이 생성됨 (Default Organization Created) ← **User Management Domain에서 커맨드 실행**
- 새로운 조직이 생성됨 (New Organization Created)
- 조직 정보가 수정됨 (Organization Information Updated)
- 조직 소유권 이전이 요청됨 (Organization Ownership Transfer Requested)
- 조직 소유권이 이전됨 (Organization Ownership Transferred)
- 조직 삭제가 요청됨 (Organization Deletion Requested)
- 조직이 소프트 삭제됨 (Organization Soft Deleted)
- 조직 관련 데이터가 정리됨 (Organization Related Data Cleaned Up)
- 조직이 완전히 삭제됨 (Organization Permanently Deleted - 30일 후)

### 조직 조회 & 선택 Events
- 유저 관련 조직이 조회됨 (Related Organization Retrieved)
- 초기 조직이 선택됨 (프론트엔드) (Default Organization Selected)
- 조직이 선택됨 (프론트엔드) (Organization Selected)

### 멤버 초대 & 관리 Events
- 초대할 이메일을 선택함 (프론트엔드) (Invitation Email Selected)
- 멤버 초대 요청함 (Member Invitation Requested)
- 초대받은 사용자가 인박스 버튼을 클릭함 (프론트엔드) (Inbox Button Clicked)
- 초대가 거절됨 (Invitation Rejected)
- 초대가 승낙됨 (Invitation Accepted)
- 새 멤버가 조직에 추가됨 (New Member Added to Organization)
- 멤버 역할이 설정됨 (Member Role Assigned)
- 멤버 역할이 변경됨 (Member Role Changed)
- 멤버가 조직에서 제거됨 (Member Removed from Organization)

---

## 🔵 Commands & Actors (Phase 2.2 결과)

### 주요 커맨드 목록

#### Scenario 0: 기본 조직 생성 Commands (User Management Domain에서 트리거)
- **기본 조직 생성하기** (Organization System) → 기본 조직이 생성됨

#### Scenario 1: 조직 조회 및 선택 Commands
- **유저 관련 조직을 조회하기** (Organization System) → 유저 관련 조직이 조회됨
- **초기 조직을 선택하기** (프론트엔드) → 초기 조직이 선택됨
- **조직 선택하기** (유저) → 조직 선택됨

#### Scenario 2: 새로운 조직 생성 Commands  
- **새로운 조직 생성하기** (유저) → 새로운 조직이 생성됨
- **조직 생성 처리하기** (Organization System) → 조직 생성이 완료됨
- **조직 선택하기** (Organization System) → 조직 선택됨

#### Scenario 3: 멤버 초대 및 수락 Commands
- **초대할 이메일 주소 입력하기** (조직 소유자/관리자) → 초대할 이메일을 선택함
- **멤버 초대 요청하기** (조직 소유자/관리자) → 멤버 초대 요청함
- **인박스 버튼 클릭하기** (초대받은 사용자) → 초대받은 사용자가 인박스 버튼을 클릭함
- **초대 승낙하기** (초대받은 사용자) → 초대가 승낙됨
- **초대 거절하기** (초대받은 사용자) → 초대가 거절됨
- **멤버 추가하기** (Organization System) → 새 멤버가 조직에 추가됨
- **멤버 역할 설정하기** (Organization System) → 멤버 역할이 설정됨

#### 기존 Commands (Scenario 4-8)
- **멤버 역할 변경하기** (조직 소유자/관리자) → 멤버 역할이 변경됨
- **멤버 제거하기** (조직 소유자/관리자) → 멤버가 조직에서 제거됨
- **조직 정보 수정하기** (조직 소유자/관리자) → 조직 정보가 수정됨
- **조직 소유권 이전 요청하기** (조직 소유자) → 조직 소유권 이전이 요청됨
- **조직 소유권 이전 승인하기** (새 소유자, 즉시 처리) → 조직 소유권이 이전됨
- **조직 삭제 요청하기** (조직 소유자) → 조직 삭제가 요청됨
- **조직 소프트 삭제하기** (시스템) → 조직이 소프트 삭제됨
- **조직 데이터 정리하기** (시스템) → 조직 관련 데이터가 정리됨
- **조직 완전 삭제하기** (시스템 배치 작업) → 조직이 완전히 삭제됨

### 식별된 액터 분류

#### Primary Actors (직접 사용자)
- **유저 (User)**: 서비스에 가입한 사용자
- **조직 소유자/관리자**: 조직 관리 권한을 가진 유저
- **조직 소유자**: 조직 소유자만 가능한 작업 (소유권 이전, 조직 삭제)
- **초대받은 유저**: 아직 조직에 속하지 않았지만 참여 권한이 있는 유저

#### System Actors (내부 시스템)
- **Organization System**: 조직 생성, 조회, 권한 관리
- **Invitation System**: 멤버 초대 처리, 초대 상태 관리

#### External Systems (외부 시스템)
- **프론트엔드 (Frontend)**: UI 상태 관리, 초기 조직 선택 로직
- **User Management Domain**: 사용자 정보 참조
- **Notification Domain**: 알림 생성 요청, 알림 읽음 처리

---

## 🟠 Bounded Context 정의

### Context 1: Organization Management Context 🟩
**책임**: 조직 생성/관리, 조직 선택, 소유권 이전, 삭제
**핵심 언어**: Organization, Owner, Context, Transfer, Deletion

**핵심 용어 및 개념:**
- **Organization**: 유저들이 소속되는 조직 단위
- **Default Organization**: 유저 가입 시 자동 생성되는 개인 조직
- **Owner**: 조직의 최고 권한자 (소유권 이전, 조직 삭제 가능)
- **Organization Context**: 현재 작업 중인 조직 환경
- **Organization Selection**: 유저가 작업할 조직을 선택하는 행위
- **Ownership Transfer**: 조직 소유권을 다른 유저에게 이전
- **Soft Delete**: 조직을 즉시 삭제하지 않고 30일간 보관
- **Permanent Delete**: 30일 후 조직과 관련 데이터 완전 삭제

**포함 이벤트:**
- 기본 조직이 생성됨 (Default Organization Created)
- 새로운 조직이 생성됨 (New Organization Created)
- 조직 정보가 수정됨 (Organization Information Updated)
- 조직 소유권 이전이 요청됨 (Organization Ownership Transfer Requested)
- 조직 소유권이 이전됨 (Organization Ownership Transferred)
- 조직 삭제가 요청됨 (Organization Deletion Requested)
- 조직이 소프트 삭제됨 (Organization Soft Deleted)
- 조직 관련 데이터가 정리됨 (Organization Related Data Cleaned Up)
- 조직이 완전히 삭제됨 (Organization Permanently Deleted - 30일 후)

### Context 2: Member & Invitation Management Context 🟨
**책임**: 멤버 초대, 초대 상태 관리, 멤버십 관리, 역할 관리
**핵심 언어**: Member, Invitation, Role, Admin, Invite

**핵심 용어 및 개념:**
- **Member**: 조직에 소속된 유저 (Owner, Admin, Member 역할 보유)
- **Invitation**: 조직에 새 멤버를 초대하는 과정 및 상태
- **Role**: 조직 내 유저 권한 수준
  - **Owner**: 조직 소유자 (모든 권한, 소유권 이전/조직 삭제 가능)
  - **Admin**: 조직 관리자 (멤버 초대/관리, 조직 정보 수정 가능)
  - **Member**: 일반 멤버 (기본 사용 권한)
- **Membership**: 유저와 조직 간의 소속 관계
- **Invitation Status**: 초대 상태 (Pending, Accepted, Rejected, Expired)
- **Role Assignment**: 멤버에게 역할을 부여하는 과정
- **Member Removal**: 조직에서 멤버를 제거하는 과정

**포함 이벤트:**
- 초대할 이메일을 선택함 (프론트엔드)
- 멤버 초대 요청함
- 초대받은 사용자가 인박스 버튼을 클릭함 (프론트엔드)
- 초대가 거절됨
- 초대가 승낙됨
- 새 멤버가 조직에 추가됨
- 멤버 역할이 설정됨
- 멤버 역할이 변경됨
- 멤버가 조직에서 제거됨

### Context 간 관계 및 통합점

#### Organization Management ↔ Member & Invitation
- **연결점**: 조직 컨텍스트에서 멤버 관리 작업 수행
- **통합 방식**: Organization ID 기반 멤버십 관리
- **공유 개념**: Organization ID, Organization Context, Owner/Admin 권한

#### Organization Management ↔ User Management
- **연결점**: 유저 등록 시 기본 조직 생성
- **통합 방식**: User Management에서 "기본 조직 생성하기" 커맨드 실행
- **공유 개념**: User ID, User Profile Data

#### Organization Management ↔ Notification Management
- **연결점**: 멤버 초대 시 알림 생성, 조직 변경 시 알림 정리
- **통합 방식**: Organization Management에서 "초대 알림 생성하기" 커맨드 실행
- **공유 개념**: User ID, Organization ID, Invitation ID

### 도메인 전체 공통 용어
- **조직 ID**: 플랫폼에서 관리하는 조직 고유 식별자
- **멤버십**: 유저와 조직 간의 소속 관계
- **권한**: 조직 내 사용자 권한 수준
- **초대**: 조직에 새 멤버를 초대하는 과정

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음

1. **초대 링크 보안 취약점**
   - 문제: 초대 링크 유출 시 무단 접근 가능성
   - 영향: 조직 보안 침해, 민감한 데이터 접근
   - 해결: ✅ **이메일 검증 단계 추가** - 초대받은 이메일 주소 확인으로 링크 유출 시에도 안전

### 우선순위: 중간

2. **조직 삭제 시 데이터 정리 복잡성**
   - 문제: 조직 완전 삭제 시 연관된 모든 도메인 데이터 정리 필요
   - 영향: 데이터 불일치, 고아 레코드 발생 가능성
   - 해결: ✅ **완전 삭제 시에만 전체 데이터 정리** - 소프트 삭제는 단순 상태 변경

3. **멤버 역할 변경 시 권한 충돌**
   - 문제: 멤버 역할 변경 시 기존 권한과 새 권한 간 충돌
   - 영향: 사용자 경험 저하, 권한 오류
   - 해결: ✅ **즉시 권한 반영** - 역할 변경 시 즉시 새 권한 적용

### 우선순위: 낮음

4. **조직 컨텍스트 전환 UX**
   - 문제: 여러 조직 소속 시 컨텍스트 전환 혼란
   - 영향: 사용자 경험 저하, 잘못된 조직에서 작업
   - 해결: ✅ **Organization Switcher UI** - 명확한 조직 전환 인터페이스 제공

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)

1. **기본 3단계 역할 시스템**
   - 기회: 단순하고 명확한 권한 관리 체계 구축
   - 구현: 소유자/관리자/멤버 역할 정의, 권한 매트릭스 구현

2. **조직 멤버십 관리**
   - 기회: 체계적인 멤버십 관리 시스템 구축
   - 구현: 멤버 초대/관리, 역할 변경, 멤버 제거 기능

### 향후 구현 (Post-MVP)

3. **고급 초대 기능**
   - 벌크 초대 기능 (CSV 업로드)
   - 초대 템플릿 관리
   - 조건부 초대 (특정 이메일 도메인 제한)

4. **조직 설정 관리**
   - 조직별 설정 관리
   - 조직 템플릿 기능
   - 조직 통계 및 분석

5. **감사 로그 및 모니터링**
   - 조직 변경 이력 추적
   - 보안 이벤트 모니터링
   - 컴플라이언스 리포팅

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. 조직 생성 및 관리 (핵심)
- Q: 사용자 등록 시 기본 조직을 어떻게 생성할 것인가?
- Q: 조직 생성 시 어떤 정보를 수집할 것인가?
- Q: 조직 삭제 시 연관된 데이터를 어떻게 정리할 것인가?

### 2. 멤버십 관리
- Q: 멤버 초대 시 어떤 정보를 수집할 것인가?
- Q: 초대 승낙 시 사용자가 이미 다른 조직의 멤버인 경우 어떻게 처리할 것인가?
- Q: 조직 소유자가 실수로 자신을 제거하려 할 때 어떻게 방지할 것인가?
- Q: 멤버 역할 변경 시 기존 권한은 즉시 반영되는가, 아니면 다음 로그인 시 반영되는가?

### 3. 권한 및 접근 제어
- Q: 다른 도메인에서 사용자 권한을 확인할 때 어떤 API를 사용할 것인가?
- Q: 조직 컨텍스트 변경 시 다른 도메인의 캐시된 권한 정보는 어떻게 무효화할 것인가?
- Q: 조직 소유권 이전 시 어떤 과정을 거쳐야 하는가?

### 4. 조직 삭제 및 데이터 정리
- Q: 조직 삭제 시 다른 도메인의 데이터(워크스페이스, 페이지 등)는 어떤 순서로 정리할 것인가?
- Q: 30일 대기 기간 중 조직 복구는 어떤 과정을 거쳐야 하는가?
- Q: 조직 완전 삭제 시 백업 데이터는 얼마나 보관할 것인가?

---

## 📝 Process Model 준비 상태

Organization Management Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 유저 액션 (조직 생성, 멤버 초대, 조직 삭제 등)
2. **Policy** 정의: 조직 관리 규칙, 권한 제약사항, 조직 삭제 정책
3. **Read Model** 명시: 조직 목록 조회, 멤버 목록, 권한 확인에 필요한 정보
4. **External System**: User Management Domain, Notification Domain과의 통합

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**1차 일시**: 2025년 9월 28일 19:00 (온라인)
**2차 일시**: 2025년 9월 29일 19:00 (온라인)
**참가자**: 
- **도메인 전문가**: CEO (조직 관리 및 보안 정책)
- **PM**: AI Assistant
- **기획자**: AI Assistant
- **시니어 개발자**: AI Assistant

**워크샵 결과물**:
- [x] 도메인 이벤트 목록 완성 (조직/멤버십 관련 이벤트 식별)
- [x] 커맨드 및 액터 식별 완료 (조직 관리 기반)
- [x] Bounded Context 경계 정의 완료 (Organization Management Domain)
- [x] 핵심 Hotspot 및 Opportunity 정리 완료
- [x] Process Modeling을 위한 질문 정리 완료

---

## 🔗 연관 도메인

### User Management Domain과의 관계
- **연결점**: 사용자 등록 시 기본 조직 생성
- **커맨드 실행**: User Management → Organization Management ("기본 조직 생성하기" 커맨드)
- **통합 방식**: 도메인 간 커맨드 실행 기반 통합

### Notification Domain과의 관계
- **연결점**: 멤버 초대 시 알림 생성, 조직 변경 시 알림 정리
- **커맨드 실행**: Organization Management → Notification Management ("초대 알림 생성하기" 커맨드)
- **통합 방식**: 도메인 간 커맨드 실행 기반 통합

### Workspace Structure Domain과의 관계
- **연결점**: 사용자/조직 권한을 기반으로 워크스페이스 접근 제어
- **이벤트 흐름**: Organization Management → Workspace Structure (권한 확인)
- **통합 방식**: API 호출 기반 권한 검증

### 모든 다른 도메인과의 관계
- **연결점**: 모든 도메인에서 조직 컨텍스트 및 권한 정보 필요
- **이벤트 흐름**: Organization Management → All Domains (조직/권한 정보 제공)
- **통합 방식**: 공통 권한 확인 API, 조직 컨텍스트 관리

---

*이 Event Storming 문서는 Organization Management Domain의 Process Model 작성을 위한 기반 자료입니다.*
