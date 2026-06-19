import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight, 
  Users, 
  Sparkles, 
  Eye, 
  HelpCircle, 
  Phone,
  Clock,
  CheckCircle,
  LogOut,
  Building2,
  Home
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import PartnerModalities from "@/components/partner/PartnerModalities";

const PartnerLanding = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  
  const isPending = profile?.partner_status === "pending";
  const isActive = profile?.partner_status === "active";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Trusted partners for marquee
  const trustedPartners = [
    "Mairie de Nice",
    "CCI Nice Côte d'Azur", 
    "Conseil Régional PACA",
    "Japan Expo Sud",
    "Manga Story",
    "Cultura",
    "Fnac Monaco",
    "Geek'Art Gallery"
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Partner Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-cyan-500/20">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl text-white">Manga Paradise</span>
            <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
              PRO
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Accueil Partenaire
            </Link>
            {isActive && (
              <Link 
                to="/partner-portal" 
                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
              >
                Espace Pro
              </Link>
            )}
            <button 
              onClick={handleSignOut}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Constellation Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.15)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(168,85,247,0.1)_0%,_transparent_50%)]" />
          {/* Animated constellation dots */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/50 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Dynamic Status Badge */}
            {isPending ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-full mb-8"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-medium text-sm">
                  ⏳ Candidature en cours d'étude
                </span>
              </motion.div>
            ) : isActive ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-amber-400/50 rounded-full mb-8 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
              >
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400 font-semibold text-sm">
                  ✅ Partenaire Officiel 2025
                </span>
              </motion.div>
            ) : null}

            {/* Title */}
            <h1 className="font-display text-4xl md:text-6xl mb-6">
              {isPending ? (
                <>
                  <span className="text-gray-300">Merci de votre intérêt pour</span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    Manga Paradise.
                  </span>
                </>
              ) : (
                <>
                  <span className="text-gray-300">Bienvenue dans</span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-cyan-400 to-purple-400">
                    l'Alliance Manga Paradise.
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              {isPending ? (
                "Votre demande d'accès à l'Espace Partenaire a bien été enregistrée. Notre équipe administrative va étudier votre dossier et prendra contact avec vous prochainement pour valider votre statut."
              ) : (
                "Vous faites désormais partie des acteurs qui font vivre la culture japonaise sur la Côte d'Azur. Ensemble, faisons rayonner la culture manga."
              )}
            </p>

            {/* CTA */}
            {isActive ? (
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)]"
              >
                <Link to="/partner-portal">
                  Accéder à mon Espace Pro
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            ) : (
              <div className="p-4 bg-white/50 border border-mp-border rounded-xl inline-block">
                <p className="text-gray-400 text-sm">
                  🔒 L'accès à l'Espace Pro sera débloqué après validation de votre dossier.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-20 border-t border-cyan-500/10">
        <div className="container mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-3xl text-center mb-16 text-gray-200"
          >
            Pourquoi rejoindre l'Alliance ?
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Users,
                title: "Audience Engagée",
                description: "Connectez-vous à une communauté passionnée de plus de 500 membres actifs sur la Côte d'Azur."
              },
              {
                icon: Sparkles,
                title: "Impact Culturel",
                description: "Soutenez des événements majeurs et contribuez au rayonnement de la culture japonaise."
              },
              {
                icon: Eye,
                title: "Visibilité Premium",
                description: "Associez votre image à une marque dynamique et innovante sur le territoire azuréen."
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-8 bg-white/30 border border-mp-border/50 rounded-2xl hover:border-cyan-500/30 transition-colors"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="font-display text-xl text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Modalities Section */}
      <PartnerModalities />

      {/* Resource Center Section */}
      <section className="py-20 border-t border-cyan-500/10">
        <div className="container mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-3xl text-center mb-16 text-gray-200"
          >
            Centre de Ressources
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* FAQ Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-mp-border/50 rounded-2xl hover:border-cyan-500/40 transition-all group"
            >
              <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="font-display text-xl text-white mb-3">❓ Questions Fréquentes</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Tout savoir sur la défiscalisation, les types de sponsoring et la logistique événementielle.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Link to="/partner-portal/faq">
                  Consulter la FAQ
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </motion.div>

            {/* Support Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-mp-border/50 rounded-2xl hover:border-purple-500/40 transition-all group"
            >
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Phone className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-display text-xl text-white mb-3">📞 Support & Contact</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Besoin d'une précision ? Contactez directement le pôle partenariat pour suivre l'avancement de votre dossier.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
              >
                <Link to="/partner-portal/contact">
                  Contacter le Bureau
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted Partners Marquee */}
      <section className="py-16 border-t border-cyan-500/10 overflow-hidden">
        <div className="container mx-auto px-6 mb-8">
          <p className="text-center text-gray-500 text-sm uppercase tracking-wider">
            Ils nous font confiance
          </p>
        </div>
        
        <div className="relative">
          <motion.div
            className="flex gap-12"
            animate={{ x: [0, -1000] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {[...trustedPartners, ...trustedPartners].map((partner, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-8 py-4 bg-white/30 border border-mp-border/30 rounded-lg"
              >
                <span className="text-gray-400 font-medium whitespace-nowrap opacity-60">
                  {partner}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-cyan-500/10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 Manga Paradise — Espace Partenaires
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PartnerLanding;
