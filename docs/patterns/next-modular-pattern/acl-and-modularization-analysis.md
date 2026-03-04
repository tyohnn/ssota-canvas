# 도메인 간 통신: ACL vs 직접 Service 호출 — 모듈화·Hexagonal 관점 분석

## 개요

- **Software Design(Inbox)** 에서는 도메인 간 통신을 **ACL(Anti-Corruption Layer)** 로 정의했다.
- **현재 코드베이스** 대부분은 다른 도메인의 **Service를 직접 import·호출**하고 있다.
- 이 문서는 **모듈화(빌드 단위·의존성 경계)** 와 **Hexagonal 아키텍처** 관점에서 “도메인을 호출할 때 ACL을 두는 게 왜 중요한지”를 정리한다.

**관련 문서**
- [Inbox Software Design](../event-domain-design/domains/inbox-management-domain/software-design.md) — ACL 설계
- [모듈 나누는 기준](./next-modular-pattern/module-splitting-criteria.md) — 모듈 = 빌드 단위
- [모듈 경계 강제 가이드](./module-boundary-enforcement-guide.md)

---

## 1. 현재 코드베이스: 어떻게 호출하는가

### 1.1 직접 Service 호출 (대부분)

다른 도메인의 **backend 서비스**를 직접 import해서 쓰는 패턴이 많다.

| 호출하는 쪽 | 호출받는 쪽 (직접 참조) |
|-------------|--------------------------|
| organization-management | `notification-management/backend/services/notification.service`, `workspace-management/backend/services/workspace-crud.service`, `organization-query.service` |
| workspace-management/actions | `notification-management/backend/services/notification.service`, `organization-management/backend/services/organization-query.service` |
| image-app-space/actions | `workspace-management/backend/services/workspace-membership.service` |
| youtube-app-space, audio-app-space | `source-management/backend/services/source-job`, `source-management/backend/services/source` |
| block-management (frontend) | `ai-management/backend/services/prompt/block-type-definitions` |
| user-management | `organization-management/backend/services/interfaces/common.types` |
| organization-management (context) | `workspace-management/backend/services/interfaces/workspace-crud.service.interface` |

→ **도메인 A가 도메인 B의 내부(backend/services, interfaces)에 직접 의존**하고 있다.

### 1.2 ACL이 있는 경우 (소수)

- **user-management**: `SupabaseAuthACL` — Supabase(서드파티) 응답을 도메인 `DomainUser`/`AuthResult`로 변환. **외부 시스템** 대응.
- **canvas-management/frontend**: `react-flow.acl` — React Flow 라이브러리 타입 ↔ 도메인 타입(BlockView, BaseNodeData) 변환. **라이브러리** 대응.
- **source-management**: `IQueueAdapter` — Queue 인프라 추상화. **인프라** 대응.

→ **다른 비즈니스 도메인(Block, Workspace, Notification 등)을 호출할 때 쓰는 ACL**은 거의 없고, **서드파티/라이브러리/인프라**에 대한 ACL만 있다.

### 1.3 Software Design(Inbox)이 말하는 ACL

Inbox 설계에서는 **다른 도메인/시스템**마다 ACL을 둔다고 했다.

- Block Management → Block 생성 요청/응답을 도메인 모델로 변환하는 ACL
- Workspace - Page System → 페이지 목록·권한 조회 API 응답을 도메인/Read Model로 변환하는 ACL
- Canvas - Block Mount, AI Recommendation, Storage 등 동일

즉, **“다른 도메인/시스템의 API·스키마를 내 도메인 언어로만 바라보게 하는 계층”** 이 ACL이다.

---

## 2. Hexagonal 관점: ACL이 중요한 이유

Hexagonal에서는 **포트(Port) = 인터페이스**, **어댑터(Adapter) = 외부와의 구현**이다.

- **내 도메인이 “다른 도메인 기능”을 쓸 때**:
  - **포트**: “Block을 만들어 달라”는 **내 도메인이 정의한 인터페이스** (예: `IBlockCreator.create(params): BlockId`).
  - **어댑터**: 그 인터페이스를 **Block Management 도메인의 실제 API(서비스 호출 등)** 로 구현하는 계층.

이 **어댑터가 곧 ACL**이다. Block Management의 DTO·에러·이름이 내 도메인 안으로 들어오지 않고, “BlockId 하나 반환” 같은 **내 쪽 계약**으로만 보이게 한다.

### 2.1 의존성 방향

- **직접 Service 호출**:  
  내 도메인(서비스/유스케이스) → **다른 도메인의 서비스·타입**에 직접 의존.  
  → 다른 도메인 패키지가 바뀌면(이름 변경, 분리, 스키마 변경) 내 코드가 깨질 수 있다.

- **ACL 사용**:  
  내 도메인 → **내가 정의한 포트(인터페이스)** 에만 의존.  
  ACL(어댑터) → 다른 도메인 서비스/API에 의존.  
  → 다른 도메인이 바뀌면 **ACL 구현만** 수정하면 되고, **도메인 코어/유스케이스는 그대로** 둘 수 있다.

Hexagonal에서 “도메인을 호출할 때 ACL을 둔다”는 건, **도메인 경계를 포트 하나로만 노출하고, 그 뒤의 “어떤 도메인/API를 부르는지”는 어댑터(ACL)에만 묶어두자는 뜻**이다. 그래서 **헥사고날 관점에서는 ACL 정의가 중요하다.**

---

## 3. 모듈화(빌드 단위) 관점: ACL이 중요한 이유

모듈 = 빌드 단위 = 패키지라고 보면, **의존성은 패키지 단위로만 선언**된다.

### 3.1 직접 Service 호출일 때

- 도메인 A 패키지가 도메인 B의 **backend/services** 를 쓰면,  
  **A → B 패키지에 대한 빌드 의존성**이 생긴다.
- B가 내부를 바꾸면(서비스 분리, 경로 변경, 타입 변경) A 빌드가 깨질 수 있다.
- 도메인이 많아지면 **A가 B, C, D… 여러 도메인에 직접 의존**하게 되고, 순환 의존·빌드 순서 문제가 생기기 쉽다.

### 3.2 ACL을 둘 때

- **A 쪽**에는 “Block 생성해 달라”는 **포트(인터페이스)** 만 두고,  
  그걸 구현하는 **ACL(어댑터)** 가 B의 서비스를 호출한다고 하자.
- **패키지 분리 시**:
  - **A의 “도메인/애플리케이션” 패키지**: B 패키지를 의존하지 않고, **자기 포트(인터페이스)만** 의존.
  - **ACL 구현**은 “A의 인프라” 패키지에 두거나, “A-B 연동” 전용 작은 패키지에 둘 수 있다. 그 패키지만 B에 의존.
- 그러면 **의존성 그래프가 단순**해진다:  
  A-core → A-port ← A-ACL → B.  
  A-core는 B를 몰라도 되고, **빌드 단위를 나눌 때 B에 대한 의존은 ACL이 있는 쪽으로만** 한정된다.

그래서 **모듈화(특히 빌드 단계에서 경계를 강제하려 할 때) 관점에서도, 도메인을 호출할 때 ACL을 두는 게 중요하다.**  
직접 서비스 호출은 “일단 편하지만, 패키지로 쪼개는 순간 의존성이 그대로 패키지 간으로 드러나고, 변경 영향이 커진다.”

---

## 4. 정리: 질문에 대한 답

### “모듈화의 관점에서, 특히 Hexagonal 아키텍처에서 도메인을 호출할 때 ACL을 정의하는 게 중요한가?”

**예, 중요하다.**

| 관점 | ACL이 없을 때 (직접 Service 호출) | ACL이 있을 때 |
|------|-----------------------------------|----------------|
| **Hexagonal** | 내 도메인이 다른 도메인의 서비스·타입에 직접 의존 → 포트/어댑터 분리가 깨짐 | 내 도메인은 “포트”만 의존하고, ACL이 다른 도메인과의 어댑터 역할 → 경계가 명확 |
| **모듈화(빌드 단위)** | A 패키지가 B, C, D… 패키지에 직접 의존 → 의존성 많아지고, B 변경 시 A까지 영향 | A-core는 B를 모름; ACL이 있는 레이어만 B에 의존 → 의존성 한 방향, 빌드/변경 영향 축소 |
| **Anti-Corruption** | 다른 도메인의 DTO·에러·이름이 내 도메인에 그대로 유입 | 경계에서 “내 언어”로만 변환 → 다른 도메인 진화에 덜 휘둘림 |

### 현재 상태와 설계의 차이

- **설계(Inbox Software Design)**: 도메인 간 통신을 ACL로 정의함. Hexagonal·모듈화 관점과 맞음.
- **현재 코드**: 대부분 다른 도메인 Service를 직접 호출함. 서드파티/라이브러리용 ACL만 일부 존재.
- **갭**: “다른 **도메인**을 호출할 때의 ACL”이 설계에는 있지만, 코드에는 거의 반영되지 않은 상태.

### 실무적으로

- **지금처럼 논리적 경계만** 둘 때는 직접 호출로도 동작하지만,  
  다른 도메인 타입·API 변경 시 호출하는 쪽이 같이 수정되기 쉽고,  
  나중에 **패키지로 쪼갤 때** 의존성이 그대로 패키지 간으로 넘어가서 빌드/배포가 무거워질 수 있다.
- **빌드 단위까지 강하게 나누려면**(모듈화 단계 4 이상),  
  도메인 간에는 **포트 + ACL**로 통신하도록 점진적으로 바꾸는 게, Hexagonal과 모듈화 둘 다에 맞다.

이 분석은 [Inbox Software Design](../event-domain-design/domains/inbox-management-domain/software-design.md)의 ACL 설계가 “왜 나왔는지”, 그리고 현재 코드가 “왜 그 설계와 다른지”를 모듈화·Hexagonal 관점에서 정리한 것이다.
