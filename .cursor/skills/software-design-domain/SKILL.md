---
name: software-design-domain
description: Defines Software Design from Process Model results and produces 03-software-design.md (Bounded Context, Aggregate, ACL, Context Map). Use when creating 03-software-design.md, designing aggregates from 02-process-model.md, defining Bounded Contexts, ACL for external systems, or running a software design workshop. Follows the project's event-domain-design Software Design guide.
---

# Software Design Domain

This skill turns **Process Model results** into **Software Design**: Bounded Contexts, Aggregates (Commands, Events, Invariants), Anti-Corruption Layers, and Context Map. Use when `02-process-model.md` exists and the user wants `03-software-design.md` for a domain.

## Before You Begin: Prerequisites

- [ ] `docs/event-domain-design/domains/<domain-name>/02-process-model.md` is complete and approved
- [ ] All Systems (internal, external domain, External System, Frontend) are identified in the Process Model
- [ ] Core scenarios and Policy are defined

## Skill File Structure

```
software-design-domain/
├── SKILL.md
└── reference.md   # Aggregate/ACL/Context Map patterns, checklists
```

## Output and Input Paths

| Type | Path |
|------|------|
| Output document | `docs/event-domain-design/domains/<domain-name>/03-software-design.md` |
| Source template | `docs/event-domain-design/template/03-software-design-template.md` |
| Input (required) | `docs/event-domain-design/domains/<domain-name>/02-process-model.md` |
| Full guide | `docs/event-domain-design/guide/03-software-design-guide.md` |

---

## Phase 1: Process Model 결과 분석

1. **Confirm Process Model**: All Systems, External Systems, Policies, Command/Event flows are present.
2. **Extract System list**: Classify each System as **내부** / **외부 도메인** / **External** / **Frontend**. Build a table: System name, type, Commands received, Events emitted.
3. **Prepare document**: Copy template if not exists:
   ```bash
   cp docs/event-domain-design/template/03-software-design-template.md docs/event-domain-design/domains/<domain-name>/03-software-design.md
   ```

---

## Phase 2: Software Design 워크샵

### 2.1 Bounded Context 정의 (30–40분)

- **Group Systems** by same ubiquitous language and strong cohesion.
- **Set boundaries**: One clear business responsibility per Context.
- **Classify**: Core / Supporting / Generic.
- Criteria: same language, strong cohesion, weak coupling, clear responsibility.

### 2.2 Aggregate 및 Invariant 정의 (60분)

- **Map System → Aggregate**: Each Process Model System becomes an Aggregate candidate.
- **Commands/Events**: Take from Process Model; document per Aggregate.
- **Invariants**: Derive from Process Model **Policy** (business rules that must always hold).
- **Verify boundary**: Transaction scope and consistency boundary.

Use the **Aggregate definition pattern** in [reference.md](reference.md) (Root Entity, Commands, Events, Invariants, 포함 엔티티).

### 2.3 ACL 및 Context Map (40–50분)

- **ACL**: For each External System, define adapter that translates external model → domain model. Document: purpose, location, transformation rules, error handling.
- **Context Map**: Relationships between Contexts (Customer-Supplier, Conformist, ACL, Published Language, Open Host). Document integration points and **no circular dependencies**.

See [reference.md](reference.md) for ACL doc template and Context Map template.

---

## Phase 3: 03-software-design.md 문서 작성

Fill the document in this order:

1. **Software Design Overview** — Design summary, link to Process Model, key decisions.
2. **Bounded Context 정의** — Each Context: responsibility, included Aggregates, Core/Supporting/Generic.
3. **Aggregate 상세 정의** — Per Aggregate: Root Entity, Commands, Events, Invariants, 포함 엔티티 (use [reference.md](reference.md) pattern).
4. **Anti-Corruption Layer** — Per External System: purpose, location, transformation rules, error handling.
5. **Context Map** — Diagram and integration points (pattern, direction, interface, integration method).
6. **Read Models** — From Process Model Read Model section; define view interfaces and optimization (caching, TTL).
7. **검증 체크리스트** — Use checklists in [reference.md](reference.md).

---

## Phase 4: 문서 검증 및 리뷰

- **Senior dev**: Aggregate boundaries, implementable Invariants, Context Map patterns, ACL adequacy.
- **Architect**: Consistency with system architecture, coupling, scalability.
- **Domain expert**: Invariants and domain language correctness.
- **Consistency**: Every Process Model System → Aggregate or Service; every Policy → Invariant; every External System behind ACL.

---

## Core Rules

- **System → Aggregate**: Process Model Systems become Aggregates (or Services); do not leave Systems unmapped.
- **Policy → Invariant**: Business rules in Policy become explicit Invariants on Aggregates.
- **External System → ACL**: Every External System integration must be behind an ACL; document transformation and errors.
- **No circular dependencies**: Context Map must have no A → B → A.
- **Concrete enough for implementation**: Design must be detailed enough to feed Technical Specification (directory structure, APIs, DB schema).

---

## Next Step

When 03-software-design.md is complete and reviewed, proceed to **Technical Specification** using `docs/event-domain-design/guide/05-technical-specification-guide.md` (or the project’s technical-spec guide).

---

## Additional Resources

- Full step-by-step guide: `docs/event-domain-design/guide/03-software-design-guide.md`
- Patterns and checklists: [reference.md](reference.md)
