import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Download, Check, Star, Crown, Gem } from "lucide-react";

const tiers = [
  {
    name: "Silver",
    icon: Star,
    price: "500€",
    color: "from-slate-400 to-slate-500",
    borderColor: "border-slate-500/30",
    glowColor: "hover:border-slate-400/50",
    features: [
      { name: "Logo sur affiche", included: true },
      { name: "Mention réseaux sociaux", included: true },
      { name: "Stand 3x3m", included: false },
      { name: "Animation sur scène", included: false },
      { name: "Visibilité premium web", included: false },
      { name: "Goodies dans kits membres", included: false },
    ],
  },
  {
    name: "Gold",
    icon: Crown,
    price: "1 200€",
    color: "from-amber-400 to-amber-600",
    borderColor: "border-amber-500/30",
    glowColor: "hover:border-amber-400/50",
    popular: true,
    features: [
      { name: "Logo sur affiche", included: true },
      { name: "Mention réseaux sociaux", included: true },
      { name: "Stand 3x3m", included: true },
      { name: "Animation sur scène", included: true },
      { name: "Visibilité premium web", included: false },
      { name: "Goodies dans kits membres", included: false },
    ],
  },
  {
    name: "Platinum",
    icon: Gem,
    price: "2 500€",
    color: "from-purple-400 to-purple-600",
    borderColor: "border-purple-500/30",
    glowColor: "hover:border-purple-400/50",
    features: [
      { name: "Logo sur affiche", included: true },
      { name: "Mention réseaux sociaux", included: true },
      { name: "Stand 3x3m", included: true },
      { name: "Animation sur scène", included: true },
      { name: "Visibilité premium web", included: true },
      { name: "Goodies dans kits membres", included: true },
    ],
  },
];

const PartnerModalites = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 font-sans">
          Modalités de Partenariat
        </h1>
        <p className="text-slate-300">
          Découvrez nos formules de collaboration et leurs avantages
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div 
              className={`bg-white/40 backdrop-blur-md border ${tier.borderColor} ${tier.glowColor} rounded-xl p-6 relative h-full flex flex-col transition-all duration-200 ${
                tier.popular ? "ring-2 ring-amber-500/50 ring-offset-2 ring-offset-[#0F172A]" : ""
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 font-semibold">
                  Populaire
                </Badge>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${tier.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <tier.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white font-sans">{tier.name}</h3>
                <p className="text-3xl font-bold text-cyan-400 mt-2">{tier.price}</p>
                <p className="text-mp-ink-muted text-sm">par événement</p>
              </div>

              {/* Features */}
              <div className="flex-1 space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <div key={feature.name} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      feature.included 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-mp-cloud/50 text-mp-ink-muted"
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className={feature.included ? "text-slate-200" : "text-mp-ink-muted line-through"}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button 
                className={`w-full ${tier.popular 
                  ? "bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-900 font-semibold" 
                  : "bg-mp-cloud/50 hover:bg-mp-cloud text-white border border-white/10"
                }`}
              >
                Choisir {tier.name}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-white/40 backdrop-blur-md border border-white/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 font-sans">
            Tableau Comparatif Détaillé
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-mp-ink-muted font-medium">Avantage</th>
                  <th className="text-center py-3 px-4 text-mp-ink-muted font-medium">Silver</th>
                  <th className="text-center py-3 px-4 text-amber-400 font-medium">Gold</th>
                  <th className="text-center py-3 px-4 text-purple-400 font-medium">Platinum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-slate-200">Logo sur supports print</td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-slate-200">Mention sur réseaux sociaux</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">1 post</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">3 posts</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">Illimité</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-slate-200">Stand sur événement</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">—</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">3x3m</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">6x3m Premium</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-slate-200">Animation sur scène</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">—</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">5 min</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">15 min</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-slate-200">Bannière sur site web</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">—</td>
                  <td className="text-center py-3 px-4 text-mp-ink-muted">—</td>
                  <td className="text-center py-3 px-4"><Check className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Download CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-900 font-semibold">
          <Download className="w-5 h-5 mr-2" />
          Télécharger la Grille Tarifaire (PDF)
        </Button>
      </motion.div>
    </div>
  );
};

export default PartnerModalites;
