# Agile Planning 문서 가이드

이 폴더는 **애자일 개발 계획**과 **사용자 스토리** 문서들을 포함합니다.

## 📁 폴더 구조

```
agile-planning/
├── README.md                           # 이 문서 (폴더 가이드)
├── project-vision.md                   # 🆕 프로젝트 비전 및 전략 (3년)
├── annual-roadmap.md                   # 🆕 연간 로드맵 (2024년)
├── guide/                             # PM 가이드 문서들
│   ├── 00-project-vision-guide.md     # 🆕 Project Vision 작성 가이드
│   ├── 01-annual-roadmap-guide.md     # 🆕 Annual Roadmap 작성 가이드
│   ├── 02-initiative-setup-guide.md   # Initiative 설정 가이드
│   ├── 03-event-storming-guide.md     # Event Storming 가이드
│   ├── 04-epic-planning-guide.md      # Epic 계획 가이드
│   ├── 05-story-definition-guide.md   # Story 정의 가이드
│   ├── 06-sprint-planning-guide.md    # Sprint 계획 가이드
│   └── 07-branch-numbering-guide.md   # 브랜치 넘버링 가이드
├── initiatives/                        # 분기별 Initiative 문서들
│   ├── 2024-q1/                       # Q1 Initiative들
│   │   ├── initiative-001-visual-platform.md
│   │   └── initiative-002-enhancement.md
│   ├── 2024-q2/                       # Q2 Initiative들
│   │   ├── initiative-003-advanced-features.md
│   │   └── initiative-004-market-readiness.md
│   └── 2024-q3/                       # Q3 Initiative들
│       └── initiative-005-ai-integration.md
├── epics/                             # Epic 문서들
│   ├── epic-001-workspace-structure.md
│   ├── epic-002-visual-canvas.md
│   ├── epic-003-component-system.md
│   └── epic-004-integration.md
├── stories/                           # Story 문서들
│   ├── workspace-structure/
│   │   ├── sprint-01-documentation.md
│   │   ├── sprint-02-documentation.md
│   │   ├── sprint-03-implementation.md
│   │   └── sprint-04-implementation.md
│   ├── visual-canvas/
│   │   ├── sprint-05-documentation.md
│   │   ├── sprint-06-documentation.md
│   │   ├── sprint-07-implementation.md
│   │   └── sprint-08-implementation.md
│   └── component-system/
│       ├── sprint-09-documentation.md
│       ├── sprint-10-documentation.md
│       ├── sprint-11-implementation.md
│       └── sprint-12-implementation.md
└── sprints/                           # Sprint 문서들
    ├── 2024-q1/                       # Q1 Sprint들
    │   ├── sprint-01-documentation-workspace.md
    │   ├── sprint-02-implementation-workspace.md
    │   └── sprint-03-documentation-canvas.md
    ├── 2024-q2/                       # Q2 Sprint들
    │   ├── sprint-04-implementation-canvas.md
    │   └── sprint-05-documentation-component.md
    └── 2024-q3/                       # Q3 Sprint들
        └── sprint-06-implementation-component.md
```

## 🎯 계층별 관리 체계

### 📊 **전체 프로젝트 관리 (3년)**
- **project-vision.md**: 프로젝트 비전, 전략적 목표, 핵심 가치 제안
- **annual-roadmap.md**: 연간 로드맵, 분기별 Initiative, 성공 지표

### 🎯 **분기별 Initiative 관리 (3개월)**
- **initiatives/2024-q1/**: Q1 Initiative들
- **initiatives/2024-q2/**: Q2 Initiative들
- **initiatives/2024-q3/**: Q3 Initiative들

### 🏗️ **Epic 관리 (2-6주)**
- **epics/**: 도메인별 Epic 문서들
- 각 Epic은 여러 Sprint에 걸쳐 구현

### 📝 **Story 관리 (1-3일)**
- **stories/**: 도메인별 Story 문서들
- Sprint별로 그룹화하여 관리

### 🚀 **Sprint 관리 (1-2주)**
- **sprints/2024-q1/**: 분기별 Sprint 문서들
- Documentation Sprint와 Implementation Sprint 구분

## 🎯 협업 방식

### 작성 및 관리 책임
- **프로젝트 비전**: CTO, CEO (연간 리뷰)
- **연간 로드맵**: PM, PO (분기별 리뷰)
- **Initiative**: PM (분기별 계획)
- **Epic**: PM (월별 계획)
- **Story**: PM + 개발팀 (주간 계획)
- **Sprint**: PM + 개발팀 (2주 단위)

### 업데이트 프로세스
1. **연간 리뷰**: 프로젝트 비전 및 연간 로드맵 검토
2. **분기별 리뷰**: Initiative 성과 분석 및 다음 분기 계획
3. **월별 리뷰**: Epic 진행 상황 및 우선순위 조정
4. **주간 리뷰**: Story 완료 상황 및 Sprint 계획
5. **일일 리뷰**: Sprint 진행 상황 및 장애물 해결

## 📋 가이드 문서 설명

### Project Vision 작성 가이드 (`00-project-vision-guide.md`) 🆕
- **목적**: 프로젝트 비전 및 3년 전략 수립 과정을 단계별로 안내
- **대상**: 주니어 PM (CTO, CEO 지원)
- **내용**: 프로젝트 비전 정의, 3년 전략적 목표 수립, 핵심 가치 제안, 기술 전략, 성공 지표 설정

### Annual Roadmap 작성 가이드 (`01-annual-roadmap-guide.md`) 🆕
- **목적**: 연간 로드맵 및 분기별 Initiative 계획 과정을 단계별로 안내
- **대상**: 주니어 PM (PO, 경영진 승인)
- **내용**: 연간 목표 설정, 분기별 Initiative 계획, 마일스톤 설정, 성공 지표, 리뷰 프로세스

### Initiative 설정 가이드 (`02-initiative-setup-guide.md`)
- **목적**: Initiative 설정 과정을 단계별로 안내
- **대상**: 주니어 PM
- **내용**: 비즈니스 목표 정의, Epic 목록 작성, 리스크 분석 등

### Event Storming 가이드 (`03-event-storming-guide.md`)
- **목적**: Event Storming 워크샵 진행 과정을 단계별로 안내
- **대상**: 주니어 PM + 도메인 전문가
- **내용**: 사전 준비, Event 식별, Context 정의, Epic 후보 도출

### Epic 계획 가이드 (`04-epic-planning-guide.md`)
- **목적**: Epic 계획 수립 과정을 단계별로 안내
- **대상**: 주니어 PM
- **내용**: Epic 후보 검토, 목표 설정, Story 목록 작성, 기술적 고려사항

### Story 정의 가이드 (`05-story-definition-guide.md`)
- **목적**: Story 정의 과정을 단계별로 안내
- **대상**: 주니어 PM + 개발팀
- **내용**: Story 후보 식별, User Story 작성, Acceptance Criteria, Command-Event 매핑

### Sprint 계획 가이드 (`06-sprint-planning-guide.md`)
- **목적**: Sprint 계획 수립 과정을 단계별로 안내
- **대상**: 주니어 PM + 개발팀
- **내용**: Sprint 목표 설정, Story 선택, 용량 계산, 일정 수립

### 브랜치 넘버링 가이드 (`07-branch-numbering-guide.md`)
- **목적**: 브랜치 넘버링 체계 설계 및 관리 과정을 단계별로 안내
- **대상**: 주니어 PM + 개발팀
- **내용**: 브랜치 유형 정의, 넘버링 규칙, 생명주기 관리

---

## 📋 각 문서의 역할

### 프로젝트 비전 (project-vision.md)
- **목적**: 프로젝트의 최상위 전략 및 비전
- **작성자**: CTO, CEO
- **주요 내용**:
  - 프로젝트 비전 및 미션
  - 3년 전략적 목표
  - 핵심 가치 제안
  - 기술 전략 및 아키텍처 원칙
  - 성공 지표 및 KPI

### 연간 로드맵 (annual-roadmap.md)
- **목적**: 연간 계획 및 분기별 Initiative 관리
- **작성자**: PM, PO
- **주요 내용**:
  - 분기별 Initiative 로드맵
  - 분기별 마일스톤 및 성공 지표
  - 리소스 할당 및 의존성 관리
  - 분기별 리뷰 및 조정 프로세스

### Initiative 문서들 (initiatives/)
- **목적**: 분기별 전략적 목표 달성
- **작성자**: PM
- **주요 내용**:
  - Initiative 목표 및 성공 지표
  - 포함될 Epic 목록
  - 분기별 마일스톤
  - 리스크 관리 및 대응 방안

### Epic 문서들 (epics/)
- **목적**: 도메인별 기능 완성
- **작성자**: PM
- **주요 내용**:
  - Epic Goal 및 Success Criteria
  - 포함될 Story 목록
  - 기술적 고려사항
  - 의존성 및 통합 포인트

### Story 문서들 (stories/)
- **목적**: 구체적인 구현 작업 정의
- **작성자**: PM + 개발팀
- **주요 내용**:
  - User Story 및 Acceptance Criteria
  - Command-Event 매핑
  - Technical Implementation Details
  - Sub-tasks 및 Definition of Done

### Sprint 문서들 (sprints/)
- **목적**: Sprint 목표 달성
- **작성자**: PM + 개발팀
- **주요 내용**:
  - Sprint 목표 및 성공 기준
  - 포함될 Story들
  - Sprint 일정 및 마일스톤
  - 진행 상황 추적 및 완료 기준

## 🎯 작업 체크리스트

### 연간 계획 수립 시
- [ ] 프로젝트 비전 검토 및 업데이트
- [ ] 시장 분석 및 경쟁사 동향 파악
- [ ] 기술 트렌드 분석 및 반영
- [ ] 연간 로드맵 수립 및 승인

### 분기별 Initiative 계획 시
- [ ] 분기별 목표 설정 및 성공 지표 정의
- [ ] 포함될 Epic 목록 작성 및 우선순위 설정
- [ ] 리소스 할당 및 팀 구성
- [ ] 의존성 분석 및 리스크 관리 계획

### Epic 계획 수립 시
- [ ] Epic Goal 및 Success Criteria 정의
- [ ] 포함될 Story 목록 작성
- [ ] 기술적 고려사항 및 아키텍처 설계
- [ ] 의존성 및 통합 포인트 분석

### Story 정의 시
- [ ] User Story 및 Acceptance Criteria 작성
- [ ] Command-Event 매핑 정의
- [ ] Technical Implementation Details 작성
- [ ] Sub-tasks 및 Definition of Done 정의

### Sprint 계획 수립 시
- [ ] Sprint 목표 설정
- [ ] Story 선택 및 우선순위 설정
- [ ] 팀 용량 계산 및 Story 용량 검증
- [ ] Sprint 일정 및 마일스톤 설정

## 📊 애자일 메트릭

### 연간 성과 측정
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **비전 달성도** | 80%+ | 전략적 목표 달성률 |
| **로드맵 준수도** | 90%+ | 계획 대비 실제 진행률 |
| **팀 생산성** | 20% 향상 | Sprint 완료율 및 품질 |
| **사용자 만족도** | 4.5/5.0 | 사용자 피드백 점수 |

### 분기별 성과 측정
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **Initiative 완료율** | 100% | 분기별 Initiative 완료율 |
| **Epic 완료율** | 90%+ | Epic 목표 달성률 |
| **Story 완료율** | 85%+ | Story 완료율 |
| **Sprint 완료율** | 80%+ | Sprint 목표 달성률 |

## 🤝 협업 가이드라인

### 문서 작성 표준
```markdown
# [문서 유형]: [제목]

## 🎯 [목적]
[문서의 목적과 범위]

## 📊 [주요 내용]
[핵심 내용 및 세부사항]

## 🎯 [성공 기준]
[완료 기준 및 측정 방법]

## 📁 [관련 문서]
[연관된 다른 문서들]
```

### 효과적인 계획 수립
1. **상위 계획 준수**: 상위 계획과의 일치성 유지
2. **현실적 목표**: 달성 가능한 현실적 목표 설정
3. **의존성 관리**: 의존성 분석 및 관리 계획
4. **지속적 리뷰**: 정기적인 리뷰 및 조정

## 📚 관련 문서

- **[상위 문서화 가이드](../../README.md)**: 전체 문서화 시스템 개요
- **[이벤트 도메인 디자인 가이드](../event-domain-design/README.md)**: 도메인별 설계 문서
- **[프로젝트 기술 디자인 가이드](../project-technical-design/README.md)**: 기술 아키텍처 문서

## 🎯 성공 지표

| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| **문서 완전성** | 95%+ | 모든 계층에 문서 작성 |
| **계획 일치성** | 90%+ | 상위 계획과의 일치성 |
| **실행 효율성** | 80%+ | 계획 대비 실행 효율성 |
| **팀 만족도** | 90%+ | 팀원 만족도 및 참여도 |

이 문서화 시스템을 통해 **체계적인 프로젝트 관리**와 **효율적인 애자일 개발**을 달성할 수 있습니다! 📋