# Design Theme 블록 (Design Theme Block)

## 1. 블록 개요

### 블록 타입
- **Type**: `design_theme` (신규)
- **Enum**: 추가 필요
- **데이터베이스**: `block_type_enum` 확장 필요

### 설명
디자인 테마(색상 팔레트, 타이포그래피, 스페이싱 등)를 관리하는 블록입니다. 디자인 토큰을 시각화하고 내보낼 수 있습니다.

### 사용 사례
- 디자인 시스템 문서화
- 색상 팔레트 관리
- 타이포그래피 가이드
- CSS 변수 생성

## 2. UI 정의

### 기본 UI
- 디자인 토큰 표시
  - 색상 팔레트 (스와치)
  - 타이포그래피 (폰트, 크기)
  - 스페이싱 (간격 값)
  - 그림자
  - Border Radius
- 토큰 값 복사 버튼

### 기본 크기
```typescript
{
  width: 400,
  height: 300
}
```

### 블록 스페이스/에디터
**있음** - 테마 에디터
- 색상 추가/편집
- 타이포그래피 설정
- 스페이싱 설정
- 테마 프리셋

## 3. 입력 방식

### 추가 방식
1. 블록 추가 메뉴에서 "Design Theme" 선택
2. 테마 정의 (색상, 폰트 등)
3. 블록 생성

### 붙여넣기 방식
- **Tailwind Config**: `tailwind.config.js` 붙여넣기 → Design Theme 블록 생성
- **CSS 변수**: `:root { --color-primary: ... }` 붙여넣기 → 블록 생성

## 4. 속성 정의 (Properties)

```typescript
export interface DesignThemeBlockProperties {
  name: string;
  
  // 색상
  colors?: Record<string, string>;
  
  // 타이포그래피
  fontFamilies?: Record<string, string>;
  fontSizes?: Record<string, string>;
  fontWeights?: Record<string, number>;
  lineHeights?: Record<string, string>;
  
  // 스페이싱
  spacing?: Record<string, string>;
  
  // 그림자
  shadows?: Record<string, string>;
  
  // Border Radius
  borderRadius?: Record<string, string>;
  
  // 표시 옵션
  showColors?: boolean;
  showTypography?: boolean;
  showSpacing?: boolean;
}
```

## 5. 툴바 아이템

- ExportThemeToolbarItem: 테마 내보내기 (CSS, Tailwind, JSON)

## 6. 블록 툴

**현재 없음**

향후:
- Figma 변수 임포트
- Tailwind Config 생성
- CSS 변수 생성

## 7. 구현 참조

**향후 구현**

## 8. 특이사항

### 테마 내보내기
- CSS 변수로 내보내기
- Tailwind Config로 내보내기
- JSON 토큰으로 내보내기

## 9. 향후 계획

- [ ] Figma 플러그인 연동
- [ ] 다크 모드 지원
- [ ] 테마 변형 관리



