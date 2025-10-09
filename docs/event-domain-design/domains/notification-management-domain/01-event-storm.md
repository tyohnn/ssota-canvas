# Notification Domain - Event Storming

## 📊 Domain Overview
**비즈니스 가치**: 크로스 도메인 알림 관리, 인박스 시스템을 통해 사용자에게 중요한 정보를 적시에 전달하고 관리. 모든 도메인의 알림을 통합 관리하는 중앙 알림 시스템 역할.

## 📝 핵심 개념 정리

### 알림 및 인박스 관리 전략
- **알림**: 사용자에게 전달되는 중요한 정보 (초대, 시스템, 공지사항)
- **인박스**: 사용자의 알림 수신함 (읽음/읽지 않음 상태 관리)
- **알림 타입**: 초대 알림, 시스템 알림, 공지사항 알림
- **알림 상태**: 읽음/읽지 않음, 보관/활성 상태

### 알림 시스템 구조
```
사용자 (플랫폼 계정)
├── 인박스 (알림 수신함)
│   ├── 초대 알림 (Organization Management Domain에서 생성)
│   └── 시스템 알림 (댓글, 멘션, 권한 요청 등)
└── 알림 설정 (알림 수신 설정)
```

### 도메인 범위 및 경계
- **알림**: 모든 도메인에서 생성되는 알림 통합 관리
- **인박스**: 사용자별 알림 수신함 관리
- **알림 상태**: 읽음/읽지 않음, 보관/활성 상태 추적
- **알림 템플릿**: 알림 메시지 템플릿 관리

### 비즈니스 규칙 및 정책
- **알림 생성 정책**: 도메인별 알림 생성 규칙 및 템플릿 적용
- **읽음 상태 정책**: 알림 읽음 처리 및 상태 추적
- **보관 정책**: 알림 보관 처리 및 정리
- **알림 우선순위**: 알림 타입별 우선순위 및 표시 순서

---

## 🟠 Domain Events (시간 순서)

### 알림 생성 & 관리 Events
- 초대 알림이 생성됨 (Invitation Notification Created) ← **Organization Management Domain에서 커맨드 실행**
- 시스템 알림이 생성됨 (System Notification Created)
- 공지사항 알림이 생성됨 (Announcement Notification Created)
- 알림이 읽혀짐 (Notification Read)
- 알림이 보관처리됨 (Notification Archived)
- 알림이 삭제됨 (Notification Deleted)

### 인박스 관리 Events
- 인박스가 조회됨 (Inbox Retrieved)
- 읽지 않은 알림 개수가 업데이트됨 (Unread Count Updated)
- 알림 필터가 적용됨 (Notification Filter Applied)
- 알림 검색이 수행됨 (Notification Search Performed)

### 알림 설정 Events
- 알림 설정이 변경됨 (Notification Settings Changed)
- 알림 수신이 비활성화됨 (Notification Receiving Disabled)
- 알림 수신이 활성화됨 (Notification Receiving Enabled)
- 알림 템플릿이 업데이트됨 (Notification Template Updated)

---

## 🔵 Commands & Actors (Phase 2.2 결과)

### 주요 커맨드 목록

#### Scenario 1: 알림 생성 Commands
- **초대 알림 생성하기** (Organization Management Domain) → 초대 알림이 생성됨
- **시스템 알림 생성하기** (System) → 시스템 알림이 생성됨
- **공지사항 알림 생성하기** (Admin) → 공지사항 알림이 생성됨

#### Scenario 2: 인박스 관리 Commands
- **인박스 조회하기** (유저) → 인박스가 조회됨
- **알림 읽음 처리하기** (유저) → 알림이 읽혀짐
- **알림 보관처리하기** (유저) → 알림이 보관처리됨
- **알림 삭제하기** (유저) → 알림이 삭제됨

#### Scenario 3: 알림 설정 Commands
- **알림 설정 변경하기** (유저) → 알림 설정이 변경됨
- **알림 수신 비활성화하기** (유저) → 알림 수신이 비활성화됨
- **알림 수신 활성화하기** (유저) → 알림 수신이 활성화됨

#### Scenario 4: 알림 검색 & 필터 Commands
- **알림 검색하기** (유저) → 알림 검색이 수행됨
- **알림 필터 적용하기** (유저) → 알림 필터가 적용됨
- **읽지 않은 알림 조회하기** (유저) → 읽지 않은 알림 개수가 업데이트됨

### 식별된 액터 분류

#### Primary Actors (직접 사용자)
- **유저 (User)**: 알림을 받고 관리하는 사용자
- **관리자 (Admin)**: 공지사항 알림을 생성하는 관리자
- **초대받은 유저**: 초대 알림을 받는 사용자

#### System Actors (내부 시스템)
- **Notification System**: 알림 생성, 관리, 상태 추적
- **Inbox System**: 인박스 관리, 읽음 상태 추적
- **프론트엔드 (Frontend)**: 인박스 UI, 알림 표시 로직

#### External Systems (외부 시스템)
- **User Management Domain**: 사용자 정보 참조
- **Organization Management Domain**: 초대 알림 생성 요청
- **모든 다른 도메인**: 알림 생성 요청

---

## 🟠 Bounded Context 정의

### Context 1: Notification Management Context 🟪
**책임**: 알림 생성, 관리, 상태 추적
**핵심 언어**: Notification, Alert, Message, Template

**핵심 용어 및 개념:**
- **Notification**: 유저에게 전달되는 알림 메시지
- **Alert**: 중요한 알림이나 경고 메시지
- **Message**: 알림 내용 및 메시지
- **Template**: 알림 메시지 템플릿
- **Notification Type**: 알림 유형 (초대, 시스템, 공지사항)
- **Notification Priority**: 알림 우선순위 (높음, 보통, 낮음)
- **Notification Status**: 알림 상태 (활성, 보관, 삭제)

**포함 이벤트:**
- 초대 알림이 생성됨 (Invitation Notification Created)
- 시스템 알림이 생성됨 (System Notification Created)
- 공지사항 알림이 생성됨 (Announcement Notification Created)
- 알림이 삭제됨 (Notification Deleted)

### Context 2: Inbox Management Context 🟦
**책임**: 인박스 관리, 읽음 상태 추적, 알림 정리
**핵심 언어**: Inbox, Read, Archive, Filter, Search

**핵심 용어 및 개념:**
- **Inbox**: 유저의 알림 수신함
- **Read Status**: 알림 읽음/읽지 않음 상태
- **Archive**: 알림 보관 처리
- **Filter**: 알림 필터링 (타입별, 상태별)
- **Search**: 알림 검색 기능
- **Unread Count**: 읽지 않은 알림 개수
- **Notification Settings**: 알림 수신 설정

**포함 이벤트:**
- 인박스가 조회됨 (Inbox Retrieved)
- 알림이 읽혀짐 (Notification Read)
- 알림이 보관처리됨 (Notification Archived)
- 읽지 않은 알림 개수가 업데이트됨 (Unread Count Updated)
- 알림 필터가 적용됨 (Notification Filter Applied)
- 알림 검색이 수행됨 (Notification Search Performed)

### Context 간 관계 및 통합점

#### Notification Management ↔ Inbox Management
- **연결점**: 알림 생성 시 인박스에 추가, 알림 상태 변경 시 인박스 업데이트
- **통합 방식**: Notification ID 기반 인박스 관리
- **공유 개념**: Notification ID, User ID, Notification Status

#### Notification Management ↔ User Management
- **연결점**: 사용자 프로필 변경 시 관련 알림 정리
- **통합 방식**: User ID 기반 알림 필터링
- **공유 개념**: User ID, Profile Context

#### Notification Management ↔ Organization Management
- **연결점**: 멤버 초대 시 알림 생성, 조직 변경 시 알림 정리
- **통합 방식**: Organization Management에서 "초대 알림 생성하기" 커맨드 실행
- **공유 개념**: User ID, Organization ID, Invitation ID

### 도메인 전체 공통 용어
- **알림 ID**: 플랫폼에서 관리하는 알림 고유 식별자
- **알림 상태**: 알림의 현재 상태 (활성, 보관, 삭제)
- **읽음 상태**: 알림의 읽음/읽지 않음 상태
- **알림 우선순위**: 알림의 중요도 및 표시 순서

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음

1. **알림 중복 생성**
   - 문제: 동일한 알림이 중복으로 생성될 가능성
   - 영향: 사용자 경험 저하, 알림 스팸
   - 해결: ✅ **중복 알림 방지** - 동일한 알림 ID로 중복 생성 방지

2. **알림 전달 실패**
   - 문제: 알림 생성 후 사용자에게 전달되지 않는 경우
   - 영향: 중요한 정보 전달 실패, 사용자 혼란
   - 해결: ✅ **알림 전달 상태 추적** - 알림 전달 상태 모니터링 및 재시도

### 우선순위: 중간

3. **알림 성능 이슈**
   - 문제: 대량 알림 생성 시 성능 저하
   - 영향: 시스템 성능 저하, 사용자 경험 저하
   - 해결: ✅ **배치 처리** - 대량 알림 생성 시 배치 처리 적용

4. **알림 정리 복잡성**
   - 문제: 오래된 알림 정리 및 보관 처리 복잡성
   - 영향: 데이터베이스 성능 저하, 저장 공간 낭비
   - 해결: ✅ **자동 정리 시스템** - 오래된 알림 자동 정리 및 보관

### 우선순위: 낮음

5. **알림 개인화**
   - 문제: 사용자별 알림 선호도 관리 복잡성
   - 영향: 사용자 경험 저하, 불필요한 알림 수신
   - 해결: ✅ **알림 설정 시스템** - 사용자별 알림 수신 설정 관리

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)

1. **기본 알림 시스템**
   - 기회: 체계적인 알림 관리 시스템 구축
   - 구현: 알림 생성/조회/관리, 읽음 상태 추적, 인박스 시스템

2. **알림 타입별 관리**
   - 기회: 알림 타입별 차별화된 관리 시스템
   - 구현: 초대 알림, 시스템 알림, 공지사항 알림 구분 관리

### 향후 구현 (Post-MVP)

3. **고급 알림 기능**
   - 실시간 알림 (WebSocket)
   - 알림 템플릿 시스템
   - 알림 스케줄링

4. **알림 분석 및 모니터링**
   - 알림 전달률 분석
   - 사용자 알림 패턴 분석
   - 알림 성능 모니터링

5. **알림 개인화**
   - 사용자별 알림 선호도 설정
   - 알림 필터링 및 검색
   - 알림 우선순위 관리

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. 알림 생성 및 관리 (핵심)
- Q: 알림 생성 시 어떤 정보를 수집할 것인가?
- Q: 알림 중복 생성을 어떻게 방지할 것인가?
- Q: 알림 전달 실패 시 어떻게 처리할 것인가?

### 2. 인박스 관리
- Q: 인박스에서 알림을 어떻게 정렬할 것인가?
- Q: 읽지 않은 알림 개수를 어떻게 효율적으로 계산할 것인가?
- Q: 알림 검색 및 필터링을 어떻게 구현할 것인가?

### 3. 알림 상태 관리
- Q: 알림 읽음 처리를 어떻게 구현할 것인가?
- Q: 알림 보관 처리를 어떻게 구현할 것인가?
- Q: 오래된 알림을 어떻게 정리할 것인가?

### 4. 알림 설정 관리
- Q: 사용자별 알림 수신 설정을 어떻게 관리할 것인가?
- Q: 알림 타입별 수신 설정을 어떻게 구현할 것인가?
- Q: 알림 템플릿을 어떻게 관리할 것인가?

### 5. 성능 및 확장성
- Q: 대량 알림 생성 시 성능을 어떻게 최적화할 것인가?
- Q: 알림 시스템을 어떻게 확장할 것인가?
- Q: 알림 데이터를 어떻게 보관할 것인가?

---

## 📝 Process Model 준비 상태

Notification Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 유저 액션 (알림 조회, 읽음 처리, 보관 처리 등)
2. **Policy** 정의: 알림 생성 규칙, 읽음 상태 관리, 알림 정리 정책
3. **Read Model** 명시: 인박스 조회, 알림 목록, 읽지 않은 개수에 필요한 정보
4. **External System**: User Management Domain, Organization Management Domain과의 통합

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**1차 일시**: 2025년 9월 28일 19:00 (온라인)
**2차 일시**: 2025년 9월 29일 19:00 (온라인)
**참가자**: 
- **도메인 전문가**: CEO (알림 시스템 및 사용자 경험)
- **PM**: AI Assistant
- **기획자**: AI Assistant
- **시니어 개발자**: AI Assistant

**워크샵 결과물**:
- [x] 도메인 이벤트 목록 완성 (알림/인박스 관련 이벤트 식별)
- [x] 커맨드 및 액터 식별 완료 (알림 관리 기반)
- [x] Bounded Context 경계 정의 완료 (Notification Domain)
- [x] 핵심 Hotspot 및 Opportunity 정리 완료
- [x] Process Modeling을 위한 질문 정리 완료

---

## 🔗 연관 도메인


### Organization Management Domain과의 관계
- **연결점**: 멤버 초대 시 알림 생성, 조직 변경 시 알림 정리
- **커맨드 실행**: Organization Management → Notification Management ("초대 알림 생성하기" 커맨드)
- **통합 방식**: 도메인 간 커맨드 실행 기반 통합

### 모든 다른 도메인과의 관계
- **연결점**: 모든 도메인에서 알림 생성 요청
- **커맨드 실행**: All Domains → Notification Management ("알림 생성하기" 커맨드)
- **통합 방식**: 도메인 간 커맨드 실행 기반 통합

---

*이 Event Storming 문서는 Notification Domain의 Process Model 작성을 위한 기반 자료입니다.*
