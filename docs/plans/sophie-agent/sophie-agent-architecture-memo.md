# 쏘타 Block과 App의 개념 구분

Block은 저장하는 데이터의 타입을 의미한다.

크게는 Read-Only 상태와 Edittable 상태로 구분

Edittable이 가능하려면 앱이 필요함



블록 나열하기





링크





웹



유튜브



X



스레드



독스





DOCX



노션



마크다운



슬라이드



시트



PDF





이미지 PDF (PPT, IR 등)



텍스트 PDF



코드





리액트 프리뷰





디자인 컴포넌트



파이썬 샌드박스





수치해석, 분석, 그래프



미디어





이미지



비디오



오디오



3D

# App의 정의

앱은 DOM에 렌더링 가능한 코드와 tools로 이루어져있음

DOM에서는 실질적으로 사람이 인터랙션이 가능한 형태의 UX로 구성됨



tools는 AI가 직접 앱을 조작할 수 있도록 함





특정 기능이 될 수도 있고



UX 자체를 조작할 수도 있음



앱에 속하는 커스텀 블록을 정의할 수 있음





깃헙 앱이면 여기에 속하는 깃헙 커밋 블록, 브랜치 블록 등



서브 에이전트에 사용가능한 앱과 툴을 정의해줄 수 있음

메인 에이전트는 현재 워크스페이스, 페이지에 설치된 앱과 툴을 검색하여 필요한 작업을 할 수 있도록 함

꼭 서브 에이전트만 앱과 앱의 툴을 사용할 수 있는 것은 아님



쏘타에서 기본적으로 제공하는 앱이 존재함

예를 들면,





SSOTA Image app -> 이거를 쪼개서 구분해도 됨





이미지 라이브러리 -> 이미지 커뮤니티



프롬프트 라이브러리 -> 프롬프트 커뮤니티



이미지 생성



이미지 편집



SSOTA Shadcn app





shadcn 



SSOTA Remotion



SSOTA 3D Renderer



SSOTA WebGL



SSOTA X



SSOTA Thread



커뮤니티 앱으로 누구나 바이브 코딩으로 앱을 만들 수 있음

예를 들면





Viewtrap 같이 유튜브 영상 데이터 제공



크날 CCV 처럼 홈페이지 레퍼런스 제공



퀴즈 서비스



단어장 앱



카메라 각도 바꿔서 이미지 뽑아내는 앱



상세페이지 레퍼런스 제공 앱

우리 내부에 [커뮤니티 앱 개발 서브에이전트]를 만들어서 스킬과 tools 제공. 패키지 전체 제공


# 메인에이전트 vs 서브에이전트

기존에 커서, 클로드 코드 등에서 사용되는 개념부터 먼저 정리하자

메인 에이전트: orchestration





제공된 툴





write, bash, web search, replace, delete, etc.



mcp, other sub agent calling

서브 에이전트: Specialty





Context Consumption이 심한 작업을 따로 정의



작업 후 요약된 내용을 메인에 전달



Description, Skills, Tools로 능력을 제공받음



커서가 기본적으로 제공하는 서브 에이전트





Explore





목적 Context Uploading: 전체 워크스페이스를 탐색함



tools grep, glob, semantic search, web search



파일과 웹서칭 결과를 Context로 빠르게 소모되기 때문에 메인과 분리해야함



Bash





목적 권한과 자유도가 높은 작업



tools bash



bash 결과를 Context로 빠르게 소모되기 때문에 메인과 분리해야함



Browser





목적 웹브라우저를 직접 조작하는 작업



tools moveto, click, screenshot, etc



스크린샷이나 DOM은 Context로 빠르게 소모됨



Claude Code





Plan: 커서의 explore와 유사함





커서의 경우, 모드와 서브에이전트를 서로 다르게 사용하고 있지만, 클로드 코드는 이 두 개념을 동일하게 보고 있음

클로드 코드가 조금 더 서브에이전트의 범위를 넓게 됨. 메인에이전트에서 조금이라도 스페셜티가 생기면 바로 서브에이전트로 바라봄



# Subagent, skills, tools

Sub Agent





서브에이전트는 description, subagents, skills, tools로 정의



서브에이전트도 다른 서브에이전트를 호출할 수 있음





위계는 동등하지만 서로 위임할 수 있는 관계



직장 동료

Skills





sub agent가 수행할 수 있는 규격화된 작업 단위





일종의 업무 가이드라인



HR팀의 ㅇㅇㅇ 대리가 하는 작업의 양들



description과 여러 관련 문서들로 이루어짐



tools를 선택할 수 있음

tools





subagent가 세상과 상호작용할 수 있는 능력



tools은 global tools, block tools, app tools 등으로 나뉨. 서브에이전트





block tools: 데이터 편집이 아니라 이미 있는 데이터를 보기 위한 조작에 가까움





유튜브 블록 (타임이동하기)



브라우저 블록 (브라우저 탐색)



app tools: 앱을 직접 조작할 수 있는 툴



tools를 직접 코드로 정의할 수 있으면 좋을 듯

# 커서에서 기본적으로 제공하는 컨텍스트

커서의 컨텍스트 레이어





현재 열린 탭



사용 가능한 tools



subagent, skills



todo, plan


# 쏘타의 컨텍스트 레이어 (메인에이전트)

쏘타의 컨텍스트 레이어 (메인에이전트)





현재 viewport에 들어와있는 블록





전체 데이터를 넣지 않고 메타데이터만



그래야 explore가 구체적으로 찾도록 하기



현재 선택된 블록



음성과 함께 시간축에서 언급된 블록들 (호버, 선택)





대명사를 캐치하는 능력



예를 들어, 이거라고 말할 떄 호버했던 블록



사용가능한 기본 tools





grep, glob, hop, group, read



web search



canvasdown



create todos



search tools (명령어로 subagents, blocks tools, apps tools를 검색. 여기서는 subagents를 툴로 바라보는 것)



search apps 내가 사용 가능한 앱 검색 (명령어로 워크스페이스, 페이지 내 옵션 검색. 앱이 사용가능한 블록, 툴 결과 제공)





기본 제공되는 subagents (자동으로 호출됨)





explore



browser



research



visualize





유저가 추가한 subagents 목록





메타데이터만 제공하기



유저가 추가한 앱 목록


# 쏘타의 기본 제공 서브 에이전트

서브 에이전트가 없더라도 메인 에이전트가 모두 수행할 수 있어야 함.

서브 에이전트는 말그대로 컨텍스트를 분리하는 것이기 때문에 옵션에 가까움. 따라서 메인 에이전트가 범용적으로 다양한 업무를 수행할 수 있어야 함



Visualize





목적: 여러 컨텍스트를 구조화, 시각화



tools





canvasdown



search template (여러가지 방법론을 검색)



layout

Explore





목적: 캔버스 내외의 컨텍스트를 빠르게 Uploading



tools: 





키워드 기반의 검색: grep, glob





대상을 명령어로 지정가능 - 워크스페이스, 페이지, 이벤트



연결 기반의 검색: hop, group



의미 기반의 검색: semantic search



읽기: read (라인별로 content, summary, raw 읽기)



web search

Browser





목적: 캔버스 위에서 브라우저 블록을 조작



tools





operation: move, scroll, click, screenshot, record, extract image

Research

Canvas





목적 캔버스를 직접 조작함



tools





에디터 열기, 블록 선택, 멀티 선택, 페이지 이동

Sub Agent Dev





목적: 유저의 서브 에이전트를 정의하는 것을 도움



tools







