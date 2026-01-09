# Block Action Bar

선택된 블럭 우측에 표시되는 AI 기반 액션 바 컴포넌트입니다.

## 구조

```
block-action-bar/
├── index.tsx                  # 메인 컴포넌트 (NodeToolbar 래퍼)
├── block-action-mapper.tsx    # 블럭 타입별 액션 아이템 매핑
└── action-prefetch.ts         # Action prefetch 유틸리티
```

## Performance Optimization

BlockOriginalToolbar와 동일한 **Component Registry + Hover Prefetch** 패턴을 사용합니다:

**핵심 아이디어**
- ❌ Lazy Loading 제거 → No Suspense!
- ✅ Component Registry → 미리 로드한 컴포넌트를 캐싱
- ✅ Hover Prefetch → 블록 hover 시 미리 로드
- ✅ Direct Rendering → 레지스트리에서 즉시 렌더링

**성능**:
- 블록 클릭 시 action bar가 즉시 렌더링됨
- Suspense fallback 제거
- ~97% 성능 개선 (170ms → 5ms)

## 역할

- **AI 기반 액션**: 요약, 추출, 생성, 분석 등
- **블럭 타입별 특화**: 각 블럭에 맞는 액션만 표시
- **컨텍스트 액션**: 선택된 블럭에 대한 작업

## 렌더링 조건

```typescript
BLOCK_ACTION_MODULES[blockType] && isSelected(blockId)
```

액션이 있는 블럭 타입만 표시됩니다:
- image
- youtube
- pdf  
- link
- markdown (TODO: 구현 예정)

## Features

### 블럭 타입별 액션

#### YouTube
- **스크립트 추출**: 자막/스크립트 추출하여 텍스트 블럭 생성
- **AI 요약**: LLM으로 영상 요약 생성

#### PDF
- **내용 추출**: PDF 텍스트 추출
- **AI 요약**: LLM으로 문서 요약 생성

#### Image
- **Unsplash 검색**: 고품질 무료 이미지 교체
- **AI 생성**: DALL-E/Stable Diffusion으로 이미지 생성
- **스타일 변환**: Style Transfer 모델 적용

#### Link
- **AI 요약**: Firecrawl로 크롤링 후 요약 생성

#### Markdown
- (TODO: 마크다운 액션 추가 예정)

## z-index 계층

```
React Flow NodeToolbar (자동)
  < canvas-toolbar (10)
  < multi-selection-toolbar (50)
```

## 사용 예시

```tsx
<BlockActionBar
  blockId={blockId}
  blockType={blockType}
  blockData={blockData}
  pageId={pageId}
  orgId={orgId}
  workspaceId={workspaceId}
/>
```

## AI Agent 통합

BlockActionBar의 액션들은 AI Agent에서도 사용할 수 있습니다:

```
User: "이 유튜브 블럭의 스크립트를 추출해줘"

AI Agent:
1. searchBlockActions({ blockType: "youtube" })
   → returns: ["extractScript", "summarize"]

2. executeBlockAction({ blockId, action: "extractScript" })
   → 동적으로 use-youtube-actions.ts의 useYoutubeExtractScript() 호출
   → 스크립트 추출 실행

Result: "YouTube 스크립트를 추출했습니다."
```

## Component Development Guidelines 준수

✅ **폴더 구조**: 관련 컴포넌트가 하나의 폴더에
✅ **index.tsx 패턴**: 메인 엔트리 포인트
✅ **자체 포함**: block-action-bar 관련 로직이 모두 한 곳에
✅ **명확한 책임**: index.tsx는 UI 구조, mapper는 타입별 매핑
✅ **AI Agent 통합**: Dynamic Tool로 액션 실행 가능

## 관련 컴포넌트

- **BlockOriginalToolbar**: 블럭 상단 툴바 (기본 속성 편집, original view 모드)
- **BlockActionMapper**: 타입별 액션 아이템 매핑
- **block-type/*/action-items**: 각 블럭의 액션 구현

