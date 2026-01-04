'use client';

import React from 'react';
import { Button } from '@workspace/ui/components/ui/button';

interface LoginPromptDialogProps {
  isOpen: boolean;
  onLogin: () => void;
  onClose: () => void;
}

export function LoginPromptDialog({
  isOpen,
  onLogin,
  onClose,
}: LoginPromptDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">로그인 필요</h3>
          <p className="text-sm text-muted-foreground">
            페이지를 복제하려면 로그인이 필요합니다.
          </p>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            닫기
          </Button>
          <Button type="button" onClick={onLogin}>
            로그인
          </Button>
        </div>
      </div>
    </div>
  );
}
