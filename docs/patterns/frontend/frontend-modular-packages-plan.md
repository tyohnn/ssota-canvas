# 프론트엔드 모듈화 패키지 계획안

> `docs/patterns/next-modular-pattern`의 백엔드 모듈화 철학을 프론트엔드에 적용한 계획안

## 개요

이 문서는 다음 질문에 대한 답변과 구체적인 폴더 구조를 정의한다:

1. **packages/ui의 ssota-ui**: Radix처럼 비즈니스 로직 없이 UI만, props로 representational하게 사용
2. **비즈니스 로직 연결 컴포넌트**: Presentational/Container 패턴으로 정의하는 것이 맞는지
3. **패키지 분리 전략**: 에디터 패널, tree, tiptap, blocks 등 — 비즈니스 로직은 어디에 둘지

---

## 1. 핵심 원칙

### 1.1 UI 레이어 구분 (3단계)

```
┌─────────────────────────────────────────────────────────────────┐
│  L1: Primitive UI (Radix/shadcn/ssota-ui)                        │
│  - 비즈니스 로직 없음                                             │
│  - UI 로직만 (open/close, animation, a11y)                        │
│  - Props로 모든 것을 제어                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│  L2: Composite UI (패널 shell, form layout, block preview shell)  │
│  - L1 조합                                                        │
│  - 최소한의 composition 로직 (레이아웃, 자식 렌더링)               │
│  - 여전히 비즈니스 무지 (props만)                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│  L3: Domain-connected (domains/*/frontend)                        │
│  - 도메인 훅, 서버 액션, 비즈니스 규칙                             │
│  - Container가 L1/L2를 조합해 사용                                 │
│  - Presentational(View)는 L2 수준으로 분리 가능                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Radix/shadcn/ssota-ui 관계

| 레이어 | 역할 | 비즈니스 로직 | 예시 |
|--------|------|---------------|------|
| Radix | headless UI, 접근성·키보드·포커스 트랩 | 없음 | Popover, Dialog |
| shadcn (ui/) | Radix + Tailwind 스타일 | 없음 | `@/components/ui/popover` |
| **ssota-ui** | shadcn 오버라이드 + SSOTA 디자인 시스템 | 없음 | ToolbarOptionPopover, EditorPanelShell |

**핵심**: ssota-ui도 Popover처럼 사용. 내부에 open/close, zoom 변환 같은 UI 로직만 있고, `currentValue`, `options`, `onValueChange` 같은 props만 받음.

---

## 2. 질문별 답변

### Q1. 비즈니스 로직 빼고 UI만, props로 representational하게?

**A. 맞다.** packages/ui(ssota-ui 포함)에는 비즈니스 로직을 넣지 않는다.

- Context 의존 금지 (단, Radix 내부 Context은 예외)
- `useQuery`, `useMutation`, server action 직접 호출 금지
- `options`, `onValueChange`, `isLoading` 같은 **값·콜백 props**만 받음
- 사용처(domains)에서 `useYoutubeBlock` 등으로 데이터 가져와 props로 넘김

### Q2. 비즈니스 연결 컴포넌트도 Presentational/Container 패턴이 맞나?

**A. 맞다.** 이미 editor-panel, youtube block에서 적용 중이다.

- **Container**: `useEditorPanel`, `useYoutubeBlock` 등으로 데이터·로직 수집 → View에 props 전달
- **View**: props만 받아 렌더링. Storybook에서 mock props로 테스트 가능
- **장점**: 테스트· mocking 용이, 디자이너가 View만 조작 가능

### Q3. 패키지 분리 시 비즈니스 로직은 빼는가, 같이 묶는가?

**A. 분리한다.**

| 대상 | UI(Presentational) | 비즈니스(Container) |
|------|-------------------|---------------------|
| **Editor Panel** | `packages/ui/ssota-ui/editor-panel-shell` | `domains/block-management` 또는 `packages/editor-panel` (도메인 로직 포함) |
| **Tree** | `packages/ui/ssota-ui/tree-shell` | `domains/*` (tree 데이터·선택 로직) |
| **Tiptap Editor** | `packages/tiptap-editor` (에디터 래퍼, 플러그인 조합) | `domains/block-management` (block sync, 저장) |
| **Blocks** | `packages/ui/ssota-ui/blocks/` (BlockShell, YoutubePreviewShell 등) | `domains/block-management` (block 타입별 Container) |

**규칙**:

- **UI shell**은 비즈니스 무지. props로 `blockData`, `onSave` 등 받음.
- **비즈니스**는 도메인 패키지 또는 기능 패키지에 둠. Container가 shell을 조합.

---

## 3. 폴더 구조 제안

### 3.1 packages/ui (현재 + 확장)

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn 기반 (기존)
│   │   │   ├── popover.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   │
│   │   ├── ssota-ui/              # SSOTA 디자인 시스템 오버라이드 (확장)
│   │   │   ├── toolbar/
│   │   │   │   ├── toolbar-container.tsx
│   │   │   │   ├── toolbar-icon-button.tsx
│   │   │   │   └── toolbar-option-popover.tsx
│   │   │   │
│   │   │   ├── editor-panel/      # L2 Composite
│   │   │   │   ├── editor-panel-shell.tsx   # View만 (isExpanded, isVisible, children)
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── form-layouts/      # L2 Composite
│   │   │   │   ├── block-form-layout.tsx    # FormField + Label + workspace selector 공통
│   │   │   │   ├── url-input-field.tsx
│   │   │   │   └── advanced-settings-accordion.tsx
│   │   │   │
│   │   │   ├── block-previews/    # L2 Composite
│   │   │   │   ├── youtube-preview-card.tsx # 썸네일+플레이어+메타 영역 (props만)
│   │   │   │   ├── link-preview-card.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   ├── origin-ui/             # 도메인별 변형 (기존)
│   │   └── ai-elements/           # AI 전용 (기존)
│   │
│   ├── hooks/
│   └── lib/
└── package.json
```

### 3.2 domains/block-management (Container + 비즈니스)

```
domains/block-management/frontend/
├── components/
│   ├── editor-panel/              # Container
│   │   ├── index.tsx              # EditorPanelWrapper (useEditorPanel)
│   │   ├── standalone.tsx         # StandaloneEditorPanelProvider
│   │   ├── core/                  # 비즈니스 훅, Context, Provider
│   │   │   ├── context.tsx
│   │   │   ├── provider.tsx
│   │   │   ├── use-editor-panel.ts
│   │   │   ├── use-editor-panel.business.ts
│   │   │   └── use-editor-panel.ui.ts
│   │   ├── components/            # ContentArea, Header 등 (Context 사용)
│   │   │   ├── header/
│   │   │   │   ├── index.tsx        # Container: Context → HeaderView
│   │   │   │   └── header.view.tsx  # View: props만 (Storybook)
│   │   │   ├── content-area/        # 에디터 전용, ssota-ui로 이동 안 함
│   │   │   └── ...
│   │   └── (editor-panel.view.tsx → ssota-ui EditorPanelShell로 이동)
│   │
│   ├── block/
│   │   ├── block-type/
│   │   │   └── youtube/
│   │   │       ├── index.tsx      # Container (useYoutubeBlock)
│   │   │       ├── components/
│   │   │       │   ├── youtube.view.tsx    # domain 유지 (block 전용, URL input 등)
│   │   │       │   └── (YoutubePreviewCard는 ssota-ui/block-previews로 이동 가능)
│   │   │       └── core/          # useYoutubeBlock, useYoutubeBlock.ui
│   │
│   └── tiptap-editor/
│       ├── index.tsx              # Container (block sync)
│       └── core/
└── hooks/
```

### 3.3 ssota-ui vs domain: 무엇을 어디에 둘지

**ssota-ui**에는 **여러 도메인/화면에서 재사용 가능한 것만** 둔다.

| 컴포넌트 | ssota-ui? | 이유 |
|----------|-----------|------|
| **EditorPanelShell** | ✅ | 슬라이드 패널 chrome, 어디서나 재사용 가능 |
| **Header** (닫기/확장/공유/더보기) | 🤔 선택 | 레이아웃만 공통이면 HeaderShell로 둘 수 있음 |
| **ContentArea** | ❌ | 블록·속성·탭 등 에디터 패널 전용 |
| **BlockPropertiesSection** | ❌ | 스키마 기반 블록 속성 = 도메인 로직 |
| **TitleInput** | ❌ | 블록 제목 전용 |

→ **EditorPanelShell만 ssota-ui**로 옮기면 충분. 나머지는 domain 내부에 둔다.

### 3.4 View/Logic 분리 시 관리 방식 (Colocate)

도메인 내부 컴포넌트에서 View/Logic을 나눌 때는 **파일 단위로만 분리**하고 **같은 feature 폴더에 colocate** 한다.

```
editor-panel/components/header/
├── index.tsx        # Container: useEditorPanelContext() → HeaderView에 props 전달
└── header.view.tsx  # View: props만, Storybook에서 mock props로 테스트
```

- **View**: 같은 폴더에 `*.view.tsx`로 두고, Storybook에서 mock props로 테스트
- **Container**: `index.tsx`에서 Context/훅으로 데이터·로직 수집 → View에 props 전달
- **ssota-ui로 올리지 않음**: 에디터 패널 전용이라 domain 안에 유지

**View를 ssota-ui로 올리는 조건**: 다른 도메인/화면에서도 그대로 쓰일 때만 (예: EditorPanelShell, YoutubePreviewCard).

### 3.5 패키지 분리 시 (4단계 이후, optional)

```
packages/
├── ui/                            # L1 + L2
│   └── ssota-ui/
│
├── editor-panel/                  # optional: editor-panel을 독립 패키지로
│   ├── src/
│   │   ├── container.tsx          # EditorPanelWrapper
│   │   ├── standalone.tsx
│   │   ├── core/
│   │   └── index.ts               # EditorPanelShell은 @workspace/ui에서 import
│   └── package.json               # dependencies: @workspace/ui
│
├── tiptap-editor/                 # optional: tiptap 플러그인·래퍼
│   ├── src/
│   │   ├── editor.tsx             # TiptapEditor shell (props: extensions, content, onChange)
│   │   └── extensions/
│   └── package.json
│
└── block-previews/                # optional: block preview만 모음
    └── (이미 ssota-ui에 포함 가능)
```

---

## 4. 마이그레이션 순서

| 단계 | 작업 | 비고 |
|------|------|------|
| **1** | ssota-ui에 EditorPanelShell 추가 | editor-panel.view.tsx 로직 추출, domains에서 import |
| **2** | ssota-ui에 YoutubePreviewCard 추가 | YoutubeBlockProperties 타입을 generic으로 변경 또는 shared로 이동 |
| **3** | ssota-ui에 form-layouts 추가 | Drive BlockFormContent의 공통 레이아웃 추출 |
| **4** | 도메인에서 View → Shell 교체 | Container는 그대로, View import만 변경 |
| **5** | (선택) editor-panel, tiptap 패키지 분리 | 모듈화 4단계 도달 시 |

---

## 5. 의존성 방향

```
@workspace/ui (ssota-ui)
    ↑
domains/*/frontend (Container, domain hooks)
    ↑
actions (server actions)
    ↑
backend
```

- **ui**는 domains, actions, backend를 알지 않음.
- **domains**는 ui를 import. 필요 시 shared(타입)만 ui와 공유.

---

## 6. 타입 공유 전략

ssota-ui의 block-previews가 `YoutubeBlockProperties` 같은 도메인 타입을 쓰지 않도록:

**Option A (권장)**: Generic props

```tsx
// packages/ui/ssota-ui/block-previews/youtube-preview-card.tsx
interface YoutubePreviewCardProps<T extends { youtubeTitle?: string; channelName?: string; ... }> {
  metadata: T;
  thumbnailUrl: string | null;
  videoId: string | null;
  // ...
}
```

**Option B**: packages/shared-types에 공통 인터페이스

```ts
// packages/shared-types/youtube-preview.ts
export interface YoutubePreviewMetadata { ... }
```

domains/block-management의 `YoutubeBlockProperties`가 이를 extends.

---

## 7. 정리

| 질문 | 답변 |
|------|------|
| ssota-ui에 비즈니스 로직? | **아니오.** UI 로직만, props로 representational |
| Container/View 패턴? | **예.** 비즈니스 연결 컴포넌트에 적용, View는 Storybook 가능 |
| 패키지 분리 시 비즈니스? | **분리.** UI(Shell) → packages/ui, 비즈니스(Container) → domains 또는 packages/editor-panel 등 |
| ssota-ui에 무엇을 둘지? | **여러 도메인/화면에서 재사용 가능한 것만.** 에디터 전용 ContentArea, BlockPropertiesSection 등은 domain 유지 |
| View/Logic 분리 시 관리? | **Colocate.** 같은 feature 폴더에 `index.tsx`(Container) + `*.view.tsx`(View). View를 ssota-ui로 올리는 건 재사용될 때만 |
| 폴더 구조 | ui: ui/ + ssota-ui/(toolbar, editor-panel-shell, form-layouts, block-previews), domains: Container + components/*.view.tsx |

이 계획은 `next-modular-pattern`의 1차(도메인)·2차(레이어)·3차(기능별) 기준을 프론트엔드에 맞게 변형한 것이다. UI 레이어(L1/L2)는 비즈니스 무지, L3(domains)만 비즈니스 포함.
