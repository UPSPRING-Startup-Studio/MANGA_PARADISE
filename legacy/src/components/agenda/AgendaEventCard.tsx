import { useNavigate } from "react-router-dom";
import { MapPin, Bookmark, BookmarkCheck, Clock, CalendarCheck, Archive, Camera, Users, Shirt } from "lucide-react";
import type { Event } from "@/hooks/useEvents";
import type { TemporalStatus } from "@/hooks/useAgendaEvents";
import type { EventContentCounts } from "@/hooks/useEventContentCounts";
import { formatDateRange, getOrganizerLabel, EVENT_TYPE_OPTIONS } from "./constants";

interface AgendaEventCardProps {
  event: Event;
  variant?: "standard" | "xl";
  temporalStatus?: TemporalStatus;
  contentCounts?: EventContentCounts;
  isBookmarked?: boolean;
  onToggleBookmark?: (eventId: string) => void;
  isLoggedIn?: boolean;
}

const PLACEHOLDER =
  "https://res.cloudinary.com/dkw8snibz/image/upload/v1753258639/Cosplay-Garden-WEB-3_iuzymn.jpg";

const TEMPORAL_BADGES: Record<
  TemporalStatus,
  { label: string; bg: string; color: string; border: string; icon: React.ReactNode }
> = {
  upcoming: {
    label: "À venir",
    bg: "rgba(39,174,96,0.08)",
    color: "#27AE60",
    border: "rgba(39,174,96,0.2)",
    icon: <CalendarCheck size={12} />,
  },
  ongoing: {
    label: "En cours",
    bg: "rgba(199,0,57,0.1)",
    color: "#C70039",
    border: "rgba(199,0,57,0.3)",
    icon: <Clock size={12} />,
  },
  past: {
    label: "Terminé",
    bg: "rgba(142,142,160,0.08)",
    color: "#8E8EA0",
    border: "rgba(142,142,160,0.2)",
    icon: <Archive size={12} />,
  },
};

export default function AgendaEventCard({
  event,
  variant = "standard",
  temporalStatus,
  contentCounts,
  isBookmarked = false,
  onToggleBookmark,
  isLoggedIn = false,
}: AgendaEventCardProps) {
  const navigate = useNavigate();
  const organizer = getOrganizerLabel(event);
  const typeLabel =
    EVENT_TYPE_OPTIONS.find(
      (t) => t.key === (event.type_evenement || event.category)
    )?.label ||
    event.category ||
    "Événement";
  const coverImg = event.cover_image || event.image_url || PLACEHOLDER;
  const dateStr = formatDateRange(event.date, event.end_date);
  const isPast = temporalStatus === "past";
  const isOngoing = temporalStatus === "ongoing";
  const badge = temporalStatus ? TEMPORAL_BADGES[temporalStatus] : null;

  const handleClick = () => navigate(`/agenda/${event.id}`);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    onToggleBookmark?.(event.id);
  };

  const bookmarkTitle = !isLoggedIn
    ? "Connecte-toi pour sauvegarder"
    : isBookmarked
    ? "Retirer des favoris"
    : "Sauvegarder l'événement";

  const ctaLabel = isPast ? "Voir l'événement" : "Voir les détails";

  // CTA contextuels pour les cartes passées
  const pastCTAs: { label: string; hash: string; icon: React.ReactNode }[] = [];
  if (isPast && contentCounts) {
    if (contentCounts.photos > 0) {
      pastCTAs.push({ label: "Galerie", hash: "#photos", icon: <Camera size={11} /> });
    }
    if (contentCounts.lineups > 0) {
      pastCTAs.push({ label: "Cosplays", hash: "#lineup", icon: <Shirt size={11} /> });
    }
    if (contentCounts.participants > 0 && pastCTAs.length < 2) {
      pastCTAs.push({ label: `${contentCounts.participants} participants`, hash: "#participants", icon: <Users size={11} /> });
    }
  }

  // ── Variant XL ──────────────────────────────────────────────
  if (variant === "xl") {
    return (
      <div
        onClick={handleClick}
        className="relative rounded-[20px] overflow-hidden cursor-pointer group h-full"
        style={{
          boxShadow:
            "0 12px 32px rgba(26,26,46,0.08), 0 4px 8px rgba(199,0,57,0.06)",
          opacity: isPast ? 0.92 : 1,
        }}
      >
        <img
          src={coverImg}
          alt={event.title}
          className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105"
          style={isPast ? { filter: "saturate(0.85)" } : undefined}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
          }}
        />

        {/* Badges top */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full whitespace-nowrap"
            style={{
              padding: "4px 10px 4px 7px",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              background: `${organizer.color}E6`,
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
          >
            {organizer.icon && (
              <span className="text-xs">{organizer.icon}</span>
            )}
            {organizer.label}
          </span>
          {badge && (
            <span
              className="inline-flex items-center gap-1 rounded-full"
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                background: isOngoing ? "rgba(199,0,57,0.9)" : badge.bg,
                color: isOngoing ? "#fff" : badge.color,
                border: `1px solid ${badge.border}`,
                backdropFilter: "blur(4px)",
                boxShadow: isOngoing
                  ? "0 0 12px rgba(199,0,57,0.4)"
                  : "none",
              }}
            >
              {badge.icon}
              {badge.label}
            </span>
          )}
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          title={bookmarkTitle}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-[10px] flex items-center justify-center transition-all duration-200 hover:shadow-md"
          style={{
            background: isBookmarked
              ? "rgba(199,0,57,0.15)"
              : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          {isBookmarked ? (
            <BookmarkCheck size={18} color="#C70039" />
          ) : (
            <Bookmark size={18} color="#4A4A6A" />
          )}
        </button>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10">
          <span
            className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide mb-2"
            style={{
              background: "rgba(199,0,57,0.9)",
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {typeLabel}
          </span>
          <h3
            className="text-white mb-1.5"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 24,
              lineHeight: 1.2,
            }}
          >
            {event.title}
          </h3>
          <div
            className="flex items-center gap-4 text-white/80 flex-wrap"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            <span>{dateStr}</span>
            {event.city && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {event.city}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Variant standard ────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      className="rounded-[20px] overflow-hidden cursor-pointer group transition-all duration-400 hover:-translate-y-1"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E8F0",
        boxShadow: isPast
          ? "0 2px 8px rgba(26,26,46,0.04)"
          : "0 4px 12px rgba(26,26,46,0.06), 0 2px 4px rgba(199,0,57,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 12px 32px rgba(26,26,46,0.08), 0 4px 8px rgba(199,0,57,0.06)";
        e.currentTarget.style.borderColor = isPast
          ? "rgba(142,142,160,0.2)"
          : "rgba(199,0,57,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isPast
          ? "0 2px 8px rgba(26,26,46,0.04)"
          : "0 4px 12px rgba(26,26,46,0.06), 0 2px 4px rgba(199,0,57,0.04)";
        e.currentTarget.style.borderColor = "#E8E8F0";
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <img
          src={coverImg}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={isPast ? { filter: "saturate(0.85)" } : undefined}
        />

        {/* Badge organisateur */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full whitespace-nowrap"
            style={{
              padding: "4px 10px 4px 7px",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              background: `${organizer.color}E6`,
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
          >
            {organizer.icon && (
              <span className="text-xs">{organizer.icon}</span>
            )}
            {organizer.label}
          </span>
        </div>

        {/* Badge temporel */}
        {badge && (
          <div className="absolute top-3 right-12">
            <span
              className="inline-flex items-center gap-1 rounded-full"
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                background: isOngoing ? "rgba(199,0,57,0.9)" : badge.bg,
                color: isOngoing ? "#fff" : badge.color,
                border: `1px solid ${badge.border}`,
                backdropFilter: "blur(4px)",
                boxShadow: isOngoing
                  ? "0 0 12px rgba(199,0,57,0.4)"
                  : "none",
              }}
            >
              {badge.icon}
              {badge.label}
            </span>
          </div>
        )}

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          title={bookmarkTitle}
          className="absolute top-3 right-3 w-9 h-9 rounded-[10px] flex items-center justify-center transition-all duration-200 hover:shadow-md"
          style={{
            background: isBookmarked
              ? "rgba(199,0,57,0.12)"
              : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          {isBookmarked ? (
            <BookmarkCheck size={18} color="#C70039" />
          ) : (
            <Bookmark size={18} color="#4A4A6A" />
          )}
        </button>

        {/* Badge concours */}
        {event.has_contest && (
          <span
            className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: "rgba(255,215,0,0.9)",
              color: "#1A1A2E",
            }}
          >
            Concours
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
            style={{
              background: isPast
                ? "rgba(142,142,160,0.06)"
                : "rgba(199,0,57,0.06)",
              color: isPast ? "#8E8EA0" : "#C70039",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {typeLabel}
          </span>
          <span className="text-[#E8E8F0]">&middot;</span>
          <span
            className="text-[12px]"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              color: isPast ? "#B0B0C0" : "#8E8EA0",
            }}
          >
            {dateStr}
          </span>
        </div>

        <h3
          className="line-clamp-2 mb-1.5"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 17,
            color: isPast ? "#4A4A6A" : "#1A1A2E",
            lineHeight: 1.3,
          }}
        >
          {event.title}
        </h3>

        {(event.city || event.venue_name || event.location) && (
          <div
            className="flex items-center gap-1.5 mb-3"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 13,
              color: isPast ? "#B0B0C0" : "#4A4A6A",
            }}
          >
            <MapPin size={14} color={isPast ? "#B0B0C0" : "#8E8EA0"} />
            {event.city}
            {event.venue_name
              ? ` — ${event.venue_name}`
              : event.location
              ? ` — ${event.location}`
              : ""}
          </div>
        )}

        {event.description && (
          <p
            className="line-clamp-2 mb-3"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: isPast ? "#B0B0C0" : "#8E8EA0",
              lineHeight: 1.5,
            }}
          >
            {event.description}
          </p>
        )}

        {/* CTA contextuels pour événements passés */}
        {pastCTAs.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {pastCTAs.map((cta) => (
              <span
                key={cta.hash}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/agenda/${event.id}${cta.hash}`);
                }}
                className="inline-flex items-center gap-1 rounded-full text-[11px] font-medium hover:bg-[rgba(142,142,160,0.12)] transition-colors cursor-pointer"
                style={{
                  padding: "4px 10px",
                  background: "rgba(142,142,160,0.06)",
                  color: "#6B6B80",
                  fontFamily: "'DM Sans', sans-serif",
                  border: "1px solid rgba(142,142,160,0.12)",
                }}
              >
                {cta.icon}
                {cta.label}
              </span>
            ))}
          </div>
        )}

        {/* Preuve sociale pour passés (quand pas de CTA contextuels) */}
        {isPast && contentCounts && pastCTAs.length === 0 && contentCounts.participants > 0 && (
          <div
            className="flex items-center gap-1.5 mb-3"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "#B0B0C0",
            }}
          >
            <Users size={12} />
            {contentCounts.participants} participant{contentCounts.participants > 1 ? "s" : ""}
          </div>
        )}

        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid #F0F0F5" }}
        >
          <div
            className="flex items-center gap-1.5"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 12,
              color: "#8E8EA0",
            }}
          >
            {event.price &&
            event.price !== "0" &&
            event.price !== "Gratuit" ? (
              <span style={{ color: isPast ? "#B0B0C0" : "#F39C12" }}>
                {event.price}
              </span>
            ) : (
              <span style={{ color: isPast ? "#B0B0C0" : "#27AE60" }}>
                Gratuit
              </span>
            )}
          </div>
          <span
            className="text-[13px] hover:underline"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              color: isPast ? "#8E8EA0" : "#C70039",
            }}
          >
            {ctaLabel} &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
