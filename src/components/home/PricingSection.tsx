import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const pricingPlans = [
  {
    id: "villageois",
    name: "Le Villageois",
    subtitle: "Découverte",
    price: "0",
    period: "Gratuit",
    description: "Commence ton aventure sans engagement",
    icon: "🌱",
    color: "from-slate-500 to-slate-600",
    borderColor: "border-slate-600",
    features: [
      "1 Profil unique (Otaku)",
      "Accès à l'Agenda événements",
      "Consultation du Bazar",
      "Publicités incluses",
    ],
    cta: "Commencer l'aventure",
    ctaVariant: "outline" as const,
    popular: false,
  },
  {
    id: "jonin",
    name: "Le Jonin",
    subtitle: "Confort",
    price: "4,99",
    period: "/ mois",
    description: "L'expérience confort sans limites",
    icon: "⚔️",
    color: "from-violet-500 to-purple-500",
    borderColor: "border-violet-500",
    features: [
      "2 Profils au choix",
      "Zéro publicité",
      "Filtres de rencontres avancés",
      "Boost XP ×1.25",
      "Badge Jonin exclusif",
    ],
    cta: "Passer Jonin",
    ctaVariant: "default" as const,
    popular: false,
  },
  {
    id: "sannin",
    name: "L'Élite",
    subtitle: "Puissance",
    price: "9,99",
    period: "/ mois",
    description: "Pour les Power Users qui veulent tout",
    icon: "👑",
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500",
    features: [
      "4 Profils (Tout débloqué)",
      "Skins & avatars animés",
      "\"Qui m'a liké ?\" débloqué",
      "Boost XP ×1.5",
      "Badge Sannin légendaire",
      "Accès anticipé aux features",
    ],
    cta: "Devenir Légende",
    ctaVariant: "default" as const,
    popular: true,
    badge: "👑 Power User",
  },
];

const PricingSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            Abonnements
          </span>
          <h2 className="font-display italic font-extrabold text-4xl md:text-5xl lg:text-6xl mb-4 text-foreground">
            Choisis ta <span className="text-primary">Voie</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Du simple curieux au membre engagé, trouve la formule qui te correspond
          </p>
        </motion.div>

        {/* Pricing Cards - 3 columns centered */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="bg-gradient-to-r from-mp-saffron to-mp-orange text-amber-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-md"
                  >
                    {plan.badge}
                  </motion.div>
                </div>
              )}

              <div className={`
                relative h-full rounded-3xl p-6 
                ${plan.popular 
                  ? 'bg-gradient-to-b from-mp-saffron/15 to-mp-orange/10 border-2 border-mp-orange shadow-md'
                  : 'bg-card border border-border hover:border-primary/30'
                }
                transition-all duration-300 hover:shadow-lg
              `}>
                {/* Plan Icon */}
                <div className={`
                  w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color}
                  flex items-center justify-center text-3xl mb-4
                  ${plan.popular ? 'shadow-md' : ''}
                `}>
                  {plan.icon}
                </div>

                {/* Plan Info */}
                <div className="mb-6">
                  <h3 className="font-display italic text-2xl text-foreground">{plan.name}</h3>
                  <p className={`text-sm ${plan.popular ? 'text-amber-700' : 'text-muted-foreground'}`}>
                    {plan.subtitle}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="font-display italic font-extrabold text-4xl text-foreground">{plan.price}€</span>
                  <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-amber-700 font-medium' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-mp-orange' : 'text-primary'}`} />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  asChild
                  variant={plan.ctaVariant}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-mp-saffron to-mp-orange hover:from-mp-saffron/90 hover:to-mp-orange/90 text-amber-900 border-0'
                      : ''
                  }`}
                >
                  <Link to="/nous-rejoindre">
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm mt-8"
        >
          Tous les abonnements sont sans engagement et résiliables à tout moment.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
