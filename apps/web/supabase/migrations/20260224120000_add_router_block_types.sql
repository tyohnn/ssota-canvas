-- Migration: Add link_router and file_router block types
-- Description: Router blocks are persisted to DB and soft-deleted when resolved or cancelled.

ALTER TYPE block_type ADD VALUE IF NOT EXISTS 'link_router';
ALTER TYPE block_type ADD VALUE IF NOT EXISTS 'file_router';
