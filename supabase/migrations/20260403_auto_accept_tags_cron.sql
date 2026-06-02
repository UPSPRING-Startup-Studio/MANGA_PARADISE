-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : Auto-accept pending photo tags after 14 days
-- Date      : 2026-04-03
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Index partiel pour accélérer la query sur les tags en attente ─────────

CREATE INDEX IF NOT EXISTS idx_pending_old_tags
  ON cosplay_photo_tags(created_at)
  WHERE status = 'pending';

-- ── 2. Fonction auto_accept_pending_tags ────────────────────────────────────
--
-- Appelée manuellement, par pg_cron, ou depuis une Edge Function schedulée.
-- Retourne le nombre de tags acceptés pour faciliter le logging.

CREATE OR REPLACE FUNCTION auto_accept_pending_tags()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE cosplay_photo_tags
  SET
    status      = 'accepted',
    accepted_at = now()
  WHERE
    status     = 'pending'
    AND created_at < now() - interval '14 days';

  GET DIAGNOSTICS _count = ROW_COUNT;

  RAISE LOG 'auto_accept_pending_tags: % tag(s) auto-accepted', _count;

  RETURN _count;
END;
$$;

-- ── 3. Planification via pg_cron (tous les jours à 03h00 UTC) ───────────────
--
-- pg_cron doit être activé sur l'instance Supabase.
-- Sur Supabase Cloud : activez l'extension dans Database > Extensions > pg_cron.
-- Sur self-hosted   : ajoutez pg_cron dans shared_preload_libraries.
--
-- Si pg_cron n'est PAS disponible, commentez ce bloc et utilisez l'une des
-- alternatives documentées ci-dessous.

DO $$
BEGIN
  -- Vérifie si pg_cron est installé avant de planifier
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Supprime l'ancienne planification si elle existe déjà
    PERFORM cron.unschedule('auto-accept-tags')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'auto-accept-tags'
    );

    PERFORM cron.schedule(
      'auto-accept-tags',          -- nom du job
      '0 3 * * *',                 -- tous les jours à 03h00 UTC
      $cron$ SELECT auto_accept_pending_tags(); $cron$
    );

    RAISE LOG 'pg_cron job "auto-accept-tags" scheduled (daily at 03:00 UTC)';
  ELSE
    RAISE WARNING
      'pg_cron non disponible — auto_accept_pending_tags() doit être appelée manuellement ou via Edge Function.';
  END IF;
END;
$$;

-- ── Alternative A : Edge Function schedulée (Supabase) ───────────────────────
--
-- Si pg_cron n'est pas disponible, créez une Edge Function dans
-- supabase/functions/auto-accept-tags/index.ts :
--
--   import { createClient } from "@supabase/supabase-js";
--   const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
--   Deno.serve(async () => {
--     const { data, error } = await supabase.rpc("auto_accept_pending_tags");
--     return new Response(JSON.stringify({ accepted: data, error }), { status: 200 });
--   });
--
-- Puis planifiez-la dans Supabase Dashboard → Edge Functions → Schedule :
--   Cron expression : 0 3 * * *   (03:00 UTC chaque jour)
--
-- ── Alternative B : Appel manuel via SQL ────────────────────────────────────
--
--   SELECT auto_accept_pending_tags();
--
-- ─────────────────────────────────────────────────────────────────────────────
