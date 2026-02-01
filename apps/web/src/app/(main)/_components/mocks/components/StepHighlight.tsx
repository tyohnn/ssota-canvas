"use client";

import { cn } from "@workspace/ui/lib/utils";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, MousePointer2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export type CursorAction = "click" | "scroll";

interface StepHighlightProps {
  children: ReactNode;
  isActive: boolean;
  pointer?: "top" | "bottom" | "left" | "right";
  label?: string;
  className?: string;
  /** 커서 액션 - 설정 시 해당 위치에 가짜 커서 표시 */
  cursorAction?: CursorAction;
  /** 커서 위치 오프셋 (기본: 컴포넌트 중앙) */
  cursorOffset?: { x?: number; y?: number };
  /** children 래퍼에 높이 유지 (iframe 등) */
  preserveChildSize?: boolean;
  /** 스크롤 시 커서가 fixed로 viewport에 고정 (스크롤해도 사라지지 않음) */
  cursorUseFixed?: boolean;
  /** glow 효과 표시 여부 (overflow로 잘릴 때 false) */
  showGlow?: boolean;
}

const POINTER_ICONS = {
  top: ArrowDown,
  bottom: ArrowUp,
  left: ArrowRight,
  right: ArrowLeft,
};

const POINTER_POSITIONS = {
  top: "top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2",
  bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-2",
  left: "left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-2",
  right: "right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2",
};

/** 커서 위치 계산 (포인터 방향 기반) */
const CURSOR_POSITIONS = {
  top: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  bottom: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  left: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  right: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

export function StepHighlight({
  children,
  isActive,
  pointer,
  label,
  className,
  cursorAction,
  cursorOffset,
  preserveChildSize = false,
  cursorUseFixed = false,
  showGlow = true,
}: StepHighlightProps) {
  // 커서 애니메이션 상태
  const [cursorState, setCursorState] = useState<"hidden" | "moving" | "arrived" | "clicked">("hidden");

  useEffect(() => {
    if (!isActive || !cursorAction) {
      setCursorState("hidden");
      return;
    }

    // 순차적 애니메이션: hidden -> moving -> arrived -> clicked
    setCursorState("moving");

    const CURSOR_MOVE_MS = 1000; // 이동 시간 (천천히)
    const CURSOR_ARRIVED_BEFORE_CLICK_MS = 900; // 도착 후 클릭까지 대기
    const arriveTimer = setTimeout(() => {
      setCursorState("arrived");
    }, CURSOR_MOVE_MS);

    const clickTimer = setTimeout(() => {
      if (cursorAction === "click") {
        setCursorState("clicked");
      }
    }, CURSOR_MOVE_MS + CURSOR_ARRIVED_BEFORE_CLICK_MS);

    return () => {
      clearTimeout(arriveTimer);
      clearTimeout(clickTimer);
    };
  }, [isActive, cursorAction]);

  if (!isActive) {
    return <>{children}</>;
  }

  const PointerIcon = pointer ? POINTER_ICONS[pointer] : null;
  const pointerPosition = pointer ? POINTER_POSITIONS[pointer] : "";

  return (
    <div className={cn("relative", preserveChildSize && "h-full w-full", className)}>
      {/* Glow 효과만 (배경색 없음) - showGlow가 false면 생략 (overflow 클리핑 방지) */}
      {showGlow && (
        <div
          className={cn(
            "absolute inset-0 rounded-lg",
            "pointer-events-none",
            "transition-opacity duration-500",
            isActive ? "opacity-100" : "opacity-0"
          )}
          style={
            isActive
              ? {
                animation: "highlight-pulse 2.5s ease-in-out infinite",
              }
              : undefined
          }
        />
      )}

      {/* 포인터/화살표 */}
      {PointerIcon && (
        <div
          className={cn(
            "absolute flex items-center justify-center",
            "text-blue-500",
            pointerPosition,
            "z-50",
            "pointer-events-none"
          )}
          style={{
            animation: pointer === "top" || pointer === "bottom"
              ? "bounce-slow-y 2s ease-in-out infinite"
              : "bounce-slow-x 2s ease-in-out infinite",
          }}
        >
          <PointerIcon className="h-6 w-6 drop-shadow-lg" />
          {label && (
            <span className="ml-2 px-2 py-1 bg-blue-500/90 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap">
              {label}
            </span>
          )}
        </div>
      )}

      {/* 라벨만 있는 경우 (포인터 없이) */}
      {!pointer && label && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 z-50 pointer-events-none">
          <span className="px-2 py-1 bg-blue-500/90 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap">
            {label}
          </span>
        </div>
      )}

      {/* 실제 컨텐츠 */}
      <div className={cn("relative z-10", preserveChildSize && "h-full w-full")}>{children}</div>

      {/* 가짜 마우스 커서 - scroll에서는 휠만 표시, click에서는 커서+리플 */}
      {cursorAction && cursorState !== "hidden" && (
        <div
          className={cn(
            "pointer-events-none z-100 transition-all duration-1000 ease-out",
            cursorUseFixed ? "fixed" : "absolute"
          )}
          style={
            cursorUseFixed
              ? {
                right: "22%",
                top: "50%",
                transform: "translateY(-50%)",
                opacity: cursorState === "moving" ? 0.6 : 1,
              }
              : {
                left: cursorState === "moving" ? "-20px" : "50%",
                top: cursorState === "moving" ? "calc(100% + 20px)" : "50%",
                transform:
                  cursorState === "moving"
                    ? "translate(0, 0)"
                    : `translate(calc(-50% + ${cursorOffset?.x ?? 0}px), calc(-50% + ${cursorOffset?.y ?? 0}px))`,
                opacity: cursorState === "moving" ? 0.6 : 1,
              }
          }
        >
          <div className="relative flex items-center">
            {/* 커서 아이콘 - scroll에서는 숨김 */}
            {cursorAction !== "scroll" && (
              <>
                <MousePointer2
                  className={cn(
                    "h-6 w-6 drop-shadow-lg",
                    "fill-white stroke-gray-800 stroke-[1.5]",
                    "transition-transform duration-150",
                    cursorState === "clicked" && "scale-90"
                  )}
                />
                {/* 클릭 리플 효과 - 한 번만 */}
                {cursorState === "clicked" && (
                  <div
                    className="absolute top-0 left-0 w-4 h-4 rounded-full bg-blue-500/50"
                    style={{
                      animation: "cursor-ripple-once 0.5s ease-out forwards",
                      transform: "translate(2px, 2px)",
                    }}
                  />
                )}
              </>
            )}
            {/* 스크롤 휠만 - scroll일 때만 */}
            {cursorAction === "scroll" && cursorState === "arrived" && (
              <div className="-ml-6">
                <ScrollWheelIndicator />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 커스텀 애니메이션 스타일 */}
      {isActive && (
        <style>
          {`
            @keyframes highlight-pulse {
              0%, 100% {
                box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.3), 0 0 16px 3px rgba(96, 165, 250, 0.15);
              }
              50% {
                box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.2), 0 0 24px 6px rgba(96, 165, 250, 0.25);
              }
            }
            @keyframes bounce-slow-y {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-8px);
              }
            }
            @keyframes bounce-slow-x {
              0%, 100% {
                transform: translateX(0);
              }
              50% {
                transform: translateX(-8px);
              }
            }
            @keyframes cursor-ripple-once {
              0% { 
                transform: translate(2px, 2px) scale(0.5);
                opacity: 0.8;
              }
              100% { 
                transform: translate(2px, 2px) scale(3);
                opacity: 0;
              }
            }
            @keyframes scroll-wheel {
              0%, 100% { transform: translateX(-50%) translateY(0); }
              50% { transform: translateX(-50%) translateY(4px); }
            }
            @keyframes scroll-arrow {
              0%, 100% { opacity: 0.5; transform: translateY(0); }
              50% { opacity: 1; transform: translateY(3px); }
            }
          `}
        </style>
      )}
    </div>
  );
}

/** 스크롤 휠 인디케이터 */
function ScrollWheelIndicator() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-5 h-8 border-2 border-gray-600 rounded-full bg-white/90 shadow-md">
        <div
          className="absolute left-1/2 top-2 w-1 h-2 bg-gray-500 rounded-full -translate-x-1/2"
          style={{ animation: "scroll-wheel 1s ease-in-out infinite" }}
        />
      </div>
      <div className="flex flex-col items-center mt-1">
        <div
          className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-500"
          style={{ animation: "scroll-arrow 1s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}

