"use client";

import { useState } from 'react';
import { useUserManagement } from '../hooks/use-user-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@workspace/ui/components/ui/dialog';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';

interface OrganizationDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  isDefault?: boolean;
}

export function OrganizationDeleteModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  isDefault = false
}: OrganizationDeleteModalProps) {
  const { deleteOrganization } = useUserManagement();
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmationText) {
      toast.error('확인 문구를 입력해주세요');
      return;
    }

    if (confirmationText !== organizationName) {
      toast.error('조직 이름이 일치하지 않습니다');
      return;
    }

    setIsDeleting(true);

    try {
      await deleteOrganization(organizationId);
      toast.success('조직이 성공적으로 삭제되었습니다');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '조직 삭제에 실패했습니다');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDefault) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              삭제 불가
            </DialogTitle>
            <DialogDescription>
              기본 조직은 삭제할 수 없습니다. 다른 조직을 생성하여 사용해주세요.
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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            조직 삭제
          </DialogTitle>
          <DialogDescription>
            {organizationName} 조직을 삭제하시겠습니까? 이 작업은 실행 취소할 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">삭제 시 영향:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• 조직의 모든 멤버십이 비활성화됩니다</li>
            <li>• 조직의 모든 워크스페이스가 삭제됩니다</li>
            <li>• 30일 후 완전히 삭제됩니다</li>
            <li>• 그 전까지는 복구가 가능합니다</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="confirmation">확인</Label>
            <Input
              id="confirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`"${organizationName}"을 입력하세요`}
              required
              className="border-red-300 focus:border-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              조직 이름을 정확히 입력하여 삭제를 확인해주세요.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isDeleting || !confirmationText || confirmationText !== organizationName}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '조직 삭제'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}