# Feature : gamification

XP & niveaux, ligues mensuelles, badges, quêtes, monnaie OTK, boutique.

> 📋 **Spécification détaillée** : [`docs/features/gamification.md`](../../../docs/features/gamification.md).

## Implémenté (étape 1 — 1er jet)

- **Dashboard membre** `/espace-membre` : en-tête profil (avatar, pseudo, classe otaku), tuiles **Niveau / XP du mois / OTK Coins**, **prochains événements** (participations à venir, réutilise `EventCard`), **badges** débloqués, états vides soignés. Mobile-first.
- `api/badges.ts` (badges de l'utilisateur), `server.ts` (`getMemberDashboard`).

## À venir

Ligues (calcul mensuel `user_league_stats` + rente OTK), quêtes (acceptation/preuve/validation staff via RPC), pages succès/quêtes dédiées, boutique `/boutique`. **Crédit XP/OTK et achats à porter en RPC/Edge transactionnelles** (ADR 0002) — pas d'écriture directe côté client. Voir la fiche.
