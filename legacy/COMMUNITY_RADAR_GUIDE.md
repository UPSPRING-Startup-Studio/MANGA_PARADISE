# 🗺️ Guide du Radar Communautaire Otaku/Cosplayer

## 📋 Vue d'ensemble

Le **Radar Communautaire** est une carte interactive permettant aux membres de Manga Paradise de découvrir et localiser la communauté Otaku et Cosplayer autour d'eux.

## 🎯 Fonctionnalités principales

### 1. **Carte Interactive (Leaflet)**
- Tuiles "Dark Matter" pour un style cyberpunk
- Clustering automatique des marqueurs proches
- Zoom et navigation fluides

### 2. **Filtres Dynamiques**
- 🎌 **Filtre Otaku** : Affiche les membres avec un rang Otaku (Genin, Chunin, Jonin...)
- 🎭 **Filtre Cosplayer** : Affiche les membres avec un profil cosplayer actif
- Les deux filtres peuvent être activés simultanément

### 3. **Recherche par Ville**
- Barre de recherche avec géocodage via Nominatim (OpenStreetMap)
- Centrage automatique sur la ville recherchée
- Exemples : "Paris", "Lyon", "Marseille", "Tokyo"

### 4. **Marqueurs Personnalisés**
- **Cyan (🎌)** : Membres Otaku uniquement
- **Rose (🎭)** : Membres Cosplayer (prioritaire si les deux)
- Effet de glow pour un style néon

### 5. **Pop-ups Détaillés**
Au clic sur un marqueur :
- Avatar du membre
- Pseudo et titre
- Badges (Otaku/Cosplayer)
- Nom de cosplayer si applicable
- Distance en km

### 6. **Confidentialité Intégrée**
- **Fuzzy Offset** : Décalage aléatoire de ±500m sur la position réelle
- Option `is_location_public` pour contrôler la visibilité
- Aucune position exacte n'est jamais affichée

## 🗂️ Architecture Technique

### Backend (Supabase + PostGIS)

#### Extensions
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### Colonnes ajoutées à `profiles`
```sql
location_geo geography(Point, 4326)  -- Point GPS avec fuzzy offset
is_location_public boolean           -- Visibilité sur la carte
location_city text                   -- Ville de l'utilisateur
location_country text                -- Pays
is_cosplayer boolean                 -- Calculé automatiquement
```

#### Fonction RPC : `get_nearby_profiles`
Paramètres :
- `lat` : Latitude du centre de recherche
- `long` : Longitude du centre de recherche
- `radius_meters` : Rayon de recherche (défaut 50km)
- `filter_otaku` : Afficher les Otakus (défaut true)
- `filter_cosplayer` : Afficher les Cosplayers (défaut true)

Retourne :
- Liste des profils dans le rayon
- Distance en mètres
- Coordonnées GPS (avec fuzzy offset)

#### Fonction RPC : `update_user_location`
Paramètres :
- `user_id` : ID de l'utilisateur
- `longitude` : Longitude
- `latitude` : Latitude
- `city` : Ville
- `country` : Pays

Met à jour la localisation de l'utilisateur et active automatiquement `is_location_public`.

### Frontend (React + Leaflet)

#### Composants créés

1. **`src/hooks/useGeocoding.ts`**
   - Hook pour géocodage via Nominatim
   - `geocodeCity(cityName)` : Convertit une ville en coordonnées GPS
   - `saveUserLocation(city, userId)` : Sauvegarde avec fuzzy offset
   - `reverseGeocode(lat, lon)` : Coordonnées → Nom de ville

2. **`src/components/community/CommunityMap.tsx`**
   - Composant principal de la carte
   - Gestion des filtres et de la recherche
   - Clustering avec `react-leaflet-cluster`
   - Marqueurs personnalisés avec DivIcon

3. **`src/pages/CommunityRadar.tsx`**
   - Page complète avec header, stats et carte
   - Modal de configuration de localisation
   - Modal d'informations
   - Design Manga Paradise (glassmorphism, neon)

#### Dépendances installées
```bash
npm install leaflet react-leaflet react-leaflet-cluster @types/leaflet --legacy-peer-deps
```

#### Route ajoutée
```tsx
<Route path="/communaute/radar" element={<RequireAuth><CommunityRadar /></RequireAuth>} />
```

## 🚀 Utilisation

### Pour les utilisateurs

1. **Accéder à la carte**
   - Menu Communauté → Radar Otaku/Cosplayer
   - URL : `/communaute/radar`

2. **Définir sa localisation**
   - Cliquer sur "Ma Localisation"
   - Entrer sa ville
   - Valider → Position enregistrée avec fuzzy offset

3. **Explorer la communauté**
   - Utiliser les filtres Otaku/Cosplayer
   - Rechercher une ville spécifique
   - Cliquer sur les marqueurs pour voir les profils

### Pour les développeurs

#### Appliquer les migrations
```bash
# Via Supabase CLI
supabase db push

# Ou appliquer manuellement le fichier consolidé
supabase/migrations/APPLY_COMMUNITY_RADAR.sql
```

#### Régénérer les types TypeScript
```bash
npm run supabase:types
```

#### Tester localement
```bash
npm run dev
# Accéder à http://localhost:5173/communaute/radar
```

## 🎨 Design System

### Couleurs
- **Otaku** : Cyan `#00F0FF`
- **Cosplayer** : Neon Pink `#FF007F`
- **Accent** : Gold `#FFD700`
- **Background** : Slate 950 (Dark)

### Effets
- Glassmorphism : `bg-black/80 backdrop-blur-md`
- Glow : `shadow-[0_0_30px_rgba(255,0,127,0.5)]`
- Borders : `border-white/10`

## 🔒 Sécurité & Confidentialité

### Fuzzy Offset
```typescript
const applyFuzzyOffset = (lat: number, lon: number) => {
  const maxOffset = 0.0045; // ~500m
  const latOffset = (Math.random() - 0.5) * 2 * maxOffset;
  const lonOffset = (Math.random() - 0.5) * 2 * maxOffset;
  return {
    latitude: lat + latOffset,
    longitude: lon + lonOffset,
  };
};
```

### RLS (Row Level Security)
Les fonctions RPC utilisent `SECURITY DEFINER` mais ne retournent que les profils avec `is_location_public = true`.

## 📊 Statistiques affichées

- **Otakus actifs** : Nombre de profils avec `otaku_class` défini
- **Cosplayeurs** : Nombre de profils avec `is_cosplayer = true`
- **Villes couvertes** : Nombre de villes uniques dans `location_city`

## 🐛 Troubleshooting

### Erreur : "Cannot find module '@/hooks/useAuth'"
✅ Utiliser `@/contexts/AuthContext` à la place

### Erreur : Types Supabase manquants
✅ Régénérer les types : `npm run supabase:types`

### Carte ne s'affiche pas
✅ Vérifier que Leaflet CSS est importé :
```typescript
import 'leaflet/dist/leaflet.css';
```

### Marqueurs par défaut cassés
✅ Fix appliqué dans `CommunityMap.tsx` :
```typescript
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
```

## 🎯 Prochaines améliorations possibles

- [ ] Autocomplétion de la recherche de ville
- [ ] Filtres avancés (par rang Otaku, par type de cosplay)
- [ ] Rayon de recherche personnalisable
- [ ] Notifications quand un nouveau membre rejoint la zone
- [ ] Mode "Événements à proximité"
- [ ] Intégration avec les Guildes (afficher les membres de sa guilde)

## 📝 Notes importantes

1. **Nominatim Rate Limiting** : L'API OpenStreetMap a des limites de requêtes. Pour une utilisation en production, considérer un cache ou une API payante.

2. **Performance** : La limite de 500 profils dans `get_nearby_profiles` évite les surcharges. Ajuster selon les besoins.

3. **Mobile** : La carte est responsive mais peut nécessiter des ajustements pour une meilleure UX mobile.

## 🤝 Contribution

Pour ajouter des fonctionnalités :
1. Modifier les migrations SQL si nécessaire
2. Mettre à jour les hooks/composants React
3. Tester avec des données réelles
4. Documenter les changements dans ce guide

---

**Créé le** : 16 février 2026  
**Version** : 1.0  
**Auteur** : Kilo Code (AI Assistant)
