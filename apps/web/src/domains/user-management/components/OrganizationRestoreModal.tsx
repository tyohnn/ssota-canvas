"use client";

import { useState, useEffect } from 'react';
import { useUserManagement } from '../hooks/use-user-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@workspace/ui/components/ui/dialog';
import { Button } from '@workspace/ui/components/ui/button';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Clock } from 'lucide-react';

interface OrganizationRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

export function OrganizationRestoreModal({
  isOpen,
  onClose,
  organizationId,
  organizationName
}: OrganizationRestoreModalProps) {
  const { restoreOrganization } = useUserManagement();
  const [isRestoring, setIsRestoring] = useState(false);
  const [canRestore, setCanRestore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 복구 가능 여부 확인 로직 (실제로는 API에서 확인)
      // 여기서는 간단하게 30일 이내라고 가정
      setCanRestore(true);
    }
  }, [isOpen]);

  const handleRestore = async () => {
    if (!canRestore) {
      toast.error('복구 가능한 기간이 지났습니다');
      return;
    }

    setIsRestoring(true);

    try {
      await restoreOrganization(organizationId);
      toast.success('조직이 성공적으로 복구되었습니다');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '조직 복구에 실패했습니다');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!canRestore) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              복구 불가
            </DialogTitle>
            <DialogDescription>
              {organizationName} 조직은 삭제된 지 30일이 지나 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={onClose}>확인</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <RefreshCw className="h-5 w-5" />
            조직 복구
          </DialogTitle>
          <DialogDescription>
            {organizationName} 조직을 복구하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">복구 시 영향:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• 조직의 모든 멤버십이 복구됩니다</li>
            <li>• 조직의 모든 워크스페이스가 복구됩니다</li>
            <li>• 삭제된 데이터가 완전히 복원됩니다</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">주의사항:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 복구 후 조직은 다시 활성화됩니다</li>
            <li>• 멤버들은 다시 조직에 접근할 수 있습니다</li>
            <li>• 워크스페이스 데이터가 완전히 복원됩니다</li>
          </ul>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isRestoring}
          >
            취소
          </Button>
          <Button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex-1"
          >
            {isRestoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                복구 중...
              </>
            ) : (
              '조직 복구'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}