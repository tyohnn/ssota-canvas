
좋아. 네 말대로 **“몇 % 원가(=변동비)까지 포함으로 줄 건지”**만 정하면 되는 구조라면, **크레딧을 ‘원가 단위’로 딱 일치**시키는 게 제일 깔끔해.

아래는 “그 작업부터” 다시 정리한 **원가 일치형 Credit 시스템**(=Cost Credits) 설계야.

---

# 1) 크레딧 정의를 “원가 단위”로 고정

## ✅ Cost Credit

* **1 credit = $0.001 원가(우리 비용)**
* 어떤 작업이든 **실제 원가를 $로 추정 → /0.001 → 올림(ceil)** 해서 차감
* “50% 마진(=2배)”은 **크레딧을 파는 가격**에서 만든다:

  * 예: **1 credit 판매가 = $0.002** (원가 $0.001 → 마진 50%)

즉,

* 내부 회계/차감: **원가 기반**
* 과금/수익: **판매가(마진) 기반**

---

# 2) 요청한 오버헤드 반영(시스템 2000 + reasoning 500)

가정(너가 준 전제 포함):

* 매 요약 호출마다 기본 오버헤드:

  * **input +2000 tokens**
  * **output +500 tokens(reasoning)**
* 콘텐츠 분량(평균):

  * YouTube 5분: in 1200 / out 300
  * Text PDF 1p: in 800 / out 200
* Grok 4.1 fast 단가(너가 쓰는 기준): input $0.20/M, output $0.50/M

---

# 3) 단위당 “원가 기반” 크레딧 차감표 (5분 기준 포함)

아래는 **원가를 계산한 뒤 → 1 credit=$0.001로 변환**한 결과야.

### A) YouTube (5분)

* LLM 비용:

  * in: (1200+2000)=3200 → $0.00064
  * out: (300+500)=800 → $0.00040
  * 합 $0.00104
* ZenRows 추출비(보수적으로 5분당 1회 잡으면):

  * $69 / 250K ≈ $0.00028
* 총 원가 ≈ **$0.00132**
* 크레딧 = ceil(0.00132 / 0.001) = **2 credits**

✅ **YouTube 5분 = 2 credits**

---

### B) Audio / Video 업로드 (5분)

* ElevenLabs STT (Pro 구간): $0.33/hr → 5분 = **$0.0275**
* * LLM 요약 $0.00104
* 총 원가 ≈ **$0.02854**
* 크레딧 = ceil(28.54) = **29 credits**

✅ **Audio 5분 = 29 credits**
✅ **Video(업로드) 5분 = 29 credits**

---

### C) Text PDF (1 page)

* LLM:

  * in: (800+2000)=2800 → $0.00056
  * out: (200+500)=700 → $0.00035
  * 합 $0.00091
* 크레딧 = ceil(0.00091/0.001) = **1 credit**

✅ **Text PDF 1페이지 = 1 credit**

---

### D) Image PDF(OCR+요약) (1 page)

(보수적 가정: 이미지 input 10,000 tokens)

* OCR(vision):

  * in: (10,000+2,000)=12,000 → $0.00240
  * out: (800+500)=1,300 → $0.00065
  * 합 $0.00305
* * 요약(Text PDF 1p) $0.00091
* 총 원가 ≈ **$0.00396**
* 크레딧 = ceil(3.96) = **4 credits**

✅ **Image PDF 1페이지 = 4 credits**

---

### E) Link (1 page)

여기만 Firecrawl 월 가격이 명시되어야 “원가 일치”가 완벽해져.
일단 너가 예전에 말한 **100,000 pages / month**만 확정이니, 아래처럼 적을게:

* Firecrawl 추출원가/페이지 = **(월요금 / 100,000)**
* * 요약(Text PDF 1p급) $0.00091

예를 들어 Firecrawl이 월 $83이면:

* 추출: $0.00083 + $0.00091 = $0.00174
* 크레딧 = ceil(1.74) = **2 credits**

✅ **Link 1페이지 = 2 credits (Firecrawl이 월 $83일 때)**
(월요금이 다르면 여기만 자동으로 바뀜)

---

### F) 문서 URL (PDF / Excel / Word via Firecrawl Document Parsing)

Firecrawl Document Parsing: URL이 `.pdf`, `.xlsx`, `.docx` 등 문서 파일을 가리키면 자동 파싱. [문서](https://docs.firecrawl.dev/features/document-parsing).

* Firecrawl: 1 credit/page (PDF) 또는 1 credit/file (Excel/Word) → $0.00083
* LLM 요약: $0.00091 (Text PDF 1p급)
* 총 원가 ≈ $0.00174 → **2 credits**

✅ **문서 URL 1페이지(또는 1파일) = 2 credits** (Link와 동일)
* 업로드 후 처리(Text PDF)는 Firecrawl 미사용 → 1 credit 유지.

---

## ✅ 최종 차감표(원가 일치형, 오버헤드 포함)

| 타입             |     단위 |                     차감(credits) |
| -------------- | -----: | ------------------------------: |
| YouTube        |     5분 |                           **2** |
| Audio          |     5분 |                          **29** |
| Video(업로드)     |     5분 |                          **29** |
| Text PDF       | 1 page |                           **1** |
| Image PDF(OCR) | 1 page |                           **4** |
| Link           | 1 page | **2** *(Firecrawl $83/100k 가정)* |
| 문서 URL(PDF/Excel/Word) | 1 page 또는 1 file | **2** *(Firecrawl Document Parsing)* |

---

# 4) “플랜 요금의 X%를 인덱싱 원가로 제공” → 포함 크레딧 산정

이제부터는 완전 단순해져.

## 공식

* 월 인덱싱 원가예산 = **플랜가격 × X%**
* 제공 Indexing credits = **(플랜가격 × X%) / $0.001**

  * 즉, **플랜가격($) × X% × 1000**

예: X=10%라면

* Plus $10 → $1 예산 → **1,000 indexing credits**
* Pro $60 → $6 예산 → **6,000 indexing credits**
* Ultra $200 → $20 예산 → **20,000 indexing credits**

그리고 UI 버킷 분리(예: 70/30)를 유지하려면:

* Indexing credits는 위 숫자 그대로
* Flexible credits는 “별도 예산(Y%)”로 또 정하면 됨(혹은 플랜에 포함)

---

# 5) (예시) X=10%일 때, 플랜별 인덱싱 크레딧으로 “한 종류만” 쓰면?

여기서는 **Indexing credits만**(10% 예산) 쓴다고 가정.

## Plus: 1,000 indexing credits

* YouTube: 1,000 / 2 = **500개(5분)** = **2,500분 = 41.7시간**
* Audio: 1,000 / 29 = **34개(5분)** = **170분 = 2.83시간**
* Video: 동일 **2.83시간**
* Text PDF: **1,000 pages**
* Image PDF: 1,000 / 4 = **250 pages**
* Link: 1,000 / 2 = **500 pages**

## Pro: 6,000 indexing credits

* YouTube: **3,000개(5분)** = **250시간**
* Audio/Video: 6,000/29=**206개(5분)** = **17.2시간**
* Text PDF: **6,000 pages**
* Image PDF: **1,500 pages**
* Link: **3,000 pages**

## Ultra: 20,000 indexing credits

* YouTube: **10,000개(5분)** = **833.3시간**
* Audio/Video: 20,000/29=**689개(5분)** = **57.4시간**
* Text PDF: **20,000 pages**
* Image PDF: **5,000 pages**
* Link: **10,000 pages**

---

# 다음으로 결정할 것(딱 2개)

1. 플랜별 “인덱싱 원가 예산 비율 X%”를 얼마로 둘지

   * 10% / 15% / 20% 중 택1이면 됨
2. Flexible credits는 플랜 가격에서 별도 비율(Y%)로 줄지, 또는 작게 고정 + 애드온 유도할지

원하면 내가 **X=10% / 15% / 20%** 3가지 버전으로,

* 플랜별 Indexing credits,
* 그 크레딧으로 가능한 “유튜브/오디오/PDF” 처리량
  을 한 장 표로 나란히 만들어줄게.

좋아. **크레딧을 “예쁘게”** 아래처럼 고정하고(Free 100 / Plus 2,000 / Pro 10,000 / Ultra 40,000), 그 기준으로 **공헌이익(=순매출−변동비)**과 **블록 타입별 최대 인덱싱 가능량**을 한 번에 정리해줄게.

아래 계산은 **너랑 방금까지 합의한 전제** 그대로 썼어:

* 가격은 **VAT 10% 포함** → **순매출(Net)=가격/1.1**
* Stripe(가정): **3.4% + $0.50** (보수적)
* Supabase Storage 단가(초과 단가로 포함분 계산): **$0.021/GB-month**
* Egress 단가(표준 혼합): cached 70% / uncached 30% → 평균 **$0.048/GB**
* Bandwidth 포함량: **Starter 20GB / Plus 50GB / Pro 100GB / Ultra 300GB** (Free 1GB)
* **원가 일치형 크레딧:** **1 credit = $0.001 (우리 원가)**
* 크레딧 버킷: **Indexing 50% / Flex 50%** (UI 분리용)

---

## 1) 플랜별 크레딧(예쁜 숫자 버전)

| Plan    | Price (VAT incl.) | Total credits/mo | Indexing credits | Flex credits |
| ------- | ----------------: | ---------------: | ---------------: | -----------: |
| Free    |                $0 |              100 |               50 |           50 |
| Starter |               $10 |            2,000 |            1,000 |        1,000 |
| Plus    |               $30 |            6,000 |            3,000 |        3,000 |
| Pro     |               $60 |           10,000 |            5,000 |        5,000 |
| Ultra   |              $200 |           40,000 |           20,000 |       20,000 |

---

## 2) 공헌이익 계산표 (변동비 & 변동비 제외 이익)

### 포함 제공량(보수적: “전부 다 쓴다” 가정)

* Storage: Starter 10GB / Plus 50GB / Pro 100GB / Ultra 500GB (Free 0.3GB)
* Egress: Starter 20GB / Plus 50GB / Pro 100GB / Ultra 300GB (Free 1GB)
* Credits 원가: Total credits × $0.001 (전부 사용)

| Plan    | Net revenue (Price/1.1) | Stripe fee | Storage cost | Egress cost | Credits COGS | Variable cost total | Contribution profit |    Margin |
| ------- | ----------------------: | ---------: | -----------: | ----------: | -----------: | ------------------: | ------------------: | --------: |
| Free    |                   $0.00 |      $0.00 |        $0.01 |       $0.05 |        $0.10 |           **$0.16** |          **-$0.16** |         — |
| Starter |                   $9.09 |      $0.84 |        $0.21 |       $0.96 |        $2.00 |           **$4.01** |           **$5.08** | **55.9%** |
| Plus    |                  $27.27 |      $1.52 |        $1.05 |       $2.40 |        $6.00 |          **$10.97** |          **$16.30** | **59.8%** |
| Pro     |                  $54.55 |      $2.54 |        $2.10 |       $4.80 |       $10.00 |          **$19.44** |          **$35.11** | **64.4%** |
| Ultra   |                 $181.82 |      $7.30 |       $10.50 |      $14.40 |       $40.00 |          **$72.20** |         **$109.62** | **60.3%** |

**해석**

* 이 표는 “포함량을 고객이 매달 꽉 채워 쓴다”는 **최악에 가까운 보수적 계산**이라 실제는 보통 마진이 더 좋아져.
* Plus는 Stripe 고정수수료($0.50)의 영향이 커서 마진이 상대적으로 눌리는 구조.

### 마진 요약 (보수적 가정: 100% 사용 시)

| Plan    | 순매출   | 변동비   | 공헌이익 | **마진** |
| ------- | -------: | ------: | -------: | -------: |
| Free    |   $0.00 |   $0.16 |   -$0.16 |       — |
| Starter |   $9.09 |   $4.01 |    $5.08 | **55.9%** |
| Plus    |  $27.27 |  $10.97 |   $16.30 | **59.8%** |
| Pro     |  $54.55 |  $19.44 |   $35.11 | **64.4%** |
| Ultra   | $181.82 |  $72.20 |  $109.62 | **60.3%** |

> 유료 플랜 기준 **55~64%** 공헌마진. 실제 사용량이 100% 미만이면 마진은 더 올라간다.

---

## 3) 블록 타입별 “최대 인덱싱 가능량” (Indexing credits만 쓴다고 가정)

여기서는 너가 확정한 **오버헤드 포함 원가일치형 차감표**를 그대로 썼어:

### 인덱싱 크레딧 차감표(원가 일치형)

* YouTube: **5분 = 2 credits**
* Audio: **5분 = 29 credits**
* Video(업로드): **5분 = 29 credits**
* Text PDF: **1 page = 1 credit**
* Image PDF(OCR): **1 page = 4 credits**
* Link(Web page): **1 page = 2 credits**
* 문서 URL(PDF/Excel/Word): **1 page 또는 1 file = 2 credits**

### 플랜별 Indexing credits

* Free 50 / Starter 1,000 / Plus 3,000 / Pro 5,000 / Ultra 20,000

---

### A) YouTube (5분=2 credits)

| Plan    | Indexing credits | 5분 단위 개수 |             총 분량 |
| ------- | ---------------: | -------: | ---------------: |
| Free    |               50 |      25개 |      125분 (2.1h) |
| Starter |            1,000 |     500개 |   2,500분 (41.7h) |
| Plus    |            3,000 |   1,500개 |   7,500분 (125h) |
| Pro     |            5,000 |   2,500개 | 12,500분 (208.3h) |
| Ultra   |           20,000 |  10,000개 | 50,000분 (833.3h) |

---

### B) Audio (5분=29 credits)

| Plan    | Indexing credits | 5분 단위 개수 |           총 분량 |
| ------- | ---------------: | -------: | -------------: |
| Free    |               50 |       1개 |             5분 |
| Starter |            1,000 |      34개 |    170분 (2.8h) |
| Plus    |            3,000 |     103개 |    515분 (8.6h) |
| Pro     |            5,000 |     172개 |   860분 (14.3h) |
| Ultra   |           20,000 |     689개 | 3,445분 (57.4h) |

※ Video(업로드)도 동일 (5분=29 credits)

---

### C) Text PDF (1p=1 credit)

| Plan    | Indexing credits |  최대 페이지 |
| ------- | ---------------: | ------: |
| Free    |               50 |     50p |
| Starter |            1,000 |  1,000p |
| Plus    |            3,000 |  3,000p |
| Pro     |            5,000 |  5,000p |
| Ultra   |           20,000 | 20,000p |

---

### D) Image PDF / OCR (1p=4 credits)

| Plan    | Indexing credits | 최대 페이지 |
| ------- | ---------------: | -----: |
| Free    |               50 |    12p |
| Starter |            1,000 |   250p |
| Plus    |            3,000 |   750p |
| Pro     |            5,000 | 1,250p |
| Ultra   |           20,000 | 5,000p |

---

### E) Link (1p=2 credits)

| Plan    | Indexing credits |  최대 페이지 |
| ------- | ---------------: | ------: |
| Free    |               50 |     25p |
| Starter |            1,000 |    500p |
| Plus    |            3,000 |  1,500p |
| Pro     |            5,000 |  2,500p |
| Ultra   |           20,000 | 10,000p |

---

## 빠르게 결론

* “예쁜 크레딧” 버전(2,000 / 10,000 / 40,000)으로 바꿔도 **공헌이익률이 Pro/Ultra 기준 65% 안팎**으로 유지돼서 꽤 건강한 편이야(보수적 계산에서도).
* 인덱싱 체감은 **YouTube/텍스트 PDF는 엄청 넉넉**, **Audio/Video(STT)는 상대적으로 빡세게** 설계되어 있어서, 자연스럽게 “STT-heavy 유저는 크레딧 애드온 구매”로 업셀이 걸리는 구조가 돼.

원하면 다음으로, 이 “예쁜 크레딧” 기준에서 **Add-on 크레딧 팩(가격/할인/연간/대량)**까지 붙여서 **최종 Pricing 페이지 표**로 완성해줄게.

----
아래는 **너가 붙여준 “플랜표 양식” 그대로** 맞춰서, **최종 버전(크레딧 예쁜 숫자 / Bandwidth 5·20·100·300GB / Add-on 크레딧 마진 80%)**로 다시 작성한 거야.

핵심 반영:

* **Total credits / month**: **100 / 2,000 / 10,000 / 40,000**
* **Single currency** (UI만 2 buckets)
* **Bandwidth quota**: **Free 5GB / Plus 20GB / Pro 100GB / Ultra 300GB**
* **Add-on credits 마진 80%** → (원가 일치형) *1 credit 원가 $0.001* 가정 시, **판매가 $0.005 / credit**

좋아. 아래는 **방금 만든 최종 플랜표 양식**은 그대로 유지하면서, 전환율 나오게 **각 플랜별 “대표 사용 예시(유튜브/오디오/PDF/이미지PDF/링크)”** 카피를 붙인 버전이야.
(예시는 **Indexing credits만 100% 인덱싱에 쓴 최대치** 기준)

> 인덱싱 차감 기준(요약):
> YouTube **5분=2 credits**, Audio/Video **5분=29**, Text PDF **1p=1**, Image PDF **1p=4**, Link **1p=2**

---

## SSOTA Pricing (Org-based, no per-seat fee)

Billing unit: Organization (flat monthly fee)
Members limit: Free 1 / Plus 3 / Pro 10 / Ultra 50
Guests limit: Free 10 / Plus 50 / Pro 250 / Ultra 250+
Workspaces: Unlimited (all plans)
Blocks: Free 100 / others Unlimited
Credits: Base monthly allowance + add-ons (**single currency**, UI shows 2 buckets)
Indexing: Auto “extract + summarize” (BM25 search). Vector embeddings not included.

---

### 0) Price

| Plan    | Monthly price |
| ------- | ------------- |
| Free    | $0            |
| Starter | $10 / org     |
| Plus    | $30 / org     |
| Pro     | $60 / org     |
| Ultra   | $200 / org    |

---

## 🔥 Plan Highlights (what you can do each month)

🔥 Plan Highlights (what you can index each month)

Indexing cost (recap):
YouTube 5 min = 2 credits
Audio 5 min = 29 credits / Video 5 min = 29 credits
Text PDF 1 page = 1 credit
Image PDF / Slides 1 page(or slide) = 4 credits
Link 1 page = 2 credits
문서 URL(PDF/Excel/Word) 1 page 또는 1 file = 2 credits

Free ($0)
- Indexing credits 50 →
- YouTube ~2.1 hours, or
- Audio/Video ~9 minutes, or
- Text PDF 50 pages, or
- Image PDF / Slides 12 pages, or
- Links 25 pages
개인용/가벼운 테스트에 최적. 인덱싱 결과 30일 유지

Starter ($10/org)
- Indexing credits 1,000 →
- YouTube ~42 hours, or
- Audio/Video ~2.9 hours, or
- Text PDF 1,000 pages, or
- Image PDF / Slides 250 pages, or
- Links 500 pages
소규모 팀이 “자료 모으고 검색/요약”하기에 딱 좋은 기본형

Pro ($60/org)
- Indexing credits 5,000 →
- YouTube ~208 hours, or
- Audio/Video ~14 hours, or
- Text PDF 5,000 pages, or
- Image PDF / Slides 1,250 pages, or
- Links 2,500 pages
팀 단위 운영/워크플로우에 적합. 풀 자동화(스케줄/트리거) 지원

Ultra ($200/org)
- Indexing credits 20,000 →
- YouTube ~833 hours, or
- Audio/Video ~57 hours, or
- Text PDF 20,000 pages, or
- Image PDF / Slides 5,000 pages, or
- Links 10,000 pages
대규모 지식 인입 + 퍼블리싱/공유 트래픽까지 커버하는 확장형

---

### 1) Workspaces & Collaboration (Org Ops)

| Workspaces & Collaboration |      Free |    Starter |      Plus |       Pro |     Ultra |
| -------------------------- | --------: | ---------: | --------: | --------: | --------: |
| Workspaces                 | Unlimited |  Unlimited | Unlimited | Unlimited | Unlimited |
| Members (team seats)       |         1 |          3 |         5 |        10 |        50 |
| Guests                     |        10 |         50 |       100 |       250 |      250+ |
| Blocks (cumulative)        |       100 |  Unlimited | Unlimited | Unlimited | Unlimited |

---

### 2) Storage & Upload

| Storage & Upload           |  Free | Starter |      Plus |       Pro |     Ultra |
| -------------------------- | ----: | ------: | --------: | --------: | --------: |
| Org storage (cumulative)   | 300MB |    10GB |      50GB |     100GB |     500GB |
| Max upload size (per file) |   5MB |    25MB | Unlimited | Unlimited | Unlimited |

---

### 3) Indexing (Auto extract + summarize) — SSOTA Core

Indexing = text extraction + summary (for BM25 search + agent readability).
If you exceed the monthly auto indexing allowance, blocks are still saved but become **Unindexed** (searchable only by title/tags/manual notes). You can **Pay-to-index** using credits.

| Indexing                                              |               Free |            Starter |               Plus |                Pro |              Ultra |
| ----------------------------------------------------- | -----------------: | -----------------: | -----------------: | -----------------: |
| Indexed retention                                     |            30 days |          Unlimited |          Unlimited |          Unlimited |
| Auto indexing limit (monthly)                         |   (see next table) |   (see next table) |   (see next table) |   (see next table) |
| Over-limit behavior                                   | Saved as Unindexed | Saved as Unindexed | Saved as Unindexed | Saved as Unindexed |
| Pay-to-index with credits                             |                  ✅ |                  ✅ |                  ✅ |                  ✅ |
| Advanced block features (was “advanced summary mode”) |            Limited |               Some |                  ✅ |                  ✅ |

---

### 4) Upload & Processing Quotas (Monthly Auto Indexing)

This is the monthly allowance for auto indexing expressed in user-friendly units (hours/pages/chars).
**Implementation note:** auto-indexing consumes **Indexing credits** first; the below is a **typical equivalent**.

| Monthly auto indexing quota (typical equivalent) |     Free |    Starter |      Plus |       Pro |      Ultra |
| ------------------------------------------------ | -------: | ---------: | --------: | --------: | ---------: |
| Audio/Video (transcribe + summarize)             |  ~10 min |    ~3 hrs |   ~8.6 hrs |   ~14 hrs |    ~57 hrs |
| Documents (PDF/DOCX/PPT)                         |   50 pgs | 1,000 pgs | 3,000 pgs | 5,000 pgs | 20,000 pgs |
| Text input (paste/scrape)                        | ~200k ch |    ~4M ch |   ~12M ch |   ~20M ch |    ~80M ch |

> “Text chars” is an approximate equivalent (varies by language, formatting, and prompt size).

---

### 5) Credits (Usage-based) — **single currency, shown as 2 buckets**

Credits cover: agent chat, tool calls, block actions, sub-agent runs, and on-demand indexing.
UI shows two “buckets”, but it’s one currency under the hood.

| Credits                                                                 |    Free |            Starter |               Plus |        Pro |      Ultra |
| ----------------------------------------------------------------------- | ------: | -----------------: | -----------------: | ---------: | ---------: |
| **Indexing credits / month** *(auto indexing uses this first)*          |  **50** |          **1,000** |          **3,000** |  **5,000** | **20,000** |
| **Flexible credits / month** *(chat/actions/automation + pay-to-index)* |  **50** |          **1,000** |          **3,000** |  **5,000** | **20,000** |
| **Total credits / month**                                               | **100** |          **2,000** |          **6,000** | **10,000** | **40,000** |
| Credit add-ons                                                          |       ✅ |                  ✅ |                  ✅ |          ✅ |          ✅ |
| Premium model access                                                    |       X |         (준비중) |         (준비중) |  (준비중) |  (준비중) |

> Optional setting: “When indexing credits run out, use flexible credits automatically.” (default OFF)

---

### 5.1) Credit Add-ons (80% margin) ✅

* 원가 일치형 가정: **1 credit = $0.001 cost**
* 마진 80% 목표 → **판매가 $0.005 / credit**

| Add-on pack |   Credits | Price (target, 80% margin) |
| ----------- | --------: | -------------------------: |
| Starter     |     1,000 |                         $5 |
| Builder     |    10,000 |                        $50 |
| Team        |    50,000 |                       $250 |
| Studio      |   200,000 |                     $1,000 |
| Scale       | 1,000,000 |                     $5,000 |

---

### 6) Sub-agents (Workflows) & Automation

Sub-agents are available in all plans. Scheduling & triggers start at Pro.
Marketplace publishing/selling is available to everyone (policy-based).

| Sub-agents & Automation             | Free | Starter | Plus | Pro | Ultra |
| ----------------------------------- | ---: | ------: | ---: | --: | ----: |
| Create & run sub-agents (manual)    |    ✅ |      ✅ |    ✅ |   ✅ |     ✅ |
| Sub-agent count (org)               |    3 |      20 |   50 | 200 | 2,000 |
| Schedules (cron)                    |    X |       X | Limited |   ✅ |     ✅ |
| Triggers (event-based)              |    X |       X | Limited |   ✅ |     ✅ |
| Marketplace: share / publish / sell |    ✅ |      ✅ |    ✅ |   ✅ |     ✅ |

---

### 7) Sharing & Publishing

| Sharing & Publishing    | Free | Starter | Plus | Pro | Ultra |
| ----------------------- | ---- | ------ | ---- | --- | ----- |
| Share link (read-only)  | ✅    | ✅      | ✅    | ✅   | ✅     |
| Export (PDF etc.)       | X    | ✅      | ✅    | ✅   | ✅     |
| Password/expiry options | X    | Some   | Some | ✅   | ✅     |

---

### 8) Bandwidth Quota (Sharing traffic)

This is the real “collaboration cost” driver (downloads, embeds, public shares).
If exceeded, you can buy Bandwidth packs (or temporarily throttle public links).

| Bandwidth (monthly)      | Free | Starter | Plus |   Pro | Ultra |
| ------------------------ | ---: | ------: | ---: | ----: | ----: |
| Included bandwidth quota |  1GB |   20GB | 50GB | 100GB | 300GB |
| Bandwidth add-ons        |    ✅ |      ✅ |    ✅ |     ✅ |     ✅ |

---

## ✅ One-page Summary

| Summary                      | Free ($0) | Starter ($10/org) | Plus ($30/org) | Pro ($60/org) | Ultra ($200/org) |
| ---------------------------- | --------: | -----------------: | --------------: | ------------: | ----------------: |
| Members                      |         1 |                  3 |               5 |            10 |                50 |
| Guests                       |        10 |                 50 |             100 |           250 |              250+ |
| Workspaces                   | Unlimited |      Unlimited |     Unlimited |        Unlimited |
| Blocks (cumulative)          |       100 |      Unlimited |     Unlimited |        Unlimited |
| Storage (cumulative)         |     300MB |               10GB |             50GB |         100GB |             500GB |
| Max upload size              |       5MB |           25MB |     Unlimited |        Unlimited |
| Bandwidth / month            |       1GB |               20GB |             50GB |         100GB |             300GB |
| Indexed retention            |   30 days |      Unlimited |     Unlimited |        Unlimited |
| **Indexing credits / month** |    **50** |          **1,000** |        **3,000** |     **5,000** |         **20,000** |
| **Flexible credits / month** |    **50** |          **1,000** |        **3,000** |     **5,000** |         **20,000** |
| **Total credits / month**    |   **100** |          **2,000** |        **6,000** |    **10,000** |         **40,000** |
| Premium models               |         X |          (준비중) |      (준비중) |    (준비중) |        (준비중) |
| Sub-agent count              |         3 |                 20 |              50 |           200 |             2,000 |
| Schedules & triggers         |         X |                  X |         Limited |             ✅ |                 ✅ |

---

원하면 다음으로 “Highlight” 섹션을 더 전환율 높게 다듬어서, 예를 들면:

* Plus: “**유튜브 40시간 인덱싱**으로 팀 지식베이스 만들기”
* Pro: “**자동화로 매주 리서치/요약을 캔버스에 적재**”
* Ultra: “**퍼블리싱/공유 트래픽까지 포함한 운영형 플랜**”

같은 **랜딩페이지용 짧은 카피 2~3개 버전**도 바로 만들어줄게.
