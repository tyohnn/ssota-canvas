# Event Domain Design 문서 가이드

이 폴더는 **Event Storming**과 **Process Model**을 기반으로 한 도메인별 설계 문서들을 포함합니다.

## 📁 폴더 구조

```
event-domain-design/
├── README.md                    # 이 문서 (폴더 가이드)
├── event-flow-diagram.md        # 전체 이벤트 플로우
├── domains/                     # 각 도메인별 설계 문서
│   ├── workspace-structure/     # Workspace Structure Domain
│   │   ├── event-storm.md       # Event Storming 결과
│   │   ├── process-model.md     # Process Model 정의
│   │   ├── software-design.md   # DDD 구조 설계
│   │   ├── technical-specification.md # 구현 가이드
│   │   └── README.md            # 도메인별 가이드
│   ├── visual-canvas/          # Visual Canvas Domain
│   └── component-system/       # Component System Domain
├── template/                   # 표준 문서 템플릿
├── guide/                      # 구현 가이드라인
└── discussion/                 # 설계 토론 기록
```

## 🎯 도메인 정의 프로세스

> **새로운 도메인을 정의해야 할 때?**
> 1. `guide/1-event-storming-guide.md`를 따라 Event Storming 워크샵 진행
> 2. `guide/2-process-model-guide.md`를 따라 Process Model 정의
> 3. `guide/1-software-design-guide.md`를 따라 Software Design 작성
> 4. 필요시 Technical Specification까지 완성

### 단계별 작업 프로세스

#### 1단계: Event Storming (도메인 이해 단계)
- **담당자**: PM + 도메인전문가
- **참가자**: 도메인전문가, PM, 기획자, 시니어개발자
- **결과물**: `event-storm.md`
- **가이드**: `guide/1-event-storming-guide.md`
- **작업 순서**:
  1. 워크샵 진행 (이벤트/커맨드/액터 식별, Context 경계 정의)
  2. Hotspot과 Opportunity 정리
  3. 문서화 및 리뷰

#### 2단계: Process Model (프로세스 정의 단계)
- **담당자**: 시니어개발자 + 도메인전문가
- **참가자**: 시니어개발자, 도메인전문가, PM
- **결과물**: `process-model.md`
- **가이드**: `guide/2-process-model-guide.md`
- **작업 순서**:
  1. Event Storm 결과 분석 및 핵심 프로세스 선정
  2. Command → Policy → System → Event 패턴 적용
  3. External System 통합 방식 정의
  4. 문서화 및 리뷰

#### 3단계: Software Design (설계 단계)
- **담당자**: 시니어개발자
- **참가자**: 시니어개발자, 도메인전문가, PM
- **결과물**: `software-design.md`
- **가이드**: `guide/1-software-design-guide.md`
- **작업 순서**:
  1. Process Model을 Aggregate로 매핑
  2. Value Object, Entity, Command, Event 정의
  3. Bounded Context와 Context Map 설계
  4. 핵심 설계 결정 문서화

#### 4단계: Technical & API Specification (구현 단계)
- **담당자**: 주니어개발자
- **참가자**: 주니어개발자, 시니어개발자
- **결과물**: `technical-specification.md`, `api-specification.md`
- **가이드**: `guide/2-technical-specification-guide.md`
- **작업 순서**:
  1. Technical Specification: 코드 구현 가이드 작성
  2. API Specification: 외부 API 계약 정의
  3. 시니어 개발자 코드 리뷰

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
- **가이드**: `guide/1-event-storming-guide.md`

#### process-model.md
- **Process Model**: Command → Policy → System → Events 패턴
- **작성**: 시니어개발자 + 도메인전문가
- **가이드**: `guide/2-process-model-guide.md`

#### software-design.md
- **DDD 구조 설계**: Aggregate, Entity, Value Object 정의
- **작성**: 시니어개발자
- **가이드**: `guide/1-software-design-guide.md`

#### technical-specification.md
- **구현 가이드**: 구체적 코드 작성 방법
- **작성**: 주니어개발자
- **가이드**: `guide/2-technical-specification-guide.md`

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

### 새로운 도메인 개발 시작 시
- [ ] **Event Storming**: `guide/1-event-storming-guide.md` 따라 진행 (PM + 도메인전문가)
- [ ] **Process Model**: `guide/2-process-model-guide.md` 따라 진행 (시니어개발자 + 도메인전문가)
- [ ] **Software Design**: `guide/1-software-design-guide.md` 따라 진행 (시니어개발자)
- [ ] **Technical Specification**: `guide/2-technical-specification-guide.md` 따라 진행 (주니어개발자)
- [ ] 각 단계별 리뷰 및 승인 완료

### 기존 도메인 수정 시
- [ ] 변경 영향도 분석 (영향 받는 문서 확인)
- [ ] 관련 문서 동시 업데이트
- [ ] 변경 이력 기록
- [ ] 리뷰어 승인

### 단계별 독립 실행 시
- [ ] **Event Storming만**: `guide/1-event-storming-guide.md` 참조
- [ ] **Process Model만**: `guide/2-process-model-guide.md` 참조 (Event Storm 완료 전제)
- [ ] **Software Design만**: `guide/1-software-design-guide.md` 참조 (Process Model 완료 전제)

---

## 📚 관련 문서

### 가이드 문서
- **[Event Storming 가이드](./guide/1-event-storming-guide.md)**: 워크샵 진행 및 문서화
- **[Process Model 가이드](./guide/2-process-model-guide.md)**: 프로세스 정의 및 문서화
- **[Software Design 가이드](./guide/1-software-design-guide.md)**: DDD 설계 및 문서화
- **[Technical Specification 가이드](./guide/2-technical-specification-guide.md)**: 구현 가이드 작성

### 템플릿 문서
- **[Event Storm 템플릿](./template/event-storm-template.md)**: Event Storming 결과 문서 템플릿
- **[Process Model 템플릿](./template/process-model-template.md)**: Process Model 문서 템플릿
- **[Software Design 템플릿](./template/3-software-design-template.md)**: Software Design 문서 템플릿
- **[Technical Specification 템플릿](./template/4-technical-specification-template.md)**: Technical Specification 문서 템플릿

### 예시 문서
- **[Workspace Structure Domain](../domains/workspace-structure-domain/)**: 완성된 도메인 예시
- **[Event Flow Diagram](./event-flow-diagram.md)**: 전체 시스템 이벤트 플로우

### 상위 문서
- **[상위 문서화 가이드](../../../README.md)**: 전체 문서화 시스템 개요
- **[Agile Planning 가이드](../../agile-planning/guide/)**: 프로젝트 계획 및 관리

---

이 문서화 시스템을 통해 **체계적인 도메인 정의**와 **품질 높은 소프트웨어 구현**을 달성할 수 있습니다! 🚀
