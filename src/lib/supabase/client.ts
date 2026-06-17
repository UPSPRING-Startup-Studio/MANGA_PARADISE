import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour les composants client ("use client").
 * Les clés publiques transitent par le navigateur — la sécurité repose sur la RLS.
 *
 * TODO: typer avec `Database` une fois `src/types/database.ts` généré
 * (`supabase gen types typescript`).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
