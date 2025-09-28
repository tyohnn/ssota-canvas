# Initiative-001: Core Whiteboard & Block System

## 🎯 Initiative 개요
- **목표**: 화이트보드 기반 블록 시스템 완성 및 기본 AI 통합
- **기간**: 2025년 9월 28일 ~ 2025년 10월 12일
- **주요 KPI**: AI 통합 만족도 4.0/5.0 이상, 개발자 경험 70% 단축

## 📊 비즈니스 가치
- **문제**: 서비스 개발팀이 기획→계획→디자인→개발 과정에서 여러 도구를 번갈아 사용하며, AI와의 협업이 불가능하고 컴포넌트 재사용이 어려움
- **해결책**: React Flow 기반 화이트보드에서 블록 단위로 작업하고, 동일 속성 블록을 컴포넌트화하여 재사용하며, AI와 자연스럽게 협업할 수 있는 플랫폼 구축
- **기대 효과**: 개발 워크플로우 시간 50% 단축, AI 기반 자동화, 컴포넌트 재사용성 향상

## 🎯 성공 지표
### 주요 KPI
- **AI 통합 만족도**: 4.0/5.0 이상 (사용자 피드백 설문 및 실제 사용 패턴 분석, 월간)
- **개발자 경험**: 기본 프로토타입 제작 시간 70% 단축 (기존 도구 대비, 월간)

### 보조 KPI
- **블록 컴포넌트화 사용률**: 베타 사용자 80%가 동일 속성 블록을 컴포넌트화하여 사용 (플랫폼 내 컴포넌트 생성/사용 빈도 분석, 주간)
- **화이트보드 안정성**: 크래시 없이 안정적 동작 (에러 로깅 및 사용자 신고, 일간)

## 🏛️ 도메인/기능 영역 분류

### Domain 1: 사용자 관리 도메인 (User Management Domain)
- **책임**: 사용자 인증, 조직 생성/관리, 멤버 관리, 권한 제어
- **핵심 개념**: User, Organization, Member, Permission, Role, Authentication
- **Event Storming 우선순위**: 1순위 (모든 도메인의 기반)

### Domain 2: 워크스페이스 구조 도메인 (Workspace Structure Domain)
- **책임**: 워크스페이스 생성/관리, 페이지 관리, 폴더 구조, 네비게이션
- **핵심 개념**: Workspace, Page, Folder, Navigation, Hierarchy
- **Event Storming 우선순위**: 2순위 (사용자 관리 의존)

### Domain 3: 시각적 캔버스 도메인 (Visual Canvas Domain)
- **책임**: 화이트보드 엔진, 캔버스 조작, 뷰포트 관리, 줌/선택 기능
- **핵심 개념**: Canvas, Viewport, Zoom, Selection, Transform, ReactFlow
- **Event Storming 우선순위**: 3순위 (워크스페이스 구조 의존)

### Domain 4: 블록 시스템 도메인 (Block System Domain)
- **책임**: 블록 생성/편집/삭제, 블록 타입 관리, 속성 시스템, 콘텐츠 관리
- **핵심 개념**: Block, BlockType, Property, Content, Markdown, Shape
- **Event Storming 우선순위**: 4순위 (시각적 캔버스 의존)

### Domain 5: 컴포넌트 시스템 도메인 (Component System Domain)
- **책임**: 컴포넌트 정의, 인스턴스 관리, 보기 모드 변환, 템플릿 관리
- **핵심 개념**: Component, Instance, ViewMode, Template, Table, Kanban, Calendar
- **Event Storming 우선순위**: 5순위 (블록 시스템 의존)

### Domain 6: AI 통합 도메인 (AI Integration Domain)
- **책임**: AI API 연동, 요청/응답 처리, AI 기능 제공, 자동화 지원
- **핵심 개념**: AIRequest, AIResponse, AIAgent, AITool, OpenAI, Automation
- **Event Storming 우선순위**: 6순위 (모든 도메인과 연동)

**참고**: Epic의 구체적인 정의는 각 도메인별 Event Storming 이후 Epic Planning에서 진행

## 🚫 제외 범위
- **고급 AI 에이전트**: 워크플로우 자동화는 Q4 Initiative에서 다룸
- **실시간 협업**: 팀 협업 기능은 Q4 Initiative에서 다룸
- **개발 관련 블록**: 코드 블록, GitHub 연동은 Q4 Initiative에서 다룸
- **템플릿 시스템**: 프로젝트 템플릿은 Q4 Initiative에서 다룸
- **공유 기능**: 그로스 엔진은 Q4 Initiative에서 다룸
- **모바일 최적화**: 아이패드/모바일은 2026년 Q2에서 다룸
- **다국어 지원**: 글로벌화는 2026년 Q2에서 다룸

## 🔗 의존성
**외부 의존성**: 
- React Flow 라이브러리 (오픈소스)
- OpenAI API (외부 서비스)
- Next.js, React, TypeScript (기술 스택)

**내부 의존성**: 
- Project Vision 승인 완료
- 기술 스택 결정 (Next.js 풀스택, Supabase, Clerk)
- 개발팀 구성 및 역할 분담

## 📅 도메인별 Event Storming 일정 및 마일스톤
- **10월 1일**: Domain 1 (사용자 관리) Event Storming 완료
- **10월 2일**: Domain 2 (워크스페이스 구조) Event Storming 완료
- **10월 3일**: Domain 3 (시각적 캔버스) Event Storming 완료
- **10월 4일**: Domain 4 (블록 시스템) Event Storming 완료
- **10월 5일**: Domain 5 (컴포넌트 시스템) Event Storming 완료
- **10월 6일**: Domain 6 (AI 통합) Event Storming 완료
- **10월 7일**: 모든 도메인 통합 Epic Planning 완료
- **10월 12일**: 모든 도메인 기반 MVP 구현 완료

## 🎯 완료 기준
- [ ] 모든 도메인 Event Storming 완료
- [ ] 도메인별 Epic Planning 완료
- [ ] 주요 KPI 달성 (AI 만족도 4.0/5.0, 개발자 경험 70% 단축)
- [ ] 6개 도메인 기반 MVP 구현 완료
- [ ] 베타 사용자 피드백 수집 및 분석
- [ ] Q4 Initiative 계획 수립 (Developer Market Entry)

---

이 Initiative는 **25/26 시즌의 첫 번째 단계**로, AI 통합 화이트보드 플랫폼의 핵심 기반을 구축합니다.
