# YouTube App Space

YouTube 블록의 확장 기능을 위한 별도 도메인 스페이스입니다. YouTube 영상 메타데이터, 스크립트, 채널 정보를 효율적으로 관리하고 재사용합니다.

## 목표

1. **데이터 중복 제거**: 같은 YouTube 영상은 한 번만 저장하여 스토리지 최적화
2. **스크립트 재사용**: 한 번 추출한 스크립트를 모든 사용자가 공유하여 API 비용 절감
3. **SSOT 유지**: `block.properties`에는 참조만 저장하고, 실제 데이터는 `youtube-app-space`에 저장
4. **용량 최적화**: 블록에 스크립트를 캐싱하지 않고 필요할 때마다 조회
5. **권한 관리**: 특정 블록을 가진 사용자만 스크립트 접근 가능

## 설계 원칙

### 1. App Space 패턴

`image-app-space` 패턴을 따라 YouTube 데이터를 별도 스키마로 관리합니다.

**이유**:
- 블록 테이블 비대화 방지
- 데이터 재사용으로 스토리지 최적화
- 도메인 경계 명확화

### 2. DDD (Domain-Driven Design) 패턴

백엔드 패턴 문서([docs/patterns/backend/server-side-ddd-conventions.md](../../../../../docs/patterns/backend/server-side-ddd-conventions.md))를 준수합니다.

**핵심 원칙**:
- **Server Action**: `unknown` → SafeDTO (Zod 검증)
- **Service Function**: SafeDTO → Command 변환 (Value Objects 생성)
- **Aggregate**: Command → Domain Event 발생 (1:1 대응)
- **Repository**: Aggregate/Entity 영속화
- **Service Function 패턴**: Service Class가 아닌 Function 사용
- **Repository 주입**: Repository는 파라미터로 주입 (테스트 용이)

**데이터 흐름**:
```
unknown (Server Action)
  ↓ Zod 검증
SafeDTO (Internal Function)
  ↓ 인증/권한 확인
SafeDTO + userId (Service Function)
  ↓ SafeDTO → Command 변환
Command (Aggregate)
  ↓ Command 처리 + Event 발생
Domain Event (Repository)
  ↓ 영속화
Database
```

### 3. Defense in Depth (다층 보안)

여러 레이어에서 보안을 검증합니다:

1. **RLS (Row Level Security)**: DB 레벨에서 모든 직접 접근 차단
2. **Server Action 검증**: Zod 스키마로 요청 검증
3. **Secure Action Wrapper**: 블록 권한 및 타입 검증
4. **Service Function**: 비즈니스 로직 내 추가 검증

## 아키텍처

### 스키마 구조

```
youtube_app_space/
├── channels          # YouTube 채널 정보
├── videos           # YouTube 영상 정보 및 스크립트
└── action_transactions  # 유료 액션 추적
```

### 도메인 구조

```
domains/youtube-app-space/
├── actions/                          # Server Actions
│   ├── secure-action.ts            # Secure Action Wrappers
│   └── video/                       # Video Actions
│       ├── get-youtube-metadata.action.ts
│       ├── get-video-script.action.ts
│       ├── create-action-transaction.action.ts
│       └── smart-summary.action.ts
├── backend/
│   ├── repositories/
│   │   ├── interfaces/              # Repository 인터페이스
│   │   └── implementations/         # Drizzle 구현
│   └── services/                    # Service Functions
│       ├── video/                   # Video 서비스
│       ├── channel/                 # Channel 서비스
│       ├── action-transaction/      # Transaction 서비스
│       └── youtube-api/             # YouTube API 연동
├── shared/
│   ├── aggregates/                 # Aggregate (비즈니스 로직)
│   ├── entities/                    # Entity (도메인 모델)
│   ├── commands/                    # Command (명령)
│   ├── events/                      # Domain Event
│   ├── value-objects/              # Value Objects
│   ├── dtos/                        # Data Transfer Objects
│   ├── types/                       # 타입 정의
│   └── errors/                      # 도메인 에러
└── frontend/                        # (향후 확장)
```

## 구현 사항

### 1. 스키마 및 테이블

#### `channels` 테이블
- YouTube 채널 정보 저장
- `channel_id` (YouTube Channel ID)로 유니크 제약
- 채널 메타데이터 및 통계 정보

#### `videos` 테이블
- YouTube 영상 정보 및 스크립트 저장
- `slug` (YouTube Video ID)로 유니크 제약
- 스크립트는 JSONB로 저장 (최대 ~300KB)

#### `action_transactions` 테이블
- 유료 액션 추적 (스크립트 추출, 스마트 요약 등)
- 중복 실행 방지
- 블록-비디오 연결 추적

### 2. Secure Action Wrappers

#### `withYoutubeBlockSecureAction`
블록 기반 권한 검증:
1. Block 조회 및 권한 검증
2. 블록 타입 검증 (YouTube 블록인지 확인)
3. Workspace 권한 검증

**사용 예시**:
```typescript
export const getYoutubeMetadataAction = withYoutubeBlockSecureAction(
  GetYoutubeMetadataRequestSchema,
  'getYoutubeMetadataAction',
  getYoutubeMetadataInternal
);
```

#### `withActionTransactionAuth`
이중 보안 검증 (유료 액션용):
1. Transaction 조회
2. Transaction-Block 일치 확인
3. Transaction 상태 확인 (중복 실행 방지)
4. Block 권한 및 타입 검증

### 3. Server Actions

#### `getYoutubeMetadataAction`
YouTube 영상 메타데이터 조회:
1. Video 조회 (slug로)
2. 없으면 YouTube API로 메타데이터 가져오기
3. Channel 조회/생성
4. Video 생성 및 반환

#### `getVideoScriptAction`
스크립트 조회:
1. Video 조회 (youtubeId로)
2. 스크립트가 있으면 그대로 반환
3. 없으면 YouTube API로 스크립트 추출
4. 스크립트 업데이트 및 저장

### 4. Service Functions

#### `createVideo`
- SafeDTO → Command 변환
- Aggregate 생성
- Domain Event 발생
- Repository 저장

#### `getVideo`
- Slug로 Video 조회
- Aggregate 재구성

#### `extractTranscript` (YouTube API)
- YouTube API로 스크립트 추출
- 여러 어댑터 지원 (YouTube Caption Extractor, ZenRows 등)

### 5. Aggregate 패턴

#### `VideoAggregate`
- Command를 받아 비즈니스 로직 실행
- Domain Event 발생 (1 Command : 1 Event)
- 불변성 보장

**주요 메서드**:
- `createVideo(command)`: Video 생성 (Factory Method)
- `updateScript(command)`: 스크립트 업데이트
- `toView()`: View DTO로 변환

### 6. Repository 패턴

#### `IVideoRepository`
- Aggregate로 주고받음 (Entity 직접 노출 안 함)
- `findById`, `findBySlug`, `create`, `update` 메서드

#### `DrizzleVideoRepository`
- Drizzle ORM 구현
- Aggregate ↔ DB 변환

### 7. Value Objects

- `VideoId`: UUID 기반 Video ID
- `VideoSlug`: YouTube Video ID (11자리 문자열)
- `ChannelId`: UUID 기반 Channel ID
- `YoutubeChannelId`: YouTube Channel ID

## 주요 패턴

### 1. Service Function 패턴

Service Class가 아닌 Function을 사용:
- 테스트 용이성 (의존성 주입)
- 순수 함수로 비즈니스 로직 표현
- Repository를 파라미터로 주입

```typescript
export async function createVideo(
  safeDto: CreateVideoRequest,
  safeUserId: UserId,
  videoRepository: IVideoRepository
): Promise<Result<VideoAggregate, YoutubeError>>
```

### 2. Aggregate 패턴

비즈니스 로직을 Aggregate에 캡슐화:
- Command를 받아 상태 변경
- Domain Event 발생
- 불변성 보장

### 3. Repository 패턴

Infrastructure 레이어와 분리:
- 인터페이스는 Domain Layer에 정의
- 구현은 Infrastructure Layer (Drizzle)
- Aggregate로 주고받음

### 4. Secure Action 패턴

HOF (Higher-Order Function)로 보안 검증:
- Request 스키마 검증
- 사용자 인증
- 권한 검증
- 로깅 및 에러 처리

## 보안

### RLS (Row Level Security)

모든 테이블에 RLS 정책 적용:
- 모든 직접 접근 차단 (`using: sql\`false\``)
- 서버를 통하지 않은 DB 직접 접근 방지
- 서버에서 권한 검증 후 admin client (RLS 우회)로만 접근

### 권한 검증 흐름

1. **Server Action**: Zod 스키마로 요청 검증
2. **Secure Action Wrapper**: 블록 권한 및 타입 검증
3. **Service Function**: 비즈니스 로직 내 추가 검증
4. **RLS**: DB 레벨 최후의 방어선

## 데이터 재사용 전략

### 같은 영상 여러 블록 사용 시

1. **Video 조회**: Slug로 기존 Video 조회
2. **재사용**: 같은 Video를 여러 블록이 참조
3. **스크립트 공유**: 한 번 추출한 스크립트를 모든 블록이 공유

### 스크립트 추출 최적화

1. **캐싱**: Video에 스크립트가 있으면 재추출 안 함
2. **Lazy Loading**: 필요할 때만 스크립트 추출
3. **비용 절감**: 같은 영상은 한 번만 API 호출

## 확장성

### 새로운 액션 추가

1. `action_transactions` 테이블에 액션 타입 추가
2. `withActionTransactionAuth`로 보안 검증
3. Service Function 구현
4. Server Action 구현

### 다른 미디어 타입 지원

동일한 패턴으로 확장 가능:
- PDF App Space
- Audio App Space
- Link App Space

## 테스트

### Unit Tests
- Aggregate 테스트
- Entity 테스트
- Value Object 테스트
- Service Function 테스트

### Integration Tests
- Repository 테스트
- YouTube API Service 테스트
- Action 테스트

## 참고 문서

- [Backend DDD Conventions](../../../../../docs/patterns/backend/server-side-ddd-conventions.md)
- [Editor Panel Tab System Plan](../../../../../.cursor/plans/editor_panel_tab_system_77668b25.plan.md)
- [Image App Space](../image-app-space/) (참고 패턴)
