# YouTube Transcript API vs Caption API 분석

## 📊 두 API의 차이점

### 1. **Transcript API (InnerTube API)** ❌ 현재 막힘

**엔드포인트**: `https://www.youtube.com/youtubei/v1/get_transcript`

**특징:**
- YouTube의 **비공개 InnerTube API** 사용
- `youtubei.js`의 `info.getTranscript()` 메서드로 접근
- 구조화된 JSON 응답 반환
- **2024년 12월 초부터 BotGuard로 차단 시작**
- **400 Bad Request** 에러 반환

**문제점:**
- YouTube가 bot detection을 강화
- InnerTube API는 복잡한 인증/세션 관리 필요
- 서버 환경에서 차단 확률 높음

---

### 2. **Caption API (Timedtext XML)** ✅ 현재 작동 (제한적)

**엔드포인트**: `https://www.youtube.com/api/timedtext?...`

**특징:**
- YouTube의 **공개 자막 XML API** 사용
- `getBasicInfo()` → `caption_tracks` → `base_url` → XML fetch
- XML 형식의 자막 데이터
- **여전히 작동하지만 서버 환경에서 제한적**

**작동 방식:**
```typescript
// 1. 기본 정보 가져오기 (caption tracks 포함)
const info = await client.getBasicInfo(videoId);

// 2. Caption tracks 확인
const captionTracks = info.captions?.caption_tracks;

// 3. 원하는 언어의 track 선택
const track = captionTracks.find(t => t.language_code === 'en');

// 4. XML 직접 fetch
const xml = await fetch(track.base_url);

// 5. XML 파싱
const segments = parseTimedTextXml(xml);
```

---

## 🔍 현재 사용 중인 라이브러리 분석

### `youtube-caption-extractor` ✅

**사용하는 API**: **Caption API (Timedtext XML)**

**증거:**
- 라이브러리 이름: "caption-extractor" (transcript가 아님)
- GitHub 문서: "scrapes and parses captions directly from YouTube videos"
- 공개 API 사용 (InnerTube 불필요)
- Serverless/Edge 환경 최적화

**현재 상태:**
- ✅ **로컬 테스트**: 정상 작동 (230개 세그먼트 추출 성공)
- ⚠️ **배포 환경**: Proxy 필요할 수 있음 (이슈 보고에 따르면)

---

## 🌐 Proxy는 언제 필요한가?

### 로컬 환경 (localhost)
- ✅ **대부분 작동**: Caption API는 로컬에서 잘 작동
- ⚠️ **가끔 실패**: YouTube가 bot detection을 강화하면 실패 가능

### 배포 환경 (Vercel, AWS, etc.)
- ❌ **대부분 실패**: 서버 IP가 데이터센터 IP로 식별됨
- ✅ **Proxy 필요**: Residential proxy 사용 시 작동
- 💰 **비용 발생**: Proxy 서비스 비용 필요

### Proxy 종류
1. **Residential Proxy** (추천)
   - 실제 가정용 IP 사용
   - YouTube가 인간 사용자로 인식
   - 예: Floxy, Decodo, Bright Data

2. **Datacenter Proxy** (비추천)
   - 데이터센터 IP
   - YouTube가 여전히 bot으로 인식할 수 있음

---

## 📝 GitHub 이슈 핵심 내용

### 문제 상황 (2024년 12월)
1. **Transcript API 완전 차단**
   - `info.getTranscript()` → 400 에러
   - BotGuard 응답 토큰 필요 (복잡함)

2. **Caption API로 우회 가능**
   - `getBasicInfo()` → `caption_tracks` → XML fetch
   - 로컬에서는 작동
   - **배포 환경에서는 Proxy 필요**

3. **해결책**
   - Caption API 사용 (현재 `youtube-caption-extractor`가 사용 중)
   - 배포 환경에서는 Residential Proxy 사용
   - 또는 YouTube Data API v3 사용 (공식 API, quota 필요)

---

## 🎯 우리 프로젝트의 현재 상황

### 현재 상태
- ✅ `youtube-caption-extractor` 사용 중 (Caption API)
- ✅ 로컬 테스트 성공
- ❌ `youtubei.js` 실패 (Transcript API, 400 에러)

### 권장 사항

#### 옵션 1: 현재 상태 유지 (단일 Adapter)
- ✅ `youtube-caption-extractor`만 사용
- ✅ 단순하고 안정적
- ⚠️ 배포 환경에서 Proxy 필요할 수 있음

#### 옵션 2: Proxy 추가 (배포 환경 대응)
- Residential Proxy 서비스 연동
- 환경 변수로 Proxy URL 관리
- 배포 환경에서만 Proxy 활성화

#### 옵션 3: YouTube Data API v3 추가 (공식 API)
- 가장 안정적
- Quota 제한 있음 (하루 10,000 units)
- API Key 필요

---

## 🔗 참고 자료

- [youtubei.js Issue #1102](https://github.com/LuanRT/YouTube.js/issues/1102)
- [youtube-caption-extractor GitHub](https://github.com/devhims/youtube-caption-extractor)

---

## 💡 ZenRows 같은 프록시 서비스 사용

### ZenRows란?

**ZenRows**는 웹 스크래핑을 위한 프록시/API 서비스입니다:
- ✅ **Residential Proxy**: 실제 가정용 IP 제공
- ✅ **JavaScript Rendering**: 동적 콘텐츠 렌더링
- ✅ **CAPTCHA 우회**: reCAPTCHA, Cloudflare Turnstile 처리
- ✅ **Bot Detection Bypass**: YouTube 같은 사이트의 bot detection 우회

### 장점

1. **높은 성공률**
   - Residential IP로 실제 사용자처럼 인식
   - 배포 환경에서도 안정적 작동

2. **간편한 통합**
   - API 기반으로 간단한 HTTP 요청
   - 복잡한 프록시 설정 불필요

3. **추가 기능**
   - JavaScript 렌더링 (필요시)
   - CAPTCHA 자동 처리

### 단점

1. **비용 발생**
   - 월 구독료 또는 사용량 기반 과금
   - ZenRows: $49/월부터 (250K requests)

2. **의존성 증가**
   - 외부 서비스 의존
   - 서비스 다운 시 영향

3. **복잡도 증가**
   - 새로운 adapter 구현 필요
   - 환경 변수 관리 추가

### 통합 방법

#### 옵션 1: ZenRows Adapter 추가 (권장)

GitHub 이슈의 workaround 방식을 ZenRows와 함께 사용:

```typescript
// script-adapter/zenrows-caption.adapter.ts
export class ZenRowsCaptionAdapter implements TranscriptAdapter {
  name = 'zenrows-caption';
  
  async getTranscript(videoId: string, language?: string): Promise<TranscriptSegment[]> {
    const zenrowsApiKey = process.env.ZENROWS_API_KEY;
    if (!zenrowsApiKey) {
      throw new Error('ZENROWS_API_KEY not configured');
    }
    
    // 1. YouTube 페이지에서 caption tracks 정보 가져오기
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(
      `https://api.zenrows.com/v1/?apikey=${zenrowsApiKey}&url=${encodeURIComponent(youtubeUrl)}&js_render=true&premium_proxy=true`
    );
    
    // 2. HTML에서 caption tracks 추출
    const html = await pageResponse.text();
    const captionTracks = extractCaptionTracks(html);
    
    // 3. Caption XML 직접 fetch (ZenRows proxy 사용)
    const captionUrl = captionTracks.find(t => t.lang === language)?.baseUrl;
    const xmlResponse = await fetch(
      `https://api.zenrows.com/v1/?apikey=${zenrowsApiKey}&url=${encodeURIComponent(captionUrl)}&premium_proxy=true`
    );
    
    // 4. XML 파싱
    const xml = await xmlResponse.text();
    return parseTimedTextXml(xml);
  }
}
```

#### 옵션 2: 기존 Adapter에 Proxy 옵션 추가

`youtube-caption-extractor`는 내부적으로 fetch를 사용하므로, 직접 수정이 어렵습니다.
대신 **직접 timedtext API를 호출하는 새로운 adapter**를 만드는 것이 좋습니다.

### 비용 비교

| 서비스 | 가격 | 특징 |
|--------|------|------|
| **ZenRows** | $49/월 (250K requests) | JavaScript 렌더링, CAPTCHA 우회 |
| **Bright Data** | $500/월+ | Enterprise급, 높은 성능 |
| **ScraperAPI** | $49/월 (100K requests) | 간단한 API |
| **Proxy 없음** | 무료 | 로컬에서만 작동, 배포 환경 실패 가능 |

### 권장 전략

#### 현재 단계 (MVP)
1. ✅ **현재 상태 유지**: `youtube-caption-extractor`만 사용
2. ✅ **로컬 테스트**: 정상 작동 확인됨
3. ⏳ **배포 후 모니터링**: 실패율 확인

#### 배포 환경에서 실패 시
1. **ZenRows Adapter 추가** (3차 fallback)
2. 환경 변수로 활성화/비활성화 제어
3. 비용 모니터링

#### 구현 예시

```typescript
// get-transcript.service.ts
export async function getTranscript(
  videoId: string,
  language?: string
): Promise<YoutubeScript> {
  const adapters = [
    new YoutubeCaptionExtractorAdapter(), // 1차: 무료, 로컬 작동
  ];
  
  // 배포 환경에서만 ZenRows 활성화
  if (process.env.NODE_ENV === 'production' && process.env.ZENROWS_API_KEY) {
    adapters.push(new ZenRowsCaptionAdapter()); // 2차: 유료, 배포 환경용
  }
  
  // ... fallback 로직
}
```

### 결론

**현재는 ZenRows 불필요**:
- ✅ 로컬에서 정상 작동
- ✅ 배포 환경 테스트 전까지 대기

**배포 후 실패 시 고려**:
- 💰 비용 vs 성공률 트레이드오프
- 🔄 3차 fallback으로 추가
- 📊 모니터링 후 결정

---

## 🧪 테스트에서 ZenRows 사용하기

### ❌ 직접 프록시 전달 불가능

**`youtube-caption-extractor`는 프록시 옵션을 지원하지 않습니다:**
- TypeScript 정의에 proxy 옵션이 없음
- `getSubtitles()` 함수는 `videoID`와 `lang`만 받음
- 내부적으로 `fetch`를 사용하지만 프록시 설정 불가

### ✅ 대안: ZenRows Adapter 생성

별도의 `ZenRowsCaptionAdapter`를 만들어 테스트할 수 있습니다:

```typescript
// script-adapter/zenrows-caption.adapter.ts
export class ZenRowsCaptionAdapter implements TranscriptAdapter {
  async getTranscript(videoId: string, language?: string) {
    // ZenRows API를 통해 YouTube 페이지와 caption XML 직접 fetch
    // ...
  }
}
```

### 테스트 실행 방법

```bash
# ZenRows API Key 설정 (선택적)
export ZENROWS_API_KEY=your_api_key_here

# ZenRows adapter 테스트 실행
pnpm test zenrows-caption.adapter.test.ts --run

# 또는 일반 테스트 (ZenRows 없이)
pnpm test youtube-caption-extractor.adapter.test.ts --run
```

**주의사항:**
- ZenRows API Key 필요 (유료 서비스)
- `ZENROWS_API_KEY` 환경 변수가 없으면 테스트가 자동으로 스킵됨
- CI 환경에서는 자동으로 스킵됨
