# Source Management 문서

링크 기반 콘텐츠(YouTube, PDF, X, 스레드, 오디오 등)의 추출·요약·블록 연결에 대한 설계 문서입니다.

## 문서 목록

- **[architecture.md](./architecture.md)** — App Space / Sources / Blocks 구분, 옵션 B(통합 Sources + 소스 기준 요약) 설계, raw_content·metadata 역할, 과금·다국어·마이그레이션 정리
- **[plan.md](./plan.md)** — YouTube App Space → Sources 마이그레이션 계획. 결정사항, DB 스키마, 파이프라인 매핑, 열린 논의
- **[vercel-workflow-source-job-research.md](./vercel-workflow-source-job-research.md)** — 소스 요약 파이프라인 Vercel Workflow 전환 리서치. 현재 Queue/Cron/Edge 구조, WDK 도입 시 로직·인프라 변화, 마이그레이션 계획
