/**
 * EventsMonthSection — Month group with sticky label, count, and view-aware layout
 */

import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import type { ViewMode } from "./eventListHelpers";

interface EventsMonthSectionProps {
  label: string;
  count: number;
  viewMode?: ViewMode;
  children: React.ReactNode;
}

const EventsMonthSection = ({
  label,
  count,
  viewMode = "grid",
  children,
}: EventsMonthSectionProps) => {
  return (
    <div className="space-y-2.5">
      {/* Month header — sticky */}
      <div className="sticky top-0 z-10 flex items-center gap-3 py-2 px-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-sakura" />
          <h3 className="font-display text-base capitalize tracking-wide text-foreground">
            {label}
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      {/* Content — grid or list */}
      <div
        className={cn(
          viewMode === "grid"
            ? "grid md:grid-cols-2 lg:grid-cols-3 gap-3"
            : "flex flex-col gap-1"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default EventsMonthSection;
