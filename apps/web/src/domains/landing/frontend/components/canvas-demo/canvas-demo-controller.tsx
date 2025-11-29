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
} from '../sections/s1-workflow/data/section1-data-refactored';
import { useAnimatedCanvasData } from '../sections/s1-workflow/hooks/use-animated-canvas-data';
import { useAnimatedViewport } from '../sections/s1-workflow/hooks/use-animated-viewport';

const VIEWPORT_ANIMATION_DURATION = 600; // viewport 애니메이션 duration (ms)

export function CanvasDemoController() {
  const { section, subPhase } = useScrollSections();

  // Section 1: Get animation sequence
  const animationSequence = useSection1AnimationSequence(subPhase);
  const section1Data = useSection1Data(subPhase);

  // Phase별 startDelay 설정
  const getAnimationStartDelay = () => {
    if (subPhase === 0) {
      // Intro: 헤더 + 서브텍스트 + Workspace Header 완료 후
      // 0.2s (헤더 delay) + 0.6s (헤더 duration) = 0.8s
      // 0.6s (서브텍스트 delay) + 0.6s (서브텍스트 duration) = 1.2s
      // 0.6s (workspace header delay) + 0.4s (duration) = 1.0s
      return 1000; // 가장 긴 애니메이션 기준 (서브텍스트)
    }
    // Plan/Design/Develop/Deploy: PhaseIndicators 완료 후
    // 0.9s (delay) + 0.4s (duration) = 1.3s
    return 1300;
  };

  const animationStartDelay = getAnimationStartDelay();

  // Apply animation effect
  const { nodes, edges } = useAnimatedCanvasData({
    blocks: animationSequence.blocks,
    edges: animationSequence.edges,
    config: {
      blockDelay: 400,
      edgeDelay: 250,
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
      viewportAnimationDuration={VIEWPORT_ANIMATION_DURATION}
    />
  );
}
