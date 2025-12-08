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

