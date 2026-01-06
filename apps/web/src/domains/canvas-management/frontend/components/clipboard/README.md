# Canvas Clipboard (캔버스 클립보드)

캔버스에서 외부 콘텐츠를 붙여넣기하는 기능을 제공합니다.

## 📁 구조

```
clipboard/
├── hooks/
│   └── use-clipboard-paste.ts      # 메인 훅 (Cmd+V 처리)
├── utils/
│   ├── clipboard-analyzer.ts       # 클립보드 내용 분석
│   └── clipboard-block-creator.ts  # 분석 결과 → 블록 생성
├── types/
│   └── clipboard.types.ts          # 타입 정의
└── README.md
```

## 🎯 지원하는 콘텐츠 타입

### 1. 이미지 파일
- **타입**: `image-file`
- **감지**: 클립보드에 이미지 데이터가 있을 때
- **생성 블록**: `ImageBlock`
- **예시**: 스크린샷, 복사된 이미지

### 2. 이미지 URL
- **타입**: `image-url`
- **감지**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg` 등으로 끝나는 URL
- **생성 블록**: `ImageBlock`
- **예시**: `https://example.com/image.png`

### 3. YouTube URL
- **타입**: `youtube-url`
- **감지**: YouTube URL 패턴
  - `youtube.com/watch?v=`
  - `youtu.be/`
  - `youtube.com/embed/`
  - `youtube.com/shorts/`
- **생성 블록**: `YoutubeBlock`
- **예시**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

### 4. 링크 URL
- **타입**: `link-url`
- **감지**: 유효한 http(s) URL
- **생성 블록**: `LinkBlock`
- **예시**: `https://example.com`

### 5. 마크다운 텍스트
- **타입**: `markdown-text`
- **감지**: 마크다운 문법 포함
  - 헤더: `#`, `##`, `###`
  - 코드블록: ` ``` `
  - 리스트: `-`, `*`, `1.`
  - 볼드/이탤릭: `**`, `*`, `_`, `__`
  - 링크: `[text](url)`
  - 이미지: `![alt](url)`
- **생성 블록**: `MarkdownBlock`

### 6. 일반 텍스트
- **타입**: `plain-text`
- **감지**: 위 조건에 해당하지 않는 모든 텍스트
- **생성 블록**: `MarkdownBlock`

## 🚀 사용법

### 기본 사용

```typescript
import { useClipboardPaste } from '@/domains/canvas-management/frontend/clipboard/hooks/use-clipboard-paste';

function MyCanvasComponent() {
  const { handlePaste, isPasting, error } = useClipboardPaste({
    pageId: 'page-123',
    orgId: 'org-456',
    workspaceId: 'workspace-789',
    createAndMountBlock: blockLifecycle.createAndMountBlock,
  });

  // Cmd+V 핸들러
  const onKeyDown = (event: React.KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

    if (isCtrlOrCmd && event.key === 'v') {
      event.preventDefault();
      handlePaste();
    }
  };

  return (
    <div onKeyDown={onKeyDown}>
      {isPasting && <LoadingIndicator />}
      {error && <ErrorMessage message={error} />}
      {/* Canvas content */}
    </div>
  );
}
```

### 캔버스 콜백에 통합 (현재 구현)

`use-canvas-callbacks.ts`에서 자동으로 처리됩니다:

```typescript
// Clipboard paste hook
const clipboardPaste = useClipboardPaste({
  pageId,
  orgId,
  workspaceId,
  createAndMountBlock: blockLifecycleCreateAndMountBlock,
});

// Cmd+V 핸들러
const onKeyDown = useCallback((event: React.KeyboardEvent) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

  if (isCtrlOrCmd && event.key === 'v') {
    event.preventDefault();
    clipboardPaste.handlePaste();
    return;
  }
  // ...
}, [clipboardPaste.handlePaste]);
```

## 📝 동작 원리

### 1. 클립보드 분석 (`clipboard-analyzer.ts`)

```
Cmd+V 입력
    ↓
navigator.clipboard.read()
    ↓
이미지 파일? → ImageBlock
    ↓ (No)
텍스트 읽기
    ↓
YouTube URL? → YoutubeBlock
    ↓ (No)
이미지 URL? → ImageBlock
    ↓ (No)
일반 URL? → LinkBlock
    ↓ (No)
마크다운 문법? → MarkdownBlock
    ↓ (No)
일반 텍스트 → MarkdownBlock
```

### 2. 블록 생성 (`clipboard-block-creator.ts`)

```
분석 결과 받음
    ↓
캔버스 중앙 좌표 계산
    ↓
블록 생성 (createAndMountBlock)
    ↓
Properties 업데이트
    - ImageBlock: imageUrl
    - YoutubeBlock: videoUrl
    - LinkBlock: linkUrl
    - MarkdownBlock: content
```

### 3. 붙여넣기 위치

블록은 **캔버스 중앙**에 생성됩니다:

```typescript
const getCanvasCenterPosition = (): PastePosition => {
  const { x, y, zoom } = reactFlowInstance.getViewport();
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;

  return {
    x: (canvasWidth / 2 - x) / zoom,
    y: (canvasHeight / 2 - y) / zoom,
  };
};
```

## 🔧 확장 방법

### 새로운 콘텐츠 타입 추가

1. **타입 정의** (`clipboard.types.ts`)
```typescript
export type ClipboardContentType =
  | 'image-file'
  | 'youtube-url'
  | 'my-new-type'; // 추가
```

2. **분석 로직 추가** (`clipboard-analyzer.ts`)
```typescript
// 3-X. 새로운 타입 감지
if (isMyNewType(trimmedText)) {
  return {
    type: 'my-new-type',
    data: { ... },
    confidence: 0.9,
  };
}
```

3. **블록 생성 로직 추가** (`clipboard-block-creator.ts`)
```typescript
switch (type) {
  case 'my-new-type':
    return await createMyNewBlock(
      data,
      position,
      context,
      createAndMountBlock
    );
  // ...
}
```

4. **Properties 업데이트 추가** (`use-clipboard-paste.ts`)
```typescript
switch (blockType) {
  case BlockType.MY_NEW_BLOCK: {
    if (data.myProperty) {
      await updateBlockPropertyAction({
        blockId,
        propertyPath: 'properties.myProperty',
        value: data.myProperty,
        orgId,
        workspaceId,
      });
    }
    break;
  }
  // ...
}
```

## 🐛 디버깅

### 로그 확인

클립보드 기능은 상세한 로그를 제공합니다:

```typescript
console.log('[Clipboard] Paste triggered');
console.log('[Clipboard] Analysis result:', analysisResult);
console.log('[Clipboard] Paste position (canvas center):', position);
console.log('[Clipboard] Block created successfully:', createdBlockType);
```

### 일반적인 이슈

1. **클립보드 권한 오류**
   - HTTPS 필수
   - 사용자가 권한을 거부했을 수 있음

2. **블록이 생성되지 않음**
   - 콘솔에서 분석 결과 확인
   - `unsupported` 타입인 경우 새로운 패턴 추가 필요

3. **Properties가 업데이트되지 않음**
   - `setTimeout` 지연 시간 조정 (현재 500ms)
   - `updateBlockProperties` 로직 확인

## 🚧 TODO

- [ ] Supabase Storage 이미지 업로드 구현 (현재는 Blob URL 사용)
- [ ] 링크 메타데이터 자동 fetch (제목, 설명, 썸네일)
- [ ] HTML 붙여넣기 지원
- [ ] 여러 파일 동시 붙여넣기
- [ ] 붙여넣기 위치 프리뷰
- [ ] 에러 토스트 메시지
- [ ] 로딩 인디케이터 UI

## 📚 참고

- [Clipboard API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [ClipboardEvent (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent)

