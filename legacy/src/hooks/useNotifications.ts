import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'EVENT_REMINDER'
  | 'LIKE'
  | 'COMMENT'
  | 'SYSTEM'
  | 'PHOTO_TAG'
  | 'PHOTO_TAG_ACCEPTED'
  | 'PHOTO_TAG_DECLINED';

export interface Notification {
  id: string;
  user_id: string;
  sender_id: string | null;
  type: NotificationType;
  content: string;
  related_link: string | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

// Fetch user's notifications
export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as unknown as Notification[];
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Count unread notifications
export const useUnreadNotificationCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["notifications-unread-count", userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
};

// Mark single notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId, userId }: { notificationId: string; userId: string }) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) throw error;
      return { notificationId, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", variables.userId] });
    },
  });
};

// Mark all notifications as read
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", userId] });
    },
  });
};

// Delete notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId, userId }: { notificationId: string; userId: string }) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) throw error;
      return { notificationId, userId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", variables.userId] });
    },
  });
};
