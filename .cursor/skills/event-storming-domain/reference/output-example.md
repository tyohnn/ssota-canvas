# Event Storming: Inbox Management Domain (예시)

> 출처: `docs/event-domain-design/domains/inbox-management-domain/01-event-storm.md`  
> 비즈니스 요구사항 기반 Event Storming 결과물 예시

---

## 🎯 개요

**도메인**: Inbox Management (Quick Capture Inbox)  
**작성자**: 기획팀 (inbox-feature-spec 기반)  
**작성일**: 2026-02-26  
**버전**: v1.0

**목적**: 복붙 지옥 해결을 위한 Quick Capture Inbox 기능 구현  
**다음 단계**: `02-process-model.md`  
**참조 문서**: `docs/plans/inbox-feature-spec.md`

---

## 📊 Domain Overview

**비즈니스 가치**: 사용자가 메시지 보내듯이 업무 맥락(링크, 파일, 오디오, 메모)을 빠르게 인입하고, 시스템이 자동으로 추출·요약·분류하여 블록으로 저장하고, AI가 적합한 페이지를 추천하여 "넣는 순간 정리된다"는 체감 와우를 제공하는 입력 허브.

**다른 도메인과의 관계**:
- Block Management: 소스 → 블록 생성
- Workspace Management: 페이지 목록 조회, 권한 검증
- Canvas Management: 블록 마운트
- AI Management: LLM 기반 요약, 페이지 추천

---

## 📝 핵심 개념 정리

### Inbox 핵심 구조
```
Inbox Flow
├── Inbox Session (세션/스레드)
│   ├── Inbox Message (인입된 소스 단위)
│   │   ├── Source Type (파일/오디오/메모/링크/유튜브)
│   │   └── Processing Status (업로드됨/추출중/요약완료/실패)
│   └── 같은 세션 = 약한 맥락 공유
├── Source Processing (비동기): Extract, Summarize, Classify
└── Page Recommendation: LLM 추천 → 사용자 선택 → Block Mount
```

### Business Rules/Policies
- **즉시 Block 생성**: 업로드 즉시 Block 생성, 추출/요약은 비동기
- **페이지 추천 + 사용자 선택**: 자동 마운트 없음
- **워크스페이스 격리**: Inbox 세션/메시지는 워크스페이스 단위

---

## 🟠 Domain Events (시간 순서) — 일부 예시

### 1. Inbox 세션 및 접근
- Inbox 페이지가 로드되었다
- Inbox 세션이 생성되었다
- Inbox 세션에 메시지가 추가되었다

### 2. 소스 인입
- 사용자가 소스를 인입했다
- 소스 타입이 식별되었다
- 소스 인입이 검증되었다 / 실패했다

### 3. 블록 생성 및 등록
- 블록이 소스로부터 생성되었다
- Inbox 메시지가 블록과 연결되었다

### 4. 소스 처리 (비동기)
- 소스 추출이 시작되었다 / 완료되었다 / 실패했다
- 소스가 요약되었다
- 블록 처리 상태가 업데이트되었다

### 5. 페이지 추천
- 페이지 추천이 요청되었다
- LLM이 페이지 추천을 생성했다
- 사용자가 추천 페이지를 선택했다

### 6. 블록 마운트
- 블록 마운트가 요청되었다
- 블록이 페이지에 마운트되었다

---

## 🔵 Commands & Actors — 일부 예시

#### Scenario 1: 소스 인입 → 블록 생성 → 요약 → 카드 표시
- **사용자가 소스 인입하기** (User) → Source Captured by User
- **시스템이 블록 생성하기** (Block Management) → Block Created from Source
- **시스템이 소스 요약하기** (AI Service) → Source Summarized
- **시스템이 Inbox 카드 표시하기** (Frontend) → Inbox Card Displayed

#### Scenario 2: 페이지 추천 → 사용자 선택 → 블록 마운트
- **LLM이 페이지 추천 생성하기** (AI Service) → Page Recommendations Generated
- **사용자가 추천 페이지 선택하기** (User) → Recommended Page Selected
- **Canvas Management가 블록 마운트하기** (Canvas) → Block Mounted to Page

### 액터 분류
- **Primary**: Inbox User
- **System**: Extraction Service, Summarization Service, Page Recommendation Service
- **External**: Block/Workspace/Canvas/AI Management Domain

---

## 🟠 Bounded Context 정의

### Inbox Management Context (Main Context)
**책임**: Quick Capture 입력 허브, 소스→블록 변환 오케스트레이션, 추출/요약/추천 파이프라인, 타 도메인 통합 조율

**핵심 언어**: Inbox, Inbox Session, Inbox Message, Source, Source Type, Block Created from Source, Source Extraction, Source Summarization, Processing Status, Page Recommendation, Block Mount

**포함 이벤트**: 32개 (세션 4 + 소스인입 4 + 블록생성 3 + 소스처리 7 + UI피드백 3 + 페이지추천 5 + 마운트 3 + 오류복구 3)

---

## 🔗 Context 간 관계 — 일부 예시

### Inbox ↔ Block Management
- **연결점**: 소스 → 블록 생성
- **데이터 흐름**: `Source Captured` → `Block Created from Source`
- **통합 방식**: 동기적 서비스 호출

### Inbox ↔ Canvas Management
- **연결점**: 블록 마운트
- **데이터 흐름**: `Recommended Page Selected` → `Block Mount Requested` → `Block Mounted to Page`
- **통합 방식**: 동기적 서비스 호출

---

## 🔴 Hotspots — 일부 예시

### 우선순위: 높음
1. **추출/요약 비동기 처리 및 실패 복구**
   - 문제: 추출/요약 지연·실패 시 UX 저하
   - 해결: 즉시 Block 생성 + 처리 상태 표시, 실패 재시도 UI

2. **LLM 페이지 추천 지연**
   - 해결: 요약과 추천을 파이프라인 연속 호출

### 우선순위: 중간
3. **소스 타입별 추출 파이프라인 차이**
   - 해결: Source Type별 Extractor 플러그인 구조

---

## 💡 Opportunities — 일부 예시

### 즉시 구현 (MVP)
1. Quick Capture Inbox 핵심 플로우 (소스 인입 → 블록 → 추출 → 요약 → 카드)
2. 페이지 추천 배지 + 마운트
3. 바텀시트 상세
4. 처리 상태 실시간 반영

### 향후 구현 (Post-MVP)
5. 모바일 Share to SSOTA
6. 브라우저 확장 Send to SSOTA

---

## ❓ Process Modeling을 위한 주요 질문들

1. 각 소스 타입별 허용 형식/크기 제한은?
2. 추출 실패 시 재시도 횟수/간격은?
3. 페이지 추천 시 사용자 Page 목록은 어디서 조회?
4. 마운트 시 Block 위치(x, y) 기본 규칙은?
5. 폴링 vs Realtime 중 상태 업데이트 전파 방식은?

---

*전체 문서: `docs/event-domain-design/domains/inbox-management-domain/01-event-storm.md`*
