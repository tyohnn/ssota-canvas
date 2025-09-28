# 브랜치 넘버링 가이드

이 가이드는 주니어 PM이 **브랜치 넘버링 체계**를 설계하고 관리하는 전체 과정을 단계별로 안내합니다.

## 🎯 브랜치 넘버링이란?

**브랜치 넘버링**은 개발자들이 문서 작업 및 구현 작업을 할 때 일관된 브랜치 번호를 사용할 수 있도록 하는 체계입니다.

### 목적
- **일관성**: 모든 개발자가 동일한 브랜치 번호 사용
- **추적성**: 브랜치 번호로 작업 내용 추적 가능
- **협업**: 팀원 간 작업 내용 공유 용이
- **관리**: 브랜치 생성 및 삭제 관리 체계화

---

## 📋 Step 0: 현재 날짜 확인

### 0.1 작업 시작 전 날짜 확인
```bash
# 현재 날짜 확인
date

# 예시 출력: Sun Sep 28 15:56:33 KST 2025
```

**날짜 확인 목적:**
- 현재 시점 파악으로 적절한 브랜치 넘버링 체계 설계
- 프로젝트 진행 상황과의 일치성 확인
- 브랜치 생명주기 관리 시 정확한 타임라인 설정

---

## 📋 Step 1: 브랜치 넘버링 체계 설계

### 1.1 브랜치 유형 정의

**브랜치 유형별 구분:**

| 브랜치 유형 | 접두사 | 포함 작업 | 예시 |
|------------|--------|-----------|------|
| **Initiative** | `init/` | Initiative 계획, 비즈니스 가치 정의, Epic 목록 작성 | `init/001-visual-platform` |
| **Epic** | `epic/` | Epic 계획, Story 목록 작성, 기술적 고려사항 정의 | `epic/001-workspace-structure` |
| **Story** | `story/` | Story 정의, Acceptance Criteria 작성, Sub-tasks 정의 | `story/001-workspace-creation` |
| **Documentation** | `docs/` | Event Storming, Process Model, Software Design, Technical Spec 작성 | `docs/epic-001/process-model` |
| **Feature** | `feature/` | 실제 코드 개발, 테스트 작성, 기능 구현 | `feature/story-001/workspace-creation` |
| **Bugfix** | `bugfix/` | 버그 수정, 테스트 케이스 추가, 문서 업데이트 | `bugfix/workspace-creation-error` |
| **Hotfix** | `hotfix/` | 긴급 수정, 보안 패치, 프로덕션 배포 | `hotfix/security-vulnerability` |

### 1.2 넘버링 규칙 설계

**넘버링 규칙:**
1. **Initiative**: `init/001-[이름]`, `init/002-[이름]`
2. **Epic**: `epic/001-[도메인명]`, `epic/002-[도메인명]`
3. **Story**: `story/001-[기능명]`, `story/002-[기능명]`
4. **Documentation**: `docs/[epic-번호]/[문서유형]`
5. **Feature**: `feature/[story-번호]/[기능명]`

**예시:**
```
init/001-visual-platform
epic/001-workspace-structure
epic/002-visual-canvas
story/001-workspace-creation
story/002-workspace-management
docs/epic-001/process-model
docs/epic-001/software-design
feature/story-001/workspace-creation
feature/story-002/workspace-management
```

### 1.3 각 브랜치 유형별 구체적 작업 내용

#### Initiative 브랜치 (`init/`)
**포함 작업:**
- Initiative 목표 및 성공 지표 정의
- 비즈니스 가치 및 ROI 분석
- 포함될 Epic 목록 작성
- 의존성 및 리스크 분석
- 마일스톤 및 완료 기준 설정

**예시 작업:**
```
init/001-visual-platform
├── initiative-001-visual-platform.md (Initiative 문서)
├── business-value-analysis.md (비즈니스 가치 분석)
├── epic-list.md (포함 Epic 목록)
└── milestone-plan.md (마일스톤 계획)
```

#### Epic 브랜치 (`epic/`)
**포함 작업:**
- Epic Goal 및 Success Criteria 정의
- 포함될 Story 목록 작성
- 기술적 고려사항 및 아키텍처 설계
- 의존성 및 통합 포인트 분석
- 리스크 관리 계획 수립

**예시 작업:**
```
epic/001-workspace-structure
├── epic-001-workspace-structure.md (Epic 문서)
├── story-list.md (포함 Story 목록)
├── technical-considerations.md (기술적 고려사항)
└── integration-points.md (통합 포인트)
```

#### Story 브랜치 (`story/`)
**포함 작업:**
- User Story 및 Acceptance Criteria 작성
- Command-Event 매핑 정의
- Technical Implementation Details 작성
- Sub-tasks 및 Definition of Done 정의
- 의존성 및 우선순위 설정

**예시 작업:**
```
story/001-workspace-creation
├── story-001-workspace-creation.md (Story 문서)
├── acceptance-criteria.md (수용 기준)
├── command-event-mapping.md (Command-Event 매핑)
└── sub-tasks.md (Sub-tasks 목록)
```

#### Documentation 브랜치 (`docs/`)
**포함 작업:**
- Event Storming 결과 정리
- Process Model 작성
- Software Design 문서 작성
- Technical Specification 작성
- API 명세 및 데이터베이스 스키마 정의

**예시 작업:**
```
docs/epic-001/process-model
├── event-storming-results.md (Event Storming 결과)
├── process-model.md (Process Model)
├── software-design.md (Software Design)
├── technical-spec.md (Technical Specification)
└── api-spec.md (API 명세)
```

#### Feature 브랜치 (`feature/`)
**포함 작업:**
- 실제 코드 개발 및 구현
- 단위 테스트 및 통합 테스트 작성
- API 엔드포인트 구현
- UI 컴포넌트 개발
- 데이터베이스 마이그레이션 작성

**예시 작업:**
```
feature/story-001/workspace-creation
├── src/domains/workspace/ (도메인 코드)
├── src/api/workspace/ (API 코드)
├── src/components/workspace/ (UI 컴포넌트)
├── tests/ (테스트 코드)
└── migrations/ (데이터베이스 마이그레이션)
```

#### Bugfix 브랜치 (`bugfix/`)
**포함 작업:**
- 버그 원인 분석 및 수정
- 테스트 케이스 추가
- 문서 업데이트
- 리그레션 테스트 수행
- 배포 계획 수립

#### Hotfix 브랜치 (`hotfix/`)
**포함 작업:**
- 긴급 수정 사항 구현
- 보안 패치 적용
- 프로덕션 배포
- 모니터링 및 알림 설정
- 롤백 계획 수립

### 1.4 브랜치 생명주기 정의

**브랜치 생명주기:**
1. **생성**: 작업 시작 시 브랜치 생성
2. **개발**: 기능 개발 또는 문서 작성
3. **리뷰**: 코드 리뷰 또는 문서 리뷰
4. **병합**: 메인 브랜치에 병합
5. **삭제**: 작업 완료 후 브랜치 삭제

---

## 📋 Step 2: 브랜치 넘버링 체계 문서화

### 2.1 브랜치 넘버링 문서 작성

**문서 템플릿:**

```markdown
# 브랜치 넘버링 체계

## 🎯 개요
이 문서는 프로젝트의 브랜치 넘버링 체계를 정의합니다.

## 📋 브랜치 유형별 규칙

### Initiative 브랜치
**형식**: `init/[번호]-[이름]`
**예시**: `init/001-visual-platform`
**목적**: Initiative 관련 작업

### Epic 브랜치
**형식**: `epic/[번호]-[도메인명]`
**예시**: `epic/001-workspace-structure`
**목적**: Epic 관련 작업

### Story 브랜치
**형식**: `story/[번호]-[기능명]`
**예시**: `story/001-workspace-creation`
**목적**: Story 관련 작업

### Documentation 브랜치
**형식**: `docs/[epic-번호]/[문서유형]`
**예시**: `docs/epic-001/process-model`
**목적**: 문서화 작업

### Feature 브랜치
**형식**: `feature/[story-번호]/[기능명]`
**예시**: `feature/story-001/workspace-creation`
**목적**: 기능 개발

### Bugfix 브랜치
**형식**: `bugfix/[이슈명]`
**예시**: `bugfix/workspace-creation-error`
**목적**: 버그 수정

### Hotfix 브랜치
**형식**: `hotfix/[이슈명]`
**예시**: `hotfix/security-vulnerability`
**목적**: 긴급 수정

## 🔢 넘버링 규칙

### Initiative 넘버링
- **범위**: 001-999
- **할당**: Initiative 생성 시 순차 할당
- **관리**: PM이 할당 및 관리

### Epic 넘버링
- **범위**: 001-999
- **할당**: Epic 생성 시 순차 할당
- **관리**: PM이 할당 및 관리

### Story 넘버링
- **범위**: 001-999
- **할당**: Story 생성 시 순차 할당
- **관리**: PM이 할당 및 관리

## 🔄 브랜치 생명주기

### 1. 생성
- **시점**: 작업 시작 시
- **방법**: `git checkout -b [브랜치명]`
- **책임**: 작업 담당자

### 2. 개발
- **기간**: 작업 완료까지
- **방법**: 정기적인 커밋 및 푸시
- **책임**: 작업 담당자

### 3. 리뷰
- **시점**: 작업 완료 후
- **방법**: Pull Request 생성
- **책임**: 리뷰어

### 4. 병합
- **시점**: 리뷰 완료 후
- **방법**: Pull Request 병합
- **책임**: 작업 담당자

### 5. 삭제
- **시점**: 병합 완료 후
- **방법**: `git branch -d [브랜치명]`
- **책임**: 작업 담당자

## 📋 브랜치 생성 체크리스트

### 생성 전
- [ ] **브랜치 유형 확인**: 올바른 브랜치 유형 선택
- [ ] **넘버링 확인**: 중복되지 않는 번호 사용
- [ ] **이름 확인**: 명확하고 일관된 이름 사용
- [ ] **기준 브랜치 확인**: 올바른 기준 브랜치에서 생성

### 생성 후
- [ ] **브랜치 생성 확인**: 브랜치가 올바르게 생성되었는지 확인
- [ ] **팀 공유**: 팀원들에게 브랜치 정보 공유
- [ ] **작업 시작**: 브랜치에서 작업 시작

## 🗑️ 브랜치 삭제 체크리스트

### 삭제 전
- [ ] **작업 완료 확인**: 모든 작업이 완료되었는지 확인
- [ ] **병합 확인**: 메인 브랜치에 병합되었는지 확인
- [ ] **백업 확인**: 필요한 경우 백업 생성
- [ ] **팀 공유**: 브랜치 삭제 계획 공유

### 삭제 후
- [ ] **삭제 확인**: 브랜치가 올바르게 삭제되었는지 확인
- [ ] **팀 공유**: 브랜치 삭제 완료 공유
- [ ] **문서 업데이트**: 관련 문서 업데이트

## 📊 브랜치 관리 도구

### Git 명령어
```bash
# 브랜치 생성
git checkout -b [브랜치명]

# 브랜치 목록 확인
git branch -a

# 브랜치 삭제
git branch -d [브랜치명]

# 원격 브랜치 삭제
git push origin --delete [브랜치명]
```

### GitHub/GitLab 기능
- **브랜치 보호**: 메인 브랜치 보호 설정
- **자동 삭제**: 병합 후 자동 삭제 설정
- **브랜치 정책**: 브랜치 생성 및 병합 정책 설정

## 📁 관련 문서
- [Initiative 설정 가이드](./01-initiative-setup-guide.md)
- [Epic 계획 가이드](./03-epic-planning-guide.md)
- [Story 정의 가이드](./04-story-definition-guide.md)
- [Sprint 계획 가이드](./05-sprint-planning-guide.md)
```

### 2.2 문서 검증

**검증 체크리스트:**
- [ ] **명확성**: 브랜치 유형별 규칙이 명확한가?
- [ ] **일관성**: 넘버링 규칙이 일관되게 적용되는가?
- [ ] **완전성**: 모든 필요한 브랜치 유형이 포함되었는가?
- [ ] **실용성**: 실제 사용에 적합한 규칙인가?

---

## 📋 Step 3: 팀 교육 및 공유

### 3.1 팀 교육

**교육 내용:**
1. **브랜치 넘버링 체계**: 전체적인 체계 설명
2. **브랜치 유형별 규칙**: 각 유형별 생성 및 사용 규칙
3. **넘버링 규칙**: 번호 할당 및 관리 방법
4. **브랜치 생명주기**: 생성부터 삭제까지의 과정
5. **도구 사용법**: Git 명령어 및 GitHub/GitLab 기능

**교육 방법:**
- **워크샵**: 팀 전체 대상 워크샵 진행
- **문서 공유**: 브랜치 넘버링 문서 공유
- **실습**: 실제 브랜치 생성 및 관리 실습
- **Q&A**: 질문 및 답변 세션

### 3.2 팀 공유

**공유 방법:**
- [ ] **문서 공유**: 브랜치 넘버링 문서 팀 전체 공유
- [ ] **교육 진행**: 팀 교육 및 실습 진행
- [ ] **도구 설정**: 필요한 도구 및 설정 공유
- [ ] **지속적 지원**: 지속적인 지원 및 피드백 수집

---

## 📋 Step 4: 브랜치 넘버링 관리

### 4.1 넘버 할당 관리

**할당 관리 과정:**
1. **할당 요청**: 개발자가 브랜치 번호 요청
2. **중복 확인**: 기존 번호와 중복되지 않는지 확인
3. **번호 할당**: 적절한 번호 할당
4. **할당 기록**: 할당된 번호 기록 및 관리

**할당 관리 도구:**
- **스프레드시트**: Excel 또는 Google Sheets 사용
- **프로젝트 관리 도구**: Jira, Linear 등 사용
- **GitHub Issues**: GitHub Issues 사용

### 4.2 브랜치 생성 모니터링

**모니터링 방법:**
1. **정기적 확인**: 주간 단위로 브랜치 생성 현황 확인
2. **규칙 준수 확인**: 브랜치 명명 규칙 준수 여부 확인
3. **중복 확인**: 중복된 번호 사용 여부 확인
4. **정리**: 불필요한 브랜치 정리

### 4.3 브랜치 삭제 관리

**삭제 관리 과정:**
1. **완료 확인**: 작업 완료 및 병합 확인
2. **삭제 권한**: 삭제 권한 확인
3. **삭제 실행**: 브랜치 삭제 실행
4. **삭제 확인**: 삭제 완료 확인

---

## 📋 Step 5: 브랜치 넘버링 개선

### 5.1 피드백 수집

**피드백 수집 방법:**
1. **정기적 설문**: 월간 단위로 팀원 피드백 수집
2. **일일 스탠드업**: 일일 스탠드업에서 이슈 수집
3. **Sprint 회고**: Sprint 회고에서 개선사항 수집
4. **1:1 미팅**: 개별 미팅에서 피드백 수집

### 5.2 개선사항 적용

**개선사항 적용 과정:**
1. **피드백 분석**: 수집된 피드백 분석
2. **개선안 수립**: 개선 방안 수립
3. **팀 검토**: 팀 전체 검토 및 승인
4. **적용**: 개선사항 적용 및 문서 업데이트

### 5.3 지속적 개선

**지속적 개선 과정:**
1. **정기적 검토**: 분기별 브랜치 넘버링 체계 검토
2. **사용성 평가**: 실제 사용성 평가
3. **효율성 측정**: 브랜치 관리 효율성 측정
4. **개선 계획**: 다음 분기 개선 계획 수립

---

## 📋 Step 6: 문서 저장 및 공유

### 6.1 문서 저장
- [ ] 브랜치 넘버링 문서를 `agile-planning/guide/` 폴더에 저장
- [ ] 파일명: `06-branch-numbering-guide.md`
- [ ] 관련 문서들과 링크 연결

### 6.2 팀 공유
- [ ] 팀 전체에 브랜치 넘버링 체계 공유
- [ ] 교육 및 실습 진행
- [ ] 지속적인 지원 및 피드백 수집

---

## 🎯 완료 기준

브랜치 넘버링 체계가 완료되었다고 판단할 수 있는 기준:

- [ ] **명확한 체계**: 브랜치 유형별 명확한 규칙 정의
- [ ] **일관된 넘버링**: 일관된 넘버링 규칙 적용
- [ ] **완전한 문서화**: 모든 규칙과 절차가 문서화됨
- [ ] **팀 이해**: 팀원들이 체계를 이해하고 사용할 수 있음
- [ ] **관리 체계**: 브랜치 생성 및 삭제 관리 체계 구축
- [ ] **지속적 개선**: 피드백 수집 및 개선 체계 구축

---

## 📚 관련 문서

- [Initiative 설정 가이드](./01-initiative-setup-guide.md)
- [Epic 계획 가이드](./03-epic-planning-guide.md)
- [Story 정의 가이드](./04-story-definition-guide.md)
- [Sprint 계획 가이드](./05-sprint-planning-guide.md)

---

## 💡 팁과 주의사항

### 성공적인 브랜치 넘버링을 위한 팁
- **단순함 유지**: 복잡한 규칙보다는 단순하고 명확한 규칙
- **일관성 유지**: 모든 팀원이 동일한 규칙 사용
- **자동화 활용**: 가능한 자동화 도구 활용
- **지속적 개선**: 사용자 피드백을 통한 지속적 개선

### 주의사항
- **과도한 복잡성 피하기**: 너무 복잡한 규칙은 오히려 비효율적
- **일관성 유지**: 규칙 변경 시 팀 전체에 공유
- **문서화**: 모든 규칙과 절차를 명확히 문서화

---

이 가이드를 따라하면 주니어 PM도 체계적으로 브랜치 넘버링을 관리할 수 있습니다! 🚀

