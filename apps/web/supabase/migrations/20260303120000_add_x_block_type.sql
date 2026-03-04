-- Add 'x' (X/Twitter post block) to block_type enum so X blocks can be saved
ALTER TYPE block_type ADD VALUE IF NOT EXISTS 'x';
