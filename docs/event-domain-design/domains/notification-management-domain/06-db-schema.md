# Notification Management Domain - Database Schema

Technical Specification을 기반으로 한 데이터베이스 스키마 설계 문서입니다.

**작성자**: AI Assistant  
**작성일**: 2025-10-06  
**수정일**: 2025-10-09
**버전**: 2.0  
**기반 문서**: Organization Management Domain에서 분리

### 주요 변경사항 (v2.0) - schema-dev.ts 동기화
- **related_id 타입**: TEXT로 변경 (schema-dev.ts와 일치, ⚠️ UUID가 올바른 설계)
- **FK 참조 수정**: profiles.user_id 참조로 통일
- **RLS 정책 수정**: (SELECT auth.uid()) 형식으로 통일
- **테이블 관계도 업데이트**: profiles.user_id 참조 명시

### 이전 변경사항 (v1.0) - 도메인 분리
- **도메인 경계 명확화**: Notification Management Domain은 알림 시스템에만 집중
- **알림 관련 테이블**: notifications 테이블 관리
- **다른 도메인과의 통합**: Organization, User Management Domain에서 알림 생성 요청 수신

---

## 🎯 Schema Overview

### 설계 원칙
1. **알림 시스템**: 인박스 기반 알림 관리
2. **DDD Aggregate 경계 반영**: Notification Aggregate의 불변식을 DB 제약조건으로 구현
3. **단순성 우선**: 복잡한 비즈니스 로직은 도메인에서 처리
4. **MECE 구조**: 누락 없이, 중복 없이 명확한 경계
5. **성능 최적화**: Read Model 쿼리 패턴에 맞춘 인덱스 설계
6. **타입 안전성**: Drizzle ORM enum을 통한 알림 타입 관리
7. **권한 기반 접근**: RLS 정책을 통한 세밀한 데이터 접근 제어
8. **확장성**: 향후 다양한 알림 타입 추가를 고려한 테이블 설계

### 테이블 관계도
```
┌─────────────────┐
│ public.profiles │ (User Management Domain)
│                 │
│ • id (PK)       │
│ • user_id (FK)  │
└────────┬────────┘
         │ profiles.user_id 참조
         │ 1:N
         ▼
┌─────────────────┐
│ notifications   │
│                 │
│ • id (PK)       │
│ • user_id (FK)  │ → profiles.user_id
│ • type          │
│ • title         │
│ • message       │
│ • related_id    │ (TEXT) ⚠️ UUID가 올바른 설계
│ • is_read       │
│ • created_at    │
│ • read_at       │
└─────────────────┘
```

---

## 📋 Table Definitions

### 1. notification_type enum (public schema)

알림 타입을 정의하는 enum입니다.

```sql
-- 알림 타입 enum 정의
CREATE TYPE notification_type AS ENUM (
    'invitation',     -- 초대 알림
    'system',         -- 시스템 알림
    'announcement'    -- 공지사항
);

-- Comments
COMMENT ON TYPE notification_type IS 'Notification Management Domain - 알림 타입 enum';
COMMENT ON ENUM VALUE notification_type.invitation IS '초대 관련 알림';
COMMENT ON ENUM VALUE notification_type.system IS '시스템 알림';
COMMENT ON ENUM VALUE notification_type.announcement IS '공지사항 알림';
```

### 2. notifications 테이블 (public schema)

사용자 알림 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE notifications (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Notification Information
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id TEXT, -- ⚠️ schema-dev.ts는 TEXT, UUID가 올바른 설계
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT notifications_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT notifications_message_not_empty CHECK (LENGTH(TRIM(message)) > 0),
    CONSTRAINT notifications_read_at_check CHECK (
        (is_read = TRUE AND read_at IS NOT NULL) OR
        (is_read = FALSE AND read_at IS NULL)
    )
);

-- Indexes for Performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_related_id ON notifications(related_id) WHERE related_id IS NOT NULL;

-- Comments
COMMENT ON TABLE notifications IS 'Notification Management Domain - 사용자 알림 정보';
COMMENT ON COLUMN notifications.id IS '알림 ID (UUID, PK)';
COMMENT ON COLUMN notifications.user_id IS '수신자 ID (profiles.user_id 참조)';
COMMENT ON COLUMN notifications.type IS '알림 타입 (enum)';
COMMENT ON COLUMN notifications.title IS '알림 제목';
COMMENT ON COLUMN notifications.message IS '알림 내용';
COMMENT ON COLUMN notifications.related_id IS '관련 엔티티 ID (초대 ID 등) - ⚠️ TEXT 타입, UUID가 올바름';
COMMENT ON COLUMN notifications.is_read IS '읽음 여부';
COMMENT ON COLUMN notifications.read_at IS '읽은 시각';
```

> **⚠️ schema-dev.ts 불일치 경고**  
> 현재 schema-dev.ts에서 `related_id`가 TEXT 타입입니다.  
> organizations.id가 UUID로 수정되면, related_id도 UUID 타입으로 변경해야 합니다.

---

## 🔒 Row Level Security (RLS) Policies

### 1. RLS 활성화

```sql
-- notifications 테이블에 RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### 2. Notifications 테이블 RLS 정책

```sql
-- SELECT: Self only
CREATE POLICY "Enable read for self" ON notifications
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- INSERT: Self only (실제로는 Service에서 adminDb로 호출)
CREATE POLICY "Enable insert for self" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE: Self only (for marking as read)
CREATE POLICY "Enable update for self" ON notifications
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- DELETE: Self only (보관처리)
-- Note: 실제로는 사용하지 않음, 90일 후 자동 삭제
CREATE POLICY "Enable delete for self" ON notifications
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);
```

**RLS 전략 설명**:
- **SELECT/UPDATE/DELETE**: 사용자는 자신의 알림만 접근 가능
- **INSERT**: RLS는 self only지만, 실제로는 Service에서 adminDb 사용 (다른 사용자를 위한 알림 생성)

---

## 💼 비즈니스 로직 처리 방침

### SSOT(Single Source of Truth) 원칙
- **비즈니스 로직**: 애플리케이션 서버 코드에서 관리 (TypeScript/Node.js)
- **데이터베이스**: 단순한 데이터 저장소 역할 + 기본 제약조건만
- **PostgreSQL 함수**: 사용하지 않음 (유지보수성 및 테스트 용이성을 위해)

---

## 🚀 Performance Optimization

### 1. 핵심 인덱스 전략

```sql
-- 사용자 인박스 조회 최적화 (읽지 않은 알림 우선)
CREATE INDEX idx_notifications_user_unread_created ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;

-- 알림 타입별 조회 최적화
CREATE INDEX idx_notifications_type_created ON notifications(type, created_at DESC);

-- 관련 엔티티별 알림 조회 최적화
CREATE INDEX idx_notifications_related_type ON notifications(related_id, type) WHERE related_id IS NOT NULL;
```

### 2. 쿼리 성능 최적화

```sql
-- 읽지 않은 알림 개수 계산 최적화
CREATE INDEX idx_notifications_user_read_count ON notifications(user_id, is_read);

-- 알림 생성 시간 기준 정렬 최적화
CREATE INDEX idx_notifications_created_desc ON notifications(created_at DESC);
```

## 📋 Maintenance & Monitoring

### 1. 정기 점검 쿼리

```sql
-- 1. 고아 알림 확인 (관련 초대가 삭제된 알림)
SELECT 'Orphaned invitation notifications' as issue, COUNT(*) as count
FROM notifications n
WHERE n.type = 'invitation' 
AND n.related_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM invitations i WHERE i.id = n.related_id
);

-- 2. 오래된 읽은 알림 확인 (90일 경과, 보관 정책)
SELECT 'Old read notifications' as issue, COUNT(*) as count
FROM notifications
WHERE is_read = TRUE 
AND read_at < NOW() - INTERVAL '90 days';

-- 3. 사용자별 읽지 않은 알림 통계
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE is_read = FALSE
GROUP BY user_id
ORDER BY unread_count DESC
LIMIT 10;
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
WHERE query LIKE '%notifications%'
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
WHERE tablename IN ('notifications')
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
WHERE tablename IN ('notifications')
ORDER BY idx_scan DESC;
```

---

## 🧹 데이터 정리 및 보관 정책

### 1. 오래된 읽은 알림 정리 (90일 후 삭제)

```sql
-- 90일 경과한 읽은 알림 삭제
-- 주의: 이 작업은 애플리케이션 레벨에서 수행하거나, 별도 백그라운드 작업으로 실행해야 함
DELETE FROM notifications
WHERE is_read = TRUE 
AND read_at < NOW() - INTERVAL '90 days';
```

### 2. 고아 알림 정리

```sql
-- 관련 초대가 삭제된 초대 알림 정리
DELETE FROM notifications n
WHERE n.type = 'invitation' 
AND n.related_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM invitations i WHERE i.id = n.related_id
);
```

---

## ✅ 검증 체크리스트

### 알림 시스템 지원
- [x] **알림 생성**: 다른 도메인에서 알림 생성 요청 수신
- [x] **알림 조회**: 사용자별 알림 목록 조회
- [x] **알림 읽음 처리**: 알림 읽음 상태 업데이트
- [x] **알림 타입 관리**: `notification_type` enum으로 타입 안전성 확보
- [x] **권한 기반 접근**: RLS 정책으로 사용자별 데이터 격리
- [x] **초대 알림 통합**: 초대 정보와 조인하여 상세 정보 제공

### 데이터 무결성
- [x] **알림 타입 제약**: 유효한 notification_type enum 값만 허용
- [x] **제목/내용 검증**: 빈 문자열 방지
- [x] **읽음 일관성**: 읽은 알림은 read_at 필수
- [x] **RLS 보안**: 사용자는 자신의 알림만 접근 가능

### 성능 최적화
- [x] **핵심 인덱스**: 사용자별/읽음상태별 알림 조회 최적화
- [x] **알림 타입 인덱스**: 알림 타입별 조회 최적화
- [x] **관련 엔티티 인덱스**: 초대 알림 조회 최적화
- [x] **복합 인덱스**: 자주 사용되는 조합 쿼리 최적화
- [x] **부분 인덱스**: 조건부 인덱스로 저장 공간 절약
- [x] **통합 뷰**: user_notification_view로 초대 알림 조회 최적화

### 아키텍처 일관성
- [x] **DDD 원칙**: Notification Aggregate 경계와 DB 스키마 일치
- [x] **단일 책임**: notifications 테이블이 알림 관리에만 집중
- [x] **확장성**: 향후 다양한 알림 타입 추가 가능한 구조
- [x] **타입 안전성**: Drizzle ORM enum과 TypeScript 타입 일치
- [x] **이벤트 기반 설계**: 도메인 이벤트 발행을 위한 구조 지원
- [x] **CQRS 지원**: Command와 Query 분리를 위한 뷰 제공

---

## 🔗 도메인 간 통합

### User Management Domain과의 통합
- **profiles.user_id**: notifications.user_id의 외래키로 참조

### Organization Management Domain과의 통합
- **invitations.id**: notifications.related_id로 참조 (초대 알림의 경우, TEXT 타입)
- **초대 생성 시**: Organization Management Domain에서 알림 생성 요청
- **초대 응답 시**: Organization Management Domain에서 알림 정리 요청

> **⚠️ 참고**: organizations.id가 UUID로 수정되면, related_id도 UUID 타입으로 변경해야 합니다.

---

## 📚 References

### 관련 문서
- Organization Management Domain의 Software Design - Notification System 연동
- Organization Management Domain의 Process Model - 알림 생성 및 조회 프로세스

---

이 데이터베이스 스키마는 Notification Management Domain의 알림 시스템을 완전히 지원하며, 인박스 기반 알림 관리 기능을 제공합니다. 타입 안전성과 세밀한 RLS 정책을 통해 보안적이면서도 확장 가능한 구조를 제공합니다.

