# 🎯 REFONTE AGENDA - SÉPARATION PARTICIPATION / COMPÉTITION

## 📋 CONTEXTE

L'utilisateur souhaitait distinguer visuellement deux niveaux d'information sur son agenda :

1. **La Participation Globale (Le Ticket)** : Sa présence à l'événement (Lieu, Date) et son cosplay "libre" pour la journée
2. **L'Inscription Activité (La Bulle Compétition)** : Un module distinct rattaché au ticket qui détaille sa candidature au concours (Statut, Personnage Jugé, Horaire de passage)

## ✅ TRAVAUX RÉALISÉS

### 1. Création du Composant `ContestActivityModule.tsx`

**Fichier** : [`src/components/events/ContestActivityModule.tsx`](src/components/events/ContestActivityModule.tsx:1)

**Caractéristiques** :
- ✅ Module distinct avec bordure colorée forte selon le statut
- ✅ Code couleur strict :
  - 🟢 **Approuvé (approved)** : Bordure Verte + Fond Vert/10 + Icône ✅
  - 🟡 **En examen (pending)** : Bordure Jaune + Fond Jaune/10 + Icône ⏳
  - 🔵 **Liste d'attente (waitlist)** : Bordure Bleue + Fond Bleu/10 + Icône ℹ️
  - 🔴 **Refusé (rejected)** : Bordure Rouge + Fond Rouge/10 + Icône ❌
- ✅ Affichage des informations du concours :
  - 🏆 Titre du concours
  - 🎭 Personnage + Univers
  - 📋 Format (Solo/Duo/Groupe)
  - 👥 Nom du groupe (si applicable)
  - 🎬 Ordre de passage
  - ⏰ **Horaire de passage** (si validé) - Affiché en grand avec animation
- ✅ Effet de glow selon le statut
- ✅ Messages contextuels selon le statut
- ✅ Animation d'apparition avec Framer Motion

### 2. Refactoring du Composant `TicketCard`

**Fichier** : [`src/pages/MemberAgenda.tsx`](src/pages/MemberAgenda.tsx:209)

**Modifications** :
- ✅ **Nettoyage de la carte principale** : Focus sur l'événement (Titre, Date, Lieu)
- ✅ **Nouveau champ** : "Mon Cosplay du jour" (libre, hors concours)
  - Affiche le cosplay prévu avec la mention "Libre (hors concours)"
  - Distingue clairement du cosplay de compétition
- ✅ **Badge "Je participe"** : Remplace "Billet Généré" pour plus de clarté
- ✅ **Retrait des infos concours** : Les informations spécifiques au concours (Personnage, Format, Statut) ont été retirées de la zone principale
- ✅ **Intégration du ContestActivityModule** : Le module s'affiche sous la carte principale quand l'utilisateur est inscrit au concours
- ✅ **Prop `contestRegistration`** : Nouvelle prop optionnelle pour passer les données du concours

### 3. Mise à Jour de la Logique d'Affichage

**Fichier** : [`src/pages/MemberAgenda.tsx`](src/pages/MemberAgenda.tsx:1035)

**Changements** :
- ✅ Suppression de l'affichage séparé `ContestTicketCard`
- ✅ Unification : Un seul `TicketCard` par événement
- ✅ Le `ContestActivityModule` s'affiche automatiquement sous le ticket si inscription concours
- ✅ Import du nouveau composant `ContestActivityModule`

## 🎨 RÉSULTAT VISUEL

### Structure de la Carte

```
┌─────────────────────────────────────────────────────────┐
│  📅 TICKET ÉVÉNEMENT (Carte Principale)                 │
│  ┌─────┐  ┌──────────────────────────────────────┐     │
│  │ 15  │  │ 🎪 Japan Expo 2026                   │     │
│  │ FÉV │  │ 📍 Paris Nord Villepinte             │     │
│  │2026 │  │ 🎫 Je participe                      │     │
│  └─────┘  └──────────────────────────────────────┘     │
│                                                          │
│  Ma Participation:                                       │
│  🎭 Mon Cosplay du jour: Tanjiro (Libre, hors concours) │
│                                                          │
│  [Voir mon billet] [✏️] [❌]                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🏆 MODULE COMPÉTITION (Bulle Verte si Validé)          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🏆 Ma Compétition              ✅ Validé        │   │
│  │                                                  │   │
│  │ 🎭 Personnage: Tanjiro Kamado                   │   │
│  │    Demon Slayer                                 │   │
│  │ 📋 Format: Solo                                 │   │
│  │ 🎬 Passage: #12                                 │   │
│  │                                                  │   │
│  │ ┌──────────────────────────────────────────┐   │   │
│  │ │ ⏰ Horaire de Passage                    │   │   │
│  │ │    14:30                                 │   │   │
│  │ └──────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🎯 AVANTAGES DE LA NOUVELLE ARCHITECTURE

1. **Séparation Claire** : L'utilisateur voit immédiatement la différence entre sa participation générale et son inscription au concours
2. **Hiérarchie Visuelle** : Le ticket principal reste épuré, le module compétition attire l'attention par sa couleur
3. **Scalabilité** : Si l'utilisateur participe à plusieurs concours, on peut afficher plusieurs modules
4. **Code Couleur Intuitif** : Le statut est immédiatement visible (Vert = OK, Jaune = En attente, etc.)
5. **Horaire Critique** : L'horaire de passage est mis en avant pour les candidats validés

## 📝 NOTES TECHNIQUES

### Type `ContestRegistrationData`

```typescript
export interface ContestRegistrationData {
  id: string;
  status: ContestStatus; // "approved" | "pending" | "waitlist" | "rejected"
  character_name: string;
  universe?: string;
  format?: string;
  group_name?: string;
  passage_order?: number;
  passage_time?: string; // TODO: À ajouter dans la table contest_registrations
  contest_name?: string;
}
```

### TODO : Ajout du champ `passage_time`

Le champ `passage_time` n'existe pas encore dans la table `contest_registrations`. Il faudra :
1. Créer une migration pour ajouter la colonne `passage_time` (type `TEXT` ou `TIME`)
2. Mettre à jour le type `UserContestRegistration` dans [`src/hooks/useUserContestRegistrations.ts`](src/hooks/useUserContestRegistrations.ts:6)
3. Ajouter la logique d'attribution d'horaire dans l'admin

## 🚀 PROCHAINES ÉTAPES

1. **Tester avec un compte utilisateur** : Se connecter et vérifier l'affichage sur `/espace-membre/billets`
2. **Ajouter le champ `passage_time`** : Migration + Update du hook
3. **Améliorer l'UX** : Ajouter des animations de transition entre les statuts
4. **Notifications** : Alerter l'utilisateur quand son statut change (pending → approved)

## 📦 FICHIERS MODIFIÉS

- ✅ **Créé** : [`src/components/events/ContestActivityModule.tsx`](src/components/events/ContestActivityModule.tsx:1)
- ✅ **Modifié** : [`src/pages/MemberAgenda.tsx`](src/pages/MemberAgenda.tsx:1)
  - Import du `ContestActivityModule`
  - Refactoring du composant `TicketCard`
  - Mise à jour de la logique d'affichage

## 🎨 DESIGN SYSTEM APPLIQUÉ

- **Couleurs Manga Paradise** :
  - Neon Pink (#FF007F) : Accents principaux
  - Gold (#FFD700) : Labels et icônes importantes
  - Vert/Jaune/Bleu/Rouge : Code couleur statut
- **Effets** :
  - Glassmorphism : `backdrop-blur-md`
  - Glow : `shadow-[0_0_20px_rgba(...)]`
  - Animations : Framer Motion
- **Typographie** :
  - `font-display` pour les titres
  - `font-semibold` pour les labels importants

---

**Status** : ✅ Refonte complète terminée
**Date** : 17 Février 2026
**Développeur** : Kilo Code (Mode Code)
