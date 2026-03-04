---
name: ssota-blocks-extraction
description: Orchestrates block extraction to packages/ssota-blocks. Includes Boundary Design (경계 설계)—domain vs generic 판별, 추상화·네이밍 결정. Use when migrating blocks, creating new blocks, or planning extraction. Delegates to ssota-blocks-extractor subagent; each step has a dedicated reference in steps/.
---

# ssota-blocks Extraction (Workflow Orchestrator)

Extract block components to `packages/ssota-blocks` for cross-domain reuse. Each block lives in `src/{block-type}/` with `components/`, `logic/`, and `combined/` subfolders.

**Workflow execution**: Use the **ssota-blocks-extractor** subagent to run the migration. The subagent proceeds step by step using `.cursor/skills/ssota-blocks-extraction/steps/step-N-*.md`.

**Backward compatibility**: Do not delete existing files or change export paths until all consumers have been updated and verified. Prefer re-exports from the old path during transition.

## When to Use

- Migrating a block from `domains/block-management/frontend/components/block/block-type/{block}/` to ssota-blocks
- Creating a new block in ssota-blocks
- Wiring apps/web to use @workspace/ssota-blocks

## How to Execute

Invoke the subagent:

> Use the ssota-blocks-extractor subagent to migrate [block name] from block-management to packages/ssota-blocks.

The subagent will read each step file in order and execute them sequentially.

## Per-Block Structure

```
packages/ssota-blocks/src/{block-type}/
├── components/          # View only (props만)
├── logic/               # Hooks (deps 주입)
│   ├── use-*.ts         # 오케스트레이션
│   ├── use-*.ui.ts      # UI 상태
│   ├── business/        # 비즈니스 로직 (자유 분리)
│   │   ├── index.ts
│   │   ├── fetch-metadata.ts
│   │   └── ...
│   ├── types.ts
│   └── utils.ts
├── combined/            # Container (BlockWrapper 주입)
└── index.ts
```

- **components**: Presentational. No Context, no server actions. Props only.
- **logic**: Hooks. All domain deps received via injection. UI 훅(use-*.ui.ts)과 비즈니스 훅 분리. **business/** 폴더에 비즈니스 로직을 자유롭게 쪼개서 저장.
- **combined**: (선택) Container. BlockWrapper(DataBlock), CardView를 props로 받음. **권장**: combined는 block-management에서 직접 조립(Link 패턴); ssota-blocks는 View + logic만 export.

## Logic: business/ 폴더

기존 use-*.business.ts 단일 파일 대신 **logic/business/** 폴더를 두고, 비즈니스 로직을 필요에 따라 자유롭게 분리:

- `business/index.ts`: useYoutubeBlockBusiness 등 메인 훅, 또는 sub-모듈 조합
- `business/fetch-metadata.ts`: 메타데이터 fetch 로직
- `business/update-properties.ts`: 속성 업데이트 로직
- 기타: 관심사별로 파일 분리

규칙: business 내부 모듈은 모두 deps를 통해 외부 의존성을 받음. domain 직접 import 금지.

## Boundary Design (경계 설계)

**경계 설계**란: ssota-blocks에 넣을 대상이 **도메인-독립적인지 vs 특정 도메인(React Flow, block-management)에 묶여 있는지**를 판별하고, 넣는다면 **어떤 추상화·네이밍**을 쓸지 결정하는 과정이다.

마이그레이션 전후에 아래 질문으로 점검:

### 1. 레이어 소유권 판별

| 질문 | ssota-blocks | block-management / canvas |
|------|--------------|---------------------------|
| 이 로직/컴포넌트가 React Flow, DataBlock, registerBlockInteractions에 직접 의존하는가? | ❌ 여기 두면 안 됨 | ✅ 여기 두기 |
| View(프레젠테이션)만 있으면 되는가? | ✅ components | - |
| BlockWrapper, renderOriginalView, renderCardView 조합이 필요한가? | ❌ combined는 도메인에서 처리 | ✅ Link/PDF처럼 직접 조립 |

### 2. Deps 추상화

도메인 용어를 그대로 두지 말고, **콜백·범용 인터페이스**로 바꾸기:

| 도메인 용어 | 범용화 방향 |
|-------------|--------------|
| `registerBlockInteractions`, `blockInteraction` | `onProvideCallbacks(provide: () => Promise<Record<string, Function>>)`, `onUnmount` |
| `blockMountId`, `blockId`, `nodeId` | `instanceId`, `id`, `resourceId` |
| `nodeData` | `data`, `itemData` |
| `loadBlockInteractions('youtube')` | 블록이 콜백만 제공; 호출부에서 등록 담당 |
| `setAutoSummaryBlockId` | `onRequestSummary?` 또는 콜백 |
| `canvasMode` | `interactionContext`, `viewContext` |

### 3. 변수/프로퍼티 네이밍

| 도메인 용어 | 범용 용어 후보 | 이유 |
|-------------|----------------|------|
| `selected` | `isActive`, `isHighlighted` | React Flow "선택"이 아닌 "활성 상태"를 나타낼 때 |
| `blockMountId` | `instanceId` | 마운트 단위 식별자 |
| `blockId` | `id`, `resourceId` | 리소스 식별자 |
| `nodeData` | `data` | 항목 데이터 |

Drive, Landing 등 여러 맥락에서 쓰일 경우 **도메인 중립적 이름** 사용.

### 4. 체크리스트 (마이그레이션 시)

- [ ] `registerBlockInteractions`, `loadBlockInteractions`를 deps에 직접 넣지 않고, `onProvideCallbacks` 등 콜백으로 추상화했는가?
- [ ] combined(BlockWrapper 조합)를 ssota-blocks에 두지 않고, block-management에서 직접 조립하는가?
- [ ] `blockMountId`, `nodeData`, `selected` 등 도메인 용어를 범용 이름으로 바꿀 수 있는가?

자세한 매핑과 예시는 [reference.md](reference.md)의 "Boundary Design" 섹션 참조.

## Dependency Injection Rules

| Layer | Domain Deps | Strategy |
|-------|-------------|----------|
| components | None | Props only |
| logic | updateProperties, fetchMetadata, canvasMode, etc. | `useXxxBlock(props, { deps })` — deps는 **범용 콜백/인터페이스**로 추상화 |
| combined | DataBlock, CardView | block-management에서 직접 조립; ssota-blocks에는 combined 없이 View + logic만 export |

## What Stays in block-management

- `config/`: editor tabs, panel schema, block interactions, action schemas, AI definition
- `components/tab-sections/`: metadata-tab, summary-tab, timeline-tab
- `components/action-items/`: visual-summary, extract-script, etc.
- `components/toolbar-items/`

These are editor-panel/action-bar specific.

## Migration Workflow

Workflow is split into step skills. Execute in strict order via the subagent or by reading each step file.

| Step | File | Description |
|------|------|-------------|
| 1 | [steps/step-1-package-setup.md](steps/step-1-package-setup.md) | Package setup (if new) |
| 2 | [steps/step-2-components.md](steps/step-2-components.md) | Move components (copy first; keep originals) |
| 3 | [steps/step-3-logic.md](steps/step-3-logic.md) | Move logic (add deps injection) |
| 4 | [steps/step-4-combined.md](steps/step-4-combined.md) | Move combined (add BlockWrapper injection) |
| 5 | [steps/step-5-imports.md](steps/step-5-imports.md) | Update apps/web imports |
| 6 | [steps/step-6-verify.md](steps/step-6-verify.md) | Add tests; run tests; fix until pass; run build |
| 7 | [steps/step-7-cleanup.md](steps/step-7-cleanup.md) | Remove from block-management only after full verification |

```
Task Progress:
- [ ] 1. Package setup
- [ ] 2. Move components
- [ ] 3. Move logic
- [ ] 4. Move combined
- [ ] 5. Update apps/web imports
- [ ] 6. Add tests; run tests; fix until pass; run build
- [ ] 7. Remove from block-management (keep config/tabs/actions/toolbar)
```

### Step 1: Package setup (if ssota-blocks does not exist)

- Create `packages/ssota-blocks/` with package.json, tsconfig.json
- Add exports: `"."`, `"./youtube"` (or block name)
- Add deps: @workspace/ui, react, react-dom (필요 시 react-youtube 등). 각 의존성 추가 여부는 [ssota-blocks-deps-decision](../ssota-blocks-deps-decision/SKILL.md) 참조.
- Add to apps/web next.config.mjs: `transpilePackages: ['@workspace/ssota-blocks']`

### Step 2: Move components

- Copy View components: `*.view.tsx`, `*-preview-card.tsx`, `ui-states/`, `*-overlay.tsx`
- Replace `@/` imports with `@workspace/ui` or relative paths
- Use minimal generic types (e.g. `YoutubeMetadata`) instead of domain types

### Step 3: Move logic

- Copy `core/use-*.ts`, `core/types.ts`, `core/utils.ts` to `logic/`
- 비즈니스 로직이 크면 `logic/business/` 폴더 생성, 관심사별로 파일 분리 (fetch-metadata.ts, update-properties.ts 등)
- Refactor hooks to receive deps object: `useYoutubeBlock(props, { deps })`
- Remove direct imports of domain hooks; accept them in deps

### Step 4: Move combined

- Copy Container (`index.tsx`) to `combined/{block}-block.tsx`
- Add props: `BlockWrapper`, `CardViewComponent`, `deps`
- Render: `<BlockWrapper ... renderOriginalView={...} renderCardView={...} />`

### Step 5: Update apps/web

- `node-types.config.ts`: import YoutubeBlock from @workspace/ssota-blocks, pass BlockWrapper={DataBlock}, CardViewComponent={CardView}, deps={...}
- Other consumers (drive, tutorial, landing): import YoutubeView, YoutubePreviewCard from @workspace/ssota-blocks

### Step 6: Add tests, run, and verify (required)

- components: render with mock props, assert UI and events
- logic: renderHook with mocked deps
- See [reference.md](reference.md) for testing strategy
- Run `pnpm test` (or `pnpm run test` in apps/web / ssota-blocks root).
- If any test fails: fix the failing test or the source code, then rerun tests.
- **Do not consider migration complete until all tests pass.**
- Run `pnpm build` (or turbo build) to verify build succeeds.

### Step 7: Remove from block-management (after verification)

- **Backward compatibility**: Do not delete existing files until all consumers have been updated and verified. Keep old paths working via re-export if needed.
- Delete moved files only after: (1) apps/web imports updated, (2) tests pass, (3) build succeeds.
- Keep: config/, tab-sections/, action-items/, toolbar-items/

## Testing Verification Loop (mandatory)

When performing migration, you must:

1. Add or update tests as needed.
2. Execute tests: `pnpm test` (from project root or relevant package).
3. If tests fail: read the error output, fix the cause (test logic or source code), rerun.
4. Repeat until all tests pass.
5. Run build and fix any build/type errors.
6. Only then report migration as complete.

## Additional Resources

- **Boundary Design**: 마이그레이션 시 도메인 vs 범용 판별, 추상화·네이밍 결정. [reference.md](reference.md) 참조.
- **View abstraction**: Parameterization, Result Injection, Abstraction Boundary. [view-component-abstraction](../view-component-abstraction/SKILL.md) 참조.
- **Step skills**: `.cursor/skills/ssota-blocks-extraction/steps/step-N-*.md` (1–7)
- **Subagent**: `.cursor/agents/ssota-blocks-extractor.md` — use to execute workflow sequentially
- **Detailed migration**: [reference.md](reference.md) — file mapping, deps shape, testing strategy
- **Dependency decision**: [ssota-blocks-deps-decision](../ssota-blocks-deps-decision/SKILL.md)
- **Frontend architecture**: [frontend-architecture-check](../frontend-architecture-check/SKILL.md)
