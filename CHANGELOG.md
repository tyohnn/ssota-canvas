## [unreleased]

### Dev

- Supabase branch에 storage 추가

### Version

- 0.3.0

### ♻️ Refactoring

- *(db-schema)* Implement layered responsibility separation
- Ready for refactor
- Remove clerk & redesign
- Restructure domain folder
- Performance optimization
- Split workspace service class
- Optimize hooks and actions
- Optimize backend
- Align epic and sprint

### ✨ Features

- *(technical-spec)* Complete User Management domain technical specification
- *(technical-spec)* Add missing Organization and Membership aggregates
- *(technical-spec)* Add missing entities, events, and error codes
- *(technical-spec)* Complete missing service methods, read models, and commands
- *(user-management)* Add comprehensive database schema
- Setup development db
- Add vercel package
- Copy and paste supabase auth template
- Add supabase auth login
- *(auth)* Integrate Google OAuth callback with user registration flow
- *(user-management)* Implement user profile creation with domain entities and repositories
- *(user-management)* Implement default organization creation with domain entities and repositories
- *(user-management)* Implement organization list retrieval with read models and events
- *(user-management)* Implement user management service and server actions with AI automation patterns
- *(user-management)* Implement organization selection with frontend context and cookie persistence
- *(user-management)* Connect Frontend
- GitHub Pages에 Playwright 리포트 자동 배포 설정
- Complete organization creation feature and UI improvements
- (story5) member invitation logic
- *(organization-management)* Add member role update with fine policy
- 시나리오1 db 스키마 세팅
- Full implementation of STORY 001. Pass whole tests.
- Full implementation of STORY 002
- Upgrade icon picker
- Full implementaion of WORK-STORY-003
- Optimize page structure
- Edit sidebar components
- Full implementation of WORK STORY 004
- USER STORY 003 add workspace and page creation
- Full implemenation of ORG-STORY-006
- Full implementation of CM-STORY-001
- Full implementation of CM STORY 002
- Full implementation of CM-STORY-03
- Fix toolbar and multi select component
- Full implementation of CM STORY 007
- Full implemenation CM STORY 010
- *(block-management)* Implement PropertyType, PropertyOption, PropertyValidation Value Objects with TDD
- Feat(block-management): full implementation of BM STORY 002
- editor panel
- dynamic property rendering (basic property)
- typescript compatible with various block type
- *(block-management)* Fix and refactor implementation of BM STORY 002
- Add shape block and edit shadow block system
- Image block implementation
- Add media refresh signed url logic
- Add image block action bar and unsplash action
- Feat: add pdf, link, youtube, audio block
add copy and paste logic
- SPRINT-012 implementation of custom property
- 랜딩페이지에 상단 메뉴 추가
- /r/ 페이지에서 orgId로 자동 리다이렉션
- 캔버스 상단 툴바 동작하도록 수정 (패닝/선택 모드)
- Add supabase storage

### 🐛 Bug Fixes

- Fix build error
- Build warnings
- Google 로그인 브랜치 모두 적용하기
- 로그인 redirection 문제 해결
- 사이드바 한글로 수정
- 워크스페이스 추가 모달 한글화
- 조직 설정 모달 한글화
- 블록 추가 모달 그룹 수정 및 라벨 영어
- 워크스페이스 설정 영어로 변경
- 검색결과 없으면 없다고 띄우기
- 유튜브 블록 영어로 변경 및 최적화
- 멤버 초대 다이얼로그 영어로 변경 / 워크스페이스 멤버 테이블
- 워크스페이스 버튼에 페이지 추가 버튼 추가
- Unsplash 연결 문제 해결
- 블록 추가할 때 shadow가 너무 빨리 사라져서 추가가 제대로 안되는 문제
- 이미지 앱스페이스에 에러 표시하기
- Unsplash 이미지 검색 안되는 문제 해결
- 빌드 에러 해결하기
- 랜딩페이지 섹션 제거 / 다크모드 해결
- 시작하기 버튼에서 유저 여부 판단해서 렌더링하기
- 마크다운 블록, 텍스트 블록 다크모드 처리하기
- 블록 추가할 때 제대로 동작하지 않는 에러 해결
- 사이드바 조직 추가 모달 영어로 변경
- 조직 타입 영어로 변경
- 사이드바에 업커밍 모달 모두 추가
- 멀티선택 에러 해결
- 사이드바 언어 영어로 변경
- 캔버스 상단 헤더 수정
- React canvas 로딩 배경 색상 변경
- 캔버스 페이지 로딩 시 문제 로딩 상태 중첩되는 문제 해결
- 페이지 변하면 이를 사이드바에서 액티브하게 표시되도록 하기
- 캔버스 로딩 상태 수정
- 사이드바 페이지 트리의 생성과 액티브 로직 수정
- 에디터 패널 확대하기, ESC로 닫기
- 사이드바 페이지 아이템의 순서 바꿀 때 생기는 에러 해결. 부모 페이지 밖으로 나갈 때 order가 optimistic하게 반영되지 않는 문제
- 캔버스 헤더에 브래드컴에 페이지 깊어지면 줄여서 표현하기
- 페이지 부모 내에서 이동할 때 가장 아래로 이동하면 안되는 이동이 호출되지 않는 문제 해결 안됨
- /r/ 리다이렉션, 스켈레톤 로직

### 📚 Documentation

- Update CHANGELOG
- *(structure)* Restructure documentation folders for better developer understanding
- Update CHANGELOG
- Refactor and create guide of docs
- Refactor planning & event storming guide
- Add domain branch rule
- Add frontend specification guide and read model view
- Add updating progress task at guide
- Update CHANGELOG
- Update CHANGELOG
- Edit branch policy
- Update CHANGELOG
- *(event-storm)* Complete user management domain event storming
- *(process-model)* Complete user management domain process model
- *(user-management)* Complete software design of user management domain
- *(event-storm)* Complete user management domain event storming
- *(process-model)* Complete user management domain process model
- *(user-management)* Complete software design of user management domain
- *(progress)* Update User Management Domain to 95% completion
- *(epic)* Add epic-001-user-management document
- Update CHANGELOG
- Remove branching guide
- Add story of user management domain
- Add sprint of user management domain
- Add frontend specification of user management domain
- Add frontend plan
- Ready for user management domain implementation
- Update CHANGELOG
- Update CHANGELOG
- Add story
- Add story
- Apply story implementation changes
- Add structing discussion
- Update CHANGELOG
- Add snapshot collaboration discussion
- Add organization creation dialog spec to frontend spec
- *(story)* Update story-006-organization-creation to match latest design
- Update CHANGELOG
- Update CHANGELOG
- Update CHANGELOG
- Ready for STORY 001
- Ready for STORY 002
- Finish story
- Update WORK STORY 004
- Update CHANGELOG
- Update CHANGELOG
- Version 1.0 event storming
- Revise event storming guide and template
- Process model v1.0 of canvas management domain
- V1.0 software design of canvas management domain
- V1.0 user flow of canvas management domain
- Revise workflow guide
- V1.0 technical spec of canvas management domain
- V1.0 testing strategy of canvas management domain
- V1.0 db schema of canvas management domain
- V1.0 testing strategy of canvas management domain
- V1.1 software design update
- V1.1 frontend specification update
- Update canvas management planning
- Revise canvas management doamin system structure
- Update CHANGELOG
- Ready for EPIC-003
- Design block system
- SPRINT-011 마무리
- Design AI chat feature
- Update CHANGELOG

### 🔧 Maintenance

- Update background agent snapshot
- Set dev db and supabase auth
- Set node version to 22
- Clean file
- Prettier
- Set dev db
- Remove unused apis
- Avoid changlog everytime
- Add drizzle kit studio & push
- Clean files
- Delete ssota-cli
- Remove unneccesary files
- Update project root folder name
- Seed.sql 삭제
- Db branching setting

### 🧪 Testing

- Complete sprint1-2 implementation
- Add test_deployments table to verify supabase branching
- Env 맞추기
