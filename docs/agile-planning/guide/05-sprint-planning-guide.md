# Sprint 계획 가이드

이 가이드는 주니어 PM이 **Sprint**를 계획하는 전체 과정을 단계별로 안내합니다.

## 🎯 Sprint란?

**Sprint**는 일정한 기간(보통 1-2주) 동안 완료할 수 있는 작업들을 묶어서 계획하고 실행하는 단위입니다.

### Sprint 유형
1. **Documentation Sprint**: 문서화 작업 (Event Storming → Process Model → Software Design → Technical Specification)
2. **Implementation Sprint**: 실제 코드 개발 및 테스트

---

## 📋 Step 0: 현재 날짜 확인

### 0.1 작업 시작 전 날짜 확인
```bash
# 현재 날짜 확인
date

# 예시 출력: Sun Sep 28 15:56:33 KST 2025
```

**날짜 확인 목적:**
- 현재 시점 파악으로 적절한 Sprint 계획 수립
- Story와의 일치성 확인
- Sprint 기간(1-2주) 설정 시 정확한 타임라인 계산

---

## 📋 Step 1: Sprint 목표 설정

### 1.1 Sprint 목표 정의

**Sprint 목표 작성 규칙:**
- **구체적**: 모호하지 않은 명확한 목표
- **측정 가능**: 완료 여부를 명확히 판단 가능
- **달성 가능**: Sprint 기간 내 완료 가능한 범위
- **가치 중심**: 사용자나 비즈니스에게 명확한 가치 제공

**Sprint 목표 템플릿:**
```
[기간] 동안 [주요 기능]을 완성하여 [사용자 가치]를 달성한다
```

**예시:**
```
2주 동안 워크스페이스 생성 및 관리 기능을 완성하여 사용자가 프로젝트를 체계적으로 조직화할 수 있도록 한다
```

### 1.2 Sprint 유형 결정

**Documentation Sprint vs Implementation Sprint:**

| 기준 | Documentation Sprint | Implementation Sprint |
|------|---------------------|---------------------|
| **목적** | 설계 문서 작성 | 실제 코드 개발 |
| **기간** | 1-2주 | 1-2주 |
| **결과물** | 설계 문서 | 동작하는 소프트웨어 |
| **참가자** | 기획자, 시니어 개발자 | 개발팀 전체 |

**Sprint 유형 결정 과정:**
1. **현재 상태 파악**: 도메인의 현재 설계 상태 확인
2. **필요 작업 식별**: 다음에 필요한 작업 유형 파악
3. **Sprint 유형 결정**: Documentation 또는 Implementation 선택
4. **목표 설정**: 선택된 Sprint 유형에 맞는 목표 설정

---

## 📋 Step 2: Story 선택 및 계획

### 2.1 Story 선택 기준

**Story 선택 체크리스트:**
- [ ] **Sprint 목표 달성**: Sprint 목표 달성에 기여하는 Story
- [ ] **의존성 해결**: 선행 Story가 완료되었거나 의존성 관리 가능
- [ ] **팀 용량**: 팀의 Sprint 용량 내에서 완료 가능
- [ ] **우선순위**: 비즈니스 우선순위에 맞는 Story
- [ ] **완결성**: Sprint 내에서 완전히 완료 가능한 Story

### 2.2 Story 포인트 추정

**포인트 추정 과정:**
1. **개발팀과 협의**: 개발팀과 함께 난이도 평가
2. **피보나치 수열 사용**: 1, 2, 3, 5, 8, 13, 21 포인트
3. **상대적 크기**: 다른 Story와의 상대적 크기 비교
4. **불확실성 고려**: 불확실성이 높을수록 높은 포인트

**포인트 추정 템플릿:**
```
Story [ID]: [Story 제목]
- 복잡도: [Low/Medium/High]
- 불확실성: [Low/Medium/High]
- 추정 포인트: [1-21]
- 추정 시간: [시간]
```

### 2.3 팀 용량 계산

**용량 계산 과정:**
1. **팀원 수**: Sprint에 참여하는 팀원 수
2. **Sprint 기간**: Sprint의 총 기간
3. **가용 시간**: 팀원당 일일 가용 시간
4. **용량 계산**: 팀원 수 × Sprint 기간 × 가용 시간

**용량 계산 템플릿:**
```
팀 용량 = 팀원 수 × Sprint 기간 × 가용 시간
예: 5명 × 10일 × 6시간 = 300시간
```

### 2.4 Story 용량 검증

**용량 검증 과정:**
1. **Story 포인트 합계**: 선택된 Story들의 포인트 합계
2. **팀 용량 대비**: Story 포인트가 팀 용량을 초과하지 않는지 확인
3. **여유 시간 확보**: 예상치 못한 이슈를 위한 여유 시간 확보 (20-30%)
4. **조정**: 용량 초과 시 Story 조정 또는 우선순위 재검토

---

## 📋 Step 3: Sprint 계획 수립

### 3.1 Sprint 계획 문서 작성

**Sprint 계획 문서 템플릿:**

```markdown
# Sprint [번호]: [Sprint 제목]

## 🎯 Sprint 개요
**목표**: [Sprint 목표]
**기간**: [시작일] ~ [종료일]
**팀**: [참여 팀원]
**용량**: [총 용량] 시간

## 📋 포함 Story

### Story [ID]: [Story 제목] ([포인트]pts)
**목표**: [Story 목표]
**담당자**: [담당자]
**예상 완료일**: [예상 완료일]

### Story [ID]: [Story 제목] ([포인트]pts)
**목표**: [Story 목표]
**담당자**: [담당자]
**예상 완료일**: [예상 완료일]

## 📅 Sprint 일정

### Week 1
- **월요일**: [주요 작업]
- **화요일**: [주요 작업]
- **수요일**: [주요 작업]
- **목요일**: [주요 작업]
- **금요일**: [주요 작업]

### Week 2
- **월요일**: [주요 작업]
- **화요일**: [주요 작업]
- **수요일**: [주요 작업]
- **목요일**: [주요 작업]
- **금요일**: [주요 작업]

## 🔗 의존성 및 리스크

### 의존성
- **외부 의존성**: [외부 시스템, 팀, 리소스]
- **내부 의존성**: [다른 Story, 인프라]

### 리스크
- **기술적 리스크**: [기술적 도전과제]
- **일정 리스크**: [일정 지연 가능성]
- **리소스 리스크**: [리소스 부족 가능성]

## 🎯 완료 기준

### 기능적 완료
- [ ] [기능 1] 정상 동작
- [ ] [기능 2] 정상 동작
- [ ] 에러 케이스 처리

### 기술적 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족

### 품질 완료
- [ ] 보안 취약점 0개
- [ ] 접근성 기준 충족
- [ ] 사용자 테스트 통과

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **월요일**: [체크포인트]
- [ ] **화요일**: [체크포인트]
- [ ] **수요일**: [체크포인트]
- [ ] **목요일**: [체크포인트]
- [ ] **금요일**: [체크포인트]

### 주간 체크포인트
- [ ] **Week 1 종료**: [체크포인트]
- [ ] **Week 2 종료**: [체크포인트]

## 📁 관련 문서
- [Epic 문서](../epics/epic-[번호]-[도메인명].md)
- [Story 문서](../stories/[도메인]/story-[ID]-[기능명].md)
- [Sprint 회고](../sprints/sprint-[번호]-retrospective.md)
```

### 3.2 Sprint 계획 검증

**검증 체크리스트:**
- [ ] **목표 명확성**: Sprint 목표가 명확하고 달성 가능한가?
- [ ] **Story 적절성**: 선택된 Story들이 Sprint 목표 달성에 기여하는가?
- [ ] **용량 적절성**: Story 포인트가 팀 용량을 초과하지 않는가?
- [ ] **의존성 관리**: Story 간 의존성이 적절히 관리되는가?
- [ ] **리스크 관리**: 주요 리스크가 식별되고 관리 계획이 있는가?

---

## 📋 Step 4: Sprint 실행 준비

### 4.1 팀 준비

**팀 준비 체크리스트:**
- [ ] **팀원 확정**: Sprint에 참여할 팀원 확정
- [ ] **역할 분담**: 각 팀원의 역할과 책임 명확화
- [ ] **도구 준비**: 개발 도구 및 환경 준비
- [ ] **문서 준비**: 필요한 문서 및 자료 준비

### 4.2 환경 준비

**환경 준비 체크리스트:**
- [ ] **개발 환경**: 개발 서버 및 도구 준비
- [ ] **테스트 환경**: 테스트 서버 및 도구 준비
- [ ] **배포 환경**: 배포 파이프라인 준비
- [ ] **모니터링**: 모니터링 도구 및 대시보드 준비

### 4.3 의사소통 준비

**의사소통 준비 체크리스트:**
- [ ] **일일 스탠드업**: 일일 스탠드업 일정 및 방식 확정
- [ ] **진행 상황 공유**: 진행 상황 공유 방식 확정
- [ ] **이슈 보고**: 이슈 발생 시 보고 체계 확정
- [ ] **결과 공유**: Sprint 결과 공유 방식 확정

---

## 📋 Step 5: Sprint 실행 및 모니터링

### 5.1 일일 스탠드업

**일일 스탠드업 진행 방법:**
1. **시간**: 매일 동일한 시간 (보통 오전 9-10시)
2. **시간**: 15분 이내로 제한
3. **참가자**: Sprint 팀원 전체
4. **내용**: 어제 한 일, 오늘 할 일, 장애물

**일일 스탠드업 템플릿:**
```
어제 한 일:
- [작업 1]
- [작업 2]

오늘 할 일:
- [작업 1]
- [작업 2]

장애물:
- [장애물 1]
- [장애물 2]
```

### 5.2 진행 상황 모니터링

**모니터링 방법:**
1. **일일 체크**: 매일 진행 상황 확인
2. **주간 체크**: 주간 단위로 전체 진행 상황 검토
3. **이슈 추적**: 발생한 이슈의 해결 상황 추적
4. **품질 체크**: 코드 품질 및 테스트 커버리지 확인

### 5.3 이슈 관리

**이슈 관리 과정:**
1. **이슈 식별**: 발생한 이슈를 명확히 식별
2. **우선순위 설정**: 이슈의 우선순위 설정
3. **해결 방안 수립**: 이슈 해결을 위한 방안 수립
4. **해결 추적**: 이슈 해결 과정 추적

---

## 📋 Step 6: Sprint 완료 및 회고

### 6.1 Sprint 완료 검증

**완료 검증:**
- [ ] **Sprint 목표 달성**: Sprint 목표가 달성되었는가?
- [ ] **Story 완료**: 포함된 Story들이 모두 완료되었는가?
- [ ] **품질 기준 충족**: 품질 기준을 모두 충족하는가?
- [ ] **문서화 완료**: 필요한 문서가 모두 작성되었는가?

### 6.2 Sprint 회고

**회고 진행 방법:**
1. **참가자**: Sprint 팀원 전체
2. **시간**: 1-2시간
3. **방법**: Start-Stop-Continue 형식
4. **결과**: 개선사항 및 액션 아이템 도출

**회고 템플릿:**
```
Start (새로 시작할 것):
- [개선사항 1]
- [개선사항 2]

Stop (중단할 것):
- [문제점 1]
- [문제점 2]

Continue (계속할 것):
- [잘하고 있는 것 1]
- [잘하고 있는 것 2]
```

### 6.3 다음 Sprint 준비

**다음 Sprint 준비:**
- [ ] **회고 결과 반영**: 회고에서 도출된 개선사항 반영
- [ ] **Story 준비**: 다음 Sprint에 포함할 Story 준비
- [ ] **팀 준비**: 팀원들의 다음 Sprint 준비
- [ ] **환경 준비**: 개발 환경 및 도구 준비

---

## 📋 Step 7: 문서 저장 및 공유

### 7.1 문서 저장
- [ ] Sprint 계획 문서를 `agile-planning/sprints/` 폴더에 저장
- [ ] 파일명 규칙: `sprint-[번호]-[Sprint명].md`
- [ ] 관련 문서들과 링크 연결

### 7.2 팀 공유
- [ ] 팀 전체에 Sprint 계획 공유
- [ ] Sprint 목표 및 일정 공유
- [ ] 진행 상황 공유 체계 확립

---

## 🎯 완료 기준

Sprint 계획이 완료되었다고 판단할 수 있는 기준:

- [ ] **명확한 Sprint 목표**: 구체적이고 달성 가능한 목표
- [ ] **적절한 Story 선택**: Sprint 목표 달성에 기여하는 Story들
- [ ] **현실적인 용량 계획**: 팀 용량을 고려한 현실적 계획
- [ ] **명확한 일정**: 구체적인 작업 일정 및 마일스톤
- [ ] **리스크 관리**: 주요 리스크 식별 및 관리 계획
- [ ] **팀 준비**: 팀원들의 Sprint 준비 완료

---

## 📚 관련 문서

- [Epic 계획 가이드](./03-epic-planning-guide.md)
- [Story 정의 가이드](./04-story-definition-guide.md)
- [브랜치 넘버링 가이드](./06-branch-numbering-guide.md)

---

## 💡 팁과 주의사항

### 성공적인 Sprint 계획을 위한 팁
- **현실적 계획**: 팀의 실제 용량을 고려한 현실적 계획
- **유연성 유지**: 변경 가능성을 고려한 계획 수립
- **팀 참여**: 팀원들의 의견을 적극 수렴
- **지속적 모니터링**: Sprint 진행 중 지속적인 모니터링

### 주의사항
- **과도한 계획 피하기**: 너무 세밀한 계획은 오히려 비효율적
- **용량 초과 피하기**: 팀 용량을 초과하는 계획은 실패 위험
- **변경 관리**: Sprint 중 변경사항 발생 시 적절한 관리

---

## 🔧 Git 워크플로우

### 브랜치 생성 및 작업
```bash
# 1. Epic 브랜치에서 최신 상태로 업데이트
git checkout epic/001-user-management
git pull origin epic/001-user-management

# 2. Sprint 브랜치 생성 (Documentation 또는 Implementation)
git checkout -b sprint/01-user-auth-system
# 또는
git checkout -b sprint/02-organization-management

# 3. Sprint 계획 작업
# - Sprint 목표 설정
# - Story 선택 및 우선순위 설정
# - 팀 용량 계산 및 일정 계획
# - 리스크 분석 및 대응 방안
```

### 커밋 메시지 규칙
```bash
# Sprint 계획 문서 작성
git add .
git commit -m "docs(sprint): add sprint-01-user-auth-system plan

- Set sprint goal and success criteria
- Select stories and set priorities
- Calculate team capacity and story points
- Define sprint schedule and milestones"

# Story 선택 및 우선순위 설정
git add .
git commit -m "docs(sprint): add story selection and prioritization

- Story UM-001: Clerk User Sync (8pts)
- Story UM-002: User Login/Logout (5pts)
- Story UM-003: User Session Management (5pts)
- Story UM-004: Default Organization Creation (8pts)
- Set story priorities and dependencies"

# 팀 용량 및 일정 계획
git add .
git commit -m "docs(sprint): add team capacity and schedule planning

- Team capacity: 120 hours (3 members × 10 days × 4 hours)
- Story points: 120 points total
- Sprint duration: 2 weeks
- Daily standup and weekly checkpoints"
```

### GitHub에 푸시 및 PR 생성
```bash
# 1. 브랜치를 GitHub에 푸시
git push origin sprint/01-user-auth-system

# 2. GitHub에서 Pull Request 생성
# - 제목: "Sprint 01: User Authentication System"
# - 설명: Sprint 계획 및 Story 할당
# - 리뷰어: PM, 시니어 개발자, 팀 리드
# - 라벨: sprint, planning, user-management
```

### PR 리뷰 체크리스트
**리뷰어가 확인할 사항:**
- [ ] **Sprint 목표 명확성**: Sprint 목표가 구체적이고 달성 가능한가?
- [ ] **Story 선택 적절성**: 선택된 Story들이 Sprint 목표 달성에 기여하는가?
- [ ] **용량 적절성**: Story 포인트가 팀 용량을 초과하지 않는가?
- [ ] **일정 현실성**: Sprint 기간 내 완료 가능한 현실적 계획인가?
- [ ] **리스크 관리**: 주요 리스크가 식별되고 대응 방안이 있는가?

**승인 기준:**
- [ ] PM이 Sprint 목표와 일치함을 승인
- [ ] 시니어 개발자가 기술적 실현 가능성을 승인
- [ ] 팀 리드가 팀 용량과 일정을 승인
- [ ] 모든 팀원이 Sprint 계획에 동의

### PR 병합 후 정리
```bash
# 1. PR 병합 후 로컬에서 정리
git checkout epic/001-user-management
git pull origin epic/001-user-management
git branch -d sprint/01-user-auth-system

# 2. Sprint 실행 준비
# - 팀원들에게 Sprint 계획 공유
# - 일일 스탠드업 일정 확정
# - 진행 상황 추적 도구 설정
```

---

이 가이드를 따라하면 주니어 PM도 체계적으로 Sprint를 계획할 수 있습니다! 🚀

