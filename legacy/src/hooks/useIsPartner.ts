import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useIsPartner = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-is-partner", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "partner" as any)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error checking partner role:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 15 * 1000,
  });
};
