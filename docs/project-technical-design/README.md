# Project Technical Design 문서 가이드

이 폴더는 **프로젝트 전체의 기술 아키텍처**와 **시스템 설계** 문서들을 포함합니다.

## 📁 폴더 구조

```
project-technical-design/
├── README.md                    # 이 문서 (폴더 가이드)
├── architecture-overview.md     # 전체 시스템 아키텍처
├── technology-stack.md          # 기술 스택 선택 및 이유
├── unified-database-schema.md   # 통합 DB 스키마
├── cross-cutting-concerns/      # 공통 관심사
│   ├── error-handling.md        # 에러 처리 전략
│   └── logging-strategy.md      # 로깅 전략
└── infrastructure/              # 인프라 설계
    ├── deployment-strategy.md   # 배포 전략
    └── monitoring-setup.md      # 모니터링 설정
```

## 🎯 협업 방식

### 작성 및 관리 책임
- **작성자**: 시니어 개발자 (아키텍트)
- **리뷰어**: PO, 기획자, 시니어 개발자
- **작업 순서**:
  1. 아키텍처 개요 및 기술 스택 정의
  2. 데이터베이스 스키마 설계
  3. 크로스컷팅 콘서트 (에러 처리, 로깅 등) 정의
  4. 인프라 설계 (배포, 모니터링)
  5. PO/기획자와 리뷰 및 조율

### 업데이트 프로세스
1. **변경 필요성 식별**: 새로운 기술 도입이나 아키텍처 변경 시
2. **영향 범위 분석**: 관련 도메인들과의 의존성 확인
3. **동시 업데이트**: 관련 Technical Specification들도 함께 업데이트
4. **팀 리뷰**: PO, 기획자, 시니어 개발자와 검토
5. **배포 계획 수립**: 변경사항에 따른 배포 전략 수립

## 📋 각 문서의 역할

### architecture-overview.md
- **목적**: 전체 시스템 아키텍처와 이벤트 플로우 정의
- **작성자**: 시니어 개발자
- **주요 내용**:
  - High-Level Architecture 다이어그램
  - Domain Event Communication 패턴
  - Technology Stack 개요
  - Project Structure
  - Data Flow 및 Deployment Architecture

### technology-stack.md
- **목적**: 기술 스택 선택 이유와 사용법 정의
- **작성자**: 시니어 개발자
- **주요 내용**:
  - Core Technologies (Next.js, TypeScript, Supabase 등)
  - Architecture Patterns (DDD, Clean Architecture, Event-Driven)
  - 개발 도구 및 설정
  - 라이브러리 선택 기준

### unified-database-schema.md
- **목적**: 모든 도메인의 통합 데이터베이스 스키마
- **작성자**: 시니어 개발자
- **주요 내용**:
  - 테이블 설계 및 관계
  - 인덱스 전략
  - 마이그레이션 계획
  - 성능 고려사항

### cross-cutting-concerns/
공통으로 적용되는 기술적 관심사들:

#### error-handling.md
- **에러 분류**: 비즈니스 에러 vs 시스템 에러
- **에러 처리 전략**: 재시도, 폴백, 사용자 알림
- **로깅 전략**: 어떤 정보를 언제 기록할지

#### logging-strategy.md
- **로그 레벨**: DEBUG, INFO, WARN, ERROR
- **로그 포맷**: 구조화된 로그 형식
- **로그 저장소**: 파일, 데이터베이스, 외부 서비스

### infrastructure/
시스템 운영과 관련된 설계:

#### deployment-strategy.md
- **배포 환경**: 개발, 스테이징, 프로덕션
- **CI/CD 파이프라인**: 자동화된 배포 프로세스
- **롤백 전략**: 배포 실패 시 복구 방법

#### monitoring-setup.md
- **모니터링 대상**: 성능, 에러, 사용자 행동
- **알림 설정**: 장애 발생 시 알림 기준
- **대시보드**: 운영팀이 확인할 메트릭

## 🎯 작업 체크리스트

### 새로운 프로젝트 시작 시
- [ ] Architecture Overview 문서 작성
- [ ] Technology Stack 문서 작성
- [ ] Database Schema 설계
- [ ] Cross-Cutting Concerns 정의
- [ ] Infrastructure 설계
- [ ] PO/기획자와 리뷰 완료

### 기술 스택 변경 시
- [ ] 변경 영향도 분석 (모든 도메인 영향 확인)
- [ ] Technology Stack 문서 업데이트
- [ ] 관련 Technical Specification들 업데이트
- [ ] 마이그레이션 계획 수립
- [ ] 팀 리뷰 및 승인

### 인프라 변경 시
- [ ] Infrastructure 문서 업데이트
- [ ] 배포 프로세스 변경사항 반영
- [ ] 모니터링 설정 업데이트
- [ ] 운영팀 교육 및 공지

---

## 📚 관련 문서

- **[상위 문서화 가이드](../../../README.md)**: 전체 문서화 시스템 개요
- **[이벤트 도메인 디자인 가이드](../event-domain-design/README.md)**: 도메인별 설계 문서
- **[애자일 계획 가이드](../agile-planning/README.md)**: 개발 계획 문서

---

이 문서화 시스템을 통해 **확장 가능하고 유지보수하기 쉬운 아키텍처**를 구축할 수 있습니다! 🏗️
