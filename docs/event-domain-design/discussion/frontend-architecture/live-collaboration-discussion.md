# 실시간 협업 기능 설계 회의록

## 회의 개요
- **목적**: 실시간 협업 기능(동시 편집, 히스토리, 자동저장) 설계
- **기술 스택**: Next.js 풀스택 + Supabase Realtime
- **핵심 요구사항**: 
  - 여러 명이 동시에 작업해도 문제 없음
  - 로컬 스냅샷 저장 + 자동저장
  - 버전 히스토리 관리
  - Supabase Realtime 활용

## 1. 핵심 설계 결정

### 1.1 동시 편집 아키텍처
- **로컬 우선**: 클라이언트에서 Yjs 문서를 단일 소스로 사용
- **실시간 동기화**: Supabase Realtime Broadcast/Presence 활용
- **최종 일관성**: CRDT 기반 자동 충돌 해결

### 1.2 저장 전략
- **자동저장**: 주기적(10초) 또는 변경량 기준(200회/200KB)으로 스냅샷 저장
- **수동저장**: 사용자가 "버전 만들기" 클릭 시 메시지와 함께 저장
- **버전 히스토리**: 스냅샷들이 타임라인으로 쌓임

### 1.3 실시간 요소
- **커서/선택/임시 이동**: Broadcast 채널로 실시간 전파 (저장 안 함)
- **최종 적용**: 스냅샷 저장으로 확정
- **히스토리 갱신**: DB Changes로 다른 클라이언트에 알림

## 2. 데이터베이스 스키마

### 2.1 기존 테이블 확장
```sql
-- 페이지 리비전 (낙관적 락용)
ALTER TABLE pages ADD COLUMN rev bigint NOT NULL DEFAULT 0;
ALTER TABLE pages ADD COLUMN updated_by uuid;
ALTER TABLE pages ADD COLUMN updated_at timestamptz DEFAULT now();
```

### 2.2 새 테이블 추가
```sql
-- 페이지 버전 (스냅샷 히스토리)
CREATE TABLE page_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('autosave','manual','restore')),
  message text,
  base_rev bigint NOT NULL,          -- 저장 당시 pages.rev
  state_json jsonb NOT NULL,         -- 전체 페이지 상태
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

CREATE INDEX ON page_versions (page_id, created_at DESC);

-- 변경 요약 (선택사항)
CREATE TABLE page_change_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  page_version_id uuid NOT NULL REFERENCES page_versions(id) ON DELETE CASCADE,
  diffs jsonb,          -- 추가/수정/삭제 블록 목록
  created_at timestamptz DEFAULT now()
);
```

## 3. 기술 스택 상세

### 3.1 Yjs란?
- **정의**: "여럿이 동시 편집해도 자동으로 잘 섞어주는 엔진"
- **특징**: 
  - CRDT 기반으로 충돌 없이 자동 병합
  - 오프라인 지원
  - 네트워크 독립적 (WebSocket, WebRTC 등 지원)
- **React Flow 연동**: 그래프 상태를 Yjs 문서에 보관하여 실시간 동기화

### 3.2 Supabase Realtime 활용
- **Broadcast**: 임시 상태 (커서, 선택, 드래그 미리보기)
- **Presence**: 사용자 상태 (접속자, 포인터 색상)
- **Database Changes**: 영구 저장 알림 (히스토리 패널 갱신)

### 3.3 이벤트 서버 필요성
- **현재 구조**: 필수 아님
- **서버 액션**: 자동저장/수동저장 시에만 호출
- **확장 옵션**: Supabase Edge Function으로 커밋 인제스터 추가 가능

## 4. 구현 흐름

### 4.1 편집 중
1. 클라이언트: Yjs 문서에 변경 반영
2. 실시간 동기화: Yjs가 다른 클라이언트에 자동 전파
3. 포인터/선택: Supabase Broadcast로 10~20Hz 송신

### 4.2 자동저장/수동저장
1. 클라이언트: 서버 액션 호출 (`{ pageId, myBaseRev, stateJson, kind, message? }`)
2. 서버: `pages.rev` 확인
   - 같으면: 저장 진행 (트랜잭션)
   - 다르면: 충돌 처리 (최신 상태 반환)

### 4.3 충돌 처리 (낙관적 락)
- 클라이언트가 알고 있는 `myBaseRev`와 서버의 `rev` 비교
- 같으면: 저장 OK
- 다르면: 최신 스냅샷 반환 → 클라이언트가 재적용 후 재시도

## 5. Supabase 채널 구성

### 5.1 채널 종류
- **presence**: `page:{id}` → 접속자, 포인터 색상
- **broadcast**: `page:{id}:ops` → 가벼운 편집 이벤트
- **broadcast**: `page:{id}:yupdates` → Yjs 업데이트 바이트 (선택사항)
- **postgres changes**: `page_versions` INSERT → 히스토리 패널 갱신

### 5.2 이벤트 예시
```javascript
// broadcast: page:123:ops
{ "type": "block.add", "block": { "id":"b9", "kind":"rect", "x":10, "y":10 } }
{ "type": "block.update", "id":"b1", "patch": { "x": 120, "y": 300 } }
{ "type": "block.remove", "id":"b4" }
```

## 6. 성능 최적화

### 6.1 자동저장 정책
- **시간**: 10초
- **변경 횟수**: 200회
- **바이트**: 200KB
- → 셋 중 하나라도 넘으면 저장 시도

### 6.2 레이트 제한
- **드래그 중**: 60fps → 10~20Hz로 샘플링
- **연속 업데이트**: 디바운스/스로틀 적용
- **같은 블록**: 연속 패치 coalesce

### 6.3 Vercel 비용 최적화
- **Broadcast/DB Changes**: Supabase 웹소켓 직접 연결 (Vercel 함수 호출 없음)
- **서버 액션**: 자동저장 시에만 호출 (주기 제한으로 호출 횟수 최소화)

## 7. 저장하지 않는 것들

### 7.1 DB에 저장하지 않음
- 포인터/선택/드래그 중간 프레임
- 초당 다량 이벤트 로그
- 휘발성 상태 (ephemeral state)

### 7.2 Realtime으로만 처리
- 커서 위치
- 블록 선택 상태
- 드래그 미리보기
- 사용자 포인터 색상

## 8. 구현 체크리스트

### 8.1 클라이언트
- [ ] Y.Doc + UndoManager 도입
- [ ] Supabase Broadcast/Presence 채널 구성
- [ ] 자동저장 훅 (타이머/용량/변경횟수 트리거)
- [ ] 로컬 IndexedDB 캐시

### 8.2 서버
- [ ] 서버 액션 `saveSnapshot` 구현
- [ ] 낙관적 락 로직
- [ ] RLS 정책 설정
- [ ] DB Changes 구독

### 8.3 테스트
- [ ] 탭 3개 동시 편집 테스트
- [ ] 오프라인→온라인 복귀 테스트
- [ ] 대형 문서 복원 성능 테스트
- [ ] 충돌 시 재적용 테스트

## 9. 선택지 정리

### 9.1 현재 단계 (MVP)
- **Broadcast**: 라이브 변경 (커서/선택)
- **자동저장**: 스냅샷 (주기적)
- **DB Changes**: 히스토리 갱신
- **장점**: 폴링 없음, Vercel 호출 최소, 구현 단순

### 9.2 향후 확장
- **Yjs 도입**: 동시성 요구 증가 시
- **Edge Function**: 커밋 인제스터 추가
- **고급 동시성**: 이벤트 그래프 기반 합치기

## 10. 결론

이 설계는 Next.js 서버 액션 + Supabase Realtime만으로도 충분히 안정적인 실시간 협업을 구현할 수 있습니다. Yjs는 나중에 동시성 요구가 커질 때 단계적으로 도입하면 됩니다.

**핵심 원칙**:
- 로컬 우선, 최종 일관성
- 휘발성 상태는 Realtime, 영구 상태는 DB
- 낙관적 락으로 충돌 최소화
- 폴링 없이 실시간 구독 활용