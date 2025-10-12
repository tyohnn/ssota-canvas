'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AccessDeniedPageProps {
  message: string;
  workspaceName?: string;
}

/**
 * Access Denied Page
 *
 * 권한 없는 페이지 접근 시 표시 (Screen 4)
 */
export function AccessDeniedPage({
  message,
  workspaceName,
}: AccessDeniedPageProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-4 max-w-md">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">{message}</p>
        {workspaceName && (
          <p className="text-sm text-muted-foreground">
            Workspace: <span className="font-medium">{workspaceName}</span>
          </p>
        )}
      </div>
    </div>
  );
}

