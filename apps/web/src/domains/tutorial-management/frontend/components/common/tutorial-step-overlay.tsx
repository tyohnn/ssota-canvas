'use client';

import type { RefObject } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@workspace/ui/components/ui/box';
import { Button } from '@workspace/ui/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { useTutorialDialogContext } from '../tutorial-dialog/core/context';

const CARD_GAP = 12;
const CARD_ESTIMATED_HEIGHT = 180;

/** Steps where the Add Block dialog is open; overlay must render in portal with higher z-index so it appears above the dialog. */
const STEPS_WITH_ADD_DIALOG = ['add-block', 'select-block-type'];
const OVERLAY_ABOVE_DIALOG_Z = 60;

interface TargetRect {
  left: number;
  top: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

function getTargetRect(selector: string): TargetRect | null {
  const el = document.querySelector(`[data-tutorial="${selector}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

function getContainerRect(container: HTMLElement): TargetRect {
  const rect = container.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

/** Highlight box: absolute (relative to container) or fixed. Same visual as StepHighlight. */
function HighlightBox({
  rect,
  containerRect,
}: {
  rect: TargetRect;
  containerRect?: TargetRect | null;
}) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, []);

  const useAbsolute = containerRect != null;
  const style = useAbsolute
    ? {
        left: rect.left - containerRect!.left - 4,
        top: rect.top - containerRect!.top - 4,
        width: rect.width + 8,
        height: rect.height + 8,
      }
    : {
        left: rect.left - 4,
        top: rect.top - 4,
        width: rect.width + 8,
        height: rect.height + 8,
      };

  return (
    <>
      <Box
        className={cn(
          'rounded-lg pointer-events-none z-100',
          useAbsolute ? 'absolute' : 'fixed',
          animate ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          ...style,
          animation: animate
            ? 'step-highlight-glow 2.5s ease-in-out infinite'
            : undefined,
        }}
      />
      {animate && (
        <style>
          {`
            @keyframes step-highlight-glow {
              0%, 100% {
                box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.3), 0 0 16px 3px rgba(96, 165, 250, 0.15);
              }
              50% {
                box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.2), 0 0 24px 6px rgba(96, 165, 250, 0.25);
              }
            }
          `}
        </style>
      )}
    </>
  );
}

export interface TutorialStepOverlayProps {
  /** When set, overlay is rendered in-place with absolute positioning inside this container (no portal). */
  containerRef?: RefObject<HTMLElement | null>;
}

/**
 * Tutorial Step Overlay
 *
 * Shows current step instruction and highlight anchored to the target element.
 * When containerRef is provided: no portal, absolute positioning inside the container (tutorial canvas).
 * Otherwise: portaled to document.body with fixed positioning.
 */
export function TutorialStepOverlay({ containerRef }: TutorialStepOverlayProps = {}) {
  const {
    isOpen,
    currentStep,
    currentStepIndex,
    currentTutorial,
    completeCurrentStep,
  } = useTutorialDialogContext();

  const [rect, setRect] = useState<TargetRect | null>(null);
  const [containerRect, setContainerRect] = useState<TargetRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const targetSelector = currentStep?.targetSelector ?? '';

  const measure = () => {
    if (containerRef?.current) {
      setContainerRect(getContainerRect(containerRef.current));
    } else {
      setContainerRect(null);
    }
    if (!targetSelector) {
      setRect(null);
      return;
    }
    const r = getTargetRect(targetSelector);
    setRect(r);
  };

  useLayoutEffect(() => {
    measure();
    const afterPaint = setTimeout(measure, 0);
    return () => clearTimeout(afterPaint);
  }, [targetSelector, currentStep?.id]);

  useEffect(() => {
    const onUpdate = () => measure();
    window.addEventListener('resize', onUpdate);
    window.addEventListener('scroll', onUpdate, true);
    return () => {
      window.removeEventListener('resize', onUpdate);
      window.removeEventListener('scroll', onUpdate, true);
    };
  }, [targetSelector]);

  if (!isOpen) return null;
  if (!currentStep || !currentTutorial) return null;

  const totalSteps = currentTutorial.steps.length;
  const stepNumber = currentStepIndex + 1;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isObserveStep = currentStep.action === 'observe';
  const isInputStep = currentStep.action === 'input';
  const showNextButton = isObserveStep || isInputStep;

  const cardContent = (
    <Box
      ref={cardRef}
      className="bg-card border-2 border-primary rounded-lg shadow-xl p-4 max-w-md pointer-events-auto z-100"
    >
      <Box className="flex items-start gap-3">
        <Box className="shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
          {stepNumber}
        </Box>
        <Box className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{currentStep.title}</h3>
          <p className="text-xs text-muted-foreground">
            {currentStep.description}
          </p>
        </Box>
        {!showNextButton && (
          <ArrowRight className="shrink-0 w-4 h-4 text-primary animate-pulse" />
        )}
      </Box>

      {showNextButton && (
        <Button
          className="mt-3 w-full"
          size="sm"
          onClick={() => completeCurrentStep({ fromNextButton: true })}
        >
          {isLastStep ? 'Finish' : 'Next'}
        </Button>
      )}

      <Box className="mt-2 flex gap-1">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <Box
            key={idx}
            className={cn(
              'h-1 flex-1 rounded-full',
              idx <= currentStepIndex ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </Box>
    </Box>
  );

  const placeCardAbove =
    rect != null &&
    containerRect != null &&
    rect.bottom - containerRect.top + CARD_GAP + CARD_ESTIMATED_HEIGHT >
      containerRect.height - 16 &&
    rect.top - containerRect.top > CARD_ESTIMATED_HEIGHT + CARD_GAP;
  const placeCardAboveFixed =
    rect != null &&
    rect.bottom + CARD_GAP + CARD_ESTIMATED_HEIGHT > window.innerHeight - 16 &&
    rect.top > CARD_ESTIMATED_HEIGHT + CARD_GAP;

  /** No target (undefined or empty) = default mode: no highlight, card at bottom-center (absolute, no portal). */
  const useContentBottomCard = !targetSelector;

  /** When true, overlay is portaled above Add Block dialog; use fixed positioning for highlight/card. */
  const usePortalAboveDialog =
    currentStep != null && STEPS_WITH_ADD_DIALOG.includes(currentStep.id);
  const useAbsoluteInCanvas =
    containerRect != null && !usePortalAboveDialog;

  /** Card keyed by step id so it unmounts immediately on step change (no slow transition). */
  const cardKey = currentStep?.id ?? '';

  const fallbackPosition = (
    <Box
      key={cardKey}
      className={
        useAbsoluteInCanvas
          ? 'absolute bottom-4 left-1/2 -translate-x-1/2 z-100 pointer-events-none'
          : 'fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none'
      }
    >
      {cardContent}
    </Box>
  );

  const contentBottomPosition = (
    <Box
      key={cardKey}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-100 pointer-events-none"
    >
      {cardContent}
    </Box>
  );

  const targetAnchoredPosition = rect
    ? (() => {
        const useAbs = useAbsoluteInCanvas;
        const base = 'z-100 pointer-events-none';
        if (useAbs) {
          const left = rect.left - containerRect!.left + rect.width / 2;
          const top = placeCardAbove
            ? undefined
            : rect.bottom - containerRect!.top + CARD_GAP;
          const bottom = placeCardAbove
            ? containerRect!.bottom - rect.top + CARD_GAP
            : undefined;
          return (
            <Box
              key={cardKey}
              className={`absolute ${base}`}
              style={{
                left,
                top,
                bottom,
                transform: 'translate(-50%, 0)',
              }}
            >
              {cardContent}
            </Box>
          );
        }
        return (
          <Box
            key={cardKey}
            className={`fixed ${base}`}
            style={{
              left: rect.left + rect.width / 2,
              top: placeCardAboveFixed ? undefined : rect.bottom + CARD_GAP,
              bottom: placeCardAboveFixed
                ? window.innerHeight - rect.top + CARD_GAP
                : undefined,
              transform: 'translate(-50%, 0)',
            }}
          >
            {cardContent}
          </Box>
        );
      })()
    : null;

  const showHighlight = rect != null;

  const content = (
    <>
      {showHighlight && (
        <HighlightBox
          rect={rect!}
          containerRect={usePortalAboveDialog ? null : containerRect}
        />
      )}
      {useContentBottomCard
        ? contentBottomPosition
        : rect != null
          ? targetAnchoredPosition
          : fallbackPosition}
    </>
  );

  if (typeof document === 'undefined') return content;
  if (usePortalAboveDialog) {
    return createPortal(
      <Box
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: OVERLAY_ABOVE_DIALOG_Z }}
      >
        {content}
      </Box>,
      document.body
    );
  }
  if (containerRef) {
    return (
      <Box
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 100 }}
      >
        {content}
      </Box>
    );
  }
  if (useContentBottomCard) return content;
  return createPortal(content, document.body);
}
