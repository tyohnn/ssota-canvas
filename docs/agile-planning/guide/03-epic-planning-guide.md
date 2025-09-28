# Epic 계획 가이드

이 가이드는 주니어 PM이 **Epic**을 계획하고 정의하는 전체 과정을 단계별로 안내합니다.

## 🎯 Epic이란?

**Epic**은 하나의 비즈니스 가치 흐름(end-to-end journey)을 완성하는 기능 묶음입니다.

### 특징
- **범위**: 하나의 사용자 여정/비즈니스 흐름
- **기간**: 2-6주 단위
- **KPI 연결**: 부분적 KPI 기여
- **DDD 연결**: 보통 한 process lane / 여러 Context

---

## 📋 Step 0: 현재 날짜 확인

### 0.1 작업 시작 전 날짜 확인
```bash
# 현재 날짜 확인
date

# 예시 출력: Sun Sep 28 15:56:33 KST 2025
```

**날짜 확인 목적:**
- 현재 시점 파악으로 적절한 Epic 계획 수립
- 분기별 Initiative와의 일치성 확인
- Epic 기간(2-6주) 설정 시 정확한 타임라인 계산

---

## 📋 Step 1: Epic 후보 검토

### 1.1 Event Storming 결과 분석
Event Storming에서 도출된 Context별 Epic 후보들을 검토합니다.

**분석 체크리스트:**
- [ ] 각 Context별 핵심 사용자 여정 파악
- [ ] Context 간 의존성 관계 파악
- [ ] 각 Epic의 비즈니스 가치 평가
- [ ] 기술적 복잡도 예상

### 1.2 Epic 우선순위 설정

**우선순위 평가 기준:**

| 기준 | 가중치 | 평가 방법 |
|------|--------|-----------|
| **비즈니스 가치** | 40% | 사용자에게 미치는 영향도 |
| **기술적 복잡도** | 30% | 구현 난이도 및 리소스 |
| **의존성** | 20% | 다른 Epic에 미치는 영향 |
| **위험도** | 10% | 실패 시 영향도 |

**우선순위 매트릭스:**
```
High Value + Low Complexity = 최우선
High Value + High Complexity = 고려 필요
Low Value + Low Complexity = 나중에
Low Value + High Complexity = 제외 고려
```

---

## 📋 Step 2: Epic 상세 정의

### 2.1 Epic Goal 설정

**Epic Goal 작성 규칙:**
- **사용자 관점**: 사용자가 달성할 수 있는 목표
- **측정 가능**: 완료 여부를 명확히 판단 가능
- **구체적**: 모호하지 않은 명확한 표현

**Epic Goal 템플릿:**
```
As a [사용자 유형], I want to [원하는 기능] so that [달성하고자 하는 가치]
```

**예시:**
```
As a 디자이너, I want to 워크스페이스를 생성하고 관리할 수 있어야 so that 프로젝트를 체계적으로 조직화할 수 있다
```

### 2.2 Success Criteria 정의

**성공 기준 설정:**
- [ ] **기능적 기준**: 어떤 기능이 완성되어야 하는가?
- [ ] **성능 기준**: 어떤 성능 수준을 달성해야 하는가?
- [ ] **사용성 기준**: 사용자가 얼마나 쉽게 사용할 수 있는가?
- [ ] **품질 기준**: 어떤 품질 수준을 유지해야 하는가?

**성공 기준 템플릿:**
```
기능적 기준:
- [ ] [기능 1]: [구체적 완료 조건]
- [ ] [기능 2]: [구체적 완료 조건]

성능 기준:
- [ ] [성능 지표 1]: [목표값]
- [ ] [성능 지표 2]: [목표값]

사용성 기준:
- [ ] [사용성 지표 1]: [목표값]
- [ ] [사용성 지표 2]: [목표값]

품질 기준:
- [ ] [품질 지표 1]: [목표값]
- [ ] [품질 지표 2]: [목표값]
```

### 2.3 Epic 범위 정의

**포함 범위:**
- [ ] **핵심 기능**: Epic의 핵심이 되는 주요 기능들
- [ ] **지원 기능**: 핵심 기능을 지원하는 부가 기능들
- [ ] **통합 기능**: 다른 시스템과의 연동 기능들

**제외 범위:**
- [ ] **명시적 제외**: 이 Epic에 포함되지 않는 기능들
- [ ] **향후 계획**: 다음 Epic에서 다룰 기능들
- [ ] **기술적 제약**: 현재 기술로 구현 불가능한 기능들

---

## 📋 Step 3: Epic 문서 작성

### 3.1 Epic 문서 템플릿

```markdown
# Epic-[번호]: [Epic 제목]

## 🎯 Epic 개요
**Epic Goal**: [사용자 관점의 목표]
**기간**: [시작일] ~ [종료일]
**Story Points**: [예상 포인트]
**우선순위**: [High/Medium/Low]

## 📊 비즈니스 가치
**문제**: [해결하고자 하는 비즈니스 문제]
**해결책**: [제안하는 해결 방안]
**기대 효과**: [예상되는 비즈니스 가치]

## 🎯 성공 기준
### 기능적 기준
- [ ] [기능 1]: [구체적 완료 조건]
- [ ] [기능 2]: [구체적 완료 조건]

### 성능 기준
- [ ] [성능 지표 1]: [목표값]
- [ ] [성능 지표 2]: [목표값]

### 사용성 기준
- [ ] [사용성 지표 1]: [목표값]
- [ ] [사용성 지표 2]: [목표값]

### 품질 기준
- [ ] [품질 지표 1]: [목표값]
- [ ] [품질 지표 2]: [목표값]

## 📋 포함 기능
### 핵심 기능
- [기능 1]: [설명]
- [기능 2]: [설명]

### 지원 기능
- [기능 1]: [설명]
- [기능 2]: [설명]

### 통합 기능
- [기능 1]: [설명]
- [기능 2]: [설명]

## 🚫 제외 범위
- [제외 기능 1]: [제외 이유]
- [제외 기능 2]: [제외 이유]

## 🔗 의존성
**선행 Epic**: [이 Epic을 위해 먼저 완료되어야 하는 Epic]
**후행 Epic**: [이 Epic 완료 후 진행할 Epic]
**외부 의존성**: [외부 시스템, 팀, 리소스]

## 🏗️ 기술적 고려사항
### 아키텍처
- [기술적 요구사항 1]
- [기술적 요구사항 2]

### 성능
- [성능 요구사항 1]
- [성능 요구사항 2]

### 보안
- [보안 요구사항 1]
- [보안 요구사항 2]

## 📅 마일스톤
- [마일스톤 1]: [날짜] - [달성 목표]
- [마일스톤 2]: [날짜] - [달성 목표]
- [마일스톤 3]: [날짜] - [달성 목표]

## 🎯 완료 기준
- [ ] 모든 핵심 기능 완료
- [ ] 성공 기준 달성
- [ ] 사용자 테스트 통과
- [ ] 다음 Epic 준비 완료

## 📁 관련 문서
- [Event Storming 결과](../event-domain-design/domains/[domain]/event-storm.md)
- [Process Model](../event-domain-design/domains/[domain]/process-model.md)
- [Software Design](../event-domain-design/domains/[domain]/software-design.md)
```

### 3.2 문서 작성 체크리스트

**완성도 검증:**
- [ ] Epic Goal이 사용자 관점에서 명확한가?
- [ ] 성공 기준이 측정 가능하고 구체적인가?
- [ ] 포함/제외 범위가 명확한가?
- [ ] 의존성이 식별되고 관리 계획이 있는가?
- [ ] 기술적 고려사항이 충분히 검토되었는가?

---

## 📋 Step 4: Epic 검증 및 승인

### 4.1 내부 검증

**검증 항목:**
- [ ] **비즈니스 가치**: 명확한 비즈니스 가치 제공
- [ ] **완결성**: 독립적으로 완료 가능한 기능
- [ ] **측정 가능성**: 완료 여부를 명확히 판단 가능
- [ ] **적절한 크기**: 2-6주 내 완료 가능한 범위
- [ ] **기술적 실현 가능성**: 현재 기술로 구현 가능

### 4.2 이해관계자 검토

**검토 대상자:**
- **PO**: 제품 전략과의 일치성 검토
- **기획자**: 사용자 요구사항 충족 검토
- **시니어 개발자**: 기술적 실현 가능성 검토
- **도메인 전문가**: 비즈니스 요구사항 정확성 검토

### 4.3 피드백 수집 및 반영

**피드백 수집 과정:**
1. **초안 공유**: 이해관계자들에게 Epic 문서 공유
2. **피드백 수집**: 각 관점에서의 의견 수렴
3. **수정 및 보완**: 피드백 반영하여 문서 개선
4. **최종 승인**: 모든 이해관계자의 승인 확보

---

## 📋 Step 5: Story 정의 준비

### 5.1 Story 후보 도출

**Story 식별 과정:**
1. **사용자 여정 분석**: Epic 내 사용자 여정을 세분화
2. **기능 분해**: 큰 기능을 작은 단위로 분해
3. **Command-Event 매핑**: 각 기능의 Command-Event 쌍 식별
4. **의존성 분석**: Story 간 의존성 관계 파악

### 5.2 Story 우선순위 설정

**우선순위 기준:**
- **사용자 가치**: 사용자에게 미치는 영향도
- **기술적 복잡도**: 구현 난이도
- **의존성**: 다른 Story에 미치는 영향
- **위험도**: 실패 시 영향도

### 5.3 Story 정의 일정 수립

**일정 계획:**
- [ ] Story 정의 워크샵 일정 수립
- [ ] 참가자 확정 (개발팀, 기획자, 도메인 전문가)
- [ ] Story 정의 도구 및 환경 준비
- [ ] 사전 자료 준비 (Epic 문서, 기술적 요구사항)

---

## 📋 Step 6: 문서 저장 및 공유

### 6.1 문서 저장
- [ ] Epic 문서를 `agile-planning/epics/` 폴더에 저장
- [ ] 파일명 규칙: `epic-[번호]-[도메인명].md`
- [ ] 관련 문서들과 링크 연결

### 6.2 팀 공유
- [ ] 팀 전체에 Epic 내용 공유
- [ ] Epic 우선순위 및 일정 공유
- [ ] Story 정의 일정 공유

---

## 🎯 완료 기준

Epic 계획이 완료되었다고 판단할 수 있는 기준:

- [ ] **명확한 Epic Goal**: 사용자 관점에서 명확한 목표
- [ ] **측정 가능한 성공 기준**: 구체적이고 달성 가능한 기준
- [ ] **명확한 범위**: 포함/제외 범위가 명확히 정의됨
- [ ] **의존성 관리**: 선행/후행 Epic 및 외부 의존성 식별
- [ ] **이해관계자 승인**: 모든 관련자들의 승인 확보
- [ ] **Story 정의 준비**: Story 정의를 위한 준비 완료

---

## 📚 관련 문서

- [Story 정의 가이드](./04-story-definition-guide.md)
- [Sprint 계획 가이드](./05-sprint-planning-guide.md)

---

## 💡 팁과 주의사항

### 성공적인 Epic 계획을 위한 팁
- **사용자 관점 유지**: 기술적 세부사항보다는 사용자 가치에 집중
- **적절한 크기**: 너무 크거나 작지 않은 적절한 범위 설정
- **의존성 관리**: 다른 Epic과의 의존성을 미리 파악하고 관리
- **유연성 유지**: 변경 가능성을 고려한 계획 수립

### 주의사항
- **과도한 세분화 피하기**: Story 수준의 세부사항은 Story 정의 단계에서
- **기술적 제약 고려**: 현재 기술 수준과 리소스를 고려한 현실적 계획
- **변경 관리**: Epic 변경 시 영향 범위 분석 및 관련자 공유

---

## 🔧 Git 워크플로우

### 브랜치 생성 및 작업
```bash
# 1. 메인 브랜치에서 최신 상태로 업데이트
git checkout dev
git pull origin dev

# 2. Epic 브랜치 생성
git checkout -b epic/001-workspace-structure

# 3. Epic 계획 작업
# - Epic Goal 및 Success Criteria 정의
# - 포함될 Story 목록 작성
# - 기술적 고려사항 정의
# - 의존성 및 리스크 분석
```

### 커밋 메시지 규칙
```bash
# Epic 문서 작성
git add .
git commit -m "docs(epic): add epic-001-workspace-structure document

- Define epic goal and success criteria
- Set business value and expected outcomes
- List included stories and technical considerations
- Analyze dependencies and risks"

# Story 목록 작성
git add .
git commit -m "docs(epic): add story list and dependencies

- Story WS-001: Organization Management (8pts)
- Story WS-002: Workspace Creation & Management (5pts)
- Story WS-003: Page Hierarchy Management (8pts)
- Define story dependencies and sequence"

# 기술적 고려사항 추가
git add .
git commit -m "docs(epic): add technical considerations and architecture

- DDD patterns: Aggregate, Entity, Value Object
- Event Sourcing and CQRS implementation
- Clerk integration and authentication
- Database schema and performance optimization"
```

### GitHub에 푸시 및 PR 생성
```bash
# 1. 브랜치를 GitHub에 푸시
git push origin epic/001-workspace-structure

# 2. GitHub에서 Pull Request 생성
# - 제목: "Epic 001: Workspace Structure Domain"
# - 설명: Epic 계획 및 Story 정의
# - 리뷰어: PO, 기획자, 시니어 개발자, 도메인 전문가
# - 라벨: epic, planning, workspace-structure
```

### PR 리뷰 체크리스트
**리뷰어가 확인할 사항:**
- [ ] **Epic Goal 명확성**: Epic 목표가 사용자 관점에서 명확한가?
- [ ] **성공 기준 적절성**: 성공 기준이 측정 가능하고 달성 가능한가?
- [ ] **Story 구성 논리성**: 포함된 Story들이 Epic 목표 달성에 기여하는가?
- [ ] **기술적 실현 가능성**: 현재 기술로 구현 가능한가?
- [ ] **의존성 관리**: 선행/후행 Epic 및 외부 의존성이 올바르게 식별되었는가?

**승인 기준:**
- [ ] PO가 제품 전략과 일치함을 승인
- [ ] 기획자가 사용자 요구사항 충족을 승인
- [ ] 시니어 개발자가 기술적 실현 가능성을 승인
- [ ] 도메인 전문가가 비즈니스 요구사항 정확성을 승인

### PR 병합 후 정리
```bash
# 1. PR 병합 후 로컬에서 정리
git checkout dev
git pull origin dev
git branch -d epic/001-workspace-structure

# 2. 다음 단계 준비
# - Story 정의 시작
# - Sprint 계획 수립
# - 개발팀 리소스 할당
```

---

이 가이드를 따라하면 주니어 PM도 체계적으로 Epic을 계획할 수 있습니다! 🚀
