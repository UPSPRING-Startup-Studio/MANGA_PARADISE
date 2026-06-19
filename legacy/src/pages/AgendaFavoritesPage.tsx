import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, ArrowLeft, Calendar, PenLine } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import AgendaEventCard from "@/components/agenda/AgendaEventCard";
import EventProposalModal from "@/components/agenda/EventProposalModal";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBookmarkedEvents, useToggleBookmark } from "@/hooks/useEventBookmarks";

export default function AgendaFavoritesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: bookmarkedEvents = [], isLoading } = useUserBookmarkedEvents(user?.id);
  const toggleBookmark = useToggleBookmark();
  const [proposalOpen, setProposalOpen] = useState(false);

  const now = new Date();

  // Split upcoming / past
  const upcomingEvents = [...bookmarkedEvents]
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastEvents = [...bookmarkedEvents]
    .filter(e => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleToggleBookmark = (eventId: string) => {
    if (!user) return;
    toggleBookmark.mutate({ userId: user.id, eventId, isCurrentlyBookmarked: true });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#1A1A2E", overflowX: "hidden", minHeight: "100vh", background: "#F8F9FC" }}>
      <Navigation />

      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/agenda")}
          className="inline-flex items-center gap-2 mb-8 hover:text-[#C70039] transition-colors"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13, color: "#8E8EA0" }}
        >
          <ArrowLeft size={16} />
          Retour à l'agenda
        </button>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0"
              style={{ background: "rgba(199,0,57,0.06)" }}
            >
              <Bookmark size={24} color="#C70039" />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 28, color: "#1A1A2E" }}>
                Mes événements sauvegardés
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: 14, color: "#8E8EA0" }}>
                {isLoading
                  ? "Chargement…"
                  : `${bookmarkedEvents.length} événement${bookmarkedEvents.length !== 1 ? "s" : ""} en favoris`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setProposalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full transition-all duration-200 hover:bg-[#C70039] hover:text-white hover:border-[#C70039]"
            style={{ padding: "11px 22px", border: "2px solid #C70039", color: "#C70039", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, background: "transparent" }}
          >
            <PenLine size={15} />
            Proposer un événement
          </button>
        </div>

        {isLoading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-[20px] overflow-hidden animate-pulse" style={{ border: "1px solid #E8E8F0", background: "#fff" }}>
                <div className="bg-[#F0F4FA]" style={{ aspectRatio: "16/9" }} />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-[#F0F4FA] rounded w-1/3" />
                  <div className="h-4 bg-[#F0F4FA] rounded w-3/4" />
                  <div className="h-3 bg-[#F0F4FA] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : bookmarkedEvents.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="text-7xl mb-5">🔖</div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 22, color: "#1A1A2E" }}>
              Aucun événement sauvegardé
            </h3>
            <p
              className="mt-3 mb-7 max-w-sm mx-auto"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#4A4A6A", lineHeight: 1.65 }}
            >
              Utilise le bouton <strong style={{ color: "#C70039" }}>🔖</strong> sur les cards événements pour les retrouver ici, triés par date.
            </p>
            <button
              onClick={() => navigate("/agenda")}
              className="inline-flex items-center gap-2 rounded-full transition-all duration-200 hover:bg-[#C70039] hover:text-white hover:border-[#C70039]"
              style={{ padding: "13px 28px", border: "2px solid #C70039", color: "#C70039", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, background: "transparent" }}
            >
              <Calendar size={16} />
              Explorer l'agenda
            </button>
          </div>
        ) : (
          <>
            {/* Upcoming events */}
            {upcomingEvents.length > 0 && (
              <section className="mb-12">
                <h2
                  className="mb-5 flex items-center gap-2"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 21, color: "#1A1A2E" }}
                >
                  🗓 À venir
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14, color: "#8E8EA0" }}>
                    ({upcomingEvents.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcomingEvents.map(event => (
                    <AgendaEventCard
                      key={event.id}
                      event={event}
                      isBookmarked={true}
                      onToggleBookmark={handleToggleBookmark}
                      isLoggedIn={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past events */}
            {pastEvents.length > 0 && (
              <section>
                <h2
                  className="mb-5 flex items-center gap-2"
                  style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 21, color: "#8E8EA0" }}
                >
                  ⏰ Passés
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14, color: "#C0C0CC" }}>
                    ({pastEvents.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-55">
                  {pastEvents.map(event => (
                    <AgendaEventCard
                      key={event.id}
                      event={event}
                      isBookmarked={true}
                      onToggleBookmark={handleToggleBookmark}
                      isLoggedIn={true}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />

      <EventProposalModal open={proposalOpen} onClose={() => setProposalOpen(false)} />
    </div>
  );
}
