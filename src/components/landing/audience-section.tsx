import { Reveal } from "@/components/landing/reveal";

type Card = {
  icon: string;
  title: string;
  sub: string;
  badge: string | null;
  text: string;
  border: string;
  tint: string;
  features: string[];
};

const CARDS: Card[] = [
  {
    icon: "👥",
    title: "Fans & Passionnés",
    sub: "Incarne ton héros",
    badge: null,
    text: "text-mp-primary",
    border: "hover:border-mp-primary",
    tint: "bg-mp-primary/10",
    features: [
      "4 modules : Otaku, Cosplayeur, Gamer, Créatif",
      "Agenda catégorisé & événements locaux",
      "Visual Line-Up unique",
      "Gamification via OTK",
      "Profil 100% gratuit",
    ],
  },
  {
    icon: "🎨",
    title: "Créateurs",
    sub: "Professionnalise ta passion",
    badge: null,
    text: "text-mp-creatif",
    border: "hover:border-mp-creatif",
    tint: "bg-mp-creatif/10",
    features: [
      "Portfolio gratuit ou Créateur+",
      "Marketplace : 100% de tes revenus",
      "Fiche exposant 2D interactive",
      "Mise en relation orgas & marques",
      "Dashboard analytics",
    ],
  },
  {
    icon: "🤝",
    title: "Associations",
    sub: "Le moteur de la communauté",
    badge: "100% gratuit",
    text: "text-mp-gamer",
    border: "hover:border-mp-gamer",
    tint: "bg-mp-gamer/10",
    features: [
      "Espace multi-admin avec rôles",
      "Page publique + agenda intégré",
      "Modèles missions bénévolat",
      "Check-in bénévoles QR code",
      "Programme Pionniers (12 mois)",
    ],
  },
  {
    icon: "💼",
    title: "Professionnels B2B",
    sub: "Le SaaS de pilotage Otaku",
    badge: null,
    text: "text-mp-cosplayer",
    border: "hover:border-mp-cosplayer",
    tint: "bg-mp-cosplayer/10",
    features: [
      "Dashboard KPI temps réel",
      "Quêtes drive-to-store",
      "Plan exposant 2D",
      "Billetterie intégrée (5%)",
      "Data niche otaku",
    ],
  },
];

export function AudienceSection() {
  return (
    <section id="audience" className="bg-background relative px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mb-12 text-center">
          <span className="text-mp-primary text-sm font-bold tracking-wide uppercase">
            À chacun sa place
          </span>
          <h2 className="text-foreground mt-2 text-3xl sm:text-4xl">
            Un outil pour chaque acteur
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.1} className="h-full">
              <article
                className={`bg-card relative flex h-full flex-col rounded-2xl border-2 border-transparent p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${card.border}`}
              >
                {card.badge && (
                  <span className="bg-mp-gamer/15 text-mp-gamer absolute top-3.5 right-3.5 rounded-full px-2.5 py-1 text-[9px] font-bold tracking-wide uppercase">
                    {card.badge}
                  </span>
                )}
                <div
                  className={`mb-3.5 grid size-14 place-items-center rounded-2xl text-2xl ${card.tint}`}
                >
                  {card.icon}
                </div>
                <h3 className={`text-lg font-extrabold ${card.text}`}>
                  {card.title}
                </h3>
                <p className="text-muted-foreground mb-3 text-sm font-medium">
                  {card.sub}
                </p>
                <div className="bg-border my-3 h-px" />
                <ul className="flex flex-col gap-1">
                  {card.features.map((f) => (
                    <li
                      key={f}
                      className="text-muted-foreground flex items-start gap-2 text-sm"
                    >
                      <span
                        className={`mt-1 text-[11px] font-bold ${card.text}`}
                      >
                        ✦
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
