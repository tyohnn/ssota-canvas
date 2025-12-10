/**
 * ImageCaption Component
 *
 * Caption 인라인 편집 가능
 */

import { cn } from '@workspace/ui/lib/utils';

export interface ImageCaptionProps {
  visible: boolean;
  isEditing: boolean;
  value: string;
  caption: string | undefined;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick: () => void;
}

export function ImageCaption({
  visible,
  isEditing,
  value,
  caption,
  onChange,
  onBlur,
  onKeyDown,
  onClick,
}: ImageCaptionProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="px-3 py-2 bg-background border-t border-border min-h-[36px] flex items-center justify-center"
      onClick={onClick}
    >
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder="캡션을 입력하세요..."
          className={cn(
            'w-full text-xs text-center',
            'bg-transparent border-none outline-none',
            'text-muted-foreground',
            'placeholder:text-muted-foreground/60 placeholder:italic',
            'transition-colors'
          )}
          autoFocus
        />
      ) : (
        <p className="text-xs text-center cursor-text text-muted-foreground italic transition-colors">
          {caption || '캡션을 추가하려면 클릭하세요'}
        </p>
      )}
    </div>
  );
}

