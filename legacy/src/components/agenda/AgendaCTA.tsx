import { Bell, PenLine } from "lucide-react";
import KumoSeparator from "./KumoSeparator";

interface AgendaCTAProps {
  onProposeEvent?: () => void;
}

export default function AgendaCTA({ onProposeEvent }: AgendaCTAProps) {
  return (
    <section style={{ background: "#EBF1F8" }}>
      <KumoSeparator flip color="#EBF1F8" />

      <div className="max-w-xl mx-auto text-center px-4 py-12 sm:py-14">
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 26, color: "#1A1A2E" }}>
          Ne rate rien
        </h2>
        <p className="mt-2 mb-7" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, fontSize: 16, color: "#4A4A6A" }}>
          Active les alertes pour ta ville ou propose un événement manquant à la communauté.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            className="inline-flex items-center gap-2 rounded-full text-white transition-all duration-200 hover:scale-[1.03]"
            style={{ padding: "13px 26px", background: "linear-gradient(135deg, #C70039, #E46155, #EC8A5E)", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 14px rgba(199,0,57,0.3)" }}
          >
            <Bell size={16} />
            Activer les alertes
          </button>
          <button
            onClick={onProposeEvent}
            className="inline-flex items-center gap-2 rounded-full transition-all duration-200 hover:bg-[#C70039] hover:text-white hover:border-[#C70039]"
            style={{ padding: "13px 26px", border: "2px solid #C70039", color: "#C70039", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, background: "transparent" }}
          >
            <PenLine size={16} />
            Proposer un événement
          </button>
        </div>
      </div>
    </section>
  );
}
