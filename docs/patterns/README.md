# Architecture & Implementation Patterns

This directory contains guides and standards for the design and implementation patterns commonly used across the SSOTA project. These patterns are designed to maximize testability, maintainability, and developer productivity.

## Core Patterns

### 🧩 [Dependency-based Type Layering](./dependency-based-type-layering.md)
Standardized ordering for `types.ts` files. It ensures a logical "bottom-up" flow where types are defined before they are referenced, aligning with industry-best practices for readability.

### 🧩 [Object-based Dependency Injection](./object-based-dependency-injection.md)
A pattern for centralizing external framework dependencies (like React Flow or Store hooks) into a single Entry Hook. This enables pure logic layers and simplifies unit testing.

---

## Principles for Pattern Adoption

1.  **Consistency**: Use the same folder structures, naming conventions, and boilerplate across the entire project to reduce cognitive load.
2.  **Testability**: Every piece of business or UI logic should be independently testable. Avoid direct calls to heavy external libraries inside domain logic.
3.  **Readability**: Structure your code so that another engineer can understand the flow of data and dependencies just by glancing at the file structure and type definitions.
