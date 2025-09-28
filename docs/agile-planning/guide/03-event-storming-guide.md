# Event Storming 가이드

이 가이드는 주니어 PM이 **Event Storming**을 진행하는 전체 과정을 단계별로 안내합니다.

## 🎯 Event Storming이란?

**Event Storming**은 비즈니스 도메인을 이해하고 DDD 설계의 기반을 만드는 워크샵입니다.

### 목적
- **비즈니스 이벤트 식별**: 도메인에서 발생하는 중요한 사건들 파악
- **도메인 경계 탐색**: Bounded Context의 경계 찾기
- **사용자 여정 이해**: 사용자가 목표를 달성하기까지의 과정 파악
- **Epic 후보 도출**: 구현할 기능들의 큰 틀 파악

---

## 📋 Step 0: 현재 날짜 확인

### 0.1 작업 시작 전 날짜 확인
```bash
# 현재 날짜 확인
date

# 예시 출력: Sun Sep 28 15:56:33 KST 2025
```

**날짜 확인 목적:**
- 현재 시점 파악으로 적절한 Event Storming 일정 수립
- 분기별 Initiative와의 일치성 확인
- 참가자 일정 조율 시 정확한 날짜 기준 제공

---

## 📋 Step 1: 사전 준비

### 1.1 참가자 확정
**필수 참가자:**
- **도메인 전문가**: 해당 도메인의 비즈니스 지식이 풍부한 사람
- **PM**: 제품 전략 및 우선순위 결정
- **기획자**: 사용자 요구사항 및 UX 관점
- **시니어 개발자**: 기술적 실현 가능성 및 아키텍처 관점

**권장 참가자:**
- **주니어 개발자**: 구현 관점에서의 질문 및 학습
- **QA**: 테스트 관점에서의 시나리오 검증
- **디자이너**: 사용자 경험 관점

### 1.2 도구 및 환경 준비
**물리적 환경:**
- [ ] 넓은 벽면 또는 화이트보드
- [ ] 다양한 색상의 포스트잇 (이벤트용: 주황색, 커맨드용: 파란색, 액터용: 노란색)
- [ ] 마커펜
- [ ] 카메라 (결과물 촬영용)

**디지털 환경 (대안):**
- [ ] Miro, Mural, Figma 등 온라인 협업 도구
- [ ] 화면 공유 가능한 환경
- [ ] 녹화 도구 (온라인 세션의 경우)

### 1.3 사전 자료 준비
**준비할 자료:**
- [ ] Initiative 문서
- [ ] 기존 시스템 분석 자료
- [ ] 사용자 인터뷰 결과
- [ ] 경쟁사 분석 자료
- [ ] 비즈니스 요구사항 문서

---

## 📋 Step 2: Event Storming 진행

### 2.1 Phase 1: 이벤트 식별 (30-45분)

**목표**: 도메인에서 발생하는 모든 중요한 이벤트들을 식별

**진행 방법:**
1. **도메인 전문가가 먼저 시작**: 가장 중요한 이벤트부터 포스트잇에 작성
2. **시간순으로 배치**: 왼쪽에서 오른쪽으로 시간 순서대로 배치
3. **모든 참가자가 참여**: 각자의 관점에서 놓친 이벤트 추가
4. **질문 유도**: "그 다음에 뭐가 일어나나요?", "사용자가 뭘 하게 되나요?"

**이벤트 작성 규칙:**
- **과거형 동사 사용**: "~됨", "~완료됨", "~생성됨"
- **구체적으로 작성**: "주문됨" (O) vs "처리됨" (X)
- **도메인 언어 사용**: 비즈니스에서 실제 사용하는 용어

**예시:**
```
[주문요청됨] → [결제완료됨] → [커피제작시작됨] → [커피제작완료됨] → [수령됨]
```

### 2.2 Phase 2: 커맨드 식별 (20-30분)

**목표**: 각 이벤트를 발생시키는 커맨드(명령) 식별

**진행 방법:**
1. **각 이벤트 아래에 커맨드 배치**: "이 이벤트를 발생시키는 명령은?"
2. **액터와 연결**: "누가 이 명령을 내리는가?"
3. **중복 제거**: 같은 의미의 커맨드 통합

**커맨드 작성 규칙:**
- **명령형 동사 사용**: "주문하기", "결제하기", "제작시작하기"
- **액터 명시**: "고객이 주문하기", "바리스타가 제작시작하기"

**예시:**
```
[고객이 주문하기] → [주문요청됨]
[결제하기] → [결제완료됨]
[바리스타가 제작시작하기] → [커피제작시작됨]
```

### 2.3 Phase 3: 액터 식별 (15-20분)

**목표**: 시스템과 상호작용하는 모든 액터 식별

**진행 방법:**
1. **외부 액터**: 시스템 밖의 사람이나 시스템
2. **내부 액터**: 시스템 내부의 역할이나 서비스
3. **액터별 색상 구분**: 사람(노란색), 시스템(회색)

**액터 분류:**
- **Primary Actor**: 직접적인 사용자 (고객, 관리자)
- **Secondary Actor**: 간접적인 사용자 (바리스타, 매니저)
- **System Actor**: 자동화된 시스템 (결제시스템, 알림시스템)

### 2.4 Phase 4: 도메인 경계 탐색 (30-45분)

**목표**: Bounded Context의 경계를 찾아 색상으로 구분

**진행 방법:**
1. **관련 이벤트들을 그룹핑**: 논리적으로 연결된 이벤트들 묶기
2. **경계선 그리기**: 각 그룹을 색상으로 구분
3. **Context 이름 붙이기**: 각 경계의 이름 정의

**Context 식별 기준:**
- **동일한 언어 사용**: 같은 비즈니스 용어 사용
- **강한 응집성**: 내부 요소들이 밀접하게 연결
- **약한 결합성**: 다른 Context와의 의존성 최소화

**예시:**
```
[주문/결제 Context]     [제작/제공 Context]
[주문요청됨] → [결제완료됨] → [커피제작시작됨] → [커피제작완료됨]
```

---

## 📋 Step 3: 결과 정리 및 문서화

### 3.1 Event Storming 결과물

**촬영 및 정리:**
- [ ] 전체 보드 사진 촬영
- [ ] 각 Context별 상세 사진 촬영
- [ ] 참가자별 인사이트 정리
- [ ] 논의된 이슈 및 의견 정리

### 3.2 Event Storming 문서 작성

**문서 템플릿:**

```markdown
# [도메인명] Event Storming 결과

## 🎯 Event Storming 개요
**일시**: [날짜 및 시간]
**참가자**: [참가자 목록]
**목표**: [Event Storming의 목표]

## 📋 식별된 이벤트들

### [Context 1] 이벤트
- [이벤트 1]: [설명]
- [이벤트 2]: [설명]
- [이벤트 3]: [설명]

### [Context 2] 이벤트
- [이벤트 1]: [설명]
- [이벤트 2]: [설명]
- [이벤트 3]: [설명]

## 🎭 식별된 액터들

### Primary Actor
- [액터 1]: [역할 및 책임]
- [액터 2]: [역할 및 책임]

### Secondary Actor
- [액터 1]: [역할 및 책임]
- [액터 2]: [역할 및 책임]

### System Actor
- [액터 1]: [역할 및 책임]
- [액터 2]: [역할 및 책임]

## 🏗️ 식별된 Bounded Context

### [Context 1]
**목적**: [이 Context의 목적]
**주요 이벤트**: [핵심 이벤트들]
**주요 액터**: [관련 액터들]
**경계**: [다른 Context와의 경계]

### [Context 2]
**목적**: [이 Context의 목적]
**주요 이벤트**: [핵심 이벤트들]
**주요 액터**: [관련 액터들]
**경계**: [다른 Context와의 경계]

## 🔗 Context 간 통신

### [Context 1] → [Context 2]
**이벤트**: [전달되는 이벤트]
**목적**: [통신의 목적]
**트리거**: [언제 발생하는가]

### [Context 2] → [Context 1]
**이벤트**: [전달되는 이벤트]
**목적**: [통신의 목적]
**트리거**: [언제 발생하는가]

## 💡 주요 인사이트

### 비즈니스 관점
- [인사이트 1]
- [인사이트 2]
- [인사이트 3]

### 기술적 관점
- [인사이트 1]
- [인사이트 2]
- [인사이트 3]

## ❓ 미해결 이슈

### 비즈니스 이슈
- [이슈 1]: [설명 및 해결 방향]
- [이슈 2]: [설명 및 해결 방향]

### 기술적 이슈
- [이슈 1]: [설명 및 해결 방향]
- [이슈 2]: [설명 및 해결 방향]

## 🎯 다음 단계

### Process Model 작성
- [ ] [Context 1] Process Model 작성
- [ ] [Context 2] Process Model 작성
- [ ] Context 간 통신 모델 작성

### Epic 후보 도출
- [ ] [Epic 1]: [Context 1] 기반 Epic 정의
- [ ] [Epic 2]: [Context 2] 기반 Epic 정의
- [ ] 통합 Epic 정의

## 📎 첨부 자료
- [ ] Event Storming 보드 사진
- [ ] 참가자 인사이트 정리
- [ ] 관련 비즈니스 문서
```

---

## 📋 Step 4: Epic 후보 도출

### 4.1 Context별 Epic 식별

**각 Context에 대해:**
1. **핵심 사용자 여정 파악**: 사용자가 이 Context에서 달성하려는 목표
2. **Epic 후보 도출**: 사용자 여정을 지원하는 큰 기능 단위
3. **우선순위 설정**: 비즈니스 가치와 기술적 복잡도 고려

### 4.2 Epic 후보 검증

**검증 기준:**
- [ ] **사용자 가치**: 사용자에게 명확한 가치 제공
- [ ] **완결성**: 독립적으로 완료 가능한 기능
- [ ] **측정 가능성**: 완료 여부를 명확히 판단 가능
- [ ] **적절한 크기**: 2-6주 내 완료 가능한 범위

---

## 📋 Step 5: 다음 단계 준비

### 5.1 Process Model 작성 준비
- [ ] 각 Context별 Process Model 작성 일정 수립
- [ ] Process Model 작성 담당자 확정
- [ ] 관련 도메인 전문가와 추가 미팅 일정 조율

### 5.2 Epic 계획 수립 준비
- [ ] Epic 후보들의 우선순위 검토
- [ ] 각 Epic의 기술적 복잡도 평가
- [ ] 리소스 할당 계획 수립

---

## 🎯 완료 기준

Event Storming이 완료되었다고 판단할 수 있는 기준:

- [ ] **모든 주요 이벤트 식별**: 도메인의 핵심 이벤트들이 누락 없이 식별됨
- [ ] **명확한 Context 경계**: Bounded Context의 경계가 명확히 정의됨
- [ ] **액터 식별 완료**: 시스템과 상호작용하는 모든 액터 식별됨
- [ ] **Epic 후보 도출**: 구현할 Epic 후보들이 도출됨
- [ ] **문서화 완료**: 결과가 체계적으로 문서화됨
- [ ] **다음 단계 준비**: Process Model 작성 및 Epic 계획 수립 준비 완료

---

## 📚 관련 문서

- [Initiative 설정 가이드](./01-initiative-setup-guide.md)
- [Epic 계획 가이드](./03-epic-planning-guide.md)
- [Story 정의 가이드](./04-story-definition-guide.md)

---

## 💡 팁과 주의사항

### 성공적인 Event Storming을 위한 팁
- **도메인 전문가가 주도**: 비즈니스 지식이 풍부한 사람이 이끌어야 함
- **질문 많이 하기**: "왜?", "언제?", "누가?" 질문으로 깊이 파기
- **판단 유보**: 기술적 제약보다는 비즈니스 관점에서 먼저 생각
- **모든 의견 수렴**: 참가자 모두의 관점을 반영

### 주의사항
- **기술적 세부사항 피하기**: 구현 방법보다는 무엇을 할지에 집중
- **완벽함 추구하지 않기**: 100% 완벽한 결과보다는 방향성 확립
- **시간 관리**: 각 Phase별 시간을 엄수하여 전체 일정 지키기

---

## 🔧 Git 워크플로우

### 브랜치 생성 및 작업
```bash
# 1. 메인 브랜치에서 최신 상태로 업데이트
git checkout dev
git pull origin dev

# 2. Documentation 브랜치 생성 (Event Storming 결과)
git checkout -b docs/epic-001/event-storming

# 3. Event Storming 작업
# - Event Storming 워크샵 진행
# - 결과 정리 및 문서화
# - Context 경계 정의
# - Epic 후보 도출
```

### 커밋 메시지 규칙
```bash
# Event Storming 결과 정리
git add .
git commit -m "docs(event-storming): add workspace-structure event storming results

- Identify business events and domain boundaries
- Define bounded contexts (organization, workspace, page)
- Map actors and their interactions
- Document key insights and unresolved issues"

# Context 경계 정의
git add .
git commit -m "docs(event-storming): define domain boundaries and contexts

- Organization Context: Clerk integration and member management
- Workspace Context: Workspace creation and permission management
- Page Context: Page hierarchy and navigation
- Define context communication and integration points"

# Epic 후보 도출
git add .
git commit -m "docs(event-storming): derive epic candidates from event storming

- Epic 001: Workspace Structure Foundation
- Epic 002: Visual Canvas Integration
- Epic 003: Component System Management
- Analyze epic dependencies and priorities"
```

### GitHub에 푸시 및 PR 생성
```bash
# 1. 브랜치를 GitHub에 푸시
git push origin docs/epic-001/event-storming

# 2. GitHub에서 Pull Request 생성
# - 제목: "Event Storming: Workspace Structure Domain"
# - 설명: Event Storming 결과 및 도메인 경계 정의
# - 리뷰어: 도메인 전문가, 시니어 개발자, 기획자
# - 라벨: event-storming, documentation, domain-analysis
```

### PR 리뷰 체크리스트
**리뷰어가 확인할 사항:**
- [ ] **이벤트 완전성**: 주요 비즈니스 이벤트가 누락 없이 식별되었는가?
- [ ] **Context 경계 명확성**: Bounded Context의 경계가 명확히 정의되었는가?
- [ ] **액터 식별**: 시스템과 상호작용하는 모든 액터가 식별되었는가?
- [ ] **Epic 후보 적절성**: 도출된 Epic 후보들이 논리적으로 연결되어 있는가?
- [ ] **문서화 품질**: 결과가 체계적으로 문서화되었는가?

**승인 기준:**
- [ ] 도메인 전문가가 비즈니스 요구사항 정확성을 승인
- [ ] 시니어 개발자가 기술적 실현 가능성을 승인
- [ ] 기획자가 사용자 관점의 완전성을 승인
- [ ] 모든 참가자가 결과에 동의

### PR 병합 후 정리
```bash
# 1. PR 병합 후 로컬에서 정리
git checkout dev
git pull origin dev
git branch -d docs/epic-001/event-storming

# 2. 다음 단계 준비
# - Process Model 작성 시작
# - Software Design 계획 수립
# - Epic 계획 수립 시작
```

---

이 가이드를 따라하면 주니어 PM도 효과적으로 Event Storming을 진행할 수 있습니다! 🚀
