/**
 * Resize Icon Component
 *
 * 우측 하단 모서리에 곡선을 따라 배치되는 세련된 리사이즈 아이콘
 */

export function ResizeIcon() {
  return (
    <div
      className="absolute -right-1 -bottom-1 w-8 h-8 cursor-nwse-resize group"
      style={{
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
      }}
    >
      {/* 배경 원형 */}
      <div className="absolute right-0 bottom-0 w-7 h-7 bg-white rounded-tl-full border-2 border-blue-500 group-hover:bg-blue-50 group-hover:border-blue-600 transition-all">
        {/* Grip 패턴 (점선) */}
        <svg
          className="absolute right-1.5 bottom-1.5 w-3 h-3"
          viewBox="0 0 12 12"
          fill="none"
        >
          {/* 대각선 그립 점들 */}
          <circle
            cx="9"
            cy="9"
            r="1"
            fill="#3b82f6"
            className="group-hover:fill-blue-600"
          />
          <circle
            cx="6"
            cy="9"
            r="1"
            fill="#3b82f6"
            className="group-hover:fill-blue-600"
          />
          <circle
            cx="9"
            cy="6"
            r="1"
            fill="#3b82f6"
            className="group-hover:fill-blue-600"
          />
          <circle
            cx="3"
            cy="9"
            r="1"
            fill="#3b82f6"
            className="group-hover:fill-blue-600"
          />
          <circle
            cx="6"
            cy="6"
            r="1"
            fill="#3b82f6"
            className="group-hover:fill-blue-600"
          />
          <circle
            cx="9"
            cy="3"
            r="1"
            fill="#3b82f6"
            className="group-hover:fill-blue-600"
          />
        </svg>
      </div>
    </div>
  );
}
