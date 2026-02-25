## [0.20.0] - 2026-02-25

### ✨ Features

- Enhance block content retrieval by extracting plain text from JSON when content_raw is empty
- Prevent focus shift to editor when title input is active during double-click mode
## [0.19.0] - 2026-02-25

### ✨ Features

- Add session deletion handling in chat session popover
- Add versioning support with update banner and API endpoint
- Enhance version update banner with stale tab auto-reload and visibility handling

### 🐛 Bug Fixes

- Save user message twice
## [0.18.0] - 2026-02-24

### Dev

- Add cursor ignore

### Hotfix

- Remove remote config to not apply config.toml at remote branching

### ♻️ Refactoring

- Clean blockId and blockMountId naming
- Add block slug to blocks and find with workspaceId with slugs
- Custom proeprty logic
- Add slug at blocks, block mounts and edges
- Save slug at event logs and add more events
- Add slug logic to sources
- Link block and block container
- Agent tools more structured with compact prompt
- Refactor: link block and youtube block's tab
- combine one summary tab
- Clean logic useLinkBlock

### ✨ Features

- Add xai websearch tool server
- Add web search tool and greb, glob, read tools
- Add source domain
- Integrate source domain and youtube app space summary into source domain
- Add search tools (grep, glob, read line, edit line, hop, semantic, group search)
- Add todo generation tool and canvas manipulation to
- Add layout organization tool and refactor tools
- Add event log tools
- Test agent context building
- Step update block content and log block updated
- Edit recent context filtering logic (exclude edge updated without label update)
- Add page, workspace, org, profile name into context
- Add detailed context for agent and verify
- Xai search tool check
- Add app system domain
- Add block tool system combined with app system
- Add link block action and sections
- Add read part component and rename web search component
- Add TTL cache to source and replace vidoes.script to sources.coutent_raw at youtube domain
- Add timeline tab
- Add slash command extension at tiptap editor and add drag and drop
- Add link metadata cache
- Add chat sessions
- Add title header above tiptap editor at note view block
- Add chat messages
- Pagination and scrolling lazy loading chat messages
- Add block addition shortcut at canvas top toolbar
- Add context memu to block & remove more menu
- Add pdf block and extraction logic
- Seperate add dialog into multiple toolbar items at canvas top toolbar
- Flip popover
- Add seed welcome data & login test
- Add unauthorized page
- Add audio block and auto extraction
- Edit transcript & summary logic of audio block
- Add audio move interaction at timeline tab
- Limit 6mb & 1day accessUrl / also add refresh access url logic
- Add get signed url at published page
- Add langsmith trace
- Shorten url at pdf, audio

### 🐛 Bug Fixes

- Catch typescript error
- Youtube block action button not connected with realtime status window
- Optimistic error when connecting edges
- Editor panel ui and auto adjustment
- Remove unnecessary buttons at viewport toolbar
- Add link block tabs
- Canvasdown location bug
- Omit content raw update
- Test read line block tools and refine context building
- Exclude user_utterance, ai_response, tool_call in recentContextForAgent & Prevent few-shot effect that degrades dialogue quality
- Restore fast metadata extraction and move mardown scraping to extractor
- Youtube block metadata not updating
- Source summary logic bug
- Auto switch tab bug
- Note view blur error and add new tiptap node at tiptap editor
- Shape toolbar and block ui
- Editor panel title update bug
- Markdown badge to note
- More availability of editor open button at block mount toolbar
- Remove bg at note view title
- Remove custom property add logic temporary
- Change badge text to note at markdown block card view mode
- Avoid nested group & group ui design
- React flow canvas background color
- Default webearch tool part closed
- Latex popover and ux
- Warning temperature
- Block toolbar badge ui
- Add tiptap placeholder when tiptap not editable
- Move seperator inside toolbar items mapper
- Clean block mount toolbar
- Suggestion slash item details to toggle
- Remove seperator at group toolbar
- Styling tiptap prose
- Clipboard duplication postion
- /onboarding auto redirection to login when user not found
- Add member automatically to default workspcae after org invitation
- Save max resolution thumbnail
- Add globals.css
- React flow canvas dark mode bg
- Youtube tutorial fit to new toolbar
- React flow canvas bg backgorund when dark mode
- Tutorial does not open again
- Welcome seed size bug & not rendering markdown
- Redirection error
- Need for server side html to json tiptap
- Welcome seed block size and template content
- Remove error message when redirection
- Prose css 통합하기
- Remove youtube block view mode change toolbar items
- Tutorial error at tiptap
- Add zoom to 5x
- Router block to be stored at db
- Add speaker at timeline tab & save source content lang
- Audio block ui
- Remove tiptap editor drag node
- Build error
- Published page ui
- Audio block waveform with zoom
- Remove seperator at canvas toolbar when readonly
- Pdf pixel scale up
- File router upload error
- Readonly file router block
- Auto play when seekto
- Add readonly source fetching
- Move extracted at info (timeline tab)
- Metadata fetch action called every time
- Pdf block ui edit
- Remove public page audio update property try

### 📚 Documentation

- Add sprint-021 plan
- Add docs
- Plan sophie agent architecture
- Architecturing system
- Source and app update
- Update plan
- Add resumable upload plan

### 🔧 Maintenance

- Clean docs
- Cleanup docs
- Lint
- Version update
## [0.17.0] - 2026-02-07

### Hotfix

- Add logs

### ✨ Features

- Add background summary job
- Add tracking multiple status job

### 🐛 Bug Fixes

- Preference tab ui mismatch
- Add pg_net extension
- Production deploy edge function
- Add vercel protection bypass secret
- Remove debug logger

### 🔧 Maintenance

- Clean docs
## [0.16.0] - 2026-02-06

### ✨ Features

- Add interactive tutorial
- Add youtube block tutorial
- Add auto opening tutorial dioalog
- Add privacy, terms & demo at login page
- Add interactive onboarding
- Add organization icon management and update related actions

### 🐛 Bug Fixes

- Smaller sidebar font size & add select none
- Org switcher error
- Demo first landing page
- Auto tab change at demo & copy revise
- Youtube tutorial step bug
- Design of onboarding step
- Tutorial dialog not working
- Link block update error
- Optimize mobile sidebar setting dialog
- Align storage rls migration

### 🔧 Maintenance

- Remove deprecated packages and update
- Validate test files
- Add post script install
- Fix build error
## [0.15.0] - 2026-02-01

### ✨ Features

- New landing page

### 🐛 Bug Fixes

- Editor panel note view make uneditable
- Always visible regardless zoom
- Z-index of block and edge
- Readonly cursor pointer
## [0.14.0] - 2026-02-01

### ✨ Features

- Add redirection after published page duplication
- Hide script tab on readonly mode

### 🐛 Bug Fixes

- Publish dialog copy button back to copy icon
## [0.13.1] - 2026-02-01

### Hotfix

- Markdown block always be able to scroll problem

### 🐛 Bug Fixes

- Remove toast message or translate to english
## [0.13.0] - 2026-02-01

### ✨ Features

- Redesign route structure

### 🐛 Bug Fixes

- Refactor skeleton loading layout
## [0.12.1] - 2026-01-30

### 🐛 Bug Fixes

- Readonly markdown scroll available
## [0.12.0] - 2026-01-30

### ♻️ Refactoring

- Rename ai-visual-summary to ai-actions

### ✨ Features

- 캔버스 팬 감도 조절 기능 추가 및 타입 에러 수정
- Add visual summary
- Add youtube title and channel to grok
- Only render group placeholder when empty group state
- Add group specific toolbar
- Select group block after creation by multiselection

### 🐛 Bug Fixes

- Apply edge stroke and content markdown rendering
- Render proper coordinate system when editor panel open
- Duplicate block inside group optimistic update properly
- Published page rendering bug
- Replace successfully optimistic edge id to server id
- Fix: increase multi block mount deletion and duplication speed
- add bulk creation block and block mount
- Disallow move when optimistic
- Build error
## [0.11.0] - 2026-01-27

### ✨ Features

- Add group block and collision group system
- Group color change option

### 🐛 Bug Fixes

- Area button position calculation
- Guideline calculation with group
- Fix: group block size update always default bug
- unify block size to sizes
- Group snap guideline calculate its child
- Fix: wrong coordinate system when updating positions after move node's  group to other group
- group node's indexing problem
- also fix multi selection position miscalculation when dragging
- Build error and warnings
- Add default note tab
- Remove always restoring cookie
- Color option error after optimistic group creation

### 🔧 Maintenance

- Add missing diff
## [0.10.0] - 2026-01-26

### ♻️ Refactoring

- Extract supabase realtime to domain and optimize unread count hook
- 리뷰 피드백 반영 - console.log 제거 및 useUnreadCount 훅 삭제

### ✨ Features

- Add edge custom marker

### 🐛 Bug Fixes

- Not working unpublish page update
- Defense migration error
- Edge toolbar visible threshold

### 📚 Documentation

- Initiate sprint docs
## [0.9.3] - 2026-01-23
## [0.9.2] - 2026-01-23

### 🐛 Bug Fixes

- Hide ai chat at canvas
## [0.9.1] - 2026-01-23
## [0.9.0] - 2026-01-23

### ✨ Features

- 실시간 알림 시스템 구현
- Add supabase migration - notification publication
- Inbox button design
- Add summarize youtube script with ai
- Public page summary access / summary header toc item / extract summary keyword
- Feat: summary action button with implementing editor tab options at canvas mode context
- editor tab options  at canvas mode context could be used for manipulating editor panel with ai client tools
- Integrate & redesign block toolbar

### 🐛 Bug Fixes

- Translate korean to english
- Build error
- Design toolbar
- Reorder default view mode of other blocks
## [0.8.0] - 2026-01-19

### Update

- Supabas cli upgrade

### ♻️ Refactoring

- *(share)* Transition to functional services, tanstack query hooks, and organization-aware workspace retrieval
- Use auth user utils
- Remove unneccesary service (workspace domain)
- Remove external domain field at workspace entity
- Remove duplicated query service and add read models
- Refactor: hook pattern
- remove tanstack query
- add mutation
-  refactor: share action and apply new authentication layer
- Add service suffix
- Remove overlapping logic
- Move toReactFlowNodeFromCanvasView into server component
- Pass onSuccess, onError props to mutation hook
- Apply pattern
- Copy page service and action
- Rename copy to duplicate & unify one dialog

### ✨ Features

- Improve publish flow UX - remove unpublish confirmation dialog and add header to published page
- Add canvas base component
- Pass redirection url to google login callback and onboarding in order to smooth flow for new user or revisited user
- Detail readonly UI
- Youtube block script duplication within same page ro outside page

### 🐛 Bug Fixes

- Remove snapshot version at published_pages
- Make compatiable new version
- Get all workspace by orgs
- Remvoe string()
- Remove over indexing
- Owner_id to publisher_id, add unpublished status
- Readonly edge rendering
- Build error
- Remove pdf block and unready blocks
- Build error
- Add getDefaultViewMode to useCreateBlock

### 📚 Documentation

- Move refactor summary to docs and cleanup temp files
- Remove unneccesary docs

### 🔧 Maintenance

- Move refactor summary back to root
- Remove unneccesary
- Add supbase script
- Edit docs
## [0.7.1] - 2026-01-17

### Hotfix

- Edit db migrations
## [0.7.0] - 2026-01-17

### Update

- Pnpm and supabase

### ♻️ Refactoring

- *(canvas)* Reorganize independent components to canvas/components (phase 1)
- *(canvas-management)* Refactor Multi Selection Toolbar component
- *(canvas-management)* Restructure Selection Bounding Box component
- *(canvas-management)* Introduce Edge Toolbar component for edge editing
- *(canvas-management)* Replace CanvasEdgeService with EdgeManagementService
- *(canvas-management)* Update edge creation and reconnection logic
- *(canvas-management)* Implement higher-order function for secure edge actions
- *(canvas-management)* Introduce Shadow Block system for dynamic block creation
- Reorganize imports and enhance module structure
- *(canvas-management)* Streamline block management and enhance action handling
- Refactor(canvas-management): huge refactoring to acheive code readability
- Bug fix Sprint-018

### ✨ Features

- *(canvas-management)* Enhance cursor behavior and mode handling in canvas components
- *(ui)* Add ToolbarIconButton component and update package.json types
- *(docs)* Add architecture and implementation patterns documentation
- *(auth)* Add PAGE_NOT_FOUND error handling and verifyAccessByPageId
- *(canvas-management)* Implement edge management hooks for CRUD operations
- *(canvas-management)* Enhance edge management with CRUD actions and services
- *(canvas-management)* Enforce required edge handles
- *(canvas-management)* Enhance edge management with style and label support
- *(canvas-management)* Implement custom edge component with enhanced label and toolbar features
- *(block-management)* Adopt block view system
- *(block)* Seperate size by view mode
- *(block)* Implement youtube app space at backend / shared
- *(block)* Implement youtube app space and youtube block at frontend
- *(block)* Add youtube title to block title immediately
- *(block)* Dynamic block-editor interaction system
- *(block)* Maintain memory of tab scroll position
- *(block)* Edit metadata tab more beautiful
- *(block)* Add banner at script tab of editor panel
- *(block)* Add targetted text to note view by quote block
- *(canvasdown)* First release of canvasdown
- *(spatial-context)* Initiate spaital context repo
- *(auth)* Remove beta
- *(page)* Add not found page

### 🐛 Bug Fixes

- Build error
- Build error
- *(canvas-management)* Prevent viewport animation after spacebar panning
- Fix build error [skip ci]
- *(canvas-management)* Fix canvas viewport control toolbar doesn't rerender
- *(canvas-management)* Fix markdown editor bug
- Fix build error [skip ci]
- *(workspace)* Null local storage always opened bug
- *(block)* Sync view mode change and size change
- *(canvas)* Add automatic update when view mode change
- *(viewport)* Adjust viewport when editor panel opened
- *(block)* Remove puctuation only timestamp
- *(block)* Do not render youtube iframe when multi selection mode
- *(canvas)* Multiselection bug when adding block with copy/paste hooks
- *(block)* Invalidate after extract script at action toolbar
- *(block)* Solve convert tab doesn't rerender toc component
- *(block)* Edit youtube block default size in order for iframe player toolbar to be displayed completely
- Fix build error
- Remove korean

### 📚 Documentation

- Move pattern docs
- Revise pattern
- Initiate sprint
- Initiate sprint

### 🔧 Maintenance

- Clean file
- Integrate @trivago/prettier-plugin-sort-imports for improved import organization
- Add .nvmrc 24
- *(block)* Keep script cache 24 hours
- Build warning deprecate
## [0.6.2] - 2025-12-17

### Hotfix

- *(migrations)* Update order_text assignment to include deleted pages
## [0.6.1] - 2025-12-17

### Hotfix

- Remove porse

### ♻️ Refactoring

- Refactor(workspace-management): refactor workspace-page-tree
- code format / solid
- fix ordering bug completely
- fix duplication error

### 🐛 Bug Fixes

- Build error

### 🔧 Maintenance

- Add new skip commit
## [0.6.0] - 2025-12-15

### ✨ Features

- Integrate Sanity CMS for team blog

### 🐛 Bug Fixes

- *(deps)* Update zod to ^4.2.0 for vercel build compatibility
- *(sanity)* Replace deprecated imageUrlBuilder with createImageUrlBuilder

### 🔧 Maintenance

- Version 0.5.4
## [0.5.5] - 2025-12-15

### 🐛 Bug Fixes

- *(ci)* Remove changelog update at dev and compact canary-release
- *(ci)* Canary bug
- *(ci)* Skip canary bug
## [0.5.4] - 2025-12-15
## [0.5.3] - 2025-12-15

### 🐛 Bug Fixes

- *(ci)* Fix semantic version error
- *(ci)* Remove canary tag at changlog
- *(ci)* Add exclude canary tag logic
- *(ci)* Fix code review
- *(ci)* Skip-canary label check & update doc skip
## [0.5.1] - 2025-12-10
## [0.3.0] - 2025-11-21

### ♻️ Refactoring

- Move CHANGELOG generation to dev branch
- Streamline CHANGELOG workflow and regenerate with version sections
- Workspace-page action refactoring
- *(ci)* Move CHANGELOG generation to main branch (industry standard)

### ✨ Features

- Complete automated release workflow with CHANGELOG sync
- Add temp logo

### 🐛 Bug Fixes

- Make changelog workflow appear in PR checks
- Canary-release workflow YAML syntax and merge-only execution
- Canary-release YAML syntax error on line 132
- Resolve canary-release YAML syntax error completely
- Prevent infinite loop on CHANGELOG sync PRs
- Address CodeRabbit security and reliability issues
- Pass untrusted PR metadata through env variables in changelog.yml
- *(workspace-management)* Fix PR review issues and refactor architecture
- *(workspace-management)* [**breaking**] Sanitize error logging and fix validation issues
- *(workspace-management)* [**breaking**] Add authorization check for organization member search
- *(ci)* Use PAT token for CHANGELOG workflow to bypass branch protection
- *(ci)* Fix code review

### 📚 Documentation

- Branching strategy research

### 🔧 Maintenance

- Add v0.5.1 and v0.5.2 tags and releases
- Remove log
- Toast message to english
## [0.5.2] - 2025-12-10

### 🐛 Bug Fixes

- Build error at image asset migration
- Page creation error
- Edit supabase toml, add dev preview
## [0.5.0] - 2025-12-10

### Dev

- Add cloud agent environmnet setting
- Fix environmnets

### Release

- V0.5.0

### ✨ Features

- 인터랙티브 랜딩페이지 기본 골자 잡기 & section1-phase1 (기획)까지 구현
- 랜딩페이지 section1 phase2 design
- Image assets storage 추가 및 이미지 앱스페이스에 연결
- Image block rendering
- *(ui)* Sprint 017 UI/UX improvements (E010-004,005,006,007,008)
- Update sprint 017 progress - completed E010-001,004,005,006,007,008
- *(E010-002)* Implement edge handle hiding with hover detection
- *(ui)* Sprint 017 UI/UX improvements (E010-003 final)
- *(E010-009)* Implement block page move with server-side search

### 🐛 Bug Fixes

- Build error
- 빌드 에러

### 📚 Documentation

- Initiative 002 > epic / story
- Edit story naming convention
- Define initiative-002 of sprint
- Flesh out story

### 🔧 Maintenance

- 문서 정리
- Docs organize
- Remove logs
## [0.3.6] - 2025-11-28

### ♻️ Refactoring

- BaseBlock Refactoring
- Block type refactoring

### ✨ Features

- Add static new blocks for landing page
## [0.3.5] - 2025-11-26

### ✨ Features

- Add beta access mode server
- Add beta access mode client

### 🐛 Bug Fixes

- Build warning
## [0.3.4] - 2025-11-25

### ✨ Features

- Implement AuthSessionMonitor for session management and enhance authentication error handling
- Enhance user onboarding and setup status checks with new user management service integration
- Improve Supabase client initialization and error handling for session expiration

### 🐛 Bug Fixes

- 엣지 연결 시  block mount id를 사용하도록 수정
## [0.3.3] - 2025-11-24

### 🐛 Bug Fixes

- Default viewport 추가해서 끊기지 않도록
- 사이드바와 마크다운 블록 단축키 겹치는 문제 해결 & 블록 사이즈 조정
- 클립보드 복사할 때 마크다운 블록의 content_raw 생성되지 않는 문제 해결
- 엣지 연결 툴 콜 에러 수정
## [0.3.2] - 2025-11-23

### ✨ Features

- 캔버스 fitToView 삭제하고 페이지별 위치/줌을 로컬스토리지에서 로드하는 기능
- 페이지 복제/삭제 기능

### 🐛 Bug Fixes

- Deploy build
- Page redirection client error
- Db 타임아웃 늘리고 로그 추가
- Db connection pooler
## [0.3.1] - 2025-11-22

### Deploy

- Version 0.3.1

### Dev

- Supabase branch에 storage 추가

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
- Add seo metatags

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
- Fix build error

### 📚 Documentation

- *(structure)* Restructure documentation folders for better developer understanding
- Refactor and create guide of docs
- Refactor planning & event storming guide
- Add domain branch rule
- Add frontend specification guide and read model view
- Add updating progress task at guide
- Edit branch policy
- *(event-storm)* Complete user management domain event storming
- *(process-model)* Complete user management domain process model
- *(user-management)* Complete software design of user management domain
- *(event-storm)* Complete user management domain event storming
- *(process-model)* Complete user management domain process model
- *(user-management)* Complete software design of user management domain
- *(progress)* Update User Management Domain to 95% completion
- *(epic)* Add epic-001-user-management document
- Remove branching guide
- Add story of user management domain
- Add sprint of user management domain
- Add frontend specification of user management domain
- Add frontend plan
- Ready for user management domain implementation
- Add story
- Add story
- Apply story implementation changes
- Add structing discussion
- Add snapshot collaboration discussion
- Add organization creation dialog spec to frontend spec
- *(story)* Update story-006-organization-creation to match latest design
- Ready for STORY 001
- Ready for STORY 002
- Finish story
- Update WORK STORY 004
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
- Ready for EPIC-003
- Design block system
- SPRINT-011 마무리
- Design AI chat feature

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
## [0.1.0-alpha.1] - 2025-09-24

### ✨ Features

- Finalize alpha release structure

### 📚 Documentation

- Document versioning workflow and release tagging

### 🔧 Maintenance

- Add release automation workflow based on CHANGELOG
- Enhance CHANGELOG workflow with PR preview and automated updates
- Fix git-cliff workflow input
- Revert git-cliff configuration parameter
- Capture ci commits in changelog maintenance section
- Update git-cliff action inputs
- Rely on default config path for git-cliff
- Test changelog pipeline
- Fix release workflow checkout step
- Enhance changelog workflow authentication
- Add comprehensive logging to changelog workflow
- Integrate personal access token for workflow permissions
- Integrate personal access token for workflow permissions
- Revert to default GITHUB_TOKEN due to access issues
- Use unreleased commits for changelog generation
- Implement custom changelog change detection
- Add Node.js and pnpm setup to changelog workflow
- Simplify changelog workflow (remove pnpm/node; rely on action detection)
- Test detection path
- Set git-cliff output to CHANGELOG.md for change detection
- Reset CHANGELOG.md to force regeneration
- Replace tj-actions with direct git-cliff execution

### 🧪 Testing

- Add TEST_CI.md to verify Actions write permissions
## [0.1.0-sprint-1] - 2025-09-24

### Bug

- 컴포넌트 블럭 버그 수정

### ♻️ Refactoring

- DDD 기반 리팩토링 준비
- *(ssota-cli)* Rename xbowl-cli
- *(ssota-cli)* Rename xbowl-cli
- Rename xbowl to ssota

### ✨ Features

- Complete task 2 - Create Canvas Server Actions
- Complete task 9 - Create Canvas Page and Layout with dynamic routes
- *(contracts)* Add @xbowl/domain-contracts (types/constants/zod) and switch CLI to use it [Phase A]
- *(web)* Add @workspace/domain-contracts dependency [Phase C start]
- *(web)* Fix node exports and wire shared zod schemas; unify metadata types to contracts [Phase C]
- Implement automated CHANGELOG generation system
- Implement automated CHANGELOG generation system

### 🐛 Bug Fixes

- Disable remote API calls in CHANGELOG generation

### 💅 Style

- Format solution approach sections with bullet points
- Translate all Korean text to English in CONTRIBUTING.md

### 📚 Documentation

- Update domain-contracts migration checklist (Phase A/B done), begin Phase C
- Event storming -> DDD 설계
- Create comprehensive commit convention guide
- Update AI collaboration guidelines for commit message patterns

### 🔧 Maintenance

- Ignore settings
- Ignore settings
- Unnecessary file deletion
