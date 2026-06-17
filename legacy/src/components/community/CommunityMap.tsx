/**
 * CommunityMap.tsx - Composant principal de la carte communautaire
 * Utilise React.lazy pour charger LeafletMap dynamiquement (compatible Vite/ESM)
 */
import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGeocoding } from '@/hooks/useGeocoding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProfileMarker } from './LeafletMap';

// Lazy load the Leaflet map component (avoids SSR/require issues)
const LeafletMap = lazy(() => import('./LeafletMap'));

// Loading spinner component
const MapLoader = () => (
  <div className="flex items-center justify-center h-full bg-mp-paper rounded-xl">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-[hsl(var(--mp-primary))] border-t-transparent rounded-full mx-auto mb-4"
      />
      <p className="text-mp-ink-muted text-sm">Chargement de la carte...</p>
    </div>
  </div>
);

// ---- MAIN COMPONENT ----
interface CommunityMapProps {
  initialCenter?: [number, number] | null;
  userLocation?: [number, number] | null; // User's actual position for "Me" marker
}

export const CommunityMap = ({ initialCenter, userLocation }: CommunityMapProps = {}) => {
  const [searchCity, setSearchCity] = useState('');
  const [filterOtaku, setFilterOtaku] = useState(true);
  const [filterCosplayer, setFilterCosplayer] = useState(true);
  const [profiles, setProfiles] = useState<ProfileMarker[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter || [48.8566, 2.3522]); // Use initialCenter or Paris default
  const [mapZoom, setMapZoom] = useState(initialCenter ? 12 : 6); // Zoom closer if user has location
  const [radius, setRadius] = useState(20000); // Default 20km
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Use userLocation for radius center, fallback to mapCenter
  const radiusCenter = userLocation || mapCenter;

  const { geocodeCity } = useGeocoding();

  // Update map center when initialCenter changes
  useEffect(() => {
    if (initialCenter) {
      setMapCenter(initialCenter);
      setMapZoom(12);
    }
  }, [initialCenter]);

  // Only mount map on client side after first render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch nearby profiles via RPC (centered on user location or map center)
  const fetchNearbyProfiles = useCallback(async (lat: number, lon: number) => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)('get_nearby_profiles', {
        lat,
        long: lon,
        radius_meters: radius,
        filter_otaku: filterOtaku,
        filter_cosplayer: filterCosplayer,
      });

      if (error) {
        console.warn('RPC get_nearby_profiles error (may not be deployed yet):', error.message);
        // Don't show toast for expected errors (function not deployed)
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.warn('Fetch profiles error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [radius, filterOtaku, filterCosplayer]);

  // Refetch when radius changes
  useEffect(() => {
    if (isMounted && radiusCenter) {
      fetchNearbyProfiles(radiusCenter[0], radiusCenter[1]);
    }
  }, [radius, isMounted, radiusCenter, fetchNearbyProfiles]);

  // Handle city search
  const handleCitySearch = async () => {
    if (!searchCity.trim()) {
      toast.error('Veuillez entrer un nom de ville');
      return;
    }

    const result = await geocodeCity(searchCity);
    if (result) {
      setMapCenter([result.latitude, result.longitude]);
      setMapZoom(12);
      await fetchNearbyProfiles(result.latitude, result.longitude);
      toast.success(`📍 Carte centrée sur ${searchCity}`);
    }
  };

  // Initial load - center on France
  useEffect(() => {
    if (isMounted) {
      fetchNearbyProfiles(48.8566, 2.3522);
    }
  }, [isMounted, fetchNearbyProfiles]);

  // Count profiles by type
  const counts = useMemo(() => {
    const otakuCount = profiles.filter(p => p.otaku_class).length;
    const cosplayerCount = profiles.filter(p => p.is_cosplayer).length;
    return { otakuCount, cosplayerCount };
  }, [profiles]);

  return (
    <div className="relative w-full h-[700px] min-h-[600px] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Control Panel Overlay */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none"
      >
        <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-[0_0_30px_rgba(255,0,127,0.3)] pointer-events-auto">
          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mp-ink-muted" />
              <Input
                placeholder="Rechercher une ville... (ex: Lyon, Paris, Marseille)"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                className="pl-10 bg-mp-paper/50 border-white/10 text-white placeholder:text-mp-ink-muted"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCitySearch}
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[#FF4D94] text-white rounded-lg font-medium shadow-[0_0_20px_rgba(255,0,127,0.5)] hover:shadow-[0_0_30px_rgba(255,0,127,0.7)] transition-all disabled:opacity-50"
            >
              <MapPin className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="filter-otaku"
                  checked={filterOtaku}
                  onCheckedChange={setFilterOtaku}
                  className="data-[state=checked]:bg-[hsl(var(--mp-info))]"
                />
                <Label htmlFor="filter-otaku" className="flex items-center gap-2 text-white cursor-pointer">
                  <span className="text-xl">🎌</span>
                  <span className="font-medium">Otakus</span>
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="filter-cosplayer"
                  checked={filterCosplayer}
                  onCheckedChange={setFilterCosplayer}
                  className="data-[state=checked]:bg-[hsl(var(--mp-primary))]"
                />
                <Label htmlFor="filter-cosplayer" className="flex items-center gap-2 text-white cursor-pointer">
                  <span className="text-xl">🎭</span>
                  <span className="font-medium">Cosplayeurs</span>
                </Label>
              </div>
            </div>

            {/* Counter */}
            <div className="flex items-center gap-2 px-4 py-2 bg-mp-paper/50 rounded-lg border border-white/10">
              <Users className="w-4 h-4 text-[hsl(var(--mp-saffron))]" />
              <span className="text-white font-medium text-sm">
                {counts.otakuCount} <span className="text-[hsl(var(--mp-info))]">Otakus</span>
                {' & '}
                {counts.cosplayerCount} <span className="text-[hsl(var(--mp-primary))]">Cosplayeurs</span>
              </span>
            </div>
          </div>

          {/* Radius Slider */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <Label htmlFor="radius-slider" className="text-white text-sm mb-2 block">
              Rayon de recherche : <span className="text-[hsl(var(--mp-primary))] font-bold">{radius / 1000} km</span>
            </Label>
            <input
              id="radius-slider"
              type="range"
              min="5000"
              max="100000"
              step="5000"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-mp-cloud rounded-lg appearance-none cursor-pointer accent-[hsl(var(--mp-primary))]"
              style={{
                background: `linear-gradient(to right, hsl(var(--mp-primary)) 0%, hsl(var(--mp-primary)) ${((radius - 5000) / 95000) * 100}%, #334155 ${((radius - 5000) / 95000) * 100}%, #334155 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-mp-ink-muted mt-1">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Map - Lazy loaded via React.lazy + Suspense */}
      {isMounted && (
        <Suspense fallback={<MapLoader />}>
          <LeafletMap
            center={mapCenter}
            zoom={mapZoom}
            profiles={profiles}
            radius={radius}
            radiusCenter={radiusCenter}
            userLocation={userLocation}
          />
        </Suspense>
      )}

      {/* Pre-mount loader */}
      {!isMounted && <MapLoader />}

      {/* Loading Overlay (during data fetch) */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-[hsl(var(--mp-primary))] border-t-transparent rounded-full"
          />
        </div>
      )}
    </div>
  );
};
