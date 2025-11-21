# Generate Image Action – Implementation Plan

문서 목적: `generate-image-action`을 이미지 검색 액션과 동일한 2단계 플로우(사용자 액션 아이템 → AI 액션 로직)로 확장하기 위한 전체 구현 계획을 공유합니다. 이 계획은 `component-development-guidelines.md` 패턴과 사용자가 추가로 제시한 제약(Helicone Provider 이동, Supabase Storage 사용, 지원 모델 2종)을 반영합니다.

---

## 1. 목표 & 범위
- 사용자가 **프롬프트 + 모델**을 선택해 이미지를 생성하고, 기존 이미지 블록에 적용하거나 신규 블록을 만드는 액션 아이템 제공.
- 동일한 비즈니스 로직을 AI Agent (`image-actions.ts`)에서도 재사용할 수 있도록 서비스/서버액션 계층 마련.
- 생성된 이미지는 **Supabase Storage** (`StorageBucket.CANVAS_ASSETS`)에 업로드하고, 기존 툴바 업로드 로직과 경로 생성/권한 체크를 공유.
- Helicone Provider를 `ai-management/backend` 영역으로 이동시키고, OpenAI(`gpt-image-1`) + Google(`gemini-2.5-flash-image`) 두 모델만 우선 지원.

> **비범위**
> - Imagen 등 추가 모델, 편집/업스케일 기능, 에셋 버저닝, Vector DB 저장은 차후 단계로 분리합니다.

---

## 2. 상위 아키텍처
```
UI (generate-image-action/index.tsx)
 └─ useGenerateImage (통합 훅)
     ├─ useGenerateImageUI (.ui.ts)
     └─ useGenerateImageBusiness (.business.ts)
          ├─ React Query mutation → generateImageAssetsAction (server)
          ├─ uploadGeneratedAssetToSupabase (공유 유틸)
          └─ useBlockPropertyUpdate (기존과 동일)

Server
 ├─ generateImageAssetsAction (block-management/actions)
 │    └─ ImageGenerationService (backend/services)
 │          ├─ Helicone OpenAI Provider (ai-management/backend/providers/helicone-provider.ts)
 │          ├─ Helicone Google Provider  (동일 파일)
 │          └─ experimental_generateImage (AI SDK)
 └─ SupabaseStorageManager (신규) – toolbar 업로드 로직과 공유
```

---

## 3. 프론트엔드 – 컴포넌트 구조
### 3.1 폴더 & 엔트리
- `action-items/generate-image-action/`
  - `index.tsx`: Provider + Trigger + Popover 조합 (image-search-action을 1:1 레퍼런스)
  - `provider.tsx`, `generate-image-action.context.tsx`: Context & 상태 공유
  - `types.ts`: 노출 Props, UI state, Business state 정의 (함수 Props 노출 금지)
  - `use-generate-image.ui.ts`: 프롬프트, 모델, advanced options, 선택 정보, Popover 상태
  - `use-generate-image.business.ts`: TanStack Query 기반 비즈니스 로직 + Supabase 업로드 호출
  - `use-generate-image.ts`: 통합 훅 (UI + Business + handleGenerate + handleApply)
  - `components/`
    - `trigger.tsx`: Tooltip + Wand 아이콘
    - `popover-content.tsx`: Section container (`SearchBar` 대비 `PromptComposer`)
    - `prompt-input.tsx`: textarea + inline “Generate” 버튼
    - `model-select.tsx`: `Select` + 모델 메타 Badge
    - `advanced-options.tsx`: Accordion (count, aspect ratio, negative prompt, seed)
    - `result-grid.tsx`: Image cards (검색 액션과 동일한 카드 컴포넌트 재사용 가능 여부 확인)
    - `selection-panel.tsx`: Block 선택/Apply 모드 UI (기존 SelectionPanel 복사)
    - `generation-progress.tsx`: progress + status copy

### 3.2 UI 로직 포인트
- `useGenerateImageUI`
  - `prompt`, `negativePrompt`, `modelId`, `outputCount`, `aspectRatio`, `seedEnabled`, `seedValue`.
  - `handleOpenChange`에서 `resetState` + `business.clearResults`.
  - `selectedImage`/`selectedBlockIds`/`applyMode`는 이미지 검색과 동일한 패턴을 재사용하여 UX 일관성 유지.
- `handleGenerate`
  - Prompt 미입력 시 early return.
  - Mutation 실행 중에는 Trigger/Button disabled + `generation-progress` 노출.
- `handleApply`
  - `useBlockPropertyUpdate.updateProperties` 호출 후 Popover 닫기.

---

## 4. 비즈니스 훅 & 공용 상태
### 4.1 `use-generate-image.business.ts`
- `generateImages` mutation:
  - Input: `{ prompt, negativePrompt?, modelId, aspectRatio?, outputCount, seed?, orgId, workspaceId, blockIds }`.
  - 호출: `generateImageAssetsAction` (server).
  - 응답: `{ images: ImageAsset[], metadata: { provider, modelId, tokens, latency } }`.
  - 성공 시 `results` 상태 갱신, 실패 시 toast + 결과 초기화.
- `applyImage`, `clearResults`, `results`, `isGenerating`, `isApplying`, `error` – image-search와 동일한 인터페이스 유지.
- `availableModels`: UI에서 Select 옵션으로 활용 (config import).

### 4.2 공통 타입 & 헬퍼
- `image-generation-models.ts` (shared/config):
  ```ts
  export const IMAGE_GENERATION_MODELS = [
    {
      id: 'openai/gpt-image-1',
      label: 'GPT Image 1',
      provider: 'openai',
      sizeOptions: ['1024x1024', '1536x1024', '1024x1536'],
      maxOutputs: 1,
      supportsNegativePrompt: false,
      defaultQuality: 'hd',
      providerOptions: { style: 'vivid', quality: 'hd' },
    },
    {
      id: 'google/gemini-2.5-flash-image',
      label: 'Gemini 2.5 Flash Image',
      provider: 'google',
      aspectRatioOptions: ['1:1', '3:4', '4:3', '16:9'],
      maxOutputs: 4,
      supportsNegativePrompt: true,
      defaultAspectRatio: '1:1',
    },
  ];
  ```
- UI와 서버 모두 동일한 소스를 참조해 파라미터 유효성 검증.

---

## 5. 서버 & 서비스 레이어
### 5.1 `generateImageAssetsAction`
- 위치: `domains/block-management/actions/generate-image-assets.action.ts` (새 파일)
- 단계:
  1. `GenerateImageRequestSchema` (`zod`)로 runtime validate: org/workspace/page/block context + 모델/프롬프트 + 출력 옵션.
  2. `getAuthenticatedUser`, `verifyAccess`.
  3. `ImageGenerationService.generate(request)`.
  4. `ok(result)` / `err(...)` 포맷 반환.

### 5.2 `ImageGenerationService`
- 위치: `domains/block-management/backend/services/image-generation.service.ts`.
- 의존성:
  - Helicone Provider (OpenAI + Google) – `experimental_generateImage` 사용.
  - Supabase Admin Client (`createClient` server ver.) for storage upload helper 호출.
- 로직:
  1. 모델 메타 조회 (`IMAGE_GENERATION_MODELS`).
  2. `generateImage` 호출:
     ```ts
     import { experimental_generateImage as generateImage } from 'ai';
     const provider = model.provider === 'openai'
       ? heliconeOpenAI.image('gpt-image-1')
       : heliconeGoogle.image('gemini-2.5-flash-image');

     const response = await generateImage({
       model: provider,
       prompt,
       negativePrompt,
       n: outputCount,
       size: model.sizeOptions ? selectedSize : undefined,
       aspectRatio,
       seed,
       providerOptions: { openai: { quality: 'hd', style: 'vivid' } },
     });
     ```
  3. 각 image(base64/uint8Array) → `uploadGeneratedAssetToSupabase`.
  4. 업로드 결과 URL + metadata → `ImageAsset` 구조로 변환.
  5. 결과 리턴.
- 실패 시 `NoImageGeneratedError` 등 캐치 후 descriptive error 제공.

### 5.3 Supabase 업로드 공유 유틸
- 새 서버 유틸: `domains/storage/backend/services/generated-asset.service.ts`
  - 입력: `{ base64, mimeType, orgId, workspaceId, pageId, blockId, promptHash }`.
  - `generateAssetPath` 재사용 (`promptHash` + `modelId` append) → 중복 캐시 가능.
  - Supabase Server Client (`createClient`) 사용해 `StorageBucket.CANVAS_ASSETS`에 업로드.
  - 반환: `{ url, path, width?, height?, mimeType }`.
- 기존 툴바 (`image-change-toolbar-item`)가 사용하는 로직도 장기적으로 이 서비스에 맞춰 통합 예정 (TODO 코멘트 추가).

---

## 6. Helicone Provider 리팩터링
- 현재 위치: `apps/web/src/lib/helicone-provider.ts`.
- 이동: `apps/web/src/domains/ai-management/backend/providers/helicone-provider.ts`.
- 확장:
  ```ts
  import { createOpenAI } from '@ai-sdk/openai';
  import { createGoogleGenerativeAI } from '@ai-sdk/google';

  export function createHeliconeOpenAI(headers?: Record<string,string>) { ... }
  export function createHeliconeGoogle(headers?: Record<string,string>) { ... }
  export function buildHeliconeHeaders({ userId, sessionId, feature, model }: ...) { ... }
  ```
- `ImageGenerationService`는 `buildHeliconeHeaders`로 `Helicone-Property-Feature=image-generate`, `Helicone-Property-Model=modelId`, `Helicone-User-Id=user.id` 전달.
- `app/api/agent/route.ts` 등 기존 import 경로 업데이트.

---

## 7. AI Agent 파트 (Phase 2 미리보기)
- `image-action-schemas.ts` → `generate` schema 확장: `prompt`, `modelId?`, `negativePrompt?`, `count?`.
- `image-actions.ts` → `handleGenerateImage` 구현:
  1. Schema 검증.
  2. `generateImageAssetsAction` 호출.
  3. 첫 번째 이미지를 현재 블록에 `updateProperties` (replace) 또는 `createAndMountBlock` (createNew)로 적용.
  4. Action 결과를 Tool response로 반환 (images metadata 포함).
- `domains/ai-management/backend/services/prompt/tools.ts` → `executeBlockAction` 외부에는 변경 없음 (이미지 생성은 프론트 툴 실행으로 유지). 필요 시 전용 server-side tool 추가 가능하도록 TODO 남김.

---

## 8. Supabase Storage & Toolbar 연계
- **공유 로직**: `generateImage`로 받은 base64도 결국 Supabase Storage에 올라가므로, 기존 `useSupabaseStorage`가 사용하는 `generateAssetPath`, `StorageBucket` 등을 서버 유틸과 공유.
- **Toolbar 정합성**:
  - `toolbar-items/image-change-toolbar-item.tsx`의 TODO (`// TODO: Supabase Storage`) 제거가 가능해짐 → 추후 동일 서버 액션을 클라이언트에서 호출하는 방향으로 정렬.
  - 새로운 서버 유틸이 생성되면 toolbar 쪽에서도 `uploadCanvasAssetAction` 같은 server action을 만들고, 클라이언트는 File → FormData 업로드 대신 server action을 호출하도록 점진 리팩터링 (이번 범위엔 포함되지 않지만 문서에 TODO 명시).

---

## 9. 검증 & 테스팅 전략
- **유닛**: `use-generate-image.ui` (상태 reset), `image-generation-models` validator, `ImageGenerationService` (mock providers).
- **통합**: Storybook/Playwright에서 Prompt → Result → Apply 플로우 확인.
- **E2E**: 
  1. Prompt 입력 → OpenAI 모델로 생성 → 기존 이미지 교체.
  2. 동일 Prompt + 다른 모델 선택 시 별도 이미지 생성 및 저장 경로 확인.
  3. Supabase Storage에 파일 생성 여부, signed URL 만료 시 `refreshImageUrlAction` 정상 동작 확인.
- **로깅**: Helicone dashboard에서 feature/model property 확인, Supabase Storage upload metric 모니터.

---

## 10. Open Questions / Follow-ups
1. **Storage 비용 관리**: 생성된 이미지가 즉시 블록에 적용되지 않을 경우 임시 보관 정책 필요 → TTL 또는 cron clean-up 추후 설계.
2. **Seed 지원 범위**: OpenAI `gpt-image-1`이 seed를 지원하는지 재확인 후 UI/Validation 조정.
3. **Negative Prompt**: 모델별 지원 여부 확인 (OpenAI 미지원 → UI에서 비활성).
4. **Access Control**: Org/Workspace 단위 쿼터(일일 생성 횟수) 필요 여부.
5. **AI Agent 안전 가드**: 프롬프트 필터링 (NSFW) + provider responses warnings 처리 필요.

---

## 11. Action Checklist
- [ ] `generate-image-action` 폴더 구조 생성 + compound component 구축.
- [ ] `use-generate-image.*` 3단 훅 구현 (UI, Business, Combined).
- [ ] `IMAGE_GENERATION_MODELS` config + shared 타입 추가.
- [ ] `generateImageAssetsAction` + `ImageGenerationService` + Supabase 업로드 유틸 작성.
- [ ] Helicone Provider 파일 이동 및 Google 지원 추가.
- [ ] `action-items/index.tsx` → 새 컴포넌트 import 경로 업데이트.
- [ ] `image-action-schemas.ts`, `image-actions.ts` Phase 2 대비 TODO 및 타입 확장.
- [ ] 문서/README/analytics 업데이트 (Helicone property, Supabase storage 가이드).

---

이 계획을 기반으로 실제 구현 단계에서 PR을 나눠 진행할 수 있도록, 각 섹션별로 책임 파일 및 TODO를 명시했습니다. 추가 의견이나 제약이 생기면 문서를 업데이트하겠습니다.


