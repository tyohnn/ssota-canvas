# 코드베이스 모듈(경계) 나누는 기준

## 개요

이 문서는 SSOTA 코드베이스에서 **모듈을 어떤 기준으로 나누는지**를 정리한다.  
여기서 **모듈**은 **빌드 단위**로 정의하며, 나누는 기준은 "어떤 단위로 모듈(빌드 단위)을 둘지"를 위한 것이다.

**관련 문서**
- [모듈 경계 강제 가이드](../module-boundary-enforcement-guide.md) — 논리적 vs 물리적 경계
- [모듈화 단계 평가](./modularity-phase-assessment.md) — 현재 단계와 로드맵
- [Server-Side DDD Conventions](../backend/server-side-ddd-conventions.md) — 도메인 레이어·Actions 폴더 구조

---

## 1. "모듈"의 정의: 빌드 단위

**모듈 = 빌드되는 단위**로 정의한다.

- **npm/TypeScript 스택에서**: 빌드 단위 = **패키지**(`package.json`이 있는 디렉터리). Turborepo가 빌드하는 것도 패키지 단위다.  
  → 따라서 **모듈 1개 = 패키지 1개**.
- **Gradle(예: flex)**: 빌드 단위 = 서브프로젝트 하나. 그걸 "모듈"이라고 부른다.  
  → 253개 모듈 = 253개 빌드 단위.

참고: JavaScript/TypeScript 언어 차원의 "ES module"(import/export 쓰는 파일 하나)은 여기서 말하는 모듈이 아니다. 이 문서의 모듈은 **빌드·의존성 경계 단위**만 가리킨다.

### 현재 SSOTA

- **빌드 단위는 하나**: Next.js 앱(`apps/web`) 전체가 한 번에 빌드된다.  
  → **모듈이 사실상 1개**인 상태.
- 그래서 "나누는 기준"은 **지금은 폴더로 경계만 짓고, 나중에 패키지로 쪼갤 때 하나의 패키지 = 하나의 모듈(빌드 단위)**이 되도록 같은 기준을 쓰자는 뜻이다.  
  즉, "모듈로 나눈다" = "빌드 단위(패키지)로 나눈다"이고, 그 단위를 정하는 게 아래 2·3·4장이다.

### 방향: 장차 flex 스타일(C)로 간다

**나누는 기준**은 "경계를 **어디에** 둘지"(도메인 → 레이어 → 서브폴더)를 정하는 것이다.  
우리의 **목표**는 **flex 스타일(C)** 이다. 즉, 도메인×레이어를 패키지로 나누고, backend는 application / infra 등으로 더 세분화해 **컴파일 타임에 의존성·순환을 강제**하는 쪽으로 가는 것이다.

아래 표에서 **C가 목표**이고, A·B는 과도기나 리소스에 따라 거치는 단계로 본다.

| 단계 | 단위 | 예시 (도메인 20개 가정) | 비고 |
|------|------|-------------------------|------|
| **A. 도메인당 1패키지** | 한 도메인 = shared+backend+actions+frontend 전부 한 패키지 | 모듈 수 ≈ 20 | 과도기·소규모에서 가능 |
| **B. 도메인×레이어당 1패키지** | shared / backend / actions / frontend 각각 패키지 | 모듈 수 ≈ 80 | C로 가기 위한 중간 단계 |
| **C. flex 스타일 (목표)** | backend를 application / infra-db 등으로 또 나눔. 도메인×레이어 세분화. | 모듈 수 100~250+ | **우리가 가야 할 방향** |

- **지금 당장** C처럼 전부 패키지로 쪼갤 필요는 없다. 폴더 기준만 정해 두고, ESLint·패키지 분리를 단계적으로 도입해 나가면 된다.
- **서비스 안의 폴더**(`services/edge/`, `services/block-mount/` 등)는 당분간 같은 backend 안의 서브폴더로 두고, C로 갈 때 application / infra 등 **모듈(패키지) 단위**로 나누는 후보가 된다.

이 문서의 2·3·4차 기준은 **C(flex 스타일)를 염두에 두고** 경계를 정해 둔 것이다. 나중에 패키지로 쪼갤 때 그 단위를 그대로 모듈(빌드 단위)로 두면 된다.

---

## 2. 1차 기준: 도메인으로 나누기

**한 도메인 = 한 비즈니스 경계( Bounded Context 느낌).**

- 경로: `apps/web/src/domains/[domain]/`
- 예: `block-management`, `canvas-management`, `workspace-management`, `user-management`, `ai-management`, `source-management`, `event-management`, `common` …

**규칙**
- 다른 도메인을 쓸 때는 **반드시** `@/domains/[domain]/...` 절대 경로로 import.
- 같은 도메인 안에서는 상대 경로 허용.
- 도메인 A가 도메인 B의 **내부 구현**을 직접 참조하지 않는다. 필요한 것은 B가 공개한 **shared**(타입, DTO, 이벤트 등)나 **actions** 진입점으로만.

현재 도메인 수: 20여 개 수준 (`block-management`, `canvas-management`, `workspace-management`, `user-management`, `ai-management`, `source-management`, `event-management`, `common`, `auth`, `share`, `notification-management`, `organization-management`, `tutorial-management`, `youtube-app-space`, `image-app-space`, `link-app-space`, `pdf-app-space`, `audio-app-space`, `canvasdown`, `app-system`, `ai-actions`, `landing`, `queue`, `realtime-management`, `storage`, `subscription` 등).

---

## 3. 2차 기준: 도메인 내부를 레이어(폴더)로 나누기

한 도메인 안에서는 **역할(레이어)** 로 나눈다.  
한 레이어는 **장차 flex 스타일(C)로 갈 때** 모듈(패키지) 하나로 분리하는 **단위**다. 지금은 폴더로만 구분해 두고, 패키지 분리 시 이 단위를 그대로 모듈로 둔다.

### 3.1 공통 구조 (도메인 하나당)

```
domains/[domain]/
├── shared/          # Domain Core (엔티티, VO, 이벤트, DTO, 타입, 순수 유틸)
├── backend/         # Application + Infra (서비스, Repository 인터페이스/구현체)
├── actions/         # Trust Boundary / Inbound Adapter (Server Actions)
└── frontend/        # UI (컴포넌트, 훅, 컨텍스트)
```

| 폴더 | 역할 | 의존 가능한 것 (같은 도메인 내) | 비고 |
|------|------|--------------------------------|------|
| **shared** | 도메인 핵심. 프레임워크/DB/외부 라이브러리 없음. | 없음 (또는 다른 도메인 shared만 타입/이벤트 수준) | Hexagonal의 Core |
| **backend** | 유스케이스(서비스) + 포트(인터페이스) + 어댑터(구현체). | shared | Repository는 인터페이스만 shared 쪽에 두거나 backend/interfaces에 둠 |
| **actions** | Server Action 진입점. 검증·인증 후 Service 호출. | shared, backend | Trust Boundary |
| **frontend** | React 컴포넌트, 훅, 컨텍스트. | shared, backend(선택), actions(호출) | 다른 도메인 frontend는 필요한 만큼만 |

### 3.2 backend 안에서 더 나누는 기준

backend는 당분간 **한 덩어리**로 두되, 안에서 **폴더로 역할**을 구분한다.  
**목표(flex 스타일)** 는 application / infra-db 등으로 **모듈(패키지)을 나누는 것**이므로, 폴더 구조는 그에 맞춰 둔다.

- `backend/services/` — 유스케이스(서비스 함수). SafeDTO → Command → Aggregate 호출.
- `backend/services/interfaces/` — 서비스 인터페이스(필요 시).
- `backend/repositories/interfaces/` — Repository **포트**(인터페이스).
- `backend/repositories/implementations/` — Repository **어댑터**(Drizzle 등 구현체).

`services/edge/`, `services/block-mount/` 같은 **서브폴더는 같은 backend 모듈(패키지) 안**에만 둔다. 서브폴더마다 별도 패키지로 나누는 건 아니다.

**의존 방향**
- `implementations` → `interfaces`, `shared`
- `services` → `interfaces`, `shared` (구현체는 주입받으므로 서비스 코드가 직접 implementations를 import하지 않도록).

즉, **한 도메인 안에서는**  
`shared` ← `backend` ← `actions` / `frontend`  
순서만 지키면 된다.

---

## 4. 3차 기준: 기능/서브도메인별로 폴더 나누기 (선택)

한 레이어가 커지면 **기능·애그리거트·진입점 종류**별로 **서브폴더**만 나눈다.  
당분간은 같은 레이어 안에서의 정리이고, **flex 스타일(C)로 갈 때**는 이 서브폴더가 더 세분화된 모듈(패키지)의 후보가 될 수 있다.

### 4.1 actions

- `actions/edge/`, `actions/block-mount/`, `actions/canvas/` 처럼 **진입점(액션) 단위**로 서브폴더.
- 각 서브폴더에 `secure-action.ts`(도메인 전용 wrapper) + `*.action.ts` 배치.

### 4.2 backend/services

- `services/edge/`, `services/block-mount/`, `services/group-node/` 처럼 **유스케이스/애그리거트 단위**로 서브폴더.

### 4.3 shared

- `shared/aggregates/`, `shared/entities/`, `shared/value-objects/`, `shared/events/`, `shared/dtos/`, `shared/commands/` 등 **이미 역할별 폴더**.
- 이벤트가 많으면 `shared/events/edge/`, `shared/events/block-mount/` 처럼 서브폴더 가능.

### 4.4 frontend

- `frontend/components/`, `frontend/hooks/`, `frontend/contexts/` 유지.
- 컴포넌트가 크면 `components/react-flow-wrapper/`, `components/block/` 처럼 **기능/피처** 단위 서브폴더.

---

## 5. 의존성 방향 요약

- **도메인 간**
  - A → B 허용: B의 **shared**(타입, 이벤트, 공개 DTO) 또는 B의 **actions** 호출.
  - A → B 금지: B의 **backend 내부**(서비스/리포 구현체) 직접 호출, B의 **frontend** 내부 직접 참조(필요 시 B가 공개한 훅/컴포넌트만).

- **도메인 내**
  - `shared` → 아무 레이어도 의존하지 않음(다른 도메인 shared는 타입/이벤트만).
  - `backend` → `shared`만 (다른 도메인은 그 도메인 shared 또는 backend 인터페이스만, 가능하면 피함).
  - `actions` → `shared`, `backend`.
  - `frontend` → `shared`, `backend`(필요 시), `actions`(호출). 다른 도메인은 `@/domains/...` 로 필요한 최소만.

---

## 6. flex 24도메인 / 253모듈과의 대응

flex는 **모듈 = 빌드 단위**(Gradle 서브프로젝트)로 두고, 도메인당 **여러 모듈**(코어, 애플리케이션, 인프라 어댑터별)을 둔다.

우리 쪽 폴더와 매핑하면:

| flex (모듈 = 빌드 단위) | SSOTA (폴더, 나중에 모듈로 둘 후보) |
|------------------------|--------------------------------------|
| domain-xxx (코어) | `domains/[domain]/shared/` |
| application-xxx | `domains/[domain]/backend/services/` (+ repositories/interfaces) |
| infra-xxx-db | `domains/[domain]/backend/repositories/implementations/` |
| infra-xxx-http / adapter | `domains/[domain]/actions/` (Server Action 진입점) |
| (read-model 등) | 필요 시 `shared/` 또는 별도 서브폴더 |

**지금은** 우리 빌드 단위가 앱 하나뿐이므로, 도메인당 **4개 레이어**(shared, backend, actions, frontend)는 “나중에 모듈(패키지)로 쪼갤 때의 단위”로만 쓰고 있다.  
**패키지로 분리할 때**는 이 단위를 그대로 `packages/domain-xxx-shared`, `packages/domain-xxx-backend` 식으로 두면, **모듈 1개 = 패키지 1개 = 빌드 단위 1개**가 된다.

---

## 7. 정리

- **모듈 = 빌드 단위**. 우리 스택에서는 패키지(`package.json` 하나) = 모듈 하나.
- **나누는 기준**은 “그 빌드 단위(모듈)를 어떤 단위로 둘지”의 기준이며, **방향은 flex 스타일(C)** 이다.

| 기준 | 내용 |
|------|------|
| **1차** | **도메인**으로 나눔. `domains/[domain]/`. |
| **2차** | 도메인 내부를 **레이어**로: `shared`, `backend`, `actions`, `frontend`. (레이어 = 장차 모듈 하나. backend는 application/infra 등으로 더 세분화 목표.) |
| **3차** | 레이어가 크면 **기능/서브도메인별 서브폴더**: `actions/edge/`, `services/block-mount/` 등. (flex로 갈 때 세분화된 모듈 후보.) |
| **의존성** | shared ← backend ← actions, frontend. 도메인 간에는 shared·actions만 넘나들기. |

지금은 빌드 단위가 앱 하나이므로 **폴더 규칙**으로만 경계를 지키고, **나중에 패키지로 쪼갤 때** 위 기준대로 **모듈(패키지) 단위**를 두어 **flex 스타일**에 맞춰 간다.
