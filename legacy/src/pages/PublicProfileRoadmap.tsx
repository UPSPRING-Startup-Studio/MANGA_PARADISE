import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { User, Calendar, ArrowLeft, Share2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicUserRoadmap } from "@/hooks/usePublicUserRoadmap";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PublicRoadmapTimeline } from "@/components/profile/PublicRoadmapTimeline";
import { RoadmapActivity } from "@/hooks/usePublicUserRoadmap";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PublicProfileRoadmap = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch profile by username
  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ["public-profile-roadmap", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("username", username)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  // Check if this is current user's profile
  const isOwnProfile = user?.id === profile?.id;

  // Fetch roadmap activities
  const { data: roadmapActivities, isLoading: roadmapLoading } = usePublicUserRoadmap(profile?.id);

  // Force refresh of roadmap data when profile changes
  useEffect(() => {
    if (profile?.id) {
      console.log("DEBUG PublicProfileRoadmap - Invalidating cache for profile:", profile.id);
      queryClient.invalidateQueries({
        queryKey: ["public-user-roadmap", profile.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-favorites", undefined, profile.id],
      });
    }
  }, [profile?.id, queryClient]);

  // Get current event for favorites management
  const { data: currentEvents } = useQuery({
    queryKey: ["current-events"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(1);

      if (error) throw error;
      return data;
    },
  });

  const currentEventId = currentEvents?.[0]?.id;
  const { toggleFavorite, isToggling } = useUserFavorites(currentEventId);

   // Handle adding activity to visitor's favorites
   const handleAddActivity = (activity: RoadmapActivity) => {
     if (!user) {
       // Redirect to signup instead of just showing error
       toast.error("Crée ton compte pour ajouter des activités à ton programme");
       setTimeout(() => {
         window.location.href = "/nous-rejoindre";
       }, 1500);
       return;
     }

     if (!currentEventId) {
       toast.error("Aucun événement en cours");
       return;
     }

     toggleFavorite(activity.id);
   };

  // Handle sharing roadmap
  const handleShareRoadmap = async () => {
    const shareUrl = window.location.href;
    const shareTitle = `Roadmap de ${displayName} - ${currentEvents?.[0]?.title || "Événement"}`;
    const shareText = `Découvre ma roadmap pour ${currentEvents?.[0]?.title || "l'événement"} ! 🌸`;

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Roadmap partagée ! 🌸");
      } catch (error) {
        // User cancelled or error - do nothing
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Lien copié ! Partage ta roadmap avec ta communauté 🌸");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast.error("Impossible de copier le lien");
      }
    }
  };

   // Update page title and meta tags dynamically
   useEffect(() => {
     if (profile && currentEvents?.[0]) {
       const displayName = profile.display_name || profile.username;
       const eventTitle = currentEvents[0].title;
       
       // Update page title
       document.title = `Roadmap de ${displayName} - Manga Paradise`;
       
       // Update meta tags for sharing
       const updateMetaTag = (name: string, content: string) => {
         let tag = document.querySelector(`meta[name="${name}"]`) || 
                   document.querySelector(`meta[property="${name}"]`);
         if (!tag) {
           tag = document.createElement("meta");
           tag.setAttribute(name.startsWith("og:") ? "property" : "name", name);
           document.head.appendChild(tag);
         }
         tag.setAttribute("content", content);
       };
       
       updateMetaTag("description", `Découvrez la roadmap de ${displayName} pour ${eventTitle} sur Manga Paradise`);
       updateMetaTag("og:title", `Roadmap de ${displayName} - Manga Paradise`);
       updateMetaTag("og:description", `Découvrez la roadmap de ${displayName} pour ${eventTitle}`);
       updateMetaTag("og:type", "profile");
       updateMetaTag("twitter:title", `Roadmap de ${displayName}`);
       updateMetaTag("twitter:description", `Découvrez la roadmap de ${displayName} pour ${eventTitle}`);
     }
   }, [profile, currentEvents]);

  // Handle loading
  if (profileLoading || roadmapLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-32 w-full rounded-xl mb-8 bg-white/50" />
          <Skeleton className="h-64 w-full rounded-xl bg-white/50" />
        </div>
        <Footer />
      </div>
    );
  }

  // Handle not found
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <User className="w-16 h-16 text-mp-ink-muted mb-4" />
          <h1 className="text-2xl font-display text-white mb-2">Profil introuvable</h1>
          <p className="text-mp-ink-muted">L'utilisateur @{username} n'existe pas.</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName = profile.display_name || profile.username || "Membre";

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />

      <div className="relative pt-20 pb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--mp-primary))]/10 via-transparent to-transparent" />

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mb-6 text-mp-ink-muted hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6 mb-8"
          >
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center relative",
                "bg-gradient-to-br from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))]",
                "border-4 border-slate-950 shadow-xl shadow-[hsl(var(--mp-primary))]/20 overflow-hidden"
              )}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-display text-white mb-1">{displayName}</h1>
              <p className="text-mp-ink-muted">@{profile.username}</p>
              {isOwnProfile && (
                <p className="text-xs text-[hsl(var(--mp-primary))] mt-2">C'est ton profil</p>
              )}
            </div>

            {/* Share Button - Only for own profile */}
            {isOwnProfile && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleShareRoadmap}
                  className={cn(
                    "bg-gradient-to-r from-[hsl(var(--mp-primary))] to-pink-500",
                    "hover:from-[hsl(var(--mp-primary))]/90 hover:to-pink-500/90",
                    "text-white shadow-[0_0_15px_rgba(255,0,127,0.3)]",
                    "hover:shadow-[0_0_25px_rgba(255,0,127,0.5)]",
                    "transition-all duration-300"
                  )}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager ma Roadmap
                </Button>
              </motion.div>
            )}
          </motion.div>

          <Card className="bg-black/40 backdrop-blur-md border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-[hsl(var(--mp-primary))]" />
              <div>
                <h2 className="text-xl font-display text-white">
                  {isOwnProfile ? "Mon Programme" : `Programme de ${displayName}`}
                </h2>
                <p className="text-sm text-mp-ink-muted">
                  {currentEvents?.[0]?.title || "Événement en cours"}
                </p>
              </div>
            </div>

            <PublicRoadmapTimeline
              activities={roadmapActivities || []}
              isLoading={roadmapLoading}
              isOwnProfile={isOwnProfile}
              onAddActivity={!isOwnProfile && user ? handleAddActivity : undefined}
              eventId={currentEventId}
              username={profile.username}
            />
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PublicProfileRoadmap;
