-- Add block_mount to event_type enum for block_mount_updated (position, size, move, group)
-- block = block entity (content/title); block_mount = mount/view (position, size, movedToPage, group)
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'block_mount';
