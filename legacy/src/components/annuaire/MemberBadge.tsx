import { cn } from "@/lib/utils";

interface MemberBadgeProps {
  type: "role" | "class" | "status" | "activity";
  children: React.ReactNode;
  className?: string;
}

const badgeStyles = {
  role: "bg-sakura/20 text-sakura border-sakura/30",
  class: "bg-accent/20 text-accent border-accent/30",
  status: "bg-turquoise/20 text-turquoise border-turquoise/30",
  activity: "bg-white/10 text-white/80 border-white/20",
};

const MemberBadge = ({ type, children, className }: MemberBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        badgeStyles[type],
        className
      )}
    >
      {children}
    </span>
  );
};

export default MemberBadge;
