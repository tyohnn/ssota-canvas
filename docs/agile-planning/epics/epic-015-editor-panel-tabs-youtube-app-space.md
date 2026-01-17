# Epic-015: Editor Panel Dynamic Tabs & YouTube App Space

## 🎯 Epic 개요
**Epic Goal**: As a 사용자, I want to 블록 타입별로 에디터 패널에 커스텀 탭을 사용하고 YouTube 블록의 스크립트를 효율적으로 관리받아 so that 다양한 블록 타입에 맞는 편집 경험을 제공받고 데이터 중복 없이 YouTube 스크립트를 재사용할 수 있다

**기간**: 2026-01-11 ~ 2026-01-24 (2주, 1 Sprint)  
**Story Points**: 34pts (예상)  
**우선순위**: High  
**현재 상태**: 📋 계획 중

## 📊 비즈니스 가치

### 문제 정의
1. **에디터 패널의 정적 구조**: 
   - 모든 블록 타입에 동일한 에디터 패널 구조 사용
   - 블록 타입별 특화된 편집 기능 추가 어려움
   - 확장 가능한 탭 시스템 부재

2. **YouTube 스크립트 데이터 중복**: 
   - 같은 YouTube 영상을 여러 사용자가 사용할 때 스크립트가 각 블록에 중복 저장
   - 블록 테이블 비대화 위험
   - 스크립트 추출 API 호출 중복 (비용 증가)

3. **데이터 관리 비효율**:
   - 스크립트 데이터가 블록 properties에 직접 저장되어 재사용 불가
   - YouTube 메타데이터(채널 정보, 통계 등) 관리 어려움

### 해결책
1. **동적 탭 시스템**: 
   - 블록 타입별로 에디터 패널에 커스텀 탭 추가 가능
   - 동적 로딩으로 초기 번들 크기 최적화
   - 확장 가능한 아키텍처 (PDF, Audio, Link 등 다른 블록 타입 확장 용이)

2. **YouTube 데이터 중앙 관리**: 
   - YouTube 데이터를 별도 스키마로 관리하여 블록 테이블 비대화 방지
   - 같은 YouTube 영상은 한 번만 저장하여 데이터 중복 제거
   - 스크립트 재사용으로 API 호출 및 저장 비용 절감

3. **효율적인 데이터 관리**:
   - 블록에는 YouTube 참조만 저장
   - 실제 스크립트는 중앙 저장소에서 관리
   - 권한 기반 접근 제어 (블록 소유자만 스크립트 접근)

### 기대 효과
- ✅ **확장 가능한 에디터**: 블록 타입별 특화 편집 기능 추가 용이
- ✅ **데이터 효율성**: YouTube 스크립트 중복 제거로 99% 저장 공간 절감 (100명이 같은 영상 사용 시)
- ✅ **비용 절감**: 스크립트 추출 API 호출 중복 제거로 비용 절감
- ✅ **사용자 경험 개선**: YouTube 블록에 Script 탭 추가로 스크립트 편집 용이

---

## 🎯 성공 기준

### 기능적 기준
- [ ] 동적 탭 시스템: 블록 타입별 탭 config 동적 로드 및 렌더링
- [ ] YouTube App Space: `youtubes`, `channels` 테이블 생성 및 RLS 정책 적용
- [ ] YouTube 스크립트 관리: 스크립트 추출, 저장, 조회 기능 완성
- [ ] Script 탭: YouTube 블록에 Script 탭 추가 및 스크립트 표시/편집
- [ ] Note 탭: 기존 markdown content section을 Note 탭으로 리팩토링

### 성능 기준
- [ ] 탭 config 로딩: 초기 번들에 포함되지 않고 필요 시 동적 로드
- [ ] 스크립트 조회: 500ms 이내 응답
- [ ] 데이터 중복 제거: 같은 YouTube 영상 100개 블록 사용 시 1개만 저장

### 사용성 기준
- [ ] 직관적인 탭 전환: 배지 형태의 탭 UI로 쉬운 전환
- [ ] 스크립트 편집: Script 탭에서 스크립트 확인 및 편집 가능
- [ ] 자동 저장: 스크립트 변경 시 자동 저장

### 품질 기준
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 통과
- [ ] RLS 정책 적용 완료
- [ ] 보안 취약점 0개
- [ ] 번들 크기 검증: 초기 번들에 탭 config 미포함 확인

---

## 📋 포함 기능

### 핵심 기능
- **동적 탭 시스템**: 블록 타입별로 에디터 패널에 커스텀 탭 추가
- **YouTube 데이터 관리**: YouTube 영상 정보 및 스크립트를 중앙에서 관리
- **스크립트 관리**: YouTube 스크립트 추출, 저장, 조회 기능
- **Script 탭**: YouTube 블록 전용 Script 탭으로 스크립트 편집
- **Note 탭**: 기존 markdown content section을 Note 탭으로 리팩토링

### 지원 기능
- **탭 설정 시스템**: 블록 타입별 탭 구성 관리
- **권한 관리**: 블록 소유자만 YouTube 스크립트 접근 가능
- **자동 스크립트 추출**: YouTube 영상 추가 시 자동으로 스크립트 추출 (선택적)

### 통합 기능
- **Block Management 연동**: YouTube 블록 properties에 `youtubeId` 참조 추가
- **Workspace Management 연동**: 권한 기반 접근 제어
- **YouTube API 연동**: YouTube Data API를 통한 메타데이터 및 스크립트 추출

---

## 🚫 제외 범위
- **다른 블록 타입 확장**: PDF, Audio, Link 블록 탭은 향후 별도 Story에서 처리
- **채널 통계 업데이트**: Cron 기반 통계 업데이트는 향후 별도 Story에서 처리
- **스크립트 버전 관리**: 스크립트 히스토리/버전 관리 기능은 제외
- **스크립트 번역**: 다국어 스크립트 번역 기능은 제외

---

## 🔗 의존성
**선행 Epic**: Epic-001 (Block Management Domain)  
**후행 Epic**: 없음  
**외부 의존성**: 
- YouTube Data API (스크립트 추출)
- Block Management Domain (블록 properties 관리)
- Workspace Management Domain (권한 관리)

---

## 🏗️ 기술적 고려사항

### 아키텍처
- **동적 로딩**: 탭 설정은 필요 시에만 로드하여 초기 번들 크기 최적화
- **DDD 패턴**: YouTube App Space는 도메인 주도 설계 패턴 적용
- **백엔드 패턴**: 프로젝트 표준 백엔드 패턴 준수

### 성능
- **동적 로딩**: 탭 설정은 초기 번들에 포함하지 않고 필요 시 로드
- **데이터 중복 제거**: 같은 YouTube 영상은 한 번만 저장하여 저장 공간 절감
- **CDN 활용**: YouTube 썸네일은 YouTube CDN 링크 사용

### 보안
- **권한 기반 접근 제어**: 블록 소유자만 YouTube 스크립트 접근 가능
- **데이터 검증**: 모든 입력 데이터 검증 및 권한 확인

---

## 📅 마일스톤
- **Week 1**: YouTube 데이터 관리 시스템 구축
- **Week 2**: 동적 탭 시스템 구축 및 Script 탭 구현

---

## 🎯 완료 기준
- [ ] 모든 핵심 기능 완료
- [ ] 성공 기준 달성
- [ ] 사용자 테스트 통과
- [ ] 다음 Epic 준비 완료

---

## 📁 관련 문서
- [구현 계획](../../.cursor/plans/editor_panel_tab_system_77668b25.plan.md)
- [백엔드 패턴 가이드](../../patterns/backend/server-side-ddd-conventions.md)
- [Image App Space 스키마](../../apps/web/src/db/schemas/image-app-space-schema.ts) (참고)

---

## 📋 포함 Story
- **Story E015-001**: 동적 에디터 탭 시스템 구축 (13pts)
- **Story E015-002**: YouTube App Space 도메인 구축 및 Script 탭 구현 (21pts)

**총 Story Points**: 34pts
