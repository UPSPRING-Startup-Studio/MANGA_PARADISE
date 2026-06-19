import { Archive, Camera, Users, Shirt } from "lucide-react";

interface PastEventBannerProps {
  hasPhotos: boolean;
  hasLineups: boolean;
  hasParticipants: boolean;
}

export default function PastEventBanner({
  hasPhotos,
  hasLineups,
  hasParticipants,
}: PastEventBannerProps) {
  const links: { label: string; hash: string; icon: React.ReactNode }[] = [];
  if (hasPhotos) links.push({ label: "la galerie photos", hash: "#photos", icon: <Camera size={14} /> });
  if (hasLineups) links.push({ label: "les cosplays", hash: "#lineup", icon: <Shirt size={14} /> });
  if (hasParticipants) links.push({ label: "les participants", hash: "#participants", icon: <Users size={14} /> });

  return (
    <div
      className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
      style={{
        background: "rgba(142,142,160,0.06)",
        border: "1px solid rgba(142,142,160,0.12)",
      }}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <Archive size={18} color="#8E8EA0" />
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            color: "#4A4A6A",
          }}
        >
          Cet événement est terminé.
        </span>
      </div>

      {links.length > 0 && (
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "#8E8EA0",
          }}
        >
          Retrouve{" "}
          {links.map((link, i) => (
            <span key={link.hash}>
              {i > 0 && (i === links.length - 1 ? " et " : ", ")}
              <a
                href={link.hash}
                className="inline-flex items-center gap-1 hover:underline"
                style={{ color: "#C70039", fontWeight: 500 }}
              >
                {link.icon}
                {link.label}
              </a>
            </span>
          ))}
          {" "}ci-dessous.
        </span>
      )}
    </div>
  );
}
