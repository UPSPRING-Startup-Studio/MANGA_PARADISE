import { motion } from "framer-motion";
import { Zap, Target, Gift, Coins, Trophy, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const quests = [
  { title: "Scanner un QR Code en boutique", xp: 50, otk: 100, icon: "📱" },
  { title: "Participer à un atelier", xp: 100, otk: 200, icon: "🎨" },
  { title: "Poster une photo de cosplay", xp: 75, otk: 150, icon: "📸" },
];

const loot = [
  { name: "Réduction Ramen -20%", cost: 500, icon: "🍜" },
  { name: "Place de Ciné", cost: 1500, icon: "🎬" },
  { name: "Goodies Exclusifs", cost: 800, icon: "🎁" },
  { name: "Badge Collector", cost: 300, icon: "🏅" },
];

const GamificationSection = () => {
  return (
    <section className="py-24 bg-mp-paper relative overflow-hidden">
      {/* Décor charte doux */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-mp-primary/15 to-transparent" />
        <div className="absolute top-2/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-mp-orange/15 to-transparent" />
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-mp-saffron/15 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mp-saffron/15 border border-mp-saffron/30 text-mp-orange text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Système RPG
          </span>
          <h2 className="font-display italic font-extrabold text-4xl md:text-5xl lg:text-6xl text-mp-ink mb-4">
            Joue, <span className="text-mp-primary">Gagne</span>, Dépense
          </h2>
          <p className="text-lg text-mp-ink-muted max-w-2xl mx-auto">
            Accomplis des quêtes, gagne de l'XP et des OTK Coins pour débloquer des récompenses exclusives
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: XP & Level System + Screenshot */}
          <div className="space-y-6">
            {/* Level Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-mp-border p-6 shadow-card"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mp-primary to-mp-coral flex items-center justify-center">
                    <span className="font-display italic text-3xl text-white">12</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-mp-saffron flex items-center justify-center border-2 border-white">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-mp-ink font-display italic text-xl">Niveau 12</h3>
                  <p className="text-mp-ink-muted text-sm">Rang : Chūnin</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-mp-ink-muted mb-1">
                      <span>2 450 XP</span>
                      <span>3 000 XP</span>
                    </div>
                    <Progress value={82} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-mp-cloud rounded-xl">
                  <Trophy className="w-6 h-6 text-mp-saffron mx-auto mb-1" />
                  <p className="text-mp-ink font-bold">24</p>
                  <p className="text-mp-ink-muted text-xs">Quêtes</p>
                </div>
                <div className="text-center p-3 bg-mp-cloud rounded-xl">
                  <Target className="w-6 h-6 text-mp-primary mx-auto mb-1" />
                  <p className="text-mp-ink font-bold">8</p>
                  <p className="text-mp-ink-muted text-xs">Badges</p>
                </div>
                <div className="text-center p-3 bg-mp-cloud rounded-xl">
                  <Gift className="w-6 h-6 text-mp-coral mx-auto mb-1" />
                  <p className="text-mp-ink font-bold">12</p>
                  <p className="text-mp-ink-muted text-xs">Récompenses</p>
                </div>
              </div>
            </motion.div>

            {/* OTK Balance Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-card-lg bg-white border border-mp-border">
                {/* Window Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-mp-cloud border-b border-mp-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-mp-primary" />
                    <div className="w-3 h-3 rounded-full bg-mp-saffron" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-mp-ink-muted text-sm font-medium">
                      Mon Portefeuille OTK
                    </span>
                  </div>
                </div>

                {/* Screenshot Content */}
                <img
                  src="https://res.cloudinary.com/dkw8snibz/image/upload/v1767945735/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.02.09_rxw5um.png"
                  alt="Solde OTK Coins"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>

          {/* Right: Quests & Loot */}
          <div className="space-y-6">
            {/* Quests */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-mp-border p-6 shadow-card"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mp-saffron to-mp-orange flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-mp-ink font-display italic text-xl">Quêtes Actives</h3>
                  <p className="text-mp-ink-muted text-sm">Gagne XP & OTK Coins</p>
                </div>
              </div>

              <div className="space-y-3">
                {quests.map((quest, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-mp-cloud rounded-xl hover:bg-mp-sand transition-colors group"
                  >
                    <span className="text-2xl">{quest.icon}</span>
                    <div className="flex-1">
                      <p className="text-mp-ink font-medium">{quest.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-mp-primary text-xs font-semibold">+{quest.xp} XP</span>
                        <span className="text-mp-orange text-xs flex items-center gap-1 font-semibold">
                          <Coins className="w-3 h-3" />
                          +{quest.otk}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-mp-border group-hover:border-mp-primary transition-colors" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Loot Shop */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-mp-border p-6 shadow-card"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mp-primary to-mp-coral flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-mp-ink font-display italic text-xl">Bazar Akihabara</h3>
                  <p className="text-mp-ink-muted text-sm">Dépense tes OTK Coins</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {loot.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 bg-mp-cloud rounded-xl hover:bg-mp-sand transition-colors text-center group cursor-pointer"
                  >
                    <span className="text-3xl block mb-2">{item.icon}</span>
                    <p className="text-mp-ink text-sm font-medium">{item.name}</p>
                    <p className="text-mp-orange text-xs flex items-center justify-center gap-1 mt-2 font-semibold">
                      <Coins className="w-3 h-3" />
                      {item.cost}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* OTK Coin Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: "spring" }}
              className="flex justify-center"
            >
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-mp-saffron to-mp-orange flex items-center justify-center shadow-card-lg"
              >
                <Coins className="w-10 h-10 text-white" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamificationSection;
