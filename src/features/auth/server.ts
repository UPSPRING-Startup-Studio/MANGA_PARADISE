import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { fetchUserRoles } from "@/features/auth/api/roles";
import { canAccessArea, hasAnyRole, type AppRole, type Area } from "@/lib/rbac";

/**
 * Gardes d'autorisation **côté serveur** (Server Components, layouts, route
 * handlers, server actions). La RLS reste le rempart réel ; ces gardes ne font
 * que rediriger tôt et fournir le contexte.
 *
 * Dégradation gracieuse : tant que Supabase n'est pas configuré
 * (`.env.local` vide), aucune redirection — l'app reste navigable en dev.
 */

export type AuthContext = {
  user: User | null;
  roles: AppRole[];
  /** false tant que les variables Supabase ne sont pas renseignées. */
  configured: boolean;
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Session + rôles de l'utilisateur courant (jamais de throw). */
export async function getAuthContext(): Promise<AuthContext> {
  if (!isSupabaseConfigured()) {
    return { user: null, roles: [], configured: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, roles: [], configured: true };

  const roles = await fetchUserRoles(supabase, user.id);
  return { user, roles, configured: true };
}

/** Exige une session ; redirige vers `redirectTo` sinon. */
export async function requireAuth(redirectTo = "/login"): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (ctx.configured && !ctx.user) redirect(redirectTo);
  return ctx;
}

/** Exige l'accès à une zone (auth + rôles requis par la zone). */
export async function requireArea(area: Area): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!ctx.configured) return ctx;
  if (!canAccessArea(area, ctx.roles)) redirect("/");
  return ctx;
}

/** Exige au moins un des rôles fournis. */
export async function requireRole(
  allowed: readonly AppRole[],
): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!ctx.configured) return ctx;
  if (!hasAnyRole(ctx.roles, allowed)) redirect("/");
  return ctx;
}
