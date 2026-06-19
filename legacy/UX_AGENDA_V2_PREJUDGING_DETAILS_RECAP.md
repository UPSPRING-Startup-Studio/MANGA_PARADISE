# 🎯 UX AGENDA V2 - DÉTAILS COMPÉTITION & PRÉ-JUDGING

## 📋 CONTEXTE

Suite à la refonte de séparation Participation/Compétition, cette phase enrichit l'expérience utilisateur sur la "Bulle Compétition" pour la rendre plus utile le jour J et plus rassurante en amont.

## ✅ TRAVAUX RÉALISÉS

### 1. Ajout de l'Horaire de Pré-judging

**Fichier** : [`ContestActivityModule.tsx`](src/components/events/ContestActivityModule.tsx:1)

**Modifications** :
- ✅ Nouveau champ `judging_time` dans le type `ContestRegistrationData`
- ✅ Affichage distinct du pré-judging avec icône 🚪 `DoorOpen`
- ✅ Carte cyan/bleue pour la convocation pré-judging
- ✅ Carte verte pour le passage scène
- ✅ Hiérarchie visuelle claire : Convocation → Passage

**Visuel** :
```
┌─────────────────────────────────────┐
│ 🚪 Convocation Pré-judging         │
│    13:45                            │
│    (Carte Cyan)                     │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│ ⏰ Horaire de Passage Scène        │
│    14:30                            │
│    (Carte Verte avec pulse)         │
└─────────────────────────────────────┘
```

### 2. Interactivité & Modal "Détails"

**Nouveau Composant** : [`ContestDetailModal.tsx`](src/components/events/ContestDetailModal.tsx:1)

**Caractéristiques** :
- ✅ Modal complète "Fiche Candidat"
- ✅ Sections organisées :
  - 📝 **Mes Informations** : Personnage, Univers, Description, Format, Groupe
  - 🎵 **Média** : Bande son reçue (✅) / Image de référence
  - 📍 **Mon Planning** : Convocation + Passage (si validé)
- ✅ Messages contextuels selon le statut
- ✅ Design cohérent avec le Design System Manga Paradise

**Intégration** :
- ✅ `ContestActivityModule` est maintenant cliquable
- ✅ Callback `onClick` pour ouvrir la modal
- ✅ État `selectedContestDetail` dans `MemberAgenda`

### 3. UI Tweaks (Finitions)

**Tooltips** :
- ✅ Tooltip sur le badge de statut avec explications :
  - **Validé** : "Votre candidature est validée ! Rendez-vous à l'heure indiquée."
  - **En examen** : "Les organisateurs valident votre bande son et vos informations."
  - **Liste d'attente** : "Vous êtes sur liste d'attente. Nous vous contacterons si une place se libère."
  - **Refusé** : "Votre candidature n'a pas été retenue pour cette édition."

**Effets Visuels** :
- ✅ `cursor-pointer` sur le module cliquable
- ✅ Effet `hover:scale-[1.02]` pour indiquer l'interactivité
- ✅ Indicateur "Cliquer pour voir les détails" avec `ChevronRight`
- ✅ Animations Framer Motion sur l'ouverture de la modal

## 🎨 RÉSULTAT VISUEL

### Module Compétition (Cliquable)

```
┌─────────────────────────────────────────────────────────┐
│  🏆 Ma Compétition              ✅ Validé (tooltip)     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎭 Personnage: Tanjiro Kamado                   │   │
│  │    Demon Slayer                                 │   │
│  │ 📋 Format: Solo                                 │   │
│  │ 🎬 Passage: #12                                 │   │
│  │                                                  │   │
│  │ ┌──────────────────────────────────────────┐   │   │
│  │ │ 🚪 Convocation Pré-judging              │   │   │
│  │ │    13:45                                 │   │   │
│  │ └──────────────────────────────────────────┘   │   │
│  │                                                  │   │
│  │ ┌──────────────────────────────────────────┐   │   │
│  │ │ ⏰ Horaire de Passage Scène             │   │   │
│  │ │    14:30                                 │   │   │
│  │ └──────────────────────────────────────────┘   │   │
│  │                                                  │   │
│  │ Cliquer pour voir les détails →                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
        (Effet hover: scale + shadow)
```

### Modal "Fiche Candidat"

```
┌─────────────────────────────────────────────────────────┐
│  🏆 Concours Cosplay              ✅ Validé             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📝 Mes Informations                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Personnage: Tanjiro Kamado                       │  │
│  │ Univers: Demon Slayer                            │  │
│  │ Description: Cosplay détaillé avec accessoires   │  │
│  │ Format: Solo                                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  🎵 Média                                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🎵 ✅ Bande son reçue                            │  │
│  │    Fichier audio validé                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  📍 Mon Planning                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🚪 Convocation Pré-judging                       │  │
│  │    13:45                                         │  │
│  │    Présente-toi en coulisses pour validation    │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ⏰ Passage Scène                                 │  │
│  │    14:30                                         │  │
│  │    Tu passes en #12                              │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│                                      [Fermer]            │
└─────────────────────────────────────────────────────────┘
```

## 🎯 AVANTAGES

1. **Clarté du Planning** : L'utilisateur voit immédiatement ses deux horaires critiques
2. **Rassurance** : Les tooltips expliquent chaque statut
3. **Préparation** : La modal permet de vérifier tous les détails avant le jour J
4. **Accessibilité** : Indicateurs visuels clairs (cursor, hover, icônes)
5. **Professionnalisme** : Interface soignée qui inspire confiance

## 📝 DONNÉES MOCKÉES (DEMO)

Pour la démo, les données suivantes sont mockées dans [`MemberAgenda.tsx`](src/pages/MemberAgenda.tsx:1) :

```typescript
{
  judging_time: "13:45",  // Horaire de convocation
  passage_time: "14:30",  // Horaire de passage scène
  description: "Cosplay détaillé avec accessoires faits main",
  media_url: "https://example.com/audio.mp3",
  media_type: "audio"
}
```

## 🔧 TODO : INTÉGRATION BASE DE DONNÉES

Pour passer en production, il faudra :

1. **Ajouter les colonnes à `contest_registrations`** :
   ```sql
   ALTER TABLE contest_registrations
   ADD COLUMN judging_time TEXT,
   ADD COLUMN passage_time TEXT,
   ADD COLUMN description TEXT,
   ADD COLUMN media_url TEXT,
   ADD COLUMN media_type TEXT CHECK (media_type IN ('audio', 'image'));
   ```

2. **Mettre à jour le type `UserContestRegistration`** dans [`useUserContestRegistrations.ts`](src/hooks/useUserContestRegistrations.ts:6)

3. **Ajouter la logique d'attribution d'horaires** dans l'admin

## 📦 FICHIERS CRÉÉS/MODIFIÉS

- ✅ **Créé** : [`ContestDetailModal.tsx`](src/components/events/ContestDetailModal.tsx:1)
- ✅ **Modifié** : [`ContestActivityModule.tsx`](src/components/events/ContestActivityModule.tsx:1)
  - Ajout `judging_time`, `description`, `media_url`, `media_type`
  - Ajout tooltips sur les statuts
  - Ajout callback `onClick`
  - Ajout effets hover et cursor-pointer
  - Affichage pré-judging + passage scène
- ✅ **Modifié** : [`MemberAgenda.tsx`](src/pages/MemberAgenda.tsx:1)
  - Import `ContestDetailModal`
  - État `selectedContestDetail`
  - Passage du callback `onContestClick` au `TicketCard`
  - Données mockées pour la démo
  - Rendu de la modal

## 🎨 DESIGN SYSTEM APPLIQUÉ

- **Couleurs** :
  - Cyan/Bleu : Pré-judging (convocation)
  - Vert : Passage scène (action principale)
  - Gold (#FFD700) : Labels importants
- **Effets** :
  - Glassmorphism : `backdrop-blur-md`
  - Hover : `scale-[1.02]` + `shadow-2xl`
  - Animations : Framer Motion (`initial`, `animate`, `transition`)
- **Icônes** :
  - 🚪 `DoorOpen` : Convocation
  - ⏰ `Clock` : Passage scène (avec `animate-pulse`)
  - 🎵 `Music` : Bande son
  - 🖼️ `Image` : Image de référence

## 🚀 PROCHAINES ÉTAPES

1. **Tester avec un compte utilisateur** : Se connecter et cliquer sur le module
2. **Ajouter les champs en base** : Migration SQL
3. **Implémenter l'attribution d'horaires** : Interface admin
4. **Notifications** : Alerter l'utilisateur quand ses horaires sont attribués

---

**Status** : ✅ UX V2 complète terminée
**Date** : 17 Février 2026
**Développeur** : Kilo Code (Mode Code)
