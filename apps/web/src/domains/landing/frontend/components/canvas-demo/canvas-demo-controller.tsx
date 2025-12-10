/**
 * Canvas Demo Controller
 *
 * 스크롤 진행률에 따라 Canvas 상태를 제어하는 컨트롤러
 * - 애니메이션 효과 적용
 * - 섹션별 데이터 관리
 */

'use client';

import { Rocket, ClipboardList, Palette, Code, Zap } from 'lucide-react';
import { useScrollSections } from './hooks/use-scroll-sections';
import { LandingCanvasWrapper } from './landing-canvas-wrapper';
import {
  useSection1Data,
  useSection1AnimationSequence,
  CANVAS_ANIMATION_CONFIG,
} from '../sections/s1-workflow/data/section1-data-refactored';
import { useAnimatedCanvasData } from '../sections/s1-workflow/hooks/use-animated-canvas-data';
import { useAnimatedViewport } from '../sections/s1-workflow/hooks/use-animated-viewport';

export function CanvasDemoController() {
  const { section, subPhase } = useScrollSections();

  // Section 1: Get animation sequence
  const animationSequence = useSection1AnimationSequence(subPhase);
  const section1Data = useSection1Data(subPhase);

  // Phase별 startDelay 가져오기
  const animationStartDelay =
    subPhase === 0
      ? CANVAS_ANIMATION_CONFIG.INTRO_START_DELAY
      : CANVAS_ANIMATION_CONFIG.PHASE_START_DELAY;

  // Apply animation effect
  const { nodes, edges } = useAnimatedCanvasData({
    blocks: animationSequence.blocks,
    edges: animationSequence.edges,
    config: {
      blockDelay: CANVAS_ANIMATION_CONFIG.BLOCK_DELAY,
      edgeDelay: CANVAS_ANIMATION_CONFIG.EDGE_DELAY,
      startDelay: animationStartDelay,
    },
    enabled: animationSequence.enableAnimation,
  });

  // Apply viewport animation with same timing as blocks
  const animatedViewport = useAnimatedViewport({
    viewport: section1Data.viewport,
    startDelay: animationStartDelay,
    enabled: animationSequence.enableAnimation,
  });

  // Currently only Section 1 is implemented
  const currentData =
    section === 0
      ? {
          ...section1Data,
          nodes,
          edges,
          viewport: animatedViewport,
        }
      : section1Data;

  // Showcase header data (phase에 따라 변경)
  const getHeaderData = () => {
    if (subPhase === 0) {
      // Intro phase
      return {
        workspaceName: 'SSOTA Labs',
        workspaceIcon: Rocket,
        pageName: 'Hello, SSOTA',
        pageIcon: Zap,
      };
    }

    // Plan, Design, Develop, Deploy phases
    const actualPhaseIndex = Math.max(0, subPhase - 1);
    const phaseNames = ['Plan', 'Design', 'Develop', 'Deploy'];
    const phaseIcons = [ClipboardList, Palette, Code, Zap];

    return {
      workspaceName: 'For Software Development',
      workspaceIcon: Rocket,
      pageName: phaseNames[actualPhaseIndex] ?? 'Untitled',
      pageIcon: phaseIcons[actualPhaseIndex] ?? ClipboardList,
    };
  };

  const headerData = getHeaderData();

  return (
    <LandingCanvasWrapper
      nodes={currentData.nodes}
      edges={currentData.edges}
      viewport={currentData.viewport}
      selectedNodeId={currentData.selectedNodeId}
      canvasMode={currentData.canvasMode}
      subPhase={subPhase}
      workspaceName={headerData.workspaceName}
      workspaceIcon={headerData.workspaceIcon}
      pageName={headerData.pageName}
      pageIcon={headerData.pageIcon}
      viewportAnimationDuration={CANVAS_ANIMATION_CONFIG.VIEWPORT_DURATION}
    />
  );
}
