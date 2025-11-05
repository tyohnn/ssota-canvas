# 이미지 블록 (Image Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `image`
- **Enum**: `BlockType.IMAGE`
- **데이터베이스**: `block_type_enum.image`

### 설명
이미지를 표시하고 관리할 수 있는 블록입니다. 갤러리 형태로 여러 이미지를 포함할 수 있으며, 이미지 편집 기능과 AI 기반 이미지 처리 툴을 제공합니다.

### 사용 사례
- 이미지 갤러리
- 스크린샷 저장 및 주석
- 디자인 레퍼런스 수집
- AI 이미지 생성 결과 저장
- OCR 텍스트 추출

## 2. UI 정의

### 기본 UI
- 단일 이미지 표시
- 확대/축소 컨트롤
- 다운로드/공유 버튼
- 하단에 작은 캡션 표시

### 기본 크기
```typescript
{
  width: 300,   // 픽셀
  height: 200   // 픽셀 (이미지 비율에 따라 자동 조정)
}
```

### 블록 스페이스/에디터
**있음** - 이미지 에디터 제공
- **자르기**: 자유 자르기, 비율 고정 자르기
- **색조 조절**: 밝기, 대비, 채도, 색온도
- **필터**: 흑백, 세피아, 비네팅, 블러 등
- **회전/뒤집기**: 90도 회전, 좌우/상하 뒤집기
- **리사이즈**: 픽셀 단위 크기 조정

**사용 라이브러리 후보**:
- `react-advanced-cropper`
- `tui-image-editor`
- `fabric.js` (고급 편집)

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "이미지" 선택
2. 파일 업로드 다이얼로그 표시
3. 이미지 파일 선택 또는 드래그앤드롭
4. Supabase Storage에 업로드
5. 이미지 블록 생성

### 붙여넣기 방식
- **이미지 파일 복사**: 클립보드에서 이미지 데이터 감지 → 자동으로 이미지 블록 생성
- **이미지 URL**: URL이 이미지 확장자로 끝나면 이미지 블록 생성
- **스크린샷**: OS 스크린샷 복사 후 붙여넣기 → 이미지 블록 생성

### 드래그앤드롭 방식
- 파일 탐색기에서 이미지 파일 드래그 → 캔버스에 드롭 → 이미지 블록 생성

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface ImageBlockProperties {
  // 이미지 정보
  imageUrl: string;                   // Supabase Storage URL
  
  // 표시 옵션
  objectFit: 'contain' | 'cover' | 'fill';
  
  // 캡션 (항상 하단에 작게 표시)
  caption?: string;                   // 이미지 캡션
  
  // 접근성
  alt?: string;                       // 대체 텍스트 (접근성)
}

// Note: filename, mimeType, size, width, height, uploadedAt 등의 메타데이터는
// Supabase Storage에서 자동으로 fetch하여 블록 컴포넌트 내부에서 관리합니다.
// Properties에는 포함하지 않습니다.
```

### 기본 속성

#### 1. imageUrl
- **타입**: `string`
- **설명**: 이미지 파일 URL (Supabase Storage)
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '이미지 URL',
    inputType: 'url',
    icon: 'Image',
    description: '이미지 파일 URL (업로드 시 자동 설정)',
    order: 1,
    readonly: true,  // 파일 업로드로만 설정
  }
  ```

#### 2. objectFit
- **타입**: `'contain' | 'cover' | 'fill'`
- **설명**: 이미지 맞춤 방식 (CSS object-fit)
- **기본값**: `'contain'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '맞춤 방식',
    inputType: 'select',
    icon: 'Maximize',
    description: '이미지를 컨테이너에 맞추는 방식',
    order: 2,
    options: [
      { value: 'contain', label: '전체 표시' },
      { value: 'cover', label: '채우기' },
      { value: 'fill', label: '늘리기' },
    ],
  }
  ```

#### 3. caption
- **타입**: `string`
- **설명**: 이미지 캡션 (항상 하단에 작게 표시)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '캡션',
    inputType: 'textarea',
    icon: 'MessageSquare',
    description: '이미지 설명 또는 캡션 (하단에 작게 표시됨)',
    placeholder: '캡션을 입력하세요...',
    order: 3,
  }
  ```

#### 4. alt
- **타입**: `string`
- **설명**: 대체 텍스트 (접근성)
- **기본값**: `''`
- **필수**: ❌ No (하지만 권장)
- **UI Schema**:
  ```typescript
  {
    label: '대체 텍스트',
    inputType: 'text',
    icon: 'AudioLines',
    description: '접근성을 위한 대체 텍스트',
    placeholder: '이미지 설명...',
    order: 4,
  }
  ```

### 메타데이터 속성 (이미지 블록 전용)
- `fileType`: 파일 확장자/MIME 타입 (readonly-text, 예: 'image/jpeg', 'image/png')
- `fileSize`: 파일 크기 (readonly-text, 예: '2.3 MB')
- `imageDimensions`: 이미지 원본 크기 (readonly-text, 예: '1920 × 1080')

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
    description: '이미지의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['imageUrl', 'objectFit', 'caption', 'alt'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '생성 및 수정 정보',
    defaultCollapsed: true,
    order: 2,
    properties: ['fileType', 'fileSize', 'imageDimensions', 'createdAt', 'updatedAt', 'createdBy'],
  },
]
```

## 5. 툴바 아이템

### 1. ObjectFitToolbarItem
- **아이콘**: `Maximize`
- **기능**: 맞춤 방식 변경
- **동작**: Popover로 맞춤 옵션 표시
- **업데이트**: `properties.objectFit`

### 2. ImageEditToolbarItem
- **아이콘**: `Edit`
- **기능**: 이미지 에디터 열기 (향후)
- **동작**: 블록 스페이스로 이미지 에디터 표시

## 6. 블록 툴

### 1. 이미지 스톡 검색 (Stock Image Search)
- **입력**: 
  - 검색 쿼리 (string)
  - 이미지 수 (number, 기본값: 5)
- **출력**: 
  - 새로운 이미지 블록 (검색 결과 이미지들)
- **설명**: Unsplash, Pexels 등의 스톡 이미지 서비스에서 이미지 검색
- **API**: Unsplash API, Pexels API

### 2. 이미지 AI 생성 (AI Image Generation)
- **입력**: 
  - 모델 선택 (DALL-E, Midjourney, Stable Diffusion 등)
  - 프롬프트 (string)
  - 스타일 파라미터 (선택)
- **출력**: 
  - 새로운 이미지 블록 (생성된 이미지)
- **설명**: AI를 사용하여 프롬프트 기반 이미지 생성
- **API**: OpenAI DALL-E API, Replicate API

### 3. 이미지 스타일 AI 변경 (AI Style Transfer)
- **입력**: 
  - 현재 이미지 블록
  - 타겟 스타일 (string 또는 스타일 이미지)
- **출력**: 
  - 새로운 이미지 블록 (스타일이 적용된 이미지)
- **설명**: AI를 사용하여 이미지 스타일 변환
- **API**: Replicate (Style Transfer 모델), RunwayML

### 4. 이미지에서 텍스트 추출 (OCR)
- **입력**: 
  - 현재 이미지 블록
  - 언어 설정 (선택)
- **출력**: 
  - 새로운 텍스트 블록 (추출된 텍스트)
  - 또는 새로운 마크다운 블록 (구조화된 텍스트)
- **설명**: OCR을 사용하여 이미지에서 텍스트 추출
- **API**: Google Cloud Vision API, Tesseract.js, Azure Computer Vision

### 5. 이미지 배경 제거 (Background Removal)
- **입력**: 
  - 현재 이미지 블록
- **출력**: 
  - 새로운 이미지 블록 (배경이 제거된 이미지, PNG)
- **설명**: AI를 사용하여 이미지 배경 제거
- **API**: Remove.bg API, Replicate (Background Removal 모델)

### 6. 이미지 업스케일링 (Image Upscaling)
- **입력**: 
  - 현재 이미지 블록
  - 스케일 팩터 (2x, 4x 등)
- **출력**: 
  - 새로운 이미지 블록 (고해상도 이미지)
- **설명**: AI를 사용하여 이미지 해상도 향상
- **API**: Replicate (Real-ESRGAN), waifu2x

## 7. 구현 참조

### Properties Interface
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/image.vo.ts
```
**(향후 구현)**

### UI Schema
```
apps/web/src/domains/block-management/shared/schemas/ui/image-block.ui-schema.ts
```
**(향후 구현)**

### Block Component
```
apps/web/src/domains/block-management/frontend/components/block/image/image-block.tsx
```
**(향후 구현)**

**사용 라이브러리 후보**:
- **이미지 표시**: `react-image-gallery`, `react-slick` (슬라이더)
- **이미지 확대**: `react-medium-image-zoom`, `react-photoswipe-gallery`
- **이미지 편집**: `tui-image-editor`, `fabric.js`
- **자르기**: `react-advanced-cropper`, `react-easy-crop`
- **업로드**: Supabase Storage SDK

### Toolbar Items
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/block-toolbar-mapper.tsx
```
(case 'image' 추가 예정)

## 8. 특이사항 및 주의사항

### 파일 업로드
- **최대 파일 크기**: 10MB (설정 가능)
- **지원 포맷**: JPEG, PNG, GIF, WebP, SVG
- **Supabase Storage**: 프로젝트별 버킷에 저장
- **파일명 충돌 방지**: UUID 기반 파일명 생성
- **썸네일 생성**: 자동으로 썸네일 생성 (리스트 뷰용)

### 성능 최적화
- **Lazy Loading**: 뷰포트에 들어올 때 이미지 로드
- **이미지 압축**: 업로드 전 클라이언트 사이드 압축
- **WebP 변환**: 지원 브라우저에서 WebP로 변환
- **Progressive JPEG**: 점진적 로딩
- **CDN**: Supabase Storage CDN 사용

### 보안
- **MIME 타입 검증**: 실제 파일 타입 확인
- **바이러스 스캔**: 업로드된 파일 스캔 (Supabase Functions)
- **RLS 정책**: 워크스페이스별 파일 접근 제어
- **이미지 리사이징**: 서버 사이드 리사이징으로 원본 보호

### 접근성
- **alt 텍스트**: 모든 이미지에 alt 텍스트 필수
- **키보드 네비게이션**: 화살표 키로 이미지 탐색
- **스크린 리더**: 이미지 정보 읽어주기

## 9. 향후 계획

- [ ] **이미지 갤러리**: 여러 이미지 표시 (슬라이더, 그리드)
- [ ] **이미지 주석**: 화살표, 텍스트, 도형 추가
- [ ] **이미지 비교**: 두 이미지를 슬라이더로 비교
- [ ] **이미지 애니메이션**: GIF 지원, APNG 지원
- [ ] **이미지 필터**: 인스타그램 스타일 필터 프리셋
- [ ] **이미지 합성**: 여러 이미지를 하나로 합치기
- [ ] **이미지 검색**: 이미지 내용 기반 검색
- [ ] **이미지 메타데이터**: EXIF 데이터 표시 및 편집
- [ ] **이미지 버전 관리**: 편집 히스토리 및 되돌리기

