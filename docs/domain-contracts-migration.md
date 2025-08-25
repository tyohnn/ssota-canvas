# Xbowl 공유 타입/스키마 분리 계획 (ADR + Tasks)

## 결정 요약 (Decision)

- 공유 타입/검증/규칙은 별도 workspace 패키지로 분리한다.
- 앱(`apps/web`)과 CLI(`apps/xbowl-cli`)는 공통 “계약(contracts)”만 의존하고, 서로 직접 참조하지 않는다.
- Drizzle/React/Next 같은 런타임 의존성은 공유 패키지에서 배제한다.

## 목표

- 도메인 계약을 단일 소스로 관리하여 타입/검증의 일관성 확보
- CLI 번들 크기/런타임 안정성 향상(웹 런타임 의존 제거)
- 팀 간 병렬 개발(계약 안정)과 CI 신뢰성 향상

## 대상 패키지 및 역할

- `packages/domain-contracts`
  - 타입: `BlockType`, `EdgeType`, `BlockRecord`, `EdgeRecord`, `BlockRegistry` 등
  - 메타데이터 타입: Agent/Task/Workflow/Data/Checklist/Artifact\* 등
  - 검증: `zod` 스키마(메타데이터/레지스트리), `slug` 정규식, 공통 유효성 함수
  - 상수: `PageBlockType`, 컬러 토큰 등 런타임 無 상수 (아이콘 컴포넌트 제외)
- (선택) `packages/domain-core`
  - 렌더링/프레임워크에 독립적인 도메인 규칙(워크플로우 오케스트레이션 규칙 등)

## 범위(Scope)

- 포함: 타입/리터럴/정규식/`zod` 스키마/순수 유틸
- 제외: Drizzle 스키마/쿼리, React 컴포넌트/아이콘, Next 설정 및 런타임

## 아키텍처 가이드

- apps → packages 단방향 의존
- packages 간에는 상위 레이어 의존 금지(domain-contracts는 어떤 앱도 참조 금지)
- DTO 패턴: 웹은 Drizzle 엔티티 ↔ DTO 매핑(어댑터)로 계약 따름
- ESLint: `no-restricted-imports`로 역참조 방지

## 마이그레이션 단계 (Step-by-step)

### Phase A: 패키지 생성 (contracts) [우선순위 높음]

- [x] `packages/domain-contracts` 생성
- [x] `package.json`(name:`@workspace/domain-contracts`, type:module, exports, types)
- [x] `tsconfig.json`(extends workspace, NodeNext)
- [x] `src/index.ts`에서 공개 API 정리(NodeNext 확장 포함)
- [x] 타입 이동: `BlockType/EdgeType/BlockRecord/EdgeRecord/BlockRegistry`
- [x] 메타데이터 타입 이동: Agent/Task/Workflow/Data/Checklist/Artifact\*
- [x] `slug` 정규식/유틸, 기본 상수(색상 토큰 등) 이동
- [x] `zod` 스키마 초안 추가(메타데이터/레지스트리)

### Phase B: CLI 교체

- [x] CLI의 로컬 타입을 `@workspace/domain-contracts`로 교체
- [x] 변환/검증 경로 수정 및 빌드 확인
- [x] Turbo 파이프라인에 `build` 의존성 추가(소비 측 빌드 정상 동작 확인)

### Phase C: Web 교체 (진행 예정)

- [ ] Web에서 계약 타입 임포트 교체(`@workspace/domain-contracts`)
- [ ] Drizzle ↔ DTO 매핑 어댑터 추가(선언적 변환 함수)
- [ ] 정책/유효성 부분에서 `zod` 스키마 사용하도록 통일

### Phase D: 품질/가드레일

- [ ] ESLint `no-restricted-imports` 규칙 추가(역참조 방지)
- [ ] CI에서 `pnpm -w build --filter @workspace/domain-contracts` + `@xbowl/cli` + `web` 전체 그린 확인
- [ ] `sync --dry-run`/`validate`를 CI 체크에 포함

### Phase E: 고급(선택)

- [ ] Drizzle → DTO 타입/JSON Schema 코드젠 파이프라인 검토
- [ ] `domain-core` 분리(프레임워크 무관 규칙 집합)
- [ ] 템플릿 프리셋/정책 플러그블 구조(프로젝트 커스터마이즈)

## 산출물(Deliverables)

- `packages/domain-contracts` 소스/타입/스키마
- 앱/CLI 임포트 교체 PR
- ESLint/Turbo/CI 설정 PR

## 수용 기준(Acceptance Criteria)

- `web`/`cli` 둘 다 `@workspace/domain-contracts`만으로 도메인 타입/검증 사용
- `cli` 번들에 Next/React/Drizzle 런타임 종속성 미포함
- `validate`가 `zod` 스키마 기반으로 동작하고 앱/CLI 결과 일치
- CI 파이프라인에서 `sync --dry-run`/`validate` 통과

## 커밋 로그(요약)

- feat(contracts): add @workspace/domain-contracts (types/constants/zod) and switch CLI to use it [Phase A]
- chore(cli): wire contracts into validate/convert; build green

## 리스크/완화

- 타입/스키마 이동 중 단기 빌드 깨짐 → 점진적 PR, 터보 캐시 활용
- 계약 변경 시 세멸 관리 필요 → `domain-contracts`에 Semver/CHANGELOG 적용

## 일정 제안

- Week 1: Phase A, B 완료(contracts 도입, CLI 교체)
- Week 2: Phase C, D 완료(Web 교체, 품질 가드레일)
- Week 3+: Phase E 논의/선택 적용

## 참고

- 실리콘밸리 모범사례: contracts 패키지로 **런타임 의존 없는** 도메인 계약을 공용화, 앱/툴은 contracts에만 의존. DTO/어댑터로 DB/프레임워크 의존 분리.
