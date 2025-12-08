# Story 정의 가이드

이 가이드는 주니어 PM이 **Story**를 정의하는 전체 과정을 단계별로 안내합니다.

## 🎯 Story란?

**Story**는 단일 도메인 동작(Command→Event)을 완성하는 개발 과제입니다.

### 특징
- **범위**: 단일 도메인 동작(Command→Event)
- **기간**: 1-3일
- **KPI 연결**: Epic 완료의 구성요소
- **DDD 연결**: 한 Aggregate 안의 Command-Event 쌍

---

## 📋 Step 0: 현재 날짜 확인

### 0.1 작업 시작 전 날짜 확인
```bash
# 현재 날짜 확인
date

# 예시 출력: Sun Sep 28 15:56:33 KST 2025
```

**날짜 확인 목적:**
- 현재 시점 파악으로 적절한 Story 정의 수립
- Epic과의 일치성 확인
- Story 기간(1-3일) 설정 시 정확한 타임라인 계산

---

## 📋 Step 1: Story 후보 식별

### 1.1 Epic 분석
Epic에서 Story 후보들을 식별합니다.

**분석 과정:**
1. **사용자 여정 세분화**: Epic 내 사용자 여정을 작은 단위로 분해
2. **기능 분해**: 큰 기능을 구현 가능한 작은 단위로 분해
3. **Command-Event 매핑**: 각 기능의 Command-Event 쌍 식별
4. **의존성 분석**: Story 간 의존성 관계 파악

### 1.2 Story 식별 기준

**Story가 되기 위한 조건:**
- [ ] **사용자 가치**: 사용자에게 명확한 가치 제공
- [ ] **완결성**: 독립적으로 완료 가능한 기능
- [ ] **측정 가능성**: 완료 여부를 명확히 판단 가능
- [ ] **적절한 크기**: 1-3일 내 완료 가능한 범위
- [ ] **Command-Event 쌍**: 명확한 Command와 Event 정의

### 1.3 Story 후보 검증

**검증 체크리스트:**
- [ ] **비즈니스 가치**: 사용자에게 실제 가치 제공
- [ ] **기술적 실현 가능성**: 현재 기술로 구현 가능
- [ ] **의존성 관리**: 다른 Story와의 의존성 명확
- [ ] **테스트 가능성**: 완료 여부를 테스트로 검증 가능

---

## 📋 Step 2: Story 상세 정의

### 2.1 User Story 작성

**User Story 템플릿:**
```
As a [사용자 유형], I want to [원하는 기능] so that [달성하고자 하는 가치]
```

**작성 규칙:**
- **사용자 관점**: 사용자가 원하는 것을 명확히 표현
- **구체적**: 모호하지 않은 명확한 표현
- **가치 중심**: 사용자가 얻을 수 있는 가치 명시

**예시:**
```
As a 디자이너, I want to 워크스페이스를 생성할 수 있어야 so that 새로운 프로젝트를 시작할 수 있다
```

### 2.2 Acceptance Criteria 작성

**Acceptance Criteria 작성 방법:**
1. **Given-When-Then 형식 사용**: 명확한 시나리오 정의
2. **구체적 조건**: 모호하지 않은 명확한 조건
3. **측정 가능**: 완료 여부를 명확히 판단 가능
4. **테스트 가능**: 자동화된 테스트로 검증 가능

**Acceptance Criteria 템플릿:**
```gherkin
Feature: [기능명]
  Scenario: [시나리오명]
    Given [전제 조건]
    When [행동]
    Then [예상 결과]
    And [추가 조건]
```

**예시:**
```gherkin
Feature: 워크스페이스 생성
  Scenario: 빈 워크스페이스 생성
    Given 사용자가 로그인되어 있다
    When 워크스페이스 생성 버튼을 클릭한다
    Then 워크스페이스가 생성된다
    And 기본 페이지가 자동으로 생성된다
    And 사용자에게 워크스페이스 접근 권한이 부여된다
```

### 2.3 도메인 식별 및 참조 설정

**도메인 식별:**
1. **관련 도메인 파악**: Story가 영향을 주는 도메인들 식별
2. **주 도메인 결정**: Story의 주요 책임을 가진 도메인 선정
3. **통합 도메인 파악**: 연동이 필요한 다른 도메인들 식별
4. **참조 문서 확인**: 각 도메인의 Technical Specification, Database Schema, Frontend Specification 확인

**도메인 식별 예시:**
- **주 도메인**: Organization Management Domain (초대 생성, 멤버 관리)
- **통합 도메인**: Notification Management Domain (알림 생성), User Management Domain (프로필 조회)
- **참조 문서**: 
  - Technical Specification (구현 가이드)
  - Database Schema (테이블 구조)
  - Frontend Specification (UI 컴포넌트)
  - Software Design (Aggregate, Command, Event 정의)
  - Testing Strategy (테스트 전략)

---

## 📋 Step 3: Story 문서 작성

### 3.1 Story 문서 템플릿 (간결한 버전)

```markdown
# Story E[EPIC번호]-[순번]: [Story 제목]

## 🎯 Story 개요
**User Story**: As a [사용자] I want to [기능] so that [가치]

**Story Points**: [포인트]  
**우선순위**: [High/Medium/Low]  
**Epic**: [연관 Epic]  
**Domain**: [관련 도메인들]

**Story ID 규칙**: `E[EPIC번호]-[순번]` 형식 사용
- 예시: `E005-001` (Epic-005의 첫 번째 Story)
- Epic 번호만으로 명확하게 식별 가능
- 도메인 정보는 Epic 문서에서 확인

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: [시나리오명]
```gherkin
Given [전제 조건]
When [행동]
Then [예상 결과]
And [추가 조건]
```

### 시나리오 2: [시나리오명]
```gherkin
Given [전제 조건]
When [행동]
Then [예상 결과]
And [추가 조건]
```

## 📋 개발 Task (도메인별)

### [Domain Name 1]
**참조 문서**: [Technical Specification](링크), [Database Schema](링크), [Frontend Specification](링크)

#### Backend Implementation
- [ ] [Aggregate명] 구현 (핵심 로직)
- [ ] [Entity명] 구현
- [ ] [ValueObject명] 구현
- [ ] Commands 정의 ([Command1], [Command2])
- [ ] Events 정의 ([Event1], [Event2])
- [ ] Repository 구현

#### Database
- [ ] [테이블명] 테이블 생성 (Drizzle migration)
- [ ] [enum명] enum 생성
- [ ] RLS 정책 적용

#### Server Actions
- [ ] [action1]Action (간단한 설명)
- [ ] [action2]Action (간단한 설명)

#### Frontend
- [ ] [Component1] 컴포넌트 (간단한 설명)
- [ ] [Component2] 컴포넌트 (간단한 설명)
- [ ] [Context명] 및 [Hook명]

---

### [Domain Name 2] (통합 도메인인 경우)
**참조 문서**: [Technical Specification](링크), [Database Schema](링크), [Frontend Specification](링크)

#### Backend Implementation
- [ ] ...

---

### 도메인 간 통합
- [ ] Domain1 → Domain2 연동
- [ ] 권한 검증 로직
- [ ] 기타 통합 로직

---

### Testing & Quality
- [ ] Unit Tests ([테스트 대상])
- [ ] Integration Tests ([테스트 범위])
- [ ] E2E Tests ([전체 플로우])
- [ ] 성능 테스트 ([성능 목표])

## 🎯 Definition of Done

### 기능 완료
- [ ] 모든 시나리오가 정상 동작함
- [ ] [핵심 기능] 정상 동작
- [ ] UI/UX가 Frontend Specification을 준수함

### 기술 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족

### 품질 완료
- [ ] RLS 정책 적용 완료
- [ ] 권한 검증 로직 구현 완료
- [ ] 접근성 기준 충족
- [ ] 보안 취약점 0개

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: [Story-ID]
- **후행 Story**: [Story-ID]
- **도메인 의존성**: [Domain1 ↔ Domain2]

## 📁 관련 문서

### Domain Documentation
**[Domain Name 1]**:
- [Process Model](링크) - [Scenario 번호]
- [Software Design](링크) - [Aggregate명]
- [Testing Strategy](링크) - [Scenario 테스트 전략]
- [Technical Specification](링크) - 구현 가이드
- [Database Schema](링크) - [테이블명들]
- [Frontend Specification](링크) - [UI 컴포넌트들]

**[Domain Name 2]**:
- [Software Design](링크)
- [Technical Specification](링크)
- [Database Schema](링크)
- [Frontend Specification](링크)

### Agile Planning
- [Epic 문서](링크)
```

### 3.2 문서 작성 체크리스트

**완성도 검증:**
- [ ] User Story가 사용자 관점에서 명확한가?
- [ ] Acceptance Criteria가 구체적이고 테스트 가능한가?
- [ ] 관련 도메인이 명확히 식별되었는가?
- [ ] 도메인별 참조 문서가 올바르게 링크되었는가?
- [ ] Task가 도메인별로 명확히 분류되었는가?
- [ ] Definition of Done이 명확한가?

### 3.3 Story 작성 원칙

**DO (해야 할 것):**
- ✅ **도메인 식별**: Story가 영향을 주는 도메인을 명확히 표시
- ✅ **참조 문서 링크**: Technical Specification, Database Schema, Frontend Specification 링크
- ✅ **Task 중심**: "무엇을" 개발할지 명확히 나열
- ✅ **간결성**: 핵심 Task만 나열, 상세 구현은 도메인 문서 참조
- ✅ **도메인 분리**: 도메인별로 Task 그룹화
- ✅ **테스트 포함**: Testing & Quality Task 포함

**DON'T (하지 말아야 할 것):**
- ❌ **코드 블록 과다**: TypeScript, SQL 코드 블록은 최소화 (도메인 문서에 존재)
- ❌ **중복 정보**: 도메인 문서에 이미 있는 상세 구현 내용 중복 작성
- ❌ **과도한 세부사항**: Command/Event 인터페이스 전체 코드 작성
- ❌ **Repository 구현 코드**: Repository 메서드 시그니처는 Technical Spec 참조
- ❌ **Server Action 구현 코드**: Server Action 로직은 Technical Spec 참조

### 3.4 코드 vs 참조 가이드라인

**Story 문서에 포함할 것:**
- ✅ Gherkin 시나리오 (수용 기준)
- ✅ Task 체크리스트
- ✅ 도메인별 참조 문서 링크
- ✅ Definition of Done

**도메인 문서에 위임할 것:**
- 📚 Technical Specification: Aggregate, Command, Event, Repository 구현 코드
- 📚 Database Schema: 테이블 DDL, RLS 정책, 인덱스
- 📚 Frontend Specification: Component 구현, Hook, Context 코드
- 📚 Software Design: Aggregate 정의, 불변식, Read Model
- 📚 Testing Strategy: 테스트 수도코드, Given-When-Then 패턴

---

## 📋 Step 4: Story 우선순위 설정

### 4.1 우선순위 평가 기준

**우선순위 매트릭스:**

| 기준 | 가중치 | 평가 방법 |
|------|--------|-----------|
| **사용자 가치** | 40% | 사용자에게 미치는 영향도 |
| **기술적 복잡도** | 30% | 구현 난이도 및 리소스 |
| **의존성** | 20% | 다른 Story에 미치는 영향 |
| **위험도** | 10% | 실패 시 영향도 |

### 4.2 우선순위 설정 과정

**설정 과정:**
1. **개별 평가**: 각 Story를 기준별로 평가
2. **가중치 적용**: 기준별 가중치를 적용하여 점수 계산
3. **순위 결정**: 점수 순으로 우선순위 결정
4. **의존성 조정**: 의존성 관계를 고려하여 순위 조정

---

## 📋 Step 5: Story 검증 및 승인

### 5.1 내부 검증

**검증 항목:**
- [ ] **사용자 가치**: 명확한 사용자 가치 제공
- [ ] **완결성**: 독립적으로 완료 가능한 기능
- [ ] **측정 가능성**: 완료 여부를 명확히 판단 가능
- [ ] **적절한 크기**: 1-3일 내 완료 가능한 범위
- [ ] **기술적 실현 가능성**: 현재 기술로 구현 가능

### 5.2 개발팀 검토

**검토 대상자:**
- **시니어 개발자**: 기술적 실현 가능성 검토
- **주니어 개발자**: 구현 난이도 및 학습 필요사항 검토
- **QA**: 테스트 가능성 및 품질 기준 검토
- **디자이너**: 사용자 경험 관점 검토

### 5.3 피드백 수집 및 반영

**피드백 수집 과정:**
1. **초안 공유**: 개발팀에게 Story 문서 공유
2. **피드백 수집**: 각 관점에서의 의견 수렴
3. **수정 및 보완**: 피드백 반영하여 문서 개선
4. **최종 승인**: 모든 이해관계자의 승인 확보

---

## 📋 Step 6: Sprint 계획 준비

### 6.1 Story 포인트 추정

**포인트 추정 과정:**
1. **개발팀과 협의**: 개발팀과 함께 난이도 평가
2. **피보나치 수열 사용**: 1, 2, 3, 5, 8, 13, 21 포인트
3. **상대적 크기**: 다른 Story와의 상대적 크기 비교
4. **불확실성 고려**: 불확실성이 높을수록 높은 포인트

### 6.2 Sprint 용량 계획

**용량 계획 과정:**
1. **팀 용량 계산**: 팀원 수 × Sprint 기간 × 가용 시간
2. **Story 포인트 합계**: Sprint에 포함할 Story들의 포인트 합계
3. **용량 대비 검증**: Story 포인트가 팀 용량을 초과하지 않는지 확인
4. **여유 시간 확보**: 예상치 못한 이슈를 위한 여유 시간 확보

### 6.3 의존성 관리

**의존성 관리 과정:**
1. **의존성 매핑**: Story 간 의존성 관계 시각화
2. **순서 결정**: 의존성을 고려한 Story 실행 순서 결정
3. **병렬 실행**: 의존성이 없는 Story들의 병렬 실행 계획
4. **리스크 관리**: 의존성으로 인한 지연 리스크 관리

---

## 📋 Step 7: 문서 저장 및 공유

### 7.1 문서 저장
- [ ] Story 문서를 `agile-planning/stories/[도메인]/` 폴더에 저장
- [ ] 파일명 규칙: `story-e[epic번호]-[순번]-[기능명].md`
  - 예시: `story-e005-001-basic-block-definition.md`
- [ ] Story ID 규칙: `E[EPIC번호]-[순번]`
  - 예시: `E005-001` (Epic-005의 첫 번째 Story)
  - Epic 번호만 사용하여 간결하고 명확하게 식별
  - 도메인 정보는 Epic 문서에서 확인 가능
- [ ] 관련 문서들과 링크 연결

### 7.2 팀 공유
- [ ] 개발팀에게 Story 내용 공유
- [ ] Story 우선순위 및 일정 공유
- [ ] Sprint 계획 수립을 위한 정보 제공

---

## 🎯 완료 기준

Story 정의가 완료되었다고 판단할 수 있는 기준:

- [ ] **명확한 User Story**: 사용자 관점에서 명확한 목표
- [ ] **구체적인 Acceptance Criteria**: 테스트 가능한 완료 조건 (Gherkin 형식)
- [ ] **도메인 식별**: 관련 도메인이 명확히 식별됨
- [ ] **참조 문서 링크**: 각 도메인의 Technical Spec, DB Schema, Frontend Spec 링크 완료
- [ ] **도메인별 Task 분류**: Backend, Database, Server Actions, Frontend로 Task 그룹화
- [ ] **통합 Task 정의**: 도메인 간 통합 로직 Task 정의
- [ ] **명확한 Definition of Done**: 기능/기술/품질 완료 기준
- [ ] **개발팀 승인**: 모든 개발팀원의 이해 및 승인

---

## 📚 관련 문서

- [Epic 계획 가이드](./03-epic-planning-guide.md)
- [Sprint 계획 가이드](./05-sprint-planning-guide.md)
- [브랜치 넘버링 가이드](./06-branch-numbering-guide.md)

---

## 💡 팁과 주의사항

### 성공적인 Story 정의를 위한 팁
- **사용자 관점 유지**: 기술적 세부사항보다는 사용자 가치에 집중
- **적절한 크기**: 너무 크거나 작지 않은 적절한 범위 설정 (1-3일)
- **의존성 관리**: 다른 Story와의 의존성을 미리 파악하고 관리
- **개발팀 참여**: 개발팀의 의견을 적극 수렴하여 현실적인 계획 수립
- **도메인 문서 활용**: Technical Specification을 먼저 확인하고 Task 추출
- **참조 중심**: 상세 구현은 도메인 문서를 참조하도록 링크만 제공

### 주의사항
- **코드 블록 최소화**: Story 문서는 "무엇을" 개발할지만 명시, "어떻게"는 도메인 문서 참조
- **중복 정보 제거**: Technical Specification에 이미 있는 코드를 Story에 중복 작성하지 않기
- **도메인 경계 명확**: 여러 도메인이 관련된 경우 도메인별로 Task를 명확히 분리
- **과도한 세분화 피하기**: Task는 구현 가능한 수준으로만 분해
- **기술적 제약 고려**: 현재 기술 수준과 리소스를 고려한 현실적 계획
- **변경 관리**: Story 변경 시 영향 범위 분석 및 관련자 공유

### 실전 예시

#### ❌ 잘못된 Story 작성 (코드 과다)
```markdown
## 기술적 구현 세부사항

### Command-Event 매핑
```typescript
// 300줄의 TypeScript 코드...
interface CreateWorkspaceCommand { ... }
class WorkspaceAggregate { ... }
```

### Repository 구현
```typescript
// 200줄의 Repository 코드...
class DrizzleWorkspaceRepository { ... }
```

### Database Schema
```sql
-- 150줄의 SQL DDL...
CREATE TABLE workspaces ( ... );
```
```

#### ✅ 올바른 Story 작성 (Task 중심 + 참조)
```markdown
## 📋 개발 Task (도메인별)

### Workspace Management Domain
**참조 문서**: [Technical Specification](링크), [Database Schema](링크)

#### Backend Implementation
- [ ] WorkspaceAggregate 구현 (생성, 수정, 삭제 로직)
- [ ] Workspace Entity 구현
- [ ] WorkspaceRepository 구현

#### Database
- [ ] workspaces 테이블 생성 (Drizzle migration)
- [ ] RLS 정책 적용

#### Server Actions
- [ ] createWorkspaceAction
- [ ] updateWorkspaceAction
```

**차이점:**
- ❌ 잘못된 예시: 650줄 (코드 중복, 유지보수 어려움)
- ✅ 올바른 예시: 150줄 (간결, 도메인 문서 참조, 유지보수 용이)

---

## 🔧 Git 워크플로우

### 작업 및 커밋
```bash
# 1. dev 브랜치에서 최신 상태로 업데이트
git checkout dev
git pull origin dev

# 2. Story 정의 작업
# - User Story 및 Acceptance Criteria 작성
# - Command-Event 매핑 정의
# - Technical Implementation Details 작성
# - Sub-tasks 및 Definition of Done 정의
```

### 커밋 메시지 규칙
```bash
# Story 문서 작성
git add .
git commit -m "docs(story): add story-e001-007-member-invitation document

- Story ID: E001-007 (Epic-001의 7번째 Story)
- Define user story and acceptance criteria
- Identify related domains (Organization, Notification)
- List domain-specific tasks with reference links
- Define definition of done and dependencies"

# Acceptance Criteria 작성
git add .
git commit -m "docs(story): add acceptance criteria and scenarios

- Gherkin format acceptance criteria (4 scenarios)
- Given-When-Then scenarios for invite flow
- Edge cases (duplicate invite, permissions)
- Domain integration requirements"

# Task 분류 및 참조 추가
git add .
git commit -m "docs(story): organize tasks by domain with references

- Organize tasks by Organization and Notification domains
- Add reference links to Technical Spec, DB Schema, Frontend Spec
- Define integration tasks between domains
- Add testing and quality tasks"
```

### GitHub에 푸시
```bash
# 1. dev 브랜치에 직접 푸시
git push origin dev
```

### PR 리뷰 체크리스트
**리뷰어가 확인할 사항:**
- [ ] **User Story 명확성**: 사용자 관점에서 명확한 목표인가?
- [ ] **Acceptance Criteria 완전성**: 테스트 가능한 완료 조건이 정의되었는가?
- [ ] **도메인 식별**: 관련 도메인이 명확히 식별되었는가?
- [ ] **참조 문서 링크**: Technical Spec, DB Schema, Frontend Spec 링크가 올바른가?
- [ ] **Task 분류**: 도메인별로 Task가 명확히 분류되었는가?
- [ ] **코드 최소화**: 불필요한 코드 블록이 없는가? (도메인 문서 참조로 대체)
- [ ] **Definition of Done**: 완료 여부를 판단할 수 있는 기준이 있는가?

**승인 기준:**
- [ ] 시니어 개발자가 기술적 실현 가능성 및 도메인 설계를 승인
- [ ] 주니어 개발자가 Task의 명확성과 구현 난이도를 승인
- [ ] QA가 테스트 가능성을 승인
- [ ] 기획자가 사용자 가치를 승인

### 다음 단계 준비
```bash
# 1. 다음 단계 준비
# - Sprint 계획 수립
# - 개발팀 리소스 할당
# - 구현 작업 시작
```

---

이 가이드를 따라하면 주니어 PM도 체계적으로 Story를 정의할 수 있습니다! 🚀

