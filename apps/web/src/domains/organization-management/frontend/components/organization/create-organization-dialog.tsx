'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@workspace/ui/components/ui/sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { useOrganization } from '../../hooks/use-organization';
import { CreateOrganizationRequest } from '../../../shared/dtos';
import { ORGANIZATION_TYPE_LABELS } from '../../../shared/types';

// Zod 스키마 정의 (08-code-conventions.md 준수)
const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, '조직명은 필수입니다')
    .max(255, '조직명은 255자를 초과할 수 없습니다'),
  organizationType: z.enum(
    ['personal', 'education', 'startup', 'agency', 'company', 'n/a'],
    {
      message: '올바른 조직 타입을 선택해주세요',
    }
  ),
});

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const { createOrganization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof createOrganizationSchema>>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      organizationType: 'personal',
    },
  });

  const handleSubmit = async (
    data: z.infer<typeof createOrganizationSchema>
  ) => {
    setIsSubmitting(true);

    try {
      const result = await createOrganization(data);

      if (result.success) {
        toast('조직이 성공적으로 생성되었습니다', {
          description: `${data.name} 조직이 생성되었습니다.`,
        });
        form.reset();
        onOpenChange(false);
      } else {
        toast.error('조직 생성에 실패했습니다', {
          description: result.error || '알 수 없는 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      toast.error('조직 생성 중 오류가 발생했습니다', {
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-md">
        <DialogHeader>
          <DialogTitle>새 조직 만들기</DialogTitle>
          <DialogDescription>
            새로운 조직을 생성하여 팀과 함께 작업을 시작하세요.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>조직명</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="조직명을 입력하세요"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>조직 타입</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="조직 타입을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ORGANIZATION_TYPE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '생성 중...' : '생성'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
