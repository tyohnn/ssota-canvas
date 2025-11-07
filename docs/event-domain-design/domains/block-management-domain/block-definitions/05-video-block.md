# 비디오 블록 (Video Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `video`
- **Enum**: `BlockType.VIDEO`
- **데이터베이스**: `block_type_enum.video`

### 설명
비디오 파일을 재생할 수 있는 블록입니다. 로컬 비디오 파일을 업로드하거나 외부 비디오 URL을 사용할 수 있으며, 고급 비디오 편집 기능을 제공합니다.

### 사용 사례
- 화면 녹화 영상 저장
- 프로젝트 데모 영상
- 교육 콘텐츠
- 제품 소개 영상
- 회의 녹화본

## 2. UI 정의

### 기본 UI
- Vidstack 비디오 플레이어
- 재생/일시정지, 탐색 바
- 볼륨 조절
- 전체화면 모드
- 재생 속도 조절
- 자막 지원
- Picture-in-Picture 모드

### 기본 크기
```typescript
{
  width: 400,   // 픽셀
  height: 225   // 픽셀 (16:9 비율)
}
```

### 블록 스페이스/에디터
**있음** - 비디오 에디터 제공
- **Remotion 기반 에디터** (추천)
  - 프로그래매틱 비디오 편집
  - React 컴포넌트로 비디오 구성
  - 타임라인 편집
- **또는 기타 웹 기반 비디오 에디터**
  - 자르기, 트리밍
  - 텍스트/이미지 오버레이
  - 트랜지션 효과
  - 오디오 조절

**사용 라이브러리 후보**:
- `remotion` (React 기반 비디오 편집)
- `video.js` 또는 `plyr` (비디오 플레이어)
- `ffmpeg.wasm` (브라우저 비디오 처리)

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "비디오" 선택
2. 파일 업로드 또는 URL 입력
3. Supabase Storage에 업로드 (로컬 파일)
4. 비디오 블록 생성

### 붙여넣기 방식
- **비디오 파일 복사**: 비디오 파일 객체 복사 후 붙여넣기 → 자동으로 비디오 블록 생성
- **비디오 URL**: URL이 비디오 확장자(.mp4, .webm, .mov 등)로 끝나면 비디오 블록 생성

### 드래그앤드롭 방식
- 파일 탐색기에서 비디오 파일 드래그 → 캔버스에 드롭 → 비디오 블록 생성

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface VideoBlockProperties {
  // 비디오 정보
  url: string;                        // 비디오 URL (Supabase Storage 또는 외부)
  
  // 썸네일
  thumbnail?: string;                 // 썸네일 이미지 URL (재생 전 표시, 선택 사항)
}

// Note: filename, mimeType, size, duration, width, height 등의 메타데이터는
// Supabase Storage에서 자동으로 fetch하여 블록 컴포넌트 내부에서 관리합니다.
// Properties에는 포함하지 않습니다.
// 
// 플레이어 옵션 (autoplay, loop, muted, controls, playbackRate 등)은
// Vidstack 플레이어에서 기본 설정으로 제공되며, Properties에 포함하지 않습니다.
```

### 기본 속성

#### 1. url
- **타입**: `string`
- **설명**: 비디오 파일 URL
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '비디오 URL',
    inputType: 'url',
    icon: 'Video',
    description: '비디오 파일 URL (업로드 시 자동 설정)',
    placeholder: 'https://...',
    order: 1,
    readonly: true,  // 파일 업로드로만 설정
  }
  ```

#### 2. thumbnail
- **타입**: `string`
- **설명**: 썸네일 이미지 URL (재생 전 표시)
- **기본값**: `''` (자동 생성)
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '썸네일',
    inputType: 'url',
    icon: 'Image',
    description: '재생 전 표시되는 썸네일 이미지 URL',
    placeholder: 'https://...',
    order: 2,
  }
  ```

### 메타데이터 속성 (비디오 블록 전용)
- `fileType`: 파일 확장자/MIME 타입 (readonly-text, 예: 'video/mp4', 'video/webm')
- `fileSize`: 파일 크기 (readonly-text, 예: '45.2 MB')
- `videoDuration`: 영상 길이 (readonly-text, 예: '5:32')
- `videoDimensions`: 비디오 원본 크기 (readonly-text, 예: '1920 × 1080')

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
    description: '비디오의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['url', 'thumbnail'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '생성 및 수정 정보',
    defaultCollapsed: true,
    order: 2,
    properties: ['fileType', 'fileSize', 'videoDuration', 'videoDimensions', 'createdAt', 'updatedAt', 'createdBy'],
  },
]
```

## 5. 툴바 아이템

### 1. VideoEditToolbarItem
- **아이콘**: `Edit`
- **기능**: 비디오 에디터 열기
- **동작**: 모달로 비디오 에디터 표시

### 2. DownloadVideoToolbarItem
- **아이콘**: `Download`
- **기능**: 비디오 다운로드
- **동작**: 비디오 파일 다운로드

**Note**: 재생/일시정지, 자동 재생, 반복, 음소거, 재생 속도 등의 플레이어 컨트롤은 
Vidstack 플레이어에서 기본 제공되므로 별도 툴바 아이템이 필요 없습니다.

## 6. 블록 툴

**현재 없음** - 비디오 블록은 미디어 재생 블록이므로 특별한 툴이 정의되지 않았습니다.

향후 추가 가능한 툴:
- `비디오 자막 생성`: AI를 사용하여 자동 자막 생성
- `비디오 요약`: 비디오 내용을 텍스트로 요약
- `오디오 추출`: 비디오에서 오디오를 추출하여 오디오 블록 생성
- `프레임 추출`: 특정 프레임을 이미지 블록으로 추출
- `비디오 트랜스코딩`: 다양한 포맷으로 변환

## 7. 구현 참조

### Properties Interface
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/video.vo.ts
```
**(향후 구현)**

### UI Schema
```
apps/web/src/domains/block-management/shared/schemas/ui/video-block.ui-schema.ts
```
**(향후 구현)**

### Block Component
```
apps/web/src/domains/block-management/frontend/components/block/video/video-block.tsx
```
**(향후 구현)**

**사용 라이브러리**:
- **비디오 플레이어**: `@vidstack/react` (Vidstack)
- **비디오 편집**: `remotion` (React 기반, 블록 스페이스/에디터용)
- **비디오 처리**: `ffmpeg.wasm` (브라우저 내 비디오 인코딩/디코딩)
- **업로드**: Supabase Storage SDK

### Toolbar Items
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/block-toolbar-mapper.tsx
```
(case 'video' 추가 예정)

## 8. 특이사항 및 주의사항

### 파일 업로드
- **최대 파일 크기**: 100MB (설정 가능, 대용량은 청크 업로드)
- **지원 포맷**: MP4, WebM, OGG, MOV
- **트랜스코딩**: 서버 사이드 트랜스코딩으로 웹 호환 포맷 생성 (H.264/AAC)
- **썸네일 생성**: 자동으로 비디오 썸네일 생성 (첫 프레임 또는 중간 프레임)

### 성능 최적화
- **Adaptive Streaming**: HLS 또는 DASH로 adaptive bitrate 스트리밍
- **Progressive Download**: 순차 다운로드로 빠른 재생 시작
- **Lazy Loading**: 뷰포트에 들어올 때 로드
- **CDN**: Supabase Storage CDN 사용

### 보안
- **MIME 타입 검증**: 실제 파일 타입 확인
- **RLS 정책**: 워크스페이스별 파일 접근 제어
- **스트리밍 토큰**: 비공개 비디오는 시간 제한 토큰 사용

### 접근성
- **자막**: 모든 비디오에 자막 제공 권장
- **키보드 컨트롤**: 키보드로 재생/일시정지, 탐색 가능
- **스크린 리더**: 비디오 메타데이터 읽어주기

### 브라우저 호환성
- **포맷 감지**: 브라우저 지원 포맷 감지 및 fallback
- **WebM vs MP4**: 브라우저별 최적 포맷 선택

## 9. 향후 계획

- [ ] **비디오 주석**: 타임스탬프 기반 주석 및 코멘트
- [ ] **비디오 챕터**: 챕터 마커 추가
- [ ] **비디오 편집**: Remotion 통합으로 고급 편집
- [ ] **라이브 스트리밍**: 실시간 스트리밍 지원
- [ ] **화면 녹화**: 브라우저 내 화면 녹화 기능
- [ ] **비디오 회의 통합**: Zoom, Google Meet 등 회의 녹화 임포트
- [ ] **비디오 분석**: 조회수, 재생 시간 등 분석
- [ ] **AI 자막**: 자동 자막 생성 및 번역

