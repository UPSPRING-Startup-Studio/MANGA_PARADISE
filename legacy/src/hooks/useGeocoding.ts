import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface CityCoordinates {
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Hook for geocoding operations using Nominatim (OpenStreetMap)
 * Handles city search and user location saving with fuzzy offset for privacy
 */
export const useGeocoding = () => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Geocode a city name to GPS coordinates
   * @param cityName - Name of the city to search
   * @returns Coordinates and display name, or null if not found
   */
  const geocodeCity = async (cityName: string): Promise<CityCoordinates | null> => {
    if (!cityName.trim()) {
      toast.error('Veuillez entrer un nom de ville');
      return null;
    }

    setIsLoading(true);
    try {
      // Use Nominatim API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(cityName)}&` +
        `format=json&` +
        `limit=1&` +
        `addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MangaParadise/1.0', // Required by Nominatim
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche de la ville');
      }

      const data: GeocodingResult[] = await response.json();

      if (data.length === 0) {
        toast.error('Ville non trouvée');
        return null;
      }

      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Erreur lors de la recherche de la ville');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply a random fuzzy offset to coordinates for privacy (±500m)
   * @param lat - Original latitude
   * @param lon - Original longitude
   * @returns Coordinates with fuzzy offset
   */
  const applyFuzzyOffset = (lat: number, lon: number) => {
    // ~500m offset in degrees (approximately 0.0045 degrees)
    const maxOffset = 0.0045;
    const latOffset = (Math.random() - 0.5) * 2 * maxOffset;
    const lonOffset = (Math.random() - 0.5) * 2 * maxOffset;

    return {
      latitude: lat + latOffset,
      longitude: lon + lonOffset,
    };
  };

  /**
   * Save user location to database with fuzzy offset for privacy
   * Uses auth.uid() on the backend for security
   * @param cityName - City name to geocode and save
   * @returns Success status
   */
  const saveUserLocation = async (
    cityName: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // First, geocode the city
      const coordinates = await geocodeCity(cityName);
      if (!coordinates) {
        return false;
      }

      // Apply fuzzy offset for privacy
      const fuzzyCoords = applyFuzzyOffset(
        coordinates.latitude,
        coordinates.longitude
      );

      // Extract city and country from display name
      const parts = coordinates.displayName.split(', ');
      const city = parts[0];
      const country = parts[parts.length - 1];

      // Save to database using PostGIS Point via RPC
      // Note: user_id is determined by auth.uid() on the backend
      const { error } = await (supabase.rpc as any)('update_user_location', {
        lat: fuzzyCoords.latitude,
        long: fuzzyCoords.longitude,
        city: city,
        country: country,
      });

      if (error) {
        console.error('Error saving location:', error);
        toast.error('Erreur lors de la sauvegarde de la localisation');
        return false;
      }

      toast.success('📍 Localisation enregistrée avec succès !');
      return true;
    } catch (error) {
      console.error('Save location error:', error);
      toast.error('Erreur lors de la sauvegarde de la localisation');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reverse geocode coordinates to get city name
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns City name or null
   */
  const reverseGeocode = async (
    lat: number,
    lon: number
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${lat}&` +
        `lon=${lon}&` +
        `format=json`,
        {
          headers: {
            'User-Agent': 'MangaParadise/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      return data.display_name || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  return {
    geocodeCity,
    saveUserLocation,
    reverseGeocode,
    isLoading,
  };
};
