/**
 * LeafletMap.tsx - Composant Leaflet isolé
 * Ce fichier contient TOUTE la logique Leaflet.
 * Il est importé dynamiquement via React.lazy() dans CommunityMap.tsx
 * pour éviter les problèmes SSR et require().
 */
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with bundlers
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// ---- TYPES ----
export interface ProfileMarker {
  id: string;
  username: string;
  avatar_url: string | null;
  otaku_class: string | null;
  is_cosplayer: boolean;
  cosplayer_name: string | null;
  title: string | null;
  badges: any;
  distance_meters: number;
  latitude: number;
  longitude: number;
}

interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  profiles: ProfileMarker[];
  radius: number; // Radius in meters
  radiusCenter: [number, number]; // Center of the radius circle (user location)
  userLocation?: [number, number] | null; // User's actual position for "Me" marker
}

// ---- MAP CONTROLLER ----
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// ---- CUSTOM ICONS ----
const createCustomIcon = (profile: ProfileMarker) => {
  const isPrimarilyCosplayer = profile.is_cosplayer;
  const color = isPrimarilyCosplayer ? 'hsl(var(--mp-primary))' : 'hsl(var(--mp-info))';

  return new L.DivIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0,0,0,0.3), 0 0 20px ${color}80;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">
        ${isPrimarilyCosplayer ? '🎭' : '🎌'}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32] as any,
    iconAnchor: [16, 32] as any,
    popupAnchor: [0, -32] as any,
  });
};

const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return new L.DivIcon({
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(var(--mp-primary)), hsl(var(--mp-info)));
        border: 3px solid white;
        box-shadow: 0 0 20px rgba(255,0,127,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster',
    iconSize: [40, 40] as any,
  });
};

// Create "Me" marker icon (Gold)
const createMeIcon = () => {
  return new L.DivIcon({
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: hsl(var(--mp-saffron));
        border: 4px solid white;
        box-shadow: 0 0 15px rgba(255,215,0,0.6), 0 0 30px rgba(255,215,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        animation: pulse 2s infinite;
      ">
        🏠
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    className: 'me-marker',
    iconSize: [40, 40] as any,
    iconAnchor: [20, 40] as any,
    popupAnchor: [0, -40] as any,
  });
};

// ---- MAIN COMPONENT ----
const LeafletMap = ({ center, zoom, profiles, radius, radiusCenter, userLocation }: LeafletMapProps) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <MapController center={center} zoom={zoom} />

      {/* Dark Matter Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Radius Circle Visualization - Centered on user location */}
      <Circle
        center={radiusCenter}
        radius={radius}
        pathOptions={{
          color: 'hsl(var(--mp-primary))',
          fillColor: 'hsl(var(--mp-primary))',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 10',
        }}
      />

      {/* "Me" Marker - User's location */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={createMeIcon()}
          zIndexOffset={1000} // Always on top
        >
          <Popup className="custom-popup">
            <div className="p-3 text-center">
              <div className="text-2xl mb-2">🏠</div>
              <p className="font-bold text-slate-900 mb-1">Vous êtes ici</p>
              <p className="text-xs text-mp-ink-muted">Votre zone d'influence</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Clustered Markers */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        iconCreateFunction={createClusterIcon}
      >
        {profiles.map((profile) => (
          <Marker
            key={profile.id}
            position={[profile.latitude, profile.longitude]}
            icon={createCustomIcon(profile)}
          >
            <Popup className="custom-popup">
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-12 h-12 border-2 border-[hsl(var(--mp-primary))]">
                    <AvatarImage src={profile.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] text-white">
                      {profile.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-slate-900">{profile.username}</h3>
                    {profile.title && (
                      <p className="text-xs text-mp-ink-muted">{profile.title}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {profile.otaku_class && (
                    <Badge className="bg-[hsl(var(--mp-info))]/20 text-[hsl(var(--mp-info))] border-[hsl(var(--mp-info))]/30 text-xs">
                      🎌 {profile.otaku_class}
                    </Badge>
                  )}
                  {profile.is_cosplayer && (
                    <Badge className="bg-[hsl(var(--mp-primary))]/20 text-[hsl(var(--mp-primary))] border-[hsl(var(--mp-primary))]/30 text-xs">
                      🎭 Cosplayer
                    </Badge>
                  )}
                </div>

                {profile.cosplayer_name && (
                  <p className="text-sm text-mp-ink-muted">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {profile.cosplayer_name}
                  </p>
                )}

                <p className="text-xs text-mp-ink-muted mt-2">
                  📍 {(profile.distance_meters / 1000).toFixed(1)} km
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default LeafletMap;
