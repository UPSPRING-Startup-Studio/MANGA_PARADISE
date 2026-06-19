# 🧭 Intégration Navigation - Vestiaire Cosplay

## 📍 Où Ajouter le Lien de Navigation

Le Vestiaire Cosplay est maintenant accessible via la route `/espace-membre/vestiaire`. Pour faciliter l'accès aux utilisateurs, il faut ajouter un lien dans la navigation.

## 🎯 Options d'Intégration

### Option 1 : Menu Espace Membre (Recommandé)
Ajouter dans le menu de l'Espace Membre, aux côtés de "Billets", "Amis", "Paramètres", etc.

**Fichier à modifier :** `src/components/Navigation.tsx` ou le composant de menu de l'Espace Membre

**Code suggéré :**
```tsx
<NavLink to="/espace-membre/vestiaire">
  <div className="flex items-center gap-3">
    <span className="text-2xl">👘</span>
    <span>Vestiaire Cosplay</span>
  </div>
</NavLink>
```

### Option 2 : Navigation Principale
Ajouter dans la barre de navigation principale si le Vestiaire est une fonctionnalité centrale.

**Fichier à modifier :** `src/components/Navigation.tsx`

**Code suggéré :**
```tsx
<NavLink 
  to="/espace-membre/vestiaire"
  className="nav-link"
>
  👘 Vestiaire
</NavLink>
```

### Option 3 : Dashboard Espace Membre
Ajouter une carte/tuile dans le dashboard de l'Espace Membre.

**Fichier à modifier :** `src/pages/EspaceMembre.tsx`

**Code suggéré :**
```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  className="bg-gradient-to-br from-[#FF007F]/20 to-[#00F0FF]/20 
             backdrop-blur-md border border-white/10 rounded-xl p-6 
             cursor-pointer"
  onClick={() => navigate('/espace-membre/vestiaire')}
>
  <div className="text-4xl mb-4">👘</div>
  <h3 className="text-xl font-bold text-white mb-2">
    Vestiaire Cosplay
  </h3>
  <p className="text-slate-400 text-sm">
    Organisez vos projets cosplay avec des dossiers et sous-dossiers
  </p>
</motion.div>
```

## 🎨 Design du Lien

### Icône Recommandée
- **Emoji :** 👘 (Kimono - représente le vestiaire)
- **Lucide Icon :** `<FolderKanban />` ou `<Folders />`

### Texte
- **Court :** "Vestiaire"
- **Moyen :** "Vestiaire Cosplay"
- **Long :** "Mes Projets Cosplay"

### Style
```tsx
// Style Manga Paradise
className="
  flex items-center gap-3 px-4 py-3 rounded-lg
  bg-black/40 backdrop-blur-md border border-white/10
  hover:border-[#FF007F]/50 hover:shadow-[0_0_20px_rgba(255,0,127,0.3)]
  transition-all duration-300
  text-white font-medium
"
```

## 📱 Responsive

### Mobile
Sur mobile, privilégier l'icône seule ou un texte court :
```tsx
<NavLink to="/espace-membre/vestiaire">
  <span className="text-2xl">👘</span>
  <span className="hidden md:inline ml-2">Vestiaire</span>
</NavLink>
```

### Tablet/Desktop
Afficher l'icône + texte complet.

## 🔔 Badge de Notification (Optionnel)

Pour indiquer le nombre de projets en cours :

```tsx
<NavLink to="/espace-membre/vestiaire" className="relative">
  <span className="text-2xl">👘</span>
  <span>Vestiaire</span>
  {cosplayCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-[#FF007F] text-white 
                     text-xs font-bold rounded-full w-5 h-5 
                     flex items-center justify-center">
      {cosplayCount}
    </span>
  )}
</NavLink>
```

## 🎯 Exemple Complet d'Intégration

### Dans le Menu Espace Membre

```tsx
// src/components/EspaceMembreMenu.tsx (ou équivalent)

import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Settings, 
  Trophy,
  Folders // Pour le vestiaire
} from 'lucide-react';

export function EspaceMembreMenu() {
  const menuItems = [
    {
      to: '/espace-membre/billets',
      icon: <Calendar className="w-5 h-5" />,
      label: 'Mes Billets',
    },
    {
      to: '/espace-membre/amis',
      icon: <Users className="w-5 h-5" />,
      label: 'Mes Amis',
    },
    {
      to: '/espace-membre/vestiaire', // NOUVEAU
      icon: <span className="text-xl">👘</span>,
      label: 'Vestiaire Cosplay',
      badge: true, // Afficher un badge
    },
    {
      to: '/espace-membre/quetes',
      icon: <Trophy className="w-5 h-5" />,
      label: 'Quêtes',
    },
    {
      to: '/espace-membre/parametres',
      icon: <Settings className="w-5 h-5" />,
      label: 'Paramètres',
    },
  ];

  return (
    <nav className="space-y-2">
      {menuItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `
            flex items-center gap-3 px-4 py-3 rounded-lg
            transition-all duration-300
            ${isActive 
              ? 'bg-[#FF007F]/20 border border-[#FF007F]/50 text-white' 
              : 'bg-black/40 border border-white/10 text-slate-400 hover:text-white hover:border-[#FF007F]/30'
            }
          `}
        >
          {item.icon}
          <span className="font-medium">{item.label}</span>
          {item.badge && (
            <span className="ml-auto bg-[#FF007F] text-white text-xs font-bold 
                           px-2 py-1 rounded-full">
              Nouveau
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
```

## 🚀 Étapes d'Intégration

1. **Identifier le composant de navigation** à modifier
2. **Ajouter le lien** avec l'icône et le texte
3. **Appliquer le style** Manga Paradise
4. **Tester la navigation** (clic, hover, active state)
5. **Vérifier le responsive** (mobile, tablet, desktop)
6. **Ajouter un badge** "Nouveau" si c'est une nouvelle fonctionnalité

## 📝 Checklist d'Intégration

- [ ] Lien ajouté dans la navigation
- [ ] Icône 👘 visible
- [ ] Texte "Vestiaire Cosplay" affiché
- [ ] Style Manga Paradise appliqué
- [ ] Hover effect fonctionne
- [ ] Active state visible
- [ ] Responsive (mobile/desktop)
- [ ] Badge "Nouveau" (optionnel)
- [ ] Navigation fonctionne (clic → page)
- [ ] Retour depuis la page fonctionne

## 🎨 Variantes de Design

### Variante 1 : Minimaliste
```tsx
<NavLink to="/espace-membre/vestiaire">
  👘 Vestiaire
</NavLink>
```

### Variante 2 : Avec Description
```tsx
<NavLink to="/espace-membre/vestiaire">
  <div className="flex items-start gap-3">
    <span className="text-2xl">👘</span>
    <div>
      <div className="font-bold text-white">Vestiaire Cosplay</div>
      <div className="text-xs text-slate-400">Organisez vos projets</div>
    </div>
  </div>
</NavLink>
```

### Variante 3 : Card Style (Dashboard)
```tsx
<motion.div
  whileHover={{ scale: 1.05, y: -5 }}
  className="bg-gradient-to-br from-[#FF007F]/20 to-[#00F0FF]/20 
             backdrop-blur-md border border-white/10 rounded-xl p-6 
             cursor-pointer group"
  onClick={() => navigate('/espace-membre/vestiaire')}
>
  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
    👘
  </div>
  <h3 className="text-xl font-bold text-white mb-2">
    Vestiaire Cosplay
  </h3>
  <p className="text-slate-400 text-sm mb-4">
    Organisez vos projets avec des dossiers
  </p>
  <div className="flex items-center gap-2 text-[#FF007F] text-sm font-bold">
    <span>Accéder</span>
    <span>→</span>
  </div>
</motion.div>
```

## 🔗 Liens Connexes

Une fois le Vestiaire intégré, envisager d'ajouter des liens croisés :

1. **Depuis le Dashboard Cosplay** → "Organiser dans le Vestiaire"
2. **Depuis un Projet Cosplay** → "Voir dans le Vestiaire"
3. **Depuis l'Agenda** → "Mes Cosplays pour cet événement"

## ✅ Validation

Une fois l'intégration terminée :
- [ ] Lien visible dans la navigation
- [ ] Navigation fonctionne
- [ ] Style cohérent avec le reste de l'app
- [ ] Responsive testé
- [ ] Accessible (clavier, screen reader)

**Intégration prête ! 🎉**
