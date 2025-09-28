# [Domain Name] Domain - Process Model

## 🎯 Process Modeling Overview
[Domain Name] Domain의 핵심 프로세스를 Command → Policy → System → Event 패턴으로 정의

### 🟪 External System: [External System Name]
[Domain Name]은 [External System Name]을 [용도/역할] 시스템으로 사용합니다:
- **역할**: [External System의 구체적 역할과 책임]
- **SSOT**: [External System Name]이 [Entity/Data]의 Single Source of Truth
- **통합**: [External System Name] ↔ 우리 DB 간 [통합 방식] 필요

---

## 📍 Process 0: [External System] 동기화

### Scenario: [External System]에서 [Entity] 생성/변경 시 자동 동기화

```
🔗 [External System] Webhook: "[Entity]가 생성/변경되었어"
```

**Command**: [Entity] 동기화 (Sync [Entity] from [External System])
- [externalEntityId]: [external_id_format]
- [entityData]: { [field1], [field2], [field3] }
- webhookType: "[entity].created" | "[entity].updated"

**Read Model** (필요 정보):
- [External System] [Entity] 데이터
- 기존 동기화 상태
- 실패 이력 및 재시도 횟수

**Policy**: [External System] → DB 동기화 규칙
- "[External System] [Entity] 생성 시 우리 DB에 [Entity] 레코드 생성"
- "[External System] [Entity] 업데이트 시 기존 레코드 갱신"
- "동기화 실패 시 [N]회까지 재시도"
- "[Time]초 내 재시도하며 exponential backoff 적용"

**System**: [External System] Webhook Handler → Database

**Events**:
1. [External System] [Entity] 정보가 동기화되었다 ([Entity] Synced from [External System])
2. [Entity] [Related Data] 목록이 갱신되었다 ([Entity] [Related Data] Updated)
3. 동기화가 실패했다 ([Entity] Sync Failed)
4. 재시도가 예약되었다 (Sync Retry Scheduled)

---

## 📍 Process 1: [Core Entity] 생성

### Scenario: 사용자가 새로운 [Core Entity]를 생성

```
👤 사용자: "[Core Entity] 생성 관련 구체적 요구사항"
```

**Command**: [Core Entity] 생성 (Create [Core Entity])
- [parentEntityId]: current[ParentEntity]
- [field1]: "[Example Value]"
- [field2]: "[Example Description]"
- [templateId]?: template_xxx (선택사항)

**Read Model** (필요 정보):
- 사용자의 [Parent Entity] 권한
- 선택된 템플릿 정보 (있는 경우)
- [Parent Entity]의 [Core Entity] 개수
- 플랜별 제한사항

**Policy**: [Core Entity] 생성 규칙
- "[Parent Entity]의 [Role1], [Role2], [Role3]만 [Core Entity] 생성 가능"
- "[Plan Type] 플랜에서는 [Parent Entity]당 [N]개 [Core Entity] 제한"
- "템플릿 선택 시 템플릿의 [Related Structure] 자동 복사"
- "빈 [Core Entity] 생성 시 [Default Content] 자동 생성"

**System**: [Core Entity] Manager

**Events**:
1. [Core Entity]가 생성되었다 ([Core Entity] Created)
2. 기본 [Default Content]가 생성되었다 ([Default Content] Created)
3. 생성자가 [Owner Role] 권한으로 설정되었다 (Creator Set as [Owner Role])
4. 템플릿 [Related Entities]가 복사되었다 (Template [Related Entities] Copied) *템플릿 사용 시*

---

## 📍 Process 2: [Child Entity] 생성 및 중첩

### Scenario: 사용자가 [Parent Entity] 내에 새 [Child Entity]를 생성

```
👤 사용자: "[Child Entity] 생성 관련 구체적 요구사항"
```

**Command**: [Child Entity] 생성 (Create [Child Entity])
- [parentEntityId]: current[ParentEntity]
- [parentChildId]?: parent[Child] (폴더 역할)
- [field1]: "[Example Title]"
- position: insertIndex

**Read Model** (필요 정보):
- [Parent Entity] 접근 권한
- 부모 [Child Entity]의 중첩 깊이
- 같은 레벨의 기존 [Child Entity] 목록
- [Child Entity] 순서 정보

**Policy**: [Child Entity] 계층 구조 규칙
- "[Parent Entity]의 [Role1], [Role2]만 [Child Entity] 생성 가능"
- "중첩 깊이는 무제한이지만 성능상 [N]레벨 권장"
- "[Folder Concept] = [Child Entity]이므로 모든 [Child Entity]는 [Content]을 포함할 수 있음"
- "같은 부모 하위에서 제목 중복 허용"
- "순서는 생성 시점 기준 마지막 위치"

**System**: [Child Entity] Manager

**Events**:
1. [Child Entity]가 생성되었다 ([Child Entity] Created)
2. [Child Entity] 계층구조가 업데이트되었다 ([Child Entity] Hierarchy Updated)
3. [Child Entity] 순서가 설정되었다 ([Child Entity] Order Set)
4. 빈 [Default Content]가 초기화되었다 (Empty [Default Content] Initialized)

---

## 📍 Process 3: [Child Entity] 이동 (핵심 프로세스)

### Scenario: 사용자가 [Child Entity]를 다른 [Parent Entity]로 이동

```
👤 사용자: "[Child Entity] 이동 관련 구체적 요구사항"
```

**Command**: [Child Entity] 이동 (Move [Child Entity] to [Parent Entity])
- [childEntityId]: target[Child]
- [targetParentEntityId]: destination[Parent]
- [newParentChildId]?: newParent
- keepReferences: boolean

**Read Model** (필요 정보):
- 원본 [Parent Entity] 권한 ([Required Role] 이상)
- 대상 [Parent Entity] 권한 ([Required Role] 이상)
- [Child Entity]의 모든 하위 [Child Entity] 목록
- [Child Entity] 내 [Related Content] 존재 여부

**Policy**: [Child Entity] 이동 시 권한 및 구조 관리 (핵심)
- "양쪽 [Parent Entity] 모두 [Required Role] 권한 필요"
- "이동 시 하위 [Child Entity]들도 함께 이동"
- "순환 참조 방지: 자기 자신을 부모로 설정 불가"
- "[Child Entity] 내 [Related Content]는 [Related Domain]에서 처리"

**System**: [Child Entity] Migration Manager

**Events**:
1. [Child Entity] 이동이 시작되었다 ([Child Entity] Migration Started)
2. [Child Entity]가 원본 [Parent Entity]에서 제거되었다 ([Child Entity] Removed from Source)
3. [Child Entity]가 대상 [Parent Entity]에 추가되었다 ([Child Entity] Added to Target)
4. [Child Entity] 이동이 완료되었다 ([Child Entity] Migration Completed)

---

## 📍 Process 4: [Child Entity] 중첩 및 순서 변경

### Scenario: 사용자가 [Child Entity] 구조를 재정리

```
👤 사용자: "[Child Entity] 구조 재정리 관련 구체적 요구사항"
```

**Command**: [Child Entity] 구조 변경 (Restructure [Child Entity])
- [childEntityId]: target[Child]
- newParentId?: newParent
- newPosition: targetIndex

**Read Model** (필요 정보):
- 현재 [Child Entity] 계층구조
- 이동 대상 위치의 기존 [Child Entity] 목록
- [Child Entity]의 모든 하위 [Child Entity] 목록

**Policy**: 구조 변경 제약사항
- "순환 참조 방지: 하위 [Child Entity]를 상위로 이동 불가"
- "폴더([Child Entity])를 자기 자신의 하위로 이동 불가"
- "깊이 제한: [N]레벨 초과 시 경고"
- "위치 조정 시 다른 [Child Entity]들의 순서 자동 재정렬"

**System**: [Child Entity] Hierarchy Manager

**Events**:
1. [Child Entity] 부모가 변경되었다 ([Child Entity] Parent Changed)
2. [Child Entity] 순서가 변경되었다 ([Child Entity] Order Changed)
3. 계층구조가 재정렬되었다 (Hierarchy Restructured)
4. 순환 참조가 방지되었다 (Circular Reference Prevented)

---

## 📍 Process 5: [Child Entity] 삭제 및 복구

### Scenario: 사용자가 [Child Entity]를 삭제하고 나중에 복구

```
👤 사용자: "[Child Entity] 삭제 관련 요구사항"
나중에: "[Child Entity] 복구 관련 요구사항"
```

**Command**: [Child Entity] 삭제 (Delete [Child Entity])
- [childEntityId]: target[Child]
- deleteType: "soft" | "permanent"

**Read Model** (필요 정보):
- [Child Entity]의 하위 [Child Entity] 목록
- [Child Entity] 내 [Related Content] 존재 여부
- 삭제 권한 확인

**Policy**: 계층적 삭제 규칙
- "[Role1], [Role2]만 삭제 가능"
- "하위 [Child Entity]가 있는 경우 함께 삭제 (재귀적)"
- "소프트 삭제: deleted_at 설정, 실제 데이터 보존"
- "[N]일 후 완전 삭제 (배치 작업)"
- "[Child Entity] 내 [Related Content]는 [Related Domain]에서 처리"

**System**: [Child Entity] Deletion Manager

**Events**:
1. [Child Entity]가 [Soft Delete Container]로 이동되었다 ([Child Entity] Moved to [Soft Delete Container])
2. 하위 [Child Entity]들이 함께 삭제되었다 (Child [Child Entity] Deleted)
3. 삭제 일정이 예약되었다 (Deletion Scheduled)

**복구 Command**: [Child Entity] 복구 (Restore [Child Entity])
- [childEntityId]: deleted[Child]

**복구 Events**:
1. [Child Entity]가 [Soft Delete Container]에서 복구되었다 ([Child Entity] Restored from [Soft Delete Container])
2. 하위 [Child Entity]들이 함께 복구되었다 (Child [Child Entity] Restored)

---

## 📍 Process 6: [Parent Entity] 삭제 (Danger Zone)

### Scenario: [Parent Entity] Owner가 [Parent Entity]를 완전 삭제

```
👤 Owner: "[Parent Entity] 완전 삭제 관련 요구사항"
```

**Command**: [Parent Entity] 삭제 (Delete [Parent Entity])
- [parentEntityId]: target[Parent]
- confirmationText: [parentEntityName]
- permanentDelete: boolean

**Read Model** (필요 정보):
- [Parent Entity]의 모든 [Child Entity] 목록
- [Parent Entity] 멤버 목록
- 관련된 [Related Content] 총량
- 삭제 권한 확인 (Owner만)

**Policy**: [Parent Entity] 삭제 규칙 (Danger Zone)
- "Owner만 삭제 가능"
- "정확한 [parent entity] 이름 입력 필수"
- "모든 하위 [Child Entity]와 [Related Content] 함께 삭제"
- "소프트 삭제 후 [N]일 보관"
- "멤버들에게 삭제 알림 발송"

**System**: [Parent Entity] Deletion Manager

**Events**:
1. [Parent Entity] 삭제가 요청되었다 ([Parent Entity] Deletion Requested)
2. 삭제 확인이 완료되었다 (Deletion Confirmed)
3. 모든 [Child Entity]가 삭제되었다 (All [Child Entity] Deleted)
4. 멤버들이 제거되었다 (Members Removed)
5. [Parent Entity]가 완전히 삭제되었다 ([Parent Entity] Permanently Deleted)

---

## 📍 Process 7: [Top Level Entity] 삭제 경고

### Scenario: [External System]에서 [Top Level Entity]이 삭제됨

```
🔗 [External System] Webhook: "[Top Level Entity]이 삭제되었어"
```

**Command**: [Top Level Entity] 삭제 처리 (Handle [Top Level Entity] Deletion)
- [externalTopLevelEntityId]: deleted[TopLevelEntity]Id
- deletionTimestamp: timestamp

**Read Model** (필요 정보):
- [Top Level Entity]의 모든 [Parent Entity] 목록
- [Top Level Entity] 멤버 목록
- 삭제된 [Top Level Entity] 정보

**Policy**: [Top Level Entity] 삭제 시 보존 규칙
- "[Top Level Entity] 삭제 시 [Parent Entity]는 보존"
- "orphaned 상태로 전환하고 경고 표시"
- "Owner에게 [Top Level Entity] 재생성 또는 데이터 이전 안내"
- "[N]일 후 데이터 완전 삭제 경고"

**System**: [Top Level Entity] Cleanup Manager

**Events**:
1. [External System] [Top Level Entity]이 삭제되었다 ([External System] [Top Level Entity] Deleted)
2. [Top Level Entity] 삭제 경고가 표시되었다 ([Top Level Entity] Deletion Warning Shown)
3. [Parent Entity]들이 orphaned 상태로 전환되었다 ([Parent Entity] Orphaned)
4. 데이터 이전 안내가 발송되었다 (Migration Guide Sent)

---

## 💡 핵심 Policy 정리

### [External System] 동기화 관련
1. **실시간 동기화**: Webhook을 통한 즉시 동기화
2. **장애 복구**: [N]회 재시도 + exponential backoff
3. **데이터 보존**: [Top Level Entity] 삭제 시에도 [N]일 유예

### [Child Entity] 계층 구조 관련
4. **무제한 중첩**: 성능상 [N]레벨 권장
5. **폴더 = [Child Entity]**: 모든 [Child Entity]는 [Content] 포함 가능
6. **순환 참조 방지**: 엄격한 계층 구조 유지

### [Child Entity] 이동 관련 (핵심)
7. **권한 검증**: 양쪽 [Parent Entity] 모두 [Required Role] 권한 필요
8. **[Related Content] 처리**: [Related Domain]에서 [Related Content] 이동 처리
9. **하위 [Child Entity] 일괄 이동**: 계층 구조 유지

### 삭제 및 복구
10. **소프트 삭제**: [N]일 유예 기간 제공
11. **계층적 삭제**: 하위 요소 함께 처리
12. **Danger Zone**: 중요한 삭제는 확인 절차 강화

---

## 🔧 기술 권장사항

### [External System] Webhook 처리
- **Queue System**: 대량 동기화 시 Queue 활용
- **Idempotency**: 중복 요청 방지를 위한 idempotency key
- **Monitoring**: 동기화 실패율 모니터링

### [Child Entity] 이동 최적화
- **Batch Processing**: 대량 링크 업데이트 시 배치 처리
- **Background Jobs**: 무거운 이동 작업은 백그라운드 처리
- **Progress Tracking**: 진행률 실시간 표시

### 성능 최적화
- **Lazy Loading**: 깊은 계층 구조는 점진적 로딩
- **Caching**: 자주 접근하는 계층 구조 캐싱
- **Indexing**: 계층 쿼리 최적화를 위한 적절한 인덱스

---

## 🚀 Next Steps

이제 [Domain Name] Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환 ([External System]은 External System으로 유지)
2. **Bounded Context 식별**: [Core Entity], [Child Entity], [Top Level Entity] 경계 확인
3. **Integration Points**: 다른 도메인과의 연결점 정의
4. **Anti-Corruption Layer**: [External System] ↔ DB 변환 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: [워크샵 진행 날짜 및 시간]
**참가자**: 
- **도메인 전문가**: [이름]
- **시니어 개발자**: [이름]
- **PM**: [이름]
- **기타**: [추가 참가자]

**워크샵 결과물**:
- [ ] 모든 핵심 사용자 여정이 Process로 정의됨
- [ ] Command-Policy-System-Event 패턴이 일관되게 적용됨
- [ ] External System과의 통합점이 명확히 정의됨
- [ ] 비즈니스 규칙(Policy)이 구체적으로 명시됨
- [ ] Software Design 작성을 위한 충분한 정보 확보

---

*이 Process Model 문서는 [Domain Name] Domain의 Software Design 작성을 위한 기반 자료입니다.*
