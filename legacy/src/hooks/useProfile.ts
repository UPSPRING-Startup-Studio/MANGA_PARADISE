import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  membership_tier: "bronze" | "silver" | "gold" | null;
  otk_coins: number;
  total_otk_earned: number;
  level: number;
  xp: number;
  is_subscription_active: boolean | null;
  // New profile fields
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  birth_date: string | null;
  city: string | null;
  phone: string | null;
  role_function: string | null;
  otaku_class: string | null;
  sponsor_id: string | null;
  favorite_manga: string | null;
  favorite_character: string | null;
  favorite_activities: string[] | null;
  occupation_status: string | null;
  is_gamer_mode_active: boolean | null;
  is_otaku_mode_active: boolean | null;
  is_creator_profile_active: boolean | null;
  is_cosplayer_mode_active: boolean | null;
  creator_domains: string[] | null;
  creator_experience_level: string | null;
  social_links: Record<string, string> | null;
  cover_image_url: string | null;
  profile_visibility: string | null;
  collaboration_interests: string[] | null;
  inspiration_universes: string[] | null;
  // Membership form fields
  guardian_first_name: string | null;
  guardian_last_name: string | null;
  guardian_relationship: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  guardian_address: string | null;
  health_allergies: string | null;
  health_conditions: string | null;
  health_treatments: string | null;
  image_rights_consent: boolean | null;
  rules_accepted: boolean | null;
  rules_accepted_at: string | null;
  parental_authorization_url: string | null;
  selected_pack: string | null;
  monthly_xp: number | null;
  onboarding_completed: boolean | null;
  // Payment & membership fields
  membership_status: string | null;
  payment_method: string | null;
  referral_count: number | null;
  referral_year: number | null;
  // Partner fields
  partner_company_name: string | null;
  partner_siret: string | null;
  partner_contact_name: string | null;
  partner_status: string | null;
  partner_validated_at: string | null;
  partner_validated_by: string | null;
  // Extended partner fields
  partner_logo_url: string | null;
  partner_category: string | null;
  partner_subcategory: string | null;
  partner_description: string | null;
  partner_website: string | null;
  partner_facebook: string | null;
  partner_instagram: string | null;
  partner_cover_url: string | null;
  partner_legal_form: string | null;
  partner_address: string | null;
  partner_postal_code: string | null;
  partner_city: string | null;
  partner_representative_name: string | null;
  partner_representative_function: string | null;
  partner_admin_email: string | null;
  partner_offers: string[] | null;
  partner_requests: string[] | null;
  partner_convention_status: string | null;
  // Podium lock states
  podium_lock_states: {
    mangaMasterclass?: boolean;
    animeMasterclass?: boolean;
    mangaEnfers?: boolean;
    animeEnfers?: boolean;
  } | null;
  // Character duel
  best_character_id: string | null;
  worst_character_id: string | null;
  // Lifestyle fields for "Mon ADN Otaku"
  otaku_first_manga: string | null;
  otaku_favorite_artist: string | null;
  otaku_japan_destination: string | null;
  otaku_japan_must_buy: string | null;
  otaku_con_activity: string | null;
  otaku_social_nightmare: string | null;
  // Lifestyle fields for "Mon ADN Cosplayer"
  cosplay_style: string | null;
  cosplay_con_crunch: string | null;
  cosplay_nightmare: string | null;
  cosplay_motivation: string | null;
  // Lifestyle fields for "Mon ADN Gamer"
  gamer_favorite_genre: string | null;
  gamer_mobile_vice: string | null;
  gamer_friendship_breaker: string | null;
  gamer_rage_trigger: string | null;
  // Lifestyle fields for "Mon ADN Créatif"
  creative_tool_preference: string | null;
  creative_workflow_vibe: string | null;
  creative_nightmare: string | null;
  creative_project_habit: string | null;
  // Event check-in permission
  allow_event_checkin: boolean | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  xp_reward: number | null;
  otk_reward: number | null;
  rarity: string | null;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number | null;
  otk_reward: number | null;
  quest_type: string | null;
  target_count: number | null;
}

export interface UserQuest {
  id: string;
  quest_id: string;
  progress: number | null;
  completed_at: string | null;
  quests: Quest;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as unknown as Profile);
    }
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    console.log("DEBUG PROFILE - Updating profile for user:", user.id);
    console.log("DEBUG PROFILE - Updates:", updates);

    // Use upsert to create or update the profile
    const { error } = await supabase
      .from("profiles")
      .upsert({ 
        id: user.id,
        ...updates, 
        updated_at: new Date().toISOString() 
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error("DEBUG PROFILE - Upsert error:", error);
      console.error("DEBUG PROFILE - Error code:", error.code);
      console.error("DEBUG PROFILE - Error message:", error.message);
      console.error("DEBUG PROFILE - Error details:", error.details);
    } else {
      console.log("DEBUG PROFILE - Upsert successful");
    }

    if (!error) {
      await fetchProfile();
    }
    return { error };
  };

  return { profile, loading, updateProfile, refetch: fetchProfile };
};

export const useBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
    if (user) {
      fetchUserBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    const { data } = await supabase.from("badges").select("*");
    if (data) setBadges(data as Badge[]);
    setLoading(false);
  };

  const fetchUserBadges = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", user.id);
    
    if (data) setUserBadges(data as unknown as UserBadge[]);
  };

  return { badges, userBadges, loading };
};

export const useQuests = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuests();
    if (user) {
      fetchUserQuests();
    }
  }, [user]);

  const fetchQuests = async () => {
    const { data } = await supabase.from("quests").select("*");
    if (data) setQuests(data as Quest[]);
    setLoading(false);
  };

  const fetchUserQuests = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_quests")
      .select("*, quests(*)")
      .eq("user_id", user.id);
    
    if (data) setUserQuests(data as unknown as UserQuest[]);
  };

  return { quests, userQuests, loading };
};
