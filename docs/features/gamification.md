# Feature — gamification

**Statut implémentation : ⬜ à faire (étape 1).** Inclut XP/niveaux, ligues, badges, quêtes, monnaie **OTK** et **boutique**.

## Périmètre

Système d'engagement : XP / niveaux, **ligues mensuelles** (avec « rente » en OTK), **badges**, **quêtes bénévoles** (acceptation → preuve → validation staff → crédit), monnaie virtuelle **OTK Coins**, et **boutique** dépensant des OTK (catalogue, wallet, achat). Le dashboard membre agrège XP/ligue/OTK/badges/quêtes.

## Écrans legacy → cible

| Legacy                        | Rôle                                           | Route cible                      |
| ----------------------------- | ---------------------------------------------- | -------------------------------- |
| `EspaceMembre.tsx` (522 l.)   | Dashboard membre (XP/niveau/ligue/OTK/aperçus) | `/espace-membre`                 |
| `Achievements.tsx` (270 l.)   | Badges par rareté + ligues + solde             | `/espace-membre/succes`          |
| `Quests.tsx` (320 l.)         | Quêtes bénévoles + panneau staff               | `/espace-membre/quetes`          |
| `BazarAkihabara.tsx`          | Boutique OTK (catalogue, wallet, achat)        | `/boutique`                      |
| `LeHub.tsx` / `LeParadis.tsx` | Vitrines **statiques**                         | `(public)/le-hub`, `/le-paradis` |

## Tables Supabase

`leagues`, `user_league_stats`, `badges`/`user_badges`, `quests`/`user_quests`/`quest_submissions`, `otk_transactions`, `shop_items`/`shop_orders`, `profiles` (`xp`/`level`/`monthly_xp`/`otk_coins`/`total_otk_earned`).

## Hooks legacy clés

`useLeagueStats` (lit ligues + **crée la ligne du mois en lecture** — anti-pattern), `useBadges`/`useQuests` (catalogue + jonctions), `useVolunteerQuests` (accept/submit/validate → **update direct `profiles`**), `useShopItems`/`usePurchaseItem` (achat en 4 écritures client), `useAutoProgress`.

## Doublons / consolidation

- **Triple logique de ligue** : constante `LEAGUES`/`getLeagueFromXp`, tables `leagues`+`user_league_stats`, et calcul ad-hoc dans `EspaceMembre` → **source unique = la base**.
- Affichage XP/OTK/badges dupliqué (`EspaceMembre`/`Achievements`/`Quests`) → composant solde partagé.
- Deux chemins de complétion de quête : `useVolunteerQuests` (update direct) vs RPC `complete_quest` → harmoniser.
- « Bazar » vs « boutique » : une seule implémentation réelle (`BazarAkihabara`) → renommer `/boutique`.

## Stubs / placeholders

- `EspaceMembre` : `interests` et `upcomingEvents` = **mock data en dur** (« in real app would come from… »).
- `monthly_xp` simulé `profileXp % 500` alors que la colonne `profiles.monthly_xp` **existe** → l'alimenter réellement (reset mensuel DB).
- `LeHub`/`LeParadis` : entièrement statiques.

## Points d'attention

- **Sécurité (critique)** : crédit OTK/XP de quête et **achat boutique** faits par updates directs côté client (race conditions, contournables) → **RPC/Edge transactionnelles**, débit autorité serveur (ADR 0002).
- `useLeagueStats` **écrit** pendant un fetch → déplacer en trigger/RPC.
- `Quests` mêle vue membre + panneau staff → séparer selon les groupes de routes.
- `useAIRecommendations` dépend d'une edge function `ai-recommendations` → recréer ou stubber.
- « Rente mensuelle » OTK définie en double (constante vs table `leagues`) → source unique.
