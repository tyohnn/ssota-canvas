# Initiative 설정 가이드

이 가이드는 주니어 PM이 **Initiative**를 설정하는 전체 과정을 단계별로 안내합니다.

## 🎯 Initiative란?

**Initiative**는 전략적 비즈니스 목표를 달성하기 위한 최상위 계획 단위입니다.

### 특징
- **범위**: 여러 Epic을 포함하는 큰 비즈니스 목표
- **기간**: 분기 단위 (3-6개월)
- **KPI 연결**: 직접적인 비즈니스 지표와 연결
- **DDD 연결**: Cross-context journey 전체

---

## 📋 Step 0: 현재 날짜 확인

### 0.1 작업 시작 전 날짜 확인
```bash
# 현재 날짜 확인
date

# 예시 출력: Sun Sep 28 15:56:33 KST 2025
```

**날짜 확인 목적:**
- 현재 시점 파악으로 적절한 계획 수립
- 분기별 Initiative 계획 시 정확한 타임라인 설정
- 연간 로드맵과의 일치성 확인

---

## 📋 Step 1: 비즈니스 목표 정의

### 1.1 비즈니스 문제 파악
```
❓ 질문: "우리가 해결하고자 하는 핵심 비즈니스 문제는 무엇인가?"
```

**체크리스트:**
- [ ] 현재 상황과 이상적 상황의 차이점 파악
- [ ] 이 문제가 해결되면 어떤 가치가 창출되는지 명확화
- [ ] 문제의 규모와 영향 범위 측정

**예시:**
```
현재: 사용자가 시각적 디자인을 만들기 위해 여러 도구를 번갈아 사용
문제: 도구 간 데이터 전송이 번거롭고 일관성 부족
이상: 하나의 통합된 플랫폼에서 모든 디자인 작업 완료
가치: 작업 시간 50% 단축, 디자인 품질 향상
```

### 1.2 성공 지표 정의
```
❓ 질문: "이 Initiative가 성공했다고 판단할 수 있는 구체적인 지표는?"
```

**KPI 설정 템플릿:**
```
주요 KPI: [정량적 지표]
- 목표값: [구체적 수치]
- 측정 방법: [어떻게 측정할 것인가]
- 측정 주기: [언제 측정할 것인가]

보조 KPI: [정성적 지표]
- 목표값: [구체적 기준]
- 측정 방법: [어떻게 측정할 것인가]
```

**예시:**
```
주요 KPI: 사용자 작업 시간 단축
- 목표값: 디자인 작업 시간 50% 단축 (2시간 → 1시간)
- 측정 방법: 사용자 행동 분석 도구로 작업 시간 측정
- 측정 주기: 월간

보조 KPI: 사용자 만족도
- 목표값: NPS 점수 70점 이상
- 측정 방법: 사용자 설문조사
- 측정 주기: 분기별
```

---

## 📋 Step 2: Initiative 범위 정의

### 2.1 도메인/기능 영역 분류
```
❓ 질문: "이 Initiative를 달성하기 위해 어떤 도메인/기능 영역들이 필요한가?"
```

**도메인 식별 과정:**
1. **사용자 여정 매핑**: 사용자가 목표를 달성하기까지 거치는 단계들
2. **기능 영역 그룹핑**: 관련된 기능들을 도메인별로 논리적으로 묶기
3. **도메인 간 관계 분석**: 어떤 도메인이 다른 도메인에 의존하는지 파악
4. **Event Storming 순서 계획**: 도메인별 Event Storming 진행 순서 결정

**⚠️ 중요: 도메인 정의 수준**
Initiative 단계에서는 도메인/기능 영역을 **개념적 수준**에서만 정의합니다:
- **목적**: Event Storming을 위한 도메인 경계 설정
- **수준**: 각 도메인의 대략적인 책임과 역할 정의
- **상세도**: Event Storming에서 구체적인 모델링을 위한 가이드라인 제공

**도메인/기능 영역 정의 예시:**
```
Initiative: "AI 통합 화이트보드 플랫폼 구축"

Domain 1: 사용자 관리 도메인 (User Management Domain)
- 책임: 사용자 인증, 조직 관리, 권한 제어
- 핵심 개념: User, Organization, Permission, Role
- Event Storming 우선순위: 1순위 (기반 도메인)

Domain 2: 워크스페이스 구조 도메인 (Workspace Structure Domain)
- 책임: 워크스페이스, 페이지, 폴더 구조 관리
- 핵심 개념: Workspace, Page, Folder, Navigation
- Event Storming 우선순위: 2순위 (사용자 관리 의존)

Domain 3: 시각적 캔버스 도메인 (Visual Canvas Domain)
- 책임: 화이트보드 엔진, 캔버스 조작, 화면 렌더링
- 핵심 개념: Canvas, Viewport, Zoom, Selection
- Event Storming 우선순위: 3순위 (워크스페이스 구조 의존)

Domain 4: 블록 시스템 도메인 (Block System Domain)
- 책임: 블록 생성/편집/삭제, 블록 타입 관리, 속성 시스템
- 핵심 개념: Block, BlockType, Property, Content
- Event Storming 우선순위: 4순위 (시각적 캔버스 의존)

Domain 5: 컴포넌트 시스템 도메인 (Component System Domain)
- 책임: 컴포넌트 정의, 인스턴스 관리, 보기 모드 변환
- 핵심 개념: Component, Instance, ViewMode, Template
- Event Storming 우선순위: 5순위 (블록 시스템 의존)

Domain 6: AI 통합 도메인 (AI Integration Domain)
- 책임: AI API 연동, AI 요청/응답 처리, AI 기능 제공
- 핵심 개념: AIRequest, AIResponse, AIAgent, AITool
- Event Storming 우선순위: 6순위 (모든 도메인과 연동)
```

**Epic은 Event Storming 이후에 정의:**
- 각 도메인별 Event Storming 완료 후 구체적인 Epic 도출
- Command-Event-Aggregate 기반으로 실행 가능한 Epic 정의
- 도메인 간 통합 Epic도 필요시 추가

### 2.2 제외 범위 명확화
```
❓ 질문: "이 Initiative에 포함되지 않을 기능들은?"
```

**제외 범위 정의:**
- [ ] 명확히 포함되지 않는 기능들 나열
- [ ] 향후 Initiative에서 다룰 기능들 식별
- [ ] 기술적 제약으로 인해 제외되는 기능들

---

## 📋 Step 3: Initiative 문서 작성

### 3.1 Initiative 문서 템플릿

```markdown
# Initiative-[번호]: [Initiative 제목]

## 🎯 Initiative 개요
**목표**: [한 줄로 표현한 핵심 목표]
**기간**: [시작일] ~ [종료일]
**주요 KPI**: [핵심 성공 지표]

## 📊 비즈니스 가치
**문제**: [해결하고자 하는 비즈니스 문제]
**해결책**: [제안하는 해결 방안]
**기대 효과**: [예상되는 비즈니스 가치]

## 🎯 성공 지표
### 주요 KPI
- [KPI 1]: [목표값] ([측정 방법])
- [KPI 2]: [목표값] ([측정 방법])

### 보조 KPI
- [KPI 1]: [목표값] ([측정 방법])
- [KPI 2]: [목표값] ([측정 방법])

## 🏛️ 도메인/기능 영역 분류
### Domain 1: [도메인명] ([영문명])
- **책임**: [도메인의 주요 책임과 역할]
- **핵심 개념**: [주요 엔티티, 값 객체 후보들]
- **Event Storming 우선순위**: [순위] ([의존성 이유])

### Domain 2: [도메인명] ([영문명])
- **책임**: [도메인의 주요 책임과 역할]
- **핵심 개념**: [주요 엔티티, 값 객체 후보들]
- **Event Storming 우선순위**: [순위] ([의존성 이유])

### Domain 3: [도메인명] ([영문명])
- **책임**: [도메인의 주요 책임과 역할]
- **핵심 개념**: [주요 엔티티, 값 객체 후보들]
- **Event Storming 우선순위**: [순위] ([의존성 이유])

**참고**: Epic의 구체적인 정의는 각 도메인별 Event Storming 이후 Epic Planning에서 진행

## 🚫 제외 범위
- [제외 기능 1]: [제외 이유]
- [제외 기능 2]: [제외 이유]

## 🔗 의존성
**외부 의존성**: [외부 시스템, 팀, 리소스]
**내부 의존성**: [다른 Initiative, 인프라]

## 📅 마일스톤
- [마일스톤 1]: [날짜] - [달성 목표]
- [마일스톤 2]: [날짜] - [달성 목표]
- [마일스톤 3]: [날짜] - [달성 목표]

## 🎯 완료 기준
- [ ] 모든 Epic 완료
- [ ] 주요 KPI 달성
- [ ] 사용자 피드백 수집 및 분석
- [ ] 다음 Initiative 계획 수립
```

### 3.2 문서 작성 체크리스트

**완성도 검증:**
- [ ] 비즈니스 목표가 명확하고 측정 가능한가?
- [ ] 성공 지표가 구체적이고 달성 가능한가?
- [ ] 포함될 Epic들이 논리적으로 연결되어 있는가?
- [ ] 제외 범위가 명확한가?
- [ ] 의존성이 식별되고 관리 계획이 있는가?

---

## 📋 Step 4: 이해관계자 승인

### 4.1 승인 대상자
- **PO (Product Owner)**: 제품 전략 관점에서 승인
- **기획자**: 비즈니스 요구사항 관점에서 승인
- **시니어 개발자**: 기술적 실현 가능성 검토
- **경영진**: 비즈니스 가치 및 투자 대비 효과 검토

### 4.2 승인 프로세스
1. **초안 검토**: 이해관계자들에게 초안 공유
2. **피드백 수집**: 각 관점에서의 의견 수렴
3. **수정 및 보완**: 피드백 반영하여 문서 개선
4. **최종 승인**: 모든 이해관계자의 승인 확보

### 4.3 승인 체크리스트
- [ ] PO가 제품 전략과 일치함을 승인
- [ ] 기획자가 비즈니스 요구사항 충족을 승인
- [ ] 시니어 개발자가 기술적 실현 가능성을 승인
- [ ] 경영진이 비즈니스 가치를 승인

---

## 📋 Step 5: 다음 단계 준비

### 5.1 Event Storming 준비 (중요한 다음 단계)
Initiative에서 정의한 **도메인/기능 영역들을 구체화**하기 위해 도메인별 Event Storming을 진행합니다.

**Event Storming의 목적:**
- Initiative의 도메인/기능 영역을 Command-Event-Aggregate로 구체화
- Bounded Context 정의 및 도메인 모델링
- 각 도메인별 실행 가능한 Epic 도출

**준비 사항:**
- [ ] 각 도메인별 Event Storming 일정 수립 (우선순위 순서대로)
- [ ] 도메인별 참가자 확정 (도메인 전문가, 개발자, 기획자)
- [ ] Event Storming 도구 및 환경 준비
- [ ] 사전 자료 준비 (Initiative 문서, 도메인/기능 영역 분류)
- [ ] 도메인 간 의존성 맵핑 완료

**도메인별 Event Storming 순서:**
1. **기반 도메인**: 다른 도메인이 의존하는 기본 도메인
2. **핵심 도메인**: 비즈니스 가치를 직접 창출하는 도메인  
3. **지원 도메인**: 핵심 도메인을 보조하는 도메인
4. **통합 도메인**: 도메인 간 연동을 담당하는 도메인

**프로세스 플로우:**
```
Initiative 설정 (도메인/기능 영역 분류) 
    ↓
도메인별 Event Storming (우선순위 순서)
    ↓  
Epic Planning (도메인별 구체적 Epic 정의)
    ↓
Story Definition (실행 가능한 Story)
```

### 5.2 문서 저장 및 공유
- [ ] Initiative 문서를 `agile-planning/initiatives/` 폴더에 저장
- [ ] 팀 전체에 Initiative 내용 공유
- [ ] 관련 문서들과 링크 연결

---

## 🎯 완료 기준

Initiative 설정이 완료되었다고 판단할 수 있는 기준:

- [ ] **명확한 비즈니스 목표**: 한 줄로 표현 가능한 핵심 목표
- [ ] **측정 가능한 성공 지표**: 구체적이고 달성 가능한 KPI
- [ ] **논리적 도메인 분류**: 목표 달성을 위한 필수 도메인/기능 영역 식별
- [ ] **도메인 간 의존성 정의**: 각 도메인의 우선순위와 의존관계 명확화
- [ ] **이해관계자 승인**: 모든 관련자들의 승인 확보
- [ ] **Event Storming 준비**: 도메인별 Event Storming을 위한 준비 완료

---

## 🔧 Git 워크플로우

### 브랜치 생성 및 작업
```bash
# 1. 메인 브랜치에서 최신 상태로 업데이트
git checkout dev
git pull origin dev

# 2. Initiative 계획 작업
# - Initiative 문서 작성
# - 비즈니스 가치 분석
# - Epic 목록 작성
# - 마일스톤 계획 수립
```

### 커밋 메시지 규칙
```bash
# Initiative 문서 작성
git add .
git commit -m "docs(initiative): add initiative-001-visual-platform document

- Define business goals and success metrics
- List included epics (workspace, canvas, component, integration)
- Set milestones and completion criteria
- Analyze dependencies and risks"

# 비즈니스 가치 분석 추가
git add .
git commit -m "docs(initiative): add business value analysis

- ROI calculation and business impact
- User value proposition definition
- Competitive analysis and market positioning
- Risk assessment and mitigation plan"

# Epic 목록 작성
git add .
git commit -m "docs(initiative): add epic list and dependencies

- Epic 001: Workspace Structure Domain
- Epic 002: Visual Canvas Domain  
- Epic 003: Component System Domain
- Epic 004: Integration & Advanced Features
- Define epic dependencies and sequence"
```

### GitHub에 푸시
```bash
# 1. dev 브랜치에 직접 푸시
git push origin dev
```

### PR 리뷰 체크리스트
**리뷰어가 확인할 사항:**
- [ ] **비즈니스 목표 명확성**: Initiative 목표가 명확하고 측정 가능한가?
- [ ] **성공 지표 적절성**: KPI가 구체적이고 달성 가능한가?
- [ ] **Epic 구성 논리성**: 포함된 Epic들이 목표 달성에 기여하는가?
- [ ] **의존성 분석**: 의존성이 올바르게 식별되고 관리 계획이 있는가?
- [ ] **리스크 관리**: 주요 리스크가 식별되고 대응 방안이 있는가?

**승인 기준:**
- [ ] PO가 제품 전략과 일치함을 승인
- [ ] 기획자가 비즈니스 요구사항 충족을 승인
- [ ] 시니어 개발자가 기술적 실현 가능성을 승인
- [ ] 경영진이 비즈니스 가치를 승인

### 다음 단계 준비
```bash
# 1. 다음 단계 준비
# - Event Storming 일정 수립
# - Epic 계획 수립 시작
# - 팀 공유 및 승인 완료
```

---

## 📚 관련 문서

- [Epic 계획 가이드](./03-epic-planning-guide.md)
- [Story 정의 가이드](./04-story-definition-guide.md)

---

이 가이드를 따라하면 주니어 PM도 체계적으로 Initiative를 설정할 수 있습니다! 🚀
