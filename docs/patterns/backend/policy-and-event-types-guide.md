# Policy와 이벤트 종류 가이드

이 문서는 백엔드에서 **Policy**와 **이벤트 종류(Domain Event vs Application Event)** 를 구분해 사용하기 위한 개념 정리와 구현 패턴을 설명합니다.

## 1. Policy (Event Storming)

Event Storming에서 **Policy**는 공식 빌딩 블록입니다.

- **정의**: "Whenever X happens, we do Y" — **이벤트 X가 발생하면 반응 Y를 수행한다**
- **역할**: Domain Event와 Command/Action 사이를 잇는 **반응(Reaction)**
- **표현**: Design Level Event Storming에서 lilac(연보라) 스티키로 표시

### 참고 자료

- [EventStorming Glossary & Cheat sheet – Policy](https://ddd-crew.github.io/eventstorming-glossary-cheat-sheet/)  
  - *"A policy is a reaction that says 'whenever X happens, we do Y'."*
- [Design Level Event Storming – Reaction and policy](https://katarzyna-starachowicz.github.io/design-level-event-storming)  
  - *"This happens whenever that happens. … the word that associates an event to a reaction to create a **policy**."*

### 구현에서의 Policy

- **Aggregate 기반 흐름**: Aggregate가 도메인 이벤트를 발행 → 서비스가 저장 후 `aggregate.getUncommittedEvents()`를 순회하며 `event.handle()` 호출 → `handle()` 내부에서 Policy 실행(로깅, 알림, 후속 작업 등).
- **부수 효과만**: Policy 실패는 Aggregate 상태에 영향을 주지 않으며, `Promise.allSettled`로 처리하는 것을 권장합니다. 자세한 내용은 [domain-event-driven-development-guide.md](./domain-event-driven-development-guide.md)의 Layer 7을 참고하세요.

---

## 2. 이벤트 종류 구분

### 2.1 Domain Event

- **정의**: 도메인 모델 안에서 **이미 일어난 사실**을 나타내는 이벤트.
- **발행 주체**: Aggregate(또는 Domain Service). 특정 Aggregate의 상태 변경 결과로 발생.
- **특징**:  
  - 과거형 표현 (예: `VideoCreated`, `BlockTitleUpdated`)  
  - 같은 Bounded Context 내에서 동기적으로 처리 가능  
  - 영속화된 Aggregate 상태와 1:1로 대응될 수 있음

### 2.2 Application Event (Use Case 수준 이벤트)

- **정의**: **특정 Use Case/User Story 완료 시점**에 의미가 있는 이벤트. 어떤 하나의 Aggregate 상태 변경에 직접 대응되지 않을 수 있음.
- **발행 주체**: Application Service / Use Case(액션 또는 서비스). Aggregate가 아닌 **애플리케이션 레이어**에서 발행.
- **특징**:  
  - "유스케이스가 끝났다", "메타데이터 조회가 완료되었다" 같은 **애플리케이션(비도메인) 동작**을 모델링  
  - DDD 원전의 공식 용어는 아니지만, 실무에서 "Application Event"로 불리는 패턴이 있음  
  - Observability, 후속 정책(ensure summary 등) 실행에 사용

### 2.3 Use Case Policy (Application Event에 대한 Policy)

- **의미**: **Application Event가 발생했을 때 실행하는 Policy**.
- **위치**: Aggregate가 이벤트를 내지 않는 경우, **Action 또는 전용 서비스**에서 "유스케이스 완료 → Policy 실행"을 수행.
- **예**:  
  - "YouTube 메타데이터 조회 성공" → Policy: `ensureVideoSummary`  
  - 이때 "메타데이터 조회 성공"은 Video/Block aggregate의 상태 변경이 아니라, **조회 Use Case의 결과**이므로 Application Event로 보고, 해당 Policy를 Use Case Policy로 처리.

### 참고 자료 (이벤트 구분)

- [Does application event term exist in DDD? (Stack Overflow)](https://stackoverflow.com/questions/62054009/does-application-event-term-exist-in-ddd)  
  - 도메인 정보는 도메인에 두어야 하며, Application service에서 발행하는 이벤트는 "application events"로 보는 논의.
- [How is ApplicationEvent different from DomainEvent? (Stack Overflow)](https://stackoverflow.com/questions/31249101/how-is-applicationevent-different-from-domainevent)  
  - Application Events는 특정 Use Case/User Story에 묶인 애플리케이션 동작, Domain Events는 도메인 모델 내 사실이라는 구분.

---

## 3. 구현 패턴 요약

| 구분 | Domain Event | Application Event |
|------|----------------|-------------------|
| **발행 위치** | Aggregate (상태 변경 후) | Action / Application Service (Use Case 완료 시) |
| **처리 위치** | 같은 서비스에서 `getUncommittedEvents()` → `event.handle()` | 전용 Publish 서비스 또는 Action에서 이벤트 생성 후 `event.handle()` |
| **Policy** | Event의 `handle()` 안에서 실행 (부수 효과) | Event의 `handle()` 안에서 실행 (runner/Policy 주입) |
| **인터페이스** | `DomainEvent` | `ApplicationEvent` (같은 `handle()` 시그니처 등으로 구분 가능) |

### Domain Event 흐름 (예: createVideo)

1. Service가 Aggregate에 Command 전달.
2. Aggregate가 상태 변경 후 Domain Event를 `_uncommittedEvents`에 추가.
3. Service가 Repository로 저장.
4. Service가 `aggregate.getUncommittedEvents().map(e => e.handle())` 호출 → Policy 실행.
5. `aggregate.markEventsAsCommitted()`.

### Application Event 흐름 (예: YouTube 메타데이터 조회 성공)

1. Action(Use Case)이 메타데이터 조회 로직 수행 (getVideo 또는 createVideo 등).
2. **어떤 Aggregate도 "메타데이터 조회됨" 이벤트를 내지 않음** (기존 Video 조회만 할 수도 있음).
3. Action 또는 전용 서비스에서 **Application Event** 인스턴스 생성 (Payload: blockId, orgId, youtubeId, language 등).
4. 해당 이벤트에 **Policy(runner)** 를 주입 (예: `ensureVideoSummaryService`).
5. **서비스**에서 `event.handle()` 호출 → Policy 실행.
6. Action은 이미 Use Case 결과를 반환했으므로, Policy 실패는 응답에 영향을 주지 않도록 `Promise.allSettled` 등으로 처리.

---

## 4. 프로젝트 내 적용 예시

- **Domain Event**: `VideoCreatedEvent`, `BlockTitleUpdatedEvent` — 각각 Video/Block Aggregate에서 발행, 해당 서비스에서 `getUncommittedEvents()` 후 `handle()` 호출.
- **Application Event**: `YoutubeMetadataFetchedEvent` — `getYoutubeMetadata` Use Case 완료 시 `publishYoutubeMetadataFetched` 서비스에서 발행하고, `handle()` 안에서 Policy(ensure video summary) 실행.  
  - 구현 위치: `youtube-app-space/shared/events/youtube-metadata.events.ts`, `youtube-app-space/backend/services/youtube-metadata-fetched/publish-youtube-metadata-fetched.service.ts`  
  - 상세 패턴은 [domain-event-driven-development-guide.md](./domain-event-driven-development-guide.md)와 위 표를 함께 참고.

---

## 5. 정리

- **Policy**: Event Storming의 공식 개념. "Whenever X then Y" 형태로 이벤트와 반응을 연결.
- **Domain Event**: Aggregate에서 발행, 서비스가 저장 후 `event.handle()`로 Policy 실행.
- **Application Event / Use Case Policy**: Aggregate에 속하지 않는 Use Case 완료 시, Action 또는 전용 서비스에서 이벤트를 만들고 같은 `handle()` 패턴으로 Policy를 실행.  
이를 명시적으로 구분해 두면, "어디서 이벤트를 낼지", "Policy를 어디서 실행할지"를 일관되게 결정할 수 있습니다.
