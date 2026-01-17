import { type RefObject, useEffect } from 'react';

/**
 * 트랙패드 핀치 줌 방지 훅
 *
 * 다중 계층 방어 전략:
 * 1. 터치 이벤트로 오는 핀치 줌 차단 (모바일/터치스크린)
 * 2. Wheel 이벤트로 변환된 핀치 줌 차단 (트랙패드 → Ctrl+Wheel)
 * 3. Safari의 Gesture 이벤트 차단
 *
 * @param elementRef - 핀치 줌을 방지할 요소의 ref
 *
 * @example
 * ```tsx
 * const toolbarRef = useRef<HTMLDivElement>(null);
 * usePreventPinchZoom(toolbarRef);
 *
 * return <div ref={toolbarRef}>...</div>;
 * ```
 */
export function usePreventPinchZoom(elementRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // 1. 터치 이벤트로 오는 핀치 줌 차단
    const preventTouchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 2. Wheel 이벤트로 변환된 핀치 줌 차단 (Ctrl+Wheel)
    // 트랙패드 핀치 줌은 브라우저에서 wheel 이벤트의 ctrlKey: true로 변환됨
    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 3. Safari의 Gesture 이벤트 차단
    const preventGestureZoom = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // passive: false로 preventDefault 활성화
    // 기본적으로 브라우저는 터치/휠 이벤트를 passive: true로 처리하여
    // preventDefault()가 무시되므로, 명시적으로 passive: false 설정 필요
    element.addEventListener('touchstart', preventTouchZoom, {
      passive: false,
    });
    element.addEventListener('touchmove', preventTouchZoom, { passive: false });
    element.addEventListener('wheel', preventWheelZoom, { passive: false });
    element.addEventListener('gesturestart', preventGestureZoom, {
      passive: false,
    });
    element.addEventListener('gesturechange', preventGestureZoom, {
      passive: false,
    });
    element.addEventListener('gestureend', preventGestureZoom, {
      passive: false,
    });

    return () => {
      element.removeEventListener('touchstart', preventTouchZoom);
      element.removeEventListener('touchmove', preventTouchZoom);
      element.removeEventListener('wheel', preventWheelZoom);
      element.removeEventListener('gesturestart', preventGestureZoom);
      element.removeEventListener('gesturechange', preventGestureZoom);
      element.removeEventListener('gestureend', preventGestureZoom);
    };
  }, [elementRef]);
}
