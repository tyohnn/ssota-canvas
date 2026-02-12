-- Data migration: youtube_app_space → sources (plan 4.3)
-- 1. videos → sources (with raw_content from script.transcript)
-- 2. video_summaries → source_summaries
-- 3. action_transactions → source_action_transactions (extract_script → extract_content)
-- 4. blocks.source_id from sources where block.properties->>'youtubeId' = sources.metadata->>'appSpaceId'

-- pgcrypto for digest() to compute url_hash
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Insert sources from youtube_app_space.videos
--    ON CONFLICT (url_hash) DO UPDATE so existing sources (from new flow) get raw_content/metadata backfilled
INSERT INTO public.sources (
  id,
  url,
  url_hash,
  source_type,
  raw_content,
  metadata,
  content_language,
  extracted_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'https://www.youtube.com/watch?v=' || v.slug,
  encode(digest('https://www.youtube.com/watch?v=' || v.slug, 'sha256'), 'hex'),
  'youtube'::source_type,
  CASE
    WHEN v.script IS NOT NULL
        AND jsonb_typeof(v.script->'transcript') = 'array'
        AND jsonb_array_length(v.script->
          'transcript') > 0
    THEN (
      SELECT string_agg(
        '[' || lpad(floor(((seg->>'start')::numeric) / 60)::text, 2, '0')
          || ':' || lpad(floor(((seg->>'start')::numeric) % 60)::text, 2, '0')
          || '] ' || coalesce(seg->>'text', ''),
        E'\n'
        ORDER BY (seg->>'start')::numeric
      )
      FROM jsonb_array_elements(v.script->'transcript') AS seg
    )
    ELSE NULL
  END,
  jsonb_build_object(
    'appSpaceId', v.id,
    'videoSlug', v.slug,
    'channelName', coalesce(c.channel_name, '')
  ),
  v.script_language,
  v.script_extracted_at,
  now(),
  now()
FROM youtube_app_space.videos v
LEFT JOIN youtube_app_space.channels c ON v.channel_id = c.id
ON CONFLICT (url_hash) DO UPDATE SET
  raw_content = coalesce(EXCLUDED.raw_content, sources.raw_content),
  metadata = EXCLUDED.metadata,
  content_language = coalesce(EXCLUDED.content_language, sources.content_language),
  extracted_at = coalesce(EXCLUDED.extracted_at, sources.extracted_at),
  updated_at = now();

-- 2. video_summaries → source_summaries
--    Join video_summaries → videos → sources on metadata->>'appSpaceId' = video id
INSERT INTO public.source_summaries (
  source_id,
  language,
  summary,
  keywords,
  created_at,
  updated_at
)
SELECT
  s.id,
  vs.language,
  vs.summary,
  vs.keywords,
  vs.created_at,
  vs.updated_at
FROM youtube_app_space.video_summaries vs
JOIN youtube_app_space.videos v ON vs.video_id = v.id
JOIN public.sources s ON s.metadata->>'appSpaceId' = v.id::text
ON CONFLICT (source_id, language) DO UPDATE SET
  summary = EXCLUDED.summary,
  keywords = EXCLUDED.keywords,
  updated_at = EXCLUDED.updated_at;

-- 3. action_transactions → source_action_transactions
--    Map extract_script → extract_content; extract_summary → extract_summary
--    One row per (org_id, source_id, action_type, language) - use DISTINCT ON to dedupe
INSERT INTO public.source_action_transactions (
  org_id,
  source_id,
  action_type,
  language,
  created_at,
  completed_at
)
SELECT DISTINCT ON (at.org_id, s.id, mapped.action_type, at.language)
  at.org_id,
  s.id,
  mapped.action_type,
  at.language,
  at.created_at,
  at.completed_at
FROM youtube_app_space.action_transactions at
JOIN youtube_app_space.videos v ON at.video_id = v.id
JOIN public.sources s ON s.metadata->>'appSpaceId' = v.id::text
CROSS JOIN LATERAL (
  SELECT CASE
    WHEN at.action_type = 'extract_script' THEN 'extract_content'
    WHEN at.action_type = 'extract_summary' THEN 'extract_summary'
    ELSE at.action_type
  END AS action_type
) mapped
WHERE mapped.action_type IN ('extract_content', 'extract_summary')
ORDER BY at.org_id, s.id, mapped.action_type, at.language, at.created_at DESC
ON CONFLICT (org_id, source_id, action_type, language) DO UPDATE SET
  completed_at = coalesce(EXCLUDED.completed_at, source_action_transactions.completed_at);

-- 4. blocks.source_id from sources
--    YouTube blocks: properties->>'youtubeId' is the video UUID (youtube_app_space.videos.id)
UPDATE public.blocks b
SET source_id = s.id
FROM public.sources s
WHERE b.block_type = 'youtube'
  AND b.properties->>'youtubeId' IS NOT NULL
  AND s.metadata->>'appSpaceId' = b.properties->>'youtubeId'
  AND b.source_id IS NULL;
