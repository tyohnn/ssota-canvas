# Notification Domain - Process Model

## 🎯 Process Modeling Overview
Notification Domain의 핵심 시나리오를 실제 상호작용 순서에 따라 정의

### 🔄 시퀀스 기반 상호작용 순서
각 시나리오는 여러 시퀀스로 구성되며, 이벤트에 의해 다음 시퀀스가 트리거됩니다:

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

1. **Event** (이전 시퀀스의 결과) → 2. **Policy** (이벤트에 따른 정책 적용) → 3. **Read Model** (시스템에서 사용자에게 제공하는 정보) → 4. **Command** (사용자가 입력하는 정보) → 5. **System** (처리 시스템) → 6. **Event** (결과 이벤트)

### 🟪 External System: Organization Management Domain, User Management Domain
Notification Domain은 다른 도메인과 통합됩니다:
- **역할**: 알림 생성, 관리, 상태 추적
- **통합**: Organization Management Domain에서 "초대 알림 생성하기" 커맨드 실행
- **통합**: User Management Domain에서 "프로필 변경 알림 생성하기" 커맨드 실행

---

## 📍 Scenario 1: 알림 생성 및 관리

### Sequence 1: 다른 도메인에서 알림 생성 요청

**Trigger Event**: Organization Management Domain에서 "초대 알림 생성하기" 커맨드 실행

```
🔧 Organization Management Domain: "멤버 초대 시 알림을 생성해야 해"
```

**Policy**: 
- "Whenever 초대 알림 생성 요청됨, then always 알림 생성하기"

**Read Model** (내부 처리):
- 초대 정보 (조직명, 초대자명, 초대받은 이메일)
- 알림 타입 (초대 알림)
- 알림 우선순위 (높음)

**Command**: 초대 알림 생성하기
- 초대 정보
- 알림 타입
- 수신자 정보

**System**: Notification System
- 알림 데이터베이스 저장
- 알림 상태 초기화 (읽지 않음)
- 수신자 인박스에 알림 추가

**Events**:
1. 초대 알림이 생성됨 (Invitation Notification Created)

---

### Sequence 2: 사용자가 인박스에서 알림 확인

**Trigger Event**: 사용자가 인박스 버튼을 클릭함

```
👤 사용자: "인박스에서 알림을 확인하고 싶어"
```

**Policy**: 
- "Whenever 인박스 버튼이 클릭됨, then always 사용자 알림 목록을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 알림 목록 (타입별, 시간순 정렬)
- 읽지 않은 알림 개수
- 알림 상세 정보 (초대 정보, 시스템 알림 등)

**Command**: 알림 조회하기
- 사용자 세션

**System**: Inbox System
- 사용자별 알림 목록 조회
- 읽지 않은 알림 개수 계산
- 알림 상태 업데이트

**Events**:
- 인박스가 조회됨 (Inbox Retrieved)

---

### Sequence 3: 사용자가 알림 읽음 처리

**Trigger Event**: 사용자가 알림을 클릭함

```
👤 사용자: "알림을 읽었으니 읽음 처리하고 싶어"
```

**Policy**: 
- "Whenever 알림이 클릭됨, then always 알림 읽음 처리하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 알림 상세 정보
- 읽음 처리 버튼
- 보관 처리 버튼

**Command**: 알림 읽음 처리하기
- 알림 ID
- 읽음 처리 확인

**System**: Notification System
- 알림 상태를 읽음으로 변경
- 읽은 시간 기록
- 읽지 않은 알림 개수 업데이트

**Events**:
1. 알림이 읽혀짐 (Notification Read)

---

### Sequence 4: 사용자가 알림 보관 처리

**Trigger Event**: 사용자가 알림 보관 버튼을 클릭함

```
👤 사용자: "알림을 보관하고 싶어"
```

**Policy**: 
- "Whenever 알림 보관 버튼이 클릭됨, then always 알림 보관 처리하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 보관 처리 확인 메시지
- 보관 처리 진행 상태

**Command**: 알림 보관 처리하기
- 알림 ID
- 보관 처리 확인

**System**: Notification System
- 알림 상태를 보관으로 변경
- 보관 시간 기록
- 인박스에서 제거

**Events**:
1. 알림이 보관처리됨 (Notification Archived)

---

## 📍 Scenario 2: 알림 설정 관리

### Sequence 1: 사용자가 알림 설정 변경

**Trigger Event**: 사용자가 알림 설정 페이지로 이동함

```
👤 사용자: "알림 수신 설정을 변경하고 싶어"
```

**Policy**: 
- "Whenever 알림 설정 페이지로 이동함, then always 알림 설정 폼을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 알림 설정 상태
- 알림 타입별 수신 설정 (초대 알림, 시스템 알림)
- 알림 수신 시간 설정
- 알림 수신 방법 설정 (인박스, 이메일)

**Command**: 알림 설정 변경하기
- 알림 타입별 수신 설정
- 알림 수신 시간
- 알림 수신 방법

**System**: Notification Settings System
- 사용자별 알림 설정 저장
- 설정 변경 이력 기록
- 알림 수신 정책 업데이트

**Events**:
1. 알림 설정이 변경됨 (Notification Settings Changed)

---

## 💡 핵심 Policy 정리

### 알림 생성 및 관리 관련
1. **알림 타입별 관리**: 초대 알림, 시스템 알림, 공지사항 알림 구분 관리
2. **알림 우선순위**: 알림 타입별 우선순위 설정 (초대 > 시스템 > 공지사항)
3. **알림 상태 관리**: 읽음/읽지 않음, 보관/활성 상태 추적
4. **알림 수신 설정**: 사용자별 알림 수신 설정 관리

### 알림 성능 및 최적화
5. **알림 중복 방지**: 동일한 알림 중복 생성 방지
6. **알림 정리**: 오래된 알림 자동 정리 및 보관
7. **알림 검색**: 사용자별 알림 검색 및 필터링
8. **알림 통계**: 알림 전달률, 읽음률 통계 제공

---

## 🔧 기술 권장사항

### 알림 시스템 최적화
- **Background Jobs**: 대량 알림 생성 시 배치 처리
- **Caching**: 사용자별 알림 설정 캐싱
- **Database Indexing**: 알림 조회 쿼리 최적화를 위한 복합 인덱스
- **Real-time Updates**: WebSocket을 통한 실시간 알림 전달

### 성능 최적화
- **알림 큐**: 알림 생성 및 전달을 위한 큐 시스템
- **알림 템플릿**: 알림 메시지 템플릿 시스템
- **알림 스케줄링**: 예약된 알림 전달 시스템
- **알림 분석**: 알림 전달률 및 사용자 패턴 분석

---

## 🚀 Next Steps

이제 Notification Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환
2. **Bounded Context 식별**: Notification, Inbox 경계 확인
3. **Integration Points**: Organization Management Domain, User Management Domain과의 연결점 정의
4. **Anti-Corruption Layer**: 도메인 간 커맨드 실행 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2024년 10월 1일 (Domain 1 Event Storming 완료 후)
**참가자**: 
- **도메인 전문가**: CEO (알림 시스템 정책 결정)
- **시니어 개발자**: 개발 리드 (알림 시스템 전문가)
- **PM**: 프로젝트 매니저 (프로세스 정의)

**워크샵 결과물**:
- [x] 모든 핵심 알림 관리 여정이 시나리오로 정의됨 (2개 시나리오)
- [x] Event → Policy → Read Model → Command → System → Event 순서가 일관되게 적용됨
- [x] System 블랙박스 내부 처리 과정 세분화 (Notification Manager 상세 분석)
- [x] Organization Management Domain과의 통합점이 명확히 정의됨 (초대 알림 생성)
- [x] User Management Domain과의 통합점이 명확히 정의됨 (프로필 변경 알림)
- [x] 비즈니스 규칙(Policy)이 구체적으로 명시됨 (8개 핵심 정책)
- [x] Software Design 작성을 위한 충분한 정보 확보

---

*이 Process Model 문서는 Notification Domain의 Software Design 작성을 위한 기반 자료입니다.*
