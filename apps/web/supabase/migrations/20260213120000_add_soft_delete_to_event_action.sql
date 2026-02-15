-- 블록 마운트 소프트 삭제(캔버스 제거)와 영구 삭제(휴지통 완전 삭제) 구분
-- action: deleted = 영구 삭제, soft_delete = 소프트 삭제
ALTER TYPE event_action ADD VALUE IF NOT EXISTS 'soft_delete';
