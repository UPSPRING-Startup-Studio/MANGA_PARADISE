import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ============================================================
// TYPES
// ============================================================

export interface ScheduleDay {
  date: string;
  start_time: string;
  end_time: string;
}

export type TicketingMode = "internal" | "external";

export type EventType =
  | "convention"
  | "tournoi"
  | "atelier"
  | "meetup"
  | "concert"
  | "exposition"
  | "projection"
  | "autre";

/** Coordonnées GPS pour Leaflet */
export interface CoordonneeGPS {
  lat: number;
  lng: number;
}

/** Représentation complète d'un événement (champs legacy + nouveaux champs MVP Agenda) */
export interface Event {
  id: string;
  title: string;
  description: string | null;
  // Legacy date fields (conservés pour compatibilité)
  date: string;
  end_date: string | null;
  time: string | null;
  // Nouveaux champs MVP Agenda (timestamps précis)
  date_debut: string | null;
  date_fin: string | null;
  // Localisation
  location: string | null;
  adresse: string | null;
  venue_name: string | null;
  city: string | null;
  region: string | null;
  coordonnees_gps: CoordonneeGPS | null;
  // Catégorisation
  category: string;
  type_evenement: EventType | null;
  // Médias
  image_url: string | null;
  cover_image: string | null;
  // Logistique
  schedule: ScheduleDay[] | null;
  status: string;
  max_attendees: number | null;
  price: string | null;
  ticketing_mode: TicketingMode;
  external_link: string | null;
  // Association
  association_id: string | null;
  // Méta
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed (non stocké en DB)
  has_contest?: boolean;
  association_name?: string;
}

/** Filtres optionnels pour la requête useFilteredEvents */
export interface EventFilters {
  /** Filtrer par ville (insensible à la casse) */
  city?: string;
  /** Filtrer par type d'événement */
  type_evenement?: EventType;
  /** Filtrer les événements à partir de cette date (ISO string) */
  date_from?: string;
  /** Filtrer les événements jusqu'à cette date (ISO string) */
  date_to?: string;
  /** Filtrer uniquement les événements à venir */
  upcoming_only?: boolean;
  /** Filtrer par organisateur : "mp" = Manga Paradise, "associations" = associations, undefined = tous */
  organizer?: "mp" | "associations";
}

// ============================================================
// HELPERS
// ============================================================

/** Parse les coordonnées GPS depuis le JSONB Supabase */
const parseCoordonnees = (raw: unknown): CoordonneeGPS | null => {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.lat === "number" && typeof obj.lng === "number") {
    return { lat: obj.lat, lng: obj.lng };
  }
  return null;
};

/** Enrichit un événement brut avec le flag has_contest et le parsing des types */
const enrichEvent = (event: Record<string, unknown>, has_contest = false): Event => ({
  ...(event as unknown as Event),
  schedule: Array.isArray(event.schedule)
    ? (event.schedule as unknown as ScheduleDay[])
    : null,
  coordonnees_gps: parseCoordonnees(event.coordonnees_gps),
  has_contest,
});

/** Vérifie si un événement a des activités de type "contest" dans event_schedule */
const checkHasContest = async (eventId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("event_schedule")
    .select("category")
    .eq("event_id", eventId)
    .eq("category", "contest")
    .limit(1);
  return !!(data && data.length > 0);
};

// ============================================================
// HOOKS DE LECTURE
// ============================================================

/**
 * Récupère tous les événements (avec détection de contest).
 * Usage: liste complète pour l'admin ou la page Agenda sans filtre.
 */
export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;

      const eventsWithFlags = await Promise.all(
        (data || []).map(async (event) => {
          const has_contest = await checkHasContest(event.id);
          return enrichEvent(event as Record<string, unknown>, has_contest);
        })
      );

      return eventsWithFlags;
    },
  });
};

/**
 * Récupère un événement unique par son ID.
 */
export const useEvent = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      const has_contest = await checkHasContest(eventId);
      return enrichEvent(data as Record<string, unknown>, has_contest);
    },
    enabled: !!eventId,
  });
};

/**
 * Récupère les événements à venir (date_debut ou date >= aujourd'hui).
 * Filtrage côté client pour cohérence avec useFilteredEvents.
 */
export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;

      const upcoming = (data || []).filter((e) => {
        const raw = (e as any).date_debut || e.date || "";
        const d = typeof raw === "string" ? raw.split("T")[0] : "";
        return !d || d >= today;
      });

      const eventsWithFlags = await Promise.all(
        upcoming.map(async (event) => {
          const has_contest = await checkHasContest(event.id);
          return enrichEvent(event as Record<string, unknown>, has_contest);
        })
      );

      return eventsWithFlags;
    },
  });
};

/**
 * Récupère les événements avec des filtres optionnels.
 * C'est le hook principal pour la page Agenda MVP.
 *
 * @param filters - Filtres optionnels: city, type_evenement, date_from, date_to, upcoming_only
 *
 * @example
 * // Événements à Paris de type convention
 * const { data } = useFilteredEvents({ city: "Paris", type_evenement: "convention" });
 *
 * @example
 * // Événements à venir dans la ville épinglée de l'utilisateur
 * const { data } = useFilteredEvents({ city: pinnedCity, upcoming_only: true });
 */
export const useFilteredEvents = (filters: EventFilters = {}) => {
  const { city, type_evenement, date_from, date_to, upcoming_only, organizer } = filters;

  return useQuery({
    queryKey: ["events", "filtered", filters],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from("events")
        .select("*")
        .neq("status", "cancelled");

      // Filtre par organisateur
      if (organizer === "mp") {
        query = query.is("association_id", null);
      } else if (organizer === "associations") {
        query = query.not("association_id", "is", null);
      }

      // Filtre par ville
      if (city && city.trim() !== "") {
        query = query.ilike("city", `%${city.trim()}%`);
      }

      // Filtre par type d'événement
      if (type_evenement) {
        query = query.eq("type_evenement", type_evenement);
      }

      // Pas de filtre de dates côté serveur — filtrage client plus bas

      query = query.order("date", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      const serverEvents = data || [];

      // ── Récupérer les noms des associations séparément ────────
      const assoIds = [...new Set(
        serverEvents.map((e: any) => e.association_id).filter(Boolean)
      )] as string[];

      let assoMap: Record<string, string> = {};
      if (assoIds.length > 0) {
        const { data: assoData } = await supabase
          .from("associations")
          .select("id, name")
          .in("id", assoIds);
        if (assoData) {
          assoMap = Object.fromEntries(
            assoData.map((a: any) => [a.id, a.name])
          );
        }
      }

      // ── Filtrage de dates côté client ─────────────────────────
      const todayStr = new Date().toISOString().split("T")[0];

      const getEventDate = (e: any): string => {
        const raw = e.date_debut || e.date || "";
        return typeof raw === "string" ? raw.split("T")[0] : "";
      };

      let rawEvents = serverEvents;

      if (upcoming_only) {
        rawEvents = rawEvents.filter((e: any) => {
          const d = getEventDate(e);
          return !d || d >= todayStr;
        });
      }
      if (date_from) {
        rawEvents = rawEvents.filter((e: any) => {
          const d = getEventDate(e);
          return !d || d >= date_from;
        });
      }
      if (date_to) {
        rawEvents = rawEvents.filter((e: any) => {
          const d = getEventDate(e);
          return !d || d <= date_to;
        });
      }

      const enrichedEvents = rawEvents.map((event: any) => {
        const enriched = enrichEvent(event as Record<string, unknown>, false);
        // Attacher le nom de l'association depuis la requête séparée
        if (event.association_id && assoMap[event.association_id]) {
          enriched.association_name = assoMap[event.association_id];
        }
        return enriched;
      });

      return enrichedEvents;
    },
    // Clé de cache stable basée sur les filtres sérialisés
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Récupère les événements par ville (alias pratique de useFilteredEvents).
 */
export const useEventsByCity = (city: string | null | undefined) => {
  return useFilteredEvents({
    city: city ?? undefined,
    upcoming_only: true,
  });
};

// ============================================================
// HOOKS DE MUTATION
// ============================================================

/**
 * S'inscrire à un événement.
 * Délègue à useEventParticipants pour la logique complète.
 * Ce hook est un alias simplifié pour l'Agenda MVP.
 *
 * @example
 * const { mutate: register } = useRegisterToEventSimple();
 * register({ eventId: "...", userId: "...", role: "visitor" });
 */
export const useRegisterToEventSimple = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
      role = "visitor",
      cosplayId,
    }: {
      eventId: string;
      userId: string;
      role?: string;
      /** cosplay_id: référence vers cosplay_plans (nouveau système Visual Line-Up) */
      cosplayId?: string | null;
    }) => {
      const insertData: {
        event_id: string;
        user_id: string;
        role: string;
        cosplay_id?: string;
      } = {
        event_id: eventId,
        user_id: userId,
        role,
      };

      if (cosplayId) {
        insertData.cosplay_id = cosplayId;
      }

      const { data, error } = await supabase
        .from("event_participants")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-participants", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["is-registered", variables.eventId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations", variables.userId] });
      toast.success("🎉 Inscription confirmée !");
    },
    onError: (error: Error) => {
      console.error("[useRegisterToEventSimple] Erreur:", error);
      // Gestion de l'erreur de doublon (unique constraint)
      if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
        toast.error("Tu es déjà inscrit(e) à cet événement.");
      } else {
        toast.error("Erreur lors de l'inscription. Réessaie.");
      }
    },
  });
};

/**
 * Met à jour la ville épinglée (pinned_city) d'un profil utilisateur.
 * Utilisé par le Hub Local de l'Agenda pour sauvegarder la préférence de ville.
 *
 * @example
 * const { mutate: updateCity } = useUpdatePinnedCity();
 * updateCity({ profileId: user.id, city: "Paris" });
 */
export const useUpdatePinnedCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      city,
    }: {
      profileId: string;
      city: string | null;
    }) => {
      // Cast `as any` nécessaire car le client Supabase typé ne connaît pas encore
      // pinned_city tant que les types générés ne sont pas régénérés depuis la DB.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("profiles")
        .update({ pinned_city: city })
        .eq("id", profileId)
        .select("id, pinned_city")
        .single();

      if (error) throw error;
      return data as { id: string; pinned_city: string | null };
    },
    onSuccess: (data, variables) => {
      // Invalider le cache du profil pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: ["profile", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["cosplayer-profile", variables.profileId] });

      if (variables.city) {
        toast.success(`📍 Ville épinglée : ${variables.city}`);
      } else {
        toast.success("📍 Ville épinglée supprimée.");
      }
    },
    onError: (error: Error) => {
      console.error("[useUpdatePinnedCity] Erreur:", error);
      toast.error("Impossible de sauvegarder la ville. Réessaie.");
    },
  });
};

/**
 * Récupère la ville épinglée d'un profil.
 * Utilisé pour initialiser le filtre de ville dans l'Agenda.
 */
export const usePinnedCity = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ["pinned-city", profileId],
    queryFn: async () => {
      if (!profileId) return null;

      // Cast `as any` nécessaire car le client Supabase typé ne connaît pas encore
      // pinned_city tant que les types générés ne sont pas régénérés depuis la DB.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("pinned_city")
        .eq("id", profileId)
        .single();

      if (error) throw error;
      return (data as { pinned_city: string | null } | null)?.pinned_city ?? null;
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 10, // 10 minutes (donnée peu volatile)
  });
};
