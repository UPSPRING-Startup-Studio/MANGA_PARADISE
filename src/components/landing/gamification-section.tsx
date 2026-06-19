import { Reveal } from "@/components/landing/reveal";
import { KumoCloud } from "@/components/landing/decorations";

const EARN = [
  "Complète des quêtes dans l'app",
  "Rends-toi chez des partenaires (scan QR)",
  "Participe aux événements IRL",
  "Enrichis ton profil et ta collection",
];

const SPEND = [
  "Cadres animés et thèmes premium",
  "Slots de cosplays supplémentaires",
  "Places de cinéma en avant-première",
  "Billets d'événements exclusifs",
  "Goodies et merch partenaires",
];

export function GamificationSection() {
  return (
    <section id="gamification" className="bg-mp-sky relative">
      <KumoCloud flip className="text-mp-sky" />
      <div className="mx-auto max-w-4xl px-6 pt-10 pb-20">
        <Reveal className="mb-12 text-center">
          <span className="text-mp-orange text-sm font-bold tracking-wide uppercase">
            Otaku Coins — OTK
          </span>
          <h2 className="text-foreground mt-2 text-3xl sm:text-4xl">
            Gagne en jouant.{" "}
            <span className="text-mp-orange">Dépense en kiffant.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal delay={0.1} className="h-full">
            <article className="bg-card border-border h-full rounded-2xl border p-7 shadow-sm">
              <div className="mb-3 text-3xl">🎮</div>
              <h3 className="text-foreground mb-4 text-xl font-extrabold">
                Comment gagner ?
              </h3>
              {EARN.map((item) => (
                <div
                  key={item}
                  className="text-muted-foreground flex gap-2 py-1.5 text-sm"
                >
                  <span className="text-mp-gamer font-bold">+</span> {item}
                </div>
              ))}
            </article>
          </Reveal>

          <Reveal delay={0.25} className="h-full">
            <article className="bg-card border-border h-full rounded-2xl border p-7 shadow-sm">
              <div className="mb-3 text-3xl">🎁</div>
              <h3 className="text-foreground mb-4 text-xl font-extrabold">
                Comment dépenser ?
              </h3>
              {SPEND.map((item) => (
                <div
                  key={item}
                  className="text-muted-foreground flex gap-2 py-1.5 text-sm"
                >
                  <span className="text-mp-orange font-bold">→</span> {item}
                </div>
              ))}
            </article>
          </Reveal>

          <Reveal delay={0.4} className="h-full">
            <article className="from-mp-night to-mp-violet flex h-full flex-col items-center justify-center rounded-2xl bg-linear-to-br p-7 text-center">
              <div className="text-mp-orange text-6xl leading-none font-extrabold drop-shadow-lg">
                OTK
              </div>
              <div className="bg-mp-saffron/20 my-4 grid size-20 place-items-center rounded-full text-4xl">
                💰
              </div>
              <p className="max-w-[220px] text-sm leading-relaxed text-white/70">
                Transforme ton temps IRL en récompenses physiques.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
      <KumoCloud className="text-background" />
    </section>
  );
}
