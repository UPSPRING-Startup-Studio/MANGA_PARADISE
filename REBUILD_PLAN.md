# Manga Paradise — Plan de reconstruction (v1)

> Document fondateur de la réécriture propre. Portable tel quel vers le nouveau dépôt.
> Rédigé le 2026-06-17. Source : audit complet de l'app Lovable existante (~160k lignes, 109 pages, ~60 tables).

---

## 1. Objectif & principes

Reconstruire **l'intégralité des fonctionnalités** de Manga Paradise sur une base **neuve, lisible et maintenable**, hébergée facilement sur **Vercel + Supabase** (nouveau compte, **aucune reprise de données**).

Principes directeurs :

1. **Propreté avant tout** — TypeScript `strict`, zéro `any` toléré, composants courts, code mort interdit.
2. **Documenté en continu** — chaque module a sa doc, chaque décision structurante un ADR.
3. **Une seule façon de faire chaque chose** — une source de vérité pour les rôles, l'accès aux données, le design system.
4. **Architecture par feature** — le code suit le métier, pas la technique.
5. **Sécurité par défaut** — RLS Supabase comme rempart, secrets jamais côté client.
6. **Hébergement & ops simples** — 1 projet Vercel + 1 projet Supabase, migrations versionnées, déploiements automatiques.

### Décisions actées (2026-06-17)

| Décision | Choix |
|---|---|
| Framework frontend | **Next.js (App Router)** + React + TypeScript |
| Mode de reconstruction | **Complète avant mise en ligne** (pas d'échelonnement public) — qualité et doc prioritaires |
| Doublons & stubs | **Consolider** : fusionner les redondances, finir ou cadrer les stubs |
| Hébergement | **Vercel + Supabase**, nouveau compte |
| Données | **Aucune migration** — repartir vide ; le schéma actuel sert de **cahier des charges** |

---

## 2. Stack cible

| Couche | Choix | Notes |
|---|---|---|
| Framework | **Next.js 16 (App Router)** | SSR pour pages publiques (SEO fiches asso/événements), route handlers pour l'API |
| Langage | **TypeScript strict** | `strict: true`, `noUncheckedIndexedAccess`, pas d'`any` |
| UI | **Tailwind CSS + shadcn/ui** | Repris de l'existant, nettoyé et homogénéisé |
| Données serveur | **React Server Components + Server Actions** | Lecture/mutation côté serveur quand pertinent |
| Données client | **TanStack Query v5** | Interactif, temps réel, cache |
| Supabase | **@supabase/ssr** | Clients server / client / middleware (auth par cookies) |
| Auth | **Supabase Auth natif** | Email/password + OAuth Google/Apple — **on supprime `@lovable.dev/cloud-auth-js`** |
| Autorisation | **RLS + `user_roles` + 1 hook/guard** | Source unique (voir §8) |
| Migrations | **Supabase CLI** | `supabase/migrations`, types générés, plus de SQL manuel |
| Formulaires | **react-hook-form + zod** | Schémas zod partagés client/serveur |
| Drag & drop | **dnd-kit** | Form builder, kanban cosplay, lineups, ordre de passage |
| Cartes | **Leaflet** (import dynamique client-only) | Isolé dans un seul module |
| Graphiques | **Recharts** (lazy) | Dashboards admin/asso |
| Animations | **framer-motion** (`motion`) | Usage mesuré |
| Tests | **Vitest** (unit) + **Playwright** (e2e) | Flux critiques couverts |
| Gestionnaire de paquets | **npm** | Standard, déjà disponible sur le poste |
| Qualité | **ESLint + Prettier + Husky + lint-staged** | Pré-commit obligatoire |

### Dépendances supprimées / à ne pas reprendre

- `@lovable.dev/cloud-auth-js`, `lovable-tagger` (couplage Lovable)
- `postgres` (jamais importé — faux besoin)
- `react-confetti` (doublon de `canvas-confetti`)
- `@tsparticles/react` + `@tsparticles/slim` (jamais branchés ; à recâbler seulement si effet voulu)
- `MonAppExpo/` (boilerplate Expo mort)

---

## 3. Architecture & arborescence

Routes **fines** dans `app/`, métier dans `src/features/`.

```
manga-paradise/
├─ app/                          # Next.js App Router — routage uniquement
│  ├─ (public)/                  # landing, login, fiche asso, adhésion publique
│  ├─ (member)/                  # espace membre, cosplay, agenda, communauté…
│  ├─ (association)/             # back-office association
│  ├─ (pro)/                     # espace pro partner
│  ├─ (admin)/                   # console admin
│  ├─ api/                       # route handlers (invite-member, webhooks)
│  ├─ layout.tsx
│  └─ middleware.ts              # refresh session + garde de routes
├─ src/
│  ├─ features/                  # 1 dossier par domaine métier
│  │  ├─ auth/
│  │  ├─ profile/
│  │  ├─ cosplay/
│  │  ├─ events/
│  │  ├─ community/
│  │  ├─ gamification/
│  │  ├─ association/
│  │  ├─ membership-forms/
│  │  ├─ volunteers/
│  │  ├─ pro-partners/
│  │  └─ admin/
│  │     └─ (chaque feature) components/ hooks/ api/ schemas/ types.ts README.md
│  ├─ components/
│  │  ├─ ui/                     # primitives shadcn (partagées)
│  │  └─ layout/                 # nav, sidebars, shells
│  ├─ lib/
│  │  ├─ supabase/               # clients server/client/middleware
│  │  ├─ rbac.ts                 # modèle de rôles unique
│  │  ├─ query-client.ts
│  │  └─ utils/
│  ├─ types/
│  │  └─ database.ts             # généré par Supabase CLI
│  └─ config/
├─ supabase/
│  ├─ migrations/                # propres, versionnées
│  ├─ seed.sql
│  └─ config.toml
├─ docs/                         # voir §6
├─ .env.example
└─ package.json
```

**Règle d'or** : un composant ne parle jamais directement à Supabase. Tout accès passe par le module `api/` de sa feature (queries + mutations typées).

---

## 4. Conventions de code & qualité

- **TS strict**, `any` interdit (règle ESLint `no-explicit-any` en erreur).
- **`no-unused-vars` activé** (l'ancien projet l'avait désactivé → code mort invisible).
- **Taille de composant budgétée** : viser < 300 lignes. Les monolithes de l'ancien projet (`EventDetail` 1750 l., `SettingsOtaku` 1694 l., `RSVPModal` 1377 l.) sont découpés.
- **Nommage** : identifiants en anglais, copie UI en français (structure prête pour i18n si besoin plus tard).
- **Pas de logique dans les pages** `app/` — elles composent des features.
- **Secrets** (`SERVICE_ROLE_KEY`…) uniquement en route handlers / server actions, jamais exposés au client.
- **Commits** : convention emoji ENODEA — ✨ feature, 🐛 bug, 🔥 suppression, 🎨 refactor.
- **Branches** : `DEVELOPMENT` → `staging` → `main` (PR).
- **Validation** : tout input utilisateur validé par un schéma zod partagé.

---

## 5. Modèle de données & migrations

Le schéma actuel (~60 tables, 16 enums, fonctions RLS, triggers) est **réutilisé comme spécification**, recréé propre via Supabase CLI sur le nouveau projet. Nettoyages obligatoires :

- **Unifier le cosplay** : lever l'ambiguïté `cosplay_plans` / `cosplay_vestiaire` / `cosplay_incarnations` → un seul modèle clair.
- **Unifier les rôles** : supprimer `profiles.role` / `profiles.role_function`, ne garder que `user_roles` (global) + rôles contextuels (`association_memberships.role`, `pro_partner_members.role`).
- **`contest_registrations`** : table à définir proprement (utilisée en `as any` dans l'ancien code, possiblement jamais créée) ; ajouter les colonnes réellement affichées (`passage_time`, `judging_time`) au lieu de les mocker.
- **Conserver** les helpers RLS (`is_association_admin`, `is_pro_partner_admin`, `is_association_writable`…) — ils sont bons.
- **Migrations propres** : plus de doublons `* 2.sql`, plus de fichiers `APPLY_*` / `DIAGNOSTIC_*` / `BACKFILL_*` appliqués à la main. Tout passe par `supabase/migrations` + `seed.sql`.
- **Types générés** → `src/types/database.ts` (commit + check CI).
- **Storage** : buckets `cosplay-photos`, `showcase-photos`, + `avatars`, `covers`, `association-documents` selon besoins, avec policies.

---

## 6. Documentation (exigence forte du projet)

```
docs/
├─ architecture.md      # vue d'ensemble + diagrammes
├─ conventions.md       # standards de code détaillés
├─ data-model.md        # tables, relations, RLS, storage
├─ rbac.md              # le modèle de rôles unique
├─ setup.md             # install, env, lancement local, déploiement
├─ features/*.md        # une fiche par domaine (scope, routes, tables, hooks)
└─ adr/*.md             # Architecture Decision Records (1 par décision structurante)
```

- Chaque feature embarque son `README.md` (périmètre, tables, points d'attention).
- JSDoc sur hooks et utilitaires non triviaux.
- README racine : démarrage en < 5 minutes.

---

## 7. Authentification & RBAC (source unique)

**Auth** : Supabase Auth.
- Email/password + OAuth Google/Apple **natif Supabase** (`signInWithOAuth`).
- `middleware.ts` rafraîchit la session (cookies) et protège les groupes de routes.
- Reprise du bon pattern de l'ancien `AuthContext` adapté App Router.

**Autorisation** — fin des 2 systèmes concurrents et des 16 rôles en dur dispersés sur 51 fichiers :
- **Rôles globaux** dans `user_roles` (enum `app_role`).
- **Rôles contextuels** dans les tables d'appartenance (`association_memberships.role`, `pro_partner_members.role`).
- **RLS = rempart d'autorisation** (la base refuse, le front ne fait qu'afficher/masquer).
- **Un seul module `lib/rbac.ts`** + un hook `useRole()` côté client + des gardes côté serveur. Aucune vérification de rôle ad hoc ailleurs.
- Option avancée : Auth Hook Supabase pour injecter les rôles dans le JWT (vérifs sans round-trip).

**Beta-gate** : si on garde un rideau de bêta, token signé (pas le mot de passe en clair dans le cookie comme aujourd'hui), ou suppression à la sortie de bêta.

---

## 8. Carte de consolidation (doublons & stubs)

Décision « Consolider » appliquée :

| Élément existant | Action |
|---|---|
| Portail **Partner legacy** (`/partner-portal/*`, `components/partner*`) | **Supprimé**, fusionné dans **Pro Partner** (`/pro/*`) |
| `/feed` (CosFeed) vs `/communaute/feed` (CommunityFeed) | **Un seul feed** avec filtres |
| `/agenda` vs `/agenda/associations` | **Un seul agenda** |
| `/communaute/bazar` vs `/boutique` | **Une seule boutique** |
| `/guilds` vs `/communaute/guilds` | **Un chemin canonique** + redirection |
| `CosplayShowcase`, `CosplayProjectDashboard` (déjà redirigées) | **Supprimées**, tout dans le Cosplay Hub |
| Données mock (events/intérêts espace membre, XP mensuel simulé `% 500`) | **Vraies données** (colonnes dédiées) |
| Stubs : documents asso, contacts asso, demandes pro, mission schema configurator | **À cadrer puis implémenter** (ce ne sont pas des fonctionnalités existantes — placeholders) |
| Admin « Database viewer » | Conservé mais **strictement sécurisé** |

> ⚠️ « Conserver toutes les fonctionnalités » = toutes les fonctionnalités **réelles**. Les pages-stubs n'ont aujourd'hui aucune logique : elles seront spécifiées avant d'être construites (mini-specs dans `docs/features/`).

---

## 9. Ordre de construction

La mise en ligne se fait **en une fois**, mais le code se construit dans cet ordre de dépendances (chaque étage repose sur le précédent) :

- **Étape 0 — Socle** : scaffold Next.js, outillage, CI, projet Supabase, design system, **auth + RBAC + middleware**, layouts/navigation, squelette de docs.
- **Étape 1 — Cœur** : profils & profils publics, onboarding ; agenda & événements ; espace membre + gamification (XP, ligues, OTK, badges, quêtes, amis).
- **Étape 2 — Cosplay & communauté** : hub/vestiaire/photos/lineups ; feed, annuaire, radar, recherche, bazar, guildes, labs.
- **Étape 3 — Outils orga** : back-office association + form builder d'adhésion + bénévolat ; espace pro partner (consolidé).
- **Étape 4 — Admin** : console admin complète (les 17 écrans, dédoublonnés).
- **Étape 5 — Durcissement** : tests e2e des flux critiques, perf (code-splitting, images), accessibilité, SEO des pages publiques, finalisation docs.

---

## 10. Outillage, CI/CD & hébergement

- **CI (GitHub Actions)** : `lint` + `typecheck` + `test` + `build` sur chaque PR ; check que les types Supabase sont à jour.
- **Vercel** : déploiements preview par PR, prod sur `main`. Variables d'env par environnement.
- **Supabase** : migrations appliquées via CLI/CI ; `.env.example` documenté ; `.env` **gitignoré** (l'ancien était commité).
- **Pré-commit** : Husky + lint-staged (format + lint + typecheck rapide).

---

## 11. Risques & points d'attention

- **Ampleur** : ~109 écrans à reconstruire = chantier conséquent. La construction par étages (§9) évite de bâtir sur du sable même en visant une livraison unique.
- **Form builder & bénévolat** : modules les plus complexes (moteur de formulaire dynamique, planning) → prévoir des specs dédiées et des tests.
- **Cartes/QR/DnD** : bien isolés en modules client-only pour ne pas alourdir le bundle serveur.
- **RLS** : à écrire et tester avec soin — c'est le vrai garde-fou de sécurité.
- **Stubs** : ne pas les reconstruire « vides » ; les cadrer d'abord.

---

## 12. Prochaines étapes

1. Choisir l'emplacement du nouveau projet (nouveau dossier / nouveau repo).
2. **Étape 0 — Socle** : scaffold Next.js + outillage + Supabase + auth/RBAC + design system + docs.
3. Dérouler les étapes 1 → 5.

> Ce plan est vivant : il évolue via PR et ADRs au fil de la reconstruction.
