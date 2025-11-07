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
/**
 * Image Source Enum
 * 이미지의 출처를 나타냅니다.
 */
export type ImageSource = 'user-upload' | 'unsplash';

export interface ImageBlockProperties {
  // 이미지 정보
  imageUrl: string;                   // Supabase Storage URL 또는 Unsplash URL
  imageSource: ImageSource;           // 이미지 출처
  
  // 표시 옵션
  objectFit: 'contain' | 'cover' | 'fill';
  
  // 캡션 (항상 하단에 작게 표시)
  caption?: string;                   // 이미지 캡션
  
  // 접근성
  alt?: string;                       // 대체 텍스트 (접근성)
  
  // Unsplash 저작권 정보 (imageSource가 'unsplash'일 때만 사용)
  unsplashAuthorName?: string;        // Unsplash 저자 이름
  unsplashAuthorLink?: string;        // Unsplash 저자 프로필 링크 (UTM 포함)
}

// Note: filename, mimeType, size, width, height, uploadedAt 등의 메타데이터는
// Supabase Storage에서 자동으로 fetch하여 블록 컴포넌트 내부에서 관리합니다.
// Properties에는 포함하지 않습니다.
```

### 기본 속성

#### 0. imageSource
- **타입**: `'user-upload' | 'unsplash'`
- **설명**: 이미지 출처 (사용자 업로드 또는 Unsplash)
- **기본값**: `'user-upload'`
- **필수**: ✅ Yes
- **에디터 표시**: ❌ No (내부 속성, 자동 설정)

#### 1. imageUrl
- **타입**: `string`
- **설명**: 이미지 파일 URL (Supabase Storage 또는 Unsplash)
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '이미지 URL',
    inputType: 'url',
    icon: 'Image',
    description: '이미지 파일 URL (업로드 또는 Unsplash 검색으로 자동 설정)',
    order: 1,
    readonly: true,  // 파일 업로드 또는 Unsplash 검색으로만 설정
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
    order: 3,
    options: [
      { value: 'contain', label: '전체 표시' },
      { value: 'cover', label: '채우기' },
      { value: 'fill', label: '늘리기' },
    ],
  }
  ```

#### 3. caption
- **타입**: `string`
- **설명**: 이미지 캡션 (토글 가능)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '캡션',
    inputType: 'textarea',
    icon: 'MessageSquare',
    description: '이미지 설명 또는 캡션',
    placeholder: '캡션을 입력하세요...',
    order: 4,
  }
  ```

#### 4. isCaptionVisible (✅ 구현 완료)
- **타입**: `boolean`
- **설명**: 캡션 표시 여부
- **기본값**: `false`
- **필수**: ❌ No
- **에디터 표시**: ❌ No (툴바에서 토글)

#### 5. alt
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
    order: 5,
  }
  ```

#### 6. unsplashAuthorName
- **타입**: `string`
- **설명**: Unsplash 이미지 저자 이름
- **기본값**: `undefined`
- **필수**: ❌ No (imageSource가 'unsplash'일 때만 사용)
- **에디터 표시**: ❌ No (내부 속성, 블록 호버 시 표시)

#### 7. unsplashAuthorLink
- **타입**: `string`
- **설명**: Unsplash 저자 프로필 링크 (UTM 파라미터 포함)
- **기본값**: `undefined`
- **필수**: ❌ No (imageSource가 'unsplash'일 때만 사용)
- **에디터 표시**: ❌ No (내부 속성, 블록 호버 시 표시)

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
    // 주의: imageSource, unsplashAuthorName, unsplashAuthorLink는 
    // 내부 속성으로 에디터에 표시하지 않음
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

**내부 전용 속성 (에디터에 표시하지 않음)**:
- `imageSource`: 이미지 출처 (자동 설정)
- `unsplashAuthorName`: Unsplash 저자 이름 (블록 호버 시 표시)
- `unsplashAuthorLink`: Unsplash 저자 링크 (블록 호버 시 표시)

## 5. 툴바 아이템

### 1. ImageChangeToolbarItem
- **아이콘**: `Upload`
- **기능**: 이미지 변경/업로드
- **동작**: 파일 업로드 다이얼로그 표시 또는 Unsplash 검색
- **업데이트**: `properties.imageUrl`

### 2. ObjectFitToolbarItem
- **아이콘**: `Maximize`
- **기능**: 맞춤 방식 변경
- **동작**: Popover로 맞춤 옵션 표시
- **업데이트**: `properties.objectFit`

### 3. CaptionVisibilityToolbarItem (✅ 구현 완료)
- **아이콘**: `MessageSquare`
- **기능**: 캡션 표시/숨김 토글
- **동작**: 클릭 시 캡션 영역 표시/숨김
- **업데이트**: `properties.isCaptionVisible`

### 4. ExpandImageToolbarItem (✅ 구현 완료)
- **아이콘**: `Expand`
- **기능**: 이미지 확대 보기
- **동작**: 클릭 시 다이얼로그로 원본 크기 이미지 표시
- **업데이트**: 없음 (일회성 액션)

### 5. ImageEditToolbarItem (향후)
- **아이콘**: `Edit`
- **기능**: 이미지 에디터 열기
- **동작**: 블록 스페이스로 이미지 에디터 표시

## 5.5. 블록 액션 바 (Block Action Bar)

### 개요
**BlockActionBar**는 이미지 블록 우측에 표시되는 액션 툴바입니다. NodeToolbar를 사용하며, BlockMountToolbar와 유사한 디자인과 구조를 가집니다.

### 설계 원칙
- **위치**: 블록 우측 (Position.Right)
- **디자인**: BlockMountToolbar와 동일한 스타일 (backdrop-blur, rounded-lg, shadow-lg)
- **표시 조건**: 블록이 선택되었을 때만 표시
- **구조**: 블록 타입별로 다른 액션 아이템을 렌더링하는 매퍼 패턴 사용

### 컴포넌트 구조
```typescript
// BlockActionBar.tsx
export interface BlockActionBarProps {
  blockId: string;
  blockType: string;
  blockData: BlockNodeData;
  pageId: string;
  orgId: string;
  workspaceId: string;
}

export function BlockActionBar({
  blockId,
  blockType,
  blockData,
  pageId,
  orgId,
  workspaceId,
}: BlockActionBarProps) {
  return (
    <NodeToolbar
      isVisible={true}
      position={Position.Right}
      className="nodrag nowheel"
    >
      <div className="bg-background/90 backdrop-blur-md border border-border rounded-lg shadow-lg px-2 py-1 flex flex-col items-center gap-1">
        <TooltipProvider>
          {/* 블록 타입별 액션 아이템 매퍼 */}
          <BlockActionMapper
            blockId={blockId}
            blockType={blockType}
            blockData={blockData}
            pageId={pageId}
            orgId={orgId}
            workspaceId={workspaceId}
          />
        </TooltipProvider>
      </div>
    </NodeToolbar>
  );
}
```

### 액션 매퍼 구조
```typescript
// BlockActionMapper.tsx
export function BlockActionMapper({ blockType, ...props }: BlockActionMapperProps) {
  switch (blockType) {
    case 'image':
      return (
        <>
          <UnsplashSearchAction {...props} />
          {/* 향후 추가 액션들 */}
        </>
      );
    
    case 'text':
      return (
        <>
          {/* 텍스트 블록 액션들 */}
        </>
      );
    
    // ... 다른 블록 타입들
    
    default:
      return null;
  }
}
```

### 이미지 블록 액션 아이템

#### 1. UnsplashSearchAction
- **아이콘**: `Search` (Lucide)
- **기능**: Unsplash에서 이미지 검색 및 변경
- **동작**:
  1. 버튼 클릭 → 다이얼로그 표시
  2. 초기 로드: 랜덤 이미지 10개 표시
  3. 검색창에서 키워드 검색 가능
  4. 이미지 클릭 → `updateProperty`로 이미지 URL 변경
  5. 다이얼로그 닫기

**다이얼로그 UI 구조**:
```typescript
<Dialog>
  <DialogContent className="max-w-4xl max-h-[80vh]">
    {/* 헤더 */}
    <DialogHeader>
      <DialogTitle>Unsplash 이미지 검색</DialogTitle>
      <DialogDescription>
        고품질 무료 이미지를 검색하고 선택하세요
      </DialogDescription>
    </DialogHeader>
    
    {/* 검색창 */}
    <div className="flex gap-2">
      <Input
        placeholder="검색어를 입력하세요..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      <Button onClick={handleSearch}>
        <Search className="h-4 w-4" />
      </Button>
    </div>
    
    {/* 이미지 그리드 */}
    <ScrollArea className="h-[500px]">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-blue-500 transition-all"
              onClick={() => handleSelectImage(image)}
            >
              <img
                src={image.urls.small}
                alt={image.alt_description || 'Unsplash image'}
                className="w-full aspect-video object-cover"
              />
              
              {/* 저자 정보 오버레이 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white">
                  Photo by{' '}
                  <a
                    href={`${image.user.links.html}?utm_source=ssota&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {image.user.name}
                  </a>
                  {' '}on{' '}
                  <a
                    href="https://unsplash.com?utm_source=ssota&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Unsplash
                  </a>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  </DialogContent>
</Dialog>
```

**API 통합**:
```typescript
// Unsplash API 호출
const fetchUnsplashImages = async (query?: string) => {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY!,
    per_page: '10',
    ...(query && { query }),
  });
  
  const endpoint = query
    ? `https://api.unsplash.com/search/photos?${params}`
    : `https://api.unsplash.com/photos/random?${params}&count=10`;
  
  const response = await fetch(endpoint);
  const data = await response.json();
  
  return query ? data.results : data;
};

// 이미지 선택 핸들러
const handleSelectImage = async (image: UnsplashImage) => {
  // 1. Unsplash 다운로드 엔드포인트 트리거 (필수 - API 가이드라인)
  await fetch(
    `https://api.unsplash.com/photos/${image.id}/download?client_id=${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`
  );
  
  // 2. 블록 속성 일괄 업데이트 (imageUrl, imageSource, unsplash 정보, alt)
  const updates = {
    'properties.imageUrl': image.urls.regular, // 또는 image.urls.full
    'properties.imageSource': 'unsplash' as const,
    'properties.unsplashAuthorName': image.user.name,
    'properties.unsplashAuthorLink': `${image.user.links.html}?utm_source=ssota&utm_medium=referral`,
  };
  
  // 각 속성을 개별적으로 업데이트
  for (const [key, value] of Object.entries(updates)) {
    await updateProperty(blockId, key, value, blockData);
  }
  
  // 3. alt 텍스트도 함께 업데이트 (선택적)
  if (image.alt_description) {
    await updateProperty(
      blockId,
      'properties.alt',
      image.alt_description,
      blockData
    );
  }
  
  // 4. 다이얼로그 닫기
  setIsDialogOpen(false);
};
```

**환경 변수**:
```env
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

**Unsplash API 가이드라인 준수**:
- ✅ 이미지 선택 시 다운로드 엔드포인트 트리거 (필수)
- ✅ 저자 이름과 Unsplash 링크 표시 (필수)
- ✅ UTM 파라미터 포함 (`utm_source=ssota&utm_medium=referral`)
- ✅ 저작권 정보 표시

## 6. 블록 툴

### 1. 이미지 스톡 검색 (Stock Image Search) - ✅ 구현됨
- **구현 위치**: BlockActionBar → UnsplashSearchAction
- **입력**: 
  - 검색 쿼리 (string, 선택적)
  - 이미지 수 (number, 기본값: 10)
- **출력**: 
  - 현재 이미지 블록의 imageUrl 업데이트
- **설명**: 
  - Unsplash API를 통해 무료 고품질 이미지 검색
  - 초기 로드 시 랜덤 이미지 10개 표시
  - 검색창을 통해 키워드 검색 가능
  - 이미지 클릭 시 현재 블록의 이미지 변경
- **API**: Unsplash API
  - Random Photos: `GET /photos/random`
  - Search Photos: `GET /search/photos`
  - Download Tracking: `GET /photos/{id}/download`
- **참조**: 섹션 5.5의 UnsplashSearchAction 참조

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
**✅ 구현 완료** - Unsplash 저자 정보 표시, 캡션 편집, 이미지 업로드 지원

**사용 라이브러리**:
- **이미지 업로드**: `@workspace/ui/hooks/use-file-upload` (커스텀 훅)
- **스토리지**: Supabase Storage (`@/domains/storage/hooks/use-supabase-storage`)
- **UI 컴포넌트**: `@workspace/ui` (Dialog, Skeleton, ScrollArea 등)

**Unsplash 저자 정보 표시 구현**:
```typescript
// ImageBlock 컴포넌트 내부
const { imageUrl, imageSource, unsplashAuthorName, unsplashAuthorLink, objectFit, caption, alt } = properties;

// ... 이미지 렌더링 부분
<div className="relative flex-1 overflow-hidden bg-muted/30">
  {imageUrl && !hasError && (
    <>
      {/* 이미지 */}
      <img
        src={imageUrl}
        alt={alt || '이미지'}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={cn(
          'w-full h-full',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'fill' && 'object-fill',
          isLoading && 'opacity-0',
          'transition-opacity duration-300'
        )}
      />
      
      {/* Unsplash 저자 정보 오버레이 (호버 시 표시) */}
      {imageSource === 'unsplash' && unsplashAuthorName && unsplashAuthorLink && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
          <p className="text-xs text-white">
            Photo by{' '}
            <a
              href={unsplashAuthorLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {unsplashAuthorName}
            </a>
            {' '}on{' '}
            <a
              href="https://unsplash.com?utm_source=ssota&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Unsplash
            </a>
          </p>
        </div>
      )}
    </>
  )}
</div>
```

**구현 세부사항**:
1. `imageSource === 'unsplash'`일 때만 저자 정보 오버레이 표시
2. 이미지 하단에 검은 그라데이션 배경 (`from-black/70`)
3. 기본적으로 투명 (`opacity-0`), 호버 시 나타남 (`hover:opacity-100`)
4. 저자 이름과 Unsplash 링크는 클릭 가능하며 새 탭에서 열림
5. UTM 파라미터 포함된 링크 사용
6. 캡션 영역과는 별도로 이미지 영역 내부에 표시

**사용 라이브러리 후보 (향후)**:
- **이미지 표시**: `react-image-gallery`, `react-slick` (슬라이더)
- **이미지 확대**: `react-medium-image-zoom`, `react-photoswipe-gallery`
- **이미지 편집**: `tui-image-editor`, `fabric.js`
- **자르기**: `react-advanced-cropper`, `react-easy-crop`

### Toolbar Items
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/block-toolbar-mapper.tsx
```
**✅ 구현 완료** - case 'image'에 4개 toolbar items 추가됨

#### CaptionVisibilityToolbarItem
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/image-block/caption-visibility-toolbar-item.tsx
```
**✅ 구현 완료** - 캡션 표시/숨김 토글 버튼

#### ExpandImageToolbarItem
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/image-block/expand-image-toolbar-item.tsx
```
**✅ 구현 완료** - 이미지 확대 다이얼로그 버튼

### Block Action Bar (신규)
```
apps/web/src/domains/block-management/frontend/components/block-action-bar.tsx
```
**(구현 예정)** - 블록 하단 액션 툴바 (NodeToolbar 사용)

### Block Action Mapper (신규)
```
apps/web/src/domains/block-management/frontend/components/action-items/block-action-mapper.tsx
```
**(구현 예정)** - 블록 타입별 액션 아이템 매퍼

### Action Items (신규)

#### Unsplash Search Action
```
apps/web/src/domains/block-management/frontend/components/action-items/image/unsplash-search-action.tsx
```
**(구현 예정)** - Unsplash 이미지 검색 및 변경 액션

**구현 내용**:
- Unsplash API 통합
- 이미지 검색 다이얼로그
- 랜덤 이미지 10개 표시
- 검색 기능
- 이미지 선택 시 updateProperty 호출
- 저자 정보 및 Unsplash 링크 표시

**필요 환경 변수**:
```env
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

**Unsplash API 타입 정의**:
```
apps/web/src/domains/block-management/shared/types/unsplash.types.ts
```
**(구현 예정)**
```typescript
export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}
```

### Image Block Properties Value Object 업데이트 필요
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/image.vo.ts
```
**(업데이트 필요)**

**기존 구조**:
```typescript
export interface ImageBlockProperties {
  imageUrl: string;
  objectFit: ObjectFit;
  caption?: string;
  alt?: string;
}
```

**업데이트된 구조**:
```typescript
export type ImageSource = 'user-upload' | 'unsplash';

export interface ImageBlockProperties {
  imageUrl: string;
  imageSource: ImageSource;
  objectFit: ObjectFit;
  caption?: string;
  alt?: string;
  // Unsplash 저작권 정보
  unsplashAuthorName?: string;
  unsplashAuthorLink?: string;
}
```

**ImageBlockPropertiesVO 클래스 업데이트**:
```typescript
export class ImageBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    private readonly imageUrl: string,
    private readonly imageSource: ImageSource,
    private readonly objectFit: ObjectFit,
    private readonly caption: string | undefined,
    private readonly alt: string | undefined,
    private readonly unsplashAuthorName: string | undefined,
    private readonly unsplashAuthorLink: string | undefined
  ) {
    super();
  }

  static createDefault(): ImageBlockPropertiesVO {
    return new ImageBlockPropertiesVO(
      '',              // imageUrl
      'user-upload',   // imageSource
      'contain',       // objectFit
      '',              // caption
      '',              // alt
      undefined,       // unsplashAuthorName
      undefined        // unsplashAuthorLink
    );
  }

  static fromJSON(data: unknown): ImageBlockPropertiesVO {
    const safeData = (data as Partial<ImageBlockProperties>) ?? {};
    return new ImageBlockPropertiesVO(
      safeData.imageUrl ?? '',
      safeData.imageSource ?? 'user-upload',
      safeData.objectFit ?? 'contain',
      safeData.caption ?? '',
      safeData.alt ?? '',
      safeData.unsplashAuthorName,
      safeData.unsplashAuthorLink
    );
  }

  toJSON(): ImageBlockProperties {
    return {
      imageUrl: this.imageUrl,
      imageSource: this.imageSource,
      objectFit: this.objectFit,
      caption: this.caption,
      alt: this.alt,
      unsplashAuthorName: this.unsplashAuthorName,
      unsplashAuthorLink: this.unsplashAuthorLink,
    };
  }

  // Getter 메서드들 추가
  getImageSource(): ImageSource {
    return this.imageSource;
  }

  getUnsplashAuthorName(): string | undefined {
    return this.unsplashAuthorName;
  }

  getUnsplashAuthorLink(): string | undefined {
    return this.unsplashAuthorLink;
  }
}
```

### Common Types 업데이트
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/common-types.ts
```
**(업데이트 필요)**

**추가할 타입**:
```typescript
/**
 * Image Source Type
 * 이미지의 출처를 나타냅니다.
 */
export type ImageSource = 'user-upload' | 'unsplash';
```

## 8. 특이사항 및 주의사항

### 파일 업로드
- **최대 파일 크기**: 10MB (설정 가능)
- **지원 포맷**: JPEG, PNG, GIF, WebP, SVG
- **Supabase Storage**: 프로젝트별 버킷에 저장
- **파일명 충돌 방지**: UUID 기반 파일명 생성
- **썸네일 생성**: 자동으로 썸네일 생성 (리스트 뷰용)

### Unsplash API 사용 지침
- **API 키 필수**: `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` 환경 변수 설정 필요
- **Rate Limit**: 
  - Demo 키: 50 requests/hour
  - Production 키: 5,000 requests/hour (신청 필요)
- **필수 준수 사항**:
  1. **다운로드 트리거**: 이미지 선택 시 `/photos/{id}/download` 엔드포인트 호출 (통계 수집용)
  2. **저작권 표시**: 저자 이름과 Unsplash 링크 필수 표시
  3. **UTM 파라미터**: 모든 링크에 `utm_source=ssota&utm_medium=referral` 포함
  4. **API 응답 캐싱**: 동일한 검색어는 캐싱하여 API 호출 최소화
- **참고 문서**: [Unsplash API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)

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

## 9. 타입 시스템 구조 요약

### 데이터 흐름
```
DB (blocks 테이블)
  ↓ properties (JSONB)
DTO (BlockDTO)
  ↓ transformation
Value Object (ImageBlockPropertiesVO)
  ↓ toJSON()
React Flow Node Data (ImageBlockNodeData)
  ↓ properties
React Component (ImageBlock)
```

### 타입 레이어
1. **Interface Layer**: `ImageBlockProperties` - 순수 타입 정의
2. **Value Object Layer**: `ImageBlockPropertiesVO` - 비즈니스 로직 + 유효성 검증
3. **Node Data Layer**: `ImageBlockNodeData` - React Flow 노드 데이터
4. **Component Layer**: `ImageBlock` - React 컴포넌트

### 업데이트 필요 파일 체크리스트
- [x] `common-types.ts` - ImageSource 타입 추가 ✅
- [x] `image.vo.ts` - ImageBlockProperties 및 VO 클래스 업데이트 (isCaptionVisible 추가) ✅
- [x] `image-block.tsx` - Unsplash 저자 정보 오버레이 추가 ✅
- [x] `caption-visibility-toolbar-item.tsx` - 캡션 토글 toolbar item 생성 ✅
- [x] `expand-image-toolbar-item.tsx` - 이미지 확대 toolbar item 생성 ✅
- [x] `block-toolbar-mapper.tsx` - image case에 새 toolbar items 추가 ✅
- [x] `block-action-bar.tsx` - 액션 툴바 컴포넌트 생성 (신규) ✅
- [x] `block-action-mapper.tsx` - 액션 매퍼 생성 (신규) ✅
- [x] `unsplash-search-action.tsx` - Unsplash 검색 액션 생성 (신규) ✅
- [ ] `unsplash.types.ts` - Unsplash API 타입 정의 추가 (신규) - 구현 대기

## 10. 향후 계획

### BlockActionBar 관련
- [ ] **BlockActionBar 구현**: 블록 우측 액션 툴바 컴포넌트
- [ ] **BlockActionMapper 구현**: 블록 타입별 액션 매퍼
- [x] **UnsplashSearchAction 설계 완료**: Unsplash 이미지 검색 액션 (구현 대기)
- [ ] **Pexels API 통합**: 추가 스톡 이미지 서비스
- [ ] **AI 이미지 생성 액션**: DALL-E, Stable Diffusion 통합
- [ ] **이미지 편집 액션**: 자르기, 필터, 리사이즈 등

### 이미지 블록 기능 확장
- [ ] **이미지 갤러리**: 여러 이미지 표시 (슬라이더, 그리드)
- [ ] **이미지 주석**: 화살표, 텍스트, 도형 추가
- [ ] **이미지 비교**: 두 이미지를 슬라이더로 비교
- [ ] **이미지 애니메이션**: GIF 지원, APNG 지원
- [ ] **이미지 필터**: 인스타그램 스타일 필터 프리셋
- [ ] **이미지 합성**: 여러 이미지를 하나로 합치기
- [ ] **이미지 검색**: 이미지 내용 기반 검색
- [ ] **이미지 메타데이터**: EXIF 데이터 표시 및 편집
- [ ] **이미지 버전 관리**: 편집 히스토리 및 되돌리기

---

## 문서 변경 이력

### 2025-11-06: Toolbar Items로 UI 컨트롤 이동
- **변경 사항**:
  - `ImageBlockProperties`에 `isCaptionVisible` 속성 추가
  - 이미지 블록 내부 호버 버튼 제거 (캡션 토글, 이미지 확대)
  - `CaptionVisibilityToolbarItem` 생성 - 캡션 표시/숨김 토글
  - `ExpandImageToolbarItem` 생성 - 이미지 확대 다이얼로그
  - `block-toolbar-mapper.tsx`의 image case에 새 toolbar items 추가
  - 캡션 표시 여부를 블록 properties로 관리하여 상태 일관성 확보
- **목적**: UI 컨트롤을 toolbar로 통합하여 일관된 UX 제공

### 2025-11-05: Unsplash 저작권 정보 추가
- **변경 사항**:
  - `ImageBlockProperties`에 `imageSource`, `unsplashAuthorName`, `unsplashAuthorLink` 속성 추가
  - BlockActionBar 설계 추가 (Position.Right)
  - UnsplashSearchAction 상세 설계
  - 이미지 블록에 Unsplash 저자 정보 호버 오버레이 추가
  - ImageSource 타입 추가 (`'user-upload' | 'unsplash'`)
- **목적**: Unsplash API 가이드라인 준수 및 저작권 정보 표시

