# Contributing to Xbowl

Thank you for your interest in contributing to Xbowl! This document outlines our contribution guidelines and commit message conventions.

## Commit Message Convention

We follow a structured commit message format inspired by Airbnb's style with additional impact information. This helps maintain a clear project history and makes code reviews more efficient.

### Format

```
<type>[optional scope]: <description>

<problem statement from domain perspective>

<solution approach>

<impact>
```

### Commit Types

#### ✨ Features (`feat`)
New functionality or module installations

```bash
feat: add user authentication system

Users were unable to securely access their personal workspaces,
leading to data privacy concerns and limited personalization features.
This implementation adds OAuth2 integration with role-based access control.

Impact: Improves user retention by 25% and enables personalized experiences.
```

```bash
feat(install): add React Query for server state management

Frontend developers were experiencing performance issues due to
unnecessary API calls and lack of caching mechanisms. This addition
provides intelligent data fetching and caching capabilities.

Impact: Reduces API calls by 40% and improves app responsiveness.
```

#### 🐛 Bug Fixes (`fix`)
Bug fixes and error corrections

```bash
fix: resolve memory leak in canvas rendering

Users experienced application crashes after extended use of the
visual canvas, particularly when working with large diagrams.
The issue was caused by improper event listener cleanup in the
rendering engine.

Impact: Eliminates crashes and improves stability for long sessions.
```

```bash
fix(security): patch XSS vulnerability in component editor

External contributors could inject malicious scripts through the
component property editor, potentially compromising user data.
This fix implements input sanitization and validation.

Impact: Protects user data and maintains platform security compliance.
```

#### ♻️ Refactoring (`refactor`)
Code restructuring without changing functionality

```bash
refactor: extract block positioning logic into service layer

The canvas component contained 200+ lines of positioning logic,
making it difficult for developers to maintain and test. This
refactoring separates concerns into dedicated service classes.

Impact: Improves code maintainability and reduces bug introduction risk.
```

```bash
refactor(extract): separate business logic from UI components

Domain logic was tightly coupled with React components, causing
issues when reusing business rules across different interfaces.
This separates pure business logic into dedicated modules.

Impact: Enables code reuse and simplifies testing strategies.
```

#### 🧪 Tests (`test`)
Test additions and improvements

```bash
test: add integration tests for canvas workflow engine

The team lacked confidence when deploying canvas-related changes
due to insufficient test coverage. These tests cover critical
workflow execution paths and edge cases.

Impact: Increases deployment confidence and reduces production incidents.
```

#### 📚 Documentation (`docs`)
Documentation updates and improvements

```bash
docs: update architecture documentation with DDD patterns

New team members struggled to understand the domain-driven design
implementation, leading to inconsistent code patterns. This update
provides clear architectural guidance and examples.

Impact: Reduces onboarding time by 50% and ensures consistent implementations.
```

#### 💅 Style (`style`)
Code formatting and style improvements

```bash
style: fix ESLint errors and formatting issues

The codebase had accumulated linting errors that were blocking
the CI pipeline, preventing smooth development workflow. This
commit resolves all formatting inconsistencies.

Impact: Enables clean CI builds and consistent code quality.
```

#### ⚡ Performance (`perf`)
Performance optimizations

```bash
perf: optimize database queries in workflow execution

Workflow executions were timing out under moderate load due to
inefficient database queries. This optimization adds proper indexing
and query optimization techniques.

Impact: Improves system throughput by 60% under load.
```

#### 🔧 Configuration (`ci`, `build`, `chore`)
Tool and configuration changes

```bash
ci: update GitHub Actions workflow for deployment

The current deployment process was manual and error-prone,
causing delays in releases. This automates the deployment pipeline
with proper testing and rollback capabilities.

Impact: Reduces deployment time from 2 hours to 15 minutes.
```

### Writing Effective Commit Messages

#### 1. Subject Line (Required)
- Use imperative mood: "Add feature" not "Added feature"
- Start with the type followed by scope (optional) and description
- Keep under 50 characters
- No period at the end

#### 2. Problem Statement (Required)
Write from the **domain perspective** considering who is affected:

**For end users:**
- What pain points do users experience?
- How does this affect their workflow?

**For developers (internal/external):**
- What technical challenges do they face?
- How does this impact development productivity?

**For business stakeholders:**
- What business processes are affected?
- How does this impact business metrics?

#### 3. Solution Approach (Required)
- Describe the technical implementation
- Explain the design decisions
- Mention alternatives considered (if relevant)

#### 4. Impact (Required)
Quantify the expected benefits:
- Performance improvements (percentage, time saved)
- User experience enhancements (usability metrics)
- Business value (cost reduction, revenue increase)
- Development productivity (time saved, error reduction)

### Examples

#### Good Example:
```bash
feat(canvas): implement collaborative editing for visual workflows

Design teams needed real-time collaboration capabilities to work
together on complex workflow diagrams, but were limited to
async reviews and manual conflict resolution. This feature adds
operational transform-based real-time editing with conflict resolution.

The implementation uses WebSocket connections for real-time updates
and operational transformation to handle concurrent edits. Users can
now see each other's cursors and changes in real-time.

Impact: Enables 3x faster design iteration cycles and supports
distributed team collaboration, expected to improve team productivity
by 40% based on similar features in other design tools.
```

#### Poor Example:
```bash
feat: add stuff

Fixed some things.

Impact: Better.
```

### Why This Format?

1. **Clarity**: Makes it easy to understand what changed and why
2. **Review Efficiency**: Reviewers can understand changes without reading code
3. **Debugging**: Future developers can trace decision-making
4. **Release Notes**: Can be automatically generated from commit messages
5. **Analytics**: Enables tracking of development patterns and impact

---

## Pull Request Guidelines

When submitting a pull request, please ensure:

1. **Tests**: Add tests for new functionality
2. **Documentation**: Update relevant documentation
3. **Linting**: Ensure all linting checks pass
4. **Review**: Request review from appropriate team members

## Development Setup

[Add your development setup instructions here]

## Questions?

If you have any questions about contributing, please open an issue or reach out to the team.
