/**
 * Maquettes décoratives illustrant les fonctionnalités (carrousel).
 * Purement présentationnel (composants serveur), couleurs via tokens.
 */

const RADAR_DOTS = [
  { x: "30%", y: "25%", color: "bg-mp-otaku" },
  { x: "68%", y: "20%", color: "bg-mp-cosplayer" },
  { x: "22%", y: "55%", color: "bg-mp-gamer" },
  { x: "72%", y: "58%", color: "bg-mp-creatif" },
  { x: "55%", y: "40%", color: "bg-mp-primary" },
  { x: "38%", y: "68%", color: "bg-mp-cosplayer" },
] as const;

export function RadarWidget() {
  return (
    <div className="bg-card w-full overflow-hidden rounded-2xl shadow-lg">
      <div className="bg-mp-primary flex items-center gap-2 px-4 py-3 text-sm font-bold text-white">
        <span>📍</span> Radar Communautaire
      </div>
      <div className="bg-mp-sky/30 relative m-3 h-60 rounded-2xl">
        <div className="border-mp-primary absolute top-1/2 left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed opacity-25" />
        <div className="bg-mp-saffron absolute top-1/2 left-1/2 z-[2] size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md" />
        {RADAR_DOTS.map((d, i) => (
          <span
            key={i}
            className={`${d.color} absolute size-3 rounded-full border-2 border-white`}
            style={{ left: d.x, top: d.y }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 px-4 pt-2 pb-4">
        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-[11px] font-semibold">
          Rayon : 15 km
        </span>
        <span className="bg-mp-primary/10 text-mp-primary rounded-full px-2.5 py-1 text-[11px] font-semibold">
          12 nakamas
        </span>
      </div>
    </div>
  );
}

/** Cellules sombres du faux QR code (motif fixe). */
const QR_DARK = new Set([
  0, 1, 5, 6, 7, 11, 12, 17, 18, 23, 24, 25, 29, 30, 31, 35,
]);

export function CosCardWidget() {
  return (
    <div className="bg-card w-full overflow-hidden rounded-2xl shadow-lg">
      <div className="from-mp-primary to-mp-coral flex items-center gap-2 bg-linear-to-br px-4 py-3 text-sm font-bold text-white">
        <span>💳</span> Cos-Card Digitale
      </div>
      <div className="p-5 text-center">
        <div className="border-mp-primary bg-muted mx-auto mb-3.5 flex size-28 items-center justify-center rounded-xl border-2 border-dashed">
          <div className="grid size-20 grid-cols-6 grid-rows-6 gap-0.5">
            {Array.from({ length: 36 }).map((_, i) => (
              <span
                key={i}
                className={QR_DARK.has(i) ? "bg-mp-night rounded-[1px]" : ""}
              />
            ))}
          </div>
        </div>
        <div className="text-foreground text-sm font-extrabold">
          @LucasProtin
        </div>
        <div className="text-muted-foreground mt-0.5 text-xs">
          Cosplayer · Nice · Niveau 12
        </div>
        <div className="mt-3.5 flex justify-center gap-1.5">
          <span className="bg-mp-gamer/15 text-mp-gamer rounded-full px-2.5 py-1 text-[10px] font-bold">
            Sociable 🤝
          </span>
          <span className="bg-mp-creatif/15 text-mp-creatif rounded-full px-2.5 py-1 text-[10px] font-bold">
            VIP 🌟
          </span>
          <span className="bg-mp-primary/10 text-mp-primary rounded-full px-2.5 py-1 text-[10px] font-bold">
            Pioneer 🚀
          </span>
        </div>
      </div>
    </div>
  );
}

const QUESTS = [
  { name: "Scanner un QR boutique", reward: "+50 XP · +200 OTK", done: true },
  {
    name: "Participer à un atelier",
    reward: "+100 XP · +500 OTK",
    done: false,
  },
  { name: "Poster ton cosplay…", reward: "+30 XP · +100 OTK", done: false },
] as const;

export function QuestsWidget() {
  return (
    <div className="bg-card w-full overflow-hidden rounded-2xl shadow-lg">
      <div className="bg-mp-orange flex items-center gap-2 px-4 py-3 text-sm font-bold text-white">
        <span>🏆</span> Quêtes &amp; OTK
      </div>
      <div className="px-4 pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-foreground text-lg font-extrabold">
            Niveau 12
          </span>
          <span className="text-mp-orange text-base font-extrabold">
            1 649 952 OTK
          </span>
        </div>
        <div className="text-muted-foreground mb-1.5 text-[11px]">
          Chūnin → Jōnin
        </div>
        <div className="bg-mp-sand h-2 overflow-hidden rounded-full">
          <div className="from-mp-gamer to-mp-orange h-full w-[68%] rounded-full bg-linear-to-r" />
        </div>
        <div className="text-muted-foreground mt-1 text-[10px]">
          6 800 / 10 000 XP
        </div>
      </div>
      <div className="px-4 pt-3 pb-4">
        <div className="text-muted-foreground mb-2 text-xs font-bold">
          Quêtes actives
        </div>
        {QUESTS.map((q) => (
          <div
            key={q.name}
            className={`mb-1.5 flex items-center gap-2.5 rounded-lg border p-2.5 ${
              q.done
                ? "border-mp-gamer/20 bg-mp-gamer/10"
                : "border-border bg-muted"
            }`}
          >
            <span
              className={`grid size-5 place-items-center rounded text-[11px] font-bold text-white ${
                q.done ? "bg-mp-gamer" : "bg-border"
              }`}
            >
              {q.done ? "✓" : ""}
            </span>
            <span className="flex-1">
              <span className="text-foreground block text-xs font-semibold">
                {q.name}
              </span>
              <span className="text-muted-foreground block text-[10px]">
                {q.reward}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
