# Backend Naming Conventions

## 개요

이 문서는 백엔드 코드에서 사용되는 함수/서비스 네이밍 컨벤션을 정의합니다. 특히 **extract**, **generate**, **create**, **get** 등의 용어를 명확하게 구분합니다.

## 핵심 원칙

각 용어는 **데이터의 출처와 처리 단계**를 명확하게 나타냅니다.

## 용어 정의

### 1. **extract** - 외부 소스에서 원본 데이터 추출

**의미**: 외부 시스템(API, 파일, 데이터베이스 등)에서 원본 데이터를 가져오는 것

**사용 예시**:
- `extractTranscript(videoId)` - YouTube API에서 transcript 가져오기
- `extractVideoScriptAction` - YouTube에서 스크립트를 추출하는 전체 프로세스 (Action 레이어)
- `extractVideoSummaryAction` - 요약을 추출하는 전체 프로세스 (Action 레이어)

**특징**:
- 외부 소스와의 통신이 포함됨
- 원본 데이터를 그대로 가져옴 (가공 없음)
- 네트워크 요청, 파일 읽기 등 I/O 작업

**레이어**: 주로 Action Layer 또는 외부 API Service Layer

---

### 2. **generate** - 원본 데이터를 가공하여 새로운 콘텐츠 생성

**의미**: 기존 데이터를 변환/가공하여 새로운 콘텐츠를 만드는 것

**사용 예시**:
- `generateVideoSummary(videoAggregate, language)` - 스크립트를 기반으로 요약 텍스트 생성
- `generateSummary(script, language)` - AI 모델을 사용하여 요약 생성 (향후)

**특징**:
- 입력 데이터를 변환하여 새로운 출력 생성
- AI/ML 모델, 알고리즘, 비즈니스 로직 사용
- 외부 소스와의 통신 없음 (이미 가져온 데이터 사용)

**레이어**: Service Layer (Domain Service)

---

### 3. **create** - 도메인 객체 생성 및 저장

**의미**: 도메인 Aggregate를 생성하고 Repository를 통해 영속화하는 것

**사용 예시**:
- `createVideoSummary(safeDto, repository)` - VideoSummary Aggregate 생성 및 저장
- `createActionTransaction(request, repository)` - ActionTransaction Aggregate 생성 및 저장
- `createVideo(request, repository)` - Video Aggregate 생성 및 저장

**특징**:
- DDD 패턴: SafeDTO → Command → Aggregate → Repository
- Domain Event 발생
- 데이터베이스에 저장됨

**레이어**: Service Layer

**패턴**:
```typescript
// 1. Value Objects 생성
const videoId = new VideoId(safeDto.videoId);
const language = new LanguageCode(safeDto.language);

// 2. Command 생성
const command: CreateVideoSummaryCommand = { videoId, language, summary };

// 3. Aggregate 생성
const aggregate = VideoSummaryAggregate.createVideoSummary(command);

// 4. Repository에 저장
await repository.create(aggregate);
```

---

### 4. **get/fetch/retrieve** - 저장된 데이터 조회

**의미**: 이미 저장된 데이터를 데이터베이스에서 조회하는 것

**사용 예시**:
- `getVideoScriptAction` - 저장된 스크립트 조회 (Action)
- `getVideoSummaryAction` - 저장된 요약 조회 (Action)
- `findByVideoIdAndLanguage` - Repository 메서드

**특징**:
- 데이터베이스 쿼리
- 기존 데이터 읽기 (변경 없음)
- 캐싱 가능

**레이어**: Action Layer (조회), Repository Layer (데이터 접근)

**네이밍 규칙**:
- **Action Layer**: `get*` (예: `getVideoScriptAction`)
- **Repository Layer**: `find*` (예: `findByVideoIdAndLanguage`)

---

### 5. **orchestrate/process** - 전체 프로세스 오케스트레이션

**의미**: 여러 단계를 조합하여 전체 비즈니스 프로세스를 실행하는 것

**사용 예시**:
- `extractVideoSummaryService` - 요약 추출 전체 프로세스 오케스트레이션
  - 기존 요약 확인
  - 요약 생성 (`generateVideoSummary`)
  - VideoSummary 저장 (`createVideoSummary`)
  - 블록 권한 업데이트

**특징**:
- 여러 서비스를 조합
- 비즈니스 로직의 흐름 관리
- 트랜잭션 관리 (Action Layer에서)

**레이어**: Service Layer (Application Service)

**주의**: Action Transaction 관리는 Action Layer에서 처리합니다.

---

## 데이터 흐름 예시

### Video Summary 추출 프로세스

```
1. extractVideoSummaryAction (Action Layer)
   ↓
2. extractTranscript (외부 API) - YouTube에서 transcript 추출
   ↓
3. generateVideoSummary (Service) - 스크립트 → 요약 텍스트 생성
   ↓
4. createVideoSummary (Service) - VideoSummary Aggregate 생성 및 저장
   ↓
5. 블록 권한 업데이트
```

### Video Script 추출 프로세스

```
1. extractVideoScriptAction (Action Layer)
   ↓
2. extractTranscript (외부 API) - YouTube에서 transcript 추출
   ↓
3. updateScript (Aggregate) - Video Aggregate에 스크립트 업데이트
   ↓
4. Repository 저장
```

---

## 레이어별 책임

| 레이어 | 주요 용어 | 예시 |
|--------|----------|------|
| **Action Layer** | `extract*`, `get*` | `extractVideoSummaryAction`, `getVideoScriptAction` |
| **Service Layer** | `generate*`, `create*`, `orchestrate*` | `generateVideoSummary`, `createVideoSummary`, `extractVideoSummaryService` |
| **Repository Layer** | `find*`, `create`, `update` | `findByVideoIdAndLanguage`, `create`, `update` |
| **External API Service** | `extract*` | `extractTranscript` |

---

## 네이밍 체크리스트

함수/서비스를 명명할 때 다음을 확인하세요:

- [ ] **extract**: 외부 소스에서 원본 데이터를 가져오는가?
- [ ] **generate**: 기존 데이터를 가공하여 새로운 콘텐츠를 만드는가?
- [ ] **create**: 도메인 Aggregate를 생성하고 저장하는가?
- [ ] **get/fetch**: 저장된 데이터를 조회하는가?
- [ ] **orchestrate/process**: 여러 단계를 조합하여 전체 프로세스를 실행하는가?

---

## 기존 코드 리팩토링 가이드

### 현재 혼용되는 경우

1. **`extractVideoSummaryService`** 
   - 현재: 전체 프로세스 오케스트레이션
   - 제안: `orchestrateVideoSummaryExtraction` 또는 `processVideoSummaryExtraction`
   - 또는 Action Layer에서 처리하도록 리팩토링

2. **`generateVideoSummary`**
   - ✅ 올바름: 스크립트를 가공하여 요약 텍스트 생성

3. **`createVideoSummary`**
   - ✅ 올바름: VideoSummary Aggregate 생성 및 저장

4. **`getVideoSummaryAction`**
   - ✅ 올바름: 저장된 요약 조회

---

## 참고

- [Server-Side DDD Conventions](./server-side-ddd-conventions.md)
- [Event Storming + DDD 통합 아키텍처](./server-side-ddd-conventions.md#0-event-storming--ddd-통합-아키텍처)
