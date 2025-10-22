'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Shield, User } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { Badge } from '@workspace/ui/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/ui/avatar';
import { Card } from '@workspace/ui/components/ui/card';
import {
  RadioGroup,
  RadioGroupItem,
} from '@workspace/ui/components/ui/radio-group';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from '@workspace/ui/components/ui/field';
import { toast } from '@workspace/ui/components/ui/sonner';
import { useMemberManagement } from '../../hooks/use-member-management';
import { inviteMemberAction } from '../../../actions/organization-management.actions';
import { UserProfile } from '../../../shared/dtos';
import { cn } from '@workspace/ui/lib/utils';

interface MemberInvitationFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export function MemberInvitationForm({
  organizationId,
  onSuccess,
}: MemberInvitationFormProps) {
  const [email, setEmail] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [role, setRole] = useState<'admin' | 'member'>('admin');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    searchUserByEmail,
    isMember,
    hasPendingInvitation,
    canInviteMembers,
  } = useMemberManagement();

  // 이메일 검색 (디바운싱)
  useEffect(() => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUserByEmail(email);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [email, searchUserByEmail]);

  const handleUserSelect = (user: UserProfile) => {
    if (isMember(user.email)) {
      toast.error('이미 멤버입니다', {
        description: '이미 조직 멤버인 사용자입니다.',
      });
      return;
    }

    if (hasPendingInvitation(user.email)) {
      toast.error('초대 진행 중', {
        description: '이미 초대가 진행 중인 사용자입니다.',
      });
      return;
    }

    // 중복 체크
    if (selectedUsers.some(u => u.userId === user.userId)) {
      toast.error('이미 선택된 사용자입니다');
      return;
    }

    setSelectedUsers(prev => [...prev, user]);
    setEmail('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.userId !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      toast.error('사용자를 선택해주세요');
      return;
    }

    if (!canInviteMembers) {
      toast.error('권한 없음', {
        description: '멤버를 초대할 권한이 없습니다.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 여러 명 초대 (순차 처리)
      for (const user of selectedUsers) {
        await inviteMemberAction({
          organizationId,
          inviteeEmail: user.email,
          role,
        });
      }

      toast.success('초대 완료', {
        description: `${selectedUsers.length}명에게 초대를 보냈습니다.`,
      });

      // 폼 초기화
      setSelectedUsers([]);
      setRole('admin');
      onSuccess?.();
    } catch (error) {
      toast.error('초대 실패', {
        description:
          error instanceof Error
            ? error.message
            : '초대를 보내는데 실패했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">이메일로 사용자 검색</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="pl-9"
            disabled={isSubmitting}
          />
        </div>

        {/* 검색 결과 미리보기 */}
        {searchResults.length > 0 && (
          <Card className="mt-2 p-2 max-h-[200px] overflow-y-auto">
            <div className="space-y-1">
              {searchResults.map(user => {
                const isAlreadyMember = isMember(user.email);
                const isPending = hasPendingInvitation(user.email);
                const isAlreadySelected = selectedUsers.some(
                  u => u.userId === user.userId
                );
                const isDisabled =
                  isAlreadyMember || isPending || isAlreadySelected;

                return (
                  <button
                    key={user.userId}
                    type="button"
                    onClick={() => !isDisabled && handleUserSelect(user)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
                      isDisabled && 'opacity-50 cursor-not-allowed bg-muted'
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    {isAlreadyMember && (
                      <Badge variant="secondary" className="text-xs">
                        멤버
                      </Badge>
                    )}
                    {isPending && (
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

      {/* 선택된 멤버 목록 (Badge) - Workspace 스타일 */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <Label>초대할 멤버 ({selectedUsers.length}명)</Label>
          <div className="flex flex-wrap gap-2 p-3 border border-border/30 rounded-md bg-muted/30">
            {selectedUsers.map(user => (
              <Badge
                key={user.userId}
                variant="secondary"
                className="flex items-center gap-1 py-1.5 pr-1"
              >
                <Avatar className="h-4 w-4 mr-1">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback className="text-[8px]">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{user.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.userId)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <FieldGroup>
        <FieldSet>
          <FieldLabel htmlFor="role">역할 선택</FieldLabel>
          <FieldDescription>
            초대할 멤버의 역할을 선택해주세요.
          </FieldDescription>
          <RadioGroup
            value={role}
            onValueChange={(v: 'admin' | 'member') => setRole(v)}
          >
            <FieldLabel htmlFor="admin-role">
              <Field orientation="horizontal">
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <FieldTitle>관리자</FieldTitle>
                  </div>
                  <FieldDescription>
                    멤버를 초대하고 관리할 수 있습니다. 조직 설정을 변경할 수
                    있는 권한이 있습니다.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="admin" id="admin-role" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="member-role">
              <Field orientation="horizontal">
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <FieldTitle>멤버</FieldTitle>
                  </div>
                  <FieldDescription>
                    조직의 콘텐츠를 생성하고 편집할 수 있습니다. 일반적인 협업
                    권한을 갖습니다.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem value="member" id="member-role" />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </FieldSet>
      </FieldGroup>

      <Button
        type="submit"
        className="w-full"
        disabled={selectedUsers.length === 0 || isSubmitting}
      >
        {isSubmitting ? '초대 중...' : `${selectedUsers.length}명 초대 보내기`}
      </Button>
    </form>
  );
}
