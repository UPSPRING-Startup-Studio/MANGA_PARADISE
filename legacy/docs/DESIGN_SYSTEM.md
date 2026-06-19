# Design System — Manga Paradise “Pop Sanctuary”

> Référence officielle de la direction artistique. Toute nouvelle UI doit s'y conformer. La page **`/agenda`** sert de page de référence visuelle.

---

## 1. Esprit

- **Pop Sanctuary** : papier crème lumineux, accents cinabre chaleureux, décor japonais discret (torii, sakura, kirakira).
- **Interdits** : fonds noirs dominants, esthétique cyberpunk / néons fluo, glow agressifs, glassmorphism gratuit, polices Bebas Neue / Montserrat.
- **A11y / motion** : contraste AA, surfaces 44 px tactile minimum, `prefers-reduced-motion` respecté, animations subtiles.

---

## 2. Palette & tokens

Tous les tokens sont définis en HSL dans `src/index.css` et exposés via `tailwind.config.ts` sous le préfixe `mp-*`.

### Couleurs principales

| Token Tailwind | HSL | HEX référence | Usage |
|---|---|---|---|
| `bg-mp-primary` / `text-mp-primary` | `348 75% 49%` | `#DC1E44` | Cinabre — couleur principale, CTA, accents |
| `bg-mp-primary-600` | — | — | Hover sur primary |
| `bg-mp-primary-50` | — | — | Aplats très clairs (chips, hover doux) |
| `bg-mp-coral` / `text-mp-coral` | `0 85% 64%` | `#F25353` | Accent secondaire chaud |
| `bg-mp-orange` / `text-mp-orange` | `19 92% 66%` | `#F7945B` | Accent tertiaire (gradients, prix) |
| `bg-mp-saffron` / `text-mp-saffron` | `42 100% 68%` | — | Doré — récompenses, OTK, contests |

### Backgrounds clairs

| Token | Usage |
|---|---|
| `bg-mp-paper` | Background neutre par défaut (pages, sections) |
| `bg-mp-cloud` | Surfaces secondaires douces, skeletons |
| `bg-mp-sky` | Bandeaux info, accent froid |
| `bg-mp-sand` | Bandeaux chaleureux, hover sur cards |
| `bg-white` | Cards principales |

### Encre & nuit

| Token | Usage |
|---|---|
| `text-mp-ink` | Texte principal `#334155` |
| `text-mp-ink-soft` | Texte secondaire |
| `text-mp-ink-muted` | Texte tertiaire / placeholder |
| `bg-mp-night` | Footer, sidebars Pro/Admin, BetaGate (uniquement) |
| `border-mp-border` | Bordures par défaut |

### Radius & shadow

- `--radius: 1rem` → utiliser `rounded-2xl` par défaut, `rounded-xl` pour les chips/badges.
- Shadows : `shadow-card`, `shadow-card-lg`, `shadow-primary`, `shadow-primary-lg`. **Pas** de `shadow-2xl`/glow néon.

---

## 3. Typographie

| Rôle | Famille | Poids | Style |
|---|---|---|---|
| Titres (`h1`–`h3`, `display-*`) | **Barlow Condensed** | `font-extrabold` | `italic` toujours |
| Corps, UI | **Poppins** | `font-medium` ou `font-semibold` | normal |
| Mono (timecodes, codes) | system mono | normal | normal |

Classes utilitaires :

- `font-display` → Barlow Condensed.
- `font-display italic font-extrabold` → titres canon.
- `text-display-xl` / `-lg` / `-md` / `-sm` → tailles préréglées.

**Règle stricte** : un seul `<h1>` par page, toujours en `font-display italic font-extrabold`.

---

## 4. Primitives shadcn (charte)

### `Button` — `src/components/ui/button.tsx`

| Variant | Quand l'utiliser |
|---|---|
| `default` | CTA primaire (cinabre plein) |
| `secondary` | CTA secondaire (paper + bordure) |
| `outline` | Action neutre encadrée |
| `ghost` | Action discrète, navigation |
| `link` | Lien inline |
| `cta` | Hero CTA (gradient cinabre → orange) |
| `danger` | Destructive (rouge profond) |
| `hero` / `neon` / `destructive` | **Aliases legacy** — ne pas utiliser pour nouveau code |

Tailles : `sm`, `default`, `lg`, `icon`. Toutes ≥ 40 px de haut → conformes a11y tactile.

### `Card` — `src/components/ui/card.tsx`

- `rounded-2xl` par défaut, `bg-white`, `border-mp-border`, `shadow-card`.
- `CardTitle` est automatiquement en `font-display italic`.
- Hover recommandé : `hover:shadow-card-lg hover:border-mp-primary/40 transition-all`.

### `Badge` — `src/components/ui/badge.tsx`

| Variant | Usage |
|---|---|
| `default` | Cinabre plein |
| `secondary` | Paper + bordure |
| `outline` | Encadré |
| `soft` | Pastille teintée discrète |
| `premium` | Saffron — abonnés Premium / contests |
| `association` | Coral — événements partenaires |

### `Input` — `src/components/ui/input.tsx`

- Hauteur `h-11` recommandée, `bg-white`, focus `ring-mp-primary/20`.
- Toujours associer une icône à gauche pour les recherches (`Search`, `MapPin`, etc.) — cf. Agenda.

---

## 5. Décor charte

### `JapanIcon` — `src/components/decor/JapanIcon.tsx`

Icônes SVG inline, `currentColor` héritée :

```tsx
<JapanIcon name="torii" className="w-32 h-32 text-mp-primary opacity-10" />
```

Disponibles : `torii`, `lantern`, `pagoda`, `sakura`, `cloud`, `trophy`, `speechBubble`, `wing`, `halo`.

**Règle** : à utiliser en décor de fond, opacité ≤ 15 %, jamais comme icône d'action.

### `KirakiraDecor` — `src/components/decor/KirakiraDecor.tsx`

Pétales sakura discrets, animés en boucle avec respect de `prefers-reduced-motion`.

```tsx
<KirakiraDecor density="low" /> // low | medium | high
```

À placer dans un wrapper `pointer-events-none` en fond de section.

---

## 6. Patterns recommandés

### Section Home / page de contenu

```tsx
<section className="py-24 bg-mp-paper relative overflow-hidden">
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-mp-primary/5 rounded-full blur-3xl" />
  </div>
  <div className="container mx-auto px-4 relative z-10">
    <h2 className="font-display italic font-extrabold text-4xl md:text-5xl text-mp-ink mb-4">
      Mon titre <span className="text-mp-primary">accentué</span>
    </h2>
    <p className="text-lg text-mp-ink-muted max-w-2xl">…</p>
  </div>
</section>
```

### Carte standard

```tsx
<Card className="hover:shadow-card-lg hover:border-mp-primary/40 transition-all">
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Sous-titre</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
</Card>
```

### Pastille (chip)

```tsx
<span className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                 bg-mp-primary/10 border border-mp-primary/20 text-mp-primary
                 text-sm font-medium">
  <Sparkles className="w-4 h-4" />
  Mon chip
</span>
```

---

## 7. Exceptions sombres autorisées

Certaines surfaces conservent volontairement le thème sombre (`bg-mp-night`) :

- `Footer.tsx`
- `AdminSidebar.tsx`, `PartnerSidebar.tsx`, `AdminAssociationSidebar.tsx`
- `BetaGate.tsx`
- `LineUpCanvas.tsx` (générateur visuel pour stories Instagram)

**N'introduire aucun nouveau composant sombre sans validation produit.**

---

## 8. Anti-patterns à proscrire

- ❌ `#FF007F`, `#00F0FF`, `#FFD700` ou tout hexa hardcodé → utiliser les tokens `mp-*`.
- ❌ `bg-slate-900`, `bg-slate-800`, `text-slate-400/500/600` → utiliser `bg-mp-paper` / `bg-white` / `bg-mp-cloud` et `text-mp-ink-*`.
- ❌ `backdrop-blur` hors de `Navigation`.
- ❌ `font-display` sans `italic` (titre incomplet).
- ❌ Plusieurs `<h1>` sur une page.
- ❌ Animations `animate-pulse` ou keyframes glow sur du texte courant.
- ❌ Polices Bebas Neue, Montserrat, Orbitron — purgées.

---

## 9. Recette avant merge

Checklist visuelle minimale :

- [ ] 0 hexa cyberpunk (`#FF007F` / `#00F0FF` / `#FFD700`) hors exceptions
- [ ] 0 `backdrop-blur` hors `Navigation`
- [ ] Titres en `font-display italic font-extrabold`
- [ ] Un seul `<h1>` par page
- [ ] Contraste AA validé (texte sur fond clair / sombre)
- [ ] Surfaces tactiles ≥ 44 px
- [ ] `prefers-reduced-motion` respecté
- [ ] Responsive 320 px → 1440 px sans casse
- [ ] `npm run build` OK

---

## 10. Ressources

- **Charte officielle PDF** : `docs/charte/A4-PDF-ALL_compressed__1.pdf` (interne)
- **Spec source** : `MP_REFONTE_DA.md` (audit + plan d'implémentation)
- **Page de référence vivante** : `/agenda`
