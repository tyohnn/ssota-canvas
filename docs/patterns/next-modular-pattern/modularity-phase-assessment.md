# 모듈화 단계 평가: 현 단계와 빌드 하네스까지의 로드맵

## 개요

이 문서는 **「테스트 통과를 넘어, 컴파일러가 보장하는 모듈화」** (flex 세미나)와 메모([memo.md](./memo.md))를 바탕으로, 다음을 정리한다.  
**모듈**은 여기서 **빌드 단위**로 정의한다(우리 스택에서는 패키지 하나 = 모듈 하나). [나누는 기준](./module-splitting-criteria.md)은 같은 정의를 쓴다.

1. **단계 정의**: 아무것도 안 되어 있는 상태를 0단계로 두고, 빌드 단계에서의 하네스(컴파일러가 경계를 보장하는 구조)까지 몇 단계로 나아가는지
2. **현재 프로덕트(SSOTA)의 패턴과 위치**: 지금 우리가 어떤 단계에 있는지
3. **다음 단계로 가기 위한 구체적 액션**

관련 문서: [모듈 경계 강제 가이드](../module-boundary-enforcement-guide.md), [memo.md](./memo.md).

---

## 단계 정의 (0단계 = 아무것도 안 된 상태)

궁극 목표는 **빌드 타임에 모듈 경계가 강제되는 하네스**다.  
즉, 잘못된 의존성·순환 참조가 들어가면 **컴파일/빌드가 실패**하도록 만드는 것이다.

아래 단계는 **0단계를 “전혀 모듈화가 없는 프로젝트”**로 두고, 1단계부터 점진적으로 “물리적 경계”에 가깝게 만드는 순서로 정의했다.

| 단계 | 이름 | 설명 | 경계 위반 시 |
|------|------|------|----------------|
| **0** | 없음 | 단일 앱, 레이어/도메인 구분 없음, 모노레포 아님. 모든 코드가 한 덩어리. | — |
| **1** | 모노레포 + 앱/패키지 분리만 | `apps/`, `packages/` 구조. 공용 코드만 패키지로 분리(예: ui, config). 앱 내부는 플랫 또는 자유 구조. | 앱 내부는 여전히 제한 없음 |
| **2** | 앱 내 논리적 경계(도메인 폴더) | 앱 내부에 `domains/` 또는 레이어 폴더 구조. path alias(`@/domains/*`). Hexagonal/DDD **컨벤션**으로 의존성 방향 약속. | **컴파일 성공**. 리뷰/문서로만 검증 |
| **3** | 린트/CI로 경계 강화 | 2 + ESLint(`no-restricted-imports` / `boundaries` 등)로 도메인·레이어 간 import 방향 제한. CI에서 위반 시 실패. | **CI 실패** (컴파일은 성공) |
| **4** | 도메인/레이어를 모듈(패키지)로 분리 | `packages/domain-*` 등. 패키지 하나 = 빌드 단위 하나. `package.json` dependencies로 허용 의존성만 선언. Next `transpilePackages`로 앱에서 사용. | 허용되지 않은 패키지 import 시 **빌드/타입 체크 실패** 가능 |
| **5** | TypeScript Project References | 4 + `tsconfig` `references`, `composite: true`, `tsc -b`로 빌드 그래프·의존성 순서 강제. | 잘못된 참조·순환 시 **빌드 실패** |
| **6** | 패키지 공개 API만 노출 (exports) | 각 패키지 `exports` 필드로 진입점만 노출. 내부 deep import 차단. | 내부 경로 import 시 **resolution 실패** |
| **7** | 빌드 하네스 완성 | 5·6 + 아키텍처 체크 CI, 패키지 단위 테스트/버전 정책. 컴파일러·빌드가 “안전한 모듈화”를 보장. | 위반 시 **빌드/CI 전 단계에서 실패** |

요약:

- **0**: 구조 없음  
- **1**: 모노레포만  
- **2**: 논리적 경계(폴더 + 컨벤션) ← **현재 SSOTA**  
- **3**: 논리적 경계 + 린트/CI  
- **4**: 물리적 패키지 분리(도메인/레이어)  
- **5**: TS Project References  
- **6**: exports로 공개 API만  
- **7**: 전체 하네스(CI·정책까지)

---

## 현재 프로덕트(SSOTA)가 쓰는 패턴

### 적용된 것

- **모노레포**: pnpm workspace + Turborepo. `apps/web`, `packages/ui`, `packages/eslint-config`, `packages/typescript-config`.
- **앱 내 도메인 구조**: `apps/web/src/domains/[domain]/` 아래  
  `shared/`, `backend/`, `frontend/`, `actions/` 등 레이어별 디렉토리.  
  여러 도메인(block-management, canvas-management, workspace-management, user-management, ai-management 등) 존재.
- **Path alias**: `@/domains/[domain]/...` 로 cross-domain import. Next/TS에서 `@/*` → `./src/*` 매핑.
- **Hexagonal/DDD 컨벤션**: Domain Core는 `shared/`, 인프라/어댑터는 `backend/repositories/implementations/` 등. 의존성 방향은 **문서·리뷰·컨벤션**으로 유지.
- **공용 패키지**: `@workspace/ui` 등. `next.config.mjs`에서 `transpilePackages: ['@workspace/ui']` 사용.

### 아직 적용되지 않은 것

- **도메인/레이어 단위 패키지**: `packages/domain`, `packages/application`, `packages/infrastructure` 없음. 비즈니스 로직은 전부 `apps/web/src` 안.
- **TypeScript Project References**: 루트/앱 `tsconfig`에 `references`·`composite` 없음. 빌드 그래프로 의존성 순서를 강제하지 않음.
- **패키지 `exports`로 공개 API 제한**: `@workspace/ui`에 exports는 있으나, 도메인 패키지가 없어 도메인 단위 공개 API는 해당 없음.
- **ESLint로 도메인/레이어 import 방향 강제**: `no-restricted-imports` 또는 boundaries 규칙이 **도메인·레이어 경계**에 대해 설정되어 있지 않음. (문서에서는 권장만 함.)

따라서 **“논리적 경계”**까지는 갖추었고, **“물리적 경계”(빌드가 경계를 보장)** 는 아직 없다.

---

## 현재 단계: **2단계**

- **0단계가 아니다**: 모노레포와 도메인 폴더 구조·path alias·Hexagonal/DDD 컨벤션이 이미 있음.
- **1단계를 넘어섬**: 앱 내부가 “플랫”이 아니라 `domains/*` + 레이어로 명확히 나뉘어 있음.
- **2단계에 해당**:  
  - 경계 = **폴더 + 네이밍 + 컨벤션**.  
  - 위반해도 **컴파일은 성공**하고, 검증은 코드 리뷰·문서·(선택) 테스트에 의존.  
  - [모듈 경계 강제 가이드](../module-boundary-enforcement-guide.md)에서 말하는 “SSOTA의 현재 상태”와 일치.

정리하면:

- **현재 단계: 2단계 (논리적 경계 — 폴더·컨벤션)**  
- **목표 단계: 7단계 (빌드 하네스 완성)**  
- **다음 권장 단계: 3단계 (린트/CI로 경계 강화)**

---

## 2단계 → 7단계: 권장 진행 순서

| 현재 → 다음 | 할 일 |
|-------------|--------|
| **2 → 3** | ESLint로 도메인·레이어 import 방향 제한 (`no-restricted-imports` 또는 `eslint-plugin-boundaries`). CI에서 위반 시 실패. |
| **3 → 4** | 도메인(또는 도메인 그룹)을 `packages/domain-*` 형태로 분리. `package.json` dependencies로 허용된 의존성만 선언. Next `transpilePackages`에 추가. |
| **4 → 5** | `tsconfig.json`에 `references`·`composite: true` 도입. `tsc -b`로 빌드 순서·의존성 그래프 강제. |
| **5 → 6** | 각 패키지에 `exports` 필드로 진입점만 노출. 내부 deep import 시 resolution 실패하도록. |
| **6 → 7** | 아키텍처 체크 CI(의존성 그래프·순환 검사), 패키지 단위 테스트·버전 정책 정리. |

메모의 “Next.js에서 Spring/Gradle식으로 가져가는 실전 패턴”과 맞춰 보면:

- **A. 작은 프로젝트**: 2단계(또는 3단계)에 대응 — path alias + (선택) ESLint.
- **B. 커지기 시작함**: 4·5·6단계 — apps/web + packages/*, TS references, exports, transpilePackages.
- **C. 팀 커짐**: 7단계 — B + package 단위 테스트/버전 정책 + 아키텍처 체크 CI.

---

## 정리

| 항목 | 내용 |
|------|------|
| **0단계 정의** | 모듈화·레이어·도메인 구분이 전혀 없는 프로젝트. |
| **현재 패턴** | 모노레포 + 앱 내 `domains/*` 논리적 경계 + path alias + Hexagonal/DDD 컨벤션. 물리적 패키지 분리·TS references·exports·경계용 ESLint는 미도입. |
| **현재 단계** | **2단계** (논리적 경계). 0단계가 아님. |
| **궁극 목표** | **7단계** — 빌드 단계에서의 하네스(컴파일러·빌드가 모듈 경계를 보장). |
| **다음 단계** | **3단계** — 린트/CI로 도메인·레이어 import 방향을 강제하는 것부터 진행하는 것을 권장. |

이 문서는 세미나 메모와 [모듈 경계 강제 가이드](../module-boundary-enforcement-guide.md)를 한데 묶어, “우리 프로덕트는 지금 몇 단계이고, 빌드 하네스까지 어떻게 나아갈지”를 정리한 것이다.
