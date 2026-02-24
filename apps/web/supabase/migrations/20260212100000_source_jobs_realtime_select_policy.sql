-- Allow workspace members to SELECT source_jobs for Realtime.
-- The existing policy uses USING(false), so clients receive no Realtime events.
-- User must be a member or owner of the workspace that contains the block.

CREATE POLICY "source_jobs_select_workspace_member" ON public.source_jobs
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE b.id = source_jobs.block_id
        AND (
          EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = b.workspace_id AND w.owner_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = b.workspace_id AND wm.user_id = auth.uid()
          )
        )
    )
  );
