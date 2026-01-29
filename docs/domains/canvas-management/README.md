# Canvas Management Domain

Canvas Management 도메인 문서 모음입니다.

## 📂 구조

```
canvas-management/
└── frontend/              # 프론트엔드 아키텍처 문서
    ├── README.md
    └── UNDO_REDO_ARCHITECTURE.md
```

## 🎯 도메인 개요

Canvas Management는 React Flow 기반의 무한 캔버스 시스템을 관리하는 도메인입니다.

### 주요 기능
- 블록 생성/이동/삭제/복제
- 엣지 연결/삭제/재연결
- 그룹 관리 (collision detection)
- 뷰포트 제어 (pan, zoom)
- **Undo/Redo (스냅샷 기반)**
- 멀티 선택 및 정렬/배치
- 클립보드 (복사/붙여넣기)

### 관련 도메인
- **Block Management**: 블록 데이터 및 비즈니스 로직
- **AI Management**: AI Agent Runner
- **User Management**: 권한 및 읽기 전용 모드

## 📚 문서

- [Frontend Architecture](./frontend/) - 프론트엔드 아키텍처 문서
  - [Undo/Redo Architecture](./frontend/UNDO_REDO_ARCHITECTURE.md)

## 🔗 관련 패턴

- [React Flow with DDD Architecture](../../patterns/frontend/react-flow-with-ddd-architecture.md)
- [Object-based Dependency Injection](../../patterns/frontend/object-based-dependency-injection.md)
