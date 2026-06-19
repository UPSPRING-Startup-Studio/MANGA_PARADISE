import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Loader2,
  Plus,
  Flame,
  Users,
  Wrench,
  Sparkles,
  MapPin,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePosts, useUserLikes } from "@/hooks/usePosts";
import { useFriendIds } from "@/hooks/useFriendships";
import SmartPostCard from "@/components/feed/SmartPostCard";
import SmartPostCreator from "@/components/feed/SmartPostCreator";

type FeedFilter = "all" | "nakamas" | "wip" | "showcase" | "local";

const filterOptions: { value: FeedFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Tout", icon: <Globe className="w-4 h-4" /> },
  { value: "nakamas", label: "Nakamas", icon: <Users className="w-4 h-4" /> },
  { value: "wip", label: "WIP", icon: <Wrench className="w-4 h-4" /> },
  { value: "showcase", label: "Showcase", icon: <Sparkles className="w-4 h-4" /> },
  { value: "local", label: "Local", icon: <MapPin className="w-4 h-4" /> },
];

const CosFeed = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch friends for nakamas filter
  const { data: friendIds = [] } = useFriendIds(user?.id);

  // Determine post type filter
  const postTypeFilter = activeFilter === "wip" ? "wip" : activeFilter === "showcase" ? "showcase" : undefined;

  // Fetch posts
  const { data: allPosts = [], isLoading } = usePosts({
    category: "cosplay",
    postType: postTypeFilter,
    sortBy: "recent",
    limit: 50,
  });

  // Filter posts based on active filter
  const filteredPosts = useMemo(() => {
    if (activeFilter === "nakamas" && friendIds.length > 0) {
      return allPosts.filter(post => friendIds.includes(post.author_id));
    }
    if (activeFilter === "local" && profile?.city) {
      // Could filter by city if we had that data on posts/authors
      return allPosts;
    }
    return allPosts;
  }, [allPosts, activeFilter, friendIds, profile?.city]);

  // Get liked posts for current user
  const postIds = filteredPosts.map(p => p.id);
  const { data: likedPostIds = [] } = useUserLikes(user?.id, postIds);

  const displayName = profile?.display_name || profile?.username || "Nakama";

  return (
    <div className="min-h-screen bg-[#292438]">
      <Navigation />

      <main className="pt-4">
        {/* Sticky Filter Bar */}
        <div className="sticky top-16 z-40 bg-[#292438]/95 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-4 py-3">
            <ScrollArea className="w-full">
              <div className="flex items-center gap-2">
                {filterOptions.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={activeFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.value)}
                    className={cn(
                      "gap-2 whitespace-nowrap shrink-0 transition-all",
                      activeFilter === filter.value
                        ? "bg-sakura hover:bg-sakura/90 text-white border-sakura"
                        : "bg-white/5 border-white/10 hover:border-sakura/50 hover:bg-white/10"
                    )}
                  >
                    {filter.icon}
                    {filter.label}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-lg mx-auto">
            {/* Feed */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-sakura" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-5xl mb-4">🎭</div>
                <h3 className="font-display text-xl mb-2">Aucun post pour le moment</h3>
                <p className="text-muted-foreground mb-6">
                  {activeFilter === "nakamas"
                    ? "Tes nakamas n'ont pas encore posté"
                    : "Sois le premier à partager ton cosplay !"}
                </p>
                {user && (
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-sakura hover:bg-sakura/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un post
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div layout className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {filteredPosts.map((post) => (
                    <SmartPostCard
                      key={post.id}
                      post={post}
                      isLiked={likedPostIds.includes(post.id)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      {user && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCreateModalOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-sakura to-turquoise shadow-lg shadow-sakura/30 flex items-center justify-center text-white"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      <Footer />

      {/* Create Post Modal */}
      {user && profile && (
        <SmartPostCreator
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          userId={user.id}
          userName={displayName}
          userAvatar={profile.avatar_url}
        />
      )}
    </div>
  );
};

export default CosFeed;
