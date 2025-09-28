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

## 🎯 협업 방식

> **Software Design을 작성해야 할 때?**
> 1. 아래 가이드를 훑어 전체 흐름을 이해하고
> 2. `template/1-software-design-template.md`를 복사해 `domains/<domain>/software-design.md`를 만든 다음
> 3. `guide/1-software-design-guide.md`의 단계를 하나씩 따라 채워 넣으세요.

### 단계별 작업 프로세스

#### 1단계: Event Flow & Process Model (기획 단계)
- **참가자**: 도메인 담당자, PO, 기획자, 시니어 개발자
- **작업 순서**:
  1. Event Storming으로 비즈니스 이벤트 식별
  2. Process Model로 Command → Policy → System → Events 정의
  3. 시니어 개발자 리뷰 및 아키텍처 검토

#### 2단계: Software Design (설계 단계)
- **작성자**: 주니어 개발자
- **리뷰어**: 기획자, 시니어 개발자
- **작업 순서**:
  1. Process Model을 Aggregate로 매핑
  2. Value Object, Entity, Command, Event 정의
  3. Bounded Context와 Context Map 설계
  4. 핵심 설계 결정 문서화

#### 3단계: Technical & API Specification (구현 단계)
- **작성자**: 주니어 개발자
- **리뷰어**: 시니어 개발자
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
- **작성**: 도메인 담당자, PO, 기획자, 시니어 개발자

#### process-model.md
- **Process Model**: Command → Policy → System → Events 패턴
- **작성**: 도메인 담당자, PO, 기획자, 시니어 개발자

#### software-design.md
- **DDD 구조 설계**: Aggregate, Entity, Value Object 정의
- **작성**: 주니어 개발자 → 기획자+시니어 리뷰

#### technical-specification.md
- **구현 가이드**: 구체적 코드 작성 방법
- **작성**: 주니어 개발자 → 시니어 리뷰

### template/
- **표준 템플릿들**: 새로운 도메인 개발 시 사용
- **사용법**: `cp template/* docs/[new-domain]/`

### guide/
- **구현 가이드라인**: 코드 작성 표준과 패턴
- **참조**: Technical Specification 작성 시 사용

### discussion/
- **설계 토론 기록**: 중요한 설계 결정들의 배경과 토론 내용
- **사용법**: 새로운 팀원 온보딩 시 필독

## 🎯 작업 체크리스트

### 새로운 도메인 개발 시작 시
- [ ] Event Storming 문서 작성 (도메인 담당자 + PO + 기획자 + 시니어)
- [ ] Process Model 문서 작성 (동일 참가자)
- [ ] Software Design 템플릿 복사 및 작성 (주니어 개발자 → 기획자/시니어 리뷰)
- [ ] Technical Specification 문서 작성 (주니어 개발자)
- [ ] 코드 리뷰 (시니어 개발자)

### 기존 도메인 수정 시
- [ ] 변경 영향도 분석 (영향 받는 문서 확인)
- [ ] 관련 문서 동시 업데이트
- [ ] 변경 이력 기록
- [ ] 리뷰어 승인

---

## 📚 관련 문서

- **[상위 문서화 가이드](../../../README.md)**: 전체 문서화 시스템 개요
- **[소프트웨어 디자인 가이드](./guide/1-software-design-guide.md)**: 상세 구현 가이드라인
- **[테크니컬 스펙 가이드](./guide/2-technical-specification-guide.md)**: 구체적 구현 가이드
- **[코드 컨벤션](./guide/3-code-conventions.md)**: 코드 작성 표준
- **[템플릿 가이드](./template/README.md)**: 표준 문서 템플릿 사용법

---

이 문서화 시스템을 통해 **효율적인 도메인 개발**과 **품질 높은 소프트웨어 구현**을 달성할 수 있습니다! 🚀
