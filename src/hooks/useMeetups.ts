import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export interface Meetup {
  id: string;
  title: string;
  theme: string;
  location: string;
  start_time: string;
  max_participants: number;
  description: string | null;
  cover_image: string | null;
  organizer_id: string;
  event_id: string | null;
  current_participants: number;
  status: string;
  created_at: string;
  organizer?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
  participants?: {
    user_id: string;
    profile?: {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  }[];
  isJoined?: boolean;
}

export interface CreateMeetupData {
  title: string;
  theme: string;
  location: string;
  start_time: string;
  max_participants: number;
  description?: string;
  cover_image?: string;
  event_id?: string;
}

export function useMeetups(eventId?: string) {
  const { user } = useAuth();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchMeetups = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("meetups")
        .select(`
          *,
          organizer:profiles!meetups_organizer_id_fkey(id, display_name, avatar_url, username),
          participants:meetup_participants(
            user_id,
            profile:profiles(id, display_name, avatar_url)
          )
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const meetupsWithJoinStatus = (data || []).map((meetup: any) => ({
        ...meetup,
        isJoined: user 
          ? meetup.participants?.some((p: any) => p.user_id === user.id) 
          : false,
      }));

      setMeetups(meetupsWithJoinStatus);
    } catch {
      // Table may not exist — degrade gracefully, no user-facing error
    } finally {
      setIsLoading(false);
    }
  };

  const createMeetup = async (data: CreateMeetupData): Promise<Meetup | null> => {
    if (!user) {
      toast.error("Tu dois être connecté pour créer un meetup");
      return null;
    }

    try {
      // Create the meetup
      const { data: newMeetup, error: meetupError } = await supabase
        .from("meetups")
        .insert({
          title: data.title,
          theme: data.theme,
          location: data.location,
          start_time: data.start_time,
          max_participants: data.max_participants,
          description: data.description || null,
          cover_image: data.cover_image || null,
          organizer_id: user.id,
          event_id: data.event_id || null,
        })
        .select()
        .single();

      if (meetupError) throw meetupError;

      // Auto-join the organizer as first participant
      const { error: participantError } = await supabase
        .from("meetup_participants")
        .insert({
          meetup_id: newMeetup.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      // Refresh the list
      await fetchMeetups();

      return newMeetup;
    } catch (error) {
      console.error("Error creating meetup:", error);
      toast.error("Erreur lors de la création du meetup");
      return null;
    }
  };

  const joinMeetup = async (meetupId: string) => {
    if (!user) {
      toast.error("Tu dois être connecté pour rejoindre un meetup");
      return;
    }

    try {
      const { error } = await supabase
        .from("meetup_participants")
        .insert({
          meetup_id: meetupId,
          user_id: user.id,
        });

      if (error) throw error;

      // Update local state
      setMeetups((prev) =>
        prev.map((m) =>
          m.id === meetupId
            ? {
                ...m,
                isJoined: true,
                current_participants: m.current_participants + 1,
              }
            : m
        )
      );

      toast.success("Tu as rejoint le meetup ! 🎉");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Tu participes déjà à ce meetup");
      } else {
        console.error("Error joining meetup:", error);
        toast.error("Erreur lors de l'inscription");
      }
    }
  };

  const leaveMeetup = async (meetupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("meetup_participants")
        .delete()
        .eq("meetup_id", meetupId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update local state
      setMeetups((prev) =>
        prev.map((m) =>
          m.id === meetupId
            ? {
                ...m,
                isJoined: false,
                current_participants: Math.max(0, m.current_participants - 1),
              }
            : m
        )
      );

      toast.success("Tu as quitté le meetup");
    } catch (error) {
      console.error("Error leaving meetup:", error);
      toast.error("Erreur lors de la désinscription");
    }
  };

  useEffect(() => {
    fetchMeetups();
  }, [eventId, user?.id]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("meetups-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetups",
        },
        () => {
          fetchMeetups();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetup_participants",
        },
        () => {
          fetchMeetups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return {
    meetups,
    isLoading,
    createMeetup,
    joinMeetup,
    leaveMeetup,
    refetch: fetchMeetups,
  };
}
