# GitHub Actions Workflows

This directory contains the automated workflows for the project.

## 📋 Workflow List

### 1. `changelog.yml` - Automatic CHANGELOG Generation

**Trigger:** When a sprint → dev PR is merged

**Behavior:**
- Automatically updates CHANGELOG.md using git-cliff
- Extracts changes based on Conventional Commits
- Commits changes to **dev branch** (dev is the source of truth)
- CHANGELOG naturally flows to main when dev → main PR is merged

**Features:**
- ✅ **dev is the source of truth** for CHANGELOG
- ✅ No need for main → dev synchronization
- ✅ Maintains branching strategy (dev → main only)
- ✅ Skips "Update CHANGELOG" meta entries
- ✅ Prevents duplicate execution

**Configuration:**
- Uses `cliff.toml` for commit parsing rules
- Groups commits by type (Features, Bug Fixes, etc.)

**Workflow Strategy:**
- sprint → dev: CHANGELOG auto-generated ✅
- dev → main: CHANGELOG naturally flows (no sync needed) ✅

---

### 2. `canary-release.yml` - Canary Release Automation 🐤

**Trigger:** When a PR is merged into `dev` branch

**Behavior:**
- Automatically creates canary (pre-release) builds
- Generates date-based version: `vYYYY.MM.DD-canary.BUILD`
- Creates GitHub Release marked as Pre-release
- Includes recent commit history in release notes

**Features:**
- ✅ Automatic canary releases on every dev merge
- ✅ Date-based versioning (e.g., `v2025.12.14-canary.903`)
- ✅ Auto-incremented build numbers per day
- ✅ Pre-release flag set automatically
- ✅ Manual trigger available

**Example:**
```bash
# Sprint branch → dev PR merge
# → Automatically creates: v2025.12.14-canary.001
```

**Use Cases:**
- Early testing of new features
- Continuous integration testing
- Beta testing before production release

**See also:** [Canary Release Guide](CANARY_RELEASE_GUIDE.md)

---

### 3. `release.yml` - Automatic GitHub Release Creation

**Trigger:** When a Git tag matching `v*` pattern is pushed (excluding canary tags)

**Behavior:**
- Extracts latest release notes from CHANGELOG using git-cliff
- Automatically creates GitHub Release
- Official release (not draft or pre-release)
- Excludes canary tags automatically

**Features:**
- ✅ Only processes production tags (excludes `*-canary.*`)
- ✅ Generates release notes from CHANGELOG
- ✅ Creates official GitHub Release

**Example:**
```bash
git tag -a v0.5.3 -m "Release v0.5.3"
git push origin v0.5.3
# → GitHub Release is automatically created
```

---

### 4. `release-automation.yml` - Release Automation

**Two ways to use:**

#### Method 1: Manual Trigger (Recommended ⭐)

Run from GitHub Actions tab:

1. GitHub → Actions → Select "Release Automation"
2. Click "Run workflow" button
3. Enter:
   - **Version**: `v0.5.3` (release version)
4. Run workflow

**Automatically performs:**
- ✅ Creates and pushes `v0.5.3` tag
- ✅ Automatically creates GitHub Release (release.yml is triggered)
- ✅ Everything is automatically completed!

#### Method 2: PR Label-based Automation

Add labels to dev → main PR:

- `release:major` → v1.0.0 (major update)
- `release:minor` → v0.6.0 (minor update)
- `release:patch` → v0.5.3 (patch update)

**When PR is merged, automatically:**
- ✅ Calculates version automatically
- ✅ Creates tag automatically
- ✅ Creates GitHub Release automatically

---

## 🔄 Complete Workflow

### Full Development & Release Cycle

```mermaid
graph TD
    A[Sprint Development] --> B[PR to dev]
    B --> C{PR Merge}
    C -->|Merged| D[canary-release.yml<br/>🐤 Canary Release]
    D --> E[dev Branch]
    E --> F[dev → main PR]
    F --> G{Add Label?}
    G -->|Yes| H[changelog.yml<br/>CHANGELOG Update]
    G -->|No| H
    H --> I{Label Type}
    I -->|release:*| J[release-automation.yml<br/>Auto Tag Creation]
    I -->|No Label| K[Manual Release<br/>via Actions]
    J --> L[Tag Push]
    K --> L
    L --> M[release.yml<br/>GitHub Release]
    M --> N[🎉 Production Release!]
```

### Step-by-Step Explanation

#### 1️⃣ Sprint Development (No Automation)
```bash
git checkout dev
git checkout -b sprint/v0.5.3-sprint-017
# ... development work ...
git push origin sprint/v0.5.3-sprint-017
```

#### 2️⃣ PR to dev → Canary Release 🐤
- Create Sprint branch → dev PR
- Merge PR
- **Automatically:**
  - ✅ `canary-release.yml` runs
  - ✅ Creates canary tag: `v2025.12.14-canary.001`
  - ✅ Creates Pre-release on GitHub
  - ✅ Testers can install and test

#### 3️⃣ PR to main (Production Release)
- Create dev → main PR
- Add label (optional): `release:minor`
- Merge PR

#### 2️⃣ PR to dev → CHANGELOG Generation ✅
- `changelog.yml` runs automatically
- Updates CHANGELOG.md on **dev branch**
- dev becomes the source of truth

#### 3️⃣ PR to main (Production Release)
- Create dev → main PR
- CHANGELOG already up-to-date (from dev)
- Add label (optional): `release:minor`
- Merge PR

#### 5️⃣ Release Automation (Optional) ✅
**Automatic (if label exists):**
- Automatically runs if PR has `release:*` label
- Automatically calculates version and creates tag

**Manual (if no label):**
- Manually run "Release Automation" from GitHub Actions
- Enter version

#### 6️⃣ GitHub Release Creation ✅
- `release.yml` runs automatically
- Creates official release on GitHub Release page
- Includes release notes from CHANGELOG

---

## 🎯 Usage Scenarios

### Scenario 1: Standard Release (Most Common)

```bash
# 1. Sprint development
sprint/v0.5.3-sprint-017 → dev (PR & Merge)
# → 🐤 Canary release created automatically

# 2. Testing phase
# Testers install canary and provide feedback

# 3. Production release
dev → main PR + label: release:patch
# → ✅ Everything automatic:
#    - CHANGELOG update
#    - Tag creation (v0.5.3)
#    - GitHub Release creation
```

### Scenario 2: Canary-Only Testing

```bash
# 1. Feature development
feature/new-feature → dev (PR & Merge)
# → 🐤 Canary release created

# 2. Test and iterate
# Multiple canary releases as needed

# 3. When ready, merge to main
dev → main PR
# → Production release
```

### Scenario 3: Manual Release

```bash
# 1-3. Same as Scenario 1 but no label
# 4. Manually run from GitHub Actions:
#    - Version: v0.5.3
#    - Click Run workflow
# 5. Everything else is automatic! ✨
```

### Scenario 4: Hotfix Release

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug
# ... fix ...

# 2. Direct PR to main
# 3. Add label: release:patch
# 4. Merge
# 5. v0.5.4 release is automatically created!
```

---

## 📊 Release Types Comparison

| Type | Naming | Pre-release | Trigger | Use Case |
|------|--------|-------------|---------|----------|
| **Canary** | `v2025.12.14-canary.903` | ✅ Yes | dev merge | Early testing |
| **Sprint** | `v0.5.3-sprint-017` | ❌ No | main merge | Sprint completion |
| **Production** | `v0.5.3` | ❌ No | main merge | Official release |

---

## ⚙️ Configuration and Customization

### CHANGELOG Generation

**File:** `cliff.toml`

```toml
# Skip CHANGELOG meta entries
{ message = "^docs: update CHANGELOG", skip = true},

# Commit parsers
{ message = "^feat", group = "✨ Features"},
{ message = "^fix", group = "🐛 Bug Fixes"},
```

### Canary Release Naming

**File:** `.github/workflows/canary-release.yml`

```yaml
# Current format: YYYY.MM.DD-canary.BUILD
DATE=$(date +%Y.%m.%d)
BUILD_NUMBER=$(printf "%03d" $BUILD_NUMBER)
```

### Version Calculation

**File:** `.github/workflows/release-automation.yml`

```yaml
# Label-based version increment
release:major → MAJOR++
release:minor → MINOR++
release:patch → PATCH++
```

---

## 🔍 Troubleshooting

### CHANGELOG Not Updating

**Causes:**
- Commits not in Conventional Commits format
- `docs: update CHANGELOG` commit detected (now skipped)

**Solutions:**
- Start commit messages with `feat:`, `fix:`, `docs:`, etc.
- Check `commit_parsers` in `cliff.toml`
- ✅ Already fixed! (skip rule added)

### Canary Release Not Created

**Causes:**
- PR not merged to dev
- Workflow execution failed

**Solutions:**
- Check GitHub Actions tab
- Verify PR was merged to `dev` branch
- Manually trigger workflow if needed

### Tag Not Created Automatically

**Causes:**
- No label on PR
- Not run manually

**Solutions:**
- Method 1: Add `release:patch` label to PR
- Method 2: Manually run from GitHub Actions

### Release Notes Empty

**Causes:**
- No recent commits
- No tags for comparison

**Solutions:**
- Canary releases show last 10 commits automatically
- Production releases use CHANGELOG sections

### Infinite Loop Occurring

**Causes:**
- `[skip ci]` is missing
- Workflow conditions are incorrect

**Solutions:**
- ✅ Already fixed! (changelog.yml)
- Include `[skip ci]` in commit message
- Check GitHub Actions bot

---

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [git-cliff Documentation](https://git-cliff.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Canary Release Guide](CANARY_RELEASE_GUIDE.md)

---

## 🎉 Summary

### Complete Automation Flow

**Development Cycle:**
1. Sprint development
2. PR to dev → 📝 **CHANGELOG update** (automatic) + 🐤 **Canary release** (automatic)
3. Testing and feedback
4. PR to main → 🏷️ **Tag creation** (automatic, with label)
5. 🎉 **Production release** (automatic)

**Manual tasks:**
- Sprint development
- PR creation and review
- Click PR merge button
- (Optional) Add release label
- (Optional) Enter version in GitHub Actions

**Automatically handled:**
- ✅ Canary releases (dev merges)
- ✅ CHANGELOG updates (main merges)
- ✅ Version tag creation (with labels)
- ✅ GitHub Release creation
- ✅ Release notes generation
- ✅ Pre-release flag management

**Time saved: ~15 minutes → ~30 seconds** ⚡

---

## 🚀 Quick Reference

### Create Canary Release
```bash
# Just merge PR to dev
sprint/branch → dev (PR & Merge)
# → Canary created automatically!
```

### Create Production Release
```bash
# Option 1: With label
dev → main PR + label:release:patch
# → Automatic release!

# Option 2: Manual
GitHub Actions → Release Automation → Run
# → Enter version → Run
```

### Check Releases
- Canary: https://github.com/ssota-labs/ssota/releases (Pre-release)
- Production: https://github.com/ssota-labs/ssota/releases (Latest)

---

Happy releasing! 🎉
