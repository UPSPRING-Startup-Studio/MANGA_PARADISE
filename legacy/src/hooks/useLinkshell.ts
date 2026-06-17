import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

export interface ChatRoom {
  id: string;
  type: 'event' | 'guild' | 'dm';
  related_id: string | null;
  name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'location' | 'system';
  metadata: Record<string, unknown>;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  last_read_at: string;
  joined_at: string;
  profile?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const useChatRooms = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chat-rooms", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all rooms user participates in
      const { data: rooms, error } = await supabase
        .from("chat_rooms")
        .select(`
          *,
          chat_participants!inner(user_id, last_read_at)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get last message and unread count for each room
      const roomsWithDetails = await Promise.all(
        (rooms || []).map(async (room) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from("chat_messages")
            .select("*")
            .eq("room_id", room.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const participant = room.chat_participants?.find(
            (p: { user_id: string }) => p.user_id === user.id
          );
          const lastReadAt = participant?.last_read_at || room.created_at;

          const { count: unreadCount } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id)
            .gt("created_at", lastReadAt)
            .neq("sender_id", user.id);

          return {
            ...room,
            last_message: lastMessage || undefined,
            unread_count: unreadCount || 0,
          } as ChatRoom;
        })
      );

      return roomsWithDetails;
    },
    enabled: !!user,
  });
};

export const useChatMessages = (roomId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["chat-messages", roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set(data?.map((m) => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", senderIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      return (data || []).map((message) => ({
        ...message,
        message_type: message.message_type as ChatMessage['message_type'],
        sender: profileMap.get(message.sender_id),
      })) as ChatMessage[];
    },
    enabled: !!roomId && !!user,
  });

  // Real-time subscription
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Fetch sender profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .single();

          const messageWithSender = {
            ...newMessage,
            sender: profile || undefined,
          };

          queryClient.setQueryData(
            ["chat-messages", roomId],
            (old: ChatMessage[] | undefined) => {
              if (!old) return [messageWithSender];
              // Avoid duplicates
              if (old.some((m) => m.id === newMessage.id)) return old;
              return [...old, messageWithSender];
            }
          );

          // Invalidate rooms to update last message
          queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user, queryClient]);

  return query;
};

export const useChatParticipants = (roomId: string | null) => {
  return useQuery({
    queryKey: ["chat-participants", roomId],
    queryFn: async () => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from("chat_participants")
        .select("*")
        .eq("room_id", roomId);

      if (error) throw error;

      // Fetch profiles
      const userIds = data?.map((p) => p.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      return (data || []).map((participant) => ({
        ...participant,
        profile: profileMap.get(participant.user_id),
      })) as ChatParticipant[];
    },
    enabled: !!roomId,
  });
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      content,
      messageType = "text",
      metadata = {},
    }: {
      roomId: string;
      content: string;
      messageType?: "text" | "image" | "location";
      metadata?: Record<string, unknown>;
    }): Promise<ChatMessage> => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content,
          message_type: messageType,
          metadata: metadata,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        room_id: data.room_id,
        sender_id: data.sender_id,
        content: data.content,
        message_type: data.message_type as ChatMessage['message_type'],
        metadata: (data.metadata || {}) as Record<string, unknown>,
        created_at: data.created_at,
      } as ChatMessage;
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");
    },
  });
};

export const useMarkAsRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("chat_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });
};

export const useLinkshellState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);

  const openLinkshell = useCallback(() => setIsOpen(true), []);
  const closeLinkshell = useCallback(() => {
    setIsOpen(false);
    setSelectedRoom(null);
  }, []);
  const selectRoom = useCallback((room: ChatRoom) => setSelectedRoom(room), []);
  const backToList = useCallback(() => setSelectedRoom(null), []);

  return {
    isOpen,
    selectedRoom,
    openLinkshell,
    closeLinkshell,
    selectRoom,
    backToList,
  };
};
