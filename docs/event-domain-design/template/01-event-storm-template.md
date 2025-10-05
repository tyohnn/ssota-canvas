# [Domain Name] Domain - Event Storming

## 📊 Domain Overview
**비즈니스 가치**: [이 도메인이 제공하는 핵심 비즈니스 가치 설명 - 다른 도메인과의 관계 포함]

## 📝 핵심 개념 정리

### [External System Name] Integration Strategy (필요한 경우)
- **[Entity/Concept 1]**: [외부 시스템에서 관리되는 엔티티와 동기화 전략]
- **[Entity/Concept 2]**: [우리 DB에 저장하는 정보와 관리 방식]
- **Sync Method**: [동기화 방법 - Webhook, API 호출 등]

### [Domain Core Concept]
```
[계층 구조나 핵심 개념의 관계도]
Level 1 (최상위)
└── Level 2 (중간)
    └── Level 3 (최하위)
```

### [Domain Scope/Boundary]
- **[Core Entity 1]**: [이 도메인에서 관리하는 핵심 엔티티]
- **[Core Entity 2]**: [이 도메인에서 관리하는 핵심 엔티티]
- **[Core Entity 3]**: [이 도메인에서 관리하는 핵심 엔티티]

### [Business Rules/Policies]
- **[Policy Category 1]**: [구체적인 비즈니스 정책]
- **[Policy Category 2]**: [구체적인 비즈니스 정책]

---

## 🟠 Domain Events (시간 순서)

### [Event Category 1] (예: User & Permission Management)
- [Entity]가 생성되었다 ([Entity] Created)
- [Entity] 정보가 동기화되었다 ([Entity] Synced from [External System])
- [Entity]에 [Action]이 수행되었다 ([Action] Applied to [Entity])
- [Entity]의 [Property]가 변경되었다 ([Entity] [Property] Changed)
- [Entity]가 삭제되었다 ([Entity] Deleted)

### [Event Category 2] (예: Core Lifecycle)
- [Core Entity]가 생성되었다 ([Core Entity] Created)
- 빈 [Core Entity]가 생성되었다 (Empty [Core Entity] Created)
- [Core Entity] [Property]가 변경되었다 ([Core Entity] [Property] Changed)
- [Core Entity]가 [State]에 추가되었다 ([Core Entity] Added to [State])
- [Core Entity]가 [State]에서 제거되었다 ([Core Entity] Removed from [State])

### [Event Category 3] (예: Structure Management)
- [Child Entity]가 생성되었다 ([Child Entity] Created)
- [Child Entity] [Property]가 설정되었다 ([Child Entity] [Property] Set)
- [Child Entity] 부모가 변경되었다 ([Child Entity] Parent Changed)
- [Child Entity]가 다른 [Parent Entity]로 이동되었다 ([Child Entity] Moved to Different [Parent Entity])
- [Child Entity] 순서가 변경되었다 ([Child Entity] Order Changed)
- [Child Entity]가 복제되었다 ([Child Entity] Duplicated)

### [Event Category 4] (예: Deletion & Recovery)
- [Entity]가 [Soft Delete State]로 이동되었다 ([Entity] Moved to [Soft Delete State])
- [Entity]가 [Soft Delete State]에서 복구되었다 ([Entity] Restored from [Soft Delete State])
- [Entity]가 완전히 삭제되었다 ([Entity] Permanently Deleted)
- [Parent Entity]가 완전히 삭제되었다 ([Parent Entity] Permanently Deleted)
- [Delete Container]가 비워졌다 ([Delete Container] Emptied)

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음
1. **[Critical Issue 1]**
   - 문제: [구체적인 문제 상황]
   - 영향: [비즈니스나 시스템에 미치는 영향]
   - 해결: [제안된 해결책]

2. **[Critical Issue 2]**
   - 문제: [구체적인 문제 상황]
   - 영향: [비즈니스나 시스템에 미치는 영향]
   - 해결: [제안된 해결책]

### 우선순위: 중간
3. **[Medium Issue 1]**
   - 문제: [구체적인 문제 상황]
   - 영향: [비즈니스나 시스템에 미치는 영향]
   - 해결: [제안된 해결책]

4. **[Medium Issue 2]**
   - 문제: [구체적인 문제 상황]
   - 영향: [비즈니스나 시스템에 미치는 영향]
   - 해결: [제안된 해결책]

### 우선순위: 낮음
5. **[Low Issue 1]**
   - 문제: [구체적인 문제 상황]
   - 영향: [비즈니스나 시스템에 미치는 영향]
   - 해결: [제안된 해결책]

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)
1. **[Immediate Opportunity 1]**
   - 기회: [개선할 수 있는 영역]
   - 구현: [구체적인 구현 방안]

2. **[Immediate Opportunity 2]**
   - 기회: [개선할 수 있는 영역]
   - 구현: [구체적인 구현 방안]

### 향후 구현 (Post-MVP)
3. **[Future Opportunity 1]** *(메모)*
   - [장기적인 개선 방향 1]
   - [장기적인 개선 방향 2]

4. **[Future Opportunity 2]** *(메모)*
   - [장기적인 개선 방향 1]
   - [장기적인 개선 방향 2]

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. [Critical Process Area 1] 처리
- Q: [핵심 프로세스 관련 질문 1]?
- Q: [핵심 프로세스 관련 질문 2]?
- Q: [핵심 프로세스 관련 질문 3]?

### 2. [Critical Process Area 2] (핵심)
- Q: [가장 중요한 프로세스 관련 질문 1]?
- Q: [가장 중요한 프로세스 관련 질문 2]?
- Q: [가장 중요한 프로세스 관련 질문 3]?

### 3. [Critical Process Area 3] 및 성능
- Q: [성능 관련 질문 1]?
- Q: [성능 관련 질문 2]?
- Q: [성능 관련 질문 3]?

### 4. [Integration Area] 통합
- Q: [외부 시스템 통합 관련 질문 1]?
- Q: [외부 시스템 통합 관련 질문 2]?
- Q: [외부 시스템 통합 관련 질문 3]?

---

## 📝 Process Model 준비 상태

[Domain Name] Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 사용자 액션
2. **Policy** 정의: [External System] 동기화 규칙, [Core Process] 제약사항
3. **Read Model** 명시: [Core Functionality], 검색에 필요한 정보
4. **External System**: [External System] API 호출, Webhook 처리

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**일시**: [워크샵 진행 날짜 및 시간]
**참가자**: 
- **도메인 전문가**: [이름]
- **PM**: [이름]
- **기획자**: [이름] 
- **시니어 개발자**: [이름]
- **기타**: [추가 참가자]

**워크샵 결과물**:
- [ ] 도메인 이벤트 목록 완성
- [ ] 커맨드 및 액터 식별 완료
- [ ] Bounded Context 경계 정의 완료
- [ ] 핵심 Hotspot 및 Opportunity 정리 완료
- [ ] Process Modeling을 위한 질문 정리 완료

---

## 🔗 연관 도메인

### [Related Domain 1]와의 관계
- **연결점**: [구체적인 연결 지점]
- **이벤트 흐름**: [Domain Name] → [Related Domain 1]
- **통합 방식**: [이벤트 기반, API 호출 등]

### [Related Domain 2]와의 관계
- **연결점**: [구체적인 연결 지점] 
- **이벤트 흐름**: [Related Domain 2] → [Domain Name]
- **통합 방식**: [이벤트 기반, API 호출 등]

---

*이 Event Storming 문서는 [Domain Name] Domain의 Process Model 작성을 위한 기반 자료입니다.*
