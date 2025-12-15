# 브랜치 전략 및 워크플로우

## 🌿 브랜치 구조

### 메인 브랜치
- **`main`**: 프로덕션 배포용 (stable)
- **`dev`**: 개발 통합 브랜치 (default, next release)

### Sprint 브랜치 (버전 기반)
- **`sprint/v<major>.<minor>.<patch>-sprint-<number>`**: 스프린트별 버전 브랜치
- 예시: `sprint/v0.1.0-sprint-001`, `sprint/v1.2.0-sprint-002`
- 각 스프린트마다 dev에서 분기하여 생성
- 스프린트 완료 시 dev로 병합 후 버전 태그 생성

### Feature 브랜치 (Story 기반)
- **`feature/ORG-XXX-*`**: Organization 관련 Story
- **`feature/USER-XXX-*`**: User Management 관련 Story
- **`feature/NOTIF-XXX-*`**: Notification 관련 Story
- **`feature/WS-XXX-*`**: Workspace Structure 관련 Story
- Sprint 브랜치에서 분기하여 생성

### 기타 브랜치
- **`bugfix/ORG-XXX-*`**: 버그 수정
- **`hotfix/*`**: 긴급 수정 (main에서 직접 분기)
- **`docs/*`**: 문서 작업
- **`refactor/*`**: 리팩토링

---

## 📋 브랜치 명명 규칙

### Sprint 브랜치
```
sprint/v<major>.<minor>.<patch>-sprint-<number>

예시:
- sprint/v0.1.0-sprint-001
- sprint/v1.2.0-sprint-002
- sprint/v1.3.0-sprint-003
```

### Feature 브랜치
```
feature/<DOMAIN>-<STORY_NUMBER>-<description>

예시:
- feature/ORG-005-member-role-change
- feature/ORG-006-member-removal
- feature/USER-003-profile-update
```

### Bugfix 브랜치
```
bugfix/<DOMAIN>-<ISSUE_NUMBER>-<description>

예시:
- bugfix/ORG-101-invitation-email-validation
- bugfix/USER-102-auth-token-refresh
```

### 기타
```
docs/<description>
refactor/<description>
hotfix/<critical-issue>
```

---

## 🔄 워크플로우

### Sprint 브랜치 워크플로우 (권장)

#### 1. Sprint 시작: Sprint 브랜치 생성

```bash
# 1. dev 브랜치에서 최신 코드 가져오기
git checkout dev
git pull origin dev

# 2. Sprint 브랜치 생성 (예: v0.1.0-sprint-001)
git checkout -b sprint/v0.1.0-sprint-001

# 3. Sprint 브랜치를 원격에 push
git push origin sprint/v0.1.0-sprint-001
```

#### 2. Story 개발: Feature 브랜치 생성 및 작업

```bash
# 1. Sprint 브랜치에서 feature 브랜치 생성
git checkout sprint/v0.1.0-sprint-001
git pull origin sprint/v0.1.0-sprint-001
git checkout -b feature/ORG-005-member-role-change

# 2. 작업 및 커밋
git add .
git commit -m "feat(org): implement member role change

- Add changeMemberRole method in OrganizationAggregate
- Implement Service layer with 6-step security validation
- Add useRoleChange Hook and UI components

Implements: Story ORG-005"

# 3. Feature 브랜치에 push
git push origin feature/ORG-005-member-role-change

# 4. GitHub에서 PR 생성 (sprint/v0.1.0-sprint-001를 target으로)
# - Title: [ORG-005] 멤버 역할 변경 기능 구현
# - Description: Story 링크, 구현 내용, 테스트 결과

# 5. PR 리뷰 및 Merge
# → Sprint 브랜치로 merge
```

#### 3. Sprint 완료: Sprint 브랜치를 dev로 병합

```bash
# 1. Sprint 브랜치 최신화 확인
git checkout sprint/v0.1.0-sprint-001
git pull origin sprint/v0.1.0-sprint-001

# 2. GitHub에서 PR 생성 (dev를 target으로)
# - Title: [Sprint 001] v0.1.0-sprint-001 완료
# - Description: 
#   - Sprint 목표 및 완료된 Story 목록
#   - 주요 변경사항 요약
#   - 테스트 결과

# 3. PR 리뷰 및 Merge
# → dev 브랜치로 merge되면 CHANGELOG 자동 생성!

# 4. 버전 태그 생성
git checkout dev
git pull origin dev
git tag -a v0.1.0-sprint-001 -m "Sprint 001 complete: Workspace Management Epic (partial)"
git push origin v0.1.0-sprint-001
```

---

### 간단한 Story 개발 워크플로우 (Sprint 브랜치 없이)

> **참고**: Sprint 브랜치를 사용하지 않는 경우, 기존 방식대로 dev에서 직접 feature 브랜치를 생성할 수 있습니다.

```bash
# 1. dev에서 feature 브랜치 생성
git checkout dev
git pull origin dev
git checkout -b feature/ORG-005-member-role-change

# 2. 작업 및 커밋
git add .
git commit -m "feat(org): implement member role change

- Add changeMemberRole method in OrganizationAggregate
- Implement Service layer with 6-step security validation
- Add useRoleChange Hook and UI components

Implements: Story ORG-005"

# 3. Feature 브랜치에 push
git push origin feature/ORG-005-member-role-change

# 4. GitHub에서 PR 생성 (dev로)
# - Title: [ORG-005] 멤버 역할 변경 기능 구현
# - Description: Story 링크, 구현 내용, 테스트 결과

# 5. PR 리뷰 및 Merge
# → dev 브랜치로 merge되면 CHANGELOG 자동 생성!
```

---

## 🔒 브랜치 보호 규칙 (GitHub Settings)

### Sprint 브랜치 보호 (선택사항)
```
Settings → Branches → Add rule

Branch name pattern: sprint/*

✅ Require a pull request before merging
  ├─ Require approvals: 1 (optional)
  └─ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging (선택사항)

⚠️ Note: Sprint 브랜치는 개발 중 브랜치이므로 보호 규칙을 완화할 수 있음
```

### dev 브랜치 보호
```
Settings → Branches → Add rule

Branch name pattern: dev

✅ Require a pull request before merging
  ├─ Require approvals: 1 (optional, 팀 규모에 따라)
  └─ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
  ├─ Require branches to be up to date before merging
  └─ Status checks that are required:
      - tests (if CI/CD configured)
      - linter (if CI/CD configured)

✅ Do not allow bypassing the above settings
  └─ Include administrators (권장)

```

### main 브랜치 보호 (더 엄격)
```
Branch name pattern: main

✅ Require a pull request before merging
  └─ Require approvals: 2 (더 엄격)

✅ Require status checks to pass before merging

✅ Require conversation resolution before merging

✅ Do not allow bypassing the above settings
  └─ Include administrators
```

---

## 📝 Commit Message 규칙

### Conventional Commits 사용

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- **feat**: 새로운 기능 (Story 구현)
- **fix**: 버그 수정
- **docs**: 문서 수정
- **refactor**: 리팩토링 (기능 변경 없음)
- **test**: 테스트 추가/수정
- **chore**: 빌드/설정 변경

### Scope
- **org**: Organization Management
- **user**: User Management
- **notif**: Notification Management
- **ws**: Workspace Structure

### 예시
```bash
# Feature
git commit -m "feat(org): add member role change functionality

Implements Story ORG-005 with TDD approach.
- OrganizationAggregate.changeMemberRole()
- Service layer with 6-step validation
- Frontend components with Layered Authorization

Tests: 38/38 passed"

# Bugfix
git commit -m "fix(org): resolve RLS issue in findMemberRole

Changed from db.rls to db.admin for role queries.
Admins can now change member roles correctly.

Fixes: #123"

# Docs
git commit -m "docs(org): update Story ORG-005 progress

Mark as 100% complete with implementation details."
```

---

## 🚀 CHANGELOG 생성 규칙

### 자동 생성 조건
- ✅ **main 브랜치에 push** (release)
- ✅ **PR이 dev/main에 merge** (feature 완료)

### 생성되지 않는 경우
- ❌ Feature 브랜치에 직접 push
- ❌ PR이 merge되지 않고 close
- ❌ WIP 커밋 (conventional commit 형식 아님)

### Changelog 항목
```markdown
## [Unreleased]

### Features
- **org**: 멤버 역할 변경 기능 추가 (#PR번호)
  - 계층적 권한 시스템 구현
  - Layered Authorization 적용
  - TDD 기반 개발 (38/38 테스트 통과)

### Bug Fixes
- **org**: RLS 이슈로 관리자가 멤버 초대 못하던 문제 수정 (#PR번호)

### Documentation
- **org**: Story ORG-005 구현 완료 문서화
```

---

## 🎯 권장 워크플로우 요약

### Sprint 브랜치 기반 워크플로우 (권장)

```
1. Sprint 시작
   ├─ dev에서 sprint/v0.1.0-sprint-001 브랜치 생성
   └─ Sprint 브랜치를 원격에 push

2. Story 시작
   ├─ Sprint 브랜치에서 feature/ORG-XXX 브랜치 생성
   └─ 로컬에서 작업

3. 개발 및 테스트
   ├─ TDD 사이클로 개발
   ├─ Conventional Commits로 커밋
   └─ Feature 브랜치에 push

4. PR 생성 (Sprint 브랜치로)
   ├─ Sprint 브랜치를 target으로 PR 생성
   ├─ Story 링크, 구현 내용, 테스트 결과 작성
   └─ 리뷰 요청

5. 리뷰 및 Merge
   ├─ 코드 리뷰
   ├─ 수정 사항 반영
   ├─ Approve 후 Sprint 브랜치로 Merge
   └─ Feature 브랜치 자동 삭제

6. Sprint 완료
   ├─ Sprint 브랜치를 dev로 PR 생성
   ├─ Sprint 목표 및 완료된 Story 목록 작성
   └─ Merge 후 버전 태그 생성 (v0.1.0-sprint-001)
```

### 브랜치 계층 구조

```
main (프로덕션)
  ↑
dev (개발 통합)
  ↑
sprint/v0.1.0-sprint-001 (스프린트 브랜치)
  ↑
feature/ORG-005-member-role-change (Story 브랜치)
```

---

## 🛠️ GitHub Settings 체크리스트

### Repository Settings
- [ ] **Branch Protection**
  - [ ] `dev` 브랜치 보호 설정
  - [ ] `main` 브랜치 보호 설정
  - [ ] Require pull request before merging
  - [ ] Require status checks (선택사항)

- [ ] **Pull Requests**
  - [ ] Automatically delete head branches (merge 후 자동 삭제)
  - [ ] Allow squash merging (권장)
  - [ ] Default to PR title for squash commit message

- [ ] **Actions**
  - [ ] Allow GitHub Actions to create PRs (changelog 업데이트용)
  - [ ] Workflow permissions: Read and write

---

## 💡 실전 예시

### Sprint 브랜치 기반 개발 예시

#### Sprint 001 시작

```bash
# 1. Sprint 브랜치 생성
git checkout dev
git pull origin dev
git checkout -b sprint/v0.1.0-sprint-001
git push origin sprint/v0.1.0-sprint-001
```

#### Story ORG-005 개발

```bash
# 1. Sprint 브랜치에서 feature 브랜치 생성
git checkout sprint/v0.1.0-sprint-001
git pull origin sprint/v0.1.0-sprint-001
git checkout -b feature/ORG-005-member-role-change

# 2. TDD로 개발
# - OrganizationAggregate 테스트 작성
# - Service 구현
# - Frontend 컴포넌트 작성

# 3. 커밋
git add .
git commit -m "feat(org): implement member role change with TDD

- OrganizationAggregate.changeMemberRole() (38/38 tests)
- Layered Authorization pattern
- Click-to-edit role badge UI

Implements: Story ORG-005"

# 4. Push
git push origin feature/ORG-005-member-role-change

# 5. PR 생성 (GitHub UI)
# Title: [ORG-005] 멤버 역할 변경 기능 구현
# Target: sprint/v0.1.0-sprint-001
# Description:
# - Story: docs/agile-planning/stories/organization-management/story-005-member-role-change.md
# - 구현: Backend (TDD), Frontend (Layered Auth)
# - 테스트: 38/38 passed
# - 주요 변경사항: 클릭 가능한 역할 배지, adminDb 사용

# 6. Merge 후
# → Sprint 브랜치에 반영됨
# → feature/ORG-005-member-role-change 자동 삭제
```

#### Sprint 001 완료

```bash
# 1. Sprint 브랜치 최신화 확인
git checkout sprint/v0.1.0-sprint-001
git pull origin sprint/v0.1.0-sprint-001

# 2. GitHub에서 PR 생성 (dev를 target으로)
# Title: [Sprint 001] v0.1.0-sprint-001 완료
# Description:
# - Sprint 목표: Workspace Management Epic (일부)
# - 완료된 Story:
#   - ORG-005: 멤버 역할 변경 기능
#   - ORG-006: 멤버 제거 기능
# - 주요 변경사항 요약
# - 테스트 결과: 모든 테스트 통과

# 3. PR 리뷰 및 Merge
# → dev 브랜치로 merge되면 CHANGELOG 자동 생성!

# 4. 버전 태그 생성
git checkout dev
git pull origin dev
git tag -a v0.1.0-sprint-001 \
  -m "Sprint 001 complete: Workspace Management Epic (partial)
  - Story: ORG-005 (Member Role Change)
  - Story: ORG-006 (Member Removal)"
git push origin v0.1.0-sprint-001
```

---

## 📚 참고 문서

### 내부 문서
- [Version Mapping Guide](./06-version-mapping-guide.md) - Sprint = Minor Version 전략
- [Sprint Planning Guide](./05-sprint-planning-guide.md)
- [Epic Planning Guide](./03-epic-planning-guide.md)

### 외부 자료
- [Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

**이 브랜치 전략을 따르면**:
- ✅ 여러 개발자가 동시에 다른 Story 작업 가능
- ✅ Story별 독립적인 PR 리뷰
- ✅ Sprint 단위로 버전 관리 가능 (Sprint = Minor Version)
- ✅ Sprint 브랜치로 스프린트 내 작업을 그룹화
- ✅ dev 브랜치는 항상 안정적
- ✅ CHANGELOG는 PR merge 시에만 자동 생성
- ✅ 롤백과 선택적 배포 가능
- ✅ 버전 태그로 Sprint 완료 시점 명확히 추적

---

## 📌 Sprint 브랜치 전략의 장점

### 1. 버전 관리와의 일관성
- Sprint = Minor Version 전략과 완벽히 일치
- 각 Sprint 완료 시점에 명확한 버전 태그 생성 가능

### 2. 스프린트 단위 작업 관리
- 한 스프린트 내의 모든 Story를 하나의 브랜치로 관리
- 스프린트 완료 시 한 번에 dev로 병합

### 3. 롤백 용이성
- 스프린트 단위로 롤백 가능
- 문제 발생 시 해당 Sprint 브랜치만 되돌리면 됨

### 4. 병렬 개발 지원
- 여러 개발자가 같은 Sprint 브랜치에서 다른 Story 작업 가능
- Story별 feature 브랜치로 충돌 최소화

---

## 🌍 오픈소스 프로젝트 브랜치 전략 비교 및 제안

### 주요 오픈소스 프로젝트의 브랜치 전략

#### 1. React Flow (GitHub Flow)

**브랜치 구조:**
- `main`: 프로덕션 배포용 (항상 deployable)
- `feature/*`: 기능 개발 브랜치
- `v11`: 버전별 유지보수 브랜치 (선택적)

**워크플로우:**
```
main
  ↑
feature/add-new-node (PR → main)
```

**특징:**
- ✅ 단순하고 빠른 워크플로우
- ✅ Continuous Deployment에 적합
- ✅ 작은 팀이나 빠른 반복 개발에 최적
- ❌ 스프린트 단위 관리 부재
- ❌ 릴리스 주기 제어 어려움

**참고:** [React Flow GitHub](https://github.com/wbkd/react-flow)

---

#### 2. Affine (Git Flow)

**브랜치 구조:**
- `main`: 프로덕션 배포용
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 (develop에서 분기)
- `bugfix/*`: 버그 수정 (develop에서 분기)
- `hotfix/*`: 긴급 수정 (main에서 분기)
- `release/*`: 릴리스 준비 (develop에서 분기)

**워크플로우:**
```
main (프로덕션)
  ↑
release/v1.2.0 (릴리스 준비)
  ↑
develop (개발 통합)
  ↑
feature/new-feature (PR → develop)
```

**특징:**
- ✅ 구조화된 릴리스 관리
- ✅ 병렬 개발 지원
- ✅ 안정적인 릴리스 프로세스
- ❌ 복잡한 브랜치 구조
- ❌ 릴리스 프로세스가 느릴 수 있음

**참고:** [AFFiNE Contributing Guide](https://docs.affine.pro/contributing)

---

#### 3. SSOTA (현재: Sprint Branch Strategy)

**브랜치 구조:**
- `main`: 프로덕션 배포용
- `dev`: 개발 통합 브랜치
- `sprint/v<version>-sprint-<number>`: 스프린트별 브랜치
- `feature/*`: Story 기반 기능 개발
- `bugfix/*`, `hotfix/*`: 버그 수정

**워크플로우:**
```
main (프로덕션)
  ↑
dev (개발 통합)
  ↑
sprint/v1.2.0-sprint-001 (스프린트 브랜치)
  ↑
feature/ORG-005-member-role-change (PR → sprint 브랜치)
```

**특징:**
- ✅ Sprint = Minor Version 전략과 완벽히 일치
- ✅ 스프린트 단위 작업 관리
- ✅ 스프린트 완료 시점 명확한 버전 태그
- ✅ 스프린트 단위 롤백 가능
- ⚠️ 오픈소스 프로젝트에서는 덜 일반적
- ⚠️ 스프린트 브랜치 관리 오버헤드

---

### 전략 비교표

| 항목 | GitHub Flow (React Flow) | Git Flow (Affine) | Sprint Branch (SSOTA) |
|------|-------------------------|-------------------|----------------------|
| **브랜치 수** | 최소 (main + feature) | 중간 (5-6개) | 중간 (main + dev + sprint + feature) |
| **복잡도** | 낮음 | 높음 | 중간 |
| **릴리스 주기** | Continuous | Scheduled | Sprint-based |
| **스프린트 연동** | 없음 | 없음 | ✅ 완벽한 연동 |
| **버전 관리** | 태그 기반 | Release 브랜치 | Sprint 브랜치 + 태그 |
| **롤백** | Feature 단위 | Release 단위 | Sprint 단위 |
| **적합한 팀** | 작은 팀, 빠른 반복 | 큰 팀, 정식 릴리스 | 스프린트 기반 팀 |
| **오픈소스 일반성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

### SSOTA 프로젝트에 대한 제안

#### 현재 전략 유지 (권장)

**이유:**
1. **Sprint = Minor Version 전략과의 일관성**
   - 현재 버전 매핑 전략과 완벽히 일치
   - 스프린트 완료 시점에 명확한 버전 태그 생성

2. **프로젝트 특성에 적합**
   - 스프린트 기반 개발 프로세스
   - 명확한 스프린트 목표와 완료 기준
   - 스프린트 단위로 작업을 그룹화하는 것이 자연스러움

3. **롤백 및 관리 용이성**
   - 스프린트 단위 롤백 가능
   - 문제 발생 시 해당 스프린트 브랜치만 되돌리면 됨

#### 개선 제안

##### 1. GitHub Flow 하이브리드 접근 (선택적)

스프린트 브랜치를 유지하되, 간단한 기능은 dev에서 직접 개발:

```bash
# 간단한 기능: dev에서 직접
dev → feature/simple-fix → PR → dev

# 복잡한 기능: Sprint 브랜치 사용
dev → sprint/v1.2.0-sprint-001 → feature/complex-feature → PR → sprint → PR → dev
```

**장점:**
- 빠른 수정은 즉시 dev로 병합
- 복잡한 기능은 스프린트 브랜치로 관리
- 유연성 증가

##### 2. Release 브랜치 도입 (선택적)

프로덕션 배포 전 최종 테스트를 위한 release 브랜치:

```
main (프로덕션)
  ↑
release/v1.2.0 (릴리스 준비, 최종 테스트)
  ↑
dev (개발 통합)
  ↑
sprint/v1.2.0-sprint-001
```

**장점:**
- 프로덕션 배포 전 최종 검증
- 버그 수정 후 재배포 용이
- Affine과 유사한 안정성 확보

**단점:**
- 브랜치 구조 복잡도 증가
- 현재 워크플로우에 추가 단계 필요

##### 3. Feature 브랜치 생명주기 단축

오픈소스 모범 사례: Feature 브랜치는 2-3일 이내로 유지

**권장 사항:**
- 큰 Story는 작은 단위로 분할
- Feature 브랜치를 자주 dev/sprint 브랜치에 병합
- 장기간 유지되는 Feature 브랜치 지양

---

### 오픈소스 기여자 관점에서의 고려사항

#### 현재 Sprint 브랜치 전략의 장단점

**장점:**
- ✅ 스프린트 목표가 명확하면 기여자가 이해하기 쉬움
- ✅ 스프린트 브랜치에 여러 관련 기능이 그룹화되어 있음

**단점:**
- ⚠️ 오픈소스 기여자는 보통 `main` 또는 `develop`에서 직접 작업하는 것을 기대
- ⚠️ Sprint 브랜치의 존재 이유를 이해하기 어려울 수 있음
- ⚠️ 기여자가 어떤 브랜치에 PR을 보내야 할지 혼란스러울 수 있음

#### 개선 제안

1. **CONTRIBUTING.md에 명확한 가이드 추가**
   ```markdown
   ## 브랜치 전략
   
   - 일반 기여자: `dev` 브랜치에서 `feature/*` 브랜치 생성 후 PR
   - 스프린트 작업: `sprint/vX.X.X-sprint-XXX` 브랜치에서 작업
   - 버그 수정: `dev` 브랜치에서 `bugfix/*` 브랜치 생성
   ```

2. **Sprint 브랜치를 선택적으로 사용**
   - 작은 기능/버그 수정: dev에서 직접
   - 큰 기능/스프린트 작업: Sprint 브랜치 사용

3. **Sprint 브랜치 자동화**
   - 스프린트 시작 시 자동으로 Sprint 브랜치 생성
   - 스프린트 완료 시 자동으로 dev로 병합 및 태그 생성

---

### 최종 권장사항

#### 현재 전략 유지 + 점진적 개선

1. **단기 (현재 유지)**
   - Sprint 브랜치 전략 계속 사용
   - Sprint = Minor Version 전략과의 일관성 유지

2. **중기 (선택적 개선)**
   - 간단한 기능은 dev에서 직접 개발하는 옵션 제공
   - CONTRIBUTING.md에 브랜치 전략 명확히 문서화

3. **장기 (프로젝트 성숙도에 따라)**
   - 팀 규모가 커지면 Git Flow 고려
   - 오픈소스 기여자가 많아지면 GitHub Flow로 전환 검토

---

### 참고 자료

- [React Flow GitHub](https://github.com/wbkd/react-flow)
- [AFFiNE Contributing Guide](https://docs.affine.pro/contributing)
- [Git Flow vs GitHub Flow](https://www.atlassian.com/git/tutorials/comparing-workflows)
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)
- [Sprint-Based Branching Strategy](https://www.vishalzambre.com/git/2025/07/10/github-sprint-release-branching.html)

---

**작성일**: 2025.12.08  
**다음 검토**: 프로젝트 성숙도 및 팀 규모 변화 시

