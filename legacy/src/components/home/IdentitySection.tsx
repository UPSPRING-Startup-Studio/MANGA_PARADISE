import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shirt, Gamepad2, Palette } from "lucide-react";

const archetypes = [
  {
    id: "otaku",
    label: "L'Otaku",
    icon: BookOpen,
    color: "from-pink-500 to-rose-500",
    borderColor: "border-pink-500",
    bgGlow: "bg-pink-500/20",
    image: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767945787/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.03.00_gh9tji.png",
    title: "Ta Mangathèque Virtuelle",
    description: "Crée ta collection et note tes animes. Partage tes découvertes avec la communauté et découvre de nouveaux titres grâce aux recommandations personnalisées.",
  },
  {
    id: "cosplayer",
    label: "Le Cosplayer",
    icon: Shirt,
    color: "from-violet-500 to-purple-500",
    borderColor: "border-violet-500",
    bgGlow: "bg-violet-500/20",
    image: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767945800/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.03.14_syukza.png",
    title: "Ton Vestiaire Digital",
    description: "Gère tes projets et affiche ton portfolio HD. Organise tes costumes, planifie tes créations et partage ta progression avec d'autres passionnés.",
  },
  {
    id: "gamer",
    label: "Le Gamer",
    icon: Gamepad2,
    color: "from-emerald-500 to-green-500",
    borderColor: "border-emerald-500",
    bgGlow: "bg-emerald-500/20",
    image: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767945874/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.04.27_uq5cn9.png",
    title: "Party Finder Intégré",
    description: "Trouve ta Squad avec le Party Finder. Rejoins des groupes pour tes jeux préférés et participe à des sessions gaming entre passionnés.",
  },
  {
    id: "creative",
    label: "Le Créatif",
    icon: Palette,
    color: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500",
    bgGlow: "bg-amber-500/20",
    image: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767945847/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.04.01_yeexoq.png",
    title: "Ta Galerie d'Art",
    description: "Expose tes œuvres et ouvre tes commissions. Montre ton talent au monde et connecte-toi avec des clients potentiels directement via la plateforme.",
  },
];

const IdentitySection = () => {
  const [activeArchetype, setActiveArchetype] = useState(archetypes[0]);

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            🎭 Ton Identité
          </span>
          <h2 className="font-display italic font-extrabold text-4xl md:text-5xl lg:text-6xl mb-4 text-foreground">
            Incarne ton <span className="text-primary">Héros</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choisis ta voie et personnalise ton profil selon ta passion principale
          </p>
        </motion.div>

        {/* Interactive Content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Archetype Tabs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {archetypes.map((archetype, index) => {
              const Icon = archetype.icon;
              const isActive = activeArchetype.id === archetype.id;

              return (
                <motion.button
                  key={archetype.id}
                  onClick={() => setActiveArchetype(archetype)}
                  onMouseEnter={() => setActiveArchetype(archetype)}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    w-full p-5 rounded-2xl flex items-center gap-4 text-left
                    transition-all duration-300 group relative overflow-hidden
                    ${isActive 
                      ? `bg-gradient-to-r ${archetype.color} text-white shadow-xl scale-[1.02]` 
                      : 'bg-card hover:bg-muted/50 border border-border'
                    }
                  `}
                >
                  {/* Glow effect */}
                  {isActive && (
                    <div className={`absolute inset-0 ${archetype.bgGlow} blur-xl opacity-50`} />
                  )}
                  
                  <div className={`
                    relative z-10 w-14 h-14 rounded-xl flex items-center justify-center
                    transition-all duration-300
                    ${isActive 
                      ? 'bg-white/20' 
                      : `bg-gradient-to-br ${archetype.color} bg-opacity-10`
                    }
                  `}>
                    <Icon className={`w-7 h-7 ${isActive ? 'text-white' : 'text-foreground'}`} />
                  </div>
                  
                  <div className="relative z-10 flex-1">
                    <h3 className={`font-display text-xl ${isActive ? 'text-white' : 'text-foreground'}`}>
                      {archetype.label}
                    </h3>
                    <p className={`text-sm ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {archetype.title}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <motion.div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-white/20' : 'bg-muted'}`}
                    animate={{ x: isActive ? 5 : 0 }}
                  >
                    <span className={isActive ? 'text-white' : 'text-muted-foreground'}>→</span>
                  </motion.div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Right: Dynamic Content - App Mockup Style */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeArchetype.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* App Window Frame */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-mp-night border border-mp-night-border">
                  {/* Window Header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-mp-night-card border-b border-mp-night-border">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-slate-300 text-sm font-medium">
                        Manga Paradise — {activeArchetype.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Screenshot Content */}
                  <img
                    src={activeArchetype.image}
                    alt={activeArchetype.title}
                    className="w-full h-auto"
                  />
                </div>

                {/* Floating Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className={`
                    absolute -top-4 -right-4 w-20 h-20 rounded-2xl
                    bg-gradient-to-br ${activeArchetype.color}
                    flex items-center justify-center shadow-xl
                    border-4 border-background
                  `}
                >
                  <activeArchetype.icon className="w-10 h-10 text-white" />
                </motion.div>

                {/* Description Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 p-4 bg-card rounded-xl border border-border"
                >
                  <h4 className="font-display italic text-xl text-foreground mb-2">
                    {activeArchetype.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {activeArchetype.description}
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default IdentitySection;
