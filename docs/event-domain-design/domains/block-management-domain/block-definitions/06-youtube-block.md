# 유튜브 블록 (YouTube Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `youtube`
- **Enum**: `BlockType.YOUTUBE`
- **데이터베이스**: `block_type_enum.youtube`

### 설명
유튜브 영상을 임베드하여 표시하는 블록입니다. 유튜브 URL만 입력하면 iframe으로 영상을 재생할 수 있으며, 스크립트 추출 등의 AI 기능을 제공합니다.

### 사용 사례
- 레퍼런스 영상 수집
- 튜토리얼 영상 임베드
- 프로젝트 관련 영상 정리
- 유튜브 스크립트 기반 문서 작성

## 2. UI 정의

### 기본 UI
- 유튜브 iframe 임베드
- 재생/일시정지 컨트롤 (유튜브 제공)
- 썸네일 미리보기
- 영상 제목 및 메타데이터 표시

### 기본 크기
```typescript
{
  width: 400,   // 픽셀
  height: 225   // 픽셀 (16:9 비율)
}
```

### 블록 스페이스/에디터
**없음** - Editor Panel에서 속성 편집만 지원

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "유튜브" 선택
2. 유튜브 URL 입력
3. 자동으로 비디오 ID 추출 및 메타데이터 fetch
4. 유튜브 블록 생성

### 붙여넣기 방식
- **유튜브 URL**: `youtube.com`, `youtu.be` URL 감지 → 자동으로 유튜브 블록 생성
- **공유 링크**: 유튜브 공유 링크 (`youtu.be/...`) 지원

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface YouTubeBlockProperties {
  // 유튜브 정보 (유저 입력)
  url: string;                        // 원본 URL
  
  // YouTube 정보 (fetch 후 사용자 수정 가능)
  youtubeTitle?: string;              // 영상 제목 (수정 가능)
  youtubeDescription?: string;        // 영상 설명 (수정 가능)
  youtubeThumbnail?: string;          // 썸네일 URL (수정 가능)
}

// Note: videoId는 URL에서 자동 추출됩니다.
// viewCount, channelName, subscriberCount, commentCount 등의 통계 정보는
// 메타데이터로 표시됩니다 (readonly).
```

### 기본 속성

#### 1. url
- **타입**: `string`
- **설명**: 유튜브 URL
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '유튜브 URL',
    inputType: 'url',
    icon: 'Link',
    description: '유튜브 영상 URL',
    placeholder: 'https://www.youtube.com/watch?v=...',
    order: 1,
  }
  ```

#### 2. youtubeTitle
- **타입**: `string`
- **설명**: 영상 제목 (fetch 후 수정 가능)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '영상 제목',
    inputType: 'text',
    icon: 'Heading',
    description: '유튜브 영상 제목 (fetch 후 수정 가능)',
    placeholder: '제목을 입력하세요...',
    order: 2,
  }
  ```

#### 3. youtubeDescription
- **타입**: `string`
- **설명**: 영상 설명 (fetch 후 수정 가능)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '영상 설명',
    inputType: 'textarea',
    icon: 'FileText',
    description: '유튜브 영상 설명 (fetch 후 수정 가능)',
    placeholder: '설명을 입력하세요...',
    order: 3,
  }
  ```

#### 4. youtubeThumbnail
- **타입**: `string`
- **설명**: 썸네일 URL (fetch 후 수정 가능)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '썸네일',
    inputType: 'url',
    icon: 'Image',
    description: '유튜브 썸네일 URL (fetch 후 수정 가능)',
    placeholder: 'https://...',
    order: 4,
  }
  ```

### 메타데이터 속성 (YouTube 블록 전용)
- `viewCount`: 조회수 (readonly-text, 예: '1,234,567 views')
- `channelName`: 채널 이름 (readonly-text)
- `subscriberCount`: 구독자 수 (readonly-text, 예: '100K subscribers')
- `commentCount`: 댓글 수 (readonly-text, 예: '1,234 comments')
- `publishedAt`: 게시일 (readonly-datetime)

### 메타데이터 속성 (공통)
- `createdAt`: 생성일 (readonly-datetime)
- `updatedAt`: 수정일 (readonly-datetime)
- `createdBy`: 작성자 프로필 (readonly-profile)

### 속성 그룹 (UI Schema Groups)

```typescript
groups: [
  {
    id: 'basic-info',
    label: '기본 정보',
    description: '유튜브 영상 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['url', 'youtubeTitle', 'youtubeDescription', 'youtubeThumbnail'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '유튜브 통계 및 생성 정보',
    defaultCollapsed: true,
    order: 2,
    properties: ['viewCount', 'channelName', 'subscriberCount', 'commentCount', 'publishedAt', 'createdAt', 'updatedAt', 'createdBy'],
  },
]
```

## 5. 툴바 아이템

### 1. RefreshYouTubeInfoToolbarItem
- **아이콘**: `RefreshCw`
- **기능**: YouTube 정보 업데이트
- **동작**: YouTube API로 최신 정보 fetch 및 업데이트

### 2. YouTubeOpenToolbarItem
- **아이콘**: `ExternalLink`
- **기능**: 유튜브에서 열기
- **동작**: 새 탭에서 유튜브 URL 열기

## 6. 블록 툴

### 1. YouTube 정보 업데이트 (Update YouTube Info)
- **입력**: 
  - 현재 유튜브 블록
- **출력**: 
  - 업데이트된 유튜브 블록 (최신 통계 정보 반영)
- **설명**: YouTube API를 통해 조회수, 댓글수, 구독자 수 등 최신 정보 업데이트
- **API**: YouTube Data API v3

### 2. 댓글 수집 (Collect Comments)
- **입력**: 
  - 현재 유튜브 블록
  - 수집할 댓글 수 (선택, 기본값: 100)
- **출력**: 
  - 새로운 마크다운 블록 (댓글 목록)
- **설명**: YouTube API를 통해 영상의 댓글 수집 및 정리
- **API**: YouTube Data API v3 (Comments API)
- **향후 구현**

### 3. 유튜브 스크립트 추출 (Extract Transcript)
- **입력**: 
  - 현재 유튜브 블록
  - 언어 설정 (선택, 기본값: 자동)
- **출력**: 
  - 새로운 마크다운 블록 (타임스탬프 포함 스크립트)
- **설명**: YouTube Data API 또는 서드파티 라이브러리를 사용하여 자동 생성 자막 추출
- **API**: YouTube Data API v3, `youtube-transcript` npm 패키지

### 4. 유튜브 요약 (Summarize Video)
- **입력**: 
  - 현재 유튜브 블록 (스크립트 추출 후)
  - 요약 길이 파라미터 (선택)
- **출력**: 
  - 새로운 마크다운 블록 (요약)
- **설명**: 스크립트를 추출한 후 AI로 요약
- **API**: OpenAI API (GPT-4), Anthropic API (Claude)

### 5. 챕터 생성 (Generate Chapters)
- **입력**: 
  - 현재 유튜브 블록 (스크립트 추출 후)
- **출력**: 
  - 새로운 마크다운 블록 (챕터 목록 및 타임스탬프)
- **설명**: AI를 사용하여 영상 내용을 분석하고 챕터 생성
- **API**: OpenAI API, YouTube Data API (영상 설명 파싱)

## 7. 구현 참조

### Properties Interface
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/youtube.vo.ts
```
**(부분 구현됨, 확장 필요)**

### UI Schema
```
apps/web/src/domains/block-management/shared/schemas/ui/youtube-block.ui-schema.ts
```
**(향후 구현)**

### Block Component
```
apps/web/src/domains/block-management/frontend/components/block/youtube/youtube-block.tsx
```
**(향후 구현)**

**사용 라이브러리**:
- **YouTube iframe API**: 공식 iframe embed
- **react-youtube**: React YouTube 컴포넌트
- **youtube-transcript**: 스크립트 추출

### Toolbar Items
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/block-toolbar-mapper.tsx
```
(case 'youtube' 추가 예정)

## 8. 특이사항 및 주의사항

### URL 파싱
- 다양한 유튜브 URL 포맷 지원:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`
  - `https://www.youtube.com/watch?v=VIDEO_ID&t=30s` (타임스탬프 포함)
- 비디오 ID 추출 정규식 사용

### 메타데이터 Fetch
- YouTube Data API v3 사용
- API 키 필요 (환경 변수)
- Rate Limit 고려 (캐싱 필요)

### iframe 최적화
- `loading="lazy"` 속성으로 지연 로딩
- Intersection Observer로 뷰포트 감지

### 프라이버시
- `youtube-nocookie.com` 도메인 사용 옵션 (쿠키 없음)
- Do Not Track 옵션

### 접근성
- iframe에 적절한 title 속성
- 키보드로 포커스 가능

## 9. 향후 계획

- [ ] **YouTube Shorts**: 쇼츠 영상 지원
- [ ] **YouTube Playlist**: 플레이리스트 임베드
- [ ] **YouTube Live**: 라이브 스트리밍 임베드
- [ ] **타임스탬프 링크**: 특정 시간대로 바로 이동하는 링크 생성
- [ ] **AI 분석**: 영상 내용 기반 태그 자동 생성
- [ ] **노트 동기화**: 타임스탬프 기반 노트 작성

