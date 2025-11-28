# Block Properties 설계 원칙

> 블록 정의 시 Properties를 설계할 때 반드시 따라야 하는 핵심 원칙

## 🎯 핵심 원칙

### Properties는 "사용자가 직접 수정할 수 있는 속성"만 포함

**Properties에 포함되어야 하는 것**:
- ✅ 사용자가 Editor Panel에서 직접 입력/선택하는 값
- ✅ 사용자가 Toolbar에서 빠르게 변경하는 값
- ✅ 블록의 동작이나 표시 방식을 제어하는 설정값

**Properties에 포함하지 않아야 하는 것**:
- ❌ 자동으로 fetch되는 메타데이터 (API 응답 데이터)
- ❌ 자동으로 계산/생성되는 값
- ❌ 시스템이 내부적으로 관리하는 상태
- ❌ 렌더링 엔진이 자동으로 결정하는 옵션

## 📋 블록별 적용 사례

### ✅ 올바른 예시: 텍스트 블록

```typescript
export interface TextBlockProperties {
  content: string;       // ✅ 사용자가 직접 입력
  color: ColorToken;     // ✅ 사용자가 선택
  richStyle: boolean;    // ✅ 사용자가 토글
  textAlign: TextAlign;  // ✅ 사용자가 선택
  fontSize: FontSize;    // ✅ 사용자가 선택
}
```

### ✅ 올바른 예시: 도형 블록

```typescript
export interface ShapeBlockProperties {
  shapeType: ShapeType;   // ✅ 사용자가 선택
  color: ColorToken;      // ✅ 사용자가 선택
  borderStyle: 'solid' | 'dashed' | 'dotted';  // ✅ 사용자가 선택
}
```

### ✅ 올바른 예시: 유튜브 블록

```typescript
export interface YouTubeBlockProperties {
  url: string;            // ✅ 사용자가 입력
  autoplay: boolean;      // ✅ 사용자가 선택
  loop: boolean;          // ✅ 사용자가 선택
  muted: boolean;         // ✅ 사용자가 선택
  // ... 기타 사용자 설정값
}

// ❌ 포함하지 않음: videoId, title, channelName, thumbnailUrl (자동 fetch)
```

### ❌ 잘못된 예시

```typescript
// 나쁜 예시
export interface BadYouTubeBlockProperties {
  url: string;
  videoId: string;        // ❌ URL에서 자동 추출되는 값
  title: string;          // ❌ YouTube API에서 자동 fetch
  channelName: string;    // ❌ YouTube API에서 자동 fetch
  thumbnailUrl: string;   // ❌ YouTube API에서 자동 fetch
  duration: number;       // ❌ YouTube API에서 자동 fetch
  viewCount: number;      // ❌ YouTube API에서 자동 fetch
  renderMode: string;     // ❌ 시스템이 내부적으로 관리하는 상태
}
```

## 🔄 자동 데이터는 어디서 관리하나?

### 블록 컴포넌트 내부 상태
```typescript
// ✅ 올바른 구조
function YouTubeBlock({ id, data }: NodeProps) {
  const properties = data.properties as YouTubeBlockProperties;
  
  // Properties에서 가져오는 값 (사용자 설정)
  const { url, autoplay, loop } = properties;
  
  // 컴포넌트 내부에서 관리하는 자동 fetch 데이터
  const [metadata, setMetadata] = useState({
    videoId: '',
    title: '',
    channelName: '',
    thumbnailUrl: '',
    duration: 0,
    viewCount: 0,
  });
  
  useEffect(() => {
    // URL 변경 시 메타데이터 fetch
    fetchYouTubeMetadata(url).then(setMetadata);
  }, [url]);
  
  // ...
}
```

### Server Action 또는 API Route
```typescript
// 서버에서 자동 데이터 처리
export async function fetchYouTubeMetadata(url: string) {
  const videoId = extractVideoId(url);
  const response = await fetch(`https://youtube.googleapis.com/...`);
  const data = await response.json();
  
  return {
    videoId,
    title: data.snippet.title,
    channelName: data.snippet.channelTitle,
    thumbnailUrl: data.snippet.thumbnails.high.url,
    duration: parseDuration(data.contentDetails.duration),
    viewCount: parseInt(data.statistics.viewCount),
  };
}
```

## 🎨 간소화 원칙

### 1. 색상은 하나로 통합
```typescript
// ❌ 나쁜 예시
interface BadShapeProperties {
  fillColor: ColorToken;
  strokeColor: ColorToken;
}

// ✅ 좋은 예시
interface GoodShapeProperties {
  color: ColorToken;  // 하나의 색상으로 통합
}
```

### 2. 스타일 옵션은 최소화
```typescript
// ❌ 나쁜 예시
interface BadShapeProperties {
  strokeWidth: number;
  opacity: number;
  cornerRadius: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  pattern: string;
}

// ✅ 좋은 예시
interface GoodShapeProperties {
  borderStyle: 'solid' | 'dashed' | 'dotted';  // 핵심 옵션만
}
```

### 3. 렌더링/내부 상태는 제거
```typescript
// ❌ 나쁜 예시
interface BadMarkdownProperties {
  content: string;
  renderMode: 'edit' | 'preview' | 'split';  // ❌ 렌더링 상태
  syntaxTheme: string;                       // ❌ 내부 설정
  enableMath: boolean;                       // ❌ 렌더링 옵션
  enableCodeHighlight: boolean;              // ❌ 렌더링 옵션
}

// ✅ 좋은 예시
interface GoodMarkdownProperties {
  content: string;  // 콘텐츠만
}
```

### 4. 표시 모드는 제거 (기본 설정)
```typescript
// ❌ 나쁜 예시
interface BadImageProperties {
  imageUrl: string;
  displayMode: 'single' | 'grid' | 'slider';  // ❌ 표시 모드
  showImage: boolean;                         // ❌ 표시 옵션
  showDescription: boolean;                   // ❌ 표시 옵션
}

// ✅ 좋은 예시
interface GoodImageProperties {
  imageUrl: string;
  aspectRatio: 'original' | '16:9' | '4:3' | '1:1' | 'custom';  // ✅ 사용자 선택
  objectFit: 'contain' | 'cover' | 'fill';                      // ✅ 사용자 선택
  caption?: string;                                             // ✅ 사용자 입력
}
```

## 📊 리뷰 체크리스트

블록 Properties를 정의할 때 다음을 확인하세요:

- [ ] **모든 속성이 사용자가 직접 수정 가능한가?**
  - 자동 fetch 데이터가 포함되지 않았는지 확인
  
- [ ] **속성이 과도하게 많지 않은가?**
  - 핵심 옵션만 남기고 나머지는 기본 설정으로
  
- [ ] **렌더링 관련 내부 상태가 포함되지 않았는가?**
  - `renderMode`, `syntaxTheme`, `enable*` 등 제거
  
- [ ] **각 속성의 필수 여부가 명확한가?**
  - 기본값이 있는 필수 속성은 `required: true`
  - 선택적 속성만 `optional`
  
- [ ] **UI Schema가 올바르게 정의되었는가?**
  - `inputType`이 적절한가?
  - `order`가 올바른가?
  - `readonly` 속성이 필요한가?

## 🏆 Best Practices

### 1. 최소주의 (Minimalism)
- 사용자가 실제로 변경할 수 있는 속성만 포함
- 복잡도를 낮추고 사용성을 높임

### 2. 명확한 분리 (Clear Separation)
- **Properties**: 사용자 설정 (DB 저장)
- **Component State**: 자동 fetch 데이터, UI 상태
- **Constants**: 고정 설정값

### 3. 타입 안전성 (Type Safety)
- 모든 필수 속성은 optional(`?`) 사용 금지
- 명확한 타입 정의 (enum, union type)

### 4. 일관성 (Consistency)
- **공통 메타데이터**: 모든 블록에 `createdAt`, `updatedAt`, `createdBy`
- **파일 블록 전용 메타데이터**: 이미지/비디오/PDF는 `fileType`, `fileSize`, 원본 크기 정보
- **색상**: `ColorToken` enum 사용
- **폰트 크기**: `FontSize` enum 사용

## 📊 메타데이터 구조

### 일반 블록 (텍스트, 마크다운, 도형, URL, YouTube 등)
```typescript
// Editor Panel 메타데이터 그룹
metadata: {
  createdAt: string;      // 생성일
  updatedAt: string;      // 수정일
  createdBy: UserProfile; // 작성자
}
```

### 파일 기반 블록 (이미지, 비디오, PDF)
```typescript
// Editor Panel 메타데이터 그룹
metadata: {
  // 블록 전용
  fileType: string;       // MIME 타입 (예: 'image/jpeg', 'video/mp4')
  fileSize: string;       // 파일 크기 (예: '2.3 MB')
  imageDimensions: string; // 원본 크기 (예: '1920 × 1080') - 이미지만
  videoDuration: string;   // 영상 길이 (예: '5:32') - 비디오만
  videoDimensions: string; // 비디오 원본 크기 - 비디오만
  pageCount: string;       // 페이지 수 (예: '45 pages') - PDF만
  
  // 공통
  createdAt: string;
  updatedAt: string;
  createdBy: UserProfile;
}
```

## 📝 요약

**Properties = 사용자가 직접 제어하는 블록의 설정값**

- 자동 fetch 데이터 ❌
- 렌더링 옵션 ❌  
- 내부 상태 ❌
- 사용자 입력/선택 ✅
- 사용자 설정 ✅

이 원칙을 따르면 블록이 간결하고, 이해하기 쉽고, 유지보수하기 좋은 구조가 됩니다.

