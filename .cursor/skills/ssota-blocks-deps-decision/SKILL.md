---
name: ssota-blocks-deps-decision
description: Decide whether to add a dependency to ssota-blocks package or inject via deps. Use when adding new dependencies to ssota-blocks, migrating blocks with external deps, or evaluating package coupling.
---

# ssota-blocks Dependency Decision

When adding or migrating code to ssota-blocks, decide for each external dependency: **add to package.json** or **inject via deps**.

## Decision Flow

For each external dependency (lib, context, framework):

1. **Used in components (View)?** → Usually add. Views are presentational; libs like react-youtube for player are fine.
2. **Used in logic/combined?** → Ask:
   - Is it **framework-specific** (React Flow, canvas context)? → **Inject via deps**
   - Is it **portable** (react, react-dom, date-fns, utils)? → **Add to package.json**

## Add to package.json

- `react`, `react-dom`, `@workspace/ui`
- `react-youtube`, `date-fns` 등 비즈니스 무관 툴
- ssota-blocks가 여러 컨텍스트에서 독립 사용될 때 필요한 것

## Inject via deps (패키지 의존성에 넣지 않음)

- **Framework/Context**: `@xyflow/react` (getNode, updateNode) — Canvas/Flow 전용
- **Domain**: updateProperties, fetchMetadata, canvasMode, workspaceId 등
- ssota-blocks가 **특정 런타임(Canvas, block-management)**에 묶이면 안 될 때

## 예: @xyflow/react

- **의존성 추가?** → 아님
- **이유**: React Flow는 Canvas 전용. Drive 미리보기, 랜딩 모킹 등에서는 불필요.
- **방법**: getNode, updateNode를 deps로 주입. ssota-blocks는 `NodeLike { id?; data? }` 최소 인터페이스로 타이핑.

## 예: react-youtube

- **의존성 추가?** → 예
- **이유**: YouTube 플레이어는 블록 고유 UI. 여러 컨텍스트에서 동일하게 쓰임.

## 체크리스트

| 의존성 | 패키지 추가? | deps 주입? | 이유 |
|--------|-------------|------------|------|
| react, react-dom | 예 | — | 기본 런타임 |
| @workspace/ui | 예 | — | 공통 UI |
| react-youtube | 예 | — | 블록 고유 UI, 재사용 |
| @xyflow/react | 아니오 | 예 (getNode, updateNode) | Canvas 전용 |
| updateProperties | 아니오 | 예 | domain 전용 |
| fetchMetadata | 아니오 | 예 | domain/action 전용 |

## Additional Resources

- For migration workflow, see [ssota-blocks-extraction](../ssota-blocks-extraction/SKILL.md)
