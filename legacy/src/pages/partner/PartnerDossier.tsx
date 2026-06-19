import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Download, FileText, Image, CreditCard, FileCheck, BarChart3, ExternalLink } from "lucide-react";

const resources = [
  {
    icon: Image,
    title: "Kit Média",
    description: "Logos Manga Paradise, charte graphique, visuels HD pour vos supports",
    fileType: "ZIP",
    fileSize: "15 MB",
    color: "from-cyan-400 to-cyan-600",
    shadowColor: "shadow-cyan-500/20",
  },
  {
    icon: CreditCard,
    title: "RIB de l'Association",
    description: "Coordonnées bancaires pour les virements",
    fileType: "PDF",
    fileSize: "120 KB",
    color: "from-emerald-400 to-emerald-600",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    icon: FileCheck,
    title: "Convention de Partenariat",
    description: "Modèle de convention type à personnaliser",
    fileType: "DOCX",
    fileSize: "45 KB",
    color: "from-purple-400 to-purple-600",
    shadowColor: "shadow-purple-500/20",
  },
  {
    icon: BarChart3,
    title: "Bilan d'Activité 2024",
    description: "Rapport annuel, chiffres clés et réalisations",
    fileType: "PDF",
    fileSize: "2.5 MB",
    color: "from-amber-400 to-amber-600",
    shadowColor: "shadow-amber-500/20",
  },
  {
    icon: FileText,
    title: "Statuts de l'Association",
    description: "Statuts Loi 1901 et règlement intérieur",
    fileType: "PDF",
    fileSize: "350 KB",
    color: "from-pink-400 to-pink-600",
    shadowColor: "shadow-pink-500/20",
  },
];

const PartnerDossier = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 font-sans">
          Dossier Partenariat
        </h1>
        <p className="text-slate-300">
          Téléchargez tous les documents nécessaires à notre collaboration
        </p>
      </div>

      {/* Resources Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {resources.map((resource, i) => (
          <motion.div
            key={resource.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-200 group">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${resource.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${resource.shadowColor}`}>
                  <resource.icon className="w-7 h-7 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 font-sans">
                    {resource.title}
                  </h3>
                  <p className="text-slate-300 text-sm mb-3">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-mp-cloud/50 rounded text-slate-300">
                        {resource.fileType}
                      </span>
                      <span className="text-xs text-mp-ink-muted">
                        {resource.fileSize}
                      </span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 font-sans">
                Besoin d'un document spécifique ?
              </h3>
              <p className="text-slate-300 mb-4">
                Si vous avez besoin d'un document qui n'est pas listé ici (attestation fiscale, 
                certificat d'assurance, etc.), n'hésitez pas à nous contacter directement.
              </p>
              <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold">
                Contacter le Bureau
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PartnerDossier;
