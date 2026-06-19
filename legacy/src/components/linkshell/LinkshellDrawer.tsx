import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChatRoom } from "@/hooks/useLinkshell";
import { RoomList } from "./RoomList";
import { ChatRoomView } from "./ChatRoomView";
import { MessageCircle } from "lucide-react";

interface LinkshellDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom: ChatRoom | null;
  onSelectRoom: (room: ChatRoom) => void;
  onBack: () => void;
}

export const LinkshellDrawer = ({
  isOpen,
  onClose,
  selectedRoom,
  onSelectRoom,
  onBack,
}: LinkshellDrawerProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[420px] p-0 bg-background/95 backdrop-blur-xl border-l border-border/50 flex flex-col"
      >
        {!selectedRoom ? (
          <>
            <SheetHeader className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
              <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                <MessageCircle className="h-5 w-5 text-primary" />
                Linkshell
              </SheetTitle>
            </SheetHeader>
            <RoomList onSelectRoom={onSelectRoom} />
          </>
        ) : (
          <ChatRoomView room={selectedRoom} onBack={onBack} />
        )}
      </SheetContent>
    </Sheet>
  );
};
