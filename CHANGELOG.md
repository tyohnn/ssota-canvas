## [unreleased]

### Bug

- 컴포넌트 블럭 버그 수정

### ♻️ Refactoring

- DDD 기반 리팩토링 준비
- *(ssota-cli)* Rename xbowl-cli
- *(ssota-cli)* Rename xbowl-cli
- Rename xbowl to ssota

### ✨ Features

- Complete task 2 - Create Canvas Server Actions
- Complete task 9 - Create Canvas Page and Layout with dynamic routes
- *(contracts)* Add @xbowl/domain-contracts (types/constants/zod) and switch CLI to use it [Phase A]
- *(web)* Add @workspace/domain-contracts dependency [Phase C start]
- *(web)* Fix node exports and wire shared zod schemas; unify metadata types to contracts [Phase C]
- Implement automated CHANGELOG generation system
- Implement automated CHANGELOG generation system
- Finalize alpha release structure

### 🐛 Bug Fixes

- Disable remote API calls in CHANGELOG generation

### 💅 Style

- Format solution approach sections with bullet points
- Translate all Korean text to English in CONTRIBUTING.md

### 📚 Documentation

- Update domain-contracts migration checklist (Phase A/B done), begin Phase C
- Event storming -> DDD 설계
- Create comprehensive commit convention guide
- Update AI collaboration guidelines for commit message patterns
- Update CHANGELOG.md with comprehensive project history
- Update CHANGELOG.md with latest commit history
- Document versioning workflow and release tagging
- Update CHANGELOG

### 🔧 Maintenance

- Ignore settings
- Ignore settings
- Unnecessary file deletion
- Add release automation workflow based on CHANGELOG
- Enhance CHANGELOG workflow with PR preview and automated updates
- Fix git-cliff workflow input
- Revert git-cliff configuration parameter
- Capture ci commits in changelog maintenance section
- Update git-cliff action inputs
- Rely on default config path for git-cliff
- Test changelog pipeline
- Fix release workflow checkout step
- Enhance changelog workflow authentication
- Add comprehensive logging to changelog workflow
- Integrate personal access token for workflow permissions
- Integrate personal access token for workflow permissions
- Revert to default GITHUB_TOKEN due to access issues
- Use unreleased commits for changelog generation
- Implement custom changelog change detection
- Add Node.js and pnpm setup to changelog workflow
- Simplify changelog workflow (remove pnpm/node; rely on action detection)
- Test detection path
- Set git-cliff output to CHANGELOG.md for change detection
- Reset CHANGELOG.md to force regeneration
- Replace tj-actions with direct git-cliff execution

### 🧪 Testing

- Add TEST_CI.md to verify Actions write permissions
