-- Migrate YouTube block properties: scriptAccessGranted → sourceContentAccessGranted,
-- summaryAccessGrantedLanguages → sourceSummaryAccessLanguages
-- Removes legacy keys after migration.

-- 1. scriptAccessGranted → sourceContentAccessGranted
UPDATE public.blocks
SET properties = (properties - 'scriptAccessGranted')
  || CASE
      WHEN (properties ? 'scriptAccessGranted')
            AND NOT (properties ? 'sourceContentAccessGranted')
      THEN jsonb_build_object(
        'sourceContentAccessGranted',
        (properties->>'scriptAccessGranted')::boolean
      )
      ELSE '{}'::jsonb
    END
WHERE block_type = 'youtube'
  AND properties ? 'scriptAccessGranted';

-- 2. summaryAccessGrantedLanguages → sourceSummaryAccessLanguages
UPDATE public.blocks
SET properties = (properties - 'summaryAccessGrantedLanguages')
  || CASE
      WHEN (properties ? 'summaryAccessGrantedLanguages')
            AND NOT (properties ? 'sourceSummaryAccessLanguages')
      THEN jsonb_build_object(
        'sourceSummaryAccessLanguages',
        properties->'summaryAccessGrantedLanguages'
      )
      ELSE '{}'::jsonb
    END
WHERE block_type = 'youtube'
  AND properties ? 'summaryAccessGrantedLanguages';
