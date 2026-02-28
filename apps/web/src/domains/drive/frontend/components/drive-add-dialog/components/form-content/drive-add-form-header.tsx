'use client';

import { Plus } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';

export interface DriveAddFormHeaderProps {
  title: string;
  description: string;
  onCancel: () => void;
  onCreate: () => void;
  isCreateDisabled: boolean;
  isSubmitting: boolean;
}

export function DriveAddFormHeader({
  title,
  description,
  onCancel,
  onCreate,
  isCreateDisabled,
  isSubmitting,
}: DriveAddFormHeaderProps) {
  const renderButtons = () => (
    <Box className="flex gap-2 shrink-0">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="hidden md:inline-flex"
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCreate}
        disabled={isCreateDisabled || isSubmitting}
      >
        <Plus className="size-4" aria-hidden />
        {isSubmitting ? 'Creating...' : 'Create'}
      </Button>
    </Box>
  );

  return (
    <Box className="sticky top-0 z-50 flex flex-col gap-3 px-6 pt-12 pb-4 bg-background border-b border-border/30 md:flex-row md:justify-between md:items-start md:gap-3">
      <Box className="flex flex-col gap-3 md:gap-1 md:flex-1 min-w-0">
        <Box className="flex items-center justify-between gap-3 md:block">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <Box className="md:hidden">{renderButtons()}</Box>
        </Box>
        <p className="text-sm text-muted-foreground">{description}</p>
      </Box>
      <Box className="hidden md:flex gap-2 shrink-0">{renderButtons()}</Box>
    </Box>
  );
}
