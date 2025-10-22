'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { Separator } from '@workspace/ui/components/ui/separator';
import { Settings, Users, UserPlus } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { IconPicker } from '../shared/icon-picker';
import { WorkspaceMemberListTable } from './workspace-member-list-table';
import { InviteMemberDialog } from './invite-member-dialog';
import { useWorkspace } from '../../hooks/use-workspace';
import type {
  WorkspaceWithPagesDTO,
  WorkspaceMemberView,
} from '@/domains/workspace-management/shared/dtos';

/**
 * Workspace 수정 폼 검증 스키마
 */
const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, '워크스페이스 이름을 입력해주세요')
    .max(100, '워크스페이스 이름은 100자 이내로 입력해주세요'),
  description: z
    .string()
    .max(500, '설명은 500자 이내로 입력해주세요')
    .optional(),
  icon: z.string().optional(),
});

type UpdateWorkspaceFormValues = z.infer<typeof updateWorkspaceSchema>;
type SettingsTab = 'general' | 'members';

interface WorkspaceSettingsDialogProps {
  workspace: WorkspaceWithPagesDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disableInvite?: boolean; // 개인 워크스페이스는 Members 탭 숨김
}

/**
 * WorkspaceSettingsDialog 컴포넌트 (탭 구조)
 *
 * Workspace 설정 관리
 * - 설정 탭: Workspace 정보 수정
 * - 멤버 탭: 멤버 목록 및 초대
 */
export function WorkspaceSettingsDialog({
  workspace,
  open,
  onOpenChange,
  disableInvite = false,
}: WorkspaceSettingsDialogProps) {
  const {
    updateWorkspaceInfo,
    getWorkspaceMembers,
    canInviteMembers,
    isLoading,
  } = useWorkspace();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [memberView, setMemberView] = useState<WorkspaceMemberView | null>(
    null
  );
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const form = useForm<UpdateWorkspaceFormValues>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || '',
      icon: workspace.icon || 'Folder',
    },
  });

  // workspace prop 변경 시 폼 재설정
  useEffect(() => {
    if (open) {
      form.reset({
        name: workspace.name,
        description: workspace.description || '',
        icon: workspace.icon || 'Folder',
      });
      // 모달이 열릴 때 항상 general 탭으로 초기화
      setActiveTab('general');
    }
  }, [workspace, open, form]);

  // Dialog가 열릴 때 멤버 목록 로드
  useEffect(() => {
    if (open && activeTab === 'members' && !disableInvite) {
      loadMemberView();
    }
  }, [open, activeTab, workspace.workspaceId, disableInvite]);

  const loadMemberView = async () => {
    setIsLoadingMembers(true);
    const result = await getWorkspaceMembers(workspace.workspaceId);
    setMemberView(result);
    setIsLoadingMembers(false);
  };

  const handleInviteSuccess = () => {
    setIsInviteDialogOpen(false);
    loadMemberView(); // 멤버 목록 새로고침
  };

  const handleSubmit = async (values: UpdateWorkspaceFormValues) => {
    const success = await updateWorkspaceInfo({
      workspaceId: workspace.workspaceId,
      name: values.name,
      description: values.description || null,
      icon: values.icon || null,
    });

    if (success) {
      // 모달을 닫지 않고 폼만 초기화 (다른 탭으로 전환 가능)
      form.reset(values);
    }
  };

  const isSubmitting = form.formState.isSubmitting || isLoading;
  const isDirty = form.formState.isDirty;
  const descriptionLength = form.watch('description')?.length || 0;

  // 개인 워크스페이스는 Members 탭 숨김
  const tabs = [
    { id: 'general' as const, label: '설정', icon: Settings },
    ...(disableInvite
      ? []
      : [{ id: 'members' as const, label: '멤버', icon: Users }]),
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] h-[600px] p-0 rounded-md">
          <DialogHeader className="sr-only">
            <DialogTitle>워크스페이스 설정</DialogTitle>
            <DialogDescription>
              워크스페이스의 설정을 변경하거나 멤버를 관리합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex h-full">
            {/* 좌측 탭 네비게이션 */}
            <div className="w-48 border-r border-border/30 bg-muted/30 p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-sm px-2">
                  워크스페이스 설정
                </h3>
              </div>
              <div className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                        activeTab === tab.id
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 우측 콘텐츠 영역 */}
            <div className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="h-full w-full">
                <div className="p-6 pb-8 min-h-full">
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-lg font-semibold">기본 설정</h2>
                        <p className="text-sm text-muted-foreground">
                          워크스페이스의 이름, 설명, 아이콘을 수정합니다.
                        </p>
                      </div>
                      <Separator />

                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(handleSubmit)}
                          className="space-y-4"
                        >
                          {/* 워크스페이스 이름 & 아이콘 */}
                          <div className="space-y-2">
                            <FormLabel>
                              워크스페이스 이름{' '}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <div className="flex items-start gap-2">
                              {/* 아이콘 선택 */}
                              <FormField
                                control={form.control}
                                name="icon"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <IconPicker
                                        value={field.value}
                                        onChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              {/* 이름 입력 */}
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input
                                        placeholder="예: 마케팅 프로젝트"
                                        maxLength={100}
                                        disabled={isSubmitting}
                                        {...field}
                                      />
                                    </FormControl>
                                    {workspace.isDefault && (
                                      <p className="text-xs text-muted-foreground">
                                        기본 워크스페이스입니다 (삭제만 불가능)
                                      </p>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          {/* 워크스페이스 설명 */}
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>워크스페이스 설명</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="워크스페이스에 대한 간단한 설명을 입력하세요"
                                    rows={3}
                                    maxLength={500}
                                    disabled={isSubmitting}
                                    {...field}
                                  />
                                </FormControl>
                                <div className="flex justify-between items-center">
                                  <FormMessage />
                                  <p className="text-xs text-muted-foreground">
                                    {descriptionLength} / 500
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />

                          <div className="flex gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onOpenChange(false)}
                              disabled={isSubmitting}
                            >
                              취소
                            </Button>
                            <Button
                              type="submit"
                              disabled={!isDirty || isSubmitting}
                            >
                              {isSubmitting ? '저장 중...' : '저장하기'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  )}

                  {activeTab === 'members' && !disableInvite && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold">멤버 관리</h2>
                          <p className="text-sm text-muted-foreground">
                            워크스페이스 멤버를 초대하고 관리합니다.
                          </p>
                        </div>
                        {canInviteMembers(workspace.workspaceId) && (
                          <Button
                            onClick={() => setIsInviteDialogOpen(true)}
                            className="gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            멤버 초대
                          </Button>
                        )}
                      </div>
                      <Separator />

                      {/* 멤버 목록 */}
                      <WorkspaceMemberListTable
                        currentMembers={memberView?.currentMembers || []}
                        pendingInvitations={
                          memberView?.pendingInvitations || []
                        }
                        isLoading={isLoadingMembers}
                      />
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 멤버 초대 다이얼로그 */}
      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        workspaceId={workspace.workspaceId}
        workspaceName={workspace.name}
        onSuccess={handleInviteSuccess}
      />
    </>
  );
}
