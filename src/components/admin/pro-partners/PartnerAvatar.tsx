import { useState } from "react";

const CATEGORY_BG: Record<string, string> = {
  acteurs_publics: "bg-blue-500",
  boutiques_librairies: "bg-amber-500",
  cinemas: "bg-violet-500",
  restauration: "bg-red-500",
  evenements_lieux_culturels: "bg-emerald-500",
  partenaires_associatifs: "bg-pink-500",
  artistes_createurs: "bg-cyan-500",
  entreprises_marques: "bg-gray-500",
};

function getInitials(name: string): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface PartnerAvatarProps {
  logoUrl?: string | null;
  name: string;
  category?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-16 h-16 text-lg",
};

export default function PartnerAvatar({ logoUrl, name, category, size = "md" }: PartnerAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = SIZES[size];
  const bg = CATEGORY_BG[category || ""] || "bg-slate-500";

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        loading="lazy"
        className={`${sizeClass} rounded-full object-cover border border-slate-700 bg-white/5 shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full ${bg} flex items-center justify-center text-white font-bold shrink-0`}>
      {getInitials(name)}
    </div>
  );
}
