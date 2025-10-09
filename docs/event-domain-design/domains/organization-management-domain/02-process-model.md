# Organization Management Domain - Process Model

## 🎯 Process Modeling Overview
Organization Management Domain의 핵심 시나리오를 실제 상호작용 순서에 따라 정의

### 🔄 시퀀스 기반 상호작용 순서
각 시나리오는 여러 시퀀스로 구성되며, 이벤트에 의해 다음 시퀀스가 트리거됩니다:

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

1. **Event** (이전 시퀀스의 결과) → 2. **Policy** (이벤트에 따른 정책 적용) → 3. **Read Model** (시스템에서 사용자에게 제공하는 정보) → 4. **Command** (사용자가 입력하는 정보) → 5. **System** (처리 시스템) → 6. **Event** (결과 이벤트)

### 🟪 External System: User Management Domain
Organization Management Domain은 User Management Domain과 통합됩니다:
- **역할**: 사용자 정보 참조, 기본 조직 생성 요청 수신
- **통합**: User Management Domain에서 "기본 조직 생성하기" 커맨드 실행
- **알림**: Notification Management Domain으로 "초대 알림 생성하기" 커맨드 실행

---

## 📍 Scenario 1: 새로운 조직 생성

### Sequence 1: 사용자가 새로운 조직을 생성하고 소유자가 됨

**Trigger Event**: 조직 목록 화면에서 "새 조직 만들기" 선택함

```
👤 사용자: "새로운 프로젝트를 위해 별도의 조직을 만들고 싶어"
```

**Policy**: 
- "Whenever 새 조직 만들기가 선택됨, then always 조직 생성 폼을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 조직 생성 폼 (조직 이름 입력 필드, 조직 타입 선택 필드(개인, 교육, 스타트업, 에이전시, 컴퍼니, N/A))
- 조직 생성 진행 상태 표시
- 생성 취소 옵션

**Command**: 새로운 조직 생성 요청 (사용자가 입력하는 정보)
- 조직 이름 (필수)
- 조직 타입 (필수)
- 조직 생성 확인

**System**: Organization System
- 사용자의 조직 생성 권한 확인
- 새로운 UUID 기반 조직 ID 생성
- 사용자를 조직 소유자로 자동 설정
- 조직 기본 설정 자동 적용 (멤버 초대 권한, 워크스페이스 생성 권한 등)
- 조직 데이터베이스 저장

**Events**:
1. 새로운 조직이 생성됨 (New Organization Created)

---

**Policy**: 
- "Whenever 조직 생성이 완료됨, then always 조직 목록을 갱신하고 새 조직으로 컨텍스트 전환하기"

**Read Model** (조직 생성 완료 후):
- 업데이트된 조직 목록 (새 조직 포함)
- 새로운 조직으로 자동 선택된 상태
- 조직 생성 완료 알림

**Events**:
- 조직이 선택됨 (Organization Selected)

---

## 📍 Scenario 2: 멤버 초대 및 수락

### Sequence 1: 조직 소유자/관리자가 새 멤버를 초대

**Trigger Event**: 멤버 관리 버튼을 클릭함

```
👤 조직 관리자: "새 팀원을 우리 조직에 초대하고 싶어"
```

**Policy**: 
- "Whenever 멤버 관리 버튼이 클릭됨, then always 멤버 초대 폼을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 조직 멤버 목록 (프로필 이미지, 이름, 이메일, 역할)
- 이메일 입력 폼 + 역할 선택 드롭다운
- 초대 진행 중인 경우 조직 목록에서 회색으로 표시 (선택 불가, 초대 취소)
- 초대 가능한 역할 옵션 (관리자/멤버)

**Command**: 초대할 이메일 주소 입력하기
- 초대할 이메일 주소

**System**: Invitation System
- 이메일 입력 시 자동으로 프로필 검색
- 현재 멤버인지 확인
- 기존 초대가 있는지 확인
- 가능하면 선택, 불가능하면 선택 불가 처리

**Events**:
1. 초대할 이메일을 선택함 (Invitation Email Selected)

---

**Policy**: 
- "Whenever 초대할 이메일이 선택됨, then always 멤버 초대 요청 폼에 배지 표시하기"

**Read Model** (초대 요청 폼):
- 선택된 프로필 미리보기 (이름, 이메일, 프로필 이미지)
- 부여할 역할 선택 (관리자/멤버)
- 초대 요청 확인 버튼

**Command**: (Organization System) 멤버 초대 요청하기
- 선택된 프로필과 부여 역할 입력
- 초대 요청 확인

**System**: Invitation System
- 초대 정보 데이터베이스 저장

**Events**:
1. 멤버 초대 요청함 (Member Invitation Requested)

---

**Policy**: 
- "Whenever 멤버 초대 요청함, then always 멤버 초대 알림 추가"

**Command**: (Invitation System) 초대 알림 생성하기

**System**: Notification System (Notification Management Domain)

**Events**:
1. 초대 알림 생성됨 (Invitation Notification Created)

---

### Sequence 2: 초대받은 사용자가 초대를 확인하고 수락/거절

**Trigger Event**: 초대받은 사용자가 인박스 버튼을 클릭함

```
👤 초대받은 사용자: "초대 알림을 받았는데 조직에 참여하고 싶어"
```

**Policy**: 
- "Whenever 인박스 버튼이 클릭됨, then if 초대 있으면 then 초대 알림을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 초대 정보 (누구누구 님이 다음 조직에 초대함. ㅇㅇㅇ 조직)
- 초대 승낙/거절 버튼

**Command**: (유저) 초대 응답
- 초대 승낙하기 또는 초대 거절하기

**System**: Invitation System
- 초대 승낙이면 멤버 등록하기
- 초대 거절이면 초대 무효화하기

**Events**:
1. 초대 거절함 (Invitation Rejected)
2. 초대 승낙함 (Invitation Accepted)

---
**Policy**: 
- "Whenever 초대 승낙 or 초대 거절, then always 알림 읽기"

**Command**: (Organization System) 알림 읽기

**System**: Notification System (Notification Management Domain)

**Events**:
1. 알림 읽혀짐 (Notification Read)

2025-10-07
---

## 📍 Scenario 3: 멤버 역할 변경

### Sequence 1: 조직 관리자가 멤버의 역할을 변경

**Trigger Event**: 멤버 관리 화면에서 역할 변경 버튼을 클릭함

```
👤 조직 관리자 (소유자/어드민): "팀원의 권한을 Admin으로 승격시키고 싶어"
👤 조직 관리자 (소유자): "어드민의 권한을 Member로 강등시키고 싶어"
```

**Policy**: 
- "Whenever 역할 변경 버튼이 클릭됨, then always 역할 선택 옵션을 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 선택된 멤버의 현재 역할 정보
- 역할 선택 옵션 (관리자/멤버) → 현재 역할은 체크 표시

**Command**: 역할 옵션 선택하기
- 새로운 역할 선택 (관리자/멤버)

**System**: Organization System
- 현재 유저가 역할 변경 권한이 있는지 확인
- 변경 대상 멤버가 소유자가 아닌지 확인 (소유자는 역할 버튼 선택 불가)
- 현재 역할과 새 역할이 다른지 검증 (같은 옵션에는 체크 표시가 있고, 선택되지 않음)
- 소유자만 어드민을 멤버로 다운그레이드 가능 여부 확인 (멤버를 어드민으로 업그레이드 가능)
- 어드민은 멤버를 어드민으로 업그레이드만 가능 여부 확인

**Events**:
1. 역할 옵션이 선택됨 (Role Option Selected) (프론트엔드)

---

**Policy**: 
- "Whenever 역할 옵션이 선택됨, then if 어드민을 멤버로 다운그레이드하면, then 다운그레이드 확인 다이얼로그 띄우기"
- "Whenever 역할 옵션이 선택됨, then if 멤버를 어드민으로 업그레이드하면, then 업그레이드 확인 다이얼로그 띄우기"

**Read Model** (역할 변경 확인 다이얼로그):
- 선택된 멤버 정보 (이름, 이메일)
- 현재 역할 → 새 역할 표시
- 역할 변경에 따른 권한 변경 안내 메시지
- 확인/취소 버튼

**Command**: 역할 변경 확인
- 역할 변경 확인 또는 취소

**System**: Organization System
- 멤버 역할 데이터베이스 업데이트
- 멤버 권한 캐시 무효화

**Events**:
1. 멤버가 Admin으로 승격되었다 (Member Promoted to Admin)
2. Admin이 Member로 강등되었다 (Admin Demoted to Member)

---

## 📍 Scenario 4: 멤버 제거

### Sequence 1: 조직 관리자가 멤버를 조직에서 제거

**Trigger Event**: 멤버 역할 변경이 완료됨

```
👤 조직 관리자: "더 이상 필요없는 멤버를 조직에서 제거하고 싶어"
👤 멤버 본인: "이 조직을 떠나고 싶어"
```

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 조직 멤버 목록 (제거 가능한 멤버들)
- 멤버 제거 안내 메시지 및 주의사항
- 제거 사유 선택 옵션 (관리자 제거/본인 탈퇴)
- 제거 확인 체크박스
- 멤버 제거 진행 상태 표시

**Command**: 멤버 제거 요청 (사용자가 입력하는 정보)
- 제거할 대상 멤버 선택
- 제거 사유 선택 (관리자 제거/본인 탈퇴)
- 제거 확인 체크박스
- 멤버 제거 확인

**Policy**: 멤버 제거 규칙
- "소유자만 다른 멤버 제거 가능"
- "소유자는 제거 불가 (소유권 이전 후에만 가능)"
- "모든 멤버는 본인이 조직을 떠날 수 있음 (소유자 제외)"
- "제거된 멤버의 개인 워크스페이스는 조직 소유자에게 이전"
- "제거 시 모든 초대 및 세션 무효화"

**System**: Member Removal Manager → Database

**Events**:
1. 멤버 제거가 요청되었다 (Member Removal Requested)
2. 멤버 워크스페이스가 Owner에게 이전되었다 (Member Workspaces Transferred to Owner)
3. 멤버가 조직에서 제거되었다 (Member Removed from Organization)
4. 멤버 세션이 무효화되었다 (Member Sessions Invalidated)
5. 멤버 제거가 완료되었다 (Member Removal Completed)

---

## 📍 Scenario 5: 조직 소유권 이전 (핵심 시나리오)

### Sequence 1: 조직 소유자가 다른 멤버에게 소유권을 이전

**Trigger Event**: 사용자 권한이 확인됨

```
👤 현재 소유자: "조직 소유권을 다른 멤버에게 넘기고 싶어"
👤 새 소유자: "조직 소유권을 받아서 관리하고 싶어"
```

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 조직 멤버 목록 (소유권 이전 가능한 멤버들)
- 소유권 이전 안내 메시지 및 주의사항
- 확인 코드 입력 필드
- 이전 사유 입력 필드 (선택사항)
- 소유권 이전 진행 상태 표시

**Command**: 소유권 이전 요청 (사용자가 입력하는 정보)
- 이전할 대상 멤버 선택
- 확인 코드 입력
- 이전 사유 (선택사항)
- 소유권 이전 확인

**Policy**: 소유권 이전 규칙 (핵심)
- "현재 소유자만 소유권 이전 가능"
- "새 소유자는 반드시 기존 조직 멤버여야 함"
- "소유권 이전 시 확인 코드 입력 필수"
- "이전 즉시 새 소유자는 소유자 권한, 기존 소유자는 관리자 권한으로 변경"
- "모든 워크스페이스 소유권도 함께 이전"
- "진행 중인 초대는 새 소유자 명의로 변경"

**System**: Ownership Transfer Manager → Database

**Events**:
1. 소유권 이전이 요청되었다 (Ownership Transfer Requested)
2. 이전 확인이 완료되었다 (Transfer Confirmation Completed)
3. 새 소유자가 Owner 권한으로 승격되었다 (New Owner Promoted)
4. 기존 소유자가 Admin 권한으로 변경되었다 (Previous Owner Demoted to Admin)
5. 워크스페이스 소유권이 이전되었다 (Workspace Ownership Transferred)
6. 소유권 이전이 완료되었다 (Ownership Transfer Completed)

---

## 📍 Scenario 6: 조직 삭제 (Danger Zone)

### Sequence 1: 조직 Owner가 조직을 완전 삭제

**Trigger Event**: 멤버 제거가 완료됨

```
👤 Owner: "더 이상 필요없는 조직을 완전히 삭제하고 싶어"
```

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 삭제 가능한 조직 목록
- 조직 삭제 안내 메시지 및 주의사항
- 삭제 유형 선택 옵션 (소프트 삭제/완전 삭제)
- 조직 이름 확인 입력 필드
- 조직 삭제 진행 상태 표시

**Command**: 조직 삭제 요청 (사용자가 입력하는 정보)
- 삭제할 조직 선택
- 조직 이름 확인 입력
- 삭제 유형 선택 (소프트 삭제/완전 삭제)
- 조직 삭제 확인

**Policy**: 조직 삭제 규칙 (Danger Zone)
- "소유자만 삭제 가능"
- "정확한 조직 이름 입력 필수"
- "모든 워크스페이스와 관련 데이터 함께 삭제"
- "소프트 삭제 후 30일 보관"
- "30일 후 완전 삭제 (영구 삭제)"
- "멤버들에게 삭제 알림 발송"
- "기본 조직은 삭제 불가 (사용자 계정과 연동)"

**System**: Organization Deletion Manager → Database

**Events**:
1. 조직 삭제가 요청되었다 (Organization Deletion Requested)
2. 삭제 확인이 완료되었다 (Deletion Confirmed)
3. 모든 워크스페이스가 삭제되었다 (All Workspaces Deleted)
4. 모든 멤버가 제거되었다 (All Members Removed)
5. 조직이 소프트 삭제되었다 (Organization Soft Deleted)
6. 완전 삭제가 예약되었다 (Permanent Deletion Scheduled)

---

## 💡 핵심 Policy 정리

### 조직 및 멤버십 관리 관련
1. **새로운 조직 생성**: 모든 인증된 사용자는 새 조직을 생성할 수 있음
2. **조직 이름 고유성**: 조직 이름은 플랫폼 내에서 고유해야 함
3. **3단계 역할 시스템**: 소유자 > 관리자 > 멤버 권한 체계
4. **소유권 이전**: 소유자 역할은 이전을 통해서만 변경 가능

### 초대 및 멤버 관리 관련 (핵심)
5. **권한 기반 초대**: 소유자와 관리자만 멤버 초대 가능
6. **이메일 검증**: 초대 수락 시 이메일 주소 검증 필수
7. **30일 초대 유효기간**: 초대 링크 30일 후 자동 만료

### 삭제 및 보안
8. **소프트 삭제**: 30일 유예 기간 제공
9. **계층적 삭제**: 조직 삭제 시 하위 요소 함께 처리
10. **Danger Zone**: 조직 삭제는 이름 확인 + 소유자 권한 필수

---

## 🔧 기술 권장사항

### 조직 및 멤버십 최적화
- **Background Jobs**: 조직 삭제 등 무거운 작업은 백그라운드 처리 (추후)
- **Progress Tracking**: 소유권 이전 등 진행률 실시간 표시 (추후)

### 성능 최적화
- **Caching**: 조직 멤버 목록 및 권한 정보 캐싱
- **Database Indexing**: 조직-멤버 관계 쿼리 최적화를 위한 복합 인덱스
- **Session Management**: 조직 컨텍스트 세션 최적화
- **Auto-Refresh**: 세션 자동 갱신을 위한 백그라운드 처리

---

## 🚀 Next Steps

이제 Organization Management Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환
2. **Bounded Context 식별**: Organization, Member, Invitation 경계 확인
3. **Integration Points**: User Management Domain, Notification Management Domain과의 연결점 정의
4. **Anti-Corruption Layer**: 도메인 간 커맨드 실행 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2024년 10월 1일 (Domain 1 Event Storming 완료 후)
**참가자**: 
- **도메인 전문가**: CEO (Organization Management 정책 결정)
- **시니어 개발자**: 개발 리드 (조직 관리 전문가)
- **PM**: 프로젝트 매니저 (프로세스 정의)

**워크샵 결과물**:
- [x] 모든 핵심 조직 관리 여정이 시나리오로 정의됨 (6개 시나리오)
- [x] Event → Policy → Read Model → Command → System → Event 순서가 일관되게 적용됨
- [x] System 블랙박스 내부 처리 과정 세분화 (Organization Manager 상세 분석)
- [x] User Management Domain과의 통합점이 명확히 정의됨 (기본 조직 생성, 사용자 정보 참조)
- [x] Notification Management Domain과의 통합점이 명확히 정의됨 (초대 알림 생성)
- [x] 비즈니스 규칙(Policy)이 구체적으로 명시됨 (10개 핵심 정책)
- [x] Software Design 작성을 위한 충분한 정보 확보

---

*이 Process Model 문서는 Organization Management Domain의 Software Design 작성을 위한 기반 자료입니다.*
