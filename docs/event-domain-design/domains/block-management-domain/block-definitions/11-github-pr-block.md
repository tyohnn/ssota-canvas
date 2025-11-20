# 깃헙 PR 블록 (GitHub PR Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `github_pr`
- **Enum**: `BlockType.GITHUB_PR`
- **데이터베이스**: `block_type_enum.github_pr`

### 설명
GitHub Pull Request를 프리뷰하는 블록입니다. PR 정보, 상태, 리뷰어, 변경사항 요약 등을 표시합니다.

### 사용 사례
- 코드 리뷰 대시보드
- PR 추적 및 관리
- 팀 협업 모니터링
- 프로젝트 진행 상황 확인

## 2. UI 정의

### 기본 UI
- GitHub PR 카드
  - PR 제목 및 번호
  - 상태 (Open, Merged, Closed)
  - 작성자 프로필
  - 리뷰어 목록
  - 변경사항 요약 (+100 -50)
  - 커밋 수
  - 코멘트 수
  - CI 상태

### 기본 크기
```typescript
{
  width: 400,
  height: 200
}
```

### 블록 스페이스/에디터
**없음**

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "GitHub PR" 선택
2. PR URL 입력
3. GitHub API로 PR 정보 fetch
4. 블록 생성

### 붙여넣기 방식
- **GitHub PR URL**: `github.com/.../pull/...` URL 감지 → GitHub PR 블록 생성

## 4. 속성 정의 (Properties)

```typescript
export interface GitHubPRBlockProperties {
  // PR 정보 (사용자 입력 또는 선택)
  url: string;                        // PR URL
  
  // PR 정보 (fetch 후 블록에서 직접 렌더링)
  prTitle?: string;                   // PR 제목
  prBody?: string;                    // PR 설명
  prState?: 'open' | 'closed' | 'merged';  // PR 상태
  prAuthor?: string;                  // PR 작성자
  prAuthorAvatar?: string;            // 작성자 아바타
  
  // 변경사항
  additions?: number;                 // 추가된 줄 수
  deletions?: number;                 // 삭제된 줄 수
  changedFiles?: number;              // 변경된 파일 수
  commits?: number;                   // 커밋 수
  
  // 리뷰
  reviewers?: string[];               // 리뷰어 목록
  comments?: number;                  // 코멘트 수
  
  // CI 상태
  ciStatus?: 'success' | 'failure' | 'pending' | 'none';
  
  // 타임스탬프
  prCreatedAt?: string;               // PR 생성일
  prUpdatedAt?: string;               // PR 수정일
  mergedAt?: string;                  // 머지일
}

// Note: repoOwner, repoName, prNumber는 URL에서 자동 추출됩니다.
// 위 PR 데이터는 GitHub API에서 fetch하여 Properties에 저장하고,
// 블록 UI에서 직접 렌더링합니다. 자동 새로고침은 백그라운드에서 처리됩니다.
```

### 기본 속성

#### 1. url
- **타입**: `string`
- **설명**: GitHub PR URL
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: 'PR URL',
    inputType: 'url',
    icon: 'Github',
    description: 'GitHub Pull Request URL',
    placeholder: 'https://github.com/.../pull/123',
    order: 1,
  }
  ```

#### 2. prTitle
- **타입**: `string`
- **설명**: PR 제목 (블록에서 렌더링)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: 'PR 제목',
    inputType: 'text',
    icon: 'Heading',
    description: 'Pull Request 제목',
    order: 2,
  }
  ```

#### 3. prState
- **타입**: `'open' | 'closed' | 'merged'`
- **설명**: PR 상태 (블록에서 렌더링)
- **기본값**: `'open'`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: 'PR 상태',
    inputType: 'status',
    icon: 'GitPullRequest',
    description: 'Pull Request 상태',
    order: 3,
    options: [
      { value: 'open', label: 'Open', color: 'green' },
      { value: 'closed', label: 'Closed', color: 'red' },
      { value: 'merged', label: 'Merged', color: 'purple' },
    ],
  }
  ```

**Note**: 나머지 속성들 (prBody, prAuthor, additions, deletions 등)도 유사하게 정의되며,
블록 UI에서 직접 렌더링됩니다. 상세 UI Schema는 구현 시 추가합니다.

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
    description: 'PR의 기본 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['url', 'prTitle', 'prBody', 'prState', 'prAuthor'],
  },
  {
    id: 'changes',
    label: '변경사항',
    description: 'PR 변경사항 정보',
    defaultCollapsed: true,
    order: 2,
    properties: ['additions', 'deletions', 'changedFiles', 'commits'],
  },
  {
    id: 'review',
    label: '리뷰',
    description: 'PR 리뷰 정보',
    defaultCollapsed: true,
    order: 3,
    properties: ['reviewers', 'comments', 'ciStatus'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '생성 및 수정 정보',
    defaultCollapsed: true,
    order: 4,
    properties: ['prCreatedAt', 'prUpdatedAt', 'mergedAt', 'createdAt', 'updatedAt', 'createdBy'],
  },
]
```

## 5. 툴바 아이템

### 1. RefreshPRToolbarItem
- **아이콘**: `RefreshCw`
- **기능**: PR 정보 새로고침
- **동작**: GitHub API로 최신 PR 정보 fetch 및 업데이트

### 2. OpenPRToolbarItem
- **아이콘**: `ExternalLink`
- **기능**: GitHub에서 PR 열기
- **동작**: 새 탭에서 GitHub PR URL 열기

## 6. 블록 툴

**현재 없음**

## 7. 설계 고려사항: OAuth 및 계정 연동

### 🤔 설계 과제
GitHub PR 블록은 사용자의 GitHub 계정 OAuth 인증이 필요합니다. 
어떻게 계정을 연동하고 PR을 선택할지에 대한 설계가 필요합니다.

### 💡 설계 옵션

#### 옵션 1: 조직 단위 계정 연동 + URL 입력 방식
**흐름**:
1. 조직 설정에서 GitHub 계정 OAuth 연동
2. GitHub PR 블록 추가 시 URL 직접 입력
3. 연동된 계정의 API 토큰으로 PR 정보 fetch

**장점**:
- 구현이 간단함
- URL만 알면 바로 추가 가능
- 공개 리포지토리 PR도 추가 가능

**단점**:
- URL을 찾아야 함
- Private 리포지토리 권한 체크 필요

#### 옵션 2: 조직 단위 계정 연동 + 리포지토리/PR 선택 방식 (추천)
**흐름**:
1. 조직 설정에서 GitHub 계정 OAuth 연동
2. GitHub PR 블록 추가 시 리포지토리 선택 다이얼로그 표시
3. GitHub API로 리포지토리 목록 fetch → 사용자가 선택
4. 선택한 리포지토리의 PR 목록 표시 → PR 선택
5. PR 정보 fetch → Properties에 저장

**장점**:
- UX가 우수함 (URL 찾을 필요 없음)
- 권한이 있는 리포지토리만 표시
- PR 목록을 필터링/검색 가능

**단점**:
- 구현 복잡도 높음
- 다이얼로그 UI 필요

#### 옵션 3: 하이브리드 방식 (옵션 1 + 옵션 2)
**흐름**:
1. GitHub PR 블록 추가 시 선택지 제공
   - "연동된 계정에서 선택" → 옵션 2 흐름
   - "URL 직접 입력" → 옵션 1 흐름
2. URL 입력 시 자동으로 계정 매칭 시도
3. 계정이 연동되어 있으면 추가 정보 fetch

**장점**:
- 유연성 높음
- 다양한 사용 시나리오 지원
- 공개/비공개 리포지토리 모두 지원

**단점**:
- 가장 복잡함

### 📝 구현 단계 제안

#### Phase 1: URL 입력 방식 (MVP)
- URL 직접 입력으로 시작
- 조직 설정에서 GitHub Personal Access Token 설정
- 공개 리포지토리 PR 정보 fetch

#### Phase 2: OAuth 연동
- GitHub OAuth 플로우 구현
- 조직별 GitHub 계정 연동
- Private 리포지토리 PR도 fetch 가능

#### Phase 3: PR 선택 UI
- 리포지토리 목록 다이얼로그
- PR 목록 (Open/Closed/Merged 필터)
- PR 검색 기능

### 🔐 권한 및 보안

#### 계정 연동 구조
```typescript
// Organization Settings
organizationSettings: {
  integrations: {
    github: {
      accessToken: string;      // GitHub PAT (암호화 저장)
      username: string;         // GitHub 사용자명
      connectedBy: string;      // 연동한 사용자 ID
      connectedAt: string;      // 연동 시간
      scopes: string[];         // OAuth 스코프 (repo, read:org 등)
    }
  }
}
```

#### 데이터 흐름
```
1. 사용자 → GitHub PR 블록 추가
2. 조직 설정 확인 → GitHub 계정 연동 여부 체크
3. 연동됨 → API 토큰으로 리포지토리 목록 fetch
4. 사용자 리포지토리/PR 선택
5. PR 정보 fetch → Properties에 저장
6. 백그라운드 자동 새로고침 (30초마다)
```

### 💬 회의 토픽

다음 사항들에 대해 논의가 필요합니다:

1. **계정 연동 범위**: 조직 단위 vs 워크스페이스 단위 vs 개인 단위?
2. **입력 방식**: URL 직접 입력 vs PR 선택 vs 하이브리드?
3. **자동 새로고침**: 폴링 방식 vs Webhook 방식?
4. **다중 계정**: 하나의 조직에서 여러 GitHub 계정 연동 가능?
5. **권한 관리**: 누가 계정을 연동하고 해제할 수 있는가?
6. **OAuth 스코프**: 어떤 권한이 필요한가? (repo, read:org, write:discussion 등)

## 8. 구현 참조

**향후 구현**

**사용 API**: 
- GitHub REST API v3
- GitHub GraphQL API
- GitHub OAuth

## 9. 특이사항

### GitHub API 연동
- Personal Access Token 필요
- Rate Limit 고려 (인증 시 5000 requests/hour)
- GraphQL로 한 번에 여러 정보 fetch

## 10. 향후 계획

- [ ] OAuth 플로우 구현
- [ ] 리포지토리/PR 선택 다이얼로그
- [ ] PR 내 코드 diff 표시
- [ ] 리뷰 코멘트 표시
- [ ] CI/CD 로그 표시
- [ ] PR 생성/수정 기능
- [ ] Webhook 연동 (실시간 PR 상태)

