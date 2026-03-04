---
name: view-component-abstraction
description: Defines Parameterization and Abstraction Boundary for View components. Use when extracting shared packages, designing reusable components, or deciding what the View/hook should compute vs receive from the caller. Guides domain-specific → generic conversion, callback injection, and result injection.
---

# View Component Abstraction

Parameterization(파라미터화)과 Abstraction Boundary(추상화 경계)를 명확히 하는 과정.

## 핵심 질문

**"이 View/훅이 이걸 계산해야 할까, 아니면 호출부가 계산해서 넘겨줄까?"**

- View가 계산 → 도메인/프레임워크에 묶임
- 호출부가 계산 후 주입 → View는 범용적으로 유지

## 용어 정의

| 용어 | 한글 | 의미 |
|------|------|------|
| **Parameterization** | 파라미터화 | 구체 로직을 파라미터·콜백으로 빼서 호출부가 주입 |
| **Result Injection** | 결과 주입 | 계산을 호출부에서 하고, 결과만 props로 넘김 |
| **Abstraction Boundary** | 추상화 경계 | View vs 호출부의 책임 경계 |

## View가 모르는 것

**node, title, properties** 같은 도메인/프레임워크 개념은 View/훅이 알지 않는다. 대신 **콜백**으로 추상화:

| 도메인 개념 | View/훅 입장 | 콜백 |
|-------------|--------------|------|
| updateProperties, updateBlockTitle | 몰라야 함 | `onUrlSubmit(url) => Promise<void>` |
| createVO, YoutubeBlockPropertiesVO | 몰라야 함 | `getThumbnailUrl(properties)`, `getVideoId(properties)` |
| node, blockId, nodeData | 몰라야 함 | 호출부가 내부에서 처리 |

## 훅 위치: shared vs domain

**훅을 domain으로 옮기는 1번 vs 콜백 기반으로 shared에 두는 2번** → **2번 선택**.

- 1번: 훅을 block-management로 옮기면, Drive·Landing 등 React Flow 없는 맥락에서 URL submit 후 동작을 정의할 때마다 새 훅(useYoutubeBlockForDrive 등)을 만들어야 함.
- 2번: 훅을 shared에 두되 **콜백만** 받으면, 공통 인터페이스가 명확하고 새 맥락에서도 해당 콜백만 구현하면 됨.

**공통 인터페이스**가 잘 드러나면, 어떤 맥락에서든 "YouTube 블록이 뭘 받는지"를 바로 파악할 수 있다.

## 언제 어떤 방법을 쓸까

| 대상 | 방법 | 이유 |
|------|------|------|
| **렌더링 상태** (showPlayer, isVisible 등) | **Result Injection** | View가 필요한 건 "보여줄까?" 하나의 값. 판단 근거는 호출부 책임 |
| **동작/인터랙션** (seekTo, 등록, 해제 등) | **Parameterization** | 블록이 콜백을 제공; 호출부가 등록·연결 등 수행 |
| **도메인 동작** (URL submit 후 처리, properties 파싱 등) | **Parameterization** | `onUrlSubmit`, `getThumbnailUrl` 등 콜백. View는 node/title/properties 모름 |

---

## 3가지 추상화 방법

### 1. Parameterization (콜백 주입) — 동작·인터랙션용

구체 API를 **범용 콜백**으로 교체. **동작(behavior)**을 주입할 때 사용.

| Before | After |
|--------|-------|
| `registerBlockInteractions`, `loadBlockInteractions` | `onProvideCallbacks(provide: () => Promise<Record<string, Function>>)` |
| `createVO`, `YoutubeBlockPropertiesVO` | `getThumbnailUrl(properties)`, `getVideoId(properties)`, `getEmbedUrl(properties)` |
| `updateProperties`, `updateBlockTitle`, nodeData | `onUrlSubmit(url) => Promise<void>` |
| `blockMountId`, `blockId` | `instanceId`, `id` |

블록은 seekTo 등 콜백을 **제공**; 호출부가 registerBlockInteractions 등에 **등록**. View는 node/title/properties를 모르고, onUrlSubmit·getThumbnailUrl 등 **콜백만** 호출.

### 2. Result Injection (결과 주입) — 렌더링 상태용

View/훅이 **계산하지 않고** 호출부가 계산한 값을 받음. **렌더링 상태**를 넘길 때 사용.

| Before | After |
|--------|-------|
| 훅 내부에서 `showPlayer = selected && url && !isDragging && !isMultiSelection` | 호출부가 `showPlayer` 계산 후 props로 전달 |
| 훅이 canvasMode, blockMountId 의존 | 훅은 `showPlayer: boolean`만 받음 |

View는 **"플레이어 보여줄까?"**만 받고, 판단 근거(dragging, multi-select)는 모름.

### 3. Pushing the Boundary (경계 밀기)

**레이어 소유권** 이동. View가 담당하던 것을 호출부로 옮김.

| Before | After |
|--------|-------|
| ssota-blocks에 combined (BlockWrapper 조합) | block-management에서 직접 조립 (Link 패턴) |
| View가 BlockWrapper, renderCardView 조합 | 호출부가 DataBlock + renderOriginalView + renderCardView 조립 |

## 결정 흐름 (Decision Flow)

```
이 로직/의존성이 View/훅에 있어야 하나?
│
├─ NO: React Flow, DataBlock, registerBlockInteractions 등
│      → 호출부(도메인)로 이동
│      → Parameterization 또는 Result Injection 적용
│
└─ YES: View의 순수 UI 동작
       → Props만 받고, 도메인 타입 import 금지
       → 범용 이름 사용 (selected → isActive, blockMountId → instanceId)
```

## 체크리스트 (마이그레이션/설계 시)

### Parameterization (동작·인터랙션)

- [ ] `registerBlockInteractions`, `loadBlockInteractions` 등 도메인 API를 직접 쓰지 않는가?
- [ ] `onProvideCallbacks`, `onUnmount` 같은 콜백으로 교체했는가?
- [ ] 블록이 seekTo 등 콜백을 **제공**하고, 호출부가 등록하는가?

### Result Injection (렌더링 상태)

- [ ] `showPlayer`, `isActive` 등 **렌더링 상태**를 호출부에서 계산해서 넘기는가?
- [ ] View/훅이 `canvasMode`, `getCurrentMode()`, `blockMountIds` 같은 **구체 구조**에 의존하지 않는가?

### 도메인 개념 제거

- [ ] View/훅이 node, blockId, nodeData, updateProperties, updateBlockTitle을 직접 쓰지 않는가?
- [ ] createVO, YoutubeBlockPropertiesVO 대신 `getThumbnailUrl`, `getVideoId`, `getEmbedUrl` 콜백을 쓰는가?
- [ ] URL submit 후 처리 → `onUrlSubmit(url) => Promise<void>` 콜백으로 호출부가 정의하는가?

### Abstraction Boundary

- [ ] combined(BlockWrapper 조합)를 shared 패키지에 두지 않고, 도메인에서 조립하는가?
- [ ] 훅을 shared에 두되 **콜백 기반**으로 해서, block-management·Drive·Landing 등 여러 맥락에서 재사용 가능한가?

## 네이밍 매핑

| 도메인 용어 | 범용 용어 |
|-------------|-----------|
| selected | isActive, isHighlighted |
| blockMountId | instanceId |
| blockId, nodeId | id, resourceId |
| nodeData | data |
| canvasMode | interactionContext, viewContext (또는 isDimmed 콜백) |

## 연관 스킬

- **ssota-blocks-extraction**: Boundary Design(경계 설계), 마이그레이션 워크플로우
- **ssota-blocks-deps-decision**: deps 추가 vs 주입 판단

## Additional Resources

- 상세 패턴·예시: [reference.md](reference.md)
