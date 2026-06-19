import { ORGANIZER_MAP, type OrganizerKey } from "./constants";

interface OrganizerBadgeProps {
  type: OrganizerKey;
  name?: string;
  className?: string;
}

export default function OrganizerBadge({ type, name, className = "" }: OrganizerBadgeProps) {
  const config = ORGANIZER_MAP[type] || ORGANIZER_MAP.community;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full whitespace-nowrap ${className}`}
      style={{
        padding: "4px 10px 4px 7px",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: 11,
        background: `${config.color}E6`,
        color: "#FFFFFF",
        backdropFilter: "blur(4px)",
      }}>
      {config.icon && <span className="text-xs">{config.icon}</span>}
      {name || config.label}
    </span>
  );
}
