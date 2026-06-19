import { Lock, Calendar, MapPin, Hand } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useMyEventRegistrations } from "@/hooks/useCosCard";
import { useUserContestRegistrations } from "@/hooks/useUserContestRegistrations";
import { useUnifiedAgenda } from "@/hooks/useUnifiedAgenda";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MemberAgendaTabProps {
  memberId: string;
  memberName: string;
  isFriend: boolean;
  currentUserId: string | undefined;
}

// Status style helper — extracted outside component for clarity
const getStatusStyle = (status: string) => {
  switch (status) {
    case "pending":
      return {
        bgColor: "bg-amber-400/20",
        borderColor: "border-amber-400",
        textColor: "text-amber-900",
        glowColor: "shadow-[0_0_12px_rgba(251,146,60,0.4)]",
        icon: "⏳",
        label: "Candidature en examen",
      };
    case "approved":
      return {
        bgColor: "bg-green-500/20",
        borderColor: "border-green-400",
        textColor: "text-green-900",
        glowColor: "shadow-[0_0_12px_rgba(74,222,128,0.4)]",
        icon: "✅",
        label: "Participation Confirmée",
      };
    case "rejected":
      return {
        bgColor: "bg-red-500/20",
        borderColor: "border-red-400",
        textColor: "text-red-900",
        glowColor: "shadow-[0_0_12px_rgba(248,113,113,0.4)]",
        icon: "❌",
        label: "Candidature Refusée",
      };
    case "waitlist":
      return {
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-400",
        textColor: "text-blue-900",
        glowColor: "shadow-[0_0_12px_rgba(96,165,250,0.4)]",
        icon: "ℹ️",
        label: "Sur liste d'attente",
      };
    default:
      return {
        bgColor: "bg-white/5",
        borderColor: "border-white/10",
        textColor: "text-white/60",
        glowColor: "",
        icon: "•",
        label: "Statut inconnu",
      };
  }
};

const MemberAgendaTab = ({ memberId, memberName, isFriend, currentUserId }: MemberAgendaTabProps) => {
  // Unified agenda: merges event_participants + contest_registrations
  const { data: unifiedAgenda, isLoading } = useUnifiedAgenda(memberId, isFriend);
  const { data: myRegistrations } = useMyEventRegistrations(currentUserId);

  // Fetch ALL contest registrations for the member being viewed
  const { data: allContestRegistrations = [] } = useUserContestRegistrations(memberId);

  console.log("🔍 DEBUG AGENDA - memberId:", memberId, "Unified agenda:", unifiedAgenda?.length, "Contest regs:", allContestRegistrations.length);

  // Locked state for non-friends
  if (!isFriend) {
    return (
      <section className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white/40" />
          </div>
          <div>
            <h3 className="text-white font-display text-lg mb-2">Agenda verrouillé 🔒</h3>
            <p className="text-white/60 text-sm">
              Devenez Nakama pour voir l'agenda de <span className="text-sakura">{memberName}</span>
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-turquoise" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  // No upcoming events
  if (!unifiedAgenda || unifiedAgenda.length === 0) {
    return (
      <section className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
        <div className="flex flex-col items-center gap-3">
          <Calendar className="w-10 h-10 text-white/30" />
          <p className="text-white/60 text-sm">
            {memberName} n'a pas d'événement prévu prochainement
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white/5 rounded-xl p-4 border border-white/10">
      <h3 className="text-turquoise font-display text-lg tracking-wide mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        📅 Agenda de {memberName}
      </h3>

      <div className="space-y-3">
        {unifiedAgenda.map((event) => {
          const isMatch = myRegistrations?.includes(event.id);
          const eventDate = new Date(event.date);

          // Find contest registration for this event (PRIORITY display)
          const contestReg = allContestRegistrations.find(
            (r) => String(r.event_id) === String(event.id)
          ) || null;

          const statusStyle = contestReg ? getStatusStyle(contestReg.status) : null;

          console.log("🔍 DEBUG AGENDA - Event:", event.title, "eventId:", event.id, "contestReg:", contestReg ? `${contestReg.character_name} (${contestReg.status})` : "none");

          return (
            <div
              key={event.id}
              className={cn(
                "relative rounded-lg overflow-hidden border transition-all duration-300",
                contestReg
                  ? `${statusStyle?.borderColor} ${statusStyle?.bgColor} ${statusStyle?.glowColor}`
                  : isMatch
                    ? "border-accent/50 bg-accent/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
              )}
            >
              {/* Match Badge (only if no contest registration) */}
              {isMatch && !contestReg && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-accent text-tokyo-night px-2 py-1 rounded-full text-xs font-medium">
                  <Hand className="w-3 h-3" />
                  Vous y allez aussi !
                </div>
              )}

              <div className="flex gap-3 p-3">
                {/* Event Image */}
                {event.image_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate pr-24">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-2 text-white/60 text-xs mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(eventDate, "d MMM yyyy", { locale: fr })}
                    </span>
                  </div>
                  {event.city && (
                    <div className="flex items-center gap-2 text-white/40 text-xs mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{event.city}</span>
                    </div>
                  )}

                  {/* ===== CONTEST REGISTRATION BLOCK (PRIORITY) ===== */}
                  {contestReg && statusStyle && (
                    <div
                      className={cn(
                        "mt-3 pt-3 border-t",
                        statusStyle.borderColor
                      )}
                    >
                      {/* Header */}
                      <div
                        className={cn(
                          "text-xs font-bold mb-2 flex items-center gap-1 uppercase tracking-wider",
                          statusStyle.textColor
                        )}
                      >
                        <span>{statusStyle.icon}</span>
                        MA COMPÉTITION
                      </div>

                      {/* Status Badge */}
                      <div
                        className={cn(
                          "text-xs mb-2 px-2 py-1 rounded-full inline-block font-medium",
                          statusStyle.bgColor,
                          statusStyle.textColor
                        )}
                      >
                        {statusStyle.icon} {statusStyle.label}
                      </div>

                      {/* Cosplay Info (PRIORITY: contest cosplay, not general) */}
                      <div className="text-xs text-white/80 mb-1">
                        <span className="text-[hsl(var(--mp-saffron))] font-semibold">🎭 Cosplay:</span>{" "}
                        {contestReg?.character_name}
                        {contestReg?.universe && (
                          <span className="text-white/50"> ({contestReg?.universe})</span>
                        )}
                      </div>

                      {/* Format */}
                      {contestReg?.format && (
                        <div className="text-xs text-white/70 mb-1">
                          <span className="text-[hsl(var(--mp-saffron))] font-semibold">📋 Format:</span>{" "}
                          {contestReg?.format}
                        </div>
                      )}

                      {/* Group */}
                      {contestReg?.group_name && (
                        <div className="text-xs text-white/70 mb-1">
                          <span className="text-[hsl(var(--mp-saffron))] font-semibold">👥 Groupe:</span>{" "}
                          {contestReg?.group_name}
                        </div>
                      )}

                      {/* Passage Order */}
                      {contestReg?.passage_order && (
                        <div className="text-xs text-white/70 mb-1">
                          <span className="text-[hsl(var(--mp-saffron))] font-semibold">🎬 Passage:</span>{" "}
                          #{contestReg?.passage_order}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MemberAgendaTab;
