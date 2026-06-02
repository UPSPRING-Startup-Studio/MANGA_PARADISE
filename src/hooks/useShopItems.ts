import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  type: "DIGITAL" | "PHYSICAL" | "EVENT";
  tags: string[];
  image_url: string | null;
  stock: number | null;
  is_available: boolean;
  partner_name: string | null;
  partner_location: string | null;
  created_at: string;
}

export interface ShopOrder {
  id: string;
  user_id: string;
  item_id: string | null;
  quantity: number;
  total_price: number;
  status: string;
  delivery_info: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

// Fetch all shop items
export const useShopItems = (category?: string) => {
  return useQuery({
    queryKey: ["shop-items", category],
    queryFn: async () => {
      let query = supabase
        .from("shop_items")
        .select("*")
        .order("price", { ascending: true });

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ShopItem[];
    },
  });
};

// Fetch single shop item
export const useShopItem = (itemId: string | undefined) => {
  return useQuery({
    queryKey: ["shop-item", itemId],
    queryFn: async () => {
      if (!itemId) return null;

      const { data, error } = await supabase
        .from("shop_items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (error) throw error;
      return data as ShopItem;
    },
    enabled: !!itemId,
  });
};

// Fetch user's orders
export const useUserOrders = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["shop-orders", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("shop_orders")
        .select("*, item:item_id(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Purchase an item
export const usePurchaseItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      itemId,
      itemPrice,
      userCoins,
    }: {
      userId: string;
      itemId: string;
      itemPrice: number;
      userCoins: number;
    }) => {
      // Check if user has enough coins
      if (userCoins < itemPrice) {
        throw new Error(`Il te manque ${itemPrice - userCoins} OTK pour cet article.`);
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("shop_orders")
        .insert({
          user_id: userId,
          item_id: itemId,
          quantity: 1,
          total_price: itemPrice,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Deduct coins from user
      const { error: deductError } = await supabase
        .from("profiles")
        .update({ otk_coins: userCoins - itemPrice })
        .eq("id", userId);

      if (deductError) throw deductError;

      // Log transaction
      const { error: transactionError } = await supabase
        .from("otk_transactions")
        .insert({
          user_id: userId,
          amount: -itemPrice,
          transaction_type: "purchase",
          description: `Achat boutique`,
        });

      if (transactionError) {
        console.error("Transaction log error:", transactionError);
      }

      // Update order to completed
      await supabase
        .from("shop_orders")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", order.id);

      return order;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["shop-items"] });
      toast.success("Achat effectué ! 🎉", {
        description: "Tu recevras les détails par email.",
      });
    },
    onError: (error: Error) => {
      toast.error("Échec de l'achat", {
        description: error.message,
      });
    },
  });
};

// Category helpers
export const shopCategories = [
  { value: "all", label: "Tout", emoji: "🛒" },
  { value: "streaming", label: "Streaming", emoji: "📺" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "cinema", label: "Cinéma", emoji: "🍿" },
  { value: "event", label: "Événements", emoji: "🎫" },
  { value: "local", label: "Partenaires", emoji: "📍" },
];

export const getTypeLabel = (type: string) => {
  switch (type) {
    case "DIGITAL":
      return { label: "Digital", emoji: "💻", color: "bg-turquoise/20 text-turquoise" };
    case "PHYSICAL":
      return { label: "Physique", emoji: "📦", color: "bg-accent/20 text-accent" };
    case "EVENT":
      return { label: "E-Ticket", emoji: "🎟️", color: "bg-sakura/20 text-sakura" };
    default:
      return { label: "Autre", emoji: "📋", color: "bg-muted text-muted-foreground" };
  }
};
