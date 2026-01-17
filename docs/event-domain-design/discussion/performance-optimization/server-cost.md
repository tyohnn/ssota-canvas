# 서버 비용 분석 및 최적화 방안

## 개요

본 문서는 MAU 50,000 기준 서비스의 Supabase + Vercel 기반 서버 비용을 분석하고, Canvas Management 도메인의 최적화 방안을 제시합니다.

**환율 기준**: $1 = ₩1,471.84

---

## 1. 클라우드 서비스 가격 정보

### 1.1 Supabase (Pro)

**기본 요금**: $25 / month

**포함량**:
* **MAU**: 100,000명 포함, 이후 $0.00325 / MAU
* **DB Disk**: 8GB 포함, 이후 $0.125 / GB
* **Egress**: 250GB 포함, 이후 $0.09 / GB
* **Cached Egress**: 250GB 포함, 이후 $0.03 / GB
* **File Storage**: 100GB 포함, 이후 $0.021 / GB
* **Compute**: 월 $10 compute credit 포함 (Micro($10)는 크레딧으로 커버)

**비용 폭주 방지**: Pro 플랜은 spend cap이 기본적으로 활성화되어 있습니다.

참고: [Supabase Pricing][1]

### 1.2 Vercel (Pro)

**기본 요금**: $20 / month + additional usage

**포함량**:
* **Usage Credit**: $20 포함
* **Fast Data Transfer**: 1TB 포함, 이후 $0.15 / GB

참고: [Vercel Pricing][2]

---

## 2. MAU 50,000 기준 비용 추정 시나리오

### 2.1 시나리오 A: 라이트 (최적화된 환경)

**가정**:
* Vercel Fast Data Transfer: 500GB / month (1TB 이내)
* Supabase: egress 200GB, cached egress 200GB, DB disk 8GB, file 100GB, compute Micro

**월 예상 비용**:
* Vercel: $20
* Supabase: $25
* **총합: $45 (≈ ₩66,233)**

### 2.2 시나리오 B: 보통 (일반적인 부하)

**가정**:
* Vercel Fast Data Transfer: 1.5TB (0.5TB 초과분 과금, $20 usage credit으로 일부 상쇄)
* Supabase: egress 500GB, cached 400GB, DB disk 20GB, file 200GB, compute Medium

**월 예상 비용**:
* Vercel: $20 (기본) + 약 $52.5 (초과분) = $72.5
* Supabase: $25 (기본) + 약 $85 (초과분) = $110
* **총합: 약 $182.5 (≈ ₩268,464)**

### 2.3 시나리오 C: 헤비 (높은 트래픽 및 확장)

**가정**:
* Vercel Fast Data Transfer: 5TB
* Supabase: MAU 200k (100k 초과분 과금), egress 2TB, cached 2TB, DB disk 100GB, file 2TB, compute Large

**월 예상 비용**:
* Vercel: $20 (기본) + $600 (초과분) = $620
* Supabase: $25 (기본) + $687.5 (초과분) = $712.5
* **총합: 약 $1,332.5 (≈ ₩1,961,327)**

### 2.4 결론

MAU 50,000 기준 서비스에서:
* **라이트/보통 시나리오**: 월 10~30만원대가 일반적인 구간
* **트래픽 증가 시**: Vercel Fast Data Transfer 및 Supabase egress 증가로 월 100~200만원까지 가능
* **비용 증가 요인**: 트래픽(특히 Vercel Fast Data Transfer) + Supabase egress + SSR/서버 함수 호출

---

## 3. 커뮤니티 피드백 기반 비용 증가 요인

### 3.1 Vercel 관련

**주요 이슈**:
* DDoS 공격이나 실수로 인한 Vercel 청구 폭증 사례 보고
* 과금 체감에 대한 불만 (예상보다 가파름, 공지 효과 미흡)

**비용 급등 요인** (일반적으로 지목되는 항목):
* Bandwidth (데이터 전송)
* Image optimization
* 함수 호출 (Server Actions, SSR)

참고: [Reddit Next.js 커뮤니티][3], [Sanity 가이드][4]

### 3.2 Supabase 관련

**주요 이슈**:
* Egress 및 쿼터 관련 이슈가 커뮤니티에서 반복적으로 논의됨
* 초과분 단가가 명확하여 파일/이미지/다운로드 트래픽 증가 시 비용 급증 가능

참고: [Supabase Reddit][5]

---

## 4. 서버비 100만원 달성 조건

**실제 데이터 기반 분석 결과, 다음 조건들이 충족될 때 월 100만원 이상 비용 발생**:

1. **Vercel Fast Data Transfer**: 월 3~6TB 수준
   * 원인: 이미지/동영상, 무거운 번들, 캐시 미스, 크롤러/봇 트래픽, 다운로드

2. **Supabase Egress**: 월 1~2TB 수준
   * 원인: API 캐싱 부재, DB/스토리지에서 지속적인 데이터 전송

3. **SSR/서버 함수 호출**: Active CPU / invocations 누적
   * 원인: Next.js 서버 액션/SSR 과다 사용

**서비스 형태별 비용 예측**:
* **(1) 정적 위주 여부**
* **(2) 이미지/파일 크기**
* **(3) MAU당 평균 세션/페이지뷰**
* **(4) SSR 비중**

위 4가지 요소를 기준으로 100만원 달성 확률을 역산하여 평가 가능합니다.

---

## 5. Canvas Management 도메인 최적화 방안

### 5.1 Canvas 데이터 조회 최적화

#### 현재 상황

`getCanvasViewAction`에서 다음 데이터를 전송:
* **blockProperties** (JSON Object): 블록의 기본 속성
* **blockCustomProperties** (JSON Object): 블록의 커스텀 속성
* **blockContent** (JSON Object): 블록의 콘텐츠 (TipTap JSON 등)

**문제점**: viewMode에 따라 필요한 데이터가 다름에도 불구하고, 모든 블록의 모든 데이터를 전송하고 있음

**viewMode별 필요 데이터**:
* **`original` viewMode**: `blockProperties` 필요
* **`card` viewMode**: `blockCustomProperties` 필요
* **`note` viewMode**: `blockContent` 필요

#### 최적화 방안

**1. 캔버스 뷰포트 기반 레이지 로딩 (장기 계획)**

* 초기 로드: 기본 필드만 전송 (blockMountId, position, size, blockType, title, viewMode)
* 뷰포트 진입 시: 세부 데이터 로드 (properties, customProperties, content)
* 효과: 초기 로딩 비용 대폭 감소, Supabase Egress 절감

**2. 페이지별 Redis 캐싱 전략 (단기 계획)**

* Redis 키: `canvas-view:{pageId}`
* TTL: 30초 ~ 1분 (데이터 일관성과 비용 절감 균형)
* 동작: 캐시 히트 시 DB 조회 없이 Redis에서 즉시 반환

**예상 효과**:
* 캐시 히트율 70% 가정 시: Egress 70% 절감
* 기준: MAU 5만명 × 10 페이지 × 100 블록 × 50KB = 2.5TB
* 절감액: 2.5TB × 70% × $0.09 = **$157.5/월**

### 5.2 Profile 정보 최적화

#### 현재 상황

모든 블록마다 `leftJoin(profiles)`를 통해 `createdByProfile` 정보를 전송

**용도**: 블록 생성자 정보 표시 (프로필 이미지, 이름)
**문제점**: 상세보기나 호버 시에만 필요한 정보를 항상 전송

#### 최적화 방안

**Profile 정보 별도 조회**:
* `getCanvasViewAction`에서 `createdByProfile` 제거
* 블록 상세보기나 호버 시에만 `getBlockDetailAction` 호출
* 대안: 초기 로드 시 블록 ID 목록만 전달, 클라이언트에서 필요 시 일괄 조회

**예상 효과**:
* Profile 정보 제거로 응답 크기 20-30% 감소
* 절감액: 2.5TB × 25% × $0.09 = **$56.25/월**

### 5.3 드래그/노트뷰 콘텐츠 업데이트 디바운스

#### 현재 상황

Optimistic Update 패턴으로 사용자 조작 시마다 즉시 Server Action 호출 발생

**영향받는 액션**:
* `useUpdateBlockPosition`: 블록 위치 업데이트
* `useUpdateBlockSize`: 블록 크기 업데이트
* 노트뷰 콘텐츠 업데이트: TipTap 에디터 입력 시

#### 최적화 방안

**디바운스 적용**:
* **드래그**: 500ms 디바운스 (드래그 종료 후 500ms 뒤 서버 호출)
* **노트뷰 콘텐츠**: 1000ms 디바운스 (타이핑 종료 후 1초 뒤 서버 호출)
* **유지**: Optimistic Update는 유지하여 UI 반응성 보장

**예상 효과**:
* Server Action 호출 70% 감소
* 기준: MAU 5만명 × 평균 100 드래그/편집 = 5M requests
* 절감액: 5M × 70% × $0.001 = **$3,500/월** (추정, 실제 Vercel 함수 호출 비용 기준)

### 5.4 이미지 처리 최적화

#### 현재 상황

이미지는 **Supabase Storage** 사용

* Supabase Storage: File storage 100GB 포함, 이후 $0.021/GB
* 이미지 URL은 `blockContent`에 포함되어 전송

#### 최적화 방안

**1. 이미지 URL만 전송**:
* `blockContent`에는 이미지 URL만 포함 (이미지 바이너리 제외)
* 클라이언트에서 `<img src={imageUrl} />`로 직접 로드
* Supabase Storage signed URL 사용 (필요 시)

**2. 이미지 최적화 (CDN)**:
* Supabase Storage 자체 CDN 기능 활용
* 필요 시 Cloudflare Images 또는 Bunny CDN 검토
* **주의**: Vercel Image Optimization은 비용이 높음 ($5 per 1000 images) → 사용 비권장

**예상 효과**:
* 현재 구조에서 이미지가 base64로 포함되지 않은 경우 추가 비용 증가는 제한적
* base64 인코딩 사용 시 URL 기반으로 변경하면 대폭 절감 가능

---

## 6. 서버 액션 보안 및 캐싱 전략

### 6.1 현재 상황

Server Action에서 **Defense in Depth (심층 방어)** 패턴 적용

**현재 보안 메커니즘**:
* `checkAuth`: 사용자 인증 확인 (Supabase 세션)
* `verifyPageAccess`: 페이지 접근 권한 확인 (Workspace Navigation Service)
  * 조직 멤버십 확인
  * 워크스페이스 멤버십 확인
  * 페이지 소유권 확인
  * 총 4-5번의 DB 쿼리 수행

**문제점**:
* 모든 Server Action 호출 시 동일한 권한 검증 수행
* 같은 페이지를 여러 번 방문할 때마다 중복 검증 발생
* `verifyPageAccess`가 매 요청마다 4-5번의 DB 쿼리 수행
* Supabase Egress 증가

### 6.2 보안 분석: 공격 시나리오

#### 시나리오 1: Postman/curl을 통한 직접 호출

**공격 방법**:
```bash
# 해커가 자신의 계정으로 로그인 후 세션 쿠키 획득
curl -X POST https://your-app.vercel.app/api/__next/data/... \
  -H "Cookie: sb-xxxxx-auth-token=HACKER_SESSION_COOKIE" \
  -d '{"pageId": "victim-page-id", ...}'
```

**결과**: ❌ **차단됨**
* `checkAuth`는 통과 (해커의 세션 쿠키 유효)
* `verifyPageAccess`에서 차단 (해커가 해당 조직/워크스페이스 멤버 아님)

**결론**: 현재 Defense in Depth 패턴이 효과적으로 작동

#### 시나리오 2: IDOR (Insecure Direct Object Reference) 공격

**공격 방법**: 자신이 속한 조직 내에서 권한 없는 워크스페이스/페이지 접근 시도

**결과**: ❌ **차단됨**
* 일반 워크스페이스는 초대 여부 확인
* `verifyPageAccess`의 멤버십 검증으로 차단

**결론**: 현재 보안 메커니즘으로 방어 가능

#### 시나리오 3: Redis 캐싱 추가 후 보안

**Redis 캐싱 적용 시**:
* 캐시 키: `page-access:{userId}:{orgId}:{workspaceId}:{pageId}`
* 캐시는 `userId` 기준으로 분리 저장
* 해커는 자신의 캐시만 접근 가능 (다른 사용자 캐시 접근 불가)

**결과**: ✅ **보안 수준 유지**
* Redis 캐싱 추가해도 보안 수준은 동일
* 권한 검증은 항상 수행되며, 단지 DB 쿼리 횟수만 감소

### 6.3 Next.js Server Action 보안 메커니즘 분석

**Next.js Server Action의 보안 특징**:
* ✅ **CSRF 방어**: Same-origin 요청만 허용
* ✅ **Cookie 기반 인증**: Supabase 세션 쿠키 자동 전달
* ❌ **Trusted Client 식별 불가**: 우리 앱과 Postman/curl 구분 불가

**결론**: Next.js Server Action 자체는 "Trusted Client"를 식별할 수 없음

**권장사항**: Trusted Client 식별을 시도하지 않고, **모든 클라이언트에 대해 Redis 캐싱을 적용**하는 방식이 가장 실용적

### 6.4 Redis 캐싱 전략

#### 권장 방안: Redis 캐싱 전용 전략

**구현 방식**:
* 모든 Server Action 호출에 대해 Redis 캐싱 적용
* Trusted/Untrusted Client 구분 없이 동일한 캐싱 전략 사용

**캐싱 구조**:
* **캐시 키**: `page-access:{userId}:{orgId}:{workspaceId}:{pageId}`
* **TTL**: 10초 (권한 변경 시 빠르게 반영)
* **캐시 히트 시**: DB 조회 없이 Redis에서 즉시 반환
* **캐시 미스 시**: DB 조회 후 Redis에 저장

**장점**:
* 구현 단순
* 보안 문제 없음 (캐시도 인증된 사용자만 접근)
* 공격자도 동일한 TTL 제약 (10초마다 재검증)
* 비용 절감 효과는 동일 (캐시 히트율 70-80%)

#### DB 쿼리 감소율 분석

**가정 (사용자 작업 패턴)**:
* 사용자가 페이지를 10분간 작업
* Server Action 호출 빈도: 평균 5초마다 1회
* 10분 = 600초 → 총 120회 호출

**Redis 캐싱 없이**:
* 120회 × 4-5 DB 조회 = **480-600 DB 조회**

**Redis 캐싱 (TTL 10초) 적용 후**:
* 10초 동안 2번 호출
* 첫 호출: 캐시 미스 → DB 조회 4-5회
* 두 번째 호출: 캐시 히트 → DB 조회 0회
* 캐시 히트율: **50%**
* 실제 DB 조회: 60회 × 4-5 = **240-300 DB 조회**
* 감소율: **37.5%**

**더 활발한 작업 시나리오** (1초마다 호출):
* 캐시 히트율: **90%**
* 감소율: **87.5%**

**결론**: 
* 보수적 추정: **50-70% 감소**
* 낙관적 추정: **70-87.5% 감소** (활발한 작업 시)

#### TTL 설정 근거

**TTL 10초가 적절한 이유**:
* **권한 변경 빈도**: 실제로는 매우 드물음 (멤버 추가/제거는 몇 시간/일 단위)
* **캐시 히트율**: 10초 TTL로도 70-80% 히트율 가능
* **보안**: 권한 변경 후 최대 10초 내 반영 → 허용 가능한 지연

**시나리오**:
* 시간 0초: 페이지 로드 → 권한 검증 (DB 조회) → 캐시 저장
* 시간 2초: 블록 드래그 → 캐시 히트 (DB 조회 0회)
* 시간 5초: 블록 생성 → 캐시 히트 (DB 조회 0회)
* 시간 11초: 다른 액션 → 캐시 만료 → 재검증 (새로운 10초 TTL 시작)

#### 캐시 무효화 전략

**권한 변경 시 즉시 캐시 무효화**:

```typescript
// 멤버 추가/제거 시
await redis.del(`page-access:${userId}:*`); // 해당 사용자의 모든 권한 캐시 무효화

// 워크스페이스 초대/제거 시
await redis.del(`page-access:${userId}:*:${workspaceId}:*`); // 해당 워크스페이스 캐시만 무효화
```

**장점**:
* 권한 변경 즉시 반영 (TTL 대기 불필요)
* 보안 강화

**주의사항**:
* Redis 와일드카드 삭제는 `SCAN` + `DEL` 조합 필요
* 프로덕션 환경에서는 `KEYS` 명령 대신 `SCAN` 사용 권장 (성능 이슈)

### 6.5 Redis 인프라

#### Redis 클라우드 옵션

**1. Upstash Redis (권장)**

**특징**:
* Vercel Edge Network와 통합 (전 세계 분산)
* Serverless 환경 최적화 (HTTP/REST API 제공)
* 무료 티어: 10,000 commands/day
* 요금: $0.2 per 100K commands

**위치**: 전 세계 Edge 로케이션 (미국, 유럽, 아시아 등)

**2. Vercel KV**

**특징**:
* Vercel 네이티브 통합
* 내부적으로 Upstash Redis 사용
* 무료 티어: 30,000 commands/month
* 요금: Upstash보다 약간 높음

**3. AWS ElastiCache**

**특징**:
* Vercel과 연결 복잡 (VPC Peering 필요)
* 비용이 더 높음
* 관리 부담 증가

#### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────┐
│                    사용자 (Client)                    │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS
                    ↓
┌─────────────────────────────────────────────────────┐
│              Vercel Edge Network                     │
│  ┌──────────────────────────────────────────────┐  │
│  │     Next.js App (Serverless Functions)       │  │
│  │                                               │  │
│  │  ┌──────────────────────────────────┐        │  │
│  │  │   Server Action                  │        │  │
│  │  │   (getCanvasViewAction)          │        │  │
│  │  └────┬──────────────────┬──────────┘        │  │
│  │       │                  │                    │  │
│  │       │ 1. Check Cache   │ 2. DB Query        │  │
│  │       ↓                  ↓                    │  │
│  │  ┌────────────┐     ┌──────────────┐        │  │
│  │  │   Redis    │     │   Supabase   │        │  │
│  │  │  (Upstash) │     │  PostgreSQL  │        │  │
│  │  └────────────┘     └──────────────┘        │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                외부 클라우드 서비스                   │
│  ┌──────────────────┐    ┌──────────────────┐    │
│  │  Upstash Redis   │    │   Supabase       │    │
│  │  (전 세계 분산)   │    │   (PostgreSQL)   │    │
│  └──────────────────┘    └──────────────────┘    │
└─────────────────────────────────────────────────────┘
```

#### 비용 예측 (MAU 5만명 기준)

**Upstash Redis**:
* 명령어 수: 5만 MAU × 평균 100 Server Actions/MAU = 500만 commands/month
* 무료: 10,000 commands/day × 30일 = 30만 commands/month
* 유료: 470만 commands = 47 × 100K = 47 × $0.2 = **$9.4/월**

**Vercel KV**:
* 무료: 30,000 commands/month
* 유료: 470만 commands = 470 × 10K = 470 × $0.25 = **$117.5/월**

**결론**: **Upstash Redis가 훨씬 저렴** (약 12배 차이)

### 6.6 최종 권장 방안

**구현 순서**:
1. `auth-cache.service.ts` 생성 (getCached, setCached)
2. `getCanvasViewAction`에 캐싱 로직 추가
3. TTL: 10초로 시작 (나중에 조정 가능)
4. 멤버 추가/제거 시 캐시 무효화 추가

**예상 효과**:
* DB 쿼리 50-87.5% 감소 (사용 패턴에 따라 다름)
* Supabase Egress 대폭 절감
* 보안 유지 (인증은 항상 수행)
* 권한 변경 즉시 반영 (캐시 무효화)

**Redis 비용**: 약 **$9.4/월** (Upstash Redis 기준)

---

## 7. 최적화 효과 종합

### 7.1 예상 절감액

| 최적화 항목 | 월 절감액 | 우선순위 |
|-----------|---------|---------|
| Canvas 데이터 Redis 캐싱 | $157.5 | High |
| Profile 정보 최적화 | $56.25 | High |
| 드래그/콘텐츠 업데이트 디바운스 | $3,500 (추정) | Medium |
| 권한 검증 Redis 캐싱 | - | High (쿼리 감소) |
| **Redis 비용** | **-$9.4** | - |
| **총 절감액** | **약 $3,704** | - |

*주: 드래그/콘텐츠 업데이트 디바운스의 절감액은 추정치이며, 실제 Vercel 함수 호출 비용 기준으로 조정 필요*

### 7.2 우선순위별 구현 계획

**High Priority**:
1. Canvas 데이터 Redis 캐싱
2. Profile 정보 최적화
3. 권한 검증 Redis 캐싱

**Medium Priority**:
4. 드래그/노트뷰 콘텐츠 업데이트 디바운스

**Low Priority**:
5. 캔버스 뷰포트 기반 레이지 로딩 (장기 계획)

---

## 참고 자료

[1]: https://supabase.com/pricing "Pricing & Fees | Supabase"
[2]: https://vercel.com/pricing "Vercel Pricing: Hobby, Pro, and Enterprise plans"
[3]: https://www.reddit.com/r/nextjs/comments/12dngvg/small_mistake_leads_to_3000_bill_from_vercel_and/?utm_source=chatgpt.com "Small mistake leads to $3000 bill from Vercel"
[4]: https://www.sanity.io/answers/discussion-about-estimating-billing-and-preventing-surprise-charges-with-vercel-and-sanity-hosting-services?utm_source=chatgpt.com "Sanity & Vercel pricing discussion"
[5]: https://www.reddit.com/r/Supabase/comments/1e4ly5y/supabase_egress_is_going_102/?utm_source=chatgpt.com "Supabase Egress discussion"
