# YouTube Summary 추출 로직 시나리오 정리

## 핵심 개념

### 데이터 구조
- **`youtube_app_space.videos`**: YouTube 비디오 메타데이터 (UUID, slug, title 등)
- **`youtube_app_space.video_summaries`**: 언어별 요약 데이터 (video_id, language, summary)
- **`youtube_app_space.action_transactions`**: 조직별 크레딧 소모 기록 (org_id, video_id, action_type, language)
- **`blocks.properties` (YouTube)**: 블록 레벨 권한 (`summaryAccessGrantedLanguages: string[]`)

### 권한 확인 순서 (2단계)
1. **블록 레벨 권한** (`summaryAccessGrantedLanguages`): 빠른 경로, Action Transaction 조회 불필요
2. **조직 레벨 권한** (`action_transactions`): 같은 조직 내에서 추출한 요약 재사용 가능 (자동 복구)

---

## 시나리오 1: 아예 유튜브 테이블에 데이터가 없는 경우

### 상황
- `youtube_app_space.videos` 테이블에 해당 비디오 레코드가 없음
- `youtubeId`가 `blocks.properties.youtubeId`에만 존재

### 동작 흐름

#### 1. 요약 추출 시도 (`extractVideoSummaryAction`)
```
1. Block 조회 → youtubeId 추출
2. Video 조회 (findById) → ❌ Video not found 에러
   → "Video not found" 반환
```

**결과**: 요약 추출 불가능. 먼저 Video 메타데이터를 생성해야 함.

#### 2. 요약 조회 시도 (`getVideoSummariesAction`)
```
1. Block 조회 → youtubeId 추출
2. Video 조회 (findById) → ❌ Video not found 에러
   → "Video not found" 반환
```

**결과**: 요약 조회 불가능.

---

## 시나리오 2: 유튜브 테이블에 데이터가 있지만, 요약이 비어있는 경우

### 상황
- `youtube_app_space.videos` 테이블에 비디오 레코드 존재
- `youtube_app_space.video_summaries` 테이블에 해당 언어의 요약 없음
- 스크립트는 있을 수도, 없을 수도 있음

### 동작 흐름

#### 1. 요약 추출 시도 (`extractVideoSummaryAction`)
```
1. Block 조회 → youtubeId 추출
2. Video 조회 → ✅ Video 존재
3. 스크립트 확인 → 
   - 스크립트 없음: ❌ "Script not found. Please extract script first." 반환
   - 스크립트 있음: 계속 진행
4. 언어 결정 (요청 language || 사용자 프로필 || scriptLanguage || 'en')
5. extractVideoSummaryService 호출:
   a. 기존 요약 확인 (findByVideoIdAndLanguage) → 없음
   b. Action Transaction 생성 (org_id, video_id, 'extract_summary', language)
   c. 요약 생성 (generateVideoSummary) → 스크립트 기반으로 생성
   d. VideoSummary 저장 (create)
   e. 블록 권한 업데이트: summaryAccessGrantedLanguages에 language 추가
   f. Action Transaction 완료 처리
```

**결과**: 
- ✅ 새로운 요약 생성됨
- ✅ `video_summaries` 테이블에 레코드 추가
- ✅ `action_transactions` 테이블에 레코드 추가 (org_id, language 포함)
- ✅ 블록의 `summaryAccessGrantedLanguages`에 해당 언어 추가

#### 2. 요약 조회 시도 (`getVideoSummariesAction`)
```
1. Block 조회 → youtubeId 추출
2. Video 조회 → ✅ Video 존재
3. 모든 요약 조회 (findAllByVideoId) → 빈 배열 []
4. 권한 확인:
   - 블록 레벨: summaryAccessGrantedLanguages가 없거나 비어있음
   - 조직 레벨: action_transactions 확인 → 없음
   → ❌ "Summary not extracted. Please extract summary first." 반환
```

**결과**: 요약이 없으므로 추출을 먼저 해야 함.

---

## 시나리오 3: 유튜브 테이블에 요약 데이터까지 있는 경우

### 상황
- `youtube_app_space.videos` 테이블에 비디오 레코드 존재
- `youtube_app_space.video_summaries` 테이블에 하나 이상의 언어 요약 존재
- 예: `(video_id, 'ko', '...')`, `(video_id, 'en', '...')`

### 동작 흐름

#### 1. 요약 추출 시도 (`extractVideoSummaryAction`) - 기존 언어
```
1. Block 조회 → youtubeId 추출
2. Video 조회 → ✅ Video 존재
3. 스크립트 확인 → ✅ 스크립트 존재
4. 언어 결정 (예: 'ko')
5. extractVideoSummaryService 호출:
   a. 기존 요약 확인 (findByVideoIdAndLanguage) → ✅ 이미 존재
   b. 기존 요약 반환 (새로 생성하지 않음)
```

**결과**: 
- ✅ 기존 요약 반환 (중복 생성 방지)
- ✅ Action Transaction 생성하지 않음 (크레딧 소모 없음)
- ✅ 블록 권한 업데이트하지 않음

#### 2. 요약 추출 시도 (`extractVideoSummaryAction`) - 새로운 언어
```
1-4. 동일
5. extractVideoSummaryService 호출:
   a. 기존 요약 확인 (findByVideoIdAndLanguage) → 없음 (새 언어)
   b. Action Transaction 생성 (org_id, video_id, 'extract_summary', 'es')
   c. 요약 생성 및 저장
   d. 블록 권한 업데이트: summaryAccessGrantedLanguages에 'es' 추가
```

**결과**: 
- ✅ 새로운 언어 요약 생성
- ✅ `video_summaries` 테이블에 새 레코드 추가
- ✅ `action_transactions` 테이블에 새 레코드 추가
- ✅ 블록의 `summaryAccessGrantedLanguages`에 새 언어 추가

#### 3. 요약 조회 시도 (`getVideoSummariesAction`)

##### 3-1. 블록 레벨 권한이 있는 경우
```
1. Block 조회 → youtubeId 추출
2. Video 조회 → ✅ Video 존재
3. 모든 요약 조회 (findAllByVideoId) → ['ko', 'en', 'es'] 요약들
4. 권한 확인:
   - 블록 레벨: summaryAccessGrantedLanguages = ['ko', 'en']
   - 필터링: 'ko', 'en' 요약만 반환
```

**결과**: 
- ✅ 권한이 있는 언어의 요약만 반환
- ✅ Action Transaction 조회 불필요 (빠른 경로)

##### 3-2. 블록 레벨 권한이 없는 경우 (조직 레벨 확인)
```
1-3. 동일
4. 권한 확인:
   - 블록 레벨: summaryAccessGrantedLanguages = [] 또는 없음
   - 조직 레벨: action_transactions 확인
     * org_id로 해당 video_id의 'extract_summary' action_transactions 조회
     * 각 언어별로 권한 확인:
       - 'ko': action_transaction 존재 → ✅ 권한 있음
       - 'en': action_transaction 없음 → ❌ 권한 없음
       - 'es': action_transaction 존재 → ✅ 권한 있음
   - 권한이 있는 요약만 반환: ['ko', 'es']
```

**결과**: 
- ✅ 조직 내에서 추출한 언어의 요약만 반환
- ✅ 다른 조직이 추출한 요약은 접근 불가

---

## 시나리오 4: 조직 내부에서 블록 복제

### 상황
- 원본 블록: `summaryAccessGrantedLanguages = ['ko', 'en']`
- 같은 조직 내 다른 워크스페이스로 복제
- 같은 `youtubeId` 사용 (같은 비디오)

### 동작 흐름

#### 1. 블록 복제 시점
```
Block.duplicate(userId) 호출:
- 새로운 BlockId 생성
- 같은 workspaceId (같은 워크스페이스) 또는 다른 workspaceId (다른 워크스페이스)
- 같은 properties 복제 → summaryAccessGrantedLanguages = ['ko', 'en'] 복제됨
- 같은 youtubeId 복제
```

**결과**: 
- ✅ 복제된 블록도 `summaryAccessGrantedLanguages = ['ko', 'en']` 보유
- ✅ 같은 `youtubeId` 참조

#### 2. 복제된 블록에서 요약 조회 (`getVideoSummariesAction`)
```
1. Block 조회 → youtubeId 추출
2. Video 조회 → ✅ Video 존재 (같은 video_id)
3. 모든 요약 조회 → ['ko', 'en', 'es'] 요약들
4. 권한 확인:
   - 블록 레벨: summaryAccessGrantedLanguages = ['ko', 'en'] (복제됨)
   - 필터링: 'ko', 'en' 요약만 반환
```

**결과**: 
- ✅ 복제된 블록에서도 원본과 동일하게 'ko', 'en' 요약 접근 가능
- ✅ Action Transaction 조회 불필요 (블록 레벨 권한으로 충분)
- ✅ **조직 내 공유**: 같은 org_id의 action_transactions가 있으므로, 다른 워크스페이스에서도 접근 가능

#### 3. 복제된 블록에서 새로운 언어 요약 추출
```
1-4. 동일 (extractVideoSummaryAction)
5. extractVideoSummaryService 호출:
   a. 기존 요약 확인 → 'es' 요약이 이미 존재 (다른 블록에서 추출됨)
   b. 기존 요약 반환 (중복 생성 방지)
```

**결과**: 
- ✅ 이미 존재하는 요약은 재사용 (크레딧 소모 없음)
- ✅ 하지만 Action Transaction은 새로 생성됨 (org_id, video_id, 'extract_summary', 'es')
- ✅ 블록의 `summaryAccessGrantedLanguages`에 'es' 추가

**주의**: 
- 같은 org_id에서 이미 'es' 요약을 추출했다면, Action Transaction은 중복 생성될 수 있음
- 하지만 `video_summaries` 테이블의 요약은 재사용됨

---

## 시나리오 5: 외부 조직에서 블록 복제

### 상황
- 원본 블록: `summaryAccessGrantedLanguages = ['ko', 'en']`
- 다른 조직의 워크스페이스로 복제
- 같은 `youtubeId` 사용 (같은 비디오)

### 동작 흐름

#### 1. 블록 복제 시점
```
Block.duplicate(userId) 호출:
- 새로운 BlockId 생성
- 다른 조직의 workspaceId
- 같은 properties 복제 → summaryAccessGrantedLanguages = ['ko', 'en'] 복제됨
- 같은 youtubeId 복제
```

**결과**: 
- ✅ 복제된 블록도 `summaryAccessGrantedLanguages = ['ko', 'en']` 보유
- ✅ 같은 `youtubeId` 참조

#### 2. 복제된 블록에서 요약 조회 (`getVideoSummariesAction`)
```
1. Block 조회 → youtubeId 추출
2. Video 조회 → ✅ Video 존재 (같은 video_id, 공유됨)
3. 모든 요약 조회 → ['ko', 'en', 'es'] 요약들 (video_id로 조회, 조직 무관)
4. 권한 확인:
   - 블록 레벨: summaryAccessGrantedLanguages = ['ko', 'en'] (복제됨)
   - 필터링: 'ko', 'en' 요약만 반환
```

**결과**: 
- ✅ 복제된 블록에서도 'ko', 'en' 요약 접근 가능
- ✅ **블록 레벨 권한이 복제되었기 때문**
- ✅ Action Transaction 조회 불필요

#### 3. 복제된 블록에서 새로운 언어 요약 추출
```
1-4. 동일 (extractVideoSummaryAction)
5. extractVideoSummaryService 호출:
   a. 기존 요약 확인 → 'es' 요약이 이미 존재 (다른 조직에서 추출됨)
   b. 기존 요약 반환 (중복 생성 방지)
   c. Action Transaction 생성 (새로운 org_id, video_id, 'extract_summary', 'es')
   d. 블록 권한 업데이트: summaryAccessGrantedLanguages에 'es' 추가
```

**결과**: 
- ✅ 이미 존재하는 요약은 재사용 (크레딧 소모 없음)
- ✅ 하지만 Action Transaction은 새로 생성됨 (다른 org_id)
- ✅ 블록의 `summaryAccessGrantedLanguages`에 'es' 추가
- ✅ **요약 데이터는 공유되지만, 크레딧은 조직별로 관리됨**

#### 4. 복제된 블록에서 요약 조회 - 블록 권한이 없는 경우
```
만약 복제 시 summaryAccessGrantedLanguages가 복제되지 않았다면:
1-3. 동일
4. 권한 확인:
   - 블록 레벨: summaryAccessGrantedLanguages = [] 또는 없음
   - 조직 레벨: action_transactions 확인
     * 새로운 org_id로 조회 → ❌ action_transaction 없음
   → ❌ "Summary not extracted. Please extract summary first." 반환
```

**결과**: 
- ❌ 블록 레벨 권한이 없으면 접근 불가
- ❌ 다른 조직의 action_transactions는 접근 불가
- ✅ 요약을 새로 추출하면 접근 가능

---

## 요약 테이블

| 시나리오 | Video 존재 | Summary 존재 | 블록 권한 | 조직 권한 | 결과 |
|---------|-----------|-------------|----------|----------|------|
| 1. Video 없음 | ❌ | - | - | - | 요약 추출/조회 불가 |
| 2. Summary 없음 | ✅ | ❌ | - | - | 요약 추출 가능 (스크립트 필요) |
| 3. Summary 있음 | ✅ | ✅ | ✅ | - | 블록 권한으로 접근 가능 |
| 3. Summary 있음 | ✅ | ✅ | ❌ | ✅ | 조직 권한으로 접근 가능 |
| 4. 내부 복제 | ✅ | ✅ | ✅ (복제됨) | ✅ | 블록 권한으로 접근 가능 |
| 5. 외부 복제 | ✅ | ✅ | ✅ (복제됨) | ❌ | 블록 권한으로 접근 가능 |

---

## 핵심 포인트

1. **블록 레벨 권한 (`summaryAccessGrantedLanguages`)**: 
   - 블록 복제 시 함께 복제됨
   - 빠른 경로 (Action Transaction 조회 불필요)
   - 블록별로 독립적으로 관리

2. **조직 레벨 권한 (`action_transactions`)**:
   - 같은 조직 내 워크스페이스 간 공유
   - 언어별로 크레딧 소모 기록
   - 다른 조직과는 공유되지 않음

3. **요약 데이터 (`video_summaries`)**:
   - `video_id`로 관리 (조직 무관)
   - 여러 조직이 같은 요약을 재사용 가능
   - 중복 생성 방지 (같은 video_id + language 조합)

4. **자동 복구 메커니즘**:
   - 조직 권한이 있으면 블록 권한 자동 부여
   - `get-video-summary-by-language.action.ts`의 8단계 참고

5. **복제 시나리오**:
   - 블록 레벨 권한이 복제되면 즉시 접근 가능
   - 블록 레벨 권한이 없으면 조직 권한 확인 필요
   - 외부 조직에서도 블록 권한이 복제되면 접근 가능
