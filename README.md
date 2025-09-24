# Xbowl - DDD-Based Workspace Management System

An event storming driven, domain-driven design (DDD) workspace management system built with modern web technologies and agile development practices.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Run linting
pnpm lint

# Type checking
pnpm typecheck
```

## 📋 CHANGELOG

This project uses automated CHANGELOG generation to track all changes and maintain project history.

```bash
# Generate CHANGELOG from recent commits
pnpm changelog

# Preview what would be added to CHANGELOG
pnpm changelog:preview

# Check for new changes
pnpm changelog:check
```

**Automated System**: CHANGELOG.md is automatically updated on every push to main/dev/sprint branches using GitHub Actions.

## 📚 Contributing

This project follows a structured development workflow:

### 🏗️ Architecture
- **Event Storming** → **DDD** → **Technical Design** → **Agile Implementation**
- **Sprint-based development** with story-driven feature branches
- **Senior developer review** required for all changes

### 🤖 AI Collaboration
- AI agents implement subtasks following established patterns
- Senior developers provide architectural guidance and review
- Automated systems handle documentation and tracking

### 📝 Documentation
- [Event Storming Documentation](docs/event-storming/)
- [Agile Planning](docs/event-storming/agile-planning/)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🔧 Development Workflow

### 1. Sprint Planning
```bash
git checkout -b sprint-1
# Add sprint goals to CHANGELOG.md
```

### 2. Story Implementation
```bash
git checkout -b story-WS-1.1-org-management
# Implement features with conventional commits
git commit -m "feat: implement Organization entity..."
```

### 3. Pull Request & Review
```bash
# Create PR with senior developer review
# CHANGELOG automatically updated
```

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, TypeScript, PostgreSQL
- **Architecture**: Domain-Driven Design, Event Sourcing, CQRS
- **Development**: Turbo, pnpm, ESLint, Prettier
- **Documentation**: Event Storming, Agile Planning

## 📄 License

This project is private and proprietary.
