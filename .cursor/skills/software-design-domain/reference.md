# Software Design Domain — Reference

Use this when filling `03-software-design.md` or validating design. Full guide: `docs/event-domain-design/guide/03-software-design-guide.md`.

---

## System 분류 (Phase 1)

| 유형 | 설명 |
|------|------|
| 내부 System | 우리가 구현하는 시스템 |
| 외부 도메인 System | 다른 도메인의 시스템 |
| External System | 서드파티 (Clerk, Supabase 등) — ACL 필요 |
| Frontend System | 프론트엔드 처리 |

---

## Aggregate 정의 패턴

```markdown
### [Aggregate Name] Aggregate

**Root Entity**: [Entity Name] (식별자: [ID Type])

**Commands** (Process Model 매핑):
- [Command 1]: [설명]
- [Command 2]: [설명]

**Events** (Process Model 매핑):
- [Event 1]: [발생 조건]
- [Event 2]: [발생 조건]

**Invariants** (반드시 지켜야 할 비즈니스 규칙):
- [불변식 1]: [설명]
- [불변식 2]: [설명]

**포함 엔티티**:
- [Entity 1]: [관계 설명]
- [Entity 2]: [관계 설명]
```

**Invariant 도출**: Process Model의 Policy 문장을 "~해야 한다", "~만 존재해야 한다" 형태의 불변식으로 변환.

---

## Bounded Context 식별 기준

- 동일한 유비쿼터스 언어
- 강한 응집성, 약한 결합성
- 하나의 명확한 비즈니스 책임

---

## ACL 문서화 템플릿

```markdown
### [External System Name] ACL
- **목적**: [외부 모델 → 도메인 모델 변환 설명]
- **위치**: `[소스 경로]`
- **변환 규칙**:
  - [외부 필드] → [도메인 타입/필드]
- **에러 처리**: [재시도/도메인 에러 변환 등]
```

**ACL 필요 시**: 외부 모델 ≠ 도메인 모델, 외부 변경으로부터 도메인 보호, 복잡성 격리.

---

## ACL과 모듈화·Hexagonal (참조)

Software Design에서 ACL을 정의할 때, "왜 도메인 간 통신에도 ACL이 필요한가"에 대한 근거로 아래 문서를 참조한다.

**원문**: `docs/patterns/next-modular-pattern/acl-and-modularization-analysis.md`

### ACL의 의미 (Software Design 관점)

- **다른 도메인/시스템의 API·스키마를 내 도메인 언어로만 바라보게 하는 계층**
- 서드파티/라이브러리뿐 아니라 **다른 비즈니스 도메인(Block, Workspace, Source 등)을 호출할 때도** ACL을 둔다.

### Hexagonal 관점: 포트와 어댑터

- **포트(Port)**: 내 도메인이 정의한 인터페이스 (예: `IBlockCreator.create(params): BlockId`)
- **어댑터(Adapter)**: 그 인터페이스를 다른 도메인의 실제 API로 구현 — 이 어댑터가 곧 **ACL**
- 다른 도메인의 DTO·에러·타입이 내 도메인 안으로 들어오지 않고, **내 쪽 계약**으로만 보이게 한다.
- **의존성 방향**: 내 도메인 → 포트에만 의존 / ACL(어댑터) → 다른 도메인 API에 의존. 다른 도메인이 바뀌면 ACL만 수정, 도메인 코어는 그대로.

### 모듈화(빌드 단위) 관점

- **직접 Service 호출**: A 패키지가 B 패키지에 직접 의존 → B 변경 시 A 빌드 영향, 순환 의존·빌드 순서 문제.
- **ACL 사용**: A-core → A-port ← A-ACL → B. A-core는 B를 모름; B에 대한 의존은 ACL 레이어로 한정. 의존성 그래프 단순화.

### 비교 요약

| 관점 | ACL 없을 때 (직접 호출) | ACL 있을 때 |
|------|--------------------------|--------------|
| Hexagonal | 도메인이 다른 도메인 서비스·타입에 직접 의존 → 포트/어댑터 분리 깨짐 | 도메인은 포트만 의존, ACL이 어댑터 역할 → 경계 명확 |
| 모듈화 | A가 B, C, D…에 직접 의존 → B 변경 시 A까지 영향 | A-core는 B를 모름; ACL만 B에 의존 → 의존성 한 방향, 변경 영향 축소 |
| Anti-Corruption | 다른 도메인의 DTO·에러가 내 도메인에 유입 | 경계에서 "내 언어"로 변환 → 다른 도메인 진화에 덜 휘둘림 |

### 실무 참고

- 논리적 경계만 둘 때는 직접 호출로도 동작하지만, 패키지로 쪼갤 때 의존성이 그대로 패키지 간으로 드러난다.
- **빌드 단위까지 강하게 나누려면**(모듈화 단계 4 이상) 도메인 간 **포트 + ACL**로 통신하는 설계가 Hexagonal·모듈화 둘 다에 맞다.

---

## Context Map 관계 패턴

- **Shared Kernel**: 공유 모델 (신중)
- **Customer-Supplier**: 공급자–소비자
- **Conformist**: 상위 Context 모델 따름
- **ACL**: 하위 Context가 보호 레이어 구축
- **Published Language**: 공개 표준 인터페이스
- **Open Host Service**: 다수 클라이언트용 공개 서비스

**Context Map 검증**: 순환 의존 없음, SSOT 명확, External은 ACL, 에러 처리 정의.

---

## Read Model 정의 패턴

```typescript
interface [ViewName]View {
  [id]: [IdType];
  [field1]: [Type];
  [field2]: [Type];
}
```

문서화: 목적, 데이터 구조, 최적화(캐시 TTL, 무효화), 조회 빈도.

---

## 품질 검증 체크리스트

### 일관성
- [ ] Process Model의 모든 System이 Aggregate(또는 Service)로 매핑됨
- [ ] Event Storm Context 경계와 Bounded Context 일치
- [ ] Process Model External System이 모두 ACL로 보호됨
- [ ] Read Model이 사용자 시나리오 커버

### 완전성
- [ ] 모든 Bounded Context 정의됨
- [ ] 각 Aggregate의 Invariant 명확
- [ ] Context 간 통합 방식 명확
- [ ] ACL 변환 규칙 구체적

### 실용성
- [ ] Technical Specification 작성에 충분한 정보
- [ ] 구현팀이 이해 가능한 구체성
- [ ] 순환 의존 없음

---

## Process Model ↔ Software Design 일관성

- [ ] 모든 System → Aggregate 또는 Service
- [ ] Policy → Invariant
- [ ] External System → ACL
- [ ] 도메인 언어 일관 사용
