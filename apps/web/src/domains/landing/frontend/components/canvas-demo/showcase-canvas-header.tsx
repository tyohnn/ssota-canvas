/**
 * Showcase Canvas Header
 *
 * Landing showcase용 간단한 캔버스 헤더
 * - 읽기 전용 (편집 불가)
 * - Static 데이터
 * - 섹션 애니메이션과 동기화
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@workspace/ui/components/ui/breadcrumb';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface ShowcaseCanvasHeaderProps {
  workspaceName: string;
  workspaceIcon: LucideIcon;
  pageName: string;
  pageIcon: LucideIcon;
  subPhase: number; // 애니메이션 제어용
}

export function ShowcaseCanvasHeader({
  workspaceName,
  workspaceIcon: WorkspaceIcon,
  pageName,
  pageIcon: PageIcon,
  subPhase,
}: ShowcaseCanvasHeaderProps) {
  const isIntro = subPhase === 0;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 select-none">
      {/* Breadcrumb - 항상 표시 */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: isIntro ? 0.6 : 0.3, duration: 0.4 }}
        className="flex-1"
      >
        <Breadcrumb>
          <BreadcrumbList>
            {/* Workspace */}
            <BreadcrumbItem>
              <BreadcrumbLink className="flex items-center gap-2 pointer-events-none">
                <WorkspaceIcon className="h-4 w-4" />
                <span className="font-medium">{workspaceName}</span>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>

            {/* Page */}
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                <PageIcon className="h-4 w-4" />
                <span className="font-medium">{pageName}</span>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>
    </header>
  );
}
