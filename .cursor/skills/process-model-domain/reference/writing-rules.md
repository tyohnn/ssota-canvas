# Process Model: Writing Rules and Quality Checklist

## Document structure order

1. 🎯 Process Modeling Overview (and hybrid approach note)
2. 🟪 External System 정의 (role, SSOT, integration)
3. 📍 Scenario 0: External System 동기화
4. 📍 Scenario 1~N: 핵심 비즈니스 시나리오
5. 💡 핵심 Policy 정리
6. 🔧 기술 권장사항

---

## Consistency

- [ ] Every scenario follows Event → Policy → Read Model → Command → System → Event
- [ ] Each sequence has a clear **Trigger Event**
- [ ] Sequence-to-sequence links: previous Event = next Trigger Event where applicable
- [ ] Terms and naming match `01-event-storm.md` (same domain language)

---

## Completeness

- [ ] 5–7 core scenarios selected from the event-storm
- [ ] External System(s) and Scenario 0 (sync) documented
- [ ] Main events from the event-storm appear in the process model
- [ ] Policy written in concrete, verifiable "Whenever-then" form
- [ ] Frontend-only steps use System: `(웹) - Frontend` where needed

---

## Event Storm ↔ Process Model

- [ ] Key events from event-storm are reflected in scenarios/sequences
- [ ] Hotspots are addressed (solutions or decisions in process model)
- [ ] Bounded Context boundaries align with System boundaries where relevant

---

## Anti-patterns to avoid

### 1. UI/implementation detail in Process Model
- ❌ Button position, colors, animations, component names (MUI, shadcn, etc.)
- ✅ Optional `*UI Hint:` with abstract type only; detail in `03-user-flow.md`

### 2. External system internals
- ❌ Defining sequences *inside* third-party systems (e.g. "Google OAuth 내부 처리")
- ✅ Only our interface to them: Webhook, API call, event subscription

### 3. Vague Policy
- ❌ "비즈니스 규칙 적용", "검증 수행"
- ✅ "Whenever [event], then always [concrete action]"

### 4. Wrong sequence order
- ❌ Read Model or Command before Policy when event just occurred
- ✅ Event → Policy (immediate) → Read Model → Command → System → Event

### 5. Mixing domains
- ❌ Describing another domain’s internal flows in this domain’s process model
- ✅ Refer to other domain as System (e.g. `[Domain] - [Entity] System`) and only our side of the integration

---

## Review checkpoints

**Domain expert**: Business process and Policy match reality; exceptions considered.  
**Senior dev**: System boundaries, External System integration, and readiness for Software Design.  
**PM**: Priorities and user value reflected in scenario choice and order.
