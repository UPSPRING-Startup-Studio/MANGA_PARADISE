# 📋 PHASE 4 - UI 'Approuvé' & Exclusion des Spectateurs - RÉCAPITULATIF

## 🎯 OBJECTIF
Clarifier les états finaux et éviter les doublons visuels en excluant les candidats approuvés de la liste des spectateurs.

---

## ✅ RÉALISATIONS

### 1. 🎨 Mise à Jour du Bouton "Approuvé"

**Fichier modifié :** [`src/components/events/ContestRegistrationButton.tsx`](src/components/events/ContestRegistrationButton.tsx:1)

#### A. Imports Ajoutés
```typescript
import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
```

#### B. Cas "Approved" (Validé)
- **Texte** : `✅ Candidature Approuvée`
- **Style** : Gradient vert `from-green-500 to-emerald-600`
- **État** : **Disabled** (non cliquable)
- **Glow** : `shadow-[0_0_20px_rgba(34,197,94,0.4)]`

**Code :**
```tsx
approved: {
  label: "✅ Candidature Approuvée",
  icon: <CheckCircle2 className="w-4 h-4" />,
  className:
    "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.4)]",
  disabled: true,
}
```

#### C. Cas "Waitlist" (Liste d'attente)
- **Texte** : `⚠️ Sur liste d'attente`
- **Icône** : `AlertCircle` (au lieu de `Clock`)
- **Style** : Orange/Amber `bg-orange-500/20 text-orange-300`
- **Tooltip** : "L'équipe reviendra vers vous si une place se libère."

**Code :**
```tsx
waitlist: {
  label: "⚠️ Sur liste d'attente",
  icon: <AlertCircle className="w-4 h-4" />,
  className:
    "bg-orange-500/20 text-orange-300 border-orange-500/50 hover:bg-orange-500/30",
  disabled: false,
  onClick: onViewPassClick,
  tooltip: "L'équipe reviendra vers vous si une place se libère.",
}
```

#### D. Tooltip Conditionnel
```tsx
if (config.tooltip) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {buttonContent}
      </TooltipTrigger>
      <TooltipContent className="bg-slate-900 text-white border-white/20">
        {config.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
```

---

### 2. 🔄 Filtrage des Spectateurs (Exclusion des Candidats Approuvés)

**Fichier modifié :** [`src/components/events/EventScheduleTimeline.tsx`](src/components/events/EventScheduleTimeline.tsx:530)

#### A. Logique de Filtrage
```typescript
// Filter out approved contestants from the spectators list for contests
const filteredParticipants = isContest
  ? participants.filter(
      (p) => !approvedContestants.some((ac) => ac.user_id === p.id)
    )
  : participants;
```

**Algorithme :**
```
Si activité = concours :
  Liste_Affichée = Liste_Spectateurs - Liste_Candidats_Approuvés
Sinon :
  Liste_Affichée = Liste_Spectateurs (inchangée)
```

#### B. Mise à Jour du Compteur
```typescript
const displayCount = isContest ? filteredParticipants.length : participantCount;
```

**Résultat :**
- **Concours** : Affiche uniquement les spectateurs (excluant les candidats approuvés)
- **Autres activités** : Affiche tous les participants

#### C. Affichage Conditionnel
```tsx
{/* Résumé Social */}
<p className="text-sm text-muted-foreground mb-4">
  <span className="text-foreground font-bold">{displayCount} personne{displayCount > 1 ? "s" : ""}</span> 
  {isContest ? `intéressée${displayCount > 1 ? "s" : ""}` : `participe${displayCount > 1 ? "nt" : ""}`}
</p>

{/* Liste des participants filtrés */}
{filteredParticipants.length > 0 && (
  <div className="space-y-2 max-h-[200px] overflow-y-auto">
    {filteredParticipants.map((participant) => (
      // Affichage du participant
    ))}
  </div>
)}
```

---

## 🎨 DESIGN SYSTEM APPLIQUÉ

### États du Bouton
| État | Couleur | Icône | Texte | Disabled | Tooltip |
|------|---------|-------|-------|----------|---------|
| **Pas inscrit** | Or | ✨ | M'inscrire au Concours | ❌ | — |
| **Pending** | Gris | ⏳ | Candidature en examen | ❌ | — |
| **Approved** | Vert | ✅ | Candidature Approuvée | ✅ | — |
| **Rejected** | Rouge | ❌ | Candidature refusée | ✅ | — |
| **Waitlist** | Orange | ⚠️ | Sur liste d'attente | ❌ | L'équipe reviendra... |

### Hiérarchie Visuelle
1. **Spectateurs intéressés** : Affiche uniquement les spectateurs (candidats approuvés exclus)
2. **Sélection Officielle** : Affiche les candidats approuvés avec ordre de passage

---

## 📁 FICHIERS MODIFIÉS

1. [`src/components/events/ContestRegistrationButton.tsx`](src/components/events/ContestRegistrationButton.tsx:1)
   - Mise à jour des styles "approved" et "waitlist"
   - Ajout du tooltip conditionnel

2. [`src/components/events/EventScheduleTimeline.tsx`](src/components/events/EventScheduleTimeline.tsx:530)
   - Filtrage des spectateurs pour exclure les candidats approuvés
   - Mise à jour du compteur de spectateurs

---

## 🧪 TESTS À EFFECTUER

### Scénario 1 : Candidat Approuvé
1. ✅ En tant qu'admin, valider une candidature (status = approved)
2. ✅ Se connecter en tant que candidat
3. ✅ Aller sur la page Programme du concours
4. ✅ Vérifier que le bouton est **VERT** "✅ Candidature Approuvée"
5. ✅ Vérifier que le bouton est **DISABLED** (non cliquable)
6. ✅ Cliquer sur le concours pour ouvrir la Sheet
7. ✅ Vérifier que ma tête apparaît dans "🏆 Sélection Officielle"
8. ✅ Vérifier que ma tête **N'APPARAÎT PAS** dans "Spectateurs intéressés"
9. ✅ Vérifier que le compteur de spectateurs a diminué

### Scénario 2 : Candidat en Liste d'Attente
1. ✅ En tant qu'admin, mettre une candidature en liste d'attente (status = waitlist)
2. ✅ Se connecter en tant que candidat
3. ✅ Aller sur la page Programme du concours
4. ✅ Vérifier que le bouton est **ORANGE** "⚠️ Sur liste d'attente"
5. ✅ Survoler le bouton pour voir le tooltip
6. ✅ Vérifier que le tooltip affiche "L'équipe reviendra vers vous si une place se libère."

### Scénario 3 : Spectateur Normal
1. ✅ Se connecter en tant qu'utilisateur normal (non candidat)
2. ✅ Ajouter le concours à ses favoris (pour apparaître dans les spectateurs)
3. ✅ Aller sur la page Programme du concours
4. ✅ Vérifier que le bouton est **OR** "✨ M'inscrire au Concours"
5. ✅ Cliquer sur le concours pour ouvrir la Sheet
6. ✅ Vérifier que ma tête apparaît dans "Spectateurs intéressés"
7. ✅ Vérifier que ma tête **N'APPARAÎT PAS** dans "🏆 Sélection Officielle"

### Scénario 4 : Compteur de Spectateurs
1. ✅ Avoir 10 spectateurs + 3 candidats approuvés
2. ✅ Vérifier que le compteur affiche "7 spectateurs intéressés" (10 - 3)
3. ✅ Vérifier que la section "🏆 Sélection Officielle" affiche "3 participants officiels"

---

## 🚀 PROCHAINES ÉTAPES SUGGÉRÉES

### Phase 5 : Notifications & Emails
- [ ] Envoyer un email quand le statut passe à "approved"
- [ ] Notifier les spectateurs quand les candidats sont validés
- [ ] Ajouter une notification in-app (DenDenMushi)

### Phase 6 : Gestion Avancée
- [ ] Permettre aux candidats approuvés de modifier leur ordre de passage
- [ ] Ajouter un système de "remise en attente" pour les candidats
- [ ] Créer une page dédiée au concours avec timeline

---

## 💡 NOTES TECHNIQUES

### Performance
- Le filtrage est fait côté client (pas de requête supplémentaire)
- Utilise `Array.filter()` et `Array.some()` pour une performance optimale
- Le filtrage ne s'applique que pour les concours

### Accessibilité
- Tooltip pour expliquer le statut "waitlist"
- Bouton disabled pour "approved" (pas de confusion possible)
- Couleurs contrastées pour chaque état

### Maintenabilité
- Logique de filtrage centralisée
- Configuration des états dans un objet `statusConfig`
- Types TypeScript stricts

---

## 🎉 RÉSULTAT FINAL

L'utilisateur approuvé voit maintenant :
1. ✅ Un bouton **VERT** "✅ Candidature Approuvée" (disabled)
2. ✅ Son avatar dans la section "🏆 Sélection Officielle"
3. ✅ Son avatar **ABSENT** de la section "Spectateurs intéressés"

L'utilisateur en liste d'attente voit :
1. ✅ Un bouton **ORANGE** "⚠️ Sur liste d'attente"
2. ✅ Un tooltip explicatif au survol

**Exemple concret :**
> Mon bouton est vert "Candidature Approuvée". Ma tête apparaît dans la section dorée "Sélection Officielle". Ma tête disparaît de la section "Spectateurs intéressés" juste au-dessus.

**Mission accomplie ! 🚀**
