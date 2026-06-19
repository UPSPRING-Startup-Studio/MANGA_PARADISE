/**
 * EventsLoadMore — Load more button with remaining count
 */

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { EVENTS_PER_PAGE } from "./eventListHelpers";

interface EventsLoadMoreProps {
  visibleCount: number;
  totalCount: number;
  onLoadMore: () => void;
}

const EventsLoadMore = ({ visibleCount, totalCount, onLoadMore }: EventsLoadMoreProps) => {
  const remaining = totalCount - visibleCount;
  if (remaining <= 0) return null;

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <Button
        variant="outline"
        onClick={onLoadMore}
        className="gap-2 px-6 border-sakura/30 text-sakura hover:bg-sakura/10 hover:border-sakura/50"
      >
        <ChevronDown className="w-4 h-4" />
        Charger plus ({remaining} restant{remaining > 1 ? "s" : ""})
      </Button>
      <p className="text-xs text-muted-foreground">
        {visibleCount} sur {totalCount} événements affichés
      </p>
    </div>
  );
};

export default EventsLoadMore;
