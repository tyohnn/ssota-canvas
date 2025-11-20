# Vercel 배포 상태 블록 (Vercel Deployment Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `vercel_deployment` (신규)
- **Enum**: 추가 필요
- **데이터베이스**: `block_type_enum` 확장 필요

### 설명
Vercel 프로젝트의 배포 상태를 실시간으로 표시하는 블록입니다. 최근 배포 이력, 빌드 상태, 미리보기 URL 등을 확인할 수 있습니다.

### 사용 사례
- 프로젝트 배포 모니터링
- 배포 이력 추적
- CI/CD 대시보드
- 팀 협업 시 배포 상태 공유

## 2. UI 정의

### 기본 UI
- Vercel 배포 카드
  - 프로젝트 이름
  - 최근 배포 상태 (Ready, Building, Error)
  - 배포 시간
  - 브랜치 정보
  - 미리보기 URL
  - 배포자 정보
- 상태에 따른 색상 인디케이터

### 기본 크기
```typescript
{
  width: 350,
  height: 180
}
```

### 블록 스페이스/에디터
**없음**

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "Vercel 배포" 선택
2. Vercel 프로젝트 ID 또는 URL 입력
3. Vercel API로 배포 정보 fetch
4. 블록 생성

### 붙여넣기 방식
- **Vercel URL**: `vercel.app` 도메인 감지 → Vercel 배포 블록 생성

## 4. 속성 정의 (Properties)

```typescript
export interface VercelDeploymentBlockProperties {
  // Vercel 정보 (사용자 입력 또는 선택)
  url: string;                        // Vercel 배포 또는 프로젝트 URL
  
  // 배포 정보 (fetch 후 블록에서 직접 렌더링)
  projectName?: string;               // 프로젝트 이름
  deploymentStatus?: 'READY' | 'BUILDING' | 'ERROR' | 'CANCELED' | 'QUEUED';
  branch?: string;                    // 브랜치
  commitMessage?: string;             // 커밋 메시지
  deploymentUrl?: string;             // 배포 URL
  deployedBy?: string;                // 배포자
  deployedAt?: string;                // 배포 시간
}

// Note: 위 배포 정보는 Vercel API에서 fetch하여 Properties에 저장하고,
// 블록 UI에서 직접 렌더링합니다. 자동 새로고침은 백그라운드에서 처리됩니다.
```

### 기본 속성

#### 1. url
- **타입**: `string`
- **설명**: Vercel 배포 또는 프로젝트 URL
- **기본값**: `''`
- **필수**: ✅ Yes
- **UI Schema**:
  ```typescript
  {
    label: 'Vercel URL',
    inputType: 'url',
    icon: 'ExternalLink',
    description: 'Vercel 프로젝트 또는 배포 URL',
    placeholder: 'https://vercel.com/...',
    order: 1,
  }
  ```

#### 2. projectName
- **타입**: `string`
- **설명**: 프로젝트 이름 (블록에서 렌더링)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '프로젝트 이름',
    inputType: 'text',
    icon: 'Folder',
    description: 'Vercel 프로젝트 이름',
    order: 2,
  }
  ```

#### 3. deploymentStatus
- **타입**: `'READY' | 'BUILDING' | 'ERROR' | 'CANCELED' | 'QUEUED'`
- **설명**: 배포 상태 (블록에서 렌더링)
- **기본값**: `'QUEUED'`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '배포 상태',
    inputType: 'status',
    icon: 'Activity',
    description: '현재 배포 상태',
    order: 3,
    options: [
      { value: 'READY', label: '완료', color: 'green' },
      { value: 'BUILDING', label: '빌드 중', color: 'blue' },
      { value: 'ERROR', label: '에러', color: 'red' },
      { value: 'CANCELED', label: '취소됨', color: 'gray' },
      { value: 'QUEUED', label: '대기 중', color: 'yellow' },
    ],
  }
  ```

#### 4. branch
- **타입**: `string`
- **설명**: 브랜치 (블록에서 렌더링)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '브랜치',
    inputType: 'text',
    icon: 'GitBranch',
    description: '배포 브랜치',
    order: 4,
  }
  ```

#### 5. commitMessage
- **타입**: `string`
- **설명**: 커밋 메시지 (블록에서 렌더링)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '커밋 메시지',
    inputType: 'text',
    icon: 'GitCommit',
    description: '배포 커밋 메시지',
    order: 5,
  }
  ```

#### 6. deploymentUrl
- **타입**: `string`
- **설명**: 실제 배포 URL (블록에서 렌더링)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '배포 URL',
    inputType: 'url',
    icon: 'Link',
    description: '실제 배포된 URL',
    placeholder: 'https://...',
    order: 6,
  }
  ```

#### 7. deployedBy
- **타입**: `string`
- **설명**: 배포자 (블록에서 렌더링)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '배포자',
    inputType: 'text',
    icon: 'User',
    description: '배포한 사용자',
    order: 7,
  }
  ```

#### 8. deployedAt
- **타입**: `string`
- **설명**: 배포 시간 (블록에서 렌더링)
- **기본값**: `''`
- **필수**: ❌ No
- **UI Schema**:
  ```typescript
  {
    label: '배포 시간',
    inputType: 'text',
    icon: 'Clock',
    description: '배포된 시간',
    order: 8,
  }
  ```

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
    description: 'Vercel 배포 정보',
    defaultCollapsed: false,
    order: 1,
    properties: ['url', 'projectName', 'deploymentStatus', 'branch', 'commitMessage', 'deploymentUrl', 'deployedBy', 'deployedAt'],
  },
  {
    id: 'metadata',
    label: '메타데이터',
    description: '생성 및 수정 정보',
    defaultCollapsed: true,
    order: 2,
    properties: ['createdAt', 'updatedAt', 'createdBy'],
  },
]
```

## 5. 툴바 아이템

### 1. RefreshDeploymentToolbarItem
- **아이콘**: `RefreshCw`
- **기능**: 배포 정보 새로고침
- **동작**: Vercel API로 최신 배포 정보 fetch 및 업데이트

### 2. OpenDeploymentToolbarItem
- **아이콘**: `ExternalLink`
- **기능**: 배포 URL 열기
- **동작**: 새 탭에서 배포 URL 열기

## 6. 블록 툴

**현재 없음**

## 7. 설계 고려사항: OAuth 및 계정 연동

### 🤔 설계 과제
Vercel 블록은 사용자의 Vercel 계정 OAuth 인증이 필요합니다. 
어떻게 계정을 연동하고 프로젝트/배포를 선택할지에 대한 설계가 필요합니다.

### 💡 설계 옵션

#### 옵션 1: 조직 단위 계정 연동 + URL 입력 방식
**흐름**:
1. 조직 설정에서 Vercel 계정 OAuth 연동
2. Vercel 블록 추가 시 URL 직접 입력
3. 연동된 계정의 API 토큰으로 배포 정보 fetch

**장점**:
- 구현이 간단함
- URL만 알면 바로 추가 가능
- 여러 조직의 배포도 추가 가능 (URL만 있으면)

**단점**:
- URL을 찾아야 함
- 다른 조직의 배포는 권한 문제 발생 가능

#### 옵션 2: 조직 단위 계정 연동 + 프로젝트 선택 방식 (추천)
**흐름**:
1. 조직 설정에서 Vercel 계정 OAuth 연동
2. Vercel 블록 추가 시 프로젝트 선택 다이얼로그 표시
3. Vercel API로 프로젝트 목록 fetch → 사용자가 선택
4. 선택한 프로젝트의 최근 배포 자동 표시
5. (선택 사항) 특정 배포 선택 가능

**장점**:
- UX가 우수함 (URL 찾을 필요 없음)
- 권한이 있는 프로젝트만 표시
- 배포 목록도 함께 볼 수 있음

**단점**:
- 구현 복잡도 높음
- 다이얼로그 UI 필요

#### 옵션 3: 하이브리드 방식 (옵션 1 + 옵션 2)
**흐름**:
1. Vercel 블록 추가 시 선택지 제공
   - "연동된 계정에서 선택" → 옵션 2 흐름
   - "URL 직접 입력" → 옵션 1 흐름
2. URL 입력 시 자동으로 계정 매칭 시도
3. 계정이 연동되어 있으면 추가 정보 fetch

**장점**:
- 유연성 높음
- 다양한 사용 시나리오 지원

**단점**:
- 가장 복잡함

### 📝 구현 단계 제안

#### Phase 1: URL 입력 방식 (MVP)
- URL 직접 입력으로 시작
- 조직 설정에서 Vercel API 토큰 설정
- 공개 배포 정보만 fetch

#### Phase 2: OAuth 연동
- Vercel OAuth 플로우 구현
- 조직별 Vercel 계정 연동
- 비공개 배포 정보도 fetch 가능

#### Phase 3: 프로젝트 선택 UI
- 프로젝트 목록 다이얼로그
- 배포 히스토리 선택
- 실시간 배포 상태 업데이트

### 🔐 권한 및 보안

#### 계정 연동 구조
```typescript
// Organization Settings
organizationSettings: {
  integrations: {
    vercel: {
      accessToken: string;      // Vercel API 토큰 (암호화 저장)
      teamId?: string;          // Vercel Team ID
      connectedBy: string;      // 연동한 사용자 ID
      connectedAt: string;      // 연동 시간
    }
  }
}
```

#### 데이터 흐름
```
1. 사용자 → Vercel 블록 추가
2. 조직 설정 확인 → Vercel 계정 연동 여부 체크
3. 연동됨 → API 토큰으로 프로젝트 목록 fetch
4. 사용자 프로젝트/배포 선택
5. 배포 정보 fetch → Properties에 저장
6. 백그라운드 자동 새로고침 (30초마다)
```

### 💬 회의 토픽

다음 사항들에 대해 논의가 필요합니다:

1. **계정 연동 범위**: 조직 단위 vs 워크스페이스 단위 vs 개인 단위?
2. **입력 방식**: URL 직접 입력 vs 프로젝트 선택 vs 하이브리드?
3. **자동 새로고침**: 폴링 방식 vs Webhook 방식?
4. **다중 계정**: 하나의 조직에서 여러 Vercel 계정 연동 가능?
5. **권한 관리**: 누가 계정을 연동하고 해제할 수 있는가?

## 8. 구현 참조

**향후 구현**

**사용 API**: 
- Vercel API (REST API)
- Vercel OAuth

## 9. 특이사항

### Vercel API 연동
- API 토큰 필요 (환경 변수)
- Rate Limit 고려
- Webhook으로 실시간 업데이트 (향후)

## 10. 향후 계획

- [ ] OAuth 플로우 구현
- [ ] 프로젝트 선택 다이얼로그
- [ ] 배포 히스토리 표시
- [ ] 배포 로그 표시
- [ ] 롤백 기능
- [ ] 환경 변수 관리
- [ ] Webhook 연동 (실시간 배포 상태)

