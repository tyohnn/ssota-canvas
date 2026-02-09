# Canvas Management - Frontend Documentation

Canvas Management 도메인의 프론트엔드 아키텍처 및 구현 문서 모음입니다.

## 📚 문서 목록

### Architecture
- **[UNDO_REDO_ARCHITECTURE.md](./UNDO_REDO_ARCHITECTURE.md)** - Undo/Redo 스냅샷 아키텍처
  - 전체 폴더 구조
  - Snapshot 도메인 설계
  - 삭제 동작 재설계 (핵심 해결 과제)
  - 개선 방향 제안 (Decorator, Middleware, Command 패턴)

## 🏗️ 관련 패턴 문서

- [React Flow with DDD Architecture](../../patterns/frontend/react-flow-with-ddd-architecture.md)
- [Object-based Dependency Injection](../../patterns/frontend/object-based-dependency-injection.md)
- [Component Development Guidelines](../../patterns/frontend/component-development-guidelines.md)

## 📂 소스 코드 위치

```
apps/web/src/domains/canvas-management/frontend/
├── snapshot/              # Undo/Redo 도메인
├── components/            # UI 컴포넌트
├── hooks/                 # 도메인 훅들
├── contexts/              # React Context
└── utils/                 # 유틸리티
```

## 🔗 관련 도메인

- [Block Management](../block-management/)
- [React Flow Mermaid](../react-flow-mermaid/)
