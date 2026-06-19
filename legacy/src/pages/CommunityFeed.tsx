import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Search, 
  Camera, 
  BarChart3, 
  Video, 
  Loader2, 
  Sparkles,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePosts, useUserLikes } from "@/hooks/usePosts";
import PostCard from "@/components/community/PostCard";
import CommunitySidebar from "@/components/community/CommunitySidebar";
import CreatePostModal from "@/components/community/CreatePostModal";
import { useDebounce } from "@/hooks/useDebounce";

const categories = [
  { value: "all", label: "🔥 Tendances", isDefault: true },
  { value: "general", label: "💬 Discussions" },
  { value: "galerie", label: "🎨 Galerie Créarts" },
  { value: "cosplay", label: "🎎 Cosplay Zone" },
  { value: "events", label: "📅 Événements" },
  { value: "gaming", label: "🎮 Gaming" },
];

// Visual categories that use grid layout
const gridCategories = ["galerie", "cosplay"];

const CommunityFeed = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: posts = [], isLoading } = usePosts({
    category: activeCategory === "all" ? undefined : activeCategory,
    sortBy,
  });

  // Get liked posts for current user
  const postIds = posts.map(p => p.id);
  const { data: likedPostIds = [] } = useUserLikes(user?.id, postIds);

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!debouncedSearch.trim()) return posts;
    
    const query = debouncedSearch.toLowerCase();
    return posts.filter(post => 
      post.title?.toLowerCase().includes(query) ||
      post.content?.toLowerCase().includes(query) ||
      post.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      post.author?.display_name?.toLowerCase().includes(query) ||
      post.author?.username?.toLowerCase().includes(query)
    );
  }, [posts, debouncedSearch]);

  // Determine layout mode
  const isGridMode = gridCategories.includes(activeCategory);
  const displayName = profile?.display_name || profile?.username || "Nakama";

  return (
    <div className="min-h-screen bg-[#292438]">
      <Navigation />
      
      <main className="pt-4">
        {/* Sticky Navigation Bar */}
        <div className="sticky top-16 z-40 bg-[#292438]/95 backdrop-blur-md border-b border-white/10 py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un sujet, un nakama, un anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 focus:border-sakura/50 h-11"
                />
              </div>

              {/* Category Pills */}
              <ScrollArea className="w-full lg:flex-1">
                <div className="flex items-center gap-2 pb-2">
                  {categories.map((category) => (
                    <Button
                      key={category.value}
                      variant={activeCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(category.value)}
                      className={cn(
                        "whitespace-nowrap shrink-0 transition-all",
                        activeCategory === category.value
                          ? "bg-sakura hover:bg-sakura/90 text-white border-sakura"
                          : "bg-white/5 border-white/10 hover:border-sakura/50 hover:bg-white/10"
                      )}
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(v: "recent" | "popular") => setSortBy(v)}>
                <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent className="bg-[#362F4B] border-white/10">
                  <SelectItem value="recent">🕐 Récents</SelectItem>
                  <SelectItem value="popular">🔥 Populaires</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Feed Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Create Post Card */}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className="bg-white/5 border-white/10 p-4 cursor-pointer hover:border-sakura/30 transition-all"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-sakura/30">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-sakura/20 text-sakura">
                          {displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-muted-foreground">
                          Quoi de neuf, <span className="text-foreground font-medium">{displayName}</span> ?
                        </p>
                        <p className="text-xs text-turquoise flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Poster rapporte +10 XP
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 border-white/10 hover:bg-white/5"
                        >
                          <Camera className="w-4 h-4" />
                          <span className="hidden sm:inline">Photo</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 border-white/10 hover:bg-white/5"
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span className="hidden sm:inline">Sondage</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-gradient-to-r from-sakura/10 to-turquoise/10 border-sakura/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display text-lg">Rejoins la communauté !</p>
                        <p className="text-sm text-muted-foreground">
                          Connecte-toi pour poster et interagir avec les autres nakamas
                        </p>
                      </div>
                      <Link to="/auth">
                        <Button className="bg-sakura hover:bg-sakura/90">
                          Se connecter
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Posts Feed */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-sakura" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-4xl mb-4">🌸</div>
                  <p className="text-muted-foreground">
                    {debouncedSearch ? "Aucun résultat trouvé" : "Aucun post pour le moment"}
                  </p>
                  {user && !debouncedSearch && (
                    <Button
                      onClick={() => setCreateModalOpen(true)}
                      className="mt-4 bg-sakura hover:bg-sakura/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer le premier post
                    </Button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  layout
                  className={cn(
                    isGridMode
                      ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                      : "space-y-4"
                  )}
                >
                  <AnimatePresence mode="popLayout">
                    {filteredPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        isLiked={likedPostIds.includes(post.id)}
                        variant={isGridMode ? "grid" : "list"}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block">
              <CommunitySidebar />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Create Post Modal */}
      {user && profile && (
        <CreatePostModal
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

export default CommunityFeed;
