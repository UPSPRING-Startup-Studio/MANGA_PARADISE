import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// =====================================================
// TYPES
// =====================================================

export type SquadMode = "squad" | "shooting" | "concours";
export type SlotRoleType = "character" | "staff" | "generic";

export interface Squad {
  id: string;
  name: string;
  description: string | null;
  target_event_id: string | null;
  created_by: string;
  created_at: string;
  // New v2 fields
  mode: SquadMode;
  is_private: boolean;
  // Joined / computed data
  member_count?: number;
  creator_username?: string;
  creator_avatar_url?: string | null;
}

export interface SquadSlot {
  id: string;
  squad_id: string;
  title: string;
  role_type: SlotRoleType;
  requirements: string | null;
  created_at: string;
}

export interface SquadMember {
  id: string;
  squad_id: string;
  user_id: string;
  slot_id: string | null;
  cosplay_plan_id: string | null;
  status: "pending" | "accepted";
  created_at: string;
  // Joined data
  username?: string;
  avatar_url?: string | null;
  character_name?: string;
}

/** Input for a single slot to be created alongside the squad */
export interface CreateSlotInput {
  title: string;
  role_type: SlotRoleType;
  requirements?: string;
}

export interface CreateSquadInput {
  name: string;
  description?: string;
  target_event_id: string;
  created_by: string;
  // New v2 fields
  mode: SquadMode;
  is_private: boolean;
  slots: CreateSlotInput[];
}

export interface JoinSquadInput {
  squad_id: string;
  user_id: string;
  /** null = "visiteur civil" (no cosplay) */
  cosplay_plan_id: string | null;
  /** The specific slot the user is applying to */
  slot_id?: string | null;
}

/** Enriched Squad with its slots pre-loaded (used in the Hub) */
export interface SquadWithSlots extends Squad {
  slots: SquadSlot[];
}

// =====================================================
// QUERY: Fetch squads for a specific event
// =====================================================

/**
 * Fetches all squads targeting a specific event,
 * enriched with member count and creator info.
 */
export const useSquadsByEvent = (targetEventId: string | null | undefined) => {
  return useQuery({
    queryKey: ["squads", "by-event", targetEventId],
    queryFn: async (): Promise<SquadWithSlots[]> => {
      if (!targetEventId) return [];

      // TODO: Replace (supabase as any) with typed client once migration is applied
      const { data: squadsData, error: squadsError } = await (supabase as any)
        .from("squads")
        .select(
          `
          id,
          name,
          description,
          target_event_id,
          created_by,
          created_at,
          mode,
          is_private,
          profiles:created_by (
            username,
            avatar_url
          )
        `
        )
        .eq("target_event_id", targetEventId)
        .eq("is_private", false)
        .order("created_at", { ascending: false });

      if (squadsError) {
        // Table may not exist yet — degrade gracefully
        return [];
      }

      if (!squadsData || squadsData.length === 0) return [];

      const squadIds = squadsData.map((s: any) => s.id);

      // Fetch member counts for all squads in one query
      const { data: membersData } = await (supabase as any)
        .from("squad_members")
        .select("squad_id")
        .in("squad_id", squadIds)
        .eq("status", "accepted");

      // membersError is non-critical — continue with empty counts

      // Fetch all slots for all squads in one query
      const { data: slotsData } = await (supabase as any)
        .from("squad_slots")
        .select("id, squad_id, title, role_type, requirements, created_at")
        .in("squad_id", squadIds)
        .order("created_at", { ascending: true });

      // Build lookup maps
      const memberCountMap: Record<string, number> = {};
      (membersData || []).forEach((m: any) => {
        memberCountMap[m.squad_id] = (memberCountMap[m.squad_id] || 0) + 1;
      });

      const slotsMap: Record<string, SquadSlot[]> = {};
      (slotsData || []).forEach((slot: any) => {
        if (!slotsMap[slot.squad_id]) slotsMap[slot.squad_id] = [];
        slotsMap[slot.squad_id].push(slot as SquadSlot);
      });

      // Merge data
      return squadsData.map((squad: any) => {
        const profile = Array.isArray(squad.profiles)
          ? squad.profiles[0]
          : squad.profiles;

        return {
          id: squad.id,
          name: squad.name,
          description: squad.description,
          target_event_id: squad.target_event_id,
          created_by: squad.created_by,
          created_at: squad.created_at,
          mode: (squad.mode ?? "squad") as SquadMode,
          is_private: squad.is_private ?? false,
          member_count: memberCountMap[squad.id] || 0,
          creator_username: profile?.username ?? "Inconnu",
          creator_avatar_url: profile?.avatar_url ?? null,
          slots: slotsMap[squad.id] ?? [],
        } as SquadWithSlots;
      });
    },
    enabled: !!targetEventId,
    staleTime: 30000, // Cache for 30 seconds
  });
};

// =====================================================
// QUERY: Fetch members of a specific squad
// =====================================================

export const useSquadMembers = (squadId: string | undefined) => {
  return useQuery({
    queryKey: ["squad-members", squadId],
    queryFn: async (): Promise<SquadMember[]> => {
      if (!squadId) return [];

      // TODO: Replace (supabase as any) with typed client once migration is applied
      const { data, error } = await (supabase as any)
        .from("squad_members")
        .select(
          `
          squad_id,
          user_id,
          cosplay_plan_id,
          status,
          created_at,
          profiles:user_id (
            username,
            avatar_url
          ),
          cosplay_plans:cosplay_plan_id (
            character_name
          )
        `
        )
        .eq("squad_id", squadId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching squad members:", error);
        throw error;
      }

      return (data || []).map((m: any) => {
        const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        const plan = Array.isArray(m.cosplay_plans)
          ? m.cosplay_plans[0]
          : m.cosplay_plans;

        return {
          squad_id: m.squad_id,
          user_id: m.user_id,
          cosplay_plan_id: m.cosplay_plan_id,
          status: m.status as "pending" | "accepted",
          created_at: m.created_at,
          username: profile?.username ?? "Inconnu",
          avatar_url: profile?.avatar_url ?? null,
          character_name: plan?.character_name ?? undefined,
        } as SquadMember;
      });
    },
    enabled: !!squadId,
  });
};

// =====================================================
// MUTATION: Create a new squad
// =====================================================

export const useCreateSquad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSquadInput): Promise<Squad> => {
      // ── STEP 1: Insert the squad with new v2 fields ──────────────────────────
      // TODO: Replace (supabase as any) with typed client once migration is applied
      const { data: squadData, error: squadError } = await (supabase as any)
        .from("squads")
        .insert({
          name: input.name.trim(),
          description: input.description?.trim() || null,
          target_event_id: input.target_event_id,
          created_by: input.created_by,
          mode: input.mode,
          is_private: input.is_private,
        })
        .select()
        .single();

      if (squadError) {
        console.error("Error creating squad:", squadError);
        throw squadError;
      }

      const squadId: string = squadData.id;

      // ── STEP 2: Bulk-insert squad_slots ─────────────────────────────────────
      if (input.slots && input.slots.length > 0) {
        const slotsPayload = input.slots.map((slot) => ({
          squad_id: squadId,
          title: slot.title.trim(),
          role_type: slot.role_type,
          requirements: slot.requirements?.trim() || null,
        }));

        const { error: slotsError } = await (supabase as any)
          .from("squad_slots")
          .insert(slotsPayload);

        if (slotsError) {
          console.error("Error creating squad slots:", slotsError);
          // Non-blocking: squad is created, slots failed — log and continue
          // In a future iteration, wrap in a DB transaction / RPC
        }
      }

      // ── STEP 3: Auto-add the creator as an accepted member ──────────────────
      const { error: memberError } = await (supabase as any)
        .from("squad_members")
        .insert({
          squad_id: squadId,
          user_id: input.created_by,
          status: "accepted",
          // slot_id is null: the leader is not occupying a specific slot
        });

      if (memberError) {
        console.error("Error adding creator as member:", memberError);
        // Non-blocking: squad is created, just log the error
      }

      return squadData as Squad;
    },
    onSuccess: (data) => {
      // Invalidate squads list for this event
      queryClient.invalidateQueries({
        queryKey: ["squads", "by-event", data.target_event_id],
      });
      // Also invalidate slots cache if it exists
      queryClient.invalidateQueries({
        queryKey: ["squad-slots", data.id],
      });
      toast.success("🎉 Escouade fondée avec succès !");
    },
    onError: (error: any) => {
      console.error("Error in useCreateSquad:", error);
      toast.error(
        `Erreur lors de la création : ${error.message || "Erreur inconnue"}`
      );
    },
  });
};

// =====================================================
// QUERY: Fetch slots for a specific squad
// =====================================================

export const useSquadSlots = (squadId: string | undefined) => {
  return useQuery({
    queryKey: ["squad-slots", squadId],
    queryFn: async (): Promise<SquadSlot[]> => {
      if (!squadId) return [];

      const { data, error } = await (supabase as any)
        .from("squad_slots")
        .select("id, squad_id, title, role_type, requirements, created_at")
        .eq("squad_id", squadId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching squad slots:", error);
        throw error;
      }

      return (data || []) as SquadSlot[];
    },
    enabled: !!squadId,
  });
};

// =====================================================
// QUERY: Check if the current user is already a member of any squad for an event
// Returns the squad_member entry (with squad info) if found, null otherwise
// =====================================================

export interface UserSquadMembership {
  squad_id: string;
  user_id: string;
  cosplay_plan_id: string | null;
  status: "pending" | "accepted";
  created_at: string;
  squad: Squad;
}

export const useUserSquadForEvent = (
  userId: string | null | undefined,
  targetEventId: string | null | undefined
) => {
  return useQuery({
    queryKey: ["user-squad-membership", userId, targetEventId],
    queryFn: async (): Promise<UserSquadMembership | null> => {
      if (!userId || !targetEventId) return null;

      // TODO: Replace (supabase as any) with typed client once migration is applied
      const { data, error } = await (supabase as any)
        .from("squad_members")
        .select(
          `
          squad_id,
          user_id,
          cosplay_plan_id,
          status,
          created_at,
          squads:squad_id (
            id,
            name,
            description,
            target_event_id,
            created_by,
            created_at
          )
        `
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        // If no row found, maybeSingle returns null without error
        console.error("Error checking user squad membership:", error);
        throw error;
      }

      if (!data) return null;

      // Filter: only return if the squad targets the right event
      const squad = Array.isArray(data.squads) ? data.squads[0] : data.squads;
      if (!squad || squad.target_event_id !== targetEventId) return null;

      return {
        squad_id: data.squad_id,
        user_id: data.user_id,
        cosplay_plan_id: data.cosplay_plan_id,
        status: data.status as "pending" | "accepted",
        created_at: data.created_at,
        squad: squad as Squad,
      };
    },
    enabled: !!userId && !!targetEventId,
    staleTime: 15000,
  });
};

// =====================================================
// MUTATION: Accept a pending member (leader only)
// =====================================================

export const useAcceptMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      squadId,
      userId,
    }: {
      squadId: string;
      userId: string;
    }) => {
      // TODO: Replace (supabase as any) with typed client once migration is applied
      const { data, error } = await (supabase as any)
        .from("squad_members")
        .update({ status: "accepted" })
        .eq("squad_id", squadId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error accepting member:", error);
        throw error;
      }

      return { ...data, squadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["squad-members", data.squadId] });
      queryClient.invalidateQueries({ queryKey: ["squads", "by-event"] });
      toast.success("✅ Membre accepté dans l'escouade !");
    },
    onError: (error: any) => {
      console.error("Error in useAcceptMember:", error);
      toast.error(error.message || "Erreur lors de l'acceptation");
    },
  });
};

// =====================================================
// MUTATION: Decline / remove a pending member (leader only)
// =====================================================

export const useDeclineMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      squadId,
      userId,
    }: {
      squadId: string;
      userId: string;
    }) => {
      // TODO: Replace (supabase as any) with typed client once migration is applied
      const { error } = await (supabase as any)
        .from("squad_members")
        .delete()
        .eq("squad_id", squadId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error declining member:", error);
        throw error;
      }

      return { squadId, userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["squad-members", data.squadId] });
      queryClient.invalidateQueries({ queryKey: ["squads", "by-event"] });
      toast.success("Candidature refusée.");
    },
    onError: (error: any) => {
      console.error("Error in useDeclineMember:", error);
      toast.error(error.message || "Erreur lors du refus");
    },
  });
};

// =====================================================
// MUTATION: Leave a squad (member) OR dissolve it (leader)
// =====================================================

export const useLeaveSquad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      squadId,
      userId,
      isLeader,
      targetEventId,
    }: {
      squadId: string;
      userId: string;
      isLeader: boolean;
      targetEventId: string | null;
    }) => {
      if (isLeader) {
        // Leader dissolves the squad: delete the squad (cascade deletes members)
        // TODO: Replace (supabase as any) with typed client once migration is applied
        const { error } = await (supabase as any)
          .from("squads")
          .delete()
          .eq("id", squadId)
          .eq("created_by", userId);

        if (error) {
          console.error("Error dissolving squad:", error);
          throw error;
        }
      } else {
        // Regular member leaves: delete their membership entry
        const { error } = await (supabase as any)
          .from("squad_members")
          .delete()
          .eq("squad_id", squadId)
          .eq("user_id", userId);

        if (error) {
          console.error("Error leaving squad:", error);
          throw error;
        }
      }

      return { squadId, userId, isLeader, targetEventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["squad-members", data.squadId] });
      queryClient.invalidateQueries({ queryKey: ["squads", "by-event", data.targetEventId] });
      queryClient.invalidateQueries({ queryKey: ["user-squad-membership", data.userId] });

      if (data.isLeader) {
        toast.success("💥 Escouade dissoute.");
      } else {
        toast.success("Tu as quitté l'escouade.");
      }
    },
    onError: (error: any) => {
      console.error("Error in useLeaveSquad:", error);
      toast.error(error.message || "Erreur lors de l'action");
    },
  });
};

// =====================================================
// MUTATION: Join an existing squad (apply)
// =====================================================

export const useJoinSquad = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: JoinSquadInput) => {
      // Check if user already applied to this specific slot (if slot_id provided)
      // or to the squad globally (legacy check)
      // TODO: Replace (supabase as any) with typed client once migration is applied
      if (input.slot_id) {
        const { data: existingSlot, error: slotCheckError } = await (supabase as any)
          .from("squad_members")
          .select("id, status")
          .eq("slot_id", input.slot_id)
          .eq("user_id", input.user_id)
          .maybeSingle();

        if (slotCheckError) throw slotCheckError;

        if (existingSlot) {
          throw new Error(
            existingSlot.status === "accepted"
              ? "Tu occupes déjà cette place !"
              : "Tu as déjà postulé à cette place."
          );
        }
      } else {
        // Legacy: check global squad membership
        const { data: existing, error: checkError } = await (supabase as any)
          .from("squad_members")
          .select("squad_id, user_id, status")
          .eq("squad_id", input.squad_id)
          .eq("user_id", input.user_id)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          throw new Error(
            existing.status === "accepted"
              ? "Tu es déjà membre de cette escouade !"
              : "Ta candidature est déjà en attente d'approbation."
          );
        }
      }

      // Insert the membership application
      // cosplay_plan_id can be null ("visiteur civil")
      const { data, error } = await (supabase as any)
        .from("squad_members")
        .insert({
          squad_id: input.squad_id,
          user_id: input.user_id,
          cosplay_plan_id: input.cosplay_plan_id ?? null,
          slot_id: input.slot_id ?? null,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Error joining squad:", error);
        throw error;
      }

      return { ...data, squad_id: input.squad_id } as SquadMember & { squad_id: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["squad-members", data.squad_id],
      });
      queryClient.invalidateQueries({ queryKey: ["squads", "by-event"] });
      toast.success("✅ Candidature envoyée ! Le leader va examiner ta demande.");
    },
    onError: (error: any) => {
      console.error("Error in useJoinSquad:", error);
      toast.error(error.message || "Erreur lors de la candidature");
    },
  });
};
