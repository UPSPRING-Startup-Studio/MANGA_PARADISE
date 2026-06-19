import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Vérifier directement dans la table profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("role, role_function")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      // Vérifier si l'utilisateur est admin via role ou role_function
      const isAdmin = data?.role === "admin" || data?.role_function === "admin";
      return isAdmin;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useUserRoles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Récupérer les rôles depuis profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("role, role_function")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user roles:", error);
        return [];
      }

      // Retourner les rôles uniques
      const roles: string[] = [];
      if (data?.role) roles.push(data.role);
      if (data?.role_function && !roles.includes(data.role_function)) {
        roles.push(data.role_function);
      }
      return roles;
    },
    enabled: !!user?.id,
  });
};

// Hook pour récupérer le rôle complet de l'utilisateur
export const useUserRoleDetails = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-role-details", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("role, role_function")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role details:", error);
        return null;
      }

      return {
        role: data?.role || null,
        roleFunction: data?.role_function || null,
        isAdmin: data?.role === "admin" || data?.role_function === "admin",
      };
    },
    enabled: !!user?.id,
  });
};
