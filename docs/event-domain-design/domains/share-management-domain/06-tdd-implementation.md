# TDD Implementation: Share Management Domain

## 🎯 개요

**도메인**: Share Management  
**작성자**: 주니어개발자 + 시니어개발자 (멘토링)  
**작성일**: 2026-01-02  
**버전**: v1.0

**Technical Specification 참조**: `04-technical-specification.md`  
**Testing Strategy 참조**: `05-testing-strategy.md`

---

## 🔁 TDD 구현 프로세스

**RED → GREEN → REFACTOR** 사이클을 적용한다.

---

## Phase 1: Value Objects 구현 (RED-GREEN-REFACTOR)

### 1.1 PublishToken VO

**테스트 작성 (RED)**:
- 파일: `apps/web/src/domains/share/shared/value-objects/__tests__/publish-token.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { PublishToken } from '../publish-token.vo';
import { ShareManagementError } from '../../errors/share-management.error';

describe('PublishToken Value Object', () => {
  it('Base64 형식의 문자열만 허용해야 한다', () => {
    const validToken = 'ZHVtbXktdG9rZW4=';
    const token = new PublishToken(validToken);
    expect(token.toString()).toBe(validToken);
  });

  it('빈 값은 거부해야 한다', () => {
    expect(() => new PublishToken('')).toThrow(ShareManagementError);
  });
});
```

**최소 구현 (GREEN)**:
- 파일: `apps/web/src/domains/share/shared/value-objects/publish-token.vo.ts`

```typescript
import { ShareManagementError } from '../errors/share-management.error';

export class PublishToken {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new ShareManagementError('INVALID_PUBLISH_TOKEN', 'Invalid token');
    }
    // TODO: Base64 패턴 검증 추가
  }

  toString(): string {
    return this.value;
  }
}
```

**리팩터링 기준**:
- Base64 패턴 검증은 Phase 1 리팩터링 단계에서 보완한다

---

### 1.2 PublishLinkPath VO

**테스트 작성 (RED)**:
- 파일: `apps/web/src/domains/share/shared/value-objects/__tests__/publish-link-path.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { PublishLinkPath } from '../publish-link-path.vo';
import { ShareManagementError } from '../../errors/share-management.error';

describe('PublishLinkPath Value Object', () => {
  it('`/p/[token]` 형식만 허용해야 한다', () => {
    const path = new PublishLinkPath('/p/abcd');
    expect(path.toString()).toBe('/p/abcd');
  });

  it('잘못된 경로는 거부해야 한다', () => {
    expect(() => new PublishLinkPath('/share/abcd')).toThrow(ShareManagementError);
  });
});
```

**최소 구현 (GREEN)**:
- 파일: `apps/web/src/domains/share/shared/value-objects/publish-link-path.vo.ts`

```typescript
import { ShareManagementError } from '../errors/share-management.error';

export class PublishLinkPath {
  constructor(private readonly value: string) {
    if (!value.startsWith('/p/')) {
      throw new ShareManagementError('INVALID_PUBLISH_TOKEN', 'Invalid publish link');
    }
  }

  toString(): string {
    return this.value;
  }
}
```

**검증 범위**:
- 경로 형식 검증은 최소 수준이며, 토큰 검증은 PublishToken에서 책임진다

---

## Phase 2: Entities 구현

### 2.1 PublishedPage Entity

**테스트 작성 (RED)**:
- 파일: `apps/web/src/domains/share/shared/entities/__tests__/published-page.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { PublishedPage } from '../published-page.entity';

// Given: 소유자와 페이지 ID
// When: canPublishBy(owner)
// Then: true
```

**최소 구현 (GREEN)**:
- 파일: `apps/web/src/domains/share/shared/entities/published-page.entity.ts`

```typescript
export class PublishedPage {
  constructor(
    public readonly pageId: string,
    public readonly ownerId: string,
    public status: 'published'
  ) {}

  canPublishBy(userId: string): boolean {
    return this.ownerId === userId;
  }
}
```

**설계 의도**:
- 향후 unpublish 확장을 고려해 status 필드를 둔다

---

### 2.2 CopyWorkflow Entity

**테스트 작성 (RED)**:
- 파일: `apps/web/src/domains/share/shared/entities/__tests__/copy-workflow.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { CopyWorkflow } from '../copy-workflow.entity';

// Given: selecting_workspace 상태
// When: selectWorkspace 호출
// Then: targetWorkspaceId 설정
```

**최소 구현 (GREEN)**:
- 파일: `apps/web/src/domains/share/shared/entities/copy-workflow.entity.ts`

```typescript
export class CopyWorkflow {
  constructor(
    public status: 'selecting_workspace',
    public targetWorkspaceId?: string
  ) {}

  selectWorkspace(workspaceId: string) {
    if (this.status !== 'selecting_workspace') {
      throw new Error('Invalid state');
    }
    this.targetWorkspaceId = workspaceId;
  }
}
```

**역할 분리**:
- CopyWorkflow Entity는 최소 상태만 관리하고, 상태 종료는 Aggregate에서 책임진다

---

## Phase 3: Aggregates 구현

### 3.1 PublishedPageAggregate

**테스트 작성 (RED)**:
- 파일: `apps/web/src/domains/share/shared/aggregates/__tests__/published-page.aggregate.test.ts`

```typescript
// Given: 소유자, 페이지 ID
// When: publish 호출
// Then: PagePublished 이벤트 발행
```

**최소 구현 (GREEN)**:
- 파일: `apps/web/src/domains/share/shared/aggregates/published-page.aggregate.ts`

```typescript
export class PublishedPageAggregate {
  publish() {
    // 실제 구현에서는 상태 변경 + 이벤트 기록을 수행
  }
}
```

---

### 3.2 CopyWorkflowAggregate

**테스트 작성 (RED)**:
- 파일: `apps/web/src/domains/share/shared/aggregates/__tests__/copy-workflow.aggregate.test.ts`

```typescript
// Given: workflow
// When: markFailed
// Then: PageCopyFailed 이벤트 발행
```

**최소 구현 (GREEN)**:
- 파일: `apps/web/src/domains/share/shared/aggregates/copy-workflow.aggregate.ts`

```typescript
export class CopyWorkflowAggregate {
  markFailed() {
    // 최소 구현: 이벤트 발행
  }

  markCompleted() {
    // PageCopied 이벤트 발행
  }
}
```

---

## Phase 4: Repository 구현

- PublishedPageRepository: DB 연동 테스트 포함
- CopyWorkflowRepository: DB 연동 테스트 포함

---

## Phase 5: Service 구현

- SharePublishingService: 비즈니스 시나리오 테스트 포함
- ShareCopyService: 비즈니스 시나리오 테스트 포함

---

## Phase 6: Server Actions 구현

- publishPageAction: 프론트 연계 테스트 포함
- getPublishedPageAction: 프론트 연계 테스트 포함
- getWorkspaceSelectionAction: 프론트 연계 테스트 포함
- copyPublishedPageAction: 프론트 연계 테스트 포함

---

## Phase 7: E2E Tests 구현

- 게시 링크 발급
- 비회원 복제 시도
- 회원 복제 완료

**E2E 기준**:
- 사용자 시나리오 기준 성공/실패 흐름을 검증한다

---

*이 문서는 Share Management Domain의 TDD 구현 가이드입니다.*
