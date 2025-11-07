# 블록 정의 최종 요약

> 모든 블록 타입의 Properties 및 메타데이터 최종 정리

## 🎯 설계 원칙 요약

**Properties = 사용자가 직접 수정할 수 있는 속성만 포함**

- ✅ 사용자 입력/선택 값
- ❌ 자동 fetch 메타데이터
- ❌ 렌더링 옵션
- ❌ 내부 상태

## 📋 블록별 Properties 요약

### 1. 텍스트 블록 (Text)
```typescript
{
  content: string;       // 텍스트 내용
  color: ColorToken;     // 텍스트 색상
  richStyle: boolean;    // 리치 스타일
  textAlign: TextAlign;  // 텍스트 정렬
  fontSize: FontSize;    // 폰트 크기
}
```

**메타데이터**: `createdAt`, `updatedAt`, `createdBy`

---

### 2. 마크다운 블록 (Markdown)
```typescript
{
  content: string;       // 마크다운 콘텐츠 (TipTap JSON)
  color: ColorToken;     // 배경 색상
}
```

**에디터**: TipTap (블록형 마크다운)  
**메타데이터**: `createdAt`, `updatedAt`, `createdBy`

---

### 3. 도형 블록 (Shape)
```typescript
{
  shapeType: ShapeType;   // 도형 종류 (9가지)
  content?: string;       // 도형 내부 텍스트
  color: ColorToken;      // 도형 색상
  borderStyle: BorderStyle; // 테두리 스타일 (solid/dashed/dotted)
}
```

**도형 종류**: 사각형, 원, 타원, 삼각형, 다이아몬드, 육각형, 오각형, 별, 하트  
**메타데이터**: `createdAt`, `updatedAt`, `createdBy`

---

### 4. 이미지 블록 (Image)
```typescript
{
  imageUrl: string;       // Supabase Storage URL
  aspectRatio: '...'      // 이미지 비율
  objectFit: '...'        // 맞춤 방식
  caption?: string;       // 캡션 (하단 작게 표시)
  alt?: string;           // 대체 텍스트
}
```

**에디터**: 이미지 에디터 (자르기, 색조, 필터, 회전)  
**메타데이터 (전용)**: `fileType`, `fileSize`, `imageDimensions`  
**메타데이터 (공통)**: `createdAt`, `updatedAt`, `createdBy`

---

### 5. 비디오 블록 (Video)
```typescript
{
  url: string;            // 비디오 URL
  thumbnail?: string;     // 썸네일 URL
}
```

**플레이어**: Vidstack (재생 옵션 자동 제공)  
**에디터**: Remotion (비디오 편집)  
**메타데이터 (전용)**: `fileType`, `fileSize`, `videoDuration`, `videoDimensions`  
**메타데이터 (공통)**: `createdAt`, `updatedAt`, `createdBy`

---

### 6. 유튜브 블록 (YouTube)
```typescript
{
  url: string;                  // 유튜브 URL
  youtubeTitle?: string;        // 영상 제목 (fetch 후 수정 가능)
  youtubeDescription?: string;  // 영상 설명 (fetch 후 수정 가능)
  youtubeThumbnail?: string;    // 썸네일 (fetch 후 수정 가능)
}
```

**메타데이터 (전용)**: `viewCount`, `channelName`, `subscriberCount`, `commentCount`, `publishedAt`  
**메타데이터 (공통)**: `createdAt`, `updatedAt`, `createdBy`  
**블록 툴**: YouTube 정보 업데이트, 댓글 수집, 스크립트 추출, 요약, 챕터 생성

---

### 7. URL 프리뷰 블록 (Link)
```typescript
{
  url: string;            // 원본 URL
}
```

**UI**: 오픈그래프 카드  
**메타데이터**: `createdAt`, `updatedAt`, `createdBy`

---

### 8. 트위터 블록 (Twitter)
```typescript
{
  url: string;            // 트위터 URL
  theme: 'light' | 'dark' | 'auto';  // 테마
}
```

**UI**: react-tweet (트위터 임베드)  
**메타데이터**: `createdAt`, `updatedAt`, `createdBy`

---

### 9. 코드 블록 (Code)
```typescript
{
  code: string;           // 코드 내용
  language: string;       // 언어
  // ... 기타 속성 (상세 정의 필요)
}
```

**에디터**: Monaco Editor 또는 CodeMirror  
**메타데이터**: `createdAt`, `updatedAt`, `createdBy`

---

### 10. GitHub PR 블록
```typescript
{
  url: string;            // PR URL
  autoRefresh: boolean;   // 자동 새로고침
}
```

**메타데이터**: `createdAt`, `updatedAt`, `createdBy`

---

### 11. Vercel 배포 블록
```typescript
{
  url: string;            // Vercel URL
  autoRefresh: boolean;   // 자동 새로고침
}
```

**메타데이터**: `createdAt`, `updatedAt`, `createdBy`

---

### 12. PDF 뷰어 블록
```typescript
{
  url: string;
  currentPage: number;
  zoom: number;
  // ... 기타 속성 (상세 정의 필요)
}
```

**메타데이터 (전용)**: `fileType`, `fileSize`, `pageCount`  
**메타데이터 (공통)**: `createdAt`, `updatedAt`, `createdBy`

---

### 13. 오디오 블록 (Audio)
```typescript
{
  audioUrl: string;           // Supabase Storage URL
  title?: string;             // 오디오 제목
  artist?: string;            // 아티스트/화자
  playbackRate: number;       // 재생 속도 (0.5 ~ 2.0)
  volume: number;             // 볼륨 (0.0 ~ 1.0)
  transcript?: string;        // 음성 텍스트 변환 결과 (STT)
}
```

**입력 방식**: 파일 업로드 또는 직접 녹음 (2가지)  
**UI**: 파형(Waveform) 시각화 + 재생 컨트롤  
**사용 컴포넌트**: 
- 재생: `AudioScrubber` (waveform.tsx)
- 녹음: `VoiceButton`, `LiveWaveform`, `MicSelector`

**메타데이터 (전용)**: `fileType`, `fileSize`, `audioDuration`  
**메타데이터 (공통)**: `createdAt`, `updatedAt`, `createdBy`  
**블록 툴**: 음성→텍스트 변환(STT), 오디오 요약, 번역, 챕터 생성, 오디오 찾기, 오디오 생성(TTS)

---

## 📊 메타데이터 구조

### 일반 블록
```
- createdAt
- updatedAt
- createdBy
```

### 파일 기반 블록 (이미지, 비디오, 오디오, PDF)
```
[블록 전용]
- fileType (MIME 타입)
- fileSize
- imageDimensions / videoDimensions / audioDuration / pageCount

[공통]
- createdAt
- updatedAt
- createdBy
```

### YouTube 블록 (특수)
```
[블록 전용]
- viewCount
- channelName
- subscriberCount
- commentCount
- publishedAt

[공통]
- createdAt
- updatedAt
- createdBy
```

## 🎨 공통 타입

### ColorToken
- 모든 블록의 색상 속성에 사용
- 테마 시스템과 통합

### FontSize
- 텍스트 블록의 폰트 크기
- SMALL, MEDIUM, LARGE, XLARGE

### TextAlign
- 텍스트 정렬
- LEFT, CENTER, RIGHT

## 🔄 자동 데이터 관리 원칙

**Properties에 포함하지 않는 데이터**:
- YouTube: `videoId` (URL에서 추출)
- 이미지/비디오/오디오: `filename`, `mimeType` (파일에서 추출)
- 오디오: `waveformData` (Web Audio API로 생성), `duration` (메타데이터)
- URL 프리뷰: `title`, `description`, `imageUrl` (오픈그래프 fetch)
- Twitter: `tweetId`, `text`, `authorName` (Twitter API fetch)

**관리 위치**:
- 블록 컴포넌트 내부 상태 (useState)
- 서버 액션/API Route에서 fetch
- 메타데이터로 readonly 표시 (필요한 경우)
- 로컬 스토리지/DB 캐싱 (파형 데이터 등)

## 🚀 다음 단계

각 블록 구현 시:
1. Properties Interface 정의
2. Value Object (VO) 작성
3. UI Schema 정의
4. Block Component 구현
5. Toolbar Items 구현
6. Block Tools 구현 (AI 연동)

**참조 문서**: 
- `00-block-properties-principle.md` - 블록 속성 정의 원칙
- `01-text-block.md` - 텍스트 블록
- `02-markdown-block.md` - 마크다운 블록
- `04-image-block.md` - 이미지 블록
- `06-youtube-block.md` - 유튜브 블록
- `07-audio-block.md` - 오디오 블록 (신규)



