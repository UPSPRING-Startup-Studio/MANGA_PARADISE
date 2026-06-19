import { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Share2, Users, Rocket, Plus, Search, Filter, Eye } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LabsIdeaCard } from "@/components/labs/LabsIdeaCard";
import { LabsSubmitModal } from "@/components/labs/LabsSubmitModal";
import { useLabsIdeas, LabsCategory } from "@/hooks/useLabsIdeas";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const howItWorks = [
  {
    icon: Lightbulb,
    title: "1. Propose",
    description: "Soumets ton idée avec une description claire et une image inspirante.",
    color: "text-gold",
    bgColor: "bg-gold/10",
  },
  {
    icon: Share2,
    title: "2. Partage",
    description: "Fais connaître ton idée à la communauté pour récolter des soutiens.",
    color: "text-sakura",
    bgColor: "bg-sakura/10",
  },
  {
    icon: Users,
    title: "3. Récolte des votes",
    description: "Plus tu as de votes, plus ton idée a de chances d'être réalisée !",
    color: "text-turquoise",
    bgColor: "bg-turquoise/10",
  },
  {
    icon: Rocket,
    title: "4. Réalisation",
    description: "Les meilleures idées sont examinées par l'équipe et peuvent devenir réalité.",
    color: "text-sakura",
    bgColor: "bg-sakura/10",
  },
];

const Labs = () => {
  const { user } = useAuth();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("voting");

  const { data: votingIdeas, isLoading: loadingVoting } = useLabsIdeas("voting");
  const { data: approvedIdeas, isLoading: loadingApproved } = useLabsIdeas("approved");
  const { data: reviewIdeas, isLoading: loadingReview } = useLabsIdeas("review");

  const filterIdeas = (ideas: typeof votingIdeas) => {
    if (!ideas) return [];
    
    return ideas.filter((idea) => {
      const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           idea.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || idea.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  const handleSubmitClick = () => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    setSubmitModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-sakura/5 to-turquoise/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
          
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
                <Lightbulb className="w-5 h-5 text-gold" />
                <span className="text-sm font-medium text-gold">Laboratoire d'idées</span>
              </div>

              <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
                <span className="text-foreground">Manga Paradise</span>
                <br />
                <span className="bg-gradient-to-r from-gold via-sakura to-turquoise bg-clip-text text-transparent">
                  Labs
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Propose tes idées, récolte des votes, et voyons-les se réaliser ensemble !
                La communauté décide, l'équipe concrétise.
              </p>

              <Button onClick={handleSubmitClick} variant="cta" size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Soumettre une idée
              </Button>
            </motion.div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="font-display text-2xl font-bold text-center mb-12">
              Comment ça marche ?
            </h2>

            <div className="grid md:grid-cols-4 gap-6">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 rounded-full ${step.bgColor} flex items-center justify-center mx-auto mb-4`}>
                    <step.icon className={`w-8 h-8 ${step.color}`} />
                  </div>
                  <h3 className="font-display font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Ideas Grid */}
        <section className="py-16">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une idée..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="event">🎪 Événement</SelectItem>
                  <SelectItem value="feature">⚡ Fonctionnalité</SelectItem>
                  <SelectItem value="merch">🎁 Merch</SelectItem>
                  <SelectItem value="other">💡 Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-8">
                <TabsTrigger value="voting">
                  🗳️ En Vote ({votingIdeas?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="review">
                  👀 En Examen ({reviewIdeas?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  ✅ Validées ({approvedIdeas?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voting">
                {loadingVoting ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-80 rounded-xl" />
                    ))}
                  </div>
                ) : filterIdeas(votingIdeas)?.length === 0 ? (
                  <div className="text-center py-16">
                    <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-display text-xl font-semibold mb-2">Aucune idée pour le moment</h3>
                    <p className="text-muted-foreground mb-6">Sois le premier à proposer une idée !</p>
                    <Button onClick={handleSubmitClick} variant="cta">
                      Soumettre une idée
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterIdeas(votingIdeas)?.map((idea) => (
                      <LabsIdeaCard key={idea.id} idea={idea} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="review">
                {loadingReview ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-80 rounded-xl" />
                    ))}
                  </div>
                ) : filterIdeas(reviewIdeas)?.length === 0 ? (
                  <div className="text-center py-16">
                    <Eye className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-display text-xl font-semibold mb-2">Aucune idée en examen</h3>
                    <p className="text-muted-foreground">Les idées avec le plus de votes passent en examen.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterIdeas(reviewIdeas)?.map((idea) => (
                      <LabsIdeaCard key={idea.id} idea={idea} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="approved">
                {loadingApproved ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-80 rounded-xl" />
                    ))}
                  </div>
                ) : filterIdeas(approvedIdeas)?.length === 0 ? (
                  <div className="text-center py-16">
                    <Rocket className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-display text-xl font-semibold mb-2">Aucune idée validée</h3>
                    <p className="text-muted-foreground">Les idées approuvées apparaîtront ici.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filterIdeas(approvedIdeas)?.map((idea) => (
                      <LabsIdeaCard key={idea.id} idea={idea} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
      <LabsSubmitModal open={submitModalOpen} onOpenChange={setSubmitModalOpen} />
    </div>
  );
};

export default Labs;
