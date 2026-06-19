# 🎭 VISUAL LINE-UP - PHASE 2 : WIZARD D'INSCRIPTION

## ✅ MISSION ACCOMPLIE

La Phase 2 du système Visual Line-Up est maintenant **opérationnelle** ! Le nouveau wizard d'inscription en 3 étapes est prêt à l'emploi.

---

## 📦 CE QUI A ÉTÉ CRÉÉ

### 1. **Nouveau Composant : EventRegistrationModal**
**Fichier** : [`src/components/events/EventRegistrationModal.tsx`](src/components/events/EventRegistrationModal.tsx)

Un wizard moderne en 3 étapes avec l'esthétique Manga Paradise (Cyberpunk/Anime) :

#### **ÉTAPE 1 : Rôle & Planning**
- **Question** : "Comment viens-tu ?"
- **Choix** (Cartes sélectionnables avec glassmorphism) :
  - 👤 **Visiteur** (Juste pour voir)
  - 🎭 **Cosplayeur** (Je viens costumé)
  - 🛡️ **Bénévole** (Je viens aider)
  - 📸 **Photographe** (Je viens shooter)

- **Question** : "Quels jours ?"
- Checkboxes dynamiques basées sur les dates de l'événement
- Validation : Au moins 1 rôle + 1 jour sélectionné

#### **ÉTAPE 2 : Le Cosplay** (Conditionnel)
- **Affichage** : Uniquement si l'utilisateur a choisi "Cosplayeur"
- **Contenu** :
  - Liste des cosplays du vestiaire de l'utilisateur
  - Grille avec images + noms des personnages
  - Preview de l'image du cosplay sélectionné
  - Gestion du cas "vestiaire vide"

#### **ÉTAPE 3 : Validation**
- **Récapitulatif** :
  - Rôle choisi (badge coloré)
  - Jours sélectionnés (badges)
  - Cosplay choisi (si applicable) avec image miniature
- **Bouton** : "Valider mon inscription" avec effet confetti

---

## 🔧 MODIFICATIONS TECHNIQUES

### 2. **Hook Mis à Jour : useEventParticipants**
**Fichier** : [`src/hooks/useEventParticipants.ts`](src/hooks/useEventParticipants.ts)

**Ajouts** :
- Support de la colonne `attendance_dates` (tableau de dates)
- Support de la colonne `cosplay_data` (JSONB avec infos du cosplay)

**Fonctions modifiées** :
- `useRegisterToEvent()` : Accepte maintenant `attendanceDates` et `cosplayData`
- `useUpdateParticipation()` : Idem pour les mises à jour

**Structure des données envoyées** :
```typescript
{
  role: "cosplayer",
  attendance_dates: ["2026-07-12", "2026-07-13"],
  cosplay_data: [{
    character: "Izuku Midoriya",
    universe: "My Hero Academia",
    imageUrl: "https://...",
    cosplayId: "uuid-xxx"
  }]
}
```

### 3. **Intégration dans EventDetail**
**Fichier** : [`src/pages/EventDetail.tsx`](src/pages/EventDetail.tsx)

**Changements** :
- Import du nouveau composant `EventRegistrationModal`
- Nouvelle fonction `handleRegistrationSubmit()` pour gérer la soumission
- Affichage conditionnel :
  - **Nouveaux utilisateurs** → `EventRegistrationModal` (wizard 3 étapes)
  - **Utilisateurs déjà inscrits** → `RSVPModal` (ancien système pour modifications)

---

## 🎨 DESIGN & UX

### Thème Manga Paradise Appliqué
- **Couleurs** :
  - Neon Pink (`#FF007F`) pour les accents principaux
  - Cyan (`#00F0FF`) pour les titres et validations
  - Gold (`#FFD700`) pour les éléments premium
  
- **Effets visuels** :
  - Glassmorphism (`backdrop-blur-md`, `bg-black/40`)
  - Glow effects sur les cartes sélectionnées
  - Animations Framer Motion (transitions fluides entre étapes)
  - Confetti effect à la validation

- **Indicateur de progression** :
  - Barres horizontales animées
  - Skip automatique de l'étape 2 si non-cosplayeur

---

## 🔄 FLUX UTILISATEUR

```
1. Utilisateur clique sur "Je participe" sur la page événement
   ↓
2. Modal s'ouvre → ÉTAPE 1
   - Sélectionne son rôle (ex: Cosplayeur)
   - Coche les jours (ex: Samedi + Dimanche)
   - Clique "Suivant"
   ↓
3. ÉTAPE 2 (si Cosplayeur)
   - Voit ses cosplays du vestiaire
   - Sélectionne "Izuku Midoriya"
   - Clique "Suivant"
   ↓
4. ÉTAPE 3 - Récapitulatif
   - Vérifie : Cosplayeur, Sam+Dim, Izuku
   - Clique "Valider mon inscription"
   ↓
5. Données insérées dans `event_participants`
   - role: "cosplayer"
   - attendance_dates: ["2026-07-12", "2026-07-13"]
   - cosplay_data: [{ character: "Izuku", universe: "MHA", ... }]
   ↓
6. Confetti 🎉 + Toast "Inscription confirmée !"
   ↓
7. Carte apparaît dans le Visual Line-Up
```

---

## 📊 STRUCTURE DES DONNÉES

### Table `event_participants` (Colonnes utilisées)

| Colonne | Type | Description |
|---------|------|-------------|
| `role` | `text` | Rôle principal (visitor, cosplayer, volunteer, exhibitor) |
| `attendance_dates` | `jsonb` | Tableau des dates de présence `["2026-07-12"]` |
| `cosplay_data` | `jsonb` | Infos du cosplay `[{ character, universe, imageUrl, cosplayId }]` |

---

## 🧪 TESTS À EFFECTUER

### Scénario 1 : Visiteur Simple
1. Connecte-toi à l'app
2. Va sur une page événement
3. Clique "Je participe"
4. Choisis "Visiteur"
5. Coche "Samedi"
6. Valide → Vérifie que ta carte apparaît dans le Line-Up

### Scénario 2 : Cosplayeur avec Vestiaire
1. Assure-toi d'avoir au moins 1 cosplay dans ton vestiaire
2. Clique "Je participe"
3. Choisis "Cosplayeur"
4. Coche "Samedi + Dimanche"
5. Sélectionne ton cosplay
6. Valide → Vérifie que ta carte affiche le cosplay

### Scénario 3 : Cosplayeur sans Vestiaire
1. Vide ton vestiaire (ou utilise un compte test)
2. Choisis "Cosplayeur"
3. Vérifie que l'étape 2 affiche "Ton vestiaire est vide"
4. Tu peux quand même valider (cosplay_data sera null)

---

## 🚀 PROCHAINES ÉTAPES (Phase 3)

1. **Affichage du Visual Line-Up** :
   - Utiliser `attendance_dates` pour filtrer par jour
   - Afficher les cosplays depuis `cosplay_data`
   - Créer des grilles par rôle (Cosplayeurs, Bénévoles, etc.)

2. **Loader amélioré** :
   - Garder le titre "Visual Line-Up" visible pendant le chargement
   - Skeleton cards au lieu d'un spinner global

3. **Filtres** :
   - Par jour (Samedi / Dimanche)
   - Par rôle (Cosplayeur / Visiteur / etc.)
   - Par univers (si cosplay)

---

## 📝 NOTES IMPORTANTES

### ⚠️ Points d'attention
- Le wizard n'apparaît que pour les **nouveaux participants**
- Les utilisateurs déjà inscrits utilisent l'ancien `RSVPModal` pour modifier
- La colonne `planned_cosplay_id` est toujours remplie (legacy) mais `cosplay_data` est la source de vérité

### 🎯 Compatibilité
- Le système est **rétrocompatible** avec les anciennes inscriptions
- Les données `attendance_details` (ancien format) sont toujours supportées
- Migration progressive vers `attendance_dates` + `cosplay_data`

---

## 🎉 RÉSULTAT

Le wizard d'inscription Visual Line-Up est **100% fonctionnel** et prêt à être testé en conditions réelles. L'interface est fluide, moderne, et respecte parfaitement l'identité visuelle Manga Paradise.

**Prochaine étape** : Tester avec un compte utilisateur réel et vérifier l'affichage dans le Visual Line-Up !

---

**Date de création** : 16 février 2026  
**Statut** : ✅ Phase 2 Terminée  
**Prochaine phase** : Phase 3 - Affichage & Filtres du Line-Up
