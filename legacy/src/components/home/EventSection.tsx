import { motion } from "framer-motion";
import { Calendar, Users, MapPin, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const lineup = [
  {
    id: 1,
    name: "Tanjiro",
    avatar: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767946199/Cosplay-Tanjiro-Lucas-P_mg6gux.jpg",
  },
  {
    id: 2,
    name: "Deku",
    avatar: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767946225/Deku_Cosplay_MONTAGE_wshb79.png",
  },
  {
    id: 3,
    name: "Mitsuri",
    avatar: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767946315/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.11.50_wiuzpf.png",
  },
  {
    id: 4,
    name: "Rukia Kuchiki",
    avatar: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767946335/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.12.10_a4tha0.png",
  },
  {
    id: 5,
    name: "Junko Enoshima",
    avatar: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767946323/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.11.59_nwjefc.png",
  },
  {
    id: 6,
    name: "Kaeloo",
    avatar: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767946284/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.11.20_mchv2f.png",
  },
  {
    id: 7,
    name: "Raiponce",
    avatar: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767946272/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.11.05_swxmpr.png",
  },
  {
    id: 8,
    name: "Lyney",
    avatar: "https://res.cloudinary.com/dkw8snibz/image/upload/v1767946592/Capture_d_%C3%A9cran_2026-01-09_%C3%A0_09.16.27_zsqkze.png",
  },
];

const scheduleItems = [
  { time: "10:00", event: "Ouverture des portes", type: "info" },
  { time: "11:30", event: "Concours Cosplay - Qualifications", type: "cosplay" },
  { time: "14:00", event: "Meet-up Demon Slayer", type: "meetup" },
  { time: "16:00", event: "Dédicace Mangaka invité", type: "special" },
  { time: "18:30", event: "Finale Concours Cosplay", type: "cosplay" },
];

const meetups = [
  { name: "Groupe Karaoké", time: "14h", members: 8, max: 12 },
  { name: "Session Photo One Piece", time: "15h30", members: 15, max: 20 },
  { name: "Déjeuner Nakamas", time: "12h", members: 6, max: 8 },
];

const EventSection = () => {
  return (
    <section className="py-24 bg-mp-paper relative overflow-hidden">
      {/* Décor doux charte */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-mp-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-mp-orange/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mp-primary/10 border border-mp-primary/20 text-mp-primary text-sm font-medium mb-4">
            <Calendar className="w-4 h-4" />
            Événementiel
          </span>
          <h2 className="font-display italic font-extrabold text-4xl md:text-5xl lg:text-6xl text-mp-ink mb-4">
            Ne vis plus jamais une <br />
            <span className="text-mp-primary">convention seul</span>
          </h2>
          <p className="text-lg text-mp-ink-muted max-w-2xl mx-auto">
            Découvre qui sera présent, planifie tes rencontres et vis l'événement à 100%
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: App Mockup - Event Agenda */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white rounded-3xl border border-mp-border overflow-hidden shadow-card">
              {/* App Header */}
              <div className="bg-gradient-to-r from-mp-primary to-mp-coral px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-display italic text-xl">Japan Expo 2026</h3>
                    <div className="flex items-center gap-2 text-white/90 text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>Paris Nord Villepinte</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">10-13 Juillet</p>
                    <p className="text-white/90 text-sm">Jour 2</p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-mp-primary" />
                  <h4 className="text-mp-ink font-semibold">Programme du jour</h4>
                </div>
                <div className="space-y-3">
                  {scheduleItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-4 p-3 rounded-xl ${
                        item.type === "meetup"
                          ? "bg-mp-primary/10 border border-mp-primary/20"
                          : item.type === "special"
                          ? "bg-mp-saffron/15 border border-mp-saffron/30"
                          : "bg-mp-cloud"
                      }`}
                    >
                      <span className="text-mp-primary font-mono text-sm font-bold min-w-[50px]">
                        {item.time}
                      </span>
                      <span className="text-mp-ink text-sm">{item.event}</span>
                      {item.type === "meetup" && (
                        <span className="ml-auto text-xs bg-mp-primary text-white px-2 py-1 rounded-full">
                          Meet-up
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Visual Line-Up Preview */}
              <div className="px-6 pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-mp-coral" />
                  <h4 className="text-mp-ink font-semibold">Qui sera là ?</h4>
                  <span className="ml-auto text-mp-ink-muted text-sm">55 nakamas</span>
                </div>
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {lineup.slice(0, 6).map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="relative"
                      >
                        <div className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden ring-2 ring-mp-primary/30">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <span className="ml-4 text-mp-ink-muted text-sm">+49 autres...</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Features */}
          <div className="space-y-6">
            {/* Visual Line-Up Full */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-mp-border p-6 shadow-card"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mp-primary to-mp-orange flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-mp-ink font-display italic text-xl">Visual Line-Up</h3>
                  <p className="text-mp-ink-muted text-sm">Sache qui vient et en quoi</p>
                </div>
              </div>

              {/* Avatar Grid with Character Names */}
              <div className="grid grid-cols-4 gap-3">
                {lineup.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="text-center group"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-0.5 bg-gradient-to-br from-mp-primary via-mp-coral to-mp-saffron group-hover:scale-110 transition-transform duration-300 mx-auto">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-mp-ink text-xs font-bold mt-2 truncate">
                      {member.name}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-2 text-mp-primary text-sm">
                  <Sparkles className="w-4 h-4" />
                  Et 47 autres membres...
                </span>
              </div>
            </motion.div>

            {/* Meet-up Groups */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-mp-border p-6 shadow-card"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mp-primary to-mp-coral flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-mp-ink font-display italic text-xl">Meet-ups</h3>
                  <p className="text-mp-ink-muted text-sm">Rejoins un groupe pour l'event</p>
                </div>
              </div>

              <div className="space-y-3">
                {meetups.map((meetup, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-mp-cloud rounded-xl hover:bg-mp-sand transition-colors"
                  >
                    <div>
                      <p className="text-mp-ink font-medium">{meetup.name}</p>
                      <p className="text-mp-ink-muted text-sm">{meetup.time}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-mp-ink-muted text-sm">
                        {meetup.members}/{meetup.max}
                      </span>
                      <Button size="sm">Rejoindre</Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventSection;
