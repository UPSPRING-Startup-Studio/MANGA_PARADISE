import { Reveal } from "@/components/landing/reveal";

type Milestone = {
  date: string;
  title: string;
  desc: string;
  dateColor: string;
  active: boolean;
};

const ITEMS: Milestone[] = [
  {
    date: "Fin Avril 2026",
    title: "Prototype MVP",
    desc: "Validation terrain — Play Azur Festival",
    dateColor: "text-mp-primary",
    active: true,
  },
  {
    date: "Oct-Nov 2026",
    title: "Beta Publique",
    desc: "Ouverture des inscriptions",
    dateColor: "text-mp-orange",
    active: false,
  },
  {
    date: "Mars 2027",
    title: "V1 Publique",
    desc: "Déploiement national complet",
    dateColor: "text-mp-gamer",
    active: false,
  },
];

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className={`block size-6 rounded-full border-[3px] ${
        active
          ? "bg-mp-primary [animation:glow-pulse_2.5s_ease-in-out_infinite] border-white"
          : "border-border bg-transparent"
      }`}
    />
  );
}

function EnCours() {
  return (
    <span className="bg-mp-gamer rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
      En cours
    </span>
  );
}

export function RoadmapSection() {
  return (
    <section id="roadmap" className="bg-background px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal className="mb-14 text-center">
          <span className="text-mp-primary text-sm font-bold tracking-wide uppercase">
            Roadmap
          </span>
          <h2 className="text-foreground mt-2 text-3xl sm:text-4xl">
            Le chemin du Hokage
          </h2>
        </Reveal>

        {/* Desktop — horizontale */}
        <div className="hidden md:block">
          <div className="relative flex items-start justify-between">
            <div className="bg-border absolute top-2.5 right-[8%] left-[8%] h-[3px] rounded">
              <div className="bg-mp-primary h-full w-[16%] rounded" />
            </div>
            {ITEMS.map((r, i) => (
              <Reveal
                key={r.title}
                delay={0.15 + i * 0.12}
                className="relative z-[2] flex-1 text-center"
              >
                <div className="mx-auto mb-4 w-fit">
                  <Dot active={r.active} />
                </div>
                {r.active && (
                  <div className="mb-2">
                    <EnCours />
                  </div>
                )}
                <div className={`text-sm font-bold ${r.dateColor}`}>
                  {r.date}
                </div>
                <div className="text-foreground text-lg font-extrabold">
                  {r.title}
                </div>
                <p className="text-muted-foreground mx-auto max-w-[200px] text-sm">
                  {r.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Mobile — verticale */}
        <div className="relative pl-9 md:hidden">
          <div className="bg-border absolute top-0 bottom-0 left-2.5 w-[3px] rounded">
            <div className="bg-mp-primary h-1/3 w-full rounded" />
          </div>
          {ITEMS.map((r, i) => (
            <Reveal
              key={r.title}
              delay={0.1 + i * 0.1}
              className="relative mb-9"
            >
              <div className="absolute top-0.5 -left-9">
                <Dot active={r.active} />
              </div>
              <div className="mb-1 flex items-center gap-2">
                <span className={`text-sm font-bold ${r.dateColor}`}>
                  {r.date}
                </span>
                {r.active && <EnCours />}
              </div>
              <div className="text-foreground text-lg font-extrabold">
                {r.title}
              </div>
              <p className="text-muted-foreground text-sm">{r.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
