Hexagonal 아키텍처
10s 동안 생각함

Hexagonal 아키텍처(헥사고날 아키텍처)는 Ports and Adapters 아키텍처라고도 불러요.
핵심 아이디어는:

비즈니스 로직(도메인)을 중심에 두고, DB/웹/API 같은 바깥 요소를 교체 가능하게 분리하는 것

핵심 개념
1) 중심(Core)

도메인 로직 / 애플리케이션 유스케이스

“무엇을 해야 하는가”를 담당

프레임워크, DB, 외부 API를 몰라도 동작해야 함

2) 포트(Ports)

코어가 바깥과 통신하기 위한 인터페이스(계약)

두 종류로 보면 쉬움:

입력 포트(Inbound Port): 외부가 코어를 호출할 때 (예: CreateOrderUseCase)

출력 포트(Outbound Port): 코어가 외부 기능을 필요로 할 때 (예: OrderRepository, PaymentGateway)

3) 어댑터(Adapters)

포트를 실제 기술로 구현하는 부분

예:

입력 어댑터: REST Controller, GraphQL Resolver, CLI

출력 어댑터: PostgreSQL Repository, Redis Cache, 외부 결제 API 클라이언트

왜 “Hexagonal(육각형)”인가?

육각형 모양 자체가 중요한 건 아니고,
여러 방향(웹, DB, 메시지큐, 테스트 등)에서 코어와 연결될 수 있다는 걸 시각적으로 표현한 거예요.

의존성 방향 (핵심)

어댑터 → 포트 → 코어

즉, 바깥 기술들이 코어에 맞춰 붙음

코어는 바깥 기술에 의존하지 않음

이게 제일 중요합니다.

장점

테스트 쉬움: DB 없이도 유스케이스 테스트 가능 (Mock adapter 사용)

기술 교체 쉬움: PostgreSQL → Supabase/Prisma/외부 API 교체 시 영향 최소화

프레임워크 종속 감소: Next.js/NestJS/Spring 바꿔도 코어 유지 가능

비즈니스 로직이 선명해짐: 로직이 컨트롤러/쿼리 코드에 섞이지 않음

단점 / 주의점

초기에 구조가 다소 복잡해 보임

작은 프로젝트에는 과한 추상화가 될 수 있음

인터페이스를 너무 많이 만들면 오히려 생산성 떨어질 수 있음

간단한 예시 (주문 생성)
코어(유스케이스)

CreateOrderUseCase

재고 확인

주문 생성

결제 요청

저장

포트

입력 포트: CreateOrder

출력 포트:

ProductRepository

OrderRepository

PaymentPort

어댑터

입력 어댑터: HTTP Controller (POST /orders)

출력 어댑터:

PostgresOrderRepository

IamportPaymentAdapter

레이어드 아키텍처와 차이 (한 줄)

전통 레이어드: 보통 상위 레이어가 하위(DB/프레임워크)에 자연스럽게 끌려감

헥사고날: 도메인 중심으로 바깥을 “붙이는” 구조

원하면 다음 답변에서 너 스타일(Next.js + TypeScript 기준)로
폴더 구조 예시 / 인터페이스 코드 예시 / DDD랑 같이 쓰는 방식까지 바로 이어서 정리해줄게.

Monolith 모노레포의 차이
몇 초 동안 생각함

좋은 포인트예요. 이 둘은 비슷하게 들리지만 완전히 다른 축입니다.

Monolith (모놀리스) = 배포/실행 아키텍처

Monorepo (모노레포) = 코드 저장소(Repo) 운영 방식

즉, 하나는 시스템 구조, 다른 하나는 소스코드 관리 방식이에요.

한 줄로 차이

모놀리스: 앱이 하나의 큰 서비스로 동작/배포됨

모노레포: 여러 프로젝트 코드를 하나의 Git 저장소에서 관리함

1) Monolith (모놀리스)
의미

백엔드/웹앱이 기능별로 나뉘어 있어도 최종적으로는 하나의 애플리케이션으로 묶여서 실행/배포되는 구조.

예시

auth, billing, admin 기능이 있어도

최종 배포는 server 하나

장점

초기 개발 속도 빠름

로컬 개발/디버깅 쉬움

배포 파이프라인 단순

단점

코드 커지면 결합도 증가

작은 변경도 전체 배포 필요

팀 커지면 충돌 증가 가능

2) Monorepo (모노레포)
의미

여러 앱/패키지/라이브러리를 하나의 레포에 모아 관리하는 방식.

예시

하나의 저장소 안에:

apps/web

apps/admin

apps/api

packages/ui

packages/config

packages/utils

이런 식으로 같이 들어있음 (Turborepo, Nx, pnpm workspace 등)

장점

공용 코드 재사용 쉬움 (ui, types, utils)

버전 맞추기 쉬움

여러 프로젝트 변경을 한 PR에서 처리 가능

단점

빌드/CI 설정 복잡해질 수 있음

권한/배포 경계 관리 필요

레포가 커지면 툴링 중요

핵심: 서로 배타적인 개념이 아님 (같이 가능)

이게 제일 중요해요.

조합 예시 1) 모놀리스 + 모노레포

저장소 하나(monorepo)

그 안의 백엔드는 하나의 큰 앱(monolith)

web/admin/shared package 같이 관리

👉 스타트업 초기에 아주 흔하고 실용적

조합 예시 2) 마이크로서비스 + 모노레포

저장소 하나(monorepo)

apps/api-auth, apps/api-billing, apps/api-notify 각각 독립 배포

👉 플랫폼 팀/툴링 잘 갖춘 팀에서 가능

조합 예시 3) 모놀리스 + 멀티레포

백엔드 레포 따로, 프론트 레포 따로

백엔드는 여전히 모놀리스

👉 회사/팀 분리 때문에 이렇게도 많이 함

헷갈리는 이유

둘 다 “mono(하나)”가 붙어서 헷갈리는데:

Monolith의 mono = 하나의 실행 단위

Monorepo의 mono = 하나의 저장소

너처럼 제품 빠르게 만드는 팀 관점에서 추천 감각

초기엔 보통:

아키텍처는 모놀리스

레포는 모노레포 (혹은 단일 앱 레포)

이 조합이 가장 생산적인 경우가 많아요.

이유:

비즈니스 로직 빨리 붙이고

shared types/ui/utils 재사용 쉽고

나중에 필요할 때만 서비스 분리 가능

원하면 다음 답변에서
너 기준(Next.js + API + shared packages)으로 “모놀리스지만 모노레포인 구조” 폴더 예시까지 바로 짜줄게.

Microfrontend라는게 있던데 설명해줘. Vercel에허도 지원하던데

마이크로프론트엔드 개념부터 먼저 깔끔하게 정리하고, 이어서 Vercel에서 실제로 어떤 방식으로 지원하는지 최신 기준으로 확인해서 설명할게요. 핵심은 “언제 쓰는 게 맞고, 언제 과한지”까지 같이 보는 겁니다.

36s 동안 생각함

좋아, 이건 딱 너가 방금 물은 Monolith / Monorepo 축이랑 또 다른 축이야.

Microfrontend가 뭐야?

**Microfrontend(마이크로프론트엔드)**는
하나의 큰 프론트엔드 앱을 여러 개의 작은 프론트엔드 앱으로 나눠서, 각 팀이 독립적으로 개발/배포할 수 있게 하는 아키텍처야. 사용자 입장에서는 여전히 하나의 서비스처럼 보이게 만드는 게 핵심.

예를 들면:

/ ~ /pricing = 마케팅 사이트 팀

/docs/* = 문서 팀

/dashboard/* = 프로덕트 팀

이렇게 쪼개서 각각 다른 앱으로 운영할 수 있음. (심지어 프레임워크가 달라도 가능)

왜 쓰냐? (장점)

Vercel 문서 기준으로도 대표 이유가 딱 이거야:

개발 속도 개선 (빌드/개발 범위 축소)

팀 독립성 (팀별 기술 선택/배포 주기 분리)

점진적 마이그레이션 (레거시를 한 번에 갈아엎지 않고 부분 이전)

그리고 Vercel이 실제로 자사 사이트를 마이크로프론트엔드로 쪼개면서 preview build/local compile 시간 40%+ 개선 사례를 공유했어.

단점도 있음 (중요)

이거 진짜 중요함:
마이크로프론트엔드는 복잡도를 증가시킬 수 있어.

Vercel도 문서에서 대안으로 먼저 고려해보라고 적어둔 게:

Monorepo + Turborepo

Feature flags

Turbopack으로 빌드 속도 개선

즉, 앱이 아직 크지 않거나 팀이 작으면 microfrontend는 오히려 과할 수 있어.

Vercel에서 “지원”한다는 게 무슨 뜻?

Vercel은 단순히 “여러 앱 올릴 수 있음” 수준이 아니라,
여러 프론트엔드 앱을 하나의 도메인 아래에서 라우팅/연결해주는 Microfrontends 기능을 제공해. 그리고 라우팅을 Vercel 네트워크에서 처리함.

핵심 포인트:

microfrontends.json으로 어떤 경로를 어떤 앱으로 보낼지 설정

Vercel이 요청 받을 때 이 설정을 읽어 경로 라우팅

하나의 서비스처럼 보여도 내부적으로는 여러 Vercel 프로젝트가 담당

Vercel에서의 구성 개념 (쉽게)

보통 이런 느낌이야:

default application (기본 앱)

microfrontends.json을 배포하는 중심 앱

child microfrontends

/docs/*, /dashboard/* 같은 경로 담당 앱들

microfrontends.json이 default app에 배포되지 않으면 그 배포는 microfrontend로 인식되지 않는다고 문서에 나와 있어.

라우팅 방식 (대표적으로 path-based)

Vercel 문서에서 path routing 예시가 나와 있고, 예를 들어 /docs/:path* 같은 경로를 docs 앱으로 보낼 수 있어.

이건 너가 이해하기 쉽게 말하면:

“도메인은 하나”

“경로별로 담당 앱이 다름”

“근데 사용자는 모름”

로컬 개발도 신경 쓴 편 (Vercel 장점)

마이크로프론트엔드의 골치 아픈 점이 “다 같이 안 켜면 동작 안 함”인데,
Vercel은 @vercel/microfrontends 로컬 프록시를 제공해서 내가 작업하는 앱만 로컬로 띄우고, 나머지는 필요 시 프로덕션(또는 fallback)으로 라우팅하게 도와줘.

이건 팀 작업할 때 체감 큼.

Preview 환경에서의 fallback도 있음

문서 기준으로 microfrontend 그룹에서 어떤 앱이 특정 커밋에 대해 preview 빌드가 안 되어도, Vercel이 fallback 환경으로 라우팅해서 전체 흐름이 깨지지 않게 할 수 있어.

즉, “전체 앱을 항상 다 빌드해야 테스트 가능” 문제를 줄여줌.

CLI도 있음

Vercel CLI에 vercel microfrontends (vercel mf) 명령이 있고, 원격 설정(microfrontends.json)을 로컬로 pull 해서 개발할 수 있어. 문서에는 CLI 44.2.2+ 필요라고 되어 있음.

Next.js의 Multi-Zones랑 관계

너가 Next.js 기준으로 보면, **Next.js Multi-Zones는 마이크로프론트엔드의 한 방식(특히 path-based / vertical split)**으로 이해하면 좋아. Next.js 공식 문서도 “micro-frontends approach”라고 설명해.

예:

marketing 앱

docs 앱

dashboard 앱

각각 독립 배포 + 같은 도메인에서 제공.

너한테 맞는 감각으로 정리 (실무 판단)
microfrontend가 잘 맞는 경우

팀이 커져서 프론트 한 앱이 너무 무거움

빌드 시간이 병목

영역별 UI/의존성/릴리즈 주기가 다름 (docs vs dashboard 등)

레거시에서 점진 마이그레이션 필요

아직 이른 경우

팀이 1~3명

앱 규모가 아직 크지 않음

공통 UI/상태/라우팅을 자주 넘나듦

인프라 복잡도 늘리기 싫음

이 경우엔 먼저:

모놀리스(앱 구조) + 모노레포(코드 관리)

Turborepo / Turbopack / lazy loading / 코드 분리
로 버티는 게 보통 더 생산적이야. (Vercel도 이런 대안을 먼저 언급)

한 줄 요약

Microfrontend = 프론트엔드를 여러 앱으로 분할해 독립 배포

Vercel = 이걸 경로 라우팅/그룹 관리/로컬 프록시/preview fallback까지 플랫폼 레벨로 지원

원하면 다음 답변에서 너 기준으로
“Next.js + Vercel에서 /, /docs, /app 를 microfrontend로 나누는 설계안” (폴더/레포 전략/공통 UI 공유 방식)까지 바로 짜줄게.

Spring에서 grade build를 통해서 컴파일타임에서 모놀리식 모듈끼리 의존성을 서로 주자나.
그러면 nextjs는 어떻게 처리할 수 있어? 레이어드 아키텍쳐는 있는데

핵심 질문이 좋아요. Spring/Gradle의 “모듈 의존성 = 컴파일 타임 계약”을 Next.js에서 어떻게 비슷하게 만들지 관점으로, 실무적으로 가능한 방법(패키지 분리/TS project references/린트 규칙)을 정리해볼게요.

4m 20s 동안 생각함

좋은 포인트예요.
결론부터 말하면 Next.js 자체가 Gradle처럼 “모듈 의존성 그래프를 컴파일 타임에 강하게 관리”해주진 않지만, TypeScript 프로젝트 참조 + 워크스페이스 패키지 분리 + package exports + 린트 규칙을 조합하면 거의 비슷한 수준으로 만들 수 있어요.

먼저 차이부터 (Spring/Gradle vs Next.js)

Spring + Gradle 멀티모듈: :domain, :application, :infra 같은 모듈 의존성을 빌드 설정으로 강하게 선언/제어

Next.js: 기본은 앱 프레임워크 + 번들러 관점이라, 폴더만 나누면 의존성 규칙이 자동으로 강제되진 않음
(레이어드는 “구조”이고, 의존성 강제는 별도 도구가 필요)

Next.js에서 Spring식으로 가져가는 실전 패턴 (추천)
1) 모듈을 “폴더”가 아니라 “패키지”로 쪼개기

가장 중요합니다. 그냥 src/domain, src/infra 폴더만 두면 우회 import가 너무 쉬워요.

예시 (모놀리식이지만 모듈화된 구조):

repo/
  apps/
    web/                  # Next.js app (adapter / presentation)
  packages/
    domain/               # 엔티티, VO, 순수 비즈니스 규칙
    application/          # use case, ports
    infrastructure/       # DB, 외부 API adapter
    ui/                   # 공유 UI (선택)

이렇게 하면 apps/web가 @acme/application, @acme/ui를 가져오고, application이 domain을 참조하는 식으로 의존성 방향을 만들 수 있어요.

2) TypeScript Project References로 “빌드 그래프” 만들기 (Gradle 감성에 가장 가까움)

TypeScript의 Project References는 프로젝트를 작은 조각으로 나누고, 논리적 분리와 빌드 순서를 관리하는 용도로 제공돼요. 공식 문서도 **논리적 분리(enforce logical separation)**와 tsc --build(orchestrator)를 명시합니다.

루트 tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/domain" },
    { "path": "./packages/application" },
    { "path": "./packages/infrastructure" },
    { "path": "./apps/web" }
  ]
}
packages/domain/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
packages/application/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist"
  },
  "references": [{ "path": "../domain" }],
  "include": ["src"]
}

TS는 references, composite, tsc -b로 의존성 순서 빌드와 분리된 타입 체크를 지원해요.

이게 Spring/Gradle의 implementation project(':domain') 같은 느낌에 가장 가깝습니다.

3) package.json exports로 공개 API만 열기 (내부 침범 차단)

Node의 exports 필드는 패키지의 공개 엔트리만 노출하고, 정의되지 않은 깊은 경로 import를 막는 데 유용해요. Node 문서도 exports가 엔트리 포인트를 제한하고 공개 API를 명확히 하는 데 쓰인다고 설명합니다.

예: packages/domain/package.json

{
  "name": "@acme/domain",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./user": "./src/user/index.ts"
  }
}

이렇게 하면 아래 같은 import를 막기 쉬워짐:

// 막고 싶은 것 (internal deep import)
import { something } from '@acme/domain/src/internal/private'

즉, 모듈 간 “공개 인터페이스” 개념을 만들 수 있어요. (Spring의 public package/API 느낌)

4) Next.js 앱에서 로컬 패키지 사용: transpilePackages

Next.js는 로컬 패키지(모노레포)도 자동으로 transpile/bundle할 수 있게 transpilePackages를 제공합니다. 공식 문서에 로컬 패키지(모노레포 포함) 지원이라고 나와 있어요.

apps/web/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@acme/domain',
    '@acme/application',
    '@acme/infrastructure',
    '@acme/ui'
  ]
}

module.exports = nextConfig
5) 레이어 규칙 강제는 린트로 추가 (폴더/패키지 import 방향 제한)

이건 엄밀히 말하면 “컴파일 타임”이 아니라 lint-time/CI gate지만, 실무에서는 거의 같은 효과를 냅니다.

예:

domain → 어디에도 의존 금지

application → domain만 허용

infrastructure → application, domain 허용 (혹은 ports 기준)

web → application, ui만 허용

web에서 infrastructure 직접 import 금지

즉:

TS Project References = 빌드 그래프 / 타입 분리

ESLint 규칙 = 아키텍처 방향 강제

exports = 내부 구현 캡슐화

이 3개를 같이 써야 Spring 멀티모듈 느낌이 납니다.

“레이어드 아키텍처는 있는데…”에 대한 핵심 답

맞아요. Next.js에서는 레이어드 구조를 폴더로 만들 수는 있지만, 그 자체로 의존성 방향이 보장되지는 않아요.
그래서 “레이어드 폴더 구조”를 “워크스페이스 패키지 + TS references”로 올려야 Gradle식 안정성이 생깁니다.

Next.js 특성까지 반영하면 더 좋은 설계

Next App Router는 기본적으로 서버 컴포넌트 중심이고, 서버/클라이언트 경계가 존재해요. 공식 문서도 서버/클라이언트 컴포넌트 구분과 서로 다른 모듈 그래프 개념을 설명합니다.
그래서 보통 이렇게 두 축으로 나눠요:

아키텍처 레이어 축: domain / application / infra / web

런타임 경계 축: server / client (RSC, client component)

이 두 축을 같이 관리해야 깔끔해져요.

현실적인 추천 조합 (당장 적용 가능)
A. 작은 프로젝트 (빠르게)

src/ 안에 layer 폴더

path alias (@/domain, @/application) 사용 (Next는 alias 설정 지원)

ESLint로 import 방향 제한

B. 커지기 시작함 (추천)

apps/web + packages/* 모노레포(모듈화된 모놀리스)

TS project references (tsc -b)

exports로 public API 제한

Next transpilePackages

C. 팀 커짐 / 여러 앱 생김

위 B + package 단위 테스트/버전 정책 + 아키텍처 체크 CI

한 줄 요약

Next.js에서 Spring/Gradle식 모듈 의존성 관리는 “Next 기능”이 아니라 “TypeScript/Node 패키지 시스템 + lint/CI”로 구현한다고 보면 정확해요.
그리고 가장 핵심은 폴더 분리보다 패키지 분리입니다.

원하면 다음 답변에서 너 스타일(Next.js + TS + no-code builder/SSOTA 구조)에 맞춰서
apps/web + packages/domain/application/infrastructure 실제 템플릿(파일 구조 + tsconfig + eslint 규칙 예시) 바로 만들어줄게.