# URL 프리뷰 블록 (URL Preview Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `link`
- **Enum**: `BlockType.LINK`
- **데이터베이스**: `block_type_enum.link`

### 설명
웹 URL의 오픈그래프(Open Graph) 메타데이터를 자동으로 가져와 카드 형태로 표시하는 블록입니다. 노션이나 Slack의 링크 프리뷰와 유사한 UI를 제공합니다.

### 사용 사례
- 레퍼런스 링크 수집
- 프로젝트 관련 리소스 정리
- 아티클/블로그 북마크
- 포트폴리오 링크

## 2. UI 정의

### 기본 UI
- 오픈그래프 카드 디자인
  - 썸네일 이미지
  - 제목
  - 설명
  - 도메인/파비콘
- 클릭 시 새 탭에서 링크 열기
- 호버 시 하이라이트 효과

### 기본 크기
```typescript
{
  width: 300,   // 픽셀
  height: 150   // 픽셀 (콘텐츠에 따라 자동 조정)
}
```

### 블록 스페이스/에디터
**없음** - Editor Panel에서 속성 편집만 지원

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "URL 프리뷰" 선택
2. URL 입력
3. 자동으로 오픈그래프 메타데이터 fetch
4. URL 프리뷰 블록 생성

### 붙여넣기 방식
- **일반 URL**: `http://` 또는 `https://`로 시작하는 URL 감지 → 자동으로 URL 프리뷰 블록 생성
- **특정 서비스 제외**: YouTube, Twitter 등은 각각의 전용 블록으로 생성

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface LinkBlockProperties {
  // URL 정보
  url: string;                        // 원본 URL
}

// Note: title, description, imageUrl, siteName, domain, faviconUrl, author, publishedAt, type 등의
// 오픈그래프 메타데이터는 서버에서 자동으로 fetch하여 블록 컴포넌트 내부에서 관리합니다.
// Properties에는 포함하지 않습니다.
// 표시 모드, 스타일 등은 기본 설정으로 제공됩니다.
```

### 기본 속성

#### 1. url
- **타입**: `string`
- **설명**: 원본 URL
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: 'URL',
    inputType: 'url',
    icon: 'Link',
    description: '링크 URL',
    placeholder: 'https://...',
    order: 1,
  }
  ```

### 메타데이터 속성 (URL 프리뷰 블록 전용) - 제안

다음 중 필요한 것을 선택해주세요:

- `ogTitle`: 오픈그래프 제목 (readonly-text)
- `ogDescription`: 오픈그래프 설명 (readonly-text)
- `ogImage`: 오픈그래프 이미지 URL (readonly-text)
- `siteName`: 사이트 이름 (readonly-text, 예: 'GitHub', 'Medium')
- `domain`: 도메인 (readonly-text, 예: 'github.com')
- `favicon`: 파비콘 URL (readonly-text)
- `author`: 작성자 (readonly-text, article만)
- `publishedAt`: 게시일 (readonly-datetime, article만)
- `pageType`: 페이지 타입 (readonly-text, 예: 'article', 'website', 'video')

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
    description: '링크의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['url'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '오픈그래프 정보 및 생성 정보',
    defaultCollapsed: true,
    order: 2,
    properties: ['ogTitle', 'ogDescription', 'ogImage', 'siteName', 'domain', 'favicon', 'author', 'publishedAt', 'pageType', 'createdAt', 'updatedAt', 'createdBy'],
  },
]
```

**Note**: 위 메타데이터 중 불필요한 항목을 알려주시면 제거하겠습니다.

## 5. 툴바 아이템

### 1. OpenLinkToolbarItem
- **아이콘**: `ExternalLink`
- **기능**: 링크 열기
- **동작**: 새 탭에서 URL 열기

### 2. RefreshMetadataToolbarItem
- **아이콘**: `RefreshCw`
- **기능**: 메타데이터 새로고침
- **동작**: 오픈그래프 데이터 다시 fetch

## 6. 블록 툴

### 1. 링크에서 데이터 가져오기 (Scrape Link Data)
- **입력**: 
  - 현재 URL 프리뷰 블록
- **출력**: 
  - 새로운 마크다운 블록 (페이지 내용)
- **설명**: 웹 페이지를 스크래핑하여 주요 내용 추출
- **API**: 
  - Firecrawl (AI 크롤링 서비스, 추천)
  - Jina AI Reader API
  - `cheerio` (서버 사이드)

### 2. 링크 내용 요약 (Summarize Link)
- **입력**: 
  - 현재 URL 프리뷰 블록
  - 요약 길이 파라미터 (선택)
- **출력**: 
  - 새로운 마크다운 블록 (요약)
- **설명**: 웹 페이지 내용을 AI로 요약
- **API**: 
  - Firecrawl (AI 크롤링 서비스, 추천)
  - Jina AI Reader + Summary
  - OpenAI API (GPT-4) 또는 Anthropic API (Claude)

## 7. 구현 참조

### Properties Interface
```
apps/web/src/domains/block-management/shared/value-objects/block-properties/link.vo.ts
```
**(향후 구현)**

### UI Schema
```
apps/web/src/domains/block-management/shared/schemas/ui/link-block.ui-schema.ts
```
**(향후 구현)**

### Block Component
```
apps/web/src/domains/block-management/frontend/components/block/link/link-block.tsx
```
**(향후 구현)**

**사용 라이브러리**:
- **오픈그래프 파싱**: `open-graph-scraper`, `metascraper` (서버 사이드)
- **URL 파싱**: `url-parse`
- **파비콘**: `google-favicon-api` 또는 `favicon.io`

### Toolbar Items
```
apps/web/src/domains/block-management/frontend/components/toolbar-items/block-toolbar-mapper.tsx
```
(case 'link' 추가 예정)

## 8. 특이사항 및 주의사항

### 오픈그래프 Fetch
- **서버 사이드 처리**: CORS 문제 방지를 위해 Next.js API Route 사용
- **캐싱**: 메타데이터 캐싱으로 불필요한 재요청 방지
- **Fallback**: OG 태그가 없으면 일반 meta 태그 사용
- **타임아웃**: 느린 사이트는 5초 타임아웃

### URL 검증
- 유효한 URL 형식인지 검증
- HTTPS 권장, HTTP도 지원
- 로컬 URL (localhost) 개발 환경에서만 허용

### 이미지 프록시
- 외부 이미지는 프록시를 통해 로드 (보안, 캐싱)
- Supabase Storage 또는 Cloudflare Image Resizing 사용

### 성능
- Lazy Loading으로 뷰포트에 들어올 때 메타데이터 fetch
- 이미지 Lazy Loading

### 보안
- XSS 방지: 메타데이터 sanitize
- 악성 사이트 차단: Google Safe Browsing API (선택)

## 9. 향후 계획

- [ ] **QR 코드 생성**: URL을 QR 코드로 변환
- [ ] **링크 상태 확인**: 정기적으로 링크가 살아있는지 확인 (404 체크)
- [ ] **링크 분석**: 페이지 로드 시간, SEO 점수 등 표시
- [ ] **북마크 태그**: 링크에 태그 추가하여 분류
- [ ] **리더 모드**: 광고 없는 읽기 모드로 콘텐츠 표시
- [ ] **PDF 변환**: 웹 페이지를 PDF로 변환하여 저장

