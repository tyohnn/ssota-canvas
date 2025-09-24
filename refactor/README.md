# Refactor: DDD-based Architecture Testing

Event Storming 결과를 바탕으로 DDD 아키텍처를 테스트하는 리팩토링 환경입니다.

## 📁 폴더 구조

```
refactor/
├── domains/                    # DDD 도메인 레이어 (컨텍스트별)
│   ├── visual-canvas/
│   │   ├── entities/          # Entity, Value Object
│   │   ├── aggregates/        # Aggregate Root
│   │   ├── services/          # Domain Service
│   │   └── repositories/      # Repository 인터페이스
│   └── component-system/
│       ├── entities/
│       ├── aggregates/
│       ├── services/
│       └── repositories/
├── integration/                # 컨텍스트 간 통합 레이어
│   └── visual-component/
│       ├── orchestrators/     # Cross-Context Service
│       └── adapters/          # Anti-Corruption Layer
├── infra/                      # 인프라 구현 (DB 등)
│   ├── db/
│   │   ├── schema.ts         # Drizzle 스키마
│   │   └── client.ts         # DB 연결 (교체 지점)
│   └── repositories/         # Repository 구현 (Drizzle 기반)
└── server-actions/            # 서버 액션 (도메인/인테그레이션 호출)
```

## 🎯 목표

1. **DDD 원칙 검증**: Entity, Aggregate, Service, Repository 분리
2. **DB 독립성 테스트**: Repository 인터페이스와 구현 분리
3. **컨텍스트 통합 검증**: Integration Layer 효과성
4. **Next.js 적합성**: 서버 액션과의 연동성

## 🚀 진행 순서

1. 도메인 모델 구현 (Entity, Value Object, Aggregate)
2. Repository 인터페이스 및 구현
3. Integration Layer 구현
4. 서버 액션 연동
5. 테스트 및 검증
