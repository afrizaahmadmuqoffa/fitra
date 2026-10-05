ALTER TYPE adaptation_status ADD VALUE IF NOT EXISTS 'failed';


-- Create index for failed status filtering (optional performance optimization)
CREATE INDEX IF NOT EXISTS material_adaptations_failed_idx 
ON material_adaptations(status) 
WHERE status = 'failed';

COMMENT ON INDEX material_adaptations_failed_idx IS 
'Index for filtering failed adaptations - helps track AI generation errors';
