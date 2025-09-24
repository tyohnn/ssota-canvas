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

- **Technical Implementation**: Added OAuth2 integration with JWT tokens
- **Design Decisions**: Chose OAuth2 over custom auth for industry standards compliance
- **Alternatives**: Considered SAML but chose OAuth2 for broader ecosystem support

Impact: Improves user retention by 25% and enables personalized experiences.
```

```bash
feat(install): add React Query for server state management

Frontend developers were experiencing performance issues due to
unnecessary API calls and lack of caching mechanisms.

- **Technical Implementation**: Installed and configured React Query v4
- **Design Decisions**: Chose React Query over SWR for its optimistic updates support
- **Alternatives**: Considered Apollo Client but selected React Query for its simplicity

Impact: Reduces API calls by 40% and improves app responsiveness.
```

#### 🐛 Bug Fixes (`fix`)
Bug fixes and error corrections

```bash
fix: resolve memory leak in canvas rendering

Users experienced application crashes after extended use of the
visual canvas, particularly when working with large diagrams.

- **Technical Implementation**: Added proper cleanup for event listeners in useEffect
- **Design Decisions**: Implemented cleanup in component unmount and dependency changes
- **Alternatives**: Considered using WeakMap but chose explicit cleanup for clarity

Impact: Eliminates crashes and improves stability for long sessions.
```

```bash
fix(security): patch XSS vulnerability in component editor

External contributors could inject malicious scripts through the
component property editor, potentially compromising user data.

- **Technical Implementation**: Added DOMPurify sanitization for all user inputs
- **Design Decisions**: Implemented whitelist-based validation approach
- **Alternatives**: Considered CSP headers but chose input sanitization for flexibility

Impact: Protects user data and maintains platform security compliance.
```

#### ♻️ Refactoring (`refactor`)
Code restructuring without changing functionality

```bash
refactor: extract block positioning logic into service layer

The canvas component contained 200+ lines of positioning logic,
making it difficult for developers to maintain and test.

- **Technical Implementation**: Created BlockPositioningService class with coordinate calculations
- **Design Decisions**: Used dependency injection pattern for testability
- **Alternatives**: Considered mixins but chose composition for better separation of concerns

Impact: Improves code maintainability and reduces bug introduction risk.
```

```bash
refactor(extract): separate business logic from UI components

Domain logic was tightly coupled with React components, causing
issues when reusing business rules across different interfaces.

- **Technical Implementation**: Created domain services layer with pure functions
- **Design Decisions**: Applied clean architecture principles for separation of concerns
- **Alternatives**: Considered custom hooks but chose services for better testability

Impact: Enables code reuse and simplifies testing strategies.
```

#### 🧪 Tests (`test`)
Test additions and improvements

```bash
test: add integration tests for canvas workflow engine

The team lacked confidence when deploying canvas-related changes
due to insufficient test coverage.

- **Technical Implementation**: Created integration test suite using Jest and Testing Library
- **Design Decisions**: Focused on critical workflow paths and edge cases
- **Alternatives**: Considered unit tests only but chose integration for better coverage

Impact: Increases deployment confidence and reduces production incidents.
```

#### 📚 Documentation (`docs`)
Documentation updates and improvements

```bash
docs: update architecture documentation with DDD patterns

New team members struggled to understand the domain-driven design
implementation, leading to inconsistent code patterns.

- **Technical Implementation**: Added comprehensive DDD architecture guide with diagrams
- **Design Decisions**: Included practical examples and common anti-patterns
- **Alternatives**: Considered video format but chose written docs for searchable reference

Impact: Reduces onboarding time by 50% and ensures consistent implementations.
```

#### 💅 Style (`style`)
Code formatting and style improvements

```bash
style: fix ESLint errors and formatting issues

The codebase had accumulated linting errors that were blocking
the CI pipeline, preventing smooth development workflow.

- **Technical Implementation**: Ran ESLint autofix and Prettier formatting
- **Design Decisions**: Applied consistent import ordering and removed unused variables
- **Alternatives**: Manual fixes considered but chose automated tools for consistency

Impact: Enables clean CI builds and consistent code quality.
```

#### ⚡ Performance (`perf`)
Performance optimizations

```bash
perf: optimize database queries in workflow execution

Workflow executions were timing out under moderate load due to
inefficient database queries.

- **Technical Implementation**: Added composite indexes and optimized query execution plans
- **Design Decisions**: Implemented query result caching for frequently accessed data
- **Alternatives**: Considered read replicas but chose query optimization for cost efficiency

Impact: Improves system throughput by 60% under load.
```

#### 🔧 Configuration (`ci`, `build`, `chore`)
Tool and configuration changes

```bash
ci: update GitHub Actions workflow for deployment

The current deployment process was manual and error-prone,
causing delays in releases.

- **Technical Implementation**: Created automated deployment workflow with testing stages
- **Design Decisions**: Implemented blue-green deployment strategy for zero-downtime
- **Alternatives**: Considered Jenkins but chose GitHub Actions for better integration

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
- **Technical Implementation**: Describe the specific changes made
- **Design Decisions**: Explain why certain approaches were chosen
- **Alternatives**: Mention other options considered and why they were discarded

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
async reviews and manual conflict resolution.

- **Technical Implementation**: Added WebSocket infrastructure with operational transformation
- **Design Decisions**: Chose OT over CRDT for better handling of complex diagram structures
- **Alternatives**: Considered Google Docs-style collaboration but chose custom OT for domain-specific needs

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

## AI Collaboration Guidelines

When working with AI assistants for commit message generation, please follow these guidelines:

### For AI Assistants:
1. **Study Previous Patterns**: Before suggesting commit messages, review the recent commit history to understand the established patterns and conventions used in this project.

2. **Analyze Existing Messages**: Look at the last 5-15 commits to identify:
   - Common commit types used (feat, fix, refactor, etc.)
   - Typical scope patterns (component names, modules)
   - Level of detail in problem statements
   - Impact measurement approaches

3. **Follow Established Conventions**: Match the style, tone, and level of detail found in recent commits rather than using generic templates.

4. **Domain Context Awareness**: Consider the specific domain context of changes:
   - For user-facing features: Focus on user experience improvements
   - For developer tools: Emphasize development productivity gains
   - For infrastructure: Highlight reliability and performance benefits

### Example AI Interaction:
```
AI: "I notice your recent commits use detailed problem statements from the user perspective and specific impact metrics. For this authentication feature, would you like me to draft a message following that pattern?"

Developer: "Yes, please analyze the recent feat commits and suggest a message for the OAuth integration."
```

This approach ensures AI-generated commit messages maintain consistency with human-written messages and respect the project's established conventions.

## Branch Strategy

We follow an Agile-based branching strategy that aligns with our sprint and story structure. This ensures clean development workflows and proper code review processes.

### Branch Structure

```
main
└── sprint-{number} (Sprint Branch)
    ├── story-{story-id}-{description} (Story Branch)
    │   ├── subtask-{component}-{description} (Subtask Commit)
    │   ├── subtask-{component}-{description} (Subtask Commit)
    │   └── subtask-{component}-{description} (Subtask Commit)
    ├── story-{story-id}-{description} (Story Branch)
    └── story-{story-id}-{description} (Story Branch)
```

### Branch Naming Convention

#### Sprint Branches
```
sprint-1 (Current Sprint Working Branch)
sprint-2 (Next Sprint Preparation Branch)
```

#### Story Branches
```
story-WS-1.1-org-management
story-WS-1.2-workspace-creation
story-WS-1.3-clerk-integration
```

**Format**: `story-{epic-code}-{story-number}-{kebab-case-description}`

### Branch Lifecycle

1. **Create Sprint Branch**
   ```bash
   git checkout main
   git checkout -b sprint-1
   ```

2. **Create Story Branch**
   ```bash
   git checkout sprint-1
   git checkout -b story-WS-1.1-org-management
   ```

3. **Subtask Development and Commit**
   ```bash
   # Commit for each completed subtask (following the commit convention above)
   git commit -m "feat: implement Organization entity with validation..."
   ```

4. **Create Pull Request After Story Completion**
   ```bash
   # After completing work on the story branch
   git push origin story-WS-1.1-org-management

   # Create Pull Request on GitHub
   # - Target: sprint-1 branch
   # - Write using PR template
   # - Request senior developer review
   ```

5. **Merge After Senior Developer Code Review and Approval**
   ```bash
   # Merged only after senior developer approval
   # - Verify all checklist items are completed
   # - Confirm tests pass
   # - Review code quality
   # - Auto-merge to Sprint branch
   ```

### Best Practices

- **Branch Lifespan**: Complete within 1-3 days
- **Commit Unit**: Commit for each completed subtask
- **Merge Process**: Always merge through PR with senior developer review
- **Branch Cleanup**: Set automatic branch deletion after PR merge
- **Conflict Resolution**: Resolve conflicts in story branch before creating PR

### Subtask-Driven Development

Our development process is driven by subtasks defined in the sprint stories. Each commit should correspond to a completed subtask, ensuring granular progress tracking and easier debugging.

#### Subtask to Commit Mapping

Each story contains multiple subtasks that become individual commits:

```bash
# Story WS-1.1: Organization Management
# Backend Domain
- [x] Implement Organization Entity
- [x] Implement Organization Aggregate
- [x] Implement CreateOrganization Command Handler

# Database & Repository
- [x] Create organizations table
- [x] Implement OrganizationRepository

# API & Server Action
- [x] Implement createOrganizationAction
- [x] Implement Clerk webhook handler
```

#### Commit Message Structure for Subtasks

```bash
feat: implement Organization entity with validation

Organization entity lacked proper domain modeling and validation rules,
causing inconsistent data handling across the application. This implementation
adds comprehensive entity with business rules and validation.

- **Technical Implementation**: Created Organization class with value objects
- **Design Decisions**: Applied DDD patterns for domain integrity
- **Alternatives**: Considered ORM entities but chose pure domain objects

Impact: Ensures data consistency and enables better testing strategies.
```

#### Progress Tracking Benefits

1. **Granular Tracking**: Each subtask completion is visible in git history
2. **Easier Rollbacks**: Can rollback to specific subtask state if needed
3. **Clear Accountability**: Each developer knows exactly what they worked on
4. **Better Code Review**: Reviewers can see logical progression of work
5. **Debugging**: Easy to trace which subtask introduced issues

---

## Pull Request Guidelines

All pull requests require senior developer code review before merging. PR descriptions should reference the relevant stories in `docs/event-storming/agile-planning/` and follow a structured format similar to our commit message conventions.

### PR Format

```
[Story Reference] <type>: <description>

## Problem Statement
<problem statement from domain perspective>

## Solution Approach
- **Technical Implementation**: Describe the specific changes made
- **Design Decisions**: Explain why certain approaches were chosen
- **Alternatives**: Mention other options considered

## Impact
<quantified expected benefits>

## Related Stories
- Link to relevant story documents in agile-planning
- Reference specific acceptance criteria implemented

## Testing
- Unit tests added/coverage
- Integration tests included
- E2E tests performed

## Checklist
- [ ] Code reviewed by senior developer
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Linting checks pass
- [ ] Story acceptance criteria met
```

### Code Review Process

1. **Create Story Branch**: Develop on story-specific branches
2. **Complete All Subtasks**: Ensure all related subtasks are committed
3. **Self-Review**: Review your own code before creating PR
4. **Create Pull Request**: Push branch and create PR targeting sprint branch
5. **Request Review**: Tag senior developers for mandatory review
6. **Address Feedback**: Incorporate review feedback and update PR
7. **Final Approval**: Get approval from at least one senior developer
8. **Auto-merge**: PR is automatically merged after approval

### Referencing Agile Planning Documents

PR descriptions must reference the relevant story documents:

```bash
## Related Stories
- [WS-1.1 Organization Management](docs/event-storming/agile-planning/stories/workspace-structure/sprint-1-stories.md#story-ws-11-organization-management-8pts-)
- Acceptance Criteria: Create organization from Clerk ✅
- Acceptance Criteria: Sync organization members ✅
- Acceptance Criteria: Update organization settings ✅

## Implementation Details
This PR implements the complete Organization Management story as defined
in the sprint planning document, including all backend domain logic,
database schema, API endpoints, and frontend components.
```

### Best Practices

#### ✅ Do
- Reference specific story IDs and acceptance criteria
- Link to the exact section in agile-planning documents
- Mention which subtasks were completed
- Include testing results and coverage metrics
- Tag senior developers for review

#### ❌ Don't
- Submit PRs without referencing the story document
- Create PRs that span multiple unrelated stories
- Skip the senior developer review process
- Write generic descriptions without domain context

### Example PR Description

```bash
[WS-1.1] feat: implement Organization Management system

## Problem Statement
Users were unable to create and manage organizations, leading to
scattered workspace access and difficulty in team collaboration.
The lack of organization structure made it impossible to manage
workspace permissions and member access systematically.

## Solution Approach
- **Technical Implementation**: Created Organization aggregate with event sourcing
- **Design Decisions**: Chose event sourcing for audit trail and debugging capabilities
- **Alternatives**: Considered simple CRUD but chose DDD for better domain modeling

## Impact
Enables systematic team collaboration with proper access controls,
expected to improve team productivity by 35% based on similar
organizational features in other platforms.

## Related Stories
- [WS-1.1 Organization Management](docs/event-storming/agile-planning/stories/workspace-structure/sprint-1-stories.md#story-ws-11-organization-management-8pts-)
- All acceptance criteria implemented and tested

## Testing
- Unit test coverage: 85% for Organization domain
- Integration tests: 12 scenarios covering all command handlers
- E2E tests: Complete organization creation and member sync flow

## Checklist
- [x] Code reviewed by senior developer
- [x] All tests pass (unit: 95%, integration: 88%)
- [x] Documentation updated with new domain models
- [x] Linting checks pass
- [x] Story acceptance criteria met
```

## Development Setup

[Add your development setup instructions here]

## Questions?

If you have any questions about contributing, please open an issue or reach out to the team.
