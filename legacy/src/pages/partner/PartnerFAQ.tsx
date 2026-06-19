import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Settings, Handshake, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// FAQ Data
// ─────────────────────────────────────────────────────────────
const faqCategories = [
  {
    id: "setup",
    title: "Mise en place du partenariat",
    icon: Settings,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    bgHover: "hover:bg-emerald-500/10",
    bgActive: "bg-emerald-500/20",
    questions: [
      {
        q: "Quelles sont les étapes pour mettre en place un partenariat ?",
        a: `Notre méthode est simple et souple :<br/>1. <strong>Premier contact</strong> : Échange pour comprendre vos besoins.<br/>2. <strong>Choix des modalités</strong> : Sélection des options dans notre catalogue.<br/>3. <strong>Convention</strong> : Signature d'un accord sur mesure.<br/>4. <strong>Lancement</strong> : Annonce publique et activation.`,
        cta: "🤝 Je souhaite proposer un partenariat",
      },
      {
        q: "Quels sont les délais nécessaires ?",
        a: `✅ <strong>Actions simples</strong> (réductions) : 1 à 2 semaines.<br/>📅 <strong>Événements physiques</strong> : 4 à 8 semaines conseillées.<br/>🧩 <strong>Projets sur mesure</strong> : Contactez-nous au moins 3 mois à l'avance.`,
        cta: "🚀 Discutons de votre projet",
      },
      {
        q: "Je n'ai pas ou peu de budget, est-ce possible ?",
        a: `Oui ! Nous croyons aux partenariats accessibles.<br/>Solutions : <strong>Vente sur place</strong> (nous tenons un stand pour nous autofinancer) ou <strong>Activités partiellement payantes</strong> (petite participation du public pour certaines animations).`,
        cta: "🤝 Construisons une solution adaptée",
      },
      {
        q: "Proposez-vous une convention ou un contrat ?",
        a: `Oui, pour toute collaboration significative. La convention précise les objectifs, la durée, la visibilité et les conditions financières. Elle est rédigée par l'asso et signée par les deux parties.`,
      },
    ],
  },
  {
    id: "collab",
    title: "Types de collaborations",
    icon: Handshake,
    color: "text-blue-400",
    borderColor: "border-blue-500/20",
    bgHover: "hover:bg-blue-500/10",
    bgActive: "bg-blue-500/20",
    questions: [
      {
        q: "Avec quel type de structure collaborez-vous ?",
        a: `Nous travaillons avec : Institutions publiques (Mairies), Entreprises privées, Associations et Structures éducatives.<br/><br/>⚠️ <strong>Non éligibles :</strong> Entités à caractère politique, religieux, sectaire ou contraires aux valeurs de la République.`,
      },
      {
        q: "Peut-on proposer un projet personnalisé ?",
        a: `Absolument ! Événementiel, Pédagogique, Culturel ou Créatif... Nous adorons co-créer. N'hésitez pas à sortir des sentiers battus.`,
        cta: "🚀 Soumettre une idée",
      },
      {
        q: "Quelles sont les différentes manières de collaborer ?",
        a: `🎪 Stand ou animation.<br/>🎁 Dotations de lots.<br/>🎫 Avantages membres (réductions).<br/>🎯 Soutien ponctuel.<br/>💸 Donation défiscalisée (66%).`,
      },
      {
        q: "L'association propose-t-elle une exclusivité ?",
        a: `Non. Nous ne pratiquons pas l'exclusivité. Chaque partenaire est libre de s'impliquer selon ses moyens. Nous veillons cependant à éviter les conflits d'intérêts directs sur un même événement.`,
      },
    ],
  },
  {
    id: "visibility",
    title: "Visibilité & Valorisation",
    icon: Star,
    color: "text-amber-400",
    borderColor: "border-amber-500/20",
    bgHover: "hover:bg-amber-500/10",
    bgActive: "bg-amber-500/20",
    questions: [
      {
        q: "Quels avantages sont offerts aux partenaires ?",
        a: `1. <strong>Visibilité :</strong> Logo sur supports print/web.<br/>2. <strong>Mentions :</strong> Réseaux sociaux et newsletter.<br/>3. <strong>Présence :</strong> Stand ou corner lors d'événements.<br/>4. <strong>Fiscalité :</strong> Reçu CERFA pour déduction d'impôts.`,
      },
      {
        q: "Comment se passe la diffusion publique ?",
        a: `Une fois signé :<br/>- <strong>Interne :</strong> Ajout sur notre Notion pour mobiliser les bénévoles.<br/>- <strong>Public :</strong> Annonce officielle Instagram, Site Web et Newsletter.`,
      },
    ],
  },
  {
    id: "association",
    title: "Notre Association",
    icon: Users,
    color: "text-purple-400",
    borderColor: "border-purple-500/20",
    bgHover: "hover:bg-purple-500/10",
    bgActive: "bg-purple-500/20",
    questions: [
      {
        q: "Qui peut rejoindre Manga Paradise ?",
        a: `Tout le monde ! Passionnés, étudiants, parents, pros... L'adhésion est de 20€/an. En tant que partenaire, vous pouvez offrir un tarif réduit (15€) à vos salariés.`,
      },
      {
        q: "Quelles sont vos missions ?",
        a: `Transmission culturelle, Animation d'événements populaires, Inclusion sociale et Actions solidaires.`,
      },
      {
        q: "Quelles sont vos valeurs ?",
        a: `Inclusion, Bienveillance, Créativité, Engagement citoyen et Transparence.`,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
const PartnerFAQ = () => {
  const [activeCategory, setActiveCategory] = useState(faqCategories[0].id);
  const current = faqCategories.find((c) => c.id === activeCategory)!;

  return (
    <div className="min-h-screen bg-[#0F172A] py-10 px-4 md:px-8 lg:px-12">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center mb-10"
      >
        <h1 className="font-display text-4xl md:text-5xl text-white mb-3">
          FAQ Partenariat
        </h1>
        <p className="text-mp-ink-muted text-lg max-w-xl mx-auto">
          Toutes les réponses pour collaborer avec Manga Paradise
        </p>
      </motion.div>

      {/* Category Tabs */}
      <div className="max-w-5xl mx-auto mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {faqCategories.map((cat, idx) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategory;
          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "group flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200",
                "bg-white/50",
                cat.borderColor,
                cat.bgHover,
                isActive && cat.bgActive
              )}
            >
              <Icon className={cn("w-7 h-7", cat.color)} />
              <span
                className={cn(
                  "text-sm font-medium text-center leading-tight",
                  isActive ? "text-white" : "text-slate-300"
                )}
              >
                {cat.title}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Questions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Card
            className={cn(
              "bg-white/50 border p-6 rounded-2xl",
              current.borderColor
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <current.icon className={cn("w-6 h-6", current.color)} />
              <h2 className="text-xl font-semibold text-white font-display">
                {current.title}
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-3">
              {current.questions.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`${activeCategory}-${i}`}
                  className={cn(
                    "border rounded-lg px-4",
                    current.borderColor,
                    "data-[state=open]:bg-mp-cloud/30"
                  )}
                >
                  <AccordionTrigger className="text-white hover:text-slate-200 text-left font-medium py-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-300 leading-relaxed pb-4">
                    {/* Render rich HTML content */}
                    <div
                      dangerouslySetInnerHTML={{ __html: item.a }}
                      className="prose prose-invert prose-sm max-w-none"
                    />
                    {item.cta && (
                      <Link to="/partner-portal/contact" className="block mt-4">
                        <Button
                          variant="outline"
                          className={cn(
                            "border",
                            current.borderColor,
                            current.color,
                            "hover:bg-mp-cloud/50"
                          )}
                        >
                          {item.cta}
                        </Button>
                      </Link>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Contact CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-3xl mx-auto mt-12"
      >
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-700/10 border-amber-500/30 p-8 text-center rounded-2xl">
          <MessageCircle className="w-12 h-12 mx-auto text-amber-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2 font-display">
            Vous ne trouvez pas votre réponse ?
          </h3>
          <p className="text-mp-ink-muted mb-5 max-w-md mx-auto">
            Notre équipe est disponible pour répondre à toutes vos questions sur
            les partenariats.
          </p>
          <Link to="/partner-portal/contact">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-6">
              Contacter le Bureau
            </Button>
          </Link>
        </Card>
      </motion.div>
    </div>
  );
};

export default PartnerFAQ;
