import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  Phone, 
  LifeBuoy, 
  MessageSquare,
  Sparkles
} from "lucide-react";

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { data: roles = [] } = useUserRoles();

  // Extended profile type
  const extendedProfile = profile as typeof profile & {
    partner_status?: string;
    partner_company_name?: string;
    partner_contact_name?: string;
  };

  const isActive = extendedProfile?.partner_status === 'active';
  const isPending = extendedProfile?.partner_status === 'pending';

  return (
    <div className="space-y-8">
      {/* Hero Section - Dynamic based on status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-2xl p-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            {isPending ? (
              // PENDING Status Content
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full mb-6">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    Candidature en cours d'étude
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-sans">
                  Merci de votre intérêt pour Manga Paradise
                </h1>

                <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                  Votre demande d'accès à l'Espace Partenaire a bien été enregistrée. 
                  Notre équipe administrative va étudier votre dossier et prendra contact 
                  avec vous prochainement pour valider votre statut.
                </p>

                <div className="mt-6 p-4 bg-mp-paper/50 rounded-lg border border-white/10 max-w-md">
                  <p className="text-sm text-slate-300">
                    <span className="text-white font-medium">Besoin d'informations ?</span>
                    <br />
                    En attendant la validation, consultez notre FAQ ou contactez-nous directement.
                  </p>
                </div>
              </>
            ) : isActive ? (
              // ACTIVE Status Content
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full mb-6">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-400">
                    ✅ Partenaire Officiel 2025
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-sans">
                  Bienvenue dans l'Alliance
                </h1>

                <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                  Votre espace professionnel est actif. Ensemble, faisons rayonner la culture manga 
                  et créons des expériences inoubliables pour notre communauté.
                </p>

                <div className="mt-6 flex items-center gap-2 text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Accédez à toutes les ressources et opportunités de collaboration
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Resources Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 font-sans">Centre de Ressources</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* FAQ Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-xl p-6 h-full hover:border-cyan-500/30 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
                  <LifeBuoy className="w-7 h-7 text-slate-900" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 font-sans">
                    Questions Fréquentes
                  </h3>
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                    Tout savoir sur la défiscalisation, les types de sponsoring 
                    et la logistique événementielle.
                  </p>
                  <Button 
                    onClick={() => navigate("/partner-portal/faq")}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Consulter la FAQ
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-xl p-6 h-full hover:border-amber-500/30 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                  <MessageSquare className="w-7 h-7 text-slate-900" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2 font-sans">
                    Besoin d'une précision ?
                  </h3>
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                    Contactez directement le pôle partenariat pour suivre 
                    l'avancement de votre dossier.
                  </p>
                  <Button 
                    onClick={() => navigate("/partner-portal/contact")}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contacter le Bureau
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Status Info for Pending */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-medium font-sans">Étapes à venir</h3>
                <p className="text-slate-300 text-sm">
                  Dès validation, vous aurez accès à l'ensemble des outils : 
                  chiffres clés, opportunités événementielles, et ressources téléchargeables.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PartnerDashboard;
