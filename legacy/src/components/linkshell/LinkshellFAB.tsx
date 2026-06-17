import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useChatRooms } from "@/hooks/useLinkshell";
import { cn } from "@/lib/utils";

interface LinkshellFABProps {
  onClick: () => void;
  isOpen: boolean;
}

export const LinkshellFAB = ({ onClick, isOpen }: LinkshellFABProps) => {
  const { data: rooms } = useChatRooms();
  
  const totalUnread = rooms?.reduce((acc, room) => acc + (room.unread_count || 0), 0) || 0;

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={onClick}
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-2xl",
              "bg-gradient-to-br from-primary via-primary/90 to-accent",
              "hover:from-primary/90 hover:to-accent/90",
              "border border-primary/30",
              "transition-all duration-300 hover:scale-110",
              "relative overflow-visible"
            )}
          >
            <MessageCircle className="h-6 w-6 text-primary-foreground" />
            
            {/* Notification badge */}
            {totalUnread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "absolute -top-1 -right-1",
                  "min-w-[22px] h-[22px] px-1.5",
                  "bg-destructive text-destructive-foreground",
                  "rounded-full text-xs font-bold",
                  "flex items-center justify-center",
                  "border-2 border-background",
                  "shadow-lg"
                )}
              >
                {totalUnread > 99 ? "99+" : totalUnread}
              </motion.span>
            )}
            
            {/* Glow effect */}
            <span className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
