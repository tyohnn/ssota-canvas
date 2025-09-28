# User Management Domain - Process Model

## 🎯 Process Modeling Overview
User Management Domain의 핵심 프로세스를 Command → Policy → System → Event 패턴으로 정의

### 🟪 External System: Clerk
User Management Domain은 Clerk을 인증 및 조직 관리 시스템으로 사용합니다:
- **역할**: 사용자 인증, 세션 관리, 조직 생성/관리, 멤버 초대 처리
- **SSOT**: Clerk이 User, Organization, Invitation의 Single Source of Truth
- **통합**: Clerk Webhook ↔ Supabase DB 간 실시간 동기화 필요

---

## 📍 Process 0: Clerk 데이터 동기화

### Scenario: Clerk에서 User/Organization 생성/변경 시 자동 동기화

```
🔗 Clerk Webhook: "사용자가 등록되었어" / "조직이 생성되었어"
```

**Command**: Clerk 데이터 동기화 (Sync Data from Clerk)
- clerkId: usr_xxx | org_xxx
- entityType: "user" | "organization"
- entityData: { id, email, name, metadata }
- webhookType: "user.created" | "user.updated" | "organization.created" | "organization.updated"

**Read Model** (필요 정보):
- Clerk 엔티티 데이터 (Webhook payload)
- 기존 동기화 상태 (Supabase 레코드)
- 실패 이력 및 재시도 횟수
- 관련 멤버십 정보 (조직의 경우)

**Policy**: Clerk → Supabase 동기화 규칙
- "Clerk User 생성 시 Supabase에 User 레코드 생성 + 기본 조직 자동 생성"
- "Clerk Organization 생성 시 Supabase에 Organization 레코드 생성"
- "동기화 실패 시 3회까지 재시도"
- "5초 내 재시도하며 exponential backoff 적용 (5s → 25s → 125s)"
- "사용자 등록 시 기본 조직 소유자 권한 자동 부여"

**System**: Clerk Webhook Handler → Supabase Database

**Events**:
1. Clerk 사용자 정보가 동기화되었다 (Clerk User Synced to Supabase)
2. Clerk 조직 정보가 동기화되었다 (Clerk Organization Synced to Supabase)
3. 기본 조직이 생성되었다 (Default Organization Created)
4. 사용자가 조직 소유자로 설정되었다 (User Set as Organization Owner)
5. 동기화가 실패했다 (Clerk Data Sync Failed)
6. 재시도가 예약되었다 (Sync Retry Scheduled)

---

## 📍 Process 1: 사용자 로그인 및 조직 선택

### Scenario: 사용자가 로그인하고 작업할 조직을 선택

```
👤 사용자: "로그인해서 내 조직들을 확인하고 작업할 조직을 선택하고 싶어"
```

**Command**: 사용자 로그인 (User Login)
- email: user@example.com
- authMethod: "email" | "oauth" | "sso"
- clerkSessionId: sess_xxx

**Read Model** (필요 정보):
- 사용자의 Clerk 인증 상태
- 사용자가 소유한 조직 목록
- 사용자가 멤버인 조직 목록
- 마지막 선택한 조직 정보

**Policy**: 로그인 및 조직 선택 규칙
- "Clerk 인증 성공 시에만 로그인 허용"
- "로그인 시 소유 조직과 멤버 조직 목록 자동 조회"
- "기본 조직이 없는 경우 자동 생성"
- "마지막 선택 조직이 있으면 자동 선택, 없으면 기본 조직 선택"
- "조직 선택 시 해당 조직의 컨텍스트로 전환"

**System**: Authentication Manager → Organization Context Manager

**Events**:
1. 사용자가 로그인함 (User Logged In)
2. 사용자 세션이 생성됨 (User Session Created)
3. 소유 조직 목록이 조회됨 (Owned Organizations Retrieved)
4. 소속 조직 목록이 조회됨 (Member Organizations Retrieved)
5. 사용자가 조직을 선택함 (Organization Selected by User)
6. 조직 컨텍스트가 설정됨 (Organization Context Set)

---

## 📍 Process 2: 멤버 초대 및 수락

### Scenario: 조직 관리자가 새 멤버를 초대하고 초대받은 사용자가 수락

```
👤 조직 관리자: "새 팀원을 우리 조직에 초대하고 싶어"
👤 초대받은 사용자: "초대 링크를 받았는데 조직에 참여하고 싶어"
```

**Command**: 멤버 초대 (Invite Member)
- organizationId: currentOrganization
- inviteeEmail: "newmember@example.com"
- role: "admin" | "member"
- inviterUserId: currentUser

**Read Model** (필요 정보):
- 현재 사용자의 조직 권한 (Owner/Admin 확인)
- 초대할 이메일의 기존 멤버십 상태
- 조직의 멤버 수 제한
- 기존 초대 상태 (중복 초대 방지)

**Policy**: 멤버 초대 규칙
- "Owner와 Admin만 멤버 초대 가능"
- "이미 조직 멤버인 사용자는 초대 불가"
- "동일 이메일에 대한 중복 초대 방지 (기존 초대 취소 후 새 초대)"
- "초대 링크는 30일간 유효"
- "초대 수락 시 이메일 검증 필수"
- "초대받은 사용자가 Clerk에 미등록 시 회원가입 유도"

**System**: Invitation Manager → Clerk API → Email Service

**Events**:
1. 이메일로 멤버 초대가 전송됨 (Member Invitation Sent via Email)
2. Clerk 초대 링크가 생성됨 (Clerk Invitation Link Generated)
3. 초대 정보가 Supabase에 저장됨 (Invitation Info Stored in Supabase)
4. 초대받은 사용자가 링크를 클릭함 (Invitation Link Clicked)
5. 초대가 수락됨 (Invitation Accepted)
6. 새 멤버가 조직에 추가됨 (New Member Added to Organization)
7. 멤버 역할이 설정됨 (Member Role Assigned)

---

## 📍 Process 3: 조직 소유권 이전 (핵심 프로세스)

### Scenario: 조직 소유자가 다른 멤버에게 소유권을 이전

```
👤 현재 소유자: "조직 소유권을 다른 멤버에게 넘기고 싶어"
👤 새 소유자: "조직 소유권을 받아서 관리하고 싶어"
```

**Command**: 조직 소유권 이전 (Transfer Organization Ownership)
- organizationId: currentOrganization
- currentOwnerId: currentOwner
- newOwnerId: targetMember
- confirmationCode: "TRANSFER_OWNERSHIP"

**Read Model** (필요 정보):
- 현재 사용자의 Owner 권한 확인
- 새 소유자의 조직 멤버십 상태 (Admin/Member)
- 조직 내 모든 워크스페이스 및 데이터
- 진행 중인 초대 및 멤버 관리 작업

**Policy**: 소유권 이전 규칙 (핵심)
- "현재 Owner만 소유권 이전 가능"
- "새 소유자는 반드시 기존 조직 멤버여야 함"
- "소유권 이전 시 확인 코드 입력 필수"
- "이전 즉시 새 소유자는 Owner 권한, 기존 소유자는 Admin 권한으로 변경"
- "모든 워크스페이스 소유권도 함께 이전"
- "진행 중인 초대는 새 소유자 명의로 변경"

**System**: Ownership Transfer Manager → Clerk API

**Events**:
1. 소유권 이전이 요청되었다 (Ownership Transfer Requested)
2. 이전 확인이 완료되었다 (Transfer Confirmation Completed)
3. 새 소유자가 Owner 권한으로 승격되었다 (New Owner Promoted)
4. 기존 소유자가 Admin 권한으로 변경되었다 (Previous Owner Demoted to Admin)
5. 워크스페이스 소유권이 이전되었다 (Workspace Ownership Transferred)
6. 소유권 이전이 완료되었다 (Ownership Transfer Completed)

---

## 📍 Process 4: 멤버 역할 변경 및 관리

### Scenario: 조직 관리자가 멤버의 역할을 변경하거나 멤버를 제거

```
👤 조직 관리자: "팀원의 권한을 Admin으로 승격시키고 싶어"
👤 조직 관리자: "더 이상 필요없는 멤버를 조직에서 제거하고 싶어"
```

**Command**: 멤버 역할 변경 (Change Member Role)
- organizationId: currentOrganization
- targetMemberId: targetUser
- newRole: "admin" | "member"
- changedByUserId: currentUser

**Read Model** (필요 정보):
- 현재 사용자의 조직 권한 (Owner/Admin 확인)
- 대상 멤버의 현재 역할
- 조직 내 Admin 수 (Admin 강등 시 확인)
- 대상 멤버의 워크스페이스 소유 현황

**Policy**: 멤버 역할 관리 규칙
- "Owner만 멤버 역할 변경 가능"
- "Owner 역할은 소유권 이전을 통해서만 변경 가능"
- "조직에 Admin 제한 수는 없음"
- "Member → Admin 승격 시 즉시 적용"

**System**: Member Role Manager → Clerk API

**Events**:
1. 멤버 역할 변경이 요청되었다 (Member Role Change Requested)
2. 멤버가 Admin으로 승격되었다 (Member Promoted to Admin)
3. Admin이 Member로 강등되었다 (Admin Demoted to Member)
4. 워크스페이스 소유권이 재할당되었다 (Workspace Ownership Reassigned)
5. 멤버 역할 변경이 완료되었다 (Member Role Change Completed)

---

## 📍 Process 5: 멤버 제거

### Scenario: 조직 관리자가 멤버를 조직에서 제거

```
👤 조직 관리자: "더 이상 필요없는 멤버를 조직에서 제거하고 싶어"
👤 멤버 본인: "이 조직을 떠나고 싶어"
```

**Command**: 멤버 제거 (Remove Member from Organization)
- organizationId: currentOrganization
- targetMemberId: targetUser
- removedByUserId: currentUser
- removalReason: "admin_removal" | "self_leave"

**Read Model** (필요 정보):
- 현재 사용자의 조직 권한 (Owner/Admin 확인)
- 대상 멤버의 현재 역할
- 대상 멤버가 소유한 워크스페이스 목록
- 진행 중인 초대 및 작업

**Policy**: 멤버 제거 규칙
- "Owner만 다른 멤버 제거 가능"
- "Owner는 제거 불가 (소유권 이전 후에만 가능)"
- "모든 멤버는 본인이 조직을 떠날 수 있음 (Owner 제외)"
- "제거된 멤버의 개인 워크스페이스는 조직 Owner에게 이전"
- "제거 시 모든 초대 및 세션 무효화"

**System**: Member Removal Manager → Clerk API

**Events**:
1. 멤버 제거가 요청되었다 (Member Removal Requested)
2. 멤버 워크스페이스가 Owner에게 이전되었다 (Member Workspaces Transferred to Owner)
3. 멤버가 조직에서 제거되었다 (Member Removed from Organization)
4. 멤버 세션이 무효화되었다 (Member Sessions Invalidated)
5. 멤버 제거가 완료되었다 (Member Removal Completed)

---

## 📍 Process 6: 조직 삭제 (Danger Zone)

### Scenario: 조직 Owner가 조직을 완전 삭제

```
👤 Owner: "더 이상 필요없는 조직을 완전히 삭제하고 싶어"
```

**Command**: 조직 삭제 (Delete Organization)
- organizationId: targetOrganization
- confirmationText: organizationName
- deleteType: "soft" | "permanent"
- deletedByUserId: currentOwner

**Read Model** (필요 정보):
- 조직의 모든 워크스페이스 목록
- 조직 멤버 목록 (Owner 포함)
- 관련된 모든 데이터 총량
- 삭제 권한 확인 (Owner만)

**Policy**: 조직 삭제 규칙 (Danger Zone)
- "Owner만 삭제 가능"
- "정확한 조직 이름 입력 필수"
- "모든 워크스페이스와 관련 데이터 함께 삭제"
- "소프트 삭제 후 30일 보관"
- "30일 후 완전 삭제 (영구 삭제)"
- "멤버들에게 삭제 알림 발송"
- "기본 조직은 삭제 불가 (사용자 계정과 연동)"

**System**: Organization Deletion Manager → Clerk API

**Events**:
1. 조직 삭제가 요청되었다 (Organization Deletion Requested)
2. 삭제 확인이 완료되었다 (Deletion Confirmed)
3. 모든 워크스페이스가 삭제되었다 (All Workspaces Deleted)
4. 모든 멤버가 제거되었다 (All Members Removed)
5. 조직이 소프트 삭제되었다 (Organization Soft Deleted)
6. 완전 삭제가 예약되었다 (Permanent Deletion Scheduled)

---

## 📍 Process 7: Clerk 사용자 삭제 처리

### Scenario: Clerk에서 사용자가 삭제됨 (계정 탈퇴)

```
🔗 Clerk Webhook: "사용자가 계정을 삭제했어"
```

**Command**: Clerk 사용자 삭제 처리 (Handle Clerk User Deletion)
- clerkUserId: deletedUserId
- deletionTimestamp: timestamp
- deletionReason: "user_requested" | "admin_action"

**Read Model** (필요 정보):
- 사용자의 모든 조직 소유권 목록
- 사용자의 모든 조직 멤버십 목록
- 삭제된 사용자 정보
- 관련 워크스페이스 및 데이터

**Policy**: Clerk 사용자 삭제 시 보존 규칙
- "사용자 삭제 시 소유 조직은 보존하되 orphaned 상태로 전환"
- "기본 조직의 경우 30일 후 완전 삭제 경고"
- "다른 조직의 멤버십은 즉시 제거"
- "기본 조직이 아닌 소유 조직이 있으면 삭제 불가 / 다른 Admin에게 소유권 이전해야 가능"

**System**: User Deletion Cleanup Manager

**Events**:
1. Clerk 사용자가 삭제되었다 (Clerk User Deleted)
2. 사용자 삭제 경고가 표시되었다 (User Deletion Warning Shown)
3. 소유 조직들이 orphaned 상태로 전환되었다 (Owned Organizations Orphaned)
4. 멤버십들이 제거되었다 (Memberships Removed)
5. 데이터 보존 안내가 발송되었다 (Data Preservation Guide Sent)

---

## 💡 핵심 Policy 정리

### Clerk 동기화 관련
1. **실시간 동기화**: Webhook을 통한 즉시 동기화
2. **장애 복구**: 3회 재시도 + exponential backoff (5s → 25s → 125s)
3. **데이터 보존**: Clerk 사용자 삭제 시에도 30일 유예

### 조직 및 멤버십 관리 관련
4. **기본 조직 자동 생성**: 사용자 등록 시 개인 조직 자동 생성
5. **3단계 역할 시스템**: Owner > Admin > Member 권한 체계
6. **소유권 이전**: Owner 역할은 이전을 통해서만 변경 가능

### 초대 및 멤버 관리 관련 (핵심)
7. **권한 기반 초대**: Owner와 Admin만 멤버 초대 가능
8. **이메일 검증**: 초대 수락 시 이메일 주소 검증 필수
9. **30일 초대 유효기간**: 초대 링크 30일 후 자동 만료

### 삭제 및 보안
10. **소프트 삭제**: 30일 유예 기간 제공
11. **계층적 삭제**: 조직 삭제 시 하위 요소 함께 처리
12. **Danger Zone**: 조직 삭제는 이름 확인 + Owner 권한 필수

---

## 🔧 기술 권장사항

### Clerk Webhook 처리
- **Queue System**: 대량 동기화 시 Queue 활용 (Supabase Queue 사용)
- **Idempotency**: 중복 요청 방지를 위한 idempotency key
- **Monitoring**: 동기화 실패율 모니터링 및 알림

### 조직 및 멤버십 최적화
- **Background Jobs**: 조직 삭제 등 무거운 작업은 백그라운드 처리 (추후)
- **Progress Tracking**: 소유권 이전 등 진행률 실시간 표시 (추후)

### 성능 최적화
- **Caching**: 조직 멤버 목록 및 권한 정보 캐싱
- **Database Indexing**: 조직-멤버 관계 쿼리 최적화를 위한 복합 인덱스
- **Session Management**: 조직 컨텍스트 세션 최적화

---

## 🚀 Next Steps

이제 User Management Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환 (Clerk은 External System으로 유지)
2. **Bounded Context 식별**: User, Organization, Membership 경계 확인
3. **Integration Points**: Workspace Structure Domain과의 연결점 정의
4. **Anti-Corruption Layer**: Clerk ↔ Supabase 변환 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2024년 10월 1일 (Domain 1 Event Storming 완료 후)
**참가자**: 
- **도메인 전문가**: CEO (User Management 정책 결정)
- **시니어 개발자**: 개발 리드 (Clerk 통합 전문가)
- **PM**: 프로젝트 매니저 (프로세스 정의)

**워크샵 결과물**:
- [x] 모든 핵심 사용자 여정이 Process로 정의됨 (7개 프로세스)
- [x] Command-Policy-System-Event 패턴이 일관되게 적용됨
- [x] Clerk과의 통합점이 명확히 정의됨 (Webhook, API)
- [x] 비즈니스 규칙(Policy)이 구체적으로 명시됨 (12개 핵심 정책)
- [x] Software Design 작성을 위한 충분한 정보 확보

---

*이 Process Model 문서는 User Management Domain의 Software Design 작성을 위한 기반 자료입니다.*
