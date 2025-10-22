'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X, UserPlus, Mail } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from '@workspace/ui/components/ui/sonner';
import { useWorkspace } from '../../hooks/use-workspace';
import type { OrganizationMemberSearchResultDTO } from '../../../shared/dtos';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  onSuccess?: () => void;
  showSkipButton?: boolean; // 건너뛰기 버튼 표시 여부
}

/**
 * InviteMemberDialog 컴포넌트 (Scenario 3)
 *
 * Workspace 멤버 초대 모달
 * - 이메일 검색 및 미리보기
 * - 다중 선택 (Badge 목록)
 * - 여러 명 한 번에 초대
 * - toast 피드백
 */
export function InviteMemberDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  onSuccess,
  showSkipButton = false,
}: InviteMemberDialogProps) {
  const { inviteMembers, searchOrganizationMembers, isLoading } =
    useWorkspace();
  const [email, setEmail] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<
    OrganizationMemberSearchResultDTO[]
  >([]);
  const [searchResults, setSearchResults] = useState<
    OrganizationMemberSearchResultDTO[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이메일 검색 (디바운싱 300ms)
  useEffect(() => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchOrganizationMembers(workspaceId, email);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [email, workspaceId, searchOrganizationMembers]);

  const handleMemberSelect = (member: OrganizationMemberSearchResultDTO) => {
    if (member.isAlreadyMember) {
      toast.error('이미 멤버입니다', {
        description: '이미 Workspace 멤버인 사용자입니다.',
      });
      return;
    }

    if (member.hasPendingInvitation) {
      toast.error('초대 진행 중', {
        description: '이미 초대가 진행 중인 사용자입니다.',
      });
      return;
    }

    // 중복 체크
    if (selectedMembers.some(m => m.userId === member.userId)) {
      toast.error('이미 선택된 멤버입니다');
      return;
    }

    setSelectedMembers(prev => [...prev, member]);
    setEmail('');
    setSearchResults([]);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.userId !== userId));
  };

  const handleSubmit = async () => {
    if (selectedMembers.length === 0) {
      toast.error('최소 1명의 멤버를 선택해주세요');
      return;
    }

    setIsSubmitting(true);
    const emails = selectedMembers.map(m => m.email);
    const result = await inviteMembers(workspaceId, emails);
    setIsSubmitting(false);

    if (result !== null) {
      setSelectedMembers([]);
      setEmail('');
      onSuccess?.(); // 성공 콜백 호출
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setEmail('');
    setSearchResults([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] rounded-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            멤버 초대
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{workspaceName}</span> 워크스페이스에
            멤버를 초대합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 이메일 검색 필드 */}
          <div className="space-y-2">
            <Label htmlFor="email">이메일로 조직 멤버 검색</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-9"
                disabled={isSubmitting || isLoading}
              />
            </div>

            {/* 검색 결과 미리보기 */}
            {searchResults.length > 0 && (
              <Card className="mt-2 p-2 max-h-[200px] overflow-y-auto">
                <div className="space-y-1">
                  {searchResults.map(member => {
                    const isAlreadySelected = selectedMembers.some(
                      m => m.userId === member.userId
                    );
                    const isDisabled =
                      member.isAlreadyMember ||
                      member.hasPendingInvitation ||
                      isAlreadySelected;

                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() =>
                          !isDisabled && handleMemberSelect(member)
                        }
                        disabled={isDisabled}
                        className={cn(
                          'w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
                          isDisabled && 'opacity-50 cursor-not-allowed bg-muted'
                        )}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback>
                            {member.name?.[0]?.toUpperCase() ||
                              member.email[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">
                            {member.name || member.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                        {member.isAlreadyMember && (
                          <Badge variant="secondary" className="text-xs">
                            멤버
                          </Badge>
                        )}
                        {member.hasPendingInvitation && (
                          <Badge variant="outline" className="text-xs">
                            초대 중
                          </Badge>
                        )}
                        {isAlreadySelected && (
                          <Badge variant="outline" className="text-xs">
                            선택됨
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {isSearching && (
              <p className="text-sm text-muted-foreground">검색 중...</p>
            )}
          </div>

          {/* 선택된 멤버 목록 (Badge) */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label>초대할 멤버 ({selectedMembers.length}명)</Label>
              <div className="flex flex-wrap gap-2 p-3 border border-border/30 rounded-md bg-muted/30">
                {selectedMembers.map(member => (
                  <Badge
                    key={member.userId}
                    variant="secondary"
                    className="flex items-center gap-1 py-1.5 pr-1"
                  >
                    <Avatar className="h-4 w-4 mr-1">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {member.name?.[0]?.toUpperCase() ||
                          member.email[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">
                      {member.name || member.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.userId)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                      disabled={isSubmitting || isLoading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
          >
            {showSkipButton ? '건너뛰기' : '취소'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || selectedMembers.length === 0}
          >
            {isSubmitting
              ? '초대 중...'
              : selectedMembers.length > 0
                ? `${selectedMembers.length}명 초대하기`
                : '초대하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
