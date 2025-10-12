'use client';

import React, { useEffect } from 'react';
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
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

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

interface WorkspaceSettingsDialogProps {
  workspace: WorkspaceWithPagesDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * WorkspaceSettingsDialog 컴포넌트
 *
 * Workspace 정보 수정 모달
 * - 기존 정보 미리 채우기
 * - 변경사항 감지 (isDirty)
 * - 부분 업데이트 지원
 */
export function WorkspaceSettingsDialog({
  workspace,
  open,
  onOpenChange,
}: WorkspaceSettingsDialogProps) {
  const { updateWorkspaceInfo, isLoading } = useWorkspace();

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
    }
  }, [workspace, open, form]);

  const handleSubmit = async (values: UpdateWorkspaceFormValues) => {
    const success = await updateWorkspaceInfo({
      workspaceId: workspace.workspaceId,
      name: values.name,
      description: values.description || null,
      icon: values.icon || null,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  const isSubmitting = form.formState.isSubmitting || isLoading;
  const isDirty = form.formState.isDirty;
  const descriptionLength = form.watch('description')?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>워크스페이스 설정</DialogTitle>
          <DialogDescription>
            워크스페이스의 이름, 설명, 아이콘을 수정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* 워크스페이스 이름 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    워크스페이스 이름{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 마케팅 프로젝트"
                      maxLength={100}
                      disabled={isSubmitting || workspace.isDefault}
                      {...field}
                    />
                  </FormControl>
                  {workspace.isDefault && (
                    <p className="text-xs text-muted-foreground">
                      기본 워크스페이스의 이름은 수정할 수 없습니다
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* 아이콘 선택 */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>아이콘 선택</FormLabel>
                  <FormControl>
                    <IconPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    아이콘을 클릭하여 변경할 수 있습니다
                  </p>
                  <FormMessage />
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
              <Button type="submit" disabled={!isDirty || isSubmitting}>
                {isSubmitting ? '저장 중...' : '저장하기'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
