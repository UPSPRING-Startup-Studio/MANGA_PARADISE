import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { categories, partnersData, type Partner, type CategoryKey } from "./partnersData";
import PartnerCard from "./PartnerCard";
import PartnerModal from "./PartnerModal";
import { usePublicProPartners } from "@/hooks/usePublicProPartners";

const PartnersDirectory = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("tous");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load from DB — fallback to static data if DB is empty or errored
  const { data: dbPartners, isLoading, isError } = usePublicProPartners();

  const allPartners = useMemo(() => {
    // If DB returned partners, use them
    if (dbPartners && dbPartners.length > 0) return dbPartners;
    // Fallback: flatten static data
    return Object.values(partnersData).flat();
  }, [dbPartners]);

  // Filter by category
  const filteredPartners = useMemo(() => {
    if (selectedCategory === "tous") return allPartners;
    return allPartners.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, allPartners]);

  // Determine data source for indicator
  const isFromDB = !!(dbPartners && dbPartners.length > 0);

  const openPartnerDetail = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsModalOpen(true);
  };

  const categoryList = Object.entries(categories);

  return (
    <section className="py-20 bg-mp-paper">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span className="text-pink-400 text-sm font-medium">Notre écosystème</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Nos Partenaires
          </h2>
          <p className="text-mp-ink-muted text-lg max-w-2xl mx-auto">
            Découvrez les acteurs qui font vivre la culture japonaise sur la Côte d'Azur
          </p>
        </motion.div>

        {/* Category Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-wrap justify-center gap-3">
            {categoryList.map(([key, cat]) => {
              const isActive = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as CategoryKey)}
                  className={`
                    relative px-5 py-2.5 rounded-xl font-medium text-sm
                    transition-all duration-300 flex items-center gap-2
                    ${isActive
                      ? `${cat.bgColor} ${cat.textColor} border-2 ${cat.borderColor} shadow-lg`
                      : 'bg-white/50 text-mp-ink-muted border border-mp-border hover:bg-white hover:text-white'
                    }
                  `}
                  style={isActive ? {
                    boxShadow: `0 0 20px ${cat.glowColor.replace('shadow-', '').replace('/30', '')}`
                  } : undefined}
                >
                  <span>{cat.emoji}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
          </div>
        )}

        {/* Partners Grid */}
        {!isLoading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {filteredPartners.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredPartners.map((partner, index) => (
                      <PartnerCard
                        key={`${partner.name}-${index}`}
                        partner={partner}
                        onClick={() => openPartnerDetail(partner)}
                        index={index}
                      />
                    ))}
                  </div>

                  {/* CTA Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12"
                  >
                    <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-mp-border p-8 md:p-12 text-center overflow-hidden">
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                      </div>

                      <div className="relative z-10">
                        <span className="text-5xl mb-4 block">🤝</span>
                        <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                          Pourquoi pas vous ?
                        </h3>
                        <p className="text-mp-ink-muted mb-6 max-w-lg mx-auto">
                          Rejoignez notre réseau de partenaires et participez à l'aventure Manga Paradise.
                        </p>
                        <Button
                          asChild
                          className="bg-pink-500 hover:bg-pink-600 text-white px-8"
                        >
                          <Link to="/nous-rejoindre">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Devenir partenaire
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </>
              ) : (
                <div className="text-center py-16">
                  <span className="text-6xl mb-4 block">🔍</span>
                  <h3 className="text-xl font-display text-white mb-2">
                    Aucun partenaire dans cette catégorie
                  </h3>
                  <p className="text-mp-ink-muted">
                    Revenez bientôt pour découvrir de nouvelles collaborations !
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Partner Count */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-mp-ink-muted text-sm">
            {filteredPartners.length} partenaire{filteredPartners.length > 1 ? 's' : ''}
            {selectedCategory !== 'tous' && ` dans la catégorie "${categories[selectedCategory].label}"`}
          </p>
        </motion.div>
      </div>

      {/* Partner Detail Modal */}
      <PartnerModal
        partner={selectedPartner}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default PartnersDirectory;
