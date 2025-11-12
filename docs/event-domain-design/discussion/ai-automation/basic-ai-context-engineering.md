# 기본 AI - 컨텍스트 엔지니어링 설계

**작성일**: 2025-11-11  
**상태**: 설계 논의 중  
**관련 기능**: 기본 AI (캔버스 소통 담당)

---

## 📋 목차

1. [AI 기능 전체 구조](#ai-기능-전체-구조)
2. [기본 AI의 목표와 철학](#기본-ai의-목표와-철학)
3. [UX 레벨 정의](#ux-레벨-정의)
4. [컨텍스트의 종류](#컨텍스트의-종류)
5. [현재 상태 요약](#현재-상태-요약)
6. [전반적인 평가](#전반적인-평가)
7. [실제 유스케이스 시나리오](#실제-유스케이스-시나리오)
8. [검토 포인트](#검토-포인트)
9. [다음 단계](#다음-단계)

---

## AI 기능 전체 구조

쏘타 서비스는 AI 기능을 3가지로 구분:

### 1. 기본 AI (Basic AI)
**역할**: 캔버스에서 소통 담당  
**특징**: 컨텍스트 자동 추론 및 전달, 짧은 응답 + 행동 트리거

### 2. 블럭 액션 AI (Block Action AI)
**역할**: 1회성 AI 함수 실행  
**예시**: 
- 스크립트 추출
- 요약
- 코드 작성
- 이미지 생성 등

**기본 AI와의 관계**:
- 기본 AI는 블럭 액션 AI를 **트리거**하는 역할
- 예: "이 코드 리팩터해줘" → 기본 AI가 컨텍스트 파악 → 블럭 액션 AI 실행

### 3. AI 워크플로우 (AI Workflow)
**역할**: 복잡한 AI 자동화  
**특징**:
- 커스텀 프롬프트 설정
- 인풋/아웃풋 블럭 설정
- KNOWLEDGE/TOOL 세팅
- 자동 스케줄링 실행

> 📝 **현재 문서의 범위**: 이 문서는 **기본 AI**의 컨텍스트 엔지니어링을 다룸

---

## 기본 AI의 목표와 철학

### 핵심 목표
**"커서(Cursor IDE)처럼 캔버스에서 컨텍스트를 자동으로 찾고 세팅하기"**

- Cursor가 IDE에서 컨텍스트를 자동으로 찾고 세팅하듯
- 쏘타는 캔버스에서 다형성 블럭, 정형 데이터 등 필요한 컨텍스트를 자동으로 전달
- 다양한 데이터 타입과 워크플로우 지원

### 초기 [컨텍스트 추가] 아이디어

1. **주변 블럭 추가하기**  
   공간적으로 가까운 블럭들을 컨텍스트에 포함

2. **의미적 연결된 블럭 추가하기**  
   **엣지(Edge)**로 연결된 블럭들을 탐색. 엣지에는 **라벨**이 있어서 의미적 연결을 표현함  
   예: "causes", "references", "depends_on", "summary_of" 등

3. **선택/멀티선택 추가하기**  
   사용자가 명시적으로 선택한 블럭들

4. **상황에 맞는 툴을 시맨틱으로 찾아서 연결된 블럭/컴포넌트 검색**  
   작업 의도에 맞는 블럭 액션/툴 발견

5. **대화내용을 시맨틱으로 검색해서 넣기 (기간에 따라 가중치)**  
   과거 대화에서 관련된 내용 복원

---

## UX 레벨 정의

### 기본 원칙
> **"긴 답변"이 아니라 짧은 힌트 + 행동 트리거를 주고,  
> 실제 작업은 블럭/툴 레이어에서 일어나게 만든다.**

### 챗 UI의 문제점 (5번 아이디어와 관련)

#### 현재 챗 UI의 한계
- 챗 UI는 아웃풋을 뱉을 때 **너무 많은 내용**을 생성
- 우리는 실제로 **매번 보고서 형태로 대화를 주고받지 않음**
- 보고서/문서는 **이해도를 높이기 위한 도구**이지, 소통 순간에 활용되지 않음

#### 실제 업무 방식과의 비교
- 회의할 때 **긴 문서를 읽고 있는 사람** = 일을 잘 못하는 사람
- **문서는 회의 이전 또는 이후에 읽는 것**
- 즉, 챗 UI에서 아웃풋을 미친듯이 뱉는 것 = **좋은 회의 과정이 아님**

#### Bandwidth 불일치 문제
- **AI의 아웃풋** bandwidth vs **인간의 인풋** bandwidth가 맞지 않음
- 이로 인해 **병목(bottleneck)**이 발생

### 쏘타의 새로운 접근

#### 1️⃣ 기본 출력 형태 (휘발성 응답)

**최대 2줄 텍스트**
- **1줄**: 결론 / 제안
- **1줄**: 근거나 다음 액션 힌트

**예시**:
```
✅ 코드 리팩터링이 필요한 3개 블럭을 찾았어요.
💡 [관련 블럭 보기]로 확인하거나 [바로 적용]으로 실행하세요.
```

#### 2️⃣ 액션 칩 (컨텍스트/툴 브리지)

**액션 칩의 역할**:
- `[관련 블럭 보기]`
- `[바로 적용]`
- `[세부 보기]`

**클릭 시 동작**:
- 캔버스에서 해당 블럭/영역으로 **이동 또는 하이라이트**
- 또는, **블럭 액션/워크플로우 실행**

#### 3️⃣ 블럭 아웃풋으로 출력 (툴 레이어)

**결과가 "남아야" 하는 경우**:
- **새 블럭 생성**: 요약, 태스크 리스트, 코드, 이미지 등
- **기존 블럭 업데이트**: 코드 리팩터 결과 적용 등

**핵심 패턴**:
```
AI 응답 → 블럭/툴로 귀결
```

---

## 컨텍스트의 종류

### 2-1. 블럭 컨텍스트 (Sensor Score)

#### 기본 아이디어
캔버스 위 모든 블럭에 대해 **Sensor Score**를 계산해서,  
**"지금 이 발화에 중요한 것들만"** 모델에 전달

#### Sensor Score 구성 요소

##### 1. IntentMatch (의도 매칭)
- 현재 발화에서 **의도/작업 타입 추출**
- 블럭 타입/블럭 액션과의 **매칭 정도**로 가중치 부여

**예시**:
```
발화: "코드 리팩터해줘"
→ code 블럭 ↑
→ refactor 액션 스코어 ↑ -> 이 액션을 가진 블럭의 가중치가 높아짐
```

##### 2. SemanticSim (시맨틱 유사도)
- 발화 ↔ 블럭 내용/속성 간 **벡터 유사도**
- 발화 ↔ 블럭 타입 설명 간 유사도
- 발화 ↔ 블럭 액션 설명 간 유사도
- 발화 ↔ 엣지 설명 간 유사도

**목적**:
"이 내용을 해결할 수 있는" 블럭/액션을 찾고,  
그 블럭들을 **우선적으로 컨텍스트에 포함**

##### 3. Recency (최근성) - 클라이언트 계산
- 최근 편집/조회 시간 기반 감쇠
- 공식: `exp(-t/τ)` (t: 경과 시간, τ: 시간 상수)
- "방금/최근 본 것"에 더 높은 점수

##### 4. Proximity (근접성) - 클라이언트 계산
- 캔버스 **좌표 거리**
- 그룹/섹션 **소속 관계**
- 엣지 연결 **의미 관계**
- 시각적으로/논리적으로 가까운 블럭일수록 가중치 ↑

##### 5. Attention (주의도) - 클라이언트 계산
- **hover** 이벤트
- **선택/멀티선택**
- **스크롤 체류 시간**
- 사용자가 "신경 쓰고 있는" 블럭에 추가 보너스

#### Sensor Score 최종 계산

```
Sensor Score = 
  α₁ × IntentMatch +
  α₂ × SemanticSim +
  α₃ × Recency +
  α₄ × Proximity +
  α₅ × Attention
```

**결과**: 상위 N개 블럭만 모델 컨텍스트로 전송

---

### 2-2. 이전 대화 컨텍스트

#### 기존 LLM 패턴의 문제
- **세션 단위**(채팅방)로 메시지를 시간 순서로 쌓음
- 컨텍스트 윈도우만큼 잘라서 전달
- 시간이 지나면 **오래된 정보는 사라짐**

#### 쏘타의 접근

##### 저장 단위
**세션이 아니라 "페이지(노트)" 단위**로 모든 AI 발화를 저장

##### 컨텍스트 복원 방식

**1. 시맨틱 서치 (Semantic Search)**
- 현재 발화와 **관련 높은 과거 발화**들을 벡터 검색으로 찾기
- 주제 연관성 기반

**2. 기간 가중치 (Temporal Weighting)**
- **최근일수록 점수를 더 줌** (기억의 신선도)
- 공식: `semantic_score × exp(-t/τ)`

##### 철학적 배경
> "사람이 실제로 일하면서 기억/맥락을 되살리는 방식"과 유사

- 특정 회의록/대화를 **"회의 세션"으로만 보지 않음**
- 같은 주제에 대한 **과거 생각/대화**를 시맨틱 + 시간으로 재구성
- **비선형적 기억 복원**

---

### 2-3. Diff / 변경 이력 컨텍스트

#### 기본 방향

**"모든 것을 같은 데이터 레이어에 감사 로그처럼 저장"**

#### 이벤트 통합 저장

```typescript
Event = {
  type: 'edit' | 'chat' | 'move' | 'delete' | ...,
  payload: any,
  timestamp: number,
  blockId?: string,
  userId: string,
  // ...
}
```

**저장 대상**:
- 블럭 수정
- 채팅 발화
- 블럭 이동
- 속성 변경
- 등등...

#### 컨텍스트 복원 방식

**검색 쿼리**:
```
"이 페이지에서 이 주제에 대해 과거에 뭐라고 말하고/수정했지?"
```

**복원 방법**:
1. 시맨틱 서치로 관련 이벤트 찾기
2. 기간 가중치 적용
3. 필요한 이벤트만 시간 필터로 추출
4. 모델에 컨텍스트로 전달

#### 핵심 아이디어
- Diff를 따로 구조화해서 보내기보다는
- **"변경 과정 자체"를 하나의 연속된 시퀀스/지식**으로 관리
- 필요할 때 **검색 + 시간 필터**로 동적 복원

#### 🔶 미결정 사항
> "어떤 단위까지 diff를 노출할 것인가"는 아직 열려 있음

**기본 합의**:
"모든 편집/발화를 일관된 로그로 저장하고, 시맨틱+기간으로 뽑는다"

---

## 현재 상태 요약

### ✅ UX
- **"2줄 + 액션칩 + 블럭 아웃풋"**으로 짧게 말하고
- 캔버스에서 **행동하게** 만든다
- 챗 UI의 긴 응답 패턴을 탈피

### ✅ 블럭 컨텍스트
- **Sensor Score** 기반 (의도/시맨틱/최근/거리/주의)
- 캔버스 블럭을 자동 선택
- 상위 N개만 컨텍스트로 전송

### ✅ 대화 컨텍스트
- 세션 X → **페이지 단위**로 저장 O
- 시맨틱 + 시간 가중치로 **기억 복원**
- 비선형적 컨텍스트 재구성

### ✅ Diff/이력
- 블럭 수정과 채팅 발화를 **같은 이벤트 로그 레이어**로 관리
- 시맨틱 + 기간으로 **"과정까지"** 다시 꺼내 쓸 수 있게

---

## 전반적인 평가

### ✨ 핵심 강점

#### 1. **명확한 UX 철학과 차별화**
- 기존 챗 UI의 "긴 응답" 문제를 정확히 파악
- "2줄 + 액션칩 + 블럭 아웃풋" 패턴은 실제 업무 방식과 일치
- AI-인간 간 Bandwidth 불일치 문제를 해결하는 혁신적 접근
- **캔버스 중심 상호작용**으로 AI를 도구화

#### 2. **강력한 컨텍스트 시스템**
- **Sensor Score**: 5가지 요소(의도/시맨틱/최근/거리/주의)의 조합으로 정교한 컨텍스트 선택
- **비선형적 기억**: 세션이 아닌 시맨틱 + 시간 가중치 기반 기억 복원
- **통합 이벤트 로그**: 모든 수정/발화를 일관된 레이어로 관리
- **엣지 기반 의미 연결**: 블럭 간 관계를 라벨로 명시

#### 3. **확장 가능한 아키텍처**
- 기본 AI → 블럭 액션 AI → AI 워크플로우의 명확한 단계별 구조
- Command 패턴으로 복잡한 액션 체인 구성 가능
- 툴/액션 시스템과 자연스러운 통합
- 단순한 MVP에서 시작해 점진적 고도화 가능

#### 4. **실용적 구현 전략**
- 클라이언트/서버 역할 분담이 명확
- Pre-filtering으로 성능 문제 완화
- 휴리스틱 → 학습 기반 가중치로 점진적 발전
- Phase별 구현 우선순위가 합리적

### 🎯 핵심 경쟁력

이 설계가 기존 AI 도구들과 차별화되는 지점:

1. **컨텍스트 자동화의 질**
   - Cursor의 IDE 컨텍스트 자동 추론을 캔버스 환경으로 확장
   - 단순 "주변 텍스트"가 아닌 "의미/의도/관계" 기반 컨텍스트

2. **행동 중심 UX**
   - 긴 텍스트 응답 대신 → 짧은 힌트 + 실행 가능한 액션
   - AI가 "말하는" 것이 아니라 "돕는" 존재로 포지셔닝

3. **캔버스와의 깊은 통합**
   - 엣지, 블럭 타입, 툴/액션 등 캔버스 고유 요소 활용
   - AI 응답이 블럭으로 구체화되어 캔버스에 누적

4. **워크스페이스 전체를 지식 베이스화**
   - 페이지 경계를 넘어선 시맨틱 검색
   - 과거 작업/대화가 모두 AI의 컨텍스트로 활용 가능

### ⚠️ 주요 도전 과제

#### 1. **성능 최적화**
- 대규모 캔버스(수천 개 블럭)에서 실시간 Sensor Score 계산
- 벡터 검색 지연 시간 최소화
- 클라이언트 배터리/메모리 영향

**완화 전략**:
- Pre-filtering (viewport, 최근 N개)
- Debouncing (500ms idle)
- 점진적 컨텍스트 로딩

#### 2. **컨텍스트 정확도**
- Sensor Score 가중치 튜닝의 어려움
- 사용자 의도 오해 시 잘못된 블럭 선택
- 엣지 라벨의 일관성 문제

**완화 전략**:
- 컨텍스트 시각화로 투명성 확보
- 사용자 피드백 루프 (재선택 추적)
- 점진적 학습으로 개인화

#### 3. **데이터 볼륨 관리**
- 이벤트 로그 폭발
- 벡터 DB 크기 증가
- 스토리지/검색 비용

**완화 전략**:
- Event Importance 기반 필터링
- Retention Policy (시간 기반 압축/삭제)
- 샘플링 전략

#### 4. **사용자 학습 곡선**
- "2줄 응답"이 사용자에게 충분히 명확한가?
- 액션칩의 의미를 즉시 이해할 수 있는가?
- 워크플로우로의 전환 시점 인지

**완화 전략**:
- Onboarding 튜토리얼
- 컨텍스트 힌트 제공
- 점진적 기능 노출

### 📊 기술적 타당성

| 요소 | 타당성 | 비고 |
|------|--------|------|
| **Sensor Score 계산** | ⭐⭐⭐⭐ | Pre-filtering으로 충분히 구현 가능 |
| **벡터 검색** | ⭐⭐⭐⭐⭐ | pgvector로 MVP 가능, 성숙한 기술 |
| **Command 체인** | ⭐⭐⭐⭐⭐ | 명령 패턴의 표준적 활용 |
| **실시간 컨텍스트** | ⭐⭐⭐ | Debouncing 필수, 최적화 필요 |
| **이벤트 로그 통합** | ⭐⭐⭐⭐ | 감사 로그 패턴 응용 |
| **엣지 기반 탐색** | ⭐⭐⭐⭐⭐ | 그래프 순회, 검증된 접근 |

### 🚀 비즈니스 가치

#### 사용자 입장
- **생산성 향상**: 컨텍스트 수동 선택 불필요
- **학습 곡선 완화**: AI가 적절한 툴/액션 제안
- **지식 축적**: 모든 작업이 검색 가능한 지식으로 전환

#### 플랫폼 입장
- **차별화 포인트**: 기존 도구와 명확히 구분
- **네트워크 효과**: 워크플로우가 사용자 자산이 됨
- **확장성**: 기본 AI → 워크플로우로 자연스러운 업셀

### 💡 추가 고려사항

#### 1. **다른 페이지 컨텍스트 검색**
✅ **가능**: 시맨틱 검색은 워크스페이스 전체를 대상으로 함
- 사용자가 범위 조정 가능 (현재 페이지 / 전체 워크스페이스)
- 페이지 경계를 넘는 지식 연결로 더 강력한 AI

#### 2. **블럭 액션 AI 트리거**
✅ **명확화**: 기본 AI는 오케스트레이터 역할
```
사용자 발화 
  → 기본 AI (컨텍스트 파악 + 의도 분석)
    → 액션칩 생성 (Command 배열)
      → 사용자 클릭
        → 블럭 액션 AI 실행
```

#### 3. **의미적 연결의 활용**
✅ **엣지 라벨 기반**: 단순 거리가 아닌 관계 의미 활용
- "causes" → 인과 관계
- "depends_on" → 의존성
- "summary_of" → 요약 관계
- Sensor Score의 Proximity 계산 시 엣지 라벨 가중치 적용

### 🎓 결론

이 설계는 **매우 탄탄하고 실용적**입니다:

✅ **UX 철학이 명확하고 차별화됨**  
✅ **기술적으로 구현 가능하며 점진적 발전 경로가 명확함**  
✅ **비즈니스 가치가 명확함**  
✅ **확장 가능하고 유연함**

권장 사항:
1. **Phase 0 Prototype** (1주)으로 UX 검증
2. 사용자 피드백 기반 Sensor Score 가중치 조정
3. 명령어 체인을 워크플로우로 전환하는 자연스러운 경로 제공

---

## 실제 유스케이스 시나리오

실제 사용자들이 기본 AI를 어떻게 활용할지 구체적인 시나리오를 통해 살펴봅니다.

---

### 🎯 시나리오 1: 기획자 - 이벤트 스토밍에서 Aggregate 디자인으로

#### 배경
- **사용자**: 제품 기획자 / 도메인 전문가
- **상황**: 이벤트 스토밍으로 프로세스 모델을 캔버스에 구축
- **블럭 구성**:
  - 도형 블럭들이 유저/이벤트/커맨드/시스템/Aggregate 등으로 분류
  - 엣지로 의미적 연결 (예: "triggers", "handled_by", "produces" 등)

#### 시나리오 A: 선택된 플로우에서 Aggregate 디자인

**사용자 액션**:
1. 특정 이벤트 스토밍 플로우 (5-10개 블럭)를 멀티선택
2. AI에게 요청: "이 플로우를 바탕으로 aggregate 디자인해줘"

**AI 컨텍스트 구성**:

```typescript
// Sensor Score 계산 결과
{
  selectedBlocks: [
    { id: 'user-1', type: 'shape', label: 'Customer', category: 'actor' },
    { id: 'event-1', type: 'shape', label: 'OrderPlaced', category: 'event' },
    { id: 'cmd-1', type: 'shape', label: 'PlaceOrder', category: 'command' },
    { id: 'event-2', type: 'shape', label: 'PaymentProcessed', category: 'event' },
    { id: 'sys-1', type: 'shape', label: 'PaymentGateway', category: 'system' }
  ],
  
  edges: [
    { from: 'user-1', to: 'cmd-1', label: 'triggers' },
    { from: 'cmd-1', to: 'event-1', label: 'produces' },
    { from: 'event-1', to: 'event-2', label: 'triggers' }
  ],
  
  sensorScore: {
    attention: 1.0,     // 사용자가 명시적으로 선택
    proximity: 0.9,     // 선택된 블럭들이 모두 가까움
    semantic: 0.85,     // "aggregate"와 "이벤트 스토밍" 용어 매칭
    intent: 0.95,       // "디자인해줘" → create/generate 의도
    recency: 0.7        // 최근 편집한 영역
  },
  
  relatedTools: [
    { name: 'aggregate-design-tool', score: 0.92 },
    { name: 'domain-model-generator', score: 0.87 }
  ]
}
```

**AI 응답**:

```
✅ Order Aggregate를 설계했어요. 3개 엔티티와 5개 이벤트로 구성됩니다.
💡 [Aggregate 블럭 생성] [DDD 다이어그램 보기] [코드 스켈레톤 생성]
```

**액션칩 1: "Aggregate 블럭 생성" 클릭 시**:

```typescript
{
  type: 'execute',
  label: 'Aggregate 블럭 생성',
  preview: 'Order Aggregate 블럭 생성 → 엔티티 블럭 3개 생성 → 엣지 연결',
  commands: [
    // 1. Aggregate 블럭 생성
    {
      type: 'create_block',
      blockType: 'shape',
      content: {
        label: 'Order Aggregate',
        category: 'aggregate',
        style: { backgroundColor: '#FFE5CC', border: '2px solid #FF9933' }
      },
      position: { x: 800, y: 200 }
    },
    
    // 2. 엔티티 블럭들 생성
    {
      type: 'create_block',
      blockType: 'shape',
      content: { label: 'Order (Root)', category: 'entity' },
      position: { x: 900, y: 280 }
    },
    {
      type: 'create_block',
      blockType: 'shape',
      content: { label: 'OrderItem', category: 'entity' },
      position: { x: 900, y: 360 }
    },
    {
      type: 'create_block',
      blockType: 'shape',
      content: { label: 'PaymentInfo', category: 'entity' },
      position: { x: 900, y: 440 }
    },
    
    // 3. Aggregate와 엔티티 연결
    {
      type: 'create_edge',
      sourceId: 'new_aggregate',
      targetId: 'new_entity_1',
      edgeType: 'contains',
      label: 'root'
    },
    {
      type: 'create_edge',
      sourceId: 'new_entity_1',
      targetId: 'new_entity_2',
      edgeType: 'contains',
      label: 'has_many'
    },
    {
      type: 'create_edge',
      sourceId: 'new_entity_1',
      targetId: 'new_entity_3',
      edgeType: 'contains',
      label: 'has_one'
    },
    
    // 4. 원본 이벤트들과 연결
    {
      type: 'create_edge',
      sourceId: 'event-1',
      targetId: 'new_aggregate',
      edgeType: 'handled_by',
      label: 'creates'
    },
    {
      type: 'create_edge',
      sourceId: 'event-2',
      targetId: 'new_aggregate',
      edgeType: 'handled_by',
      label: 'updates'
    },
    
    // 5. 설명 마크다운 블럭 생성
    {
      type: 'create_block',
      blockType: 'markdown',
      content: `## Order Aggregate

**경계**: 주문과 관련된 모든 비즈니스 로직
**Root Entity**: Order
**Value Objects**: OrderItem, PaymentInfo

**처리 이벤트**:
- OrderPlaced → 새 주문 생성
- PaymentProcessed → 결제 정보 업데이트
`,
      position: { x: 1100, y: 200 }
    },
    
    // 6. 그룹화
    {
      type: 'group_blocks',
      blockIds: ['new_aggregate', 'new_entity_1', 'new_entity_2', 'new_entity_3'],
      groupName: 'Order Aggregate'
    }
  ]
}
```

**실행 결과**:
- 캔버스에 Order Aggregate 구조가 시각적으로 생성됨
- 원본 이벤트 스토밍 블럭들과 엣지로 연결
- 설명 문서가 옆에 배치됨
- 전체가 그룹으로 묶여서 관리 용이

#### 시나리오 B: 단일 이벤트에서 유저 플로우 생성

**사용자 액션**:
1. 하나의 이벤트 블럭 ("OrderPlaced") 클릭
2. AI에게 요청: "이 이벤트를 유저 플로우로 만들어줘"

**AI 컨텍스트 구성**:

```typescript
{
  selectedBlock: {
    id: 'event-1',
    type: 'shape',
    label: 'OrderPlaced',
    category: 'event'
  },
  
  // 엣지를 따라 연결된 블럭들 자동 수집
  connectedBlocks: {
    upstream: [
      { id: 'user-1', label: 'Customer', edgeLabel: 'triggers' },
      { id: 'cmd-1', label: 'PlaceOrder', edgeLabel: 'produces' }
    ],
    downstream: [
      { id: 'event-2', label: 'PaymentProcessed', edgeLabel: 'triggers' },
      { id: 'event-3', label: 'InventoryReserved', edgeLabel: 'triggers' }
    ]
  },
  
  // 시맨틱 검색으로 관련 블럭 추가 발견
  semanticMatches: [
    { id: 'md-1', type: 'markdown', title: '주문 프로세스 정의', score: 0.88 },
    { id: 'code-1', type: 'code', title: 'OrderService.ts', score: 0.76 }
  ],
  
  sensorScore: {
    attention: 1.0,
    proximity: 0.85,
    semantic: 0.90,
    intent: 0.92,
    recency: 0.8
  }
}
```

**AI 응답**:

```
✅ OrderPlaced 이벤트 중심으로 4단계 유저 플로우를 구성했어요.
💡 [플로우 다이어그램 생성] [스토리보드 만들기] [관련 문서 보기]
```

**액션칩 실행 시**:
- 유저 → 인터페이스 → 시스템 → 이벤트 순서의 플로우 다이어그램 생성
- 각 단계를 새 블럭으로 생성하고 순차적으로 엣지 연결
- 타임라인 형태로 배치

#### 🤔 한번의 컨텍스트로 가능한가? 에이전트 방식?

**MVP 단계 (한번의 실행)**:
- ✅ 가능: 선택된 블럭 + 엣지 연결 블럭 + 시맨틱 매치 블럭을 한번에 컨텍스트로 전달
- LLM이 Command 배열 생성
- 사용자가 액션칩 클릭 → 일괄 실행

**고급 단계 (에이전트 방식)**:
- 복잡한 경우 **AI 워크플로우**로 전환 제안
- 예: "Aggregate 디자인 → 코드 생성 → 테스트 작성 → 문서화"
- 각 단계마다:
  1. 컨텍스트 재수집
  2. 이전 단계 결과를 컨텍스트에 추가
  3. 다음 액션 실행
  4. 사용자 피드백 반영

**실용적 접근**:
```
간단한 요청 (1-5개 블럭 생성) → 기본 AI (단일 실행)
복잡한 요청 (10+ 블럭, 다단계) → AI 워크플로우로 전환 제안
```

---

### 💪 시나리오 2: 슈퍼휴먼 - 지식 연결과 콘텐츠 큐레이션

#### 배경
- **사용자**: 지식 근로자 / 연구자
- **상황**: 다양한 소스의 정보를 캔버스에 수집하고 연결
- **블럭 구성**:
  - 유튜브 블럭, 마크다운 노트, 이미지, PDF, 코드 등 다양한 타입

#### 시나리오 A: 유튜브 영상 요약

**사용자 액션**:
1. Y Combinator 유튜브 영상 블럭을 캔버스에 배치
2. 해당 블럭 클릭 후 요청: "이 영상 요약해줘"

**AI 컨텍스트 구성**:

```typescript
{
  selectedBlock: {
    id: 'youtube-1',
    type: 'youtube',
    url: 'https://youtube.com/watch?v=...',
    title: 'How to Get Your First 10 Customers',
    metadata: {
      channel: 'Y Combinator',
      duration: '15:32',
      uploadDate: '2024-10-15'
    }
  },
  
  // 블럭 타입에 연결된 툴 발견
  availableTools: [
    {
      name: 'youtube-transcript-extractor',
      description: '유튜브 자막 추출',
      score: 0.98
    },
    {
      name: 'text-summarizer',
      description: '텍스트 요약',
      score: 0.95
    }
  ],
  
  sensorScore: {
    intent: 0.98,      // "요약해줘" → summarize 의도 명확
    semantic: 0.90,    // 요약 툴과 매칭
    attention: 1.0,    // 클릭한 블럭
    proximity: 0.6,
    recency: 0.9
  }
}
```

**AI 응답**:

```
✅ 영상 스크립트를 분석했어요. 초기 고객 10명 확보의 3가지 전략을 다룹니다.
💡 [요약 블럭 생성] [타임스탬프별 정리] [관련 개념 찾기]
```

**액션칩 1: "요약 블럭 생성" 클릭 시**:

```typescript
{
  type: 'execute',
  label: '요약 블럭 생성',
  preview: '스크립트 추출 → AI 요약 → 마크다운 블럭 생성 → 엣지 연결',
  commands: [
    // 1. 유튜브 스크립트 추출 (블럭 액션 AI)
    {
      type: 'run_block_action',
      blockId: 'youtube-1',
      action: 'extract-transcript',
      params: { language: 'en' }
    },
    
    // 2. 요약 실행 (블럭 액션 AI)
    {
      type: 'run_block_action',
      blockId: 'youtube-1',
      action: 'summarize',
      params: {
        style: 'bullet-points',
        sections: ['key-insights', 'action-items', 'quotes']
      }
    },
    
    // 3. 결과를 마크다운 블럭으로 생성
    {
      type: 'create_block',
      blockType: 'markdown',
      content: `## 📹 How to Get Your First 10 Customers

### 핵심 인사이트
- **직접 찾아가기**: 초기에는 자동화보다 수동 접근이 효과적
- **문제 검증**: 고객과 대화하며 실제 문제를 확인
- **반복 개선**: 피드백을 즉시 제품에 반영

### 액션 아이템
1. 타겟 고객 20명 리스트 작성
2. 일주일 내 10명과 대화
3. 3가지 패턴 식별

### 인상적인 문구
> "Do things that don't scale" - Paul Graham

---
*출처*: Y Combinator, 2024-10-15
`,
      position: { x: originalX + 400, y: originalY }
    },
    
    // 4. 유튜브 블럭과 요약 블럭 연결
    {
      type: 'create_edge',
      sourceId: 'youtube-1',
      targetId: 'new_summary_block',
      edgeType: 'summary',
      label: 'summary_of'
    },
    
    // 5. 유튜브 블럭 속성 업데이트 (요약 완료 표시)
    {
      type: 'update_property',
      blockId: 'youtube-1',
      propertyId: 'has_summary',
      value: true
    }
  ]
}
```

#### 시나리오 B: 유사 개념 연결

**사용자 액션**:
1. 방금 요약한 유튜브 블럭 클릭
2. 요청: "이 영상에서 다룬 내용과 유사한 개념들을 찾아서 연결해줘"

**AI 컨텍스트 구성**:

```typescript
{
  selectedBlock: {
    id: 'youtube-1',
    // ... (위와 동일)
  },
  
  extractedConcepts: [
    'customer development',
    'problem-solution fit',
    'lean startup',
    'do things that don\'t scale'
  ],
  
  // 워크스페이스 전체에서 시맨틱 검색
  semanticSearchResults: {
    samePageBlocks: [
      {
        id: 'md-5',
        type: 'markdown',
        title: 'Lean Startup 방법론',
        score: 0.92,
        matchedConcepts: ['lean startup', 'customer development']
      },
      {
        id: 'pdf-2',
        type: 'pdf',
        title: 'The Mom Test.pdf',
        score: 0.88,
        matchedConcepts: ['customer development', 'problem validation']
      }
    ],
    
    otherPagesBlocks: [
      {
        id: 'note-15',
        pageId: 'startup-notes-2024',
        type: 'markdown',
        title: '스타트업 성장 전략',
        score: 0.85,
        matchedConcepts: ['early customers', 'scaling']
      },
      {
        id: 'youtube-7',
        pageId: 'yc-playlist',
        type: 'youtube',
        title: 'Paul Graham on Doing Things that Don\'t Scale',
        score: 0.94,
        matchedConcepts: ['do things that don\'t scale']
      }
    ]
  },
  
  sensorScore: {
    semantic: 0.95,    // 시맨틱 검색이 핵심
    intent: 0.90,      // "찾아서 연결" → search + connect
    attention: 1.0,
    proximity: 0.3,    // 다른 페이지까지 포함
    recency: 0.5
  }
}
```

**AI 응답**:

```
✅ 4개 페이지에서 관련 블럭 5개를 찾았어요. 2개는 이 페이지에 있습니다.
💡 [모두 가져오기] [같은 페이지만] [개념 맵 생성]
```

**액션칩 1: "모두 가져오기" 클릭 시**:

```typescript
{
  type: 'execute',
  label: '모두 가져오기',
  preview: '5개 블럭을 현재 페이지로 마운트 → 원본과 엣지 연결 → 개념별 그룹화',
  commands: [
    // 1. 같은 페이지 블럭에 엣지만 추가
    {
      type: 'create_edge',
      sourceId: 'youtube-1',
      targetId: 'md-5',
      edgeType: 'related',
      label: 'related_concept: lean startup'
    },
    {
      type: 'create_edge',
      sourceId: 'youtube-1',
      targetId: 'pdf-2',
      edgeType: 'related',
      label: 'related_concept: customer development'
    },
    
    // 2. 다른 페이지 블럭을 현재 페이지로 마운트 (Block Mount)
    {
      type: 'create_block',
      blockType: 'block-mount',  // 특수 블럭 타입: 다른 블럭의 참조
      content: {
        sourceBlockId: 'note-15',
        sourcePageId: 'startup-notes-2024',
        displayMode: 'preview',  // preview | full | link
        syncMode: 'live'  // 원본 변경 시 자동 업데이트
      },
      position: { x: originalX - 300, y: originalY + 200 }
    },
    {
      type: 'create_block',
      blockType: 'block-mount',
      content: {
        sourceBlockId: 'youtube-7',
        sourcePageId: 'yc-playlist',
        displayMode: 'preview'
      },
      position: { x: originalX - 300, y: originalY + 400 }
    },
    
    // 3. 마운트된 블럭들과 원본 연결
    {
      type: 'create_edge',
      sourceId: 'youtube-1',
      targetId: 'mount_note-15',
      edgeType: 'related',
      label: 'related_concept: scaling'
    },
    {
      type: 'create_edge',
      sourceId: 'youtube-1',
      targetId: 'mount_youtube-7',
      edgeType: 'related',
      label: 'same_concept: don\'t scale'
    },
    
    // 4. 개념 맵 중심 블럭 생성
    {
      type: 'create_block',
      blockType: 'shape',
      content: {
        label: '초기 고객 확보 전략',
        category: 'concept-hub',
        style: { backgroundColor: '#E3F2FD', borderRadius: '50%' }
      },
      position: { x: originalX, y: originalY - 150 }
    },
    
    // 5. 중심 블럭에서 모든 관련 블럭으로 엣지
    {
      type: 'create_edge',
      sourceId: 'new_concept_hub',
      targetId: 'youtube-1',
      edgeType: 'includes',
      label: 'primary_source'
    },
    {
      type: 'create_edge',
      sourceId: 'new_concept_hub',
      targetId: 'md-5',
      edgeType: 'includes'
    },
    // ... (나머지 블럭들도 연결)
    
    // 6. 전체를 컨셉 그룹으로 묶기
    {
      type: 'group_blocks',
      blockIds: [
        'new_concept_hub', 'youtube-1', 'md-5', 'pdf-2',
        'mount_note-15', 'mount_youtube-7'
      ],
      groupName: '💡 초기 고객 확보 전략'
    }
  ]
}
```

**실행 결과**:
- 다른 페이지의 블럭들이 Block Mount로 현재 페이지에 표시됨
- 중심 개념 블럭을 중심으로 방사형 레이아웃
- 엣지 라벨로 어떤 개념이 연결되는지 명확히 표시
- 원본 블럭 수정 시 마운트된 블럭도 자동 업데이트

#### 🔑 핵심 포인트

1. **툴 자동 발견**: 유튜브 블럭 타입 → transcript-extractor 툴 자동 매칭
2. **블럭 액션 AI 트리거**: 기본 AI가 `run_block_action` 명령어로 블럭 액션 AI 실행
3. **워크스페이스 전체 검색**: 페이지 경계를 넘어 시맨틱 검색
4. **Block Mount**: 다른 페이지 블럭을 참조로 가져오는 강력한 기능

---

### 🎨 시나리오 3: 미디어 디자이너 - 창작 워크플로우

#### 배경
- **사용자**: 미디어 아티스트 / 비주얼 디자이너
- **상황**: 꿈에서 본 장면을 시각화하고 다양한 스타일로 변형
- **블럭 구성**:
  - 마크다운 노트 (아이디어 메모)
  - 이미지 블럭 (생성된 이미지들)
  - 무드보드 (참고 이미지들)

#### 시나리오 A: 텍스트 설명에서 이미지 생성

**사용자 액션**:
1. 마크다운 블럭에 꿈 내용 작성:
```markdown
## 꿈 메모 - 2024.11.11

어두운 숲 속에서 빛나는 나무가 있었다.
나무 줄기는 크리스탈처럼 투명하고,
잎사귀에서 파란 빛이 흘러내렸다.
달빛이 안개를 통과해 신비로운 분위기를 만들었다.
```

2. 해당 블럭 클릭 후 요청: "이 장면을 이미지로 만들어줘"

**AI 컨텍스트 구성**:

```typescript
{
  selectedBlock: {
    id: 'md-dream-1',
    type: 'markdown',
    content: '어두운 숲 속에서 빛나는 나무...',
    metadata: {
      wordCount: 45,
      keywords: ['숲', '나무', '크리스탈', '빛', '안개', '달빛']
    }
  },
  
  // 프롬프트 엔지니어링을 위한 주변 컨텍스트
  nearbyBlocks: [
    {
      id: 'img-ref-1',
      type: 'image',
      tags: ['fantasy', 'forest', 'concept-art'],
      score: 0.82  // Proximity + Semantic
    },
    {
      id: 'md-style-1',
      type: 'markdown',
      title: '선호 스타일 가이드',
      content: '전반적으로 painterly, 드림코어, 이더리얼한 느낌...',
      score: 0.76
    }
  ],
  
  // 이미지 생성 툴 발견
  availableTools: [
    {
      name: 'image-generator',
      description: 'Text-to-Image 생성 (DALL-E, Midjourney, Stable Diffusion)',
      score: 0.99
    },
    {
      name: 'prompt-enhancer',
      description: 'AI 이미지 프롬프트 최적화',
      score: 0.95
    }
  ],
  
  sensorScore: {
    intent: 0.99,      // "이미지로 만들어줘" → image-generation
    semantic: 0.92,    // 이미지 생성 툴과 매칭
    attention: 1.0,
    proximity: 0.85,   // 주변에 이미지 참고자료
    recency: 1.0       // 방금 작성함
  }
}
```

**AI 응답**:

```
✅ 꿈 장면을 프롬프트로 변환했어요. Ethereal 스타일로 생성합니다.
💡 [이미지 생성] [여러 스타일로 생성] [프롬프트 수정]
```

**액션칩 1: "이미지 생성" 클릭 시**:

```typescript
{
  type: 'execute',
  label: '이미지 생성',
  preview: '프롬프트 최적화 → 이미지 생성 (DALL-E 3) → 이미지 블럭 생성 → 원본과 연결',
  commands: [
    // 1. 프롬프트 최적화 (블럭 액션 AI)
    {
      type: 'run_block_action',
      blockId: 'md-dream-1',
      action: 'enhance-prompt',
      params: {
        targetModel: 'dall-e-3',
        style: 'painterly',
        mood: 'ethereal',
        aspectRatio: '16:9',
        // 주변 스타일 가이드 블럭의 내용도 컨텍스트로 활용
        styleReference: 'md-style-1'
      }
    },
    // 결과 프롬프트:
    // "A mystical crystal tree glowing in a dark enchanted forest,
    //  ethereal blue light flowing from transparent leaves,
    //  moonlight piercing through mist, dreamcore aesthetic,
    //  painterly style, cinematic lighting, 16:9"
    
    // 2. 이미지 블럭 생성 (먼저 placeholder)
    {
      type: 'create_block',
      blockType: 'image',
      content: {
        status: 'generating',
        prompt: '[enhanced_prompt_from_step_1]'
      },
      position: { x: originalX + 500, y: originalY }
    },
    
    // 3. 이미지 생성 실행 (블럭 액션 AI - 비동기)
    {
      type: 'run_block_action',
      blockId: 'new_image_block',
      action: 'generate-image',
      params: {
        model: 'dall-e-3',
        prompt: '[enhanced_prompt_from_step_1]',
        quality: 'hd',
        size: '1792x1024'
      }
    },
    
    // 4. 생성 완료 후 블럭 속성 업데이트
    {
      type: 'update_property',
      blockId: 'new_image_block',
      propertyId: 'status',
      value: 'completed'
    },
    {
      type: 'update_property',
      blockId: 'new_image_block',
      propertyId: 'metadata',
      value: {
        generatedAt: Date.now(),
        model: 'dall-e-3',
        sourceTextBlockId: 'md-dream-1',
        tags: ['dream', 'forest', 'crystal', 'generated']
      }
    },
    
    // 5. 원본 텍스트와 생성 이미지 연결
    {
      type: 'create_edge',
      sourceId: 'md-dream-1',
      targetId: 'new_image_block',
      edgeType: 'generated_from',
      label: 'visualized_as'
    },
    
    // 6. 참고한 스타일 가이드와도 연결
    {
      type: 'create_edge',
      sourceId: 'md-style-1',
      targetId: 'new_image_block',
      edgeType: 'style_applied',
      label: 'style_reference'
    }
  ]
}
```

#### 시나리오 B: 이미지 다양한 스타일로 변형

**사용자 액션**:
1. 방금 생성된 이미지 블럭 클릭
2. 요청: "이 이미지를 사이버펑크, 수채화, 미니멀리즘 느낌으로 변형을 많이 만들어줘"

**AI 컨텍스트 구성**:

```typescript
{
  selectedBlock: {
    id: 'img-1',
    type: 'image',
    url: 'https://...',
    metadata: {
      originalPrompt: '...',
      sourceTextBlockId: 'md-dream-1'
    }
  },
  
  requestedStyles: [
    'cyberpunk',
    'watercolor',
    'minimalism'
  ],
  
  // 이미지 변형 툴 발견
  availableTools: [
    {
      name: 'image-style-transfer',
      description: '이미지 스타일 변형',
      score: 0.96
    },
    {
      name: 'image-to-image',
      description: 'Image-to-Image 생성',
      score: 0.94
    }
  ],
  
  // 원본 텍스트도 컨텍스트에 포함 (엣지 연결 추적)
  relatedBlocks: [
    { id: 'md-dream-1', type: 'markdown', relationship: 'source' }
  ],
  
  sensorScore: {
    intent: 0.98,
    semantic: 0.94,
    attention: 1.0,
    proximity: 0.7,
    recency: 0.95
  }
}
```

**AI 응답**:

```
✅ 3가지 스타일로 변형 이미지를 생성합니다. 각 스타일별 2개씩 총 6개입니다.
💡 [모두 생성] [하나씩 확인하며 생성] [스타일 추가]
```

**액션칩 1: "모두 생성" 클릭 시**:

```typescript
{
  type: 'execute',
  label: '모두 생성',
  preview: '6개 이미지 블럭 생성 → 각각 스타일 변형 실행 → 그리드 레이아웃 배치',
  commands: [
    // 스타일 1: Cyberpunk (2개 변형)
    {
      type: 'create_block',
      blockType: 'image',
      content: { status: 'generating' },
      position: { x: originalX + 600, y: originalY }
    },
    {
      type: 'run_block_action',
      blockId: 'new_img_cyberpunk_1',
      action: 'style-transfer',
      params: {
        sourceImageId: 'img-1',
        targetStyle: 'cyberpunk',
        stylePrompt: 'neon lights, futuristic, cyberpunk aesthetic, holographic',
        strength: 0.7
      }
    },
    {
      type: 'create_block',
      blockType: 'image',
      content: { status: 'generating' },
      position: { x: originalX + 800, y: originalY }
    },
    {
      type: 'run_block_action',
      blockId: 'new_img_cyberpunk_2',
      action: 'style-transfer',
      params: {
        sourceImageId: 'img-1',
        targetStyle: 'cyberpunk',
        stylePrompt: 'dark cyberpunk, rain, neon reflections, blade runner',
        strength: 0.8
      }
    },
    
    // 스타일 2: Watercolor (2개 변형)
    {
      type: 'create_block',
      blockType: 'image',
      content: { status: 'generating' },
      position: { x: originalX + 600, y: originalY + 300 }
    },
    {
      type: 'run_block_action',
      blockId: 'new_img_watercolor_1',
      action: 'style-transfer',
      params: {
        sourceImageId: 'img-1',
        targetStyle: 'watercolor',
        stylePrompt: 'soft watercolor painting, pastel colors, dreamy',
        strength: 0.6
      }
    },
    {
      type: 'create_block',
      blockType: 'image',
      content: { status: 'generating' },
      position: { x: originalX + 800, y: originalY + 300 }
    },
    {
      type: 'run_block_action',
      blockId: 'new_img_watercolor_2',
      action: 'style-transfer',
      params: {
        sourceImageId: 'img-1',
        targetStyle: 'watercolor',
        stylePrompt: 'vibrant watercolor, flowing colors, artistic',
        strength: 0.7
      }
    },
    
    // 스타일 3: Minimalism (2개 변형)
    {
      type: 'create_block',
      blockType: 'image',
      content: { status: 'generating' },
      position: { x: originalX + 600, y: originalY + 600 }
    },
    {
      type: 'run_block_action',
      blockId: 'new_img_minimal_1',
      action: 'style-transfer',
      params: {
        sourceImageId: 'img-1',
        targetStyle: 'minimalism',
        stylePrompt: 'minimalist illustration, simple shapes, limited palette',
        strength: 0.8
      }
    },
    {
      type: 'create_block',
      blockType: 'image',
      content: { status: 'generating' },
      position: { x: originalX + 800, y: originalY + 600 }
    },
    {
      type: 'run_block_action',
      blockId: 'new_img_minimal_2',
      action: 'style-transfer',
      params: {
        sourceImageId: 'img-1',
        targetStyle: 'minimalism',
        stylePrompt: 'ultra minimalist, monochrome, geometric abstraction',
        strength: 0.9
      }
    },
    
    // 모든 변형 이미지를 원본과 연결
    {
      type: 'create_edge',
      sourceId: 'img-1',
      targetId: 'new_img_cyberpunk_1',
      edgeType: 'variant',
      label: 'style: cyberpunk'
    },
    // ... (나머지 5개도 동일하게 연결)
    
    // 스타일별 라벨 블럭 생성
    {
      type: 'create_block',
      blockType: 'shape',
      content: {
        label: '🌃 Cyberpunk',
        category: 'style-label',
        style: { backgroundColor: '#FF00FF20', fontSize: '14px' }
      },
      position: { x: originalX + 700, y: originalY - 50 }
    },
    {
      type: 'create_block',
      blockType: 'shape',
      content: { label: '🎨 Watercolor', category: 'style-label' },
      position: { x: originalX + 700, y: originalY + 250 }
    },
    {
      type: 'create_block',
      blockType: 'shape',
      content: { label: '⚪ Minimalism', category: 'style-label' },
      position: { x: originalX + 700, y: originalY + 550 }
    },
    
    // 전체를 "스타일 변형" 그룹으로 묶기
    {
      type: 'group_blocks',
      blockIds: [
        'img-1',  // 원본
        'new_img_cyberpunk_1', 'new_img_cyberpunk_2',
        'new_img_watercolor_1', 'new_img_watercolor_2',
        'new_img_minimal_1', 'new_img_minimal_2',
        'style_label_1', 'style_label_2', 'style_label_3'
      ],
      groupName: '🎨 Crystal Tree - Style Variations'
    }
  ]
}
```

**실행 결과**:
- 원본 이미지 옆에 3x2 그리드로 6개 변형 이미지 배치
- 각 스타일별로 라벨 블럭이 구분자 역할
- 엣지 라벨로 어떤 스타일인지 명확히 표시
- 모두 하나의 그룹으로 관리됨

#### 🔑 핵심 포인트

1. **주변 컨텍스트 활용**: 스타일 가이드 블럭을 자동으로 찾아서 프롬프트 최적화에 활용
2. **비동기 실행**: 이미지 생성은 시간이 걸리므로 placeholder 블럭 먼저 생성 → 완료 후 업데이트
3. **배치 작업**: 여러 개의 변형을 한번에 요청하고 그리드로 정리
4. **엣지 추적**: 원본 텍스트 → 첫 이미지 → 변형 이미지들의 계보 추적

---

## 유스케이스 요약 테이블

| 페르소나 | 시나리오 | 핵심 기능 | 컨텍스트 범위 | 에이전트 필요 |
|---------|---------|---------|--------------|--------------|
| **기획자** | 이벤트 스토밍 → Aggregate 디자인 | 엣지 추적, Command 체인, 그룹화 | 선택 블럭 + 엣지 연결 블럭 | ❌ 단일 실행 가능 |
| **기획자** | 단일 이벤트 → 유저 플로우 | 엣지 추적, 시맨틱 검색 | 선택 블럭 + 업스트림/다운스트림 | ❌ 단일 실행 가능 |
| **슈퍼휴먼** | 유튜브 요약 | 블럭 액션 AI 트리거, 툴 자동 발견 | 선택 블럭 + 툴 메타데이터 | ❌ 단일 실행 가능 |
| **슈퍼휴먼** | 유사 개념 연결 | 시맨틱 검색 (워크스페이스 전체), Block Mount | 선택 블럭 + 전체 페이지 벡터 검색 | ❌ 단일 실행 가능 |
| **디자이너** | 텍스트 → 이미지 생성 | 프롬프트 최적화, 블럭 액션 AI, 비동기 실행 | 선택 블럭 + 주변 참고 이미지/스타일 가이드 | ❌ 단일 실행 가능 |
| **디자이너** | 다양한 스타일 변형 | 배치 작업, 그리드 배치, 엣지 추적 | 선택 블럭 + 원본 소스 추적 | ❌ 단일 실행 가능<br>✅ 많을 경우 워크플로우 제안 |

### 에이전트 vs 단일 실행 기준

**단일 실행으로 충분한 경우** (기본 AI):
- 명확한 인풋 (선택된 블럭, 명시적 요청)
- 생성할 블럭 개수가 ~10개 이하
- 단계가 명확하고 선형적
- 사용자 중간 피드백 불필요

**AI 워크플로우로 전환 제안하는 경우**:
- 생성할 블럭이 10개 이상
- 다단계 작업 (각 단계 결과가 다음 단계 인풋)
- 사용자가 중간 검토/수정 필요
- 반복 실행 가능성 (템플릿화)
- 스케줄링 필요

---

## 검토 포인트

### 1. 아키텍처 관점

#### 1.1 Sensor Score 계산
**질문**:
- Sensor Score의 각 요소(α₁, α₂, ...)의 **가중치를 어떻게 결정**할 것인가?
- 정적 가중치 vs 학습 기반 가중치?
- A/B 테스트로 최적화할 것인가?

**제안**:
- 초기에는 **휴리스틱 기반** 가중치로 시작 (예: IntentMatch 40%, SemanticSim 30%, 나머지 30%)
- 사용자 피드백(액션 칩 클릭률, 블럭 선택 정확도)을 수집
- 추후 ML 모델로 **개인화된 가중치** 학습 고려

#### 1.2 성능 문제
**질문**:
- 캔버스에 블럭이 수천 개 있을 때도 실시간으로 Sensor Score를 계산할 수 있나?
- 클라이언트 vs 서버에서 계산?

**제안**:
- **클라이언트**: Proximity, Attention, Recency (실시간 UI 상태)
- **서버**: IntentMatch, SemanticSim (벡터 검색)
- 클라이언트에서 **pre-filtering** (viewport 내 블럭, 최근 N개만)
- 서버로 전송 후 최종 스코어 계산

#### 1.3 벡터 검색 인프라
**질문**:
- 시맨틱 서치를 위한 벡터 DB가 필요한데, 어떤 기술 스택?
- Pinecone, Weaviate, Qdrant, pgvector?

**제안**:
- 초기에는 **pgvector** (PostgreSQL extension) 고려
  - 이미 PostgreSQL 사용 중이면 추가 인프라 최소화
  - 중소 규모에서 충분한 성능
- 대규모 확장 시 **전용 벡터 DB** 고려

### 2. UX 관점

#### 2.1 "2줄" 제한의 실효성
**질문**:
- 모든 상황에서 2줄로 충분한가?
- 복잡한 질문에 대한 답변은?

**제안**:
- 2줄은 **기본 원칙**, 예외 허용
- 복잡한 경우: "2줄 요약 + [세부 보기] 액션 칩"
- [세부 보기] 클릭 시 → **새 블럭 생성**으로 긴 내용 표시

#### 2.2 액션 칩의 종류
**질문**:
- 어떤 종류의 액션 칩이 필요한가?
- 동적으로 생성되나? 고정된 세트?

**제안**:
```typescript
// 개별 명령어 정의 (블럭 생성, 속성 수정, 컴포넌트 생성 등)
type Command = 
  | { type: 'create_block', blockType: string, content: any, position?: Point }
  | { type: 'update_block', blockId: string, updates: Partial<Block> }
  | { type: 'update_property', blockId: string, propertyId: string, value: any }
  | { type: 'create_edge', sourceId: string, targetId: string, edgeType: string, label?: string }
  | { type: 'delete_block', blockId: string }
  | { type: 'move_block', blockId: string, position: Point }
  | { type: 'run_block_action', blockId: string, action: string, params?: any }
  | { type: 'group_blocks', blockIds: string[], groupName?: string }
  | { type: 'create_component', componentType: string, config: any };

type ActionChip = 
  | { type: 'navigate', blockIds: string[], label: string }
  | { type: 'execute', commands: Command[], label: string, preview?: string }
  | { type: 'create', blockType: string, content: any, label: string }
  | { type: 'expand', detailContent: string, label: string };
```

**명령어 체인의 장점**:
- **복잡한 액션을 하나의 칩에 담기**
  - 예: "3개 코드 블럭 리팩터 + 요약 블럭 생성 + 엣지로 연결"
- **미리보기 가능**
  - `preview` 필드로 어떤 작업이 실행될지 사용자에게 설명
- **Undo/Redo 용이**
  - 명령어 배열을 역순으로 실행하거나 저장
- **AI가 워크플로우 생성**
  - 단순 1회성 액션이 아닌 여러 단계의 작업을 AI가 설계

**예시**:
```typescript
// "이 3개 코드를 리팩터하고 결과 요약해줘"
{
  type: 'execute',
  label: '리팩터 & 요약 생성',
  preview: '3개 블럭 리팩터 → 요약 블럭 생성 → 엣지 연결',
  commands: [
    { type: 'run_block_action', blockId: 'block1', action: 'refactor' },
    { type: 'run_block_action', blockId: 'block2', action: 'refactor' },
    { type: 'run_block_action', blockId: 'block3', action: 'refactor' },
    { type: 'create_block', blockType: 'markdown', content: '## 리팩터 요약\n...' },
    { type: 'create_edge', sourceId: 'block1', targetId: 'new_block', edgeType: 'summary' },
    { type: 'create_edge', sourceId: 'block2', targetId: 'new_block', edgeType: 'summary' },
    { type: 'create_edge', sourceId: 'block3', targetId: 'new_block', edgeType: 'summary' }
  ]
}
```

- AI가 **상황에 맞게 동적 생성**
- 최대 3개까지 표시 (선택 피로도 방지)

#### 2.3 휘발성 vs 영구성
**질문**:
- AI의 2줄 응답은 언제 사라지나?
- 다시 보고 싶을 때는?

**제안**:
- 기본적으로 **휘발성** (다음 발화 시 사라짐)
- 하지만 **대화 히스토리**에는 저장 (시맨틱 서치 대상)
- 중요한 응답은 "[블럭으로 저장]" 액션 칩 제공

### 3. 데이터 관점

#### 3.1 이벤트 로그 볼륨
**질문**:
- 모든 편집/발화를 저장하면 **데이터 양이 폭발**하지 않나?
- 특히 실시간 협업 시 초당 수십 개 이벤트 발생 가능

**제안**:
- **Debouncing**: 연속된 편집은 하나로 병합 (예: 타이핑)
- **중요도 필터링**: 의미 있는 변경만 저장 (예: 단순 커서 이동 제외)
- **Retention Policy**: 오래된 이벤트는 압축 또는 삭제 (예: 6개월 이후)
- **샘플링**: 모든 이벤트가 아닌 중요 이벤트만 벡터화

#### 3.2 개인정보/보안
**질문**:
- AI가 모든 블럭/대화 내용에 접근하는 것에 대한 개인정보 이슈?
- 민감한 정보가 포함된 블럭은?

**제안**:
- 블럭 레벨 **권한 시스템** 연동
- AI는 사용자가 **접근 가능한 블럭만** 컨텍스트로 사용
- "AI 제외" 플래그를 블럭에 추가 (opt-out)

### 4. 구현 우선순위

#### Phase 1: MVP (2-3주)
1. **기본 UI**: 2줄 응답 + 고정 액션 칩 3개
2. **Simple Context**: 선택된 블럭 + 주변 5개 블럭
3. **대화 저장**: 페이지 단위 저장 (시맨틱 검색 없이 최근 10개만)

#### Phase 2: Sensor Score (4-6주)
1. **Sensor Score 구현**: 5가지 요소 계산
2. **벡터 검색**: pgvector + 간단한 embedding
3. **동적 컨텍스트**: Sensor Score 기반 블럭 자동 선택

#### Phase 3: Advanced Context (8주+)
1. **시맨틱 대화 검색**: 과거 대화 벡터 검색
2. **이벤트 로그**: 통합 이벤트 시스템
3. **동적 액션 칩**: AI가 상황별 액션 칩 생성
4. **개인화**: 사용자별 Sensor Score 가중치 학습

---

## 다음 단계

### 즉시 결정이 필요한 사항

1. **벡터 DB 선택**
   - [ ] pgvector vs 전용 벡터 DB
   - [ ] Embedding 모델 선택 (OpenAI, Cohere, local model?)

2. **MVP 범위 확정**
   - [ ] Phase 1에서 어디까지 구현?
   - [ ] 프로토타입 일정

3. **API 설계**
   - [ ] AI 요청/응답 포맷
   - [ ] 액션 칩 실행 프로토콜

### 추가 논의가 필요한 사항

1. **비용 모델**
   - Sensor Score 계산 빈도 vs API 비용
   - 벡터 검색 비용
   - 토큰 사용량 최적화

2. **에러 핸들링**
   - AI 응답 실패 시 fallback
   - 컨텍스트가 너무 클 때
   - 관련 블럭이 없을 때

3. **측정 지표**
   - 성공적인 컨텍스트 전달을 어떻게 측정?
   - A/B 테스트 설계

---

## 관련 문서

- [AI Automation Patterns Discussion](./ai-automation-patterns-discussion.md)
- [Component Development Guidelines](../frontend-architecture/component-development-guidelines.md)
- [Event Flow Discussion](../event-patterns/event-flow-discussion.md)

---

**최종 업데이트**: 2025-11-11  
**작성자**: AI 기능 설계 팀  
**다음 리뷰**: TBD

