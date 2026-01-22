# YouTube App Space Actions

YouTube 블록의 스크립트 및 요약 추출, 조회를 위한 서버 액션들입니다.

## 📋 목차

1. [개요](#개요)
2. [액션 분류](#액션-분류)
3. [사용 시나리오](#사용-시나리오)
4. [권한 관리](#권한-관리)
5. [보안 고려사항](#보안-고려사항)
6. [Published Page 지원](#published-page-지원)

---

## 개요

### 핵심 개념

- **Action Transaction**: 조직(org) 단위로 YouTube 비디오에 대한 추출 이력을 관리
- **Block-level Permission**: 각 블록의 `scriptAccessGranted`, `summaryAccessGrantedLanguages`로 접근 권한 관리
- **Org-level Sharing**: 같은 조직 내 다른 블록에서 추출한 스크립트/요약 재사용 가능

### 데이터 흐름

```
YouTube URL 추가
  ↓
블록 생성 (scriptAccessGranted: undefined, summaryAccessGrantedLanguages: [])
  ↓
스크립트/요약 추출
  ↓
Action Transaction 생성 (org + video + action_type)
  ↓
블록 권한 자동 설정 (scriptAccessGranted: true, summaryAccessGrantedLanguages: [langs])
  ↓
다른 블록에서 재사용 가능
```

---

## 액션 분류

### 1. Script Actions

#### `process-video-script.action.ts`
- **용도**: YouTube 비디오 스크립트 처리 (조회 및 추출 통합)
- **권한**: 인증 필요, Block 권한 확인
- **특징**:
  - 권한 확인 후 스크립트가 있으면 반환
  - 권한이 있지만 스크립트가 없으면 자동 추출
  - 권한이 없어도 추출 시도 (사용자 요청 시)
  - `scriptAccessGranted === true`면 빠른 경로 (스크립트 확인 후 반환)
  - 없으면 org의 action_transactions 확인
  - 자동 복구: action transaction 있으면 `scriptAccessGranted = true` 설정

### 2. Summary Actions

#### `process-video-summary.action.ts`
- **용도**: 특정 언어로 요약 처리 (스크립트 확인 및 요약 생성/조회 통합)
- **권한**: 인증 필요, Block 권한 확인
- **특징**:
  - 권한 확인 후 요약이 있으면 반환
  - 권한이 있지만 요약이 없으면 자동 추출
  - 권한이 없어도 추출 시도 (사용자 요청 시)
  - `summaryAccessGrantedLanguages`에 언어가 있으면 빠른 경로 (요약 확인 후 반환)
  - 없으면 org의 action_transactions 확인

### 3. Transaction Actions

#### `check-action-transaction.action.ts`
- **용도**: 특정 액션이 실행된 적이 있는지 확인
- **권한**: 인증 필요
- **특징**: `extract_script`, `extract_summary` 등 확인

#### `create-action-transaction.action.ts`
- **용도**: 액션 실행 이력 생성
- **권한**: 인증 필요

---

## 사용 시나리오

### 시나리오 1: 첫 YouTube URL 추가

```
1. 사용자가 YouTube URL로 블록 생성
   → scriptAccessGranted: undefined
   → summaryAccessGrantedLanguages: []

2. 스크립트 섹션 렌더링
   → useCheckVideoScriptTransaction 호출
   → checkActionTransactionAction (인증 필요)
   → exists: false (아직 추출 안 함)

3. 사용자가 "Extract Script" 클릭
   → processVideoScriptAction 호출
   → Action Transaction 생성
   → scriptAccessGranted: true 자동 설정
   → 스크립트 표시

4. 요약 섹션 렌더링
   → useCheckVideoSummaryTransaction 호출
   → exists: false
   → Language selector 비어있음

5. 사용자가 "Extract Summary (ko)" 클릭
   → processVideoSummaryAction 호출
   → Action Transaction 생성 (language: 'ko')
   → summaryAccessGrantedLanguages: ['ko'] 자동 설정
   → 요약 표시
```

### 시나리오 2: 에디터 패널 열어서 Access Granted 추가

```
1. 블록 A에서 스크립트/요약 추출 완료
   → scriptAccessGranted: true
   → summaryAccessGrantedLanguages: ['ko', 'en', 'ja']

2. 사용자가 에디터 패널 열기
   → useVideoScript 호출
   → scriptAccessGranted === true
   → processVideoScriptAction 호출 (빠른 경로: 권한 확인 후 스크립트 반환)
   → 스크립트 즉시 표시

3. 요약 섹션
   → summaryAccessGrantedLanguages: ['ko', 'en', 'ja']
   → Language selector에 체크 표시
   → 각 언어 선택 시 processVideoSummaryAction 사용 (권한 확인 후 요약 반환)
   → 요약 즉시 표시
```

### 시나리오 3: 에디터 안 열었을 때 vs 열었을 때

#### 에디터 안 열었을 때 (문제 상황)

```
1. 블록 C를 URL로 새로 추가
   → scriptAccessGranted: undefined
   → summaryAccessGrantedLanguages: []

2. 에디터를 열지 않고 바로 페이지 공개

3. Published page 접속 (비로그인 유저)
   → useCheckVideoScriptTransaction 호출
   → ❌ checkActionTransactionAction (인증 필요)
   → ❌ UNAUTHORIZED: User not authenticated
   → exists: false
   → ❌ 스크립트 안 보임

   → useCheckVideoSummaryTransaction 호출
   → ❌ checkActionTransactionAction (인증 필요)
   → ❌ UNAUTHORIZED: User not authenticated
   → exists: false
   → ❌ Language selector 비어있음
   → ❌ 요약 안 보임
```

#### 에디터 열었을 때 (정상 작동)

```
1. 블록 C를 URL로 새로 추가
   → scriptAccessGranted: undefined
   → summaryAccessGrantedLanguages: []

2. 사용자가 에디터 열기 (인증됨)
   → useCheckVideoScriptTransaction 호출
   → checkActionTransactionAction (인증됨)
   → exists: true (다른 블록에서 추출한 이력 있음)
   → processVideoScriptAction 호출
   → 자동 복구: scriptAccessGranted: true 설정
   → ✅ 스크립트 표시

   → useCheckVideoSummaryTransaction 호출
   → exists: true
   → getVideoSummaryByLanguageAction 호출
   → 자동 복구: summaryAccessGrantedLanguages: ['ko', 'en', 'ja'] 설정
   → ✅ Language selector에 체크 표시
   → ✅ 요약 표시
```

### 시나리오 4: 복제했을 때

```
1. 블록 A (원본)
   → scriptAccessGranted: true
   → summaryAccessGrantedLanguages: ['ko', 'en', 'ja']

2. 블록 A 복제 → 블록 B 생성
   → scriptAccessGranted: true (복제됨)
   → summaryAccessGrantedLanguages: ['ko', 'en', 'ja'] (복제됨)

3. 블록 B 렌더링
   → scriptAccessGranted === true
   → processVideoScriptAction 호출 (빠른 경로: 권한 확인 후 스크립트 반환)
   → ✅ 스크립트 즉시 표시

   → summaryAccessGrantedLanguages: ['ko', 'en', 'ja']
   → Language selector에 체크 표시
   → processVideoSummaryAction 사용 (권한 확인 후 요약 반환)
   → ✅ 요약 즉시 표시
```

### 시나리오 5: URL을 따로 추가했을 때

```
1. 블록 A에서 YouTube URL로 스크립트/요약 추출
   → Action Transaction 생성 (org + video + action_type)
   → scriptAccessGranted: true
   → summaryAccessGrantedLanguages: ['ko', 'en', 'ja']

2. 같은 URL로 블록 C를 새로 추가
   → scriptAccessGranted: undefined
   → summaryAccessGrantedLanguages: []

3. 에디터 열기 (인증됨)
   → useCheckVideoScriptTransaction
   → exists: true (블록 A의 이력 발견)
   → processVideoScriptAction 호출
   → 자동 복구: scriptAccessGranted: true 설정
   → ✅ 스크립트 표시

   → useCheckVideoSummaryTransaction
   → exists: true
   → 하지만 어떤 언어가 있는지 모름!
   → ❌ Language selector 비어있음
   → ❌ 사용자가 언어를 선택할 수 없음

4. 해결책: getAvailableSummaryLangListAction 필요
   → action_transactions에서 언어 목록 조회
   → Language selector에 표시
   → 사용자가 언어 선택
   → getVideoSummaryByLanguageAction 호출
   → 자동 복구: 해당 언어를 summaryAccessGrantedLanguages에 추가
```

### 시나리오 6: Readonly 렌더링 (Published Page)

#### Readonly 모드 (Published Page)

```
1. Published page 접속 (비로그인 유저)
   → readonly: true (useCanvasReadOnly)

2. 스크립트 섹션
   → scriptAccessGranted === true (복제되었거나 에디터에서 열었음)
   → processVideoScriptAction 호출 (빠른 경로: 권한 확인 후 스크립트 반환)
   → ✅ 스크립트 표시

   → scriptAccessGranted === undefined
   → ❌ checkActionTransactionAction (인증 필요)
   → ❌ 스크립트 안 보임

3. 요약 섹션
   → summaryAccessGrantedLanguages: ['ko', 'en', 'ja']
   → Language selector에 체크 표시
   → getVideoSummaryByLanguageWithoutTransactionAction 사용
   → ✅ 요약 표시

   → summaryAccessGrantedLanguages: []
   → ❌ checkActionTransactionAction (인증 필요)
   → ❌ Language selector 비어있음
   → ❌ 요약 안 보임

4. Extract 버튼
   → disabled: true (readonly)
   → "To extract a summary, please duplicate this page" 메시지 표시
```

---

## 권한 관리

### Block-level Permission

```typescript
interface YoutubeBlockProperties {
  scriptAccessGranted?: boolean;  // 스크립트 접근 권한
  summaryAccessGrantedLanguages?: string[];  // 요약 접근 권한 (언어별)
}
```

### Org-level Permission (Action Transaction)

```typescript
// action_transactions 테이블
{
  org_id: uuid,
  video_id: uuid,
  action_type: 'extract_script' | 'extract_summary',
  language?: string,  // extract_summary의 경우
  created_at: timestamp,
  completed_at: timestamp
}
```

### 권한 확인 우선순위

1. **Block-level 권한 우선** (빠른 경로)
   - `scriptAccessGranted === true` → `processVideoScriptAction` (빠른 경로: 권한 확인 후 스크립트 반환)
   - `summaryAccessGrantedLanguages.includes(lang)` → `processVideoSummaryAction` (빠른 경로: 권한 확인 후 요약 반환)

2. **Org-level 권한 확인** (자동 복구)
   - Block 권한 없으면 action_transactions 확인
   - 있으면 자동으로 Block 권한 설정

3. **자동 복구 메커니즘**
   - `processVideoScriptAction`: action transaction 있으면 `scriptAccessGranted = true` 설정
   - `processVideoSummaryAction`: action transaction 있으면 해당 언어를 `summaryAccessGrantedLanguages`에 추가

---

## 보안 고려사항

### 1. 인증이 필요한 액션

- `processVideoScriptAction`: `withYoutubeBlockSecureAction` 사용
- `processVideoSummaryAction`: `withYoutubeBlockSecureAction` 사용
- `checkActionTransactionAction`: `withYoutubeBlockSecureAction` 사용

### 2. 인증 불필요한 액션 (Published Page용)

- Published Page 전용 액션들: 블록 권한 + Publish token 검증

### 3. Published Page 보안 문제

**문제:**
- Published page는 비로그인 유저도 접근 가능
- `checkActionTransactionAction`은 인증 필요
- → `scriptAccessGranted` 또는 `summaryAccessGrantedLanguages`가 없으면 접근 불가

**해결책: Published Page 전용 액션**

```typescript
// 제안된 액션들
processVideoScriptForPublishedPageAction(publishToken, blockId, youtubeId)
getAvailableSummaryLangListForPublishedPageAction(publishToken, blockId, youtubeId)
getSummariesForPublishedPageAction(publishToken, blockId, youtubeId)
```

**보안 검증 레이어 (4단계 Defense in Depth):**

#### 1. Publish Token 검증 (Layer 1: Authentication)

```typescript
// Publish token은 UUID v4 기반 (cryptographically random)
const page = await publishRepo.findByToken(publishToken);
if (!page) {
  return err('Invalid or expired token');
}
```

**보안 특성:**
- **UUID v4**: 2^122 조합 (~5.3 × 10^36 가능성)
- **추측 불가능**: Brute force 공격 실질적으로 불가능
- **1:1 매핑**: 각 token은 특정 published page와만 연결
- **만료 없음**: 명시적으로 unpublish하지 않는 한 유효 (선택적으로 TTL 추가 가능)

**공격 시나리오:**
- ❌ 무작위 token 생성: 실질적으로 불가능 (2^122 확률)
- ✅ 유효한 token 획득: 의도된 접근 (공유 링크와 동일한 보안 모델)

#### 2. Block 소속 확인 (Layer 2: Authorization)

```typescript
// 블록이 해당 published page에 실제로 속하는지 확인
const blockMounts = await blockMountRepo.findByPageId(page.pageId);
const blockInPage = blockMounts.some(mount => mount.blockId === blockId);

if (!blockInPage) {
  return err('Block not in published page', { code: 'UNAUTHORIZED' });
}
```

**보안 목적:**
- **Cross-page 공격 방지**: 다른 페이지의 블록 데이터 탈취 차단
- **블록 조작 방지**: 공격자가 유효한 token + 다른 페이지의 blockId 조합으로 접근 시도 차단

**공격 시나리오:**
```
공격자: Page A의 token + Page B의 blockId
→ Layer 2 검증 실패
→ ❌ 차단됨
```

#### 3. YouTube ID 일치 확인 (Layer 3: Data Integrity)

```typescript
// 블록의 실제 youtubeId와 요청의 youtubeId 일치 확인
const block = await blockRepo.findById(blockId);
const blockYoutubeId = block.properties.youtubeId;

if (blockYoutubeId !== youtubeId) {
  return err('YouTube ID mismatch', { code: 'MISMATCH' });
}
```

**보안 목적:**
- **파라미터 조작 방지**: 공격자가 유효한 token + blockId + 다른 youtubeId 조합으로 접근 시도 차단
- **데이터 무결성**: 요청된 데이터가 실제 블록의 데이터와 일치하는지 확인

**공격 시나리오:**
```
공격자: 유효한 token + 유효한 blockId + 다른 youtubeId
→ Layer 3 검증 실패
→ ❌ 차단됨
```

#### 4. Org Scope 제한 (Layer 4: Data Isolation)

```typescript
// 해당 published page의 org만 조회 (전체 검색 불가)
const transactions = await actionTransactionRepo
  .findByOrgAndVideoForAction(
    page.orgId,  // ← 특정 org만!
    youtubeId,
    'extract_summary'
  );
```

**보안 목적:**
- **정보 누출 방지**: 다른 조직의 action transaction 데이터 접근 차단
- **비즈니스 인텔리전스 보호**: 경쟁사가 어떤 콘텐츠를 분석하는지 파악 불가
- **사용 패턴 보호**: 조직별 활동 내역 노출 방지

**공격 시나리오:**
```
공격자: 유효한 token으로 모든 org의 action_transactions 조회 시도
→ Layer 4에서 특정 org만 조회
→ ❌ 다른 org 데이터 접근 불가
```

**보안 강도 평가: ✅ 충분히 안전**

**강점:**
- ✅ **4단계 검증 레이어**: 각 레이어가 서로 다른 공격 벡터 차단
- ✅ **Publish token 자체가 강력한 인증**: UUID 기반, 추측 불가능
- ✅ **조작 시도 완전 차단**: 모든 파라미터 검증
- ✅ **Org scope 제한**: 데이터 격리 보장
- ✅ **Defense in Depth**: 한 레이어가 뚫려도 다른 레이어로 보호

**위험 관리:**
- ⚠️ **Published page는 의도적으로 공개**: 민감 정보는 publish 전 제거 필요
- ⚠️ **Token 노출 시**: URL 공유 시 주의 (선택적으로 password protection 추가 가능)
- ⚠️ **Rate limiting 권장**: 무차별 대입 공격 방지 (추가 보안 레이어)

**공격자가 할 수 없는 것:**
- ❌ 무작위 token 생성 (2^122 확률)
- ❌ 다른 페이지 데이터 접근 (Layer 2 차단)
- ❌ 파라미터 조작으로 권한 우회 (Layer 3 차단)
- ❌ 전체 org 데이터 탈취 (Layer 4 차단)

---

## Published Page 지원

### 현재 문제점

1. **에디터를 열지 않고 바로 공개한 경우**
   - `scriptAccessGranted: undefined`
   - `summaryAccessGrantedLanguages: []`
   - Published page에서 접근 불가

2. **인증이 필요한 액션 호출**
   - `checkActionTransactionAction` → 인증 필요
   - `processVideoScriptAction` → 인증 필요
   - 비로그인 유저는 접근 불가

### 해결 방안

#### 옵션 1: Published Page 전용 액션 (추천)

```typescript
// apps/web/src/domains/youtube-app-space/actions/script/
// process-video-script-for-published-page.action.ts

export const processVideoScriptForPublishedPageAction = withPublishedPageSecureAction(
  input: {
    publishToken: string;
    blockId: string;
    youtubeId: string;
  }
): Promise<ActionResult<GetScriptDTO>> {
  // 1. Publish token 검증
  const page = await publishRepo.findByToken(input.publishToken);
  if (!page) return err('Invalid token');
  
  // 2. Block 소속 확인
  const blockInPage = await verifyBlockInPage(input.blockId, page.pageId);
  if (!blockInPage) return err('Unauthorized');
  
  // 3. YouTube ID 일치 확인
  const block = await blockRepo.findById(input.blockId);
  if (block.properties.youtubeId !== input.youtubeId) {
    return err('YouTube ID mismatch');
  }
  
  // 4. scriptAccessGranted 확인
  if (block.properties.scriptAccessGranted === true) {
    // 빠른 경로: processVideoScriptAction이 권한 확인 후 스크립트 반환
    return processVideoScriptAction({ blockId, youtubeId });
  }
  
  // 5. Fallback: action_transactions 확인 (해당 page의 org만)
  const transactions = await actionTransactionRepo
    .findByOrgAndVideoForAction(
      page.orgId,  // ← 특정 org만!
      input.youtubeId,
      'extract_script'
    );
  
  if (transactions) {
    // 스크립트 반환
    const video = await videoRepo.findById(input.youtubeId);
    return ok({ youtube: video.toView() });
  }
  
  return err('Script not found');
}
```

#### 옵션 2: 블록 생성 시 자동 Sync

```typescript
// YouTube 블록 생성 시
async function createYoutubeBlock(youtubeId, orgId) {
  const block = await createBlock({ type: 'youtube', ... });
  
  // 자동으로 action_transactions 확인
  const scriptTransaction = await actionTransactionRepo
    .findByOrgAndVideo(orgId, youtubeId, 'extract_script');
  
  const summaryTransactions = await actionTransactionRepo
    .findByOrgAndVideoForAction(orgId, youtubeId, 'extract_summary');
  
  if (scriptTransaction || summaryTransactions.length > 0) {
    block.updateProperties({
      scriptAccessGranted: !!scriptTransaction,
      summaryAccessGrantedLanguages: summaryTransactions.map(t => t.language),
    });
    await blockRepo.update(block);
  }
  
  return block;
}
```

**장점:**
- ✅ 에디터를 열지 않아도 자동 sync
- ✅ Published page에서 바로 작동

**단점:**
- ⚠️ 블록 타입마다 로직 추가 필요 (복잡도 증가)

### 권장 사항

**옵션 1 (Published Page 전용 액션) 추천**

- Published page의 특수한 요구사항에 맞춤
- 보안 검증 레이어 명확
- 기존 로직과 분리
- 블록 타입에 독립적

---

## 액션 사용 가이드

### Private Workspace (인증된 사용자)

```typescript
// 스크립트 조회
const { script } = useVideoScript({
  blockId,
  youtubeId,
  scriptAccessGranted,  // true면 빠른 경로
  enabled: true,
});

// 요약 조회
const { summary } = useVideoSummaryByLanguage({
  blockId,
  youtubeId,
  language: 'ko',
  summaryAccessGrantedLanguages,  // ['ko'] 있으면 빠른 경로
  enabled: true,
});
```

### Published Page (비로그인 유저)

```typescript
// 스크립트 조회
const { script } = useQuery({
  queryKey: ['published-script', publishToken, blockId],
  queryFn: () => processVideoScriptForPublishedPageAction({
    publishToken,
    blockId,
    youtubeId,
  }),
});

// 사용 가능한 언어 목록
const { languages } = useQuery({
  queryKey: ['published-summary-languages', publishToken, blockId],
  queryFn: () => getAvailableSummaryLangListForPublishedPageAction({
    publishToken,
    blockId,
    youtubeId,
  }),
});
```

---

## 자동 복구 메커니즘

### Script 자동 복구

```typescript
// process-video-script.application.service.ts
if (actionTransaction) {
  // org가 이미 추출했으면 블록에 권한 부여 (자동 복구)
  block.updatePropertiesFromRecord({
    scriptAccessGranted: true,
  });
  await blockRepository.update(block);
}
```

### Summary 자동 복구

```typescript
// get-video-summary-by-language.action.ts:199-207
const currentLanguages = youtubeProperties.summaryAccessGrantedLanguages || [];
if (!currentLanguages.includes(safeDto.language)) {
  block.updatePropertiesFromRecord({
    summaryAccessGrantedLanguages: [...currentLanguages, safeDto.language],
  });
  await blockRepository.update(block);
}
```

---

## 구현된 액션들

### ✅ Private Workspace용

- ✅ `getAvailableSummaryLangListAction` - 사용 가능한 요약 언어 목록 조회
  - 위치: `actions/summary/get-available-summary-languages.action.ts`
  - `summaryAccessGrantedLanguages` 우선 확인
  - 없으면 action_transactions에서 언어 목록 조회
  - 인증 필요

### ✅ Published Page 전용 액션

- ✅ `processVideoScriptForPublishedPageAction` - Published page용 스크립트 처리
  - 위치: `actions/script/process-video-script-for-published-page.action.ts`
  - Publish token 기반 인증 (비로그인 유저 지원)
  - 4단계 보안 검증 레이어
  - `scriptAccessGranted` 우선 확인
  - 없으면 action_transactions 확인 (해당 page의 org만)

8- ✅ `getAvailableSummaryLangListForPublishedPageAction` - Published page용 언어 목록 조회
  - 위치: `actions/summary/get-available-summary-languages-for-published-page.action.ts`
  - Publish token 기반 인증 (비로그인 유저 지원)
  - 4단계 보안 검증 레이어
  - `summaryAccessGrantedLanguages` 우선 확인
  - 없으면 action_transactions에서 언어 목록 조회 (해당 page의 org만)

- ✅ `getSummariesForPublishedPageAction` - Published page용 모든 언어 요약 조회
  - 위치: `actions/summary/get-summaries-for-published-page.action.ts`
  - Publish token 기반 인증 (비로그인 유저 지원)
  - 4단계 보안 검증 레이어
  - 사용 가능한 언어의 모든 요약 반환

## 향후 개선 사항

### 1. 성능 최적화

- [ ] 언어 목록 캐싱
- [ ] Batch 요청 지원
- [ ] Published page 액션의 org 조회 최적화 (page → workspace → org 조회 캐싱)

---

## 참고 자료

- [Secure Action Pattern](./secure-action.ts)
- [Action Transaction Schema](../../db/schemas/youtube-app-space-schema.ts)
- [Block Properties VO](../../block-management/shared/value-objects/block-properties.ts)
