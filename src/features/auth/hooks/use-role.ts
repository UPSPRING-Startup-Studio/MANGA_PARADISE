"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchUserRoles } from "@/features/auth/api/roles";
import {
  canAccessArea,
  hasAnyRole,
  isAdmin,
  isStaff,
  type AppRole,
  type Area,
} from "@/lib/rbac";

/**
 * Hook client donnant les rôles de l'utilisateur courant et des helpers d'accès.
 * Sert uniquement à **afficher/masquer** côté UI — la RLS et les gardes serveur
 * restent les vrais garde-fous.
 *
 * Les rôles sont mis en cache par TanStack Query. À terme, ils pourront être lus
 * depuis le JWT (Auth Hook Supabase) pour éviter ce round-trip (voir docs/rbac.md).
 */
export function useRole() {
  const query = useQuery({
    queryKey: ["auth", "roles"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AppRole[]> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      return fetchUserRoles(supabase, user.id);
    },
  });

  const roles = query.data ?? [];

  return {
    roles,
    isLoading: query.isLoading,
    isAdmin: isAdmin(roles),
    isStaff: isStaff(roles),
    has: (allowed: readonly AppRole[]) => hasAnyRole(roles, allowed),
    canAccess: (area: Area) => canAccessArea(area, roles),
  };
}
