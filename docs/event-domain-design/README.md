# Event Domain Design 문서 가이드

이 폴더는 **Event Storming**과 **Process Model**을 기반으로 한 도메인별 설계 문서들을 포함합니다.

## 📁 폴더 구조

```
event-domain-design/
├── README.md                    # 이 문서 (폴더 가이드)
├── event-flow-diagram.md        # 전체 이벤트 플로우
├── domains/                     # 각 도메인별 설계 문서
│   ├── workspace-structure/     # Workspace Structure Domain
│   │   ├── 01-event-storm.md       # Event Storming 결과
│   │   ├── 02-process-model.md     # Process Model 정의
│   │   ├── 03-software-design.md   # DDD 구조 설계
│   │   ├── 03.5-testing-strategy.md   # TDD 설계
│   │   ├── 04-technical-specification.md # 백엔드 설계
│   │   ├── 05-db-schema.md       # db schema
│   │   ├── 06-frontend-specification.md       # 프론트엔드 설계
│   │   └── README.md            # 도메인별 가이드
│   ├── visual-canvas/          # Visual Canvas Domain
│   └── component-system/       # Component System Domain
├── template/                   # 표준 문서 템플릿
├── guide/                      # 구현 가이드라인
└── discussion/                 # 설계 토론 기록
```

## 🎯 도메인 정의 프로세스 (TDD 기반)

> **새로운 도메인을 정의해야 할 때?**
> 1. `guide/01-event-storming-guide.md`를 따라 Event Storming 워크샵 진행
> 2. `guide/02-process-model-guide.md`를 따라 Process Model 정의
> 3. `guide/03-software-design-guide.md`를 따라 Software Design 작성
> 4. `guide/04-testing-strategy-guide.md`를 따라 Testing Strategy 수립
> 5. `guide/05-technical-specification-guide.md`로 수도코드 작성 (구현 + 테스트)
> 6. `guide/06-frontend-specification-guide.md`로 프론트엔드 연동
> 7. `guide/07-tdd-implementation-guide.md`로 TDD 사이클 적용하여 구현
> 8. `guide/08-code-conventions.md`에서 DTO 직렬화 컨벤션 확인

### 단계별 작업 프로세스

#### 1단계: Event Storming (도메인 이해 단계)
- **담당자**: PM + 도메인전문가
- **참가자**: 도메인전문가, PM, 기획자, 시니어개발자
- **결과물**: `event-storm.md`
- **가이드**: `guide/01-event-storming-guide.md`
- **작업 순서**:
  1. 워크샵 진행 (이벤트/커맨드/액터 식별, Context 경계 정의)
  2. Hotspot과 Opportunity 정리
  3. 문서화 및 리뷰

#### 2단계: Process Model (프로세스 정의 단계)
- **담당자**: 시니어개발자 + 도메인전문가
- **참가자**: 시니어개발자, 도메인전문가, PM
- **결과물**: `process-model.md`
- **가이드**: `guide/02-process-model-guide.md`
- **작업 순서**:
  1. Event Storm 결과 분석 및 핵심 프로세스 선정
  2. Command → Policy → System → Event 패턴 적용
  3. External System 통합 방식 정의
  4. 문서화 및 리뷰

#### 3단계: Software Design (설계 단계)
- **담당자**: 시니어개발자
- **참가자**: 시니어개발자, 도메인전문가, PM
- **결과물**: `software-design.md`
- **가이드**: `guide/03-software-design-guide.md`
- **작업 순서**:
  1. Process Model을 Aggregate로 매핑
  2. Value Object, Entity, Command, Event 정의
  3. Bounded Context와 Context Map 설계
  4. 핵심 설계 결정 문서화

#### 4단계: Testing Strategy (테스트 전략 수립)
- **담당자**: 시니어개발자 + 주니어개발자
- **참가자**: 시니어개발자, 주니어개발자
- **결과물**: `testing-strategy.md`
- **가이드**: `guide/04-testing-strategy-guide.md`
- **작업 순서**:
  1. Process Model 시나리오를 테스트 케이스로 매핑
  2. Unit/Integration/E2E 테스트 전략 수립
  3. 커버리지 목표 설정
  4. TDD 우선순위 정의

#### 5단계: Technical Specification (수도코드 작성)
- **담당자**: 주니어개발자
- **참가자**: 주니어개발자, 시니어개발자
- **결과물**: `technical-specification.md`
- **가이드**: `guide/05-technical-specification-guide.md`
- **작업 순서**:
  1. 구현 수도코드 작성 (DDD 컴포넌트별)
  2. 테스트 수도코드 작성 (Given-When-Then)
  3. TDD 구현 순서 정의
  4. 시니어 개발자 리뷰

#### 6단계: Frontend Specification (프론트엔드 연동)
- **담당자**: 주니어개발자
- **참가자**: 주니어개발자, 시니어개발자
- **결과물**: `frontend-specification.md`
- **가이드**: `guide/06-frontend-specification-guide.md`
- **작업 순서**:
  1. React Context 설계
  2. Server Actions 연동
  3. 낙관적 업데이트 패턴 적용
  4. UI 컴포넌트 구현

#### 7단계: TDD Implementation (실제 구현)
- **담당자**: 주니어개발자
- **참가자**: 주니어개발자, 시니어개발자 (코드 리뷰)
- **결과물**: 실제 코드 + 테스트 코드
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **작업 순서**:
  1. RED-GREEN-REFACTOR 사이클 적용
  2. Phase별 구현 (Value Objects → Entities → Aggregates → ...)
  3. 커버리지 목표 달성 확인
  4. 시니어 개발자 코드 리뷰

#### 8단계: Code Conventions (코드 컨벤션)
- **담당자**: 주니어개발자
- **참가자**: 주니어개발자, 시니어개발자
- **결과물**: DTO 타입 및 직렬화 로직
- **가이드**: `guide/08-code-conventions.md` (DTO 직렬화 컨벤션 섹션)
- **작업 순서**:
  1. Read Models를 DTO로 정의
  2. Repository/Service에서 직렬화 수행
  3. 폴더 구조 정리 (events vs dtos 분리)
  4. Server Actions에서 DTO 반환

## 📋 각 문서의 역할

### event-flow-diagram.md
- **목적**: 전체 시스템의 이벤트 플로우 시각화
- **작성자**: 시니어 개발자
- **사용법**: 새로운 도메인 추가 시 참조

### domains/[domain-name]/
각 도메인의 완전한 설계 문서 세트:

#### event-storm.md
- **Event Storming 결과**: 비즈니스 이벤트와 프로세스 발견
- **작성**: PM + 도메인전문가
- **가이드**: `guide/01-event-storming-guide.md`

#### process-model.md
- **Process Model**: Command → Policy → System → Events 패턴
- **작성**: 시니어개발자 + 도메인전문가
- **가이드**: `guide/02-process-model-guide.md`

#### software-design.md
- **DDD 구조 설계**: Aggregate, Entity, Value Object 정의
- **작성**: 시니어개발자
- **가이드**: `guide/03-software-design-guide.md`

#### technical-specification.md
- **구현 가이드**: 구체적 코드 작성 방법
- **작성**: 주니어개발자
- **가이드**: `guide/06-technical-specification-guide.md`

### template/
- **표준 템플릿들**: 새로운 도메인 개발 시 사용
- **사용법**: `cp template/[template-name] docs/domains/[new-domain]/[document-name]`

### guide/
- **단계별 가이드**: 각 문서 작성 방법과 워크샵 진행법
- **사용법**: 도메인 정의 시 순서대로 참조

### discussion/
- **설계 토론 기록**: 중요한 설계 결정들의 배경과 토론 내용
- **사용법**: 새로운 팀원 온보딩 시 필독

## 🎯 작업 체크리스트

### 새로운 도메인 개발 시작 시 (TDD 워크플로우)
- [ ] **Event Storming**: `guide/01-event-storming-guide.md` 따라 진행 (PM + 도메인전문가)
- [ ] **Process Model**: `guide/02-process-model-guide.md` 따라 진행 (시니어개발자 + 도메인전문가)
- [ ] **Software Design**: `guide/03-software-design-guide.md` 따라 진행 (시니어개발자)
- [ ] **Testing Strategy**: `guide/04-testing-strategy-guide.md` 따라 진행 (시니어 + 주니어)
- [ ] **Technical Specification**: `guide/05-technical-specification-guide.md` 따라 수도코드 작성 (주니어개발자)
- [ ] **Frontend Specification**: `guide/06-frontend-specification-guide.md` 따라 UI 연동 (주니어개발자)
- [ ] **TDD Implementation**: `guide/07-tdd-implementation-guide.md` 따라 RED-GREEN-REFACTOR (주니어개발자)
- [ ] **Code Conventions**: `guide/08-code-conventions.md`의 DTO 직렬화 컨벤션 확인 (주니어개발자)
- [ ] 각 단계별 리뷰 및 승인 완료

### 기존 도메인 수정 시
- [ ] 변경 영향도 분석 (영향 받는 문서 확인)
- [ ] 관련 문서 동시 업데이트
- [ ] 변경 이력 기록
- [ ] 리뷰어 승인

### 단계별 독립 실행 시
- [ ] **Event Storming만**: `guide/01-event-storming-guide.md` 참조
- [ ] **Process Model만**: `guide/02-process-model-guide.md` 참조 (Event Storm 완료 전제)
- [ ] **Software Design만**: `guide/03-software-design-guide.md` 참조 (Process Model 완료 전제)

---

## 📚 관련 문서

### 가이드 문서
- **[Event Storming 가이드](./guide/01-event-storming-guide.md)**: 워크샵 진행 및 문서화
- **[Process Model 가이드](./guide/02-process-model-guide.md)**: 프로세스 정의 및 문서화
- **[Software Design 가이드](./guide/03-software-design-guide.md)**: DDD 설계 및 문서화
- **[Testing Strategy 가이드](./guide/04-testing-strategy-guide.md)**: 테스트 전략 수립
- **[Technical Specification 가이드](./guide/05-technical-specification-guide.md)**: 수도코드 작성 (구현 + 테스트)
- **[Frontend Specification 가이드](./guide/06-frontend-specification-guide.md)**: 프론트엔드 연동
- **[TDD Implementation 가이드](./guide/07-tdd-implementation-guide.md)**: TDD 사이클 적용 구현
- **[Code Conventions](./guide/08-code-conventions.md)**: 코드 컨벤션 & DTO 직렬화
- **[Architecture Overview](./guide/09-architecture-overview.md)**: 전체 아키텍처 개요

### 템플릿 문서
- **[Event Storm 템플릿](./template/01-event-storm-template.md)**: Event Storming 결과 문서 템플릿
- **[Process Model 템플릿](./template/02-process-model-template.md)**: Process Model 문서 템플릿
- **[Software Design 템플릿](./template/03-software-design-template.md)**: Software Design 문서 템플릿
- **[Testing Strategy 템플릿](./template/04-testing-strategy-template.md)**: Testing Strategy 문서 템플릿
- **[Technical Specification 템플릿](./template/05-technical-specification-template.md)**: Technical Specification 문서 템플릿
- **[API Specification 템플릿](./template/06-api-specification-template.md)**: API Specification 문서 템플릿
- **[Frontend Specification 템플릿](./template/07-frontend-specification-template.md)**: Frontend Specification 문서 템플릿

### 예시 문서
- **[Workspace Structure Domain](../domains/workspace-structure-domain/)**: 완성된 도메인 예시
- **[Event Flow Diagram](./event-flow-diagram.md)**: 전체 시스템 이벤트 플로우

### 상위 문서
- **[상위 문서화 가이드](../../../README.md)**: 전체 문서화 시스템 개요
- **[Agile Planning 가이드](../../agile-planning/guide/)**: 프로젝트 계획 및 관리

---

이 문서화 시스템을 통해 **체계적인 도메인 정의**와 **품질 높은 소프트웨어 구현**을 달성할 수 있습니다! 🚀
