# Database Schema: AI Management Domain

## 🎯 개요

**도메인**: AI Management Domain  
**작성자**: 시니어개발자 + 주니어개발자  
**작성일**: 2025-11-12  
**버전**: v1.0

**Software Design 참조**: `03-software-design.md`  
**Process Model 참조**: `02-process-model.md`  
**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: 실제 마이그레이션 및 구현

---

> **작성 시점**: Software Design 완료 후, 실제 마이그레이션 작성 전  
> **목적**: DDD Aggregate를 데이터베이스 스키마로 전환, 성능 최적화 및 RLS 정책 정의

**기반 문서**: [Software Design](./03-software-design.md)

---

### 주요 변경사항 (v1.0)
- **event_logs 테이블 설계**: Append-Only Audit Log 패턴으로 모든 이벤트 통합 저장
- **이벤트 타입**: user_utterance, ai_response, tool_call, block_created, block_updated, block_deleted
- **BM25 전문 검색**: 자연어 이벤트의 searchContent 필드에 대한 전문 검색 지원
- **성능 최적화**: 페이지 범위 조회, 시간 범위 쿼리, BM25 검색을 위한 인덱스 설계
- **RLS 정책**: 페이지 접근 권한 기반 이벤트 로그 격리

---

## 🎯 Schema Overview

### 설계 원칙
1. **Scenario 범위**: 사용자 발화 입력 → Agent 자율 실행, 툴 실행, 대화 이력 조회
2. **DDD Aggregate 경계 반영**: Event Log Aggregate의 불변식을 DB 제약조건으로 구현
3. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리
4. **MECE 구조**: 누락 없이, 중복 없이 명확한 경계
5. **성능 최적화**: Short-Term Memory, Long-Term Memory 쿼리 패턴에 맞춘 인덱스 설계
6. **타입 안전성**: Drizzle ORM을 통한 타입 안전성 확보
7. **권한 기반 접근**: RLS 정책을 통한 페이지 범위 데이터 격리
8. **확장성**: 향후 기능 확장을 고려한 테이블 설계

### 테이블 관계도
```
┌─────────────────┐
│     pages       │
│                 │
│ • id (PK)       │
│ • workspace_id  │
│ • title         │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│   event_logs    │
│                 │
│ • id (PK)       │
│ • page_id (FK)  │
│ • user_id       │
│ • event_type    │
│ • payload       │ (JSONB)
│ • search_content│ (BM25 검색용)
│ • agent_execution_id│
│ • timestamp     │
│ • created_at    │
└─────────────────┘
```

---

## 📋 Table Definitions

### 1. event_type enum (public schema)

AI Management Domain의 이벤트 타입 정의

```sql
-- event_type enum 정의
CREATE TYPE event_type AS ENUM (
    'user_utterance',   -- 사용자 발화
    'ai_response',      -- AI 응답
    'tool_call',        -- 툴 호출
    'block_created',    -- 블럭 생성
    'block_updated',    -- 블럭 수정
    'block_deleted'     -- 블럭 삭제
);

-- Comments
COMMENT ON TYPE event_type IS 'AI Management Domain - 이벤트 타입';
COMMENT ON ENUM VALUE event_type.user_utterance IS '사용자 발화 이벤트';
COMMENT ON ENUM VALUE event_type.ai_response IS 'AI 응답 이벤트';
COMMENT ON ENUM VALUE event_type.tool_call IS '툴 호출 이벤트';
COMMENT ON ENUM VALUE event_type.block_created IS '블럭 생성 이벤트';
COMMENT ON ENUM VALUE event_type.block_updated IS '블럭 수정 이벤트';
COMMENT ON ENUM VALUE event_type.block_deleted IS '블럭 삭제 이벤트';
```

---

### 2. event_logs 테이블 (public schema)

AI Management Domain의 핵심 테이블 - 모든 이벤트를 Append-Only 방식으로 저장

```sql
CREATE TABLE event_logs (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign Keys & Isolation
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Event Type & Payload
    event_type event_type NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    
    -- Search & Grouping
    search_content TEXT, -- BM25 전문 검색용 텍스트 (자연어 이벤트만)
    agent_execution_id TEXT, -- Agent 실행 ID (같은 Agent 실행 내 툴 콜 그룹핑)
    
    -- Temporal Information
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 이벤트 발생 시간
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- 로그 생성 시간
    
    -- Constraints
    CONSTRAINT event_logs_search_content_length CHECK (
        search_content IS NULL OR LENGTH(search_content) <= 10000
    ),
    CONSTRAINT event_logs_payload_is_object CHECK (
        jsonb_typeof(payload) = 'object'
    )
);

-- Indexes for Performance
-- 페이지 범위 조회 최적화 (Short-Term Memory)
CREATE INDEX idx_event_logs_page_timestamp ON event_logs(page_id, timestamp DESC) 
WHERE page_id IS NOT NULL;

-- 이벤트 타입별 필터링
CREATE INDEX idx_event_logs_page_type ON event_logs(page_id, event_type) 
WHERE page_id IS NOT NULL;

-- Agent 실행 단위 그룹핑
CREATE INDEX idx_event_logs_agent_execution ON event_logs(agent_execution_id) 
WHERE agent_execution_id IS NOT NULL;

-- BM25 전문 검색 최적화 (Long-Term Memory)
CREATE INDEX idx_event_logs_search_content ON event_logs 
USING GIN(to_tsvector('korean', search_content)) 
WHERE search_content IS NOT NULL;

-- JSONB 메타데이터 필터링 최적화 (툴 호출, 블럭 변경)
CREATE INDEX idx_event_logs_payload ON event_logs 
USING GIN(payload jsonb_path_ops) 
WHERE event_type IN ('tool_call', 'block_created', 'block_updated', 'block_deleted');

-- 시간 범위 쿼리 최적화 (최근 1주일)
CREATE INDEX idx_event_logs_recent ON event_logs(page_id, timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '7 days';

-- Comments
COMMENT ON TABLE event_logs IS 'AI Management Domain - 통합 이벤트 로그 (Append-Only Audit Log)';
COMMENT ON COLUMN event_logs.id IS '이벤트 고유 식별자';
COMMENT ON COLUMN event_logs.page_id IS '페이지 ID (격리 단위)';
COMMENT ON COLUMN event_logs.user_id IS '이벤트 발생 사용자 ID';
COMMENT ON COLUMN event_logs.event_type IS '이벤트 타입';
COMMENT ON COLUMN event_logs.payload IS '이벤트 타입별 상세 데이터 (JSONB)';
COMMENT ON COLUMN event_logs.search_content IS 'BM25 전문 검색용 텍스트 (자연어 이벤트만)';
COMMENT ON COLUMN event_logs.agent_execution_id IS 'Agent 실행 ID (같은 Agent 실행 내 툴 콜 그룹핑)';
COMMENT ON COLUMN event_logs.timestamp IS '이벤트 발생 시간';
COMMENT ON COLUMN event_logs.created_at IS '로그 생성 시간';
```

> **💡 설계 노트**  
> - **Append-Only 패턴**: 이벤트 로그는 생성 후 수정/삭제 불가 (Immutable Audit Log)
> - **페이지 격리**: 모든 이벤트는 page_id로 격리되어 페이지 간 접근 불가
> - **BM25 검색**: search_content 필드에 한국어 전문 검색 인덱스 적용
> - **JSONB 최적화**: payload에 GIN 인덱스로 메타데이터 필터링 성능 향상
> - **세션 개념 없음**: agent_execution_id로 그룹핑하지만 세션 테이블 없음

---

## 🔒 Row Level Security (RLS) Policies

### 1. RLS 전략: Layered Security Model

**핵심 원칙**:
- ✅ **RLS**: 페이지 접근 권한 기반 기본 격리 (fail-safe)
- ✅ **Application**: 복잡한 비즈니스 권한 로직 (페이지 멤버십 확인 등)
- ✅ **adminDb**: Application-level 권한 체크 후 사용

**참고**: [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

### 2. RLS 활성화

```sql
-- event_logs 테이블에 RLS 활성화
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
```

### 3. event_logs 테이블 RLS 정책

**전략**: 페이지 멤버십 기반 접근 제어

```sql
-- SELECT: 페이지 멤버만 해당 페이지의 이벤트 로그 조회 가능
CREATE POLICY "Enable read for page members" ON event_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM page_members pm
            WHERE pm.page_id = event_logs.page_id
            AND pm.user_id = (SELECT auth.uid())
        )
    );

-- INSERT: 페이지 멤버만 이벤트 로그 생성 가능
CREATE POLICY "Enable insert for page members" ON event_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM page_members pm
            WHERE pm.page_id = event_logs.page_id
            AND pm.user_id = (SELECT auth.uid())
        )
        AND user_id = (SELECT auth.uid())
    );

-- UPDATE: Append-Only이므로 UPDATE 불가 (정책 없음)

-- DELETE: Append-Only이므로 DELETE 불가 (정책 없음)
```

**RLS 전략 설명**:
- **SELECT**: 페이지 멤버만 해당 페이지의 이벤트 로그 조회 가능
- **INSERT**: 페이지 멤버만 이벤트 로그 생성 가능, user_id는 현재 사용자로 고정
- **UPDATE/DELETE**: Append-Only 패턴이므로 불가 (정책 없음)
- **특별한 케이스**: Application-level 권한 체크 후 adminDb 사용 가능

**Application-level 권한 체크 예시**:
```typescript
// AIQueryHandler.logUserUtterance()
// Step 1: Application-level 권한 체크 - 페이지 멤버십 확인
const isPageMember = await pageMemberRepo.isMember(pageId, userId);
if (!isPageMember) {
  return Result.err('NOT_PAGE_MEMBER');
}

// Step 2: RLS로 기본 권한 확인 (자동)
const eventLog = await db.rls.insert(event_logs).values({
  page_id: pageId,
  user_id: userId,
  event_type: 'user_utterance',
  payload: { utterance, selectedBlockIds, nearbyBlockIds },
  search_content: utterance,
  timestamp: new Date()
});

return Result.ok(eventLog);
```

---

## 💼 비즈니스 로직 처리 방침

### SSOT(Single Source of Truth) 원칙
- **비즈니스 로직**: 애플리케이션 서버 코드에서 관리 (TypeScript/Node.js)
- **데이터베이스**: 단순한 데이터 저장소 역할 + 기본 제약조건만
- **PostgreSQL 함수**: 사용하지 않음 (유지보수성 및 테스트 용이성을 위해)

### Layered Security Model

**1️⃣ RLS Layer (Defense in Depth)**
- 역할: 페이지 멤버십 기반 기본 격리
- 정책: page_members 테이블을 통한 멤버십 확인
- 장점: 데이터베이스 레벨에서 기본 보안 보장

**2️⃣ Application Layer (Primary Authorization)**
- 역할: 복잡한 비즈니스 권한 로직 처리
- 구현: AIQueryHandler에서 권한 체크 후 RLS 사용
- 예시: 페이지 멤버십 확인, Agent 실행 권한 검증

**3️⃣ adminDb 사용 시점**
- Long-Term Memory 검색: Application-level 권한 체크 후 전체 이벤트 조회
- 관리자 기능: 페이지 관리자가 모든 이벤트 조회
- 전제 조건: Application-level 권한 체크 완료 후 사용

---

## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략

```sql
-- Short-Term Memory 조회 최적화 (최근 N개 이벤트)
CREATE INDEX idx_event_logs_page_timestamp ON event_logs(page_id, timestamp DESC) 
WHERE page_id IS NOT NULL;

-- Long-Term Memory 조회 최적화 (BM25 전문 검색)
CREATE INDEX idx_event_logs_search_content ON event_logs 
USING GIN(to_tsvector('korean', search_content)) 
WHERE search_content IS NOT NULL;

-- 메타데이터 패턴 매칭 최적화 (툴 호출, 블럭 변경)
CREATE INDEX idx_event_logs_payload ON event_logs 
USING GIN(payload jsonb_path_ops) 
WHERE event_type IN ('tool_call', 'block_created', 'block_updated', 'block_deleted');

-- Agent 실행 단위 그룹핑 최적화
CREATE INDEX idx_event_logs_agent_execution ON event_logs(agent_execution_id) 
WHERE agent_execution_id IS NOT NULL;
```

### 2. 쿼리 성능 최적화

```sql
-- 이벤트 타입별 필터링 최적화
CREATE INDEX idx_event_logs_page_type ON event_logs(page_id, event_type) 
WHERE page_id IS NOT NULL;

-- 최근 1주일 이벤트만 실시간 조회 최적화
CREATE INDEX idx_event_logs_recent ON event_logs(page_id, timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '7 days';

-- 복합 쿼리 최적화 (페이지 + 타입 + 시간)
CREATE INDEX idx_event_logs_page_type_time ON event_logs(page_id, event_type, timestamp DESC) 
WHERE page_id IS NOT NULL;
```

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. 고아 이벤트 로그 확인 (페이지가 삭제된 이벤트)
SELECT 'Orphan event logs' as issue, COUNT(*) as count
FROM event_logs el
LEFT JOIN pages p ON el.page_id = p.id
WHERE el.page_id IS NOT NULL AND p.id IS NULL;

-- 2. JSONB 스키마 무결성 확인
SELECT 'Invalid payload JSONB' as issue, COUNT(*) as count
FROM event_logs 
WHERE jsonb_typeof(payload) != 'object';

-- 3. search_content 누락 확인 (자연어 이벤트)
SELECT 'Missing search_content' as issue, COUNT(*) as count
FROM event_logs 
WHERE event_type IN ('user_utterance', 'ai_response')
AND search_content IS NULL;

-- 4. agent_execution_id 누락 확인 (툴 호출)
SELECT 'Missing agent_execution_id' as issue, COUNT(*) as count
FROM event_logs 
WHERE event_type = 'tool_call'
AND agent_execution_id IS NULL;

-- 5. 이벤트 로그 증가율 확인
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as event_count,
    COUNT(DISTINCT page_id) as page_count,
    COUNT(DISTINCT user_id) as user_count
FROM event_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### 2. 성능 모니터링

```sql
-- 느린 쿼리 식별
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%event_logs%'
ORDER BY total_time DESC
LIMIT 10;

-- 테이블별 사용량 통계
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_tup_hot_upd as hot_updates,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables 
WHERE tablename IN ('event_logs')
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;

-- 인덱스 사용량 통계
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('event_logs')
ORDER BY idx_scan DESC;

-- BM25 검색 인덱스 사용률 확인
SELECT 
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes 
WHERE indexname = 'idx_event_logs_search_content';
```

---

## 🧹 데이터 정리 및 보관 정책

### 1. 오래된 이벤트 로그 아카이브 (선택적)

```sql
-- 1년 이상 된 이벤트 로그는 아카이브 테이블로 이동
-- 주의: 이 작업은 애플리케이션 레벨에서 수행하거나, 별도 백그라운드 작업으로 실행해야 함
CREATE TABLE event_logs_archive (LIKE event_logs INCLUDING ALL);

-- 아카이브 이동 (예시)
INSERT INTO event_logs_archive
SELECT * FROM event_logs
WHERE timestamp < NOW() - INTERVAL '1 year';

-- 아카이브 후 원본 삭제 (주의: Append-Only이므로 신중하게 결정)
-- DELETE FROM event_logs WHERE timestamp < NOW() - INTERVAL '1 year';
```

### 2. 고아 데이터 정리

```sql
-- 페이지가 삭제된 이벤트 로그 확인
SELECT el.id, el.page_id, el.event_type, el.timestamp
FROM event_logs el
LEFT JOIN pages p ON el.page_id = p.id
WHERE el.page_id IS NOT NULL AND p.id IS NULL;

-- 사용자가 삭제된 이벤트 로그 확인 (user_id는 SET NULL이므로 확인만)
SELECT el.id, el.user_id, el.event_type, el.timestamp
FROM event_logs el
LEFT JOIN profiles pr ON el.user_id = pr.id
WHERE el.user_id IS NOT NULL AND pr.id IS NULL;
```

---

## ✅ 검증 체크리스트

### Scenario 지원
- [x] ✅ **사용자 발화 입력**: user_utterance 이벤트 로깅 지원
- [x] ✅ **AI 응답 로깅**: ai_response 이벤트 로깅 지원
- [x] ✅ **툴 호출 로깅**: tool_call 이벤트 로깅 및 agent_execution_id 그룹핑 지원
- [x] ✅ **블럭 변경 로깅**: block_created, block_updated, block_deleted 이벤트 로깅 지원
- [x] ✅ **Short-Term Memory 조회**: 최근 N개 이벤트 시간순 조회 지원
- [x] ✅ **Long-Term Memory 검색**: BM25 전문 검색 및 메타데이터 패턴 매칭 지원

### 데이터 무결성
- [x] ✅ **페이지 제약**: 이벤트 로그는 반드시 하나의 페이지에 속함 (FK 제약조건)
- [x] ✅ **이벤트 타입 제약**: 지원되는 이벤트 타입만 허용 (event_type enum 사용)
- [x] ✅ **JSONB 구조**: payload는 object 타입 (CHECK 제약조건)
- [x] ✅ **Append-Only**: UPDATE/DELETE 정책 없음 (불변성 보장)
- [x] ✅ **FK 관계**: 모든 외래키가 올바르게 설정됨 (page_id, user_id)
- [x] ✅ **RLS 보안**: 페이지 멤버십 기반 접근 제어 정책

### 성능 최적화
- [x] ✅ **페이지 범위 조회**: page_id + timestamp 복합 인덱스
- [x] ✅ **BM25 전문 검색**: search_content GIN 인덱스 (한국어 지원)
- [x] ✅ **JSONB 메타데이터**: payload GIN 인덱스 (jsonb_path_ops)
- [x] ✅ **Agent 실행 그룹핑**: agent_execution_id 인덱스
- [x] ✅ **최근 이벤트 최적화**: 7일 이내 이벤트 부분 인덱스
- [x] ✅ **이벤트 타입 필터링**: page_id + event_type 복합 인덱스

### 아키텍처 일관성
- [x] ✅ **DDD 원칙**: Event Log Aggregate 경계와 DB 스키마 일치
- [x] ✅ **Append-Only 패턴**: 불변성 보장 및 Audit Log 역할
- [x] ✅ **페이지 격리**: 모든 이벤트는 페이지 범위로 격리
- [x] ✅ **타입 안전성**: Drizzle ORM과 TypeScript 타입 일치
- [x] ✅ **RLS 통합**: 페이지 멤버십 기반 접근 제어 정책
- [x] ✅ **세션 개념 없음**: agent_execution_id로 그룹핑하지만 세션 테이블 없음

---

## 🔗 도메인 간 통합

### Page Management Domain과의 통합
- **event_logs.page_id**: pages.id 참조 (CASCADE DELETE)
- **권한 관리**: page_members 테이블을 통한 멤버십 확인
- **RLS 정책**: 페이지 멤버십 기반 접근 제어

### Block Management Domain과의 통합
- **블럭 변경 이벤트**: Block Management Domain에서 이벤트 구독하여 event_logs에 저장
- **이벤트 타입**: block_created, block_updated, block_deleted
- **데이터 흐름**: Block Management → AI Management (이벤트 구독)

### Canvas Management Domain과의 통합
- **컨텍스트 조립**: Canvas Management에서 선택/주변 블럭 정보 조회
- **데이터 흐름**: AI Management → Canvas Management (컨텍스트 조립 시 호출)

---

## 📚 References

### 관련 문서
- [Software Design](./03-software-design.md) - Event Log Aggregate 정의 및 Read Model
- [Process Model](./02-process-model.md) - 사용자 발화 입력 및 Agent 실행 시나리오
- [Event Storming](./01-event-storm.md) - 도메인 이벤트 및 명령

### 외부 참조
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📝 작성 가이드

### 작성 시 주의사항
1. **테이블 설계**: Software Design의 Event Log Aggregate와 일치하도록 설계
2. **인덱스 전략**: Short-Term Memory, Long-Term Memory 쿼리 패턴 분석 후 인덱스 추가
3. **RLS 정책**: 페이지 멤버십 기반 최소 권한 원칙 적용
4. **주석**: 모든 테이블, 컬럼, enum에 의미 있는 주석 추가
5. **제약조건**: 비즈니스 규칙을 DB 제약조건으로 구현
6. **마이그레이션**: Drizzle ORM으로 생성할 수 있는 형태로 작성

### 템플릿 사용 순서
1. **개요 작성**: 도메인, 작성자, 버전 정보 입력
2. **테이블 관계도**: ASCII 다이어그램으로 테이블 간 관계 표현
3. **Enum 정의**: event_type enum 정의
4. **테이블 정의**: event_logs 테이블 설계 및 제약조건 정의
5. **RLS 정책**: 페이지 멤버십 기반 접근 권한 정책 정의
6. **성능 최적화**: Short-Term Memory, Long-Term Memory 쿼리를 위한 인덱스 추가
7. **모니터링**: 정기 점검 쿼리 작성
8. **검증**: 체크리스트 확인

---

이 데이터베이스 스키마는 AI Management Domain의 사용자 발화 입력, Agent 자율 실행, 툴 호출, 대화 이력 조회를 완전히 지원하며, Append-Only Audit Log 패턴을 제공합니다. DDD 원칙과 성능 최적화, 보안을 모두 고려한 설계로 확장 가능하고 유지보수하기 쉬운 구조를 제공합니다.

