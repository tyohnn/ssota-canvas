# 쏘타(Ssota) 프로젝트 로드맵

## 🎯 프로젝트 비전
쏘타는 블록 기반의 협업 플랫폼으로, 사용자들이 직관적인 블록 시스템을 통해 아이디어를 구조화하고 협업할 수 있는 도구입니다.

## 📋 로드맵 개요

### Phase 1: MVP & Market Validation (현재 ~ 6개월)
**목표**: 빠른 시장 검증 및 사용자 피드백 수집

#### 1.1 현재 구조 유지 및 최적화
- **Next.js 풀스택 앱**으로 단일 배포
- **도메인 기반 아키텍처** 유지 (apps/web/src/domains/)
- **빠른 개발 속도** 우선
- **사용자 피드백** 수집 및 반복 개선

#### 1.2 핵심 기능 구현
- ✅ 블록 생성 및 관리
- ✅ 캔버스 기반 협업
- ✅ 워크스페이스 관리
- ✅ 사용자 인증 및 권한 관리
- 🔄 블록 툴 및 AI 기능
- 🔄 컴포넌트 시스템

#### 1.3 배포 및 운영
- **Vercel/Netlify** 기반 배포
- **Supabase** 데이터베이스
- **사용자 분석** 및 피드백 수집
- **성능 최적화**

---

### Phase 2: Core Package Extraction (6개월 ~ 12개월)
**목표**: 핵심 로직 패키지화 및 내부 재사용성 확보

#### 2.1 도메인 로직 분리
```
packages/
├── @ssota/core/                    # 핵심 도메인 로직
│   ├── block-management/           # 블록 관리 도메인
│   │   ├── entities/               # Block, BlockType 엔티티
│   │   ├── value-objects/          # BlockId, PropertyType 등
│   │   ├── services/               # BlockService, PropertyService
│   │   └── repositories/           # Repository 인터페이스
│   ├── canvas-management/          # 캔버스 관리 도메인
│   ├── workspace-management/       # 워크스페이스 관리 도메인
│   └── organization-management/   # 조직 관리 도메인
├── @ssota/database/               # 데이터베이스 어댑터
│   ├── drizzle/                   # Drizzle ORM 구현
│   └── interfaces/                 # Repository 인터페이스
└── @ssota/shared/                 # 공통 유틸리티
```

#### 2.2 앱별 어댑터 구조
```
apps/
├── web/                           # Next.js 웹앱
│   └── src/domains/               # 앱별 도메인 어댑터
│       ├── block-management/
│       │   ├── actions/           # Next.js Server Actions
│       │   ├── components/        # React 컴포넌트
│       │   └── hooks/             # React 훅
│       └── canvas-management/
├── mobile/                        # React Native 앱 (미래)
└── desktop/                       # Electron 앱 (미래)
```

#### 2.3 마이그레이션 전략
1. **점진적 분리**: 도메인별로 순차적으로 packages로 이동
2. **인터페이스 우선**: Repository 인터페이스 먼저 정의
3. **의존성 역전**: 앱이 packages에 의존하도록 구조 변경
4. **테스트 커버리지**: 각 패키지별 독립 테스트

---

### Phase 3: Open Source Core Packages (12개월 ~ 18개월)
**목표**: 핵심 패키지 오픈소스화 및 생태계 구축

#### 3.1 오픈소스 패키지 출시
```typescript
// npm 패키지로 배포
@ssota/core                    # 핵심 도메인 로직
@ssota/database-drizzle        # Drizzle 어댑터
@ssota/database-prisma         # Prisma 어댑터 (미래)
@ssota/ui                      # UI 컴포넌트 라이브러리
@ssota/api-client             # HTTP API 클라이언트
```

#### 3.2 사용자 선택권 제공
```typescript
// Option 1: Next.js 사용자
import { createBlockAction } from '@ssota/nextjs-actions';

// Option 2: 다른 프레임워크 사용자
import { SsotaApiClient } from '@ssota/api-client';

// Option 3: 직접 서비스 사용
import { BlockService } from '@ssota/core';
```

#### 3.3 생태계 구축
- **문서화**: 상세한 API 문서 및 가이드
- **예제 앱**: 다양한 프레임워크별 예제
- **커뮤니티**: Discord/Slack 채널 운영
- **기여 가이드**: 오픈소스 기여 방법

---

### Phase 4: Multi-Platform Expansion (18개월 ~ 24개월)
**목표**: 다양한 플랫폼 지원 및 내부 팀 확장

#### 4.1 플랫폼 확장
```
apps/
├── web/                        # Next.js 웹앱
├── mobile/                    # React Native 앱
├── desktop/                   # Electron 앱
├── api/                       # 독립 API 서버
└── admin/                     # 관리자 대시보드
```

#### 4.2 마이크로서비스 아키텍처
```
services/
├── block-service/             # 블록 관리 서비스
├── canvas-service/            # 캔버스 관리 서비스
├── workspace-service/         # 워크스페이스 관리 서비스
└── notification-service/      # 알림 서비스
```

#### 4.3 내부 팀 도구
- **개발자 도구**: CLI, VS Code 확장
- **디자인 시스템**: 통합 UI 컴포넌트
- **모니터링**: 성능 및 에러 추적
- **배포 자동화**: CI/CD 파이프라인

---

## 🛠️ 기술적 고려사항

### 현재 구조의 장점
- ✅ **빠른 개발**: 모든 코드가 한 곳에 있어 개발 속도 빠름
- ✅ **간단한 의존성**: Next.js 특화 기능 자유롭게 사용
- ✅ **통합 테스트**: 전체 앱을 하나의 단위로 테스트 가능

### 미래 확장을 위한 준비
- 🔄 **도메인 분리**: 비즈니스 로직을 프레임워크 독립적으로
- 🔄 **인터페이스 정의**: Repository 패턴으로 데이터 접근 추상화
- 🔄 **의존성 주입**: IoC 컨테이너 도입 고려
- 🔄 **이벤트 기반**: 도메인 이벤트를 통한 느슨한 결합

### 마이그레이션 리스크 관리
- **점진적 전환**: 한 번에 하나의 도메인씩 분리
- **하위 호환성**: 기존 API 유지하면서 새로운 구조 도입
- **테스트 우선**: 리팩토링 전후 동일한 동작 보장
- **롤백 계획**: 문제 발생 시 이전 구조로 복원 가능

---

## 📊 성공 지표

### Phase 1 (MVP)
- **사용자 수**: 월 활성 사용자 1,000명
- **사용률**: 일일 활성 사용자 100명
- **피드백**: 사용자 만족도 4.0/5.0 이상

### Phase 2 (Package Extraction)
- **재사용성**: 내부 프로젝트에서 패키지 사용률 80%
- **개발 속도**: 새 기능 개발 시간 30% 단축
- **코드 품질**: 테스트 커버리지 90% 이상

### Phase 3 (Open Source)
- **다운로드**: npm 패키지 월 다운로드 10,000회
- **기여자**: 외부 기여자 10명 이상
- **생태계**: 커뮤니티 멤버 500명 이상

### Phase 4 (Multi-Platform)
- **플랫폼**: 3개 이상 플랫폼 지원
- **서비스**: 5개 이상 마이크로서비스 운영
- **팀**: 내부 개발팀 10명 이상

---

## 🎯 결론

이 로드맵은 **점진적이고 실용적인 접근**을 통해 쏘타의 성장을 지원합니다:

1. **Phase 1**: 시장 검증을 통한 제품-시장 적합성 확보
2. **Phase 2**: 내부 재사용성을 통한 개발 효율성 향상
3. **Phase 3**: 오픈소스 생태계를 통한 브랜드 가치 증대
4. **Phase 4**: 다중 플랫폼을 통한 시장 확장

각 단계는 이전 단계의 성공을 바탕으로 진행되며, 필요에 따라 조정 가능한 유연한 구조를 유지합니다.
