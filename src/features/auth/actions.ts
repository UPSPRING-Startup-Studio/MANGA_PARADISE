"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/features/auth/schemas";

/** Origine de la requete (pour construire les URLs de redirection OAuth/email). */
async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** N'autorise que les redirections internes (anti open-redirect). */
function safeNext(next?: string): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/espace-membre";
}

export async function signInWithPassword(
  values: LoginInput,
  next?: string,
): Promise<{ error: string } | void> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: "Champs invalides" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email ou mot de passe incorrect" };

  redirect(safeNext(next));
}

export async function signUpWithPassword(
  values: RegisterInput,
  next?: string,
): Promise<{ error?: string; needsConfirmation?: boolean } | void> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return { error: "Champs invalides" };

  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error) return { error: error.message };

  // Pas de session => confirmation email requise.
  if (!data.session) return { needsConfirmation: true };

  redirect(safeNext(next));
}

export async function signInWithGoogle(
  next?: string,
): Promise<{ error: string } | void> {
  const supabase = await createClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
