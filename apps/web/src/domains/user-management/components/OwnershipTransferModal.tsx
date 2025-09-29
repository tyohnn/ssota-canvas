"use client";

import { useState } from 'react';
import { useUserManagement } from '../hooks/use-user-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@workspace/ui/components/ui/dialog';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';

interface OwnershipTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

export function OwnershipTransferModal({
  isOpen,
  onClose,
  organizationId,
  organizationName
}: OwnershipTransferModalProps) {
  const { userOrganizationView, transferOwnership } = useUserManagement();
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // 현재 조직의 멤버들 중 Owner가 아닌 멤버들만 선택 가능
  const availableMembers = userOrganizationView?.currentOrganization?.members?.filter(
    member => member.role !== 'owner'
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMemberId) {
      toast.error('새 소유자를 선택해주세요');
      return;
    }

    if (!confirmationCode) {
      toast.error('확인 코드를 입력해주세요');
      return;
    }

    if (confirmationCode !== organizationName) {
      toast.error('조직 이름이 일치하지 않습니다');
      return;
    }

    setIsTransferring(true);

    try {
      await transferOwnership(organizationId, selectedMemberId);
      toast.success('소유권이 성공적으로 이전되었습니다');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '소유권 이전에 실패했습니다');
    } finally {
      setIsTransferring(false);
    }
  };

  const selectedMember = availableMembers.find(member => member.user.id === selectedMemberId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            소유권 이전
          </DialogTitle>
          <DialogDescription>
            {organizationName} 조직의 소유권을 다른 멤버에게 이전합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="member">새 소유자 선택</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="멤버를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map(member => (
                  <SelectItem key={member.user.id} value={member.user.id}>
                    {member.user.name} ({member.user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMember && (
              <p className="text-sm text-gray-600 mt-1">
                선택된 멤버: {selectedMember.user.name} (현재 역할: {selectedMember.role})
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmation">확인</Label>
            <Input
              id="confirmation"
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder={`"${organizationName}"을 입력하세요`}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              조직 이름을 정확히 입력하여 소유권 이전을 확인해주세요.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isTransferring}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isTransferring || !selectedMemberId || !confirmationCode}
              className="flex-1"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  이전 중...
                </>
              ) : (
                '소유권 이전'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}