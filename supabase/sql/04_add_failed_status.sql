-- Add 'failed' status to adaptation_status enum
-- This distinguishes AI generation errors from teacher rejections
-- Migration created: 2026-10-04

ALTER TYPE adaptation_status ADD VALUE IF NOT EXISTS 'failed';

-- Optional: Backfill existing 'rejected' records that are likely technical failures
-- Uncomment if you want to retroactively fix historical data
-- UPDATE material_adaptations 
-- SET status = 'failed'
-- WHERE status = 'rejected' 
--   AND (
--     ai_model IS NULL OR
--     ai_model = 'menunggu' OR
--     adapted_content IS NULL
--   );

-- Create index for failed status filtering (optional performance optimization)
CREATE INDEX IF NOT EXISTS material_adaptations_failed_idx 
ON material_adaptations(status) 
WHERE status = 'failed';

COMMENT ON INDEX material_adaptations_failed_idx IS 
'Index for filtering failed adaptations - helps track AI generation errors';
