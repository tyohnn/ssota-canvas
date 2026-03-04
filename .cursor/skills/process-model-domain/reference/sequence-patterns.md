# Process Model: Sequence Patterns and Naming

## Event → Policy → Read Model → Command → System → Event

Apply this order strictly in every sequence:

1. **Event** (trigger from previous sequence or initial action)
2. **Policy** (reaction rule: "Whenever X, then Y")
3. **Read Model** (information and options shown to the user)
4. **Command** (what the user inputs or selects)
5. **System** (who processes: backend, frontend, or external)
6. **Event** (outcome events; may trigger next sequence)

### Event–Policy back-to-back (no Read Model in between)

When the next step is automatic (no user input):

```markdown
**Events**: 구글 OAuth 코드 전달받음

**Policy**: "Whenever 구글 OAuth 코드 전달됨, then always 유저 등록 처리하기"
**Command**: 유저 등록 처리 시작
**System**: User Authentication System
**Events**: 유저 등록 처리 완료됨 / 유저 등록 처리 실패함
```

---

## Policy

- **Format**: "Whenever [event], then always [action]" (or "If [condition], then [action]")
- **Role**: Triggers the next step; not generic "business policy" text
- **Keywords**: Whenever, If, Then, Always, Immediately

---

## Read Model

- What the system **shows** to the user (data, options, state).
- Optional: `*UI Hint:` for abstract UI type only (e.g. "옵션 선택 UI", "확인 다이얼로그").
- Optional: `*Layered Authorization:` when Frontend computes options and Backend enforces.

---

## Command

- What the user **inputs or selects** (form data, choices, confirm).
- Optional: `*UI Hint:` for interaction type only.

---

## System Naming

| Type | Pattern | Example |
|------|---------|---------|
| Internal domain | `[Entity] System` | User System, Organization System |
| Other domain | `[Domain] - [Entity] System` | Workspace-Management - Page System |
| Third-party | `[Name] System` | Supabase Auth System, Clerk System |
| Frontend | `(웹) - Frontend` | (웹) - Frontend |

**System content**: Business logic, validation, processing rules. No UI/component details.

---

## UI Hint (optional, minimal)

- **Format**: `*UI Hint:` + abstract description only.
- **Allowed**: "옵션 선택 UI", "확인 다이얼로그", "상태 표시 영역"
- **Not allowed**: "MUI Select", "shadcn Dialog", "드롭다운", colors, layout details
- **Detail**: Concrete UI goes in `03-user-flow.md`.

---

## Scenario vs Sequence

- **Scenario**: One full user journey (e.g. "사용자 등록 및 온보딩").
- **Sequence**: One step inside a scenario; has one Trigger Event and one Event→…→Event cycle.

### When to split into a separate sequence (internal system)

- System has 3+ processing steps, or complex error/retry logic, or multiple sub-systems.
- **Do not** define internal sequences for external systems; only their interface (Webhook/API/Event).

---

## Perspective markers (optional)

- **User view**: `👤 사용자: "구체적 목표나 의도"`
- **System view**: `🔧 시스템: "시스템이 수행할 기술적 작업"`
- **External**: `🔗 [External] Webhook: "메시지"`

Use one per sequence to clarify who the sequence is for (user vs system implementer).
