---
name: AI Agent Token Credit Deduction
overview: AI 에이전트 대화에서 각 메시지 완료 시 토큰(prompt, completion, reasoning, cached)을 계산하고, plan.md의 원가 일치형 크레딧 정산법에 따라 Flexible credits를 차감합니다. cached 토큰은 xAI 75% 할인 단가를 적용합니다.
todos: []
isProject: false
---

# AI 에이전트 토큰 기반 크레딧 차감 로직

## plan.md 정산 규칙 + Cached

- **1 credit = $0.001** (원가)
- **credits = ceil(cost / 0.001)**
- **Grok 4.1 Fast** 단가:
  - Input: **$0.20/M**
  - Cached input: **$0.05/M** (75% 할인)
  - Output: **$0.50/M** (reasoning 포함)

---

## 토큰 → 크레딧 계산 (cached 포함)

```
costUsd =
  (promptTokens - cachedTokens) * 0.20 / 1_000_000   // 일반 input
  + cachedTokens * 0.05 / 1_000_000                  // cached (75% 할인)
  + completionTokens * 0.50 / 1_000_000              // output + reasoning

credits = ceil(costUsd / 0.001)
```

- `promptTokens`: AI SDK `usage.promptTokens` (총 input)
- `completionTokens`: `usage.completionTokens` (output + reasoning)
- `cachedTokens`: provider가 제공하면 `usage.cachedPromptTokens` 또는 유사 필드 사용. 없으면 0.

---

## token-credit-calculator 유틸 시그니처

```typescript
export function calculateCreditsFromUsage(usage: {
  promptTokens: number;
  completionTokens: number;
  cachedPromptTokens?: number;  // cached input, 없으면 0
  totalTokens?: number;
}): { costUsd: number; credits: number; breakdown: {...} }
```

---

## 나머지 구현 요약

- Event Log: `tokens`에 `{ input, output, reasoning?, cached? }` 전달
- Agent v2 `onFinish`: usage → 계산 → event log → `CreditDeductionService.deduct`
- Cached 토큰은 `logAIResponse` metadata에도 저장해 감사 로그에 반영
