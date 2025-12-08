# Version Mapping Guide: Initiative/Epic/Story → Software Version

> Created: 2025.12.08  
> Purpose: Methodology for mapping agile hierarchy to software versions

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [SSOTA Project Version Mapping Strategy](#ssota-project-version-mapping-strategy)
3. [Practical Examples](#practical-examples)
4. [Best Practices](#best-practices)
5. [Alternative Methodologies](#alternative-methodologies)

---

## 1. Overview

### Relationship Between Agile Hierarchy and Versions

The method of mapping the **Initiative → Epic → Story** hierarchy to software versions varies depending on project maturity, release strategy, and team size.

### Core Principles

1. **Versions should represent user value delivery units**
2. **Versions should be the minimum shippable unit**
3. **Versions should have clear goals and success criteria**

---

## 2. SSOTA Project Version Mapping Strategy

### 2.1 Methodology: Sprint = Minor Version (Sprint-Centric Version Management)

The SSOTA project uses the **Sprint = Minor Version** strategy.

#### Applicable Scenarios

- Small to medium-sized projects
- Sprint-based development
- Fast feedback loops
- Direct connection between team rhythm and versions

#### Mapping Structure

```
Initiative (Quarterly) → Multiple Sprints → Major Version (v1.0, v2.0)
Epic (2-6 weeks) → Implemented across multiple Sprints
Story (1-3 days) → Work within Sprint
Sprint (1-2 weeks) → Minor Version (v1.1, v1.2, v1.3)
```

#### Version Naming Convention

```bash
# Upon Sprint completion (Development)
v<major>.<minor>.<patch>-sprint-<number>
Example: v1.1.0-sprint-1, v1.2.0-sprint-2

# Production release
v<major>.<minor>.<patch>
Example: v1.0.0, v1.1.0, v1.2.0
```

#### Real-World Example

**Initiative: "Core Platform Foundation" (Q1 2024)**
- **Sprint 1**: Workspace Management Epic (partial) → `v1.1.0-sprint-1`
- **Sprint 2**: Workspace Management Epic (complete) → `v1.2.0-sprint-2`
- **Sprint 3**: Canvas Management Epic (partial) → `v1.3.0-sprint-3`
- **Sprint 4**: Canvas Management Epic (complete) → `v1.4.0-sprint-4`

**Upon Initiative completion**: `v2.0.0` (Production release)

---

### 2.2 Version Increment Rules

#### Major Version (v1.0 → v2.0)
- **Criteria**: Initiative completion or strategic turning point
- **Examples**:
  - MVP → v1.0.0
  - GTM Pivot (Canvas → Knowledge Note) → v2.0.0
  - Major architecture changes (Monorepo migration, etc.)

#### Minor Version (v1.0 → v1.1)
- **Criteria**: Sprint completion
- **Examples**:
  - Sprint 1 complete → v1.1.0
  - Sprint 2 complete → v1.2.0
  - Sprint 3 complete → v1.3.0

#### Patch Version (v1.1.0 → v1.1.1)
- **Criteria**: Bug fixes, minor improvements
- **Examples**:
  - Story "Bug fix" complete → v1.1.1
  - Story "UI improvement" complete → v1.1.2

---

### 2.3 Advantages and Disadvantages

#### ✅ Advantages

1. **Direct connection between Sprint completion and version**
   - Sprint completion = Version release
   - Team rhythm aligns with versions

2. **Very fast iteration possible**
   - Version release every 1-2 weeks
   - Rapid feedback collection

3. **Clear progress tracking**
   - Clear version per Sprint
   - Track progress through versions

4. **Flexible Epic management**
   - Natural management even when Epics span multiple Sprints
   - Epic completion timing separated from versions for flexibility

#### ⚠️ Disadvantages

1. **Weak connection between Epic/Initiative and versions**
   - Epic completion timing not directly linked to versions
   - Initiative completion only shown as Major Version

2. **Versions may increase frequently**
   - Minor Version increases with each Sprint
   - Version numbers increase rapidly

**Mitigation Strategies**:
- Mark Epic completion timing with special tags or release notes
- Use Major Version at Initiative completion to connect with long-term goals

---

## 3. Practical Examples

### 3.1 SSOTA v1.0.0 Release Plan

**Initiative: "SSOTA MVP Release"** (Q4 2025)

```
v1.0.0 (Production Release)
├─ Sprint 1 → v1.1.0-sprint-1
│   ├─ Epic: "Basic Block System" (partial)
│   │   ├─ Story: Basic block definition
│   │   └─ Story: View mode system
│
├─ Sprint 2 → v1.2.0-sprint-2
│   ├─ Epic: "Basic Block System" (complete)
│   │   └─ Story: Markdown block migration
│
├─ Sprint 3 → v1.3.0-sprint-3
│   ├─ Epic: "Database Feature" (partial)
│   │   └─ Story: Database creation/setup
│
├─ Sprint 4 → v1.4.0-sprint-4
│   ├─ Epic: "Database Feature" (complete)
│   │   └─ Story: Table view rendering
│
└─ Sprint 5 → v1.5.0-sprint-5
    └─ Epic: "AI Research Tool"
        └─ Story: Web search-based research
```

**Release Strategy**:
1. Upon each Sprint completion → `v1.X.0-sprint-N` tag
2. After all Sprints complete → `v1.0.0` production release (consolidated as Major Version)

---

### 3.2 Version Tag Creation Process

#### Upon Sprint Completion

```bash
# 1. Verify all Stories in Sprint are complete
# 2. Check CHANGELOG
git cliff --current --strip header | cat

# 3. Create Sprint version tag
git tag -a v1.1.0-sprint-1 \
  -m "Sprint 1 complete
  - Epic: Workspace Management (partial)
  - Story: Workspace Creation
  - Story: Workspace Invitation
  - Story: Page Navigation"

# 4. Push tag
git push origin v1.1.0-sprint-1
```

#### Production Release (Major Version)

```bash
# 1. Verify all Sprints in Initiative are complete
# 2. Decide on Major Version increment
# 3. Create production release tag
git tag -a v1.0.0 \
  -m "Release v1.0.0: SSOTA MVP
  - Core Platform Foundation Initiative Complete
  - Sprint 1: Workspace Management (partial)
  - Sprint 2: Workspace Management (complete)
  - Sprint 3: Canvas Management (partial)
  - Sprint 4: Canvas Management (complete)
  - Sprint 5: Block Management (partial)"

# 4. Push tag and create GitHub Release
git push origin v1.0.0
```

---

## 4. Best Practices

### 4.1 Version Mapping Principles

#### ✅ DO

1. **Set clear criteria**
   - Clearly define Major/Minor/Patch increment criteria
   - Manage as shared team documentation

2. **User value centered**
   - Versions should represent user-perceivable value units
   - Focus on features/experience rather than technical changes

3. **Maintain consistency**
   - Consistently maintain the strategy once decided
   - Share with team when changes occur

4. **Leverage automation**
   - Automatic CHANGELOG generation
   - GitHub Release automation
   - Automatic version tag creation (optional)

#### ❌ DON'T

1. **Excessive version increments**
   - Avoid version increments per Story
   - Group by Sprint unit

2. **Unclear criteria**
   - Avoid vague criteria like "big changes"
   - Use specific checklists

3. **Mismatch between versions and hierarchy**
   - Avoid only Patch increments for Initiative completion
   - Use Major Version

---

### 4.2 Checklist: Version Increment Decision

#### Major Version Increment Checklist

- [ ] Is it Initiative completion or strategic turning point?
- [ ] Is it meaningful change for users?
- [ ] Does it align with marketing/GTM strategy?
- [ ] Does it break backward compatibility?

#### Minor Version Increment Checklist (Sprint Completion)

- [ ] Are all Stories in Sprint complete?
- [ ] Is Sprint goal achieved?
- [ ] Are tests complete?
- [ ] Is CHANGELOG updated?

#### Patch Version Increment Checklist

- [ ] Is it bug fix or minor improvement?
- [ ] Does it have minimal impact on user experience?
- [ ] Can it be released quickly?

---

### 4.3 Version Management Tool Usage

#### Semantic Versioning

```bash
# Version format
MAJOR.MINOR.PATCH

# Examples
v1.0.0  # Major: Initiative complete
v1.1.0  # Minor: Sprint 1 complete
v1.1.1  # Patch: Bug fix
```

#### Sprint Suffix (Development)

```bash
# Development versions
v1.1.0-sprint-1  # Sprint 1 complete
v1.2.0-sprint-2  # Sprint 2 complete
v1.2.0           # Production release (Sprint Suffix removed)
```

#### Pre-release Suffix (Beta/RC)

```bash
# Beta versions
v1.1.0-beta.1
v1.1.0-beta.2

# Release Candidate
v1.1.0-rc.1
v1.1.0-rc.2

# Production
v1.1.0
```

---

## 5. Alternative Methodologies

As the project matures or team size grows, the following methodologies can be considered.

### 5.1 Methodology A: Initiative = Major Version (Strategic Version Management)

**Applicable Scenarios**: Large-scale projects, long-term roadmap, clear strategic milestones

```
Initiative (Quarterly) → Major Version (v1.0, v2.0, v3.0)
Epic (2-6 weeks) → Minor Version (v1.1, v1.2, v1.3)
Story (1-3 days) → Patch Version (v1.1.1, v1.1.2, v1.1.3)
```

**Examples**:
- **v1.0.0**: Initiative "Core Platform Foundation" complete
- **v1.1.0**: Epic "Workspace Management" complete
- **v1.1.1**: Story "Workspace Creation" complete
- **v1.1.2**: Story "Workspace Invitation" complete

**Advantages**:
- Clear connection between strategic goals and versions
- Easy long-term roadmap management
- Easy integration with marketing/GTM strategy

**Disadvantages**:
- Major versions may increase too rapidly
- May not be suitable for fast iteration development

---

### 5.2 Methodology B: Epic = Minor Version (Feature-Centric Version Management)

**Applicable Scenarios**: Medium-sized projects, feature-centric releases, fast iteration

```
Initiative (Quarterly) → Multiple Minor Versions (v1.0 ~ v1.5)
Epic (2-6 weeks) → Minor Version (v1.1, v1.2, v1.3)
Story (1-3 days) → Patch Version or aggregated within Sprint
```

**Examples**:
- **v1.0.0**: MVP release
- **v1.1.0**: Epic "Canvas Management" complete
- **v1.2.0**: Epic "Block Management" complete
- **v1.2.1**: Story bug fixes

**Advantages**:
- Clear release per feature unit
- Suitable for fast iteration development
- Clear feature addition communication to users

**Disadvantages**:
- Weak connection between Initiative and versions
- Minor versions may increase frequently

---

### 5.3 Methodology Transition Considerations

Strategy can be changed based on project maturity:

**Early Stage (MVP ~ v1.0)**:
- Sprint = Minor Version (current strategy)
- Fast feedback and iteration

**Growth Stage (v1.0 ~ v2.0)**:
- Maintain Sprint = Minor Version or
- Consider transitioning to Epic = Minor Version

**Mature Stage (v2.0+)**:
- Consider Initiative = Major Version
- Strategic milestone centered

---

## 6. References

### Related Documents

- [Versioning & Release Tags](../../CONTRIBUTING.md#versioning--release-tags)
- [Release v1.0.0 Development Plan](../releases/v1.0.0-release-plan.md)
- [Sprint Planning Guide](./05-sprint-planning-guide.md)
- [Epic Planning Guide](./03-epic-planning-guide.md)

### External Resources

- [Semantic Versioning](https://semver.org/)
- [SAFe Version Strategy](https://www.scaledagileframework.com/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

---

## 7. Summary

### SSOTA Project Recommended Strategy

```
Initiative (Quarter) → Major Version (v1.0, v2.0)
Sprint (1-2 weeks) → Minor Version (v1.1, v1.2)
Story (1-3 days) → Work within Sprint
Epic (2-6 weeks) → Implemented across multiple Sprints
```

### Core Principles

1. **Versions are user value delivery units**
2. **Maintain clear criteria and consistency**
3. **Simplify processes through automation**
4. **Adjust strategy based on project maturity**

---

**Author**: AI Assistant  
**Last Updated**: 2025.12.08  
**Next Review**: To be updated based on project progress
