import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════ */
const T = {
  primary: "#C70039",
  primaryHover: "#DB1E44",
  primaryLight: "rgba(199,0,57,0.08)",
  bg: "#FFFFFF",
  bgAlt: "#F8F9FC",
  bgSky: "#EBF1F8",
  text: "#1A1A2E",
  textSecondary: "#4A4A6A",
  textMuted: "#8E8EA0",
  coral: "#E46155",
  orange: "#EC8A5E",
  sakura: "#E7A0A8",
  otaku: "#E91E8C",
  cosplayer: "#9B59B6",
  gamer: "#27AE60",
  creatif: "#F39C12",
  border: "#E8E8F0",
  dark: "#1A1A2E",
  shadowMd: "0 4px 12px rgba(26,26,46,0.06), 0 2px 4px rgba(199,0,57,0.04)",
  shadowLg: "0 12px 32px rgba(26,26,46,0.08), 0 4px 8px rgba(199,0,57,0.06)",
  shadowXl: "0 20px 48px rgba(199,0,57,0.12), 0 8px 16px rgba(199,0,57,0.08)",
  gradientPrimary: "linear-gradient(135deg, #C70039 0%, #E46155 50%, #EC8A5E 100%)",
  fontHeading: "'Outfit', sans-serif",
  fontBody: "'DM Sans', sans-serif",
  fontDisplay: "'Bangers', cursive",
};

const LOGO_URL = "https://res.cloudinary.com/dkw8snibz/image/upload/v1768062945/Logo_Manga_Paradise_VIERGE_xhahrh.png";

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
   ═══════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
@keyframes sakuraFall {
  0%   { transform: translateY(-20px) rotate(0deg) translateX(0); opacity: 0; }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.3; }
  100% { transform: translateY(110vh) rotate(360deg) translateX(50px); opacity: 0; }
}
@keyframes phoneFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 4px 14px rgba(199,0,57,0.3); }
  50%      { box-shadow: 0 6px 28px rgba(199,0,57,0.45), 0 0 36px rgba(199,0,57,0.1); }
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 8px #C70039, 0 0 20px rgba(199,0,57,0.3); }
  50%      { box-shadow: 0 0 16px #C70039, 0 0 40px rgba(199,0,57,0.5); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 150ms !important;
  }
}
`;

/* ═══════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════ */
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ═══════════════════════════════════════════════════════════
   SVG / DECORATIVE COMPONENTS
   ═══════════════════════════════════════════════════════════ */
function ToriiLogo({ size = 40, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <ellipse cx="50" cy="18" rx="18" ry="6" stroke={color} strokeWidth="2.5" fill="none" />
      <path d="M10 40 Q25 30 35 38" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M5 45 Q22 33 33 40" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M90 40 Q75 30 65 38" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M95 45 Q78 33 67 40" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      <rect x="28" y="32" width="44" height="5" rx="2" fill={color} />
      <rect x="32" y="42" width="36" height="3.5" rx="1.5" fill={color} />
      <rect x="34" y="42" width="5" height="48" rx="2" fill={color} />
      <rect x="61" y="42" width="5" height="48" rx="2" fill={color} />
    </svg>
  );
}

function KumoCloud({ flip = false, color = "#FFFFFF" }: { flip?: boolean; color?: string }) {
  return (
    <div style={{ width: "100%", lineHeight: 0, overflow: "hidden", transform: flip ? "scaleY(-1)" : "none" }}>
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: "100%", height: "80px", display: "block" }}>
        <path d="M0,120 C120,100 180,40 320,60 C420,75 480,20 600,40 C720,60 780,10 900,30 C1020,50 1080,15 1200,35 C1300,50 1380,20 1440,40 L1440,120 Z" fill={color} />
        <path d="M0,120 C160,90 240,50 400,70 C520,85 580,35 720,50 C860,65 920,25 1060,45 C1160,58 1280,30 1440,55 L1440,120 Z" fill={color} opacity="0.6" />
      </svg>
    </div>
  );
}

function SakuraPetals() {
  const petals = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i, left: `${10 + Math.random() * 80}%`,
    delay: `${i * 1.8}s`, duration: `${8 + Math.random() * 4}s`,
    size: 10 + Math.random() * 8,
  })), []);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 2 }}>
      {petals.map((p) => (
        <div key={p.id} style={{
          position: "absolute", left: p.left, top: "-20px",
          width: p.size, height: p.size * 0.7,
          background: T.sakura, borderRadius: "50% 0 50% 50%", opacity: 0,
          animation: `sakuraFall ${p.duration} ${p.delay} infinite ease-in`,
        }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CAROUSEL SLIDE WIDGETS (for Features section)
   ═══════════════════════════════════════════════════════════ */
function RadarWidget() {
  const dots = [
    { x: 30, y: 25, c: T.otaku }, { x: 68, y: 20, c: T.cosplayer },
    { x: 22, y: 55, c: T.gamer }, { x: 72, y: 58, c: T.creatif },
    { x: 55, y: 40, c: T.primary }, { x: 38, y: 68, c: T.cosplayer },
  ];
  return (
    <div style={{ width: "100%", background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: T.shadowLg, fontFamily: T.fontBody }}>
      <div style={{ padding: "14px 18px", background: T.primary, color: "#fff", fontFamily: T.fontHeading, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span>📍</span> Radar Communautaire
      </div>
      <div style={{ position: "relative", height: 240, background: T.bgSky, margin: 12, borderRadius: 16, backgroundImage: "radial-gradient(circle, rgba(199,0,57,0.04) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 160, height: 160, borderRadius: "50%", border: `2px dashed ${T.primary}`, opacity: 0.25 }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 20, height: 20, borderRadius: "50%", background: "hsl(var(--mp-saffron))", border: "3px solid #fff", boxShadow: "0 0 12px rgba(255,215,0,0.5)", zIndex: 2 }} />
        {dots.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: `${d.x}%`, top: `${d.y}%`, width: 13, height: 13, borderRadius: "50%", background: d.c, border: "2px solid #fff", boxShadow: `0 0 10px ${d.c}40` }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, padding: "8px 16px 14px", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, background: T.bgAlt, padding: "4px 10px", borderRadius: 99, color: T.textSecondary, fontWeight: 600 }}>Rayon: 15km</span>
        <span style={{ fontSize: 11, background: T.primaryLight, padding: "4px 10px", borderRadius: 99, color: T.primary, fontWeight: 600 }}>12 nakamas</span>
      </div>
    </div>
  );
}

function CosCardWidget() {
  return (
    <div style={{ width: "100%", background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: T.shadowLg, fontFamily: T.fontBody }}>
      <div style={{ padding: "14px 18px", background: "linear-gradient(135deg, #C70039, #E46155)", color: "#fff", fontFamily: T.fontHeading, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span>💳</span> Cos-Card Digitale
      </div>
      <div style={{ padding: 20, textAlign: "center" }}>
        {/* QR */}
        <div style={{ width: 110, height: 110, margin: "0 auto 14px", borderRadius: 14, background: T.bgAlt, border: `2px dashed ${T.primary}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 80, height: 80, display: "grid", gridTemplateColumns: "repeat(6,1fr)", gridTemplateRows: "repeat(6,1fr)", gap: 2 }}>
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} style={{ background: [0,1,5,6,7,11,12,17,18,23,24,25,29,30,31,35].includes(i) ? T.dark : "transparent", borderRadius: 1 }} />
            ))}
          </div>
        </div>
        <div style={{ fontFamily: T.fontHeading, fontWeight: 800, fontSize: 14, color: T.text }}>@LucasProtin</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Cosplayer · Nice · Niveau 12</div>
        {/* Badges */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
          {[{ l: "Sociable 🤝", c: T.gamer }, { l: "VIP 🌟", c: T.creatif }, { l: "Pioneer 🚀", c: T.primary }].map((b, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: `${b.c}15`, color: b.c }}>{b.l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestsWidget() {
  const quests = [
    { name: "Scanner un QR boutique", xp: "+50 XP", otk: "+200 OTK", done: true },
    { name: "Participer à un atelier", xp: "+100 XP", otk: "+500 OTK", done: false },
    { name: "Poster ton cosplay...", xp: "+30 XP", otk: "+100 OTK", done: false },
  ];
  return (
    <div style={{ width: "100%", background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: T.shadowLg, fontFamily: T.fontBody }}>
      <div style={{ padding: "14px 18px", background: T.orange, color: "#fff", fontFamily: T.fontHeading, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span>🏆</span> Quêtes & OTK
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: T.fontHeading, fontWeight: 800, fontSize: 18, color: T.text }}>Niveau 12</span>
          <span style={{ fontFamily: T.fontHeading, fontWeight: 800, fontSize: 16, color: T.orange }}>1,649,952 OTK</span>
        </div>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Chūnin → Jōnin</div>
        <div style={{ height: 8, borderRadius: 99, background: "#F0E6D8", overflow: "hidden" }}>
          <div style={{ width: "68%", height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${T.gamer}, ${T.orange})` }} />
        </div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>6,800 / 10,000 XP</div>
      </div>
      <div style={{ padding: "0 18px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textSecondary, marginBottom: 8 }}>Quêtes actives</div>
        {quests.map((q, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", marginBottom: 5,
            background: q.done ? "rgba(39,174,96,0.06)" : T.bgAlt,
            borderRadius: 10, border: `1px solid ${q.done ? "rgba(39,174,96,0.15)" : T.border}`,
          }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: q.done ? T.gamer : "#e8e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{q.done ? "✓" : ""}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{q.name}</div>
              <div style={{ fontSize: 10, color: T.textMuted }}>{q.xp} · {q.otk}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 1: HERO  (MOD 1 — POP CULTURE en #C70039, MOD 8 — vrai logo)
   ═══════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: T.dark }}>
      {/* Vimeo */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <iframe
          src="https://player.vimeo.com/video/1102758125?h=a073264c5c&badge=0&autopause=0&player_id=0&app_id=58479&autoplay=1&loop=1&muted=1&background=1"
          frameBorder="0" allow="autoplay; fullscreen"
          style={{ position: "absolute", top: "50%", left: "50%", width: "177.78vh", minWidth: "100%", height: "100vh", minHeight: "56.25vw", transform: "translate(-50%, -50%)" }}
          title="Manga Paradise"
        />
      </div>
      <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to bottom, rgba(26,26,46,0.55) 0%, rgba(26,26,46,0.3) 40%, rgba(255,255,255,0.7) 85%, white 100%)" }} />
      <SakuraPetals />

      <div style={{ position: "relative", zIndex: 3, maxWidth: 1200, margin: "0 auto", padding: "140px 24px 80px", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px", minWidth: 300 }}>
          {/* Badge with real logo */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", padding: "8px 18px 8px 8px", borderRadius: 99, marginBottom: 24, border: "1px solid rgba(255,255,255,0.15)" }}>
            <img src={LOGO_URL} alt="Manga Paradise" style={{ height: 30, width: "auto", filter: "brightness(0) invert(1)" }} />
            <span style={{ fontFamily: T.fontHeading, fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: "0.05em" }}>MANGA PARADISE</span>
          </motion.div>

          {/* H1 — MOD 1: POP CULTURE en rouge #C70039 */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            style={{ fontFamily: T.fontHeading, fontWeight: 900, fontSize: "clamp(32px, 5vw, 58px)", lineHeight: 1.05, letterSpacing: "-0.02em", color: "#fff", marginBottom: 20, textShadow: "2px 2px 12px rgba(0,0,0,0.35)" }}>
            LE 1<sup style={{ fontSize: "0.5em" }}>ER</sup> RÉSEAU SOCIAL<br />
            <span style={{ color: T.primary }}>POP CULTURE</span><br />
            JAPONAISE
          </motion.h1>

          {/* Subtitle */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ fontFamily: T.fontBody, fontWeight: 400, fontSize: "clamp(15px, 1.8vw, 18px)", lineHeight: 1.7, color: "rgba(255,255,255,0.85)", maxWidth: 520, marginBottom: 32 }}>
            Le premier écosystème phygital dédié à la pop culture japonaise.
            Otaku, Cosplayeur, Gamer ou Créatif : centralise ton identité,
            gère tes événements et connecte-toi à la communauté.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
            style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 32 }}>
            <a href="#cta" style={{ fontFamily: T.fontHeading, fontWeight: 700, fontSize: 14, color: "#fff", background: T.gradientPrimary, backgroundSize: "200% 200%", padding: "14px 30px", borderRadius: 9999, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em", boxShadow: "0 4px 14px rgba(199,0,57,0.3)", animation: "pulseGlow 3s ease-in-out infinite", transition: "transform 200ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
              Rejoindre la Beta
            </a>
            <a href="#features" style={{ fontFamily: T.fontHeading, fontWeight: 700, fontSize: 14, color: "#fff", background: "transparent", padding: "14px 30px", borderRadius: 9999, textDecoration: "none", border: "2px solid rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em", transition: "all 200ms" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; }}>
              Découvrir
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex" }}>
              {[T.primary, T.otaku, T.cosplayer, T.gamer, T.creatif].map((c, i) => (
                <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: "2px solid rgba(255,255,255,0.8)", marginLeft: i > 0 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>
                  {["🎌", "🎭", "👾", "🎮", "🎨"][i]}
                </div>
              ))}
            </div>
            <span style={{ fontFamily: T.fontBody, fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>+3 500 membres actifs</span>
          </motion.div>
        </div>

        {/* Phone mockup */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
          style={{ flex: "0 0 auto", position: "relative", animation: "phoneFloat 6s ease-in-out infinite", marginBottom: -120 }}>
          <img src="https://res.cloudinary.com/dkw8snibz/image/upload/v1773148067/APP_TEL_3_tzyjnv.png" alt="Manga Paradise App"
            style={{ width: "clamp(240px, 28vw, 340px)", height: "auto", filter: "drop-shadow(0 20px 40px rgba(26,26,46,0.25))" }} />
        </motion.div>
      </div>

      <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, zIndex: 4 }}>
        <KumoCloud color={T.bgAlt} />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 2: FEATURES CAROUSEL  (MOD 2 — remplace scrollytelling)
   ═══════════════════════════════════════════════════════════ */
const FEATURES_SLIDES = [
  {
    emoji: "📍", label: "Le Radar Géolocalisé", accent: T.primary,
    description: "Découvre la communauté autour de toi en toute sécurité.",
    details: ["Carte interactive avec position floue (±500m)", "Filtre par profil : otakus, cosplayers, gamers", "Slider de rayon : 5km à 100km", "Ton marqueur doré pour te repérer"],
    widget: "radar",
  },
  {
    emoji: "🗓️", label: "Le Visual Line-Up", accent: T.cosplayer,
    description: "Annonce ta présence et le cosplay que tu porteras jour par jour.",
    details: ["Affecte un costume à chaque journée", "Génère automatiquement une Story exportable", "Agenda public visible par la communauté", "Vois quels nakamas participent"],
    widget: "agenda",
  },
  {
    emoji: "💳", label: "La Cos-Card Digitale", accent: T.otaku,
    description: "Ta carte de membre digitale pour les conventions.",
    details: ["QR Code — scan = ajout en ami instantané", "Animation de connexion unique", "Badges de convention collectionnables", "5 scans → badge \"Sociable\" débloqué"],
    widget: "coscard",
  },
  {
    emoji: "🏆", label: "Quêtes IRL & OTK", accent: T.orange,
    description: "La vie réelle rapporte des Otaku Coins.",
    details: ["Niveaux : Genin → Chūnin → Hokage", "Scan QR Code en boutique = +OTK", "Participe aux ateliers = XP + badges", "Échange OTK contre goodies et billets"],
    widget: "quests",
  },
];

function SlideWidget({ type }: { type: string }) {
  if (type === "radar") return <RadarWidget />;
  if (type === "coscard") return <CosCardWidget />;
  if (type === "quests") return <QuestsWidget />;
  return (
    <img src="https://res.cloudinary.com/dkw8snibz/image/upload/v1773148066/TEL_APP_2_ejxnbu.png"
      alt="Visual Line-Up" style={{ maxHeight: 450, objectFit: "contain", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))", width: "100%" }} />
  );
}

function FeaturesSection() {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef(0);

  const go = useCallback((dir: number) => {
    setCurrent((p) => (p + dir + FEATURES_SLIDES.length) % FEATURES_SLIDES.length);
  }, []);

  const slide = FEATURES_SLIDES[current];

  return (
    <section id="features" style={{ background: T.bgAlt, position: "relative" }}>
      <div style={{ position: "relative", zIndex: 2, marginTop: -1 }}><KumoCloud flip color={T.bgAlt} /></div>

      <div style={{ textAlign: "center", padding: "40px 24px 0", maxWidth: 600, margin: "0 auto" }}>
        <span style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.primary, letterSpacing: "0.04em" }}>Fonctionnalités Killers</span>
        <h2 style={{ fontFamily: T.fontHeading, fontWeight: 900, fontSize: "clamp(26px, 4vw, 42px)", color: T.text, marginTop: 8, letterSpacing: "-0.02em" }}>L'app qui change tout</h2>
      </div>

      {/* Carousel */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "48px 24px 0", position: "relative" }}
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
        }}>

        {/* Arrows */}
        {[{ dir: -1, pos: "left" as const }, { dir: 1, pos: "right" as const }].map(({ dir, pos }) => (
          <button key={pos} onClick={() => go(dir)}
            style={{
              position: "absolute", top: "50%", [pos]: -8, transform: "translateY(-50%)", zIndex: 5,
              width: 48, height: 48, borderRadius: "50%", border: `2px solid ${T.primary}`,
              background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: T.primary, transition: "all 200ms",
            }}
            className="hidden md:flex"
            onMouseEnter={(e) => { e.currentTarget.style.background = T.primary; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.primary; }}>
            {dir === -1 ? "←" : "→"}
          </button>
        ))}

        {/* Slide content */}
        <motion.div key={current} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap", minHeight: 380 }}>
          {/* Left — text */}
          <div style={{ flex: "1 1 320px", minWidth: 280 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `${slide.accent}12`, padding: "6px 16px 6px 10px", borderRadius: 99, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>{slide.emoji}</span>
              <span style={{ fontFamily: T.fontHeading, fontWeight: 700, fontSize: 14, color: slide.accent }}>{slide.label}</span>
            </div>
            <p style={{ fontFamily: T.fontBody, fontSize: 17, color: T.textSecondary, lineHeight: 1.6, marginBottom: 18, maxWidth: 420 }}>{slide.description}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {slide.details.map((d, j) => (
                <li key={j} style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSecondary, padding: "6px 0", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ color: slide.accent, fontWeight: 700, fontSize: 12, marginTop: 2 }}>✦</span>{d}
                </li>
              ))}
            </ul>
          </div>
          {/* Right — widget */}
          <div style={{ flex: "1 1 320px", minWidth: 260, display: "flex", justifyContent: "center" }}>
            <div style={{ maxWidth: 340, width: "100%" }}>
              <SlideWidget type={slide.widget} />
            </div>
          </div>
        </motion.div>

        {/* Dots */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 32 }}>
          {FEATURES_SLIDES.map((s, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              height: 8, width: current === i ? 24 : 8,
              borderRadius: current === i ? 4 : "50%",
              background: current === i ? s.accent : T.border,
              border: "none", cursor: "pointer", transition: "all 300ms ease",
              padding: 0,
            }} />
          ))}
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, marginTop: 48 }}><KumoCloud color={T.bg} /></div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 3: À CHACUN SA PLACE — 4 CARDS  (MOD 3)
   ═══════════════════════════════════════════════════════════ */
const AUDIENCE_CARDS = [
  {
    icon: "👥", title: "Fans & Passionnés", sub: "Incarne ton héros", accent: T.primary, badge: null,
    features: ["4 modules : Otaku, Cosplayeur, Gamer, Créatif", "Agenda catégorisé & événements locaux", "Visual Line-Up unique", "Gamification via OTK", "Profil 100% gratuit"],
  },
  {
    icon: "🎨", title: "Créateurs", sub: "Professionnalise ta passion", accent: T.creatif, badge: null,
    features: ["Portfolio gratuit ou Créateur+", "Marketplace : 100% de tes revenus", "Fiche exposant 2D interactive", "Mise en relation orgas & marques", "Dashboard analytics"],
  },
  {
    icon: "🤝", title: "Associations", sub: "Le moteur de la communauté", accent: T.gamer, badge: "100% GRATUIT",
    features: ["Espace multi-admin avec rôles", "Page publique + agenda intégré", "Modèles missions bénévolat", "Check-in bénévoles QR code", "Programme Pionniers (12 mois)"],
  },
  {
    icon: "💼", title: "Professionnels B2B", sub: "Le SaaS de pilotage Otaku", accent: T.cosplayer, badge: null,
    features: ["Dashboard KPI temps réel", "Quêtes drive-to-store", "Plan exposant 2D", "Billetterie intégrée (5%)", "Data niche otaku"],
  },
];

function AudienceSection() {
  const { ref, inView } = useInView(0.15);
  return (
    <section id="audience" ref={ref} style={{ background: T.bg, padding: "80px 24px", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, #C70039 0.6px, transparent 0.6px)", backgroundSize: "24px 24px", opacity: 0.03, pointerEvents: "none" }} />
      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.primary }}>À chacun sa place</span>
          <h2 style={{ fontFamily: T.fontHeading, fontWeight: 900, fontSize: "clamp(26px, 4vw, 42px)", color: T.text, marginTop: 8, letterSpacing: "-0.02em" }}>Un outil pour chaque acteur</h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, alignItems: "stretch" }}>
          {AUDIENCE_CARDS.map((card, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              style={{
                background: T.bg, borderRadius: 22, padding: 24,
                border: "2px solid transparent", boxShadow: T.shadowMd,
                transition: "all 400ms ease-out", position: "relative", cursor: "default",
              }}
              onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = "translateY(-6px)"; el.style.borderColor = card.accent; el.style.boxShadow = T.shadowLg; }}
              onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = "translateY(0)"; el.style.borderColor = "transparent"; el.style.boxShadow = T.shadowMd; }}>
              {/* Badge spécial */}
              {card.badge && (
                <span style={{ position: "absolute", top: 14, right: 14, fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: `${T.gamer}18`, color: T.gamer, textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.badge}</span>
              )}
              {/* Icon */}
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `${card.accent}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14, transition: "transform 300ms" }}
                className="card-icon">{card.icon}</div>
              <div style={{ fontFamily: T.fontHeading, fontWeight: 800, fontSize: 18, color: card.accent, marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontFamily: T.fontBody, fontWeight: 500, fontSize: 13, color: T.textSecondary, marginBottom: 12 }}>{card.sub}</div>
              <div style={{ height: 1, background: T.border, margin: "12px 0" }} />
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {card.features.map((f, j) => (
                  <li key={j} style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSecondary, padding: "5px 0", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: card.accent, fontWeight: 700, fontSize: 11, marginTop: 3, flexShrink: 0 }}>✦</span>{f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 4: GAMIFICATION OTK  (MOD 4 — ajustements typo)
   ═══════════════════════════════════════════════════════════ */
function GamificationSection() {
  const { ref, inView } = useInView(0.2);
  const earnList = ["Complète des quêtes dans l'app", "Rends-toi chez des partenaires (scan QR)", "Participe aux événements IRL", "Enrichis ton profil et ta collection"];
  const spendList = ["Cadres animés et thèmes premium", "Slots de cosplays supplémentaires", "Places de cinéma en avant-première", "Billets d'événements exclusifs", "Goodies et merch partenaires"];

  return (
    <section id="gamification" style={{ background: T.bgSky, position: "relative" }}>
      <KumoCloud flip color={T.bgSky} />
      <div ref={ref} style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" }}>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ fontFamily: T.fontDisplay, fontSize: 18, color: T.orange }}>Otaku Coins — OTK</span>
          {/* MOD 4: Outfit 900 pour H2, "Dépense en kiffant." en orange */}
          <h2 style={{ fontFamily: T.fontHeading, fontWeight: 900, fontSize: "clamp(26px, 4vw, 42px)", color: T.text, marginTop: 8, letterSpacing: "-0.02em" }}>
            Gagne en jouant. <span style={{ color: T.orange }}>Dépense en kiffant.</span>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, alignItems: "stretch" }}>
          {/* Card 1 — Earn */}
          <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ background: T.bg, borderRadius: 20, padding: 28, border: `1px solid ${T.border}`, boxShadow: T.shadowMd, transition: "all 400ms ease-out" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = T.shadowLg; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadowMd; }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🎮</div>
            <h3 style={{ fontFamily: T.fontHeading, fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 16 }}>Comment gagner ?</h3>
            {earnList.map((item, i) => (
              <div key={i} style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSecondary, padding: "6px 0", display: "flex", gap: 8 }}>
                <span style={{ color: T.gamer, fontWeight: 700 }}>+</span> {item}
              </div>
            ))}
          </motion.div>

          {/* Card 2 — Spend */}
          <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.25 }}
            style={{ background: T.bg, borderRadius: 20, padding: 28, border: `1px solid ${T.border}`, boxShadow: T.shadowMd, transition: "all 400ms ease-out" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = T.shadowLg; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = T.shadowMd; }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🎁</div>
            <h3 style={{ fontFamily: T.fontHeading, fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 16 }}>Comment dépenser ?</h3>
            {spendList.map((item, i) => (
              <div key={i} style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSecondary, padding: "6px 0", display: "flex", gap: 8 }}>
                <span style={{ color: T.orange, fontWeight: 700 }}>→</span> {item}
              </div>
            ))}
          </motion.div>

          {/* Card 3 — Visual OTK */}
          <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.4 }}
            style={{ background: "linear-gradient(135deg, #1A1A2E, #2D1B4E)", borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ fontFamily: T.fontHeading, fontWeight: 900, fontSize: 64, color: T.orange, lineHeight: 1, marginBottom: 16, textShadow: `0 0 40px ${T.orange}40` }}>OTK</div>
            <div style={{ width: 80, height: 80, borderRadius: "50%", marginBottom: 16, background: "radial-gradient(circle, rgba(255,215,0,0.3), transparent 70%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: "0 0 40px rgba(255,215,0,0.2)" }}>💰</div>
            <p style={{ fontFamily: T.fontBody, fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 220 }}>Transforme ton temps IRL en récompenses physiques.</p>
          </motion.div>
        </div>
      </div>
      <KumoCloud color={T.bg} />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 5: TRACTION — SUPPRIMÉE (MOD 5)
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   SECTION 6: ROADMAP — Timeline horizontale (MOD 6)
   ═══════════════════════════════════════════════════════════ */
const ROADMAP_ITEMS = [
  { date: "Fin Avril 2026", title: "Prototype MVP", desc: "Validation terrain — Play Azur Festival", color: T.primary, active: true },
  { date: "Oct-Nov 2026", title: "Beta Publique", desc: "Ouverture des inscriptions", color: T.orange, active: false },
  { date: "Mars 2027", title: "V1 Publique", desc: "Déploiement national complet", color: T.gamer, active: false },
];

function RoadmapSection() {
  const { ref, inView } = useInView(0.2);
  return (
    <section id="roadmap" style={{ background: T.bg, padding: "80px 24px", position: "relative" }}>
      <div ref={ref} style={{ maxWidth: 900, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.primary }}>ROADMAP</span>
          <h2 style={{ fontFamily: T.fontHeading, fontWeight: 900, fontSize: "clamp(26px, 4vw, 42px)", color: T.text, marginTop: 8, letterSpacing: "-0.02em" }}>Le chemin du Hokage</h2>
        </motion.div>

        {/* Desktop — horizontal timeline */}
        <div className="hidden md:block">
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Line */}
            <div style={{ position: "absolute", top: 11, left: "8%", right: "8%", height: 3, borderRadius: 2, background: T.border }}>
              <div style={{ height: "100%", width: "16%", borderRadius: 2, background: T.primary }} />
            </div>
            {/* Nodes */}
            {ROADMAP_ITEMS.map((r, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.12 }}
                style={{ flex: 1, textAlign: "center", position: "relative", zIndex: 2 }}>
                {/* Dot */}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", margin: "0 auto 16px",
                  background: r.active ? T.primary : "transparent",
                  border: `3px solid ${r.active ? "#fff" : T.border}`,
                  animation: r.active ? "glowPulse 2.5s ease-in-out infinite" : "none",
                  boxShadow: r.active ? `0 0 8px ${T.primary}, 0 0 20px rgba(199,0,57,0.3)` : "none",
                }} />
                {r.active && (
                  <span style={{ display: "inline-block", fontFamily: T.fontHeading, fontWeight: 700, fontSize: 10, padding: "3px 10px", borderRadius: 99, background: T.gamer, color: "#fff", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>EN COURS</span>
                )}
                <div style={{ fontFamily: T.fontHeading, fontWeight: 700, fontSize: 14, color: r.color, marginBottom: 4 }}>{r.date}</div>
                <div style={{ fontFamily: T.fontHeading, fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontFamily: T.fontBody, fontWeight: 400, fontSize: 13, color: T.textSecondary, maxWidth: 200, margin: "0 auto" }}>{r.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile — vertical timeline */}
        <div className="md:hidden" style={{ position: "relative", paddingLeft: 36 }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: 11, top: 0, bottom: 0, width: 3, borderRadius: 2, background: T.border }}>
            <div style={{ height: "33%", width: "100%", borderRadius: 2, background: T.primary }} />
          </div>
          {ROADMAP_ITEMS.map((r, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }} animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              style={{ position: "relative", marginBottom: 36 }}>
              {/* Dot */}
              <div style={{
                position: "absolute", left: -36 + 0, top: 2,
                width: 24, height: 24, borderRadius: "50%",
                background: r.active ? T.primary : "transparent",
                border: `3px solid ${r.active ? "#fff" : T.border}`,
                animation: r.active ? "glowPulse 2.5s ease-in-out infinite" : "none",
                boxShadow: r.active ? `0 0 8px ${T.primary}, 0 0 20px rgba(199,0,57,0.3)` : "none",
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: T.fontHeading, fontWeight: 700, fontSize: 14, color: r.color }}>{r.date}</span>
                {r.active && (
                  <span style={{ fontFamily: T.fontHeading, fontWeight: 700, fontSize: 9, padding: "2px 8px", borderRadius: 99, background: T.gamer, color: "#fff", textTransform: "uppercase" }}>EN COURS</span>
                )}
              </div>
              <div style={{ fontFamily: T.fontHeading, fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 2 }}>{r.title}</div>
              <div style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSecondary }}>{r.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 7: FINAL CTA
   ═══════════════════════════════════════════════════════════ */
function FinalCTASection() {
  const { ref, inView } = useInView(0.3);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (email.trim()) setSubmitted(true); };

  return (
    <section id="cta" style={{ background: T.bgSky, position: "relative", overflow: "hidden" }}>
      <KumoCloud flip color={T.bgSky} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.03, pointerEvents: "none" }}>
        <ToriiLogo size={400} color={T.primary} />
      </div>
      <div ref={ref} style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px 80px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
          <span style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.primary }}>Prêt à rejoindre l'aventure ?</span>
          <h2 style={{ fontFamily: T.fontHeading, fontWeight: 900, fontSize: "clamp(26px, 4vw, 42px)", color: T.text, marginTop: 8, letterSpacing: "-0.02em" }}>
            Rejoins <span style={{ color: T.primary }}>3 500</span> nakamas
          </h2>
          <p style={{ fontFamily: T.fontBody, fontSize: 16, color: T.textSecondary, marginTop: 12, marginBottom: 32 }}>Inscris-toi à la liste d'attente de la Beta Publique.</p>
        </motion.div>

        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.15 }}
          style={{ display: "flex", gap: 0, maxWidth: 460, margin: "0 auto 16px", borderRadius: 9999, overflow: "hidden", boxShadow: T.shadowMd, border: `1px solid ${T.border}`, background: T.bg }}>
          <input type="email" placeholder="ton@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ flex: 1, padding: "14px 20px", border: "none", outline: "none", fontFamily: T.fontBody, fontSize: 15, color: T.text, background: "transparent", minWidth: 0 }} />
          <button type="submit" style={{ fontFamily: T.fontHeading, fontWeight: 700, fontSize: 13, color: "#fff", background: T.gradientPrimary, backgroundSize: "200% 200%", padding: "14px 24px", border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", transition: "transform 200ms" }}>
            {submitted ? "✓ Inscrit !" : "S'inscrire"}
          </button>
        </motion.form>

        <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textMuted }}>Beta prévue fin 2026 · Gratuit · Pas de spam 🍥</p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          {[
            { label: "Instagram · 3 200+ abonnés", icon: "📸" },
            { label: "Discord · Communauté active", icon: "💬" },
          ].map((b, i) => (
            <span key={i} style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 99, background: T.bg, color: T.textSecondary, border: `1px solid ${T.border}`, boxShadow: T.shadowMd, display: "flex", alignItems: "center", gap: 6 }}>
              {b.icon} {b.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  useEffect(() => {
    const id = "landing-keyframes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
    return () => { const el = document.getElementById(id); if (el) el.remove(); };
  }, []);

  return (
    <div style={{ fontFamily: T.fontBody, color: T.text, overflowX: "hidden" }}>
      <Navigation variant="landing" />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AudienceSection />
        <GamificationSection />
        {/* MOD 5: TractionSection supprimée */}
        <RoadmapSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
