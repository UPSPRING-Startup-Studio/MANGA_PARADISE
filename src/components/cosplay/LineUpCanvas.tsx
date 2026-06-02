import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, X, Shirt, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import type { Event } from "@/hooks/useEvents";
import type { LineupWithDetails } from "@/hooks/useCosplayLineups";

interface Props {
  event: Event;
  lineups: LineupWithDetails[];
  eventDays: Date[];
  profile: any;
  onClose: () => void;
}

const LineUpCanvas = ({ event, lineups, eventDays, profile, onClose }: Props) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [format_, setFormat_] = useState<'story' | 'post'>('story');

  const getLineupForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return lineups.find(l => l.event_date === dateStr);
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;

    setDownloading(true);
    try {
      // Get the actual dimensions based on format
      const width = 1080;
      const height = format_ === 'story' ? 1920 : 1350;

      const dataUrl = await toPng(canvasRef.current, {
        width,
        height,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#000000',
      });

      const link = document.createElement('a');
      const formatLabel = format_ === 'story' ? 'story' : 'post';
      link.download = `lineup-${event.title.replace(/\s+/g, '-').toLowerCase()}-${formatLabel}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Image téléchargée ! 🎉", {
        description: `Format ${format_ === 'story' ? 'Story (9:16)' : 'Post (4:5)'}`
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Erreur lors de la génération de l'image");
    } finally {
      setDownloading(false);
    }
  };

  const qrUrl = profile?.qr_code_token
    ? `${window.location.origin}/scan/${profile.qr_code_token}`
    : null;

  // Dimensions pour le rendu
  const canvasWidth = 1080;
  const canvasHeight = format_ === 'story' ? 1920 : 1350;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      {/* Header Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setFormat_('story')}
            className={`px-3 py-1.5 rounded text-sm font-body transition ${
              format_ === 'story' ? 'bg-sakura text-white' : 'text-muted-foreground'
            }`}
          >
            Story (9:16)
          </button>
          <button
            onClick={() => setFormat_('post')}
            className={`px-3 py-1.5 rounded text-sm font-body transition ${
              format_ === 'post' ? 'bg-sakura text-white' : 'text-muted-foreground'
            }`}
          >
            Post (4:5)
          </button>
        </div>
        <Button variant="ghost" onClick={onClose} className="text-white">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Canvas Preview */}
      <div
        className="overflow-auto max-h-[80vh] rounded-xl shadow-2xl"
        style={{
          maxWidth: format_ === 'story' ? '360px' : '400px',
          aspectRatio: format_ === 'story' ? '9/16' : '4/5'
        }}
      >
        <div
          ref={canvasRef}
          className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
          }}
        >
          {/* Background avec poster assombri */}
          {event.image_url && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${event.image_url})`,
                filter: 'brightness(0.4) blur(8px)',
              }}
            />
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

          {/* Content */}
          <div className="relative h-full flex flex-col p-12 justify-between">
            {/* Header avec logos */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-right">
                  <div className="font-display text-3xl text-white tracking-wider">
                    MANGA
                  </div>
                  <div className="font-display text-3xl text-sakura tracking-wider">
                    PARADISE
                  </div>
                </div>
              </div>
              <h1 className="font-display text-5xl text-white mb-3 tracking-wider drop-shadow-lg">
                {event.title.toUpperCase()}
              </h1>
              <p className="font-body text-xl text-white/90 drop-shadow">
                {format(new Date(event.date), 'dd', { locale: fr })}
                {event.end_date && ` - ${format(new Date(event.end_date), 'dd')}`}
                {' '}{format(new Date(event.date), 'MMMM yyyy', { locale: fr })}
              </p>
              {event.venue_name && (
                <p className="font-body text-lg text-sakura mt-2 drop-shadow">
                  📍 {event.venue_name}
                </p>
              )}
            </div>

            {/* Line-Up Grid - Grille flexible */}
            <div className="flex-1 flex items-center justify-center px-4">
              <div
                className="grid gap-4 w-full"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(eventDays.length, 4)}, 1fr)`,
                  maxWidth: '100%',
                }}
              >
                {eventDays.map((day) => {
                  const lineup = getLineupForDay(day);
                  const cosplay = lineup?.cosplay;
                  const dayLabel = format(day, 'EEE d', { locale: fr }).toUpperCase();

                  return (
                    <div key={day.toISOString()} className="flex flex-col items-center gap-3">
                      {/* Day Label Badge */}
                      <div className="bg-sakura/80 px-3 py-1 rounded-full">
                        <p className="font-display text-sm text-white font-bold">
                          {dayLabel}
                        </p>
                      </div>

                      {/* Cosplay Image */}
                      <div className="relative w-full aspect-square">
                        {cosplay ? (
                          <div className="w-full h-full rounded-xl overflow-hidden border-3 border-white/30 shadow-xl">
                            <img
                              src={cosplay.user_image_url}
                              alt={cosplay.character_name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                            {/* Gradient overlay sur l'image */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-xl bg-white/10 border-3 border-white/20 flex items-center justify-center">
                            <Shirt className="w-12 h-12 text-white/40" />
                          </div>
                        )}
                      </div>

                      {/* Character Name */}
                      {cosplay && (
                        <div className="text-center w-full">
                          <p className="font-display text-sm text-white font-bold truncate">
                            {cosplay.character_name}
                          </p>
                          <p className="font-body text-xs text-white/70 truncate">
                            {cosplay.universe}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer - User Info & Branding */}
            <div className="flex items-end justify-between gap-4 pt-6 border-t border-white/10">
              {/* User Info */}
              <div className="flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.username}
                    className="w-16 h-16 rounded-full border-3 border-white/20 object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-sakura flex items-center justify-center border-3 border-white/20">
                    <span className="font-display text-2xl text-white font-bold">
                      {(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-display text-lg text-white font-bold truncate">
                    {profile?.display_name || profile?.username || 'Cosplayer'}
                  </p>
                  {profile?.username && profile?.display_name && (
                    <p className="font-body text-xs text-white/60 truncate">
                      @{profile.username}
                    </p>
                  )}
                </div>
              </div>

              {/* QR Code */}
              {qrUrl && (
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG
                    value={qrUrl}
                    size={80}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          size="lg"
          className="bg-gradient-to-r from-sakura to-otk hover:opacity-90 text-white font-display text-lg px-8 shadow-lg"
        >
          {downloading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Download className="w-5 h-5 mr-2" />
          )}
          {downloading ? "Génération..." : "TÉLÉCHARGER MON LINE-UP"}
        </Button>

        <p className="text-white/60 text-xs text-center max-w-md">
          Format {format_ === 'story' ? 'Story (9:16)' : 'Post (4:5)'} • Haute définition
          <br />
          Partage sur Instagram, TikTok ou Discord ! 🎭
        </p>
      </div>
    </div>
  );
};

export default LineUpCanvas;
