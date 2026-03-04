'use client';

import { Plus, SearchIcon } from 'lucide-react';

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from '@workspace/ui/components/ui/combobox';
import { SelectButton } from '@workspace/ui/components/ui/select';
import { Box } from '@workspace/ui/components/ui/box';
import { Button } from '@workspace/ui/components/ui/button';

import type { DriveTypeFilter } from '@/domains/drive/frontend/hooks/drive-blocks-query';

const FILTER_ITEMS: { value: DriveTypeFilter; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'link', label: 'Link' },
  { value: 'audio', label: 'Audio' },
  { value: 'markdown', label: 'Note' },
  { value: 'pdf', label: 'PDF' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'image', label: 'Image' },
  { value: 'x', label: 'X' },
];

interface DriveFilterBarProps {
  typeFilter: DriveTypeFilter;
  onTypeFilterChange: (value: DriveTypeFilter) => void;
  onAddClick?: () => void;
}

/**
 * Presentational: type filter for Drive grid + Add button.
 */
export function DriveFilterBar({
  typeFilter,
  onTypeFilterChange,
  onAddClick,
}: DriveFilterBarProps) {
  return (
    <Box className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <Box className="flex flex-wrap items-center gap-2">
        <Combobox
          items={FILTER_ITEMS}
          value={
            FILTER_ITEMS.find((i) => i.value === typeFilter) ?? FILTER_ITEMS[0]
          }
          onValueChange={(item) => item && onTypeFilterChange(item.value)}
        >
          <ComboboxTrigger render={<SelectButton />}>
            <ComboboxValue placeholder="Type" />
          </ComboboxTrigger>
          <ComboboxPopup aria-label="Filter by type">
            <div className="border-b p-2">
              <ComboboxInput
                className="rounded-md"
                placeholder="Search types..."
                showTrigger={false}
                startAddon={<SearchIcon />}
              />
            </div>
            <ComboboxEmpty>No types found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={String(item.value)} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      </Box>
      {onAddClick && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddClick}
        >
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      )}
    </Box>
  );
}
