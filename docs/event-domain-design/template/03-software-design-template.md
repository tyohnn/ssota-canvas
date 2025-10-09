# [Domain Name] - Software Design

Event Storming과 Process Model을 기반으로 한 DDD 설계 문서입니다.

---

## 🎯 Software Design Overview

Process Model에서 식별된 System을 Aggregate로 전환하고, [Domain Name]의 Bounded Context를 정의합니다.

### 🟪 External System 처리
- **[External System]**: [External System으로 유지/전환 이유]
- **[Anti-Corruption Layer]**: [도메인과 외부 시스템 간의 변환 계층 구현]

---

## 🟨 Aggregate 식별

### Process Model에서 발견된 Systems → Aggregates

| Process Model (System) | Software Design (Aggregate) | 책임 |
|----------------------|---------------------------|------|
| [System 1] | **[Aggregate 1]** | [담당 비즈니스 책임] |
| [System 2] | **[Aggregate 2]** | [담당 비즈니스 책임] |
| [System 3] | **[Aggregate 3]** | [담당 비즈니스 책임] |

---

## 📦 Aggregate 상세 정의

### 1. [Aggregate Name 1] Aggregate

**핵심 개념**: "[구체적 개념 설명]"

#### Commands (받는 명령)
- [Command 1]
- [Command 2]
- [Command 3]

#### Events (발생 이벤트)
- [Event 1]
- [Event 2]
- [Event 3]

#### 핵심 불변식 (Invariants)
- [불변식 1]
- [불변식 2]
- [불변식 3]

#### 속성 (Properties)
```typescript
{
  [property1]: [Type1],    // [설명]
  [property2]: [Type2],    // [설명]
  [property3]: [Type3]     // [설명]
}
```

---

### 2. [Aggregate Name 2] Aggregate

**핵심 개념**: "[구체적 개념 설명]"

#### Commands
- [Command 1]
- [Command 2]

#### Events
- [Event 1]
- [Event 2]

#### 핵심 불변식
- [불변식 1]
- [불변식 2]

#### 속성
```typescript
{
  [property1]: [Type1],    // [설명]
  [property2]: [Type2]     // [설명]
}
```

---

## 🔲 Bounded Context 정의

### [Domain Name] Context

**언어적 특징**:
- "[핵심 용어 1]" = [의미 설명]
- "[핵심 용어 2]" = [의미 설명]
- "[핵심 용어 3]" = [의미 설명]

**핵심 책임**:
- [책임 1]
- [책임 2]
- [책임 3]

**포함된 Aggregates**:
- [Aggregate 1] ([역할])
- [Aggregate 2] ([역할])
- [Aggregate 3] ([역할])

**External System Integration**:
- **[External System]**: [통합 방식 설명]
  - [구체적 통합 방법 1]
  - [구체적 통합 방법 2]

---

## 🔀 다른 Context와의 경계

### [Other Context 1]와의 경계

**언어적 차이**:
| [Domain Name] Context | [Other Context 1] |
|---------------------|-------------------|
| "[용어 1]" | "[해당 용어]" |
| "[용어 2]" | "[해당 용어]" |

**통합 이벤트**:
- `[이벤트 1]` → `[해당 Context 액션]`
- `[이벤트 2]` → `[해당 Context 액션]`

### [Other Context 2]와의 경계

**언어적 차이**:
| [Domain Name] Context | [Other Context 2] |
|---------------------|-------------------|
| "[용어 1]" | "[해당 용어]" |
| "[용어 2]" | "[해당 용어]" |

**통합 이벤트**:
- `[이벤트 1]` → `[해당 Context 액션]`
- `[이벤트 2]` → `[해당 Context 액션]`

---

## 🏗️ Context Map

```
┌─────────────────────────────────────────────────────────┐
│              [Domain Name] Context                      │
│                                                         │
│  ┌─────────────┐ ┌───────────┐ ┌──────────────┐       │
│  │[Aggregate 1]│ │[Aggregate 2]│ │[Aggregate 3]│       │
│  │             │ │           │ │              │       │
│  └─────┬───────┘ └─────┬─────┘ └──────┬───────┘       │
│        │               │              │                │
│        └───────────────┼──────────────┘                │
│                        │                               │
│                        ▼                               │
│                 Domain Service                         │
│             ([Domain Name]Coordinator)                 │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Events
                         ▼
     ┌──────────────────────────────────────┐
     │        Integration Events             │
     ├──────────────────────────────────────┤
     │ • [이벤트 1]                          │
     │ • [이벤트 2]                          │
     │ • [이벤트 3]                          │
     └──────────────────────────────────────┘
                    │         │
        ┌───────────┘         └───────────┐
        ▼                                 ▼
┌─────────────────┐             ┌──────────────────┐
│ [Context 1]     │             │ [Context 2]      │
│ Context         │             │ Context          │
└─────────────────┘             └──────────────────┘
                    │
                    ▼
            ┌──────────────────┐
            │ [Context 3]      │
            │ Context          │
            └──────────────────┘
```

---

## 💡 핵심 설계 결정

### 1. [중요한 설계 결정 1]
- **문제**: [해결해야 할 문제]
- **해결**: [선택한 해결책]
- **대안**: [고려한 다른 방법들]
- **결정 이유**: [왜 이 방법을 선택했는지]

### 2. [중요한 설계 결정 2]
- **문제**: [해결해야 할 문제]
- **해결**: [선택한 해결책]
- **대안**: [고려한 다른 방법들]
- **결정 이유**: [왜 이 방법을 선택했는지]

---

## 📖 Read Models (Query Side)

### [Read Model Name 1]
**목적**: [이 Read Model이 제공하는 정보와 사용 목적]

```typescript
interface [ReadModelName1] {
  [field1]: [Type1];    // [설명]
  [field2]: [Type2];    // [설명]
  [field3]: [Type3];    // [설명]
}
```

**Query Handler 책임**:
- [쿼리 기능 1]
- [쿼리 기능 2]
- [쿼리 기능 3]

### [Read Model Name 2]
**목적**: [이 Read Model이 제공하는 정보와 사용 목적]

```typescript
interface [ReadModelName2] {
  [field1]: [Type1];    // [설명]
  [field2]: [Type2];    // [설명]
}
```

**최적화 포인트**:
- [성능 최적화 방법 1]
- [성능 최적화 방법 2]
- [캐싱 전략]

---

## 🤝 Service 레이어의 역할

Service 레이어는 여러 Aggregate와 외부 시스템을 한 자리에서 조율하는 **업무 진행 책임자**입니다. 팀이 이해하기 쉬운 언어로 아래 역할을 명확히 적어 주세요.

- **업무 시나리오 연결**: 서로 다른 Aggregate가 함께 움직여야 하는 상황(예: 워크스페이스 생성과 권한 부여)을 순서대로 정리합니다.
- **규칙 준수 확인**: 비즈니스 정책(요금제 한도, 승인 절차 등)이 누락되지 않도록 확인 지점을 서술합니다.
- **외부 파트너 연동**: Clerk, 결제 시스템처럼 외부와 협력해야 하는 순간과 기대 결과를 설명합니다.
- **실패 대응 전략**: 문제가 생겼을 때 사용자에게 어떤 안내를 제공하고, 시스템은 어떻게 복구하는지 정리합니다.
- **즐거운 사용자 경험**: 빠른 응답, 낙관적 업데이트 등 사용자에게 체감되는 가치를 적어 줍니다.

> 예시 문장: “워크스페이스 생성 요청이 들어오면, 서비스 레이어는 조직 권한을 확인하고, 필요한 경우 Clerk와 사용자 정보를 동기화한 뒤 페이지 뼈대를 자동으로 만들어 줍니다.”

---

## 🛡️ Anti-Corruption Layer Design

### [External System] 통합

#### [Adapter Name] Interface
[외부 시스템]과의 통합을 추상화하는 인터페이스:

```typescript
interface [AdapterName] {
  [method1]([param1]: [Type1]): Promise<[ReturnType1]>
  [method2]([param2]: [Type2]): Promise<[ReturnType2]>
}
```

#### Translation Layer
[외부 시스템] 데이터와 도메인 모델 간 변환:

```typescript
interface [External]ToDomainTranslator {
  translate[External]Data([external]Data: [ExternalType]): [DomainType]
}

interface DomainTo[External]Translator {
  translateDomain[Entity]([entity]: [DomainType]): [ExternalType]
}
```

#### Benefits
1. **도메인 순수성**: [외부 시스템] API가 도메인에 침투하지 않음
2. **테스트 용이성**: Mock Adapter로 단위 테스트 가능
3. **교체 가능성**: [외부 시스템] → 다른 시스템 전환 용이
4. **장애 격리**: [외부 시스템] 장애 시 도메인 로직 보호

---

## ✅ 검증 체크리스트

- [ ] 각 Aggregate가 명확한 경계와 책임을 가지는가?
- [ ] Process Model의 모든 System이 Aggregate로 적절히 매핑되었는가?
- [ ] External System 처리가 적절한가? (유지 vs 전환)
- [ ] Context 간 통합이 느슨하게 결합되어 있는가?
- [ ] 핵심 불변식이 올바르게 정의되었는가?
- [ ] Cross-Domain 이벤트가 적절히 설계되었는가?

---

## 📊 성과 측정 지표

1. **[지표 1]**: [측정 방법과 목표]
2. **[지표 2]**: [측정 방법과 목표]
3. **[지표 3]**: [측정 방법과 목표]

---

## 📚 References

### 관련 문서
- [Event Storming 문서 링크]
- [Process Model 문서 링크]
- [Database Schema 문서 링크]
- [Technical Specification 문서 링크]
- [API Specification 문서 링크]

---

이 Software Design 문서는 [Domain Name]의 구현을 위한 완전한 설계 지침입니다.
