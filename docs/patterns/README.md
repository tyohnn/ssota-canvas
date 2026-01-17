# Architecture & Implementation Patterns

This directory contains guides and standards for the design and implementation patterns commonly used across the SSOTA project. These patterns are designed to maximize testability, maintainability, and developer productivity.

## Core Patterns

### 🧩 [Dependency-based Type Layering](./dependency-based-type-layering.md)
Standardized ordering for `types.ts` files. It ensures a logical "bottom-up" flow where types are defined before they are referenced, aligning with industry-best practices for readability.

### 🧩 [Object-based Dependency Injection](./object-based-dependency-injection.md)
A pattern for centralizing external framework dependencies (like React Flow or Store hooks) into a single Entry Hook. This enables pure logic layers and simplifies unit testing.

### 🧩 [Server-Side DDD Conventions](./server-side-ddd-conventions.md)
Comprehensive guide for Domain-Driven Design patterns in Next.js Server Actions, including Trust Boundary, data flow, type safety, and Event Storming integration.

### 🧩 [Next.js Server Actions Framework Proposal](./next-action-framework-proposal.md)
Proposal for a DDD-integrated framework/library for Next.js Server Actions. Includes market analysis, API design, and detailed explanation of Command/Aggregate/Event patterns.

### 🧩 [Read Model Pattern Guide](./backend/read-model-pattern-guide.md)
Guide for implementing Read Model pattern in CQRS architecture. Covers when to use Read Models, performance optimization (JOIN vs separate queries), index strategies, and trade-offs.

### 🧩 [Database Migration Validation Guide](./backend/database-migration-validation-guide.md)
Comprehensive checklist and workflow for validating database migrations before applying to production. Includes 15 validation checks, pre-migration scripts, and safe migration templates.

### 🧪 [Testing Guide](./test/testing-guide.md)
Comprehensive guide for testing strategies and patterns used in the SSOTA project. Covers unit tests, integration tests, E2E tests, component tests, and best practices for mocking vs. real imports.

---

## Principles for Pattern Adoption

1.  **Consistency**: Use the same folder structures, naming conventions, and boilerplate across the entire project to reduce cognitive load.
2.  **Testability**: Every piece of business or UI logic should be independently testable. Avoid direct calls to heavy external libraries inside domain logic.
3.  **Readability**: Structure your code so that another engineer can understand the flow of data and dependencies just by glancing at the file structure and type definitions.
