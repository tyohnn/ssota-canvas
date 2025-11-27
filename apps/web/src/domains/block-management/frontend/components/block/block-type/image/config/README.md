# Image Block Config

Image 블록의 설정/스키마 파일들을 관리하는 폴더입니다.

## 파일 구조

```
config/
├── image-editor-panel-schema.ts    # Editor Panel UI 스키마
├── image-block-action-schemas.ts   # Action 파라미터 검증 스키마
├── image-ai-definition.ts          # AI Agent용 블록 정의
└── README.md                       # 현재 파일
```

## 파일 설명

### image-editor-panel-schema.ts

**역할:** Editor Panel에서 블록 속성을 편집할 때 사용하는 UI 스키마

**export:** `imageEditorPanelSchema: BlockEditorSchema`

**사용처:**
- `block-editor-schema-registry.ts`에서 import하여 등록

**구성:**
- `groups`: 속성 그룹 정의 (Basic Information, Style, Metadata)
- `properties`: 각 속성의 UI 렌더링 방식 정의
  - `imageUrl`: 이미지 업로드
  - `caption`: 캡션 텍스트
  - `alt`: 대체 텍스트 (접근성)
  - `objectFit`: 이미지 표시 방식 (contain/cover/fill)
  - `createdAt`, `updatedAt`, `createdBy`: 메타데이터 (읽기 전용)

### image-block-action-schemas.ts

**역할:** AI Agent가 블록 액션을 실행할 때 파라미터를 검증하는 Zod 스키마

**export:** `ImageBlockActionSchemas: Record<string, z.ZodType<any>>`

**사용처:**
- `action-schemas-registry.ts`에서 import하여 등록
- `use-block-action-executor.ts`에서 런타임 파라미터 검증에 사용

**스키마:**
- `imageSearch`: 이미지 검색
  - `query`: 검색 쿼리 (필수)
- `generate`: AI 이미지 생성
  - `prompt`: 이미지 설명 (필수)
  - `modelId`: 모델 ID (선택, 기본: google/gemini-2.5-flash-image)
  - `negativePrompt`: 회피할 요소 (선택, Google만 지원)
  - `aspectRatio`: 종횡비 (선택, 기본: 1:1)
- `searchStyle`: 스타일 검색 (파라미터 없음)

### image-ai-definition.ts

**역할:** AI Agent가 Image 블록을 이해하고 사용하기 위한 정의

**export:** `imageAIDefinition: BlockTypeDefinition`

**사용처:**
- `block-type-definitions.ts`에서 import하여 AI Agent에게 제공

**구성:**
- `type`: 블록 타입 (image)
- `name`: 블록 이름 (Image Block)
- `description`: 블록 설명
- `useCases`: 사용 사례 (사진 표시, 스크린샷, 갤러리 등)
- `basicProperties`: 기본 속성 정의
  - `imageUrl`: 이미지 URL (필수)
  - `objectFit`: 이미지 맞춤 방식
  - `caption`: 캡션
  - `isCaptionVisible`: 캡션 표시 여부
  - `alt`: 대체 텍스트
- `actions`: 사용 가능한 액션
  - `imageSearch`: 이미지 검색
  - `generate`: AI 이미지 생성
  - `searchStyle`: 스타일 검색

## 관련 파일

### Action 실행 로직
- [`action-items/image-block-actions.ts`](../action-items/image-block-actions.ts): AI Agent가 호출하는 순수 함수

### UI 컴포넌트
- [`action-items/`](../action-items/): Action UI 컴포넌트들
- [`toolbar-items/`](../toolbar-items/): Toolbar UI 컴포넌트들

## 네이밍 규칙

이 폴더의 파일들은 명확한 네이밍을 위해 다음 규칙을 따릅니다:

- **editor-panel-schema**: Editor Panel UI 스키마 (기존: editor-schema)
- **block-action-schemas**: Block Action 파라미터 검증 스키마 (기존: action-schemas)
- **ai-definition**: AI Agent용 블록 정의

이는 각 파일의 역할을 명확히 하고, 다른 블록 타입에서도 일관된 네이밍을 사용하기 위함입니다.

## 참고

- 이 폴더는 Image 블록의 "설정/메타 정보"만 포함합니다
- 실제 비즈니스 로직은 `action-items/` 폴더에 있습니다
- UI 컴포넌트는 `action-items/`, `toolbar-items/` 폴더에 있습니다

