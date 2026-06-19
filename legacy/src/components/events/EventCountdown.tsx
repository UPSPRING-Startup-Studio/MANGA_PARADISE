import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Bell, ExternalLink } from "lucide-react";
import { format, parseISO, differenceInDays, differenceInHours, differenceInMinutes, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface EventCountdownProps {
  eventDate: string;
  eventTime?: string | null;
  eventTitle: string;
  eventLocation?: string | null;
  eventDescription?: string | null;
  isRegistered: boolean;
  className?: string;
}

const EventCountdown = ({
  eventDate,
  eventTime,
  eventTitle,
  eventLocation,
  eventDescription,
  isRegistered,
  className,
}: EventCountdownProps) => {
  const [now, setNow] = useState(new Date());

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const eventDateTime = useMemo(() => {
    const date = parseISO(eventDate);
    if (eventTime) {
      // Parse time like "18:00" or "18:30 - 23:00"
      const timeMatch = eventTime.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        date.setHours(parseInt(timeMatch[1], 10));
        date.setMinutes(parseInt(timeMatch[2], 10));
      }
    }
    return date;
  }, [eventDate, eventTime]);

  const countdown = useMemo(() => {
    const days = differenceInDays(eventDateTime, now);
    const hours = differenceInHours(eventDateTime, now) % 24;
    const minutes = differenceInMinutes(eventDateTime, now) % 60;

    return { days, hours, minutes, isPast: eventDateTime < now };
  }, [eventDateTime, now]);

  // Generate Google Calendar link
  const generateGoogleCalendarLink = () => {
    const startDate = eventDateTime;
    const endDate = addHours(startDate, 3); // Default 3 hours duration

    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d{3}/g, "");
    };

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: eventTitle,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: eventDescription || `Événement Manga Paradise: ${eventTitle}`,
      location: eventLocation || "",
      sf: "true",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Generate .ics file
  const generateICSFile = () => {
    const startDate = eventDateTime;
    const endDate = addHours(startDate, 3);

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, 15) + "Z";
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Manga Paradise//Event//FR
BEGIN:VEVENT
UID:${Date.now()}@mangaparadise.fr
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${eventTitle}
DESCRIPTION:${eventDescription || `Événement Manga Paradise`}
LOCATION:${eventLocation || ""}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
    link.click();
    toast.success("Fichier .ics téléchargé !");
  };

  if (countdown.isPast) {
    return null;
  }

  const getCountdownMessage = () => {
    if (countdown.days === 0 && countdown.hours === 0) {
      return "C'est maintenant ! 🎉";
    }
    if (countdown.days === 0) {
      return `Plus que ${countdown.hours}h${countdown.minutes > 0 ? countdown.minutes : ""} !`;
    }
    if (countdown.days === 1) {
      return "C'est demain ! 🔥";
    }
    if (countdown.days <= 3) {
      return `J-${countdown.days} avant l'événement !`;
    }
    if (countdown.days <= 7) {
      return `Dans ${countdown.days} jours`;
    }
    return `Dans ${countdown.days} jours`;
  };

  const getUrgencyColor = () => {
    if (countdown.days === 0) return "from-sakura to-accent";
    if (countdown.days <= 1) return "from-accent to-sakura";
    if (countdown.days <= 3) return "from-sakura to-turquoise";
    return "from-turquoise to-sakura";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        isRegistered ? "bg-gradient-to-r" : "bg-card border border-border",
        isRegistered && getUrgencyColor(),
        className
      )}
    >
      <div className={cn(
        "p-4 sm:p-5",
        isRegistered && "bg-black/20 backdrop-blur-sm"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Countdown Info */}
          <div className="flex items-center gap-4">
            {/* Countdown Timer */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "flex items-center justify-center w-16 h-16 rounded-xl font-display text-2xl shrink-0",
                isRegistered 
                  ? "bg-white/20 text-white" 
                  : "bg-sakura/10 text-sakura"
              )}
            >
              {countdown.days === 0 ? (
                <span>{countdown.hours}h</span>
              ) : (
                <span>J-{countdown.days}</span>
              )}
            </motion.div>

            <div>
              <p className={cn(
                "font-display text-lg",
                isRegistered ? "text-white" : "text-foreground"
              )}>
                {getCountdownMessage()}
              </p>
              <div className={cn(
                "flex items-center gap-2 text-sm mt-1",
                isRegistered ? "text-white/80" : "text-muted-foreground"
              )}>
                <Calendar className="w-4 h-4" />
                <span className="capitalize">
                  {format(eventDateTime, "EEEE d MMMM", { locale: fr })}
                </span>
                {eventTime && (
                  <>
                    <Clock className="w-4 h-4 ml-2" />
                    <span>{eventTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {isRegistered && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(generateGoogleCalendarLink(), "_blank")}
                className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Google Agenda</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={generateICSFile}
                className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">.ics</span>
              </Button>
            </div>
          )}

          {!isRegistered && countdown.days <= 7 && (
            <Badge className="bg-sakura/10 text-sakura border-sakura/30 shrink-0">
              Inscris-toi vite !
            </Badge>
          )}
        </div>

        {/* Registered confirmation */}
        {isRegistered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 pt-3 border-t border-white/20"
          >
            <p className="text-sm text-white/80 flex items-center gap-2">
              <span className="text-lg">🐌</span>
              Ton Den Den Mushi te préviendra 24h avant l'événement !
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default EventCountdown;
