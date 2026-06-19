import { CalendarX, Clock, Archive, SearchX, RotateCcw } from "lucide-react";
import type { AgendaTab } from "@/hooks/useAgendaEvents";

interface AgendaEmptyStateProps {
  tab: AgendaTab;
  hasFilters: boolean;
  onReset: () => void;
}

const TAB_EMPTY: Record<
  AgendaTab,
  { icon: React.ReactNode; title: string; text: string }
> = {
  upcoming: {
    icon: <CalendarX size={40} color="#C70039" strokeWidth={1.5} />,
    title: "Aucun événement à venir",
    text: "Aucun rendez-vous n'est programmé pour le moment. Reviens bientôt pour découvrir les prochaines dates.",
  },
  ongoing: {
    icon: <Clock size={40} color="#C70039" strokeWidth={1.5} />,
    title: "Aucun événement en cours",
    text: "Il n'y a pas d'événement en cours actuellement. Explore les prochains rendez-vous ou les éditions passées.",
  },
  past: {
    icon: <Archive size={40} color="#8E8EA0" strokeWidth={1.5} />,
    title: "Aucun événement passé",
    text: "Les éditions précédentes apparaîtront ici pour garder une trace de la vie de la communauté.",
  },
  all: {
    icon: <CalendarX size={40} color="#C70039" strokeWidth={1.5} />,
    title: "Aucun événement trouvé",
    text: "Essaie d'élargir tes filtres ou de modifier ta recherche.",
  },
};

const FILTER_EMPTY = {
  icon: <SearchX size={40} color="#C70039" strokeWidth={1.5} />,
  title: "Aucun résultat",
  text: "Aucun événement ne correspond à tes critères actuels.",
};

export default function AgendaEmptyState({
  tab,
  hasFilters,
  onReset,
}: AgendaEmptyStateProps) {
  const content = hasFilters ? FILTER_EMPTY : TAB_EMPTY[tab];

  return (
    <div className="text-center py-16 px-4">
      <div className="flex justify-center mb-4">{content.icon}</div>
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: "#1A1A2E",
        }}
      >
        {content.title}
      </h3>
      <p
        className="mt-2 mb-6 max-w-sm mx-auto"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          fontSize: 15,
          color: "#4A4A6A",
          lineHeight: 1.6,
        }}
      >
        {content.text}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full transition-all duration-200 hover:bg-[#C70039] hover:text-white hover:border-[#C70039]"
          style={{
            padding: "12px 28px",
            border: "2px solid #C70039",
            color: "#C70039",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            background: "transparent",
          }}
        >
          <RotateCcw size={14} />
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
