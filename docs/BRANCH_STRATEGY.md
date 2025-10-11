# 브랜치 전략 및 워크플로우

## 🌿 브랜치 구조

### 메인 브랜치
- **`main`**: 프로덕션 배포용 (stable)
- **`dev`**: 개발 통합 브랜치 (next release)

### Feature 브랜치 (Story 기반)
- **`feature/ORG-XXX-*`**: Organization 관련 Story
- **`feature/USER-XXX-*`**: User Management 관련 Story
- **`feature/NOTIF-XXX-*`**: Notification 관련 Story
- **`feature/WS-XXX-*`**: Workspace Structure 관련 Story

### 기타 브랜치
- **`bugfix/ORG-XXX-*`**: 버그 수정
- **`hotfix/*`**: 긴급 수정 (main에서 직접 분기)
- **`docs/*`**: 문서 작업
- **`refactor/*`**: 리팩토링

---

## 📋 브랜치 명명 규칙

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

### Story 개발 워크플로우

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

❌ Require linear history (선택사항)
❌ Require signed commits (선택사항)
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

```
1. Story 시작
   ├─ dev에서 feature/ORG-XXX 브랜치 생성
   └─ 로컬에서 작업

2. 개발 및 테스트
   ├─ TDD 사이클로 개발
   ├─ Conventional Commits로 커밋
   └─ Feature 브랜치에 push

3. PR 생성
   ├─ dev를 target으로 PR 생성
   ├─ Story 링크, 구현 내용, 테스트 결과 작성
   └─ 리뷰 요청

4. 리뷰 및 Merge
   ├─ 코드 리뷰
   ├─ 수정 사항 반영
   ├─ Approve 후 Merge
   └─ ✨ CHANGELOG 자동 생성!

5. Feature 브랜치 삭제
   └─ Merge 후 자동 삭제 (GitHub 설정)
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

### Story ORG-005 개발 과정 (지금 완료한 것)

```bash
# 1. 브랜치 생성
git checkout dev
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
# Target: dev
# Description:
# - Story: docs/agile-planning/stories/organization-management/story-005-member-role-change.md
# - 구현: Backend (TDD), Frontend (Layered Auth)
# - 테스트: 38/38 passed
# - 주요 변경사항: 클릭 가능한 역할 배지, adminDb 사용

# 6. Merge 후
# → CHANGELOG.md 자동 업데이트!
# → feature/ORG-005-member-role-change 자동 삭제
```

---

## 📚 참고 문서

- [Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

**이 브랜치 전략을 따르면**:
- ✅ 여러 개발자가 동시에 다른 Story 작업 가능
- ✅ Story별 독립적인 PR 리뷰
- ✅ dev 브랜치는 항상 안정적
- ✅ CHANGELOG는 PR merge 시에만 자동 생성
- ✅ 롤백과 선택적 배포 가능

