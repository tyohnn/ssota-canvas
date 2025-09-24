# Workspace Structure Domain - Process Model

## 🎯 Process Modeling Overview
Workspace Structure Domain의 핵심 프로세스를 Command → Policy → System → Event 패턴으로 정의

### 🟪 External System: Clerk
Workspace Structure는 Clerk을 사용자 인증 및 Organization 관리 시스템으로 사용합니다:
- **역할**: Organization/User 관리, 인증, 권한 기반 정보 제공
- **SSOT**: Clerk이 Organization/User의 Single Source of Truth
- **통합**: Clerk ↔ 우리 DB 간 Webhook 동기화 필요

---

## 📍 Process 0: Clerk Organization 동기화

### Scenario: Clerk에서 Organization 생성/변경 시 자동 동기화

```
🔗 Clerk Webhook: "Organization이 생성/변경되었어"
```

**Command**: Organization 동기화 (Sync Organization from Clerk)
- clerkOrgId: org_xxx
- orgData: { name, members, settings }
- webhookType: "organization.created" | "organization.updated"

**Read Model** (필요 정보):
- Clerk Organization 데이터
- 기존 동기화 상태
- 실패 이력 및 재시도 횟수

**Policy**: Clerk → DB 동기화 규칙
- "Clerk Organization 생성 시 우리 DB에 Organization 레코드 생성"
- "Clerk Organization 업데이트 시 기존 레코드 갱신"
- "동기화 실패 시 3회까지 재시도"
- "30초 내 재시도하며 exponential backoff 적용"

**System**: Clerk Webhook Handler → Database

**Events**:
1. Clerk Organization 정보가 동기화되었다 (Organization Synced from Clerk)
2. Organization 멤버 목록이 갱신되었다 (Organization Members Updated)
3. 동기화가 실패했다 (Organization Sync Failed)
4. 재시도가 예약되었다 (Sync Retry Scheduled)

---

## 📍 Process 1: Workspace 생성

### Scenario: 사용자가 새로운 Workspace를 생성

```
👤 사용자: "새 프로젝트를 위한 워크스페이스를 만들고 싶어"
```

**Command**: Workspace 생성 (Create Workspace)
- organizationId: currentOrganization
- name: "새 프로젝트"
- description: "프로젝트 설명"
- templateId?: template_xxx (선택사항)

**Read Model** (필요 정보):
- 사용자의 Organization 권한
- 선택된 템플릿 정보 (있는 경우)
- Organization의 Workspace 개수
- 플랜별 제한사항

**Policy**: Workspace 생성 규칙
- "Organization의 Owner, Admin, Member만 Workspace 생성 가능"
- "Free 플랜에서는 Organization당 5개 Workspace 제한"
- "템플릿 선택 시 템플릿의 Page 구조 자동 복사"
- "빈 Workspace 생성 시 Welcome Page 자동 생성"

**System**: Workspace Manager

**Events**:
1. Workspace가 생성되었다 (Workspace Created)
2. 기본 Welcome Page가 생성되었다 (Welcome Page Created)
3. 생성자가 Owner 권한으로 설정되었다 (Creator Set as Owner)
4. 템플릿 페이지들이 복사되었다 (Template Pages Copied) *템플릿 사용 시*

---

## 📍 Process 2: Page 생성 및 중첩

### Scenario: 사용자가 Workspace 내에 새 Page를 생성

```
👤 사용자: "문서 정리를 위해 새 페이지를 만들고 싶어"
```

**Command**: Page 생성 (Create Page)
- workspaceId: currentWorkspace
- parentPageId?: parentPage (폴더 역할)
- title: "새 페이지"
- position: insertIndex

**Read Model** (필요 정보):
- Workspace 접근 권한
- 부모 Page의 중첩 깊이
- 같은 레벨의 기존 Page 목록
- 페이지 순서 정보

**Policy**: Page 계층 구조 규칙
- "Workspace의 Editor, Owner만 Page 생성 가능"
- "중첩 깊이는 무제한이지만 성능상 50레벨 권장"
- "폴더 = Page이므로 모든 Page는 블럭을 포함할 수 있음"
- "같은 부모 하위에서 제목 중복 허용"
- "순서는 생성 시점 기준 마지막 위치"

**System**: Page Manager

**Events**:
1. Page가 생성되었다 (Page Created)
2. Page 계층구조가 업데이트되었다 (Page Hierarchy Updated)
3. Page 순서가 설정되었다 (Page Order Set)
4. 빈 캔버스가 초기화되었다 (Empty Canvas Initialized)

---

## 📍 Process 3: Page 이동 (핵심 프로세스)

### Scenario: 사용자가 Page를 다른 Workspace로 이동

```
👤 사용자: "이 페이지를 다른 워크스페이스로 옮기고 싶어"
```

**Command**: Page 이동 (Move Page to Workspace)
- pageId: targetPage
- targetWorkspaceId: destinationWorkspace
- newParentPageId?: newParent
- keepReferences: boolean

**Read Model** (필요 정보):
- 원본 Workspace 권한 (Editor 이상)
- 대상 Workspace 권한 (Editor 이상)
- Page의 모든 하위 Page 목록
- Page 내 블럭 데이터 존재 여부

**Policy**: Page 이동 시 권한 및 구조 관리 (핵심)
- "양쪽 Workspace 모두 Editor 권한 필요"
- "이동 시 하위 Page들도 함께 이동"
- "순환 참조 방지: 자기 자신을 부모로 설정 불가"
- "Page 내 블럭 데이터는 Visual Canvas Domain에서 처리"

**System**: Page Migration Manager

**Events**:
1. Page 이동이 시작되었다 (Page Migration Started)
2. Page가 원본 Workspace에서 제거되었다 (Page Removed from Source)
3. Page가 대상 Workspace에 추가되었다 (Page Added to Target)
4. Page 이동이 완료되었다 (Page Migration Completed)

---

## 📍 Process 4: Page 중첩 및 순서 변경

### Scenario: 사용자가 Page 구조를 재정리

```
👤 사용자: "페이지 순서를 바꾸고 폴더 구조를 정리하고 싶어"
```

**Command**: Page 구조 변경 (Restructure Pages)
- pageId: targetPage
- newParentId?: newParent
- newPosition: targetIndex

**Read Model** (필요 정보):
- 현재 Page 계층구조
- 이동 대상 위치의 기존 Page 목록
- Page의 모든 하위 Page 목록

**Policy**: 구조 변경 제약사항
- "순환 참조 방지: 하위 Page를 상위로 이동 불가"
- "폴더(Page)를 자기 자신의 하위로 이동 불가"
- "깊이 제한: 50레벨 초과 시 경고"
- "위치 조정 시 다른 Page들의 순서 자동 재정렬"

**System**: Page Hierarchy Manager

**Events**:
1. Page 부모가 변경되었다 (Page Parent Changed)
2. Page 순서가 변경되었다 (Page Order Changed)
3. 계층구조가 재정렬되었다 (Hierarchy Restructured)
4. 순환 참조가 방지되었다 (Circular Reference Prevented)

---

## 📍 Process 5: Page 삭제 및 복구

### Scenario: 사용자가 Page를 삭제하고 나중에 복구

```
👤 사용자: "이 페이지는 더 이상 필요없어"
나중에: "아, 그 페이지 다시 필요해"
```

**Command**: Page 삭제 (Delete Page)
- pageId: targetPage
- deleteType: "soft" | "permanent"

**Read Model** (필요 정보):
- Page의 하위 Page 목록
- Page 내 블럭 데이터 존재 여부
- 삭제 권한 확인

**Policy**: 계층적 삭제 규칙
- "Owner, Editor만 삭제 가능"
- "하위 Page가 있는 경우 함께 삭제 (재귀적)"
- "소프트 삭제: deleted_at 설정, 실제 데이터 보존"
- "30일 후 완전 삭제 (배치 작업)"
- "Page 내 블럭 데이터는 Visual Canvas Domain에서 처리"

**System**: Page Deletion Manager

**Events**:
1. Page가 휴지통으로 이동되었다 (Page Moved to Trash)
2. 하위 Page들이 함께 삭제되었다 (Child Pages Deleted)
3. 삭제 일정이 예약되었다 (Deletion Scheduled)

**복구 Command**: Page 복구 (Restore Page)
- pageId: deletedPage

**복구 Events**:
1. Page가 휴지통에서 복구되었다 (Page Restored from Trash)
2. 하위 Page들이 함께 복구되었다 (Child Pages Restored)

---

## 📍 Process 6: Workspace 삭제 (Danger Zone)

### Scenario: Workspace Owner가 Workspace를 완전 삭제

```
👤 Owner: "이 워크스페이스는 더 이상 필요없어"
```

**Command**: Workspace 삭제 (Delete Workspace)
- workspaceId: targetWorkspace
- confirmationText: workspaceName
- permanentDelete: boolean

**Read Model** (필요 정보):
- Workspace의 모든 Page 목록
- Workspace 멤버 목록
- 관련된 블럭 데이터 총량
- 삭제 권한 확인 (Owner만)

**Policy**: Workspace 삭제 규칙 (Danger Zone)
- "Owner만 삭제 가능"
- "정확한 워크스페이스 이름 입력 필수"
- "모든 하위 Page와 블럭 데이터 함께 삭제"
- "소프트 삭제 후 30일 보관"
- "멤버들에게 삭제 알림 발송"

**System**: Workspace Deletion Manager

**Events**:
1. Workspace 삭제가 요청되었다 (Workspace Deletion Requested)
2. 삭제 확인이 완료되었다 (Deletion Confirmed)
3. 모든 Page가 삭제되었다 (All Pages Deleted)
4. 멤버들이 제거되었다 (Members Removed)
5. Workspace가 완전히 삭제되었다 (Workspace Permanently Deleted)

---

## 📍 Process 7: Organization 삭제 경고

### Scenario: Clerk에서 Organization이 삭제됨

```
🔗 Clerk Webhook: "Organization이 삭제되었어"
```

**Command**: Organization 삭제 처리 (Handle Organization Deletion)
- clerkOrgId: deletedOrgId
- deletionTimestamp: timestamp

**Read Model** (필요 정보):
- Organization의 모든 Workspace 목록
- Organization 멤버 목록
- 삭제된 Organization 정보

**Policy**: Organization 삭제 시 보존 규칙
- "Organization 삭제 시 Workspace는 보존"
- "orphaned 상태로 전환하고 경고 표시"
- "Owner에게 Organization 재생성 또는 데이터 이전 안내"
- "90일 후 데이터 완전 삭제 경고"

**System**: Organization Cleanup Manager

**Events**:
1. Clerk Organization이 삭제되었다 (Clerk Organization Deleted)
2. Organization 삭제 경고가 표시되었다 (Organization Deletion Warning Shown)
3. Workspace들이 orphaned 상태로 전환되었다 (Workspaces Orphaned)
4. 데이터 이전 안내가 발송되었다 (Migration Guide Sent)

---

## 💡 핵심 Policy 정리

### Clerk 동기화 관련
1. **실시간 동기화**: Webhook을 통한 즉시 동기화
2. **장애 복구**: 3회 재시도 + exponential backoff
3. **데이터 보존**: Organization 삭제 시에도 90일 유예

### Page 계층 구조 관련
4. **무제한 중첩**: 성능상 50레벨 권장
5. **폴더 = Page**: 모든 Page는 블럭 포함 가능
6. **순환 참조 방지**: 엄격한 계층 구조 유지

### Page 이동 관련 (핵심)
7. **권한 검증**: 양쪽 Workspace 모두 Editor 권한 필요
8. **블럭 데이터 처리**: Visual Canvas Domain에서 블럭 이동 처리
9. **하위 Page 일괄 이동**: 계층 구조 유지

### 삭제 및 복구
10. **소프트 삭제**: 30일 유예 기간 제공
11. **계층적 삭제**: 하위 요소 함께 처리
12. **Danger Zone**: 중요한 삭제는 확인 절차 강화

---

## 🔧 기술 권장사항

### Clerk Webhook 처리
- **Queue System**: 대량 동기화 시 Queue 활용
- **Idempotency**: 중복 요청 방지를 위한 idempotency key
- **Monitoring**: 동기화 실패율 모니터링

### Page 이동 최적화
- **Batch Processing**: 대량 링크 업데이트 시 배치 처리
- **Background Jobs**: 무거운 이동 작업은 백그라운드 처리
- **Progress Tracking**: 진행률 실시간 표시

### 성능 최적화
- **Lazy Loading**: 깊은 계층 구조는 점진적 로딩
- **Caching**: 자주 접근하는 계층 구조 캐싱
- **Indexing**: 계층 쿼리 최적화를 위한 적절한 인덱스

---

## 🚀 Next Steps

이제 Workspace Structure Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환 (Clerk는 External System으로 유지)
2. **Bounded Context 식별**: Workspace, Page, Organization 경계 확인
3. **Integration Points**: 다른 도메인과의 연결점 정의
4. **Anti-Corruption Layer**: Clerk ↔ DB 변환 레이어 설계
