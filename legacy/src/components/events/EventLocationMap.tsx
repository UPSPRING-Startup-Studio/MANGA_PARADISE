import { motion } from "framer-motion";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EventLocationMapProps {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * EventLocationMap Component
 * Displays an interactive Google Maps iframe for event location visualization
 * with glassmorphism styling and a button to open in native Maps app
 */
export const EventLocationMap = ({ address, coordinates }: EventLocationMapProps) => {
  if (!address) {
    return null;
  }

  // Build the iframe src using Google Maps Embed API (no API key required for basic embed)
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  // Build the link to open in Google Maps app/web
  const mapsLink = coordinates
    ? `https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`
    : `https://maps.google.com/maps/search/${encodeURIComponent(address)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="overflow-hidden border-sakura/20 bg-card/50 backdrop-blur">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sakura" />
            <h3 className="font-display text-lg">📍 Localisation</h3>
          </div>

          {/* Map Container with Glassmorphism */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(255,0,127,0.1)]">
            {/* Glow effect background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sakura/5 via-transparent to-turquoise/5 pointer-events-none z-10" />

            {/* Iframe */}
            <iframe
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={mapsEmbedUrl}
              className="relative z-0"
            />
          </div>

          {/* Address Display */}
          <div className="bg-muted/30 rounded-lg p-3 border border-white/5">
            <p className="text-sm text-muted-foreground mb-1">Adresse</p>
            <p className="text-foreground font-medium">{address}</p>
          </div>

          {/* Open in Maps Button */}
          <Button
            asChild
            className="w-full bg-gradient-to-r from-sakura to-turquoise hover:opacity-90 text-white font-display gap-2"
          >
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir dans Maps
            </a>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default EventLocationMap;
