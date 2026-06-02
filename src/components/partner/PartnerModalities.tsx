import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  Gift, 
  CreditCard, 
  Calendar, 
  Receipt, 
  Users,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const modalities = [
  { icon: Store, title: "Mise à disposition d'un stand", summary: "Présence de l'association sur vos évènements avec un espace d'animation." },
  { icon: Gift, title: "Lots & dotations", summary: "Fournissez des lots, produits ou services pour nos concours." },
  { icon: CreditCard, title: "Réductions membres", summary: "Offrez des avantages exclusifs (remises, codes promo) à nos membres." },
  { icon: Calendar, title: "Participation ponctuelle", summary: "Soutenez un projet spécifique par un apport financier ou matériel." },
  { icon: Receipt, title: "Donation défiscalisée", summary: "Contribuez librement avec un don déductible à 66 % (Reçu fiscal)." },
  { icon: Users, title: "Partenariat de visibilité", summary: "Communication croisée sur nos réseaux pour une visibilité mutuelle." }
];

const PartnerModalities = () => {
  const { user } = useAuth();

  const handleCTAClick = () => {
    if (user) {
      // If logged in, navigate to partner portal FAQ
      window.location.href = "/partner-portal/faq";
    } else {
      // If not logged in, scroll to FAQ section if it exists
      const faqSection = document.getElementById("faq-section");
      if (faqSection) {
        faqSection.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "/partner-portal/faq";
      }
    }
  };

  return (
    <section className="py-20 border-t border-cyan-500/10">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-400 text-sm font-medium mb-4">
            Nos Formules
          </span>
          <h2 className="font-display text-2xl md:text-3xl text-gray-200 mb-4">
            Comment nous soutenir ?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Plusieurs façons de collaborer avec Manga Paradise, adaptées à vos moyens et vos objectifs.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {modalities.map((modality, index) => (
            <motion.div
              key={modality.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative p-6 bg-white/50 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-pink-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]"
            >
              {/* Icon with Glow */}
              <div className="relative mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.4)] group-hover:shadow-[0_0_35px_rgba(236,72,153,0.6)] transition-shadow duration-300">
                  <modality.icon className="w-7 h-7 text-white" />
                </div>
                {/* Subtle glow behind icon */}
                <div className="absolute inset-0 w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
              </div>

              {/* Title */}
              <h3 className="font-display text-lg text-white mb-2 group-hover:text-pink-100 transition-colors">
                {modality.title}
              </h3>

              {/* Summary */}
              <p className="text-slate-300 text-sm leading-relaxed">
                {modality.summary}
              </p>

              {/* Hover border glow effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-[-1px] bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-2xl blur-sm" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            onClick={handleCTAClick}
            size="lg"
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-base rounded-xl shadow-[0_0_25px_rgba(236,72,153,0.3)] hover:shadow-[0_0_35px_rgba(236,72,153,0.5)] transition-all"
          >
            Découvrir toutes les modalités
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnerModalities;
