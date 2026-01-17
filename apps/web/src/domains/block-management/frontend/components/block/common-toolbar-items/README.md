# Common Toolbar Items

여러 블럭 타입에서 공통으로 사용하는 툴바 아이템들을 모아놓은 폴더입니다.

## 구조

```
common-toolbar-items/
├── index.ts                         # Re-export
├── color-toolbar-item.tsx           # 색상 선택기
├── font-size-toolbar-item.tsx       # 폰트 크기 선택기
├── text-align-toolbar-item.tsx      # 텍스트 정렬
├── rich-style-toolbar-item.tsx      # 리치 스타일 (볼드, 이탤릭 등)
├── border-style-toolbar-item.tsx    # 테두리 스타일
└── url-toolbar-item.tsx             # URL 입력
```

## 역할

### ColorToolbarItem
- **사용 블럭**: Text, Markdown, Shape
- **기능**: 색상 팔레트에서 색상 선택
- **Props**: `currentColor`, `onColorChange`

### FontSizeToolbarItem
- **사용 블럭**: Text, Markdown
- **기능**: 폰트 크기 선택 (xs, sm, base, lg, xl, 2xl, 3xl)
- **Props**: `currentFontSize`, `onFontSizeChange`

### TextAlignToolbarItem
- **사용 블럭**: Text, Markdown
- **기능**: 텍스트 정렬 (left, center, right, justify)
- **Props**: `currentTextAlign`, `onTextAlignChange`

### RichStyleToolbarItem
- **사용 블럭**: Text, Markdown
- **기능**: 텍스트 스타일 (bold, italic, underline)
- **Props**: `currentStyles`, `onStyleToggle`

### BorderStyleToolbarItem
- **사용 블럭**: Shape, Image
- **기능**: 테두리 스타일 (solid, dashed, dotted, 너비, 색상)
- **Props**: `currentBorder`, `onBorderChange`

### UrlToolbarItem
- **사용 블럭**: Link, YouTube, PDF, Audio
- **기능**: URL 입력 및 검증
- **Props**: `currentUrl`, `onUrlChange`, `placeholder`

## Component Development Guidelines 준수

✅ **재사용성**: 여러 블럭에서 공통으로 사용
✅ **NoCode 호환**: 함수 Props 최소화
✅ **Props 설계**: 값과 onChange 콜백만 노출
✅ **타입 안전성**: TypeScript로 타입 정의
✅ **일관된 인터페이스**: 모든 항목이 유사한 Props 패턴

## 새 공통 항목 추가

새로운 공통 툴바 항목을 추가하려면:

1. **컴포넌트 생성**
   ```tsx
   // new-toolbar-item.tsx
   export function NewToolbarItem({
     currentValue,
     onValueChange,
     disabled,
   }) {
     return (
       <Tooltip>
         <TooltipTrigger asChild>
           <Button onClick={() => onValueChange(newValue)}>
             {/* UI */}
           </Button>
         </TooltipTrigger>
       </Tooltip>
     );
   }
   ```

2. **index.ts에 추가**
   ```tsx
   export { NewToolbarItem } from './new-toolbar-item';
   ```

3. **BlockToolbarMapper에서 사용**
   ```tsx
   // block-original-toolbar/block-toolbar-mapper.tsx
   import { NewToolbarItem } from '../common-toolbar-items';
   
   case 'text':
     return <NewToolbarItem ... />;
   ```

