지금은 react flow state tanstack optimistic update와 server action (데이터 영속성)이 같은 파일에 있지만, 오픈소스 react-flow-hooks를 위해서 분리하도록 한다.
state 변환하는 hook들은 패키지에서 불러오도록 하고, server action은 hook의 onSuccess params로 넘기도록 하여 수정한다.
2026-01-05