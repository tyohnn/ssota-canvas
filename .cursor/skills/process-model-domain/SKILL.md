---
name: process-model-domain
description: Define Process Model from Event Storm results and produce 02-process-model.md documentation. Use when the user wants to create 02-process-model.md, design Event→Policy→Read Model→Command→System→Event sequences, run a process model workshop, or convert 01-event-storm.md to executable process flows. Follows the project's event-domain-design process model guide.
---

# Process Model Domain Design

This skill turns **Event Storming results** into a **Process Model**: concrete scenarios and sequences (Event → Policy → Read Model → Command → System → Event). Use when `01-event-storm.md` exists and the user wants 02-process-model.md for a domain.

## Before You Begin: Prerequisites

- [ ] `docs/event-domain-design/domains/<domain-name>/01-event-storm.md` is complete and approved
- [ ] Hotspots and Opportunities are identified
- [ ] Process Model questions from the event-storm are available

## Skill File Structure

```
process-model-domain/
├── SKILL.md
└── reference/
    ├── sequence-patterns.md   # Event→Policy→… order, Policy/System/UI Hint rules
    └── writing-rules.md       # Quality checklist, anti-patterns
```

## Output Location

| Type | Path |
|------|------|
| Output document | `docs/event-domain-design/domains/<domain-name>/02-process-model.md` |
| Source template | `docs/event-domain-design/template/02-process-model-template.md` |
| Input (required) | `docs/event-domain-design/domains/<domain-name>/01-event-storm.md` |

---

## Process Model Phases (Summary)

### Phase 1: Event Storm 결과 분석
- Confirm event-storm.md is done; review Domain Events, Hotspots, Process Model questions
- Select **5–7 core user journeys** (high business value, Hotspots, External System integration)
- Copy template: `cp docs/event-domain-design/template/02-process-model-template.md docs/event-domain-design/domains/<domain-name>/02-process-model.md`

### Phase 2: Process Model 워크샵
- **External System 식별**: SSOT, integration (Webhook/API/Event), failure strategy
- **시나리오·시퀀스 정의**: For each scenario, apply **Event → Policy → Read Model → Command → System → Event**
- **검증**: Order consistency, Policy "Whenever-then" form, System boundaries

### Phase 3: 02-process-model.md 문서 작성
- Fill: Overview, External System, Scenario 0 (sync), Scenario 1~N, 핵심 Policy 정리, 기술 권장사항
- Use [reference/sequence-patterns.md](reference/sequence-patterns.md) for structure and naming
- Validate with [reference/writing-rules.md](reference/writing-rules.md)

### Phase 4: 문서 검증 및 리뷰
- Domain expert: business process and Policy correctness
- Senior dev: system boundaries, External System integration, Software Design readiness
- Event Storm ↔ Process Model consistency check

---

## Core Rules

### Sequence order (strict)
**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → …

### UI/UX independence (hybrid)
- **Always**: Business policies, permissions, system processing
- **Optional**: `*UI Hint:` only (e.g. "옵션 선택 UI", "확인 다이얼로그") — abstract, no component names
- **Never**: Button position, colors, animations, concrete component names (MUI, shadcn, etc.)

### Policy wording
- Use **Whenever-then**: "Whenever [event], then always [action]"
- Event immediately triggers next step: Event → **Policy** → Read Model → Command → System → Event

### System naming
- Internal: `[Entity] System` (e.g. User System)
- Other domain: `[Domain] - [Entity] System`
- Third-party: `[Name] System` (e.g. Supabase Auth System)
- Frontend: `(웹) - Frontend`

---

## Quick Start Workflow

1. **Confirm input**: Ensure `01-event-storm.md` exists for the domain
2. **Copy template**: `cp docs/event-domain-design/template/02-process-model-template.md docs/event-domain-design/domains/<domain-name>/02-process-model.md`
3. **Run phases**: Phase 1 (analyze & select journeys) → Phase 2 (workshop: External Systems, scenarios/sequences) → Phase 3 (fill 02-process-model.md)
4. **Apply patterns**: Follow [reference/sequence-patterns.md](reference/sequence-patterns.md) for each Scenario/Sequence
5. **Validate**: Use [reference/writing-rules.md](reference/writing-rules.md) before review

---

## Additional Resources

- **Sequence and naming**: [reference/sequence-patterns.md](reference/sequence-patterns.md) — Event→Policy→… order, Policy/System/UI Hint, 블랙박스 분리
- **Quality and checklist**: [reference/writing-rules.md](reference/writing-rules.md) — Consistency, completeness, anti-patterns
- **Full guide**: `docs/event-domain-design/guide/02-process-model-guide.md` — Workshop timing, examples, validation

---

## Summary Checklist

Before finalizing 02-process-model.md:

### Structure
- [ ] Overview, External System, Scenario 0 (sync), Scenario 1~N, Policy 정리, 기술 권장사항
- [ ] Every scenario uses Event → Policy → Read Model → Command → System → Event
- [ ] Trigger Event and sequence links are clear

### Quality
- [ ] Policy in "Whenever X, then Y" form
- [ ] System boundaries and naming (internal / other domain / third-party / Frontend) correct
- [ ] UI Hint only where needed; no concrete UI/component details
- [ ] Event Storm events and Hotspots reflected; next step is Software Design
