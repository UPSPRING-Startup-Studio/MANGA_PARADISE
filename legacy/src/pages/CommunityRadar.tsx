import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Radar, Info, Settings } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CommunityMap } from '@/components/community/CommunityMap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGeocoding } from '@/hooks/useGeocoding';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

const CommunityRadar = () => {
  const [cityInput, setCityInput] = useState('');
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const hasInitialized = useRef(false);
  
  const { saveUserLocation, geocodeCity, isLoading } = useGeocoding();
  const { user } = useAuth();
  const { profile } = useProfile();

  // Sync with user profile on mount
  useEffect(() => {
    if (hasInitialized.current || !profile) return;
    hasInitialized.current = true;

    const initializeMap = async () => {
      // Priority 1: If user has location_geo, use it directly
      const locationGeo = (profile as any).location_geo;
      if (locationGeo) {
        // Parse PostGIS Point format: "POINT(lon lat)"
        const match = locationGeo.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (match) {
          const lon = parseFloat(match[1]);
          const lat = parseFloat(match[2]);
          const coords: [number, number] = [lat, lon];
          setInitialCenter(coords);
          setUserLocation(coords);
          return;
        }
      }

      // Priority 2: If user has city, geocode it
      if (profile.city) {
        const result = await geocodeCity(profile.city);
        if (result) {
          const coords: [number, number] = [result.latitude, result.longitude];
          setInitialCenter(coords);
          // Auto-save with fuzzy offset
          const saved = await saveUserLocation(profile.city);
          if (saved) {
            setUserLocation(coords);
          }
          return;
        }
      }

      // Priority 3: Show location modal
      setIsSettingLocation(true);
    };

    initializeMap();
  }, [profile, geocodeCity, saveUserLocation]);

  const handleSaveLocation = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (!cityInput.trim()) {
      toast.error('Veuillez entrer une ville');
      return;
    }

    // Geocode first to get coordinates
    const result = await geocodeCity(cityInput);
    if (!result) return;

    const success = await saveUserLocation(cityInput);
    if (success) {
      const coords: [number, number] = [result.latitude, result.longitude];
      setInitialCenter(coords);
      setUserLocation(coords);
      setIsSettingLocation(false);
      setCityInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--mp-primary))] to-[hsl(var(--mp-info))] flex items-center justify-center shadow-[0_0_30px_rgba(255,0,127,0.5)]">
                  <Radar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    Radar Otaku / Cosplayer
                  </h1>
                  <p className="text-mp-ink-muted">
                    Découvrez la communauté autour de vous
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Info Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-white/10 bg-mp-paper/50 hover:bg-white"
                    >
                      <Info className="w-4 h-4 text-[hsl(var(--mp-info))]" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-mp-paper border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        <Info className="w-5 h-5 text-[hsl(var(--mp-info))]" />
                        Comment ça marche ?
                      </DialogTitle>
                    </DialogHeader>
                    <div className="text-slate-300 space-y-3 pt-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🎌</span>
                        <div>
                          <p className="font-semibold text-white mb-1">Marqueurs Otaku (Cyan)</p>
                          <p className="text-sm">Les membres avec un rang Otaku (Genin, Chunin, Jonin...)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🎭</span>
                        <div>
                          <p className="font-semibold text-white mb-1">Marqueurs Cosplayer (Rose)</p>
                          <p className="text-sm">Les membres ayant un profil cosplayer actif</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🔒</span>
                        <div>
                          <p className="font-semibold text-white mb-1">Confidentialité</p>
                          <p className="text-sm">Votre position exacte est masquée avec un décalage aléatoire de ±500m pour votre sécurité</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🔍</span>
                        <div>
                          <p className="font-semibold text-white mb-1">Recherche</p>
                          <p className="text-sm">Tapez une ville pour explorer la communauté dans cette zone</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Location Settings Dialog */}
                <Dialog open={isSettingLocation} onOpenChange={setIsSettingLocation}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-white/10 bg-mp-paper/50 hover:bg-white text-white"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Ma Localisation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-mp-paper border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
                        Définir ma localisation
                      </DialogTitle>
                      <DialogDescription className="text-slate-300">
                        Indiquez votre ville pour apparaître sur la carte communautaire.
                        Votre position sera automatiquement décalée pour protéger votre vie privée.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="city" className="text-white">
                          Ville
                        </Label>
                        <Input
                          id="city"
                          placeholder="Ex: Paris, Lyon, Marseille..."
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveLocation()}
                          className="bg-white border-white/10 text-white placeholder:text-mp-ink-muted mt-2"
                        />
                      </div>

                      <div className="bg-white/50 border border-white/10 rounded-lg p-3">
                        <p className="text-xs text-mp-ink-muted">
                          🔒 <span className="font-semibold text-white">Confidentialité garantie :</span> Votre position exacte ne sera jamais affichée. 
                          Un décalage aléatoire de ±500m est appliqué automatiquement.
                        </p>
                      </div>

                      <Button
                        onClick={handleSaveLocation}
                        disabled={isLoading || !cityInput.trim()}
                        className="w-full bg-gradient-to-r from-[hsl(var(--mp-primary))] to-[#FF4D94] hover:shadow-[0_0_30px_rgba(255,0,127,0.7)] transition-all"
                      >
                        {isLoading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 mr-2" />
                            Enregistrer ma position
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="bg-mp-paper/50 border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--mp-info))]/20 flex items-center justify-center">
                    <span className="text-2xl">🎌</span>
                  </div>
                  <div>
                    <p className="text-sm text-mp-ink-muted">Otakus actifs</p>
                    <p className="text-2xl font-bold text-[hsl(var(--mp-info))]">500+</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-mp-paper/50 border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--mp-primary))]/20 flex items-center justify-center">
                    <span className="text-2xl">🎭</span>
                  </div>
                  <div>
                    <p className="text-sm text-mp-ink-muted">Cosplayeurs</p>
                    <p className="text-2xl font-bold text-[hsl(var(--mp-primary))]">250+</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-mp-paper/50 border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--mp-saffron))]/20 flex items-center justify-center">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <div>
                    <p className="text-sm text-mp-ink-muted">Villes couvertes</p>
                    <p className="text-2xl font-bold text-[hsl(var(--mp-saffron))]">50+</p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Map Component */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <CommunityMap initialCenter={initialCenter} userLocation={userLocation} />
          </motion.div>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Radar className="w-5 h-5 text-[hsl(var(--mp-primary))]" />
                Conseils d'utilisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-[hsl(var(--mp-info))]">•</span>
                  <p>Utilisez les filtres pour afficher uniquement les Otakus ou les Cosplayeurs</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[hsl(var(--mp-primary))]">•</span>
                  <p>Cliquez sur un marqueur pour voir le profil du membre</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[hsl(var(--mp-saffron))]">•</span>
                  <p>Recherchez une ville pour découvrir la communauté locale</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[hsl(var(--mp-info))]">•</span>
                  <p>Les clusters regroupent automatiquement les membres proches</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CommunityRadar;
