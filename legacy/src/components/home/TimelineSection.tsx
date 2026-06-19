import { motion } from "framer-motion";
import { CheckCircle2, Circle, Smartphone, Building2 } from "lucide-react";

const timelineEvents = [
  {
    year: "2024",
    title: "Lancement de l'Association",
    description: "Création de Manga Paradise et début des activités associatives.",
    status: "completed" as const,
  },
  {
    year: "2025 - 2026",
    title: "Événements & Partenariats",
    description: "Organisation d'événements mensuels et développement du réseau de partenaires.",
    status: "inProgress" as const,
  },
  {
    year: "2027",
    title: "Lancement de l'App & Réseau Social",
    description: "Déploiement de la Super-App communautaire. Ouverture des profils personnalisés (Otaku, Gamer, Cosplayer), lancement du système de gamification (OTK Coins) et des outils de connexion entre fans.",
    status: "future" as const,
    icon: Smartphone,
  },
  {
    year: "2028",
    title: "Ouverture du Tiers-Lieu Hybride",
    description: "Inauguration de l'espace physique à Nice : Bar Manga immersif, Salle Gaming & Arcade, Atelier Coworking pour créateurs et Boutique Solidaire. La convergence totale entre l'appli et le lieu.",
    status: "future" as const,
    icon: Building2,
  },
];

const TimelineSection = () => {
  return (
    <section className="py-20 bg-mp-paper">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display italic font-extrabold text-4xl md:text-5xl text-mp-ink mb-4">
            Notre Roadmap
          </h2>
          <p className="text-lg text-mp-ink-muted max-w-2xl mx-auto">
            Suivez l'évolution du projet vers l'ouverture du tiers-lieu en 2027
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-px"></div>

            {/* Timeline Items */}
            {timelineEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "md:pr-12" : "md:pl-12"} pl-16 md:pl-0`}>
                  <div className={`bg-white border ${
                    event.status === "completed"
                      ? "border-mp-primary/30"
                      : event.status === "inProgress"
                        ? "border-mp-primary ring-2 ring-mp-primary/20 shadow-card-lg"
                        : "border-mp-border"
                  } rounded-2xl p-6 shadow-card hover:shadow-card-lg transition-all`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`font-display italic text-2xl ${
                        event.status === "completed" || event.status === "inProgress" 
                          ? "text-primary" 
                          : "text-muted-foreground"
                      }`}>
                        {event.year}
                      </span>
                      {event.status === "completed" && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                          Complété
                        </span>
                      )}
                      {event.status === "inProgress" && (
                        <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full animate-pulse">
                          En cours
                        </span>
                      )}
                      {event.status === "future" && (
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full">
                          En Projet
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-3">
                      {event.icon && (
                        <event.icon className={`w-6 h-6 mt-1 flex-shrink-0 ${
                          event.status === "inProgress" ? "text-primary" : "text-muted-foreground"
                        }`} />
                      )}
                      <div>
                        <h3 className="font-display italic text-xl mb-2 text-mp-ink">
                          {event.title}
                        </h3>
                        <p className="text-mp-ink-muted text-sm">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Marker */}
                <div className="absolute left-8 md:left-1/2 w-8 h-8 md:-translate-x-4 flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full border-4 border-mp-paper ${
                    event.status === "completed"
                      ? "bg-mp-primary"
                      : event.status === "inProgress"
                        ? "bg-mp-primary animate-pulse"
                        : "bg-mp-cloud"
                  } flex items-center justify-center`}>
                    {event.status === "completed" ? (
                      <CheckCircle2 size={16} className="text-primary-foreground" />
                    ) : event.status === "inProgress" ? (
                      <Smartphone size={14} className="text-primary-foreground" />
                    ) : (
                      <Circle size={12} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;