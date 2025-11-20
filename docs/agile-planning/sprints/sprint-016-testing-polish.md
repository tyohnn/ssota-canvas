# Sprint 016: Testing & Polish

## 🎯 Sprint 개요
**목표**: 1주 동안 통합 테스트, E2E 테스트, 성능 최적화, 버그 수정을 완료하여 AI Agent 기능을 프로덕션 레디 상태로 만든다

**기간**: 2025-12-10 (화) ~ 2025-12-16 (월) (1주)  
**팀**: 시니어 개발자 1명 + 주니어 개발자 1명 + QA 1명  
**Sprint 유형**: Implementation Sprint (Testing & Polish)  
**Story Points**: 10pts  

## 📋 포함 Story

### Story AI-001: AI Agent 기반 자연어 작업 자동화 (Phase 4: 10pts)

**Phase 4: Testing & Polish (10pts)**
- 통합 테스트 작성 (5pts)
- E2E 테스트 작성 (5pts)
- 성능 최적화 및 버그 수정

**참조 문서**: [Story AI-001](../stories/ai-management/story-ai-001-agent-based-automation.md)

---

## 📅 Sprint 일정

### Week 1 (2025-12-10 ~ 2025-12-16)

#### 화요일 (12/10)
- Sprint Planning 회의 (1시간)
- 통합 테스트 계획 수립
- ContextAssemblyService 통합 테스트 작성

#### 수요일 (12/11)
- ToolExecutionService 통합 테스트 작성
- AIQueryHandler 통합 테스트 작성
- MemorySearchService 통합 테스트 작성

#### 목요일 (12/12)
- E2E 테스트 시나리오 작성
  - 사용자 발화 처리 시나리오
  - Agent 툴 호출 시나리오
  - Long-Term Memory 검색 시나리오

#### 금요일 (12/13)
- E2E 테스트 실행 및 버그 수정
- 성능 테스트 실행
  - Agent 성공률 측정
  - 평균 응답 시간 측정
  - 컨텍스트 조립 시간 측정

#### 월요일 (12/16)
- 성능 최적화
  - BM25 검색 쿼리 최적화
  - 컨텍스트 조립 병렬화 개선
  - Redis 캐싱 적용
- 버그 수정 및 최종 검증
- Sprint 016 완료 및 회고
- **Epic 004 완료!** 🎉

---

## 📋 상세 Task 목록

### Phase 4: Testing & Polish (10pts)

#### 통합 테스트 작성 (5pts)
- [ ] **ContextAssemblyService 통합 테스트** (1.5pts)
  - Short-Term Memory 조립 테스트
  - Long-Term Memory 조립 테스트 (BM25 검색 + 메타데이터 필터링)
  - Canvas Context 조립 테스트 (외부 도메인 연동)
  - 병렬 컨텍스트 조립 테스트
  - 권한 검증 및 필터링 테스트
- [ ] **ToolExecutionService 통합 테스트** (1.5pts)
  - BlockManagementService 연동 테스트
  - CanvasManagementService 연동 테스트
  - 툴 실행 결과 파싱 테스트
  - 에러 처리 및 재시도 로직 테스트
  - Event Log 저장 테스트
- [ ] **AIQueryHandler 통합 테스트** (1.5pts)
  - 발화 처리 플로우 테스트
  - Vercel AI SDK 통합 테스트 (Mock)
  - Agent Loop 관리 테스트 (maxSteps 제한)
  - 타임아웃 처리 테스트
  - 이벤트 로깅 오케스트레이션 테스트
- [ ] **MemorySearchService 통합 테스트** (0.5pts)
  - BM25 검색 테스트
  - 메타데이터 패턴 매칭 테스트
  - 하이브리드 검색 테스트
  - 시간 가중치 적용 테스트

#### E2E 테스트 작성 (5pts)
- [ ] **시나리오 1: 사용자 발화 처리** (1.5pts)
  - Given: 사용자가 페이지에 로그인, 블럭 2개 선택
  - When: "선택한 블럭을 3개 복제해줘" 입력
  - Then: Agent가 자동으로 실행, addBlock 툴 6회 호출, 블럭 6개 생성
  - And: 모든 이벤트가 Event Log에 저장
- [ ] **시나리오 2: Agent 툴 호출** (1pts)
  - Given: 사용자가 "빨간색 사각형 블럭을 만들어줘" 요청
  - When: Agent가 addBlock 툴 호출
  - Then: BlockManagementService 직접 호출, 블럭 생성, 툴 호출 이벤트 저장
- [ ] **시나리오 3: Long-Term Memory 검색** (1pts)
  - Given: 이전에 "파란색 원 블럭 3개 생성" 요청
  - When: "지난번처럼 원 블럭 만들어줘" 요청
  - Then: BM25 검색으로 유사 발화 찾기, Long-Term Memory 참고, 파란색 원 블럭 3개 생성
- [ ] **시나리오 4: Agent Loop 제한** (1pts)
  - Given: 복잡한 작업 요청, 이미 9회 툴 호출 완료
  - When: 10번째 툴 호출 완료, 추가 툴 호출 시도
  - Then: Agent Loop 강제 종료, "작업이 너무 복잡합니다" 메시지 표시
- [ ] **시나리오 5: 권한 없는 블럭 접근** (0.5pts)
  - Given: 읽기 권한만 있는 블럭
  - When: "이 블럭을 삭제해줘" 요청
  - Then: 권한 오류 발생, "이 작업을 수행할 권한이 없습니다" 메시지 표시

#### 성능 최적화 (추가)
- [ ] **BM25 검색 쿼리 최적화**: 인덱스 힌트, 쿼리 플랜 분석
- [ ] **컨텍스트 조립 병렬화**: Promise.all 최적화, 에러 핸들링 개선
- [ ] **Redis 캐싱**: 컨텍스트 조립 결과 캐싱 (TTL: 5분)
- [ ] **Database 연결 풀**: 최적 연결 수 설정

#### 버그 수정 (추가)
- [ ] Sprint 014, 015에서 발견된 버그 수정
- [ ] E2E 테스트 중 발견된 버그 수정
- [ ] 에러 메시지 개선

---

## 🔗 의존성 및 리스크

### 의존성
- **선행 Sprint**: Sprint 014, 015 완료 필수
  - Event Log Foundation (Sprint 014)
  - Agent Integration (Sprint 015)
- **테스트 환경**: Supabase 테스트 DB, OpenAI API Key (테스트용)
- **QA 리소스**: E2E 테스트 실행 및 검증을 위한 QA 인력

### 리스크

#### 기술적 리스크
1. **E2E 테스트 불안정성**
   - **리스크**: E2E 테스트가 불안정하여 간헐적 실패 가능
   - **대응**: 재시도 로직, 테스트 격리, Mock 활용
   - **우선순위**: Medium

2. **성능 목표 미달**
   - **리스크**: Agent 성공률 < 85%, 평균 응답 시간 > 5초
   - **대응**: 쿼리 최적화, 캐싱 적용, 타임아웃 조정
   - **우선순위**: Medium

#### 일정 리스크
1. **버그 수정 지연**
   - **리스크**: E2E 테스트에서 예상치 못한 버그 다수 발견
   - **대응**: 버그 우선순위 설정, Critical 버그 집중 수정, 나머지는 다음 Sprint
   - **우선순위**: High

---

## 🎯 완료 기준 (Definition of Done)

### 기능적 완료
- [ ] **시나리오 1-6**: 모든 Acceptance Criteria 시나리오 정상 동작
- [ ] **Event Log**: 모든 이벤트(발화, AI 응답, 툴 호출, 블럭 변경) 저장 확인
- [ ] **Long-Term Memory 검색**: BM25 + 메타데이터 필터링 정상 동작
- [ ] **Agent Loop 제한**: maxSteps 10회, 타임아웃 30초 정상 동작
- [ ] **권한 검증**: 권한 없는 블럭 접근 시 에러 처리 정상 동작
- [ ] **UI/UX**: Conversation 호버 동작, 실시간 상태 표시 정상 동작

### 기술적 완료
- [ ] **단위 테스트 커버리지**: 85% 이상
- [ ] **통합 테스트**: 모든 통합 테스트 통과
  - ContextAssemblyService
  - ToolExecutionService
  - AIQueryHandler
  - MemorySearchService
- [ ] **E2E 테스트**: 5개 시나리오 모두 통과
- [ ] **성능 요구사항**: 
  - ✅ Agent 성공률 > 85%
  - ✅ 평균 응답 시간 < 5초
  - ✅ 컨텍스트 조립 시간 < 2초
- [ ] **코드 리뷰**: 모든 코드 리뷰 완료

### 품질 완료
- [ ] **Critical 버그**: 0개
- [ ] **High 버그**: 0개
- [ ] **Medium 버그**: 최소화 (다음 Sprint로 이관 가능)
- [ ] **보안 취약점**: 0개
- [ ] **RLS 정책**: 페이지별 접근 제어 검증 완료
- [ ] **접근성**: 키보드 포커스, 스크린 리더 지원 검증 완료
- [ ] **문서화**: 
  - README 업데이트
  - API 문서 작성
  - 사용자 가이드 작성

---

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **12/10 (화)**: Sprint Planning 완료, ContextAssemblyService 통합 테스트
- [ ] **12/11 (수)**: ToolExecutionService, AIQueryHandler 통합 테스트
- [ ] **12/12 (목)**: E2E 테스트 시나리오 작성
- [ ] **12/13 (금)**: E2E 테스트 실행, 성능 테스트
- [ ] **12/16 (월)**: 성능 최적화, 버그 수정, Sprint 회고

### 주간 체크포인트
- [ ] **Week 1 종료 (12/16)**: Testing & Polish 완료
  - 통합 테스트 작성 완료 (커버리지 85% 이상)
  - E2E 테스트 작성 및 실행 완료 (5개 시나리오 통과)
  - 성능 목표 달성 (Agent 성공률 > 85%, 평균 응답 시간 < 5초)
  - Critical/High 버그 0개
  - **Epic 004 완료!** 🎉

---

## 📁 관련 문서

### Epic & Story
- [Epic 004: Basic AI Context Engineering](../epics/epic-004-basic-ai-context-engineering.md)
- [Story AI-001: AI Agent 기반 자연어 작업 자동화](../stories/ai-management/story-ai-001-agent-based-automation.md)

### Domain Documentation
- [AI Management Domain - Software Design](../../event-domain-design/domains/ai-management-domain/03-software-design.md)
- [AI Management Domain - Technical Specification](../../event-domain-design/domains/ai-management-domain/04-technical-specification.md)
- [AI Management Domain - Testing Strategy](../../event-domain-design/domains/ai-management-domain/05-testing-strategy.md) (작성 예정)

### Previous Sprints
- [Sprint 014: AI Foundation](./sprint-014-ai-foundation.md)
- [Sprint 015: Agent Integration](./sprint-015-agent-integration.md)

---

## 💡 Sprint 회고 준비

### Start (새로 시작할 것)
- TBD (Sprint 종료 시 작성)

### Stop (중단할 것)
- TBD (Sprint 종료 시 작성)

### Continue (계속할 것)
- TBD (Sprint 종료 시 작성)

---

## 📊 성능 목표

### Agent 성공률
- **목표**: > 85%
- **측정 방법**: 성공한 요청 수 / 전체 요청 수

### 평균 응답 시간
- **목표**: < 5초
- **측정 방법**: 발화부터 Agent 완료까지의 시간 평균

### 컨텍스트 조립 시간
- **목표**: < 2초
- **측정 방법**: 3가지 컨텍스트 조립 완료 시간

### 툴 호출 평균 횟수
- **목표**: 2-5개
- **측정 방법**: Agent당 평균 툴 호출 횟수

---

## 📝 노트

- **E2E 테스트**: Playwright 또는 Cypress 사용
- **성능 테스트**: k6 또는 Apache JMeter 사용
- **버그 트래킹**: GitHub Issues 사용
- **Critical 버그 우선**: Sprint 내 반드시 수정
- **Medium 버그**: 다음 Sprint로 이관 가능

---

## 🎉 Epic 004 완료!

Sprint 016 완료 시 **Epic 004: Basic AI Context Engineering**이 완료됩니다!

**완료 기준**:
- ✅ 사용자가 AI Agent에게 자연어로 작업을 요청할 수 있음
- ✅ Agent가 자동으로 툴을 호출하여 블럭 조작
- ✅ Long-Term Memory 기반 과거 작업 참조
- ✅ 모든 이벤트가 Event Log에 저장
- ✅ Agent Loop 제한 및 타임아웃 적용
- ✅ 실시간 상태 표시 및 Conversation UI

**다음 단계**: Advanced AI Features (Multi-Agent, 워크플로우 자동화) - 추후 Epic으로 계획

---

**Sprint 016 시작일**: 2025-12-10 (화)  
**Sprint 016 종료일**: 2025-12-16 (월)  
**Epic 004 완료 예정일**: 2025-12-16 (월) 🎉

