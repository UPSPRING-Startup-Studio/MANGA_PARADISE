# 🎨 Frontend Design Plugin - Manga Paradise

Plugin de composants UI avancés pour créer une expérience immersive **Cyberpunk/Anime** dans Manga Paradise.

## 📦 Installation

Les dépendances suivantes ont été installées :
- `react-confetti` - Effets confetti pour gamification
- `canvas-confetti` - Confetti canvas-based performant
- `@tsparticles/react` - Système de particules animées
- `@tsparticles/slim` - Version optimisée de tsparticles

## 🎯 Composants Disponibles

### 1. **GlassmorphicCard** 
Carte avec effet glassmorphism (blur + transparence)

```tsx
import { GlassmorphicCard } from "@/components/ui/frontend-design";

<GlassmorphicCard 
  variant="pink"        // default | pink | cyan | gold
  intensity="medium"    // light | medium | strong
  glow                  // Active l'effet glow
  hover                 // Active l'effet hover scale
>
  <h3>Mon contenu</h3>
</GlassmorphicCard>
```

**Props:**
- `variant`: Couleur de la bordure
- `intensity`: Intensité du blur
- `glow`: Active l'effet lumineux
- `hover`: Active l'animation au survol

---

### 2. **NeonButton**
Bouton avec effet néon et glow animé

```tsx
import { NeonButton } from "@/components/ui/frontend-design";

<NeonButton 
  variant="cyan"           // pink | cyan | gold | purple
  size="md"                // sm | md | lg
  glowIntensity="high"     // low | medium | high
  animated                 // Active la pulsation
  loading={isLoading}
  onClick={handleClick}
>
  Rejoindre l'événement
</NeonButton>
```

**Props:**
- `variant`: Couleur du néon
- `size`: Taille du bouton
- `glowIntensity`: Intensité de l'effet glow
- `animated`: Active l'animation de pulsation
- `loading`: Affiche un loader

---

### 3. **ParticleBackground**
Fond animé avec particules

```tsx
import { ParticleBackground } from "@/components/ui/frontend-design";

<ParticleBackground 
  variant="cyberpunk"    // default | cyberpunk | stars | minimal
  density={80}           // Nombre de particules
/>
```

**Variants:**
- `default`: Particules roses avec liens
- `cyberpunk`: Mix de couleurs (pink/cyan/gold) avec liens
- `stars`: Étoiles blanches scintillantes
- `minimal`: Peu de particules, discret

---

### 4. **ConfettiEffect**
Système de confetti pour gamification

```tsx
import { ConfettiEffect, useConfetti } from "@/components/ui/frontend-design";

// Méthode 1: Composant déclaratif
<ConfettiEffect 
  trigger={hasWon}
  variant="celebration"    // default | celebration | achievement | explosion
  colors={["#FF007F", "#00F0FF", "#FFD700"]}
  duration={3000}
/>

// Méthode 2: Hook impératif
function MyComponent() {
  const { fire } = useConfetti();
  
  return (
    <button onClick={() => fire("achievement")}>
      Débloquer succès
    </button>
  );
}
```

**Variants:**
- `default`: Burst simple depuis le haut
- `celebration`: Tirs continus depuis les coins
- `achievement`: Double burst puissant
- `explosion`: Explosion radiale

---

### 5. **AnimatedCounter**
Compteur animé pour XP, stats, etc.

```tsx
import { 
  AnimatedCounter, 
  AnimatedXPGain, 
  StatCounter 
} from "@/components/ui/frontend-design";

// Compteur simple
<AnimatedCounter 
  value={1250}
  prefix="+"
  suffix=" XP"
  variant="gold"         // default | pink | cyan | gold
  size="lg"              // sm | md | lg | xl
  duration={1.5}
/>

// Gain d'XP flottant
<AnimatedXPGain 
  amount={50}
  onComplete={() => console.log("Animation terminée")}
/>

// Stat avec label et trend
<StatCounter 
  label="Événements participés"
  value={42}
  icon={<Calendar />}
  variant="cyan"
  trend="up"             // up | down | neutral
  trendValue={5}
/>
```

---

### 6. **GlitchText**
Texte avec effet glitch cyberpunk

```tsx
import { 
  GlitchText, 
  GlitchTitle, 
  DataStream 
} from "@/components/ui/frontend-design";

// Texte glitch simple
<GlitchText 
  variant="pink"         // default | pink | cyan | gold
  intensity="medium"     // low | medium | high
  continuous             // Animation continue (sinon au hover)
>
  MANGA PARADISE
</GlitchText>

// Titre avec glitch
<GlitchTitle 
  variant="cyan"
  size="xl"              // sm | md | lg | xl
>
  BIENVENUE
</GlitchTitle>

// Effet "Matrix" typing
<DataStream 
  text="Connexion établie..."
  speed={50}
  variant="cyan"
/>
```

---

## 🎨 Palette de Couleurs

Les composants utilisent la palette Manga Paradise :

- **Neon Pink**: `#FF007F` - Couleur principale
- **Cyan**: `#00F0FF` - Couleur secondaire
- **Gold**: `#FFD700` - Accent luxe/récompenses
- **Purple**: `#9333EA` - Variante alternative

---

## 💡 Exemples d'Utilisation

### Page d'accueil avec particules
```tsx
function HomePage() {
  return (
    <div className="relative min-h-screen">
      <ParticleBackground variant="cyberpunk" />
      
      <div className="relative z-10">
        <GlitchTitle variant="pink" size="xl">
          MANGA PARADISE
        </GlitchTitle>
        
        <NeonButton variant="cyan" animated>
          Commencer l'aventure
        </NeonButton>
      </div>
    </div>
  );
}
```

### Card de profil avec glassmorphism
```tsx
function ProfileCard({ user }) {
  return (
    <GlassmorphicCard variant="pink" glow hover>
      <div className="flex items-center gap-4">
        <img src={user.avatar} className="rounded-full" />
        <div>
          <h3>{user.name}</h3>
          <AnimatedCounter 
            value={user.xp}
            suffix=" XP"
            variant="gold"
          />
        </div>
      </div>
    </GlassmorphicCard>
  );
}
```

### Système de récompense
```tsx
function AchievementUnlock() {
  const { fire } = useConfetti();
  const [showXP, setShowXP] = useState(false);
  
  const handleUnlock = () => {
    fire("achievement");
    setShowXP(true);
  };
  
  return (
    <>
      <NeonButton 
        variant="gold" 
        onClick={handleUnlock}
        animated
      >
        Débloquer
      </NeonButton>
      
      {showXP && (
        <AnimatedXPGain 
          amount={100}
          onComplete={() => setShowXP(false)}
        />
      )}
    </>
  );
}
```

---

## 🚀 Import Centralisé

Tous les composants sont exportés depuis un fichier central :

```tsx
import {
  GlassmorphicCard,
  NeonButton,
  ParticleBackground,
  ConfettiEffect,
  useConfetti,
  AnimatedCounter,
  GlitchText,
  GlitchTitle,
} from "@/components/ui/frontend-design";
```

---

## 📁 Structure des Fichiers

```
src/components/ui/
├── GlassmorphicCard.tsx      # Cartes glassmorphism
├── NeonButton.tsx             # Boutons néon
├── ParticleBackground.tsx     # Fond particules
├── ConfettiEffect.tsx         # Système confetti
├── AnimatedCounter.tsx        # Compteurs animés
├── GlitchText.tsx             # Effets texte glitch
└── frontend-design.ts         # Export centralisé
```

---

## 🎯 Best Practices

1. **Performance**: Utilisez `ParticleBackground` avec `density` modérée (50-100)
2. **Accessibilité**: Les effets glitch ont `aria-hidden` sur les ombres
3. **Animations**: Préférez `animated={false}` sur mobile pour économiser la batterie
4. **Couleurs**: Respectez la palette Manga Paradise pour la cohérence
5. **Glassmorphism**: Fonctionne mieux sur des fonds sombres

---

## 🐛 Troubleshooting

### Les particules ne s'affichent pas
- Vérifiez que `@tsparticles/react` et `@tsparticles/slim` sont installés
- Assurez-vous que le conteneur parent a une hauteur définie

### Les confettis ne se déclenchent pas
- Vérifiez que `canvas-confetti` est installé
- Le composant doit être monté dans le DOM

### Le glitch est trop intense
- Réduisez `intensity` à `"low"`
- Désactivez `continuous` pour un effet au hover uniquement

---

## 📝 Notes Techniques

- **Framer Motion**: Tous les composants utilisent Framer Motion pour les animations
- **Tailwind CSS**: Les styles utilisent Tailwind avec des classes personnalisées
- **TypeScript**: Tous les composants sont typés avec des interfaces claires
- **Tree-shaking**: Import individuel possible pour optimiser le bundle

---

## 🎉 Crédits

Développé pour **Manga Paradise** - La plateforme sociale pour Otakus, Cosplayers et Gamers.

**Version**: 1.0.0  
**Date**: Février 2026  
**Stack**: React + TypeScript + Tailwind + Framer Motion
