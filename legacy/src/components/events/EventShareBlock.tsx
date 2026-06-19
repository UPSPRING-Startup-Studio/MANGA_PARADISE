import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { toast } from "sonner";

interface EventShareBlockProps {
  eventTitle: string;
  eventUrl: string;
}

export default function EventShareBlock({
  eventTitle,
  eventUrl,
}: EventShareBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  const shareText = encodeURIComponent(`Rejoins-moi à ${eventTitle} !`);
  const shareUrl = encodeURIComponent(eventUrl);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(199,0,57,0.03)",
        border: "1px solid rgba(199,0,57,0.08)",
      }}
    >
      <p
        className="mb-3"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          fontSize: 14,
          color: "#1A1A2E",
        }}
      >
        Partager cet événement
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 rounded-full transition-all duration-200 hover:border-[#C70039] hover:text-[#C70039]"
          style={{
            padding: "7px 14px",
            border: "1px solid #E8E8F0",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            color: copied ? "#27AE60" : "#4A4A6A",
            background: "#fff",
          }}
        >
          {copied ? <Check size={14} /> : <Link2 size={14} />}
          {copied ? "Copié" : "Copier le lien"}
        </button>

        {/* Twitter / X */}
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full transition-all duration-200 hover:border-[#1DA1F2] hover:text-[#1DA1F2]"
          style={{
            padding: "7px 14px",
            border: "1px solid #E8E8F0",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            color: "#4A4A6A",
            background: "#fff",
            textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X
        </a>

        {/* Facebook */}
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full transition-all duration-200 hover:border-[#1877F2] hover:text-[#1877F2]"
          style={{
            padding: "7px 14px",
            border: "1px solid #E8E8F0",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 13,
            color: "#4A4A6A",
            background: "#fff",
            textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </a>
      </div>
    </div>
  );
}
