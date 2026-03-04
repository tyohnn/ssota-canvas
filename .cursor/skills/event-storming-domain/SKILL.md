---
name: event-storming-domain
description: Conduct Event Storming for specific business requirements and produce 01-event-storm.md documentation. Use when the user wants to perform event storming, DDD-based domain design, create 01-event-storm.md for a new domain, or design a domain from business/feature requirements. Follows the project's event-domain-design guide and template.
---

# Event Storming Domain Design

This skill conducts Event Storming for specific business requirements and produces structured `01-event-storm.md` documentation following DDD principles. Use when the user provides feature specs, initiative docs, user stories, or describes a domain to design.

## Before You Begin: Gather Requirements

Before conducting event storming, gather essential information:

1. **Business requirements**: Feature spec, initiative doc, user stories, or verbal domain description
2. **Domain name**: Target domain identifier for folder and document (e.g., `inbox-management-domain`)
3. **Key concepts**: Core entities, user flows, external system integrations
4. **Existing context**: Related domains, prior event-storm docs, system boundaries

### Inferring from Context

If the user references an existing spec (e.g., `@docs/plans/inbox-feature-spec.md`), use it as the primary input. Extract domain name, events, actors, and constraints from the document.

---

## Skill File Structure

### Directory Layout

```
event-storming-domain/
├── SKILL.md                    # Required - main instructions
├── reference/
│   ├── output-template.md      # 01-event-storm.md output structure
│   ├── output-example.md       # Inbox Management domain example
│   └── writing-rules.md        # Document writing rules, quality checklist
```

### Output Location

| Type | Path |
|------|------|
| Output document | `docs/event-domain-design/domains/<domain-name>/01-event-storm.md` |
| Source template | `docs/event-domain-design/template/01-event-storm-template.md` |

---

## Event Storming Process

Follow phases in order. For each phase, identify items and update `01-event-storm.md` accordingly.

### Phase 1: Events (도메인 이벤트 식별)

- **과거형 동사 사용**: "~됨", "~완료됨", "~생성됨"
- **구체적 명명**: "주문됨" (O) vs "처리됨" (X)
- **시간순 배치**: 사용자 여정을 따라 왼쪽→오른쪽
- **도메인 언어 사용**: 비즈니스에서 실제 사용하는 용어

### Phase 2: Commands & Actors (커맨드·액터 식별)

- **커맨드**: 명령형 동사, "누가 이벤트를 발생시키는가?"
- **액터 분류**: Primary Actor, System Actor, External System

### Phase 3: Bounded Context (경계 컨텍스트)

- **그룹핑**: 논리적으로 연결된 이벤트들 묶기
- **식별 기준**: 동일한 언어, 강한 응집성, 약한 결합성
- **Context ≠ System**: 도메인 모델 경계 vs 구현 단위
- **각 Context마다**: 책임, 핵심 언어(5–10개), 핵심 용어 정의, 포함 이벤트

### Phase 4: Context 간 관계

- 연결점, 데이터 흐름(`Event A` → `Event B`), 통합 방식
- 순환 의존성 발견 시 메모 (Software Design에서 재설계)

### Phase 5: Hotspots & Opportunities

- **Hotspots**: 우선순위(높음/중간/낮음), 영향도, 해결 방안
- **Opportunities**: 즉시구현(MVP) vs 향후구현(Post-MVP)

### Phase 6: Process Model 질문

- 다음 단계(Process Model)에서 해결할 미해결 이슈 정리

---

## Anti-Patterns to Avoid

### 1. 프론트엔드/UI 이벤트 포함 (백엔드 문서 기준)
- ❌ Inbox Page Loaded, Inbox Card Displayed, Recommended Pages Displayed
- ❌ Inbox Card Detail Displayed, Inbox Card Processing Status Updated, Inbox Session Closed
- **사유**: 페이지 로드·UI 표시·상태 갱신·페이지 이탈은 클라이언트 책임. 백엔드 도메인 이벤트에서 제외.

### 2. 다른 도메인/시스템 이벤트 포함
- ❌ Block Created from Source, Block Registered to Workspace (Block Management 책임)
- ❌ Block Mounted to Page (Canvas Management 책임)
- **사유**: 해당 도메인이 처리하는 이벤트는 포함하지 않음. 본 도메인에서는 "호출 결과"로만 인식.

### 3. 다른 도메인 호출(요청) 이벤트 포함
- ❌ Block Mount Requested, Page Recommendation Requested
- **사유**: 다른 도메인 API 호출은 내부 오케스트레이션일 뿐, 별도 도메인 이벤트로 정의할 필요 없음. Process Model에서 "이 시점에 Canvas/AI를 호출한다"로 정리.

### 4. 과도한 세분화
- ❌ Extraction Started, Summarization Started, Extraction Failed, Summarization Failed를 각각 별도 이벤트로 나열
- ✅ 필요 시 "Source Processing Started", "Source Processing Failed" 등으로 통합 검토
- **사유**: 세부 단계보다 도메인에서 의미 있는 사건 단위로 정의.

---

## Quick Start Workflow

1. **Gather input**: Read business requirements (feature spec, initiative doc, or user-provided description)
2. **Create domain folder**: `docs/event-domain-design/domains/<domain-name>/`
3. **Copy template**: `cp docs/event-domain-design/template/01-event-storm-template.md docs/event-domain-design/domains/<domain-name>/01-event-storm.md`
4. **Conduct event storming**: Execute phases 1–6
5. **Fill the document**: Follow [reference/output-template.md](reference/output-template.md)

---

## Additional Resources

- **Output structure**: [reference/output-template.md](reference/output-template.md) — 01-event-storm.md template
- **Example**: [reference/output-example.md](reference/output-example.md) — Inbox Management domain
- **Writing rules**: [reference/writing-rules.md](reference/writing-rules.md) — Document rules, quality checklist
- **Full guide**: `docs/event-domain-design/guide/01-event-storming-guide.md` — Workshop process, workshop details

---

## Summary Checklist

Before finalizing 01-event-storm.md, verify:

### Core Quality
- [ ] 주요 비즈니스 이벤트 누락 없음
- [ ] 시간순 논리적 사용자 여정
- [ ] 도메인 언어 일관성
- [ ] Hotspot 우선순위 명확
- [ ] Process Model 질문 정리
- [ ] Anti-patterns 회피 (프론트/다른 도메인/호출 요청 이벤트 제외)

### Structure
- [ ] All required sections filled (Domain Overview, Events, Commands & Actors, Bounded Context, Context 관계, Hotspots, Opportunities, Process Model 질문)
- [ ] Reference [reference/output-template.md](reference/output-template.md) for section order
- [ ] Output path: `docs/event-domain-design/domains/<domain-name>/01-event-storm.md`
