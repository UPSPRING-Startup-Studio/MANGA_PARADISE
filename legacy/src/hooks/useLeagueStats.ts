import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface League {
  id: string;
  name: string;
  slug: string;
  min_quests: number;
  monthly_rent: number;
  color: string;
  icon: string;
  rank_order: number;
}

export interface UserLeagueStats {
  id: string;
  user_id: string;
  quests_completed_this_month: number;
  current_league_id: string | null;
  month_year: string;
  last_updated: string;
  leagues?: League;
}

export const useLeagueStats = () => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [userStats, setUserStats] = useState<UserLeagueStats | null>(null);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [nextLeague, setNextLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (user && leagues.length > 0) {
      fetchUserStats();
    }
  }, [user, leagues]);

  const fetchLeagues = async () => {
    const { data, error } = await supabase
      .from("leagues")
      .select("*")
      .order("rank_order", { ascending: true });

    if (!error && data) {
      setLeagues(data as League[]);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    const currentMonthYear = new Date().toISOString().slice(0, 7);

    // Try to get existing stats for this month
    let { data, error } = await supabase
      .from("user_league_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("month_year", currentMonthYear)
      .maybeSingle();

    // If no stats exist for this month, create them
    if (!data && !error) {
      const defaultLeague = leagues.find(l => l.rank_order === 1);
      const { data: newStats, error: insertError } = await supabase
        .from("user_league_stats")
        .insert({
          user_id: user.id,
          quests_completed_this_month: 0,
          current_league_id: defaultLeague?.id,
          month_year: currentMonthYear
        })
        .select()
        .single();

      if (!insertError && newStats) {
        data = newStats;
      }
    }

    if (data) {
      setUserStats(data as UserLeagueStats);
      
      // Find current and next league
      const current = leagues.find(l => l.id === data.current_league_id);
      setCurrentLeague(current || leagues[0]);
      
      const nextIdx = leagues.findIndex(l => l.id === data.current_league_id) + 1;
      setNextLeague(nextIdx < leagues.length ? leagues[nextIdx] : null);
    }

    setLoading(false);
  };

  // Calculate days until end of month
  const getDaysUntilEndOfMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Calculate progress to next league
  const getProgressToNextLeague = () => {
    if (!nextLeague || !userStats) return 100;
    const questsNeeded = nextLeague.min_quests;
    const questsDone = userStats.quests_completed_this_month;
    return Math.min((questsDone / questsNeeded) * 100, 100);
  };

  const getQuestsRemaining = () => {
    if (!nextLeague || !userStats) return 0;
    return Math.max(nextLeague.min_quests - userStats.quests_completed_this_month, 0);
  };

  return {
    leagues,
    userStats,
    currentLeague,
    nextLeague,
    loading,
    daysRemaining: getDaysUntilEndOfMonth(),
    progressPercent: getProgressToNextLeague(),
    questsRemaining: getQuestsRemaining(),
    refetch: fetchUserStats
  };
};
