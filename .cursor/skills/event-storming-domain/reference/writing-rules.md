# Event Storming Domain Design - Writing Rules

## 문서 작성 규칙

### 이벤트
- **과거형 동사**: "~됨", "~완료됨", "~생성됨"
- **구체적**: "주문됨" (O), "처리됨" (X)
- **도메인 언어**: 비즈니스 용어 그대로 사용

### 커맨드
- **명령형 동사**: "워크스페이스 생성하기", "페이지 이동하기"
- **액터 명시**: "사용자가 워크스페이스 생성하기"

### Bounded Context
- **Domain > Bounded Context > System**
- Context = 도메인 모델 경계, System = 구현 단위
- Context 내부에서 일관된 언어 사용

### 문서 품질 체크리스트
- [ ] 주요 비즈니스 이벤트 누락 없음
- [ ] 시간순 논리적 사용자 여정
- [ ] 도메인 언어 일관성
- [ ] Hotspot 우선순위 명확
- [ ] Process Model 질문 정리

---

## Anti-Patterns (이벤트 식별 시)

### 1. 프론트엔드/UI 이벤트 포함 (백엔드 문서 기준)
| 제외 대상 | 사유 |
|----------|------|
| Page Loaded, Card Displayed, Card Detail Displayed | 페이지 로드·UI 표시는 클라이언트 책임 |
| Card Processing Status Updated, Recommended Pages Displayed | UI 상태 갱신·배지 표시는 프론트엔드 책임 |
| Session Closed | 페이지 이탈/종료 감지는 클라이언트 책임 |

### 2. 다른 도메인/시스템 이벤트 포함
| 제외 대상 | 처리 주체 | 사유 |
|----------|----------|------|
| Block Created from Source, Block Registered to Workspace | Block Management | 블록 생성·등록은 Block Domain 책임 |
| Block Mounted to Page | Canvas Management | 마운트는 Canvas Domain 책임 |

→ 본 도메인에서는 "호출 결과"로만 인식. Context 관계에서 통합 방식으로 설명.

### 3. 다른 도메인 호출(요청) 이벤트 포함
| 제외 대상 | 사유 |
|----------|------|
| Block Mount Requested | Inbox → Canvas 호출은 내부 오케스트레이션 |
| Page Recommendation Requested | Inbox → AI 호출도 내부 오케스트레이션 |

→ "요청했다"를 별도 도메인 이벤트로 정의하지 않음. Process Model에서 "이 시점에 호출한다"로 정리.

### 4. 과도한 세분화
- 동일 흐름의 Started/Failed를 과도하게 나누지 않음
- 필요 시 Extraction/Summarization Started → Source Processing Started, Failed들 → Source Processing Failed로 통합 검토

---

## 전체 가이드

`docs/event-domain-design/guide/01-event-storming-guide.md` 참조
