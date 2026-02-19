# YouTube Block 동작 플로우 가이드

이 문서는 YouTube 블록의 전체 동작 플로우를 단계별로 상세히 설명합니다.

## 📁 파일 구조

```
youtube/
├── index.tsx                          # 메인 컴포넌트 (Container)
├── components/
│   ├── youtube.view.tsx               # Presentational 컴포넌트
│   ├── ui-states/
│   │   ├── youtube-empty-state.tsx    # URL 없을 때 입력 폼
│   │   ├── youtube-loading-state.tsx  # 로딩 중 스켈레톤
│   │   └── youtube-error-state.tsx    # 에러 상태
│   ├── youtube-preview-card.tsx       # 비디오 프리뷰 카드
│   ├── youtube-player-overlay.tsx     # iframe 플레이어 오버레이
│   ├── action-items/                  # 액션 아이템들
│   └── toolbar-items/                 # 툴바 아이템들
└── core/
    ├── use-youtube-block.ts           # 메인 훅 (오케스트레이션)
    ├── use-youtube-block.ui.ts        # UI 상태 관리 훅
    ├── use-youtube-block.business.ts  # 비즈니스 로직 훅
    ├── types.ts                       # 타입 정의
    └── utils.ts                       # 유틸리티 함수
```

## 🏗️ 아키텍처 개요

### 훅 분리 전략

1. **`useYoutubeBlockUI`** (UI 훅)
   - 순수 UI 상태만 관리 (`isLoading`, `draftUrl`, `showPlayer` 등)
   - 비즈니스 로직 없음
   - UI 이벤트 핸들러 제공

2. **`useYoutubeBlockBusiness`** (비즈니스 훅)
   - 메타데이터 fetch 및 서버 동기화
   - Video ID 추출, 썸네일/Embed URL 생성
   - UI 상태 직접 조작 없음

3. **`useYoutubeBlock`** (메인 훅)
   - UI 훅과 비즈니스 훅을 오케스트레이션
   - 외부 훅(`useReactFlow`, `useUpdateBlockProperty`) 사용
   - 통합 로직 제공

### 컴포넌트 계층

```
YoutubeBlock (Container)
  └─> YoutubeView (Presentational)
       ├─> YoutubeEmptyState (URL 없을 때)
       ├─> YoutubeLoadingState (로딩 중)
       ├─> YoutubeErrorState (에러)
       └─> YoutubePreviewCard (프리뷰)
            └─> YoutubePlayerOverlay (플레이어)
```

---

## 📌 시나리오 1: 처음 블록을 생성했을 때 (아무것도 없는 상태)

### 👤 사용자가 보는 것

```
┌─────────────────────────────────┐
│        🎬 YouTube 아이콘         │
│                                 │
│    "Enter YouTube URL"          │
│                                 │
│  ┌────────────────────────────┐ │
│  │ https://www.youtube.com... │ │ ← 입력 폼 (포커스됨)
│  └────────────────────────────┘ │
│    "Press Enter to save"        │
└─────────────────────────────────┘
```

### 🔄 데이터 흐름 & 상태

#### 1단계: 컴포넌트 마운트

```typescript
// YoutubeBlock 컴포넌트
properties = {
  url: '',                    // ❌ 비어있음
  youtubeTitle: undefined,    // ❌ 비어있음
  // ... 모든 메타데이터 비어있음
}
```

#### 2단계: 훅 초기화

```typescript
// useYoutubeBlock (메인 훅)
const { url } = properties;  // url = ''

// useYoutubeBlockUI (UI 훅)
const [isLoading, setIsLoading] = useState(false);     // ✅ false
const [hasError, setHasError] = useState(false);       // ✅ false
const [draftUrl, setDraftUrl] = useState('');          // ✅ ''
const [showPlayer, setShowPlayer] = useState(false);   // ✅ false

// useEffect: selected && !url → input에 자동 포커스 ✨
if (selected && !url && inputRef.current) {
  inputRef.current.focus();  // ✅ 입력창에 포커스
}
```

#### 3단계: 렌더링 조건 판정

```typescript
// youtube.view.tsx
{!url && !isLoading && (
  <YoutubeEmptyState />  // ✅ 렌더링됨
)}
```

### 📊 상태 요약

| 상태 | 값 | 의미 |
|-----|-----|-----|
| `url` | `''` | URL 없음 |
| `isLoading` | `false` | 로딩 아님 |
| `hasError` | `false` | 에러 없음 |
| `draftUrl` | `''` | 입력 중인 URL 없음 |
| **렌더링** | `YoutubeEmptyState` | 입력 폼 표시 |

---

## 📌 시나리오 2: 사용자가 URL을 입력하고 Enter를 눌렀을 때

### 👤 사용자 행동

```
1. 입력창에 "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 입력
2. Enter 키 누름 ⏎
```

### 🔄 데이터 흐름 & 상태 (순서대로)

#### 1단계: URL 입력 중

```typescript
// useYoutubeBlockUI
const handleUrlChange = (e) => {
  setDraftUrl(e.target.value);  // draftUrl 업데이트
};

// 상태 변화
draftUrl: '' → 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
```

#### 2단계: Enter 키 누름 → handleUrlSubmit 실행

```typescript
// useYoutubeBlock (메인 훅)
const handleUrlSubmit = async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const trimmedUrl = uiState.draftUrl.trim();  // URL 정리
  if (!trimmedUrl) return;

  // ✅ 즉시 loading 상태로 전환 (optimistic)
  uiState.setIsLoading(true);      // 🔄 loading 시작
  uiState.setHasError(false);
  uiState.setDraftUrl('');         // 입력창 비우기

  // fetchMetadata 호출
  const result = await fetchMetadata(trimmedUrl);
  // ...
};
```

### 👤 사용자가 보는 것 (loading 상태로 즉시 전환)

```
┌─────────────────────────────────┐
│                                 │
│   ⏳ 로딩 스켈레톤               │
│   ▬▬▬▬▬▬▬▬                      │
│   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬                │
│   ▬▬▬▬▬▬▬▬▬                     │
│                                 │
└─────────────────────────────────┘
```

#### 3단계: fetchMetadata 실행 (비즈니스 훅)

```typescript
// useYoutubeBlockBusiness
const fetchMetadata = async (urlString) => {
  // 1. Video ID 추출
  const videoId = getVideoId(urlString);  // 'dQw4w9WgXcQ'
  
  // 2. 중복 호출 방지
  isFetchingRef.current = true;
  fetchedUrlRef.current = urlString;

  // 3. 서버 액션 호출
  const result = await getYoutubeMetadataAction({
    blockId,
    slug: videoId,
  });

  // 4. 메타데이터 변환
  const metadata = {
    youtubeTitle: video.title,           // 'Never Gonna Give You Up'
    youtubeThumbnail: video.thumbnailUrl, // 'https://...'
    channelName: 'Rick Astley',
    viewCount: 1234567890,
    // ...
  };

  // 5. ⭐ URL과 메타데이터를 한번에 업데이트
  await updateProperties(id, {
    url: urlString,  // ✅ URL 저장
    ...metadata,     // ✅ 메타데이터 저장
  }, nodeData);

  return { success: true, metadata };
};
```

#### 4단계: updateProperties 실행

```typescript
// useUpdateBlockProperty (TanStack Query)

// onMutate (즉시 실행 - Optimistic Update)
onMutate: ({ blockMountId, blockData }) => {
  const nodeId = blockMountId;
  
  // React Flow Store 즉시 업데이트 ✨
  const updatedData = {
    ...blockData,
    properties: {
      ...blockData.properties,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeTitle: 'Never Gonna Give You Up',
      // ... 메타데이터
    }
  };
  updateNode(nodeId, { data: updatedData });  // ✅ 즉시 반영
  
  return { previousData: blockData, nodeId };
}

// mutationFn (서버 동기화 - 백그라운드)
mutationFn: async ({ blockId, properties }) => {
  // 서버에 저장
  const result = await updateBlockPropertiesAction({
    blockId,
    properties,
  });
  return result;
}
```

#### 5단계: 상태 업데이트 완료

```typescript
// handleUrlSubmit (메인 훅)
if (result.success) {
  uiState.setIsLoading(false);  // 🎉 loading 종료
}

// 상태 변화
properties = {
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',  // ✅ 저장됨
  youtubeTitle: 'Never Gonna Give You Up',             // ✅ 저장됨
  youtubeThumbnail: 'https://...',                     // ✅ 저장됨
  channelName: 'Rick Astley',                          // ✅ 저장됨
  // ...
}
```

### 👤 사용자가 보는 것 (최종 화면)

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │   🎬 썸네일 이미지          │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Never Gonna Give You Up         │ ← 제목
│ Rick Astley                     │ ← 채널명
│ 👁 1,234,567,890 | 👍 12M      │ ← 통계
└─────────────────────────────────┘
```

#### 6단계: 렌더링 조건 판정

```typescript
// youtube.view.tsx
{url && !isLoading && (
  <YoutubePreviewCard  // ✅ 렌더링됨
    metadata={hookResult.displayMetadata}
    thumbnailUrl={hookResult.getThumbnailUrl()}
    embedUrl={hookResult.getEmbedUrl()}
    // ...
  />
)}
```

### 📊 상태 요약

| 단계 | url | isLoading | draftUrl | 렌더링 |
|-----|-----|-----------|----------|--------|
| 입력 중 | `''` | `false` | `'https://...'` | `YoutubeEmptyState` |
| Enter 직후 | `''` | `true` ✨ | `''` | `YoutubeLoadingState` |
| 메타데이터 fetch | `'https://...'` ✨ | `true` | `''` | `YoutubeLoadingState` |
| 완료 | `'https://...'` | `false` ✨ | `''` | `YoutubePreviewCard` |

---

## 📌 시나리오 3: URL을 바꿀 때 (Toolbar에서 변경)

### 👤 사용자 행동

```
1. Toolbar에서 URL 버튼 클릭
2. 새로운 URL 입력: "https://www.youtube.com/watch?v=NEW_VIDEO"
3. 저장 버튼 클릭
```

### 🔄 데이터 흐름 & 상태

#### 1단계: Toolbar에서 URL 업데이트

```typescript
// youtube-url-toolbar-item.tsx
const handleValueChange = async (newUrl: string) => {
  await updateProperty(
    blockId,
    'properties.url',
    newUrl,
    blockData
  );
};

// updateProperty 실행 (TanStack Query)
// onMutate: React Flow Store 즉시 업데이트
properties.url = 'https://www.youtube.com/watch?v=NEW_VIDEO'  // ✅ 즉시 변경
```

#### 2단계: useEffect 트리거 (메인 훅)

```typescript
// useYoutubeBlock
useEffect(() => {
  if (url) {
    const hasNoMetadata = !properties.youtubeTitle;  // ✅ true (URL만 변경됨)

    if (hasNoMetadata && !isFetchingRef.current && fetchedUrlRef.current !== url) {
      isFetchingRef.current = true;
      fetchedUrlRef.current = url;

      const fetchMetadataAsync = async () => {
        setIsLoading(true);  // 🔄 loading 시작
        setHasError(false);

        const result = await fetchMetadata(url);  // 메타데이터 fetch

        if (result.success) {
          setIsLoading(false);  // 🎉 loading 종료
        }
      };

      fetchMetadataAsync();
    }
  }
}, [url, properties.youtubeTitle, fetchMetadata]);
```

### 👤 사용자가 보는 것

```
기존 비디오 카드 → 로딩 스켈레톤 → 새로운 비디오 카드
```

#### 3단계: useEffect 트리거 (UI 훅)

```typescript
// useYoutubeBlockUI
useEffect(() => {
  if (url && url !== prevUrlRef.current) {
    setIsLoading(true);       // 🔄 loading 시작
    setHasError(false);
    setShowPlayer(false);     // 플레이어 닫기
    prevUrlRef.current = url;
  }
}, [url]);
```

#### 4단계: fetchMetadata 실행 (비즈니스 훅)

```typescript
// useYoutubeBlockBusiness
// 시나리오 2와 동일하게 메타데이터 fetch 및 업데이트
await updateProperties(id, {
  url: urlString,  // ✅ URL 이미 업데이트됨 (중복이지만 문제없음)
  ...metadata,     // ✅ 새로운 메타데이터 저장
}, nodeData);
```

### 📊 상태 요약

| 단계 | url | youtubeTitle | isLoading | 렌더링 |
|-----|-----|--------------|-----------|--------|
| URL 변경 전 | `'OLD_URL'` | `'Old Title'` | `false` | `YoutubePreviewCard` (기존) |
| URL 변경 직후 | `'NEW_URL'` ✨ | `'Old Title'` | `true` ✨ | `YoutubeLoadingState` |
| 메타데이터 fetch 후 | `'NEW_URL'` | `'New Title'` ✨ | `false` ✨ | `YoutubePreviewCard` (새로운) |

---

## 📌 시나리오 4: 썸네일 클릭 시 (플레이어 표시)

### 👤 사용자 행동

```
블록이 선택된 상태에서 썸네일 클릭
```

### 🔄 데이터 흐름

```typescript
// useYoutubeBlockUI
const handleThumbnailClick = (e) => {
  e.stopPropagation();
  if (selected && url) {
    setIsIframeLoading(true);  // iframe 로딩 시작
    setShowPlayer(true);        // 플레이어 표시
  }
};
```

### 👤 사용자가 보는 것

```
썸네일 → iframe 로딩 → YouTube 플레이어
```

---

## 🎯 핵심 포인트 정리

### 1. **Optimistic Update 전략**

- URL 제출 시 즉시 loading 상태로 전환 → 빠른 피드백
- React Flow Store 즉시 업데이트 → 깜빡임 없음
- 서버 동기화는 백그라운드에서 진행

### 2. **데이터 흐름**

```
사용자 입력 → handleUrlSubmit → fetchMetadata → updateProperties
                                                      ↓
                                        Optimistic Update (React Flow)
                                                      ↓
                                        Server Action (백그라운드)
```

### 3. **렌더링 조건**

```typescript
!url && !isLoading     → YoutubeEmptyState (입력 폼)
isLoading              → YoutubeLoadingState (스켈레톤)
url && !isLoading      → YoutubePreviewCard (카드)
```

### 4. **상태 동기화**

- **UI 훅**: 순수 UI 상태 (`isLoading`, `draftUrl`, `showPlayer`)
- **비즈니스 훅**: 메타데이터 fetch & 서버 동기화
- **메인 훅**: 두 훅을 오케스트레이션

### 5. **중복 호출 방지**

```typescript
// useYoutubeBlockBusiness
const isFetchingRef = useRef(false);
const fetchedUrlRef = useRef<string | null>(null);

if (isFetchingRef.current || fetchedUrlRef.current === urlString) {
  return { success: false, error: 'Already fetching' };
}
```

### 6. **자동 포커스**

```typescript
// useYoutubeBlockUI
useEffect(() => {
  if (selected && !url && inputRef.current) {
    inputRef.current.focus();  // ✅ URL 없을 때 자동 포커스
  }
}, [selected, url]);
```

---

## 🔧 주요 함수 설명

### `useYoutubeBlock` (메인 훅)

- **역할**: UI 훅과 비즈니스 훅을 오케스트레이션
- **책임**:
  - 외부 훅(`useReactFlow`, `useUpdateBlockProperty`) 사용
  - URL 변경 감지 및 메타데이터 자동 fetch
  - `handleUrlSubmit` 처리

### `useYoutubeBlockUI` (UI 훅)

- **역할**: 순수 UI 상태 관리
- **상태**:
  - `isLoading`: 로딩 중 여부
  - `draftUrl`: 입력 중인 URL
  - `showPlayer`: 플레이어 표시 여부
  - `hasError`: 에러 상태
- **핸들러**: UI 이벤트 처리 (클릭, 입력 등)

### `useYoutubeBlockBusiness` (비즈니스 훅)

- **역할**: 메타데이터 fetch 및 서버 동기화
- **함수**:
  - `fetchMetadata`: YouTube 메타데이터 fetch 및 저장
  - `getVideoId`: URL에서 Video ID 추출
  - `getThumbnailUrl`: 썸네일 URL 생성
  - `getEmbedUrl`: Embed URL 생성

---

## 📝 참고사항

### Value Object 사용

```typescript
// YoutubeBlockPropertiesVO 사용
const vo = useMemo(
  () => YoutubeBlockPropertiesVO.fromJSON(properties),
  [properties]
);

// Video ID 추출, 썸네일/Embed URL 생성 등은 VO 메서드 사용
const videoId = vo.getVideoId();
const thumbnailUrl = vo.getThumbnailUrl();
```

### TanStack Query Optimistic Update

```typescript
// useUpdateBlockProperty
onMutate: ({ blockMountId, blockData }) => {
  // React Flow Store 즉시 업데이트
  updateNode(nodeId, { data: updatedData });
  return { previousData: blockData, nodeId };
}
```

### 에러 처리

```typescript
// fetchMetadata 실패 시
if (!result.success) {
  uiState.setHasError(true);
  uiState.setIsLoading(false);
}
```

---

## 🚀 향후 개선 사항

1. **캐싱**: 동일한 Video ID에 대한 메타데이터 캐싱
2. **재시도**: 네트워크 에러 시 자동 재시도
3. **프리로딩**: URL 입력 중 미리보기 표시
4. **타임스탬프**: URL에 타임스탬프 포함 시 해당 시간부터 재생
