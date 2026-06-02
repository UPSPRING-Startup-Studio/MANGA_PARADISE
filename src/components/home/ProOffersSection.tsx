import { motion } from "framer-motion";
import { Palette, Store, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ProOffersSection = () => {
  return (
    <section className="py-20 bg-mp-paper relative overflow-hidden">
      {/* Décor doux charte */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-mp-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-mp-orange/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mp-primary/10 border border-mp-primary/20 text-mp-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Pour les Pros
          </span>
          <h2 className="font-display italic font-extrabold text-3xl md:text-4xl text-mp-ink mb-4">
            Offres Professionnelles
          </h2>
          <p className="text-mp-ink-muted max-w-xl mx-auto">
            Des solutions adaptées aux créateurs et aux commerces de la culture japonaise
          </p>
        </motion.div>

        {/* Pro Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Creator Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="relative bg-white rounded-3xl border border-mp-border p-8 h-full hover:border-mp-primary/40 hover:shadow-card-lg transition-all">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mp-primary to-mp-coral flex items-center justify-center mb-6">
                <Palette className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="mb-6">
                <span className="text-mp-primary text-sm font-medium uppercase tracking-wide">Pass Artisan</span>
                <h3 className="font-display italic text-2xl text-mp-ink mt-1">Pour les Créateurs</h3>
              </div>

              <p className="text-mp-ink-soft mb-6 leading-relaxed">
                Tu es <span className="text-mp-primary font-medium">Cosplayer Pro</span> ou{" "}
                <span className="text-mp-primary font-medium">Artiste</span> ?
                Découvre nos outils de vente, ton Portfolio HD et une vitrine dédiée pour promouvoir tes créations.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8 text-sm text-mp-ink-muted">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-mp-primary rounded-full" />
                  Galerie portfolio illimitée
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-mp-primary rounded-full" />
                  Système de commissions intégré
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-mp-primary rounded-full" />
                  Mise en avant sur le feed
                </li>
              </ul>

              {/* Price & CTA */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-mp-ink font-display italic text-3xl">19,99€</span>
                  <span className="text-mp-ink-muted text-sm ml-1">/ mois</span>
                </div>
                <Button asChild>
                  <Link to="/partenaire">
                    En savoir plus
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Store Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="relative bg-white rounded-3xl border border-mp-border p-8 h-full hover:border-mp-coral/40 hover:shadow-card-lg transition-all">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mp-coral to-mp-orange flex items-center justify-center mb-6">
                <Store className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="mb-6">
                <span className="text-mp-coral text-sm font-medium uppercase tracking-wide">Alliance Pro</span>
                <h3 className="font-display italic text-2xl text-mp-ink mt-1">Pour les Commerces</h3>
              </div>

              <p className="text-mp-ink-soft mb-6 leading-relaxed">
                Vous êtes <span className="text-mp-coral font-medium">commerçant</span> ?
                Générez du trafic en boutique grâce à nos <span className="text-mp-coral font-medium">Quêtes gamifiées</span>.
                Vos offres deviennent des objectifs pour notre communauté.
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8 text-sm text-mp-ink-muted">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-mp-coral rounded-full" />
                  Quêtes personnalisées en boutique
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-mp-coral rounded-full" />
                  Dashboard analytics visiteurs
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-mp-coral rounded-full" />
                  Visibilité sur le Bazar Akihabara
                </li>
              </ul>

              {/* Price & CTA */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-mp-ink font-display italic text-lg">Sur devis</span>
                </div>
                <Button asChild variant="secondary">
                  <Link to="/partenaire">
                    Nous contacter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProOffersSection;
