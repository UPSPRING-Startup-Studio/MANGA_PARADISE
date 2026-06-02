import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Users,
  MapPin,
  Loader2,
  Shield,
  Globe,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Eye,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { usePublicGuilds, useMyGuilds } from "@/hooks/useGuildDetails";
import { useGuildCategories } from "@/hooks/useGuilds";
import { useAuth } from "@/contexts/AuthContext";
import { CreateGuildModal } from "@/components/guilds/CreateGuildModal";
import { GuildInvitationsSection } from "@/components/guilds/GuildInvitationsSection";

// Category images from Unsplash
const CATEGORY_IMAGES: Record<string, string> = {
  "Otakus": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
  "Cosplayeurs": "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800&q=80",
  "Gamers": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
  "Créateurs": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
  "Associations": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
  "Professionnels": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
  "Événements": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  "Sports / Loisirs": "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80",
};

type ViewState = "discovery" | "listing";

const Guilds = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"explore" | "my-guilds">("explore");
  const [viewState, setViewState] = useState<ViewState>("discovery");

  const { data: categories = [] } = useGuildCategories();
  const categoryId = selectedCategory?.id || "all";
  const { data: publicGuilds = [], isLoading: isLoadingPublic } = usePublicGuilds(search, categoryId);
  const { data: myGuilds = [], isLoading: isLoadingMyGuilds } = useMyGuilds();

  // Auto-switch to listing when searching
  useEffect(() => {
    if (search.length > 0 && viewState === "discovery") {
      setViewState("listing");
      setSelectedCategory(null);
    }
  }, [search, viewState]);

  // Filter guilds based on active tab
  const guilds = activeTab === "explore" 
    ? publicGuilds 
    : myGuilds.filter(g =>
        (!search || g.name.toLowerCase().includes(search.toLowerCase())) &&
        (categoryId === "all" || g.category_id === categoryId)
      );
  const isLoading = activeTab === "explore" ? isLoadingPublic : isLoadingMyGuilds;

  const handleCategoryClick = (category: { id: string; name: string; icon: string }) => {
    setSelectedCategory(category);
    setViewState("listing");
    setSearch("");
  };

  const handleBackToDiscovery = () => {
    setViewState("discovery");
    setSelectedCategory(null);
    setSearch("");
  };

  const getCategoryImage = (categoryName: string): string => {
    return CATEGORY_IMAGES[categoryName] || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Pending Invitations Section */}
        {user && <GuildInvitationsSection />}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-sakura" />
              Guildes & Communautés
            </h1>
            <p className="text-muted-foreground mt-2">
              Rejoins un groupe de passionnés ou crée ta propre légende.
            </p>
          </div>

          {user && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-sakura to-purple-500 hover:opacity-90 text-white font-display"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une Guilde
            </Button>
          )}
        </div>

        {/* Tabs Explorer / Mes Guildes */}
        {user && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "explore" | "my-guilds")} className="mb-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="explore" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Explorer
              </TabsTrigger>
              <TabsTrigger value="my-guilds" className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Mes Guildes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Search Bar - Always visible */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une guilde..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50 max-w-md"
          />
        </div>

        <AnimatePresence mode="wait">
          {/* Discovery View - Category Grid */}
          {viewState === "discovery" && activeTab === "explore" && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-display font-semibold mb-6 text-foreground/80">
                Explore les univers
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="group relative h-48 overflow-hidden cursor-pointer rounded-xl border border-transparent hover:border-sakura/40 transition-all duration-300"
                      onClick={() => handleCategoryClick(category)}
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0">
                        <img
                          src={getCategoryImage(category.name)}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Dark Overlay */}
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-300" />
                      </div>

                      {/* Content */}
                      <div className="relative h-full flex flex-col justify-end p-5">
                        <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                          <span className="text-3xl mb-2 block">{category.icon}</span>
                          <h3 className="text-xl md:text-2xl font-display font-bold text-white">
                            {category.name}
                          </h3>
                        </div>

                        {/* Hover indicator */}
                        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-10 h-10 rounded-full bg-sakura/80 flex items-center justify-center">
                            <ArrowLeft className="w-5 h-5 text-white rotate-180" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Listing View - Guilds List */}
          {(viewState === "listing" || activeTab === "my-guilds") && (
            <motion.div
              key="listing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back Button & Title */}
              {viewState === "listing" && activeTab === "explore" && (
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    onClick={handleBackToDiscovery}
                    className="mb-4 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour aux univers
                  </Button>

                  <h2 className="text-2xl md:text-3xl font-display font-bold">
                    {selectedCategory ? (
                      <>
                        Guildes : {selectedCategory.name} {selectedCategory.icon}
                      </>
                    ) : search ? (
                      <>Résultats pour "{search}"</>
                    ) : (
                      <>Toutes les Guildes</>
                    )}
                  </h2>
                </div>
              )}

              {/* Guilds Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-sakura" />
                </div>
              ) : guilds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {guilds.map((guild, index) => (
                    <motion.div
                      key={guild.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="overflow-hidden cursor-pointer hover:border-sakura/50 transition-all group rounded-xl"
                        onClick={() => navigate(`/guilds/${guild.id}`)}
                      >
                        {/* Banner */}
                        <div className="relative h-32 bg-gradient-to-br from-sakura/20 to-purple-500/20">
                          {guild.banner_url ? (
                            <img
                              src={guild.banner_url}
                              alt={guild.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Shield className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />

                          {/* Access type badge */}
                          <div className="absolute top-2 right-2">
                            {guild.access_type === "private" ? (
                              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                <Lock className="w-3 h-3 mr-1" />
                                Candidature
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                <Eye className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>

                          {guild.category && (
                            <Badge className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm">
                              {guild.category.icon} {guild.category.name}
                            </Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-display font-semibold text-lg mb-1 group-hover:text-sakura transition-colors">
                            {guild.name}
                          </h3>

                          {guild.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {guild.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {guild.member_count} membre{(guild.member_count || 0) > 1 ? "s" : ""}
                            </span>
                            {guild.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {guild.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Shield className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {activeTab === "my-guilds" ? "Tu n'es membre d'aucune guilde" : "Aucune guilde trouvée"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {activeTab === "my-guilds"
                      ? "Explore les guildes disponibles et rejoins une communauté !"
                      : "Soyez le premier à créer une guilde dans cette catégorie !"}
                  </p>
                  {user && (
                    <Button
                      onClick={() => activeTab === "my-guilds" ? setActiveTab("explore") : setIsCreateModalOpen(true)}
                      variant="outline"
                    >
                      {activeTab === "my-guilds" ? "Explorer les Guildes" : "Créer une Guilde"}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />

      <CreateGuildModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
};

export default Guilds;
