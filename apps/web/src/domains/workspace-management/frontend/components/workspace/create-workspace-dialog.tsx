'use client';

import React from 'react';
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
import { IconPicker } from '../shared/icon-picker';
import { useWorkspace } from '../../hooks/use-workspace';
import { InviteMemberDialog } from './invite-member-dialog';

/**
 * Workspace 생성 폼 검증 스키마
 */
const createWorkspaceSchema = z.object({
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

type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * CreateWorkspaceDialog 컴포넌트
 *
 * 새 Workspace 생성 모달
 * - react-hook-form + zod 검증
 * - IconPicker 통합
 * - toast 피드백
 */
export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const { createWorkspace, isLoading } = useWorkspace();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
  const [createdWorkspace, setCreatedWorkspace] = React.useState<{
    workspaceId: string;
    workspaceName: string;
  } | null>(null);

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Folder',
    },
  });

  const handleSubmit = async (values: CreateWorkspaceFormValues) => {
    const result = await createWorkspace({
      name: values.name,
      description: values.description,
      icon: values.icon,
    });

    if (result) {
      // 워크스페이스 정보 저장
      setCreatedWorkspace({
        workspaceId: result.workspaceId,
        workspaceName: values.name,
      });

      form.reset();
      onOpenChange(false);

      // 멤버 초대 모달 열기
      setIsInviteDialogOpen(true);
    }
  };

  const isSubmitting = form.formState.isSubmitting || isLoading;
  const descriptionLength = form.watch('description')?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>새 워크스페이스 만들기</DialogTitle>
          <DialogDescription>
            프로젝트, 팀, 또는 주제별로 페이지를 관리할 수 있는 워크스페이스를
            만드세요.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* 워크스페이스 이름 & 아이콘 */}
            <div className="space-y-2">
              <FormLabel>
                워크스페이스 이름 <span className="text-destructive">*</span>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '생성 중...' : '생성하기'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* 워크스페이스 생성 후 멤버 초대 모달 */}
      {createdWorkspace && (
        <InviteMemberDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          workspaceId={createdWorkspace.workspaceId}
          workspaceName={createdWorkspace.workspaceName}
          showSkipButton={true}
          onSuccess={() => {
            setCreatedWorkspace(null);
          }}
        />
      )}
    </Dialog>
  );
}
