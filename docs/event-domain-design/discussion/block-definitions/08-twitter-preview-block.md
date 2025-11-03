# 트위터 프리뷰 블록 (Twitter Preview Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `twitter` (또는 기존 타입 확장)
- **Enum**: 추가 필요 또는 `link` 타입의 하위 타입
- **데이터베이스**: `block_type_enum` 확장 필요

### 설명
트위터(X) 트윗을 임베드하여 표시하는 블록입니다. Twitter의 공식 임베드 API를 사용하여 트윗 내용, 미디어, 인게이지먼트 정보를 표시합니다.

### 사용 사례
- 트윗 북마크 및 수집
- 소셜 미디어 리서치
- 프로젝트 관련 트윗 정리
- 고객 피드백 수집

## 2. UI 정의

### 기본 UI
- 트위터 iframe 임베드 (공식 임베드 사용)
  - 트위터가 제공하는 기본 카드 UI
  - 프로필 이미지 및 사용자명
  - 트윗 내용
  - 이미지/비디오 미디어
  - 인게이지먼트 (좋아요, 리트윗, 댓글 수)
  - 게시 시간
- 클릭 시 트위터에서 열기

### 기본 크기
```typescript
{
  width: 350,   // 픽셀
  height: 200   // 픽셀 (콘텐츠에 따라 자동 조정)
}
```

### 블록 스페이스/에디터
**없음** - Editor Panel에서 속성 편집만 지원

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "트위터" 선택
2. 트윗 URL 입력
3. Twitter API로 트윗 데이터 fetch
4. 트위터 블록 생성

### 붙여넣기 방식
- **트위터 URL**: `twitter.com` 또는 `x.com` URL 감지 → 자동으로 트위터 블록 생성

## 4. 속성 정의 (Properties)

### Properties Interface

```typescript
export interface TwitterBlockProperties {
  // 트윗 정보
  url: string;                        // 원본 URL
  
  // 트위터 콘텐츠 (iframe에서 기본으로 불러옴, 수정 가능)
  twitterContent?: string;            // 트윗 내용 (수정 가능)
  
  // 표시 옵션
  theme: 'light' | 'dark' | 'auto';  // 테마
}

// Note: tweetId는 URL에서 자동 추출됩니다.
// iframe을 통해 기본 임베드를 제공하며, API를 통해 전체 데이터 크롤링이 가능합니다.
```

### 기본 속성

#### 1. url
- **타입**: `string`
- **설명**: 트위터 URL
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '트위터 URL',
    inputType: 'url',
    icon: 'Twitter',
    description: '트윗 URL',
    placeholder: 'https://twitter.com/.../status/...',
    order: 1,
  }
  ```

#### 2. theme
- **타입**: `'light' | 'dark' | 'auto'`
- **설명**: 트위터 카드 테마
- **기본값**: `'auto'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '테마',
    inputType: 'select',
    icon: 'Palette',
    description: '트위터 카드 테마',
    order: 2,
    options: [
      { value: 'light', label: '라이트' },
      { value: 'dark', label: '다크' },
      { value: 'auto', label: '자동' },
    ],
  }
  ```

#### 2. twitterContent
- **타입**: `string`
- **설명**: 트윗 내용 (iframe에서 기본으로 불러옴, 수정 가능)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '트윗 내용',
    inputType: 'textarea',
    icon: 'MessageSquare',
    description: '트윗 내용 (iframe에서 불러옴, 수정 가능)',
    placeholder: '트윗 내용...',
    order: 2,
  }
  ```

#### 3. theme
- **타입**: `'light' | 'dark' | 'auto'`
- **설명**: 트위터 카드 테마
- **기본값**: `'auto'`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: '테마',
    inputType: 'select',
    icon: 'Palette',
    description: '트위터 카드 테마',
    order: 3,
    options: [
      { value: 'light', label: '라이트' },
      { value: 'dark', label: '다크' },
      { value: 'auto', label: '자동' },
    ],
  }
  ```

### 메타데이터 속성 (Twitter 블록 전용)
- `authorName`: 작성자 이름 (readonly-text)
- `authorUsername`: @username (readonly-text)
- `followerCount`: 팔로워 수 (readonly-text, 예: '1.2M followers')
- `likeCount`: 좋아요 수 (readonly-text, 예: '1,234 likes')
- `retweetCount`: 리트윗 수 (readonly-text, 예: '567 retweets')
- `replyCount`: 댓글 수 (readonly-text, 예: '89 replies')
- `viewCount`: 조회수 (readonly-text, 예: '50K views')
- `tweetCreatedAt`: 트윗 게시일 (readonly-datetime)

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
    description: '트윗의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['url', 'twitterContent', 'theme'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '트위터 통계 및 생성 정보',
    defaultCollapsed: true,
    order: 2,
    properties: ['authorName', 'authorUsername', 'followerCount', 'likeCount', 'retweetCount', 'replyCount', 'viewCount', 'tweetCreatedAt', 'createdAt', 'updatedAt', 'createdBy'],
  },
]
```

## 5. 툴바 아이템

### 1. RefreshTwitterInfoToolbarItem
- **아이콘**: `RefreshCw`
- **기능**: Twitter 정보 업데이트
- **동작**: Twitter API로 최신 정보 fetch 및 업데이트

### 2. OpenTwitterToolbarItem
- **아이콘**: `ExternalLink`
- **기능**: 트위터에서 열기
- **동작**: 새 탭에서 트위터 URL 열기

## 6. 블록 툴

### 1. Twitter 데이터 불러오기 (Fetch Twitter Data)
- **입력**: 
  - 현재 트위터 블록
- **출력**: 
  - 업데이트된 트위터 블록 (API로 전체 데이터 크롤링)
- **설명**: Twitter API를 통해 전체 트윗 데이터 가져오기 (통계, 미디어, 댓글 등)
- **API**: Twitter API v2

### 2. 트윗 내용 요약 (Summarize Tweet)
- **입력**: 
  - 현재 트위터 블록
  - 요약 길이 파라미터 (선택)
- **출력**: 
  - 새로운 마크다운 블록 (요약)
- **설명**: 트윗 내용 및 스레드를 AI로 요약
- **API**: OpenAI API (GPT-4) 또는 Anthropic API (Claude)

## 7. 구현 참조

**향후 구현**

**사용 방법**:
- Twitter 공식 iframe 임베드 (기본)
- Twitter API v2 (데이터 크롤링용)

## 8. 특이사항

### Twitter API
- API 키 필요 (환경 변수)
- Rate Limit 고려
- `react-tweet`는 server-side rendering 지원

### 임베드 옵션
- Twitter의 공식 oembed API 사용
- 또는 `react-tweet`으로 커스텀 렌더링

## 9. 향후 계획

- [ ] 트위터 스레드 지원
- [ ] 트위터 리스트 임베드
- [ ] 트위터 검색 결과 임베드

