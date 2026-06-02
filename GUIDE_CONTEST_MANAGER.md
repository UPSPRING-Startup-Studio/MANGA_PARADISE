# 🎭 Guide d'Utilisation - Contest Manager

## 🚀 Accès au Dashboard

1. Connecte-toi en tant qu'**Admin**
2. Va dans **Admin** → **Événements**
3. Clique sur l'événement qui contient un concours cosplay
4. Le bouton **"Contest Manager"** apparaît → Clique dessus

---

## 📊 Onglet "Vue d'ensemble"

### Stats en un coup d'œil
- **Total Inscrits** : Nombre total de candidatures
- **À Valider** : Candidatures en attente de modération (🟡 Ambre)
- **Validés** : Candidatures approuvées (🟢 Vert)
- **Liste d'attente** : Candidatures en attente (🔵 Cyan)

### Activités Concours
- Liste des activités de type "Concours Cosplay"
- Affiche l'heure de pré-judging si configurée
- Bouton **"Modifier"** pour éditer la config

### Actions Rapides
- **Modifier la Configuration** : Ouvre la modale de config du concours
- **Exporter les Candidatures** : (À venir) Télécharge un ZIP avec tous les fichiers

---

## 🎯 Onglet "Candidats" (Kanban)

### Les 4 Colonnes

#### 🕐 À Valider (Pending)
- Nouvelles candidatures non traitées
- **Action** : Clique sur une carte pour ouvrir le dossier complet

#### ✅ Validés (Approved)
- Candidatures acceptées pour le concours
- Ces participants seront sur scène le jour J
- **Future fonctionnalité** : Réorganiser l'ordre de passage par drag & drop

#### ❌ Refusés (Rejected)
- Candidatures refusées
- Archivées mais consultables

#### ⏳ Liste d'Attente (Waitlist)
- Candidatures en attente (si le concours est complet)
- Peuvent être validées plus tard si des places se libèrent

### Carte Candidat
Chaque carte affiche :
- **Avatar** du participant
- **Nom du personnage** + **Univers**
- **Format** : Solo / Duo / Trio / Quatuor / Groupe
- **Badges** :
  - 🎵 **Audio** : Fichier audio fourni
  - 💡 **Lumière** : Demande d'éclairage spécial
  - 👶 **Mineur** : Participant mineur (autorisation parentale requise)

---

## 📋 Modale "Détail Candidature"

### Comment l'ouvrir ?
Clique sur n'importe quelle carte candidat dans le Kanban.

### Sections

#### 1️⃣ Identité du Participant
- Nom d'utilisateur
- Badge "Mineur" si applicable
- Bouton pour télécharger l'autorisation parentale (si fournie)

#### 2️⃣ Références Visuelles
- **Image de Référence** : Photo du personnage original
- **Work In Progress** : Photo du cosplay en cours de fabrication
- **Clique sur une image** pour l'ouvrir en grand dans un nouvel onglet

#### 3️⃣ Éléments Techniques
- **Bande Son** :
  - Lecteur audio intégré (écoute directement dans la modale)
  - Bouton "Télécharger" pour sauvegarder le fichier
- **Demande d'éclairage** : Badge si le participant a besoin de lumière spéciale
- **Détails Lumière** : Description des besoins en éclairage
- **Accessoires / Décors** : Description des props utilisés

#### 4️⃣ Actions de Modération
- ✅ **Valider la Candidature** → Passe dans "Validés"
- ❌ **Refuser la Candidature** → Passe dans "Refusés"
- ⏳ **Mettre en Liste d'Attente** → Passe dans "Liste d'attente"
- 🔄 **Remettre en Attente de Validation** → Retour dans "À Valider"

**Note** : Le changement de statut est instantané et met à jour le Kanban en temps réel.

---

## ⚙️ Modale "Configuration du Concours"

### Comment l'ouvrir ?
- **Depuis l'onglet "Vue d'ensemble"** : Clique sur "Modifier la Configuration"
- **Depuis une activité concours** : Clique sur le bouton "Modifier" à côté de l'activité

### Sections

#### 1️⃣ Chronométrie & Logistique
- **Heure de convocation Jury** (⚠️ Impératif) :
  - Heure à laquelle les participants doivent être présents pour le pré-judging
  - Format : HH:MM (ex: 10:00)
- **Dimensions de la scène** :
  - Ex: "10m x 6m"
- **Infos Vestiaires** :
  - Ex: "Loges communes derrière scène"

#### 2️⃣ Options Scéniques
- **Ambiance lumineuse** (Switch) :
  - Autoriser les participants à demander un éclairage spécial ?
- **Décors encombrants** (Switch) :
  - Autoriser les décors sur scène ?

#### 3️⃣ Matrice des Formats
Pour chaque format (Solo, Duo, Trio, Quatuor, Groupe) :
- **Checkbox** : Activer/désactiver le format
- **Durée max** : Temps maximum de passage (en secondes)
  - Affichage automatique en "X min Ys"
- **Max participants** (Groupe uniquement) :
  - Nombre maximum de personnes dans un groupe

**Boutons** :
- **Annuler** : Ferme la modale sans sauvegarder
- **Enregistrer** : Sauvegarde les modifications dans la BDD

---

## 📁 Onglet "Fichiers & Export"

### Fonctionnalité (À venir)
- Télécharger un **ZIP** contenant :
  - Tous les fichiers audio (MP3)
  - Toutes les photos de référence
  - Toutes les photos WIP
  - Des candidats **validés** uniquement

---

## 🎯 Workflow Recommandé

### 1. Réception d'une nouvelle candidature
1. Va dans l'onglet **"Candidats"**
2. Regarde la colonne **"À Valider"**
3. Clique sur la carte du candidat

### 2. Vérification du dossier
1. Vérifie l'**identité** (autorisation parentale si mineur)
2. Regarde les **images** (référence + WIP)
3. Écoute la **bande son** (si fournie)
4. Lis les **détails techniques** (lumière, décors)

### 3. Décision
- ✅ **Valider** : Si le dossier est complet et conforme
- ❌ **Refuser** : Si le dossier est incomplet ou non conforme
- ⏳ **Liste d'attente** : Si le concours est complet mais le dossier est bon

### 4. Préparation du Jour J
1. Va dans la colonne **"Validés"**
2. Note le nombre de participants validés
3. (Future) Réorganise l'ordre de passage par drag & drop
4. Exporte les fichiers pour les techniciens

### 5. Modification de la config (si besoin)
1. Clique sur **"Modifier la Configuration"**
2. Ajuste l'heure de pré-judging
3. Active/désactive des formats
4. Sauvegarde

---

## 🎨 Codes Couleur

- 🟡 **Ambre** : À valider (action requise)
- 🟢 **Vert** : Validé (prêt pour le concours)
- 🔴 **Rouge** : Refusé (archivé)
- 🔵 **Cyan** : Liste d'attente (en attente)
- 🟣 **Violet** : Audio fourni
- 🟠 **Orange** : Demande de lumière
- 🔴 **Rouge** : Participant mineur

---

## 💡 Astuces

### Gestion des Mineurs
- Vérifie **toujours** l'autorisation parentale avant de valider
- Le badge "Mineur" est visible sur la carte et dans le détail

### Écoute des Bandes Son
- Utilise le lecteur intégré pour écouter rapidement
- Télécharge le fichier si tu veux le partager avec les techniciens

### Modification de Config
- Tu peux modifier la config **à tout moment**, même après validation des candidatures
- Les participants verront les nouvelles infos dans leur espace

### Export des Fichiers
- (À venir) Exporte les fichiers **uniquement des validés** pour éviter de surcharger le ZIP

---

## 🆘 Problèmes Fréquents

### "Je ne vois pas mon inscrit"
- Vérifie que tu es sur le **bon événement**
- Vérifie que l'inscription a bien été enregistrée dans la BDD
- Rafraîchis la page (F5)

### "Le lecteur audio ne fonctionne pas"
- Vérifie que le fichier audio est bien uploadé sur Supabase Storage
- Vérifie l'URL du fichier dans la BDD
- Essaie de télécharger le fichier et de l'ouvrir localement

### "Je ne peux pas modifier la config"
- Vérifie que tu as les droits **Admin**
- Vérifie que l'activité est bien de type "Concours Cosplay"

---

## 🚀 Prochaines Fonctionnalités

- [ ] **Drag & Drop** : Réorganiser l'ordre de passage dans "Validés"
- [ ] **Export ZIP** : Télécharger tous les fichiers des validés
- [ ] **Notifications** : Envoyer un email aux candidats lors du changement de statut
- [ ] **Statistiques** : Graphiques de répartition par format, univers, etc.
- [ ] **Commentaires** : Ajouter des notes internes sur chaque candidature

---

**Bon courage pour la gestion de ton concours ! 🎭✨**
