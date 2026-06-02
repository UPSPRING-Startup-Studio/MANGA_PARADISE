import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Partner, CategoryKey } from "@/components/partners/partnersData";

// ──────────────────────────────────────────────
// Mapping DB directory_category (snake_case) → UI CategoryKey (kebab-case)
// ──────────────────────────────────────────────

const DB_TO_UI_CATEGORY: Record<string, CategoryKey> = {
  acteurs_publics: "acteurs-publics",
  boutiques_librairies: "boutiques-librairies",
  cinemas: "cinemas",
  restauration: "restauration",
  partenaires_associatifs: "partenaires-associatifs",
  artistes_createurs: "artistes-createurs",
  evenements_lieux_culturels: "evenements-lieux-culturels",
  entreprises_marques: "entreprises-marques",
};

// ──────────────────────────────────────────────
// Transform DB row → Partner shape (for PartnerCard/PartnerModal)
// ──────────────────────────────────────────────

function dbRowToPartner(row: any): Partner & { member_benefit?: string; is_featured?: boolean } {
  return {
    name: row.name || "",
    category: DB_TO_UI_CATEGORY[row.directory_category] || "tous" as CategoryKey,
    type: row.subcategories?.[0]?.replace(/_/g, " ") || row.type || "",
    address: row.address || "",
    codePostal: row.postal_code || "",
    ville: row.city || "",
    description: row.description || "",
    siteInternet: row.website_url || "",
    facebook: row.facebook_url || "",
    instagram: row.instagram_url || "",
    logo: row.logo_url || "",
    member_benefit: row.member_benefit || undefined,
    is_featured: row.is_featured || false,
  };
}

// ──────────────────────────────────────────────
// Hook : partenaires publics pour l'annuaire
//
// Charge les pro_partners publics depuis la DB.
// La policy RLS pp_select filtre déjà les blocked/deleted.
// On filtre côté query : is_public=true, status=active.
// ──────────────────────────────────────────────

export function usePublicProPartners() {
  return useQuery({
    queryKey: ["public-pro-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_partners")
        .select(
          "id, name, slug, type, directory_category, subcategories, description, city, postal_code, address, logo_url, banner_url, website_url, social_links, facebook_url, instagram_url, member_benefit, is_featured"
        )
        .eq("is_public", true)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []).map(dbRowToPartner);
    },
    staleTime: 5 * 60 * 1000,
  });
}
