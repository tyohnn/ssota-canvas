# YouTube App Space Value Object 설계 논의

## 개요

YouTube Entity의 필드들을 Value Object로 추출할지, Type으로 유지할지 논의합니다.

## 현재 상태

### YouTube Entity 필드
```typescript
export class YoutubeEntity {
  readonly id: string;                    // UUID (DB PK)
  readonly videoId: string;                // YouTube Video ID (예: "dQw4w9WgXcQ")
  readonly channelId?: string;            // UUID (DB FK to channels table)
  readonly script?: {
    transcript: Array<{
      text: string;
      start: number;
      duration: number;
    }>;
    metadata: {
      extractedAt: string;
      totalDuration: number;
      totalSegments: number;
      language: string;
    };
  };
  // ... 기타 필드
}
```

### Channel Entity 필드
```typescript
export class ChannelEntity {
  readonly id: string;                     // UUID (DB PK)
  readonly channelId: string;            // YouTube Channel ID (예: "UC...")
  // ... 기타 필드
}
```

---

## 제안 1: VideoId Value Object

### 현재 상태
- `videoId: string` - 단순 문자열

### YouTube Video ID 형식
- **길이**: 11자리 고정
- **문자**: 영문 대소문자, 숫자, 하이픈, 언더스코어
- **예시**: `dQw4w9WgXcQ`, `jNQXAC9IVRw`

### Value Object로 만들 경우

**장점**:
1. ✅ **형식 검증**: YouTube Video ID 형식 강제
2. ✅ **타입 안전성**: `string`과 `VideoId` 구분
3. ✅ **비즈니스 로직**: Video ID 관련 메서드 추가 가능
   - `toUrl()`: YouTube URL 생성
   - `toEmbedUrl()`: Embed URL 생성
4. ✅ **일관성**: 프로젝트의 다른 ID Value Object 패턴과 일치

**단점**:
1. ❌ **복잡도 증가**: 단순 문자열인데 클래스로 래핑
2. ❌ **변환 오버헤드**: DB ↔ Entity 변환 시 `.value` 호출 필요

**구현 예시**:
```typescript
export class VideoId {
  private static readonly VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
  private readonly _value: string;

  constructor(value: string) {
    if (!VideoId.isValid(value)) {
      throw new YoutubeError('INVALID_VIDEO_ID', `Invalid YouTube Video ID: ${value}`);
    }
    this._value = value;
  }

  static isValid(value: string): boolean {
    return value && VideoId.VIDEO_ID_REGEX.test(value);
  }

  get value(): string {
    return this._value;
  }

  toUrl(): string {
    return `https://www.youtube.com/watch?v=${this._value}`;
  }

  toEmbedUrl(): string {
    return `https://www.youtube.com/embed/${this._value}`;
  }

  equals(other: VideoId): boolean {
    return this._value === other._value;
  }
}
```

### Type으로 유지할 경우

**장점**:
1. ✅ **단순함**: 문자열 그대로 사용
2. ✅ **성능**: 변환 오버헤드 없음
3. ✅ **유연성**: 형식이 바뀌어도 수정 불필요

**단점**:
1. ❌ **검증 부재**: 잘못된 형식의 Video ID가 들어올 수 있음
2. ❌ **타입 안전성 부족**: 일반 `string`과 구분 불가

---

## 제안 2: ChannelId (두 가지 의미)

### 현재 혼란
1. **YoutubeEntity.channelId**: UUID (DB FK) - `channels.id` 참조
2. **ChannelEntity.channelId**: YouTube Channel ID (예: "UC...") - YouTube의 고유 ID

### 해결 방안

#### 옵션 A: 두 개의 Value Object 분리

```typescript
// DB FK용 (UUID)
export class ChannelId {
  // UUID 검증
  private readonly _value: string;
  // ... UUID 검증 로직
}

// YouTube Channel ID용
export class YoutubeChannelId {
  // YouTube Channel ID 형식 검증 (예: "UC..."로 시작)
  private readonly _value: string;
  // ... YouTube Channel ID 검증 로직
}
```

**사용**:
```typescript
export class YoutubeEntity {
  readonly channelId?: ChannelId;  // DB FK
  // ...
}

export class ChannelEntity {
  readonly channelId: YoutubeChannelId;  // YouTube Channel ID
  // ...
}
```

#### 옵션 B: Type으로 유지

- `YoutubeEntity.channelId`: `string | undefined` (UUID)
- `ChannelEntity.channelId`: `string` (YouTube Channel ID)

**장점**: 단순함  
**단점**: 타입 안전성 부족, 혼란 가능

---

## 제안 3: Script Transcript Value Object

### 현재 상태
```typescript
readonly script?: {
  transcript: Array<{
    text: string;
    start: number;
    duration: number;
  }>;
  metadata: {
    extractedAt: string;
    totalDuration: number;
    totalSegments: number;
    language: string;
  };
};
```

### Value Object로 만들 경우

**장점**:
1. ✅ **검증**: Transcript 데이터 무결성 보장
   - `start >= 0`
   - `duration > 0`
   - `text` 비어있지 않음
   - `totalSegments === transcript.length`
2. ✅ **비즈니스 로직**: Transcript 관련 메서드
   - `getSegmentAtTime(time: number)`: 특정 시간의 세그먼트 찾기
   - `getTextBetween(start: number, end: number)`: 시간 범위의 텍스트 추출
   - `searchText(query: string)`: 텍스트 검색
3. ✅ **불변성**: Transcript 데이터 변경 방지

**구현 예시**:
```typescript
export class TranscriptSegment {
  private constructor(
    public readonly text: string,
    public readonly start: number,
    public readonly duration: number
  ) {
    if (!text || text.trim().length === 0) {
      throw new YoutubeError('INVALID_TRANSCRIPT', 'Text cannot be empty');
    }
    if (start < 0) {
      throw new YoutubeError('INVALID_TRANSCRIPT', 'Start time must be >= 0');
    }
    if (duration <= 0) {
      throw new YoutubeError('INVALID_TRANSCRIPT', 'Duration must be > 0');
    }
  }

  static create(text: string, start: number, duration: number): TranscriptSegment {
    return new TranscriptSegment(text, start, duration);
  }

  get end(): number {
    return this.start + this.duration;
  }
}

export class TranscriptMetadata {
  private constructor(
    public readonly extractedAt: string,
    public readonly totalDuration: number,
    public readonly totalSegments: number,
    public readonly language: string
  ) {
    if (totalDuration < 0) {
      throw new YoutubeError('INVALID_METADATA', 'Total duration must be >= 0');
    }
    if (totalSegments < 0) {
      throw new YoutubeError('INVALID_METADATA', 'Total segments must be >= 0');
    }
  }

  static create(
    extractedAt: string,
    totalDuration: number,
    totalSegments: number,
    language: string
  ): TranscriptMetadata {
    return new TranscriptMetadata(extractedAt, totalDuration, totalSegments, language);
  }
}

export class YoutubeScript {
  private constructor(
    public readonly transcript: TranscriptSegment[],
    public readonly metadata: TranscriptMetadata
  ) {
    // 검증: totalSegments와 transcript.length 일치
    if (metadata.totalSegments !== transcript.length) {
      throw new YoutubeError(
        'INVALID_SCRIPT',
        `Total segments (${metadata.totalSegments}) does not match transcript length (${transcript.length})`
      );
    }
  }

  static create(
    transcript: Array<{ text: string; start: number; duration: number }>,
    metadata: {
      extractedAt: string;
      totalDuration: number;
      totalSegments: number;
      language: string;
    }
  ): YoutubeScript {
    const segments = transcript.map(t =>
      TranscriptSegment.create(t.text, t.start, t.duration)
    );
    const meta = TranscriptMetadata.create(
      metadata.extractedAt,
      metadata.totalDuration,
      metadata.totalSegments,
      metadata.language
    );
    return new YoutubeScript(segments, meta);
  }

  getSegmentAtTime(time: number): TranscriptSegment | null {
    return this.transcript.find(
      segment => time >= segment.start && time < segment.end
    ) || null;
  }

  getTextBetween(start: number, end: number): string {
    return this.transcript
      .filter(segment => segment.start < end && segment.end > start)
      .map(segment => segment.text)
      .join(' ');
  }
}
```

### Type으로 유지할 경우

**장점**:
1. ✅ **단순함**: JSON 직렬화/역직렬화 용이
2. ✅ **성능**: 변환 오버헤드 없음
3. ✅ **유연성**: 스키마 변경에 유연

**단점**:
1. ❌ **검증 부재**: 잘못된 데이터가 들어올 수 있음
2. ❌ **비즈니스 로직 부재**: Transcript 관련 메서드가 Entity에 분산

---

## 프로젝트 패턴 분석

### Value Object를 사용하는 경우
1. **ID 필드**: `BlockId`, `UserId`, `WorkspaceId` 등
   - 형식 검증 필요
   - 타입 안전성 중요
   - equals 메서드 필요

2. **복잡한 비즈니스 로직**: `BlockPropertiesVO`
   - 검증 로직 포함
   - 불변성 보장
   - toJSON/fromJSON 변환

### Type을 사용하는 경우
1. **단순 데이터 구조**: 대부분의 DTO
2. **외부 API 응답**: YouTube API 응답 등
3. **임시 데이터**: 계산 중간 결과

---

## 추천안

### 1. VideoId: ✅ **Value Object 추천**

**이유**:
- YouTube Video ID는 명확한 형식이 있음 (11자리)
- 형식 검증이 중요 (잘못된 ID로 API 호출 방지)
- URL 생성 등 유용한 메서드 추가 가능
- 프로젝트의 다른 ID Value Object 패턴과 일치

### 2. ChannelId: ⚠️ **상황에 따라**

**YoutubeEntity.channelId (UUID)**:
- **Type 유지 추천**: DB FK는 UUID 검증이 이미 DB에서 이루어짐
- 별도 Value Object 불필요

**ChannelEntity.channelId (YouTube Channel ID)**:
- **Value Object 고려**: YouTube Channel ID 형식 검증이 필요하다면
- 하지만 현재는 단순 문자열로도 충분할 수 있음

### 3. Script Transcript: ⚠️ **비즈니스 로직 필요성에 따라**

**Value Object 추천 조건**:
- Transcript 검색 기능이 필요할 때
- Transcript 데이터 무결성이 중요할 때
- Transcript 관련 비즈니스 로직이 많을 때

**Type 유지 추천 조건**:
- 단순 저장/조회만 할 때
- JSON 직렬화가 자주 일어날 때
- 비즈니스 로직이 거의 없을 때

---

## 최종 제안

### Phase 1: 필수 Value Object
1. ✅ **VideoId**: 형식 검증 + URL 생성 메서드

### Phase 2: 선택적 Value Object
2. ⚠️ **YoutubeChannelId**: YouTube Channel ID 형식 검증이 필요할 때만
3. ⚠️ **YoutubeScript**: Transcript 검색/필터링 기능이 필요할 때만

### Phase 3: Type 유지
- `YoutubeEntity.channelId` (UUID): Type 유지
- 기타 단순 필드: Type 유지

---

## 다음 단계

1. **VideoId Value Object 구현** (우선순위 높음)
2. **YoutubeScript Value Object**: Transcript 기능 요구사항 확인 후 결정
3. **YoutubeChannelId**: 필요성 검토 후 결정
