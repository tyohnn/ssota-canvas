/**
 * Data attribute for the scroll container that participates in canvas scroll chaining.
 * When the user scrolls to the edge of such a container, the wheel event is allowed
 * to propagate so the canvas can pan (e.g. in PDF block, Markdown/TipTap block).
 *
 * Use this attribute on the element that has overflow-auto/scroll and wraps block content.
 */
export const DATA_CANVAS_SCROLL_CHAIN = 'data-canvas-scroll-chain';

/** Selector for finding the designated scroll-chain container from any descendant. */
export const CANVAS_SCROLL_CHAIN_SELECTOR = `[${DATA_CANVAS_SCROLL_CHAIN}]`;
